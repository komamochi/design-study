// 教材の画像を取ってくる（ブラウザから直接取れない画像を、アプリの保存用に中継する）
// ログインしている本人だけが使える
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://blfvlyeuchrgbumqrwpw.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_XVVv68TS843fQcoVF3k1_Q_MqRcf29t';
const MAX = 15 * 1024 * 1024;

export default async function handler(req, res) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'login required' });
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` } });
  if (!who.ok) return res.status(401).json({ error: 'login required' });

  let u;
  try { u = new URL(String(req.query.url || '')); } catch { return res.status(400).json({ error: 'bad url' }); }
  if (!/^https?:$/.test(u.protocol) || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i.test(u.hostname)) {
    return res.status(400).json({ error: 'bad url' });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; DesignStudy/1.0)', accept: 'image/*' } });
    clearTimeout(timer);
    const type = (r.headers.get('content-type') || '').split(';')[0].trim();
    if (!r.ok) return res.status(502).json({ error: `status ${r.status}` });
    if (!type.startsWith('image/')) return res.status(415).json({ error: 'not an image' });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX) return res.status(413).json({ error: 'too large' });
    res.setHeader('content-type', type);
    res.setHeader('cache-control', 'no-store');
    return res.status(200).send(buf);
  } catch {
    return res.status(502).json({ error: 'fetch failed' });
  }
}
