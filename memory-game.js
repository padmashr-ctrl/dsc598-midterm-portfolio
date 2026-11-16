(() => {
  const screens = [...document.querySelectorAll('[data-screen]')];
  const grid = document.querySelector('[data-game-grid]');
  const startButton = document.querySelector('[data-start]');
  const continueButton = document.querySelector('[data-continue]');
  const nextStageButton = document.querySelector('[data-next-stage]');
  const skipFlashButton = document.querySelector('[data-skip-flash]');
  const restartButtons = document.querySelectorAll('[data-restart], [data-play-again]');
  const soundButton = document.querySelector('[data-sound]');
  const decisionButtons = document.querySelectorAll('[data-decision]');

  const ui = {
    stageLabel: document.querySelector('[data-stage-label]'),
    stageTitle: document.querySelector('[data-stage-title]'),
    stageCopy: document.querySelector('[data-stage-copy]'),
    selected: document.querySelector('[data-selected]'),
    confidence: document.querySelector('[data-confidence]'),
    instability: document.querySelector('[data-instability]'),
    ruleLabel: document.querySelector('[data-rule-label]'),
    rule: document.querySelector('[data-rule]'),
    consoleTitle: document.querySelector('[data-console-title]'),
    prompt: document.querySelector('[data-prompt]'),
    promptNote: document.querySelector('[data-prompt-note]'),
    live: document.querySelector('[data-live]'),
    time: document.querySelector('[data-session-time]'),
    transitionNumber: document.querySelector('[data-transition-number]'),
    transitionLabel: document.querySelector('[data-transition-label]'),
    transitionTitle: document.querySelector('[data-transition-title]'),
    transitionCopy: document.querySelector('[data-transition-copy]'),
    reconstruction: document.querySelector('[data-reconstruction]'),
    memoryId: document.querySelector('[data-memory-id]'),
    memoryCollage: document.querySelector('[data-memory-collage]'),
    rewriteLedger: document.querySelector('[data-rewrite-ledger]'),
    choiceTimeline: document.querySelector('[data-choice-timeline]'),
    totalChoices: document.querySelector('[data-total-choices]'),
    rewrites: document.querySelector('[data-rewrites]'),
    finalConfidence: document.querySelector('[data-final-confidence]'),
    generatedDate: document.querySelector('[data-generated-date]'),
    endingSummary: document.querySelector('[data-ending-summary]'),
    stamp: document.querySelector('[data-stamp]'),
    finalQuestion: document.querySelector('[data-final-question]'),
    finalResult: document.querySelector('[data-final-result]'),
    resultKicker: document.querySelector('[data-result-kicker]'),
    resultCopy: document.querySelector('[data-result-copy]'),
    flashCountdown: document.querySelector('[data-flash-countdown]'),
    lives: document.querySelector('[data-lives]'),
    score: document.querySelector('[data-score]')
  };

  const iconPaths = {
    window: '<rect x="18" y="18" width="64" height="64" rx="2"/><path d="M50 18v64M18 50h64"/>',
    lamp: '<path d="M28 52c0-18 10-29 22-29s22 11 22 29v7H28z"/><path d="M50 59v24M39 83h22"/>',
    coat: '<path d="M38 24 22 38l10 14 7-7v38h22V45l7 7 10-14-16-14-7 8H45z"/>',
    umbrella: '<path d="M18 49c5-21 59-21 64 0H18Z"/><path d="M50 49v24c0 10 12 10 12 2"/>',
    door: '<path d="M28 15h44v70H28z"/><circle cx="62" cy="51" r="2"/>',
    cups: '<path d="M18 42h29v28c0 9-6 14-14 14S19 79 19 70V42Z"/><path d="M47 49h8c9 0 9 16 0 16h-8M57 35h25v35c0 8-5 13-12 13-4 0-7-1-10-4"/>',
    stairs: '<path d="M17 79h18V64h16V49h16V34h17"/>',
    clock: '<circle cx="50" cy="50" r="34"/><path d="M50 29v23l16 11"/>',
    plant: '<path d="M34 60h32l-4 25H38zM50 60V30M50 45c-14 0-20-8-20-18 13 0 20 7 20 18ZM50 51c13 0 20-8 20-18-13 0-20 7-20 18Z"/>',
    key: '<circle cx="35" cy="45" r="13"/><path d="m46 54 30 27M63 69l8-8M70 76l8-8"/>',
    photo: '<rect x="17" y="20" width="66" height="60" rx="3"/><circle cx="38" cy="40" r="7"/><path d="m22 73 20-20 13 13 9-9 14 16"/>',
    chair: '<path d="M28 17h44v39H28zM22 56h56v12H22zM29 68v16M71 68v16"/>'
  };

  const baseFragments = [
    { id: 'A1', icon: 'window', image: 'assets/stock/window.jpg', label: 'kitchen window', anchor: true },
    { id: 'A2', icon: 'lamp', image: 'assets/stock/lamp.jpg', label: 'yellow lamp', anchor: true },
    { id: 'B1', icon: 'coat', image: 'assets/stock/coat.jpg', label: 'green coat', anchor: false },
    { id: 'B2', icon: 'chair', image: 'assets/stock/chair.jpg', label: 'empty chair', anchor: false },
    { id: 'C1', icon: 'door', image: 'assets/stock/door.jpg', label: 'blue door', anchor: true },
    { id: 'C2', icon: 'cups', image: 'assets/stock/cups.jpg', label: 'two cups', anchor: false },
    { id: 'D1', icon: 'stairs', image: 'assets/stock/stairs.jpg', label: 'narrow stairs', anchor: false },
    { id: 'D2', icon: 'clock', image: 'assets/stock/clock.jpg', label: 'stopped clock', anchor: true },
    { id: 'E1', icon: 'plant', image: 'assets/stock/plant.jpg', label: 'hallway plant', anchor: false }
  ];

  const rewrittenFragments = [
    { icon: 'photo', image: 'assets/stock/memory-room.jpg', label: 'family photograph' },
    { icon: 'chair', image: 'assets/stock/chair.jpg', label: 'occupied chair' },
    { icon: 'key', image: 'assets/stock/desk.jpg', label: 'front door key' },
    { icon: 'cups', image: 'assets/stock/cups.jpg', label: 'one warm cup' },
    { icon: 'plant', image: 'assets/stock/plant.jpg', label: 'fresh flowers' }
  ];

  const stageThree = [
    { id: 'S1', icon: 'window', image: 'assets/stock/window.jpg', label: 'open window' },
    { id: 'S2', icon: 'lamp', image: 'assets/stock/lamp.jpg', label: 'warm lamp' },
    { id: 'S3', icon: 'coat', image: 'assets/stock/coat.jpg', label: 'coat on the hook' },
    { id: 'S4', icon: 'chair', image: 'assets/stock/chair.jpg', label: 'empty chair' },
    { id: 'S5', icon: 'door', image: 'assets/stock/door.jpg', label: 'door left ajar' },
    { id: 'S6', icon: 'cups', image: 'assets/stock/cups.jpg', label: 'two waiting cups' },
    { id: 'S7', icon: 'stairs', image: 'assets/stock/stairs.jpg', label: 'stairs leading home' },
    { id: 'S8', icon: 'clock', image: 'assets/stock/clock.jpg', label: 'clock at 7:10' },
    { id: 'S9', icon: 'plant', image: 'assets/stock/plant.jpg', label: 'living hallway plant' }
  ];

  const stages = [
    {
      label: 'Stage 1 / Recognize', title: 'Find the anchors.',
      copy: 'Four details were confirmed before the recording failed. Select them from the grid.',
      ruleLabel: 'RULE', rule: 'Select four details. Incorrect fragments will be rejected.',
      console: 'MEMORY VERIFICATION / INTAKE', prompt: 'Select every image that really happened.',
      note: 'Four intake anchors are present.', target: 4
    },
    {
      label: 'Stage 2 / Drift', title: 'Watch the evidence.',
      copy: 'The archive now treats your choices as training data. Select four details you trust.',
      ruleLabel: 'SYSTEM BEHAVIOR', rule: 'Each confident choice may rewrite an unselected neighbor.',
      console: 'MEMORY VERIFICATION / LIVE UPDATE', prompt: 'Select every image you remember seeing.',
      note: 'The evidence can change while you choose.', target: 4
    },
    {
      label: 'Stage 3 / Decide', title: 'Choose the feeling.',
      copy: 'The system no longer asks what happened. It asks what the memory should mean.',
      ruleLabel: 'NO CORRECT ANSWER', rule: 'Choose the three details that make this memory feel safe.',
      console: 'MEMORY VERIFICATION / INTERPRETATION', prompt: 'Select what makes this memory feel safe.',
      note: 'Your definition will complete the event.', target: 3
    }
  ];

  let stageIndex = 0;
  let fragments = [];
  let selected = new Set();
  let rewriteCount = 0;
  let rewriteLog = [];
  let totalChoices = 0;
  let finalSelection = [];
  let stageSelections = [[], [], []];
  let finalOutcome = 'uncertified';
  let startedAt = 0;
  let timerId = null;
  let soundOn = false;
  let audioContext;
  let assemblyTimer;
  let flashTimer;
  let lives = 3;
  let score = 0;

  function showScreen(name) {
    screens.forEach((screen) => {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
    document.querySelector(`[data-screen="${name}"]`)?.focus?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function tone(frequency = 420, duration = .08, type = 'sine') {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.045, audioContext.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + .025);
  }

  function iconSvg(name) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.photo}</svg>`;
  }

  function renderGrid() {
    grid.innerHTML = fragments.map((fragment, index) => `
      <button class="fragment fragment--${fragment.icon}" style="--fragment-index:${index}" type="button" data-fragment="${index}" aria-pressed="${selected.has(index)}" aria-label="${selected.has(index) ? 'Deselect' : 'Select'} memory fragment: ${fragment.label}">
        <span class="fragment-id">${fragment.id}</span>
        <img src="${fragment.image}" alt="" width="1000" height="760" loading="eager">
        <span class="fragment-scan" aria-hidden="true"></span>
        <span class="fragment-label">${fragment.label}</span>
      </button>`).join('');
  }

  function updateGameStats() {
    ui.lives.textContent = `${'♥ '.repeat(lives).trim()}${' ♡'.repeat(Math.max(0, 3 - lives))}`;
    ui.score.textContent = String(score).padStart(3, '0');
  }

  function flashImpact(kind = 'error') {
    document.body.classList.remove('screen-hit', 'evidence-shift');
    void document.body.offsetWidth;
    document.body.classList.add(kind === 'rewrite' ? 'evidence-shift' : 'screen-hit');
    window.setTimeout(() => document.body.classList.remove('screen-hit', 'evidence-shift'), 720);
  }

  function startMemoryFlash() {
    let remaining = 6;
    window.clearInterval(flashTimer);
    ui.flashCountdown.textContent = String(remaining).padStart(2, '0');
    showScreen('recall');
    tone(560, .16, 'triangle');
    flashTimer = window.setInterval(() => {
      remaining -= 1;
      ui.flashCountdown.textContent = String(Math.max(0, remaining)).padStart(2, '0');
      tone(remaining <= 2 ? 310 : 460, .06, remaining <= 2 ? 'square' : 'sine');
      if (remaining <= 0) {
        window.clearInterval(flashTimer);
        loadStage(0);
      }
    }, 1000);
  }

  function updateProgress() {
    document.querySelectorAll('[data-progress]').forEach((item, index) => {
      item.classList.toggle('is-active', index === stageIndex);
      item.classList.toggle('is-complete', index < stageIndex);
    });
  }

  function updateReadout(message) {
    const target = stages[stageIndex].target;
    ui.selected.textContent = `${selected.size} / ${target}`;
    const confidence = stageIndex === 0
      ? 12 + selected.size * 17
      : stageIndex === 1
        ? 54 + selected.size * 8 + rewriteCount * 2
        : 76 + selected.size * 6;
    ui.confidence.textContent = `${Math.min(96, confidence)}%`;
    ui.instability.textContent = stageIndex === 0 ? 'Low' : stageIndex === 1 ? (rewriteCount < 2 ? 'Rising' : 'High') : 'Unknown';
    ui.live.textContent = message;
    continueButton.disabled = selected.size !== target;
  }

  function loadStage(index) {
    stageIndex = index;
    document.body.dataset.stage = String(index + 1);
    selected = new Set();
    lives = 3;
    const stage = stages[index];
    fragments = (index === 2 ? stageThree : baseFragments).map((item) => ({ ...item }));
    ui.stageLabel.textContent = stage.label;
    ui.stageTitle.textContent = stage.title;
    ui.stageCopy.textContent = stage.copy;
    ui.ruleLabel.textContent = stage.ruleLabel;
    ui.rule.textContent = stage.rule;
    ui.consoleTitle.textContent = stage.console;
    ui.prompt.textContent = stage.prompt;
    ui.promptNote.textContent = stage.note;
    continueButton.innerHTML = index === 2 ? 'Complete memory <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
    renderGrid();
    updateProgress();
    updateGameStats();
    updateReadout(index === 0 ? 'Choose a fragment to begin.' : index === 1 ? 'The archive is listening.' : 'There is no verified answer now.');
    showScreen('play');
  }

  function rejectFragment(button, fragment) {
    button.classList.remove('is-rejected');
    void button.offsetWidth;
    button.classList.add('is-rejected');
    tone(180, .16, 'square');
    lives -= 1;
    score = Math.max(0, score - 50);
    updateGameStats();
    flashImpact('error');
    if (lives <= 0) {
      lives = 3;
      selected = new Set();
      renderGrid();
      updateGameStats();
      updateReadout('Signal integrity collapsed. Stage reset—use the memory flash and try again.');
    } else {
      updateReadout(`${fragment.label} was a false signal. ${lives} integrity ${lives === 1 ? 'point' : 'points'} remaining.`);
    }
    window.setTimeout(() => button.classList.remove('is-rejected'), 500);
  }

  function rewriteNeighbor(sourceIndex) {
    const available = fragments.map((_, index) => index).filter((index) => !selected.has(index) && index !== sourceIndex);
    if (!available.length) return;
    const targetIndex = available[(sourceIndex + rewriteCount * 2) % available.length];
    const replacement = rewrittenFragments[rewriteCount % rewrittenFragments.length];
    const original = { ...fragments[targetIndex] };
    fragments[targetIndex] = { ...fragments[targetIndex], ...replacement, id: `${fragments[targetIndex].id}′` };
    rewriteLog.push({
      id: original.id,
      originalLabel: original.label,
      originalIcon: original.icon,
      rewrittenLabel: replacement.label,
      rewrittenIcon: replacement.icon
    });
    rewriteCount += 1;
    score += 75;
    updateGameStats();
    renderGrid();
    const target = grid.querySelector(`[data-fragment="${targetIndex}"]`);
    target?.classList.add('is-rewritten');
    tone(238, .22, 'sawtooth');
    flashImpact('rewrite');
    ui.promptNote.textContent = `${replacement.label} was added to the evidence.`;
    window.setTimeout(() => target?.classList.remove('is-rewritten'), 1500);
  }

  function handleFragment(event) {
    const button = event.target.closest('[data-fragment]');
    if (!button) return;
    const index = Number(button.dataset.fragment);
    const fragment = fragments[index];
    const wasSelected = selected.has(index);

    if (stageIndex === 0 && !wasSelected && !fragment.anchor) {
      totalChoices += 1;
      rejectFragment(button, fragment);
      return;
    }

    if (wasSelected) {
      selected.delete(index);
      score = Math.max(0, score - 25);
      tone(300, .07);
    } else if (selected.size < stages[stageIndex].target) {
      selected.add(index);
      totalChoices += 1;
      score += stageIndex === 0 ? 100 : stageIndex === 1 ? 125 : 150;
      tone(440 + selected.size * 30, .09);
      if (stageIndex === 1) window.setTimeout(() => rewriteNeighbor(index), 190);
    } else {
      updateReadout(`Remove one choice before selecting ${fragment.label}.`);
      return;
    }

    renderGrid();
    updateGameStats();
    const action = wasSelected ? 'removed' : 'selected';
    updateReadout(`${fragment.label} ${action}. ${Math.max(0, stages[stageIndex].target - selected.size)} remaining.`);
  }

  function transitionTo(nextIndex) {
    const transitions = [
      { number: '02', title: 'The archive accepted your version.', copy: 'Your choices are now evidence. Watch what happens to the fragments around them.', button: 'Enter Stage 2' },
      { number: '03', title: 'The evidence no longer stands still.', copy: 'The archive has learned your pattern. Now it wants you to give the memory a meaning.', button: 'Enter Stage 3' }
    ];
    const content = transitions[nextIndex - 1];
    ui.transitionNumber.textContent = content.number;
    ui.transitionLabel.textContent = `Stage ${nextIndex} complete`;
    ui.transitionTitle.textContent = content.title;
    ui.transitionCopy.textContent = content.copy;
    nextStageButton.innerHTML = `${content.button} <span aria-hidden="true">→</span>`;
    nextStageButton.dataset.targetStage = String(nextIndex);
    tone(520, .28);
    showScreen('transition');
  }

  function completeStage() {
    if (selected.size !== stages[stageIndex].target) return;
    score += 250;
    updateGameStats();
    stageSelections[stageIndex] = [...selected].map((index) => ({ ...fragments[index] }));
    if (stageIndex < 2) {
      transitionTo(stageIndex + 1);
      return;
    }
    finalSelection = [...selected].map((index) => fragments[index]);
    const labels = finalSelection.map((item) => item.label);
    const sentence = labels.length === 3
      ? `“You returned to ${labels[0]}, ${labels[1]}, and ${labels[2]}. The archive called it safe.”`
      : `“The archive completed your memory.”`;
    ui.reconstruction.textContent = sentence;
    ui.totalChoices.textContent = String(totalChoices);
    ui.rewrites.textContent = String(rewriteCount);
    ui.finalConfidence.textContent = `${Math.min(96, 82 + finalSelection.length * 4)}%`;
    ui.endingSummary.textContent = `You recognized four details, watched ${rewriteCount} fragments change, and then taught the archive that safety looks like ${labels.join(', ')}.`;
    ui.finalQuestion.hidden = false;
    ui.finalResult.hidden = true;
    ui.stamp.textContent = 'UNCERTIFIED';
    finalOutcome = 'uncertified';
    buildCertificate();
    showScreen('ending');
    startCertificateAssembly();
    tone(660, .35, 'triangle');
  }

  function buildCertificate() {
    const choiceKey = finalSelection.map((item) => item.id.replace(/[^A-Z0-9]/gi, '')).join('').slice(0, 8) || 'OPEN';
    const memoryId = `M27-${choiceKey}-${String(rewriteCount).padStart(2, '0')}`;
    ui.memoryId.textContent = memoryId;
    ui.generatedDate.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

    ui.memoryCollage.innerHTML = finalSelection.map((fragment, index) => `
      <article class="collage-fragment collage-fragment--${index + 1}" style="--reveal-index:${index + 1}" data-reveal>
        <span>${fragment.id}</span>
        <img src="${fragment.image}" alt="" width="1000" height="760">
        <strong>${fragment.label}</strong>
      </article>`).join('');

    const visibleRewrites = rewriteLog.slice(0, 4);
    ui.rewriteLedger.innerHTML = visibleRewrites.length
      ? visibleRewrites.map((entry, index) => `
        <div class="rewrite-entry" style="--reveal-index:${index + 4}" data-reveal>
          <span class="rewrite-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="trace-original">${entry.originalLabel}</span>
          <span class="rewrite-arrow" aria-hidden="true">→</span>
          <strong>${entry.rewrittenLabel}</strong>
        </div>`).join('')
      : '<p class="no-rewrites">No system rewrites were recorded.</p>';

    const timelineCopy = [
      { label: 'Recognize', text: stageSelections[0].map((item) => item.label).join(', ') },
      { label: 'Trust', text: stageSelections[1].map((item) => item.label).join(', ') },
      { label: 'Define safety', text: stageSelections[2].map((item) => item.label).join(', ') }
    ];
    ui.choiceTimeline.innerHTML = timelineCopy.map((step, index) => `
      <li style="--reveal-index:${index + 2}" data-reveal>
        <span>${String(index + 1).padStart(2, '0')}</span>
        <div><strong>${step.label}</strong><p>${step.text || 'No recorded choice'}</p></div>
      </li>`).join('');
  }

  function startCertificateAssembly() {
    const certificate = document.querySelector('#memory-certificate');
    window.clearTimeout(assemblyTimer);
    certificate.classList.remove('assembly-complete');
    certificate.classList.add('is-assembling');
    document.querySelector('[data-skip-assembly]').hidden = false;
    assemblyTimer = window.setTimeout(finishCertificateAssembly, 4200);
  }

  function finishCertificateAssembly() {
    const certificate = document.querySelector('#memory-certificate');
    certificate.classList.remove('is-assembling');
    certificate.classList.add('assembly-complete');
    document.querySelector('[data-skip-assembly]').hidden = true;
  }

  function decide(outcome) {
    const certified = outcome === 'certify';
    ui.finalQuestion.hidden = true;
    ui.finalResult.hidden = false;
    ui.resultKicker.textContent = certified ? 'MEMORY CERTIFIED' : 'UNCERTAINTY PRESERVED';
    ui.resultCopy.textContent = certified
      ? 'You chose coherence over certainty. The archive will remember your version as fact.'
      : 'You refused to turn confidence into truth. The archive keeps the event open—and incomplete.';
    ui.stamp.textContent = certified ? 'CERTIFIED' : 'UNRESOLVED';
    finalOutcome = certified ? 'certified' : 'unresolved';
    tone(certified ? 720 : 330, .4, certified ? 'sine' : 'triangle');
    ui.finalResult.querySelector('button')?.focus();
  }

  function resetGame() {
    stageIndex = 0;
    selected = new Set();
    rewriteCount = 0;
    rewriteLog = [];
    totalChoices = 0;
    finalSelection = [];
    stageSelections = [[], [], []];
    finalOutcome = 'uncertified';
    lives = 3;
    score = 0;
    startedAt = 0;
    window.clearInterval(timerId);
    window.clearInterval(flashTimer);
    ui.time.textContent = '00:00';
    delete document.body.dataset.stage;
    showScreen('intro');
    startButton.focus();
  }

  function startTimer() {
    startedAt = Date.now();
    window.clearInterval(timerId);
    timerId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      ui.time.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  startButton.addEventListener('click', () => {
    startTimer();
    startMemoryFlash();
    tone(460, .12);
  });
  skipFlashButton.addEventListener('click', () => {
    window.clearInterval(flashTimer);
    loadStage(0);
  });
  grid.addEventListener('click', handleFragment);
  continueButton.addEventListener('click', completeStage);
  nextStageButton.addEventListener('click', () => loadStage(Number(nextStageButton.dataset.targetStage)));
  restartButtons.forEach((button) => button.addEventListener('click', resetGame));
  decisionButtons.forEach((button) => button.addEventListener('click', () => decide(button.dataset.decision)));
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
    soundButton.innerHTML = `<span aria-hidden="true">${soundOn ? '●' : '◌'}</span> Sound ${soundOn ? 'on' : 'off'}`;
    if (soundOn) tone(440, .12);
  });

  document.querySelector('[data-skip-assembly]').addEventListener('click', finishCertificateAssembly);

  document.querySelectorAll('[data-trace-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const showTraces = button.dataset.traceView === 'traces';
      document.querySelector('#memory-certificate').classList.toggle('show-traces', showTraces);
      document.querySelectorAll('[data-trace-view]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    });
  });

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = text.replace(/[“”]/g, '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const test = `${line} ${word}`.trim();
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  }

  function downloadCertificate() {
    const downloadStatus = document.querySelector('[data-download-status]');
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8f4ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#183c30';
    ctx.fillRect(0, 0, canvas.width, 118);
    ctx.fillStyle = '#fff';
    ctx.font = '700 28px Helvetica Neue, Arial';
    ctx.fillText('MEMORY CERTIFICATE', 76, 72);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#efb2c1';
    ctx.fillText(ui.memoryId.textContent, 1524, 72);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#356451';
    ctx.font = '700 18px Helvetica Neue, Arial';
    ctx.fillText('SYSTEM RECONSTRUCTION', 76, 178);
    ctx.fillStyle = '#111';
    ctx.font = '44px Georgia, serif';
    wrapCanvasText(ctx, ui.reconstruction.textContent, 76, 240, 1448, 58, 3);

    const cardColors = ['#f2dfe4', '#e1ebe5', '#f1e2d8'];
    finalSelection.forEach((fragment, index) => {
      const x = 76 + index * 495;
      const y = 420 + (index % 2) * 18;
      ctx.fillStyle = cardColors[index % cardColors.length];
      ctx.fillRect(x, y, 440, 250);
      ctx.fillStyle = '#6b2723';
      ctx.font = '700 18px Helvetica Neue, Arial';
      ctx.fillText(fragment.id, x + 28, y + 38);
      ctx.fillStyle = '#183c30';
      ctx.font = '700 72px Georgia, serif';
      ctx.fillText(fragment.label.charAt(0).toUpperCase(), x + 28, y + 135);
      ctx.fillStyle = '#34322f';
      ctx.font = '700 23px Helvetica Neue, Arial';
      wrapCanvasText(ctx, fragment.label, x + 28, y + 198, 380, 30, 2);
    });

    ctx.fillStyle = '#356451';
    ctx.font = '700 18px Helvetica Neue, Arial';
    ctx.fillText('ASSEMBLY TRACE', 76, 760);
    rewriteLog.slice(0, 4).forEach((entry, index) => {
      const y = 810 + index * 48;
      ctx.fillStyle = '#8b857c';
      ctx.font = '21px Helvetica Neue, Arial';
      ctx.fillText(`${String(index + 1).padStart(2, '0')}  ${entry.originalLabel}`, 76, y);
      ctx.fillStyle = '#b45a3c';
      ctx.fillText('→', 470, y);
      ctx.fillStyle = '#111';
      ctx.font = '700 21px Helvetica Neue, Arial';
      ctx.fillText(entry.rewrittenLabel, 520, y);
    });

    ctx.fillStyle = '#6b2723';
    ctx.strokeStyle = '#6b2723';
    ctx.lineWidth = 4;
    ctx.strokeRect(1210, 820, 314, 105);
    ctx.font = '900 25px Helvetica Neue, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(finalOutcome.toUpperCase(), 1367, 885);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6c6862';
    ctx.font = '18px Helvetica Neue, Arial';
    ctx.fillText(`Generated ${ui.generatedDate.textContent} · ${totalChoices} choices · ${rewriteCount} rewrites`, 76, 1050);

    canvas.toBlob((blob) => {
      if (!blob) {
        downloadStatus.textContent = 'The image could not be created. Please try again.';
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${ui.memoryId.textContent.toLowerCase()}-memory-certificate.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      downloadStatus.textContent = 'Your personalized certificate was downloaded.';
    }, 'image/png');
  }

  document.querySelector('[data-download-certificate]').addEventListener('click', downloadCertificate);
})();
