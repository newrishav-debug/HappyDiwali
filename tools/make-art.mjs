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
  let s = `<circle cx="${x}" cy="${y}" r="${f1(r * 1.1)}" fill="#2a0a1e"/>`;
  for (const [k, col] of [[1, '#e86a00'], [.74, '#ff8f0f'], [.48, '#ffb52e'], [.24, '#ffd65c']]) {
    const n = Math.max(7, Math.round(11 * k + 3));
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + k * 2;
      s += `<circle cx="${f1(x + Math.cos(a) * r * k * .72)}" cy="${f1(y + Math.sin(a) * r * k * .72)}" r="${f1(r * .34 * (k + .35))}" fill="${col}"/>`;
    }
  }
  return s;
}
const mangoLeaf = (x, y, len, tilt) => `<g transform="translate(${x} ${y}) rotate(${tilt})"><path d="M0 0C${len * .34} ${len * .28} ${len * .3} ${len * .78} 0 ${len}C${-len * .3} ${len * .78} ${-len * .34} ${len * .28} 0 0Z" fill="#2f8a3a" stroke="#2a0a1e" stroke-width="1.6"/><path d="M0 2V${len - 3}" stroke="#a8d66a" stroke-width="1.2"/></g>`;

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

/* ---------- crackers: flat stickers with a cream cut-out edge, a dark line and one hard shadow ---------- */
const INK = '#2a0a1e', CUT = '#fff4d6';
const sprite = body => `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120"><g stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const cutEdge = shapes => `<g fill="${CUT}" stroke="${CUT}" stroke-width="9">${shapes}</g>`;
const star = (x, y, r, col, line) => { let d = ''; for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.571, q = i % 2 ? r * .45 : r; d += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * q)} ${f1(y + Math.sin(a) * q)}`; } return `<path d="${d}Z" fill="${col}"${line ? ` stroke="${line}" stroke-width="1.4"` : ''}/>`; };
const lit = (x, y, r) => star(x, y, r, '#ff9a1a', INK) + star(x, y, r * .55, '#fff4a8');
const zigzag = (x, y, w, h, n, col, sw = 1.8) => { let d = `M${x} ${y}`; for (let i = 1; i <= n; i++) d += `L${f1(x + w * i / n)} ${f1(y + (i % 2 ? -h : 0))}`; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"/>`; };
const lotus = (x, y, r, col, core) => { let s = ''; for (const a of [-60, -30, 0, 30, 60]) s += `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0C${r * .4} ${-r * .35} ${r * .32} ${-r * .8} 0 ${-r}C${-r * .32} ${-r * .8} ${-r * .4} ${-r * .35} 0 0Z" fill="${col}" stroke="${INK}" stroke-width="1"/>`; return s + `<circle cx="${x}" cy="${y}" r="${r * .17}" fill="${core}"/>`; };

function chakri() {
  let sectors = '', spiral = '';
  const n = 16, p = (r, a) => `${f1(60 + Math.cos(a) * r)} ${f1(60 + Math.sin(a) * r)}`;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, b = (i + 1) / n * 6.283;
    sectors += `<path d="M${p(37, a)}L${p(50, a)}A50 50 0 0 1 ${p(50, b)}L${p(37, b)}A37 37 0 0 0 ${p(37, a)}Z" fill="${i % 2 ? '#ffc531' : '#e0156f'}"/>`;
  }
  for (let a = 0; a <= 19; a += .25) { const r = 12 + a * 1.27; spiral += `${a ? 'L' : 'M'}${p(r, a)}`; }
  return sprite(`${cutEdge('<circle cx="60" cy="60" r="51"/><path d="M104 52L118 46L113 62Z"/>')}
    <path d="M104 52L118 46L113 62Z" fill="#7a4a1e" stroke="${INK}" stroke-width="2"/>
    <circle cx="60" cy="60" r="51" fill="${INK}"/>${sectors}
    <circle cx="60" cy="60" r="50.5" fill="none" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="60" cy="60" r="37" fill="#0b7a75" stroke="${INK}" stroke-width="2.4"/>
    <path d="${spiral}" fill="none" stroke="${INK}" stroke-width="6.5"/><path d="${spiral}" fill="none" stroke="#ffb52e" stroke-width="3.6"/>
    <circle cx="60" cy="60" r="11.5" fill="#ffe08a" stroke="${INK}" stroke-width="2.4"/>${star(60, 60, 8, '#c90f5d')}`);
}
function anar() {
  const body = 'M45 22H75L99 100H21Z';
  return sprite(`${cutEdge(`<path d="${body}"/><rect x="39" y="13" width="42" height="11" rx="3"/><rect x="13" y="98" width="94" height="15" rx="4"/><path d="M60 12V5"/>`)}
    <path d="M60 13V5" stroke="${INK}" stroke-width="3.4"/>
    <path d="${body}" fill="#ff8a1f" stroke="${INK}" stroke-width="2.6"/>
    <path d="M64 23H75L99 99H82Z" fill="#d95f12"/>
    <path d="M34 53H86L95 87H25Z" fill="#7d0a3c" stroke="${INK}" stroke-width="2.2"/>
    ${zigzag(36, 60, 48, 3.6, 12, '#ffd65c')}${zigzag(29, 83, 62, 3.6, 14, '#ffd65c')}
    ${lotus(60, 78, 15, '#ff6fa8', '#ffd65c')}
    <path d="M40 33H80" stroke="#fff4d6" stroke-width="3" stroke-dasharray="1 6"/>
    <rect x="39" y="13" width="42" height="11" rx="3" fill="#ffd65c" stroke="${INK}" stroke-width="2.4"/>
    <rect x="13" y="98" width="94" height="15" rx="4" fill="#0b7a75" stroke="${INK}" stroke-width="2.6"/>
    <path d="M22 105.500H98" stroke="#ffd65c" stroke-width="2.4" stroke-dasharray="5 5"/>`);
}
function rocket() {
  const nose = 'M60 3C73 13 80 25 80 37H40C40 25 47 13 60 3Z', tube = 'M41 37H79V86H41Z', fins = 'M41 66L27 92L41 86ZM79 66L93 92L79 86Z';
  return sprite(`${cutEdge(`<path d="${nose}"/><path d="${tube}"/><path d="${fins}"/><rect x="56.500" y="84" width="7" height="33" rx="2"/>`)}
    <rect x="56.500" y="84" width="7" height="33" rx="2" fill="#d6a561" stroke="${INK}" stroke-width="2.2"/>
    <path d="${fins}" fill="#e0156f" stroke="${INK}" stroke-width="2.4"/>
    <path d="${tube}" fill="#0b7a75" stroke="${INK}" stroke-width="2.6"/><path d="M68 38H78V85H68Z" fill="#075350"/>
    <path d="M42 45H78" stroke="#ffc531" stroke-width="5"/><path d="M42 78H78" stroke="#ffc531" stroke-width="5"/>
    <circle cx="60" cy="61.500" r="11.500" fill="#fff4d6" stroke="${INK}" stroke-width="2"/>${star(60, 61.5, 9, '#e0156f')}
    <path d="${nose}" fill="#ff3d3d" stroke="${INK}" stroke-width="2.6"/><path d="M63 7C73 15 79 26 79 36H67C68 26 67 15 63 7Z" fill="#c21a2c"/>
    <path d="M60 16L63 22L60 28L57 22Z" fill="#ffd65c"/>`);
}
function bomb() {
  let twine = '';
  for (let i = -5; i <= 5; i++) {
    const y = 69 + i * 8.2, w = Math.sqrt(Math.max(0, 44 ** 2 - (i * 8.2) ** 2));
    twine += `<path d="M${f1(60 - w)} ${f1(y)}Q60 ${f1(y + 7)} ${f1(60 + w)} ${f1(y)}" fill="none" stroke="#8a5c2a" stroke-width="2.6"/>`;
  }
  for (const r of [-38, 38]) twine += `<path d="M${60 + r} 34Q${60 + r * .55} 69 ${60 + r} 104" fill="none" stroke="#6d4520" stroke-width="2.6"/>`;
  twine += '<path d="M60 25V113" stroke="#6d4520" stroke-width="2.6"/>';
  return sprite(`${cutEdge('<circle cx="60" cy="69" r="44"/><path d="M60 26C58 14 66 9 75 11" fill="none"/>')}
    <circle cx="60" cy="69" r="44" fill="#d9ab66"/>
    <path d="M92 39A44 44 0 0 1 30 101A50 50 0 0 0 92 39Z" fill="#a97a3f"/>
    <clipPath id="ball"><circle cx="60" cy="69" r="44"/></clipPath><g clip-path="url(#ball)">${twine}</g>
    <circle cx="60" cy="69" r="44" fill="none" stroke="${INK}" stroke-width="2.8"/>
    <circle cx="60" cy="69" r="19" fill="#c81e2d" stroke="${INK}" stroke-width="2.4"/><circle cx="60" cy="69" r="14.500" fill="none" stroke="#ffd65c" stroke-width="1.600"/>${star(60, 69, 10, '#ffd65c')}
    <rect x="53" y="20" width="14" height="8" rx="2" fill="#7d0a3c" stroke="${INK}" stroke-width="2"/>
    <path d="M60 20C58 12 66 8 75 11" fill="none" stroke="${INK}" stroke-width="5"/><path d="M60 20C58 12 66 8 75 11" fill="none" stroke="#e8d3a2" stroke-width="2.400"/>
    ${lit(77, 11, 10)}`);
}
function ladi() {
  const rows = 6, one = (y, side, col) => {
    const x = side > 0 ? 3 : -33;
    return `<g transform="translate(60 ${y}) rotate(${side * 22})"><rect x="${x}" y="-5" width="30" height="10" rx="2" fill="${col}" stroke="${INK}" stroke-width="1.8"/><rect x="${side > 0 ? 25 : -33}" y="-5" width="8" height="10" rx="1.500" fill="#ffd65c" stroke="${INK}" stroke-width="1.800"/></g>`;
  };
  let edge = '', art = '';
  for (let i = 0; i < rows; i++) {
    const y = 37 + i * 11.5;
    for (const side of [-1, 1]) {
      edge += `<g transform="translate(60 ${y}) rotate(${side * 22})"><rect x="${side > 0 ? 3 : -33}" y="-5" width="30" height="10"/></g>`;
      art += one(y, side, (i + (side > 0 ? 1 : 0)) % 2 ? '#e3182d' : '#ff5148');
    }
  }
  return sprite(`${cutEdge(`${edge}<rect x="40" y="6" width="40" height="24" rx="4"/>`)}
    <path d="M60 28V113" stroke="#f2e2b4" stroke-width="3.400"/>${art}
    <rect x="40" y="6" width="40" height="24" rx="4" fill="#0a7f4b" stroke="${INK}" stroke-width="2.600"/><path d="M41 12H79M41 24H79" stroke="#ffd65c" stroke-width="2"/>${star(60, 18, 7, '#ffd65c')}`);
}
function dud() {
  const body = '<rect x="35" y="26" width="50" height="74" rx="7"/>';
  return sprite(`<ellipse cx="60" cy="108" rx="44" ry="8" fill="#6fc4ff" stroke="${INK}" stroke-width="2.200"/>
    <path d="M36 108H58" stroke="#d6efff" stroke-width="2.400"/>
    <g transform="rotate(-8 60 66)">${cutEdge(body)}
    <path d="M60 26C60 8 84 6 90 26" fill="none" stroke="${INK}" stroke-width="6"/><path d="M60 26C60 8 84 6 90 26" fill="none" stroke="#8a8f9c" stroke-width="2.800"/>
    <rect x="35" y="26" width="50" height="74" rx="7" fill="#8d92a0" stroke="${INK}" stroke-width="2.600"/>
    <path d="M70 27H78Q84 27 84 33V93Q84 99 78 99H70Z" fill="#6c717e"/>
    <rect x="35.500" y="48" width="49" height="30" fill="#b5b9c4" stroke="${INK}" stroke-width="2"/>
    <circle cx="51" cy="60" r="3.600" fill="${INK}"/><circle cx="69" cy="60" r="3.600" fill="${INK}"/>
    <path d="M45 53L55 55M75 53L65 55" stroke="${INK}" stroke-width="2"/>
    <path d="M52 72Q60 65 68 72" fill="none" stroke="${INK}" stroke-width="2.600"/>
    <path d="M71 62C75 68 75 72 71 72C67 72 67 68 71 62Z" fill="#6fc4ff" stroke="${INK}" stroke-width="1.200"/></g>
    <path d="M16 28C23 39 25 45 16 45C7 45 9 39 16 28ZM105 50C111 59 113 64 105 64C97 64 99 59 105 50Z" fill="#6fc4ff" stroke="${INK}" stroke-width="1.800"/>`);
}

/* ---------- palace scenes, in the same sticker language as the crackers ---------- */
const LINE = 4.5;
const SHADES = { '#e0156f': '#a80f52', '#ff8a1f': '#d95f12', '#ff3d3d': '#c21a2c', '#0b7a75': '#075350', '#7d0a3c': '#5c0f2e' };
const mult = (x, y, w, h) => { // cusped (multifoil) arch; (x,y) is the bottom-left corner
  const sy = y - h * .52, r = w * .3, top = y - h;
  const P = [[x, sy], [x + w * .09, sy - h * .17], [x + w * .27, sy - h * .32], [x + w * .5, top], [x + w * .73, sy - h * .32], [x + w * .91, sy - h * .17], [x + w, sy]];
  return `M${f1(x)} ${f1(y)}L${P[0].map(f1).join(' ')}` + P.slice(1).map(p => `A${f1(r)} ${f1(r)} 0 0 1 ${f1(p[0])} ${f1(p[1])}`).join('') + `L${f1(x + w)} ${f1(y)}Z`;
};
const domePath = (cx, y, r, h) => `M${f1(cx - r * .8)} ${y}C${f1(cx - r * 1.32)} ${f1(y - h * .14)} ${f1(cx - r * 1.26)} ${f1(y - h * .56)} ${f1(cx - r * .36)} ${f1(y - h * .72)}C${f1(cx - r * .16)} ${f1(y - h * .78)} ${f1(cx - r * .05)} ${f1(y - h * .88)} ${cx} ${f1(y - h)}C${f1(cx + r * .05)} ${f1(y - h * .88)} ${f1(cx + r * .16)} ${f1(y - h * .78)} ${f1(cx + r * .36)} ${f1(y - h * .72)}C${f1(cx + r * 1.26)} ${f1(y - h * .56)} ${f1(cx + r * 1.32)} ${f1(y - h * .14)} ${f1(cx + r * .8)} ${y}Z`;
function dome(cx, y, r, h, fill) {
  const lw = r > 80 ? LINE : LINE * .7;
  const shade = `M${cx + r * .2} ${f1(y - h * .78)}C${f1(cx + r * .3)} ${f1(y - h * .74)} ${f1(cx + r * .34)} ${f1(y - h * .73)} ${f1(cx + r * .36)} ${f1(y - h * .72)}C${f1(cx + r * 1.26)} ${f1(y - h * .56)} ${f1(cx + r * 1.32)} ${f1(y - h * .14)} ${f1(cx + r * .8)} ${y}H${f1(cx + r * .42)}C${f1(cx + r * .86)} ${f1(y - h * .2)} ${f1(cx + r * .8)} ${f1(y - h * .56)} ${cx + r * .2} ${f1(y - h * .78)}Z`;
  const tip = y - h - r * .34;
  return `<path d="M${cx} ${f1(y - h + 2)}V${f1(tip)}" stroke="${INK}" stroke-width="${f1(lw * 2.2)}"/><path d="M${cx} ${f1(y - h + 2)}V${f1(tip)}" stroke="#ffd65c" stroke-width="${f1(lw * .9)}"/>
    <path d="${domePath(cx, y, r, h)}" fill="${fill}" stroke="${INK}" stroke-width="${lw}"/><path d="${shade}" fill="${SHADES[fill]}"/>
    <path d="M${f1(cx - r * 1.04)} ${f1(y - h * .24)}Q${cx} ${f1(y - h * .1)} ${f1(cx + r * 1.04)} ${f1(y - h * .24)}" fill="none" stroke="#ffd65c" stroke-width="${f1(lw * 1.1)}"/>
    <path d="${domePath(cx, y, r, h)}" fill="none" stroke="${INK}" stroke-width="${lw}"/>
    ${star(cx, tip, r * .13 + 5, '#ffd65c', INK)}`;
}
const litArch = (x, y, w, h) => {
  const lw = Math.max(2, Math.min(LINE, w * .05)), rh = Math.min(h * .2, w * .4);
  let rail = '';
  for (let i = 0; i < 5; i++) rail += `<rect x="${f1(x + w * (i + .35) / 5)}" y="${f1(y - rh)}" width="${f1(w * .06)}" height="${f1(rh)}" fill="${INK}"/>`;
  return `<path d="${mult(x - w * .08, y, w * 1.16, h * 1.08)}" fill="#ffd65c" stroke="${INK}" stroke-width="${f1(lw)}"/><path d="${mult(x, y, w, h)}" fill="#ff8a1f" stroke="${INK}" stroke-width="${f1(lw * .7)}"/><path d="${mult(x + w * .17, y, w * .66, h * .76)}" fill="#fff0a8"/>${rail}<rect x="${f1(x)}" y="${f1(y - rh)}" width="${f1(w)}" height="${f1(Math.max(2.4, lw * .8))}" fill="${INK}"/>`;
};
const block = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${f1(x + w * .86)}" y="${y}" width="${f1(w * .14)}" height="${h}" fill="${SHADES[fill]}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="${LINE}"/>`;
const band = (x, y, w, h, fill = '#0b7a75') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="${LINE * .8}"/>${zigzag(x + 4, y + h * .72, w - 8, h * .42, Math.round(w / 14), '#ffd65c', 2.4)}`;
const roof = (x, y, w, h) => `<path d="M${x} ${y}H${x + w}L${x + w - h * .9} ${y - h}H${x + h * .9}Z" fill="#ffd65c" stroke="${INK}" stroke-width="${LINE}"/><path d="M${f1(x + w * .78)} ${y}H${x + w}L${x + w - h * .9} ${y - h}H${f1(x + w * .78)}Z" fill="#e8a020"/><path d="M${x} ${y}H${x + w}L${x + w - h * .9} ${y - h}H${x + h * .9}Z" fill="none" stroke="${INK}" stroke-width="${LINE}"/>`;
const medal = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${CUT}" stroke="${INK}" stroke-width="${LINE * .7}"/>${star(x, y, r * .78, '#e0156f')}`;
const chhatri = (cx, y, s) => `${dome(cx, y - 72 * s, 38 * s, 62 * s, '#ff8a1f')}${block(cx - 44 * s, y - 58 * s, 88 * s, 58 * s, '#0b7a75')}${litArch(cx - 35 * s, y, 27 * s, 46 * s)}${litArch(cx + 8 * s, y, 27 * s, 46 * s)}${roof(cx - 58 * s, y - 58 * s, 116 * s, 14 * s)}`;
const lights = (x1, y1, x2, y2, sag, n) => {
  let s = `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (1 - t) ** 2 * x1 + 2 * t * (1 - t) * (x1 + x2) / 2 + t * t * x2;
    const y = (1 - t) ** 2 * y1 + 2 * t * (1 - t) * ((y1 + y2) / 2 + sag * 2) + t * t * y2;
    s += `<circle cx="${f1(x)}" cy="${f1(y + 3)}" r="6.5" fill="${['#ffd65c', '#ff5fa2', '#7dffc7', '#ff8a1f'][i % 4]}" stroke="${INK}" stroke-width="2.4"/>`;
  }
  return s;
};
const burst = (x, y, s, cols) => {
  const n = 22, ray = (a, r1, r2, c, sw) => `<path d="M${f1(x + Math.cos(a) * r1)} ${f1(y + Math.sin(a) * r1)}L${f1(x + Math.cos(a) * r2)} ${f1(y + Math.sin(a) * r2)}" stroke="${c}" stroke-width="${sw}"/>`;
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, len = s * (i % 2 ? 1 : .74), c = cols[i % cols.length];
    o += ray(a, s * .24, len, INK, 8.5) + ray(a, s * .24, len, c, 4.2);
    o += `<circle cx="${f1(x + Math.cos(a) * (len + 7))}" cy="${f1(y + Math.sin(a) * (len + 7))}" r="4.5" fill="${c}" stroke="${INK}" stroke-width="2.2"/>`;
  }
  return o + star(x, y, s * .2, '#ffd65c', INK);
};
const skyBands = (W, H, tops) => {
  const cols = ['#0a0a42', '#1a0d55', '#320f66', '#561268', '#8a1a5c', '#c93a3a'];
  return cols.map((c, i) => `<rect y="${f1(tops[i] * H)}" width="${W}" height="${H}" fill="${c}"/>`).join('');
};
const skyDots = (W, H, n, m) => {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f1(rnd(0, W))}" cy="${f1(rnd(0, H))}" r="${f1(rnd(1.2, 2.6))}" fill="${CUT}"/>`;
  for (let i = 0; i < m; i++) s += star(f1(rnd(20, W - 20)), f1(rnd(20, H)), f1(rnd(8, 13)), '#ffd65c', INK);
  return s;
};
function diya(x, y, s, flames) {
  const bowl = `M${x - 30 * s} ${y - 3 * s}Q${x} ${y + 3 * s} ${x + 30 * s} ${y - 3 * s}L${x + 38 * s} ${y - 9 * s}Q${x + 24 * s} ${y + 22 * s} ${x} ${y + 21 * s}Q${x - 26 * s} ${y + 21 * s} ${x - 30 * s} ${y - 3 * s}Z`;
  return `<g stroke-linejoin="round"><path d="${bowl}" fill="${CUT}" stroke="${CUT}" stroke-width="${9 * s}"/><path d="${bowl}" fill="#d9642a" stroke="${INK}" stroke-width="${3 * s}"/>
    <path d="M${x + 8 * s} ${y + 19 * s}Q${x + 26 * s} ${y + 16 * s} ${x + 35 * s} ${y - 7 * s}L${x + 27 * s} ${y - 1 * s}Q${x + 20 * s} ${y + 11 * s} ${x + 8 * s} ${y + 19 * s}Z" fill="#a8441a"/>
    <path d="M${x - 19 * s} ${y + 8 * s}Q${x} ${y + 13 * s} ${x + 19 * s} ${y + 8 * s}" fill="none" stroke="#ffd65c" stroke-width="${2.2 * s}" stroke-dasharray="1 5" stroke-linecap="round"/>` +
    (flames ? `<path d="M${x} ${y - 40 * s}C${x + 15 * s} ${y - 16 * s} ${x + 10 * s} ${y - 3 * s} ${x} ${y - 3 * s}C${x - 10 * s} ${y - 3 * s} ${x - 15 * s} ${y - 16 * s} ${x} ${y - 40 * s}Z" fill="#ffb52e" stroke="${INK}" stroke-width="${2.4 * s}"/><path d="M${x} ${y - 24 * s}C${x + 5 * s} ${y - 13 * s} ${x + 4 * s} ${y - 6 * s} ${x} ${y - 6 * s}C${x - 4 * s} ${y - 6 * s} ${x - 5 * s} ${y - 13 * s} ${x} ${y - 24 * s}Z" fill="#fff5c4"/>` : '') + '</g>';
}
function pot(x, y) {
  const body = `M${x - 48} ${y}h96l-14 62h-68z`;
  return `${mangoLeaf(x - 68, y - 32, 38, 40)}${mangoLeaf(x + 68, y - 32, 38, -40)}${marigold(x, y - 44, 30)}${marigold(x - 36, y - 16, 27)}${marigold(x + 36, y - 14, 26)}
    <path d="${body}" fill="#d9642a" stroke="${INK}" stroke-width="${LINE}"/><path d="M${x + 16} ${y + 2}H${x + 47}L${x + 33} ${y + 60}H${x + 16}Z" fill="#a8441a"/>${zigzag(x - 38, y + 20, 76, 6, 10, '#ffd65c', 2.6)}<path d="${body}" fill="none" stroke="${INK}" stroke-width="${LINE}"/>`;
}
function floor(W, top, H) {
  let s = `<rect y="${top}" width="${W}" height="${H - top}" fill="#3c0a24"/>`;
  for (let i = -2; i * 90 < W + 90; i++) for (let j = 0; top + j * 45 < H; j++) {
    const x = i * 90 + (j % 2) * 45 + 45, y = top + j * 45 + 26;
    s += `<path d="M${x} ${y - 21}L${x + 43} ${y}L${x} ${y + 21}L${x - 43} ${y}Z" fill="#5c0f2e"/>`;
  }
  return s + `<rect y="${top}" width="${W}" height="${LINE * 1.2}" fill="${INK}"/>`;
}

const TALL_DIYAS = [100, 275, 450, 625, 800].map((x, i) => [x, 1680 + (i % 2) * 34]);
function tallScene() {
  const W = 900, H = 1800;
  let s = skyBands(W, H, [0, .13, .24, .34, .43, .52]) + skyDots(W, 1000, 110, 14);
  s += burst(190, 195, 150, ['#ff5fa2', '#ffd65c', CUT]) + burst(700, 165, 165, ['#7dffc7', CUT, '#39c9c2']) + burst(450, 110, 86, ['#ffd65c', '#ff8a1f', CUT]);
  s += burst(118, 545, 92, ['#ff8a1f', '#ffd65c', '#ff5fa2']) + burst(792, 530, 100, ['#a6c8ff', CUT, '#ffd65c']);
  // one cream edge around the whole palace, like the crackers' cut-out line
  const outline = [`<path d="${domePath(450, 900, 196, 300)}"/>`, `<rect x="124" y="870" width="652" height="660"/>`];
  for (const cx of [62, 838]) outline.push(`<path d="${domePath(cx, 936, 52, 96)}"/><rect x="${cx - 62}" y="936" width="124" height="600"/>`);
  s += `<g fill="${CUT}" stroke="${CUT}" stroke-width="15">${outline.join('')}</g>`;
  for (const cx of [62, 838]) {
    s += dome(cx, 936, 52, 96, '#ff3d3d') + block(cx - 62, 960, 124, 560, '#0b7a75') + roof(cx - 76, 960, 152, 26);
    for (const y of [1140, 1290, 1440]) s += litArch(cx - 34, y, 68, 112) + band(cx - 62, y + 2, 124, 18, '#7d0a3c');
  }
  s += dome(450, 900, 196, 300, '#e0156f');
  s += block(124, 900, 652, 620, '#7d0a3c') + roof(102, 900, 696, 30);
  s += chhatri(178, 870, 1.05) + chhatri(722, 870, 1.05);
  s += band(124, 900, 652, 24);
  for (const x of [168, 284, 400, 516, 632]) s += litArch(x, 1088, 100, 136);
  s += band(124, 1088, 652, 24);
  for (const x of [168, 284, 400, 516, 632]) s += litArch(x, 1284, 100, 150);
  s += band(124, 1284, 652, 24);
  for (const x of [142, 244, 576, 678]) s += litArch(x, 1510, 80, 176);
  s += litArch(358, 1510, 184, 200);
  for (const x of [270, 630]) s += medal(x, 1346, 15);
  s += lights(450, 575, 62, 815, 30, 18) + lights(450, 575, 838, 815, 30, 18);
  s += `<rect y="1510" width="${W}" height="44" fill="#0b7a75" stroke="${INK}" stroke-width="${LINE}"/>`;
  for (let i = 0; i < 23; i++) s += `<path d="${mult(i * 40 + 6, 1551, 26, 30)}" fill="${INK}" stroke="#ffd65c" stroke-width="2"/>`;
  s += floor(W, 1551, H) + pot(70, 1586) + pot(830, 1586);
  for (const [x, y] of TALL_DIYAS) s += diya(x, y, 1.45, false);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g stroke-linejoin="round" stroke-linecap="round">${s}</g></svg>`;
}

const DIYAS = [150, 278, 406, 534, 662, 938, 1066, 1194, 1322, 1450].map((x, i) => [x, 750 + (i % 2) * 14, 1.05]);
function halfWide() {
  let s = `<g fill="${CUT}" stroke="${CUT}" stroke-width="15"><path d="${domePath(168, 276, 88, 148)}"/><rect x="60" y="276" width="216" height="384"/><rect x="276" y="462" width="524" height="200"/></g>`;
  s += dome(168, 276, 88, 148, '#e0156f') + block(60, 300, 216, 360, '#7d0a3c') + roof(38, 300, 260, 24);
  s += chhatri(70, 276, .68) + chhatri(266, 276, .68);
  for (const y of [400, 520]) { for (const x of [84, 146, 208]) s += litArch(x, y, 44, 76); s += band(60, y, 216, 14); }
  s += litArch(112, 658, 112, 112);
  s += block(276, 480, 524, 180, '#7d0a3c') + band(276, 462, 524, 20);
  for (let i = 0; i < 8; i++) s += litArch(292 + i * 64, 650, 46, 118);
  s += chhatri(470, 462, .9) + chhatri(652, 462, .75);
  s += lights(168, 112, 470, 330, 26, 16) + lights(470, 330, 652, 362, 16, 10) + lights(652, 362, 800, 300, 16, 8);
  return s;
}
function scene(flames) {
  let s = skyBands(1600, 800, [0, .16, .3, .43, .56, .68]) + skyDots(1600, 500, 110, 12);
  s += burst(420, 150, 112, ['#ff5fa2', '#ffd65c', CUT]) + burst(1205, 165, 124, ['#7dffc7', CUT, '#39c9c2']) + burst(640, 95, 62, ['#ffd65c', '#ff8a1f', CUT]) + burst(965, 80, 70, ['#ff8a1f', '#ffd65c', '#ff5fa2']);
  s += `${halfWide()}<g transform="translate(1600 0) scale(-1 1)">${halfWide()}</g>`;
  s += `<rect y="660" width="1600" height="40" fill="#0b7a75" stroke="${INK}" stroke-width="${LINE}"/>`;
  for (let i = 0; i < 40; i++) s += `<path d="${mult(i * 40 + 8, 697, 24, 28)}" fill="${INK}" stroke="#ffd65c" stroke-width="2"/>`;
  s += floor(1600, 696, 800) + pot(52, 690) + pot(1548, 690);
  s += DIYAS.map(([x, y, k]) => diya(x, y, k, flames)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800"><g stroke-linejoin="round" stroke-linecap="round">${s}</g></svg>`;
}

const write = (f, s) => fs.writeFileSync(art(f), s);
write('toran.svg', toran()); write('rangoli.svg', rangoli());
for (const [n, fn] of Object.entries({ chakri, anar, rocket, bomb, ladi, dud })) write(`${n}.svg`, fn());

const b = await chromium.launch({ channel: 'chrome' });
const shot = async (html, w, h, out, q) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot(out.endsWith('.png') ? { path: out, type: 'png' } : { path: out, type: 'jpeg', quality: q });
  await p.close();
};
const page = (b, w, h) => `<!DOCTYPE html><meta charset="utf-8"><style>*{margin:0}body{width:${w}px;height:${h}px;overflow:hidden;background:#000}</style>${b}`;
await shot(page(tallScene(), 900, 1800), 900, 1800, art('scene.jpg'), 86);

const uri = f => `data:image/svg+xml;base64,${fs.readFileSync(art(f)).toString('base64')}`;
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${root}/fonts/${f}`).toString('base64')}`;
// The link preview is the greeting itself: nothing to read but who it is from, nothing that needs a tap.
function card() {
  const W = 1200, H = 630;
  let s = skyBands(W, H, [0, .2, .38, .54, .68, .8]) + skyDots(W, 480, 70, 10);
  s += burst(165, 235, 118, ['#ff5fa2', '#ffd65c', CUT]) + burst(1035, 225, 124, ['#7dffc7', CUT, '#39c9c2']);
  s += burst(285, 425, 62, ['#ffd65c', '#ff8a1f', CUT]) + burst(925, 430, 66, ['#ff8a1f', '#ffd65c', '#ff5fa2']);
  s += `<rect y="520" width="${W}" height="16" fill="#0b7a75" stroke="${INK}" stroke-width="${LINE}"/>` + floor(W, 534, H);
  for (const [i, x] of [100, 240, 380, 520, 680, 820, 960, 1100].entries()) s += diya(x, 562 + (i % 2) * 8, 1.1, true);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0"><g stroke-linejoin="round" stroke-linecap="round">${s}</g></svg>`;
}
const preview = (lines, fam, size, top, second = '') => `<style>
@font-face{font-family:T;src:url(${font(fam)})}
.t{position:absolute;left:0;right:0;top:${top}px;text-align:center}
h1{font:400 ${size}px/1.02 T;padding:.3em .12em .16em;margin:-.3em 0 -.16em;background:linear-gradient(#fff6c0,#ffd65c 46%,#ff9a1a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 5px 0 #7a1414) drop-shadow(0 0 26px #ff7a1aaa)}
p{font:400 ${Math.round(size * .62)}px/1.2 T;color:#fff4d6;margin-top:10px;filter:drop-shadow(0 3px 0 #7a1414)}
.o{position:absolute;left:0;right:0;top:0;height:92px;background:url(${uri('toran.svg')}) repeat-x;background-size:auto 100%}
</style>${card()}<div class=o></div><div class=t><h1>${lines.join('<br>')}</h1>${second ? `<p>${second}</p>` : ''}</div>`;
await shot(page(preview(['Happy', 'Diwali'], 'yatra-latin.woff2', 140, 128), 1200, 630), 1200, 630, `${root}/preview-en.jpg`, 88);
await shot(page(preview(['শুভ দীপাবলি'], 'galada-bengali.woff2', 112, 170, 'তোর্ষা ও ঋজু'), 1200, 630), 1200, 630, `${root}/preview-bn.jpg`, 88);
// The server writes the sender's name into the gap under the title.
await shot(page(preview(['Happy', 'Diwali'], 'yatra-latin.woff2', 132, 98), 1200, 630).replace('<style>', '<style>html{zoom:.6667}'), 800, 420, `${root}/preview-base.png`);
await b.close();
console.log('art done', DIYAS.map(d => d.join(',')).join(' '));
