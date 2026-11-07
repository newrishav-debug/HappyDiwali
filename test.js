// Run: node test.js
const assert = require('node:assert');
const { nextScore, cleanName, pick, shareHref, rankFor, toStage } = require('./game.js');

assert.equal(nextScore(10, -20), 0, 'score never goes below zero');
assert.equal(nextScore(10, 25), 35);

assert.equal(cleanName('  Priya '), 'Priya');
assert.equal(cleanName(null), '');
assert.equal([...cleanName('🪔'.repeat(40))].length, 30, 'emoji is not cut in half');

const near = { x: 100, y: 100, hitR: 34 }, far = { x: 130, y: 100, hitR: 34 };
assert.equal(pick([far, near], 105, 100), near, 'closest cracker wins');
assert.equal(pick([near], 200, 200), null, 'a miss hits nothing');
assert.equal(pick([near], 132, 100), near, 'hit radius forgives near misses');

// A stage point (sx, sy) is painted at screen (W - sy, sx) when rotated 90° clockwise.
assert.deepEqual(toStage(50, 60, 390, false), [50, 60], 'landscape passes straight through');
const [sx, sy] = [700, 40];
assert.deepEqual(toStage(390 - sy, sx, 390, true), [sx, sy], 'upright phone maps a tap back to the stage');

const ranks = [[0, 'low'], [300, 'mid'], [900, 'top']];
assert.equal(rankFor(ranks, 0), 'low');
assert.equal(rankFor(ranks, 300), 'mid', 'reaching a threshold earns the rank');
assert.equal(rankFor(ranks, 5000), 'top');

const T = { ranks, num: n => String(n), invite: n => `hi ${n}`, brag: (s, n, r) => `got ${s} ${n} ${r}` };
const text = href => decodeURIComponent(href.split('?text=')[1]);
assert.equal(text(shareHref(T, 'https://x.co/', '', 340)), 'got 340  mid https://x.co/');
assert.equal(text(shareHref(T, 'https://x.co/', 'A&B', null)), 'hi A&B https://x.co/?from=A%26B', 'name is URL-safe');
assert.ok(shareHref(T, 'https://x.co/', 'A&B', 5).startsWith('https://wa.me/?text='));
assert.equal(text(shareHref(T, 'https://x.co/', '', 0)), 'got 0  low https://x.co/', 'a zero score still shares');
console.log('ok');
