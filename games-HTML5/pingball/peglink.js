// Peglink Game - Peggle-style game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const CONFIG = {
    ballRadius: 8,
    pegRadius: 12,
    ballSpeed: 400,
    gravity: 300,
    bucketWidth: 100,
    bucketHeight: 20,
    bucketSpeed: 120,
    trajectorySteps: 100,
    maxBounces: 3
};

// Game state
let gameState = {
    currentState: 'AIMING', // AIMING, LAUNCH, IN_FLIGHT, RESOLVE_TURN, WIN_STATE, LOSE_STATE
    balls: [],
    ballsRemaining: 10,
    pegs: [],
    bucket: {
        x: 0,
        y: 0,
        direction: 1
    },
    score: 0,
    level: 1,
    mousePos: { x: 0, y: 0 },
    launcher: { x: 0, y: 0 },
    particles: [],
    trajectory: []
};

// Peg types
const PEG_TYPES = {
    BLUE: { color: '#4169E1', points: 10, required: true },
    ORANGE: { color: '#FF8C00', points: 20, required: false },
    POWER: { color: '#FFD700', points: 50, required: false },
    BONUS: { color: '#32CD32', points: 30, required: false }
};

// Canvas setup
function setupCanvas() {
    canvas.width = 960;
    canvas.height = 720;
    
    // Initialize positions
    gameState.launcher.x = canvas.width / 2;
    gameState.launcher.y = canvas.height - 50;
    
    gameState.bucket.x = canvas.width / 2 - CONFIG.bucketWidth / 2;
    gameState.bucket.y = canvas.height - 30;
}

// Level definitions
const LEVELS = [
    {
        ballCount: 10,
        pegs: [
            {x: 200, y: 150, type: 'BLUE'},
            {x: 300, y: 150, type: 'BLUE'},
            {x: 400, y: 150, type: 'BLUE'},
            {x: 500, y: 150, type: 'ORANGE'},
            {x: 600, y: 150, type: 'ORANGE'},
            {x: 250, y: 220, type: 'BLUE'},
            {x: 350, y: 220, type: 'POWER'},
            {x: 450, y: 220, type: 'BLUE'},
            {x: 550, y: 220, type: 'ORANGE'},
            {x: 300, y: 290, type: 'BLUE'},
            {x: 400, y: 290, type: 'BLUE'},
            {x: 500, y: 290, type: 'BONUS'}
        ]
    }
];

// Ball class
class Ball {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = CONFIG.ballRadius;
        this.trail = [];
        this.state = 'IN_FLIGHT';
    }
    
    update(deltaTime) {
        if (this.state !== 'IN_FLIGHT') return;
        
        // Apply gravity
        this.vy += CONFIG.gravity * deltaTime;
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Add to trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        // Check wall collisions
        this.checkWallCollisions();
        
        // Check peg collisions
        this.checkPegCollisions();
        
        // Check bucket collision
        this.checkBucketCollision();
        
        // Check if ball is out of bounds
        if (this.y > canvas.height + 100) {
            this.state = 'DESTROYED';
        }
    }
    
    checkWallCollisions() {
        // Left wall
        if (this.x - this.radius < 40) {
            this.x = 40 + this.radius;
            this.vx = -this.vx;
            this.createBounceParticles();
        }
        
        // Right wall
        if (this.x + this.radius > canvas.width - 40) {
            this.x = canvas.width - 40 - this.radius;
            this.vx = -this.vx;
            this.createBounceParticles();
        }
        
        // Top wall
        if (this.y - this.radius < 40) {
            this.y = 40 + this.radius;
            this.vy = -this.vy;
            this.createBounceParticles();
        }
    }
    
    checkPegCollisions() {
        for (let i = gameState.pegs.length - 1; i >= 0; i--) {
            const peg = gameState.pegs[i];
            if (peg.hit) continue;
            
            const dx = this.x - peg.x;
            const dy = this.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.radius + CONFIG.pegRadius) {
                // Hit peg
                peg.hit = true;
                gameState.score += PEG_TYPES[peg.type].points;
                
                // Create hit particles
                this.createHitParticles(peg.x, peg.y, PEG_TYPES[peg.type].color);
                
                // Handle special peg effects
                if (peg.type === 'POWER') {
                    this.splitBall();
                } else if (peg.type === 'BONUS') {
                    gameState.ballsRemaining++;
                }
                
                // Remove peg after a brief delay for animation
                setTimeout(() => {
                    const index = gameState.pegs.indexOf(peg);
                    if (index > -1) {
                        gameState.pegs.splice(index, 1);
                    }
                }, 100);
                
                break;
            }
        }
    }
    
    checkBucketCollision() {
        const bucket = gameState.bucket;
        if (this.y + this.radius >= bucket.y && 
            this.x >= bucket.x && 
            this.x <= bucket.x + CONFIG.bucketWidth) {
            
            this.state = 'COLLECTED';
            gameState.ballsRemaining++;
            gameState.score += 100;
            
            // Bucket catch particles
            this.createCatchParticles();
        }
    }
    
    splitBall() {
        // Create two additional balls with spread angles
        const angle1 = Math.atan2(this.vy, this.vx) - 0.3;
        const angle2 = Math.atan2(this.vy, this.vx) + 0.3;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        gameState.balls.push(new Ball(
            this.x, this.y,
            Math.cos(angle1) * speed,
            Math.sin(angle1) * speed
        ));
        
        gameState.balls.push(new Ball(
            this.x, this.y,
            Math.cos(angle2) * speed,
            Math.sin(angle2) * speed
        ));
    }
    
    createBounceParticles() {
        for (let i = 0; i < 5; i++) {
            gameState.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 30,
                maxLife: 30,
                color: '#FFF'
            });
        }
    }
    
    createHitParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            gameState.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 40,
                maxLife: 40,
                color: color
            });
        }
    }
    
    createCatchParticles() {
        for (let i = 0; i < 10; i++) {
            gameState.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 100,
                life: 50,
                maxLife: 50,
                color: '#FFD700'
            });
        }
    }
    
    draw() {
        if (this.state === 'DESTROYED' || this.state === 'COLLECTED') return;
        
        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * alpha * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw ball
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Trajectory prediction
function calculateTrajectory(startX, startY, vx, vy) {
    const trajectory = [];
    let x = startX, y = startY;
    let velX = vx, velY = vy;
    let bounces = 0;
    
    const dt = 1/60; // 60 FPS simulation
    
    for (let step = 0; step < CONFIG.trajectorySteps && bounces < CONFIG.maxBounces; step++) {
        // Apply gravity
        velY += CONFIG.gravity * dt;
        
        // Update position
        x += velX * dt;
        y += velY * dt;
        
        // Check wall bounces
        if (x < 40 || x > canvas.width - 40) {
            velX = -velX;
            x = Math.max(40, Math.min(canvas.width - 40, x));
            bounces++;
        }
        
        if (y < 40) {
            velY = -velY;
            y = 40;
            bounces++;
        }
        
        trajectory.push({x, y});
        
        // Stop if ball goes off screen
        if (y > canvas.height) break;
    }
    
    return trajectory;
}

// Drawing functions
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw play area border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
}

function drawPegs() {
    gameState.pegs.forEach(peg => {
        if (peg.hit) {
            // Fade out animation
            const alpha = Math.max(0, 1 - (Date.now() - peg.hitTime) / 200);
            ctx.globalAlpha = alpha;
        }
        
        const pegType = PEG_TYPES[peg.type];
        
        // Draw peg glow if under trajectory
        if (isPegUnderTrajectory(peg)) {
            ctx.shadowColor = pegType.color;
            ctx.shadowBlur = 15;
        }
        
        // Draw peg
        ctx.fillStyle = pegType.color;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, CONFIG.pegRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw peg border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    });
}

function isPegUnderTrajectory(peg) {
    return gameState.trajectory.some(point => {
        const dx = point.x - peg.x;
        const dy = point.y - peg.y;
        return Math.sqrt(dx * dx + dy * dy) < CONFIG.pegRadius + CONFIG.ballRadius;
    });
}

function drawBucket() {
    const bucket = gameState.bucket;
    
    // Draw bucket shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(bucket.x + 2, bucket.y + 2, CONFIG.bucketWidth, CONFIG.bucketHeight);
    
    // Draw bucket
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(bucket.x, bucket.y, CONFIG.bucketWidth, CONFIG.bucketHeight);
    
    // Draw bucket border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(bucket.x, bucket.y, CONFIG.bucketWidth, CONFIG.bucketHeight);
    
    // Draw bucket handles
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bucket.x, bucket.y + CONFIG.bucketHeight/2, 8, 0, Math.PI, true);
    ctx.arc(bucket.x + CONFIG.bucketWidth, bucket.y + CONFIG.bucketHeight/2, 8, 0, Math.PI, true);
    ctx.stroke();
}

function drawLauncher() {
    const launcher = gameState.launcher;
    
    // Draw launcher base
    ctx.fillStyle = '#666';
    ctx.fillRect(launcher.x - 15, launcher.y - 10, 30, 20);
    
    // Draw launcher cannon
    const angle = Math.atan2(gameState.mousePos.y - launcher.y, gameState.mousePos.x - launcher.x);
    const cannonLength = 25;
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(launcher.x, launcher.y);
    ctx.lineTo(
        launcher.x + Math.cos(angle) * cannonLength,
        launcher.y + Math.sin(angle) * cannonLength
    );
    ctx.stroke();
}

function drawTrajectory() {
    if (gameState.currentState !== 'AIMING' || gameState.trajectory.length === 0) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    gameState.trajectory.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        particle.x += particle.vx * (1/60);
        particle.y += particle.vy * (1/60);
        particle.vy += CONFIG.gravity * 0.3 * (1/60);
        particle.life--;
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
            continue;
        }
        
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

function drawUI() {
    // Balls remaining
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Balls: ${gameState.ballsRemaining}`, 50, 80);
    
    // Score
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width - 50, 80);
    
    // Level
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${gameState.level}`, canvas.width / 2, 80);
    
    // Blue pegs remaining
    const bluePegsLeft = gameState.pegs.filter(peg => peg.type === 'BLUE' && !peg.hit).length;
    ctx.fillStyle = '#4169E1';
    ctx.fillText(`Blue Pegs: ${bluePegsLeft}`, canvas.width / 2, 110);
}

// Game logic
function updateBucket(deltaTime) {
    const bucket = gameState.bucket;
    bucket.x += bucket.direction * CONFIG.bucketSpeed * deltaTime;
    
    if (bucket.x <= 40) {
        bucket.x = 40;
        bucket.direction = 1;
    } else if (bucket.x + CONFIG.bucketWidth >= canvas.width - 40) {
        bucket.x = canvas.width - 40 - CONFIG.bucketWidth;
        bucket.direction = -1;
    }
}

function updateTrajectory() {
    if (gameState.currentState !== 'AIMING') return;
    
    const launcher = gameState.launcher;
    const angle = Math.atan2(gameState.mousePos.y - launcher.y, gameState.mousePos.x - launcher.x);
    
    // Limit angle range (5° to 175°)
    const clampedAngle = Math.max(Math.PI * 5/180, Math.min(Math.PI * 175/180, angle));
    
    const vx = Math.cos(clampedAngle) * CONFIG.ballSpeed;
    const vy = Math.sin(clampedAngle) * CONFIG.ballSpeed;
    
    gameState.trajectory = calculateTrajectory(launcher.x, launcher.y, vx, vy);
}

function launchBall() {
    if (gameState.currentState !== 'AIMING' || gameState.ballsRemaining <= 0) return;
    
    const launcher = gameState.launcher;
    const angle = Math.atan2(gameState.mousePos.y - launcher.y, gameState.mousePos.x - launcher.x);
    const clampedAngle = Math.max(Math.PI * 5/180, Math.min(Math.PI * 175/180, angle));
    
    const vx = Math.cos(clampedAngle) * CONFIG.ballSpeed;
    const vy = Math.sin(clampedAngle) * CONFIG.ballSpeed;
    
    gameState.balls.push(new Ball(launcher.x, launcher.y, vx, vy));
    gameState.ballsRemaining--;
    gameState.currentState = 'IN_FLIGHT';
}

function checkWinLoseConditions() {
    const activeBalls = gameState.balls.filter(ball => ball.state === 'IN_FLIGHT').length;
    const bluePegsLeft = gameState.pegs.filter(peg => peg.type === 'BLUE' && !peg.hit).length;
    
    if (activeBalls === 0 && gameState.currentState === 'IN_FLIGHT') {
        if (bluePegsLeft === 0) {
            gameState.currentState = 'WIN_STATE';
        } else if (gameState.ballsRemaining === 0) {
            gameState.currentState = 'LOSE_STATE';
        } else {
            gameState.currentState = 'AIMING';
        }
        
        // Clean up collected/destroyed balls
        gameState.balls = gameState.balls.filter(ball => ball.state === 'IN_FLIGHT');
    }
}

function loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    if (!level) return false;
    
    gameState.ballsRemaining = level.ballCount;
    gameState.pegs = level.pegs.map(pegData => ({
        x: pegData.x,
        y: pegData.y,
        type: pegData.type,
        hit: false
    }));
    gameState.balls = [];
    gameState.particles = [];
    gameState.currentState = 'AIMING';
    
    return true;
}

function nextLevel() {
    if (loadLevel(gameState.level)) {
        gameState.level++;
    } else {
        // No more levels - game complete
        gameState.currentState = 'WIN_STATE';
    }
}

function restartGame() {
    gameState.level = 1;
    gameState.score = 0;
    loadLevel(0);
}

// Event handlers
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    gameState.mousePos.x = event.clientX - rect.left;
    gameState.mousePos.y = event.clientY - rect.top;
    
    updateTrajectory();
}

function handleMouseClick(event) {
    if (gameState.currentState === 'AIMING') {
        launchBall();
    } else if (gameState.currentState === 'WIN_STATE' || gameState.currentState === 'LOSE_STATE') {
        if (gameState.currentState === 'WIN_STATE') {
            nextLevel();
        } else {
            restartGame();
        }
    }
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updateBucket(deltaTime);
    
    gameState.balls.forEach(ball => ball.update(deltaTime));
    
    checkWinLoseConditions();
    
    // Draw everything
    drawBackground();
    drawPegs();
    drawBucket();
    drawLauncher();
    drawTrajectory();
    
    gameState.balls.forEach(ball => ball.draw());
    
    drawParticles();
    drawUI();
    
    // Draw game state overlays
    if (gameState.currentState === 'WIN_STATE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 50);
    } else if (gameState.currentState === 'LOSE_STATE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    setupCanvas();
    loadLevel(0);
    
    // Event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start the game
initGame();