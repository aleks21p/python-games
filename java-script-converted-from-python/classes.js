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
            ctx.fillStyle = GREEN;
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.strokeStyle = '#009600';
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 5;
        this.lastShot = 0;
        this.baseShootDelay = 200;
        this.shootDelay = 200;
        this.health = 10;
        this.maxHealth = 10;
        this.lastDamageTime = 0;
        this.damageCooldown = 1000;
    }

    updateShootSpeed(level) {
        const speedMultiplier = Math.pow(2, level - 1);
        this.shootDelay = Math.max(25, Math.floor(this.baseShootDelay / speedMultiplier));
    }

    update(keys) {
        if (keys.w || keys.ArrowUp) this.y -= this.speed;
        if (keys.s || keys.ArrowDown) this.y += this.speed;
        if (keys.a || keys.ArrowLeft) this.x -= this.speed;
        if (keys.d || keys.ArrowRight) this.x += this.speed;

        this.x = Math.max(this.size, Math.min(SCREEN_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(SCREEN_HEIGHT - this.size, this.y));
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

                let numStreams;
                let damage;
                let isRed;

                if (level >= 7) {
                    numStreams = level - 6;
                    damage = 7;
                    isRed = true;
                } else {
                    numStreams = level < 3 ? 1 : level;
                    damage = 1;
                    isRed = false;
                }

                const spread = Math.PI / 3; // 60 degrees
                const startAngle = numStreams > 1 ? baseAngle - spread/2 : baseAngle;
                const angleStep = numStreams > 1 ? spread / (numStreams - 1) : 0;

                for (let i = 0; i < numStreams; i++) {
                    const angle = startAngle + i * angleStep;
                    const bulletDx = Math.cos(angle) * 10;
                    const bulletDy = Math.sin(angle) * 10;
                    bullets.push(new Bullet(this.x, this.y, bulletDx, bulletDy, damage, isRed));
                }
                this.lastShot = currentTime;
            }
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
        ctx.beginPath();
        ctx.fillStyle = WHITE;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        const barWidth = 40;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 15;

        ctx.fillStyle = BLACK;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthWidth = (this.health / this.maxHealth) * barWidth;
        const healthColor = this.health > 6 ? GREEN : this.health > 3 ? ORANGE : RED;
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}

class Bullet {
    constructor(x, y, dx, dy, damage = 1, isRed = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 3;
        this.damage = damage;
        this.isRed = isRed;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOffScreen() {
        return (
            this.x < 0 || 
            this.x > SCREEN_WIDTH || 
            this.y < 0 || 
            this.y > SCREEN_HEIGHT
        );
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.isRed ? RED : YELLOW;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Zombie {
    constructor(x, y, isBuff = false, isGreen = false, isBlack = false) {
        this.x = x;
        this.y = y;
        this.isBuff = isBuff;
        this.isGreen = isGreen;
        this.isBlack = isBlack;
        this.lastShot = 0;
        this.shootDelay = 4000;

        if (isBlack) {
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
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    shoot(currentTime) {
        if (this.isBlack && currentTime - this.lastShot > this.shootDelay) {
            const bullets = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
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
        if (this.isBlack) color = BLACK;
        else if (this.isGreen) color = GREEN;
        else if (this.isBuff) color = ORANGE;
        else color = this.health === this.maxHealth ? RED : DARK_RED;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this.health < this.maxHealth) {
            const barWidth = this.isBlack ? 50 : 
                           this.isGreen ? 40 : 
                           this.isBuff ? 30 : 20;
            const barHeight = this.isBlack || this.isGreen ? 8 : 
                            this.isBuff ? 6 : 4;
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