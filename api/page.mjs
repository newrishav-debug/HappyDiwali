// /from/<name> serves the normal game page with that name in its WhatsApp preview.
const clean = s => [...String(s || '').replace(/[\/\\]/g, ' ').trim()].slice(0, 30).join('');
const esc = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const setMeta = (html, prop, value) => html.replace(new RegExp(`(<meta property="${prop}" content=")[^"]*`), `$1${value}`);

export async function GET(req) {
  const url = new URL(req.url), name = clean(url.searchParams.get('from'));
  let html = await (await fetch(new URL('/index.html', url))).text();
  if (name) {
    const safe = esc(name);
    html = setMeta(html, 'og:title', `🪔 Happy Diwali from ${safe}!`);
    html = setMeta(html, 'og:description', 'Tap to Play');
    html = setMeta(html, 'og:url', `${url.origin}/from/${encodeURIComponent(name)}`);
    html = setMeta(html, 'og:image', `${url.origin}/api/preview?from=${encodeURIComponent(name)}`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>Happy Diwali from ${safe}!</title>`);
  }
  // The address is two folders deep, so relative files need pointing back at the root.
  html = html.replace('<head>', '<head>\n<base href="/">');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, s-maxage=86400' } });
}

export const HEAD = GET; // link-preview fetchers may check with HEAD first
