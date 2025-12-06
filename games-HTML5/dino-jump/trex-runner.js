class TRexRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants (Chrome exact values)
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
        this.currentSpeed = 6; // Chrome default speed
        this.speedIncrement = 0.001; // Chrome speed increase rate
        this.gameStartTime = 0;
        this.animationFrame = 0; // For smooth running animations
        
        // Dino/T-Rex properties
        this.tRex = {
            x: 50, // Chrome position
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
        this.nightModeOpacity = 0; // For smooth fade transition
        
        // Fast mode
        this.fastMode = false;
        this.baseSpeed = 4; // Store the original slow speed
        
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
        this.fastModeBtn = document.getElementById('fastModeBtn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        
        // Initialize fast mode button state
        if (this.fastModeBtn) {
            this.fastModeBtn.textContent = 'Fast Mode: OFF';
            this.fastModeBtn.style.backgroundColor = '#f44336';
        }
        
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
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.restartBtn.addEventListener('click', () => this.restart());
        if (this.fastModeBtn) {
            // Remove any existing event listeners before adding new one
            this.fastModeBtn.removeEventListener('click', this.toggleFastMode);
            this.fastModeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFastMode();
            });
        }
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
        this.currentSpeed = 6; // Chrome default speed
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
        this.nightModeOpacity = 0;
    }
    
    startJump() {
        if (!this.tRex.jumping) {
            this.tRex.jumpVelocity = -10; // Chrome exact jump power
            this.tRex.jumping = true;
            this.tRex.status = 'JUMPING';
        }
    }
    
    speedDrop() {
        this.tRex.speedDrop = 8;
    }
    
    toggleFastMode() {
        // Prevent rapid clicking or if button is disabled
        if (!this.fastModeBtn || this.fastModeBtn.disabled) {
            return;
        }
        
        // Temporarily disable button to prevent rapid clicks
        this.fastModeBtn.disabled = true;
        this.fastModeBtn.style.opacity = '0.7';
        
        // Toggle the mode
        this.fastMode = !this.fastMode;
        
        // Update button appearance
        this.fastModeBtn.textContent = this.fastMode ? 'Fast Mode: ON' : 'Fast Mode: OFF';
        this.fastModeBtn.style.backgroundColor = this.fastMode ? '#4CAF50' : '#f44336';
        
        // Update current speed based on mode
        if (this.fastMode) {
            // Fast mode: start at 1.0x speed
            this.currentSpeed = 6;
        } else {
            // Normal mode: start at 0.7x speed  
            this.currentSpeed = this.baseSpeed;
        }
        
        // Re-enable button after a short delay
        setTimeout(() => {
            if (this.fastModeBtn) {
                this.fastModeBtn.disabled = false;
                this.fastModeBtn.style.opacity = '1';
            }
        }, 300);
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
        
        // Update animation frame counter
        this.animationFrame++;
        
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
        if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < this.CANVAS_WIDTH - 300) { // Increased spacing from 200 to 300 for easier gameplay
            this.addObstacle();
        }
    }
    
    addObstacle() {
        const obstacleTypes = ['CACTUS_SMALL', 'CACTUS_LARGE', 'CACTUS_TRIPLE', 'PTERODACTYL'];
        let type;
        
        // Chrome-style obstacle distribution
        const rand = Math.random();
        if (rand < 0.4) {
            type = 'CACTUS_SMALL';
        } else if (rand < 0.7) {
            type = 'CACTUS_LARGE';
        } else if (rand < 0.85) {
            type = 'CACTUS_TRIPLE';
        } else {
            type = 'PTERODACTYL';
        }
        
        const obstacle = {
            type: type,
            x: this.CANVAS_WIDTH + Math.random() * 50, // Chrome spacing
            width: type === 'PTERODACTYL' ? 46 : (type === 'CACTUS_LARGE' ? 25 : (type === 'CACTUS_TRIPLE' ? 35 : 17)),
            height: type === 'PTERODACTYL' ? 40 : (type === 'CACTUS_LARGE' ? 50 : (type === 'CACTUS_TRIPLE' ? 45 : 35)),
            y: type === 'PTERODACTYL' ? this.CANVAS_HEIGHT - this.GROUND_HEIGHT - 40 - Math.floor(Math.random() * 3) * 10 : this.CANVAS_HEIGHT - this.GROUND_HEIGHT,
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
            this.invertTimer = 120; // Reduced for smoother transition
        }
        
        if (this.invertTimer > 0) {
            this.invertTimer--;
            
            // Smooth fade transition instead of abrupt switching
            if (this.invertTimer > 60) {
                // Fade to night mode
                this.nightModeOpacity = Math.min(1, (120 - this.invertTimer) / 60);
                this.isNightMode = this.nightModeOpacity > 0.5;
            } else {
                // Fade back to day mode
                this.nightModeOpacity = Math.max(0, this.invertTimer / 60);
                this.isNightMode = this.nightModeOpacity > 0.5;
            }
        } else {
            // Not in transition
            this.nightModeOpacity = this.isNightMode ? 1 : 0;
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
        
        // Apply smooth night mode transition
        const bgGray = Math.floor(247 - (247 - 83) * this.nightModeOpacity);
        this.ctx.fillStyle = `rgb(${bgGray}, ${bgGray}, ${bgGray})`;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        this.ctx.globalCompositeOperation = 'source-over';
        
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
        
        // Smooth color transition for T-Rex
        const tRexGray = Math.floor(83 + (247 - 83) * (this.nightModeOpacity || 0));
        this.ctx.fillStyle = `rgb(${tRexGray}, ${tRexGray}, ${tRexGray})`;
        
        if (this.tRex.status === 'CRASHED') {
            // EXACT Chrome crashed T-Rex (standing pose with X eyes)
            // Tail
            this.ctx.fillRect(x + 0, y + 28, 4, 4);
            this.ctx.fillRect(x + 4, y + 26, 4, 6);
            this.ctx.fillRect(x + 8, y + 24, 4, 6);
            this.ctx.fillRect(x + 12, y + 23, 4, 5);
            
            // Back and body
            this.ctx.fillRect(x + 16, y + 22, 4, 8);
            this.ctx.fillRect(x + 20, y + 18, 4, 12);
            this.ctx.fillRect(x + 24, y + 18, 6, 12);
            
            // Head
            this.ctx.fillRect(x + 24, y + 10, 11, 8);
            
            // Snout
            this.ctx.fillRect(x + 35, y + 13, 5, 5);
            
            // X eyes (Chrome style)
            const eyeColor = Math.floor(247 - (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${eyeColor}, ${eyeColor}, ${eyeColor})`;
            // First diagonal
            this.ctx.fillRect(x + 28, y + 12, 2, 2);
            this.ctx.fillRect(x + 30, y + 13, 2, 2);
            this.ctx.fillRect(x + 32, y + 14, 2, 2);
            // Second diagonal (crossing)
            this.ctx.fillRect(x + 28, y + 14, 2, 2);
            this.ctx.fillRect(x + 30, y + 13, 2, 2);
            this.ctx.fillRect(x + 32, y + 12, 2, 2);
            
            // Back to dino color
            const dinoColor = Math.floor(83 + (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${dinoColor}, ${dinoColor}, ${dinoColor})`;
            
            // Arm
            this.ctx.fillRect(x + 28, y + 22, 2, 6);
            
            // Legs (both standing)
            this.ctx.fillRect(x + 22, y + 30, 4, 4);
            this.ctx.fillRect(x + 22, y + 34, 4, 8);
            this.ctx.fillRect(x + 22, y + 42, 6, 2);
            this.ctx.fillRect(x + 28, y + 30, 4, 4);
            this.ctx.fillRect(x + 28, y + 34, 4, 8);
            this.ctx.fillRect(x + 28, y + 42, 6, 2);
        } else if (this.tRex.status === 'DUCKING') {
            // EXACT Chrome ducking T-Rex sprite
            // Tail (extended horizontally)
            this.ctx.fillRect(x + 0, y + 32, 4, 4);
            this.ctx.fillRect(x + 4, y + 31, 4, 5);
            this.ctx.fillRect(x + 8, y + 30, 4, 5);
            this.ctx.fillRect(x + 12, y + 29, 4, 5);
            this.ctx.fillRect(x + 16, y + 28, 4, 5);
            
            // Body (low profile)
            this.ctx.fillRect(x + 20, y + 28, 11, 7);
            
            // Neck (forward)
            this.ctx.fillRect(x + 31, y + 26, 4, 7);
            
            // Head (forward facing)
            this.ctx.fillRect(x + 35, y + 24, 11, 8);
            
            // Snout
            this.ctx.fillRect(x + 46, y + 26, 4, 4);
            
            // Eye
            const eyeColor = Math.floor(247 - (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${eyeColor}, ${eyeColor}, ${eyeColor})`;
            this.ctx.fillRect(x + 41, y + 26, 2, 2);
            
            // Back to dino color
            const dinoColor = Math.floor(83 + (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${dinoColor}, ${dinoColor}, ${dinoColor})`;
            
            // Arm (tiny)
            this.ctx.fillRect(x + 37, y + 30, 2, 4);
            
            // Legs (both showing underneath)
            this.ctx.fillRect(x + 24, y + 35, 4, 7);
            this.ctx.fillRect(x + 24, y + 42, 6, 2);
            this.ctx.fillRect(x + 30, y + 35, 4, 7);
            this.ctx.fillRect(x + 30, y + 42, 6, 2);
        } else {
            // EXACT Chrome T-Rex sprite (from actual Chrome sprite sheet)
            const runFrame = this.gameState === 'RUNNING' ? Math.floor(this.animationFrame / 6) % 2 : 0;
            
            // Tail segments (back to front, curves upward)
            this.ctx.fillRect(x + 0, y + 28, 4, 4);   
            this.ctx.fillRect(x + 4, y + 26, 4, 6);   
            this.ctx.fillRect(x + 8, y + 24, 4, 6);   
            this.ctx.fillRect(x + 12, y + 23, 4, 5);  
            
            // Back section
            this.ctx.fillRect(x + 16, y + 22, 4, 8);
            this.ctx.fillRect(x + 20, y + 18, 4, 12);
            
            // Body/torso
            this.ctx.fillRect(x + 24, y + 18, 6, 12);
            
            // Head (large block)
            this.ctx.fillRect(x + 24, y + 10, 11, 8);
            
            // Snout
            this.ctx.fillRect(x + 35, y + 13, 5, 5);
            
            // Eye (single pixel in Chrome, 2x2 for visibility)
            const eyeColor = Math.floor(247 - (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${eyeColor}, ${eyeColor}, ${eyeColor})`;
            this.ctx.fillRect(x + 30, y + 12, 2, 2);
            
            // Back to dino color
            const dinoColor = Math.floor(83 + (247 - 83) * (this.nightModeOpacity || 0));
            this.ctx.fillStyle = `rgb(${dinoColor}, ${dinoColor}, ${dinoColor})`;
            
            // Arm (tiny T-Rex arm)
            this.ctx.fillRect(x + 28, y + 22, 2, 6);
            
            // Legs - alternating animation
            if (runFrame === 0) {
                // Left leg forward, right leg back
                // Left leg
                this.ctx.fillRect(x + 22, y + 30, 4, 4);  
                this.ctx.fillRect(x + 22, y + 34, 4, 8);  
                this.ctx.fillRect(x + 22, y + 42, 6, 2);  
                // Right leg (bent)
                this.ctx.fillRect(x + 28, y + 30, 4, 4);  
                this.ctx.fillRect(x + 30, y + 34, 4, 4);  
                this.ctx.fillRect(x + 30, y + 38, 5, 2);  
            } else {
                // Right leg forward, left leg back
                // Left leg (bent)
                this.ctx.fillRect(x + 22, y + 30, 4, 4);  
                this.ctx.fillRect(x + 20, y + 34, 4, 4);  
                this.ctx.fillRect(x + 20, y + 38, 5, 2);  
                // Right leg
                this.ctx.fillRect(x + 28, y + 30, 4, 4);  
                this.ctx.fillRect(x + 28, y + 34, 4, 8);  
                this.ctx.fillRect(x + 28, y + 42, 6, 2);  
            }
        }
    }
    
    drawObstacles() {
        // Smooth color transition for obstacles
        const obstacleGray = Math.floor(83 + (247 - 83) * (this.nightModeOpacity || 0));
        this.ctx.fillStyle = `rgb(${obstacleGray}, ${obstacleGray}, ${obstacleGray})`;
        
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'CACTUS_SMALL':
                    // Chrome small cactus (single column with side arms)
                    // Main trunk
                    this.ctx.fillRect(obstacle.x + 5, obstacle.y + 7, 6, obstacle.height - 7);
                    // Left arm
                    this.ctx.fillRect(obstacle.x + 0, obstacle.y + 13, 7, 8);
                    this.ctx.fillRect(obstacle.x + 0, obstacle.y + 13, 4, 2);
                    // Right arm
                    this.ctx.fillRect(obstacle.x + 9, obstacle.y + 16, 6, 6);
                    this.ctx.fillRect(obstacle.x + 13, obstacle.y + 16, 2, 2);
                    break;
                    
                case 'CACTUS_LARGE':
                    // Chrome large cactus (wider with multiple arms)
                    // Main trunk (wider)
                    this.ctx.fillRect(obstacle.x + 8, obstacle.y + 6, 10, obstacle.height - 6);
                    // Left side arms
                    this.ctx.fillRect(obstacle.x + 0, obstacle.y + 14, 10, 10);
                    this.ctx.fillRect(obstacle.x + 0, obstacle.y + 14, 4, 2);
                    this.ctx.fillRect(obstacle.x + 2, obstacle.y + 24, 6, 8);
                    // Right side arms
                    this.ctx.fillRect(obstacle.x + 16, obstacle.y + 12, 10, 12);
                    this.ctx.fillRect(obstacle.x + 22, obstacle.y + 12, 4, 2);
                    this.ctx.fillRect(obstacle.x + 18, obstacle.y + 22, 8, 8);
                    break;
                    
                case 'CACTUS_TRIPLE':
                    // Triple cactus - three cacti grouped together
                    // First cactus
                    this.ctx.fillRect(obstacle.x + 2, obstacle.y, 8, obstacle.height);
                    this.ctx.fillRect(obstacle.x, obstacle.y + 12, 4, 12);
                    // Second cactus (middle, taller)
                    this.ctx.fillRect(obstacle.x + 13, obstacle.y - 5, 10, obstacle.height + 5);
                    this.ctx.fillRect(obstacle.x + 11, obstacle.y + 10, 5, 15);
                    this.ctx.fillRect(obstacle.x + 23, obstacle.y + 15, 5, 10);
                    // Third cactus
                    this.ctx.fillRect(obstacle.x + 27, obstacle.y + 3, 8, obstacle.height - 3);
                    this.ctx.fillRect(obstacle.x + 32, obstacle.y + 15, 4, 10);
                    break;
                    
                case 'PTERODACTYL':
                    // Improved pterodactyl with more realistic bird appearance
                    const flap = Math.floor(Date.now() / 150) % 3; // 3-frame animation for smoother flapping
                    
                    // Body (more streamlined)
                    this.ctx.fillRect(obstacle.x + 15, obstacle.y + 18, 20, 8);
                    
                    // Head with better shape
                    this.ctx.fillRect(obstacle.x + 35, obstacle.y + 16, 8, 12);
                    
                    // Beak (more prominent)
                    this.ctx.fillRect(obstacle.x + 43, obstacle.y + 20, 6, 3);
                    
                    // Wings with better flapping animation
                    if (flap === 0) {
                        // Wings up
                        this.ctx.fillRect(obstacle.x + 5, obstacle.y + 8, 18, 6);
                        this.ctx.fillRect(obstacle.x + 25, obstacle.y + 8, 18, 6);
                    } else if (flap === 1) {
                        // Wings middle
                        this.ctx.fillRect(obstacle.x + 2, obstacle.y + 15, 20, 5);
                        this.ctx.fillRect(obstacle.x + 28, obstacle.y + 15, 20, 5);
                    } else {
                        // Wings down
                        this.ctx.fillRect(obstacle.x + 5, obstacle.y + 22, 18, 6);
                        this.ctx.fillRect(obstacle.x + 25, obstacle.y + 22, 18, 6);
                    }
                    
                    // Tail feathers
                    this.ctx.fillRect(obstacle.x + 8, obstacle.y + 20, 8, 3);
                    
                    // Eye (small detail)
                    const birdEyeGray = Math.floor(247 - (247 - 83) * (this.nightModeOpacity || 0));
                    this.ctx.fillStyle = `rgb(${birdEyeGray}, ${birdEyeGray}, ${birdEyeGray})`;
                    this.ctx.fillRect(obstacle.x + 37, obstacle.y + 18, 2, 2);
                    this.ctx.fillStyle = this.isNightMode ? '#f7f7f7' : '#535353';
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
        
        // Main ground line
        this.ctx.fillRect(0, this.ground.y, this.CANVAS_WIDTH, 2);
        
        // Sand texture - random scattered dots
        const offset = Math.floor(this.ground.x) % 20;
        this.ctx.globalAlpha = 0.4;
        
        for (let i = -offset; i < this.CANVAS_WIDTH + 20; i += 8) {
            const randomY = Math.floor((i * 7) % 5); // Pseudo-random height variation
            const randomSize = ((i * 13) % 3) + 1; // Pseudo-random size 1-3
            this.ctx.fillRect(i + ((i * 11) % 4), this.ground.y + 3 + randomY, randomSize, 1);
        }
        
        // Additional sand grain layer
        this.ctx.globalAlpha = 0.25;
        for (let i = -offset + 4; i < this.CANVAS_WIDTH + 20; i += 12) {
            const randomY = Math.floor((i * 5) % 6);
            this.ctx.fillRect(i + ((i * 9) % 3), this.ground.y + 2 + randomY, 1, 1);
        }
        
        this.ctx.globalAlpha = 1;
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