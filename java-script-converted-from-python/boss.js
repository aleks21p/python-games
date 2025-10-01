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
        return (
            this.x < -50 || 
            this.x > SCREEN_WIDTH + 50 || 
            this.y < -50 || 
            this.y > SCREEN_HEIGHT + 50
        );
    }

    draw(ctx) {
        // Draw large red bullet with glow effect
        ctx.beginPath();
        ctx.fillStyle = RED;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        for (let i = 0; i < 3; i++) {
            const glowSize = this.size + (i * 4);
            const glowAlpha = (80 - (i * 25)) / 255;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 0, 0, ${glowAlpha})`;
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class FinalBossBullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 8;  // Medium-sized bullets
        this.damage = 0.5;  // 0.5 damage per bullet
        this.isBossBullet = true;  // Changed to match the collision check
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return (
            this.x < -50 || 
            this.x > SCREEN_WIDTH + 50 || 
            this.y < -50 || 
            this.y > SCREEN_HEIGHT + 50
        );
    }

    draw(ctx) {
        // Draw medium golden bullet with glow effect
        ctx.beginPath();
        ctx.fillStyle = GOLD;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        for (let i = 0; i < 2; i++) {
            const glowSize = this.size + (i * 3);
            const glowAlpha = (120 - (i * 40)) / 255;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 215, 0, ${glowAlpha})`;
            ctx.lineWidth = 2;
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class FinalBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 80;  // Even larger than first boss
        this.speed = 0.6;  // Slower due to massive size
        this.health = 100000;  // 2x more than original (50000 * 2)
        this.maxHealth = 100000;
        this.damage = 5;
        this.lastShot = 0;
        this.shootDelay = 500;  // Shoots every 0.5 seconds
        this.lastDamageTime = 0;
        this.damageCooldown = 5000;  // Can only damage player every 5 seconds
    }

    update(player) {
        // Move towards player
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
            // Shoot 30 bullets in all directions
            for (let i = 0; i < 30; i++) {
                const angle = (i / 30) * Math.PI * 2;
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
        // Draw boss body (golden with red aura)
        ctx.beginPath();
        ctx.fillStyle = '#FFD700';  // Bright gold color
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add metallic effect
        const gradient = ctx.createRadialGradient(
            this.x - this.size/3, this.y - this.size/3, 10,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, '#FFF7CC');  // Lighter gold
        gradient.addColorStop(1, '#FFD700');  // Regular gold
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Red aura effect
        for (let i = 0; i < 4; i++) {
            const auraSize = this.size + (i * 10);
            const auraAlpha = (100 - (i * 20)) / 255;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 0, 0, ${auraAlpha})`;
            ctx.lineWidth = 4;
            ctx.arc(this.x, this.y, auraSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60;
        this.speed = 0.8;
        this.health = 8333; // Reduced boss health (3x less from 25000)
        this.maxHealth = 8333;
        this.damage = 5;
        this.lastShot = 0;
        this.shootDelay = 1000; // Shoots every second
        this.lastDamageTime = 0;
        this.damageCooldown = 5000; // Can only damage player every 5 seconds
    }

    update(player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Normalize and apply speed
            const normalizedDx = (dx / distance) * this.speed;
            const normalizedDy = (dy / distance) * this.speed;
            this.x += normalizedDx;
            this.y += normalizedDy;
        }
    }

    shoot(currentTime) {
        if (currentTime - this.lastShot > this.shootDelay) {
            const bullets = [];
            // Shoot 20 bullets in all directions around the boss
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2; // Divide 360 degrees into 20 equal parts
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
        // Draw boss body (metallic gray with red aura)
        // Base metallic effect
        const gradient = ctx.createRadialGradient(
            this.x - this.size/3, this.y - this.size/3, 10,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, '#E0E0E0');  // Light silver
        gradient.addColorStop(0.5, '#A9A9A9');  // Mid gray
        gradient.addColorStop(1, '#808080');  // Dark gray
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Bright outline for definition
        ctx.beginPath();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();

        // Red radiating aura effect with increased intensity
        for (let i = 0; i < 4; i++) {
            const glowSize = this.size + (i * 8);
            const glowAlpha = (120 - (i * 25)) / 255;  // Increased brightness
            ctx.beginPath();
            ctx.strokeStyle = `rgba(220, 0, 0, ${glowAlpha})`; // Brighter red
            ctx.lineWidth = 3;
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}