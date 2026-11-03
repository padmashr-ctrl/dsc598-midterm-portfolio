(() => {
  const screens = [...document.querySelectorAll('[data-screen]')];
  const grid = document.querySelector('[data-game-grid]');
  const startButton = document.querySelector('[data-start]');
  const continueButton = document.querySelector('[data-continue]');
  const nextStageButton = document.querySelector('[data-next-stage]');
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
    totalChoices: document.querySelector('[data-total-choices]'),
    rewrites: document.querySelector('[data-rewrites]'),
    finalConfidence: document.querySelector('[data-final-confidence]'),
    endingSummary: document.querySelector('[data-ending-summary]'),
    stamp: document.querySelector('[data-stamp]'),
    finalQuestion: document.querySelector('[data-final-question]'),
    finalResult: document.querySelector('[data-final-result]'),
    resultKicker: document.querySelector('[data-result-kicker]'),
    resultCopy: document.querySelector('[data-result-copy]')
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
    { id: 'A1', icon: 'window', label: 'kitchen window', anchor: true },
    { id: 'A2', icon: 'lamp', label: 'yellow lamp', anchor: true },
    { id: 'B1', icon: 'coat', label: 'green coat', anchor: false },
    { id: 'B2', icon: 'umbrella', label: 'red umbrella', anchor: false },
    { id: 'C1', icon: 'door', label: 'blue door', anchor: true },
    { id: 'C2', icon: 'cups', label: 'two cups', anchor: false },
    { id: 'D1', icon: 'stairs', label: 'narrow stairs', anchor: false },
    { id: 'D2', icon: 'clock', label: 'stopped clock', anchor: true },
    { id: 'E1', icon: 'plant', label: 'hallway plant', anchor: false }
  ];

  const rewrittenFragments = [
    { icon: 'photo', label: 'family photograph' },
    { icon: 'chair', label: 'occupied chair' },
    { icon: 'key', label: 'front door key' },
    { icon: 'cups', label: 'one warm cup' },
    { icon: 'plant', label: 'fresh flowers' }
  ];

  const stageThree = [
    { id: 'S1', icon: 'window', label: 'open window' },
    { id: 'S2', icon: 'lamp', label: 'warm lamp' },
    { id: 'S3', icon: 'coat', label: 'coat on the hook' },
    { id: 'S4', icon: 'umbrella', label: 'umbrella by the door' },
    { id: 'S5', icon: 'door', label: 'door left ajar' },
    { id: 'S6', icon: 'cups', label: 'two waiting cups' },
    { id: 'S7', icon: 'stairs', label: 'stairs leading home' },
    { id: 'S8', icon: 'clock', label: 'clock at 7:10' },
    { id: 'S9', icon: 'plant', label: 'living hallway plant' }
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
  let totalChoices = 0;
  let finalSelection = [];
  let startedAt = 0;
  let timerId = null;
  let soundOn = false;
  let audioContext;

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
      <button class="fragment" type="button" data-fragment="${index}" aria-pressed="${selected.has(index)}" aria-label="${selected.has(index) ? 'Deselect' : 'Select'} memory fragment: ${fragment.label}">
        <span class="fragment-id">${fragment.id}</span>
        ${iconSvg(fragment.icon)}
        <span class="fragment-label">${fragment.label}</span>
      </button>`).join('');
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
    selected = new Set();
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
    updateReadout(index === 0 ? 'Choose a fragment to begin.' : index === 1 ? 'The archive is listening.' : 'There is no verified answer now.');
    showScreen('play');
  }

  function rejectFragment(button, fragment) {
    button.classList.remove('is-rejected');
    void button.offsetWidth;
    button.classList.add('is-rejected');
    tone(180, .16, 'square');
    updateReadout(`${fragment.label} was not found in the intake record. Try another fragment.`);
    window.setTimeout(() => button.classList.remove('is-rejected'), 500);
  }

  function rewriteNeighbor(sourceIndex) {
    const available = fragments.map((_, index) => index).filter((index) => !selected.has(index) && index !== sourceIndex);
    if (!available.length) return;
    const targetIndex = available[(sourceIndex + rewriteCount * 2) % available.length];
    const replacement = rewrittenFragments[rewriteCount % rewrittenFragments.length];
    fragments[targetIndex] = { ...fragments[targetIndex], ...replacement, id: `${fragments[targetIndex].id}′` };
    rewriteCount += 1;
    renderGrid();
    const target = grid.querySelector(`[data-fragment="${targetIndex}"]`);
    target?.classList.add('is-rewritten');
    tone(238, .22, 'sawtooth');
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
      tone(300, .07);
    } else if (selected.size < stages[stageIndex].target) {
      selected.add(index);
      totalChoices += 1;
      tone(440 + selected.size * 30, .09);
      if (stageIndex === 1) window.setTimeout(() => rewriteNeighbor(index), 190);
    } else {
      updateReadout(`Remove one choice before selecting ${fragment.label}.`);
      return;
    }

    renderGrid();
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
    showScreen('ending');
    tone(660, .35, 'triangle');
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
    tone(certified ? 720 : 330, .4, certified ? 'sine' : 'triangle');
    ui.finalResult.querySelector('button')?.focus();
  }

  function resetGame() {
    stageIndex = 0;
    selected = new Set();
    rewriteCount = 0;
    totalChoices = 0;
    finalSelection = [];
    startedAt = 0;
    window.clearInterval(timerId);
    ui.time.textContent = '00:00';
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
    loadStage(0);
    tone(460, .12);
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
})();
