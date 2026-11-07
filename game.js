const ROUND = 30, TAP_SLOP = 14, MAX_PARTICLES = 500;

const nextScore = (score, pts) => Math.max(0, score + pts);
const cleanName = s => [...String(s || '').replace(/[\/\\]/g, ' ').trim()].slice(0, 30).join(''); // a slash would break the /from/name link
const rankFor = (ranks, score) => ranks.reduce((got, [min, name]) => (score >= min ? name : got), ranks[0][1]);

function pick(items, x, y) {
  let best = null, bestD = Infinity;
  for (const c of items) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d <= c.hitR && d < bestD) { best = c; bestD = d; }
  }
  return best;
}

function shareHref(T, base, name, score) {
  const link = name ? `${base}from/${encodeURIComponent(name)}` : base;
  const msg = score == null ? T.invite(name) : T.brag(T.num(score), name, rankFor(T.ranks, score));
  return `https://wa.me/?text=${encodeURIComponent(`${msg} ${link}`.trim())}`;
}

if (typeof module !== 'undefined') module.exports = { nextScore, cleanName, pick, shareHref, rankFor };
if (typeof document !== 'undefined') start(window.T);

function start(T) {
  T.num = n => n.toLocaleString(T.locale);
  const $ = id => document.getElementById(id);
  const stage = $('stage'), sky = $('sky'), g = sky.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(pointer: coarse)').matches;
  let W, H, S, sideways = false, art = { s: 1, ox: 0, oy: 0 };

  function resize() {
    sideways = phone && innerWidth > innerHeight;
    $('turn').hidden = !sideways; // browsers cannot lock an iPhone's rotation, so ask and pause instead
    H = innerHeight; W = Math.min(innerWidth, Math.round(H * .62)); // a computer gets a phone-shaped column
    S = Math.min(W / 390, H / 720, 1.7);
    stage.style.width = W + 'px'; stage.style.height = H + 'px';
    stage.style.left = (innerWidth - W) / 2 + 'px';
    stage.style.setProperty('--u', S + 'px');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    sky.width = W * dpr; sky.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Same fit as the CSS background (cover, centre bottom), so flames sit on the painted diyas.
    const s = Math.max(W / 900, H / 1800);
    art = { s, ox: (W - 900 * s) / 2, oy: H - 1800 * s };
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 250));
  resize();

  /* ---------- sound ---------- */
  // Streamed through an element, not decoded whole: a full song decoded in memory can crash a budget phone.
  const track = new Audio('Dancing_Under_Clay_Lamps.mp3');
  track.loop = true;
  let ac, noise, sfx, musicOn = true, soundOn = true;
  function initAudio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ac = new AC();
        noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        sfx = ac.createGain(); sfx.gain.value = soundOn ? 1 : 0; sfx.connect(ac.destination);
      }
    }
    if (ac) ac.resume();
    if (musicOn && track.paused) track.play().catch(() => {}); // retried on the next tap if the browser says not yet
  }
  // Without this the music keeps playing over WhatsApp once someone taps Send.
  function quiet(off) {
    if (off) { track.pause(); if (ac) ac.suspend(); }
    else if (ac) { ac.resume(); if (musicOn) track.play().catch(() => {}); }
  }
  document.addEventListener('visibilitychange', () => quiet(document.hidden));
  addEventListener('pagehide', () => quiet(true));
  // iPhones only allow audio to start on a finished tap, other phones as soon as the finger lands.
  for (const type of ['pointerdown', 'click']) stage.addEventListener(type, initAudio, { capture: true });

  function bang(dur, cutoff, vol) {
    if (!ac) return;
    const now = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
    src.buffer = noise;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, now);
    f.frequency.exponentialRampToValueAtTime(70, now + dur);
    v.gain.setValueAtTime(vol, now);
    v.gain.exponentialRampToValueAtTime(.001, now + dur);
    src.connect(f); f.connect(v); v.connect(sfx);
    src.start(now, Math.random() * .5, dur);
  }
  function thump(from, to, dur, vol) {
    if (!ac) return;
    const now = ac.currentTime, o = ac.createOscillator(), v = ac.createGain();
    o.frequency.setValueAtTime(from, now);
    o.frequency.exponentialRampToValueAtTime(to, now + dur);
    v.gain.setValueAtTime(vol, now);
    v.gain.exponentialRampToValueAtTime(.001, now + dur);
    o.connect(v); v.connect(sfx);
    o.start(now); o.stop(now + dur);
  }
  const buzz = ms => navigator.vibrate && navigator.vibrate(ms);

  /* ---------- effects ---------- */
  const glows = new Map();
  function glow(color) {
    if (glows.has(color)) return glows.get(color);
    const cv = document.createElement('canvas'), c = cv.getContext('2d');
    cv.width = cv.height = 128;
    const grad = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, color); grad.addColorStop(1, color + '00');
    c.fillStyle = grad; c.fillRect(0, 0, 128, 128);
    glows.set(color, cv);
    return cv;
  }
  const drawGlow = (color, x, y, r) => g.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
  let parts = [], floats = [], flashes = [], petals = [], later = [], shake = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const from = list => list[Math.random() * list.length | 0];

  function spark(x, y, vx, vy, life, color, grav = 240, size = 2.4) {
    if (parts.length < MAX_PARTICLES) parts.push({ x, y, vx, vy, age: 0, life, color, grav, size: size * S });
  }
  function ring(x, y, n, speed, colors, life = 1, grav = 170) {
    flashes.push({ x, y, age: 0, r: speed * S * .42, color: colors[0] });
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283), v = speed * S * rnd(.25, 1);
      spark(x, y, Math.cos(a) * v, Math.sin(a) * v, life * rnd(.55, 1), from(colors), grav * S);
    }
  }
  function fountain(x, y, n, speed, colors) {
    flashes.push({ x, y, age: 0, r: 60 * S, color: colors[0] });
    for (let i = 0; i < n; i++) {
      const a = -1.571 + rnd(-.42, .42), v = speed * S * rnd(.45, 1);
      spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(.6, 1.2), from(colors), 460 * S);
    }
  }

  /* ---------- crackers ---------- */
  const TYPES = {
    chakri: {
      pts: 10, size: 84, r: 36, life: 2.6, weight: 28,
      place: () => ({ x: rnd(55 * S, W - 55 * S), y: rnd(H * .22, H * .82), vx: from([-1, 1]) * rnd(30, 70) * S }),
      spin: 10,
      emit(c) { const a = c.age * 10, q = 40 * S; spark(c.x + Math.cos(a) * q, c.y + Math.sin(a) * q, -Math.sin(a) * 170 * S, Math.cos(a) * 170 * S, .45, from(['#ffd65c', '#ff5fa2', '#fff']), 120 * S); },
      burst(c) { ring(c.x, c.y, 54, 210, ['#ff5fa2', '#ffd65c', '#7dffc7', '#fff']); bang(.22, 3200, .4); },
    },
    anar: {
      pts: 15, size: 86, r: 36, life: 2.3, weight: 24,
      place: () => ({ x: rnd(55 * S, W - 55 * S), y: rnd(H * .45, H * .84) }),
      emit(c) { spark(c.x + rnd(-3, 3) * S, c.y - 38 * S, rnd(-44, 44) * S, -rnd(120, 240) * S, .6, from(['#ffd65c', '#fff', '#ff9a1a']), 300 * S); },
      burst(c) { fountain(c.x, c.y - 30 * S, 86, 520, ['#ffd65c', '#ff9a1a', '#fff', '#ffe89e']); bang(.4, 1900, .46); },
    },
    rocket: {
      pts: 25, size: 94, r: 36, life: 4, weight: 14,
      place: () => ({ x: rnd(70 * S, W - 70 * S), y: H + 50 * S, vx: rnd(-20, 20) * S, vy: -rnd(.36, .46) * H }),
      emit(c) { spark(c.x, c.y + 24 * S, rnd(-24, 24) * S, rnd(70, 170) * S, .38, from(['#ffb13c', '#fff4d6', '#ff5a36']), 0); },
      burst(c) { ring(c.x, c.y, 104, 320, ['#7dffc7', '#39c9c2', '#fff', '#ffd65c']); thump(900, 240, .22, .16); bang(.5, 2300, .55); },
    },
    bomb: {
      pts: 40, size: 84, r: 36, life: 1.35, weight: 12,
      place: () => ({ x: rnd(55 * S, W - 55 * S), y: rnd(H * .22, H * .78) }),
      emit(c) { spark(c.x + 11 * S, c.y - 33 * S, rnd(-70, 70) * S, rnd(-80, 20) * S, .3, from(['#fff', '#ffd65c']), 180 * S); },
      burst(c) {
        ring(c.x, c.y, 150, 430, ['#fff4d6', '#ffd65c', '#ff5a36', '#ff9a1a'], 1.1);
        shake = 12 * S; buzz(70); thump(120, 42, .55, .75); bang(.7, 1300, .85);
      },
    },
    ladi: {
      pts: 30, size: 98, r: 40, life: 2.5, weight: 12,
      place: () => ({ x: rnd(55 * S, W - 55 * S), y: rnd(H * .22, H * .72), vy: 20 * S }),
      sway: true,
      burst(c) { for (let i = 0; i < 8; i++) later.push({ at: i * .075, x: c.x + rnd(-14, 14) * S, y: c.y + (38 - i * 11) * S }); },
    },
    dud: {
      pts: -20, size: 82, r: 32, life: 2.5, weight: 14,
      place: () => ({ x: rnd(55 * S, W - 55 * S), y: rnd(H * .22, H * .84) }),
      burst(c) { for (let i = 0; i < 14; i++) spark(c.x, c.y, rnd(-50, 50) * S, rnd(-50, 5) * S, .7, from(['#9aa0ad', '#6fc4ff']), 300 * S, 3); buzz(30); bang(.3, 340, .45); },
    },
  };
  const KEYS = Object.keys(TYPES);
  const TOTAL = KEYS.reduce((n, k) => n + TYPES[k].weight, 0);

  // Rasterised once: redrawing SVG every frame would stutter on a budget phone.
  for (const k of KEYS) {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 240;
      cv.getContext('2d').drawImage(img, 0, 0, 240, 240);
      TYPES[k].sprite = cv;
    };
    img.src = `art/${k}.svg`;
  }

  function spawn(items) {
    let r = Math.random() * TOTAL, key = KEYS[0];
    for (const k of KEYS) { if ((r -= TYPES[k].weight) < 0) { key = k; break; } }
    const type = TYPES[key];
    for (let tries = 0; tries < 8; tries++) {
      const c = { key, type, hitR: type.r * S + TAP_SLOP, age: 0, life: type.life, vx: 0, vy: 0, ...type.place() };
      if (!items.some(o => Math.hypot(o.x - c.x, o.y - c.y) < 88 * S)) { items.push(c); return; }
    }
  }
  function drawCracker(c) {
    const t = c.type;
    if (!t.sprite) return;
    const pop = Math.min(1, c.age / .12), d = t.size * S * (.7 + .3 * pop);
    g.save();
    g.translate(c.x, c.y);
    g.globalAlpha = Math.min(1, (c.life - c.age) / .3);
    if (t.spin) g.rotate(c.age * t.spin);
    if (t.sway) g.rotate(Math.sin(c.age * 3) * .1);
    g.drawImage(t.sprite, -d / 2, -d / 2, d, d);
    g.restore();
  }

  /* ---------- living parts of the painted scene ---------- */
  const DIYAS = [100, 275, 450, 625, 800].map((x, i) => [x, 1680 + (i % 2) * 34]);
  function flames(t) {
    const k = art.s * 1.45;
    DIYAS.forEach(([ax, ay], i) => {
      const x = art.ox + ax * art.s, y = art.oy + ay * art.s;
      const f = Math.sin(t * 8.5 + i * 2.1) * .5 + Math.sin(t * 13 + i) * .3, h = (34 + f * 5) * k, w = (11 - f) * k, lean = Math.sin(t * 2.3 + i) * 2.5 * k;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = .4 + f * .08;
      drawGlow('#ff9a1a', x, y - h * .5, 52 * k);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1; g.fillStyle = '#ffb52e';
      g.beginPath(); g.moveTo(x + lean, y - 2 * k - h);
      g.bezierCurveTo(x + w * 1.2, y - h * .45, x + w, y - 2 * k, x, y - 2 * k);
      g.bezierCurveTo(x - w, y - 2 * k, x - w * 1.2, y - h * .45, x + lean, y - 2 * k - h); g.fill();
      g.strokeStyle = '#2a0a1e'; g.lineWidth = 2.4 * k; g.stroke();
      g.fillStyle = '#fff5c4';
      g.beginPath(); g.ellipse(x, y - 9 * k, w * .42, h * .28, 0, 0, 6.283); g.fill();
    });
    g.globalAlpha = 1;
  }
  function drawPetals(dt) {
    if (!calm && state !== 'play' && Math.random() < .09 && petals.length < 40) {
      petals.push({ x: rnd(0, W), y: -10, vy: rnd(26, 58) * S, sway: rnd(0, 6), r: rnd(3, 6) * S, color: from(['#ff9a1a', '#ffc531', '#e86a00', '#e0156f']) });
    }
    for (const p of petals) {
      p.y += p.vy * dt; p.sway += dt * 1.6;
      g.fillStyle = p.color;
      g.beginPath(); g.ellipse(p.x + Math.sin(p.sway) * 16 * S, p.y, p.r, p.r * .55, p.sway, 0, 6.283); g.fill();
    }
    petals = petals.filter(p => p.y < H + 10);
  }
  function drawFuse(t) {
    const x0 = 22 * S, x1 = W - 22 * S, y = 72 * S, tip = x0 + (x1 - x0) * Math.max(0, timeLeft / ROUND);
    g.lineCap = 'round';
    g.strokeStyle = '#3a1208'; g.lineWidth = 7 * S; g.beginPath(); g.moveTo(x0, y); g.lineTo(tip, y); g.stroke();
    g.strokeStyle = '#e8b23e'; g.lineWidth = 3.5 * S; g.setLineDash([7 * S, 6 * S]);
    g.beginPath(); g.moveTo(x0, y); g.lineTo(tip, y); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(tip, y, (4.5 + Math.sin(t * 30)) * S, 0, 6.283); g.fill();
    if (Math.random() < .7) spark(tip, y, rnd(-90, 90) * S, rnd(-90, 40) * S, .35, from(['#ffd65c', '#fff', '#ff9a1a']), 260 * S);
  }

  /* ---------- game state ---------- */
  let state = 'menu', score = 0, timeLeft = ROUND, crackers = [], nextSpawn = 0, nextAmbient = 1, myName = '';

  function begin() {
    initAudio();
    score = 0; timeLeft = ROUND; crackers = []; floats = []; later = []; petals = []; nextSpawn = .3;
    state = 'play';
    stage.classList.add('playing');
    $('panel').hidden = true; $('hud').hidden = false;
    drawHud();
  }
  function finish() {
    state = 'end';
    crackers = []; later = [];
    stage.classList.remove('playing');
    $('hud').hidden = true; $('panel').hidden = false;
    $('legend').hidden = true; $('tagline').hidden = true; $('result').hidden = false;
    $('final').textContent = T.num(score);
    $('rank').textContent = rankFor(T.ranks, score);
    $('play').textContent = T.again;
    refreshShare();
    // Frantic tapping at the buzzer must not land on Play Again by accident.
    $('panel').classList.add('locked');
    setTimeout(() => $('panel').classList.remove('locked'), 800);
  }
  function drawHud() {
    $('score').textContent = T.num(score);
    $('time').textContent = T.num(Math.max(0, Math.ceil(timeLeft)));
    $('timeBox').classList.toggle('low', timeLeft <= 5);
  }
  function refreshShare() {
    // document.baseURI, because a /from/name page sets <base> to the site root
    const home = T.named ? new URL('.', document.baseURI).href : location.origin + location.pathname;
    const href = shareHref(T, home, myName, state === 'end' ? score : null);
    $('share').href = href;
    if (T.named) $('nameSend').href = href;
  }

  sky.addEventListener('pointerdown', e => {
    if (state !== 'play') return;
    const c = pick(crackers, e.clientX - stage.offsetLeft, e.clientY);
    if (!c) return;
    crackers.splice(crackers.indexOf(c), 1);
    c.type.burst(c);
    score = nextScore(score, c.type.pts);
    floats.push({
      x: Math.min(W - 70 * S, Math.max(70 * S, c.x)), y: Math.max(112 * S, c.y - 34 * S), age: 0,
      shout: T.shouts[c.key],
      pts: `${c.type.pts > 0 ? '+' : '−'}${T.num(Math.abs(c.type.pts))}`,
      color: c.type.pts > 0 ? '#ffe089' : '#a9d4ff',
    });
    drawHud();
  });

  /* ---------- main loop ---------- */
  let last = performance.now(), shownSec = 0;
  function frame(now) {
    // Clamped so a backgrounded tab pauses the round instead of eating the clock.
    const dt = Math.min((now - last) / 1000, .05), t = now / 1000;
    last = now;

    if (state === 'play' && !sideways) {
      timeLeft -= dt;
      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn(crackers);
        nextSpawn = .68 - .36 * (1 - timeLeft / ROUND); // the round gets busier as it goes
      }
      if (Math.ceil(timeLeft) !== shownSec) { shownSec = Math.ceil(timeLeft); drawHud(); }
      if (timeLeft <= 0) finish();
    } else if (state !== 'play' && !calm && (nextAmbient -= dt) <= 0) {
      nextAmbient = rnd(.5, 1.3);
      ring(rnd(W * .08, W * .92), rnd(H * .1, H * .34), 70, 170, from([['#ffd65c', '#fff'], ['#ff5fa2', '#ffd1e3', '#fff'], ['#7dffc7', '#fff'], ['#ff9a1a', '#ffd65c']]), 1.2, 95);
    }

    if (!sideways) for (const c of crackers) {
      c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.key === 'chakri' && (c.x < 50 * S || c.x > W - 50 * S)) c.vx *= -1;
      if (c.type.emit && Math.random() < .65) c.type.emit(c);
    }
    crackers = crackers.filter(c => c.age < c.life && c.y > -60 * S);

    for (const l of later) {
      if ((l.at -= dt) <= 0) { ring(l.x, l.y, 26, 190, ['#ff3f4f', '#ffb13c', '#fff'], .55); bang(.08, 4600, .42); }
    }
    later = later.filter(l => l.at > 0);

    g.clearRect(0, 0, W, H);
    g.save();
    if (shake > .3) { g.translate(rnd(-shake, shake), rnd(-shake, shake)); shake *= .86; }
    flames(t);
    drawPetals(dt);
    crackers.forEach(drawCracker);
    if (state === 'play') drawFuse(t);

    // Streaks instead of a fading canvas: no ghost smears on dark screens.
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const f of flashes) {
      f.age += dt;
      g.globalAlpha = Math.max(0, .8 * (1 - f.age / .22));
      drawGlow(f.color, f.x, f.y, f.r * (1.2 + f.age * 4));
    }
    flashes = flashes.filter(f => f.age < .22);
    for (const p of parts) {
      p.age += dt; p.vy += p.grav * dt; p.vx *= .985; p.vy *= .985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = Math.max(0, 1 - p.age / p.life);
      g.strokeStyle = p.color; g.lineWidth = p.size;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); g.stroke();
    }
    parts = parts.filter(p => p.age < p.life);
    g.globalCompositeOperation = 'source-over';

    const title = getComputedStyle(stage).getPropertyValue('--title');
    g.textAlign = 'center';
    g.lineJoin = 'round';
    for (const f of floats) {
      f.age += dt;
      const y = f.y - f.age * 34 * S, pop = Math.min(1, f.age / .1);
      g.globalAlpha = Math.max(0, 1 - (f.age - .5) / .4);
      g.font = `400 ${(26 + 6 * pop) * S}px ${title}, serif`;
      g.lineWidth = 6 * S; g.strokeStyle = '#3a0a1c'; g.strokeText(f.shout, f.x, y);
      g.fillStyle = f.color; g.fillText(f.shout, f.x, y);
      g.font = `800 ${19 * S}px "Baloo Da 2", sans-serif`;
      g.lineWidth = 4 * S; g.strokeText(f.pts, f.x, y + 22 * S);
      g.fillStyle = '#fff'; g.fillText(f.pts, f.x, y + 22 * S);
    }
    floats = floats.filter(f => f.age < .9);
    g.globalAlpha = 1;
    g.restore();
    requestAnimationFrame(frame);
  }

  /* ---------- screen text ---------- */
  $('title').textContent = T.title;
  $('tagline').textContent = T.tagline || '';
  $('tagline').hidden = !T.tagline;
  $('play').textContent = T.play;
  $('share').textContent = T.share;
  $('scoreLabel').textContent = T.score;
  $('timeLabel').textContent = T.time;
  $('overLabel').textContent = T.over;

  const fromPath = location.pathname.match(/\/from\/([^/]+)/);
  const sender = T.named ? cleanName(fromPath ? decodeURIComponent(fromPath[1]) : new URLSearchParams(location.search).get('from')) : '';
  if (sender) { $('from').textContent = T.from(sender); $('from').hidden = false; }
  if (T.named && $('nameDialog').showModal) {
    const dlg = $('nameDialog');
    $('nameTitle').textContent = T.nameTitle;
    $('nameLabel').textContent = T.nameLabel;
    $('nameSend').textContent = T.share;
    $('nameCancel').textContent = T.nameCancel;
    $('share').addEventListener('click', e => {
      e.preventDefault(); // the plain link stays underneath for browsers without dialogs
      refreshShare();
      dlg.showModal();
    });
    $('nameInput').addEventListener('input', () => { myName = cleanName($('nameInput').value); refreshShare(); });
    $('nameForm').addEventListener('submit', e => { e.preventDefault(); $('nameSend').click(); });
    $('nameSend').addEventListener('click', () => dlg.close());
    $('nameCancel').addEventListener('click', () => dlg.close());
  }

  for (const k of KEYS) {
    const li = document.createElement('li'), img = document.createElement('img'), b = document.createElement('b');
    img.src = `art/${k}.svg`; img.alt = '';
    b.textContent = `${TYPES[k].pts > 0 ? '+' : '−'}${T.num(Math.abs(TYPES[k].pts))}`;
    li.append(img, T.names[k], b);
    if (TYPES[k].pts < 0) li.className = 'bad';
    $('legend').append(li);
  }

  /* ---------- music and sound switches ---------- */
  function paintSwitch(btn, on, label) {
    btn.classList.toggle('off', !on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', label);
  }
  const paintSwitches = () => {
    paintSwitch($('musicBtn'), musicOn, musicOn ? T.musicOff : T.musicOn);
    paintSwitch($('soundBtn'), soundOn, soundOn ? T.soundOff : T.soundOn);
  };
  $('musicBtn').addEventListener('click', () => {
    musicOn = !musicOn;
    if (musicOn) track.play().catch(() => {}); else track.pause();
    paintSwitches();
  });
  $('soundBtn').addEventListener('click', () => {
    soundOn = !soundOn;
    if (sfx) sfx.gain.value = soundOn ? 1 : 0;
    paintSwitches();
  });
  paintSwitches();

  $('play').addEventListener('click', begin);
  refreshShare();
  requestAnimationFrame(frame);
}
