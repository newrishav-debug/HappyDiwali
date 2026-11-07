// Draws every image in art/ as SVG, then renders the scene and previews to JPEG.
// Run from a folder with playwright installed: node make-art.mjs <project-dir>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.cwd() + '/')('playwright');
const root = process.argv[2];
const art = f => `${root}/art/${f}`;

let seed = 11;
const R = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const rnd = (a, b) => a + R() * (b - a);
const f1 = n => +n.toFixed(1);
const C = { maroon: '#5c0f2e', plum: '#2c0b3f', rani: '#e0156f', marigold: '#ff9a1a', gold: '#e8b23e', paleGold: '#ffe08a', peacock: '#0b7a75', leaf: '#2f7d32', clay: '#b4532a', ivory: '#fff4d6' };

/* ---------- small marigold, leaf ---------- */
function marigold(x, y, r) {
  let s = '';
  for (const [k, col] of [[1, '#e86a00'], [.74, '#ff8f0f'], [.48, '#ffb52e'], [.24, '#ffd65c']]) {
    const n = Math.max(7, Math.round(11 * k + 3));
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + k * 2;
      s += `<circle cx="${f1(x + Math.cos(a) * r * k * .72)}" cy="${f1(y + Math.sin(a) * r * k * .72)}" r="${f1(r * .34 * (k + .35))}" fill="${col}"/>`;
    }
  }
  return s;
}
const mangoLeaf = (x, y, len, tilt) => `<g transform="translate(${x} ${y}) rotate(${tilt})"><path d="M0 0C${len * .34} ${len * .28} ${len * .3} ${len * .78} 0 ${len}C${-len * .3} ${len * .78} ${-len * .34} ${len * .28} 0 0Z" fill="#2f8a3a"/><path d="M0 2V${len - 3}" stroke="#a8d66a" stroke-width="1.2"/></g>`;

/* ---------- toran: seamless horizontal tile ---------- */
function toran() {
  const W = 180, H = 104; let s = `<path d="M-2 6Q90 22 182 6" fill="none" stroke="${C.gold}" stroke-width="4"/>`;
  const sag = x => 6 + 16 * (1 - ((x - 90) / 90) ** 2) * .75;
  for (const [x, t] of [[22, 8], [68, -6], [112, 6], [158, -8]]) s += mangoLeaf(x, sag(x), 42, t);
  for (const x of [45, 135]) {
    let y = sag(x) + 8;
    for (let i = 0; i < 4; i++) { s += marigold(x, y, 11 - i * .6); y += 16 - i; }
    s += `<path d="M${x - 3} ${y - 8}L${x} ${y + 12}L${x + 3} ${y - 8}Z" fill="${C.rani}"/>`;
  }
  s += marigold(0, sag(0) + 4, 13) + marigold(180, sag(0) + 4, 13) + marigold(90, sag(90) + 3, 13);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

/* ---------- rangoli ---------- */
function rangoli() {
  let s = '';
  const ringOf = (n, r, fn) => { for (let i = 0; i < n; i++) s += `<g transform="rotate(${i * 360 / n})">${fn(r, i)}</g>`; };
  const petal = (r, len, w, col, line) => `<path d="M0 ${-r}C${w} ${-r - len * .35} ${w * .7} ${-r - len * .8} 0 ${-r - len}C${-w * .7} ${-r - len * .8} ${-w} ${-r - len * .35} 0 ${-r}Z" fill="${col}" stroke="${line}" stroke-width="2"/>`;
  ringOf(24, 186, () => petal(186, 44, 19, C.rani, C.paleGold));
  ringOf(24, 180, () => `<g transform="rotate(7.5)">${petal(160, 44, 14, C.marigold, C.ivory)}</g>`);
  s += `<circle r="164" fill="${C.plum}" stroke="${C.gold}" stroke-width="5"/>`;
  ringOf(48, 150, () => `<circle cy="-152" r="4.5" fill="${C.ivory}"/>`);
  ringOf(16, 0, () => petal(84, 56, 25, C.peacock, C.paleGold));
  ringOf(16, 0, () => `<g transform="rotate(11.25)">${petal(70, 54, 16, '#ffc531', C.maroon)}</g>`);
  s += `<circle r="80" fill="${C.maroon}" stroke="${C.gold}" stroke-width="4"/>`;
  ringOf(12, 0, () => petal(22, 52, 15, C.rani, C.paleGold));
  ringOf(12, 0, () => `<g transform="rotate(15)">${petal(16, 34, 10, C.marigold, C.ivory)}</g>`);
  s += `<circle r="20" fill="#ffd65c" stroke="${C.maroon}" stroke-width="3"/><circle r="8" fill="${C.rani}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="-240 -240 480 480">${s}</svg>`;
}

/* ---------- crackers ---------- */
const sprite = body => `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120">${body}</svg>`;
const star = (x, y, r, col) => { let d = ''; for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.571, q = i % 2 ? r * .42 : r; d += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * q)} ${f1(y + Math.sin(a) * q)}`; } return `<path d="${d}Z" fill="${col}"/>`; };
const zigzag = (x, y, w, h, n, col) => { let d = `M${x} ${y}`; for (let i = 1; i <= n; i++) d += `L${f1(x + w * i / n)} ${y + (i % 2 ? -h : 0)}`; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.8"/>`; };

function chakri() {
  let spiral = 'M60 60', rim = '';
  for (let a = 0; a < 31.4; a += .3) { const r = 7 + a * 1.32; spiral += `L${f1(60 + Math.cos(a) * r)} ${f1(60 + Math.sin(a) * r)}`; }
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; rim += `<circle cx="${f1(60 + Math.cos(a) * 51)}" cy="${f1(60 + Math.sin(a) * 51)}" r="2" fill="${C.paleGold}"/>`; }
  return sprite(`<circle cx="60" cy="60" r="55" fill="#0a5d58" stroke="${C.gold}" stroke-width="3"/>${rim}<circle cx="60" cy="60" r="47" fill="#c90f5d"/>
  <path d="${spiral}" fill="none" stroke="#7d0a3c" stroke-width="7.5"/><path d="${spiral}" fill="none" stroke="#ff4f93" stroke-width="4.5"/><path d="${spiral}" fill="none" stroke="${C.paleGold}" stroke-width="1.3"/>
  <circle cx="60" cy="60" r="10" fill="${C.gold}"/><circle cx="60" cy="60" r="4.5" fill="${C.maroon}"/>
  <path d="M110 55l9-4-2 8z" fill="#3a1a0c"/>`);
}
function anar() {
  return sprite(`<defs><linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="#7b2a12"/><stop offset=".42" stop-color="#e2692a"/><stop offset="1" stop-color="#8c3314"/></linearGradient></defs>
  <path d="M60 17q6-8 2-14" fill="none" stroke="#3a1a0c" stroke-width="3" stroke-linecap="round"/>
  <path d="M46 18h28l23 86H23z" fill="url(#a)"/><rect x="43" y="13" width="34" height="8" rx="3" fill="${C.gold}"/>
  <path d="M35 49h50l9 38H26z" fill="${C.maroon}" stroke="${C.gold}" stroke-width="2.2"/>
  ${marigold(60, 68, 11)}
  ${zigzag(33, 57, 54, 3.5, 12, C.paleGold)}${zigzag(29, 83, 62, 3.5, 12, C.paleGold)}
  <rect x="17" y="102" width="86" height="11" rx="3.5" fill="#5e1f0c"/><rect x="17" y="102" width="86" height="3" rx="1.5" fill="${C.gold}"/>`);
}
function rocket() {
  return sprite(`<rect x="66" y="42" width="5" height="76" rx="2" fill="#c89a5a"/><rect x="66" y="42" width="1.6" height="76" fill="#8a6235"/>
  <path d="M60 3C74 14 79 24 79 34H41C41 24 46 14 60 3Z" fill="${C.rani}" stroke="${C.gold}" stroke-width="2"/>
  <rect x="41" y="33" width="38" height="49" fill="#0a5d58"/><rect x="41" y="33" width="38" height="49" fill="none" stroke="${C.gold}" stroke-width="2"/>
  <rect x="41" y="38" width="38" height="5" fill="${C.marigold}"/><rect x="41" y="72" width="38" height="5" fill="${C.marigold}"/>
  ${star(60, 57, 11, C.paleGold)}<circle cx="60" cy="57" r="3" fill="${C.rani}"/>
  <path d="M41 82l-5 12h10l3-12zM79 82l5 12H74l-3-12z" fill="#7d0a3c"/>
  <path d="M60 18l2.5 5-2.5 5-2.5-5z" fill="${C.paleGold}"/>`);
}
function bomb() {
  let twine = '';
  for (let i = -5; i <= 5; i++) {
    twine += `<path d="M${60 + i * 7.5} 22Q${60 + i * 11.5} 66 ${60 + i * 7.5} 110" fill="none" stroke="#7a5228" stroke-width="2.1"/>`;
    twine += `<path d="M18 ${66 + i * 7.5}Q60 ${66 + i * 11.5} 102 ${66 + i * 7.5}" fill="none" stroke="#a8804a" stroke-width="2.1"/>`;
  }
  return sprite(`<defs><radialGradient id="b" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ecc98b"/><stop offset=".6" stop-color="#b98b4f"/><stop offset="1" stop-color="#6a4520"/></radialGradient><clipPath id="c"><circle cx="60" cy="66" r="44"/></clipPath></defs>
  <path d="M60 23Q58 10 69 4" fill="none" stroke="#3a1a0c" stroke-width="3.6" stroke-linecap="round"/>
  <circle cx="60" cy="66" r="44" fill="url(#b)"/><g clip-path="url(#c)">${twine}</g>
  <rect x="35" y="50" width="50" height="32" rx="2.5" fill="#c81e2d" stroke="${C.gold}" stroke-width="2.2"/>
  ${star(60, 66, 12, C.paleGold)}`);
}
function ladi() {
  let s = '<path d="M60 22V116" stroke="#f2e2b4" stroke-width="3"/>';
  for (let i = 0; i < 8; i++) {
    const y = 31 + i * 10.6;
    for (const side of [-1, 1]) {
      const col = (i + (side > 0 ? 1 : 0)) % 2 ? '#e3182d' : '#ff3d3d';
      s += `<g transform="translate(60 ${y}) rotate(${side * 24})"><rect x="${side > 0 ? 0 : -33}" y="-4.2" width="33" height="8.6" rx="1.6" fill="${col}"/><rect x="${side > 0 ? 25 : -33}" y="-4.2" width="8" height="8.6" fill="${C.paleGold}"/></g>`;
    }
  }
  return sprite(`${s}<rect x="42" y="5" width="36" height="24" rx="3" fill="#0a7f4b" stroke="${C.gold}" stroke-width="2"/>${star(60, 17, 8, C.paleGold)}`);
}
function dud() {
  return sprite(`<path d="M58 28C60 8 86 6 92 28" fill="none" stroke="#50535c" stroke-width="4.5" stroke-linecap="round"/>
  <g transform="rotate(-9 60 70)"><rect x="33" y="28" width="52" height="84" rx="6" fill="#7e838f"/><rect x="33" y="28" width="16" height="84" rx="6" fill="#969ba7"/>
  <rect x="33" y="50" width="52" height="33" fill="#676b76"/>
  <circle cx="50" cy="63" r="3.3" fill="#23252b"/><circle cx="68" cy="63" r="3.3" fill="#23252b"/>
  <path d="M51 76Q59 69 67 76" fill="none" stroke="#23252b" stroke-width="2.7" stroke-linecap="round"/>
  <path d="M68 68c3 4 3 7 0 7s-3-3 0-7z" fill="#79c9ff"/></g>
  <path d="M15 40c7 10 9 15 0 15s-7-5 0-15zM104 62c6 8 8 13 0 13s-6-5 0-13zM17 86c5 7 6 11 0 11s-5-4 0-11z" fill="#6fc4ff"/>`);
}

/* ---------- palace scene, drawn for one half and mirrored: Indian formal symmetry ---------- */
const mult = (x, y, w, h) => { // cusped (multifoil) arch; (x,y) is the bottom-left corner
  const sy = y - h * .52, r = w * .3, top = y - h;
  const P = [[x, sy], [x + w * .09, sy - h * .17], [x + w * .27, sy - h * .32], [x + w * .5, top], [x + w * .73, sy - h * .32], [x + w * .91, sy - h * .17], [x + w, sy]];
  return `M${x} ${y}L${P[0].join(' ')}` + P.slice(1).map(p => `A${f1(r)} ${f1(r)} 0 0 1 ${f1(p[0])} ${f1(p[1])}`).join('') + `L${x + w} ${y}Z`;
};
const dome = (cx, y, r, h, fill) => `<path d="M${cx - r * .8} ${y}C${cx - r * 1.32} ${y - h * .14} ${cx - r * 1.26} ${y - h * .56} ${cx - r * .36} ${y - h * .72}C${cx - r * .16} ${y - h * .78} ${cx - r * .05} ${y - h * .88} ${cx} ${y - h}C${cx + r * .05} ${y - h * .88} ${cx + r * .16} ${y - h * .78} ${cx + r * .36} ${y - h * .72}C${cx + r * 1.26} ${y - h * .56} ${cx + r * 1.32} ${y - h * .14} ${cx + r * .8} ${y}Z" fill="${fill}" stroke="${C.gold}" stroke-width="2"/>
  <path d="M${cx - r * .95} ${y - h * .2}Q${cx} ${y - h * .08} ${cx + r * .95} ${y - h * .2}" fill="none" stroke="${C.gold}" stroke-width="1.6" opacity=".7"/>
  <path d="M${cx} ${y - h}V${y - h - r * .42}" stroke="${C.gold}" stroke-width="3.5"/><circle cx="${cx}" cy="${y - h - r * .22}" r="${f1(r * .09 + 2)}" fill="${C.gold}"/><circle cx="${cx}" cy="${y - h - r * .45}" r="${f1(r * .06 + 1.5)}" fill="${C.gold}"/>`;
const litArch = (x, y, w, h) => {
  let rail = '';
  const rh = Math.min(h * .2, w * .4);
  for (let i = 0; i < 5; i++) rail += `<rect x="${f1(x + w * (i + .35) / 5)}" y="${f1(y - rh)}" width="${f1(w * .06)}" height="${f1(rh)}" fill="#6d2410"/>`;
  return `<path d="${mult(x - 3.5, y, w + 7, h + 6)}" fill="#e8b23e"/><path d="${mult(x, y, w, h)}" fill="#ff9a1a"/><path d="${mult(x + w * .17, y, w * .66, h * .76)}" fill="#ffd65c"/>${rail}<rect x="${x}" y="${f1(y - rh)}" width="${w}" height="${f1(Math.max(1.4, h * .018))}" fill="#6d2410"/>`;
};
const chhatri = (cx, y, s, wall) => `<rect x="${cx - 44 * s}" y="${y - 58 * s}" width="${88 * s}" height="${58 * s}" fill="${wall}"/>${litArch(cx - 34 * s, y, 26 * s, 48 * s)}${litArch(cx + 8 * s, y, 26 * s, 48 * s)}
  <path d="M${cx - 56 * s} ${y - 58 * s}H${cx + 56 * s}L${cx + 42 * s} ${y - 72 * s}H${cx - 42 * s}Z" fill="${C.maroon}" stroke="${C.gold}" stroke-width="2"/>${dome(cx, y - 72 * s, 38 * s, 62 * s, '#a32a55')}`;
const lights = (x1, y1, x2, y2, sag, n) => {
  let s = `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}" fill="none" stroke="#1a0820" stroke-width="1.4"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (1 - t) ** 2 * x1 + 2 * t * (1 - t) * (x1 + x2) / 2 + t * t * x2;
    const y = (1 - t) ** 2 * y1 + 2 * t * (1 - t) * ((y1 + y2) / 2 + sag * 2) + t * t * y2;
    const col = ['#ffd65c', '#ff5fa2', '#7dffc7', '#ff9a1a'][i % 4];
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="${col}" opacity=".22"/><circle cx="${f1(x)}" cy="${f1(y)}" r="3.2" fill="${col}"/>`;
  }
  return s;
};
function half() { // left half, x 0..800
  const wall = '#57163e', wall2 = '#431034';
  let s = '';
  // tall gate tower at the far left
  s += `<rect x="60" y="300" width="216" height="360" fill="${wall}"/>`;
  s += `<path d="M42 300H294L272 276H64Z" fill="${C.maroon}" stroke="${C.gold}" stroke-width="2.5"/>`;
  s += dome(168, 276, 88, 148, '#b83a6b');
  s += chhatri(70, 276, .68, wall2) + chhatri(266, 276, .68, wall2);
  for (const x of [84, 146, 208]) s += litArch(x, 400, 44, 76);
  for (const x of [84, 146, 208]) s += litArch(x, 520, 44, 92);
  s += `<rect x="60" y="412" width="216" height="9" fill="${C.gold}"/><rect x="60" y="532" width="216" height="7" fill="${C.gold}"/>`;
  s += litArch(112, 658, 112, 112);
  // low arcade running to the centre
  s += `<rect x="276" y="480" width="524" height="180" fill="${wall2}"/><rect x="276" y="480" width="524" height="10" fill="${C.gold}"/>`;
  for (let i = 0; i < 8; i++) s += litArch(292 + i * 64, 650, 46, 118);
  s += `<path d="M276 480H800V462H276Z" fill="${C.maroon}"/>`;
  for (let i = 0; i < 26; i++) s += `<path d="${mult(280 + i * 20, 480, 14, 22)}" fill="#7a1d4e" stroke="${C.gold}" stroke-width=".8"/>`;
  s += chhatri(470, 462, .9, wall) + chhatri(652, 462, .75, wall);
  s += lights(168, 112, 470, 330, 26, 18) + lights(470, 330, 652, 362, 16, 12) + lights(652, 362, 800, 300, 16, 10);
  return s;
}
function scene(flames) {
  let stars = '';
  for (let i = 0; i < 170; i++) { const x = rnd(0, 1600), y = rnd(0, 520), r = rnd(.5, 1.9); stars += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#fff" opacity="${f1(rnd(.25, .9))}"/>`; }
  for (let i = 0; i < 16; i++) stars += star(rnd(20, 1580), rnd(10, 350), rnd(4, 8), C.paleGold);
  const burst = (x, y, s, cols) => {
    let o = '';
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, len = s * (i % 2 ? 1 : .72), c = cols[i % cols.length];
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      o += `<path d="M${f1(x + Math.cos(a) * len * .3)} ${f1(y + Math.sin(a) * len * .3)}L${f1(ex)} ${f1(ey)}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${f1(ex)}" cy="${f1(ey)}" r="2.8" fill="${c}"/>`;
    }
    return o;
  };
  const clouds = [[230, 240, 190], [1330, 210, 210], [700, 300, 150], [1010, 150, 130]].map(([x, y, w]) => `<g fill="#ff5a7a" opacity=".14"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .13}"/><ellipse cx="${x + w * .45}" cy="${y - 18}" rx="${w * .5}" ry="${w * .1}"/></g>`).join('');
  const diya = (x, y, s) => `<ellipse cx="${x}" cy="${y + 15 * s}" rx="${33 * s}" ry="${5 * s}" fill="#000" opacity=".4"/><path d="M${x - 30 * s} ${y - 3 * s}Q${x} ${y + 3 * s} ${x + 30 * s} ${y - 3 * s}L${x + 36 * s} ${y - 8 * s}Q${x + 22 * s} ${y + 22 * s} ${x} ${y + 21 * s}Q${x - 26 * s} ${y + 21 * s} ${x - 30 * s} ${y - 3 * s}Z" fill="${C.clay}" stroke="#ffbe6a" stroke-width="1.3"/><path d="M${x - 19 * s} ${y + 8 * s}Q${x} ${y + 13 * s} ${x + 19 * s} ${y + 8 * s}" fill="none" stroke="#ffe08a" stroke-width="${1.6 * s}" stroke-dasharray="1 4" stroke-linecap="round"/>` +
    (flames ? `<circle cx="${x}" cy="${y - 20 * s}" r="${38 * s}" fill="url(#glow)"/><path d="M${x} ${y - 38 * s}C${x + 14 * s} ${y - 16 * s} ${x + 9 * s} ${y - 3 * s} ${x} ${y - 3 * s}C${x - 9 * s} ${y - 3 * s} ${x - 14 * s} ${y - 16 * s} ${x} ${y - 38 * s}Z" fill="#ffc531"/><path d="M${x} ${y - 24 * s}C${x + 5 * s} ${y - 13 * s} ${x + 4 * s} ${y - 5 * s} ${x} ${y - 5 * s}C${x - 4 * s} ${y - 5 * s} ${x - 5 * s} ${y - 13 * s} ${x} ${y - 24 * s}Z" fill="#fff7cf"/>` : '');
  const ground = DIYAS.map(([x, y, s]) => diya(x, y, s)).join('');
  let jali = '';
  for (let i = 0; i < 40; i++) jali += `<path d="${mult(i * 40 + 8, 696, 24, 30)}" fill="#1d0726" stroke="${C.gold}" stroke-width="1.4"/>`;
  const pot = x => `<path d="M${x - 44} 696h88l-13 54h-62z" fill="${C.clay}" stroke="#ffbe6a" stroke-width="2"/>` + marigold(x - 34, 684, 25) + marigold(x + 35, 686, 24) + marigold(x, 662, 28) + marigold(x - 18, 638, 19) + marigold(x + 24, 636, 20) + mangoLeaf(x - 62, 672, 36, 40) + mangoLeaf(x + 62, 672, 36, -40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800"><defs>
    <linearGradient id="sky" x2="0" y2="1"><stop offset="0" stop-color="#090b3d"/><stop offset=".36" stop-color="#2a0f5e"/><stop offset=".62" stop-color="#7a1a68"/><stop offset=".82" stop-color="#d2422d"/></linearGradient>
    <radialGradient id="lit" cy=".82" r=".95"><stop offset="0" stop-color="#ffe089"/><stop offset=".5" stop-color="#ffa426"/><stop offset="1" stop-color="#b8430f"/></radialGradient>
    <linearGradient id="domeG" x1="0" x2="1"><stop offset="0" stop-color="#7d1b4a"/><stop offset=".42" stop-color="#d64a7c"/><stop offset="1" stop-color="#6d1640"/></linearGradient>
    <linearGradient id="stone" x2="0" y2="1"><stop offset="0" stop-color="#8a2a55"/><stop offset="1" stop-color="#2b0b2a"/></linearGradient>
    <radialGradient id="fw"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffb52e" stop-opacity=".55"/><stop offset="1" stop-color="#ffb52e" stop-opacity="0"/></radialGradient>
    <linearGradient id="floor" x2="0" y2="1"><stop offset="0" stop-color="#3a1030"/><stop offset="1" stop-color="#180620"/></linearGradient>
  </defs>
  <rect width="1600" height="800" fill="url(#sky)"/>${stars}
  ${burst(420, 150, 112, ['#ff5fa2', '#ffd1e3', '#ffd65c'])}${burst(1205, 165, 124, ['#7dffc7', '#fff4d6', '#39c9c2'])}${burst(640, 95, 62, ['#ffd65c', '#fff4d6', '#ff8a1f'])}${burst(965, 80, 70, ['#ff8a1f', '#ffd65c', '#ff5fa2'])}
  <g>${half()}<g transform="translate(1600 0) scale(-1 1)">${half()}</g>
  <rect y="660" width="1600" height="40" fill="#6d1c4a"/><rect y="660" width="1600" height="6" fill="${C.gold}"/>
  ${jali}<rect y="696" width="1600" height="104" fill="#2c0b2c"/><rect y="696" width="1600" height="4" fill="${C.gold}"/>
  ${pot(52)}${pot(1548)}
  ${ground}</g>
  </svg>`;
}
const DIYAS = [150, 278, 406, 534, 662, 938, 1066, 1194, 1322, 1450].map((x, i) => [x, 750 + (i % 2) * 14, 1.05]);

const write = (f, s) => fs.writeFileSync(art(f), s);
write('toran.svg', toran()); write('rangoli.svg', rangoli());
for (const [n, fn] of Object.entries({ chakri, anar, rocket, bomb, ladi, dud })) write(`${n}.svg`, fn());

const b = await chromium.launch({ channel: 'chrome' });
const shot = async (html, w, h, out, q) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: out, type: 'jpeg', quality: q });
  await p.close();
};
const page = (b, w, h) => `<!DOCTYPE html><meta charset="utf-8"><style>*{margin:0}body{width:${w}px;height:${h}px;overflow:hidden;background:#000}</style>${b}`;
await shot(page(scene(false), 1600, 800), 1600, 800, art('scene.jpg'), 80);

const uri = f => `data:image/svg+xml;base64,${fs.readFileSync(art(f)).toString('base64')}`;
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${root}/fonts/${f}`).toString('base64')}`;
const preview = (title, tag, fam, file, cta) => `<style>
@font-face{font-family:T;src:url(${font(fam)})}@font-face{font-family:U;src:url(${font('balooda-bengali.woff2')})}@font-face{font-family:U;src:url(${font('balooda-latin.woff2')})}
.s{position:absolute;left:-150px;top:-120px;transform-origin:0 0;width:1600px;height:800px;transform:scale(.9375)}.s svg{display:block}
.r{position:absolute;left:325px;top:40px;width:550px;height:550px;opacity:.95}
.v{position:absolute;inset:0;background:radial-gradient(ellipse 500px 300px at 50% 47%,#17051fd9 35%,#17051f00 100%)}
.t{position:absolute;inset:0;text-align:center;color:#fff4d6;font-family:U;padding-top:165px}
h1{font:400 118px/1.08 T;padding:.34em .12em .16em;margin:-.34em 0 -.16em;background:linear-gradient(#fff6c0,#ffd65c 45%,#ff9a1a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #7a1414) drop-shadow(0 0 22px #ff7a1a)}
p{font-size:32px;font-weight:600;margin-top:4px}
b{display:inline-block;margin-top:14px;padding:6px 44px 4px;font-size:42px;font-weight:800;color:#4a0f0f;background:linear-gradient(#ffe08a,#ff9a1a);border:4px solid #fff4d6;outline:3px solid #b5531a;border-radius:50px}
.o{position:absolute;left:0;right:0;top:0;height:92px;background:url(${uri('toran.svg')}) repeat-x;background-size:auto 100%}
</style><div class=s>${scene(true)}</div><img class=r src="${uri('rangoli.svg')}"><div class=v></div><div class=o></div><div class=t><h1>${title}</h1><p>${tag}</p><b>${cta}</b></div>`;
await shot(page(preview('Happy Diwali', 'Burst crackers. Beat your friends.', 'yatra-latin.woff2', 'en', 'Tap to Play'), 1200, 630), 1200, 630, `${root}/preview-en.jpg`, 84);
await shot(page(preview('শুভ দীপাবলি', 'বাজি ফাটাও, বন্ধুদের হারাও!', 'galada-bengali.woff2', 'bn', 'Tap to Play'), 1200, 630), 1200, 630, `${root}/preview-bn.jpg`, 84);
await b.close();
console.log('art done', DIYAS.map(d => d.join(',')).join(' '));
