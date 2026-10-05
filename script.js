const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.6;
const FLOOR = 450;

// Fighter Class
class Fighter {
    constructor({ position, velocity, color, facing }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 60;
        this.height = 140;
        this.color = color;
        this.facing = facing; // 'right' or 'left'
        this.isAttacking = false;
        this.health = 100;
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: 100,
            height: 50
        };
        this.isDead = false;
    }

    draw() {
        // Draw Fighter Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw Eyes/Direction Indicator
        ctx.fillStyle = '#ffffff';
        if (this.facing === 'right') {
            ctx.fillRect(this.position.x + 35, this.position.y + 20, 15, 10);
        } else {
            ctx.fillRect(this.position.x + 10, this.position.y + 20, 15, 10);
        }

        // Draw Attack Box if attacking
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
            ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        }
    }

    update() {
        this.draw();

        // Update Attack Box Position based on facing direction
        if (this.facing === 'right') {
            this.attackBox.position = {
                x: this.position.x + this.width,
                y: this.position.y + 30
            };
        } else {
            this.attackBox.position = {
                x: this.position.x - 100,
                y: this.position.y + 30
            };
        }

        // Apply movement physics
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Ground collision
        if (this.position.y + this.height + this.velocity.y >= FLOOR) {
            this.velocity.y = 0;
            this.position.y = FLOOR - this.height;
        } else {
            this.velocity.y += GRAVITY;
        }

        // Screen borders collision
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);
    }
}

// Instantiate Players
const player = new Fighter({
    position: { x: 200, y: 100 },
    velocity: { x: 0, y: 0 },
    color: '#00f3ff',
    facing: 'right'
});

const enemy = new Fighter({
    position: { x: 764, y: 100 },
    velocity: { x: 0, y: 0 },
    color: '#ff0055',
    facing: 'left'
});

// Keys Tracking
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false }
};

// Collision detection function
function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

// Timer Logic
let timer = 60;
let timerId;
function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        document.getElementById('timer').innerHTML = timer;
    }

    if (timer === 0) {
        determineWinner({ player, enemy, timerId });
    }
}
decreaseTimer();

// Game Over / Winner Decider
function determineWinner({ player, enemy, timerId }) {
    clearTimeout(timerId);
    document.getElementById('game-over-screen').classList.remove('hidden');
    let displayText = "TIE GAME!";
    if (player.health > enemy.health) {
        displayText = "PLAYER 1 WINS!";
    } else if (enemy.health > player.health) {
        displayText = "PLAYER 2 WINS!";
    }
    document.getElementById('winner-text').innerHTML = displayText;
}

// Main Game Loop
function animate() {
    window.requestAnimationFrame(animate);

    // Clear Screen & Draw Floor
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Floor Line
    ctx.strokeStyle = '#1f293d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    ctx.lineTo(canvas.width, FLOOR);
    ctx.stroke();

    player.update();
    enemy.update();

    // Reset Velocities
    player.velocity.x = 0;
    enemy.velocity.x = 0;

    // Player 1 Movement
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5;
        player.facing = 'left';
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5;
        player.facing = 'right';
    }

    // Player 2 Movement
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.velocity.x = -5;
        enemy.facing = 'left';
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5;
        enemy.facing = 'right';
    }

    // Detect Attacks & Hit Collisions
    // Player hits Enemy
    if (
        rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
        player.isAttacking
    ) {
        player.isAttacking = false;
        enemy.health -= 10;
        document.getElementById('p2-health').style.width = enemy.health + '%';
        if (enemy.health <= 0) determineWinner({ player, enemy, timerId });
    }

    // Enemy hits Player
    if (
        rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
        enemy.isAttacking
    ) {
        enemy.isAttacking = false;
        player.health -= 10;
        document.getElementById('p1-health').style.width = player.health + '%';
        if (player.health <= 0) determineWinner({ player, enemy, timerId });
    }
}

animate();

// Keyboard Listeners
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        // Player 1 Controls
        case 'd':
            keys.d.pressed = true;
            player.lastKey = 'd';
            break;
        case 'a':
            keys.a.pressed = true;
            player.lastKey = 'a';
            break;
        case 'w':
            if (player.position.y >= FLOOR - player.height - 10) {
                player.velocity.y = -15;
            }
            break;
        case ' ':
            player.attack();
            break;

        // Player 2 Controls
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            enemy.lastKey = 'ArrowRight';
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            enemy.lastKey = 'ArrowLeft';
            break;
        case 'ArrowUp':
            if (enemy.position.y >= FLOOR - enemy.height - 10) {
                enemy.velocity.y = -15;
            }
            break;
        case 'Enter':
            enemy.attack();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    // Player 1 Keys Up
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }

    // Player 2 Keys Up
    switch (event.key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
    }
});

// Reset Game Function
function resetGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    timer = 60;
    document.getElementById('timer').innerHTML = timer;
    player.health = 100;
    enemy.health = 100;
    document.getElementById('p1-health').style.width = '100%';
    document.getElementById('p2-health').style.width = '100%';
    player.position = { x: 200, y: 100 };
    enemy.position = { x: 764, y: 100 };
    decreaseTimer();
}
