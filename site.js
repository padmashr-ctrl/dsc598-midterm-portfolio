(() => {
  const comparisons = document.querySelectorAll('[data-comparison]');
  comparisons.forEach((comparison) => {
    const range = comparison.querySelector('[data-comparison-range]');
    const after = comparison.querySelector('[data-comparison-after]');
    const line = comparison.querySelector('[data-comparison-line]');
    const update = () => {
      const value = `${range.value}%`;
      after.style.width = value;
      line.style.left = value;
    };
    range.addEventListener('input', update);
    update();
  });

  const canvas = document.querySelector('#stitch-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const clearButton = document.querySelector('#clear-canvas');
  const status = document.querySelector('#canvas-status');
  const palette = ['#ad2f39', '#691f2d', '#b4583c', '#c48b43', '#516246', '#77638b'];
  const marks = [];
  let pointerStart = null;

  const seeded = [
    { x: .17, y: .67, petals: 6, radius: 34, angle: .2, color: 0, stitch: 1 },
    { x: .38, y: .43, petals: 8, radius: 27, angle: .6, color: 4, stitch: 2 },
    { x: .62, y: .69, petals: 10, radius: 25, angle: .3, color: 5, stitch: 0 },
    { x: .82, y: .36, petals: 7, radius: 31, angle: .8, color: 3, stitch: 2 }
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAll();
  }

  function petalProfile(index, radius) {
    const profiles = [
      { long: radius, wide: radius * .38 },
      { long: radius * 1.15, wide: radius * .26 },
      { long: radius * .85, wide: radius * .52 }
    ];
    return profiles[index % profiles.length];
  }

  function drawMark(mark) {
    const rect = canvas.getBoundingClientRect();
    const x = mark.x * rect.width;
    const y = mark.y * rect.height;
    const radius = mark.radius;
    const profile = petalProfile(mark.stitch, radius);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(mark.angle);
    ctx.globalAlpha = .88;
    ctx.fillStyle = palette[mark.color % palette.length];
    ctx.strokeStyle = '#f4ead7';
    ctx.lineWidth = 1.4;

    for (let i = 0; i < mark.petals; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / mark.petals);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(profile.wide, -profile.long * .25, profile.wide, -profile.long * .8, 0, -profile.long);
      ctx.bezierCurveTo(-profile.wide, -profile.long * .8, -profile.wide, -profile.long * .25, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#28211c';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, radius * .13), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f3e6cc';
    ctx.lineWidth = 1.7;
    for (let i = 0; i < Math.min(mark.petals, 8); i++) {
      const a = (Math.PI * 2 * i) / Math.min(mark.petals, 8);
      const sx = Math.cos(a) * radius * .35;
      const sy = Math.sin(a) * radius * .35;
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy - 4);
      ctx.lineTo(sx + 4, sy + 4);
      ctx.moveTo(sx + 4, sy - 4);
      ctx.lineTo(sx - 4, sy + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAll() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    marks.forEach(drawMark);
  }

  function addMark(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(.94, Math.max(.06, (clientX - rect.left) / rect.width));
    const y = Math.min(.92, Math.max(.16, (clientY - rect.top) / rect.height));
    const previous = marks[marks.length - 1];
    let color = Math.floor(Math.random() * palette.length);
    if (previous && color === previous.color) color = (color + 1) % palette.length;
    marks.push({
      x,
      y,
      petals: 5 + Math.floor(Math.random() * 7),
      radius: 22 + Math.random() * 20,
      angle: Math.random() * Math.PI,
      color,
      stitch: Math.floor(Math.random() * 3)
    });
    if (marks.length > 40) marks.shift();
    drawAll();
    status.textContent = `Added stitched bloom ${marks.length}.`;
  }

  canvas.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (distance < 9) addMark(event.clientX, event.clientY);
    pointerStart = null;
  });
  canvas.addEventListener('pointercancel', () => { pointerStart = null; });
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const offset = (marks.length % 5) * 18 - 36;
      addMark(rect.left + rect.width / 2 + offset, rect.top + rect.height / 2 + offset / 2);
    }
  });
  clearButton.addEventListener('click', () => {
    marks.splice(0, marks.length, ...seeded.map((mark) => ({ ...mark })));
    drawAll();
    status.textContent = 'The drawing was reset to its starting arrangement.';
  });

  marks.push(...seeded.map((mark) => ({ ...mark })));
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
})();
