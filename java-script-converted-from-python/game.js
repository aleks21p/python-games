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
        this.activeOptionTab = '';  // Can be: 'controls', 'cheats', 'difficulty', 'credits'
        this.countdownActive = false;
        this.countdownTime = 0;
        this.countdownStart = 0;
        const buttonWidth = 300;  // Increased from 200 to 300 (1.5x)
        this.menuButtons = {
            start: { x: SCREEN_WIDTH/2 - buttonWidth/2, y: SCREEN_HEIGHT/2 - 50, width: buttonWidth, height: 60 },
            options: { x: SCREEN_WIDTH/2 - buttonWidth/2, y: SCREEN_HEIGHT/2 + 50, width: buttonWidth, height: 60 }
        };
        
        // Options menu buttons
        const optionButtonWidth = 200;
        const optionButtonHeight = 50;
        const optionButtonSpacing = 30;
        const startY = SCREEN_HEIGHT/2 - 100;
        this.optionButtons = {
            controls: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            cheats: { x: SCREEN_WIDTH/2 + 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            difficulty: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            credits: { x: SCREEN_WIDTH/2 + 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight }
        };

        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.bullets = [];
        this.zombies = [];
        this.orbs = [];
        this.score = 0;
        this.coins = this.loadCoins(); // Load saved coins
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
        this.tKeyPressed = false;

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
            
            // Track T key separately for cheat codes
            if (e.key === 't' || e.key === 'T') {
                this.tKeyPressed = true;
            }

            if (!this.inMenu && e.key === 'p' || e.key === 'P') {
                this.paused = !this.paused;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameOver) {
                    this.reset();
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
            if (e.key === 't' || e.key === 'T') {
                this.tKeyPressed = false;
                this.cheatActive = false;
                this.cheat2Active = false;
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
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        // Mouse click for menu buttons
        canvas.addEventListener('click', (e) => {
            if (this.inMenu) {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // Check start button
                const startBtn = this.menuButtons.start;
                if (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.width &&
                    clickY >= startBtn.y && clickY <= startBtn.y + startBtn.height) {
                    if (this.gameOver) {
                        this.reset();
                    }
                    this.countdownActive = true;
                    this.countdownTime = 3;
                    this.countdownStart = Date.now();
                }

                // Check options button
                const optionsBtn = this.menuButtons.options;
                if (clickX >= optionsBtn.x && clickX <= optionsBtn.x + optionsBtn.width &&
                    clickY >= optionsBtn.y && clickY <= optionsBtn.y + optionsBtn.height) {
                    this.inOptions = !this.inOptions;
                    this.activeOptionTab = '';  // Reset active tab when opening/closing options
                }

                // Check option tab buttons when in options menu
                if (this.inOptions) {
                    for (const [tabName, btn] of Object.entries(this.optionButtons)) {
                        if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                            clickY >= btn.y && clickY <= btn.y + btn.height) {
                            this.activeOptionTab = this.activeOptionTab === tabName ? '' : tabName;
                            break;
                        }
                    }
                }
            }
        });
    }

    loadCoins() {
        const savedCoins = localStorage.getItem('zombieShooterCoins');
        return savedCoins ? parseInt(savedCoins) : 0;
    }

    saveCoins() {
        localStorage.setItem('zombieShooterCoins', this.coins.toString());
    }

    updateCoins() {
        // Award 1 coin for every 1000 score points
        const newCoins = Math.floor(this.score / 1000);
        if (newCoins > Math.floor(this.lastCoinScore / 1000)) {
            this.coins += newCoins - Math.floor(this.lastCoinScore / 1000);
            this.saveCoins();
        }
        this.lastCoinScore = this.score;
    }

    reset() {
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
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
            if (bullet.isBossBullet) {
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
                        if (zombie.takeDamage(bullet.damage)) {
                            if (zombie.isBuff) {
                                this.spawnOrbs(zombie.x, zombie.y, 7);
                                this.score += 80;
                            } else if (zombie.isGreen) {
                                this.spawnOrbs(zombie.x, zombie.y, 4);  // Double orbs for green enemies
                                this.score += 10;
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
    }

    updateCheatCodes() {
        const currentTime = Date.now();

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

        // T + 3 cheat code (set coins to 10000)
        if (this.tKeyPressed && this.keys['3']) {
            if (!this.cheat3Active) {
                this.cheat3StartTime = currentTime;
                this.cheat3Active = true;
            } else if (currentTime - this.cheat3StartTime >= 2000) { // 2 seconds
                this.coins = 10000;
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
        if (this.inMenu || this.gameOver || (this.paused && !this.countdownActive)) return;

        const currentTime = Date.now();

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
        const barX = 350;  // Moved right to avoid overlap with score
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
        if (this.cheatActive || this.cheat2Active || this.cheat3Active || this.cheat4Active) {
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
                text = `Set Coins to 10000: ${Math.min(100, progress * 100).toFixed(0)}%`;
            } else if (this.cheat4Active) {
                progress = (currentTime - this.cheat4StartTime) / 2000;
                text = `Clear All Progress: ${Math.min(100, progress * 100).toFixed(0)}%`;
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
        const coinText = `Coins: ${this.coins}`;
        const coinTextWidth = ctx.measureText(coinText).width;
        ctx.fillText(coinText, SCREEN_WIDTH - coinTextWidth - 20, 40);

        // Draw title
        ctx.fillStyle = WHITE;
        ctx.font = '64px Arial';
        const title = 'Zombie Shooter';
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
        ctx.font = '32px Arial';
        const startText = 'Start';
        const startTextWidth = ctx.measureText(startText).width;
        ctx.fillText(startText, startBtn.x + (startBtn.width - startTextWidth) / 2, startBtn.y + 40);

        // Draw Options button (red)
        const optionsBtn = this.menuButtons.options;
        ctx.fillStyle = '#AA0000';  // Red
        ctx.fillRect(optionsBtn.x, optionsBtn.y, optionsBtn.width, optionsBtn.height);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(optionsBtn.x, optionsBtn.y, optionsBtn.width, optionsBtn.height);
        
        // Options text
        ctx.fillStyle = WHITE;
        const optionsText = 'Options';
        const optionsTextWidth = ctx.measureText(optionsText).width;
        ctx.fillText(optionsText, optionsBtn.x + (optionsBtn.width - optionsTextWidth) / 2, optionsBtn.y + 40);

        // Draw Options menu if active
        if (this.inOptions) {
            // Semi-transparent black background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(100, 50, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 100);
            ctx.strokeStyle = WHITE;
            ctx.strokeRect(100, 50, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 100);

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
                const text = tabName.charAt(0).toUpperCase() + tabName.slice(1);
                const textWidth = ctx.measureText(text).width;
                ctx.fillText(text, btn.x + (btn.width - textWidth)/2, btn.y + 35);
            }

            // Draw content box for active tab
            if (this.activeOptionTab) {
                const contentBox = {
                    width: 500,
                    height: 250,
                    x: SCREEN_WIDTH/2 - 250,
                    y: SCREEN_HEIGHT/2 + 20
                };

                // Draw content box
                ctx.fillStyle = '#222222';
                ctx.fillRect(contentBox.x, contentBox.y, contentBox.width, contentBox.height);
                ctx.strokeStyle = '#444444';
                ctx.strokeRect(contentBox.x, contentBox.y, contentBox.width, contentBox.height);

                const contentX = contentBox.x + contentBox.width/2;
                const contentY = contentBox.y + 40;
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';  // Center align text

                switch(this.activeOptionTab) {
                    case 'controls':
                        ctx.fillStyle = WHITE;
                        ctx.fillText('WASD or Arrow Keys - Move', contentX, contentY);
                        ctx.fillText('Mouse - Aim and Shoot', contentX, contentY + 40);
                        ctx.fillText('P - Pause Game', contentX, contentY + 80);
                        ctx.fillText('ESC - Return to Menu', contentX, contentY + 120);
                        break;

                    case 'cheats':
                        ctx.fillStyle = WHITE;
                        ctx.fillText('T + 1 - Skip to Level 15', contentX, contentY);
                        ctx.fillText('T + 2 - Skip to Final Boss', contentX, contentY + 40);
                        ctx.fillText('T + 3 - Get 10000 Coins', contentX, contentY + 80);
                        ctx.fillText('T + 4 - Reset All Progress', contentX, contentY + 120);
                        break;

                    case 'difficulty':
                        ctx.fillStyle = '#808080';
                        ctx.fillText('Easy (Coming Soon)', contentX, contentY);
                        ctx.fillText('Normal (Coming Soon)', contentX, contentY + 40);
                        ctx.fillText('Hard (Coming Soon)', contentX, contentY + 80);
                        break;

                    case 'credits':
                        ctx.fillStyle = WHITE;
                        ctx.fillText('Game Developer: Aleks P', contentX, contentY);
                        ctx.fillText('Sound Design: Claude Sonnet', contentX, contentY + 40);
                        ctx.fillText('Art & Textures: Aleks P', contentX, contentY + 80);
                        ctx.fillText('Sponsors: Shaun', contentX, contentY + 120);
                        break;
                }
                ctx.textAlign = 'left';  // Reset text alignment
            } else {
                ctx.fillStyle = '#808080';
                ctx.font = '24px Arial';
                ctx.fillText('Select an option above to view details', SCREEN_WIDTH/2 - 180, SCREEN_HEIGHT/2 + 50);
            }

            // Close instruction at bottom
            ctx.fillStyle = '#808080';
            ctx.font = '20px Arial';
            ctx.fillText('Press ESC to close options menu', SCREEN_WIDTH/2 - 120, SCREEN_HEIGHT - 80);
        }
    }

    drawPauseMenu() {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Pause menu box
        const boxWidth = 300;
        const boxHeight = 200;
        const boxX = SCREEN_WIDTH/2 - boxWidth/2;
        const boxY = SCREEN_HEIGHT/2 - boxHeight/2;

        ctx.fillStyle = '#333333';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Menu title
        ctx.fillStyle = WHITE;
        ctx.font = '32px Arial';
        ctx.fillText('PAUSED', boxX + boxWidth/2 - 50, boxY + 50);

        // Instructions
        ctx.font = '24px Arial';
        ctx.fillText('Press P to Resume', boxX + boxWidth/2 - 80, boxY + 100);
        ctx.fillText('Press ESC for Menu', boxX + boxWidth/2 - 80, boxY + 140);
    }

    draw() {
        if (this.inMenu) {
            this.drawMenu();
            return;
        }

        // Clear canvas
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Handle countdown
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
                
                // Draw countdown number
                ctx.fillStyle = WHITE;
                ctx.font = '128px Arial';
                const text = remainingTime.toString();
                const textWidth = ctx.measureText(text).width;
                ctx.fillText(text, (SCREEN_WIDTH - textWidth)/2, SCREEN_HEIGHT/2);
                return;
            }
        }

        // Draw game objects
        this.orbs.forEach(orb => orb.draw(ctx));
        this.zombies.forEach(zombie => zombie.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.player.draw(ctx);

        // Draw UI
        this.drawOrbBar();
        this.drawCheatProgress();
        this.drawBossBar();

        // Draw score and coins
        ctx.fillStyle = WHITE;
        ctx.font = '36px Arial';
        ctx.fillText(`Score: ${this.score}`, 10, 40);
        ctx.font = '28px Arial';
        ctx.fillStyle = GOLD;
        ctx.fillText(`Coins: ${this.coins}`, 10, 80);

        // Draw instructions
        ctx.font = '20px Arial';
        ctx.fillStyle = WHITE;
        ctx.fillText('WASD to move, Mouse to shoot, P to pause', 10, SCREEN_HEIGHT - 20);

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