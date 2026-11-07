// Original festive loop in Raga Bhupali over an 8-beat keherwa: reed melody, santoor, tanpura, dholak, manjira.
// Rendered off the main thread while the page loads, so it starts on the first tap and nothing is downloaded.
async function renderMusic() {
  const SR = 32000, M = .25, CYCLE = 8 * M, CYCLES = 8, LEN = CYCLE * CYCLES, TAIL = 1.5, SA = 293.66;
  const ctx = new OfflineAudioContext(2, Math.ceil((LEN + TAIL) * SR), SR);
  const hz = s => SA * 2 ** (s / 12);

  const dry = ctx.createGain(); dry.connect(ctx.destination);
  const verb = ctx.createConvolver();
  const ir = ctx.createBuffer(2, SR * 1.3, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; }
  verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .22; verb.connect(wet); wet.connect(ctx.destination);

  const noise = ctx.createBuffer(1, SR, SR);
  const nd = noise.getChannelData(0); for (let i = 0; i < SR; i++) nd[i] = Math.random() * 2 - 1;

  function out(gainNode, pan = 0, send = .6) {
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    gainNode.connect(p); p.connect(dry);
    const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(verb);
  }
  function hit(t, type, freq, Q, dur, vol, pan = 0) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = Q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    src.connect(f); f.connect(g); out(g, pan, .25);
    src.start(t, Math.random() * .7, dur + .02);
  }
  function drum(t, from, to, dur, vol, pan = 0, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur * .7);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); out(g, pan, .2);
    o.start(t); o.stop(t + dur + .02);
  }

  /* dholak and manjira: dha ge na ti | na ka dhi na */
  const dha = (t, v) => { drum(t, 150, 72, .3, .62 * v, -.12); drum(t, 460, 400, .1, .22 * v, .14); };
  const ge = (t, v) => drum(t, 128, 70, .22, .46 * v, -.12);
  const na = (t, v) => { drum(t, 520, 455, .09, .27 * v, .14); hit(t, 'bandpass', 2300, 2, .05, .1 * v, .14); };
  const ka = (t, v) => hit(t, 'bandpass', 1500, 1.5, .05, .17 * v, .1);
  const bols = [dha, ge, na, ka, na, ka, dha, na];
  for (let c = 0; c < CYCLES; c++) for (let m = 0; m < 8; m++) {
    const t = (c * 8 + m) * M + (m % 2 ? .012 : 0); // slight lilt, a dead-straight grid sounds like a machine
    const v = (m === 0 ? 1 : .86) * (.92 + Math.random() * .08);
    bols[m](t, v);
    if (m % 2 === 0) { hit(t, 'highpass', 6500, .7, m === 0 ? .32 : .13, m === 0 ? .1 : .06, .3); }
    if (c % 2 === 1 && m === 7) { na(t + M / 2, .8); } // little fill at the end of every other cycle
  }

  /* tanpura: Pa Sa Sa low-Sa, one pluck a beat group */
  [-5, 0, 0, -12].forEach((s, i, all) => {
    for (let t = i * CYCLE / all.length; t < LEN; t += CYCLE) for (const det of [-3, 3]) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = hz(s - 12); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .04); g.gain.exponentialRampToValueAtTime(.008, t + 1.6);
      g.gain.linearRampToValueAtTime(0, t + 1.9);
      o.connect(f); f.connect(g); out(g, -.35, .5);
      o.start(t); o.stop(t + 1.95);
    }
  });

  /* santoor: quick struck strings; tune follows the phrase */
  function pluck(t, s, vol, pan) {
    [[1, 1, .55], [2, .42, .3], [3.01, .2, .16], [4.2, .08, .08]].forEach(([k, amp, dur]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = hz(s) * k;
      g.gain.setValueAtTime(vol * amp, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
      o.connect(g); out(g, pan, .7);
      o.start(t); o.stop(t + dur + .02);
    });
  }
  const arps = [[0, 7, 12, 7, 4, 7, 12, 7], [0, 7, 12, 7, 2, 9, 14, 9]];
  for (let c = 0; c < CYCLES; c++) for (let m = 0; m < 8; m++) {
    const s = arps[c % 4 === 3 ? 1 : 0][m] + (c >= 4 ? 12 : 0);
    pluck((c * 8 + m) * M + .006, s, m % 4 === 0 ? .13 : .085, .32);
    if (c >= 4 && m % 2) pluck((c * 8 + m + .5) * M, s + 12, .05, .42);
  }

  /* melody: S=0 R=2 G=4 P=7 D=9, one bar per string, "-" holds, "." rests */
  const tune = [
    [0, 2, 4, '-', 7, '-', 4, 2],
    [4, '-', '-', 2, 0, '-', -3, '-'],
    [0, 2, 4, 7, 9, '-', 7, 4],
    [7, '-', '-', 4, 2, '-', 0, '.'],
    [7, 9, 12, '-', 9, 7, 4, '-'],
    [2, 4, 7, '-', 4, 2, 0, '-'],
    [12, '-', 9, 7, 9, 12, 14, 12],
    [9, 7, 4, 2, 0, '-', '-', '.'],
  ];
  function reed(t, dur, s, prev) {
    const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
    f1.type = 'bandpass'; f1.frequency.value = 1250; f1.Q.value = .8;
    f2.type = 'peaking'; f2.frequency.value = 2700; f2.Q.value = 1.4; f2.gain.value = 6;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.22, t + .035);
    g.gain.linearRampToValueAtTime(.17, t + Math.min(.18, dur * .5));
    g.gain.setValueAtTime(.17, t + dur - .04);
    g.gain.linearRampToValueAtTime(0, t + dur + .05);
    f1.connect(f2); f2.connect(g); out(g, -.05, .9);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 5.4;
    depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(dur > .4 ? 16 : 5, t + .25);
    lfo.connect(depth);
    for (const [type, det, lvl] of [['sawtooth', -5, .7], ['sawtooth', 5, .7], ['square', 0, .25]]) {
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.type = type; o.detune.value = det; v.gain.value = lvl;
      o.frequency.setValueAtTime(hz(prev == null ? s - .7 : prev), t);
      o.frequency.linearRampToValueAtTime(hz(s), t + (prev == null ? .05 : .075)); // meend: the slide between notes
      depth.connect(o.detune); o.connect(v); v.connect(f1);
      o.start(t); o.stop(t + dur + .08);
    }
    lfo.start(t); lfo.stop(t + dur + .08);
  }
  let prev = null;
  const flat = tune.flat();
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '-' || flat[i] === '.') continue;
    let n = 1; while (flat[i + n] === '-') n++;
    reed(i * M, n * M - .01, flat[i], prev);
    prev = flat[i];
    if (flat[i + n] === '.') prev = null;
  }

  const r = await ctx.startRendering();
  // Fold the reverb tail back onto the start so the loop has no seam, then keep clear of clipping.
  const n = Math.round(LEN * SR), buf = ctx.createBuffer(2, n, SR);
  let peak = 0;
  for (let c = 0; c < 2; c++) {
    const src = r.getChannelData(c), dst = buf.getChannelData(c);
    for (let i = 0; i < n; i++) { dst[i] = src[i] + (i + n < src.length ? src[i + n] : 0); peak = Math.max(peak, Math.abs(dst[i])); }
  }
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] *= .85 / peak; }
  return buf;
}
