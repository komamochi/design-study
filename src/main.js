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
    if (!document.querySelector('.modal')) render();
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
      <div class="home-foot"><button class="link-btn" data-act="logout">ログアウト</button></div>`;
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
          <h1 style="font-size:24px;margin-bottom:18px">${esc(ch.title)}</h1>
          ${content
            ? `<div class="md-tools"><button class="btn" data-act="edit">✎ 教材を編集</button></div>${MD.render(content, ch.title)}`
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
    md.querySelector('[data-m="cancel"]').onclick = close;
    // カーソルの位置（の行のあと）に [[チャプターID]] を1行で入れる
    md.querySelector('[data-m="link"]').onchange = e => {
      const id = e.target.value; e.target.value = ''; if (!id) return;
      const ta = md.querySelector('textarea'), v = ta.value;
      let p = ta.selectionEnd; const nl = v.indexOf('\n', p); p = nl < 0 ? v.length : nl;
      const ins = `\n[[${id}]]`;
      ta.value = v.slice(0, p) + ins + v.slice(p);
      ta.focus(); ta.setSelectionRange(p + ins.length, p + ins.length);
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
      ta.value = v.slice(0, a) + wrapped + v.slice(b);
      ta.focus(); ta.setSelectionRange(a, a + wrapped.length);
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
      ta.value = v.slice(0, a) + wrapped + v.slice(b);
      ta.focus(); ta.setSelectionRange(a, a + wrapped.length);
    };
    md.querySelector('[data-m="save"]').onclick = async e => {
      const v = md.querySelector('textarea').value.trim();
      e.target.disabled = true; e.target.textContent = '保存中…';
      if (!(await setContent(chid, v))) { e.target.disabled = false; e.target.textContent = '保存する'; toast('保存できませんでした'); return; }
      close(); render(); toast(v ? '教材を保存しました🐾' : '内容を空にしました');
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
  }

  // 記事リンクカードに、タイトル・説明・画像を入れる
  const OGP = {};
  function fillBookmarks() {
    app.querySelectorAll('a.bookmark[data-ogp]').forEach(async a => {
      const url = a.dataset.ogp;
      try {
        OGP[url] ??= fetch(`/api/ogp?url=${encodeURIComponent(url)}`).then(r => r.ok ? r.json() : null);
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
          img.alt = ''; img.loading = 'lazy'; img.src = d.image;
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
