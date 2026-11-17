/* Restitch — an interactive installation by Shreya Ramanan (2026)
   Three AI-made images are rebuilt as cross-stitches. Pull threads with a hand (MediaPipe
   Hand Landmarker, on-device) or a pointer. Every pulled stitch is re-sewn from the next memory. */
(() => {
  const stage = document.querySelector('[data-restitch]');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ui = {
    status: stage.querySelector('[data-status]'),
    mix: stage.querySelector('[data-mix]'),
    camera: stage.querySelector('[data-camera]'),
    reset: stage.querySelector('[data-reset]'),
    video: stage.querySelector('video'),
    live: stage.querySelector('[data-live]')
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SOURCES = [
    { src: 'assets/album-final.jpg', name: 'Mess It Up' },
    { src: 'assets/studio-hero.jpg', name: 'Personal Studio' },
    { src: 'assets/stock/memory-room.jpg', name: 'Event 27' }
  ];
  const BG = [14, 13, 12];
  const THREAD = '#d0493e';

  let W = 0; let H = 0; let spacing = 8; let cols = 0; let rows = 0; let N = 0;
  let px; let py; let vx; let vy; let hx; let hy; let loose; let looseT; let layer; let visible;
  let palettes = []; // per image: Uint32Array of packed colours (ABGR) per cell, 0 when outside image
  let frame; let buf32;
  const images = [];
  const agents = new Map(); // id -> {x,y,vx,vy,pinch,r,kind}
  let lastInteraction = performance.now();
  let pulledTotal = 0;

  const pack = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;
  const mixBg = (r, g, b, a) => pack(Math.round(BG[0] + (r - BG[0]) * a), Math.round(BG[1] + (g - BG[1]) * a), Math.round(BG[2] + (b - BG[2]) * a));
  const LINEN = mixBg(232, 223, 207, 0.07);
  const BGPACK = pack(...BG);

  function loadImages() {
    return Promise.all(SOURCES.map((s) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = s.src;
    })));
  }

  // Place the artwork in the space the text leaves free, so type never sits on top of stitches.
  function freeArea() {
    const c = canvas.getBoundingClientRect();
    const title = stage.querySelector('.inst-title')?.getBoundingClientRect();
    const bar = stage.querySelector('.inst-bar')?.getBoundingClientRect();
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    const gap = Math.max(24, W * 0.025);
    const area = { left: W * 0.05, right: W * 0.05, top: (header ? header.bottom - c.top : 70) + gap, bottom: bar ? c.bottom - bar.top + gap : H * 0.16 };
    if (title) {
      const sideWidth = W - (title.right - c.left) - gap * 2;
      const belowHeight = H - (title.bottom - c.top) - area.bottom - gap;
      // beside the title when there is room for a decent image, otherwise below it
      if (sideWidth > W * 0.38 && sideWidth > belowHeight * 0.9) area.left = title.right - c.left + gap * 1.5;
      else area.top = title.bottom - c.top + gap;
    }
    return area;
  }

  function fitRect(img) {
    const a = freeArea();
    const aw = Math.max(80, W - a.left - a.right); const ah = Math.max(80, H - a.top - a.bottom);
    const scale = Math.min(aw / img.width, ah / img.height);
    const w = img.width * scale; const h = img.height * scale;
    return { x: a.left + (aw - w) / 2, y: a.top + (ah - h) / 2, w, h };
  }

  function sample(img, index) {
    const out = new Uint32Array(N);
    if (!img) return out;
    const r = fitRect(img);
    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const o = off.getContext('2d', { willReadFrequently: true });
    const dx = r.x / spacing; const dy = r.y / spacing; const dw = r.w / spacing; const dh = r.h / spacing;
    o.drawImage(img, dx, dy, dw, dh);
    if (index === 0) {
      // the album: thicken dark lettering ("mess it up") so it reads boldly in stitches
      o.globalCompositeOperation = 'darken';
      const t = 0.3;
      [[t, 0], [0, t]].forEach(([ox, oy]) => o.drawImage(img, dx + ox, dy + oy, dw, dh));
      o.globalCompositeOperation = 'source-over';
    }
    const d = o.getImageData(0, 0, cols, rows).data;
    for (let i = 0; i < N; i += 1) {
      const a = d[i * 4 + 3];
      if (a < 200) continue;
      // lift dark tones a little so the stitches read on black
      let rr = d[i * 4]; let gg = d[i * 4 + 1]; let bb = d[i * 4 + 2];
      if (index === 0) {
        // deepen the burgundy type and red heart against the linen
        const lum = 0.3 * rr + 0.59 * gg + 0.11 * bb;
        if (lum < 150) { const k = 0.62; rr *= k; gg *= k * 0.8; bb *= k * 0.8; rr = Math.max(rr, 70); }
      }
      const lift = (v) => Math.min(255, Math.round(v * 1.05 + 10));
      out[i] = pack(lift(rr), lift(gg), lift(bb));
    }
    return out;
  }

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(320, Math.round(rect.height));
    canvas.width = W; canvas.height = H;
    spacing = Math.max(6, Math.round(Math.sqrt((W * H) / 17000)));
    cols = Math.floor(W / spacing); rows = Math.floor(H / spacing); N = cols * rows;
    px = new Float32Array(N); py = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
    hx = new Float32Array(N); hy = new Float32Array(N); loose = new Uint8Array(N); looseT = new Float32Array(N);
    layer = new Uint8Array(N); visible = new Uint8Array(N);
    const ox = (W - cols * spacing) / 2 + spacing / 2; const oy = (H - rows * spacing) / 2 + spacing / 2;
    for (let y = 0, i = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1, i += 1) { hx[i] = px[i] = ox + x * spacing; hy[i] = py[i] = oy + y * spacing; }
    }
    palettes = images.map((img, index) => sample(img, index));
    for (let i = 0; i < N; i += 1) visible[i] = palettes[0] && palettes[0][i] ? 1 : 0;
    // a thick X that fills most of its cell
    const half = Math.max(2, Math.floor(spacing / 2) - 1);
    XOFF = [];
    for (let t = -half; t <= half; t += 1) { XOFF.push([t, t], [t, -t], [t + 1, t], [t + 1, -t]); }
    frame = ctx.createImageData(W, H);
    buf32 = new Uint32Array(frame.data.buffer);
    pulledTotal = 0;
    updateMix();
  }

  /* ---------- agents: pointer, hands, and an idle ghost ---------- */
  function setAgent(id, x, y, pinch, kind) {
    const prev = agents.get(id);
    const a = prev || { x, y, vx: 0, vy: 0 };
    a.vx = prev ? (x - prev.x) : 0; a.vy = prev ? (y - prev.y) : 0;
    a.x = x; a.y = y; a.pinch = pinch; a.kind = kind; a.seen = performance.now();
    a.r = spacing * (pinch ? 7 : 8);
    agents.set(id, a);
    if (kind !== 'ghost') lastInteraction = performance.now();
  }

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    setAgent(`p${e.pointerId}`, e.clientX - r.left, e.clientY - r.top, e.buttons > 0, 'pointer');
  });
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (error) { /* synthetic or lost pointer */ }
    const r = canvas.getBoundingClientRect();
    setAgent(`p${e.pointerId}`, e.clientX - r.left, e.clientY - r.top, true, 'pointer');
  });
  const endPointer = (e) => agents.delete(`p${e.pointerId}`);
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') endPointer(e); });

  // keyboard: Space pulls a thread at a random point
  canvas.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    pullAt(W * (0.3 + Math.random() * 0.4), H * (0.3 + Math.random() * 0.4), 40);
    announce('A thread was pulled.');
  });

  function pullAt(x, y, count) {
    let n = 0;
    for (let i = 0; i < N && n < count; i += 1) {
      if (!visible[i] || loose[i]) continue;
      const dx = hx[i] - x; const dy = hy[i] - y;
      if (dx * dx + dy * dy < (spacing * 6) ** 2) { loosen(i, (Math.random() - 0.5) * 9, -Math.random() * 7); n += 1; }
    }
  }

  function loosen(i, ivx, ivy) {
    if (!loose[i]) pulledTotal += 1;
    loose[i] = 1; looseT[i] = 0;
    vx[i] += ivx; vy[i] += ivy;
  }

  // An idle "ghost hand" keeps the work alive when nobody is interacting
  let ghostT = 0;
  function ghost(dt) {
    if (reduceMotion) return;
    if (performance.now() - lastInteraction < 5000) { agents.delete('ghost'); return; }
    ghostT += dt * 0.00025;
    const x = W * (0.5 + 0.32 * Math.sin(ghostT * 1.7) * Math.cos(ghostT * 0.6));
    const y = H * (0.5 + 0.3 * Math.sin(ghostT * 1.1 + 1.3));
    const pinch = Math.sin(ghostT * 3.1) > 0.45;
    setAgent('ghost', x, y, pinch, 'ghost');
  }

  /* ---------- simulation ---------- */
  function step(dt) {
    const k = Math.min(2, dt / 16.67);
    const list = [...agents.values()].filter((a) => performance.now() - a.seen < 400 || a.kind === 'pointer');
    for (let i = 0; i < N; i += 1) {
      let c = palettes[layer[i]]?.[i] || 0;
      visible[i] = c !== 0 ? 1 : 0;
      for (let j = 0; j < list.length; j += 1) {
        const a = list[j];
        const dx = px[i] - a.x; const dy = py[i] - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > a.r * a.r) continue;
        const d = Math.sqrt(d2) || 1;
        if (a.pinch && visible[i]) {
          // pinching pulls the thread: the stitch comes loose and follows the hand
          if (!loose[i]) loosen(i, 0, 0);
          vx[i] += a.vx * 0.35 * k; vy[i] += a.vy * 0.35 * k;
          looseT[i] = 0;
        } else {
          const f = (1 - d / a.r) * 2.2 * k;
          vx[i] += (dx / d) * f; vy[i] += (dy / d) * f;
        }
      }
      const tx = hx[i] - px[i]; const ty = hy[i] - py[i];
      if (loose[i]) {
        looseT[i] += dt;
        const grip = looseT[i] < 1800 ? 0.0015 : 0.02 + Math.min(0.06, (looseT[i] - 1800) / 60000);
        vx[i] += tx * grip * k; vy[i] += ty * grip * k + 0.025 * k * (looseT[i] < 1800 ? 1 : 0);
        vx[i] *= 0.955; vy[i] *= 0.955;
        if (looseT[i] > 1800 && tx * tx + ty * ty < 0.6) {
          // re-sewn: the stitch returns from the next memory
          loose[i] = 0; px[i] = hx[i]; py[i] = hy[i]; vx[i] = 0; vy[i] = 0;
          layer[i] = (layer[i] + 1) % palettes.length;
          c = palettes[layer[i]][i];
          visible[i] = c !== 0 ? 1 : 0;
        }
      } else {
        vx[i] += tx * 0.09 * k; vy[i] += ty * 0.09 * k;
        vx[i] *= 0.78; vy[i] *= 0.78;
      }
      px[i] += vx[i] * k; py[i] += vy[i] * k;
    }
  }

  let XOFF = [];
  function render() {
    buf32.fill(BGPACK);
    for (let i = 0; i < N; i += 1) {
      const color = visible[i] ? palettes[layer[i]][i] : LINEN;
      const x = px[i] | 0; const y = py[i] | 0;
      const m = spacing;
      if (x < m || y < m || x >= W - m || y >= H - m) continue;
      const base = y * W + x;
      for (let o = 0; o < XOFF.length; o += 1) buf32[base + XOFF[o][1] * W + XOFF[o][0]] = color;
    }
    ctx.putImageData(frame, 0, 0);
    // loose threads: a red line back to where each stitch belongs
    ctx.beginPath();
    let drawn = 0;
    for (let i = 0; i < N && drawn < 2200; i += 1) {
      if (!loose[i]) continue;
      ctx.moveTo(hx[i], hy[i]); ctx.lineTo(px[i], py[i]); drawn += 1;
    }
    ctx.strokeStyle = THREAD; ctx.globalAlpha = 0.28; ctx.lineWidth = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
    // hands / pointer cursors
    agents.forEach((a) => {
      if (a.kind === 'pointer' && !a.pinch) return;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.pinch ? 10 : 16, 0, Math.PI * 2);
      ctx.strokeStyle = a.kind === 'ghost' ? 'rgba(241,235,225,.18)' : (a.pinch ? THREAD : 'rgba(241,235,225,.6)');
      ctx.lineWidth = 1.2; ctx.stroke();
    });
  }

  function updateMix() {
    if (!ui.mix || !palettes.length) return;
    const counts = new Array(palettes.length).fill(0); let total = 0;
    for (let i = 0; i < N; i += 1) { if (palettes[layer[i]][i]) { counts[layer[i]] += 1; total += 1; } }
    ui.mix.innerHTML = SOURCES.map((s, j) => `<li><span style="--w:${total ? (counts[j] / total) * 100 : 0}%"></span><b>${s.name}</b><em>${total ? Math.round((counts[j] / total) * 100) : 0}%</em></li>`).join('');
  }

  let last = performance.now(); let mixTimer = 0;
  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    ghost(dt);
    if (handLandmarker && ui.video.readyState >= 2) detectHands(now);
    step(dt);
    render();
    mixTimer += dt;
    if (mixTimer > 500) { mixTimer = 0; updateMix(); }
    requestAnimationFrame(loop);
  }

  function announce(text) { if (ui.live) ui.live.textContent = text; }

  /* ---------- hand tracking (MediaPipe Hand Landmarker, runs on-device) ---------- */
  let handLandmarker = null; let lastVideoTime = -1;
  async function startCamera() {
    ui.camera.disabled = true;
    ui.status.textContent = 'Loading the hand-tracking model…';
    try {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      handLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' },
        runningMode: 'VIDEO', numHands: 2
      });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      ui.video.srcObject = stream;
      await ui.video.play();
      stage.classList.add('has-camera');
      ui.camera.textContent = 'Camera on';
      ui.status.textContent = 'Pinch thumb and index finger to pull a thread. Open your hand to brush the stitches.';
      announce('Hand tracking is on.');
    } catch (error) {
      handLandmarker = null;
      ui.camera.disabled = false;
      ui.status.textContent = 'The camera is unavailable here, so use your mouse or finger: press and drag to pull threads.';
      announce('Camera unavailable. Pointer mode.');
    }
  }

  function detectHands(now) {
    if (ui.video.currentTime === lastVideoTime) return;
    lastVideoTime = ui.video.currentTime;
    const result = handLandmarker.detectForVideo(ui.video, now);
    const vw = ui.video.videoWidth; const vh = ui.video.videoHeight;
    // map video (object-fit: cover, mirrored) to the canvas
    const scale = Math.max(W / vw, H / vh);
    const offX = (W - vw * scale) / 2; const offY = (H - vh * scale) / 2;
    const map = (p) => ({ x: W - (p.x * vw * scale + offX), y: p.y * vh * scale + offY });
    const seen = new Set();
    (result.landmarks || []).forEach((hand, n) => {
      const thumb = map(hand[4]); const index = map(hand[8]);
      const pinchDist = Math.hypot(hand[4].x - hand[8].x, hand[4].y - hand[8].y);
      const pinch = pinchDist < 0.055;
      const x = pinch ? (thumb.x + index.x) / 2 : index.x;
      const y = pinch ? (thumb.y + index.y) / 2 : index.y;
      setAgent(`h${n}`, x, y, pinch, 'hand');
      seen.add(`h${n}`);
    });
    ['h0', 'h1'].forEach((id) => { if (!seen.has(id)) agents.delete(id); });
  }

  ui.camera?.addEventListener('click', startCamera);
  ui.reset?.addEventListener('click', () => { layer.fill(0); loose.fill(0); px.set(hx); py.set(hy); vx.fill(0); vy.fill(0); updateMix(); announce('Restored to the first image.'); });

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });

  Promise.all([loadImages(), document.fonts ? document.fonts.ready : Promise.resolve()]).then(([loaded]) => {
    loaded.forEach((img) => images.push(img));
    build();
    // open with a small loose thread so the mechanic is visible immediately
    if (!reduceMotion) { const r = images[0] ? fitRect(images[0]) : { x: W / 3, y: H / 3, w: W / 3, h: H / 3 }; pullAt(r.x + r.w * 0.45, r.y + r.h * 0.62, 220); }
    requestAnimationFrame(loop);
  });
})();
