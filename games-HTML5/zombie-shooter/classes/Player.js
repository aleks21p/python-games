class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 5;
        this.color = 'white';
        this.scale = 1;
        this.speedBoost = 1;
        this.lastShot = 0;
        this.baseShootDelay = 200;
        this.shootDelay = 200;
        this.health = 10;
        this.maxHealth = 10;
        this.lastDamageTime = 0;
        this.damageCooldown = 1000;
    }

    updateShootSpeed(level) {
        const speedMultiplier = 2 ** (level - 1);
        this.shootDelay = Math.max(25, this.baseShootDelay / speedMultiplier);
    }

    update(keys) {
        const actualSpeed = this.speed * (this.speedBoost || 1);

        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            this.y -= actualSpeed;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            this.y += actualSpeed;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            this.x -= actualSpeed;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            this.x += actualSpeed;
        }

        this.x = Math.max(this.size * this.scale, Math.min(SCREEN_WIDTH - this.size * this.scale, this.x));
        this.y = Math.max(this.size * this.scale, Math.min(SCREEN_HEIGHT - this.size * this.scale, this.y));
    }

    shoot(mousePos, currentTime, level) {
        if (currentTime - this.lastShot > this.shootDelay) {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const bullets = [];

            if (distance > 0) {
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                const baseAngle = Math.atan2(normalizedDy, normalizedDx);

                const isRed = level >= 7;
                const damage = isRed ? 7 : 1;
                const numStreams = level >= 7 ? (level - 6) : (level < 3 ? 1 : level);

                const spread = Math.PI / 3; // 60 degrees
                const startAngle = numStreams > 1 ? baseAngle - spread/2 : baseAngle;
                const angleStep = numStreams > 1 ? spread / (numStreams - 1) : 0;

                for (let i = 0; i < numStreams; i++) {
                    const angle = startAngle + i * angleStep;
                    const bulletDx = Math.cos(angle) * 10;
                    const bulletDy = Math.sin(angle) * 10;
                    bullets.push(new Bullet(this.x, this.y, bulletDx, bulletDy, damage, isRed));
                }
            }

            this.lastShot = currentTime;
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
        // Draw player circle with current color and scale
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = this.color || 'white';
        ctx.fill();

        // Draw health bar above player
        const barWidth = 40;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - (this.size * this.scale) - 15;

        // Background
        ctx.fillStyle = 'black';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        const healthColor = this.health > 6 ? 'green' : (this.health > 3 ? 'orange' : 'red');
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}