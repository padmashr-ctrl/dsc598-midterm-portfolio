(() => {
  document.documentElement.classList.remove('no-js');

  /* Header turns solid once the hero is scrolled past */
  const header = document.querySelector('.site-header');
  const setHeader = () => header?.classList.toggle('is-solid', window.scrollY > 40);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  /* Reveal on scroll */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('is-in'));
  // Never leave work hidden: reveal everything shortly after load regardless.
  window.setTimeout(() => reveals.forEach((el) => el.classList.add('is-in')), 2000);

  /* Before / after sliders (keyboard accessible through the range input) */
  document.querySelectorAll('[data-compare]').forEach((box) => {
    const input = box.querySelector('input');
    const set = () => box.style.setProperty('--pos', `${input.value}%`);
    input.addEventListener('input', set);
    set();
  });

  /* Whole index rows are clickable, the link inside stays the accessible target */
  document.querySelectorAll('tr[data-href]').forEach((row) => {
    row.classList.add('is-linked');
    row.addEventListener('click', (event) => { if (!event.target.closest('a')) window.location.href = row.dataset.href; });
  });

  /* The home hero responds to the visitor before they draw. */
  const homeHero = document.querySelector('.home-hero');
  homeHero?.addEventListener('pointermove', (event) => {
    const box = homeHero.getBoundingClientRect();
    homeHero.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width) * 100}%`);
    homeHero.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height) * 100}%`);
    homeHero.classList.add('has-pointer');
  });
  homeHero?.addEventListener('pointerleave', () => homeHero.classList.remove('has-pointer'));

  /* Material field — a tactile map of the methods behind the work. */
  const materialField = document.querySelector('#material-field');
  const materialStatus = document.querySelector('#material-status');
  const clearMaterials = document.querySelector('#clear-materials');
  const materialSet = [
    { title: 'Memory systems', tool: 'Browser interaction', group: 'Memory', color: '#edd4ce' },
    { title: 'Art direction', tool: 'Image + typography', group: 'Image', color: '#f0d8bd' },
    { title: 'Spatial design', tool: 'Blender', group: 'Space', color: '#d5dfd3' },
    { title: 'Prototyping', tool: 'HTML · CSS · JS', group: 'Code', color: '#d9ddeb' },
    { title: 'Hand tracking', tool: 'MediaPipe', group: 'Code', color: '#d2e3df' },
    { title: 'Generative systems', tool: 'Canvas', group: 'Code', color: '#ded4e7' },
    { title: 'AI direction', tool: 'Prompt · test · revise', group: 'Image', color: '#efd8c8' },
    { title: 'Critical audit', tool: 'Trace every decision', group: 'Memory', color: '#e6cbc6' }
  ];
  const materialPositions = [
    [24, 24], [57, 20], [78, 38], [38, 47], [18, 68], [65, 70], [84, 78], [43, 82]
  ];
  const materialRotations = [-5, 3, -2, 5, 2, -4, 4, -1];
  const materialOffsets = [[0, 0], [-11, -8], [12, 9], [-8, 13], [10, -12], [-14, 6], [15, -4], [2, 14]];
  let materialIndex = 0;

  function updateMaterialStatus(message) {
    if (materialStatus) materialStatus.textContent = message || `${materialIndex} of ${materialSet.length} materials placed`;
    if (clearMaterials) clearMaterials.disabled = materialIndex === 0;
    materialField?.classList.toggle('has-cards', materialIndex > 0);
  }

  function addMaterial(clientX, clientY, fromKeyboard = false) {
    if (!materialField) return;
    if (materialIndex >= materialSet.length) {
      updateMaterialStatus('Toolkit complete — clear the field to begin again');
      materialField.animate([{ transform: 'scale(1)' }, { transform: 'scale(.992)' }, { transform: 'scale(1)' }], { duration: 360 });
      return;
    }
    const item = materialSet[materialIndex];
    const fallback = materialPositions[materialIndex];
    const bounds = materialField.getBoundingClientRect();
    const xPadding = Math.min(30, Math.max(16, (108 / bounds.width) * 100));
    const yPadding = Math.min(20, Math.max(12, (64 / bounds.height) * 100));
    const offset = materialOffsets[materialIndex];
    const rawX = fromKeyboard ? fallback[0] : ((clientX - bounds.left) / bounds.width) * 100 + offset[0];
    const rawY = fromKeyboard ? fallback[1] : ((clientY - bounds.top) / bounds.height) * 100 + offset[1];
    const x = Math.max(xPadding, Math.min(100 - xPadding, rawX));
    const y = Math.max(yPadding, Math.min(100 - yPadding, rawY));
    const card = document.createElement('span');
    card.className = 'material-card';
    card.style.setProperty('--x', `${x}%`);
    card.style.setProperty('--y', `${y}%`);
    card.style.setProperty('--rot', `${materialRotations[materialIndex]}deg`);
    card.style.setProperty('--card-bg', item.color);
    card.style.zIndex = String(materialIndex + 2);
    card.innerHTML = `<b>${item.title}</b><em>${String(materialIndex + 1).padStart(2, '0')}</em><small>${item.group} · ${item.tool}</small>`;
    materialField.append(card);
    materialIndex += 1;
    updateMaterialStatus();
  }

  materialField?.addEventListener('click', (event) => addMaterial(event.clientX, event.clientY));
  materialField?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    addMaterial(0, 0, true);
  });
  clearMaterials?.addEventListener('click', () => {
    materialField?.querySelectorAll('.material-card').forEach((card) => card.remove());
    materialIndex = 0;
    updateMaterialStatus('Field cleared — click to rebuild the toolkit');
  });
  updateMaterialStatus();

  /* Project cards lean toward the pointer; a custom prompt follows on precise pointers. */
  const projectCursor = document.querySelector('#project-cursor');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (projectCursor && canHover) {
    const hideProjectCursor = () => projectCursor.classList.remove('is-visible');
    document.querySelectorAll('.work-tile').forEach((tile) => {
      tile.addEventListener('pointerenter', (event) => {
        projectCursor.style.left = `${event.clientX}px`;
        projectCursor.style.top = `${event.clientY}px`;
        projectCursor.classList.add('is-visible');
      });
      tile.addEventListener('pointermove', (event) => {
        projectCursor.style.left = `${event.clientX}px`;
        projectCursor.style.top = `${event.clientY}px`;
        if (tile.classList.contains('is-small')) return;
        const box = tile.getBoundingClientRect();
        const px = (event.clientX - box.left) / box.width - .5;
        const py = (event.clientY - box.top) / box.height - .5;
        tile.style.setProperty('--tilt-x', `${py * -3.2}deg`);
        tile.style.setProperty('--tilt-y', `${px * 3.2}deg`);
      });
      tile.addEventListener('pointerleave', () => {
        hideProjectCursor();
        tile.style.setProperty('--tilt-x', '0deg');
        tile.style.setProperty('--tilt-y', '0deg');
      });
    });
    window.addEventListener('scroll', hideProjectCursor, { passive: true });
    window.addEventListener('blur', hideProjectCursor);
  }

  /* Thread drawing — the album cover's loose thread, handed to the visitor */
  const canvas = document.querySelector('#thread-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('#canvas-status');
  const palette = ['#d0493e', '#e8dfcf', '#b8743f', '#8f2e27'];
  const paths = [];
  let active = null;
  let pointerId = null;
  let colorIndex = 0;
  let w = 0;
  let h = 0;
  const rect = () => canvas.getBoundingClientRect();

  function stitch(x, y, size = 3) {
    ctx.beginPath();
    ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size);
    ctx.stroke();
  }

  function heart() {
    // the small cross-stitched heart from the album cover, with its thread already loose
    const cx = w * (w < 700 ? .72 : .76);
    const cy = h * (w < 700 ? .2 : .3);
    const s = w < 700 ? 6 : 8;
    ctx.strokeStyle = '#d0493e';
    ctx.lineWidth = 1.3;
    ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'].forEach((row, y) => {
      [...row].forEach((cell, x) => { if (cell === '1') stitch(cx + (x - 3) * s, cy + y * s, s * .32); });
    });
    ctx.beginPath();
    ctx.moveTo(cx, cy + 5 * s);
    ctx.bezierCurveTo(cx + 10, cy + 9 * s, cx - 40, cy + 12 * s, cx + 30, cy + 17 * s);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    heart();
    ctx.lineWidth = 1.4;
    for (const path of paths) {
      ctx.strokeStyle = path.color;
      const pts = path.points.map((p) => ({ x: p.x * w, y: p.y * h }));
      if (pts.length > 1) {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i += 1) {
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
        }
        ctx.lineTo(pts.at(-1).x, pts.at(-1).y); ctx.stroke();
      }
      stitch(pts[0].x, pts[0].y, 3.4);
      if (pts.length > 1) stitch(pts.at(-1).x, pts.at(-1).y, 2.4);
    }
  }

  const point = (event) => {
    const r = rect();
    return { x: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)) };
  };
  function begin(p) {
    active = { color: palette[colorIndex++ % palette.length], points: [p] };
    paths.push(active);
    if (paths.length > 120) paths.shift();
    draw();
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId); begin(point(event));
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId || !active) return;
    const p = point(event); const prev = active.points.at(-1);
    if (Math.hypot((p.x - prev.x) * w, (p.y - prev.y) * h) < 3) return;
    if (active.points.length < 3000) active.points.push(p);
    draw();
  });
  function finish(event) {
    if (event.pointerId !== pointerId) return;
    active = null; pointerId = null;
    if (status) status.textContent = `Thread added. ${paths.length} ${paths.length === 1 ? 'thread' : 'threads'} on the linen.`;
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => canvas.addEventListener(type, finish));
  canvas.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const n = paths.length;
    begin({ x: .12 + (n % 9) * .09, y: .22 + Math.floor((n % 27) / 9) * .08 });
    active = null;
    if (status) status.textContent = `Stitch added. ${paths.length} on the linen.`;
  });
  document.querySelector('#clear-canvas')?.addEventListener('click', () => {
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    active = null; pointerId = null; paths.length = 0; colorIndex = 0; draw();
    if (status) status.textContent = 'Cleared. Only the small heart remains.';
  });
  function resize() {
    const r = rect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();
})();
