// 教材の中の PDF を、スライドのように1ページずつ縦に並べて表示する
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOMS = [1, 1.25, 1.5, 2, 3];
const ICON_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const ICON_ZOOM = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>';

export async function mountPdf(el, url) {
  if (el.dataset.mounted) return;
  el.dataset.mounted = '1';
  el.innerHTML = `
    <div class="pv-scroll"><div class="pv-pages"></div></div>
    <a class="pv-open" href="${url}" target="_blank" rel="noopener" title="別タブで開く" aria-label="別タブで開く">${ICON_OPEN}</a>
    <div class="pv-bar">
      <input class="pv-num" inputmode="numeric" value="1" aria-label="ページ"><span class="pv-total">/ …</span><span class="pv-unit">ページ目</span>
      <span class="pv-sep"></span>
      <button class="pv-btn" data-z="-1" aria-label="縮小">−</button>
      <button class="pv-btn pv-fit" data-z="0" aria-label="元の大きさ">${ICON_ZOOM}</button>
      <button class="pv-btn" data-z="1" aria-label="拡大">+</button>
    </div>`;
  const scroll = el.querySelector('.pv-scroll'), pagesEl = el.querySelector('.pv-pages');
  const num = el.querySelector('.pv-num'), total = el.querySelector('.pv-total');

  let doc;
  try { doc = await pdfjs.getDocument(url).promise; }
  catch (e) { console.error(e); el.classList.add('pv-error'); pagesEl.innerHTML = '<p class="pv-msg">PDFを読み込めませんでした</p>'; return; }
  total.textContent = `/ ${doc.numPages}`;

  // 1ページ目の縦横比に合わせて、枠の高さを決める
  const first = await doc.getPage(1);
  const vp1 = first.getViewport({ scale: 1 });
  el.style.aspectRatio = `${vp1.width} / ${vp1.height}`;

  let zoom = 0; // ZOOMS の何番目か
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'pv-page';
    wrap.dataset.n = i;
    wrap.style.aspectRatio = `${vp1.width} / ${vp1.height}`;
    pagesEl.append(wrap);
    pages.push({ wrap, rendered: 0, task: null });
  }

  // 見えているページだけ描く（拡大したら描き直す）
  async function draw(p) {
    const n = +p.wrap.dataset.n;
    const w = p.wrap.clientWidth;
    if (!w || p.rendered === w) return;
    p.rendered = w;
    const page = n === 1 ? first : await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    p.wrap.style.aspectRatio = `${base.width} / ${base.height}`;
    const scale = (w / base.width) * Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    try { p.task?.cancel(); } catch {}
    p.task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
    try { await p.task.promise; } catch { return; }
    p.wrap.replaceChildren(canvas);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) draw(pages[+e.target.dataset.n - 1]);
  }), { root: scroll, rootMargin: '100% 0px' });
  pages.forEach(p => io.observe(p.wrap));

  // いま見ているページ番号
  scroll.addEventListener('scroll', () => {
    const mid = scroll.scrollTop + scroll.clientHeight / 2;
    const cur = pages.findIndex(p => p.wrap.offsetTop + p.wrap.offsetHeight > mid);
    if (document.activeElement !== num) num.value = (cur < 0 ? pages.length : cur + 1);
  }, { passive: true });

  const goto = n => {
    n = Math.max(1, Math.min(doc.numPages, n | 0));
    scroll.scrollTo({ top: pages[n - 1].wrap.offsetTop, behavior: 'smooth' });
    num.value = n;
  };
  num.onkeydown = e => { if (e.key === 'Enter') { goto(+num.value); num.blur(); } };
  num.onblur = () => goto(+num.value);

  // 拡大・縮小（見ていたページの位置を保つ）
  el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
    const d = +b.dataset.z;
    const next = d === 0 ? 0 : Math.max(0, Math.min(ZOOMS.length - 1, zoom + d));
    if (next === zoom) return;
    const ratioY = scroll.scrollTop / (scroll.scrollHeight || 1);
    const ratioX = (scroll.scrollLeft + scroll.clientWidth / 2) / (scroll.scrollWidth || 1);
    zoom = next;
    pagesEl.style.width = `${ZOOMS[zoom] * 100}%`;
    scroll.scrollTop = ratioY * scroll.scrollHeight;
    scroll.scrollLeft = ratioX * scroll.scrollWidth - scroll.clientWidth / 2;
    pages.forEach(p => { const r = p.wrap.getBoundingClientRect(), s = scroll.getBoundingClientRect(); if (r.bottom > s.top - s.height && r.top < s.bottom + s.height) draw(p); });
  });

  // 画面の幅が変わったら描き直す
  new ResizeObserver(() => pages.forEach(p => { if (p.wrap.firstChild && p.rendered !== p.wrap.clientWidth) draw(p); })).observe(scroll);
}
