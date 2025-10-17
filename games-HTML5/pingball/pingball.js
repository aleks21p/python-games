// Pingball Game - JavaScript Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.4;
const FRICTION = 0.99;
const WALL_BOUNCE = 0.8;
const FLIPPER_FORCE = 15;
const LAUNCH_MULTIPLIER = 0.3;
const NUDGE_FORCE = 2;

// Game state
let gameState = 'start'; // 'start', 'playing', 'launching', 'gameOver'
let score = 0;
let lives = 3;
let multiplier = 1;
let multiplierTimer = 0;

// Mouse tracking
let mouse = { x: 0, y: 0, down: false, dragStart: null };
let lastMousePos = { x: 0, y: 0 };
let mouseSpeed = 0;

// Ball object
const ball = {
    x: 750,
    y: 900,
    vx: 0,
    vy: 0,
    radius: 10,
    trail: [],
    
    update() {
        if (gameState !== 'playing') return;
        
        // Apply gravity
        this.vy += GRAVITY;
        
        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Add to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        
        // Wall collisions
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.vx = -this.vx * WALL_BOUNCE;
            playSound('wall');
        }
        if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx = -this.vx * WALL_BOUNCE;
            playSound('wall');
        }
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.vy = -this.vy * WALL_BOUNCE;
            playSound('wall');
        }
        
        // Check if ball fell through drain
        if (this.y > canvas.height + 50) {
            this.drain();
        }
        
        // Check collisions with flippers
        this.checkFlipperCollisions();
        
        // Check collisions with bumpers
        this.checkBumperCollisions();
        
        // Check collisions with targets
        this.checkTargetCollisions();
    },
    
    drain() {
        lives--;
        updateUI();
        playSound('drain');
        
        if (lives <= 0) {
            gameState = 'gameOver';
            showGameOverScreen();
        } else {
            this.reset();
        }
    },
    
    reset() {
        this.x = 750;
        this.y = 900;
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
        gameState = 'launching';
    },
    
    launch(power) {
        this.vy = -power * LAUNCH_MULTIPLIER;
        this.vx = Math.random() * 2 - 1; // Small random horizontal component
        gameState = 'playing';
        playSound('launch');
    },
    
    checkFlipperCollisions() {
        flippers.forEach(flipper => {
            const dist = Math.sqrt((this.x - flipper.x) ** 2 + (this.y - flipper.y) ** 2);
            if (dist < this.radius + flipper.length / 2) {
                // Calculate collision response
                const angle = flipper.angle + (flipper.side === 'left' ? Math.PI / 4 : -Math.PI / 4);
                const force = flipper.active ? FLIPPER_FORCE : 8;
                
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
                
                // Move ball away from flipper
                const pushX = (this.x - flipper.x) / dist;
                const pushY = (this.y - flipper.y) / dist;
                this.x = flipper.x + pushX * (this.radius + flipper.length / 2 + 2);
                this.y = flipper.y + pushY * (this.radius + flipper.length / 2 + 2);
                
                playSound('flipper');
            }
        });
    },
    
    checkBumperCollisions() {
        bumpers.forEach(bumper => {
            const dist = Math.sqrt((this.x - bumper.x) ** 2 + (this.y - bumper.y) ** 2);
            if (dist < this.radius + bumper.radius) {
                // Bounce off bumper
                const angle = Math.atan2(this.y - bumper.y, this.x - bumper.x);
                const force = 12;
                
                this.vx = Math.cos(angle) * force;
                this.vy = Math.sin(angle) * force;
                
                // Move ball away from bumper
                this.x = bumper.x + Math.cos(angle) * (this.radius + bumper.radius + 2);
                this.y = bumper.y + Math.sin(angle) * (this.radius + bumper.radius + 2);
                
                // Score and effects
                bumper.hit();
                addScore(100);
                playSound('bumper');
            }
        });
    },
    
    checkTargetCollisions() {
        targets.forEach((target, index) => {
            if (!target.hit && 
                this.x > target.x - target.width/2 && 
                this.x < target.x + target.width/2 &&
                this.y > target.y - target.height/2 && 
                this.y < target.y + target.height/2) {
                
                target.hit = true;
                target.hitTime = Date.now();
                addScore(200);
                playSound('target');
                
                // Slight bounce
                this.vy = -Math.abs(this.vy) * 0.5;
            }
        });
    },
    
    draw() {
        // Draw trail
        ctx.globalAlpha = 0.3;
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length;
            const radius = this.radius * alpha;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw ball
        const gradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Flipper objects
const flippers = [
    {
        x: 300,
        y: 850,
        angle: Math.PI / 6,
        restAngle: Math.PI / 6,
        activeAngle: -Math.PI / 6,
        length: 80,
        width: 15,
        side: 'left',
        active: false,
        activation: 0
    },
    {
        x: 500,
        y: 850,
        angle: -Math.PI / 6,
        restAngle: -Math.PI / 6,
        activeAngle: Math.PI / 6,
        length: 80,
        width: 15,
        side: 'right',
        active: false,
        activation: 0
    }
];

// Bumper objects
const bumpers = [
    { x: 200, y: 300, radius: 40, hitTime: 0, hitAnimation: 0 },
    { x: 400, y: 200, radius: 40, hitTime: 0, hitAnimation: 0 },
    { x: 600, y: 300, radius: 40, hitTime: 0, hitAnimation: 0 },
    { x: 300, y: 450, radius: 35, hitTime: 0, hitAnimation: 0 },
    { x: 500, y: 450, radius: 35, hitTime: 0, hitAnimation: 0 },
    { x: 400, y: 600, radius: 30, hitTime: 0, hitAnimation: 0 }
];

bumpers.forEach(bumper => {
    bumper.hit = function() {
        this.hitTime = Date.now();
        this.hitAnimation = 1;
    };
});

// Target objects
const targets = [
    { x: 150, y: 500, width: 60, height: 20, hit: false, hitTime: 0 },
    { x: 250, y: 550, width: 60, height: 20, hit: false, hitTime: 0 },
    { x: 550, y: 550, width: 60, height: 20, hit: false, hitTime: 0 },
    { x: 650, y: 500, width: 60, height: 20, hit: false, hitTime: 0 }
];

// Particle system for effects
const particles = [];

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            decay: 0.02,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Sound system (simple audio feedback)
function playSound(type) {
    // Create audio context if not exists
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    
    // Different sounds for different events
    switch (type) {
        case 'flipper':
            oscillator.frequency.setValueAtTime(220, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, window.audioContext.currentTime + 0.1);
            break;
        case 'bumper':
            oscillator.frequency.setValueAtTime(440, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, window.audioContext.currentTime + 0.1);
            break;
        case 'target':
            oscillator.frequency.setValueAtTime(660, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1320, window.audioContext.currentTime + 0.2);
            break;
        case 'launch':
            oscillator.frequency.setValueAtTime(110, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, window.audioContext.currentTime + 0.3);
            break;
        case 'drain':
            oscillator.frequency.setValueAtTime(330, window.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, window.audioContext.currentTime + 0.5);
            break;
        case 'wall':
            oscillator.frequency.setValueAtTime(200, window.audioContext.currentTime);
            break;
    }
    
    gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.3);
    
    oscillator.start(window.audioContext.currentTime);
    oscillator.stop(window.audioContext.currentTime + 0.3);
}

// Game functions
function addScore(points) {
    score += points * multiplier;
    
    // Increase multiplier on successive hits
    multiplier = Math.min(multiplier + 0.1, 5);
    multiplierTimer = 60; // Reset timer
    
    updateUI();
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = Math.floor(score);
    document.getElementById('livesDisplay').textContent = lives;
}

function showGameOverScreen() {
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('gameOverScreen').style.display = 'block';
}

function restartGame() {
    gameState = 'launching';
    score = 0;
    lives = 3;
    multiplier = 1;
    multiplierTimer = 0;
    
    // Reset targets
    targets.forEach(target => {
        target.hit = false;
        target.hitTime = 0;
    });
    
    // Reset ball
    ball.reset();
    
    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';
    
    updateUI();
}

// Input handling
canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    
    if (gameState === 'launching') {
        // Check if in launcher area
        if (mouse.x > 700 && mouse.y > 800) {
            mouse.dragStart = { x: mouse.x, y: mouse.y };
            document.getElementById('powerIndicator').style.display = 'block';
        }
    } else if (gameState === 'playing') {
        // Activate flippers
        activateFlippers();
    } else if (gameState === 'start') {
        gameState = 'launching';
    }
});

canvas.addEventListener('mouseup', (e) => {
    mouse.down = false;
    
    if (gameState === 'launching' && mouse.dragStart) {
        // Launch ball
        const power = Math.min(Math.abs(mouse.y - mouse.dragStart.y), 200);
        ball.launch(power);
        mouse.dragStart = null;
        document.getElementById('powerIndicator').style.display = 'none';
    }
    
    // Deactivate flippers
    flippers.forEach(flipper => {
        flipper.active = false;
    });
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Calculate mouse speed for nudging
    const speed = Math.sqrt((mouse.x - lastMousePos.x) ** 2 + (mouse.y - lastMousePos.y) ** 2);
    mouseSpeed = speed;
    
    // Mouse-based flipper control
    if (gameState === 'playing') {
        if (mouse.x < canvas.width / 2) {
            flippers[0].active = true; // Left flipper
        }
        if (mouse.x > canvas.width / 2) {
            flippers[1].active = true; // Right flipper
        }
    }
    
    // Update power indicator during launch drag
    if (gameState === 'launching' && mouse.dragStart && mouse.down) {
        const power = Math.min(Math.abs(mouse.y - mouse.dragStart.y), 200);
        const powerPercent = (power / 200) * 100;
        document.getElementById('powerFill').style.height = powerPercent + '%';
    }
    
    // Table nudge (if mouse moving fast while held down)
    if (mouse.down && gameState === 'playing' && mouseSpeed > 20) {
        const nudgeX = (mouse.x - lastMousePos.x) * 0.1;
        ball.vx += nudgeX * NUDGE_FORCE;
    }
    
    lastMousePos = { x: mouse.x, y: mouse.y };
});

function activateFlippers() {
    flippers.forEach(flipper => {
        flipper.active = true;
        flipper.activation = 1;
    });
}

// Drawing functions
function drawPlayfield() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a2b5c');
    gradient.addColorStop(1, '#0f1b3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Walls
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, 20, canvas.height); // Left wall
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height); // Right wall
    ctx.fillRect(0, 0, canvas.width, 20); // Top wall
    
    // Launcher area
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(680, 800, 120, 200);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(680, 800, 120, 200);
    
    // Launcher text
    if (gameState === 'launching') {
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DRAG DOWN', 740, 820);
        ctx.fillText('TO LAUNCH', 740, 840);
    }
}

function drawFlippers() {
    flippers.forEach(flipper => {
        // Update flipper animation
        if (flipper.active) {
            flipper.angle += (flipper.activeAngle - flipper.angle) * 0.3;
            flipper.activation = Math.max(flipper.activation - 0.05, 0);
        } else {
            flipper.angle += (flipper.restAngle - flipper.angle) * 0.2;
        }
        
        ctx.save();
        ctx.translate(flipper.x, flipper.y);
        ctx.rotate(flipper.angle);
        
        // Flipper glow when active
        if (flipper.active) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        
        // Flipper body
        ctx.fillStyle = flipper.active ? '#FFD700' : '#999999';
        ctx.fillRect(-flipper.length / 2, -flipper.width / 2, flipper.length, flipper.width);
        
        // Flipper pivot
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.shadowBlur = 0;
    });
}

function drawBumpers() {
    bumpers.forEach(bumper => {
        // Update hit animation
        if (bumper.hitAnimation > 0) {
            bumper.hitAnimation -= 0.05;
            bumper.hitAnimation = Math.max(bumper.hitAnimation, 0);
        }
        
        const size = bumper.radius + bumper.hitAnimation * 10;
        const glow = bumper.hitAnimation * 20;
        
        // Bumper glow
        if (glow > 0) {
            ctx.shadowColor = '#FF4444';
            ctx.shadowBlur = glow;
        }
        
        // Bumper body
        const gradient = ctx.createRadialGradient(
            bumper.x - 5, bumper.y - 5, 0,
            bumper.x, bumper.y, size
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#FF6B6B');
        gradient.addColorStop(1, '#CC2222');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    });
}

function drawTargets() {
    targets.forEach(target => {
        if (target.hit) {
            // Flash effect for hit targets
            const flash = Math.sin((Date.now() - target.hitTime) * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 215, 0, ${flash})`;
        } else {
            ctx.fillStyle = '#4CAF50';
        }
        
        ctx.fillRect(
            target.x - target.width / 2,
            target.y - target.height / 2,
            target.width,
            target.height
        );
        
        // Target border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            target.x - target.width / 2,
            target.y - target.height / 2,
            target.width,
            target.height
        );
    });
}

function drawUI() {
    // Score multiplier indicator
    if (multiplier > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplier.toFixed(1)}x`, canvas.width / 2, 50);
    }
    
    // Game state messages
    if (gameState === 'start') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PINGBALL', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 + 20);
    }
}

// Game loop
function gameLoop() {
    // Update
    if (gameState === 'playing') {
        ball.update();
        
        // Update multiplier timer
        if (multiplierTimer > 0) {
            multiplierTimer--;
        } else {
            multiplier = Math.max(multiplier - 0.01, 1);
        }
    }
    
    updateParticles();
    
    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawPlayfield();
    drawBumpers();
    drawTargets();
    drawFlippers();
    
    if (gameState !== 'start') {
        ball.draw();
    }
    
    drawParticles();
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
updateUI();
gameLoop();

// Auto-resize canvas for mobile
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = Math.min(1000, window.innerHeight - 200);
    
    const scale = Math.min(maxWidth / 800, maxHeight / 1000);
    
    canvas.style.width = (800 * scale) + 'px';
    canvas.style.height = (1000 * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();