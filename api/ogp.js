// 記事URLのタイトル・説明・画像（OGP）を取ってくる。教材の中のリンクカード用
export default async function handler(req, res) {
  const raw = String(req.query.url || '');
  let u;
  try { u = new URL(raw); } catch { return res.status(400).json({ error: 'bad url' }); }
  // 外部の http(s) だけ（内部ネットワークには行かない）
  if (!/^https?:$/.test(u.protocol) || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i.test(u.hostname)) {
    return res.status(400).json({ error: 'bad url' });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; DesignStudyBot/1.0)', accept: 'text/html' } });
    clearTimeout(timer);
    const html = (await r.text()).slice(0, 400000);
    const meta = name => {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i');
      const tag = html.match(re)?.[0];
      return tag?.match(/content=["']([^"']*)["']/i)?.[1];
    };
    const decode = s => s && s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const abs = s => { try { return s ? new URL(decode(s), r.url).href : ''; } catch { return ''; } };
    const icon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1];
    const data = {
      title: decode(meta('og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]) || '',
      description: decode(meta('og:description') || meta('description')) || '',
      image: abs(meta('og:image')),
      site: decode(meta('og:site_name')) || new URL(r.url).hostname,
      icon: abs(icon) || `${new URL(r.url).origin}/favicon.ico`,
    };
    res.setHeader('cache-control', 's-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'fetch failed' });
  }
}
