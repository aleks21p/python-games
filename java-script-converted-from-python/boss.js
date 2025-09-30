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

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 60;
        this.speed = 0.8;
        this.health = 50000; // Boss health
        this.maxHealth = 50000;
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
        // Draw boss body (black with red aura)
        ctx.beginPath();
        ctx.fillStyle = BLACK;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Red radiating aura effect
        for (let i = 0; i < 3; i++) {
            const glowSize = this.size + (i * 8);
            const glowAlpha = (100 - (i * 30)) / 255;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 0, 0, ${glowAlpha})`;
            ctx.lineWidth = 3;
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}