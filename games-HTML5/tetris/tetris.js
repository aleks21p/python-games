// Tetris Game - Complete implementation with increasing difficulty and restart
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game constants
    this.BOARD_WIDTH = 10;
    this.BOARD_HEIGHT = 20;
    // Reduced block size so the board fits comfortably on most screens
    this.BLOCK_SIZE = 33.6;
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropTimer = 0;
        this.dropInterval = 1000; // milliseconds
        this.baseDropInterval = 1000; // starting speed
        this.lastTime = 0;
        this.gameTime = 0; // total time played in milliseconds
        this.speedIncreaseTimer = 0; // timer for 10-second speed increases
        
        // Cheat code tracking
        this.cheatKeyPressed = false;
        this.cheatStartTime = 0;
        this.cheatActive = false;
        
        // Piece definitions (Tetrominos)
        this.pieces = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1,1],
                    [1,1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0,1,0],
                    [1,1,1]
                ],
                color: '#a000f0'
            },
            S: {
                shape: [
                    [0,1,1],
                    [1,1,0]
                ],
                color: '#00f000'
            },
            Z: {
                shape: [
                    [1,1,0],
                    [0,1,1]
                ],
                color: '#f00000'
            },
            J: {
                shape: [
                    [1,0,0],
                    [1,1,1]
                ],
                color: '#0000f0'
            },
            L: {
                shape: [
                    [0,0,1],
                    [1,1,1]
                ],
                color: '#f0a000'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        // Initialize leaderboard from localStorage
        this.loadLeaderboard();
        
        this.init();
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('tetrisLeaderboard');
        this.leaderboard = saved ? JSON.parse(saved) : [];
    }
    
    saveScore(playerName = 'Anonymous') {
        // Sanitize and limit name to 10 characters
        playerName = playerName.trim() || 'Anonymous';
        playerName = playerName.substring(0, 10);
        
        const entry = {
            name: playerName,
            score: this.score,
            lines: this.lines,
            level: this.level,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.leaderboard.push(entry);
        
        // Sort by score (descending) and keep top 50
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 50);
        
        // Save to localStorage
        localStorage.setItem('tetrisLeaderboard', JSON.stringify(this.leaderboard));
    }
    
    init() {
        // Initialize empty board
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        
        // Create first pieces
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        // Set up input handlers
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
    }
    
    createPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        const pieceData = this.pieces[type];
        
        return {
            type: type,
            shape: pieceData.shape,
            color: pieceData.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
            y: 0
        };
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            // Cheat code: T key pressed
            if (e.key === 't' || e.key === 'T') {
                this.cheatKeyPressed = true;
            }
            
            // Cheat code: T+1 to clear leaderboard (hold for 3 seconds)
            if ((e.key === '1' || e.key === '!') && this.cheatKeyPressed) {
                if (!this.cheatActive) {
                    this.cheatStartTime = Date.now();
                    this.cheatActive = true;
                }
            }
            
            if (this.gameOver || this.paused) {
                if (e.code === 'KeyP') {
                    this.togglePause();
                }
                return;
            }
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    e.preventDefault();
                    break;
                case 'Space':
                    this.hardDrop();
                    e.preventDefault();
                    break;
                case 'KeyP':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Reset cheat code tracking
            if (e.key === 't' || e.key === 'T') {
                this.cheatKeyPressed = false;
                this.cheatActive = false;
            }
            if (e.key === '1' || e.key === '!') {
                this.cheatActive = false;
            }
        });
    }
    
    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    isValidPosition(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2; // Bonus points for hard drop
        }
        this.placePiece();
    }
    
    placePiece() {
        // Place current piece on board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Get next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        // Check game over
        if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Line is complete
                this.board.splice(row, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++; // Check same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Scoring system
            const baseScore = [0, 40, 100, 300, 1200][linesCleared];
            this.score += baseScore * (this.level + 1);
            
            // Level progression - every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                // Increase difficulty - faster drop speed
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            }
            
            this.updateUI();
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameOver) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
        
        if (this.paused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Track total game time and speed increases
        this.gameTime += deltaTime;
        this.speedIncreaseTimer += deltaTime;
        
        // Increase speed by 20% every 10 seconds (10000 milliseconds)
        if (this.speedIncreaseTimer >= 10000) {
            this.baseDropInterval *= 0.8; // 20% faster (multiply by 0.8)
            this.dropInterval = Math.max(50, this.baseDropInterval); // minimum 50ms
            this.speedIncreaseTimer = 0;
        }
        
        // Process cheat code (T+1 held for 3 seconds clears leaderboard)
        if (this.cheatActive && this.cheatKeyPressed) {
            const cheatHoldTime = currentTime - this.cheatStartTime;
            if (cheatHoldTime >= 3000) {
                // Clear leaderboard silently
                this.leaderboard = [];
                localStorage.removeItem('tetrisLeaderboard');
                this.cheatActive = false;
            }
        }
        
        // Handle piece dropping
        this.dropTimer += deltaTime;
        if (this.dropTimer >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
            }
            this.dropTimer = 0;
        }
        
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.drawBoard();
        
        // Draw current piece
        this.drawPiece(this.currentPiece, this.ctx);
        
        // Draw ghost piece (preview where piece will land)
        this.drawGhostPiece();
        
        // Draw grid
        this.drawGrid();
        
        // Draw next piece
        this.drawNextPiece();
        
        // Draw pause overlay
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    drawBoard() {
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(
                        col * this.BLOCK_SIZE,
                        row * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                    
                    // Add border
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(
                        col * this.BLOCK_SIZE,
                        row * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawPiece(piece, context) {
        if (!piece) return;
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const x = (piece.x + col) * this.BLOCK_SIZE;
                    const y = (piece.y + row) * this.BLOCK_SIZE;
                    
                    context.fillStyle = piece.color;
                    context.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    
                    context.strokeStyle = '#fff';
                    context.lineWidth = 2;
                    context.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
    }
    
    drawGhostPiece() {
        const ghost = {...this.currentPiece};
        
        // Move ghost piece down until it would collide
        while (this.isValidPosition(ghost.shape, ghost.x, ghost.y + 1)) {
            ghost.y++;
        }
        
        // Draw ghost piece with transparency
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        for (let row = 0; row < ghost.shape.length; row++) {
            for (let col = 0; col < ghost.shape[row].length; col++) {
                if (ghost.shape[row][col]) {
                    const x = (ghost.x + col) * this.BLOCK_SIZE;
                    const y = (ghost.y + row) * this.BLOCK_SIZE;
                    
                    this.ctx.fillStyle = ghost.color;
                    this.ctx.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let col = 0; col <= this.BOARD_WIDTH; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= this.BOARD_HEIGHT; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        // Clear next canvas
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
    const blockSize = 12;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(x, y, blockSize, blockSize);
                    
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        
        // Clear and focus name input
        const nameInput = document.getElementById('playerName');
        nameInput.value = '';
        
        document.getElementById('gameOver').style.display = 'block';
        
        // Focus on name input after a brief delay
        setTimeout(() => nameInput.focus(), 100);
    }
    
    restart() {
        // Reset all game state
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.baseDropInterval = 1000;
        this.gameTime = 0;
        this.speedIncreaseTimer = 0;
        
        // Create new pieces
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        // Hide game over screen
        document.getElementById('gameOver').style.display = 'none';
        
        // Update UI
        this.updateUI();
        
        // Restart game loop
        this.gameLoop();
    }
    
    saveScoreAndRestart() {
        // Get player name from input
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim() || 'Anonymous';
        
        // Save score with name if score > 0
        if (this.score > 0) {
            this.saveScore(playerName);
        }
        
        // Restart the game
        this.restart();
    }
    
    showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        const list = document.getElementById('leaderboardList');
        
        // Clear existing entries
        list.innerHTML = '';
        
        if (this.leaderboard.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: #aaa; padding: 2rem;">No scores yet. Play a game to set a record!</li>';
        } else {
            this.leaderboard.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'leaderboard-item' + (index < 3 ? ' top-3' : '');
                
                const date = new Date(entry.date);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                let medal = '';
                if (index === 0) medal = '🥇';
                else if (index === 1) medal = '🥈';
                else if (index === 2) medal = '🥉';
                
                const playerName = entry.name || 'Anonymous';
                
                li.innerHTML = `
                    <span class="leaderboard-rank">${medal || (index + 1) + '.'}</span>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${playerName}</div>
                        <div class="leaderboard-score">${entry.score.toLocaleString()} pts</div>
                        <div class="leaderboard-details">Lines: ${entry.lines} | Level: ${entry.level} | ${dateStr}</div>
                    </div>
                `;
                list.appendChild(li);
            });
        }
        
        modal.style.display = 'block';
    }
    
    closeLeaderboard() {
        document.getElementById('leaderboardModal').style.display = 'none';
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new TetrisGame();
});

// Handle visibility change to pause game when tab is not active
document.addEventListener('visibilitychange', () => {
    if (game && !game.gameOver) {
        if (document.hidden) {
            game.paused = true;
        }
    }
});

// Close leaderboard modal when clicking outside of it
window.addEventListener('click', (event) => {
    const modal = document.getElementById('leaderboardModal');
    if (event.target === modal) {
        game.closeLeaderboard();
    }
});