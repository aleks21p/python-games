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
        this.health = 10;
        this.maxHealth = 10;
        this.lastDamageTime = 0;
        this.damageCooldown = 1000;
    }

    updateShootSpeed(level) {
        const speedMultiplier = 2 ** (level - 1);
        const gunSpeedBonus = this.gunSpeedMultiplier || 1;
        this.shootDelay = Math.max(25, this.baseShootDelay / (speedMultiplier * gunSpeedBonus));
    }

    update(keys) {
        const actualSpeed = this.speed * (this.speedBoost || 1) * (this.speedMultiplier || 1);

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

                let isRed = level >= 7;
                let isWhite = level >= 13;
                let damage = 1;
                let numStreams = 1;

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
                    const skinDamage = damage * (this.damageMultiplier || 1);
                    const finalDamage = skinDamage * (this.gunDamageMultiplier || 1);
                    bullets.push(new Bullet(this.x, this.y, bulletDx, bulletDy, finalDamage, isRed, isWhite));
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
        if (this.isMultiColor) {
            // Draw multi-colored player (red and blue halves)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI, false);
            ctx.fill();
            
            ctx.fillStyle = '#0000FF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI, true);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI * 2);
            ctx.fillStyle = this.color || 'white';
            ctx.fill();
        }

        // Draw gun
        const gunLength = 25 * this.scale;
        const gunWidth = 4 * this.scale;
        const gunOffsetX = (this.size * this.scale) + 5;
        
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.x + gunOffsetX, this.y - gunWidth/2, gunLength, gunWidth);
        
        // Gun tip
        ctx.fillStyle = '#222222';
        ctx.fillRect(this.x + gunOffsetX + gunLength - 3, this.y - gunWidth/2 - 1, 3, gunWidth + 2);

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
    constructor(x, y, dx, dy, damage = 1, isRed = false, isWhite = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = 3;
        this.damage = damage;
        this.isRed = isRed;
        this.isWhite = isWhite;
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
    constructor(x, y, isBuff = false, isGreen = false, isBlack = false, isBlue = false) {
        this.x = x;
        this.y = y;
        this.isBuff = isBuff;
        this.isGreen = isGreen;
        this.isBlack = isBlack;
        this.isBlue = isBlue;
        this.lastShot = 0;
        this.shootDelay = 4000;

        if (isBlue) {
            this.size = 21; // 3x the size of green (7 * 3)
            this.speed = 1.5; // Moderate speed
            this.health = 3360; // 30x green health (112 * 30)
            this.maxHealth = 3360;
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
        if (this.isBlue) color = BLUE;
        else if (this.isBlack) color = BLACK;
        else if (this.isGreen) color = GREEN;
        else if (this.isBuff) color = ORANGE;
        else color = this.health === this.maxHealth ? RED : '#960000';

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Add blue glow effect for blue zombies
        if (this.isBlue) {
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
            const barWidth = this.isBlue ? 60 : (this.isBlack ? 50 : (this.isGreen ? 40 : (this.isBuff ? 30 : 20)));
            const barHeight = this.isBlue ? 10 : (this.isBlack ? 8 : (this.isGreen ? 8 : (this.isBuff ? 6 : 4)));
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
            bigge: { name: 'Bigge', cost: 30, owned: false, color: '#FFA500', scale: 1.2, speedBoost: 2 },
            angry: { name: 'Angry', cost: 100, owned: false, color: '#FF4500', damageMultiplier: 2, speedMultiplier: 1.5 },
            multi: { name: 'Multi', cost: 150, owned: false, color: '#8A2BE2', damageMultiplier: 5, speedMultiplier: 0.7, isMultiColor: true }
        };
        this.activePlayerSkin = 'default';
        
        // Gun upgrade system
        this.gunUpgradeLevel = 0;
        this.maxGunUpgradeLevel = 10;
        this.gunUpgradeCost = 150;
        
        // Options menu buttons
        const optionButtonWidth = 200;
        const optionButtonHeight = 50;
        const optionButtonSpacing = 30;
        const startY = SCREEN_HEIGHT/2 - 100; // Adjusted positioning
        this.optionButtons = {
            controls: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            cheats: { x: SCREEN_WIDTH/2 + 20, y: startY, width: optionButtonWidth, height: optionButtonHeight },
            difficulty: { x: SCREEN_WIDTH/2 - optionButtonWidth - 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight },
            credits: { x: SCREEN_WIDTH/2 + 20, y: startY + optionButtonHeight + optionButtonSpacing, width: optionButtonWidth, height: optionButtonHeight }
        };

        this.loadSkins(); // Load saved skins first
        this.loadGunUpgrade(); // Load saved gun upgrade
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
                            // Second row
                            itemX = secondRowStartX + (itemWidth + itemSpacing) * (index - 3);
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
                    
                    return; // Prevent clicking through shop box
                }

                // Check option tab buttons when in options menu
                if (this.inOptions) {
                    // Check option tab buttons
                    for (const [tabName, btn] of Object.entries(this.optionButtons)) {
                        if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                            clickY >= btn.y && clickY <= btn.y + btn.height) {
                            this.activeOptionTab = this.activeOptionTab === tabName ? '' : tabName;
                            break;
                        }
                    }
                    return; // Prevent clicking through options box
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

    loadGunUpgrade() {
        const savedUpgrade = localStorage.getItem('zombieShooterGunUpgrade');
        this.gunUpgradeLevel = savedUpgrade ? parseInt(savedUpgrade) : 0;
    }

    saveGunUpgrade() {
        localStorage.setItem('zombieShooterGunUpgrade', this.gunUpgradeLevel.toString());
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
            if (this.level >= 17 && this.greenSpawnCount % 15 === 0) {
                // Every 15 green enemies after level 17, spawn a blue enemy
                this.zombies.push(new Zombie(x, y, false, false, false, true)); // Blue zombie
            } else if (this.greenSpawnCount % 20 === 0) {
                this.zombies.push(new Zombie(x, y, false, false, true)); // Black zombie
            } else {
                this.zombies.push(new Zombie(x, y, false, true, false)); // Green zombie
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
                
                // Reset gun upgrades
                this.gunUpgradeLevel = 0;
                this.saveGunUpgrade();
                
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
        } else {
            this.player.color = 'white';
            this.player.scale = 1;
            this.player.speedBoost = 1;
            this.player.speedMultiplier = 1;
            this.player.damageMultiplier = 1;
            this.player.isMultiColor = false;
        }
        
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
                        const controlOptions = [
                            this.translations[this.selectedLanguage].move,
                            this.translations[this.selectedLanguage].aim,
                            this.translations[this.selectedLanguage].pauseGame,
                            this.translations[this.selectedLanguage].returnToMenu
                        ];
                        
                        // Draw each control option as a button
                        controlOptions.forEach((option, index) => {
                            const btnY = contentY + (index * 50);
                            const btnWidth = 400;
                            const btnHeight = 40;
                            const btnX = contentX - btnWidth/2;
                            
                            // Button background
                            ctx.fillStyle = '#333333';
                            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
                            ctx.strokeStyle = WHITE;
                            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
                            
                            // Button text
                            ctx.fillStyle = WHITE;
                            ctx.fillText(option, contentX, btnY + 28);
                        });
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

                    case 'credits':
                        ctx.fillStyle = WHITE;
                        ctx.fillText(this.translations[this.selectedLanguage].developer, contentX, contentY);
                        ctx.fillText(this.translations[this.selectedLanguage].soundDesign, contentX, contentY + 40);
                        ctx.fillText(this.translations[this.selectedLanguage].art, contentX, contentY + 80);
                        ctx.fillText(this.translations[this.selectedLanguage].sponsors, contentX, contentY + 120);
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
                    // Second row
                    itemX = secondRowStartX + (itemWidth + itemSpacing) * (index - 3);
                    itemY = secondRowY;
                }
                
                // Draw item box
                ctx.fillStyle = '#333333'; // Dark background for better contrast
                ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

                // Draw preview circle (player appearance)
                const previewSize = 12;
                const scale = item.scale || 1;
                
                if (item.isMultiColor) {
                    // Draw multi-colored circle (red and blue)
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.arc(itemX + itemWidth/2, itemY + 20, previewSize * scale, 0, Math.PI, false);
                    ctx.fill();
                    
                    ctx.fillStyle = '#0000FF';
                    ctx.beginPath();
                    ctx.arc(itemX + itemWidth/2, itemY + 20, previewSize * scale, 0, Math.PI, true);
                    ctx.fill();
                } else {
                    ctx.fillStyle = item.color;
                    ctx.beginPath();
                    ctx.arc(itemX + itemWidth/2, itemY + 20, previewSize * scale, 0, Math.PI * 2);
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

            // Close instruction
            ctx.fillStyle = '#808080';
            ctx.font = '20px Arial';
            ctx.fillText('Click Shop again to close', SCREEN_WIDTH/2, SCREEN_HEIGHT - 80);
            ctx.textAlign = 'left';
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
