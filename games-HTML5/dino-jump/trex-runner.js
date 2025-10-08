class TRexRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants
        this.CANVAS_WIDTH = 800;
        this.CANVAS_HEIGHT = 150;
        this.GROUND_HEIGHT = 12;
        this.RUNNER_WIDTH = 44;
        this.RUNNER_HEIGHT = 47;
        this.RUNNER_MAX_JUMP_HEIGHT = 30;
        
        // Game state
        this.gameState = 'WAITING'; // WAITING, RUNNING, CRASHED
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('trex-highscore')) || 0;
        this.currentSpeed = 6;
        this.speedIncrement = 0.001;
        this.gameStartTime = 0;
        
        // Dino/T-Rex properties
        this.tRex = {
            x: 25,
            y: 0,
            xPos: 0,
            yPos: 0,
            groundYPos: 0,
            speedDrop: 0,
            jumpVelocity: 0,
            jumping: false,
            ducking: false,
            status: 'RUNNING' // RUNNING, JUMPING, DUCKING, CRASHED
        };
        
        // Ground properties
        this.ground = {
            x: 0,
            y: this.CANVAS_HEIGHT - this.GROUND_HEIGHT,
            sourceWidth: 1200,
            sourceHeight: 12,
            width: 1200,
            height: 12
        };
        
        // Clouds
        this.clouds = [];
        this.cloudImgPos = { x: 86, y: 2 };
        this.cloudFreq = 0.5;
        this.numClouds = 0;
        
        // Obstacles
        this.obstacles = [];
        this.obstacleHistory = [];
        
        // Night mode
        this.invertTimer = 0;
        this.isNightMode = false;
        
        // Initialize positions
        this.tRex.groundYPos = this.CANVAS_HEIGHT - this.GROUND_HEIGHT - this.RUNNER_HEIGHT;
        this.tRex.yPos = this.tRex.groundYPos;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.speedElement = document.getElementById('speed');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.onKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.onKeyUp(e);
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onKeyDown({ keyCode: 32 }); // Simulate spacebar
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            this.onKeyDown({ keyCode: 32 }); // Simulate spacebar
        });
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.restartBtn.addEventListener('click', () => this.restart());
    }
    
    onKeyDown(e) {
        if (this.gameState === 'CRASHED') {
            this.restart();
            return;
        }
        
        if (this.gameState === 'WAITING') {
            this.startGame();
            return;
        }
        
        if (this.gameState === 'RUNNING') {
            switch (e.keyCode) {
                case 32: // Space
                case 38: // Up arrow
                    if (!this.tRex.jumping && !this.tRex.ducking) {
                        this.startJump();
                    }
                    break;
                case 40: // Down arrow
                    if (this.tRex.jumping) {
                        this.speedDrop();
                    } else if (!this.tRex.jumping && !this.tRex.ducking) {
                        this.setDuck(true);
                    }
                    break;
            }
        }
    }
    
    onKeyUp(e) {
        if (this.gameState === 'RUNNING') {
            switch (e.keyCode) {
                case 40: // Down arrow
                    this.setDuck(false);
                    break;
            }
        }
    }
    
    startGame() {
        this.gameState = 'RUNNING';
        this.gameStartTime = Date.now();
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.tRex.status = 'RUNNING';
    }
    
    pauseGame() {
        if (this.gameState === 'RUNNING') {
            this.gameState = 'WAITING';
            this.pauseBtn.textContent = 'Resume';
        } else if (this.gameState === 'WAITING' && this.score > 0) {
            this.gameState = 'RUNNING';
            this.pauseBtn.textContent = 'Pause';
        }
    }
    
    restart() {
        this.gameOverScreen.style.display = 'none';
        this.gameState = 'RUNNING';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.pauseBtn.textContent = 'Pause';
        this.reset();
    }
    
    reset() {
        this.score = 0;
        this.currentSpeed = 6;
        this.obstacles = [];
        this.clouds = [];
        this.tRex.yPos = this.tRex.groundYPos;
        this.tRex.jumpVelocity = 0;
        this.tRex.jumping = false;
        this.tRex.ducking = false;
        this.tRex.status = 'RUNNING';
        this.ground.x = 0;
        this.gameStartTime = Date.now();
        this.isNightMode = false;
        this.invertTimer = 0;
    }
    
    startJump() {
        if (!this.tRex.jumping) {
            this.tRex.jumpVelocity = -10;
            this.tRex.jumping = true;
            this.tRex.status = 'JUMPING';
        }
    }
    
    speedDrop() {
        this.tRex.speedDrop = 8;
    }
    
    setDuck(isDucking) {
        if (isDucking && this.tRex.status !== 'DUCKING') {
            this.tRex.ducking = true;
            this.tRex.status = 'DUCKING';
        } else if (!isDucking && this.tRex.status === 'DUCKING') {
            this.tRex.ducking = false;
            this.tRex.status = 'RUNNING';
        }
    }
    
    update() {
        if (this.gameState !== 'RUNNING') return;
        
        // Update score
        this.score += this.currentSpeed * 0.1;
        
        // Update speed
        this.currentSpeed += this.speedIncrement;
        
        // Update T-Rex
        this.updateTRex();
        
        // Update ground
        this.updateGround();
        
        // Update obstacles
        this.updateObstacles();
        
        // Update clouds
        this.updateClouds();
        
        // Check collisions
        this.checkCollisions();
        
        // Update night mode
        this.updateNightMode();
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('trex-highscore', Math.floor(this.highScore).toString());
        }
    }
    
    updateTRex() {
        if (this.tRex.jumping) {
            this.tRex.yPos += this.tRex.jumpVelocity + this.tRex.speedDrop;
            this.tRex.jumpVelocity += 0.6; // gravity
            
            if (this.tRex.yPos >= this.tRex.groundYPos) {
                this.tRex.yPos = this.tRex.groundYPos;
                this.tRex.jumping = false;
                this.tRex.jumpVelocity = 0;
                this.tRex.speedDrop = 0;
                this.tRex.status = this.tRex.ducking ? 'DUCKING' : 'RUNNING';
            }
        }
    }
    
    updateGround() {
        this.ground.x -= this.currentSpeed;
        if (this.ground.x <= -this.ground.width) {
            this.ground.x = 0;
        }
    }
    
    updateObstacles() {
        // Remove obstacles that are off screen
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x > -obstacle.width);
        
        // Move existing obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.currentSpeed;
        });
        
        // Add new obstacles
        if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < this.CANVAS_WIDTH - 200) {
            this.addObstacle();
        }
    }
    
    addObstacle() {
        const obstacleTypes = ['CACTUS_SMALL', 'CACTUS_LARGE', 'PTERODACTYL'];
        let type;
        
        // Higher chance for cacti than pterodactyls
        const rand = Math.random();
        if (rand < 0.7) {
            type = 'CACTUS_SMALL';
        } else if (rand < 0.9) {
            type = 'CACTUS_LARGE';
        } else {
            type = 'PTERODACTYL';
        }
        
        const obstacle = {
            type: type,
            x: this.CANVAS_WIDTH + Math.random() * 100,
            width: type === 'PTERODACTYL' ? 46 : (type === 'CACTUS_LARGE' ? 25 : 17),
            height: type === 'PTERODACTYL' ? 40 : (type === 'CACTUS_LARGE' ? 50 : 35),
            y: type === 'PTERODACTYL' ? this.CANVAS_HEIGHT - this.GROUND_HEIGHT - 40 - Math.random() * 20 : this.CANVAS_HEIGHT - this.GROUND_HEIGHT,
            animFrame: 0
        };
        
        if (obstacle.type === 'PTERODACTYL') {
            obstacle.y -= obstacle.height;
        } else {
            obstacle.y -= obstacle.height;
        }
        
        this.obstacles.push(obstacle);
    }
    
    updateClouds() {
        // Remove clouds that are off screen
        this.clouds = this.clouds.filter(cloud => cloud.x > -cloud.width);
        
        // Move existing clouds
        this.clouds.forEach(cloud => {
            cloud.x -= this.currentSpeed * 0.5;
        });
        
        // Add new clouds occasionally
        if (Math.random() < 0.005) {
            this.addCloud();
        }
    }
    
    addCloud() {
        const cloud = {
            x: this.CANVAS_WIDTH + Math.random() * 100,
            y: Math.random() * 50 + 10,
            width: 46,
            height: 14
        };
        this.clouds.push(cloud);
    }
    
    updateNightMode() {
        if (Math.floor(this.score) % 700 === 0 && Math.floor(this.score) > 0) {
            this.invertTimer = 150;
        }
        
        if (this.invertTimer > 0) {
            this.invertTimer--;
            if (this.invertTimer % 10 === 0) {
                this.isNightMode = !this.isNightMode;
            }
        }
    }
    
    checkCollisions() {
        const tRexBox = {
            x: this.tRex.x,
            y: this.tRex.yPos,
            width: this.RUNNER_WIDTH,
            height: this.tRex.ducking ? this.RUNNER_HEIGHT / 2 : this.RUNNER_HEIGHT
        };
        
        if (this.tRex.ducking) {
            tRexBox.y += this.RUNNER_HEIGHT / 2;
        }
        
        for (const obstacle of this.obstacles) {
            if (this.boxIntersect(tRexBox, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }
    
    boxIntersect(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    gameOver() {
        this.gameState = 'CRASHED';
        this.tRex.status = 'CRASHED';
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.startBtn.textContent = 'Restart';
        
        // Show game over screen
        this.finalScoreElement.textContent = this.formatScore(Math.floor(this.score));
        this.gameOverScreen.style.display = 'flex';
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Apply night mode
        if (this.isNightMode) {
            this.ctx.fillStyle = '#535353';
            this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            this.ctx.globalCompositeOperation = 'difference';
        } else {
            this.ctx.fillStyle = '#f7f7f7';
            this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // Draw clouds
        this.drawClouds();
        
        // Draw ground
        this.drawGround();
        
        // Draw T-Rex
        this.drawTRex();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw game over message
        if (this.gameState === 'CRASHED') {
            this.drawGameOver();
        }
        
        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    drawTRex() {
        const x = this.tRex.x;
        const y = this.tRex.yPos;
        
        this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
        
        if (this.tRex.status === 'CRASHED') {
            // Draw crashed T-Rex (simplified)
            this.ctx.fillRect(x, y + 10, 44, 37);
            this.ctx.fillRect(x + 10, y, 24, 15);
            // Eyes (X marks)
            this.ctx.fillStyle = this.isNightMode ? '#535353' : '#f7f7f7';
            this.ctx.fillRect(x + 15, y + 3, 8, 2);
            this.ctx.fillRect(x + 19, y + 1, 2, 6);
            this.ctx.fillRect(x + 25, y + 3, 8, 2);
            this.ctx.fillRect(x + 29, y + 1, 2, 6);
        } else if (this.tRex.status === 'DUCKING') {
            // Draw ducking T-Rex
            this.ctx.fillRect(x, y + 20, 44, 27);
            this.ctx.fillRect(x + 10, y + 15, 24, 10);
            // Eye
            this.ctx.fillStyle = this.isNightMode ? '#535353' : '#f7f7f7';
            this.ctx.fillRect(x + 15, y + 18, 4, 4);
        } else {
            // Draw running/jumping T-Rex
            // Body
            this.ctx.fillRect(x + 10, y + 10, 20, 25);
            // Head
            this.ctx.fillRect(x, y, 24, 20);
            // Tail
            this.ctx.fillRect(x + 30, y + 15, 14, 15);
            // Legs (with simple animation)
            const legOffset = this.gameState === 'RUNNING' ? Math.floor(Date.now() / 100) % 2 * 2 : 0;
            this.ctx.fillRect(x + 12, y + 35, 6, 12 - legOffset);
            this.ctx.fillRect(x + 22, y + 35, 6, 12 + legOffset);
            
            // Eye
            this.ctx.fillStyle = this.isNightMode ? '#535353' : '#f7f7f7';
            this.ctx.fillRect(x + 15, y + 5, 4, 4);
        }
    }
    
    drawObstacles() {
        this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
        
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'CACTUS_SMALL':
                    // Small cactus
                    this.ctx.fillRect(obstacle.x + 3, obstacle.y, 11, obstacle.height);
                    this.ctx.fillRect(obstacle.x, obstacle.y + 10, 6, 15);
                    this.ctx.fillRect(obstacle.x + 11, obstacle.y + 15, 6, 10);
                    break;
                    
                case 'CACTUS_LARGE':
                    // Large cactus
                    this.ctx.fillRect(obstacle.x + 5, obstacle.y, 15, obstacle.height);
                    this.ctx.fillRect(obstacle.x, obstacle.y + 15, 8, 20);
                    this.ctx.fillRect(obstacle.x + 17, obstacle.y + 20, 8, 15);
                    break;
                    
                case 'PTERODACTYL':
                    // Pterodactyl with flapping animation
                    const flap = Math.floor(Date.now() / 200) % 2;
                    this.ctx.fillRect(obstacle.x + 10, obstacle.y + 15, 26, 10);
                    // Wings
                    this.ctx.fillRect(obstacle.x, obstacle.y + 5 + flap * 3, 15, 8);
                    this.ctx.fillRect(obstacle.x + 31, obstacle.y + 5 + flap * 3, 15, 8);
                    // Beak
                    this.ctx.fillRect(obstacle.x + 36, obstacle.y + 18, 10, 4);
                    break;
            }
        });
    }
    
    drawClouds() {
        this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
        this.ctx.globalAlpha = 0.3;
        
        this.clouds.forEach(cloud => {
            // Simple cloud shape
            this.ctx.fillRect(cloud.x, cloud.y, 46, 14);
            this.ctx.fillRect(cloud.x + 10, cloud.y - 5, 26, 10);
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawGround() {
        this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
        this.ctx.fillRect(0, this.ground.y, this.CANVAS_WIDTH, 2);
        
        // Ground texture dots
        for (let i = this.ground.x; i < this.CANVAS_WIDTH + 20; i += 20) {
            this.ctx.fillRect(i, this.ground.y + 4, 2, 2);
            this.ctx.fillRect(i + 10, this.ground.y + 6, 2, 2);
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('G A M E  O V E R', this.CANVAS_WIDTH / 2, 50);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press SPACE to restart', this.CANVAS_WIDTH / 2, 80);
    }
    
    formatScore(score) {
        return score.toString().padStart(5, '0');
    }
    
    updateUI() {
        this.scoreElement.textContent = this.formatScore(Math.floor(this.score));
        this.highScoreElement.textContent = this.formatScore(Math.floor(this.highScore));
        this.speedElement.textContent = (this.currentSpeed / 6).toFixed(1) + 'x';
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
    new TRexRunner();
});