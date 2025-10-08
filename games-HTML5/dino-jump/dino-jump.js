class DinoJumpGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'ready'; // ready, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
        this.gameSpeed = 6;
        this.speedMultiplier = 1;
        
        // Game objects
        this.dino = {
            x: 50,
            y: 150,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            isDucking: false
        };
        
        this.obstacles = [];
        this.clouds = [];
        this.ground = {
            x: 0,
            y: 180,
            width: this.canvas.width,
            height: 20
        };
        
        // Game physics
        this.gravity = 0.6;
        this.jumpPower = -12;
        this.groundY = 150; // Dino's ground position
        
        // Obstacle spawning
        this.obstacleTimer = 0;
        this.obstacleInterval = 120; // frames
        this.minObstacleInterval = 60;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.speedElement = document.getElementById('speed');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    this.jump();
                } else if (e.code === 'ArrowDown') {
                    e.preventDefault();
                    this.duck();
                }
            } else if (this.gameState === 'ready' && (e.code === 'Space' || e.code === 'ArrowUp')) {
                e.preventDefault();
                this.startGame();
            } else if (this.gameState === 'gameOver' && (e.code === 'Space' || e.code === 'ArrowUp')) {
                e.preventDefault();
                this.restartGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.dino.isDucking = false;
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.jump();
            } else if (this.gameState === 'ready') {
                this.startGame();
            } else if (this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.jump();
            } else if (this.gameState === 'ready') {
                this.startGame();
            } else if (this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.resetGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseBtn.textContent = 'Resume';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseBtn.textContent = 'Pause';
        }
    }
    
    restartGame() {
        this.gameOverScreen.style.display = 'none';
        this.gameState = 'playing';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.pauseBtn.textContent = 'Pause';
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.gameSpeed = 6;
        this.speedMultiplier = 1;
        this.obstacleTimer = 0;
        this.obstacles = [];
        
        // Reset dino
        this.dino.y = this.groundY;
        this.dino.velocityY = 0;
        this.dino.isJumping = false;
        this.dino.isDucking = false;
        
        this.updateUI();
    }
    
    jump() {
        if (!this.dino.isJumping) {
            this.dino.velocityY = this.jumpPower;
            this.dino.isJumping = true;
        }
    }
    
    duck() {
        if (!this.dino.isJumping) {
            this.dino.isDucking = true;
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updateDino();
        this.updateObstacles();
        this.updateScore();
        this.updateGameSpeed();
        this.spawnObstacles();
        this.checkCollisions();
    }
    
    updateDino() {
        // Apply gravity
        this.dino.velocityY += this.gravity;
        this.dino.y += this.dino.velocityY;
        
        // Ground collision
        if (this.dino.y >= this.groundY) {
            this.dino.y = this.groundY;
            this.dino.velocityY = 0;
            this.dino.isJumping = false;
        }
        
        // Adjust height when ducking
        if (this.dino.isDucking && !this.dino.isJumping) {
            this.dino.height = 20;
            this.dino.y = this.groundY + 20;
        } else {
            this.dino.height = 40;
            if (!this.dino.isJumping) {
                this.dino.y = this.groundY;
            }
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed * this.speedMultiplier;
            
            // Remove obstacles that are off-screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    updateScore() {
        this.score += 1;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dinoHighScore', this.highScore.toString());
        }
    }
    
    updateGameSpeed() {
        // Increase speed every 500 points
        const newSpeedMultiplier = 1 + Math.floor(this.score / 500) * 0.2;
        this.speedMultiplier = Math.min(newSpeedMultiplier, 3); // Cap at 3x speed
        
        // Decrease obstacle interval as speed increases
        this.obstacleInterval = Math.max(
            this.minObstacleInterval,
            120 - Math.floor(this.score / 200) * 10
        );
    }
    
    spawnObstacles() {
        this.obstacleTimer++;
        
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.obstacleTimer = 0;
            
            // Make birds much rarer (20% chance) and cacti more common (80% chance)
            const obstacleTypes = ['cactus', 'cactus', 'cactus', 'cactus', 'bird'];
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            let obstacle = {
                x: this.canvas.width,
                type: type
            };
            
            if (type === 'cactus') {
                obstacle.y = this.groundY + 20;
                obstacle.width = 20;
                obstacle.height = 40;
            } else if (type === 'bird') {
                obstacle.y = this.groundY - Math.random() * 40 - 30; // Higher flying birds
                obstacle.width = 30;
                obstacle.height = 20;
            }
            
            this.obstacles.push(obstacle);
        }
    }
    
    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.dino, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.startBtn.textContent = 'Start Game';
        
        // Show game over screen
        this.finalScoreElement.textContent = Math.floor(this.score / 10);
        this.gameOverScreen.style.display = 'flex';
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw simple white background (Chrome dino style)
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.drawGround();
        
        // Draw dino
        this.drawDino();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw UI on canvas
        this.drawCanvasUI();
    }
    
    drawDino() {
        this.ctx.fillStyle = '#535353';
        
        if (this.dino.isDucking) {
            // Draw ducking dino (more rectangular, Chrome-style)
            this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
            
            // Draw eye
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(this.dino.x + 8, this.dino.y + 5, 4, 4);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.dino.x + 10, this.dino.y + 6, 2, 2);
        } else {
            // Draw standing dino (Chrome-style pixelated look)
            // Main body
            this.ctx.fillRect(this.dino.x + 10, this.dino.y, 20, 30);
            // Head
            this.ctx.fillRect(this.dino.x, this.dino.y + 5, 15, 20);
            // Tail
            this.ctx.fillRect(this.dino.x + 30, this.dino.y + 10, 8, 15);
            // Legs
            this.ctx.fillRect(this.dino.x + 12, this.dino.y + 30, 6, 10);
            this.ctx.fillRect(this.dino.x + 22, this.dino.y + 30, 6, 10);
            
            // Draw eye
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(this.dino.x + 3, this.dino.y + 8, 4, 4);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.dino.x + 5, this.dino.y + 9, 2, 2);
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = '#535353';
            
            if (obstacle.type === 'cactus') {
                // Draw simple pixelated cactus (Chrome style)
                this.ctx.fillRect(obstacle.x + 6, obstacle.y, 8, obstacle.height);
                // Left arm
                this.ctx.fillRect(obstacle.x, obstacle.y + 10, 10, 6);
                // Right arm  
                this.ctx.fillRect(obstacle.x + 10, obstacle.y + 15, 10, 6);
            } else if (obstacle.type === 'bird') {
                // Draw simple pixelated bird (Chrome style)
                // Body
                this.ctx.fillRect(obstacle.x + 8, obstacle.y + 6, 14, 8);
                // Wings (animated based on game time for flapping effect)
                const flapOffset = Math.floor(Date.now() / 200) % 2 === 0 ? 0 : 2;
                this.ctx.fillRect(obstacle.x + 4, obstacle.y + 4 + flapOffset, 8, 4);
                this.ctx.fillRect(obstacle.x + 18, obstacle.y + 4 + flapOffset, 8, 4);
                // Beak
                this.ctx.fillRect(obstacle.x + 22, obstacle.y + 8, 4, 2);
            }
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const cloud of this.clouds) {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 4, 0, 2 * Math.PI);
            this.ctx.arc(cloud.x + cloud.width / 3, cloud.y, cloud.width / 3, 0, 2 * Math.PI);
            this.ctx.arc(cloud.x + cloud.width * 2/3, cloud.y, cloud.width / 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    drawGround() {
        // Draw simple ground line (Chrome dino style)
        this.ctx.strokeStyle = '#535353';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ground.y);
        this.ctx.lineTo(this.canvas.width, this.ground.y);
        this.ctx.stroke();
        
        // Add simple dotted pattern for ground texture
        this.ctx.fillStyle = '#535353';
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.fillRect(i, this.ground.y + 5, 2, 2);
            this.ctx.fillRect(i + 20, this.ground.y + 8, 2, 2);
        }
    }
    
    drawCanvasUI() {
        if (this.gameState === 'ready') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#535353';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE or TAP to start!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Use SPACE/UP to jump, DOWN to duck', this.canvas.width / 2, this.canvas.height / 2 + 30);
        } else if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#535353';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = Math.floor(this.score / 10);
        this.highScoreElement.textContent = Math.floor(this.highScore / 10);
        this.speedElement.textContent = this.speedMultiplier.toFixed(1) + 'x';
    }
    
    gameLoop() {
        this.update();
        this.draw();
        this.updateUI();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DinoJumpGame();
});