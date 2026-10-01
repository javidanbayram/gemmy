/* ═══════════════════════════════════════════════════════════════════
   SEMA'S DAILY TREASURES — app.js
   Author note: This file is intentionally structured as clearly
   commented modules so you can easily find and customise each section.
   ═══════════════════════════════════════════════════════════════════

   QUICK CUSTOMISATION GUIDE:
   ──────────────────────────────────────────────────────────────────
   • To change daily rewards → edit the `rewardsData` array below.
   • To change the starting date → edit `STATE_DEFAULTS.startDate`.
   • To reset the app completely → call `resetState()` in the console.
   • To test "day already opened" → set lastOpenedDate to today's date.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   ① REWARDS DATA  ← PUT YOUR CUSTOM CONTENT HERE
   ═══════════════════════════════════════════════════════════════════
   Each entry = one day's reward box.
   Fields:
     type     → 'text' | 'image' | 'youtube' | 'audio' | 'scratch-off' | 'image-reveal' | 'iframe'
     emoji    → Emoji shown on the box card when ready/opened
     title    → Headline shown in the reward modal
     subtitle → (optional) Small subheading beneath the title (used by audio, image-reveal)
     content  → Meaning depends on type:
                'text'         → Raw HTML string (use <p> tags)
                'image'        → Direct image URL
                'youtube'      → YouTube embed URL (…/embed/VIDEO_ID)
                'audio'        → Direct .mp3 / .ogg / .wav URL
                'scratch-off'  → Secret message string revealed by scratch interaction
                'image-reveal' → Direct image URL revealed by a tap animation
   ─────────────────────────────────────────────────────────────────── */
const rewardsData = [
  {
    // ── Day 1 ── audio player ───────────────────────────────────────
    // ← Change content to a direct .mp3 / .ogg / .wav link
    day: 1,
    type: 'audio',
    emoji: '🎧',
    title: '1-ci Gün: Sənə bir mahnım var 🎧',
    subtitle: 'Qulaqcıqlarını tax, gözlərini yum və sadəcə dinlə...',
    content: 'https://files.catbox.moe/j7emhn.mp3'
  },
  {
    // ── Day 2 ── YouTube video ──────────────────────────────────────
    day: 2,
    type: 'youtube',
    emoji: '🎬',
    title: '2-ci Gün: Rarity kimi cəsur olmaq! 🎬',
    subtitle: 'Rarity-nin bu səhnədə necə cəsur və əzmli olduğuna bax... Eynilə sənin kimi 💜',
    content: 'https://www.youtube.com/embed/qmTRlJeYhG0'
  },
  {
    // ── Day 3 ── puzzle game ───────────────────────────────────────
    day: 3,
    type: 'iframe',
    emoji: '🧩',
    title: '3-cü Gün: Birlikdə tamamlayaq! 🧩',
    subtitle: 'Bu pazlı həll et!',
    content: 'https://puzzlesnap.com/share/294e59bfb017458'
  },
  {
    // ── Day 4 ── text message ───────────────────────────────────────
    day: 4,
    type: 'text',
    emoji: '💎',
    title: '4-cü Gün: Əla gedirsən! 💎',
    content: `<p>Günün necə keçir keçsin, bil ki, səninlə fəxr edirəm.</p>
              <p>4-cü günü uğurla bitirdin, indi bütün yorğunluğu kənara qoy, biraz dincəl və mənə yaz. 💜</p>`
  },
  {
    // ── Day 5 ── scratch-off reveal ─────────────────────────────────
    // ← Change content to whatever secret message you want hidden
    day: 5,
    type: 'scratch-off',
    emoji: '🪙',
    title: '5-ci Gün: Gizli Mesaj 🪙',
    content: 'Dünyanın ən şirin və mənim ən çox sevdiyim qızı! Həftəsonuna çox az qaldı, çooox darıxmışam ❤️'
  },
  {
    // ── Day 6 ── text message ───────────────────────────────────────
    day: 6,
    type: 'text',
    emoji: '💌',
    title: '6-cı Gün: Sənə bir sözüm var 💌',
    content: `<p>Sənin həyatımda olman hər şeyi daha gözəl edir.</p>
              <p>Gözlərinin içindəki o işığı və inadı heç nəyə dəyişmərəm.</p>
              <p><strong style="color:#c084fc;">Səni çooox sevirəm, Sema.</strong> 💜</p>`
  },
  {
    // ── Day 7 ── image reveal (tap to zoom in) ──────────────────────
    // ← Replace content with your real image URL before sending!
    day: 7,
    type: 'image-reveal',
    emoji: '🏆',
    title: '7-ci Gün: Böyük Final! 🏆',
    subtitle: 'Tam görmək üçün şəklin üzərinə toxun — səninlə xüsusi hazırlanmışdır ❤️',
    content: 'SENIN_DUZELTDIYIN_SEKLIN_LINKI_BURA_GELECEK.jpg'
  }
];

/* ═══════════════════════════════════════════════════════════════════
   ② APP CONFIGURATION
   ═══════════════════════════════════════════════════════════════════ */
const CONFIG = {
  STORAGE_KEY: 'sema_trophy_road_v1',   // ← localStorage key
  TOTAL_DAYS:  rewardsData.length,       // auto-derived from rewardsData
  TOAST_DURATION: 3800,                  // ms toast stays visible
  VIBRATE_DURATION: 950,                 // ms box vibrates before exploding
  PARTICLE_COUNT: 90,                    // confetti particle count
};

/**
 * TEST MODE — open the page with ?test=true to unlock all boxes at once.
 * e.g. file:///Users/user/gemmy/index.html?test=true
 * This flag is ONLY active when the URL contains ?test=true.
 * Normal users see zero difference.
 */
const TEST_MODE = new URLSearchParams(window.location.search).get('test') === 'true';

/* Default state (used on first launch or after reset) */
const STATE_DEFAULTS = {
  currentDay:     0,         // index of highest unlocked day (0 = none yet)
  lastOpenedDate: null,      // 'YYYY-MM-DD' string of last opened day
  boxStates: Array(CONFIG.TOTAL_DAYS).fill('locked') // 'locked'|'ready'|'opened'
};

/* ═══════════════════════════════════════════════════════════════════
   ③ STATE MANAGEMENT — localStorage wrapper
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Loads saved state from localStorage, falling back to defaults.
 * Handles corrupt JSON gracefully.
 */
function loadState() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return deepClone(STATE_DEFAULTS);
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle schema additions gracefully
    return Object.assign({}, STATE_DEFAULTS, parsed);
  } catch (e) {
    console.warn('[Sema] Could not parse saved state. Resetting.', e);
    return deepClone(STATE_DEFAULTS);
  }
}

/**
 * Persists current state to localStorage.
 */
function saveState(state) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Sema] Could not save state:', e);
  }
}

/** Helper — deep clone a plain object */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Exposes resetState globally for easy dev console use */
window.resetState = function() {
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  location.reload();
};

/* ═══════════════════════════════════════════════════════════════════
   ④ DATE UTILITIES
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Returns today's date as a 'YYYY-MM-DD' string (local time, no UTC shift).
 */
function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns a formatted friendly date string, e.g. "Wednesday, 30 Sep 2026"
 */
function getFriendlyDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ⑤ CORE TIME-LOCK LOGIC
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Computes and mutates the state object based on today's date.
 * Rules:
 *   - If no box has ever been opened AND no box is 'ready', unlock Day 1.
 *   - If today !== lastOpenedDate, advance the next locked box to 'ready'.
 *   - If today === lastOpenedDate, all remaining locked boxes stay locked.
 */
function applyTimeLockLogic(state) {
  // ── TEST MODE: unlock every box immediately ──────────────────────
  if (TEST_MODE) {
    state.boxStates = state.boxStates.map(s => s === 'locked' ? 'ready' : s);
    return state;
  }

  // ── Normal time-lock logic ───────────────────────────────────────
  const today = getTodayString();

  // Find the first 'ready' box index (if any)
  const readyIdx = state.boxStates.indexOf('ready');

  // Find the first 'locked' box index (the next in queue)
  const nextLockedIdx = state.boxStates.indexOf('locked');

  if (today !== state.lastOpenedDate) {
    if (nextLockedIdx !== -1) {
      if (readyIdx === -1) {
        state.boxStates[nextLockedIdx] = 'ready';
      }
    }
  }

  return state;
}

/* ═══════════════════════════════════════════════════════════════════
   ⑥ DOM REFERENCES
   ═══════════════════════════════════════════════════════════════════ */
const DOM = {
  get track()         { return document.getElementById('trophy-road-track'); },
  get companion()     { return document.getElementById('companion'); },
  get statusText()    { return document.getElementById('companion-status'); },
  get dateLabel()     { return document.getElementById('header-date-label'); },
  get overlay()       { return document.getElementById('overlay'); },
  get modal()         { return document.getElementById('reward-modal'); },
  get modalTitle()    { return document.getElementById('modal-title'); },
  get modalContent()  { return document.getElementById('modal-content'); },
  get modalBadge()    { return document.getElementById('modal-day-badge'); },
  get modalCloseBtn() { return document.getElementById('modal-close-btn'); },
  get toast()         { return document.getElementById('toast'); },
  get toastMsg()      { return document.getElementById('toast-message'); },
  get canvas()        { return document.getElementById('particle-canvas'); },
};

/* ═══════════════════════════════════════════════════════════════════
   ⑦ TROPHY ROAD — RENDER
   ═══════════════════════════════════════════════════════════════════ */

/** Maps box state string to its display properties */
const BOX_DISPLAY = {
  locked: {
    icon: '🔒',
    label: 'Locked',
    ariaLabel: 'Locked reward box'
  },
  ready: {
    icon: '💎',
    label: 'Open Me!',
    ariaLabel: 'Today\'s reward — tap to open!'
  },
  opened: {
    icon: '✅',
    label: 'Opened!',
    ariaLabel: 'Reward already claimed'
  }
};

/**
 * Builds and injects all day-box elements into the track.
 * Called once on init, then re-called after state changes.
 */
function renderTrophyRoad(state) {
  const track = DOM.track;
  track.innerHTML = '';

  state.boxStates.forEach((boxState, idx) => {
    const reward = rewardsData[idx];
    const display = BOX_DISPLAY[boxState];

    // Connector line between boxes (not before the first)
    if (idx > 0) {
      const connector = document.createElement('div');
      connector.className = 'road-connector';
      connector.setAttribute('aria-hidden', 'true');
      track.appendChild(connector);
    }

    // The box card
    const box = document.createElement('div');
    box.className = `day-box state-${boxState}`;
    box.dataset.index = idx;
    box.dataset.state = boxState;
    box.setAttribute('role', 'listitem');
    box.setAttribute('aria-label', `Day ${idx + 1}: ${display.ariaLabel}`);
    box.id = `day-box-${idx}`;

    // Determine the icon: use reward emoji if opened/ready, else lock
    const iconToShow = (boxState === 'locked') ? '🔒' : reward.emoji;

    box.innerHTML = `
      <span class="box-day-label">Day ${idx + 1}</span>
      <span class="box-icon" aria-hidden="true">${iconToShow}</span>
      <span class="box-status-label">${display.label}</span>
      ${boxState === 'opened' ? '<div class="box-star-badge" aria-hidden="true">⭐</div>' : ''}
    `;

    // Event listener
    box.addEventListener('click', () => handleBoxClick(idx, state, box));

    track.appendChild(box);
  });

  // Auto-scroll the track to show the 'ready' box
  const readyIdx = state.boxStates.indexOf('ready');
  if (readyIdx !== -1) {
    requestAnimationFrame(() => {
      const readyBox = document.getElementById(`day-box-${readyIdx}`);
      if (readyBox) {
        readyBox.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ⑧ INTERACTION HANDLERS
   ═══════════════════════════════════════════════════════════════════ */

/** Global flag to prevent double-triggers during animation sequence */
let isAnimating = false;

/**
 * Handles clicking a box.
 * Routes to the correct behaviour based on the box's current state.
 */
function handleBoxClick(idx, state, boxEl) {
  if (isAnimating) return;
  const boxState = state.boxStates[idx];

  if (boxState === 'opened') {
    // Already opened — show a soft reminder
    showToast('Already claimed! Come back tomorrow. 🌙', '✨');
    return;
  }

  if (boxState === 'locked') {
    // Locked — shake the companion and show sassy toast
    triggerCompanionShake();
    showToast("I'm tired! Let's open the next one tomorrow at midnight. 💤", '💤');
    return;
  }

  if (boxState === 'ready') {
    // The main event! Kick off the opening sequence.
    startOpenSequence(idx, state, boxEl);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ⑨ BOX OPENING SEQUENCE  (Brawl Stars style)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Full cinematic sequence for opening a box:
 * 1. Click feedback (scale down)
 * 2. Overlay fades in
 * 3. Companion celebrates
 * 4. Box vibrates aggressively
 * 5. Box "explodes" away
 * 6. Confetti particles rain down
 * 7. Reward modal slides in
 */
function startOpenSequence(idx, state, boxEl) {
  isAnimating = true;

  // ── Step 1: Click press feedback ────────────────────────────────
  boxEl.style.transform = 'scale(0.92)';

  setTimeout(() => {
    boxEl.style.transform = '';

    // ── Step 2: Darken the screen ────────────────────────────────
    DOM.overlay.classList.add('is-visible');

    // ── Step 3: Companion celebration ────────────────────────────
    triggerCompanionCelebrate();
    setStatusText('🎉 OH WOW! Open it! Open it!');

    // ── Step 4: Vibrate the box ───────────────────────────────────
    boxEl.classList.remove('state-ready');
    boxEl.classList.add('vibrating');

    setTimeout(() => {
      boxEl.classList.remove('vibrating');

      // ── Step 5: Explode the box ───────────────────────────────
      boxEl.classList.add('exploding');

      // ── Step 6: Particles! ────────────────────────────────────
      spawnParticles();

      setTimeout(() => {
        // ── Step 7: Show modal ────────────────────────────────
        populateModal(idx);
        DOM.modal.classList.add('is-visible');
        DOM.modal.focus();

        // Update state now
        state.boxStates[idx] = 'opened';
        state.lastOpenedDate = getTodayString();
        state.currentDay = idx + 1;
        saveState(state);

      }, 450);

    }, CONFIG.VIBRATE_DURATION);

  }, 100);
}

/**
 * Populates the modal with reward content for the given day index.
 * Supports: text | image | youtube | audio | scratch-off | image-reveal
 */
function populateModal(idx) {
  const reward = rewardsData[idx];
  DOM.modalBadge.textContent = `Gün ${idx + 1}`;
  DOM.modalTitle.textContent = reward.title;

  // Optional subtitle line (used by audio + image-reveal)
  let subtitleHTML = '';
  if (reward.subtitle) {
    subtitleHTML = `<p class="modal-subtitle">${reward.subtitle}</p>`;
  }

  let contentHTML = '';

  switch (reward.type) {

    // ── Plain text / HTML ──────────────────────────────────────────
    case 'text':
      contentHTML = subtitleHTML + reward.content;
      break;

    // ── Static image ───────────────────────────────────────────────
    case 'image':
      contentHTML = subtitleHTML +
        `<img src="${reward.content}" alt="Gün ${idx + 1} mükafat şəkli" loading="lazy" />`;
      break;

    // ── Iframe ─────────────────────────────────────────────────────
    case 'iframe':
      contentHTML = subtitleHTML + `
        <div class="iframe-wrapper" style="width: 100%; height: 400px; border-radius: 12px; overflow: hidden; margin-top: 10px;">
          <iframe
            src="${reward.content}"
            title="Gün ${idx + 1} məzmunu"
            style="width: 100%; height: 100%; border: none;"
            allowfullscreen
          ></iframe>
        </div>
      `;
      break;

    // ── YouTube embed ──────────────────────────────────────────────
    // content = 'https://www.youtube.com/embed/VIDEO_ID'
    case 'youtube':
      contentHTML = subtitleHTML + `
        <iframe
          src="${reward.content}"
          title="Gün ${idx + 1} video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
      break;

    // ── Audio player ───────────────────────────────────────────────
    // content = direct URL to .mp3 / .ogg / .wav
    case 'audio':
      contentHTML = subtitleHTML + `
        <div class="audio-player-wrapper">
          <div class="audio-visualiser" id="audio-visualiser" aria-hidden="true">
            ${Array.from({length: 20}, (_, i) =>
              `<span class="audio-bar" style="animation-delay:${(i * 0.07).toFixed(2)}s"></span>`
            ).join('')}
          </div>
          <audio
            id="reward-audio"
            src="${reward.content}"
            preload="metadata"
          ></audio>
          <div class="audio-controls">
            <button id="audio-play-btn" class="audio-btn" aria-label="Çal / Dayandır">
              <span class="audio-btn-icon">▶</span>
            </button>
            <div class="audio-progress-wrapper">
              <div class="audio-progress-bar" id="audio-progress-bar">
                <div class="audio-progress-fill" id="audio-progress-fill"></div>
                <div class="audio-progress-thumb" id="audio-progress-thumb"></div>
              </div>
              <div class="audio-time-row">
                <span id="audio-current-time" class="audio-time">0:00</span>
                <span id="audio-duration" class="audio-time">0:00</span>
              </div>
            </div>
          </div>
        </div>
      `;
      // Wire up after DOM insertion
      requestAnimationFrame(() => initAudioPlayer());
      break;

    // ── Scratch-off canvas ─────────────────────────────────────────
    // content = the secret text to reveal underneath
    case 'scratch-off':
      contentHTML = `
        <div class="scratch-wrapper">
          <p class="scratch-hint">Mesajı görmək üçün barmağınla sil! 🪙</p>
          <div class="scratch-container" id="scratch-container">
            <!-- Hidden message underneath (rendered in CSS via data attribute) -->
            <div class="scratch-message" id="scratch-message">
              <span class="scratch-heart">❤️</span>
              <p>${reward.content}</p>
            </div>
            <!-- Canvas sits on top — scratching erases it to reveal message -->
            <canvas id="scratch-canvas" class="scratch-canvas"></canvas>
          </div>
          <p class="scratch-percent" id="scratch-percent">0% silinib</p>
        </div>
      `;
      requestAnimationFrame(() => initScratchOff());
      break;

    // ── Image reveal (blurred → tap → full reveal) ─────────────────
    // content = image URL
    case 'image-reveal':
      contentHTML = subtitleHTML + `
        <div class="image-reveal-wrapper" id="image-reveal-wrapper">
          <img
            src="${reward.content}"
            alt="Sürpriz şəkil"
            class="image-reveal-img"
            id="image-reveal-img"
            loading="lazy"
          />
          <div class="image-reveal-overlay" id="image-reveal-overlay">
            <span class="image-reveal-tap-hint">👆 Toxun</span>
          </div>
        </div>
      `;
      requestAnimationFrame(() => initImageReveal());
      break;

    default:
      contentHTML = `<p>${reward.content}</p>`;
  }

  DOM.modalContent.innerHTML = contentHTML;
}

/* ─────────────────────────────────────────────────────────────────
   AUDIO PLAYER — initialiser (called after HTML is injected)
   ─────────────────────────────────────────────────────────────── */
function initAudioPlayer() {
  const audio    = document.getElementById('reward-audio');
  const playBtn  = document.getElementById('audio-play-btn');
  const icon     = playBtn ? playBtn.querySelector('.audio-btn-icon') : null;
  const fill     = document.getElementById('audio-progress-fill');
  const thumb    = document.getElementById('audio-progress-thumb');
  const bar      = document.getElementById('audio-progress-bar');
  const curTime  = document.getElementById('audio-current-time');
  const durEl    = document.getElementById('audio-duration');
  const visualiser = document.getElementById('audio-visualiser');

  if (!audio || !playBtn) return;

  // Format seconds → M:SS
  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  audio.addEventListener('loadedmetadata', () => {
    durEl.textContent = fmt(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width  = pct + '%';
    thumb.style.left  = pct + '%';
    curTime.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('ended', () => {
    icon.textContent = '▶';
    visualiser.classList.remove('is-playing');
  });

  // Play / pause toggle
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      icon.textContent = '⏸';
      visualiser.classList.add('is-playing');
    } else {
      audio.pause();
      icon.textContent = '▶';
      visualiser.classList.remove('is-playing');
    }
  });

  // Seek by clicking progress bar
  bar.addEventListener('click', e => {
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });
}

/* ─────────────────────────────────────────────────────────────────
   SCRATCH-OFF — canvas eraser initialiser
   ─────────────────────────────────────────────────────────────── */
function initScratchOff() {
  const container = document.getElementById('scratch-container');
  const canvas    = document.getElementById('scratch-canvas');
  const pctEl     = document.getElementById('scratch-percent');
  if (!canvas || !container) return;

  const W = container.offsetWidth  || 300;
  const H = container.offsetHeight || 160;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');

  // Draw the scratch surface (shimmery gold gradient)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   '#7b3fe4');
  grad.addColorStop(0.5, '#a855f7');
  grad.addColorStop(1,   '#4a1a8c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Gold coin texture overlay
  ctx.fillStyle = 'rgba(251,191,36,0.25)';
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * W,
      Math.random() * H,
      Math.random() * 3 + 1,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  // Instructions text on the surface
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 15px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🪙  Sil  🪙', W / 2, H / 2 - 6);
  ctx.font = '12px Nunito, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('Barmağını sürüşdür', W / 2, H / 2 + 14);

  // Erase mode
  ctx.globalCompositeOperation = 'destination-out';
  const BRUSH = 38;

  let isDrawing = false;
  let totalPixels = W * H;
  let lastCheckTime = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (W / rect.width),
      y: (src.clientY - rect.top)  * (H / rect.height)
    };
  }

  function scratch(e) {
    e.preventDefault();
    const {x, y} = getPos(e);
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();

    // Throttle pixel counting to every 120ms
    const now = Date.now();
    if (now - lastCheckTime > 120) {
      lastCheckTime = now;
      checkRevealPercent();
    }
  }

  function checkRevealPercent() {
    // Sample a grid of pixels to estimate cleared area
    const sampleSize = 400;
    const data = ctx.getImageData(0, 0, W, H).data;
    let cleared = 0;
    const step = Math.floor((data.length / 4) / sampleSize);
    for (let i = 0; i < sampleSize; i++) {
      if (data[i * step * 4 + 3] < 128) cleared++;
    }
    const pct = Math.min(100, Math.round((cleared / sampleSize) * 100));
    pctEl.textContent = `${pct}% silinib`;

    // Auto-complete at 60%
    if (pct >= 60) {
      ctx.clearRect(0, 0, W, H);
      pctEl.textContent = '✨ Tam açıldı!';
      canvas.style.pointerEvents = 'none';
    }
  }

  canvas.addEventListener('mousedown',  () => { isDrawing = true; });
  canvas.addEventListener('mouseup',    () => { isDrawing = false; });
  canvas.addEventListener('mouseleave', () => { isDrawing = false; });
  canvas.addEventListener('mousemove',  e => { if (isDrawing) scratch(e); });
  canvas.addEventListener('touchstart', e => { isDrawing = true; scratch(e); }, {passive: false});
  canvas.addEventListener('touchend',   () => { isDrawing = false; });
  canvas.addEventListener('touchmove',  e => { if (isDrawing) scratch(e); }, {passive: false});
}

/* ─────────────────────────────────────────────────────────────────
   IMAGE REVEAL — blur-to-clear tap animation
   ─────────────────────────────────────────────────────────────── */
function initImageReveal() {
  const wrapper  = document.getElementById('image-reveal-wrapper');
  const overlay  = document.getElementById('image-reveal-overlay');
  const img      = document.getElementById('image-reveal-img');
  if (!wrapper || !overlay || !img) return;

  overlay.addEventListener('click', () => {
    img.classList.add('is-revealed');
    overlay.classList.add('is-hidden');
  });
}

/**
 * Closes the modal, hides the overlay, re-renders the road, and
 * resets the companion to idle floating state.
 */
function closeModal(state) {
  DOM.modal.classList.remove('is-visible');
  DOM.overlay.classList.remove('is-visible');

  setTimeout(() => {
    // In TEST_MODE: immediately make the next locked box ready
    if (TEST_MODE) {
      const nextLocked = state.boxStates.indexOf('locked');
      if (nextLocked !== -1) state.boxStates[nextLocked] = 'ready';
    }

    // Re-render the road with updated state (opened box now shows checkmark)
    renderTrophyRoad(state);

    // Restore companion idle state
    const companion = DOM.companion;
    companion.classList.remove('anim-celebrate', 'anim-shake');
    void companion.offsetWidth; // reflow
    companion.classList.add('anim-idle');

    const nextReady = state.boxStates.indexOf('ready');
    if (TEST_MODE && nextReady !== -1) {
      setStatusText(`🧪 Test mode — click Day ${nextReady + 1} next!`);
    } else {
      setStatusText('✨ Come back tomorrow for more!');
    }
    isAnimating = false;

    // Stop particles
    stopParticles();
  }, 400);
}

/* ═══════════════════════════════════════════════════════════════════
   ⑩ COMPANION ANIMATION HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function triggerCompanionShake() {
  const el = DOM.companion;
  el.classList.remove('anim-celebrate', 'anim-shake', 'anim-idle');
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('anim-shake');
  el.addEventListener('animationend', () => {
    el.classList.remove('anim-shake');
    el.classList.add('anim-idle');
  }, { once: true });
}

function triggerCompanionCelebrate() {
  const el = DOM.companion;
  el.classList.remove('anim-celebrate', 'anim-shake', 'anim-idle');
  void el.offsetWidth;
  el.classList.add('anim-celebrate');
  // After one celebrate, keep looping celebrate until modal closes
  el.addEventListener('animationend', () => {
    el.classList.remove('anim-celebrate');
    void el.offsetWidth;
    el.classList.add('anim-celebrate');
  }, { once: true });
}

function setStatusText(text) {
  const el = DOM.statusText;
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = text;
    el.style.opacity = '1';
  }, 180);
}

/* ═══════════════════════════════════════════════════════════════════
   ⑪ TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, icon = '💤') {
  const toastEl = DOM.toast;
  const msgEl = DOM.toastMsg;

  // Update icon
  toastEl.querySelector('.toast-icon').textContent = icon;
  msgEl.textContent = message;

  // Show
  toastEl.classList.add('is-visible');

  // Clear any existing timer
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, CONFIG.TOAST_DURATION);
}

/* ═══════════════════════════════════════════════════════════════════
   ⑫ PARTICLE / CONFETTI SYSTEM  (pure Canvas, no libraries)
   ═══════════════════════════════════════════════════════════════════
   Each particle is a small coloured shape (gem / dot / star) that
   launches from the center of the screen with randomised velocity
   and a gravity-affected arc. Runs on requestAnimationFrame.
   ─────────────────────────────────────────────────────────────────── */

/** Particle pool */
let particles = [];
let particleRAF = null;
let particlesRunning = false;

/* Colour palette for particles — purples, golds, whites */
const PARTICLE_COLORS = [
  '#a855f7', '#c084fc', '#e9d5ff',   // purples
  '#fbbf24', '#fde68a',               // golds
  '#ffffff', '#f0e6ff',               // whites/lavender
  '#34d399', '#6ee7b7',               // mint accents
  '#f472b6', '#fbcfe8',               // rose
];

/* Particle shapes drawn on canvas */
const PARTICLE_SHAPES = ['diamond', 'circle', 'star', 'rect'];

class Particle {
  constructor(canvasW, canvasH) {
    this.reset(canvasW, canvasH);
  }

  reset(canvasW, canvasH) {
    // Launch from center-ish of screen
    this.x = canvasW * 0.5 + (Math.random() - 0.5) * canvasW * 0.3;
    this.y = canvasH * 0.4;

    // Random velocity — fan outward from center
    const angle = (Math.random() * Math.PI * 2);
    const speed = 5 + Math.random() * 14;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 6; // bias upward

    this.gravity = 0.28 + Math.random() * 0.18;
    this.friction = 0.985;
    this.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    this.shape = PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)];
    this.size = 5 + Math.random() * 11;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.alpha = 1;
    this.fadeSpeed = 0.012 + Math.random() * 0.018;
    this.alive = true;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.alpha -= this.fadeSpeed;
    if (this.alpha <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    switch (this.shape) {
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.6, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'star':
        // 5-pointed star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          if (i === 0) ctx.moveTo(Math.cos(outerAngle) * this.size, Math.sin(outerAngle) * this.size);
          else ctx.lineTo(Math.cos(outerAngle) * this.size, Math.sin(outerAngle) * this.size);
          ctx.lineTo(Math.cos(innerAngle) * this.size * 0.42, Math.sin(innerAngle) * this.size * 0.42);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'rect':
        ctx.fillRect(-this.size * 0.35, -this.size * 0.55, this.size * 0.7, this.size * 1.1);
        break;
    }
    ctx.restore();
  }
}

function spawnParticles() {
  const canvas = DOM.canvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  particles = [];
  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    particles.push(new Particle(canvas.width, canvas.height));
  }

  if (!particlesRunning) {
    particlesRunning = true;
    animateParticles();
  }
}

function animateParticles() {
  const canvas = DOM.canvas;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.alive);

  particles.forEach(p => {
    p.update();
    p.draw(ctx);
  });

  if (particles.length > 0) {
    particleRAF = requestAnimationFrame(animateParticles);
  } else {
    particlesRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function stopParticles() {
  if (particleRAF) {
    cancelAnimationFrame(particleRAF);
    particleRAF = null;
    particlesRunning = false;
  }
  const canvas = DOM.canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
}

/* Handle canvas resize */
window.addEventListener('resize', () => {
  const canvas = DOM.canvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ═══════════════════════════════════════════════════════════════════
   ⑬ COMPANION STATUS MESSAGES
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Sets the companion's status text based on current app state.
 */
function updateCompanionStatus(state) {
  const readyIdx = state.boxStates.indexOf('ready');
  const allOpened = state.boxStates.every(s => s === 'opened');

  if (allOpened) {
    setStatusText(`🏆 All treasures found! You're amazing!`);
  } else if (readyIdx !== -1) {
    setStatusText(`✨ Day ${readyIdx + 1}'s treasure is ready! Tap it! 💎`);
  } else {
    setStatusText('💤 Come back tomorrow for your next surprise!');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ⑭ INITIALISATION
   ═══════════════════════════════════════════════════════════════════ */

function init() {
  // 1. Load saved state
  let state = loadState();

  // 2. Apply time-lock logic (may unlock a new 'ready' box)
  state = applyTimeLockLogic(state);

  // 3. Save updated state
  saveState(state);

  // 4. Update header date label
  DOM.dateLabel.textContent = getFriendlyDate();

  // 5. Set companion status
  updateCompanionStatus(state);

  // 6. Render trophy road
  renderTrophyRoad(state);

  // 7. Wire up modal close button
  DOM.modalCloseBtn.addEventListener('click', () => closeModal(state));

  // 8. Allow closing modal by clicking the overlay (but not during animation sequence)
  DOM.overlay.addEventListener('click', () => {
    if (DOM.modal.classList.contains('is-visible')) {
      closeModal(state);
    }
  });

  // 9. Set companion to idle float
  DOM.companion.classList.add('anim-idle');

  // 10. Stagger-animate boxes in on load
  requestAnimationFrame(() => {
    document.querySelectorAll('.day-box').forEach((box, i) => {
      box.style.opacity = '0';
      box.style.transform = 'translateY(20px) scale(0.9)';
      box.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s var(--ease-bounce) ${i * 0.08}s`;
      requestAnimationFrame(() => {
        box.style.opacity = '1';
        box.style.transform = '';
      });
    });
  });
}

// Kick it all off when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
