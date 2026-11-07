// The WhatsApp preview image with the sender's name written on it.
import { ImageResponse } from '@vercel/og';

// What the title font can draw; anything else (Bengali, emoji) would print as empty boxes.
const DRAWABLE = /^[\p{Script=Latin}\p{Script=Devanagari}\p{M}\p{N}\p{Zs}.'’&-]+$/u;

export async function GET(req) {
  const url = new URL(req.url);
  const name = [...(url.searchParams.get('from') || '').trim()].slice(0, 30).join('');
  if (!DRAWABLE.test(name)) return Response.redirect(new URL('/preview-en.jpg', url), 302);

  const font = await (await fetch(new URL('/fonts/yatra-full.ttf', url))).arrayBuffer();
  const size = name.length <= 14 ? 56 : name.length <= 22 ? 44 : 34;
  const text = `from ${name}`;
  const image = new ImageResponse({
    type: 'div',
    props: {
      style: { width: 800, height: 420, display: 'flex', position: 'relative' },
      children: [
        { type: 'img', props: { src: new URL('/preview-base.png', url).href, width: 800, height: 420, style: { position: 'absolute', left: 0, top: 0 } } },
        { type: 'div', props: { style: { position: 'absolute', left: 0, right: 0, top: 223, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Yatra', fontSize: size * .8, color: '#fff4d6', textShadow: '0 2px 0 #7a1414' }, children: text } },
      ],
    },
  }, { width: 800, height: 420, fonts: [{ name: 'Yatra', data: font, weight: 400, style: 'normal' }] });
  image.headers.set('cache-control', 'public, immutable, max-age=31536000');
  return image;
}

export const HEAD = GET; // link-preview fetchers may check with HEAD first
