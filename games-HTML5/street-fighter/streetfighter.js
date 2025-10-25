// Street Fighter 2D Fighting Game - Ultra-Detailed Implementation with AI
class StreetFighterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        
        // Game State
        this.gameState = 'ROUND_START'; // ROUND_START, FIGHTING, ROUND_END, GAME_OVER
        this.currentRound = 1;
        this.maxRounds = 3;
        this.roundTimer = 99;
        this.timerCount = 0;
        
        // Input System
        this.keys = {};
        this.inputBuffer = { p1: [], p2: [] };
        this.bufferSize = 15; // frames
        
        // Fighters
        this.player1 = null;
        this.player2 = null;
        
        // Collision System
        this.hitboxes = [];
        this.hurtboxes = [];
        
        // Visual Effects
        this.particles = [];
        this.hitEffects = [];
        this.screenShake = { intensity: 0, duration: 0 };
        
        // Audio System
        this.sounds = {};
        this.soundEnabled = true;
        
        // Round System
        this.p1Wins = 0;
        this.p2Wins = 0;
        
        this.init();
    }
    
    init() {
        console.log('Initializing Street Fighter game components...');
        this.setupEventListeners();
        this.loadSounds();
        this.createFighters();
        this.startRound();
        this.gameLoop();
        console.log('Game initialization complete!');
    }
    
    loadSounds() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Sound effect frequencies
        this.soundFreqs = {
            hit: 440,
            block: 220,
            special: 660,
            ko: 110,
            jump: 330,
            whoosh: 880
        };
    }
    
    playSound(type, duration = 100) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(this.soundFreqs[type] || 440, this.audioContext.currentTime);
        oscillator.type = type === 'ko' ? 'sawtooth' : 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    setupEventListeners() {
        // Track key hold times for energy ball charging
        this.keyHoldTimes = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.addToInputBuffer(e.code);
            
            // Initialize hold time tracking
            if (!this.keyHoldTimes[e.code]) {
                this.keyHoldTimes[e.code] = 0;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Handle directional attacks on key release
            const player = this.getPlayerFromKey(e.code);
            if (player && !player.isAI) {
                this.handleAttackInput(e.code, player);
            }
            
            // Reset hold time on key release
            this.keyHoldTimes[e.code] = 0;
        });
    }
    
    handleAttackInput(keyCode, player) {
        const holdTime = this.keyHoldTimes[keyCode] || 0;
        
        // Energy ball charging (hold left or right for 1 second = 60 frames)
        if (keyCode === 'ArrowLeft' && holdTime >= 60) {
            if (player.canShoot()) {
                player.chargeEnergyBall('left');
            }
            return;
        } else if (keyCode === 'ArrowRight' && holdTime >= 60) {
            if (player.canShoot()) {
                player.chargeEnergyBall('right');
            }
            return;
        }
        
        // Regular attacks only if not charging
        if (holdTime < 60 && player.canAttack()) {
            // Check for combinations first
            if (keyCode === 'ArrowUp') {
                if (this.keys['ArrowLeft']) {
                    player.attack('upLeftKick');
                } else if (this.keys['ArrowRight']) {
                    player.attack('upRightKick');
                } else {
                    player.attack('highKick');
                }
            } else if (keyCode === 'ArrowDown') {
                if (this.keys['ArrowLeft']) {
                    player.attack('downLeftKick');
                } else if (this.keys['ArrowRight']) {
                    player.attack('downRightKick');
                } else {
                    player.attack('lowKick');
                }
            } else if (keyCode === 'ArrowLeft') {
                player.attack('leftPunch');
            } else if (keyCode === 'ArrowRight') {
                player.attack('rightPunch');
            }
        }
    }
    
    addToInputBuffer(keyCode) {
        const player = this.getPlayerFromKey(keyCode);
        if (player) {
            const direction = this.getDirectionFromKey(keyCode);
            const button = this.getButtonFromKey(keyCode);
            
            if (direction || button) {
                player.inputBuffer.push({
                    input: direction || button,
                    frame: this.frameCount
                });
                
                // Keep buffer size manageable
                if (player.inputBuffer.length > this.bufferSize) {
                    player.inputBuffer.shift();
                }
            }
        }
    }
    
    getPlayerFromKey(keyCode) {
        const p1Keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        const p2Keys = []; // AI controlled
        
        if (p1Keys.includes(keyCode)) return this.player1;
        if (p2Keys.includes(keyCode)) return this.player2;
        return null;
    }
    
    getDirectionFromKey(keyCode) {
        const directions = {
            'KeyW': 'up', 'KeyA': 'left', 'KeyS': 'down', 'KeyD': 'right'
        };
        return directions[keyCode];
    }
    
    getButtonFromKey(keyCode) {
        const buttons = {
            'ArrowLeft': 'leftPunch', 'ArrowRight': 'rightPunch',
            'ArrowUp': 'highKick', 'ArrowDown': 'lowKick'
        };
        return buttons[keyCode];
    }
    
    createFighters() {
        this.player1 = new Fighter({
            name: 'Ryu',
            x: 200,
            y: 500,
            facing: 1,
            color: '#FFFFFF',
            controls: {
                up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD',
                leftPunch: 'ArrowLeft', rightPunch: 'ArrowRight',
                highKick: 'ArrowUp', lowKick: 'ArrowDown'
            },
            archetype: 'shoto',
            isAI: false
        });
        
        this.player2 = new Fighter({
            name: 'Ken',
            x: 1000,
            y: 500,
            facing: -1,
            color: '#FFD700',
            controls: {
                up: 'Numpad8', left: 'Numpad4', down: 'Numpad5', right: 'Numpad6',
                LP: 'Numpad1', MP: 'Numpad2', HP: 'Numpad3',
                LK: 'Numpad7', MK: 'Numpad8', HK: 'Numpad9'
            },
            archetype: 'shoto',
            isAI: true,
            aiDifficulty: 'easy' // Make AI easier
        });
    }
    
    startRound() {
        this.gameState = 'ROUND_START';
        this.roundTimer = 99;
        this.timerCount = 0;
        
        // Reset fighters
        this.player1.reset(200, 500);
        this.player2.reset(1000, 500);
        
        // Update UI
        this.updateHUD();
        this.showGameState(`ROUND ${this.currentRound}`);
        this.playSound('whoosh', 200);
        
        setTimeout(() => {
            this.gameState = 'FIGHTING';
            this.hideGameState();
        }, 2000);
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.frameCount++;
        
        // 60 FPS frame checking
        if (this.deltaTime >= 16.67) {
            this.update();
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Update key hold times for energy ball charging
        Object.keys(this.keys).forEach(key => {
            if (this.keys[key]) {
                this.keyHoldTimes[key] = (this.keyHoldTimes[key] || 0) + 1;
            }
        });
        
        if (this.gameState === 'FIGHTING') {
            this.updateTimer();
            this.updateFighters();
            this.checkCollisions();
            this.checkRoundEnd();
        }
        
        this.updateParticles();
        this.updateHitEffects();
        this.updateScreenShake();
    }
    
    updateTimer() {
        this.timerCount++;
        if (this.timerCount >= 60) { // 1 second at 60 FPS
            this.roundTimer--;
            this.timerCount = 0;
            document.getElementById('gameTimer').textContent = this.roundTimer;
            
            if (this.roundTimer <= 0) {
                this.endRound('TIME_UP');
            }
        }
    }
    
    updateFighters() {
        this.player1.update(this.keys, this.player2);
        this.player2.update(this.keys, this.player1);
        
        // Check special move inputs
        this.checkSpecialMoves(this.player1);
        this.checkSpecialMoves(this.player2);
    }
    
    checkSpecialMoves(fighter) {
        const buffer = fighter.inputBuffer;
        
        // Hadouken: ↓↘→ + Punch
        if (this.checkMotion(buffer, ['down', 'right'], ['LP', 'MP', 'HP'])) {
            fighter.performSpecialMove('hadouken');
        }
        
        // Shoryuken: →↓↘ + Punch  
        if (this.checkMotion(buffer, ['right', 'down', 'right'], ['LP', 'MP', 'HP'])) {
            fighter.performSpecialMove('shoryuken');
        }
        
        // Tatsumaki: ↓↙← + Kick
        if (this.checkMotion(buffer, ['down', 'left'], ['LP', 'MP', 'HP'])) {
            fighter.performSpecialMove('tatsumaki');
        }
    }
    
    checkMotion(buffer, motionInputs, buttonInputs) {
        if (buffer.length < motionInputs.length + 1) return false;
        
        let motionIndex = 0;
        let foundButton = false;
        
        // Check last 10 frames for motion
        for (let i = Math.max(0, buffer.length - 10); i < buffer.length; i++) {
            const input = buffer[i];
            
            if (motionIndex < motionInputs.length && input.input === motionInputs[motionIndex]) {
                motionIndex++;
            }
            
            if (buttonInputs.includes(input.input)) {
                foundButton = true;
            }
        }
        
        return motionIndex === motionInputs.length && foundButton;
    }
    
    checkCollisions() {
        // Check hitbox vs hurtbox collisions
        for (let hitbox of this.player1.hitboxes) {
            for (let hurtbox of this.player2.hurtboxes) {
                if (this.boxCollision(hitbox, hurtbox)) {
                    this.processHit(this.player1, this.player2, hitbox);
                }
            }
        }
        
        for (let hitbox of this.player2.hitboxes) {
            for (let hurtbox of this.player1.hurtboxes) {
                if (this.boxCollision(hitbox, hurtbox)) {
                    this.processHit(this.player2, this.player1, hitbox);
                }
            }
        }
        
        // Check projectile collisions
        this.checkProjectileCollisions();
    }
    
    checkProjectileCollisions() {
        // Player 1 projectiles vs Player 2
        for (let i = this.player1.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.player1.projectiles[i];
            for (let hurtbox of this.player2.hurtboxes) {
                if (this.boxCollision(projectile, hurtbox)) {
                    this.processHit(this.player1, this.player2, projectile);
                    this.player1.projectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        // Player 2 projectiles vs Player 1
        for (let i = this.player2.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.player2.projectiles[i];
            for (let hurtbox of this.player1.hurtboxes) {
                if (this.boxCollision(projectile, hurtbox)) {
                    this.processHit(this.player2, this.player1, projectile);
                    this.player2.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    boxCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    processHit(attacker, defender, hitbox) {
        // Damage calculation
        let damage = hitbox.damage;
        
        // Apply hit
        defender.takeDamage(damage);
        attacker.gainMeter(10);
        
        // Hit effects
        this.createHitEffect(hitbox.x + hitbox.width/2, hitbox.y + hitbox.height/2);
        this.addScreenShake(5, 10);
        this.playSound('hit', 150);
        
        // Flash health bar
        this.flashHealthBar(defender === this.player1 ? 'p1' : 'p2');
        
        // Knockback
        defender.applyKnockback(hitbox.knockback * attacker.facing);
        
        // Hit stun
        defender.enterHitStun(hitbox.hitStun);
        
        // Combo system
        if (defender.inHitStun) {
            attacker.comboCount++;
            this.showComboCounter(attacker.comboCount);
            
            // Special combo effects
            if (attacker.comboCount >= 5) {
                this.showSpecialEffect('AMAZING!');
            } else if (attacker.comboCount >= 3) {
                this.showSpecialEffect('COMBO!');
            }
        } else {
            attacker.comboCount = 1;
        }
        
        // Clear hitbox to prevent multiple hits
        attacker.clearHitboxes();
    }
    
    checkRoundEnd() {
        if (this.player1.health <= 0) {
            this.endRound('P2_WIN');
        } else if (this.player2.health <= 0) {
            this.endRound('P1_WIN');
        }
    }
    
    endRound(result) {
        this.gameState = 'ROUND_END';
        
        if (result === 'P1_WIN') {
            this.p1Wins++;
            this.updateRoundIndicator('p1', this.p1Wins);
            this.showGameState('PLAYER 1 WINS');
            this.showKO();
            this.playSound('ko', 1000);
            
            // Check for perfect victory
            if (this.player1.health === this.player1.maxHealth) {
                setTimeout(() => this.showPerfectEffect(), 1000);
            }
        } else if (result === 'P2_WIN') {
            this.p2Wins++;
            this.updateRoundIndicator('p2', this.p2Wins);
            this.showGameState('PLAYER 2 WINS');
            this.showKO();
            this.playSound('ko', 1000);
            
            // Check for perfect victory
            if (this.player2.health === this.player2.maxHealth) {
                setTimeout(() => this.showPerfectEffect(), 1000);
            }
        } else if (result === 'TIME_UP') {
            // Determine winner by health
            if (this.player1.health > this.player2.health) {
                this.p1Wins++;
                this.updateRoundIndicator('p1', this.p1Wins);
                this.showGameState('TIME UP - PLAYER 1 WINS');
            } else if (this.player2.health > this.player1.health) {
                this.p2Wins++;
                this.updateRoundIndicator('p2', this.p2Wins);
                this.showGameState('TIME UP - PLAYER 2 WINS');
            } else {
                this.showGameState('TIME UP - DRAW');
            }
        }
        
        // Check if game is over
        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            setTimeout(() => {
                this.gameState = 'GAME_OVER';
                const winner = this.p1Wins >= 2 ? 'PLAYER 1' : 'PLAYER 2';
                this.showGameState(`${winner} WINS THE MATCH!`);
                this.playSound('whoosh', 500);
                this.createVictoryParticles();
            }, 3000);
        } else {
            // Next round
            setTimeout(() => {
                this.currentRound++;
                this.startRound();
            }, 3000);
        }
    }
    
    createHitEffect(x, y) {
        this.hitEffects.push({
            x: x,
            y: y,
            size: 30,
            alpha: 1,
            life: 0
        });
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: '#FFD700'
            });
        }
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateHitEffects() {
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.life++;
            effect.alpha = 1 - (effect.life / 20);
            effect.size += 2;
            
            if (effect.alpha <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
    }
    
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration--;
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #228B22 100%)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#4682B4');
        gradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.screenShake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 600, this.canvas.width, 100);
        
        // Draw stage elements
        this.drawStageElements();
        
        // Draw fighters
        this.player1.render(this.ctx);
        this.player2.render(this.ctx);
        
        // Draw projectiles
        this.player1.projectiles.forEach(p => p.render(this.ctx));
        this.player2.projectiles.forEach(p => p.render(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.restore();
        });
        
        // Draw hit effects
        this.hitEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Reset transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    drawStageElements() {
        // Draw mountains in background
        this.ctx.fillStyle = '#4A5568';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 400);
        this.ctx.lineTo(200, 200);
        this.ctx.lineTo(400, 350);
        this.ctx.lineTo(600, 180);
        this.ctx.lineTo(800, 300);
        this.ctx.lineTo(1000, 150);
        this.ctx.lineTo(1200, 250);
        this.ctx.lineTo(1200, 400);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw clouds
        this.drawCloud(150, 80, 40);
        this.drawCloud(400, 120, 35);
        this.drawCloud(700, 60, 45);
        this.drawCloud(950, 100, 38);
    }
    
    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y - size * 0.6, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateHUD() {
        // Update health bars
        const p1HealthPercent = (this.player1.health / this.player1.maxHealth) * 100;
        const p2HealthPercent = (this.player2.health / this.player2.maxHealth) * 100;
        
        document.getElementById('p1Health').style.width = p1HealthPercent + '%';
        document.getElementById('p2Health').style.width = p2HealthPercent + '%';
        
        // Update super meters
        const p1SuperPercent = (this.player1.superMeter / this.player1.maxSuperMeter) * 100;
        const p2SuperPercent = (this.player2.superMeter / this.player2.maxSuperMeter) * 100;
        
        document.getElementById('p1Super').style.width = p1SuperPercent + '%';
        document.getElementById('p2Super').style.width = p2SuperPercent + '%';
    }
    
    updateRoundIndicator(player, wins) {
        for (let i = 1; i <= wins; i++) {
            document.getElementById(`${player}Round${i}`).classList.add('won');
        }
    }
    
    showGameState(text) {
        document.getElementById('gameStateText').textContent = text;
        document.getElementById('gameStateOverlay').style.display = 'flex';
    }
    
    hideGameState() {
        document.getElementById('gameStateOverlay').style.display = 'none';
    }
    
    showKO() {
        const koEffect = document.getElementById('koEffect');
        koEffect.style.display = 'block';
        setTimeout(() => {
            koEffect.style.display = 'none';
        }, 2000);
    }
    
    showComboCounter(count) {
        if (count > 1) {
            const counter = document.getElementById('comboCounter');
            counter.textContent = `${count} HIT COMBO!`;
            counter.style.display = 'block';
            
            setTimeout(() => {
                counter.style.display = 'none';
            }, 1000);
        }
    }
    
    showSpecialEffect(text) {
        const effect = document.getElementById('specialEffect');
        effect.textContent = text;
        effect.style.display = 'block';
        
        setTimeout(() => {
            effect.style.display = 'none';
        }, 1000);
    }
    
    showPerfectEffect() {
        const effect = document.getElementById('perfectEffect');
        effect.style.display = 'block';
        
        setTimeout(() => {
            effect.style.display = 'none';
        }, 2000);
    }
    
    flashHealthBar(player) {
        const healthBar = document.getElementById(`${player}Health`);
        healthBar.classList.add('health-flash');
        
        setTimeout(() => {
            healthBar.classList.remove('health-flash');
        }, 300);
    }
    
    createVictoryParticles() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: -10,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 3 + 2,
                    life: 60,
                    maxLife: 60,
                    color: ['#FFD700', '#FF6600', '#00FFFF', '#FF0000'][Math.floor(Math.random() * 4)]
                });
            }, i * 50);
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const toggle = document.getElementById('audioToggle');
        toggle.textContent = this.soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF';
    }
}

// Fighter Class with AI
class Fighter {
    constructor(config) {
        this.name = config.name;
        this.x = config.x;
        this.y = config.y;
        this.facing = config.facing;
        this.color = config.color;
        this.controls = config.controls;
        this.archetype = config.archetype;
        this.isAI = config.isAI || false;
        this.aiDifficulty = config.aiDifficulty || 'medium';
        
        // AI System
        this.aiState = 'neutral'; // neutral, aggressive, defensive, special
        this.aiTimer = 0;
        this.aiReactionDelay = this.getAIReactionDelay();
        this.aiDecisionTimer = 0;
        this.aiLastAction = null;
        
        // Stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxSuperMeter = 100;
        this.superMeter = 0;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.walkSpeed = 3;
        this.onGround = true;
        
        // Dimensions
        this.width = 60;
        this.height = 120;
        
        // Combat
        this.state = 'idle'; // idle, walking, jumping, attacking, hitstun, blocking
        this.animFrame = 0;
        this.attackAnimFrame = 0;
        this.maxAttackAnimFrames = 20;
        this.frameData = {};
        this.hitboxes = [];
        this.hurtboxes = [];
        this.inHitStun = false;
        this.hitStunFrames = 0;
        this.blockStun = false;
        this.blockStunFrames = 0;
        this.comboCount = 0;
        this.currentAttackType = null;
        
        // Animation states
        this.walkCycle = 0;
        this.breatheOffset = 0;
        this.hitShakeFrames = 0;
        this.victoryPose = false;
        
        // Charge system
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        this.maxChargeTime = 120; // 2 seconds at 60fps
        this.lastProjectileTime = 0;
        this.projectileCooldown = 120; // 2 second cooldown
        
        // Input
        this.inputBuffer = [];
        
        // Projectiles
        this.projectiles = [];
        
        this.initFrameData();
        this.createHurtboxes();
    }
    
    getAIReactionDelay() {
        switch (this.aiDifficulty) {
            case 'easy': return 45; // 45 frames delay (much slower)
            case 'medium': return 25; // 25 frames delay
            case 'hard': return 10; // 10 frames delay
            default: return 45; // Default to easy
        }
    }
    
    initFrameData() {
        this.frameData = {
            // Light Punch
            LP: {
                startup: 3,
                active: 2,
                recovery: 6,
                damage: 10,
                hitStun: 8,
                blockStun: 4,
                knockback: 2
            },
            // Medium Punch  
            MP: {
                startup: 5,
                active: 3,
                recovery: 8,
                damage: 15,
                hitStun: 12,
                blockStun: 6,
                knockback: 4
            },
            // Heavy Punch
            HP: {
                startup: 8,
                active: 4,
                recovery: 12,
                damage: 25,
                hitStun: 18,
                blockStun: 10,
                knockback: 8
            },
            // Light Kick
            LK: {
                startup: 4,
                active: 3,
                recovery: 7,
                damage: 12,
                hitStun: 10,
                blockStun: 5,
                knockback: 3
            },
            // Medium Kick
            MK: {
                startup: 6,
                active: 4,
                recovery: 9,
                damage: 18,
                hitStun: 14,
                blockStun: 7,
                knockback: 5
            },
            // Heavy Kick
            HK: {
                startup: 9,
                active: 5,
                recovery: 13,
                damage: 28,
                hitStun: 20,
                blockStun: 11,
                knockback: 10
            }
        };
    }
    
    createHurtboxes() {
        this.hurtboxes = [{
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        }];
    }
    
    update(keys, opponent) {
        if (this.isAI) {
            this.updateAI(opponent);
        } else {
            this.updateInputs(keys);
        }
        
        this.updatePhysics();
        this.updateState();
        this.updateAnimations();
        this.updateProjectiles();
        this.updateHurtboxes();
        this.facing = this.x < opponent.x ? 1 : -1;
        
        // Update hit/block stun
        if (this.hitStunFrames > 0) {
            this.hitStunFrames--;
            this.hitShakeFrames = Math.max(0, this.hitShakeFrames - 1);
            if (this.hitStunFrames <= 0) {
                this.inHitStun = false;
                this.state = 'idle';
            }
        }
        
        if (this.blockStunFrames > 0) {
            this.blockStunFrames--;
            if (this.blockStunFrames <= 0) {
                this.blockStun = false;
                this.state = 'idle';
            }
        }
    }
    
    updateAnimations() {
        // Walking cycle
        if (this.state === 'walking') {
            this.walkCycle += 0.3;
        }
        
        // Breathing animation for idle
        if (this.state === 'idle') {
            this.breatheOffset += 0.1;
        }
        
        // Victory pose
        if (this.health > 0 && game.gameState === 'ROUND_END') {
            this.victoryPose = true;
        } else {
            this.victoryPose = false;
        }
    }
    
    updateAI(opponent) {
        if (this.inHitStun || this.blockStun) return;
        
        this.aiTimer++;
        this.aiDecisionTimer++;
        
        // AI Decision making every 30 frames
        if (this.aiDecisionTimer >= 30) {
            this.makeAIDecision(opponent);
            this.aiDecisionTimer = 0;
        }
        
        // Execute AI behavior
        this.executeAIBehavior(opponent);
    }
    
    makeAIDecision(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        const healthRatio = this.health / this.maxHealth;
        const opponentHealthRatio = opponent.health / opponent.maxHealth;
        
        // Much more passive AI decision tree
        if (distance > 400) {
            // Very far range - mostly approach slowly
            if (Math.random() < 0.3) {
                this.aiState = 'approach';
            } else {
                this.aiState = 'neutral'; // Stand around more
            }
        } else if (distance > 200) {
            // Medium range - less aggressive
            if (healthRatio < 0.2) {
                this.aiState = 'defensive';
            } else if (Math.random() < 0.4) {
                this.aiState = 'approach';
            } else {
                this.aiState = 'neutral';
            }
        } else {
            // Close range - still less aggressive
            if (healthRatio < 0.3) {
                this.aiState = 'defensive';
            } else if (Math.random() < 0.5) {
                this.aiState = 'aggressive';
            } else {
                this.aiState = 'neutral';
            }
        }
        
        // Make easy difficulty even more passive
        if (this.aiDifficulty === 'easy') {
            if (Math.random() < 0.7) {
                this.aiState = 'neutral'; // Be passive 70% of the time
            }
        } else if (this.aiDifficulty === 'hard') {
            // Hard AI is more aggressive and uses specials more
            if (this.superMeter >= 50 && Math.random() < 0.4) {
                this.aiState = 'special';
            }
        }
    }
    
    executeAIBehavior(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        
        switch (this.aiState) {
            case 'approach':
                this.aiApproach(opponent);
                break;
            case 'aggressive':
                this.aiAggressive(opponent);
                break;
            case 'defensive':
                this.aiDefensive(opponent);
                break;
            case 'projectile':
                this.aiProjectile();
                break;
            case 'special':
                this.aiSpecialMove(opponent);
                break;
            default:
                this.aiNeutral();
                break;
        }
    }
    
    aiApproach(opponent) {
        const direction = opponent.x > this.x ? 1 : -1;
        // Move much slower for smoother movement
        const speedMultiplier = this.aiDifficulty === 'easy' ? 0.5 : 0.7;
        this.velocityX = this.walkSpeed * direction * speedMultiplier;
        
        if (this.onGround && this.state === 'idle') {
            this.state = 'walking';
        }
    }
    
    aiAggressive(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        
        if (distance < 100 && this.canAttack()) {
            // Much less frequent attacks, especially on easy
            const attackChance = Math.random();
            if (this.aiDifficulty === 'easy') {
                // Only attack 20% of the time when in range
                if (attackChance < 0.2) {
                    this.attack('LP'); // Only use light punch
                }
            } else if (this.aiDifficulty === 'medium') {
                if (attackChance < 0.3) this.attack('LP');
                else if (attackChance < 0.5) this.attack('MP');
            } else { // hard
                if (attackChance < 0.3) this.attack('LP');
                else if (attackChance < 0.6) this.attack('MP');
                else this.attack('HP');
            }
        } else {
            // Move more slowly and predictably
            this.aiApproach(opponent);
        }
    }
    
    aiDefensive(opponent) {
        // Back away from opponent
        const direction = opponent.x > this.x ? -1 : 1;
        this.velocityX = this.walkSpeed * direction * 0.8;
        
        // Jump away occasionally
        if (Math.random() < 0.1 && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
            this.state = 'jumping';
        }
        
        // Counter attack if opponent is close
        const distance = Math.abs(this.x - opponent.x);
        if (distance < 80 && this.canAttack() && Math.random() < 0.3) {
            this.attack('MP');
        }
    }
    
    aiProjectile() {
        if (this.canAttack() && Math.random() < 0.2) {
            this.performSpecialMove('hadouken');
        }
    }
    
    aiSpecialMove(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        
        if (distance < 100 && this.canAttack()) {
            // Use Shoryuken for anti-air or close combat
            if (Math.random() < 0.4) {
                this.performSpecialMove('shoryuken');
            } else {
                this.performSpecialMove('tatsumaki');
            }
        } else if (distance > 200 && this.canAttack()) {
            this.performSpecialMove('hadouken');
        }
    }
    
    aiNeutral() {
        // Slow movement and occasional jumps
        this.velocityX *= 0.9;
        
        if (Math.random() < 0.05 && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
            this.state = 'jumping';
        }
    }
    
    updateInputs(keys) {
        if (this.inHitStun || this.blockStun) return;
        
        // Movement with WASD
        if (keys[this.controls.left]) {
            this.velocityX = -this.walkSpeed;
            if (this.onGround && this.state === 'idle') {
                this.state = 'walking';
            }
        } else if (keys[this.controls.right]) {
            this.velocityX = this.walkSpeed;
            if (this.onGround && this.state === 'idle') {
                this.state = 'walking';
            }
        } else {
            this.velocityX *= 0.8; // Friction
            if (this.onGround && this.state === 'walking') {
                this.state = 'idle';
            }
        }
        
        // Jump
        if (keys[this.controls.up] && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
            this.state = 'jumping';
            game.playSound('jump', 100);
        }
        
        // Block with down key
        if (keys[this.controls.down] && this.onGround) {
            this.state = 'blocking';
        }
    }
    
    // Remove the old getKeyHeldTime method since we're handling this in the game class now
    chargeEnergyBall(direction) {
        if (this.canShoot()) {
            this.state = 'attacking';
            this.attackAnimFrame = 0;
            this.currentAttackType = 'energy_ball';
            this.maxAttackAnimFrames = 30;
            
            // Create energy ball projectile
            this.projectiles.push(new Projectile({
                x: this.x + (this.facing > 0 ? this.width : 0),
                y: this.y + 40,
                velocityX: 10 * this.facing,
                velocityY: 0,
                damage: 20,
                life: 120,
                chargeLevel: 3 // Fully charged energy ball
            }));
            
            this.lastProjectileTime = game.frameCount;
            game.playSound('special', 200);
        }
    }
    
    startCharging() {
        this.isCharging = true;
        this.chargeStartTime = game.frameCount;
        this.chargeLevel = 0;
        this.state = 'charging';
    }
    
    updateCharge() {
        const chargeTime = game.frameCount - this.chargeStartTime;
        this.chargeLevel = Math.min(chargeTime / this.maxChargeTime, 1);
    }
    
    releaseCharge() {
        if (this.isCharging && this.chargeLevel > 0.2) {
            // Check cooldown
            if (game.frameCount - this.lastProjectileTime >= this.projectileCooldown) {
                this.chargedHadouken();
                this.lastProjectileTime = game.frameCount;
            }
        }
        this.isCharging = false;
        this.chargeLevel = 0;
        this.state = 'idle';
    }
    
    chargedHadouken() {
        this.state = 'attacking';
        this.attackAnimFrame = 0;
        this.currentAttackType = 'charged_hadouken';
        this.maxAttackAnimFrames = 40;
        
        // More powerful projectile based on charge level
        const power = 1 + this.chargeLevel;
        this.projectiles.push(new Projectile({
            x: this.x + (this.facing > 0 ? this.width : 0),
            y: this.y + 40,
            velocityX: 8 * this.facing * power,
            velocityY: 0,
            damage: Math.floor(15 * power),
            life: Math.floor(120 * power),
            type: 'charged_fireball',
            chargeLevel: this.chargeLevel
        }));
        
        game.playSound('special', 300);
        game.showSpecialEffect('CHARGED HADOUKEN!');
    }
    
    updatePhysics() {
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity;
        }
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Ground collision
        if (this.y >= 500) {
            this.y = 500;
            this.velocityY = 0;
            this.onGround = true;
            if (this.state === 'jumping') {
                this.state = 'idle';
            }
        }
        
        // Stage boundaries
        this.x = Math.max(50, Math.min(this.x, 1150));
    }
    
    updateState() {
        if (this.state === 'attacking') {
            this.animFrame++;
            this.attackAnimFrame++;
            
            // End attack animation
            if (this.attackAnimFrame >= this.maxAttackAnimFrames) {
                this.state = 'idle';
                this.attackAnimFrame = 0;
                this.currentAttackType = null;
                this.clearHitboxes();
            }
        }
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            if (projectile.x < 0 || projectile.x > 1200 || projectile.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateHurtboxes() {
        this.hurtboxes[0].x = this.x;
        this.hurtboxes[0].y = this.y;
    }
    
    canAttack() {
        return this.state === 'idle' || this.state === 'walking';
    }
    
    canShoot() {
        if (!this.lastProjectileTime) this.lastProjectileTime = 0;
        if (!this.projectileCooldown) this.projectileCooldown = 120; // 2 second cooldown
        return (game.frameCount - this.lastProjectileTime) >= this.projectileCooldown;
    }
    
    attack(attackType) {
        this.state = 'attacking';
        this.animFrame = 0;
        this.attackAnimFrame = 0;
        this.currentAttack = attackType;
        this.currentAttackType = attackType;
        
        // Set frame data for new attack types
        const newFrameData = {
            leftPunch: { startup: 3, active: 4, recovery: 8, damage: 12, hitStun: 8, blockStun: 4, knockback: 2 },
            rightPunch: { startup: 3, active: 4, recovery: 8, damage: 12, hitStun: 8, blockStun: 4, knockback: 2 },
            highKick: { startup: 6, active: 6, recovery: 12, damage: 18, hitStun: 12, blockStun: 6, knockback: 4 },
            lowKick: { startup: 4, active: 5, recovery: 10, damage: 15, hitStun: 10, blockStun: 5, knockback: 3 },
            upLeftKick: { startup: 8, active: 8, recovery: 15, damage: 22, hitStun: 15, blockStun: 8, knockback: 5 },
            upRightKick: { startup: 8, active: 8, recovery: 15, damage: 22, hitStun: 15, blockStun: 8, knockback: 5 },
            downLeftKick: { startup: 5, active: 6, recovery: 11, damage: 16, hitStun: 11, blockStun: 6, knockback: 3 },
            downRightKick: { startup: 5, active: 6, recovery: 11, damage: 16, hitStun: 11, blockStun: 6, knockback: 3 }
        };
        
        const frameData = newFrameData[attackType] || this.frameData[attackType];
        this.maxAttackAnimFrames = frameData.startup + frameData.active + frameData.recovery;
        
        // Create hitbox after startup frames
        setTimeout(() => {
            this.createDirectionalHitbox(attackType);
        }, frameData.startup * 16.67); // Convert frames to milliseconds
        
        game.playSound('whoosh', 80);
    }
    
    createDirectionalHitbox(attackType) {
        let hitboxConfig = {
            damage: 12,
            hitStun: 8,
            blockStun: 4,
            knockback: 2
        };
        
        // Set hitbox position and size based on attack direction
        switch (attackType) {
            case 'leftPunch':
                hitboxConfig.x = this.x + (this.facing > 0 ? -50 : this.width + 10);
                hitboxConfig.y = this.y + 30;
                hitboxConfig.width = 50;
                hitboxConfig.height = 25;
                break;
            case 'rightPunch':
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width + 10 : -50);
                hitboxConfig.y = this.y + 30;
                hitboxConfig.width = 50;
                hitboxConfig.height = 25;
                break;
            case 'highKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width : -40);
                hitboxConfig.y = this.y + 10;
                hitboxConfig.width = 40;
                hitboxConfig.height = 35;
                hitboxConfig.damage = 18;
                break;
            case 'lowKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width : -40);
                hitboxConfig.y = this.y + 60;
                hitboxConfig.width = 40;
                hitboxConfig.height = 25;
                hitboxConfig.damage = 15;
                break;
            case 'upLeftKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? -30 : this.width - 20);
                hitboxConfig.y = this.y + 5;
                hitboxConfig.width = 50;
                hitboxConfig.height = 40;
                hitboxConfig.damage = 22;
                break;
            case 'upRightKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width - 20 : -30);
                hitboxConfig.y = this.y + 5;
                hitboxConfig.width = 50;
                hitboxConfig.height = 40;
                hitboxConfig.damage = 22;
                break;
            case 'downLeftKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? -35 : this.width - 15);
                hitboxConfig.y = this.y + 55;
                hitboxConfig.width = 50;
                hitboxConfig.height = 30;
                hitboxConfig.damage = 16;
                break;
            case 'downRightKick':
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width - 15 : -35);
                hitboxConfig.y = this.y + 55;
                hitboxConfig.width = 50;
                hitboxConfig.height = 30;
                hitboxConfig.damage = 16;
                break;
            default:
                // Fallback to original hitbox
                hitboxConfig.x = this.x + (this.facing > 0 ? this.width : -40);
                hitboxConfig.y = this.y + 20;
                hitboxConfig.width = 40;
                hitboxConfig.height = 30;
        }
        
        this.hitboxes.push(hitboxConfig);
    }
    
    clearHitboxes() {
        this.hitboxes = [];
    }
    
    performSpecialMove(moveName) {
        if (!this.canAttack()) return;
        
        switch (moveName) {
            case 'hadouken':
                this.hadouken();
                break;
            case 'shoryuken':
                this.shoryuken();
                break;
            case 'tatsumaki':
                this.tatsumaki();
                break;
        }
    }
    
    hadouken() {
        this.state = 'attacking';
        this.attackAnimFrame = 0;
        this.currentAttackType = 'hadouken';
        this.maxAttackAnimFrames = 30;
        
        this.projectiles.push(new Projectile({
            x: this.x + (this.facing > 0 ? this.width : 0),
            y: this.y + 40,
            velocityX: 8 * this.facing,
            velocityY: 0,
            damage: 15,
            life: 120,
            type: 'fireball'
        }));
        
        game.playSound('special', 200);
        game.showSpecialEffect('HADOUKEN!');
    }
    
    shoryuken() {
        this.state = 'attacking';
        this.attackAnimFrame = 0;
        this.currentAttackType = 'shoryuken';
        this.maxAttackAnimFrames = 40;
        this.velocityY = -12;
        this.onGround = false;
        
        game.playSound('special', 300);
        game.showSpecialEffect('SHORYUKEN!');
        
        // Create multiple hitboxes during rise
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.hitboxes.push({
                    x: this.x,
                    y: this.y - 20,
                    width: this.width,
                    height: 40,
                    damage: 20,
                    hitStun: 15,
                    blockStun: 8,
                    knockback: 6
                });
            }, i * 50);
        }
    }
    
    tatsumaki() {
        this.state = 'attacking';
        this.attackAnimFrame = 0;
        this.currentAttackType = 'tatsumaki';
        this.maxAttackAnimFrames = 50;
        this.velocityX = 6 * this.facing;
        
        game.playSound('special', 250);
        game.showSpecialEffect('TATSUMAKI!');
        
        // Spinning hitbox
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                this.hitboxes = [{
                    x: this.x - 20,
                    y: this.y,
                    width: this.width + 40,
                    height: this.height,
                    damage: 12,
                    hitStun: 10,
                    blockStun: 6,
                    knockback: 3
                }];
            }, i * 60);
        }
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        game.updateHUD();
    }
    
    gainMeter(amount) {
        this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + amount);
        game.updateHUD();
    }
    
    applyKnockback(force) {
        this.velocityX += force;
    }
    
    enterHitStun(frames) {
        this.inHitStun = true;
        this.hitStunFrames = frames;
        this.hitShakeFrames = 10; // Add shake effect when hit
        this.state = 'hitstun';
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.superMeter = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.state = 'idle';
        this.inHitStun = false;
        this.hitStunFrames = 0;
        this.blockStun = false;
        this.blockStunFrames = 0;
        this.comboCount = 0;
        this.projectiles = [];
        this.clearHitboxes();
        
        // Reset AI state
        this.aiState = 'neutral';
        this.aiTimer = 0;
        this.aiDecisionTimer = 0;
    }
    
    render(ctx) {
        // Calculate animation offsets
        let offsetY = 0;
        let armExtend = 0;
        let legOffset = 0;
        let bodyLean = 0;
        let headBob = 0;
        let armSwing = 0;
        
        // Hit shake effect
        let shakeX = 0, shakeY = 0;
        if (this.hitShakeFrames > 0) {
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        }
        
        if (this.state === 'attacking' && this.currentAttackType) {
            // Attack animation based on type
            const progress = this.attackAnimFrame / this.maxAttackAnimFrames;
            const attackPunch = Math.sin(progress * Math.PI);
            
            // New directional attack animations
            if (this.currentAttackType === 'leftPunch') {
                armExtend = -attackPunch * 45; // Left arm extends
                bodyLean = -attackPunch * 15;
                offsetY = attackPunch * -5;
            } else if (this.currentAttackType === 'rightPunch') {
                armExtend = attackPunch * 45; // Right arm extends
                bodyLean = attackPunch * 15;
                offsetY = attackPunch * -5;
            } else if (this.currentAttackType === 'highKick') {
                legOffset = attackPunch * 60; // High kick
                bodyLean = attackPunch * -20;
                offsetY = attackPunch * -20;
                armExtend = attackPunch * 25; // Arms up for balance
            } else if (this.currentAttackType === 'lowKick') {
                legOffset = attackPunch * 50; // Low sweep kick
                bodyLean = attackPunch * 25;
                offsetY = attackPunch * 10; // Crouch down
                armExtend = -attackPunch * 15;
            } else if (this.currentAttackType === 'upLeftKick') {
                legOffset = attackPunch * 55; // Diagonal up-left kick
                bodyLean = -attackPunch * 30;
                offsetY = attackPunch * -25;
                armExtend = -attackPunch * 20;
                headBob = attackPunch * 8;
            } else if (this.currentAttackType === 'upRightKick') {
                legOffset = attackPunch * 55; // Diagonal up-right kick
                bodyLean = attackPunch * 30;
                offsetY = attackPunch * -25;
                armExtend = attackPunch * 20;
                headBob = attackPunch * 8;
            } else if (this.currentAttackType === 'downLeftKick') {
                legOffset = attackPunch * 45; // Diagonal down-left kick
                bodyLean = -attackPunch * 20;
                offsetY = attackPunch * 15;
                armExtend = -attackPunch * 10;
            } else if (this.currentAttackType === 'downRightKick') {
                legOffset = attackPunch * 45; // Diagonal down-right kick
                bodyLean = attackPunch * 20;
                offsetY = attackPunch * 15;
                armExtend = attackPunch * 10;
            }
            // Legacy attack types for AI compatibility
            else if (this.currentAttackType === 'LP') {
                armExtend = attackPunch * 35;
                bodyLean = attackPunch * 8;
            } else if (this.currentAttackType === 'MP') {
                armExtend = attackPunch * 45;
                bodyLean = attackPunch * 12;
                offsetY = attackPunch * -8;
            } else if (this.currentAttackType === 'HP') {
                armExtend = attackPunch * 60;
                bodyLean = attackPunch * 20;
                offsetY = attackPunch * -15;
                headBob = attackPunch * 5;
            } else if (this.currentAttackType === 'LK') {
                legOffset = attackPunch * 40;
                bodyLean = attackPunch * 10;
            } else if (this.currentAttackType === 'MK') {
                legOffset = attackPunch * 50;
                bodyLean = attackPunch * 15;
                offsetY = attackPunch * -5;
            } else if (this.currentAttackType === 'HK') {
                legOffset = attackPunch * 70;
                bodyLean = attackPunch * 25;
                offsetY = attackPunch * -10;
                headBob = attackPunch * 8;
            }
        } else if (this.state === 'charging') {
            // Charging animation
            const chargeIntensity = this.chargeLevel;
            offsetY = Math.sin(game.frameCount * 0.3) * chargeIntensity * 5;
            armExtend = -20 * chargeIntensity;
            bodyLean = Math.sin(game.frameCount * 0.2) * chargeIntensity * 8;
            headBob = -3 * chargeIntensity;
        } else if (this.state === 'walking') {
            const walkBounce = Math.sin(this.walkCycle) * 5;
            const walkLean = Math.sin(this.walkCycle) * 3;
            offsetY = Math.abs(walkBounce);
            legOffset = Math.sin(this.walkCycle) * 15;
            armSwing = Math.sin(this.walkCycle + Math.PI) * 10;
            bodyLean = walkLean;
            headBob = Math.sin(this.walkCycle) * 2;
        } else if (this.state === 'jumping') {
            offsetY = -10;
            legOffset = -20;
            armExtend = -15;
            bodyLean = this.velocityY > 0 ? 8 : -8;
        } else if (this.state === 'idle') {
            // Breathing animation
            const breathe = Math.sin(this.breatheOffset) * 2;
            offsetY = breathe;
            headBob = breathe * 0.5;
        } else if (this.state === 'hitstun') {
            bodyLean = this.facing * -15;
            headBob = -5;
        }
        
        // Victory pose
        if (this.victoryPose) {
            armExtend = 25;
            offsetY = -5;
            headBob = 3;
            bodyLean = 0;
        }
        
        const centerX = this.x + this.width / 2 + shakeX;
        const baseY = this.y + offsetY + shakeY;
        
        // Set color and thickness based on character - 1.5x larger
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 12; // 1.5x thicker lines (was 8)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw stick figure with thick lines - 1.5x scale
        ctx.beginPath();
        
        // Head (bigger circle) - 1.5x larger
        const headX = centerX + bodyLean * 0.3;
        const headY = baseY + 27 + headBob; // 18 * 1.5 = 27
        ctx.arc(headX, headY, 24, 0, Math.PI * 2); // 16 * 1.5 = 24
        ctx.stroke();
        
        // Body (thicker vertical line with lean) - 1.5x longer
        const bodyTopX = centerX;
        const bodyTopY = baseY + 51; // 34 * 1.5 = 51
        const bodyBottomX = centerX + bodyLean;
        const bodyBottomY = baseY + 127.5; // 85 * 1.5 = 127.5
        
        ctx.beginPath();
        ctx.moveTo(bodyTopX, bodyTopY);
        ctx.lineTo(bodyBottomX, bodyBottomY);
        ctx.stroke();
        
        // Arms with dynamic positioning - proportionally smaller
        const shoulderX = centerX + bodyLean * 0.5;
        const shoulderY = baseY + 75; // 50 * 1.5 = 75
        
        // Reduce arm size relative to body (0.8x instead of 1.5x)
        const armScale = 0.8;
        
        // Left arm (back arm) - smaller relative to body
        const leftArmEndX = shoulderX - (30 * armScale) + armSwing - (this.facing < 0 ? armExtend : 0);
        const leftArmEndY = shoulderY + (15 * armScale) + Math.sin(this.walkCycle) * 8;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(leftArmEndX, leftArmEndY);
        ctx.stroke();
        
        // Left forearm - smaller
        ctx.beginPath();
        ctx.moveTo(leftArmEndX, leftArmEndY);
        ctx.lineTo(leftArmEndX - (15 * armScale), leftArmEndY + (20 * armScale));
        ctx.stroke();
        
        // Right arm (front arm) - extends during attack, smaller
        const rightArmEndX = shoulderX + (30 * armScale) - armSwing + (this.facing > 0 ? armExtend : 0);
        const rightArmEndY = shoulderY + (10 * armScale) + Math.sin(this.walkCycle + Math.PI) * 8;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(rightArmEndX, rightArmEndY);
        ctx.stroke();
        
        // Right forearm - smaller
        const forearmExtend = this.state === 'attacking' ? armExtend * 0.5 : 0;
        ctx.beginPath();
        ctx.moveTo(rightArmEndX, rightArmEndY);
        ctx.lineTo(rightArmEndX + (15 * armScale) + forearmExtend, rightArmEndY + (20 * armScale));
        ctx.stroke();
        
        // Legs with dynamic positioning - 1.5x bigger legs
        const hipX = bodyBottomX;
        const hipY = bodyBottomY;
        const legScale = 1.2; // Increased from 0.8 to 1.2 for bigger legs
        
        // Left leg - bigger
        const leftLegX = hipX - (20 * legScale);
        const leftKneeY = hipY + (25 * legScale);
        const leftFootX = leftLegX + legOffset;
        const leftFootY = baseY + (125 * 1.8); // Increased from 1.2 to 1.8 for longer legs
        
        // Thigh
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(leftLegX, leftKneeY);
        ctx.stroke();
        
        // Shin
        ctx.beginPath();
        ctx.moveTo(leftLegX, leftKneeY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        // Right leg - bigger
        const rightLegX = hipX + (20 * legScale);
        const rightKneeY = hipY + (25 * legScale);
        const rightFootX = rightLegX - legOffset;
        const rightFootY = baseY + (125 * 1.8); // Increased from 1.2 to 1.8 for longer legs
        
        // Thigh
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(rightLegX, rightKneeY);
        ctx.stroke();
        
        // Shin
        ctx.beginPath();
        ctx.moveTo(rightLegX, rightKneeY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // Face details with thicker lines - 1.5x scale
        ctx.fillStyle = '#000000';
        
        // Eyes - larger
        const eyeY = headY - 4.5; // -3 * 1.5 = -4.5
        ctx.beginPath();
        ctx.arc(headX - 9, eyeY, 4.5, 0, Math.PI * 2); // -6 * 1.5 = -9, 3 * 1.5 = 4.5
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(headX + 9, eyeY, 4.5, 0, Math.PI * 2); // 6 * 1.5 = 9, 3 * 1.5 = 4.5
        ctx.fill();
        
        // Facing direction indicator (nose) - larger
        ctx.fillStyle = this.color;
        const noseX = headX + (this.facing > 0 ? 12 : -12); // 8 * 1.5 = 12
        ctx.beginPath();
        ctx.arc(noseX, headY, 3, 0, Math.PI * 2); // 2 * 1.5 = 3
        ctx.fill();
        
        // Special move effects
        if (this.state === 'attacking' && this.currentAttackType) {
            this.drawEnhancedAttackEffect(ctx, centerX, baseY, shoulderX, shoulderY);
        }
        
        // Charging effects
        if (this.state === 'charging') {
            this.drawChargingEffect(ctx, centerX, baseY);
        }
        
        // Cooldown indicator
        if (game.frameCount - this.lastProjectileTime < this.projectileCooldown) {
            this.drawCooldownIndicator(ctx);
        }
        
        // Health indicator above fighter
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 8);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y - 15, this.width, 8);
        }
        
        // AI indicator
        if (this.isAI) {
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('AI', this.x + this.width/2 - 12, this.y - 25);
        }
        
        // Victory effects
        if (this.victoryPose) {
            this.drawVictoryEffect(ctx, centerX, baseY);
        }
        
        // Draw hitboxes (less intrusive)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        this.hitboxes.forEach(hitbox => {
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        });
        
        // Draw hurtboxes (very subtle)
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.lineWidth = 1;
        this.hurtboxes.forEach(hurtbox => {
            ctx.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
        });
    }
    
    drawEnhancedAttackEffect(ctx, centerX, baseY, shoulderX, shoulderY) {
        const progress = this.attackAnimFrame / this.maxAttackAnimFrames;
        const attackX = shoulderX + (this.facing * 40);
        const attackY = shoulderY + 10;
        
        if (this.currentAttackType === 'LP') {
            // Light punch - yellow energy burst
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 6;
            
            // Main impact circle
            ctx.beginPath();
            ctx.arc(attackX, attackY, progress * 25, 0, Math.PI * 2);
            ctx.stroke();
            
            // Energy lines
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const lineLength = progress * 20;
                ctx.beginPath();
                ctx.moveTo(attackX, attackY);
                ctx.lineTo(attackX + Math.cos(angle) * lineLength, attackY + Math.sin(angle) * lineLength);
                ctx.stroke();
            }
            
        } else if (this.currentAttackType === 'MP') {
            // Medium punch - orange explosive effect
            ctx.strokeStyle = '#FF8800';
            ctx.lineWidth = 8;
            
            // Multiple expanding rings
            for (let ring = 0; ring < 4; ring++) {
                ctx.beginPath();
                ctx.arc(attackX, attackY, progress * (30 + ring * 8), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Radiating energy
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const burstLength = progress * 35;
                const burstX = attackX + Math.cos(angle) * burstLength;
                const burstY = attackY + Math.sin(angle) * burstLength;
                
                ctx.beginPath();
                ctx.arc(burstX, burstY, 4, 0, Math.PI * 2);
                ctx.stroke();
            }
            
        } else if (this.currentAttackType === 'HP') {
            // Heavy punch - red devastating explosion
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 10;
            
            // Main explosion
            for (let ring = 0; ring < 6; ring++) {
                ctx.beginPath();
                ctx.arc(attackX, attackY, progress * (40 + ring * 10), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Lightning-like sparks
            ctx.lineWidth = 4;
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const sparkLength = progress * 50;
                let sparkX = attackX;
                let sparkY = attackY;
                
                // Zigzag spark effect
                for (let j = 0; j < 4; j++) {
                    const segmentLength = sparkLength / 4;
                    const newX = sparkX + Math.cos(angle + (Math.random() - 0.5)) * segmentLength;
                    const newY = sparkY + Math.sin(angle + (Math.random() - 0.5)) * segmentLength;
                    
                    ctx.beginPath();
                    ctx.moveTo(sparkX, sparkY);
                    ctx.lineTo(newX, newY);
                    ctx.stroke();
                    
                    sparkX = newX;
                    sparkY = newY;
                }
            }
            
            // Inner white core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(attackX, attackY, progress * 20, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.currentAttackType === 'LK') {
            // Light kick - green energy sweep
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 5;
            
            const kickX = centerX + (this.facing * 30);
            const kickY = baseY + 90;
            
            // Sweep arc
            ctx.beginPath();
            ctx.arc(kickX, kickY, progress * 30, 0, Math.PI);
            ctx.stroke();
            
            // Energy trail
            for (let i = 0; i < 4; i++) {
                const trailAngle = progress * Math.PI + (i * 0.2);
                const trailX = kickX + Math.cos(trailAngle) * 25;
                const trailY = kickY - Math.sin(trailAngle) * 25;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            
        } else if (this.currentAttackType === 'MK') {
            // Medium kick - blue energy burst
            ctx.strokeStyle = '#0080FF';
            ctx.lineWidth = 6;
            
            const kickX = centerX + (this.facing * 35);
            const kickY = baseY + 85;
            
            // Impact burst
            for (let ring = 0; ring < 3; ring++) {
                ctx.beginPath();
                ctx.arc(kickX, kickY, progress * (25 + ring * 8), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Leg energy
            ctx.beginPath();
            ctx.moveTo(centerX, baseY + 80);
            ctx.lineTo(kickX, kickY);
            ctx.lineWidth = 8;
            ctx.stroke();
            
        } else if (this.currentAttackType === 'HK') {
            // Heavy kick - purple devastating impact
            ctx.strokeStyle = '#8000FF';
            ctx.lineWidth = 8;
            
            const kickX = centerX + (this.facing * 45);
            const kickY = baseY + 80;
            
            // Massive impact explosion
            for (let ring = 0; ring < 5; ring++) {
                ctx.beginPath();
                ctx.arc(kickX, kickY, progress * (35 + ring * 12), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Energy shockwaves
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const waveLength = progress * 60;
                const waveX = kickX + Math.cos(angle) * waveLength;
                const waveY = kickY + Math.sin(angle) * waveLength;
                
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(kickX, kickY);
                ctx.lineTo(waveX, waveY);
                ctx.stroke();
            }
            
            // Inner core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(kickX, kickY, progress * 25, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.currentAttackType === 'charged_hadouken') {
            // Charged hadouken - much more intense
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 10;
            
            // Massive energy explosion
            for (let ring = 0; ring < 8; ring++) {
                ctx.beginPath();
                ctx.arc(centerX, baseY + 45, progress * (50 + ring * 15), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Lightning bolts
            for (let i = 0; i < 20; i++) {
                const boltAngle = (i / 20) * Math.PI * 2;
                const boltLength = progress * 100;
                let boltX = centerX;
                let boltY = baseY + 45;
                
                for (let j = 0; j < 6; j++) {
                    const segmentLength = boltLength / 6;
                    const newX = boltX + Math.cos(boltAngle + (Math.random() - 0.5) * 0.5) * segmentLength;
                    const newY = boltY + Math.sin(boltAngle + (Math.random() - 0.5) * 0.5) * segmentLength;
                    
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(boltX, boltY);
                    ctx.lineTo(newX, newY);
                    ctx.stroke();
                    
                    boltX = newX;
                    boltY = newY;
                }
            }
            
        } else if (this.currentAttackType === 'hadouken') {
            // Hadouken charging effect - enhanced
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 6;
            
            // Swirling energy
            for (let spiral = 0; spiral < 3; spiral++) {
                ctx.beginPath();
                for (let i = 0; i <= 20; i++) {
                    const angle = (i / 20) * Math.PI * 4 + spiral * Math.PI * 2 / 3;
                    const radius = (1 - progress) * (40 + spiral * 10) * (i / 20);
                    const x = centerX + Math.cos(angle) * radius;
                    const y = baseY + 45 + Math.sin(angle) * radius;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            // Energy particles with trails
            for (let i = 0; i < 12; i++) {
                const angle = (game.frameCount * 0.05 + i) * Math.PI / 6;
                const radius = (1 - progress) * 50;
                const particleX = centerX + Math.cos(angle) * radius;
                const particleY = baseY + 45 + Math.sin(angle) * radius;
                
                // Particle trail
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(particleX, particleY);
                ctx.lineTo(centerX, baseY + 45);
                ctx.stroke();
                
                // Particle core
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(particleX, particleY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
        } else if (this.currentAttackType === 'shoryuken') {
            // Shoryuken rising dragon effect - enhanced
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 8;
            
            // Dragon spiral rising upward
            for (let spiral = 0; spiral < 2; spiral++) {
                ctx.beginPath();
                for (let i = 0; i <= 30; i++) {
                    const heightProgress = i / 30;
                    const angle = heightProgress * Math.PI * 6 + spiral * Math.PI;
                    const radius = 25 * Math.sin(heightProgress * Math.PI);
                    const y = baseY + 80 - (progress * 100 * heightProgress);
                    const x = centerX + Math.cos(angle) * radius;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            // Rising energy bolts
            for (let i = 0; i < 8; i++) {
                const boltHeight = progress * 120;
                const boltX = centerX + (Math.random() - 0.5) * 60;
                const boltY = baseY + 80 - boltHeight + (i * 15);
                
                ctx.strokeStyle = i % 2 === 0 ? '#FFD700' : '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(boltX, boltY);
                ctx.lineTo(boltX + (Math.random() - 0.5) * 20, boltY - 20);
                ctx.stroke();
            }
            
        } else if (this.currentAttackType === 'tatsumaki') {
            // Tatsumaki hurricane effect - enhanced
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 6;
            
            // Multiple tornado rings
            for (let ring = 0; ring < 4; ring++) {
                ctx.beginPath();
                for (let i = 0; i <= 50; i++) {
                    const angle = (progress * Math.PI * 12) + (i / 50) * Math.PI * 2 + ring;
                    const radius = 20 + ring * 8;
                    const height = (i / 50) * 100;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = baseY + 120 - height;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            // Spinning wind effects
            for (let i = 0; i < 16; i++) {
                const angle = (progress * Math.PI * 8) + (i * Math.PI / 8);
                const windRadius = 40 + Math.sin(progress * Math.PI * 4) * 15;
                const windX = centerX + Math.cos(angle) * windRadius;
                const windY = baseY + 60 + Math.sin(angle * 2) * 20;
                
                ctx.strokeStyle = i % 3 === 0 ? '#00FF00' : '#90EE90';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(windX, windY, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    drawVictoryEffect(ctx, centerX, baseY) {
        // Sparkles around the victorious fighter
        for (let i = 0; i < 8; i++) {
            const angle = (game.frameCount * 0.05 + i) * Math.PI / 4;
            const radius = 80 + Math.sin(game.frameCount * 0.1) * 20;
            const sparkleX = centerX + Math.cos(angle) * radius;
            const sparkleY = baseY + 40 + Math.sin(angle) * 30;
            
            ctx.fillStyle = ['#FFD700', '#FFFFFF', '#00FFFF'][i % 3];
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Sparkle trails
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sparkleX, sparkleY);
            ctx.lineTo(sparkleX - Math.cos(angle) * 10, sparkleY - Math.sin(angle) * 10);
            ctx.stroke();
        }
    }
    
    drawChargingEffect(ctx, centerX, baseY) {
        const chargeIntensity = this.chargeLevel;
        
        // Charging aura
        ctx.strokeStyle = `rgba(0, 255, 255, ${chargeIntensity})`;
        ctx.lineWidth = 4;
        
        // Expanding charge rings
        for (let ring = 0; ring < 4; ring++) {
            const ringRadius = 60 + ring * 20 + Math.sin(game.frameCount * 0.3 + ring) * 10;
            ctx.beginPath();
            ctx.arc(centerX, baseY + 60, ringRadius * chargeIntensity, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Energy particles flowing toward fighter
        for (let i = 0; i < 12; i++) {
            const angle = (game.frameCount * 0.05 + i) * Math.PI / 6;
            const distance = 120 - (chargeIntensity * 60);
            const particleX = centerX + Math.cos(angle) * distance;
            const particleY = baseY + 60 + Math.sin(angle) * distance * 0.5;
            
            ctx.fillStyle = `rgba(255, 255, 0, ${chargeIntensity})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3 + chargeIntensity * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Particle trail toward center
            ctx.strokeStyle = `rgba(255, 255, 0, ${chargeIntensity * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(particleX, particleY);
            ctx.lineTo(centerX, baseY + 60);
            ctx.stroke();
        }
        
        // Charge level indicator
        ctx.fillStyle = `rgba(0, 255, 255, ${chargeIntensity})`;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`CHARGING... ${Math.floor(chargeIntensity * 100)}%`, this.x, this.y - 30);
    }
    
    drawCooldownIndicator(ctx) {
        const cooldownProgress = (game.frameCount - this.lastProjectileTime) / this.projectileCooldown;
        const cooldownRemaining = 1 - cooldownProgress;
        
        if (cooldownRemaining > 0) {
            // Cooldown bar
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(this.x, this.y - 40, this.width * cooldownRemaining, 6);
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y - 40, this.width, 6);
            
            // Cooldown text
            ctx.fillStyle = '#FF0000';
            ctx.font = '12px Arial';
            ctx.fillText('COOLDOWN', this.x, this.y - 45);
        }
    }
}

// Enhanced Projectile Class
class Projectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.velocityX = config.velocityX;
        this.velocityY = config.velocityY;
        this.damage = config.damage;
        this.life = config.life;
        this.maxLife = config.life;
        this.type = config.type;
        this.chargeLevel = config.chargeLevel || 0;
        this.width = 25 + (this.chargeLevel * 15);
        this.height = 25 + (this.chargeLevel * 15);
        this.hitStun = 12;
        this.blockStun = 6;
        this.knockback = 4;
        this.rotation = 0;
        this.pulseSize = 0;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
        this.rotation += 0.3;
        this.pulseSize = Math.sin(game.frameCount * 0.2) * 5;
    }
    
    render(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const lifeRatio = this.life / this.maxLife;
        const baseSize = (25 + this.pulseSize) * (1 + this.chargeLevel);
        const isCharged = this.chargeLevel > 0;
        
        ctx.save();
        
        // Outer glow effect - more intense for charged
        const glowSize = baseSize * (isCharged ? 3 : 2);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
        
        if (isCharged) {
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Main energy ball with rotation
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // Outer energy ring
        ctx.strokeStyle = isCharged ? '#FF00FF' : '#00FFFF';
        ctx.lineWidth = isCharged ? 6 : 4;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner energy core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy crackling effect - more for charged
        const crackleCount = isCharged ? 12 : 8;
        ctx.strokeStyle = isCharged ? '#FF00FF' : '#00FFFF';
        ctx.lineWidth = isCharged ? 3 : 2;
        
        for (let i = 0; i < crackleCount; i++) {
            const angle = (i / crackleCount) * Math.PI * 2;
            const innerRadius = baseSize * 0.3;
            const outerRadius = baseSize * 0.9;
            const zigzag = Math.sin(this.rotation * 4 + i) * (isCharged ? 8 : 5);
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            ctx.lineTo(Math.cos(angle) * outerRadius + zigzag, Math.sin(angle) * outerRadius + zigzag);
            ctx.stroke();
        }
        
        // Spinning energy fragments
        const fragmentCount = isCharged ? 8 : 6;
        for (let i = 0; i < fragmentCount; i++) {
            const fragmentAngle = this.rotation * 2 + (i * Math.PI * 2 / fragmentCount);
            const fragmentRadius = baseSize * 1.2;
            const fragmentX = Math.cos(fragmentAngle) * fragmentRadius;
            const fragmentY = Math.sin(fragmentAngle) * fragmentRadius;
            
            ctx.fillStyle = isCharged ? '#FFFF00' : '#FFFF00';
            ctx.beginPath();
            ctx.arc(fragmentX, fragmentY, isCharged ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Particle trail effect - more intense for charged
        const particleChance = isCharged ? 0.8 : 0.6;
        if (Math.random() < particleChance) {
            const particleCount = isCharged ? 5 : 3;
            for (let i = 0; i < particleCount; i++) {
                game.particles.push({
                    x: centerX + (Math.random() - 0.5) * baseSize,
                    y: centerY + (Math.random() - 0.5) * baseSize,
                    vx: -this.velocityX * 0.3 + (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: isCharged ? 20 : 15,
                    maxLife: isCharged ? 20 : 15,
                    color: isCharged ? ['#FF00FF', '#FFFFFF', '#FFFF00'][i % 3] : ['#00FFFF', '#FFFFFF', '#FFFF00'][i % 3]
                });
            }
        }
        
        // Impact ripples when projectile is about to expire
        if (this.life < 10) {
            const rippleColor = isCharged ? `rgba(255, 0, 255, ${this.life / 10})` : `rgba(0, 255, 255, ${this.life / 10})`;
            ctx.strokeStyle = rippleColor;
            ctx.lineWidth = isCharged ? 4 : 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, baseSize * (2 + i) * (1 - this.life / 10), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    console.log('Page loaded, initializing Street Fighter game...');
    try {
        game = new StreetFighterGame();
        console.log('Street Fighter game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});