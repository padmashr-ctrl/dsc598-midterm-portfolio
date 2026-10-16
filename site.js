(() => {
  document.querySelector('[data-back-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const canvas = document.querySelector('#stitch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('#canvas-status');
  const palette = ['#6b2723', '#356451', '#b45a3c', '#c8788e'];
  const paths = [];
  let active = null;
  let pointerId = null;
  let colorIndex = 0;
  const rect = () => canvas.getBoundingClientRect();
  function stitch(x, y, size = 3) {
    ctx.beginPath();
    ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size);
    ctx.stroke();
  }
  function draw() {
    const { width, height } = rect();
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.25;
    ctx.strokeStyle = palette[0];
    // A quiet cross-stitched heart, kept small in the open drawing area.
    ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'].forEach((row, y) => {
      [...row].forEach((cell, x) => { if (cell === '1') stitch(width * .5 + (x - 3) * 6, height * .48 + y * 6, 1.7); });
    });
    for (const path of paths) {
      ctx.strokeStyle = path.color;
      const points = path.points.map(p => ({ x: p.x * width, y: p.y * height }));
      if (points.length > 1) {
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i + 1].x) / 2, (points[i].y + points[i + 1].y) / 2);
        }
        ctx.lineTo(points.at(-1).x, points.at(-1).y); ctx.stroke();
      }
      stitch(points[0].x, points[0].y);
      if (points.length > 1) stitch(points.at(-1).x, points.at(-1).y, 2);
    }
  }
  function point(event) {
    const r = rect();
    return { x: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)) };
  }
  function begin(p) {
    active = { color: palette[colorIndex++ % palette.length], points: [p] };
    paths.push(active);
    if (paths.length > 100) paths.shift();
    draw();
  }
  canvas.addEventListener('pointerdown', event => {
    if (pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId); begin(point(event));
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId || !active) return;
    const p = point(event), prev = active.points.at(-1), r = rect();
    if (Math.hypot((p.x - prev.x) * r.width, (p.y - prev.y) * r.height) < 3) return;
    if (active.points.length < 3000) active.points.push(p);
    draw();
  });
  function finish(event) {
    if (event.pointerId !== pointerId) return;
    active = null; pointerId = null;
    status.textContent = `Thread added. ${paths.length} ${paths.length === 1 ? 'path' : 'paths'} on the drawing.`;
  }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (pointerId !== null) return;
    const n = paths.length;
    begin({ x: .25 + (n % 7) * .07, y: .7 + Math.floor(n % 21 / 7) * .06 });
    active = null;
    status.textContent = `Stitch added. ${paths.length} paths on the drawing.`;
  });
  document.querySelector('#clear-canvas')?.addEventListener('click', () => {
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    active = null; pointerId = null; paths.length = 0; colorIndex = 0; draw();
    status.textContent = 'Drawing reset to the small stitched heart.';
  });
  function resize() {
    const r = rect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();
})();
