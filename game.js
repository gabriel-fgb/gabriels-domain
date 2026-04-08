const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');

const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.34;
const FLAP_STRENGTH = -6.3;
const PIPE_SPEED = 2.1;
const PIPE_WIDTH = 64;
const PIPE_GAP = 165;
const PIPE_SPAWN_FRAMES = 92;
const GROUND_H = 90;

let best = Number(localStorage.getItem('flappy-ish-best') || 0);
bestEl.textContent = String(best);

const state = {
  running: false,
  gameOver: false,
  frame: 0,
  score: 0,
  bird: {
    x: 95,
    y: H / 2,
    radius: 16,
    velocity: 0,
    rotation: 0,
  },
  pipes: [],
};

function reset() {
  state.running = false;
  state.gameOver = false;
  state.frame = 0;
  state.score = 0;
  state.bird.y = H / 2;
  state.bird.velocity = 0;
  state.bird.rotation = 0;
  state.pipes = [];
  scoreEl.textContent = '0';
  statusEl.textContent = 'Press Space to start';
}

function start() {
  if (state.running) return;
  if (state.gameOver) {
    reset();
  }
  state.running = true;
  statusEl.textContent = 'Go!';
  flap();
}

function flap() {
  state.bird.velocity = FLAP_STRENGTH;
}

function spawnPipe() {
  const minTop = 60;
  const maxTop = H - GROUND_H - PIPE_GAP - 60;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;

  state.pipes.push({
    x: W + PIPE_WIDTH,
    top: topHeight,
    scored: false,
  });
}

function updateBird() {
  const b = state.bird;
  b.velocity += GRAVITY;
  b.y += b.velocity;
  b.rotation = Math.max(-0.45, Math.min(1.2, b.velocity * 0.08));

  const hitsTop = b.y - b.radius <= 0;
  const hitsGround = b.y + b.radius >= H - GROUND_H;
  if (hitsTop || hitsGround) {
    endGame();
  }
}

function updatePipes() {
  for (const pipe of state.pipes) {
    pipe.x -= PIPE_SPEED;

    const inBirdX =
      state.bird.x + state.bird.radius > pipe.x &&
      state.bird.x - state.bird.radius < pipe.x + PIPE_WIDTH;

    const inGap =
      state.bird.y - state.bird.radius > pipe.top &&
      state.bird.y + state.bird.radius < pipe.top + PIPE_GAP;

    if (inBirdX && !inGap) {
      endGame();
    }

    if (!pipe.scored && pipe.x + PIPE_WIDTH < state.bird.x) {
      pipe.scored = true;
      state.score += 1;
      scoreEl.textContent = String(state.score);
    }
  }

  state.pipes = state.pipes.filter((p) => p.x + PIPE_WIDTH > -4);

  if (state.frame % PIPE_SPAWN_FRAMES === 0) {
    spawnPipe();
  }
}

function endGame() {
  if (state.gameOver) return;
  state.running = false;
  state.gameOver = true;
  statusEl.textContent = 'Game Over — Press Space to restart';

  if (state.score > best) {
    best = state.score;
    localStorage.setItem('flappy-ish-best', String(best));
    bestEl.textContent = String(best);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, W, H);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#78c9ff');
  sky.addColorStop(1, '#d5f4ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d5f2c2';
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

  ctx.fillStyle = '#b4e197';
  for (let i = 0; i < W; i += 24) {
    ctx.fillRect(i, H - GROUND_H, 14, 8);
  }
}

function drawPipes() {
  for (const pipe of state.pipes) {
    // top pipe
    ctx.fillStyle = '#46a532';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.fillStyle = '#2f7f23';
    ctx.fillRect(pipe.x - 4, pipe.top - 16, PIPE_WIDTH + 8, 16);

    const bottomY = pipe.top + PIPE_GAP;
    const bottomHeight = H - GROUND_H - bottomY;

    // bottom pipe
    ctx.fillStyle = '#46a532';
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);
    ctx.fillStyle = '#2f7f23';
    ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 16);
  }
}

function drawBird() {
  const b = state.bird;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rotation);

  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f39a3f';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(25, -4);
  ctx.lineTo(25, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-3, -6, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-1, -6, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOverlay() {
  if (!state.running) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = '700 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(state.gameOver ? 'Game Over' : 'Flappy-ish', W / 2, H / 2 - 16);

    ctx.font = '500 18px system-ui';
    ctx.fillText('Press Space or Click', W / 2, H / 2 + 22);
  }
}

function tick() {
  if (state.running) {
    state.frame += 1;
    updateBird();
    updatePipes();
  }

  drawBackground();
  drawPipes();
  drawBird();
  drawOverlay();

  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  event.preventDefault();

  if (!state.running) {
    start();
  } else {
    flap();
  }
});

window.addEventListener('pointerdown', () => {
  if (!state.running) {
    start();
  } else {
    flap();
  }
});

reset();
tick();
