/* Signal Garden — Shreya Ramanan (2026)
   A visitor draws a gesture; the system classifies it (orbit, branch, drift, pulse)
   and grows a continuation whose faithfulness depends on "system agency". */
(() => {
  const PALETTE = [174, 238, 286, 42];
  const BG = '3,6,11';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  class Garden {
    constructor(canvas, { agency = 0.62, seedsPerGesture = 26, maxAgents = 900, stars = true, onGesture } = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.agency = agency;
      this.seedsPerGesture = seedsPerGesture;
      this.maxAgents = maxAgents;
      this.useStars = stars;
      this.onGesture = onGesture;
      this.gestures = []; this.agents = []; this.stars = []; this.labels = [];
      this.count = 0; this.kick = 0; this.w = 0; this.h = 0;
      this.resize();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.fillStyle = `rgb(${BG})`; this.ctx.fillRect(0, 0, this.w, this.h);
      this.stars = [];
      if (this.useStars) {
        const n = Math.max(40, Math.floor((this.w * this.h) / 11000));
        for (let i = 0; i < n; i += 1) this.stars.push({ x: Math.random() * this.w, y: Math.random() * this.h, r: 0.3 + Math.random() * 1.1, a: 0.08 + Math.random() * 0.2 });
      }
    }

    classify(points) {
      if (points.length < 3) return 'pulse';
      const first = points[0]; const last = points[points.length - 1];
      const xs = points.map((p) => p.x); const ys = points.map((p) => p.y);
      const spanX = Math.max(...xs) - Math.min(...xs); const spanY = Math.max(...ys) - Math.min(...ys);
      const diag = Math.max(30, Math.hypot(spanX, spanY));
      let length = 0; for (let i = 1; i < points.length; i += 1) length += dist(points[i - 1], points[i]);
      const speed = length / Math.max(80, last.t - first.t);
      if (diag < Math.min(this.w, this.h) * 0.08) return 'pulse';
      if (dist(first, last) / diag < 0.32 && points.length > 8) return 'orbit';
      if (spanY > spanX * 1.25) return 'branch';
      if (speed > 0.75 || spanX > this.w * 0.34) return 'drift';
      return 'pulse';
    }

    addGesture(points, forced) {
      if (!points.length) return null;
      const mode = forced || this.classify(points);
      const hue = PALETTE[this.count % PALETTE.length];
      const simple = points.filter((_, i) => i % 2 === 0 || i === points.length - 1).slice(-180);
      this.gestures.push({ points: simple, hue, life: 1 });
      if (this.gestures.length > 18) this.gestures.shift();
      this.count += 1;
      this.seed(simple, mode, hue);
      const c = simple.reduce((acc, p) => ({ x: acc.x + p.x / simple.length, y: acc.y + p.y / simple.length }), { x: 0, y: 0 });
      this.labels.push({ text: mode.toUpperCase(), x: c.x, y: c.y, hue, life: 1 });
      this.onGesture?.(mode, hue, this.count);
      return mode;
    }

    seed(points, mode, hue) {
      const interval = Math.max(1, Math.floor(points.length / this.seedsPerGesture));
      points.forEach((p, i) => {
        if (i % interval) return;
        const prev = points[Math.max(0, i - 1)] || p;
        const angle = Math.atan2(p.y - prev.y, p.x - prev.x) || Math.random() * Math.PI * 2;
        const spread = (Math.random() - 0.5) * Math.PI * this.agency;
        const sp = 0.35 + Math.random() * 1.1;
        this.agents.push({ x: p.x, y: p.y, px: p.x, py: p.y, vx: Math.cos(angle + spread) * sp, vy: Math.sin(angle + spread) * sp, hue, alpha: 1, age: 0, maxAge: 320 + Math.random() * 460, mode, phase: Math.random() * Math.PI * 2, ox: p.x, oy: p.y });
      });
      if (this.agents.length > this.maxAgents) this.agents.splice(0, this.agents.length - this.maxAgents);
    }

    disturb() {
      this.kick = 0.18 + this.agency * 0.16;
      this.agents.forEach((a) => { a.vx += (Math.random() - 0.5) * 1.6; a.vy += (Math.random() - 0.5) * 1.6; });
    }

    clear() {
      this.gestures.length = 0; this.agents.length = 0; this.labels.length = 0; this.count = 0;
      this.ctx.fillStyle = `rgb(${BG})`; this.ctx.fillRect(0, 0, this.w, this.h);
    }

    update(a, time) {
      a.px = a.x; a.py = a.y;
      const field = Math.sin(a.y * 0.006 + time * 0.00016 + a.phase) + Math.cos(a.x * 0.004 - time * 0.0001);
      const turn = field * (0.012 + this.agency * 0.055 + this.kick);
      const c = Math.cos(turn); const s = Math.sin(turn);
      const vx = a.vx * c - a.vy * s; a.vy = a.vx * s + a.vy * c; a.vx = vx;
      if (a.mode === 'orbit') {
        const t = Math.atan2(a.oy - a.y, a.ox - a.x) + Math.PI / 2;
        a.vx += Math.cos(t) * 0.016 * (0.4 + this.agency); a.vy += Math.sin(t) * 0.016 * (0.4 + this.agency);
        // low agency: stay tethered to where the hand drew
        a.vx += (a.ox - a.x) * 0.0006 * (1 - this.agency); a.vy += (a.oy - a.y) * 0.0006 * (1 - this.agency);
      } else if (a.mode === 'branch' && a.age % 70 < 1 && this.agents.length < this.maxAgents - 10 && Math.random() < 0.35 + this.agency * 0.5) {
        this.agents.push({ ...a, vx: -a.vy * 0.8, vy: a.vx * 0.8, age: a.age + 15, phase: a.phase + 1.4 });
      } else if (a.mode === 'pulse') {
        const pulse = Math.sin(a.age * 0.055 + a.phase) * 0.02;
        a.vx += Math.cos(a.phase) * pulse; a.vy += Math.sin(a.phase) * pulse;
      }
      const sp = Math.hypot(a.vx, a.vy); const lim = 1.2 + this.agency * 1.65;
      if (sp > lim) { a.vx = (a.vx / sp) * lim; a.vy = (a.vy / sp) * lim; }
      a.x += a.vx; a.y += a.vy; a.age += 1;
      a.alpha = Math.max(0, 1 - a.age / a.maxAge);
      if (a.x < -20) { a.x = this.w + 20; a.px = a.x; } else if (a.x > this.w + 20) { a.x = -20; a.px = a.x; }
      if (a.y < -20) { a.y = this.h + 20; a.py = a.y; } else if (a.y > this.h + 20) { a.y = -20; a.py = a.y; }
    }

    drawPath(points, hue, alpha) {
      if (points.length < 2) return;
      const { ctx } = this;
      ctx.strokeStyle = `hsla(${hue},90%,72%,${alpha})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i += 1) ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i + 1].x) / 2, (points[i].y + points[i + 1].y) / 2);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y); ctx.stroke();
    }

    frame(time, live) {
      const { ctx } = this;
      ctx.fillStyle = `rgba(${BG},${0.045 + (1 - this.agency) * 0.03})`;
      ctx.fillRect(0, 0, this.w, this.h);
      this.stars.forEach((s) => { ctx.fillStyle = `rgba(190,218,255,${s.a})`; ctx.fillRect(s.x, s.y, s.r, s.r); });
      this.gestures.forEach((g) => { g.life = Math.max(0.15, g.life - 0.0015); this.drawPath(g.points, g.hue, 0.2 * g.life); });
      if (live && live.length > 1) this.drawPath(live, PALETTE[this.count % PALETTE.length], 0.9);
      for (const a of this.agents) {
        this.update(a, time);
        ctx.strokeStyle = `hsla(${a.hue},92%,70%,${a.alpha * 0.5})`;
        ctx.lineWidth = 0.55 + a.alpha * 1.2;
        ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(a.x, a.y); ctx.stroke();
        if (a.age % 32 < 1) { ctx.fillStyle = `hsla(${a.hue},95%,76%,${a.alpha})`; ctx.beginPath(); ctx.arc(a.x, a.y, 1.2 + a.alpha * 1.8, 0, Math.PI * 2); ctx.fill(); }
      }
      for (let i = this.agents.length - 1; i >= 0; i -= 1) if (this.agents[i].alpha <= 0) this.agents.splice(i, 1);
      // the system names what it decided, briefly, where it decided it
      ctx.font = '500 11px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center';
      this.labels.forEach((l) => { l.life -= 0.006; ctx.fillStyle = `hsla(${l.hue},90%,78%,${Math.max(0, l.life) * 0.9})`; ctx.fillText(`· ${l.text} ·`, l.x, l.y - 14 - (1 - l.life) * 18); });
      this.labels = this.labels.filter((l) => l.life > 0);
      this.kick *= 0.965;
    }
  }

  /* scripted gestures, used by the idle ghost and the comparison strip */
  function scripted(kind, cx, cy, s, t0 = 0) {
    const pts = [];
    if (kind === 'orbit') for (let i = 0; i <= 36; i += 1) { const a = (i / 36) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * s, y: cy + Math.sin(a) * s * 0.85, t: t0 + i * 22 }); }
    if (kind === 'branch') for (let i = 0; i <= 30; i += 1) pts.push({ x: cx + Math.sin(i / 5) * s * 0.18, y: cy + s - (i / 30) * s * 2, t: t0 + i * 26 });
    if (kind === 'drift') for (let i = 0; i <= 30; i += 1) pts.push({ x: cx - s * 1.6 + (i / 30) * s * 3.2, y: cy + Math.sin(i / 4.5) * s * 0.35, t: t0 + i * 6 });
    if (kind === 'pulse') for (let i = 0; i <= 10; i += 1) pts.push({ x: cx + Math.cos(i) * s * 0.12, y: cy + Math.sin(i * 1.3) * s * 0.12, t: t0 + i * 30 });
    return pts;
  }

  /* ---------------- main field ---------------- */
  const canvas = document.querySelector('#signal-canvas');
  if (!canvas) return;
  const $ = (s) => document.querySelector(s);
  const ui = { agency: $('#agency'), agencyOut: $('[data-agency-output]'), count: $('[data-gesture-count]'), mode: $('[data-system-mode]'), div: $('[data-divergence]'), status: $('[data-status]'), sound: $('[data-sound]'), reset: $('[data-reset]'), disturb: $('[data-disturb]') };
  let soundOn = false; let audio;
  let lastHuman = -1e9;

  function tone(mode, hue) {
    if (!soundOn) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    audio ||= new AC(); if (audio.state === 'suspended') audio.resume();
    const base = { orbit: 220, branch: 165, drift: 294, pulse: 196 }[mode] || 196;
    [1, 1.5].forEach((ratio, i) => {
      const o = audio.createOscillator(); const g = audio.createGain();
      o.type = i ? 'sine' : 'triangle'; o.frequency.value = base * ratio + hue * 0.08;
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(i ? 0.018 : 0.032, audio.currentTime + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.55 + i * 0.3);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.9);
    });
  }

  const garden = new Garden(canvas, {
    agency: Number(ui.agency.value) / 100,
    onGesture(mode, hue, n) {
      ui.count.textContent = String(n).padStart(2, '0');
      ui.mode.textContent = mode.toUpperCase();
      tone(mode, hue);
    }
  });

  let drawing = null;
  const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drawing = [pt(e)]; canvas.setPointerCapture?.(e.pointerId);
    lastHuman = performance.now();
    ui.status.textContent = 'Listening to your gesture…';
  });
  canvas.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pt(e); if (dist(drawing[drawing.length - 1], p) > 4) drawing.push(p); lastHuman = performance.now(); });
  canvas.addEventListener('pointerup', (e) => {
    if (!drawing) return;
    const p = pt(e); if (dist(drawing[drawing.length - 1], p) > 2) drawing.push(p);
    const mode = garden.addGesture(drawing); drawing = null;
    ui.status.textContent = `Read as ${mode}. The system is continuing gesture ${garden.count}.`;
  });
  canvas.addEventListener('pointercancel', () => { drawing = null; });
  canvas.addEventListener('keydown', (e) => {
    const keys = { Enter: 'orbit', ' ': 'orbit', o: 'orbit', b: 'branch', d: 'drift', p: 'pulse' };
    const kind = keys[e.key]; if (!kind) return;
    e.preventDefault(); lastHuman = performance.now();
    const n = garden.count;
    garden.addGesture(scripted(kind, garden.w * (0.3 + (n % 5) * 0.1), garden.h * (0.4 + (n % 3) * 0.1), Math.min(garden.w, garden.h) * 0.1, performance.now()), kind);
    ui.status.textContent = `Planted a ${kind} seed from the keyboard.`;
  });

  ui.agency.addEventListener('input', () => {
    garden.agency = Number(ui.agency.value) / 100;
    ui.agencyOut.textContent = `${ui.agency.value}%`; ui.div.textContent = `${ui.agency.value}%`;
    ui.status.textContent = `System agency set to ${ui.agency.value}%.`;
  });
  ui.sound.addEventListener('click', () => { soundOn = !soundOn; ui.sound.setAttribute('aria-pressed', String(soundOn)); ui.sound.textContent = `Sound: ${soundOn ? 'on' : 'off'}`; if (soundOn) tone('pulse', 174); });
  ui.disturb.addEventListener('click', () => { garden.disturb(); ui.mode.textContent = 'DISTURBED'; ui.status.textContent = 'The field was disturbed. Every response is changing direction.'; tone('drift', 286); lastHuman = performance.now(); });
  ui.reset.addEventListener('click', () => { garden.clear(); ui.count.textContent = '00'; ui.mode.textContent = 'LISTENING'; ui.status.textContent = 'Field cleared. Draw a gesture to begin again.'; lastHuman = performance.now(); });

  // idle ghost: when nobody draws, the garden plants its own gestures so it is never empty
  const kinds = ['orbit', 'drift', 'branch', 'pulse'];
  let ghostAt = 0; let ghostN = 0;
  function ghost(now) {
    if (reduceMotion || now - lastHuman < 9000 || now < ghostAt) return;
    const kind = kinds[ghostN % kinds.length]; ghostN += 1;
    const s = Math.min(garden.w, garden.h) * (0.08 + Math.random() * 0.06);
    garden.addGesture(scripted(kind, garden.w * (0.45 + Math.random() * 0.45), garden.h * (0.25 + Math.random() * 0.5), s, now), kind);
    ui.mode.textContent = `${kind.toUpperCase()} · IDLE`;
    ghostAt = now + 4200;
  }

  /* ---------------- comparison strip: same input, three agencies ---------------- */
  const minis = [...document.querySelectorAll('[data-mini]')].map((c) => ({ g: new Garden(c, { agency: Number(c.dataset.mini), seedsPerGesture: 18, maxAgents: 420, stars: false }), next: 0, step: 0 }));
  function runMinis(now) {
    minis.forEach((m) => {
      if (now >= m.next) {
        const { g } = m; const s = Math.min(g.w, g.h) * 0.2;
        const kind = ['orbit', 'drift', 'branch'][m.step % 3];
        g.addGesture(scripted(kind, g.w * 0.5, g.h * 0.5, s, now), kind);
        m.step += 1; m.next = now + 3800;
      }
      m.g.frame(now);
    });
  }
  const visible = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
    io.observe(canvas); minis.forEach((m) => io.observe(m.g.canvas));
  }
  const isVisible = (c) => !('IntersectionObserver' in window) || visible.has(c);

  function loop(now) {
    if (isVisible(canvas)) { ghost(now); garden.frame(now, drawing); }
    const anyMini = minis.some((m) => isVisible(m.g.canvas));
    if (anyMini) runMinis(now);
    requestAnimationFrame(loop);
  }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { garden.resize(); minis.forEach((m) => m.g.resize()); }, 200); });
  // open with one gesture already growing so the field is never blank
  garden.addGesture(scripted('orbit', garden.w * 0.68, garden.h * 0.46, Math.min(garden.w, garden.h) * 0.12, performance.now()), 'orbit');
  ui.status.textContent = 'Draw slowly anywhere in the field.';
  lastHuman = performance.now() - 6000;
  requestAnimationFrame(loop);
})();
