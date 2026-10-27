(() => {
  const game = document.querySelector('[data-game]');
  const grid = document.querySelector('[data-memory-grid]');
  const promptEl = document.querySelector('[data-prompt]');
  const promptNote = document.querySelector('[data-prompt-note]');
  const stageLabel = document.querySelector('[data-stage-label]');
  const selectedCount = document.querySelector('[data-selected-count]');
  const goalEl = document.querySelector('[data-goal]');
  const confidence = document.querySelector('[data-confidence]');
  const live = document.querySelector('[data-terminal-live]');
  const submit = document.querySelector('[data-submit]');
  const undo = document.querySelector('[data-undo]');
  const overlay = document.querySelector('[data-overlay]');
  const dots = [...document.querySelectorAll('[data-stage-dots] i')];
  const resetButtons = document.querySelectorAll('[data-reset-grid]');
  const soundButton = document.querySelector('[data-sound]');
  const backTop = document.querySelector('[data-back-top]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Each snapshot has the version the player first sees and the version the system can rewrite it into. */
  const S = (d) => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const SNAPSHOTS = [
    ['kitchen window', S('<rect x="22" y="18" width="56" height="56"/><path d="M50 18v56M22 46h56M16 80h68"/>'),
     'window, curtains drawn', S('<rect x="22" y="18" width="56" height="56"/><path d="M22 18c10 14 10 40 4 56M78 18c-10 14-10 40-4 56M30 18c6 18 6 38 2 56M70 18c-6 18-6 38-2 56M16 80h68"/>')],
    ['yellow lamp', S('<path d="M34 28h32l8 22H26z"/><path d="M50 50v30M36 82h28M50 14v6M28 20l4 5M72 20l-4 5"/>'),
     'lamp, switched off', S('<path d="M34 28h32l8 22H26z" stroke-dasharray="3 5"/><path d="M50 50v30M36 82h28M58 64q8 2 10 10"/>')],
    ['empty chair', S('<path d="M34 16v40M34 56h34M34 56v28M68 56v28M34 30h12"/>'),
     'chair, coat on it', S('<path d="M34 16v40M34 56h34M34 56v28M68 56v28"/><path d="M28 18c6-4 14-4 18 2l4 30c-8 4-18 4-24 0z"/>')],
    ['red umbrella', S('<path d="M16 50Q50 6 84 50Q73 44 62 50Q50 42 38 50Q27 44 16 50z"/><path d="M50 50v28q0 8-8 8"/>'),
     'umbrella, folded', S('<path d="M50 14L42 66h16z"/><path d="M50 66v12q0 8-8 8M46 30l8 8M44 46l10 6"/>')],
    ['blue door', S('<rect x="30" y="14" width="40" height="74"/><circle cx="62" cy="54" r="2.5"/><path d="M38 24h24v20H38z"/>'),
     'door, left open', S('<rect x="30" y="14" width="40" height="74" stroke-dasharray="3 5"/><path d="M30 14l22 8v58l-22 8z"/><circle cx="46" cy="54" r="2.5"/>')],
    ['two cups', S('<path d="M18 46h22l-3 24H21zM40 52q8 0 6 8-2 6-8 4M54 46h22l-3 24H57zM76 52q8 0 6 8-2 6-8 4M12 76h76"/>'),
     'three cups', S('<path d="M10 48h18l-2 20H12zM28 54q6 0 5 6-1 4-6 3M40 48h18l-2 20H42zM58 54q6 0 5 6-1 4-6 3M70 48h18l-2 20H72zM88 54q6 0 5 6-1 4-6 3M6 74h88"/>')],
    ['narrow stairs', S('<path d="M16 84h18V68h16V52h16V36h18M84 20v16"/>'),
     'stairs going down', S('<path d="M16 20v16h18v16h16v16h16v16h18"/><path d="M60 30l10 10M70 30v10H60" stroke-width="2.6"/>')],
    ['stopped clock', S('<circle cx="50" cy="50" r="32"/><path d="M50 50l15 9M50 50l9-17M50 22v4M78 50h-4M50 78v-4M22 50h4"/>'),
     'clock, still ticking', S('<circle cx="50" cy="50" r="32"/><path d="M50 50l-16-8M50 50l17-9M50 22v4M78 50h-4M50 78v-4M22 50h4M82 30l6-4M84 40l7-1"/>')],
    ['hallway plant', S('<path d="M36 64h28l-4 22H40zM50 64V40M50 46c-6-12-16-14-22-10 6 8 14 10 22 10M50 40c4-12 14-16 22-12-4 8-12 12-22 12M50 54c6-6 14-6 18-2-6 4-12 4-18 2"/>'),
     'plant, wilted', S('<path d="M36 64h28l-4 22H40zM50 64V44q0-8 6-10M56 34c8 2 12 10 10 18M50 50c-8-2-14 4-14 12M56 34c-10-2-16 2-18 8"/>')]
  ];

  const STAGES = [
    { label: 'Stage 1 / Recognize', prompt: 'Select the four things you remember from the kitchen.', note: 'Choose carefully. Each choice is recorded.', goal: 4, rewrites: false },
    { label: 'Stage 2 / Notice drift', prompt: 'Verify the room again. Select three.', note: 'The system is filling in what you could not see.', goal: 3, rewrites: true },
    { label: 'Stage 3 / Choose a story', prompt: 'Select all images that feel like home.', note: 'There is no wrong answer. Everything you choose will be verified.', goal: 1, rewrites: true, open: true }
  ];

  let soundOn = false, audioContext, stage = -1, tiles = [], history = [], rewrites = 0, choices = 0, certifiedRewritten = 0;

  function playTone(frequency = 360, duration = .08, detune = 0) {
    if (!soundOn) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioContext ||= new AC();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.055, audioContext.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + .02);
  }

  function buildGrid() {
    grid.innerHTML = '';
    tiles = SNAPSHOTS.map(([label, art], i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-tile drawn';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span class="tile-art">${art}</span><small>${label}</small>`;
      button.setAttribute('aria-label', `Select snapshot: ${label}`);
      button.addEventListener('click', () => toggle(i));
      grid.append(button);
      return { el: button, alt: false, rewritten: false };
    });
  }

  const selected = () => tiles.filter((t) => t.el.getAttribute('aria-pressed') === 'true');
  const labelOf = (i) => SNAPSHOTS[i][tiles[i].alt ? 2 : 0];

  function updateStatus(message) {
    const count = selected().length;
    const s = STAGES[stage];
    selectedCount.textContent = count;
    goalEl.textContent = s.open ? 'any' : s.goal;
    confidence.textContent = `${Math.min(96, 12 + choices * 7 + rewrites * 5)}%`;
    submit.disabled = s.open ? count < 1 : count !== s.goal;
    undo.disabled = history.length === 0;
    if (message) live.textContent = message;
  }

  function neighbours(i) {
    const r = Math.floor(i / 3), c = i % 3, out = [];
    if (r > 0) out.push(i - 3);
    if (r < 2) out.push(i + 3);
    if (c > 0) out.push(i - 1);
    if (c < 2) out.push(i + 1);
    return out;
  }

  function rewriteNeighbour(source) {
    const options = neighbours(source).filter((n) => tiles[n].el.getAttribute('aria-pressed') !== 'true');
    if (!options.length) return null;
    const fresh = options.filter((n) => !tiles[n].alt);
    const pick = (fresh.length ? fresh : options)[(choices + source) % (fresh.length || options.length)];
    const t = tiles[pick];
    const before = t.el.querySelector('.tile-art').innerHTML;
    t.alt = !t.alt;
    t.rewritten = true;
    const [label, art, altLabel, altArt] = SNAPSHOTS[pick];
    t.el.querySelector('.tile-art').innerHTML = t.alt ? altArt : art;
    t.el.querySelector('small').textContent = t.alt ? altLabel : label;
    t.el.setAttribute('aria-label', `Select snapshot: ${t.alt ? altLabel : label} (changed)`);
    t.el.classList.add('is-changed');
    if (!reduceMotion) {
      const ghost = document.createElement('span');
      ghost.className = 'afterimage';
      ghost.innerHTML = before;
      t.el.append(ghost);
      setTimeout(() => ghost.remove(), 1500);
    }
    rewrites += 1;
    playTone(245, .2, -180);
    return labelOf(pick);
  }

  function toggle(i) {
    if (stage < 0 || stage > 2) return;
    const t = tiles[i];
    const was = t.el.getAttribute('aria-pressed') === 'true';
    const s = STAGES[stage];
    if (!was && !s.open && selected().length >= s.goal) {
      updateStatus(`You already chose ${s.goal}. Deselect one first.`);
      return;
    }
    t.el.setAttribute('aria-pressed', String(!was));
    if (was) {
      history = history.filter((h) => h !== i);
      playTone(280);
      updateStatus(`${labelOf(i)} removed. The evidence it changed stays changed.`);
      return;
    }
    history.push(i);
    choices += 1;
    playTone(440 + selected().length * 25);
    let message = `${labelOf(i)} marked as remembered.`;
    if (s.rewrites) {
      const changed = rewriteNeighbour(i);
      if (changed) {
        message += ` A neighbouring image now shows: ${changed}.`;
        promptNote.textContent = 'A neighbouring memory was updated to support your choice.';
      }
    }
    updateStatus(message);
  }

  function setDots() { dots.forEach((d, n) => d.classList.toggle('on', n <= stage)); }

  function startStage(n) {
    stage = n;
    history = [];
    const s = STAGES[n];
    tiles.forEach((t) => { t.el.setAttribute('aria-pressed', 'false'); t.el.classList.remove('is-changed'); });
    game.dataset.stage = n + 1;
    stageLabel.textContent = s.label;
    promptEl.textContent = s.prompt;
    promptNote.textContent = s.note;
    submit.textContent = n === 2 ? 'Verify memory' : 'Submit';
    overlay.hidden = true;
    setDots();
    updateStatus(`${s.label}. ${s.prompt}`);
    playTone(330, .12);
  }

  function showIntro() {
    stage = -1;
    rewrites = 0; choices = 0; history = [];
    buildGrid();
    game.dataset.stage = 0;
    stageLabel.textContent = 'Memory verification / Event 27';
    promptEl.textContent = 'Select every image that really happened.';
    promptNote.textContent = 'Your choices may affect the evidence.';
    selectedCount.textContent = 0; goalEl.textContent = 4; confidence.textContent = '12%';
    submit.disabled = true; undo.disabled = true;
    setDots();
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="overlay-card">
        <span class="portal-badge">27</span>
        <p class="label">Memory recovery portal</p>
        <h3>We found 9 damaged snapshots from Event 27.</h3>
        <p>You are the only available witness. Help us confirm what happened.</p>
        <button type="button" class="button primary" data-begin>Begin verification</button>
        <small>Playable concept sketch of all three stages. About one minute.</small>
      </div>`;
    overlay.querySelector('[data-begin]').addEventListener('click', () => startStage(0));
    live.textContent = 'Concept demo ready. Press Begin verification.';
  }

  function showReceipt() {
    stage = 3;
    game.dataset.stage = 4;
    setDots();
    const chosen = tiles.map((t, i) => ({ ...t, i, picked: t.el.getAttribute('aria-pressed') === 'true' }));
    certifiedRewritten = chosen.filter((t) => t.picked && t.rewritten).length;
    const mosaic = chosen.map((t) => `<i class="${t.picked ? 'picked' : ''} ${t.rewritten ? 'rewritten' : ''}">${t.el.querySelector('.tile-art').innerHTML}</i>`).join('');
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="overlay-card receipt">
        <p class="label">Event 27 / reconstruction complete</p>
        <div class="receipt-mosaic" aria-hidden="true">${mosaic}</div>
        <dl class="receipt-stats">
          <div><dt>Your choices</dt><dd>${choices}</dd></div>
          <div><dt>Images the system rewrote</dt><dd>${rewrites}</dd></div>
          <div><dt>Rewritten images you verified as home</dt><dd>${certifiedRewritten}</dd></div>
        </dl>
        <h3>96% certain.</h3>
        <div class="receipt-actions">
          <button type="button" class="button secondary" data-final="keep">Keep uncertain</button>
          <button type="button" class="button primary" data-final="certify">Certify memory</button>
        </div>
      </div>`;
    overlay.querySelectorAll('[data-final]').forEach((b) => b.addEventListener('click', () => ending(b.dataset.final)));
    live.textContent = `Reconstruction complete. ${rewrites} images were rewritten. Certify or keep uncertain?`;
    playTone(520, .3);
  }

  function ending(choice) {
    const line = choice === 'certify'
      ? 'Certified. Event 27 is now how it happened.'
      : 'Kept uncertain. The gaps stay where they were.';
    const card = overlay.querySelector('.overlay-card');
    card.querySelector('.receipt-actions').outerHTML = `
      <p class="ending-line ${choice}">${line}</p>
      <p class="ending-q">Is a complete memory more useful than an honest gap?</p>
      <button type="button" class="button secondary" data-replay>Replay with the original grid</button>`;
    card.querySelector('[data-replay]').addEventListener('click', showIntro);
    live.textContent = line;
    playTone(choice === 'certify' ? 196 : 392, .5, choice === 'certify' ? -30 : 0);
  }

  submit.addEventListener('click', () => (stage < 2 ? startStage(stage + 1) : showReceipt()));
  undo.addEventListener('click', () => {
    const last = history.pop();
    if (last === undefined) return;
    tiles[last].el.setAttribute('aria-pressed', 'false');
    updateStatus(`Undid ${labelOf(last)}. The image it changed was not restored.`);
    playTone(280);
  });
  resetButtons.forEach((button) => button.addEventListener('click', showIntro));

  soundButton?.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.innerHTML = `<span aria-hidden="true">${soundOn ? '●' : '◌'}</span> Sound ${soundOn ? 'on' : 'off'}`;
    if (soundOn) playTone(440, .12);
  });

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Screenshot slots: hide a figure until its image file exists. */
  document.querySelectorAll('[data-shot] img').forEach((img) => {
    const fig = img.closest('[data-shot]');
    const hide = () => { fig.hidden = true; const strip = fig.closest('[data-shots]'); if (strip && !strip.querySelector('[data-shot]:not([hidden])')) strip.hidden = true; };
    if (img.complete && img.naturalWidth === 0) hide(); else img.addEventListener('error', hide);
  });

  showIntro();
})();
