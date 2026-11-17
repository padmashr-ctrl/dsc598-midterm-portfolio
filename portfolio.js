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
