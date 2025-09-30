// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

class Game {
    constructor() {
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.score = 0;
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

        // Game state
        this.gameOver = false;
        this.paused = false;

        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.setupInputHandlers();

        // Animation frame ID
        this.animationId = null;
    }

    setupInputHandlers() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'p' || e.key === 'P') {
                this.paused = !this.paused;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameOver) {
                    this.reset();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });
    }

    reset() {
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.score = 0;
        this.level = 1;
        this.orbsCollected = 0;
        this.orbsNeeded = 10;
        this.gameOver = false;
        this.zombieSpawnTimer = 0;
        this.zombieSpawnDelay = 2000;
        this.zombiesSpawned = 0;
        this.greenSpawnCount = 0;
        this.orangeSpawnCount = 0;
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

    spawnZombie() {
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

        if (this.level >= 10) {
            this.greenSpawnCount++;
            if (this.greenSpawnCount % 20 === 0) {
                this.zombies.push(new Zombie(x, y, false, false, true));
            } else {
                this.zombies.push(new Zombie(x, y, false, true, false));
            }
        } else if (this.level >= 5) {
            this.orangeSpawnCount++;
            if (this.orangeSpawnCount % 15 === 0) {
                this.zombies.push(new Zombie(x, y, false, true, false));
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
        // Player-zombie collisions
        for (const zombie of this.zombies) {
            const dx = this.player.x - zombie.x;
            const dy = this.player.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.size + zombie.size) {
                if (this.player.takeDamage(Date.now())) {
                    this.gameOver = true;
                    return;
                }
            }
        }

        // Bullet-zombie collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                const dx = bullet.x - zombie.x;
                const dy = bullet.y - zombie.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.size + zombie.size) {
                    if (zombie.takeDamage(bullet.damage)) {
                        if (zombie.isBuff) {
                            this.spawnOrbs(zombie.x, zombie.y, 7);
                            this.score += 80;
                        } else {
                            this.spawnOrbs(zombie.x, zombie.y, 2);
                            this.score += 10;
                        }
                        this.zombies.splice(j, 1);
                    }
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    update() {
        if (this.gameOver || this.paused) return;

        const currentTime = Date.now();

        // Update player
        this.player.update(this.keys);

        // Shooting
        const newBullets = this.player.shoot(this.mousePos, currentTime, this.level);
        this.bullets.push(...newBullets);

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].isOffScreen()) {
                this.bullets.splice(i, 1);
            }
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

        // Check level up
        this.checkLevelUp();

        // Spawn zombies
        if (currentTime - this.zombieSpawnTimer > this.zombieSpawnDelay) {
            this.spawnZombie();
            this.zombieSpawnTimer = currentTime;
            this.zombieSpawnDelay = Math.max(500, this.zombieSpawnDelay - 50);
        }

        // Check collisions
        this.checkCollisions();
    }

    drawOrbBar() {
        const barWidth = 300;
        const barHeight = 15;
        const barX = 200;
        const barY = 10;

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

    draw() {
        // Clear canvas
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Draw game objects
        this.orbs.forEach(orb => orb.draw(ctx));
        this.zombies.forEach(zombie => zombie.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.player.draw(ctx);

        // Draw UI
        this.drawOrbBar();

        // Draw score
        ctx.fillStyle = WHITE;
        ctx.font = '36px Arial';
        ctx.fillText(`Score: ${this.score}`, 10, 40);

        // Draw game state messages
        if (this.gameOver) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText('GAME OVER', SCREEN_WIDTH/2 - 120, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText(`Final Score: ${this.score}`, SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 + 40);
            ctx.fillText('Press R to restart', SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 80);
        } else if (this.paused) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText('PAUSED', SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText('Press P to resume', SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 40);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }
}

// Start the game
const game = new Game();
game.start();