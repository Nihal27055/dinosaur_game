// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 300;

// Game variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 6;
let gameOver = false;
let jumping = false;
let obstacles = [];
let frame = 0;

// Display high score
document.getElementById('high-score').textContent = `HI: ${highScore}`;

// Dinosaur properties
const dino = {
    x: 50,
    y: 235,  // Adjusted to touch the floor
    width: 50,
    height: 65, // Made taller
    velocityY: 0,
    gravity: 0.6,  // Keep the same gravity
    jumpForce: -20,  // Increased jump force for higher jumps
    jumpHeight: 0,   // Track jump height
    maxJumpHeight: 150, // Increased maximum jump height
    draw() {
        ctx.fillStyle = '#535353';
        
        // Draw body more like Chrome dino
        ctx.fillRect(this.x, this.y, this.width - 15, this.height - 25);
        
        // Draw head - more T-Rex like
        ctx.fillRect(this.x + 20, this.y - 15, this.width - 20, this.height - 45);
        
        // Draw tail
        ctx.fillRect(this.x - 15, this.y + 5, 20, 10);
        
        // Draw legs
        if (jumping && this.velocityY < 5) {
            // Draw legs in running position while jumping
            ctx.fillRect(this.x + 5, this.y + 40, 8, 20);  // Front leg bent
            ctx.fillRect(this.x + 25, this.y + 40, 8, 20);  // Back leg bent
        } else {
            // Normal legs when standing/landing
            ctx.fillRect(this.x + 5, this.y + 40, 8, 25);  // Front leg
            ctx.fillRect(this.x + 25, this.y + 40, 8, 25);  // Back leg
        }
        
        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    },
    jump() {
        if (!jumping && !gameOver) {
            jumping = true;
            this.velocityY = this.jumpForce;
            this.jumpHeight = 0;
        }
    },
    update() {
        // Handle gravity and jumping mechanics
        if (jumping) {
            this.y += this.velocityY;
            this.jumpHeight += Math.abs(this.velocityY);
            
            // Apply gravity gradually
            this.velocityY += this.gravity;
            
            // Cap the jump height for more controlled jumps
            if (this.jumpHeight >= this.maxJumpHeight && this.velocityY < 0) {
                this.velocityY = 0; // Start falling when max height reached
            }
        } else {
            this.velocityY = 0;
        }
        
        // Check if landed
        if (this.y >= 235) {
            this.y = 235;
            this.velocityY = 0;
            jumping = false;
            this.jumpHeight = 0;
        }
    }
};

// Obstacle class
class Obstacle {
    constructor() {
        this.height = 60 + Math.random() * 40;  // Increased height - between 60-100 now
        this.width = 35 + Math.random() * 25;   // Increased width - between 35-60 now
        this.x = canvas.width;
        this.y = canvas.height - this.height;
        this.cactusType = Math.floor(Math.random() * 3); // 0, 1, or 2 for different types
    }

    draw() {
        ctx.fillStyle = '#2E8B57'; // Dark green for cacti
        
        if (this.cactusType === 0) {
            // Single cactus
            this.drawCactus(this.x, this.y, this.width, this.height);
        } else if (this.cactusType === 1) {
            // Double cactus
            this.drawCactus(this.x, this.y, this.width * 0.7, this.height);
            this.drawCactus(this.x + this.width * 0.4, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.7);
        } else {
            // Triple cactus
            this.drawCactus(this.x, this.y, this.width * 0.6, this.height);
            this.drawCactus(this.x + this.width * 0.3, this.y + this.height * 0.4, this.width * 0.5, this.height * 0.6);
            this.drawCactus(this.x - this.width * 0.2, this.y + this.height * 0.5, this.width * 0.4, this.height * 0.5);
        }
    }
    
    drawCactus(x, y, width, height) {
        // Main cactus body
        ctx.fillRect(x + width * 0.3, y, width * 0.4, height);
        
        // Cactus arms
        if (height > 40) {
            // Right arm
            ctx.fillRect(x + width * 0.7, y + height * 0.2, width * 0.3, width * 0.2);
            // Left arm
            ctx.fillRect(x, y + height * 0.4, width * 0.3, width * 0.2);
        }
    }

    update() {
        this.x -= gameSpeed;
    }
}

// Collision detection
function checkCollision(dino, obstacle) {
    // Use a slightly smaller hitbox for better gameplay feel
    const dinoHitbox = {
        x: dino.x + 5,
        y: dino.y + 5,
        width: dino.width - 10,
        height: dino.height - 10
    };
    
    // Use the main cactus body for collision
    const obstacleHitbox = {
        x: obstacle.x + obstacle.width * 0.3,
        y: obstacle.y,
        width: obstacle.width * 0.4,
        height: obstacle.height
    };
    
    return !(
        dinoHitbox.x + dinoHitbox.width < obstacleHitbox.x ||
        dinoHitbox.x > obstacleHitbox.x + obstacleHitbox.width ||
        dinoHitbox.y + dinoHitbox.height < obstacleHitbox.y ||
        dinoHitbox.y > obstacleHitbox.y + obstacleHitbox.height
    );
}

// Game controls
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        dino.jump();
        
        // Restart game if game over
        if (gameOver) {
            resetGame();
        }
    }
});

// Reset game
function resetGame() {
    score = 0;
    gameSpeed = 6;
    gameOver = false;
    obstacles = [];
    document.getElementById('score').textContent = '0';
    document.getElementById('game-over').classList.add('hidden');
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds randomly
    if (frame % 100 === 0) {
        drawCloud(Math.random() * canvas.width, 50 + Math.random() * 50);
    }
    
    // Update and draw ground
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, canvas.height - 1, canvas.width, 1);
    
    // Update game elements
    if (!gameOver) {
        dino.update();
        
        // Increase score
        if (frame % 5 === 0) {
            score++;
            document.getElementById('score').textContent = score;
            
            // Increase speed every 100 points
            if (score % 100 === 0) {
                gameSpeed += 0.5;
            }
        }
        
        // Spawn obstacles with more space between them
        if (frame % 100 === 0 || (frame % 150 === 0 && Math.random() > 0.5)) {
            obstacles.push(new Obstacle());
        }
        
        // Update and check obstacles
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            obstacle.update();
            
            // Check collision
            if (checkCollision(dino, obstacle)) {
                gameOver = true;
                document.getElementById('game-over').classList.remove('hidden');
                
                // Update high score
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('highScore', highScore);
                    document.getElementById('high-score').textContent = `HI: ${highScore}`;
                }
            }
            
            // Draw obstacle
            obstacle.draw();
            
            // Remove obstacles that are off-screen
            if (obstacle.x + obstacle.width < 0) {
                obstacles.splice(i, 1);
                i--;
            }
        }
        
        frame++;
    }
    
    // Draw dinosaur
    dino.draw();
    
    requestAnimationFrame(gameLoop);
}

// Draw a cloud
function drawCloud(x, y) {
    ctx.fillStyle = '#f1f1f1';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 15, 0, Math.PI * 2);
    ctx.arc(x + 10, y + 10, 15, 0, Math.PI * 2);
    ctx.fill();
}

// Start game
gameLoop(); 