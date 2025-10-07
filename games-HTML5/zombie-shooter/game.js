// Game constants
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GREEN = '#00FF00';
const BLUE = '#0000FF';
const YELLOW = '#FFFF00';
const GRAY = '#808080';
const ORANGE = '#FFA500';
const GOLD = '#FFD700';

// --- Simple WebAudio-based sound helper (synthesized) ---
class AudioManager {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.35;
            this.masterGain.connect(this.ctx.destination);
            this.enabled = true;
        } catch (err) {
            this.ctx = null;
            this.enabled = false;
        }
        this.musicOsc = null;
    }

    playClick() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(900, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.6, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(this.masterGain);
        o.start(t); o.stop(t + 0.2);
    }

    playShoot() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1200, t);
        o.frequency.exponentialRampToValueAtTime(600, t + 0.12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g); g.connect(this.masterGain);
        o.start(t); o.stop(t + 0.15);
    }

    playDeath() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(600, t);
        o.frequency.exponentialRampToValueAtTime(200, t + 0.25);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g); g.connect(this.masterGain);
        o.start(t); o.stop(t + 0.3);
    }

    startMusic() {
        if (!this.ctx || this.musicOsc) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(220, t);
        g.gain.value = 0.06;
        o.connect(g); g.connect(this.masterGain);
        o.start(t);
        this.musicOsc = o;
    }

    stopMusic() {
        if (!this.ctx || !this.musicOsc) return;
        try { this.musicOsc.stop(); } catch (e) {}
        this.musicOsc = null;
    }
}

// Lightweight particle used for explosions and bullet impacts
class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life; this.size = size; this.color = color;
    }
    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt * 0.06; // scale down for sensible speed
        this.y += this.vy * dt * 0.06;
        // simple drag
        this.vx *= 0.98; this.vy *= 0.98;
    }
    draw(ctx) {
        const t = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.pow(t, 0.9);
        ctx.fillStyle = this.color;
        const s = this.size * (1 + (1 - t) * 0.6);
        ctx.beginPath();
        ctx.arc(this.x, this.y, s, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    reset(x, y, vx, vy, life, size, color) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life; this.size = size; this.color = color;
    }
}

// Floating damage number popup
class DamagePopup {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color || YELLOW;
        this.life = 800; this.maxLife = 800; this.vy = -0.05 - Math.random() * 0.06; this.vx = (Math.random()-0.5)*0.04; this.scale = 1.0;
    }
    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.scale = 1 + (1 - this.life/this.maxLife) * 0.3;
    }
    draw(ctx) {
        const t = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.pow(t, 1.2);
        ctx.fillStyle = this.color;
        // allow override via this.font
        const fontSpec = this.font || `${Math.round(18 * this.scale)}px Arial`;
        ctx.font = `bold ${fontSpec}`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
    reset(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color || YELLOW;
        this.life = 800; this.maxLife = 800; this.vy = -0.05 - Math.random() * 0.06; this.vx = (Math.random()-0.5)*0.04; this.scale = 1.0;
    }
}


// ...existing code...

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 5;
        this.color = 'white';
        this.scale = 1;
        this.speedBoost = 1;
        this.speedMultiplier = 1;
        this.damageMultiplier = 1;
        this.gunDamageMultiplier = 1;
        this.gunSpeedMultiplier = 1;
        this.isMultiColor = false;
        this.lastShot = 0;
        this.baseShootDelay = 200;
        this.shootDelay = 200;
    this.lastRedShot = 0; // cooldown tracker for red wave attack
        this.baseHealth = 10;
        this.health = 10;
        this.maxHealth = 10;
        this.lastDamageTime = 0;
        this.damageCooldown = 1000;
        this.gunAngle = 0;
        this.fireAnimationTime = 0;
        this.isMouseShooting = false;
        this.equippedPet = null;
    }

    updatePetBonuses() {
        // Apply pet health bonuses
        if (this.equippedPet === 'turtle') {
            this.maxHealth = this.baseHealth * 2; // 2x health
        } else if (this.equippedPet === 'parrot') {
            this.maxHealth = this.baseHealth * 2; // 2x health
        } else if (this.equippedPet === 'capybarra') {
            this.maxHealth = this.baseHealth * 5; // 5x health
        } else {
            this.maxHealth = this.baseHealth;
        }
        
        // Scale current health appropriately
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health * (this.maxHealth / this.baseHealth), this.maxHealth);
        } else if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }

    updateShootSpeed(level) {
        const speedMultiplier = 2 ** (level - 1);
        const gunSpeedBonus = this.gunSpeedMultiplier || 1;
        this.shootDelay = Math.max(25, this.baseShootDelay / (speedMultiplier * gunSpeedBonus));
    }

    update(keys, mousePos) {
        const actualSpeed = this.speed * (this.speedBoost || 1) * (this.speedMultiplier || 1);

        // Apply pet speed boost
        let petSpeedBoost = 1;
        if (this.equippedPet === 'dog') {
            petSpeedBoost = 1.5;
        }

        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            this.y -= actualSpeed * petSpeedBoost;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            this.y += actualSpeed * petSpeedBoost;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            this.x -= actualSpeed * petSpeedBoost;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            this.x += actualSpeed * petSpeedBoost;
        }

        this.x = Math.max(this.size * this.scale, Math.min(SCREEN_WIDTH - this.size * this.scale, this.x));
        this.y = Math.max(this.size * this.scale, Math.min(SCREEN_HEIGHT - this.size * this.scale, this.y));

        // Update gun angle to point toward mouse
        if (mousePos) {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            this.gunAngle = Math.atan2(dy, dx);
        }

        // Update fire animation
        if (this.fireAnimationTime > 0) {
            this.fireAnimationTime -= 16; // Assuming 60fps, ~16ms per frame
        }
    }

    shoot(mousePos, currentTime, level, autoFire = false) {
        const shouldShoot = autoFire || this.isMouseShooting;
        if (currentTime - this.lastShot > this.shootDelay && shouldShoot) {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const bullets = [];

            if (distance > 0) {
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                const baseAngle = Math.atan2(normalizedDy, normalizedDx);

                let isRed = level >= 7;
                let isWhite = level >= 13;
                let isRedWave = false;
                let damage = 1;
                let numStreams = 1;

                // Strong red special attack unlocks at level 26 and replaces white bullets
                if (level >= 26) {
                    // Only fire the strong red bullet every 5 seconds
                    if (currentTime - (this.lastRedShot || 0) >= 5000) {
                        // Single-direction strong red: fires one large bullet in aim direction
                        const waveBaseWhiteDamage = 15; // white bullet base damage
                        let waveDamage = waveBaseWhiteDamage * 50; // 50x white damage
                        waveDamage = waveDamage * 1000; // make current damage 1000x stronger (one-shot intent)
                        const smallRedSize = 3; // base small bullet size
                        const waveSize = smallRedSize * 100 * 0.6; // reduce previous 100x size by 40% -> 60x

                        const angle = baseAngle; // fire in the direction the player is aiming
                        const speed = 12;
                        const dxWave = Math.cos(angle) * speed;
                        const dyWave = Math.sin(angle) * speed;
                        const startX = this.x + Math.cos(angle) * (this.size + 6);
                        const startY = this.y + Math.sin(angle) * (this.size + 6);

                        const waveBullet = new Bullet(startX, startY, dxWave, dyWave, waveDamage, true, false, 1, true);
                        waveBullet.size = waveSize;

                        this.lastRedShot = currentTime;
                        this.lastShot = currentTime;
                        this.fireAnimationTime = 150;
                        return [waveBullet];
                    } else {
                        // Replace normal/white bullets while at level 26+: do not fire the usual stream
                        return [];
                    }
                }

                if (level >= 13) {
                    // Level 13+: White bullets with even more damage
                    damage = 15;
                    numStreams = Math.floor((level - 13) / 2) + 1; // Level 13-14 = 1 stream, 15-16 = 2 streams, etc.
                    isWhite = true;
                    isRed = false;
                } else if (level >= 7) {
                    // Level 7-12: Red bullets
                    damage = 7;
                    numStreams = level - 6;
                    isRed = true;
                } else {
                    // Level 1-6: Yellow bullets
                    damage = 1;
                    numStreams = level < 3 ? 1 : level;
                }

                const spread = Math.PI / 3;
                const startAngle = numStreams > 1 ? baseAngle - spread/2 : baseAngle;
                const angleStep = numStreams > 1 ? spread / (numStreams - 1) : 0;

                for (let i = 0; i < numStreams; i++) {
                    const angle = startAngle + i * angleStep;
                    const bulletDx = Math.cos(angle) * 10;
                    const bulletDy = Math.sin(angle) * 10;
                    let skinDamage = damage * (this.damageMultiplier || 1);
                    let finalDamage = skinDamage * (this.gunDamageMultiplier || 1);
                    
                    // Apply pet damage bonuses
                    if (this.equippedPet === 'turtle') {
                        finalDamage *= 1.2; // 1.2x damage bonus
                    } else if (this.equippedPet === 'parrot') {
                        finalDamage *= 3; // 3x damage bonus
                    } else if (this.equippedPet === 'capybarra') {
                        finalDamage *= 5; // 5x damage bonus
                    }
                    
                    // Calculate gun tip position
                    const gunLength = 25 * this.scale;
                    const gunOffsetX = (this.size * this.scale) + 5;
                    const totalGunLength = gunOffsetX + gunLength;
                    
                    // Calculate bullet spawn position at gun tip
                    const bulletStartX = this.x + Math.cos(this.gunAngle) * totalGunLength;
                    const bulletStartY = this.y + Math.sin(this.gunAngle) * totalGunLength;
                    
                    // Apply pet coin boost
                    let coinMultiplier = 1;
                    if (this.equippedPet === 'cat') {
                        coinMultiplier = 2;
                    }
                    
                            bullets.push(new Bullet(bulletStartX, bulletStartY, bulletDx, bulletDy, finalDamage, isRed, isWhite, coinMultiplier));
                }
            }

            this.lastShot = currentTime;
            this.fireAnimationTime = 150; // Fire animation duration in ms
            return bullets;
        }
        return [];
    }

    takeDamage(currentTime) {
        if (currentTime - this.lastDamageTime > this.damageCooldown) {
            this.health -= 1;
            this.lastDamageTime = currentTime;
            return this.health <= 0;
        }
        return false;
    }

    draw(ctx) {
        if (this.isMultiColor) {
            // Draw multi-colored player (red and white halves)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI, false);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI, true);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI * 2);
            ctx.fillStyle = this.color || 'white';
            ctx.fill();
        }

        // Draw rotated gun
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.gunAngle);
        
        const gunLength = 25 * this.scale;
        const gunWidth = 4 * this.scale;
        const gunOffsetX = (this.size * this.scale) + 5;
        
        ctx.fillStyle = '#444444';
        ctx.fillRect(gunOffsetX, -gunWidth/2, gunLength, gunWidth);
        
        // Gun tip
        ctx.fillStyle = '#222222';
        ctx.fillRect(gunOffsetX + gunLength - 3, -gunWidth/2 - 1, 3, gunWidth + 2);
        
        // Fire animation
        if (this.fireAnimationTime > 0) {
            const fireLength = 15 * this.scale;
            const fireWidth = 8 * this.scale;
            const fireIntensity = this.fireAnimationTime / 150; // 0 to 1
            
            ctx.fillStyle = `rgba(255, ${100 + Math.floor(155 * fireIntensity)}, 0, ${fireIntensity})`;
            ctx.fillRect(gunOffsetX + gunLength, -fireWidth/2, fireLength * fireIntensity, fireWidth);
            
            // Inner fire core
            ctx.fillStyle = `rgba(255, 255, 255, ${fireIntensity * 0.8})`;
            ctx.fillRect(gunOffsetX + gunLength, -fireWidth/4, fireLength * fireIntensity * 0.6, fireWidth/2);
        }
        
        ctx.restore();

        // Draw equipped pet
        if (this.equippedPet) {
            const petSize = 10;
            const petDistance = 35;
            const petX = this.x + Math.cos(Date.now() * 0.003) * petDistance;
            const petY = this.y + Math.sin(Date.now() * 0.003) * petDistance;
            
            if (this.equippedPet === 'cat') {
                // Draw cat
                ctx.fillStyle = '#FFA500'; // Orange
                ctx.beginPath();
                ctx.arc(petX, petY, petSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Cat ears
                ctx.beginPath();
                ctx.moveTo(petX - 6, petY - 8);
                ctx.lineTo(petX - 2, petY - 15);
                ctx.lineTo(petX + 2, petY - 8);
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(petX + 2, petY - 8);
                ctx.lineTo(petX + 6, petY - 15);
                ctx.lineTo(petX + 10, petY - 8);
                ctx.fill();
            } else if (this.equippedPet === 'dog') {
                // Draw dog
                ctx.fillStyle = '#8B4513'; // Brown
                ctx.beginPath();
                ctx.arc(petX, petY, petSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Dog ears
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.ellipse(petX - 8, petY - 5, 4, 8, Math.PI * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(petX + 8, petY - 5, 4, 8, -Math.PI * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.equippedPet === 'turtle') {
                // Draw turtle (blue - rare pet)
                ctx.fillStyle = '#0066FF'; // Blue shell
                ctx.beginPath();
                ctx.arc(petX, petY, petSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Shell pattern
                ctx.strokeStyle = '#004499';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(petX, petY, petSize - 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Shell segments
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(petX - 6, petY);
                ctx.lineTo(petX + 6, petY);
                ctx.moveTo(petX, petY - 6);
                ctx.lineTo(petX, petY + 6);
                ctx.stroke();
                
                // Head
                ctx.fillStyle = '#0088AA';
                ctx.beginPath();
                ctx.arc(petX + 8, petY - 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.equippedPet === 'parrot') {
                // Draw parrot (rainbow colored - epic pet)
                ctx.fillStyle = '#FF6B35'; // Orange-red
                ctx.beginPath();
                ctx.arc(petX, petY, petSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Rainbow wing pattern
                ctx.fillStyle = '#FFE66D'; // Yellow
                ctx.fillRect(petX - 5, petY - 3, 8, 3);
                ctx.fillStyle = '#06FFA5'; // Green
                ctx.fillRect(petX - 5, petY, 8, 3);
                ctx.fillStyle = '#4ECDC4'; // Blue
                ctx.fillRect(petX - 5, petY + 3, 8, 3);
                
                // Beak
                ctx.fillStyle = '#FFD93D';
                ctx.beginPath();
                ctx.moveTo(petX + 8, petY - 2);
                ctx.lineTo(petX + 12, petY);
                ctx.lineTo(petX + 8, petY + 2);
                ctx.fill();
            } else if (this.equippedPet === 'capybarra') {
                // Draw capybarra (golden - legendary pet)
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.beginPath();
                ctx.arc(petX, petY, petSize + 2, 0, Math.PI * 2); // Slightly bigger
                ctx.fill();
                
                // Legendary glow effect
                for (let i = 0; i < 3; i++) {
                    const glowSize = petSize + 5 + (i * 3);
                    ctx.beginPath();
                    ctx.arc(petX, petY, glowSize, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 - i * 0.1})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Eyes
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(petX - 3, petY - 3, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(petX + 3, petY - 3, 1, 0, Math.PI * 2);
                ctx.fill();
                
                // Nose
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(petX, petY + 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const barWidth = 40;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - (this.size * this.scale) - 15;

        ctx.fillStyle = 'black';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthWidth = (this.health / this.maxHealth) * barWidth;
        const healthColor = this.health > 6 ? 'green' : (this.health > 3 ? 'orange' : 'red');
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}

// Bullet class
class Bullet {
    constructor(x, y, dx, dy, damage = 1, isRed = false, isWhite = false, coinMultiplier = 1, isWave = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 3;
        this.damage = damage;
        this.isRed = isRed;
        this.isWhite = isWhite;
        this.coinMultiplier = coinMultiplier;
        this.isWave = isWave; // special wave bullets (pass-through)
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return this.x < 0 || this.x > SCREEN_WIDTH || this.y < 0 || this.y > SCREEN_HEIGHT;
    }

    draw(ctx) {
        let color;
        if (this.isWhite) {
            color = WHITE;
        } else if (this.isRed) {
            color = RED;
        } else {
            color = YELLOW;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add glow effect for white bullets
        if (this.isWhite) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Boss Bullet class
class BossBullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 20;
        this.damage = 2;
        this.isBossBullet = true;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return this.x < -50 || this.x > SCREEN_WIDTH + 50 || this.y < -50 || this.y > SCREEN_HEIGHT + 50;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();
        
        // Add glow effect
        for (let i = 0; i < 3; i++) {
            const glowSize = this.size + (i * 4);
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Final Boss Bullet class
class FinalBossBullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 8;
        this.damage = 0.5;
        this.isFinalBossBullet = true;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return this.x < -50 || this.x > SCREEN_WIDTH + 50 || this.y < -50 || this.y > SCREEN_HEIGHT + 50;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = GOLD;
        ctx.fill();
        
        // Add glow effect
        for (let i = 0; i < 2; i++) {
            const glowSize = this.size + (i * 3);
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 - i * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Zombie class
class Zombie {
    constructor(x, y, isBuff = false, isGreen = false, isBlack = false, isBlue = false, isWhite = false) {
        this.x = x;
        this.y = y;
        this.isBuff = isBuff;
        this.isGreen = isGreen;
        this.isBlack = isBlack;
        this.isBlue = isBlue;
        this.isWhite = isWhite;
        this.lastShot = 0;
        this.shootDelay = 4000;

        if (isWhite) {
            this.size = 25; // Small white glowing enemy
            this.speed = 2.5; // Fast speed
            this.health = 4032000; // 20x the health of blue mini boss (201600 * 20)
            this.maxHealth = 4032000;
        } else if (isBlue) {
            this.size = 63; // 9x the size of green (7 * 9)
            this.speed = 1.5; // Moderate speed
            this.health = 201600; // 60x stronger than before (3360 * 60)
            this.maxHealth = 201600;
        } else if (isBlack) {
            this.size = 35;
            this.speed = 1.2;
            this.health = 560;
            this.maxHealth = 560;
        } else if (isGreen) {
            this.size = 7;
            this.speed = 2.0;
            this.health = 112;
            this.maxHealth = 112;
        } else if (isBuff) {
            this.size = 45;
            this.speed = 1.0;
            this.health = 16;
            this.maxHealth = 16;
        } else {
            this.size = 15;
            this.speed = 1.5;
            this.health = 2;
            this.maxHealth = 2;
        }
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const normalizedDx = (dx / distance) * this.speed;
            const normalizedDy = (dy / distance) * this.speed;
            this.x += normalizedDx;
            this.y += normalizedDy;
        }
    }

    shoot(currentTime) {
        if (this.isBlack && currentTime - this.lastShot > this.shootDelay) {
            const bullets = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * 2 * Math.PI;
                const dx = Math.cos(angle) * 4;
                const dy = Math.sin(angle) * 4;
                bullets.push(new SmallBullet(this.x, this.y, dx, dy));
            }
            this.lastShot = currentTime;
            return bullets;
        }
        return [];
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    draw(ctx) {
        let color;
        if (this.isWhite) color = WHITE;
        else if (this.isBlue) color = BLUE;
        else if (this.isBlack) color = BLACK;
        else if (this.isGreen) color = GREEN;
        else if (this.isBuff) color = ORANGE;
        else color = this.health === this.maxHealth ? RED : '#960000';

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Add white glow effect for white zombies
        if (this.isWhite) {
            // White glow effect
            for (let i = 0; i < 3; i++) {
                const glowSize = this.size + (i * 8);
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - i * 0.2})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }

        // Add blue glow effect for blue zombies
        if (this.isBlue) {
            // Add MINI BOSS text above blue zombie
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('MINI BOSS', this.x, this.y - this.size - 10);
            ctx.textAlign = 'left';

            // Blue glow effect
            for (let i = 0; i < 2; i++) {
                const glowSize = this.size + (i * 5);
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 0, 255, ${0.4 - i * 0.2})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        if (this.health < this.maxHealth) {
            const barWidth = this.isWhite ? 70 : (this.isBlue ? 60 : (this.isBlack ? 50 : (this.isGreen ? 40 : (this.isBuff ? 30 : 20))));
            const barHeight = this.isWhite ? 12 : (this.isBlue ? 10 : (this.isBlack ? 8 : (this.isGreen ? 8 : (this.isBuff ? 6 : 4))));
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 10;

            ctx.fillStyle = BLACK;
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillStyle = GREEN;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
    }
}

// Small Bullet class for black zombies
class SmallBullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 4;
        this.damage = 1;
        this.isEnemyBullet = true;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return this.x < -30 || this.x > SCREEN_WIDTH + 30 || this.y < -30 || this.y > SCREEN_HEIGHT + 30;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();
    }
}

// Boss class
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60;
        this.speed = 0.8;
        this.health = 25200;
        this.maxHealth = 25200;
        this.damage = 5;
        this.lastShot = 0;
        this.shootDelay = 1000;
        this.lastDamageTime = 0;
        this.damageCooldown = 5000;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const normalizedDx = (dx / distance) * this.speed;
            const normalizedDy = (dy / distance) * this.speed;
            this.x += normalizedDx;
            this.y += normalizedDy;
        }
    }

    shoot(currentTime) {
        if (currentTime - this.lastShot > this.shootDelay) {
            const bullets = [];
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * 2 * Math.PI;
                const dx = Math.cos(angle) * 6;
                const dy = Math.sin(angle) * 6;
                bullets.push(new BossBullet(this.x, this.y, dx, dy));
            }
            this.lastShot = currentTime;
            return bullets;
        }
        return [];
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    canDamagePlayer(currentTime) {
        return currentTime - this.lastDamageTime > this.damageCooldown;
    }

    damagePlayer(currentTime) {
        this.lastDamageTime = currentTime;
    }

    draw(ctx) {
        // Draw boss body with enhanced visibility
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = BLACK;
        ctx.fill();
        
        // White outline for better visibility
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Red glow effect
        for (let i = 0; i < 3; i++) {
            const glowSize = this.size + (i * 8);
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(150, 0, 0, ${0.4 - i * 0.1})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// Final Boss class
class FinalBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 80;
        this.speed = 0.6;
        this.health = 250000; // 5x more HP (50000 * 5)
        this.maxHealth = 250000;
        this.damage = 5;
        this.lastShot = 0;
        this.shootDelay = 500;
        this.lastDamageTime = 0;
        this.damageCooldown = 5000;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const normalizedDx = (dx / distance) * this.speed;
            const normalizedDy = (dy / distance) * this.speed;
            this.x += normalizedDx;
            this.y += normalizedDy;
        }
    }

    shoot(currentTime) {
        if (currentTime - this.lastShot > this.shootDelay) {
            const bullets = [];
            for (let i = 0; i < 30; i++) {
                const angle = (i / 30) * 2 * Math.PI;
                const dx = Math.cos(angle) * 5;
                const dy = Math.sin(angle) * 5;
                bullets.push(new FinalBossBullet(this.x, this.y, dx, dy));
            }
            this.lastShot = currentTime;
            return bullets;
        }
        return [];
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    canDamagePlayer(currentTime) {
        return currentTime - this.lastDamageTime > this.damageCooldown;
    }

    damagePlayer(currentTime) {
        this.lastDamageTime = currentTime;
    }

    draw(ctx) {
        // Draw final boss body with enhanced visibility
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = GOLD;
        ctx.fill();
        
        // Black outline for better visibility
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Red aura effect
        for (let i = 0; i < 4; i++) {
            const auraSize = this.size + (i * 10);
            ctx.beginPath();
            ctx.arc(this.x, this.y, auraSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 - i * 0.07})`;
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }
}

// Orb class
class Orb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.collected = false;
        this.collectionRange = 20;
        this.magnetRange = 80;
        this.magnetSpeed = 6;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.collectionRange) {
            this.collected = true;
            return true;
        } else if (distance < this.magnetRange) {
            if (distance > 0) {
                this.x += (dx / distance) * this.magnetSpeed;
                this.y += (dy / distance) * this.magnetSpeed;
            }
        }
        return false;
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = GREEN;
            ctx.fill();
            
            // Glow effect
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 150, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

class Game {
    constructor() {
        // Menu state
        this.inMenu = true;
        this.inOptions = false;
        
        // Language translations
        this.translations = {
            english: {
                gameTitle: 'Zombie Shooter',
                start: 'Start',
                options: 'Options',
                controls: 'Controls',
                cheats: 'Cheats',
                difficulty: 'Difficulty',
                credits: 'Credits',
                debug: 'Debug',
                debugDescription: 'View / Edit localStorage (developer only)',
                view: 'View',
                edit: 'Edit',
                delete: 'Delete',
                noLocalStorageKeys: 'No localStorage keys found',
                cheatLv15: 'Skip to Level 15',
                cheatBoss: 'Skip to Final Boss',
                cheatCoins: 'Get 100 QUINTILLION Coins',
                cheatReset: 'Reset All Progress',
                languages: 'Languages',
                special: 'Special',
                score: 'Score',
                coins: 'Coins',
                level: 'Lv.',
                gameOver: 'GAME OVER',
                finalScore: 'Final Score',
                pressToRestart: 'Press R to restart',
                paused: 'PAUSED',
                pressToResume: 'Press P to Resume',
                pressForMenu: 'Press ESC for Menu',
                getReady: 'Get Ready!',
                move: 'WASD or Arrow Keys - Move',
                aim: 'Mouse - Aim and Shoot',
                pauseGame: 'P - Pause Game',
                returnToMenu: 'ESC - Return to Menu',
                closeOptions: 'Press ESC to close options menu',
                selectOption: 'Select an option above to view details',
                easy: 'Easy',
                normal: 'Normal',
                hard: 'Hard',
                difficultyNote: '(Difficulty selection coming soon)',
                developer: 'Game Developer: Aleks P',
                soundDesign: 'Sound Design: Miles',
                art: 'Art & Textures: Aleks P',
                sponsors: 'Sponsors: Shaun & Flecher'
            }
        };
        this.activeOptionTab = '';  // Can be: 'controls', 'cheats', 'difficulty', 'credits', 'languages', 'special'
        this.selectedLanguage = 'english';  // Default language
        this.isUpsideDown = false;  // Special effect toggle
        this.countdownActive = false;
        this.countdownTime = 0;
        this.countdownStart = 0;
        const buttonWidth = 450;   // 300 * 1.5 = 450
        const buttonHeight = 60;   // Back to original height
        const buttonSpacing = 50;  // Back to original spacing
        this.menuButtons = {
            start: { x: SCREEN_WIDTH/2 - buttonWidth/2, y: SCREEN_HEIGHT/2 - 50, width: buttonWidth, height: buttonHeight },
            options: { x: SCREEN_WIDTH/2 - buttonWidth/2, y: SCREEN_HEIGHT/2 + 50, width: buttonWidth, height: buttonHeight },
            shop: { x: SCREEN_WIDTH/2 - buttonWidth/2, y: SCREEN_HEIGHT/2 + 150, width: buttonWidth, height: buttonHeight }
        };
        
        // Shop state
        this.inShop = false;
        this.shopItems = {
            purple: { name: 'Purple Skin', cost: 5, owned: false, color: '#800080' },
            small: { name: 'Small & Green', cost: 10, owned: false, color: '#00FF00', scale: 0.5 },
            bigge: { name: 'Bigge', cost: 30, owned: false, color: '#FFA500', scale: 1.2, speedBoost: 2 },
            shady: { name: 'Shady', cost: 40, owned: false, color: '#808080', healthBonus: 2 },
            tank: { name: 'Tank', cost: 67, owned: false, color: '#4B0000', fixedHealth: 67 },
            angry: { name: 'Angry', cost: 100, owned: false, color: '#FF4500', damageMultiplier: 2, speedMultiplier: 1.5 },
            multi: { name: 'Multi', cost: 150, owned: false, color: '#8A2BE2', damageMultiplier: 5, speedMultiplier: 0.5, isMultiColor: true }
        };
        this.activePlayerSkin = 'default';
        
        // Gun upgrade system
        this.gunUpgradeLevel = 0;
        this.maxGunUpgradeLevel = 10;
        this.gunUpgradeCost = 150;
        
        // Health upgrade system
        this.healthUpgradeLevel = 0;
        this.maxHealthUpgradeLevel = 10;
        this.healthUpgradeCost = 10;
        
        // Speed upgrade system
        this.speedUpgradeLevel = 0;
        this.maxSpeedUpgradeLevel = 10;
        this.speedUpgradeCost = 15;
        
        // Options menu buttons
        const optionButtonWidth = 200;
        const optionButtonHeight = 50;
        const optionButtonSpacing = 30;
        const startY = SCREEN_HEIGHT/2 - 100; // Adjusted positioning
        this.optionButtons = {
            controls: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            cheats: { x: SCREEN_WIDTH/2 + 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            difficulty: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            credits: { x: SCREEN_WIDTH/2 + 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            // Debug tab (third row, left)
            debug: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + (optionButtonHeight + optionButtonSpacing) * 2, width: optionButtonWidth, height: optionButtonHeight }
            ,visuals: { x: SCREEN_WIDTH/2 + 20, y: startY + (optionButtonHeight + optionButtonSpacing) * 2, width: optionButtonWidth, height: optionButtonHeight }
        };

        this.loadSkins(); // Load saved skins first
        this.loadGunUpgrade(); // Load saved gun upgrade
        this.loadHealthUpgrade(); // Load saved health upgrade
        this.loadSpeedUpgrade(); // Load saved speed upgrade
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        
        // Apply equipped pet
        this.player.equippedPet = this.equippedPet;
        this.player.updatePetBonuses();
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.score = 0;
        this.coins = this.loadCoins(); // Load saved coins (no minimum)
        this.lastCoinScore = 0; // Track when to award next coin
        this.zombieSpawnTimer = 0;
        this.zombieSpawnDelay = 2000;
        this.zombiesSpawned = 0;

        // Level system
        this.orbsCollected = 0;
        this.level = 1;
        this.orbsNeeded = 10;

        // Enemy spawn tracking
        this.greenSpawnCount = 0;
        this.orangeSpawnCount = 0;
        this.blueSpawnCount = 0;

        // Boss system
        this.boss = null;
        this.bossSpawned = false;
        this.bossDefeated = false;
        
        // Final boss system
        this.finalBoss = null;
        this.finalBossSpawned = false;
        this.finalBossDefeated = false;

        // Game state
        this.gameOver = false;
        this.paused = false;

        // Cheat code system
        this.cheatActive = false;
        this.cheatStartTime = 0;
        this.cheat2Active = false;
        this.cheat2StartTime = 0;
        this.cheat3Active = false;
        this.cheat3StartTime = 0;
        this.cheat4Active = false;
        this.cheat4StartTime = 0;
    this.cheat5Active = false;
    this.cheat5StartTime = 0;
        this.tKeyPressed = false;

        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.setupInputHandlers();

        // Audio manager (synthesized sounds)
        try {
            this.audio = new AudioManager();
            // Optionally start background music at lower volume
            // this.audio.startMusic();
            // Expose audio manager for site-level controls
            try {
                if (window) {
                    window.gameAudio = this.audio;
                }
            } catch (e) {}
            // Listen for postMessage commands (e.g., site-wide mute)
            try {
                window.addEventListener('message', (ev) => {
                    const data = ev && ev.data;
                    if (!data || typeof data !== 'object') return;
                    if (data.type === 'site_mute') {
                        const muted = !!data.muted;
                        if (this.audio && this.audio.masterGain) {
                            if (muted) {
                                this.audio.masterGain.gain.value = 0;
                            } else {
                                this.audio.masterGain.gain.value = (this.audio._previousMasterGain || 0.35);
                            }
                        }
                    }
                }, false);
            } catch (e) {}
            // Ensure AudioContext is resumed on first user gesture (autoplay policies)
            try {
                if (this.audio && this.audio.ctx && typeof this.audio.ctx.resume === 'function') {
                    const _resumeAudio = async () => {
                        try {
                            if (this.audio.ctx.state === 'suspended') {
                                await this.audio.ctx.resume();
                            }
                            // play a subtle click to indicate audio is enabled (non-intrusive)
                            if (typeof this.audio.playClick === 'function') {
                                try { this.audio.playClick(); } catch (e) {}
                            }
                        } catch (e) {}
                    };
                    // Use pointerdown and keydown as common user gestures; once:true ensures handler removes itself
                    document.addEventListener('pointerdown', _resumeAudio, { once: true, passive: true });
                    document.addEventListener('keydown', _resumeAudio, { once: true, passive: true });
                }
            } catch (e) {}
        } catch (err) {
            this.audio = null;
        }

    // Touch control settings (persisted)
    this.touchControlsVisible = (localStorage.getItem('zs_touch_controls_visible') !== '0'); // default true
    this.touchControlsOpacity = parseFloat(localStorage.getItem('zs_touch_opacity')) || 0.9;
    this.touchControlsSize = parseFloat(localStorage.getItem('zs_touch_size')) || 1.0; // multiplier

        // Ensure touchState radii reflect user size multiplier
        try {
            const j = this.touchState && this.touchState.joystick;
            const fb = this.touchState && this.touchState.fireButton;
            if (j && fb) {
                const baseW = SCREEN_WIDTH; const baseH = SCREEN_HEIGHT;
                const joystickRadius = Math.max(40, Math.min(64, Math.floor(baseW * 0.09)));
                const fireRadius = Math.max(36, Math.min(64, Math.floor(baseW * 0.095)));
                j.radius = Math.round(joystickRadius * this.touchControlsSize);
                j.startX = Math.round(baseW * 0.12);
                j.startY = Math.round(baseH - Math.max(110, baseH * 0.18));
                j.x = j.startX; j.y = j.startY; j.dx = 0; j.dy = 0;
                fb.radius = Math.round(fireRadius * this.touchControlsSize);
                fb.x = Math.round(baseW - baseW * 0.12);
                fb.y = Math.round(baseH - Math.max(110, baseH * 0.18));
            }
        } catch (err) {
            // noop
        }

        // Tutorial overlay for first mobile playthrough
        this.touchTutorialShown = (localStorage.getItem('zs_touch_tutorial_shown') === '1');

        // Visual options (persisted)
        this.lowPowerMode = (localStorage.getItem('zs_low_power') === '1') || false;
        this.particleQuality = parseInt(localStorage.getItem('zs_particle_quality')) || 2; // 0=off,1=low,2=normal,3=high
        this.particleScale = parseFloat(localStorage.getItem('zs_particle_scale')) || 1.0;
        this.popupFont = localStorage.getItem('zs_popup_font') || '16px Arial';

        // Screen shake state
        this.shakeStrength = 0;
        this.shakeTimer = 0;
    this.shakeDuration = 0;

    // Fullscreen state
    this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    document.addEventListener('fullscreenchange', () => { this.isFullscreen = !!document.fullscreenElement; });
    document.addEventListener('webkitfullscreenchange', () => { this.isFullscreen = !!document.webkitFullscreenElement; });

    // Create DOM UI for exporting/importing saves (player-save.json)
    this.createSaveUI();
    // Debug UI paging
    this.debugPage = 0;
    this.debugPageSize = 6; // keys per page

        // Animation frame ID
        this.animationId = null;
        
    // Autofire system (enabled by default)
    this.autoFireEnabled = true;
    // Visual effects
    this.particles = [];
    this.damagePopups = [];
    // Pools
    this._particlePool = [];
    this._popupPool = [];
    // Smooth health display for animated HUD
    this.currentHealthDisplay = this.player ? (this.player.health || 10) : 10;
    // frame timing
    this._lastFrameTime = performance.now();
        
        // Pet system
        this.inPetsPage = false;
        this.ownedPets = this.loadOwnedPets();
        this.equippedPet = this.loadEquippedPet();
        this.petCrates = {
            common: { 
                name: 'Common Crate', 
                cost: 1000, 
                pets: [
                    { name: 'cat', rarity: 'common', chance: 45 },
                    { name: 'dog', rarity: 'common', chance: 45 },
                    { name: 'turtle', rarity: 'rare', chance: 10 }
                ]
            },
            rare: {
                name: 'Rare Crate',
                cost: 10000,
                pets: [
                    { name: 'turtle', rarity: 'rare', chance: 90 },
                    { name: 'parrot', rarity: 'epic', chance: 9 },
                    { name: 'capybarra', rarity: 'legendary', chance: 1 }
                ]
            }
        };
        
        // Debug logging
        console.log('Pets system initialized:', {
            inPetsPage: this.inPetsPage,
            ownedPets: this.ownedPets,
            equippedPet: this.equippedPet,
            petCrates: this.petCrates
        });
    }

    setupInputHandlers() {
        // Mobile touch controls state - compute sizes/positions dynamically for phones
        {
            const isPortrait = SCREEN_HEIGHT > SCREEN_WIDTH;
            const baseW = SCREEN_WIDTH;
            const baseH = SCREEN_HEIGHT;

            // Joystick: positioned on lower-left, sized proportionally
            const joystickRadius = Math.max(40, Math.min(64, Math.floor(baseW * 0.09)));
            const joystickStartX = Math.round(baseW * 0.12);
            const joystickStartY = Math.round(baseH - Math.max(110, baseH * 0.18));

            // Fire button: lower-right, roomy hit area
            const fireRadius = Math.max(36, Math.min(64, Math.floor(baseW * 0.095)));
            const fireX = Math.round(baseW - baseW * 0.12);
            const fireY = Math.round(baseH - Math.max(110, baseH * 0.18));

            this.touchState = {
                joystick: {
                    active: false,
                    identifier: null,
                    startX: joystickStartX,
                    startY: joystickStartY,
                    x: joystickStartX,
                    y: joystickStartY,
                    dx: 0,
                    dy: 0,
                    radius: joystickRadius
                },
                fireButton: {
                    active: false,
                    identifier: null,
                    x: fireX,
                    y: fireY,
                    radius: fireRadius
                }
            };
        }

        // Helper to update movement keys from joystick direction
        const updateKeysFromJoystick = () => {
            const j = this.touchState.joystick;
            // deadzone to avoid tiny movements - relative to joystick radius
            const dz = Math.max(6, Math.round(j.radius * 0.18));
            this.keys['w'] = false; this.keys['a'] = false; this.keys['s'] = false; this.keys['d'] = false;
            if (!j.active) return;
            if (Math.abs(j.dx) < dz && Math.abs(j.dy) < dz) return;
            // Up/Down
            if (j.dy < -dz) this.keys['w'] = true;
            if (j.dy > dz) this.keys['s'] = true;
            // Left/Right
            if (j.dx < -dz) this.keys['a'] = true;
            if (j.dx > dz) this.keys['d'] = true;
        };
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Track T key separately for cheat codes
            if (e.key === 't') {
                this.tKeyPressed = true;
            }
            // Start tracking T+5 cheat when 5 is pressed while T is held
            if ((e.key === '5' || e.key === '%') && this.tKeyPressed) {
                this.cheat5Active = true;
                this.cheat5StartTime = Date.now();
            }

            if (!this.inMenu && e.key === 'p' || e.key === 'P') {
                this.paused = !this.paused;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameOver) {
                    this.reset();
                }
            }
            
            // Pet cheat code - Press P in menu for free pets
            if (e.key === 'p' || e.key === 'P') {
                if (this.inMenu && !this.inOptions && !this.inShop) {
                    // Give both pets for testing
                    this.ownedPets = ['cat', 'dog'];
                    this.saveOwnedPets();
                    console.log('Cheat activated: Free pets given!');
                }
            }
            if (e.key === 'Escape') {
                if (this.inOptions) {
                    this.inOptions = false;
                    this.activeOptionTab = '';
                } else if (!this.inMenu && !this.countdownActive) {
                    this.inMenu = true;
                    this.paused = true;
                    this.reset();  // Reset game when returning to menu
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;

            // Reset T key tracking when released
            if (e.key === 't') {
                this.tKeyPressed = false;
                this.cheatActive = false;
                this.cheat2Active = false;
                // cancel cheat5 if t is released
                this.cheat5Active = false;
            }

            // Reset cheat states when keys are released
            if (e.key === '1') {
                this.cheatActive = false;
            }
            if (e.key === '2') {
                this.cheat2Active = false;
            }
            if (e.key === '3') {
                this.cheat3Active = false;
            }
            if (e.key === '4') {
                this.cheat4Active = false;
            }
            if (e.key === '5') {
                this.cheat5Active = false;
            }
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        // Touch events for mobile controls
        canvas.addEventListener('touchstart', (e) => {
            const rect = canvas.getBoundingClientRect();
            for (const t of Array.from(e.changedTouches)) {
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;

                // Dismiss tutorial overlay if visible (any touch)
                if (!this.touchTutorialShown) {
                    this.touchTutorialShown = true;
                    localStorage.setItem('zs_touch_tutorial_shown', '1');
                    this._touchTutorialDismissRect = null;
                    // allow touch to still act as joystick/fire; continue processing
                }

                // Check if touch is on left side (joystick)
                const j = this.touchState.joystick;
                const distToJoy = Math.hypot(tx - j.startX, ty - j.startY);
                if (!j.active && (tx < SCREEN_WIDTH / 2) && distToJoy <= j.radius * 1.6) {
                    j.active = true; j.identifier = t.identifier; j.x = tx; j.y = ty; j.dx = tx - j.startX; j.dy = ty - j.startY;
                    updateKeysFromJoystick();
                    e.preventDefault();
                    continue;
                }

                // Check fire button area (right-bottom)
                const fb = this.touchState.fireButton;
                const distToFire = Math.hypot(tx - fb.x, ty - fb.y);
                if (!fb.active && (tx > SCREEN_WIDTH / 2) && distToFire <= fb.radius) {
                    fb.active = true; fb.identifier = t.identifier;
                    // simulate mouse position to point bullets toward touch
                    this.mousePos = { x: tx, y: ty };
                    // enable shooting while pressed
                    this.player.isMouseShooting = true;
                    e.preventDefault();
                    continue;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            for (const t of Array.from(e.changedTouches)) {
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;
                const j = this.touchState.joystick;
                if (j.active && t.identifier === j.identifier) {
                    // clamp joystick displacement to radius
                    const maxR = j.radius;
                    const dx = tx - j.startX;
                    const dy = ty - j.startY;
                    const mag = Math.hypot(dx, dy);
                    if (mag > maxR) {
                        j.dx = dx / mag * maxR;
                        j.dy = dy / mag * maxR;
                        j.x = j.startX + j.dx;
                        j.y = j.startY + j.dy;
                    } else {
                        j.dx = dx; j.dy = dy; j.x = tx; j.y = ty;
                    }
                    updateKeysFromJoystick();
                    e.preventDefault();
                    continue;
                }

                const fb = this.touchState.fireButton;
                if (fb.active && t.identifier === fb.identifier) {
                    // update mousePos so bullets aim at touch
                    this.mousePos = { x: tx, y: ty };
                    e.preventDefault();
                    continue;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            for (const t of Array.from(e.changedTouches)) {
                const j = this.touchState.joystick;
                if (j.active && t.identifier === j.identifier) {
                    j.active = false; j.identifier = null; j.dx = 0; j.dy = 0; j.x = j.startX; j.y = j.startY;
                    // clear movement keys
                    this.keys['w'] = false; this.keys['a'] = false; this.keys['s'] = false; this.keys['d'] = false;
                }
                const fb = this.touchState.fireButton;
                if (fb.active && t.identifier === fb.identifier) {
                    fb.active = false; fb.identifier = null;
                    this.player.isMouseShooting = false;
                }
            }
        }, { passive: false });

        // Mouse click for menu buttons
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // If tutorial overlay is present, check for dismiss click
            if (!this.touchTutorialShown) {
                // If dismiss rect exists and click inside, dismiss
                const r = this._touchTutorialDismissRect;
                if (!r) {
                    this.touchTutorialShown = true;
                    localStorage.setItem('zs_touch_tutorial_shown', '1');
                } else if (clickX >= r.x && clickX <= r.x + r.w && clickY >= r.y && clickY <= r.y + r.h) {
                    this.touchTutorialShown = true;
                    localStorage.setItem('zs_touch_tutorial_shown', '1');
                    this._touchTutorialDismissRect = null;
                    return;
                } else {
                    // clicking anywhere dismisses as well
                    this.touchTutorialShown = true;
                    localStorage.setItem('zs_touch_tutorial_shown', '1');
                }
            }

            // Check autofire button click (only during gameplay)
            if (!this.inMenu && !this.gameOver && !this.paused && !this.countdownActive) {
                const autoFireButtonX = SCREEN_WIDTH - 130;
                const autoFireButtonY = 10;
                const autoFireButtonWidth = 120;
                const autoFireButtonHeight = 35;
                
                if (clickX >= autoFireButtonX && clickX <= autoFireButtonX + autoFireButtonWidth &&
                    clickY >= autoFireButtonY && clickY <= autoFireButtonY + autoFireButtonHeight) {
                    this.autoFireEnabled = !this.autoFireEnabled;
                    return; // Don't process other clicks
                }
            }

            if (this.inMenu) {

                // Check start button (only if options menu is not open)
                const startBtn = this.menuButtons.start;
                if (!this.inOptions && !this.inShop && clickX >= startBtn.x && clickX <= startBtn.x + startBtn.width &&
                    clickY >= startBtn.y && clickY <= startBtn.y + startBtn.height) {
                    if (this.gameOver) {
                        this.reset();
                    }
                    // Initialize countdown and game state
                    if (this.audio && typeof this.audio.playClick === 'function') this.audio.playClick();
                    this.countdownActive = true;
                    this.countdownStart = Date.now();
                    this.inMenu = false;  // Exit menu to show game background
                    this.inOptions = false;  // Close options if open
                    this.activeOptionTab = '';  // Reset active tab
                    this.paused = false;  // Unpause to allow background updates
                }

                // Check options button
                const optionsBtn = this.menuButtons.options;
                if (!this.inShop && clickX >= optionsBtn.x && clickX <= optionsBtn.x + optionsBtn.width &&
                    clickY >= optionsBtn.y && clickY <= optionsBtn.y + optionsBtn.height) {
                    if (this.audio && typeof this.audio.playClick === 'function') this.audio.playClick();
                    this.inOptions = !this.inOptions;
                    this.inShop = false;  // Close shop when opening options
                    this.activeOptionTab = '';  // Reset active tab when opening/closing options
                }

                // Check shop button
                const shopBtn = this.menuButtons.shop;
                if (!this.inOptions && clickX >= shopBtn.x && clickX <= shopBtn.x + shopBtn.width &&
                    clickY >= shopBtn.y && clickY <= shopBtn.y + shopBtn.height) {
                    if (this.audio && typeof this.audio.playClick === 'function') this.audio.playClick();
                    this.inShop = !this.inShop;
                    this.inOptions = false;  // Close options when opening shop
                    this.activeOptionTab = '';
                }

                // Check shop item clicks
                if (this.inShop && !this.inPetsPage) {
                    // First check if click is within shop box bounds (expanded box)
                    const shopBoxX = 40;
                    const shopBoxY = 20;
                    const shopBoxWidth = SCREEN_WIDTH - 80;
                    const shopBoxHeight = SCREEN_HEIGHT - 40;
                    
                    if (clickX >= shopBoxX && clickX <= shopBoxX + shopBoxWidth &&
                        clickY >= shopBoxY && clickY <= shopBoxY + shopBoxHeight) {
                        // Click is within shop box - process shop interactions
                    // Pets page button (top right of shop window) - Enhanced
                    const petsButtonX = shopBoxX + shopBoxWidth - 120; // inside expanded shop window
                    const petsButtonY = shopBoxY + 50; // Near top of shop window
                    const petsButtonWidth = 90;
                    const petsButtonHeight = 35;
                    
                    // Debug click detection
                    console.log('Click at:', clickX, clickY, 'Button bounds:', petsButtonX, petsButtonY, petsButtonX + petsButtonWidth, petsButtonY + petsButtonHeight);
                    
                    if (clickX >= petsButtonX && clickX <= petsButtonX + petsButtonWidth &&
                        clickY >= petsButtonY && clickY <= petsButtonY + petsButtonHeight) {
                        console.log('Pets button clicked!');
                        this.inPetsPage = true;
                        return;
                    }
                    
                    const itemHeight = 80;
                    const itemWidth = 120;
                    const itemSpacing = 15;
                    const rowSpacing = 20;
                    
                    // First row (3 items)
                    const firstRowStartX = SCREEN_WIDTH/2 - ((itemWidth * 3 + itemSpacing * 2) / 2);
                    const firstRowY = SCREEN_HEIGHT/2 - 80;
                    
                    // Second row (2 items)
                    const secondRowStartX = SCREEN_WIDTH/2 - ((itemWidth * 2 + itemSpacing) / 2);
                    const secondRowY = firstRowY + itemHeight + rowSpacing;
                    
                    // Gun upgrade button
                    const gunUpgradeX = SCREEN_WIDTH/2 - 100;
                    const gunUpgradeY = secondRowY + itemHeight + 30;
                    const gunUpgradeWidth = 200;
                    const gunUpgradeHeight = 40;

                    let index = 0;
                    for (const [itemId, item] of Object.entries(this.shopItems)) {
                        let itemX, itemY;
                        
                        if (index < 3) {
                            // First row
                            itemX = firstRowStartX + (itemWidth + itemSpacing) * index;
                            itemY = firstRowY;
                        } else {
                            // Second row (shifted left by 100px to match rendering)
                            itemX = secondRowStartX + (itemWidth + itemSpacing) * (index - 3) - 100;
                            itemY = secondRowY;
                        }
                        
                        if (clickX >= itemX && clickX <= itemX + itemWidth &&
                            clickY >= itemY && clickY <= itemY + itemHeight) {
                            // Try to buy/equip the item
                            if (!item.owned) {
                                // Item not owned - try to buy it
                                if (this.coins >= item.cost) {
                                    this.coins -= item.cost;
                                    item.owned = true;
                                    this.saveCoins();
                                    this.activePlayerSkin = itemId;
                                    this.saveSkins();
                                }
                            } else {
                                // Item is owned - toggle equip/unequip
                                if (this.activePlayerSkin === itemId) {
                                    // Currently equipped - unequip (set to default)
                                    this.activePlayerSkin = 'default';
                                } else {
                                    // Not equipped - equip it
                                    this.activePlayerSkin = itemId;
                                }
                                this.saveSkins();
                            }
                        }
                        index++;
                    }
                    
                    // Check gun upgrade click
                    if (clickX >= gunUpgradeX && clickX <= gunUpgradeX + gunUpgradeWidth &&
                        clickY >= gunUpgradeY && clickY <= gunUpgradeY + gunUpgradeHeight) {
                        if (this.gunUpgradeLevel < this.maxGunUpgradeLevel && this.coins >= this.gunUpgradeCost) {
                            this.coins -= this.gunUpgradeCost;
                            this.gunUpgradeLevel++;
                            this.saveCoins();
                            this.saveGunUpgrade();
                        }
                    }
                    
                    // Check health upgrade click
                    const healthUpgradeX = gunUpgradeX - 220;
                    const healthUpgradeY = gunUpgradeY;
                    const upgradeWidth = 200;
                    const upgradeHeight = 40;
                    
                    if (clickX >= healthUpgradeX && clickX <= healthUpgradeX + upgradeWidth &&
                        clickY >= healthUpgradeY && clickY <= healthUpgradeY + upgradeHeight) {
                        if (this.healthUpgradeLevel < this.maxHealthUpgradeLevel && this.coins >= this.healthUpgradeCost) {
                            this.coins -= this.healthUpgradeCost;
                            this.healthUpgradeLevel++;
                            this.saveCoins();
                            this.saveHealthUpgrade();
                        }
                    }
                    
                    // Check speed upgrade click
                    const speedUpgradeX = gunUpgradeX + 220;
                    const speedUpgradeY = gunUpgradeY;
                    
                    if (clickX >= speedUpgradeX && clickX <= speedUpgradeX + upgradeWidth &&
                        clickY >= speedUpgradeY && clickY <= speedUpgradeY + upgradeHeight) {
                        if (this.speedUpgradeLevel < this.maxSpeedUpgradeLevel && this.coins >= this.speedUpgradeCost) {
                            this.coins -= this.speedUpgradeCost;
                            this.speedUpgradeLevel++;
                            this.saveCoins();
                            this.saveSpeedUpgrade();
                        }
                    }
                    
                    } // End of shop box bounds check
                    return; // Prevent clicking through shop box
                }
                
                // Check pets page clicks
                if (this.inShop && this.inPetsPage) {
                    // First check if click is within shop box bounds (expanded box)
                    const shopBoxX = 40;
                    const shopBoxY = 20;
                    const shopBoxWidth = SCREEN_WIDTH - 80;
                    const shopBoxHeight = SCREEN_HEIGHT - 40;
                    
                    if (clickX >= shopBoxX && clickX <= shopBoxX + shopBoxWidth &&
                        clickY >= shopBoxY && clickY <= shopBoxY + shopBoxHeight) {
                        // Click is within shop box - process pets page interactions
                    // Back button
                    const backButtonX = 110; // Inside shop window on left
                    const backButtonY = 60; // Near top of shop window
                    const backButtonWidth = 60;
                    const backButtonHeight = 30;
                    
                    if (clickX >= backButtonX && clickX <= backButtonX + backButtonWidth &&
                        clickY >= backButtonY && clickY <= backButtonY + backButtonHeight) {
                        this.inPetsPage = false;
                        return;
                    }
                    
                    // Common crate button
                    const crateX = SCREEN_WIDTH/2 - 270;
                    const crateY = SCREEN_HEIGHT/2 - 80;
                    const crateWidth = 160;
                    const crateHeight = 160;
                    
                    if (clickX >= crateX && clickX <= crateX + crateWidth &&
                        clickY >= crateY && clickY <= crateY + crateHeight) {
                        if (this.coins >= this.petCrates.common.cost) {
                            this.coins -= this.petCrates.common.cost;
                            this.saveCoins();
                            
                            // Random pet from common crate with chances
                            const possiblePets = this.petCrates.common.pets;
                            const rand = Math.random() * 100; // 0-100
                            let currentChance = 0;
                            let selectedPet = null;
                            
                            for (const pet of possiblePets) {
                                currentChance += pet.chance;
                                if (rand <= currentChance) {
                                    selectedPet = pet.name;
                                    break;
                                }
                            }
                            
                            if (selectedPet && !this.ownedPets.includes(selectedPet)) {
                                this.ownedPets.push(selectedPet);
                                this.saveOwnedPets();
                                console.log(`Got ${selectedPet}! (${possiblePets.find(p => p.name === selectedPet).rarity})`);
                            }
                        }
                    }
                    
                    // Rare crate button
                    const rareCrateX = SCREEN_WIDTH/2 - 80;
                    const rareCrateY = SCREEN_HEIGHT/2 - 80;
                    
                    if (clickX >= rareCrateX && clickX <= rareCrateX + crateWidth &&
                        clickY >= rareCrateY && clickY <= rareCrateY + crateHeight) {
                        if (this.coins >= this.petCrates.rare.cost) {
                            this.coins -= this.petCrates.rare.cost;
                            this.saveCoins();
                            
                            // Random pet from rare crate with chances
                            const possiblePets = this.petCrates.rare.pets;
                            const rand = Math.random() * 100; // 0-100
                            let currentChance = 0;
                            let selectedPet = null;
                            
                            for (const pet of possiblePets) {
                                currentChance += pet.chance;
                                if (rand <= currentChance) {
                                    selectedPet = pet.name;
                                    break;
                                }
                            }
                            
                            if (selectedPet && !this.ownedPets.includes(selectedPet)) {
                                this.ownedPets.push(selectedPet);
                                this.saveOwnedPets();
                                console.log(`Got ${selectedPet}! (${possiblePets.find(p => p.name === selectedPet).rarity})`);
                            }
                        }
                    }
                    
                    // Pet equip/unequip clicks
                    const petListX = SCREEN_WIDTH/2 + 50;
                    const petListY = SCREEN_HEIGHT/2 - 100;
                    const petItemHeight = 40;
                    
                    this.ownedPets.forEach((pet, index) => {
                        const petY = petListY + index * petItemHeight;
                        if (clickX >= petListX && clickX <= petListX + 200 &&
                            clickY >= petY && clickY <= petY + petItemHeight) {
                            if (this.equippedPet === pet) {
                                this.equippedPet = null;
                                this.player.equippedPet = null;
                            } else {
                                this.equippedPet = pet;
                                this.player.equippedPet = pet;
                            }
                            this.player.updatePetBonuses(); // Update health bonuses
                            this.saveEquippedPet();
                        }
                    });
                    
                    } // End of pets page shop box bounds check
                    return; // Prevent clicking through pets page
                }

                // Check option tab buttons when in options menu
                if (this.inOptions) {
                    // First check if click is within options box bounds
                    const optionsBoxX = 100;
                    const optionsBoxY = 50;
                    const optionsBoxWidth = SCREEN_WIDTH - 80;
                    const optionsBoxHeight = SCREEN_HEIGHT - 100;
                    
                    if (clickX >= optionsBoxX && clickX <= optionsBoxX + optionsBoxWidth &&
                        clickY >= optionsBoxY && clickY <= optionsBoxY + optionsBoxHeight) {
                        // Click is within options box - check option tab buttons
                        for (const [tabName, btn] of Object.entries(this.optionButtons)) {
                            if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                                clickY >= btn.y && clickY <= btn.y + btn.height) {
                                this.activeOptionTab = this.activeOptionTab === tabName ? '' : tabName;
                                break;
                            }
                        }

                        // If debug tab is active, handle clicks on the debug UI buttons
                            if (this.activeOptionTab === 'debug') {
                            const contentBox = {
                                width: 500,
                                height: 300,
                                x: SCREEN_WIDTH/2 - 250,
                                y: SCREEN_HEIGHT/2 + 20
                            };
                            const keys = Object.keys(window.localStorage).sort();
                            const pageSize = this.debugPageSize || 6;
                            const page = this.debugPage || 0;
                            const start = page * pageSize;
                            const end = Math.min(start + pageSize, keys.length);
                            let y = contentBox.y + 80;
                            const lineHeight = 28;

                            for (let idx = start; idx < end; idx++) {
                                const keyName = keys[idx];
                                const btnX = contentBox.x + contentBox.width - 220;
                                const btnW = 60;
                                const btnH = 20;
                                const viewRect = { x: btnX, y: y - 14, w: btnW, h: btnH };
                                const editRect = { x: btnX + btnW + 10, y: y - 14, w: btnW, h: btnH };
                                const delRect = { x: btnX + (btnW + 10) * 2, y: y - 14, w: btnW, h: btnH };

                                if (clickX >= viewRect.x && clickX <= viewRect.x + viewRect.w && clickY >= viewRect.y && clickY <= viewRect.y + viewRect.h) {
                                    const val = localStorage.getItem(keyName);
                                    alert(`${keyName}: ${val}`);
                                    return;
                                }
                                    // If controls tab is active, handle toggle and slider clicks
                                    if (this.activeOptionTab === 'controls') {
                                        const contentBox = {
                                            width: 500,
                                            height: 300,
                                            x: SCREEN_WIDTH/2 - 250,
                                            y: SCREEN_HEIGHT/2 + 20
                                        };
                                        const toggleX = contentBox.x + 40;
                                        const toggleY = contentBox.y + 90;
                                        const toggleW = 180;
                                        const toggleH = 36;
                                        // Toggle hit
                                        if (clickX >= toggleX && clickX <= toggleX + toggleW && clickY >= toggleY && clickY <= toggleY + toggleH) {
                                            this.touchControlsVisible = !this.touchControlsVisible;
                                            localStorage.setItem('zs_touch_controls_visible', this.touchControlsVisible ? '1' : '0');
                                            return;
                                        }

                                        // Fullscreen button
                                        const fsX = contentBox.x + contentBox.width - 220;
                                        const fsY = contentBox.y + 90;
                                        const fsW = 180;
                                        const fsH = 36;
                                        if (clickX >= fsX && clickX <= fsX + fsW && clickY >= fsY && clickY <= fsY + fsH) {
                                            // Toggle fullscreen
                                            const canvasEl = canvas;
                                            const requestFS = canvasEl.requestFullscreen || canvasEl.webkitRequestFullscreen || canvasEl.msRequestFullscreen;
                                            const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
                                            if (!this.isFullscreen) {
                                                if (requestFS) requestFS.call(canvasEl).catch(() => {});
                                            } else {
                                                if (exitFS) exitFS.call(document).catch(() => {});
                                            }
                                            return;
                                        }

                                        // Opacity slider area
                                        const sliderW = 320;
                                        const sliderTrackX = toggleX;
                                        const sliderTrackY = toggleY + 56 + 28;
                                        const sliderH = 12;
                                        if (clickX >= sliderTrackX && clickX <= sliderTrackX + sliderW && clickY >= sliderTrackY - 8 && clickY <= sliderTrackY + sliderH + 8) {
                                            // Map clickX to opacity range 0.2..1.0
                                            const pct = Math.max(0, Math.min(1, (clickX - sliderTrackX) / sliderW));
                                            this.touchControlsOpacity = 0.2 + pct * 0.8;
                                            localStorage.setItem('zs_touch_opacity', String(this.touchControlsOpacity));
                                            return;
                                        }

                                        // Size slider area
                                        const sizeTrackY = sliderTrackY + 36;
                                        if (clickX >= sliderTrackX && clickX <= sliderTrackX + sliderW && clickY >= sizeTrackY - 8 && clickY <= sizeTrackY + sliderH + 8) {
                                            // Map clickX to size range 0.6..2.0
                                            const pct2 = Math.max(0, Math.min(1, (clickX - sliderTrackX) / sliderW));
                                            this.touchControlsSize = 0.6 + pct2 * 1.4;
                                            localStorage.setItem('zs_touch_size', String(this.touchControlsSize));
                                            // Update touchState radii with multiplier
                                            const j = this.touchState.joystick;
                                            const fb = this.touchState.fireButton;
                                            j.radius = Math.round(j.radius * 0.999); // preserve type but we'll recompute below
                                            // Recompute based on base values
                                            const baseW = SCREEN_WIDTH; const baseH = SCREEN_HEIGHT;
                                            const joystickRadius = Math.max(40, Math.min(64, Math.floor(baseW * 0.09)));
                                            const fireRadius = Math.max(36, Math.min(64, Math.floor(baseW * 0.095)));
                                            j.radius = Math.round(joystickRadius * this.touchControlsSize);
                                            j.startX = Math.round(baseW * 0.12);
                                            j.startY = Math.round(baseH - Math.max(110, baseH * 0.18));
                                            j.x = j.startX; j.y = j.startY; j.dx = 0; j.dy = 0;
                                            fb.radius = Math.round(fireRadius * this.touchControlsSize);
                                            fb.x = Math.round(baseW - baseW * 0.12);
                                            fb.y = Math.round(baseH - Math.max(110, baseH * 0.18));
                                            return;
                                        }
                                        // Visuals tab handling (low power, particle quality/scale)
                                        if (this.activeOptionTab === 'visuals') {
                                            const contentBox = {
                                                width: 500,
                                                height: 300,
                                                x: SCREEN_WIDTH/2 - 250,
                                                y: SCREEN_HEIGHT/2 + 20
                                            };
                                            // Low Power button
                                            const lpBtnX = contentBox.x + contentBox.width - 160;
                                            const lpBtnY = contentBox.y + 40 - 18;
                                            const lpBtnW = 140; const lpBtnH = 28;
                                            if (clickX >= lpBtnX && clickX <= lpBtnX + lpBtnW && clickY >= lpBtnY && clickY <= lpBtnY + lpBtnH) {
                                                this.lowPowerMode = !this.lowPowerMode;
                                                localStorage.setItem('zs_low_power', this.lowPowerMode ? '1' : '0');
                                                return;
                                            }

                                            // Particle quality slider area (we used pqX/pqY in draw)
                                            const pqX = contentBox.x + 30;
                                            const pqY = contentBox.y + 40 + 50;
                                            const pqW = 320; const pqH = 10;
                                            if (clickX >= pqX && clickX <= pqX + pqW && clickY >= pqY - 8 && clickY <= pqY + pqH + 8) {
                                                const pct = Math.max(0, Math.min(1, (clickX - pqX) / pqW));
                                                this.particleQuality = Math.round(pct * 3);
                                                localStorage.setItem('zs_particle_quality', String(this.particleQuality));
                                                return;
                                            }

                                            // Particle scale slider
                                            const psX = contentBox.x + 30;
                                            const psY = contentBox.y + 40 + 100;
                                            const psW = 320; const psH = 10;
                                            if (clickX >= psX && clickX <= psX + psW && clickY >= psY - 8 && clickY <= psY + psH + 8) {
                                                const pct2 = Math.max(0, Math.min(1, (clickX - psX) / psW));
                                                this.particleScale = 0.5 + pct2 * 2.5; // 0.5..3.0
                                                localStorage.setItem('zs_particle_scale', String(this.particleScale));
                                                return;
                                            }
                                        }
                                    }
                                if (clickX >= editRect.x && clickX <= editRect.x + editRect.w && clickY >= editRect.y && clickY <= editRect.y + editRect.h) {
                                    const current = localStorage.getItem(keyName) || '';
                                    const newVal = prompt(`Edit value for ${keyName}:`, current);
                                    if (newVal !== null) {
                                        localStorage.setItem(keyName, newVal);
                                        if (keyName === 'zombieShooterCoins') {
                                            this.coins = parseInt(newVal) || 0;
                                        }
                                    }
                                    return;
                                }
                                if (clickX >= delRect.x && clickX <= delRect.x + delRect.w && clickY >= delRect.y && clickY <= delRect.y + delRect.h) {
                                    if (confirm(`Delete localStorage key ${keyName}? This cannot be undone.`)) {
                                        localStorage.removeItem(keyName);
                                        if (keyName === 'zombieShooterCoins') {
                                            this.coins = 0;
                                        }
                                    }
                                    return;
                                }

                                y += lineHeight;
                            }

                                // Handle Prev/Next clicks
                                const controlsY = contentBox.y + contentBox.height - 30;
                                const ctrlW = 80;
                                const ctrlH = 24;
                                const ctrlX = contentBox.x + contentBox.width/2 - (ctrlW * 2 + 10)/2;
                                const prevRect = { x: ctrlX, y: controlsY, w: ctrlW, h: ctrlH };
                                const nextRect = { x: ctrlX + ctrlW + 140, y: controlsY, w: ctrlW, h: ctrlH };

                                if (clickX >= prevRect.x && clickX <= prevRect.x + prevRect.w && clickY >= prevRect.y && clickY <= prevRect.y + prevRect.h) {
                                    if (page > 0) {
                                        this.debugPage = page - 1;
                                    }
                                    return;
                                }
                                if (clickX >= nextRect.x && clickX <= nextRect.x + nextRect.w && clickY >= nextRect.y && clickY <= nextRect.y + nextRect.h) {
                                    if (end < keys.length) {
                                        this.debugPage = page + 1;
                                    }
                                    return;
                                }
                        }
                    }
                    return; // Prevent clicking through options box
                }
            }
        });
        
        // Mouse shooting events
        canvas.addEventListener('mousedown', (e) => {
            if (!this.inMenu && !this.gameOver && !this.paused) {
                this.player.isMouseShooting = true;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            this.player.isMouseShooting = false;
        });
    }

    loadCoins() {
        const savedCoins = localStorage.getItem('zombieShooterCoins');
        return savedCoins ? parseInt(savedCoins) : 0;
    }

    saveCoins() {
        localStorage.setItem('zombieShooterCoins', this.coins.toString());
    }

    loadSkins() {
        const savedSkins = localStorage.getItem('zombieShooterSkins');
        if (savedSkins) {
            const skinData = JSON.parse(savedSkins);
            for (const [itemId, status] of Object.entries(skinData.owned)) {
                if (this.shopItems[itemId]) {
                    this.shopItems[itemId].owned = status;
                }
            }
            this.activePlayerSkin = skinData.active || 'default';
        }
    }

    saveSkins() {
        const skinData = {
            owned: {},
            active: this.activePlayerSkin
        };
        for (const [itemId, item] of Object.entries(this.shopItems)) {
            skinData.owned[itemId] = item.owned;
        }
        localStorage.setItem('zombieShooterSkins', JSON.stringify(skinData));
    }

    loadGunUpgrade() {
        const savedUpgrade = localStorage.getItem('zombieShooterGunUpgrade');
        this.gunUpgradeLevel = savedUpgrade ? parseInt(savedUpgrade) : 0;
    }

    saveGunUpgrade() {
        localStorage.setItem('zombieShooterGunUpgrade', this.gunUpgradeLevel.toString());
    }

    loadHealthUpgrade() {
        const savedUpgrade = localStorage.getItem('zombieShooterHealthUpgrade');
        this.healthUpgradeLevel = savedUpgrade ? parseInt(savedUpgrade) : 0;
    }

    saveHealthUpgrade() {
        localStorage.setItem('zombieShooterHealthUpgrade', this.healthUpgradeLevel.toString());
    }

    loadSpeedUpgrade() {
        const savedUpgrade = localStorage.getItem('zombieShooterSpeedUpgrade');
        this.speedUpgradeLevel = savedUpgrade ? parseInt(savedUpgrade) : 0;
    }

    saveSpeedUpgrade() {
        localStorage.setItem('zombieShooterSpeedUpgrade', this.speedUpgradeLevel.toString());
    }

    loadOwnedPets() {
        const savedPets = localStorage.getItem('zombieShooterOwnedPets');
        return savedPets ? JSON.parse(savedPets) : [];
    }

    saveOwnedPets() {
        localStorage.setItem('zombieShooterOwnedPets', JSON.stringify(this.ownedPets));
    }

    loadEquippedPet() {
        const savedPet = localStorage.getItem('zombieShooterEquippedPet');
        return savedPet || null;
    }

    saveEquippedPet() {
        localStorage.setItem('zombieShooterEquippedPet', this.equippedPet || '');
    }

    // --- Save / Export / Import helpers ---
    createSaveUI() {
        // Create a small DOM panel (hidden visually when not needed)
        try {
            const container = document.createElement('div');
            container.id = 'save-ui-container';
            container.style.position = 'fixed';
            container.style.right = '12px';
            container.style.bottom = '12px';
            container.style.zIndex = '1000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '6px';

            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Export Save';
            exportBtn.title = 'Export current save to player-save.json';
            exportBtn.onclick = () => { if (this.audio && typeof this.audio.playClick === 'function') this.audio.playClick(); this.exportSave(); };

            const importLabel = document.createElement('label');
            importLabel.style.display = 'inline-block';
            importLabel.style.cursor = 'pointer';
            importLabel.style.fontSize = '13px';
            importLabel.style.background = '#222';
            importLabel.style.color = '#fff';
            importLabel.style.padding = '6px 8px';
            importLabel.style.borderRadius = '4px';
            importLabel.textContent = 'Import Save';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => {
                if (fileInput.files && fileInput.files.length) {
                    const f = fileInput.files[0];
                    this.importSaveFromFile(f);
                }
            };

            importLabel.onclick = () => { if (this.audio && typeof this.audio.playClick === 'function') this.audio.playClick(); fileInput.click(); };

            container.appendChild(exportBtn);
            container.appendChild(importLabel);
            container.appendChild(fileInput);

            document.body.appendChild(container);
        } catch (err) {
            console.warn('Failed to create save UI:', err);
        }
    }

    getSaveObject() {
        // Package up relevant game state into a simple object
        return {
            coins: this.coins,
            score: this.score,
            level: this.level,
            activePlayerSkin: this.activePlayerSkin,
            gunUpgradeLevel: this.gunUpgradeLevel,
            healthUpgradeLevel: this.healthUpgradeLevel,
            speedUpgradeLevel: this.speedUpgradeLevel,
            ownedPets: this.ownedPets,
            equippedPet: this.equippedPet,
            shopItems: this.shopItems
        };
    }

    exportSave() {
        const saveObj = this.getSaveObject();
        const blob = new Blob([JSON.stringify(saveObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'player-save.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    importSaveFromFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = reader.result;
                const obj = JSON.parse(text);
                this.importSaveFromJSON(obj);
                alert('Save imported successfully.');
            } catch (err) {
                alert('Failed to import save: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    importSaveFromJSON(obj) {
        // Be conservative: only set fields that exist
        if (!obj || typeof obj !== 'object') return;
        if (typeof obj.coins === 'number') {
            this.coins = obj.coins;
            this.saveCoins();
        }
        if (typeof obj.score === 'number') this.score = obj.score;
        if (typeof obj.level === 'number') this.level = obj.level;
        if (typeof obj.activePlayerSkin === 'string') {
            this.activePlayerSkin = obj.activePlayerSkin;
            this.saveSkins();
        }
        if (typeof obj.gunUpgradeLevel === 'number') { this.gunUpgradeLevel = obj.gunUpgradeLevel; this.saveGunUpgrade(); }
        if (typeof obj.healthUpgradeLevel === 'number') { this.healthUpgradeLevel = obj.healthUpgradeLevel; this.saveHealthUpgrade(); }
        if (typeof obj.speedUpgradeLevel === 'number') { this.speedUpgradeLevel = obj.speedUpgradeLevel; this.saveSpeedUpgrade(); }
        if (Array.isArray(obj.ownedPets)) { this.ownedPets = obj.ownedPets; this.saveOwnedPets(); }
        if (typeof obj.equippedPet === 'string' || obj.equippedPet === null) { this.equippedPet = obj.equippedPet; this.saveEquippedPet(); }
        // Preserve shopItems shape if provided (only ownership flags)
        if (obj.shopItems && typeof obj.shopItems === 'object') {
            for (const [id, data] of Object.entries(obj.shopItems)) {
                if (this.shopItems[id] && typeof data.owned === 'boolean') {
                    this.shopItems[id].owned = data.owned;
                }
            }
            this.saveSkins();
        }
    }

    updateCoins() {
        // Award 1 coin for every 1000 score points
        const newCoins = Math.floor(this.score / 1000);
        if (newCoins > Math.floor(this.lastCoinScore / 1000)) {
            let coinsToAdd = newCoins - Math.floor(this.lastCoinScore / 1000);
            
            // Apply cat pet multiplier
            if (this.equippedPet === 'cat') {
                coinsToAdd *= 2;
            }
            
            this.coins += coinsToAdd;
            this.saveCoins();
        }
        this.lastCoinScore = this.score;
    }

    reset() {
        // Keep the current skin settings
        const currentSkin = this.activePlayerSkin;
        
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        // Immediately apply the current skin
        if (currentSkin !== 'default' && this.shopItems[currentSkin]) {
            const skin = this.shopItems[currentSkin];
            this.player.color = skin.color;
            this.player.scale = skin.scale || 1;
            this.player.speedBoost = skin.speedBoost || 1;
            
            // Apply health bonuses from skins
            if (skin.fixedHealth) {
                this.player.baseHealth = skin.fixedHealth;
                this.player.health = skin.fixedHealth;
                this.player.maxHealth = skin.fixedHealth;
            } else if (skin.healthBonus) {
                this.player.baseHealth = 10 + skin.healthBonus;
                this.player.health = this.player.baseHealth;
                this.player.maxHealth = this.player.baseHealth;
            }
        }
        
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.score = 0;
        this.lastCoinScore = 0;
        this.level = 1;
        this.orbsCollected = 0;
        this.orbsNeeded = 10;
        this.gameOver = false;
        this.zombieSpawnTimer = 0;
        this.zombieSpawnDelay = 2000;
        this.zombiesSpawned = 0;
        this.greenSpawnCount = 0;
        this.orangeSpawnCount = 0;
        this.inMenu = true;  // Return to menu on reset
        this.inOptions = false;
        
        // Reset boss states
        this.boss = null;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.finalBoss = null;
        this.finalBossSpawned = false;
        this.finalBossDefeated = false;
        
        // Reset cheat state
        this.cheatActive = false;
        this.cheat2Active = false;
        this.tKeyPressed = false;
    }

    spawnOrbs(x, y, count) {
        for (let i = 0; i < count; i++) {
            const offsetX = Math.random() * 30 - 15;
            const offsetY = Math.random() * 30 - 15;
            this.orbs.push(new Orb(x + offsetX, y + offsetY));
        }
    }

    checkLevelUp() {
        if (this.orbsCollected >= this.orbsNeeded) {
            this.level++;
            this.orbsCollected = 0;
            this.orbsNeeded = this.level * 10;
            this.player.updateShootSpeed(this.level);
            return true;
        }
        return false;
    }

    spawnBoss() {
        // Spawn the boss at a random edge
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch(side) {
            case 0: // Top
                x = SCREEN_WIDTH / 2;
                y = -60;
                break;
            case 1: // Right
                x = SCREEN_WIDTH + 60;
                y = SCREEN_HEIGHT / 2;
                break;
            case 2: // Bottom
                x = SCREEN_WIDTH / 2;
                y = SCREEN_HEIGHT + 60;
                break;
            case 3: // Left
                x = -60;
                y = SCREEN_HEIGHT / 2;
                break;
        }

        this.boss = new Boss(x, y);
        this.bossSpawned = true;
    }

    spawnFinalBoss() {
        // Spawn the final boss at the center of the screen
        // Clear all enemies
        this.zombies = [];
        this.boss = null;

        // Spawn final boss at center
        this.finalBoss = new FinalBoss(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.finalBossSpawned = true;
    }

    spawnZombie() {
        // Don't spawn zombies if boss is active and not defeated
        if (this.boss || (this.level >= 15 && !this.bossDefeated)) {
            return;
        }

        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch(side) {
            case 0: // Top
                x = Math.random() * SCREEN_WIDTH;
                y = -20;
                break;
            case 1: // Right
                x = SCREEN_WIDTH + 20;
                y = Math.random() * SCREEN_HEIGHT;
                break;
            case 2: // Bottom
                x = Math.random() * SCREEN_WIDTH;
                y = SCREEN_HEIGHT + 20;
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * SCREEN_HEIGHT;
                break;
        }

        if (this.level >= 30) {
            // After level 30 spawn only white and blue enemies; spawn them randomly
            const pick = Math.random();
            if (pick < 0.5) {
                this.zombies.push(new Zombie(x, y, false, false, false, false, true)); // White
            } else {
                this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue
            }
        } else if (this.level >= 25) {
            this.greenSpawnCount++;
            if (this.greenSpawnCount % 15 === 0) {
                // Every 15 enemies after level 25, spawn a white glowing enemy
                this.zombies.push(new Zombie(x, y, false, false, false, false, true)); // White zombie
            } else if (this.greenSpawnCount % 20 === 0) {
                // Every 20 green enemies after level 17, spawn a blue enemy
                this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue zombie
            } else if (this.greenSpawnCount % 30 === 0) {
                this.zombies.push(new Zombie(x, y, false, false, true)); // Black zombie
            } else {
                if (this.level < 30) {
                    this.zombies.push(new Zombie(x, y, false, true, false)); // Green zombie
                } else {
                    // If level >=30 fallback to blue to avoid green spawns
                    this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue zombie
                }
            }
        } else if (this.level >= 10) {
            this.greenSpawnCount++;
            if (this.level >= 17 && this.greenSpawnCount % 20 === 0) {
                // Every 20 green enemies after level 17, spawn a blue enemy
                this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue zombie
            } else if (this.greenSpawnCount % 20 === 0) {
                this.zombies.push(new Zombie(x, y, false, false, true)); // Black zombie
            } else {
                if (this.level < 30) {
                    this.zombies.push(new Zombie(x, y, false, true, false)); // Green zombie
                } else {
                    this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue zombie
                }
            }
        } else if (this.level >= 5) {
            this.orangeSpawnCount++;
            if (this.orangeSpawnCount % 15 === 0) {
                if (this.level < 30) {
                    this.zombies.push(new Zombie(x, y, false, true, false));
                } else {
                    this.zombies.push(new Zombie(x, y, false, false, false, true));
                }
            } else {
                this.zombies.push(new Zombie(x, y, true, false, false));
            }
        } else {
            const isBuff = (this.zombiesSpawned + 1) % 5 === 0;
            this.zombies.push(new Zombie(x, y, isBuff, false, false));
        }
        this.zombiesSpawned++;
    }

    checkCollisions() {
        const currentTime = Date.now();

        // Player-zombie collisions
        for (const zombie of this.zombies) {
            const dx = this.player.x - zombie.x;
            const dy = this.player.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.size + zombie.size) {
                if (this.player.takeDamage(currentTime)) {
                    this.gameOver = true;
                    return;
                }
            }
        }

        // Player-boss collision
        if (this.boss) {
            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.size + this.boss.size) {
                if (this.boss.canDamagePlayer(currentTime)) {
                    this.player.health -= this.boss.damage;
                    this.boss.damagePlayer(currentTime);
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        return;
                    }
                }
            }
        }

        // Player-final boss collision
        if (this.finalBoss) {
            const dx = this.player.x - this.finalBoss.x;
            const dy = this.player.y - this.finalBoss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.size + this.finalBoss.size) {
                if (this.finalBoss.canDamagePlayer(currentTime)) {
                    this.player.health -= this.finalBoss.damage;
                    this.finalBoss.damagePlayer(currentTime);
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        return;
                    }
                }
            }
        }

        // Bullet collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            // Check if enemy bullet hits player (boss bullets)
            if (bullet.isBossBullet || bullet.isFinalBossBullet || bullet.isEnemyBullet) {
                const dx = bullet.x - this.player.x;
                const dy = bullet.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.size + this.player.size) {
                    // Enemy bullet hit player!
                    this.bullets.splice(i, 1);
                    this.player.health -= bullet.damage;
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        return;
                    }
                    continue;
                }
            }

            // Check boss collision (only for player bullets)
            if (this.boss && !bullet.isBossBullet && !bullet.isFinalBossBullet) {
                const dx = bullet.x - this.boss.x;
                const dy = bullet.y - this.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.size + this.boss.size) {
                    // Hit boss!
                    this.bullets.splice(i, 1);
                    if (this.boss.takeDamage(bullet.damage)) {
                        // Boss defeated!
                        this.spawnOrbs(this.boss.x, this.boss.y, 150); // 150 orbs
                        this.boss = null;
                        this.bossDefeated = true;
                        this.score += 1000; // Huge score bonus
                    }
                    continue;
                }
            }

            // Check final boss collision (only for player bullets)
            if (this.finalBoss && !bullet.isBossBullet && !bullet.isFinalBossBullet) {
                const dx = bullet.x - this.finalBoss.x;
                const dy = bullet.y - this.finalBoss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.size + this.finalBoss.size) {
                    // Hit final boss!
                    this.bullets.splice(i, 1);
                    if (this.finalBoss.takeDamage(bullet.damage)) {
                        // Final boss defeated!
                        this.spawnOrbs(this.finalBoss.x, this.finalBoss.y, 500); // 500 orbs
                        this.finalBoss = null;
                        this.finalBossDefeated = true;
                        this.score += 5000; // Massive score bonus
                    }
                    continue;
                }
            }

            // Check zombie collisions (only for player bullets)
            if (!bullet.isBossBullet) {
                for (let j = this.zombies.length - 1; j >= 0; j--) {
                    const zombie = this.zombies[j];
                    const dx = bullet.x - zombie.x;
                    const dy = bullet.y - zombie.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < bullet.size + zombie.size) {
                        // Spawn hit particles and popup
                        this.spawnImpact(bullet.x, bullet.y, bullet.damage, zombie.isBlue ? '#4FC3F7' : (zombie.isGreen ? '#66BB6A' : '#FF7043'));
                        if (zombie.takeDamage(bullet.damage)) {
                            if (zombie.isBlue) {
                                this.spawnOrbs(zombie.x, zombie.y, 20);  // 20 orbs for blue enemies
                                this.score += 200;
                            } else if (zombie.isBuff) {
                                this.spawnOrbs(zombie.x, zombie.y, 7);
                                this.score += 80;
                            } else if (zombie.isGreen) {
                                this.spawnOrbs(zombie.x, zombie.y, 4);  // Double orbs for green enemies
                                this.score += 10;
                            } else {
                                this.spawnOrbs(zombie.x, zombie.y, 2);
                                this.score += 10;
                            }
                            if (this.audio && typeof this.audio.playDeath === 'function') this.audio.playDeath();
                            this.zombies.splice(j, 1);
                        }
                        // If the bullet is NOT a wave bullet, remove it on hit. Wave bullets pass through.
                        if (!bullet.isWave) {
                            this.bullets.splice(i, 1);
                        }
                        break;
                    }
                }
            }
        }
    }

    // Spawn a small impact: particles + damage popup
    spawnImpact(x, y, damage, color) {
        if (this.lowPowerMode || this.particleQuality === 0) {
            // In low power mode spawn only a small popup and maybe a single particle
            const text = (damage >= 1 ? `-${Math.round(damage)}` : `-${damage}`);
            this.damagePopups.push(new DamagePopup(x, y - 8, text, YELLOW));
            if (this.particleQuality >= 1) {
                const vx = (Math.random()-0.5) * 0.8;
                const vy = (Math.random()-0.5) * 0.8;
                this.particles.push(new Particle(x, y, vx, vy, 200, 1.5 * this.particleScale, color || ORANGE));
            }
            return;
        }

        // Particles scaled by quality
        const baseCount = Math.min(18, 6 + Math.round(Math.sqrt(damage) * 1.5));
        const qualityMultiplier = (this.particleQuality === 1 ? 0.5 : (this.particleQuality === 3 ? 1.6 : 1.0));
        const count = Math.max(1, Math.round(baseCount * qualityMultiplier));
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 3 + 1) * this.particleScale;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = (Math.random() * 2 + 1) * this.particleScale;
            const life = 250 + Math.random() * 350;
            let p;
            if (this._particlePool.length) p = this._particlePool.pop();
            if (p) p.reset(x, y, vx, vy, life, size, color || ORANGE);
            else p = new Particle(x, y, vx, vy, life, size, color || ORANGE);
            this.particles.push(p);
        }
        // Damage popup
        const text = (damage >= 1 ? `-${Math.round(damage)}` : `-${damage}`);
    let popup;
    if (this._popupPool.length) popup = this._popupPool.pop();
    if (popup) popup.reset(x, y - 8, text, YELLOW);
    else popup = new DamagePopup(x, y - 8, text, YELLOW);
    try { popup.font = this.popupFont; } catch (e) {}
    this.damagePopups.push(popup);

        // trigger small screen shake based on damage
        this.triggerShake(Math.min(12, 1 + Math.round(Math.sqrt(damage))));
    }

    // Screen shake helpers
    triggerShake(strength = 6, duration = 300) {
        this.shakeStrength = Math.max(this.shakeStrength || 0, strength);
        // store the duration so we can compute falloff
        this.shakeDuration = Math.max(this.shakeDuration || 0, duration);
        this.shakeTimer = Math.max(this.shakeTimer || 0, duration);
    }

    updateCheatCodes() {
        const currentTime = Date.now();

        // T + 5 cheat code (skip to level 35) - reliably handled here to avoid UI race conditions
        if (this.tKeyPressed && this.keys['5']) {
            if (!this.cheat5Active) {
                this.cheat5StartTime = currentTime;
                this.cheat5Active = true;
            } else if (currentTime - this.cheat5StartTime >= 3000) { // 3 seconds
                this.level = 35;
                this.orbsCollected = 0;
                this.orbsNeeded = this.level * 10;
                this.player.updateShootSpeed(this.level);
                this.cheat5Active = false;
            }
        }

        // T + 1 cheat code (skip to level 15)
        if (this.tKeyPressed && this.keys['1']) {
            if (!this.cheatActive) {
                this.cheatStartTime = currentTime;
                this.cheatActive = true;
            } else if (currentTime - this.cheatStartTime >= 2000) { // 2 seconds
                // Skip to level 15
                this.level = 15;
                this.orbsCollected = 0;
                this.orbsNeeded = 150;
                this.player.updateShootSpeed(this.level);
                this.cheatActive = false;
            }
        }

        // T + 2 cheat code (skip to level 25/final boss)
        if (this.tKeyPressed && this.keys['2']) {
            if (!this.cheat2Active) {
                this.cheat2StartTime = currentTime;
                this.cheat2Active = true;
            } else if (currentTime - this.cheat2StartTime >= 2000) { // 2 seconds
                // Skip to level 25
                this.level = 25;
                this.orbsCollected = 0;
                this.orbsNeeded = 250;
                this.player.updateShootSpeed(this.level);
                // Clear all enemies
                this.zombies = [];
                this.cheat2Active = false;
            }
        }

        // T + 3 cheat code (set coins to 100 quintillion)
        if (this.tKeyPressed && this.keys['3']) {
            if (!this.cheat3Active) {
                this.cheat3StartTime = currentTime;
                this.cheat3Active = true;
            } else if (currentTime - this.cheat3StartTime >= 2000) { // 2 seconds
                this.coins = 100000000000000000000;
                this.saveCoins();
                this.cheat3Active = false;
            }
        }

        // T + 4 cheat code (clear all progress)
        if (this.tKeyPressed && this.keys['4']) {
            if (!this.cheat4Active) {
                this.cheat4StartTime = currentTime;
                this.cheat4Active = true;
            } else if (currentTime - this.cheat4StartTime >= 2000) { // 2 seconds
                // Clear all progress
                this.coins = 0;
                this.saveCoins();
                
                // Clear all purchased skins
                for (const itemId in this.shopItems) {
                    this.shopItems[itemId].owned = false;
                }
                this.activePlayerSkin = 'default';
                this.saveSkins();
                
                // Reset gun upgrades
                this.gunUpgradeLevel = 0;
                this.saveGunUpgrade();
                
                // Reset health upgrades
                this.healthUpgradeLevel = 0;
                this.saveHealthUpgrade();
                
                // Reset speed upgrades
                this.speedUpgradeLevel = 0;
                this.saveSpeedUpgrade();
                
                // Reset pets
                this.ownedPets = [];
                this.equippedPet = null;
                this.saveOwnedPets();
                this.saveEquippedPet();
                
                this.reset();
                this.cheat4Active = false;
            }
        }
    }

    drawBossBar() {
        const bossToShow = this.finalBoss || this.boss;
        if (bossToShow) {
            const barWidth = SCREEN_WIDTH - 40;
            const barHeight = 25;
            const barX = 20;
            const barY = SCREEN_HEIGHT - 60;

            // Background
            ctx.fillStyle = GRAY;
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.strokeStyle = BLACK;
            ctx.lineWidth = 3;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Health
            const healthPercent = bossToShow.health / bossToShow.maxHealth;
            const healthWidth = healthPercent * barWidth;
            ctx.fillStyle = this.finalBoss ? GOLD : RED;
            ctx.fillRect(barX, barY, healthWidth, barHeight);

            // Boss name
            ctx.fillStyle = WHITE;
            ctx.font = '32px Arial';
            const bossText = this.finalBoss ? 'HANAKO DEMON FOX' : 'MAKS GOD OF WAR';
            const textWidth = ctx.measureText(bossText).width;
            ctx.fillText(bossText, (SCREEN_WIDTH - textWidth) / 2, barY - 20);

            // Health text
            ctx.font = '24px Arial';
            const healthText = `${bossToShow.health}/${bossToShow.maxHealth}`;
            const healthTextWidth = ctx.measureText(healthText).width;
            ctx.fillText(healthText, (SCREEN_WIDTH - healthTextWidth) / 2, barY + barHeight / 2 + 8);
        }
    }

    update() {
        const currentTime = Date.now();

        // Always update player skin first
        if (this.activePlayerSkin !== 'default' && this.shopItems[this.activePlayerSkin]) {
            const skin = this.shopItems[this.activePlayerSkin];
            this.player.color = skin.color;
            this.player.scale = skin.scale || 1;
            this.player.speedBoost = skin.speedBoost || 1;
            this.player.speedMultiplier = skin.speedMultiplier || 1;
            this.player.damageMultiplier = skin.damageMultiplier || 1;
            this.player.isMultiColor = skin.isMultiColor || false;
            
            // Apply health bonuses from skins before other health calculations
            if (skin.fixedHealth) {
                this.player.baseHealth = skin.fixedHealth;
            } else if (skin.healthBonus) {
                this.player.baseHealth = 10 + skin.healthBonus;
            } else {
                this.player.baseHealth = 10;
            }
        } else {
            this.player.color = 'white';
            this.player.scale = 1;
            this.player.speedBoost = 1;
            this.player.speedMultiplier = 1;
            this.player.damageMultiplier = 1;
            this.player.isMultiColor = false;
            this.player.baseHealth = 10;
        }
        
        // Apply health upgrades to base health (only if not using fixed health)
        if (this.activePlayerSkin === 'default' || !this.shopItems[this.activePlayerSkin]?.fixedHealth) {
            this.player.baseHealth = (this.player.baseHealth || 10) + (this.healthUpgradeLevel * 2);
        }
        this.player.updatePetBonuses();
        
        // Apply speed upgrades
        const speedUpgradeMultiplier = Math.pow(1.2, this.speedUpgradeLevel);
        this.player.speedMultiplier = (this.player.speedMultiplier || 1) * speedUpgradeMultiplier;
        
        // Apply gun upgrade effects
        const gunDamageMultiplier = Math.pow(1.3, this.gunUpgradeLevel);
        const gunSpeedMultiplier = Math.pow(1.05, this.gunUpgradeLevel);
        this.player.gunDamageMultiplier = gunDamageMultiplier;
        this.player.gunSpeedMultiplier = gunSpeedMultiplier;

        // Update countdown if active
        if (this.countdownActive) {
            // Continue updating game objects during countdown
            // but don't let the player move or shoot
            this.orbs.forEach(orb => orb.update(this.player));
            this.bullets.forEach(bullet => bullet.update());
            this.zombies.forEach(zombie => zombie.update(this.player));
            if (this.boss) this.boss.update(this.player);
            if (this.finalBoss) this.finalBoss.update(this.player);
            
            return;  // Skip other updates during countdown
        }

        // Don't update game state if paused or in menu
        if (this.inMenu || this.gameOver || this.paused) return;

        // Update coins
        this.updateCoins();

        // Update cheat codes
        this.updateCheatCodes();

        // Check if final boss should spawn
        if (this.level >= 25 && !this.finalBossSpawned && !this.finalBossDefeated) {
            this.spawnFinalBoss();
        }
        // Check if first boss should spawn (only between levels 15-24)
        else if (this.level >= 15 && this.level < 25 && !this.bossSpawned && !this.bossDefeated) {
            this.spawnBoss();
        }

        // Update player and apply skin effects
        if (this.activePlayerSkin !== 'default') {
            const skin = this.shopItems[this.activePlayerSkin];
            this.player.color = skin.color;
            this.player.scale = skin.scale || 1;
            this.player.speedBoost = skin.speedBoost || 1;
        } else {
            this.player.color = 'white';  // Default color
            this.player.scale = 1;
            this.player.speedBoost = 1;
        }

        this.player.update(this.keys, this.mousePos);
        
        // Apply equipped pet to player
        this.player.equippedPet = this.equippedPet;

        // Shooting
        const newBullets = this.player.shoot(this.mousePos, currentTime, this.level, this.autoFireEnabled);
        if (newBullets && newBullets.length && this.audio && typeof this.audio.playShoot === 'function') {
            this.audio.playShoot();
        }
        this.bullets.push(...newBullets);

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].isOffScreen()) {
                this.bullets.splice(i, 1);
            }
        }

        // Update boss
        if (this.boss) {
            this.boss.update(this.player);
            const bossBullets = this.boss.shoot(currentTime);
            this.bullets.push(...bossBullets);
        }

        // Update final boss
        if (this.finalBoss) {
            this.finalBoss.update(this.player);
            const finalBossBullets = this.finalBoss.shoot(currentTime);
            this.bullets.push(...finalBossBullets);
        }

        // Update zombies
        for (const zombie of this.zombies) {
            zombie.update(this.player);
            const zombieBullets = zombie.shoot(currentTime);
            this.bullets.push(...zombieBullets);
        }

        // Update orbs
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            if (this.orbs[i].update(this.player)) {
                this.orbs.splice(i, 1);
                this.orbsCollected++;
            }
        }

        // Update particles (use actual dt passed to update)
        const dt = this._dt || 16;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                // return to pool
                if (this._particlePool.length < 200) this._particlePool.push(p);
            }
        }

        // Update damage popups
        for (let i = this.damagePopups.length - 1; i >= 0; i--) {
            const dp = this.damagePopups[i];
            dp.update(dt);
            if (dp.life <= 0) {
                this.damagePopups.splice(i, 1);
                if (this._popupPool.length < 50) this._popupPool.push(dp);
            }
        }

        // Check level up
        this.checkLevelUp();

        // Spawn zombies
        // Use an effective spawn delay that is 2x faster after level 30
        let effectiveSpawnDelay = this.zombieSpawnDelay;
        if (this.level >= 30) {
            effectiveSpawnDelay = Math.max(250, Math.floor(this.zombieSpawnDelay / 2));
        }
        if (currentTime - this.zombieSpawnTimer > effectiveSpawnDelay) {
            this.spawnZombie();
            this.zombieSpawnTimer = currentTime;
            this.zombieSpawnDelay = Math.max(500, this.zombieSpawnDelay - 50);
        }

        // Check collisions
        this.checkCollisions();

        // Update screen shake timer (use ms dt)
        if (this.shakeTimer > 0) {
            const dec = dt;
            this.shakeTimer = Math.max(0, this.shakeTimer - dec);
            // reduce strength proportionally to remaining time
            if (this.shakeDuration > 0) {
                const pct = this.shakeTimer / this.shakeDuration;
                this.shakeStrength = this.shakeStrength * pct;
            }
        } else {
            this.shakeStrength = 0;
            this.shakeDuration = 0;
        }
    }

    drawOrbBar() {
        const barWidth = 300;
        const barHeight = 15;
        const barX = 250;  // Shifted right by 50px to avoid overlapping autofire button
        const barY = 40;   // Lowered to align with score and coins

        ctx.fillStyle = GRAY;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = BLACK;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        const progress = this.orbsCollected / this.orbsNeeded;
        const progressWidth = progress * barWidth;
        ctx.fillStyle = GREEN;
        ctx.fillRect(barX, barY, progressWidth, barHeight);

        ctx.fillStyle = WHITE;
        ctx.font = '28px Arial';
        ctx.fillText(`Lv.${this.level}`, barX - 50, barY + 13);
        ctx.font = '20px Arial';
        ctx.fillText(`${this.orbsCollected}/${this.orbsNeeded}`, barX + barWidth + 10, barY + 13);
    }

    drawCheatProgress() {
        if (this.cheatActive || this.cheat2Active || this.cheat3Active || this.cheat4Active || this.cheat5Active) {
            const currentTime = Date.now();
            let progress, text;
            
            if (this.cheatActive) {
                progress = (currentTime - this.cheatStartTime) / 2000;
                text = `Skip to Level 15: ${Math.min(100, progress * 100).toFixed(0)}%`;
            } else if (this.cheat2Active) {
                progress = (currentTime - this.cheat2StartTime) / 2000;
                text = `Skip to Final Boss: ${Math.min(100, progress * 100).toFixed(0)}%`;
            } else if (this.cheat3Active) {
                progress = (currentTime - this.cheat3StartTime) / 2000;
                text = `Set Coins to 100 QUINTILLION: ${Math.min(100, progress * 100).toFixed(0)}%`;
            } else if (this.cheat4Active) {
                progress = (currentTime - this.cheat4StartTime) / 2000;
                text = `Clear All Progress: ${Math.min(100, progress * 100).toFixed(0)}%`;
            }

            // T+5 cheat progress
            if (this.cheat5Active) {
                const now = Date.now();
                const cheat5Progress = (now - this.cheat5StartTime) / 3000; // 3 seconds
                if (cheat5Progress >= 1) {
                    this.level = 35;
                    this.orbsCollected = 0;
                    this.orbsNeeded = this.level * 10;
                    this.player.updateShootSpeed(this.level);
                    this.cheat5Active = false;
                }
                // If no other text is set, show this progress
                if (!text) {
                    progress = cheat5Progress;
                    text = `Skip to Level 35: ${Math.min(100, progress * 100).toFixed(0)}%`;
                }
            }

            ctx.font = '32px Arial';
            ctx.fillStyle = YELLOW;
            ctx.fillText(text, SCREEN_WIDTH/2 - 120, 100);
        }
    }

    drawMenu() {
        // Clear canvas with gray background
        ctx.fillStyle = '#808080';  // Gray background
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Draw coins in top-right corner
        ctx.font = '28px Arial';
        ctx.fillStyle = GOLD;
        const coinText = `${this.translations[this.selectedLanguage].coins}: ${this.coins}`;
        const coinTextWidth = ctx.measureText(coinText).width;
        ctx.fillText(coinText, SCREEN_WIDTH - coinTextWidth - 20, 40);

        // Draw title
        ctx.fillStyle = WHITE;
        ctx.font = '64px Arial';
        const title = this.translations[this.selectedLanguage].gameTitle;
        const titleWidth = ctx.measureText(title).width;
        ctx.fillText(title, (SCREEN_WIDTH - titleWidth) / 2, SCREEN_HEIGHT / 4);

        // Draw Start button (green)
        const startBtn = this.menuButtons.start;
        ctx.fillStyle = '#00AA00';  // Green
        ctx.fillRect(startBtn.x, startBtn.y, startBtn.width, startBtn.height);
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(startBtn.x, startBtn.y, startBtn.width, startBtn.height);
        
        // Start text
        ctx.fillStyle = WHITE;
        ctx.font = '32px Arial';  // Back to original size
        const startText = this.translations[this.selectedLanguage].start;
        const startTextWidth = ctx.measureText(startText).width;
        ctx.fillText(startText, startBtn.x + (startBtn.width - startTextWidth) / 2, startBtn.y + 40);  // Back to original position

        // Draw Options button (red)
        const optionsBtn = this.menuButtons.options;
        ctx.fillStyle = '#AA0000';  // Red
        ctx.fillRect(optionsBtn.x, optionsBtn.y, optionsBtn.width, optionsBtn.height);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(optionsBtn.x, optionsBtn.y, optionsBtn.width, optionsBtn.height);
        
        // Options text
        ctx.fillStyle = WHITE;
        ctx.font = '32px Arial';  // Back to original size
        const optionsText = this.translations[this.selectedLanguage].options;
        const optionsTextWidth = ctx.measureText(optionsText).width;
        ctx.fillText(optionsText, optionsBtn.x + (optionsBtn.width - optionsTextWidth) / 2, optionsBtn.y + 40);  // Back to original position

        // Draw Shop button (gold)
        const shopBtn = this.menuButtons.shop;
        ctx.fillStyle = GOLD;
        ctx.fillRect(shopBtn.x, shopBtn.y, shopBtn.width, shopBtn.height);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(shopBtn.x, shopBtn.y, shopBtn.width, shopBtn.height);
        
        // Shop text
        ctx.fillStyle = WHITE;
        ctx.font = '32px Arial';
        const shopText = 'Shop';
        const shopTextWidth = ctx.measureText(shopText).width;
        ctx.fillText(shopText, shopBtn.x + (shopBtn.width - shopTextWidth) / 2, shopBtn.y + 40);

        // Draw Options menu if active
        if (this.inOptions) {
            // Semi-transparent black background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);
            ctx.strokeStyle = WHITE;
            ctx.strokeRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);

            // Title
            ctx.fillStyle = WHITE;
            ctx.font = '32px Arial';
            ctx.fillText('Options', SCREEN_WIDTH/2 - 50, 90);

            // Draw option buttons
            for (const [tabName, btn] of Object.entries(this.optionButtons)) {
                ctx.fillStyle = this.activeOptionTab === tabName ? '#AA0000' : '#666666';
                ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
                
                ctx.fillStyle = WHITE;
                ctx.font = '24px Arial';
                const text = this.translations[this.selectedLanguage][tabName];
                const textWidth = ctx.measureText(text).width;
                ctx.fillText(text, btn.x + (btn.width - textWidth)/2, btn.y + 35);
            }

            // Draw content box for active tab
            if (this.activeOptionTab) {
                const contentBox = {
                    width: 500,
                    height: 300,
                    x: SCREEN_WIDTH/2 - 250,
                    y: SCREEN_HEIGHT/2 + 20
                };

                // Draw content box
                ctx.fillStyle = '#222222';
                ctx.fillRect(contentBox.x, contentBox.y, contentBox.width, contentBox.height);
                ctx.strokeStyle = '#444444';
                ctx.strokeRect(contentBox.x, contentBox.y, contentBox.width, contentBox.height);

                const contentX = contentBox.x + contentBox.width/2;
                const contentY = contentBox.y + 50;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';

                switch(this.activeOptionTab) {
                    case 'controls':
                        // Basic control instructions
                        ctx.fillStyle = WHITE;
                        ctx.font = '16px Arial';
                        ctx.fillText(this.translations[this.selectedLanguage].move + ' / ' + this.translations[this.selectedLanguage].aim, contentX, contentY - 10);

                        // Touch controls visibility toggle
                        const toggleX = contentBox.x + 40;
                        const toggleY = contentBox.y + 90;
                        const toggleW = 180;
                        const toggleH = 36;
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(toggleX, toggleY, toggleW, toggleH);
                        ctx.strokeStyle = WHITE;
                        ctx.strokeRect(toggleX, toggleY, toggleW, toggleH);
                        ctx.fillStyle = WHITE;
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'left';

                        // Fullscreen toggle button
                        const fsX = contentBox.x + contentBox.width - 220;
                        const fsY = contentBox.y + 90;
                        const fsW = 180;
                        const fsH = 36;
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(fsX, fsY, fsW, fsH);
                        ctx.strokeStyle = WHITE;
                        ctx.strokeRect(fsX, fsY, fsW, fsH);
                        ctx.fillStyle = WHITE;
                        ctx.textAlign = 'center';
                        ctx.fillText(this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen', fsX + fsW/2, fsY + 24);
                        ctx.textAlign = 'left';
                        ctx.fillText('Touch controls: ' + (this.touchControlsVisible ? 'Shown' : 'Hidden'), toggleX + 8, toggleY + 24);

                        // Opacity slider
                        const opacityX = toggleX;
                        const opacityY = toggleY + 56;
                        ctx.fillStyle = WHITE;
                        ctx.font = '14px Arial';
                        ctx.fillText('Controls opacity: ' + Math.round(this.touchControlsOpacity * 100) + '%', opacityX, opacityY + 14);
                        const sliderW = 320;
                        const sliderH = 12;
                        const sliderTrackX = opacityX;
                        const sliderTrackY = opacityY + 28;
                        ctx.fillStyle = '#444';
                        ctx.fillRect(sliderTrackX, sliderTrackY, sliderW, sliderH);
                        // thumb
                        const thumbX = sliderTrackX + Math.round((this.touchControlsOpacity - 0.2) / 0.8 * sliderW);
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(thumbX - 6, sliderTrackY - 6, 12, sliderH + 12);

                        // Size multiplier slider
                        const sizeX = opacityX;
                        const sizeY = sliderTrackY + 36;
                        ctx.fillStyle = WHITE;
                        ctx.fillText('Controls size: ' + Math.round(this.touchControlsSize * 100) + '%', sizeX, sizeY + 14);
                        const sizeTrackY = sizeY + 28;
                        ctx.fillStyle = '#444';
                        ctx.fillRect(sizeX, sizeTrackY, sliderW, sliderH);
                        const sizeThumbX = sizeX + Math.round((this.touchControlsSize - 0.6) / 1.4 * sliderW);
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(sizeThumbX - 6, sizeTrackY - 6, 12, sliderH + 12);

                        ctx.textAlign = 'left';
                        break;

                    case 'cheats':
                        const cheatOptions = [
                            { key: 'T + 1', desc: this.translations[this.selectedLanguage].cheatLv15 },
                            { key: 'T + 2', desc: this.translations[this.selectedLanguage].cheatBoss },
                            { key: 'T + 3', desc: this.translations[this.selectedLanguage].cheatCoins },
                            { key: 'T + 4', desc: this.translations[this.selectedLanguage].cheatReset }
                        ];
                        
                        // Draw each cheat option as a button
                        cheatOptions.forEach((option, index) => {
                            const btnY = contentY + (index * 55);
                            const btnWidth = 450;
                            const btnHeight = 45;
                            const btnX = contentX - btnWidth/2;
                            
                            // Button background
                            ctx.fillStyle = '#333333';
                            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
                            ctx.strokeStyle = WHITE;
                            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
                            
                            // Button text - key and description on separate lines
                            ctx.fillStyle = '#FFD700';  // Gold color for key
                            ctx.font = '18px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(option.key, contentX, btnY + 18);
                            
                            ctx.fillStyle = WHITE;
                            ctx.font = '14px Arial';
                            ctx.fillText(option.desc, contentX, btnY + 35);
                        });
                        break;

                    case 'difficulty':
                        ctx.fillStyle = WHITE;
                        ctx.fillText(this.translations[this.selectedLanguage].easy, contentX, contentY);
                        ctx.fillText(this.translations[this.selectedLanguage].normal, contentX, contentY + 40);
                        ctx.fillText(this.translations[this.selectedLanguage].hard, contentX, contentY + 80);
                        ctx.fillText(this.translations[this.selectedLanguage].difficultyNote, contentX, contentY + 140);
                        break;

                    case 'visuals':
                        ctx.fillStyle = WHITE;
                        ctx.font = '18px Arial';
                        ctx.textAlign = 'left';
                        const visX = contentBox.x + 30;
                        let visY = contentBox.y + 40;

                        // Low Power toggle
                        ctx.fillText('Low Power Mode: ' + (this.lowPowerMode ? 'ON' : 'OFF'), visX, visY);
                        const lpBtnX = contentBox.x + contentBox.width - 160;
                        const lpBtnY = visY - 18;
                        ctx.fillStyle = this.lowPowerMode ? '#4CAF50' : '#333333';
                        ctx.fillRect(lpBtnX, lpBtnY, 140, 28);
                        ctx.strokeStyle = WHITE; ctx.strokeRect(lpBtnX, lpBtnY, 140, 28);
                        ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText(this.lowPowerMode ? 'Disable' : 'Enable', lpBtnX + 70, lpBtnY + 19);
                        ctx.textAlign = 'left';
                        visY += 50;

                        // Particle quality
                        ctx.fillText('Particle Quality: ' + (['Off','Low','Normal','High'][this.particleQuality] || 'Normal'), visX, visY);
                        const pqX = visX; const pqY = visY + 20;
                        const pqW = 320; const pqH = 10;
                        ctx.fillStyle = '#444'; ctx.fillRect(pqX, pqY, pqW, pqH);
                        const pqThumb = pqX + (this.particleQuality / 3) * pqW;
                        ctx.fillStyle = '#FFD700'; ctx.fillRect(pqThumb - 6, pqY - 6, 12, pqH + 12);
                        visY += 50;

                        // Particle scale
                        ctx.fillText('Particle Size: ' + Math.round(this.particleScale * 100) + '%', visX, visY);
                        const psX = visX; const psY = visY + 20; const psW = 320; const psH = 10;
                        ctx.fillStyle = '#444'; ctx.fillRect(psX, psY, psW, psH);
                        const psThumb = psX + ((this.particleScale - 0.5) / 2.5) * psW;
                        ctx.fillStyle = '#FFD700'; ctx.fillRect(psThumb - 6, psY - 6, 12, psH + 12);
                        visY += 50;

                        // Popup font preview
                        ctx.fillText('Damage Popup Font:', visX, visY);
                        ctx.fillStyle = WHITE; ctx.font = '14px Arial'; ctx.fillText(this.popupFont, visX + 160, visY);
                        ctx.textAlign = 'left'; ctx.font = '20px Arial';
                        break;

                    case 'credits':
                        ctx.fillStyle = WHITE;
                        ctx.fillText(this.translations[this.selectedLanguage].developer, contentX, contentY);
                        ctx.fillText(this.translations[this.selectedLanguage].soundDesign, contentX, contentY + 40);
                        ctx.fillText(this.translations[this.selectedLanguage].art, contentX, contentY + 80);
                        ctx.fillText(this.translations[this.selectedLanguage].sponsors, contentX, contentY + 120);
                        break;
                    case 'debug':
                        // Draw description
                        ctx.fillStyle = WHITE;
                        ctx.font = '18px Arial';
                        ctx.fillText(this.translations[this.selectedLanguage].debugDescription, contentBox.x + 20, contentBox.y + 40);

                        // List localStorage keys with pagination
                        const keys = Object.keys(window.localStorage).sort();
                        if (keys.length === 0) {
                            ctx.fillStyle = '#808080';
                            ctx.font = '16px Arial';
                            ctx.fillText(this.translations[this.selectedLanguage].noLocalStorageKeys, contentBox.x + 20, contentBox.y + 80);
                        } else {
                            ctx.font = '14px Arial';
                            ctx.textAlign = 'left';
                            const pageSize = this.debugPageSize || 6;
                            const page = this.debugPage || 0;
                            const start = page * pageSize;
                            const end = Math.min(start + pageSize, keys.length);
                            let y = contentBox.y + 80;
                            const lineHeight = 28;

                            for (let i = start; i < end; i++) {
                                const k = keys[i];
                                ctx.fillStyle = '#FFFF00';
                                ctx.fillText(k, contentBox.x + 20, y);

                                const btnX = contentBox.x + contentBox.width - 220;
                                const btnW = 60;
                                const btnH = 20;

                                // View
                                ctx.fillStyle = '#4CAF50';
                                ctx.fillRect(btnX, y - 14, btnW, btnH);
                                ctx.fillStyle = WHITE;
                                ctx.font = '12px Arial';
                                ctx.fillText(this.translations[this.selectedLanguage].view, btnX + 8, y);

                                // Edit
                                ctx.fillStyle = '#2196F3';
                                ctx.fillRect(btnX + btnW + 10, y - 14, btnW, btnH);
                                ctx.fillStyle = WHITE;
                                ctx.fillText(this.translations[this.selectedLanguage].edit, btnX + btnW + 18, y);

                                // Delete
                                ctx.fillStyle = '#F44336';
                                ctx.fillRect(btnX + (btnW + 10) * 2, y - 14, btnW, btnH);
                                ctx.fillStyle = WHITE;
                                ctx.fillText(this.translations[this.selectedLanguage].delete, btnX + (btnW + 10) * 2 + 10, y);

                                y += lineHeight;
                            }

                            // Pagination controls
                            const controlsY = contentBox.y + contentBox.height - 30;
                            const ctrlW = 80;
                            const ctrlH = 24;
                            const ctrlX = contentBox.x + contentBox.width/2 - (ctrlW * 2 + 10)/2;

                            // Prev
                            ctx.fillStyle = page > 0 ? '#666666' : '#333333';
                            ctx.fillRect(ctrlX, controlsY, ctrlW, ctrlH);
                            ctx.fillStyle = WHITE;
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('Prev', ctrlX + ctrlW/2, controlsY + 16);

                            // Page label
                            const pageLabel = `Page ${page + 1} / ${Math.max(1, Math.ceil(keys.length / pageSize))}`;
                            ctx.fillStyle = '#CCCCCC';
                            ctx.fillText(pageLabel, ctrlX + ctrlW + 10 + 60, controlsY + 16);

                            // Next
                            const nextX = ctrlX + ctrlW + 140;
                            ctx.fillStyle = end < keys.length ? '#666666' : '#333333';
                            ctx.fillRect(nextX, controlsY, ctrlW, ctrlH);
                            ctx.fillStyle = WHITE;
                            ctx.fillText('Next', nextX + ctrlW/2, controlsY + 16);

                            ctx.textAlign = 'left';
                        }
                        ctx.textAlign = 'left';
                        break;
                }
                ctx.textAlign = 'left';
            } else {
                ctx.fillStyle = '#808080';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                const text = this.translations[this.selectedLanguage].selectOption;
                ctx.fillText(text, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
                ctx.textAlign = 'left';
            }

            // Close instruction at bottom
            ctx.fillStyle = '#808080';
            ctx.font = '20px Arial';
            const closeText = this.translations[this.selectedLanguage].closeOptions;
            const closeTextWidth = ctx.measureText(closeText).width;
            ctx.fillText(closeText, SCREEN_WIDTH/2 - closeTextWidth/2, SCREEN_HEIGHT - 80);
        }

    // Quick save/import instructions (small)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Export your progress: Export Save → player-save.json', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 220);
    ctx.fillText('Import saved file: Options → Import Save (choose player-save.json)', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 240);
    ctx.textAlign = 'left';

        // Draw Shop menu if active
        if (this.inShop) {
            console.log('Drawing shop. Pets page:', this.inPetsPage);
            if (this.inPetsPage) {
                this.drawPetsPage(ctx);
            } else {
                this.drawShopPage(ctx);
            }
        }
    }

    drawPauseMenu() {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Pause menu box
        const boxWidth = 500;
        const boxHeight = 300;
        const boxX = SCREEN_WIDTH/2 - boxWidth/2;
        const boxY = SCREEN_HEIGHT/2 - boxHeight/2;

        // Draw box with gradient
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(1, '#222222');
        ctx.fillStyle = gradient;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Box border
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Menu title
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', SCREEN_WIDTH/2, boxY + 80);

        // Instructions
        ctx.font = '28px Arial';
        ctx.fillText('Press P to Resume', SCREEN_WIDTH/2, boxY + 150);
        ctx.fillText('Press ESC for Menu', SCREEN_WIDTH/2, boxY + 200);
        
        ctx.textAlign = 'left'; // Reset alignment
    }

    draw() {
        // Save the current transform
        ctx.save();
        // Apply screen shake if active
        if (this.shakeStrength && this.shakeStrength > 0) {
            const sx = (Math.random() * 2 - 1) * this.shakeStrength;
            const sy = (Math.random() * 2 - 1) * this.shakeStrength;
            ctx.translate(Math.round(sx), Math.round(sy));
        }
        
        // Apply upside-down effect if enabled
        if (this.isUpsideDown) {
            ctx.translate(SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.rotate(Math.PI);
        }
        
        // Clear canvas
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (this.inMenu) {
            this.drawMenu();
            ctx.restore();
            return;
        }

        // Draw game objects in proper order (back to front)
        this.orbs.forEach(orb => orb.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.zombies.forEach(zombie => zombie.draw(ctx));
        
        // Draw bosses
        if (this.boss) {
            this.boss.draw(ctx);
        }
        if (this.finalBoss) {
            this.finalBoss.draw(ctx);
        }
        
        // Draw player last so it's on top
        this.player.draw(ctx);

    // Draw particles (above world, below UI)
    for (const p of this.particles) p.draw(ctx);
    // Draw damage popups
    for (const dp of this.damagePopups) dp.draw(ctx);

        // Draw UI elements
        this.drawOrbBar();
        this.drawCheatProgress();
        this.drawBossBar();

        // Draw score and coins
        ctx.fillStyle = WHITE;
        ctx.font = '36px Arial';
        ctx.fillText(`${this.translations[this.selectedLanguage].score}: ${this.score}`, 10, 40);
        ctx.font = '28px Arial';
        ctx.fillStyle = GOLD;
        ctx.fillText(`${this.translations[this.selectedLanguage].coins}: ${this.coins}`, 10, 80);

        // Animated health bar (top-left, above score)
        try {
            const healthX = 10;
            const healthY = 100;
            const healthW = 220;
            const healthH = 18;
            // Smooth current display towards actual player.health
            const target = Math.max(0, Math.min(this.player.maxHealth || 10, this.player.health));
            // lerp
            this.currentHealthDisplay += (target - this.currentHealthDisplay) * 0.08;
            const pct = (this.currentHealthDisplay / (this.player.maxHealth || 10));

            // Background
            ctx.fillStyle = '#222222';
            ctx.fillRect(healthX, healthY, healthW, healthH);
            // Foreground with gradient
            const g = ctx.createLinearGradient(healthX, 0, healthX + healthW, 0);
            g.addColorStop(0, '#FF5252');
            g.addColorStop(1, '#FF9800');
            ctx.fillStyle = g;
            ctx.fillRect(healthX, healthY, Math.max(0, pct * healthW), healthH);
            // Border and text
            ctx.strokeStyle = WHITE; ctx.lineWidth = 2; ctx.strokeRect(healthX, healthY, healthW, healthH);
            ctx.fillStyle = WHITE; ctx.font = '16px Arial'; ctx.fillText(`HP: ${Math.round(this.player.health)}/${Math.round(this.player.maxHealth)}`, healthX + healthW/2, healthY + 14);
        } catch (e) {}

        // Draw autofire toggle button (top-right)
        const autoFireButtonX = SCREEN_WIDTH - 130;
        const autoFireButtonY = 10;
        const autoFireButtonWidth = 120;
        const autoFireButtonHeight = 35;
        
        ctx.fillStyle = this.autoFireEnabled ? '#4CAF50' : '#F44336';
        ctx.fillRect(autoFireButtonX, autoFireButtonY, autoFireButtonWidth, autoFireButtonHeight);
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(autoFireButtonX, autoFireButtonY, autoFireButtonWidth, autoFireButtonHeight);
        
        ctx.fillStyle = WHITE;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const autoFireText = this.autoFireEnabled ? 'AutoFire: ON' : 'AutoFire: OFF';
        ctx.fillText(autoFireText, autoFireButtonX + autoFireButtonWidth/2, autoFireButtonY + 23);
        ctx.textAlign = 'left';

        // Draw countdown if active
        if (this.countdownActive) {
            const elapsed = Date.now() - this.countdownStart;
            const remainingTime = 3 - Math.floor(elapsed/1000);
            
            if (remainingTime > 0) {
                // Dark overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

                // Draw countdown number
                ctx.fillStyle = WHITE;
                ctx.font = 'bold 128px Arial';
                const text = remainingTime.toString();
                const textWidth = ctx.measureText(text).width;
                const textHeight = 128; // Approximate height of the font

                // Position text in center
                const centerX = SCREEN_WIDTH/2 - textWidth/2;
                const centerY = SCREEN_HEIGHT/2 + textHeight/3;
                
                // Draw with shadow for better visibility
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(text, centerX, centerY);
                ctx.shadowBlur = 0;

                // Draw "Get Ready!" text
                ctx.font = 'bold 48px Arial';
                const readyText = this.translations[this.selectedLanguage].getReady;
                const readyWidth = ctx.measureText(readyText).width;
                ctx.fillText(readyText, SCREEN_WIDTH/2 - readyWidth/2, centerY - 100);
            } else {
                this.countdownActive = false;
            }
        }

        // Handle countdown overlay
        if (this.countdownActive) {
            const elapsed = Date.now() - this.countdownStart;
            const remainingTime = Math.ceil(3 - elapsed/1000);
            
            if (remainingTime <= 0) {
                this.countdownActive = false;
                this.inMenu = false;
                this.paused = false;
            } else {
                // Draw semi-transparent background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                
                // Draw countdown number with animation
                ctx.fillStyle = WHITE;
                ctx.font = 'bold 128px Arial';

                // Scale animation
                const animProgress = (elapsed % 1000) / 1000;  // 0 to 1 each second
                const scale = 1 + Math.sin(animProgress * Math.PI) * 0.2;  // Scale between 1 and 1.2
                
                ctx.save();
                ctx.translate(SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
                ctx.scale(scale, scale);
                
                const text = remainingTime.toString();
                const textWidth = ctx.measureText(text).width;
                ctx.fillText(text, -textWidth/2, 50);  // Centered text

                // Draw "Get Ready!" text
                ctx.font = 'bold 48px Arial';
                const readyText = "Get Ready!";
                const readyWidth = ctx.measureText(readyText).width;
                ctx.fillText(readyText, -readyWidth/2, -100);

                ctx.restore();
            }
            return;
        }

        // Draw pause menu if game is paused (but not in main menu)
        if (this.paused && !this.countdownActive && !this.inMenu) {
            this.drawPauseMenu();
        }

        // Draw game state messages
        if (this.gameOver) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].gameOver, SCREEN_WIDTH/2 - 120, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText(`${this.translations[this.selectedLanguage].finalScore}: ${this.score}`, SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 + 40);
            ctx.fillText(this.translations[this.selectedLanguage].pressToRestart, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 80);
        } else if (this.paused && (this.countdownActive || this.inMenu)) {
            // Only draw the simple paused text when the full pause menu isn't displayed
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].paused, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].pressToResume, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 40);
        }
        
        // Draw on-screen touch controls for mobile (joystick + fire)
        try {
            if (!this.touchControlsVisible) {
                // Nothing to draw
            } else {
                const j = this.touchState.joystick;
                const fb = this.touchState.fireButton;
                // Show controls if touch input was used or on small screens
                const showControls = ('ontouchstart' in window) || (SCREEN_WIDTH <= 900);
                if (showControls) {
                    // Compute scaled sizes based on user multiplier
                    const mult = this.touchControlsSize || 1.0;
                    const baseKnobExtra = 8;
                    const baseAlpha = this.touchControlsOpacity || 0.9;

                    // Joystick base
                    ctx.save();
                    ctx.globalAlpha = Math.max(0.15, baseAlpha * 0.6);
                    ctx.fillStyle = '#222222';
                    ctx.beginPath();
                    ctx.arc(j.startX, j.startY, Math.round(j.radius * mult) + baseKnobExtra, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = Math.max(0.3, baseAlpha * 0.95);
                    // Joystick knob (size relative to radius)
                    const knobR = Math.max(12, Math.round(j.radius * 0.42 * mult));
                    ctx.fillStyle = j.active ? '#4CAF50' : '#888888';
                    ctx.beginPath();
                    ctx.arc(j.x, j.y, knobR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // Fire button
                    ctx.save();
                    ctx.globalAlpha = Math.max(0.25, baseAlpha * 0.85);
                    ctx.fillStyle = fb.active ? '#FF7043' : '#E53935';
                    ctx.beginPath();
                    ctx.arc(fb.x, fb.y, Math.round(fb.radius * mult), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = WHITE;
                    const fireFontSize = Math.max(12, Math.round(fb.radius * 0.42 * mult));
                    ctx.font = `bold ${fireFontSize}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText('FIRE', fb.x, fb.y + Math.round(fireFontSize/3));
                    ctx.textAlign = 'left';
                    ctx.restore();
                }
            }
        } catch (err) {
            // Don't crash draw on odd platforms
            console.warn('Touch control draw error', err);
        }

        // Draw crosshair/aim preview when firing
        try {
            const aim = this.mousePos || null;
            const isFiring = this.player && (this.player.isMouseShooting || this.touchState.fireButton.active || this.autoFireEnabled && this.autoFireEnabled);
            if (aim && isFiring) {
                ctx.save();
                ctx.strokeStyle = '#FFDD33';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const cx = Math.round(aim.x);
                const cy = Math.round(aim.y);
                const size = 12;
                // horizontal
                ctx.moveTo(cx - size, cy);
                ctx.lineTo(cx + size, cy);
                // vertical
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx, cy + size);
                ctx.stroke();
                // small center dot
                ctx.fillStyle = '#FF7043';
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } catch (err) {
            console.warn('Crosshair draw error', err);
        }

        // Draw first-time mobile tutorial overlay
        try {
            const isTouchDevice = ('ontouchstart' in window) || (SCREEN_WIDTH <= 900);
            if (isTouchDevice && !this.touchTutorialShown) {
                ctx.save();
                // dark translucent backdrop
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

                // Card
                const cardW = Math.min(640, SCREEN_WIDTH - 80);
                const cardH = Math.min(360, SCREEN_HEIGHT - 160);
                const cardX = (SCREEN_WIDTH - cardW) / 2;
                const cardY = (SCREEN_HEIGHT - cardH) / 2;
                ctx.fillStyle = '#111';
                ctx.fillRect(cardX, cardY, cardW, cardH);
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(cardX, cardY, cardW, cardH);

                ctx.fillStyle = WHITE;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Touch Controls Tutorial', SCREEN_WIDTH/2, cardY + 36);

                ctx.font = '16px Arial';
                ctx.textAlign = 'left';
                const leftX = cardX + 24;
                let ly = cardY + 70;
                const lineH = 28;
                ctx.fillText('- Drag the left joystick to move', leftX, ly); ly += lineH;
                ctx.fillText('- Hold the right FIRE button to shoot', leftX, ly); ly += lineH;
                ctx.fillText('- Drag while holding FIRE to aim', leftX, ly); ly += lineH;
                ctx.fillText('- Tap Options → Controls to tweak size/opacity', leftX, ly); ly += lineH;

                // Dismiss button
                const btnW = 140; const btnH = 40;
                const btnX = cardX + (cardW - btnW) / 2;
                const btnY = cardY + cardH - btnH - 20;
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(btnX, btnY, btnW, btnH);
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(btnX, btnY, btnW, btnH);
                ctx.fillStyle = WHITE;
                ctx.textAlign = 'center';
                ctx.font = '18px Arial';
                ctx.fillText('Got it, thanks', btnX + btnW/2, btnY + btnH/2 + 6);

                // store dismiss rect for click/touch handling
                this._touchTutorialDismissRect = { x: btnX, y: btnY, w: btnW, h: btnH };

                ctx.restore();
            }
        } catch (err) {
            console.warn('Tutorial draw error', err);
        }

        // Restore the original transform
        ctx.restore();
    }

    gameLoop() {
        const now = performance.now();
        const dt = Math.min(60, now - (this._lastFrameTime || now));
        this._lastFrameTime = now;
        this._dt = dt; // ms
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }

    drawShopPage(ctx) {
    // Semi-transparent black background (expanded)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);
    ctx.strokeStyle = WHITE;
    ctx.strokeRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);

        // Title
        ctx.fillStyle = GOLD;
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Shop', SCREEN_WIDTH/2, 90);

    // Shop box coordinates (consistent with expanded shop window)
    const shopBoxX = 40;
    const shopBoxY = 20;
    const shopBoxWidth = SCREEN_WIDTH - 80;
    const shopBoxHeight = SCREEN_HEIGHT - 40;

    // Pets button (top right of shop window) - Enhanced visibility
    const petsButtonWidth = 90;
    const petsButtonHeight = 35;
    const petsButtonX = shopBoxX + shopBoxWidth - petsButtonWidth - 20; // 20px margin from right edge
    const petsButtonY = shopBoxY + 30; // Near top of shop window
        
        // Glowing pets button
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(petsButtonX, petsButtonY, petsButtonWidth, petsButtonHeight);
        ctx.shadowBlur = 0;
        
        // White border
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(petsButtonX, petsButtonY, petsButtonWidth, petsButtonHeight);
        
        // Text
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐾 PETS', petsButtonX + petsButtonWidth/2, petsButtonY + 23);
        
        // Debug: Draw button bounds
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(petsButtonX, petsButtonY, petsButtonWidth, petsButtonHeight);

        // Draw shop items
        const itemHeight = 80;
        const itemWidth = 120;
        const itemSpacing = 15;
        const rowSpacing = 20;
        
        // First row (3 items)
        const firstRowStartX = SCREEN_WIDTH/2 - ((itemWidth * 3 + itemSpacing * 2) / 2);
        const firstRowY = SCREEN_HEIGHT/2 - 80;
        
        // Second row (2 items)
        const secondRowStartX = SCREEN_WIDTH/2 - ((itemWidth * 2 + itemSpacing) / 2);
        const secondRowY = firstRowY + itemHeight + rowSpacing;

        let index = 0;
        for (const [itemId, item] of Object.entries(this.shopItems)) {
            let itemX, itemY;
            
            if (index < 3) {
                // First row
                itemX = firstRowStartX + (itemWidth + itemSpacing) * index;
                itemY = firstRowY;
            } else {
                // Second row (shifted left by 100px)
                itemX = secondRowStartX + (itemWidth + itemSpacing) * (index - 3) - 100;
                itemY = secondRowY;
            }

            // Background color for skins based on color for better visibility
            ctx.fillStyle = 'rgba(40, 40, 40, 0.9)'; // Dark background
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            
            // Item border
            ctx.strokeStyle = item.owned ? (this.activePlayerSkin === itemId ? '#00FF00' : '#FFFF00') : WHITE;
            ctx.lineWidth = item.owned ? 3 : 1;
            ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

            // Draw character preview (circle in the item's color)
            const previewX = itemX + itemWidth/2;
            const previewY = itemY + 25;
            const previewRadius = 12;
            
            if (item.isMultiColor) {
                // Draw multi-colored preview
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(previewX, previewY, previewRadius, 0, Math.PI, false);
                ctx.fill();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(previewX, previewY, previewRadius, 0, Math.PI, true);
                ctx.fill();
            } else {
                // Draw single colored preview
                ctx.fillStyle = item.color || 'white';
                ctx.beginPath();
                ctx.arc(previewX, previewY, previewRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw special effects indicators
            if (item.speedBoost || item.speedMultiplier > 1) {
                // Draw speed indicator arrows
                ctx.strokeStyle = WHITE;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(itemX + itemWidth/2 + 15, itemY + 20);
                ctx.lineTo(itemX + itemWidth/2 + 22, itemY + 20);
                ctx.lineTo(itemX + itemWidth/2 + 19, itemY + 17);
                ctx.moveTo(itemX + itemWidth/2 + 22, itemY + 20);
                ctx.lineTo(itemX + itemWidth/2 + 19, itemY + 23);
                ctx.stroke();
            }
            
            if (item.damageMultiplier && item.damageMultiplier > 1) {
                // Draw damage indicator (sword/star)
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔', itemX + itemWidth/2 + 20, itemY + 25);
            }

            // Draw item name
            ctx.fillStyle = WHITE;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, itemX + itemWidth/2, itemY + 45);

            // Draw price or status
            ctx.font = '12px Arial';
            if (item.owned) {
                if (this.activePlayerSkin === itemId) {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText('EQUIPPED', itemX + itemWidth/2, itemY + 62);
                } else {
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillText('Click to Equip', itemX + itemWidth/2, itemY + 62);
                }
            } else {
                ctx.fillStyle = this.coins >= item.cost ? '#FFFF00' : '#FF0000';
                ctx.fillText(`${item.cost} Coins`, itemX + itemWidth/2, itemY + 62);
            }

            index++;
        }
        
        // Draw gun upgrade button
        const gunUpgradeX = SCREEN_WIDTH/2 - 100;
        const gunUpgradeY = secondRowY + itemHeight + 30;
        const gunUpgradeWidth = 200;
        const gunUpgradeHeight = 40;
        
        // Gun upgrade button background
        if (this.gunUpgradeLevel >= this.maxGunUpgradeLevel) {
            ctx.fillStyle = '#666666'; // Maxed out
        } else if (this.coins >= this.gunUpgradeCost) {
            ctx.fillStyle = '#4CAF50'; // Can afford
        } else {
            ctx.fillStyle = '#F44336'; // Can't afford
        }
        ctx.fillRect(gunUpgradeX, gunUpgradeY, gunUpgradeWidth, gunUpgradeHeight);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(gunUpgradeX, gunUpgradeY, gunUpgradeWidth, gunUpgradeHeight);
        
        // Gun upgrade text
        ctx.fillStyle = WHITE;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        if (this.gunUpgradeLevel >= this.maxGunUpgradeLevel) {
            ctx.fillText('Gun Maxed Out!', gunUpgradeX + gunUpgradeWidth/2, gunUpgradeY + 25);
        } else {
            ctx.fillText(`Gun Upgrade ${this.gunUpgradeLevel}/${this.maxGunUpgradeLevel}`, gunUpgradeX + gunUpgradeWidth/2, gunUpgradeY + 18);
            ctx.font = '12px Arial';
            ctx.fillText(`${this.gunUpgradeCost} Coins`, gunUpgradeX + gunUpgradeWidth/2, gunUpgradeY + 32);
        }

        // Health upgrade button (left side below gun upgrade)
        const healthUpgradeX = gunUpgradeX - 220;
        const healthUpgradeY = gunUpgradeY;
        const upgradeWidth = 200;
        const upgradeHeight = 40;
        
        if (this.healthUpgradeLevel >= this.maxHealthUpgradeLevel) {
            ctx.fillStyle = '#666666';
        } else if (this.coins >= this.healthUpgradeCost) {
            ctx.fillStyle = '#4CAF50';
        } else {
            ctx.fillStyle = '#F44336';
        }
        ctx.fillRect(healthUpgradeX, healthUpgradeY, upgradeWidth, upgradeHeight);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(healthUpgradeX, healthUpgradeY, upgradeWidth, upgradeHeight);
        
        ctx.fillStyle = WHITE;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        if (this.healthUpgradeLevel >= this.maxHealthUpgradeLevel) {
            ctx.fillText('Health Maxed Out!', healthUpgradeX + upgradeWidth/2, healthUpgradeY + 25);
        } else {
            ctx.fillText(`Health Upgrade ${this.healthUpgradeLevel}/${this.maxHealthUpgradeLevel}`, healthUpgradeX + upgradeWidth/2, healthUpgradeY + 18);
            ctx.font = '12px Arial';
            ctx.fillText(`${this.healthUpgradeCost} Coins (+2 Health)`, healthUpgradeX + upgradeWidth/2, healthUpgradeY + 32);
        }

        // Speed upgrade button (right side below gun upgrade)
        const speedUpgradeX = gunUpgradeX + 220;
        const speedUpgradeY = gunUpgradeY;
        
        if (this.speedUpgradeLevel >= this.maxSpeedUpgradeLevel) {
            ctx.fillStyle = '#666666';
        } else if (this.coins >= this.speedUpgradeCost) {
            ctx.fillStyle = '#4CAF50';
        } else {
            ctx.fillStyle = '#F44336';
        }
        ctx.fillRect(speedUpgradeX, speedUpgradeY, upgradeWidth, upgradeHeight);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(speedUpgradeX, speedUpgradeY, upgradeWidth, upgradeHeight);
        
        ctx.fillStyle = WHITE;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        if (this.speedUpgradeLevel >= this.maxSpeedUpgradeLevel) {
            ctx.fillText('Speed Maxed Out!', speedUpgradeX + upgradeWidth/2, speedUpgradeY + 25);
        } else {
            ctx.fillText(`Speed Upgrade ${this.speedUpgradeLevel}/${this.maxSpeedUpgradeLevel}`, speedUpgradeX + upgradeWidth/2, speedUpgradeY + 18);
            ctx.font = '12px Arial';
            ctx.fillText(`${this.speedUpgradeCost} Coins (1.2x Speed)`, speedUpgradeX + upgradeWidth/2, speedUpgradeY + 32);
        }

        // Close instruction
        ctx.fillStyle = '#808080';
        ctx.font = '20px Arial';
        ctx.fillText('Click Shop again to close', SCREEN_WIDTH/2, SCREEN_HEIGHT - 80);
        ctx.textAlign = 'left';
    }

    drawPetsPage(ctx) {
        console.log('Drawing pets page!');
        
    // Semi-transparent black background with enhanced visibility (expanded)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 20, SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40);

        // Enhanced title with glow
        ctx.fillStyle = GOLD;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PET SHOP', SCREEN_WIDTH/2, 100);

        // Back button
        const backButtonX = 110; // Inside shop window on left
        const backButtonY = 60; // Near top of shop window
        const backButtonWidth = 60;
        const backButtonHeight = 30;
        
        ctx.fillStyle = '#F44336';
        ctx.fillRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
        
        ctx.fillStyle = WHITE;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Back', backButtonX + backButtonWidth/2, backButtonY + 20);

        // Common crate (left side) - Enhanced
        const crateX = SCREEN_WIDTH/2 - 270;
        const crateY = SCREEN_HEIGHT/2 - 80;
        const crateWidth = 160;
        const crateHeight = 160;
        
        // Crate background with glow effect
        const canAfford = this.coins >= this.petCrates.common.cost;
        if (canAfford) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        
        ctx.fillStyle = canAfford ? '#8B4513' : '#444444';
        ctx.fillRect(crateX, crateY, crateWidth, crateHeight);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = canAfford ? GOLD : WHITE;
        ctx.lineWidth = 3;
        ctx.strokeRect(crateX, crateY, crateWidth, crateHeight);
        
        // Crate label
        ctx.fillStyle = GOLD;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎁 COMMON CRATE', crateX + crateWidth/2, crateY + 25);
        
        // Treasure chest icon (enhanced)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(crateX + 55, crateY + 50, 50, 35);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(crateX + 60, crateY + 60, 40, 15);
        
        // Chest lock
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(crateX + 75, crateY + 65, 10, 10);
        
        // Price
        ctx.fillStyle = this.coins >= this.petCrates.common.cost ? '#00FF00' : '#FF0000';
        ctx.font = '16px Arial';
        ctx.fillText(`${this.petCrates.common.cost} Coins`, crateX + crateWidth/2, crateY + 130);
        
        // Reset text alignment for next section
        ctx.textAlign = 'center';
        
        // Reset text alignment
        ctx.textAlign = 'center';
        
        // Possible pets preview (updated)
        ctx.fillStyle = WHITE;
        ctx.font = '12px Arial';
        ctx.fillText('Contains:', crateX + crateWidth/2, crateY + 155);
        ctx.fillText('Cat (2x Coins) - Common', crateX + crateWidth/2, crateY + 170);
        ctx.fillText('Dog (1.5x Speed) - Common', crateX + crateWidth/2, crateY + 185);
        ctx.fillStyle = '#4169E1';
        ctx.fillText('Turtle (2x Health, 1.2x Damage) - Rare', crateX + crateWidth/2, crateY + 200);

        // Rare crate (center) - Enhanced
        const rareCrateX = SCREEN_WIDTH/2 - 80;
        const rareCrateY = SCREEN_HEIGHT/2 - 80;
        
        // Rare crate background with epic glow effect
        const canAffordRare = this.coins >= this.petCrates.rare.cost;
        if (canAffordRare) {
            ctx.shadowColor = '#9932CC';
            ctx.shadowBlur = 30;
        }
        
        ctx.fillStyle = canAffordRare ? '#9932CC' : '#444444';
        ctx.fillRect(rareCrateX, rareCrateY, crateWidth, crateHeight);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = canAffordRare ? '#9932CC' : WHITE;
        ctx.lineWidth = 3;
        ctx.strokeRect(rareCrateX, rareCrateY, crateWidth, crateHeight);
        
        // Rare crate label
        ctx.fillStyle = '#9932CC';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💎 RARE CRATE', rareCrateX + crateWidth/2, rareCrateY + 25);
        
        // Epic treasure chest icon
        ctx.fillStyle = '#9932CC';
        ctx.fillRect(rareCrateX + 55, rareCrateY + 50, 50, 35);
        ctx.fillStyle = '#8B008B';
        ctx.fillRect(rareCrateX + 60, rareCrateY + 60, 40, 15);
        
        // Magical sparkles
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 5; i++) {
            const sparkleX = rareCrateX + 20 + Math.random() * 120;
            const sparkleY = rareCrateY + 20 + Math.random() * 120;
            ctx.fillRect(sparkleX, sparkleY, 2, 2);
        }
        
        // Rare chest lock
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(rareCrateX + 75, rareCrateY + 65, 10, 10);
        
        // Rare price
        ctx.fillStyle = this.coins >= this.petCrates.rare.cost ? '#00FF00' : '#FF0000';
        ctx.font = '16px Arial';
        ctx.fillText(`${this.petCrates.rare.cost} Coins`, rareCrateX + crateWidth/2, rareCrateY + 130);
        
        // Rare possible pets preview
        ctx.fillStyle = WHITE;
        ctx.font = '12px Arial';
        ctx.fillText('Contains:', rareCrateX + crateWidth/2, rareCrateY + 155);
        ctx.fillStyle = '#4169E1';
        ctx.fillText('Turtle (2x Health, 1.2x Damage) - 90%', rareCrateX + crateWidth/2, rareCrateY + 170);
        ctx.fillStyle = '#FF6B35';
        ctx.fillText('Parrot (2x Health, 3x Damage) - 9%', rareCrateX + crateWidth/2, rareCrateY + 185);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Capybarra (5x Health, 5x Damage) - 1%', rareCrateX + crateWidth/2, rareCrateY + 200);

        // Owned pets section (right side)
        const petListX = SCREEN_WIDTH/2 + 120;
        const petListY = SCREEN_HEIGHT/2 - 100;
        
        ctx.fillStyle = GOLD;
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Your Pets:', petListX, petListY - 10);
        
        if (this.ownedPets.length === 0) {
            ctx.fillStyle = '#808080';
            ctx.font = '16px Arial';
            ctx.fillText('No pets owned yet', petListX, petListY + 30);
            ctx.fillText('Buy a crate to get pets!', petListX, petListY + 50);
        } else {
            const petItemHeight = 40;
            this.ownedPets.forEach((pet, index) => {
                const petY = petListY + index * petItemHeight;
                
                // Pet item background
                ctx.fillStyle = this.equippedPet === pet ? 'rgba(0, 255, 0, 0.3)' : 'rgba(100, 100, 100, 0.3)';
                ctx.fillRect(petListX, petY, 200, petItemHeight - 5);
                ctx.strokeStyle = this.equippedPet === pet ? '#00FF00' : WHITE;
                ctx.strokeRect(petListX, petY, 200, petItemHeight - 5);
                
                // Pet icon
                if (pet === 'cat') {
                    ctx.fillStyle = '#FFA500';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                    // Cat ears
                    ctx.beginPath();
                    ctx.moveTo(petListX + 14, petY + 12);
                    ctx.lineTo(petListX + 18, petY + 5);
                    ctx.lineTo(petListX + 22, petY + 12);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(petListX + 18, petY + 12);
                    ctx.lineTo(petListX + 22, petY + 5);
                    ctx.lineTo(petListX + 26, petY + 12);
                    ctx.fill();
                } else if (pet === 'dog') {
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                    // Dog ears
                    ctx.fillStyle = '#654321';
                    ctx.beginPath();
                    ctx.ellipse(petListX + 12, petY + 15, 3, 6, Math.PI * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(petListX + 28, petY + 15, 3, 6, -Math.PI * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (pet === 'turtle') {
                    // Turtle icon (blue - rare)
                    ctx.fillStyle = '#0066FF';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Shell pattern
                    ctx.strokeStyle = '#004499';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 6, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Shell segments
                    ctx.beginPath();
                    ctx.moveTo(petListX + 16, petY + 20);
                    ctx.lineTo(petListX + 24, petY + 20);
                    ctx.moveTo(petListX + 20, petY + 16);
                    ctx.lineTo(petListX + 20, petY + 24);
                    ctx.stroke();
                    
                    // Head
                    ctx.fillStyle = '#0088AA';
                    ctx.beginPath();
                    ctx.arc(petListX + 26, petY + 18, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (pet === 'parrot') {
                    // Parrot icon (rainbow colored - epic)
                    ctx.fillStyle = '#FF6B35';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Rainbow wing pattern
                    ctx.fillStyle = '#FFE66D';
                    ctx.fillRect(petListX + 15, petY + 17, 6, 2);
                    ctx.fillStyle = '#06FFA5';
                    ctx.fillRect(petListX + 15, petY + 20, 6, 2);
                    ctx.fillStyle = '#4ECDC4';
                    ctx.fillRect(petListX + 15, petY + 23, 6, 2);
                    
                    // Beak
                    ctx.fillStyle = '#FFD93D';
                    ctx.beginPath();
                    ctx.moveTo(petListX + 26, petY + 18);
                    ctx.lineTo(petListX + 30, petY + 20);
                    ctx.lineTo(petListX + 26, petY + 22);
                    ctx.fill();
                } else if (pet === 'capybarra') {
                    // Capybarra icon (golden - legendary)
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Legendary glow
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 20, 12, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Eyes
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(petListX + 17, petY + 17, 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(petListX + 23, petY + 17, 1, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Nose
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.arc(petListX + 20, petY + 22, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Pet name and effect (updated for all pets)
                ctx.fillStyle = WHITE;
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                const petName = pet.charAt(0).toUpperCase() + pet.slice(1);
                let effect;
                if (pet === 'cat') {
                    effect = '(2x Coins)';
                } else if (pet === 'dog') {
                    effect = '(1.5x Speed)';
                } else if (pet === 'turtle') {
                    effect = '(2x Health, 1.2x Damage)';
                    ctx.fillStyle = '#4169E1'; // Blue text for rare pet
                } else if (pet === 'parrot') {
                    effect = '(2x Health, 3x Damage)';
                    ctx.fillStyle = '#FF6B35'; // Orange text for epic pet
                } else if (pet === 'capybarra') {
                    effect = '(5x Health, 5x Damage)';
                    ctx.fillStyle = '#FFD700'; // Gold text for legendary pet
                }
                ctx.fillText(`${petName} ${effect}`, petListX + 40, petY + 16);
                
                // Status
                ctx.font = '12px Arial';
                if (this.equippedPet === pet) {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText('EQUIPPED', petListX + 40, petY + 30);
                } else {
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillText('Click to Equip', petListX + 40, petY + 30);
                }
            });
        }

        // Close instruction
        ctx.fillStyle = '#808080';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click Shop again to close', SCREEN_WIDTH/2, SCREEN_HEIGHT - 80);
    }
}

// Start the game
const game = new Game();
game.start(); 
