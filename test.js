// Run: node test.js
const assert = require('node:assert');
const { nextScore, cleanName, pick, shareHref } = require('./game.js');

assert.equal(nextScore(10, -20), 0, 'score never goes below zero');
assert.equal(nextScore(10, 25), 35);

assert.equal(cleanName('  Priya '), 'Priya');
assert.equal(cleanName(null), '');
assert.equal([...cleanName('🪔'.repeat(40))].length, 30, 'emoji is not cut in half');

const near = { x: 100, y: 100, r: 20 }, far = { x: 130, y: 100, r: 20 };
assert.equal(pick([far, near], 105, 100), near, 'closest cracker wins');
assert.equal(pick([near], 200, 200), null, 'a miss hits nothing');
assert.equal(pick([near], 135, 100), near, 'slop forgives near misses');

const T = { num: n => String(n), invite: n => `hi ${n}`, brag: (s, n) => `got ${s} ${n}` };
const text = href => decodeURIComponent(href.split('?text=')[1]);
assert.equal(text(shareHref(T, 'https://x.co/', '', 340)), 'got 340  https://x.co/');
assert.equal(text(shareHref(T, 'https://x.co/', 'A&B', null)), 'hi A&B https://x.co/?from=A%26B', 'name is URL-safe');
assert.ok(shareHref(T, 'https://x.co/', 'A&B', 5).startsWith('https://wa.me/?text='));
assert.equal(text(shareHref(T, 'https://x.co/', '', 0)), 'got 0  https://x.co/', 'a zero score still brags');
console.log('ok');
