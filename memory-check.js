(() => {
  const grid = document.querySelector('[data-memory-grid]');
  const tiles = [...document.querySelectorAll('.memory-tile')];
  const selectedCount = document.querySelector('[data-selected-count]');
  const confidence = document.querySelector('[data-confidence]');
  const live = document.querySelector('[data-terminal-live]');
  const promptNote = document.querySelector('[data-prompt-note]');
  const resetButtons = document.querySelectorAll('[data-reset-grid]');
  const soundButton = document.querySelector('[data-sound]');
  const backTop = document.querySelector('[data-back-top]');

  const originalTiles = tiles.map((tile) => ({
    className: tile.className,
    label: tile.querySelector('small').textContent,
    ariaLabel: tile.getAttribute('aria-label')
  }));

  let soundOn = false;
  let audioContext;
  let rewriteStep = 0;

  function playTone(frequency = 360, duration = .08, detune = 0) {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
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

  function selectedTiles() {
    return tiles.filter((tile) => tile.getAttribute('aria-pressed') === 'true');
  }

  function updateStatus(message) {
    const count = selectedTiles().length;
    selectedCount.textContent = count;
    confidence.textContent = `${Math.min(96, 12 + count * 21 + rewriteStep * 4)}%`;
    live.textContent = message || `${count} ${count === 1 ? 'image' : 'images'} selected.`;
  }

  function rewriteTile(sourceIndex) {
    const targetIndex = (sourceIndex + 1 + rewriteStep * 2) % tiles.length;
    const target = tiles[targetIndex];
    if (target.getAttribute('aria-pressed') === 'true') return;

    const alternate = rewriteStep % 2 === 0
      ? { shape: 'shape-door', label: 'door, remembered', aria: 'Select rewritten snapshot: remembered door' }
      : { shape: 'shape-window', label: 'window, corrected', aria: 'Select rewritten snapshot: corrected window' };
    const shapeClasses = [...target.classList].filter((name) => name.startsWith('shape-'));
    target.classList.remove(...shapeClasses);
    target.classList.add(alternate.shape, 'is-rewritten');
    target.querySelector('small').textContent = alternate.label;
    target.setAttribute('aria-label', alternate.aria);
    window.setTimeout(() => target.classList.remove('is-rewritten'), 1400);
    rewriteStep += 1;
    promptNote.textContent = 'A neighboring memory was updated.';
    playTone(245, .18, -180);
    updateStatus(`The system changed ${alternate.label}. Your choice is now supporting new evidence.`);
  }

  tiles.forEach((tile, index) => {
    tile.addEventListener('click', () => {
      const wasSelected = tile.getAttribute('aria-pressed') === 'true';
      tile.setAttribute('aria-pressed', String(!wasSelected));
      playTone(wasSelected ? 280 : 440 + selectedTiles().length * 25);
      const count = selectedTiles().length;
      updateStatus(`${tile.querySelector('small').textContent} ${wasSelected ? 'removed' : 'marked as remembered'}.`);

      if (!wasSelected && (count === 2 || count === 4)) {
        window.setTimeout(() => rewriteTile(index), 220);
      }
    });
  });

  function resetGrid() {
    tiles.forEach((tile, index) => {
      tile.className = originalTiles[index].className;
      tile.querySelector('small').textContent = originalTiles[index].label;
      tile.setAttribute('aria-label', originalTiles[index].ariaLabel);
      tile.setAttribute('aria-pressed', 'false');
    });
    rewriteStep = 0;
    promptNote.textContent = 'Your choices may affect the evidence.';
    updateStatus('The concept visual was reset. No images selected.');
    playTone(320, .12);
    grid?.focus?.();
  }

  resetButtons.forEach((button) => button.addEventListener('click', resetGrid));

  soundButton?.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.innerHTML = `<span aria-hidden="true">${soundOn ? '●' : '◌'}</span> Sound ${soundOn ? 'on' : 'off'}`;
    if (soundOn) playTone(440, .12);
  });

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
