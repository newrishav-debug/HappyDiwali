const ROUND = 30, TAP_SLOP = 16, MAX_PARTICLES = 500;

const nextScore = (score, pts) => Math.max(0, score + pts);
const cleanName = s => [...String(s || '').trim()].slice(0, 30).join('');

// Nearest cracker under the finger; generous slop because crackers move and thumbs are fat.
function pick(items, x, y) {
  let best = null, bestD = Infinity;
  for (const c of items) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d <= c.r + TAP_SLOP && d < bestD) { best = c; bestD = d; }
  }
  return best;
}

function shareHref(T, base, name, score) {
  const link = name ? `${base}?from=${encodeURIComponent(name)}` : base;
  const msg = score == null ? T.invite(name) : T.brag(T.num(score), name);
  return `https://wa.me/?text=${encodeURIComponent(`${msg} ${link}`)}`;
}

if (typeof module !== 'undefined') module.exports = { nextScore, cleanName, pick, shareHref };
if (typeof document !== 'undefined') start(window.T);

function start(T) {
  T.num = n => n.toLocaleString(T.locale);
  const $ = id => document.getElementById(id);
  const sky = $('sky');
  let g = sky.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, S;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; S = Math.min(W, H) / 400;
    sky.width = W * dpr; sky.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  /* ---------- sound: synthesised, so there is nothing to download ---------- */
  let ac, noise, muted = false;
  function initAudio() {
    if (ac) return ac.resume();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function bang(dur, cutoff, vol) {
    if (!ac || muted) return;
    const now = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
    src.buffer = noise;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, now);
    f.frequency.exponentialRampToValueAtTime(70, now + dur);
    v.gain.setValueAtTime(vol, now);
    v.gain.exponentialRampToValueAtTime(.001, now + dur);
    src.connect(f); f.connect(v); v.connect(ac.destination);
    src.start(now, Math.random() * .5, dur);
  }
  const buzz = ms => navigator.vibrate && navigator.vibrate(ms);

  /* ---------- particles ---------- */
  let parts = [], floats = [], shake = 0, later = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const from = list => list[Math.random() * list.length | 0];

  function spark(x, y, vx, vy, life, color, grav = 240, size = 2.2) {
    if (parts.length < MAX_PARTICLES) parts.push({ x, y, vx, vy, age: 0, life, color, grav, size });
  }
  function ring(x, y, n, speed, colors, life = .9, grav = 200) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = speed * S * rnd(.35, 1);
      spark(x, y, Math.cos(a) * v, Math.sin(a) * v, life * rnd(.6, 1), from(colors), grav);
    }
  }
  function fountain(x, y, n, speed, colors) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + rnd(-.5, .5), v = speed * S * rnd(.5, 1);
      spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(.6, 1.2), from(colors), 480);
    }
  }

  /* ---------- crackers ---------- */
  const fillBox = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const TYPES = {
    chakri: {
      pts: 10, r: 26, life: 2.6, weight: 28,
      place: () => ({ x: rnd(50, W - 50), y: rnd(H * .3, H * .78), vx: from([-1, 1]) * rnd(40, 90) * S }),
      draw(t) {
        g.rotate(t * 10);
        g.lineWidth = 6; g.strokeStyle = '#1fc98b';
        g.beginPath(); g.arc(0, 0, 20, 0, 6.28); g.stroke();
        g.strokeStyle = '#ffd27a'; g.lineWidth = 4;
        g.beginPath(); g.arc(0, 0, 11, 0, 6.28); g.stroke();
        for (let i = 0; i < 4; i++) { g.rotate(1.571); fillBox(-2, -26, 4, 10, '#ff5fa2'); }
      },
      emit(c) { const a = c.age * 10; spark(c.x + Math.cos(a) * 24, c.y + Math.sin(a) * 24, -Math.sin(a) * 130, Math.cos(a) * 130, .4, from(['#ffd27a', '#7dffc7'])); },
      burst(c) { ring(c.x, c.y, 45, 190, ['#1fc98b', '#7dffc7', '#ffd27a']); bang(.2, 3000, .4); },
    },
    anar: {
      pts: 15, r: 28, life: 2.2, weight: 24,
      place: () => ({ x: rnd(50, W - 50), y: rnd(H * .45, H * .8) }),
      draw() {
        g.beginPath(); g.moveTo(-6, -22); g.lineTo(6, -22); g.lineTo(20, 20); g.lineTo(-20, 20); g.closePath();
        g.fillStyle = '#ff8a1f'; g.fill();
        fillBox(-13, -2, 26, 6, '#fff4d6');
        fillBox(-17, 10, 34, 5, '#c92a5b');
      },
      emit(c) { spark(c.x + rnd(-3, 3), c.y - 22, rnd(-50, 50), -rnd(120, 230), .6, from(['#ffd27a', '#ffffff']), 300); },
      burst(c) { fountain(c.x, c.y - 20, 70, 540, ['#ffd27a', '#ff8a1f', '#ffffff', '#ffe9a8']); bang(.35, 1800, .45); },
    },
    rocket: {
      pts: 25, r: 26, life: 4, weight: 14,
      place: () => ({ x: rnd(40, W - 40), y: H + 30, vx: rnd(-30, 30), vy: -rnd(.34, .46) * H }),
      draw() {
        fillBox(-2, 8, 4, 22, '#c9a06a');
        fillBox(-9, -14, 18, 24, '#4d8dff');
        fillBox(-9, -4, 18, 5, '#fff4d6');
        g.beginPath(); g.moveTo(-9, -14); g.lineTo(0, -30); g.lineTo(9, -14); g.fillStyle = '#ff4d6d'; g.fill();
      },
      emit(c) { spark(c.x, c.y + 28, rnd(-25, 25), rnd(60, 160), .35, from(['#ffb13c', '#fff4d6']), 0); },
      burst(c) { ring(c.x, c.y, 90, 300, ['#4d8dff', '#a6c8ff', '#ffffff', '#ff4d6d']); bang(.5, 2200, .6); },
    },
    bomb: {
      pts: 40, r: 26, life: 1.3, weight: 12,
      place: () => ({ x: rnd(50, W - 50), y: rnd(H * .22, H * .75) }),
      draw(t, life) {
        g.fillStyle = '#d6242f'; g.beginPath(); g.arc(0, 4, 21, 0, 6.28); g.fill();
        fillBox(-21, 0, 42, 6, '#ffd27a');
        const fuse = 18 * (1 - Math.min(t / life, 1)) + 3;
        g.strokeStyle = '#e8dcc0'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, -16); g.lineTo(0, -16 - fuse); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -16 - fuse, 3.5, 0, 6.28); g.fill();
      },
      burst(c) {
        ring(c.x, c.y, 130, 400, ['#ffffff', '#ffd27a', '#ff5a36'], 1);
        shake = 10; buzz(60); bang(.7, 1200, .9);
      },
    },
    ladi: {
      pts: 30, r: 34, life: 2.4, weight: 12,
      place: () => ({ x: rnd(50, W - 50), y: rnd(H * .25, H * .7), vy: 26 * S }),
      draw(t) {
        g.rotate(Math.sin(t * 3) * .12);
        g.strokeStyle = '#e8dcc0'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 30); g.stroke();
        for (let i = 0; i < 6; i++) {
          g.save(); g.translate(0, -25 + i * 10); g.rotate(i % 2 ? .5 : -.5);
          fillBox(-14, -3, 28, 6.5, i % 2 ? '#ff3f4f' : '#ffb13c');
          g.restore();
        }
      },
      burst(c) {
        for (let i = 0; i < 6; i++) later.push({ at: i * .09, x: c.x + rnd(-8, 8), y: c.y + 25 - i * 10 });
      },
    },
    dud: {
      pts: -20, r: 24, life: 2.4, weight: 14,
      place: () => ({ x: rnd(50, W - 50), y: rnd(H * .25, H * .8) }),
      draw() {
        fillBox(-10, -16, 20, 34, '#7b7f8c');
        fillBox(-10, -6, 20, 5, '#5b5f6b');
        g.strokeStyle = '#555'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(10, -30, 16, -16); g.stroke();
        g.fillStyle = '#7fc8ff';
        for (const [x, y] of [[-17, -4], [16, 6], [-15, 14]]) {
          g.beginPath(); g.moveTo(x, y - 7); g.quadraticCurveTo(x + 5, y, x, y + 2); g.quadraticCurveTo(x - 5, y, x, y - 7); g.fill();
        }
      },
      burst(c) { ring(c.x, c.y, 12, 60, ['#9aa0ad', '#7fc8ff'], .6, 320); buzz(30); bang(.25, 350, .4); },
    },
  };
  const KEYS = Object.keys(TYPES);
  const TOTAL = KEYS.reduce((n, k) => n + TYPES[k].weight, 0);

  function spawn(items) {
    let r = Math.random() * TOTAL, key = KEYS[0];
    for (const k of KEYS) { if ((r -= TYPES[k].weight) < 0) { key = k; break; } }
    const type = TYPES[key];
    for (let tries = 0; tries < 8; tries++) {
      const c = { key, type, r: type.r, age: 0, life: type.life, vx: 0, vy: 0, ...type.place() };
      if (!items.some(o => Math.hypot(o.x - c.x, o.y - c.y) < 75)) { items.push(c); return; }
    }
  }

  function drawCracker(c) {
    g.save();
    g.translate(c.x, c.y);
    g.globalAlpha = Math.min(1, (c.life - c.age) / .3);
    g.scale(S ** .5, S ** .5);
    c.type.draw(c.age, c.life);
    g.restore();
  }

  /* ---------- scenery ---------- */
  const stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * .7, rnd(0, 6)]);
  function scenery(t) {
    g.fillStyle = '#fff';
    for (const [x, y, p] of stars) {
      g.globalAlpha = .25 + .35 * Math.abs(Math.sin(t * .8 + p));
      g.fillRect(x * W, y * H, 1.6, 1.6);
    }
    const n = Math.max(3, Math.round(W / 75)), y = H - 16;
    for (let i = 0; i < n; i++) {
      const x = (i + .5) * W / n, fl = Math.sin(t * 9 + i * 2) * 1.5;
      g.globalAlpha = .18; g.fillStyle = '#ff9d3c';
      g.beginPath(); g.arc(x, y - 12, 20 + fl, 0, 6.28); g.fill();
      g.globalAlpha = 1; g.fillStyle = '#ffc24d';
      g.beginPath(); g.ellipse(x, y - 14 - fl / 2, 4, 9 + fl, 0, 0, 6.28); g.fill();
      g.fillStyle = '#b5532a';
      g.beginPath(); g.ellipse(x, y - 3, 15, 7, 0, 0, 3.15); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* ---------- game state ---------- */
  let state = 'menu', score = 0, timeLeft = ROUND, crackers = [], nextSpawn = 0, nextAmbient = 0;

  function begin() {
    initAudio();
    score = 0; timeLeft = ROUND; crackers = []; floats = []; later = []; nextSpawn = 0;
    state = 'play';
    $('panel').hidden = true; $('hud').hidden = false;
    drawHud();
  }
  function finish() {
    state = 'end';
    crackers = []; later = [];
    $('hud').hidden = true; $('panel').hidden = false;
    $('legend').hidden = true; $('tagline').hidden = true; $('result').hidden = false;
    $('final').textContent = T.num(score);
    $('play').textContent = T.again;
    refreshShare();
    // Frantic tapping at the buzzer must not land on Play again by accident.
    $('panel').classList.add('locked');
    setTimeout(() => $('panel').classList.remove('locked'), 800);
  }
  function drawHud() {
    $('score').textContent = T.num(score);
    $('time').textContent = T.num(Math.ceil(timeLeft));
    $('time').parentElement.classList.toggle('low', timeLeft <= 5);
  }
  function refreshShare() {
    $('share').href = shareHref(T, location.origin + location.pathname, cleanName($('name').value), state === 'end' ? score : null);
  }

  sky.addEventListener('pointerdown', e => {
    if (state !== 'play') return;
    const c = pick(crackers, e.clientX, e.clientY);
    if (!c) return;
    crackers.splice(crackers.indexOf(c), 1);
    c.type.burst(c);
    score = nextScore(score, c.type.pts);
    floats.push({
      x: Math.min(W - 70, Math.max(70, c.x)), y: c.y - 30, age: 0,
      text: `${c.type.pts > 0 ? '+' : '−'}${T.num(Math.abs(c.type.pts))} ${T.names[c.key]}`,
      color: c.type.pts > 0 ? '#ffe9a8' : '#ff8d80',
    });
    drawHud();
  });

  /* ---------- main loop ---------- */
  let last = performance.now();
  function frame(now) {
    // Clamped so a backgrounded tab pauses the round instead of eating the clock.
    const dt = Math.min((now - last) / 1000, .05), t = now / 1000;
    last = now;

    if (state === 'play') {
      timeLeft -= dt;
      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn(crackers);
        const p = 1 - timeLeft / ROUND;
        nextSpawn = .72 - .42 * p; // ramps up over the round
      }
      const shown = Math.ceil(timeLeft);
      if (shown !== frame.shown) { frame.shown = shown; drawHud(); }
      if (timeLeft <= 0) finish();
    } else if (!calm && (nextAmbient -= dt) <= 0) {
      nextAmbient = rnd(.7, 1.5);
      ring(rnd(W * .1, W * .9), rnd(H * .08, H * .5), 70, 240, from([['#ffd27a', '#fff'], ['#ff5fa2', '#ffd1e3'], ['#7dffc7', '#fff'], ['#a6c8ff', '#fff']]), 1.1, 120);
    }

    for (const c of crackers) {
      c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.key === 'chakri' && (c.x < 30 || c.x > W - 30)) c.vx *= -1;
      if (c.type.emit && Math.random() < .6) c.type.emit(c);
    }
    crackers = crackers.filter(c => c.age < c.life && c.y > -50);

    for (const l of later) {
      if ((l.at -= dt) <= 0) { ring(l.x, l.y, 22, 170, ['#ff3f4f', '#ffb13c', '#fff'], .55); bang(.09, 4200, .45); }
    }
    later = later.filter(l => l.at > 0);

    g.clearRect(0, 0, W, H);
    g.save();
    if (shake > .3) { g.translate(rnd(-shake, shake), rnd(-shake, shake)); shake *= .86; }
    scenery(t);
    crackers.forEach(drawCracker);

    // Streaks instead of a fading canvas: no ghost smears on dark screens.
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const p of parts) {
      p.age += dt; p.vy += p.grav * dt; p.vx *= .985; p.vy *= .985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = Math.max(0, 1 - p.age / p.life);
      g.strokeStyle = p.color; g.lineWidth = p.size;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); g.stroke();
    }
    parts = parts.filter(p => p.age < p.life);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    g.textAlign = 'center';
    g.font = '700 18px system-ui, -apple-system, "Noto Sans Bengali", "Kohinoor Bangla", sans-serif';
    for (const f of floats) {
      f.age += dt;
      g.globalAlpha = Math.max(0, 1 - f.age / .9);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y - f.age * 45);
    }
    floats = floats.filter(f => f.age < .9);
    g.globalAlpha = 1;
    g.restore();
    requestAnimationFrame(frame);
  }

  /* ---------- screen text ---------- */
  $('title').textContent = T.title;
  $('tagline').textContent = T.tagline;
  $('play').textContent = T.play;
  $('share').textContent = T.share;
  $('scoreLabel').textContent = T.score;
  $('timeLabel').textContent = T.time;
  $('overLabel').textContent = T.over;

  const sender = T.named ? cleanName(new URLSearchParams(location.search).get('from')) : '';
  if (sender) { $('from').textContent = T.from(sender); $('from').hidden = false; }
  if (T.named) { $('nameLabel').textContent = T.nameLabel; $('nameBox').hidden = false; }

  for (const k of KEYS) {
    const li = document.createElement('li'), cv = document.createElement('canvas');
    cv.width = cv.height = 104;
    const ctx = cv.getContext('2d');
    ctx.translate(52, 52); ctx.scale(1.5, 1.5);
    drawIcon(TYPES[k], ctx);
    li.append(cv, T.names[k]);
    const b = document.createElement('b');
    b.textContent = `${TYPES[k].pts > 0 ? '+' : '−'}${T.num(Math.abs(TYPES[k].pts))}`;
    li.append(b);
    if (TYPES[k].pts < 0) li.className = 'bad';
    $('legend').append(li);
  }

  function drawIcon(type, ctx) {
    // draw() paints on the shared context, so point it at the icon for one call.
    const main = g;
    g = ctx;
    type.draw(0, type.life);
    g = main;
  }

  const paintMute = () => { $('mute').textContent = muted ? `🔇 ${T.sound}` : `🔊 ${T.mute}`; };
  $('mute').addEventListener('click', () => { muted = !muted; paintMute(); });
  paintMute();

  $('play').addEventListener('click', begin);
  $('name').addEventListener('input', refreshShare);
  refreshShare();
  requestAnimationFrame(frame);
}
