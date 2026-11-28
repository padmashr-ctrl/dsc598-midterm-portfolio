(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const welcome = document.querySelector('[data-welcome]');
  if (welcome) {
    const closeWelcome = () => {
      if (welcome.classList.contains('is-leaving')) return;
      welcome.classList.add('is-leaving');
      welcome.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => welcome.remove(), reducedMotion ? 40 : 760);
    };
    welcome.querySelector('[data-welcome-skip]')?.addEventListener('click', closeWelcome);
    welcome.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') closeWelcome();
    });
    window.setTimeout(closeWelcome, reducedMotion ? 100 : 2200);
  }

  const board = document.querySelector('[data-splitflap]');
  if (!board) return;
  const cells = [...board.querySelectorAll('span')];
  const target = board.dataset.message.replace(' ', '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let timers = [];
  let hasPlayed = false;

  const clearTimers = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  };

  const settleCell = (cell, letter, index) => {
    const flips = reducedMotion ? 1 : 7 + index;
    for (let step = 0; step < flips; step += 1) {
      timers.push(window.setTimeout(() => {
        cell.textContent = step === flips - 1 ? letter : alphabet[(index * 7 + step * 11) % alphabet.length];
        cell.classList.remove('is-flipping');
        void cell.offsetWidth;
        cell.classList.add('is-flipping');
      }, step * 64 + index * 90));
    }
  };

  const play = () => {
    clearTimers();
    cells.forEach((cell, index) => settleCell(cell, target[index], index));
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPlayed) {
          hasPlayed = true;
          play();
        } else if (!entry.isIntersecting) {
          hasPlayed = false;
        }
      });
    }, { threshold: .55 });
    observer.observe(board);
  } else play();
})();
