(() => {
  const root = document.querySelector('[data-arizona]');
  const canvas = root?.querySelector('[data-arizona-canvas]');
  if (!root || !canvas) return;

  const ctx = canvas.getContext('2d');
  const timeOutput = root.querySelector('[data-az-time]');
  const weatherOutput = root.querySelector('[data-az-weather]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let timeMode = 'live';
  let weatherMode = 'live';
  let liveWeather = 'clear';
  let liveTemperature = null;
  let frame = 0;

  const palette = {
    dawn: ['#f0a88f', '#f4d6ae'],
    day: ['#6eb7dc', '#f2d7a2'],
    dusk: ['#704f86', '#ef9a6c'],
    night: ['#152342', '#4c5274']
  };

  const phoenixParts = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Phoenix', hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    return { hour: get('hour') % 24, minute: get('minute'), second: get('second') };
  };

  const phase = () => {
    if (timeMode !== 'live') return timeMode;
    const hour = phoenixParts().hour;
    if (hour < 5 || hour >= 20) return 'night';
    if (hour < 7) return 'dawn';
    if (hour < 17) return 'day';
    if (hour < 20) return 'dusk';
    return 'night';
  };

  const activeWeather = () => weatherMode === 'live' ? liveWeather : weatherMode;

  const hill = (baseY, color, amplitude, offset, detail = 7) => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, baseY);
    for (let index = 0; index <= detail; index += 1) {
      const x = (index / detail) * width;
      const y = baseY - Math.sin(index * 1.48 + offset) * amplitude - Math.cos(index * .72 + offset) * amplitude * .55;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const cactus = (x, y, scale, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, 7 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y - 42 * scale);
    ctx.moveTo(x, y - 25 * scale); ctx.lineTo(x - 12 * scale, y - 34 * scale); ctx.lineTo(x - 12 * scale, y - 43 * scale);
    ctx.moveTo(x, y - 18 * scale); ctx.lineTo(x + 12 * scale, y - 27 * scale); ctx.lineTo(x + 12 * scale, y - 35 * scale);
    ctx.stroke();
  };

  const cloud = (x, y, scale, opacity = .7) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#e6e7ea';
    ctx.beginPath();
    ctx.ellipse(x, y, 42 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 19 * scale, y - 7 * scale, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 8 * scale, y - 10 * scale, 25 * scale, 19 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = () => {
    const currentPhase = phase();
    const weather = activeWeather();
    const colors = palette[currentPhase];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]); gradient.addColorStop(.62, colors[1]); gradient.addColorStop(1, '#d5aa75');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);

    const live = phoenixParts();
    const phaseHours = { dawn: 6, day: 12, dusk: 18, night: 23 };
    const hour = timeMode === 'live' ? live.hour + live.minute / 60 : phaseHours[currentPhase];
    const angle = ((hour - 6) / 14) * Math.PI;
    const orbX = width * (.08 + ((hour - 5 + 24) % 24) / 18 * .84);
    const orbY = height * .47 - Math.sin(angle) * height * .34;
    ctx.beginPath(); ctx.arc(orbX, orbY, Math.max(10, width * .014), 0, Math.PI * 2);
    ctx.fillStyle = currentPhase === 'night' ? '#e9e6d4' : '#fff1ad';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0;

    if (currentPhase === 'night') {
      ctx.fillStyle = 'rgba(255,255,238,.78)';
      for (let index = 0; index < 45; index += 1) {
        const x = (index * 91) % width; const y = 24 + (index * 47) % Math.max(60, height * .42);
        ctx.fillRect(x, y, index % 4 === 0 ? 2 : 1, index % 4 === 0 ? 2 : 1);
      }
    }

    hill(height * .55, currentPhase === 'night' ? '#384764' : '#8e766d', height * .035, .3, 9);
    hill(height * .65, currentPhase === 'night' ? '#2a3c4f' : '#a37458', height * .055, 1.8, 10);
    hill(height * .76, currentPhase === 'night' ? '#203642' : '#c38b56', height * .04, 3.1, 12);

    ctx.fillStyle = currentPhase === 'night' ? '#172b36' : '#704b33';
    for (let index = 0; index < 22; index += 1) {
      const x = (index / 22) * width;
      const buildingHeight = 18 + ((index * 31) % 52);
      ctx.fillRect(x, height * .75 - buildingHeight, width / 27, buildingHeight);
    }

    const ground = currentPhase === 'night' ? '#172c2c' : '#aa7041';
    ctx.fillStyle = ground; ctx.fillRect(0, height * .76, width, height * .24);
    for (let index = 0; index < 17; index += 1) cactus(width * (.03 + index * .061), height * (.86 + (index % 3) * .035), .42 + (index % 4) * .11, currentPhase === 'night' ? '#214b45' : '#396942');

    if (weather === 'cloudy' || weather === 'monsoon') {
      for (let index = 0; index < 5; index += 1) cloud(width * (.12 + index * .21) + Math.sin(frame * .005 + index) * 12, height * (.16 + (index % 2) * .1), .7 + index * .05, weather === 'monsoon' ? .76 : .62);
    }
    if (weather === 'dust') {
      const dust = ctx.createLinearGradient(0, height * .25, 0, height);
      dust.addColorStop(0, 'rgba(190,126,68,.04)'); dust.addColorStop(1, 'rgba(188,105,52,.72)');
      ctx.fillStyle = dust; ctx.fillRect(0, height * .25, width, height * .75);
    }
    if (weather === 'monsoon') {
      ctx.strokeStyle = 'rgba(192,223,235,.64)'; ctx.lineWidth = 1;
      for (let index = 0; index < 90; index += 1) {
        const x = (index * 47 + frame * 4) % (width + 20) - 20;
        const y = (index * 83 + frame * 9) % height;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 22); ctx.stroke();
      }
    }

    frame += 1;
    if (!reducedMotion) requestAnimationFrame(draw);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reducedMotion) draw();
  };

  const updateReadout = () => {
    const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date());
    timeOutput.textContent = `${clock} MST`;
    const label = activeWeather() === 'monsoon' ? 'monsoon storm' : activeWeather();
    weatherOutput.textContent = `${liveTemperature === null ? '' : `${Math.round(liveTemperature)}°F · `}${label}`;
  };

  root.querySelectorAll('[data-az-time-mode]').forEach((button) => button.addEventListener('click', () => {
    timeMode = button.dataset.azTimeMode;
    root.querySelectorAll('[data-az-time-mode]').forEach((item) => item.classList.toggle('is-active', item === button));
    if (reducedMotion) draw();
  }));
  root.querySelectorAll('[data-az-weather-mode]').forEach((button) => button.addEventListener('click', () => {
    weatherMode = button.dataset.azWeatherMode;
    root.querySelectorAll('[data-az-weather-mode]').forEach((item) => item.classList.toggle('is-active', item === button));
    updateReadout();
    if (reducedMotion) draw();
  }));

  const weatherFromCode = (code) => {
    if ([95, 96, 99, 80, 81, 82].includes(code)) return 'monsoon';
    if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
    return 'clear';
  };
  fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4255&longitude=-111.94&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FPhoenix')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('weather unavailable')))
    .then((data) => {
      liveTemperature = data.current?.temperature_2m ?? null;
      liveWeather = weatherFromCode(data.current?.weather_code);
      updateReadout();
    })
    .catch(() => { weatherOutput.textContent = 'live weather unavailable · clear preview'; });

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  window.setInterval(updateReadout, 1000);
  updateReadout();
  resize();
  if (!reducedMotion) requestAnimationFrame(draw);
})();
