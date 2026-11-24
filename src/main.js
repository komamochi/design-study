/* DESIGN STUDY - 進捗と教材は Supabase に保存（Web Archive・ひとりガントと同じアカウント） */
import './style.css';
import { createClient } from '@supabase/supabase-js';
import { COURSES } from './data.js';
import { icon } from './icons.js';
import { illustSvg } from './illust.js';
import { MD } from './markdown.js';

(() => {
  const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- store ----------
  function seed() {
    const done = {};
    // はじめて使うときの初期値：デザイン基礎 1〜21 とお役立ち資料 1 を完了済みに
    const days = ['2026-11-09', '2026-11-10', '2026-11-10', '2026-11-10', '2026-11-10', '2026-11-10', '2026-11-10', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-11', '2026-11-12', '2026-11-14', '2026-11-14', '2026-11-14', '2026-11-15', '2026-11-15'];
    COURSES[0].chapters.slice(0, 21).forEach((c, i) => { done[c.id] = days[i] + 'T12:00:00'; });
    done['docs-1'] = '2026-11-05T12:00:00';
    return { done, doing: {}, view: 'grid' };
  }
  let state = seed();
  let CONTENT = {};            // チャプターID → 貼り付けた教材（Markdown）
  let session = null, lastUpdated = null, dirty = false, saving = false, saveTimer = null;

  // 進捗：少し待ってからまとめて保存
  const save = () => { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(push, 600); };
  async function push() {
    if (!session) return;
    if (saving) { saveTimer = setTimeout(push, 400); return; }
    saving = true;
    const updated_at = new Date().toISOString();
    const { error } = await sb.from('study_data').upsert({ user_id: session.user.id, data: state, updated_at });
    saving = false;
    if (error) { console.error(error); toast('保存できませんでした'); return; }
    lastUpdated = updated_at; dirty = false;
  }
  let lastSig = '';
  async function load(initial) {
    const [{ data: row, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
      sb.from('study_data').select('data,updated_at').eq('user_id', session.user.id).maybeSingle(),
      sb.from('study_contents').select('chapter_id,body').eq('user_id', session.user.id),
    ]);
    if (e1 || e2) { console.error(e1 || e2); toast('読み込めませんでした'); if (initial) render(); return; }
    if (!dirty) {
      if (row && row.data && row.data.done) { state = { doing: {}, view: 'grid', ...row.data }; lastUpdated = row.updated_at; }
      else if (initial && !row) { push(); }   // はじめてのときは初期値を保存
    }
    CONTENT = Object.fromEntries((rows || []).map(r => [r.chapter_id, r.body]));
    // 定期的な読み込みでは、中身が変わったときだけ描き直す（読んでいる途中で画面が動かないように）
    const sig = JSON.stringify([state, CONTENT]);
    const changed = sig !== lastSig; lastSig = sig;
    if (!document.querySelector('.modal') && (initial || changed)) {
      const y = window.scrollY; render(); if (!initial) window.scrollTo(0, y);
    }
    if (initial) mirrorImages();
  }

  // ---------- 教材の画像をアプリ（Supabase）に保存する ----------
  // 元のサイトがなくなっても画像が消えないように、外部の画像をコピーして storage:場所 に書きかえる
  const BUCKET = 'study-files';
  const IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)((?:\s+"[^"]*")?)\)/g;
  const tried = new Set();
  let mirroring = false, mirrorErr = '';
  async function sha(t) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(h)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function mirrorOne(url) {
    try {
      // まずブラウザから直接取る。取れなければアプリのサーバー経由で取る
      let blob = null;
      try { const d = await fetch(url, { mode: 'cors' }); if (d.ok) { const b = await d.blob(); if (b.type.startsWith('image/')) blob = b; } } catch {}
      if (!blob) {
        const r = await fetch(`/api/img?url=${encodeURIComponent(url)}`, { headers: { authorization: `Bearer ${session.access_token}` } });
        if (!r.ok) { console.warn('画像を取れませんでした', r.status, await r.text().catch(() => ''), url); return null; }
        blob = await r.blob();
      }
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'png';
      const path = `${session.user.id}/img/${await sha(url)}.${ext}`;
      // 上書き（upsert）は更新の権限がいるので使わない。すでにあれば保存済みとして扱う
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
      if (error && /exists|duplicate|409/i.test(`${error.message} ${error.statusCode || ''}`)) return path;
      if (error) { console.error('画像を保存できませんでした', error); mirrorErr = error.message || String(error); return null; }
      return path;
    } catch (e) { console.error(e); return null; }
  }
  async function mirrorImages() {
    if (mirroring || !session) return;
    mirroring = true;
    let saved = 0, failed = 0;
    try {
      for (const id of Object.keys(CONTENT)) {
        const urls = [...new Set([...(CONTENT[id] || '').matchAll(IMG_RE)].map(m => m[2]))].filter(u => !tried.has(u));
        if (!urls.length) continue;
        const map = {};
        for (const u of urls) { tried.add(u); const p = await mirrorOne(u); if (p) map[u] = p; else failed++; }
        if (!Object.keys(map).length) continue;
        const cur = CONTENT[id] || '';
        const next = cur.replace(IMG_RE, (all, alt, u, t) => map[u] ? `![${alt}](storage:${map[u]}${t})` : all);
        if (next !== cur && await setContent(id, next)) saved += Object.keys(map).length;
      }
    } finally { mirroring = false; }
    if (saved || failed) longToast(failed ? `画像${saved}枚を保存しました（${failed}枚は保存できませんでした${mirrorErr ? `：${mirrorErr}` : ''}）` : `画像${saved}枚をアプリに保存しました`);
    // 書きかえた教材は次に開いたときから使う（読んでいる画面は描き直さない）
    lastSig = JSON.stringify([state, CONTENT]);
  }

  // 教材：チャプターごとに1行
  const getContent = id => CONTENT[id] || '';
  async function setContent(id, v) {
    const q = v
      ? sb.from('study_contents').upsert({ user_id: session.user.id, chapter_id: id, body: v, updated_at: new Date().toISOString() })
      : sb.from('study_contents').delete().eq('user_id', session.user.id).eq('chapter_id', id);
    const { error } = await q;
    if (error) { console.error(error); return false; }
    if (v) CONTENT[id] = v; else delete CONTENT[id];
    return true;
  }

  const longToast = msg => { toast(msg); clearTimeout(toast.t); toast.t = setTimeout(() => ($('#toast').hidden = true), 6000); };
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1800); };

  // ---------- helpers ----------
  const course = id => COURSES.find(c => c.id === id);
  const doneCount = c => c.chapters.filter(ch => state.done[ch.id]).length;

  function progress(c) {
    const n = doneCount(c), t = c.chapters.length;
    return `<div class="progress"><div class="bar"><i style="width:${(n / t) * 100}%"></i></div><span>${n}/${t}</span></div>`;
  }
  function courseThumb(c) { return `<div class="thumb"><div class="en">${esc(c.en)}</div><span class="ja">${esc(c.title)}</span></div>`; }
  function chapterThumb(ch, cls = '') {
    const m = ch.title.match(/^(課題\S*|\S*\d\S*)\s+(.*)$/);
    const task = ch.title.startsWith('課題');
    const kind = task ? '課題' : (m ? m[1] : '');
    const name = m ? m[2] : ch.title;
    // イラストがあるチャプターはイラストカード
    const svg = illustSvg(ch.id);
    if (svg) return `<div class="thumb il ${task ? 'task' : ''} ${cls}">${svg}</div>`;
    // レイアウトは元のまま。色だけ 課題＝Figma講座カード、それ以外＝デザイン基礎カード に合わせる
    return `<div class="thumb dark ch-thumb ${task ? 'task' : ''} ${cls}"><div class="kind">${esc(kind)}</div><div class="en">${esc(name)}</div></div>`;
  }
  const chStatus = ch => state.done[ch.id] ? 'done' : state.doing[ch.id] ? 'doing' : 'none';
  const badge = ch => ({ done: '<span class="badge">完了</span>', doing: '<span class="badge doing">学習中</span>', none: '' })[chStatus(ch)];
  const check = ch => { const s = chStatus(ch); return `<span class="check ${s === 'done' ? 'on' : s === 'doing' ? 'doing' : ''}">${s === 'done' ? '✓' : ''}</span>`; };
  const emptyCat = msg => `<div class="empty"><img src="/cat.webp" alt=""><p>${msg}</p></div>`;

  // ---------- pages ----------
  function pageHome() {
    return `
      <div class="home-hero">
        <div>
          <p class="hero-sub">DESIGN SCHOOL</p>
          <h1 class="page-title">コース</h1>
        </div>
        <img src="/cat.webp" alt="" class="hero-cat">
      </div>
      <div class="course-grid">
        ${COURSES.map(c => `
          <a class="course-card" href="#/courses/${c.id}">
            <div class="zoom"><div class="cthumb ${c.dark ? 'dark' : ''}">
              ${icon(c.id)}
              <div class="en">${esc(c.en)}</div>
              <span class="ja">${esc(c.label || c.title)}</span>
            </div></div>
            <div class="info">
              <h3>${esc(c.title)}</h3>
              ${progress(c)}
            </div>
            <span class="chev">›</span>
          </a>`).join('')}
      </div>
      <div class="home-foot"><button class="link-btn" data-act="reset">学習ステータスをリセット</button><button class="link-btn" data-act="logout">ログアウト</button></div>`;
  }

  function pageCourse(id) {
    const c = course(id); if (!c) return notFound();
    const grid = state.view !== 'list';
    return `
      <a class="back-link" href="#/home">‹ コース一覧</a>
      <h1 class="page-title">${esc(c.title)}</h1>
      <div style="max-width:320px;margin:-8px 0 20px">${progress(c)}</div>
      <div class="toolbar" style="justify-content:flex-end">
        <div class="seg"><button data-view="grid" class="${grid ? 'on' : ''}">▦ カード</button><button data-view="list" class="${grid ? '' : 'on'}">☰ リスト</button></div>
      </div>
      ${grid ? `<div class="chapter-grid">${c.chapters.map(ch => `
          <a class="chapter-card" href="#/courses/${c.id}/${ch.id}"><div class="zoom">${chapterThumb(ch)}</div>${badge(ch)}<div class="t">${esc(ch.title)}</div></a>`).join('')}</div>`
        : `<div class="chapter-list">${c.chapters.map(ch => `<a href="#/courses/${c.id}/${ch.id}">${check(ch)}<span>${esc(ch.title)}</span></a>`).join('')}</div>`}`;
  }

  function pageChapter(cid, chid) {
    const c = course(cid); if (!c) return notFound();
    const idx = c.chapters.findIndex(x => x.id === chid); if (idx < 0) return notFound();
    const ch = c.chapters[idx], prev = c.chapters[idx - 1], next = c.chapters[idx + 1];
    const s = chStatus(ch);
    const n = `${idx + 1} / ${c.chapters.length}`;
    const content = getContent(ch.id);
    return `
      <div class="chapter-bar">
        <a class="back" href="#/courses/${c.id}">‹ ${esc(c.title)}</a>
        <span class="count only-narrow">${n}</span>
        <button class="btn only-narrow" data-act="toc">☰ 目次</button>
      </div>
      <div class="detail">
        <article>
          ${chapterThumb(ch, 'hero')}
          <small style="color:var(--muted)">チャプター ${n}</small>
          <h1 style="font-size:27px;margin-bottom:18px">${esc(ch.title)}</h1>
          ${content
            ? `<div class="md-tools only-narrow"><button class="btn" data-act="edit">✎ 教材を編集</button></div>${MD.render(content, ch.title)}`
            : `<div class="card empty-content">
                <p><b>まだ教材の内容がありません</b><br>元の教材の「全体をコピー」でコピーした文章を貼り付けると、ここに表示されます。</p>
                <button class="btn primary" data-act="edit">教材を貼り付け</button>
              </div>`}
          <div class="card done-wrap">
            <div class="done-box">
              <img src="/cat.webp" alt="">
              ${s === 'done'
                ? `<p>完了しました🐾 おつかれさま！</p><button class="btn" data-act="undone">未完了に戻す</button>`
                : `<p>ここまで学び終えたら</p><button class="btn wood big" data-act="done">完了にする</button>`}
            </div>
          </div>
          <div class="pager">
            ${prev ? `<a href="#/courses/${c.id}/${prev.id}"><small>‹ 前のチャプター</small>${esc(prev.title)}</a>` : ''}
            ${next ? `<a class="next" href="#/courses/${c.id}/${next.id}"><small>次のチャプター ›</small>${esc(next.title)}</a>` : ''}
          </div>
        </article>
        <aside class="side-box">
          <div class="side-nav only-wide">
            <span class="count">${n}</span>
            <button class="btn" data-act="toc">☰ 目次</button>
          </div>
          <div class="card">
          <div class="card-title">学習ステータス</div>
          <select class="status-select" data-act="status">
            <option value="none" ${s === 'none' ? 'selected' : ''}>未開始</option>
            <option value="doing" ${s === 'doing' ? 'selected' : ''}>学習中</option>
            <option value="done" ${s === 'done' ? 'selected' : ''}>完了</option>
          </select>
          <div style="margin-top:16px">${progress(c)}</div>
          </div>
          <button class="btn side-edit only-wide" data-act="edit">${content ? '✎ 教材を編集' : '教材を貼り付け'}</button>
        </aside>
      </div>`;
  }

  // 教材の中の [[チャプターID]] → チャプターのカードリンク
  const findChapter = id => { for (const c of COURSES) { const ch = c.chapters.find(x => x.id === id); if (ch) return { c, ch }; } return null; };
  MD.setLinkRenderer(id => {
    const f = findChapter(id); if (!f) return '';
    const { c, ch } = f;
    return `<a class="ch-link" href="#/courses/${c.id}/${ch.id}">
      <div class="ch-link-thumb">${chapterThumb(ch)}</div>
      <div class="ch-link-body"><small>${esc(c.title)}</small><b>${esc(ch.title)}</b></div>
      <span class="chev">›</span></a>`;
  });

  function contentEditor(chid, title) {
    const bg = document.createElement('div'); bg.className = 'drawer-bg';
    const md = document.createElement('div'); md.className = 'modal';
    const cur = getContent(chid);
    md.innerHTML = `
      <h3>教材を${cur ? '編集' : '貼り付け'}<small>${esc(title)}</small></h3>
      <p class="modal-note">元の教材の「全体をコピー」でコピーした文章をそのまま貼り付けてください。</p>
      <div class="modal-tools">
        <button class="btn" data-m="callout">💡 選んだ部分を枠で囲む</button>
        <button class="btn" data-m="quote"><span class="quote-chip"></span> 選んだ部分を引用にする</button>
        <button class="btn" data-m="pdf">📄 PDFを入れる</button><input type="file" accept="application/pdf" data-m="pdffile" hidden>
        <button class="btn" data-m="video">🎬 動画を入れる</button><input type="file" accept="video/mp4,video/quicktime,video/webm" data-m="videofile" hidden>
        <button class="btn" data-m="dark"><span class="dark-chip">A</span> 選んだ文字を黒背景にする</button>
        <select class="field" data-m="link" aria-label="チャプターのリンクを入れる">
          <option value="">🔗 チャプターのリンクを入れる</option>
          ${COURSES.map(c => `<optgroup label="${esc(c.title)}">${c.chapters.map(ch => `<option value="${ch.id}">${esc(ch.title)}</option>`).join('')}</optgroup>`).join('')}
        </select>
      </div>
      <textarea class="field" rows="16" placeholder="# タイトル&#10;&#10;## 見出し&#10;本文…">${esc(cur)}</textarea>
      <div class="modal-actions">
        ${cur ? '<button class="btn" data-m="del" style="color:var(--danger);margin-right:auto">内容を削除</button>' : ''}
        <button class="btn" data-m="cancel">キャンセル</button>
        <button class="btn primary" data-m="save">保存する</button>
      </div>`;
    const close = () => { bg.remove(); md.remove(); };
    bg.onclick = close;
    // 文字を入れかえても、編集欄のスクロール位置は動かさない
    const put = (ta, a, b, text, selA, selB) => {
      const top = ta.scrollTop;
      ta.focus({ preventScroll: true });
      ta.setRangeText(text, a, b);
      ta.setSelectionRange(selA, selB);
      ta.scrollTop = top;
    };
    md.querySelector('[data-m="cancel"]').onclick = close;
    // カーソルの位置（の行のあと）に [[チャプターID]] を1行で入れる
    md.querySelector('[data-m="link"]').onchange = e => {
      const id = e.target.value; e.target.value = ''; if (!id) return;
      const ta = md.querySelector('textarea'), v = ta.value;
      let p = ta.selectionEnd; const nl = v.indexOf('\n', p); p = nl < 0 ? v.length : nl;
      const ins = `\n[[${id}]]`;
      put(ta, p, p, ins, p + ins.length, p + ins.length);
    };
    // 選んだ範囲の前後に ::: を入れて枠にする
    md.querySelector('[data-m="callout"]').onclick = () => {
      const ta = md.querySelector('textarea');
      let a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (a === b) { toast('枠にしたい部分を選んでください'); ta.focus(); return; }
      a = v.lastIndexOf('\n', a - 1) + 1;                 // 行のはじめから
      const e = v.indexOf('\n', b - 1); b = e < 0 ? v.length : e; // 行のおわりまで
      const head = ':::💡';
      const wrapped = `${head}\n${v.slice(a, b)}\n:::`;
      put(ta, a, b, wrapped, a, a + wrapped.length);
    };
    // PDF・動画をアップロードして、カーソルの行のあとに [[pdf:場所|名前]] / [[video:場所|名前]] を入れる
    const uploader = (kind, label) => {
      const btn = md.querySelector(`[data-m="${kind}"]`), input = md.querySelector(`[data-m="${kind}file"]`);
      btn.onclick = () => input.click();
      input.onchange = async () => {
        const f = input.files[0]; input.value = ''; if (!f) return;
        if (f.size > 50 * 1024 * 1024) { toast('50MBより大きいファイルは入れられません'); return; }
        const ta = md.querySelector('textarea');
        const pos = ta.selectionEnd;
        btn.disabled = true; btn.textContent = 'アップロード中…';
        const ext = kind === 'pdf' ? 'pdf' : ((f.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4');
        const path = `${session.user.id}/${kind === 'pdf' ? '' : 'video/'}${chid}-${Date.now()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type || (kind === 'pdf' ? 'application/pdf' : 'video/mp4') });
        btn.disabled = false; btn.textContent = label;
        if (error) { console.error(error); toast('アップロードできませんでした'); return; }
        const v = ta.value; const nl = v.indexOf('\n', pos); const p = nl < 0 ? v.length : nl;
        const ins = `\n\n[[${kind}:${path}|${f.name.replace(/[\]|]/g, '')}]]\n`;
        put(ta, p, p, ins, p + ins.length, p + ins.length);
        toast(`${kind === 'pdf' ? 'PDF' : '動画'}を入れました。保存すると表示されます`);
      };
    };
    uploader('pdf', '📄 PDFを入れる');
    uploader('video', '🎬 動画を入れる');
    // 選んだ行を「:::引用」〜「:::」ではさんで、左に線のある引用にする（行頭の > はとる）
    md.querySelector('[data-m="quote"]').onclick = () => {
      const ta = md.querySelector('textarea');
      let a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (a === b) { toast('引用にしたい部分を選んでください'); ta.focus(); return; }
      a = v.lastIndexOf('\n', a - 1) + 1;
      const e = v.indexOf('\n', b - 1); b = e < 0 ? v.length : e;
      const inner = v.slice(a, b).split('\n').map(l => l.replace(/^\s*>\s?/, '')).join('\n');
      const wrapped = `:::引用\n${inner}\n:::`;
      put(ta, a, b, wrapped, a, a + wrapped.length);
    };
    // 選んだ文字を ``〜`` ではさんで、黒背景・白文字にする（もともとの `〜` はつけ直す）
    md.querySelector('[data-m="dark"]').onclick = () => {
      const ta = md.querySelector('textarea');
      let a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (a === b) { toast('黒背景にしたい文字を選んでください'); ta.focus(); return; }
      while (v[a - 1] === '`') a--;
      while (v[b] === '`') b++;
      // 選んだ範囲の前後の空白はそのまま外に残し、` はとりのぞく
      const sel = v.slice(a, b), lead = sel.match(/^[\s`]*/)[0].replace(/`/g, ''), tail = sel.match(/[\s`]*$/)[0].replace(/`/g, '');
      const text = sel.replace(/^[\s`]+|[\s`]+$/g, '');
      const wrapped = `${lead}\`\`${text}\`\`${tail}`;
      put(ta, a, b, wrapped, a, a + wrapped.length);
    };
    md.querySelector('[data-m="save"]').onclick = async e => {
      const v = md.querySelector('textarea').value.trim();
      e.target.disabled = true; e.target.textContent = '保存中…';
      if (!(await setContent(chid, v))) { e.target.disabled = false; e.target.textContent = '保存する'; toast('保存できませんでした'); return; }
      // 保存しても、ページのスクロール位置はそのまま
      const y = window.scrollY;
      close(); render(); window.scrollTo(0, y);
      requestAnimationFrame(() => window.scrollTo(0, y));
      toast(v ? '教材を保存しました🐾' : '内容を空にしました');
      setTimeout(mirrorImages, 2000);
    };
    const del = md.querySelector('[data-m="del"]');
    if (del) del.onclick = async () => { if (!confirm('このチャプターの教材の内容を削除しますか？（元に戻せません）')) return; if (!(await setContent(chid, ''))) { toast('削除できませんでした'); return; } close(); render(); toast('削除しました'); };
    document.body.append(bg, md);
    md.querySelector('textarea').focus();
  }

  function tocDrawer(cid, chid) {
    const c = course(cid);
    const bg = document.createElement('div'); bg.className = 'drawer-bg';
    const dr = document.createElement('div'); dr.className = 'drawer';
    dr.innerHTML = `<h3>目次 <button class="btn" data-close>閉じる</button></h3>
      <div class="chapter-list">${c.chapters.map(ch => `<a class="${ch.id === chid ? 'current' : ''}" href="#/courses/${c.id}/${ch.id}">${check(ch)}<span>${esc(ch.title)}</span></a>`).join('')}</div>`;
    const close = () => { bg.remove(); dr.remove(); };
    bg.onclick = close; dr.querySelector('[data-close]').onclick = close;
    dr.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.body.append(bg, dr);
    dr.querySelector('.current')?.scrollIntoView({ block: 'center' });
  }

  const notFound = () => emptyCat('ページが見つかりませんでした🐾 <br><a class="more" href="#/home">トップへ</a>');

  // ---------- router ----------
  function render() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0].split('/');
    const [p0, p1, p2] = parts;
    let html, nav = p0;
    if (p0 === 'home' || (p0 === 'courses' && !p1)) { html = pageHome(); nav = 'home'; }
    else if (p0 === 'courses' && p2) { html = pageChapter(p1, p2); nav = 'home'; }
    else if (p0 === 'courses') { html = pageCourse(p1); nav = 'home'; }
    else html = notFound();
    app.innerHTML = html;
    document.title = `${$('h1', app)?.firstChild?.textContent.trim() || 'DESIGN STUDY'}｜DESIGN STUDY`;
    bind(p0, p1, p2);
    fillBookmarks();
    lastSig = JSON.stringify([state, CONTENT]);
  }

  // 記事リンクカードに、タイトル・説明・画像を入れる
  const OGP = {};
  // X（Twitter）の投稿をカードにする（公式の埋め込みスクリプトを読み込む）
  function loadTweets() {
    if (!app.querySelector('blockquote.twitter-tweet')) return;
    if (window.twttr?.widgets) { window.twttr.widgets.load(app); return; }
    if (document.getElementById('twitter-wjs')) return;
    const sc = document.createElement('script');
    sc.id = 'twitter-wjs'; sc.async = true; sc.src = 'https://platform.twitter.com/widgets.js';
    document.head.append(sc);
  }
  // PDF：本人だけが見られる期限つきのURLを作って表示する
  const SIGNED = {};
  async function loadPdfs() {
    const els = [...app.querySelectorAll('[data-pdf], [data-store]')];
    if (!els.length) return;
    const paths = [...new Set(els.map(e => e.dataset.pdf || e.dataset.store))];
    // 一度作ったURLは覚えておき、描き直しても画像がすぐ出るようにする（同じURLならブラウザのキャッシュが効く）
    const now = Date.now();
    const need = paths.filter(p => !(SIGNED[p]?.exp > now));
    if (need.length) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 60 * 60 * 6);
      (data || []).filter(d => d.signedUrl).forEach(d => { SIGNED[d.path] = { url: d.signedUrl, exp: now + 5 * 60 * 60 * 1000 }; });
    }
    const urls = Object.fromEntries(paths.filter(p => SIGNED[p]).map(p => [p, SIGNED[p].url]));
    if (!Object.keys(urls).length) return;
    els.filter(e => e.dataset.store).forEach(e => { const u = urls[e.dataset.store]; if (u && e.getAttribute('src') !== u) e.src = u; });
    const pdfs = els.filter(e => e.dataset.pdf && urls[e.dataset.pdf]);
    if (!pdfs.length) return;
    const { mountPdf } = await import('./pdfviewer.js');
    pdfs.forEach(e => mountPdf(e, urls[e.dataset.pdf]));
  }
  function fillBookmarks() {
    loadTweets(); loadPdfs();
    app.querySelectorAll('a.bookmark[data-ogp]').forEach(async a => {
      const url = a.dataset.ogp;
      try {
        OGP[url] ??= fetch(`/api/ogp?v=2&url=${encodeURIComponent(url)}`).then(r => r.ok ? r.json() : null);
        const d = await OGP[url];
        if (!d) return;
        if (d.title) a.querySelector('.bm-title').textContent = d.title;
        if (d.description) a.querySelector('.bm-desc').textContent = d.description;
        if (d.site) a.querySelector('.bm-site span').textContent = d.site;
        const ic = a.querySelector('.bm-icon');
        if (d.icon) { ic.src = d.icon; ic.onload = () => ic.hidden = false; }
        if (d.image) {
          const th = a.querySelector('.bm-thumb');
          const img = new Image();
          img.alt = ''; img.decoding = 'async'; img.src = d.image;
          img.onload = () => { th.append(img); th.hidden = false; a.classList.add('has-thumb'); };
        }
      } catch {}
    });
  }

  function bind(p0, p1, p2) {
    app.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { state.view = b.dataset.view; save(); render(); });

    if (p0 === 'courses' && p2) {
      const setStatus = v => {
        delete state.done[p2]; delete state.doing[p2];
        if (v === 'done') state.done[p2] = new Date().toISOString();
        if (v === 'doing') state.doing[p2] = true;
        save(); render();
      };
      app.querySelectorAll('[data-act="toc"]').forEach(b => b.onclick = () => tocDrawer(p1, p2));
      app.querySelectorAll('[data-act="edit"]').forEach(b => b.onclick = () => contentEditor(p2, $('h1', app)?.textContent || ''));
      $('[data-act="status"]', app).onchange = e => setStatus(e.target.value);
      const dn = $('[data-act="done"]', app); if (dn) dn.onclick = () => { setStatus('done'); toast('完了にしました🐾'); };
      const un = $('[data-act="undone"]', app); if (un) un.onclick = () => setStatus('none');
    }
  }

  window.addEventListener('hashchange', () => { if (session) { render(); window.scrollTo(0, 0); } });

  // ほかの端末で変えた内容を、画面に戻ってきたときと1分ごとに取り込む
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && session) load(); });
  setInterval(() => { if (session && document.visibilityState === 'visible') load(); }, 60000);
  window.addEventListener('beforeunload', e => { if (dirty) { push(); e.preventDefault(); } });

  // ---------- ログイン ----------
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#loginBtn'), err = $('#loginErr');
    btn.disabled = true; btn.textContent = 'ログイン中…'; err.hidden = true;
    const { error } = await sb.auth.signInWithPassword({ email: $('#loginEmail').value, password: $('#loginPass').value });
    btn.disabled = false; btn.textContent = 'ログイン';
    if (error) { err.textContent = 'メールアドレスかパスワードが違います'; err.hidden = false; }
  });
  // コードのコピー
  document.addEventListener('click', async e => {
    const b = e.target.closest('.code-copy');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.parentElement.querySelector('code').textContent); } catch { return; }
    b.classList.add('done'); toast('コピーしました');
    setTimeout(() => b.classList.remove('done'), 1500);
  });

  // 完了・学習中をすべて未完了に戻す（教材の中身はそのまま）
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-act="reset"]')) return;
    const n = Object.keys(state.done).length + Object.keys(state.doing || {}).length;
    if (!n) { toast('リセットするステータスはありません'); return; }
    if (!confirm(`完了・学習中になっている${n}件のチャプターを、すべて未完了に戻しますか？\n（貼り付けた教材はそのまま残ります）`)) return;
    state.done = {}; state.doing = {};
    save(); render(); toast('学習ステータスをリセットしました');
  });

  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-act="logout"]')) return;
    if (!confirm('ログアウトしますか？')) return;
    await sb.auth.signOut();
  });

  let started = false;
  function onSession(s) {
    session = s;
    $('#login').hidden = !!s; app.hidden = !s;
    if (s && !started) { started = true; app.innerHTML = '<p class="loading">読み込み中…</p>'; load(true); }
    if (!s) { started = false; state = seed(); CONTENT = {}; lastUpdated = null; app.innerHTML = ''; }
  }
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_e, s) => { if ((s && !session) || (!s && session)) onSession(s); else session = s; });
})();
