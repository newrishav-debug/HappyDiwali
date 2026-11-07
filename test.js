// Run: node test.js
const assert = require('node:assert');
const { nextScore, cleanName, pick, shareHref, rankFor } = require('./game.js');

assert.equal(nextScore(10, -20), 0, 'score never goes below zero');
assert.equal(nextScore(10, 25), 35);

assert.equal(cleanName('  Priya '), 'Priya');
assert.equal(cleanName(null), '');
assert.equal(cleanName('a/b'), 'a b', 'a slash cannot break the link');
assert.equal([...cleanName('🪔'.repeat(40))].length, 30, 'emoji is not cut in half');

const near = { x: 100, y: 100, hitR: 34 }, far = { x: 130, y: 100, hitR: 34 };
assert.equal(pick([far, near], 105, 100), near, 'closest cracker wins');
assert.equal(pick([near], 200, 200), null, 'a miss hits nothing');
assert.equal(pick([near], 132, 100), near, 'hit radius forgives near misses');

const ranks = [[0, 'low'], [300, 'mid'], [900, 'top']];
assert.equal(rankFor(ranks, 0), 'low');
assert.equal(rankFor(ranks, 300), 'mid', 'reaching a threshold earns the rank');
assert.equal(rankFor(ranks, 5000), 'top');

const T = { ranks, num: n => String(n), invite: n => `hi ${n}`, brag: (s, n, r) => `got ${s} ${n} ${r}` };
const text = href => decodeURIComponent(href.split('?text=')[1]);
assert.equal(text(shareHref(T, 'https://x.co/', '', 340)), 'got 340  mid https://x.co/');
assert.equal(text(shareHref(T, 'https://x.co/', 'A&B', null)), 'hi A&B https://x.co/from/A%26B', 'name is URL-safe');
assert.ok(shareHref(T, 'https://x.co/', 'A&B', 5).startsWith('https://wa.me/?text='));
assert.equal(text(shareHref(T, 'https://x.co/', '', 0)), 'got 0  low https://x.co/', 'a zero score still shares');

// The server page: a sender's name is untrusted text going into HTML.
import('./api/page.mjs').then(async ({ GET: page }) => {
  const shell = '<head><title>x</title><meta property="og:title" content="old"><meta property="og:description" content="old"><meta property="og:url" content="old"><meta property="og:image" content="old"></head>';
  globalThis.fetch = async () => new Response(shell);
  const html = await (await page(new Request('https://s.co/api/page?from=%22%3E%3Cscript%3Ealert(1)%3C/script%3E'))).text();
  assert.ok(!html.includes('<script>'), 'a name cannot inject a script');
  assert.ok(html.includes('<base href="/">'), 'assets still load from a /from/name address');
  const ok = await (await page(new Request('https://s.co/api/page?from=Priya'))).text();
  assert.ok(ok.includes('content="https://s.co/api/preview?from=Priya"'), 'preview image carries the name');
  assert.ok(ok.includes('from Priya'), 'preview title carries the name');
  console.log('ok');
});
