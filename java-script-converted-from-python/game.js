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
                cheatLv15: 'Skip to Level 15',
                cheatBoss: 'Skip to Final Boss',
                cheatCoins: 'Get 10000 Coins',
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
                soundDesign: 'Sound Design: Claude Sonnet',
                art: 'Art & Textures: Aleks P',
                sponsors: 'Sponsors: Shaun'
            },
            french: {
                gameTitle: 'Tueur de Zombies',
                start: 'Demarrer',
                options: 'Options',
                controls: 'Controles',
                cheats: 'Astuces',
                cheatLv15: 'Passer au Niveau 15',
                cheatBoss: 'Passer au Boss Final',
                cheatCoins: 'Obtenir 10000 Pieces',
                cheatReset: 'Reinitialiser Tout',
                difficulty: 'Difficulte',
                credits: 'Credits',
                languages: 'Langues',
                special: 'Special',
                score: 'Score',
                coins: 'Pieces',
                level: 'Nv.',
                gameOver: 'PARTIE TERMINEE',
                finalScore: 'Score Final',
                pressToRestart: 'Appuyez sur R pour recommencer',
                paused: 'PAUSE',
                pressToResume: 'Appuyez sur P pour continuer',
                pressForMenu: 'ESC pour le Menu',
                getReady: 'Preparez-vous!',
                move: 'ZQSD ou Fleches - Deplacer',
                aim: 'Souris - Viser et Tirer',
                pauseGame: 'P - Mettre en Pause',
                returnToMenu: 'ESC - Retour au Menu',
                closeOptions: 'Appuyez sur ESC pour fermer les options',
                selectOption: 'Selectionnez une option ci-dessus',
                easy: 'Facile',
                normal: 'Normal',
                hard: 'Difficile',
                difficultyNote: '(Selection de difficulte bientot disponible)',
                developer: 'Developpeur: Aleks P',
                soundDesign: 'Design Sonore: Claude Sonnet',
                art: 'Art & Textures: Aleks P',
                sponsors: 'Sponsors: Shaun'
            },
            spanish: {
                gameTitle: 'Cazador de Zombis',
                start: 'Iniciar',
                options: 'Opciones',
                controls: 'Controles',
                cheats: 'Trucos',
                cheatLv15: 'Saltar al Nivel 15',
                cheatBoss: 'Saltar al Jefe Final',
                cheatCoins: 'Obtener 10000 Monedas',
                cheatReset: 'Reiniciar Todo',
                difficulty: 'Dificultad',
                credits: 'Creditos',
                languages: 'Idiomas',
                special: 'Especial',
                score: 'Puntos',
                coins: 'Monedas',
                level: 'Nv.',
                gameOver: 'JUEGO TERMINADO',
                finalScore: 'Puntuacion Final',
                pressToRestart: 'Presiona R para reiniciar',
                paused: 'PAUSADO',
                pressToResume: 'Presiona P para continuar',
                pressForMenu: 'ESC para el Menu',
                getReady: 'Preparate!',
                move: 'WASD o Flechas - Mover',
                aim: 'Raton - Apuntar y Disparar',
                pauseGame: 'P - Pausar Juego',
                returnToMenu: 'ESC - Volver al Menu',
                closeOptions: 'Presiona ESC para cerrar opciones',
                selectOption: 'Selecciona una opcion arriba',
                easy: 'Facil',
                normal: 'Normal',
                hard: 'Dificil',
                difficultyNote: '(Seleccion de dificultad proximamente)',
                developer: 'Desarrollador: Aleks P',
                soundDesign: 'Diseno de Sonido: Claude Sonnet',
                art: 'Arte & Texturas: Aleks P',
                sponsors: 'Patrocinadores: Shaun'
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
            bigge: { name: 'Bigge', cost: 30, owned: false, color: '#FFA500', scale: 1.2, speedBoost: 2 }
        };
        this.activePlayerSkin = 'default';
        
        // Options menu buttons
        const optionButtonWidth = 200;
        const optionButtonHeight = 50;
        const optionButtonSpacing = 30;
        const startY = SCREEN_HEIGHT/2 - 150; // Moved up to accommodate new buttons
        this.optionButtons = {
            controls: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            cheats: { x: SCREEN_WIDTH/2 + 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            difficulty: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            credits: { x: SCREEN_WIDTH/2 + 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            languages: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + (optionButtonHeight + optionButtonSpacing) * 2, width: optionButtonWidth, height: optionButtonHeight },
            special: { x: SCREEN_WIDTH/2 + 20, y: startY + (optionButtonHeight + optionButtonSpacing) * 2, width: optionButtonWidth, height: optionButtonHeight }
        };

        this.loadSkins(); // Load saved skins first
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

                // Check start button (only if options menu is not open)
                const startBtn = this.menuButtons.start;
                if (!this.inOptions && clickX >= startBtn.x && clickX <= startBtn.x + startBtn.width &&
                    clickY >= startBtn.y && clickY <= startBtn.y + startBtn.height) {
                    if (this.gameOver) {
                        this.reset();
                    }
                    // Initialize countdown and game state
                    this.countdownActive = true;
                    this.countdownStart = Date.now();
                    this.inMenu = false;  // Exit menu to show game background
                    this.inOptions = false;  // Close options if open
                    this.activeOptionTab = '';  // Reset active tab
                    this.paused = false;  // Unpause to allow background updates
                }

                // Check options button
                const optionsBtn = this.menuButtons.options;
                if (clickX >= optionsBtn.x && clickX <= optionsBtn.x + optionsBtn.width &&
                    clickY >= optionsBtn.y && clickY <= optionsBtn.y + optionsBtn.height) {
                    this.inOptions = !this.inOptions;
                    this.inShop = false;  // Close shop when opening options
                    this.activeOptionTab = '';  // Reset active tab when opening/closing options
                }

                // Check shop button
                const shopBtn = this.menuButtons.shop;
                if (clickX >= shopBtn.x && clickX <= shopBtn.x + shopBtn.width &&
                    clickY >= shopBtn.y && clickY <= shopBtn.y + shopBtn.height) {
                    this.inShop = !this.inShop;
                    this.inOptions = false;  // Close options when opening shop
                    this.activeOptionTab = '';
                }

                // Check shop item clicks
                if (this.inShop) {
                    const itemHeight = 100;
                    const itemWidth = 150;
                    const itemSpacing = 20;
                    const startX = SCREEN_WIDTH/2 - ((itemWidth * 3 + itemSpacing * 2) / 2);
                    const startY = SCREEN_HEIGHT/2 - 50;

                    let index = 0;
                    for (const [itemId, item] of Object.entries(this.shopItems)) {
                        const itemX = startX + (itemWidth + itemSpacing) * index;
                        if (clickX >= itemX && clickX <= itemX + itemWidth &&
                            clickY >= startY && clickY <= startY + itemHeight) {
                            // Try to buy/equip the item
                            if (!item.owned) {
                                if (this.coins >= item.cost) {
                                    this.coins -= item.cost;
                                    item.owned = true;
                                    this.saveCoins();
                                    this.activePlayerSkin = itemId;
                                    this.saveSkins();
                                }
                            } else {
                                this.activePlayerSkin = this.activePlayerSkin === itemId ? 'default' : itemId;
                                this.saveSkins();
                            }
                        }
                        index++;
                    }
                }

                // Check option tab buttons when in options menu
                if (this.inOptions) {
                    // Check language buttons if in language tab
                    if (this.activeOptionTab === 'languages' && this.languageButtons) {
                        for (const [lang, btn] of Object.entries(this.languageButtons)) {
                            if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                                clickY >= btn.y && clickY <= btn.y + btn.height) {
                                this.selectedLanguage = lang;
                                break;
                            }
                        }
                    }

                    // Check special button if in special tab
                    if (this.activeOptionTab === 'special' && this.specialButton) {
                        const btn = this.specialButton;
                        if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                            clickY >= btn.y && clickY <= btn.y + btn.height) {
                            this.isUpsideDown = !this.isUpsideDown;
                            // The actual rotation is handled in the draw method
                        }
                    }

                    // Check option tab buttons
                    for (const [tabName, btn] of Object.entries(this.optionButtons)) {
                        if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                            clickY >= btn.y && clickY <= btn.y + btn.height) {
                            this.activeOptionTab = this.activeOptionTab === tabName ? '' : tabName;
                            // Reset language buttons when changing tabs
                            if (this.activeOptionTab !== 'languages') {
                                this.languageButtons = {};
                            }
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
        // Keep the current skin settings
        const currentSkin = this.activePlayerSkin;
        
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        // Immediately apply the current skin
        if (currentSkin !== 'default' && this.shopItems[currentSkin]) {
            const skin = this.shopItems[currentSkin];
            this.player.color = skin.color;
            this.player.scale = skin.scale || 1;
            this.player.speedBoost = skin.speedBoost || 1;
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
                
                // Clear all purchased skins
                for (const itemId in this.shopItems) {
                    this.shopItems[itemId].owned = false;
                }
                this.activePlayerSkin = 'default';
                this.saveSkins();
                
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
        } else {
            this.player.color = 'white';
            this.player.scale = 1;
            this.player.speedBoost = 1;
        }

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
                const text = this.translations[this.selectedLanguage][tabName];
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
                        ctx.fillText(this.translations[this.selectedLanguage].move, contentX, contentY);
                        ctx.fillText(this.translations[this.selectedLanguage].aim, contentX, contentY + 40);
                        ctx.fillText(this.translations[this.selectedLanguage].pauseGame, contentX, contentY + 80);
                        ctx.fillText(this.translations[this.selectedLanguage].returnToMenu, contentX, contentY + 120);
                        break;

                    case 'cheats':
                        ctx.fillStyle = WHITE;
                        ctx.fillText('T + 1 - ' + this.translations[this.selectedLanguage].cheatLv15, contentX, contentY);
                        ctx.fillText('T + 2 - ' + this.translations[this.selectedLanguage].cheatBoss, contentX, contentY + 40);
                        ctx.fillText('T + 3 - ' + this.translations[this.selectedLanguage].cheatCoins, contentX, contentY + 80);
                        ctx.fillText('T + 4 - ' + this.translations[this.selectedLanguage].cheatReset, contentX, contentY + 120);
                        break;

                    case 'difficulty':
                        // Create difficulty option buttons
                        const difficultyButtons = {
                            easy: { y: contentY, color: '#00AA00', text: this.translations[this.selectedLanguage].easy },
                            normal: { y: contentY + 60, color: '#808080', text: this.translations[this.selectedLanguage].normal },
                            hard: { y: contentY + 120, color: '#AA0000', text: this.translations[this.selectedLanguage].hard }
                        };

                        // Draw each difficulty button
                        for (const [difficulty, button] of Object.entries(difficultyButtons)) {
                            // Button background
                            const btnWidth = 200;
                            const btnHeight = 40;
                            const btnX = contentX - btnWidth/2;  // Center horizontally relative to contentX
                            
                            ctx.fillStyle = button.color;
                            ctx.fillRect(btnX, button.y - 30, btnWidth, btnHeight);
                            
                            // Button border
                            ctx.strokeStyle = WHITE;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(btnX, button.y - 30, btnWidth, btnHeight);

                            // Button text
                            ctx.fillStyle = WHITE;
                            ctx.font = 'bold 24px Arial';
                            ctx.textAlign = 'center';  // Center text
                            ctx.fillText(button.text, contentX, button.y);
                            ctx.textAlign = 'left';  // Reset text alignment
                        }

                        // Add note at bottom
                        ctx.fillStyle = '#808080';
                        ctx.font = '20px Arial';
                        ctx.fillText(this.translations[this.selectedLanguage].difficultyNote, contentX + contentBox.width/2 - 120, contentY + 180);
                        break;

                    case 'credits':
                        ctx.fillStyle = WHITE;
                        ctx.fillText(this.translations[this.selectedLanguage].developer, contentX, contentY);
                        ctx.fillText(this.translations[this.selectedLanguage].soundDesign, contentX, contentY + 40);
                        ctx.fillText(this.translations[this.selectedLanguage].art, contentX, contentY + 80);
                        ctx.fillText(this.translations[this.selectedLanguage].sponsors, contentX, contentY + 120);
                        break;

                    case 'languages':
                        // Create language option buttons
                        const languageButtons = {
                            english: { y: contentY, color: '#4CAF50', text: 'English' },
                            french: { y: contentY + 60, color: '#808080', text: 'French' },
                            spanish: { y: contentY + 120, color: '#FF0000', text: 'Spanish' }
                        };

                        // Draw each language button
                        for (const [lang, button] of Object.entries(languageButtons)) {
                            const btnWidth = 200;
                            const btnHeight = 40;
                            const btnX = contentX - btnWidth/2;
                            
                            // Highlight selected language
                            ctx.fillStyle = this.selectedLanguage === lang ? '#FFFF00' : button.color;
                            ctx.fillRect(btnX, button.y - 30, btnWidth, btnHeight);
                            
                            ctx.strokeStyle = WHITE;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(btnX, button.y - 30, btnWidth, btnHeight);

                            ctx.fillStyle = WHITE;
                            ctx.font = 'bold 24px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(button.text, contentX, button.y);
                            ctx.textAlign = 'left';

                            // Store button position and dimensions for click handling
                            this.languageButtons = this.languageButtons || {};
                            this.languageButtons[lang] = {
                                x: btnX,
                                y: button.y - 30,
                                width: btnWidth,
                                height: btnHeight
                            };
                        }
                        break;

                    case 'special':
                        // Special effects button
                        const specialBtn = {
                            x: contentX - 100,
                            y: contentY + 50,
                            width: 200,
                            height: 40
                        };

                        // Draw special button
                        ctx.fillStyle = this.isUpsideDown ? '#FFFF00' : '#808080';
                        ctx.fillRect(specialBtn.x, specialBtn.y, specialBtn.width, specialBtn.height);
                        ctx.strokeStyle = WHITE;
                        ctx.strokeRect(specialBtn.x, specialBtn.y, specialBtn.width, specialBtn.height);

                        // Button text
                        ctx.fillStyle = WHITE;
                        ctx.font = 'bold 24px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Broken Mode', contentX, specialBtn.y + 30);
                        ctx.textAlign = 'left';

                        // Store special button position for click handling
                        this.specialButton = {
                            x: specialBtn.x,
                            y: specialBtn.y,
                            width: specialBtn.width,
                            height: specialBtn.height
                        };
                        break;
                }
                ctx.textAlign = 'left';  // Reset text alignment
            } else {
                ctx.fillStyle = '#808080';
                ctx.font = '24px Arial';
                const text = this.translations[this.selectedLanguage].selectOption;
                ctx.fillText(text, SCREEN_WIDTH/2 - 180, SCREEN_HEIGHT/2 + 50);
            }

            // Close instruction at bottom
            ctx.fillStyle = '#808080';
            ctx.font = '20px Arial';
            const closeText = this.translations[this.selectedLanguage].closeOptions;
            const closeTextWidth = ctx.measureText(closeText).width;
            ctx.fillText(closeText, SCREEN_WIDTH/2 - closeTextWidth/2, SCREEN_HEIGHT - 80);
        }

        // Draw Shop menu if active
        if (this.inShop) {
            // Semi-transparent black background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(100, 50, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 100);
            ctx.strokeStyle = WHITE;
            ctx.strokeRect(100, 50, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 100);

            // Title
            ctx.fillStyle = GOLD;
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Shop', SCREEN_WIDTH/2, 90);

            // Draw shop items
            const itemHeight = 100;
            const itemWidth = 150;
            const itemSpacing = 20;
            const startX = SCREEN_WIDTH/2 - ((itemWidth * 3 + itemSpacing * 2) / 2);
            const startY = SCREEN_HEIGHT/2 - 50;

            let index = 0;
            for (const [itemId, item] of Object.entries(this.shopItems)) {
                const itemX = startX + (itemWidth + itemSpacing) * index;
                
                // Draw item box
                ctx.fillStyle = item.color;
                ctx.fillRect(itemX, startY, itemWidth, itemHeight);
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(itemX, startY, itemWidth, itemHeight);

                // Draw preview circle (player appearance)
                const previewSize = 20;
                const scale = item.scale || 1;
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(itemX + itemWidth/2, startY + 25, previewSize * scale, 0, Math.PI * 2);
                ctx.fill();
                if (item.speedBoost) {
                    // Draw speed indicator arrows
                    ctx.strokeStyle = WHITE;
                    ctx.beginPath();
                    ctx.moveTo(itemX + itemWidth/2 + 25, startY + 25);
                    ctx.lineTo(itemX + itemWidth/2 + 35, startY + 25);
                    ctx.lineTo(itemX + itemWidth/2 + 30, startY + 20);
                    ctx.moveTo(itemX + itemWidth/2 + 35, startY + 25);
                    ctx.lineTo(itemX + itemWidth/2 + 30, startY + 30);
                    ctx.stroke();
                }

                // Draw item name
                ctx.fillStyle = WHITE;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';  // Center align the text
                ctx.fillText(item.name, itemX + itemWidth/2, startY + 60);

                // Draw price or status
                ctx.font = '16px Arial';
                if (item.owned) {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText(this.activePlayerSkin === itemId ? 'Equipped' : 'Click to Equip', 
                               itemX + itemWidth/2, startY + 85);  // Moved down
                } else {
                    ctx.fillStyle = this.coins >= item.cost ? '#FFFF00' : '#FF0000';
                    ctx.fillText(`${item.cost} Coins`, itemX + itemWidth/2, startY + 85);  // Moved down
                }

                index++;
            }

            // Close instruction
            ctx.fillStyle = '#808080';
            ctx.font = '20px Arial';
            ctx.fillText('Click Shop again to close', SCREEN_WIDTH/2, SCREEN_HEIGHT - 80);
            ctx.textAlign = 'left';
        }
    }

    drawPauseMenu() {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Pause menu box (2x bigger)
        const boxWidth = 600;  // Doubled from 300
        const boxHeight = 400; // Doubled from 200
        const boxX = SCREEN_WIDTH/2 - boxWidth/2;
        const boxY = SCREEN_HEIGHT/2 - boxHeight/2;

        // Draw box with gradient for better appearance
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(1, '#222222');
        ctx.fillStyle = gradient;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Box border
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Menu title
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 48px Arial';  // Larger font
        const pausedText = 'PAUSED';
        const pausedWidth = ctx.measureText(pausedText).width;
        ctx.fillText(pausedText, boxX + (boxWidth - pausedWidth)/2, boxY + 100);

        // Instructions
        ctx.font = '32px Arial';  // Larger font
        const resumeText = 'Press P to Resume';
        const menuText = 'Press ESC for Menu';
        const resumeWidth = ctx.measureText(resumeText).width;
        const menuWidth = ctx.measureText(menuText).width;

        // Center align text
        ctx.fillText(resumeText, boxX + (boxWidth - resumeWidth)/2, boxY + 200);
        ctx.fillText(menuText, boxX + (boxWidth - menuWidth)/2, boxY + 280);
    }

    draw() {
        // Save the current transform
        ctx.save();
        
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
            return;
        }

        // Draw game objects
        this.orbs.forEach(orb => orb.draw(ctx));
        this.zombies.forEach(zombie => zombie.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.player.draw(ctx);

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

        // Draw pause menu if game is paused
        if (this.paused && !this.countdownActive) {
            this.drawPauseMenu();
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

        // Draw game state messages
        if (this.gameOver) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].gameOver, SCREEN_WIDTH/2 - 120, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText(`${this.translations[this.selectedLanguage].finalScore}: ${this.score}`, SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 + 40);
            ctx.fillText(this.translations[this.selectedLanguage].pressToRestart, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 80);
        } else if (this.paused) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].paused, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2);
            ctx.font = '24px Arial';
            ctx.fillText(this.translations[this.selectedLanguage].pressToResume, SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 40);
        }
        
        // Restore the original transform
        ctx.restore();
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