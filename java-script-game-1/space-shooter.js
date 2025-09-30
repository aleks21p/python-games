// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game objects
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: 5,
    color: '#00ff00'
};

const bullets = [];
const enemies = [];
let score = 0;
let gameOver = false;

// Bullet properties
const bulletSpeed = 7;
const bulletSize = 5;

// Enemy properties
const enemyWidth = 40;
const enemyHeight = 30;
const enemySpeed = 2;

// Controls
const keys = {
    left: false,
    right: false,
    space: false
};

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ') keys.space = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === ' ') keys.space = false;
});

// Create enemy
function createEnemy() {
    if (enemies.length < 5 && Math.random() < 0.02) {
        enemies.push({
            x: Math.random() * (canvas.width - enemyWidth),
            y: 0,
            width: enemyWidth,
            height: enemyHeight,
            color: '#ff0000'
        });
    }
}

// Shoot bullet
function shoot() {
    if (keys.space && bullets.length < 5) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            size: bulletSize,
            color: '#ffffff'
        });
    }
}

// Update game objects
function update() {
    if (gameOver) return;

    // Update player position
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed;
        
        // Check collision with player
        if (checkCollision(enemies[i], player)) {
            gameOver = true;
        }
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollisionBullet(bullets[j], enemies[i])) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                break;
            }
        }

        // Remove enemies that go off screen
        if (enemies[i] && enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }

    // Create new enemies
    createEnemy();

    // Shoot bullets
    shoot();
}

// Check collision between rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Check collision between bullet and enemy
function checkCollisionBullet(bullet, enemy) {
    return bullet.x > enemy.x &&
           bullet.x < enemy.x + enemy.width &&
           bullet.y > enemy.y &&
           bullet.y < enemy.y + enemy.height;
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = '#ffffff';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Draw game over
    if (gameOver) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', canvas.width/2 - 120, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2 - 70, canvas.height/2 + 40);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();