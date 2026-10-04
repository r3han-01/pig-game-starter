'use strict';

/* ========================================================
   DOM ELEMENTS
======================================================== */
const player0El = document.querySelector('.player--0');
const player1El = document.querySelector('.player--1');
const score0El = document.querySelector('#score--0');
const score1El = document.querySelector('#score--1');
const current0El = document.querySelector('#current--0');
const current1El = document.querySelector('#current--1');
const name0El = document.querySelector('#name--0');
const name1El = document.querySelector('#name--1');
const popup0El = document.querySelector('#popup--0');
const popup1El = document.querySelector('#popup--1');

const diceStage = document.querySelector('#dice-stage');
const diceCube = document.querySelector('#dice-cube');
const diceShadow = document.querySelector('#dice-shadow');

const btnNew = document.querySelector('#btn-new');
const btnRoll = document.querySelector('#btn-roll');
const btnHold = document.querySelector('#btn-hold');
const btnSound = document.querySelector('#btn-sound');
const btnRules = document.querySelector('#btn-rules');
const btnModalOk = document.querySelector('#btn-modal-ok');
const modalClose = document.querySelector('#modal-close');
const rulesModal = document.querySelector('#rules-modal');
const winnerModal = document.querySelector('#winner-modal');
const winnerMessageEl = document.querySelector('#winner-message');
const winnerScoreEl = document.querySelector('#winner-score');
const btnPlayAgain = document.querySelector('#btn-play-again');
const targetBtns = document.querySelectorAll('.target-btn');

/* ========================================================
   WEB AUDIO API SOUND ENGINE (Zero External Assets)
======================================================== */
let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.25) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error('Audio play error:', err);
  }
}

// Sound: Dice Roll Tumble / Clatter
function soundRoll() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Rapid series of tiny wood/acrylic clatter bursts
  const clatterTimes = [0, 0.08, 0.18, 0.3, 0.44, 0.58, 0.72];
  clatterTimes.forEach((delay, idx) => {
    setTimeout(() => {
      const pitch = 240 + Math.random() * 260 + (idx === clatterTimes.length - 1 ? 60 : 0);
      playTone(pitch, 'triangle', 0.07, 0.15);
    }, delay * 1000);
  });
}

// Sound: Score Add Ding
function soundScore(value) {
  const baseFreq = 480 + value * 45;
  playTone(baseFreq, 'sine', 0.18, 0.2);
}

// Sound: Bust on 1 (comical low descending tone)
function soundBust() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {}
}

// Sound: Bank Hold Score (pleasant two-tone cash chime)
function soundBank() {
  playTone(523.25, 'sine', 0.15, 0.2); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.25, 0.25), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.35, 0.25), 200); // G5
}

// Sound: Victory Fanfare
function soundWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'triangle', 0.4, 0.3);
    }, idx * 160);
  });
}

// Toggle Sound
btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  btnSound.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
  btnSound.title = soundEnabled ? 'Mute Sound FX (Key: M)' : 'Unmute Sound FX (Key: M)';
});

/* ========================================================
   CANVAS CONFETTI ENGINE
======================================================== */
const confettiCanvas = document.getElementById('confetti-canvas');
const ctxConfetti = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimationId = null;

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS = ['#c24b66', '#4a7c96', '#d4af37', '#3d8b68', '#7b4b74', '#c97a48'];

function launchConfetti() {
  stopConfetti();
  resizeConfettiCanvas();
  confettiParticles = [];

  for (let i = 0; i < 140; i++) {
    confettiParticles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.45,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx: (Math.random() - 0.5) * 22,
      vy: Math.random() * -18 - 4,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      gravity: 0.45,
      friction: 0.98,
      opacity: 1
    });
  }

  function update() {
    ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.rotation += p.vRotation;

      if (p.y > window.innerHeight * 0.6) {
        p.opacity -= 0.012;
      }

      if (p.opacity > 0 && p.y < window.innerHeight) {
        alive = true;
        ctxConfetti.save();
        ctxConfetti.translate(p.x, p.y);
        ctxConfetti.rotate((p.rotation * Math.PI) / 180);
        ctxConfetti.globalAlpha = Math.max(0, p.opacity);
        ctxConfetti.fillStyle = p.color;
        ctxConfetti.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctxConfetti.restore();
      }
    });

    if (alive) {
      confettiAnimationId = requestAnimationFrame(update);
    } else {
      ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  confettiAnimationId = requestAnimationFrame(update);
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

/* ========================================================
   GAME STATE & 3D ROTATION LOGIC
======================================================== */
let scores, currentScore, activePlayer, playing, isRolling;
let targetScore = 50;

// Base orientations for each die face
const FACE_ANGLES = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 180 }
};

let rotAccumX = 0;
let rotAccumY = 0;

// Show reaction popup animation (+X, BUST, BANKED)
function triggerPopup(playerIdx, text, type = '') {
  const popupEl = playerIdx === 0 ? popup0El : popup1El;
  popupEl.textContent = text;
  popupEl.className = 'player-popup';
  if (type) popupEl.classList.add(type);

  // Trigger reflow to restart animation
  void popupEl.offsetWidth;
  popupEl.classList.add('animate-popup');
}

// Switch Active Player
function switchPlayer() {
  document.getElementById(`current--${activePlayer}`).textContent = '0';
  currentScore = 0;
  activePlayer = activePlayer === 0 ? 1 : 0;

  player0El.classList.toggle('player--active', activePlayer === 0);
  player1El.classList.toggle('player--active', activePlayer === 1);
}

// Set Buttons Disabled Status
function setButtonsDisabled(disabled) {
  btnRoll.disabled = disabled;
  btnHold.disabled = disabled;
}

function finishGame(winner) {
  playing = false;
  activePlayer = winner;
  soundWin();
  launchConfetti();

  const winnerCard = winner === 0 ? player0El : player1El;
  player0El.classList.remove('player--active');
  player1El.classList.remove('player--active');
  winnerCard.classList.add('player--winner');
  winnerCard.querySelector('.turn-text').textContent = 'WINNER';
  winnerMessageEl.textContent = `${document.querySelector(`#name--${winner}`).textContent} wins!`;
  winnerScoreEl.textContent = scores[winner];
  winnerModal.classList.remove('hidden');

  setButtonsDisabled(true);
  btnPlayAgain.focus();
}

// Initialize / Reset Game
const init = function () {
  scores = [0, 0];
  currentScore = 0;
  activePlayer = 0;
  playing = true;
  isRolling = false;

  score0El.textContent = '0';
  score1El.textContent = '0';
  current0El.textContent = '0';
  current1El.textContent = '0';

  player0El.classList.remove('player--winner', 'shake-bust');
  player1El.classList.remove('player--winner', 'shake-bust');
  player0El.querySelector('.turn-text').textContent = 'ACTIVE TURN';
  player1El.querySelector('.turn-text').textContent = 'ACTIVE TURN';
  player0El.classList.add('player--active');
  player1El.classList.remove('player--active');

  setButtonsDisabled(false);
  winnerModal.classList.add('hidden');
  stopConfetti();

  // Reset 3D dice to default aesthetic preview angle
  rotAccumX = -15;
  rotAccumY = 25;
  diceCube.style.transform = `rotateX(${rotAccumX}deg) rotateY(${rotAccumY}deg)`;
};

init();

/* ========================================================
   ROLLING 3D DICE FUNCTIONALITY
======================================================== */
function rollDice() {
  if (!playing || isRolling) return;

  isRolling = true;
  setButtonsDisabled(true);

  // 1. Generate random dice roll (1 - 6)
  const dice = Math.trunc(Math.random() * 6) + 1;

  // 2. Play roll tumbling sound
  soundRoll();

  // 3. Animate 3D dice cube tumble
  diceStage.classList.add('rolling');
  diceCube.classList.add('rolling');

  // Add 2-3 full 360-degree spins along X and Y axes for dynamic tumble
  const turnsX = (Math.floor(Math.random() * 2) + 2) * 360;
  const turnsY = (Math.floor(Math.random() * 2) + 2) * 360;

  rotAccumX += turnsX + (FACE_ANGLES[dice].x - (rotAccumX % 360));
  rotAccumY += turnsY + (FACE_ANGLES[dice].y - (rotAccumY % 360));

  diceCube.style.transform = `rotateX(${rotAccumX}deg) rotateY(${rotAccumY}deg)`;

  // 4. Handle score & game state after roll lands (~850ms)
  setTimeout(() => {
    diceStage.classList.remove('rolling');
    diceCube.classList.remove('rolling');

    if (dice !== 1) {
      // Accumulate round score
      currentScore += dice;
      document.getElementById(`current--${activePlayer}`).textContent = currentScore;
      soundScore(dice);
      triggerPopup(activePlayer, `+${dice}`);

      isRolling = false;
      setButtonsDisabled(false);
    } else {
      // BUST: Rolled a 1
      soundBust();
      triggerPopup(activePlayer, '💥 BUST!', 'bust-popup');

      const activeCard = document.querySelector(`.player--${activePlayer}`);
      activeCard.classList.add('shake-bust');

      setTimeout(() => {
        activeCard.classList.remove('shake-bust');
        switchPlayer();
        isRolling = false;
        setButtonsDisabled(false);
      }, 700);
    }
  }, 850);
}

// Roll triggers via Roll button OR clicking 3D dice directly
btnRoll.addEventListener('click', rollDice);
diceStage.addEventListener('click', rollDice);

/* ========================================================
   HOLD SCORE FUNCTIONALITY
======================================================== */
btnHold.addEventListener('click', function () {
  if (!playing || isRolling || currentScore === 0) return;

  // 1. Add current score to active player's total score
  scores[activePlayer] += currentScore;
  document.getElementById(`score--${activePlayer}`).textContent = scores[activePlayer];
  soundBank();
  triggerPopup(activePlayer, `+${currentScore} 💰`, 'bank-popup');

  // 2. Check if player has won the game
  if (scores[activePlayer] >= targetScore) {
    finishGame(activePlayer);
  } else {
    // 3. Switch to next player
    switchPlayer();
  }
});

/* ========================================================
   NEW GAME & TARGET SCORE CONTROLS
======================================================== */
btnNew.addEventListener('click', init);
btnPlayAgain.addEventListener('click', () => {
  init();
  btnRoll.focus();
});

// Target score selector buttons (25, 50, 100)
targetBtns.forEach(btn => {
  btn.addEventListener('click', e => {
    targetBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    targetScore = parseInt(e.target.dataset.target, 10);

    // If game in progress already meets target, check win
    if (playing && (scores[0] >= targetScore || scores[1] >= targetScore)) {
      const winner = scores[0] >= targetScore ? 0 : 1;
      finishGame(winner);
    }
  });
});

/* ========================================================
   EDITABLE PLAYER NAMES
======================================================== */
[name0El, name1El].forEach((nameEl, idx) => {
  nameEl.addEventListener('click', () => {
    const currentName = nameEl.textContent;
    const newName = prompt(`Enter custom name for Player ${idx + 1}:`, currentName);
    if (newName && newName.trim().length > 0) {
      nameEl.textContent = newName.trim().substring(0, 16);
    }
  });
});

/* ========================================================
   RULES MODAL CONTROLS
======================================================== */
function openModal() {
  rulesModal.classList.remove('hidden');
}

function closeModal() {
  rulesModal.classList.add('hidden');
}

btnRules.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
btnModalOk.addEventListener('click', closeModal);
rulesModal.addEventListener('click', e => {
  if (e.target === rulesModal) closeModal();
});

/* ========================================================
   KEYBOARD SHORTCUTS
======================================================== */
window.addEventListener('keydown', e => {
  // Ignore if user is inside a form field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    rollDice();
  } else if (e.key === 'h' || e.key === 'H') {
    e.preventDefault();
    btnHold.click();
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    init();
  } else if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    btnSound.click();
  } else if (e.key === 'Escape') {
    closeModal();
  }
});