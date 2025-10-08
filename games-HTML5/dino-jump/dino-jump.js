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
        
        // Cloud spawning
        this.cloudTimer = 0;
        this.cloudInterval = 180;
        
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
        this.cloudTimer = 0;
        this.obstacles = [];
        this.clouds = [];
        
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
        this.updateClouds();
        this.updateScore();
        this.updateGameSpeed();
        this.spawnObstacles();
        this.spawnClouds();
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
    
    updateClouds() {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= this.gameSpeed * this.speedMultiplier * 0.3; // Clouds move slower
            
            // Remove clouds that are off-screen
            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
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
            
            // Random obstacle type
            const obstacleTypes = ['cactus', 'bird'];
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
                obstacle.y = this.groundY - Math.random() * 60 - 20; // Random height for birds
                obstacle.width = 30;
                obstacle.height = 20;
            }
            
            this.obstacles.push(obstacle);
        }
    }
    
    spawnClouds() {
        this.cloudTimer++;
        
        if (this.cloudTimer >= this.cloudInterval) {
            this.cloudTimer = 0;
            
            const cloud = {
                x: this.canvas.width,
                y: Math.random() * 80 + 20, // Random height in upper area
                width: 40 + Math.random() * 20,
                height: 20 + Math.random() * 10
            };
            
            this.clouds.push(cloud);
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
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#F0E68C');
        gradient.addColorStop(1, '#D2B48C');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.drawClouds();
        
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
        this.ctx.fillStyle = '#8B4513';
        
        if (this.dino.isDucking) {
            // Draw ducking dino (oval shape)
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.dino.x + this.dino.width / 2,
                this.dino.y + this.dino.height / 2,
                this.dino.width / 2,
                this.dino.height / 2,
                0, 0, 2 * Math.PI
            );
            this.ctx.fill();
        } else {
            // Draw standing dino (rectangle with rounded corners)
            this.ctx.beginPath();
            this.ctx.roundRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height, 5);
            this.ctx.fill();
        }
        
        // Draw dino details (eyes)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + 10, this.dino.y + 10, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + 25, this.dino.y + 10, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + 10, this.dino.y + 10, 1, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + 25, this.dino.y + 10, 1, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'cactus') {
                // Draw cactus
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Add cactus spikes
                this.ctx.fillStyle = '#32CD32';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(
                        obstacle.x - 3,
                        obstacle.y + i * 15 + 5,
                        6, 3
                    );
                    this.ctx.fillRect(
                        obstacle.x + obstacle.width - 3,
                        obstacle.y + i * 15 + 8,
                        6, 3
                    );
                }
            } else if (obstacle.type === 'bird') {
                // Draw bird (simple triangle)
                this.ctx.fillStyle = '#8B4513';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add wing detail
                this.ctx.fillStyle = '#654321';
                this.ctx.beginPath();
                this.ctx.ellipse(
                    obstacle.x + obstacle.width * 0.7,
                    obstacle.y + obstacle.height / 2,
                    8, 4, 0, 0, 2 * Math.PI
                );
                this.ctx.fill();
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
        // Draw ground line
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ground.y);
        this.ctx.lineTo(this.canvas.width, this.ground.y);
        this.ctx.stroke();
        
        // Draw ground texture
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Add some ground details (small rocks/pebbles)
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < this.canvas.width; i += 50) {
            if (Math.random() > 0.7) {
                this.ctx.beginPath();
                this.ctx.arc(i + Math.random() * 30, this.ground.y + 5, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }
    
    drawCanvasUI() {
        if (this.gameState === 'ready') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE or TAP to start!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Use SPACE/UP to jump, DOWN to duck', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 32px Arial';
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