// 貼り付けた教材（Markdown 形式）を、見出しごとのカードに整形して表示する
export const MD = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^(https?:)?\/\//i.test(u) || /^data:image\//i.test(u) ? u : '#';
  // 画像の src。アプリに保存した画像（storage:場所）は、あとで本人用のURLを入れる
  const imgSrc = u => u.startsWith('storage:') ? `data-store="${esc(u.slice(8))}"` : `src="${esc(safeUrl(u))}"`;

  // 動画URL → 埋め込み用URL（対応していなければ null）
  function videoEmbed(url) {
    let m;
    if ((m = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/i))) return `https://www.loom.com/embed/${m[1]}`;
    if ((m = url.match(/(?:youtube\.com\/watch\?[^ ]*v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i))) return `https://www.youtube.com/embed/${m[1]}`;
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) return `https://player.vimeo.com/video/${m[1]}`;
    return null;
  }

  // 行内：太字・斜体・コード・リンク・URL自動リンク
  function inline(text) {
    const codes = [];
    // ``〜`` は黒背景・白文字、`〜` はふつうのコード
    let s = esc(text)
      .replace(/``\s*`?([^`]+?)`?\s*``/g, (_, c) => `\u0000${codes.push({ c, dark: true }) - 1}\u0000`)
      .replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push({ c }) - 1}\u0000`);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, alt, u) => `<img ${imgSrc(u)} alt="${alt}" loading="lazy">`);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const ch = resolveCh(u.replace(/&amp;/g, '&'), t.replace(/<[^>]+>/g, ''));
      return ch ? `<a class="ch-inline" href="#/courses/${ch.course}/${ch.id}">${t}</a>` : `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${t}</a>`;
    });
    s = s.replace(/(^|[\s（(「])(https?:\/\/[^\s<）)」]+)/g, (_, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
    s = s.replace(/~~([^~]+?)~~/g, '<del>$1</del>');
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code${codes[i].dark ? ' class="dark"' : ''}>${codes[i].c}</code>`);
    return s;
  }

  // コードの色分け（CSS はセレクタ・プロパティ・値、ほかは文字列・数字・コメント）
  function highlight(code, lang) {
    const isCss = /^(css|scss|sass|less)$/i.test(lang) || (!lang && /[^{}]+\{[\s\S]*?[\w-]+\s*:[^;]+;[\s\S]*?\}/.test(code));
    const span = (c, t) => `<span class="tk-${c}">${esc(t)}</span>`;
    if (isCss) {
      let inBlock = false;
      return code.split('\n').map(line => {
        // 字下げが消えて貼られた中身は、{ } の中を2文字下げる
        let out = inBlock && line.trim() && !/^\s/.test(line) && !/^}/.test(line) ? '  ' : '', rest = line;
        while (rest.length) {
          let m;
          if ((m = rest.match(/^\/\*.*?(\*\/|$)/))) out += span('com', m[0]);
          else if ((m = rest.match(/^\s+/))) out += m[0];
          else if (rest[0] === '{') { inBlock = true; out += span('pun', '{'); m = ['{']; }
          else if (rest[0] === '}') { inBlock = false; out += span('pun', '}'); m = ['}']; }
          else if (inBlock && (m = rest.match(/^([\w-]+)(\s*:)/))) { out += span('prop', m[1]) + span('pun', m[2]); }
          else if (inBlock && (m = rest.match(/^[^;{}]+/))) out += m[0].split(/(-?\d*\.?\d+[a-z%]*|#[0-9a-f]{3,8}\b|"[^"]*"|'[^']*')/i).map((p, i) => i % 2 ? span('num', p) : esc(p)).join('');
          else if (!inBlock && (m = rest.match(/^[^{}]+/))) out += m[0].split(/([.#:][\w-]+)/).map((p, i) => i % 2 ? span('cls', p) : p ? span('tag', p) : '').join('');
          else { m = [rest[0]]; out += esc(rest[0]); }
          rest = rest.slice(m[0].length);
        }
        return out;
      }).join('\n');
    }
    return code.split(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`|\b\d+(?:\.\d+)?\b|<\/?[\w-]+|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|class|new|true|false|null|undefined|await|async)\b)/)
      .map((p, i) => {
        if (!(i % 2)) return esc(p);
        if (/^(\/\/|\/\*|<!--)/.test(p)) return span('com', p);
        if (/^["'`]/.test(p)) return span('str', p);
        if (/^\d/.test(p)) return span('num', p);
        if (p[0] === '<') return span('tag', p);
        return span('kw', p);
      }).join('');
  }

  // ブロック単位に分解して HTML 化。h2 ごとにセクションを分ける
  // [[チャプターID]] をカードにする関数（main.js から渡す）
  let linkRenderer = null;
  const setLinkRenderer = fn => { linkRenderer = fn; };
  // スクールの教材へのリンク → アプリの中のチャプター（見つからなければ null）
  let chapterResolver = null;
  const setChapterResolver = fn => { chapterResolver = fn; };
  const resolveCh = (url, text) => chapterResolver ? chapterResolver(url, text) : null;

  // 枠（コールアウト）の色
  const CALLOUT_COLORS = ['caramel', 'gray', 'white', 'green', 'yellow', 'blue', 'red', 'beige'];

  // ::: 〜 ::: の枠。「:::引用」なら左に線のある引用にする
  function boxHtml(c) {
    const body = render(c.lines.join('\n'), '', true);
    if (/^(引用|quote)$/i.test(c.icon)) return `<blockquote class="quote">${body}</blockquote>`;
    return `<div class="callout c-${c.color}">${c.icon ? `<span class="callout-icon">${esc(c.icon)}</span>` : ''}<div class="callout-body">${body}</div></div>`;
  }

  function render(md, title = '', inner = false) {
    const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
    const sections = [{ head: '', body: [] }];
    let para = [], list = null, quote = [];
    const out = () => sections[sections.length - 1].body;
    // 複数行をまとめて整形（行をまたぐ **太字** も効くように）
    const lines2 = arr => inline(arr.join('\n')).replace(/\n/g, '<br>');
    const flushPara = () => { if (para.length) { out().push(`<p>${lines2(para)}</p>`); para = []; } };
    // 箇条書き：入れ子（字下げ）に対応。list はいちばん外側、stack は今いる階層
    let stack = [], listGap = false;
    const listHtml = l => `<${l.type}${l.type === 'ol' && l.start > 1 ? ` start="${l.start}"` : ''}>${l.items.map(i => `<li>${lines2(i.lines)}${i.subs.map(listHtml).join('')}</li>`).join('')}</${l.type}>`;
    let lastOl = null;  // 直前の番号付きリスト（写真などをはさんでも番号を続けるため）
    const flushList = () => {
      if (!list) return;
      out().push(listHtml(list));
      if (list.type === 'ol') lastOl = { sec: sections.length, idx: out().length, count: list.start - 1 + list.items.length };
      list = null; stack = []; listGap = false;
    };
    // 前の番号付きリストとのあいだが、写真・動画・余白・文章だけなら番号を続ける
    const continueFrom = () => lastOl && lastOl.sec === sections.length &&
      out().slice(lastOl.idx).every(h => /^<(figure|p>|div class="(md-space|video-embed)|a class="(video-link|bookmark))/.test(h)) ? lastOl.count + 1 : 1;
    const addItem = (indent, type, num, text) => {
      const top = () => stack[stack.length - 1];
      while (stack.length > 1 && (indent < top().indent || (indent === top().indent && type !== top().type))) stack.pop();
      const cur = top();
      const newList = () => ({ type, indent, start: num || 1, items: [] });
      const newRoot = () => { list = newList(); if (type === 'ol' && num <= 1) list.start = continueFrom(); stack = [list]; };
      if (!cur) newRoot();
      else if (cur.items.length && (indent > cur.indent || (type === 'ul' && cur.type === 'ol' && indent === cur.indent)
        || (type === 'ol' && cur.type === 'ul' && indent === cur.indent && /^\*\*[^*]+\*\*[:：]?$/.test(cur.items[cur.items.length - 1].lines.join(' ').trim())))) {
        // 字下げされた項目、番号付きの直後の「・」、太字だけの「・」（小見出し）の直後の番号は、その下の入れ子にする
        const child = newList(); cur.items[cur.items.length - 1].subs.push(child); stack.push(child);
      } else if (type !== cur.type) { flushList(); newRoot(); }
      top().items.push({ lines: [text], subs: [] });
      listGap = false;
    };
    // 「>」の引用は、💡つきのキャラメル色の枠にする
    const flushQuote = () => {
      if (!quote.length) return;
      const body = quote.join('\n').replace(/\n\s*\n(\s*\n)+/g, '\n\n').trim();
      quote = [];
      if (body) out().push(`<div class="callout c-caramel"><span class="callout-icon">💡</span><div class="callout-body">${render(body, '', true)}</div></div>`);
    };
    // 表： | 見出し | 見出し | の次に | --- | --- | の行があれば表にする
    let table = [];
    const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
    const flushTable = () => {
      if (!table.length) return;
      const rows = table; table = [];
      const isSep = l => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l.trim());
      if (rows.length < 2 || !isSep(rows[1])) { para.push(...rows); flushPara(); return; }
      const align = cells(rows[1]).map(c => /^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : '');
      const td = (tag, c, i) => `<${tag}${align[i] ? ` style="text-align:${align[i]}"` : ''}>${lines2(c.split(/<br\s*\/?>/i))}</${tag}>`;
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out().push(`<div class="table-wrap"><table><thead><tr>${head.map((c, i) => td('th', c, i)).join('')}</tr></thead><tbody>${body.map(r => `<tr>${head.map((_, i) => td('td', r[i] ?? '', i)).join('')}</tr>`).join('')}</tbody></table></div>`);
    };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };
    let firstH1 = !inner;
    let callout = null;   // ::: 〜 ::: の中身をためる
    let blanks = 0;       // 続いた空行の数（2行以上で余白を足す）
    let code = null;      // ``` 〜 ``` のコード
    const FENCE = /^(?:`{3,}|~{3,}|、{3}|｀{3})\s*([\w+#-]*)\s*$/;

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      let t = line.trim();
      let m;
      // 枠（コールアウト）： ::: で始めて ::: で閉じる。1行目に絵文字や色を書ける（例 :::💡 yellow）
      if (callout) {
        if (t === ':::') {
          flushAll();
          out().push(boxHtml(callout));
          callout = null;
        } else callout.lines.push(raw);
        continue;
      }
      // コード： ``` で始めて ``` で閉じる
      if (code) {
        if (FENCE.test(t) && !FENCE.exec(t)[1]) {
          const ls = code.lines;
          while (ls.length && !ls[0].trim()) ls.shift();
          while (ls.length && !ls[ls.length - 1].trim()) ls.pop();
          const ind = Math.min(...ls.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length), 99);
          const body = ls.map(l => l.slice(Math.min(ind, l.match(/^\s*/)[0].length))).join('\n');
          out().push(`<div class="code-block"><button class="code-copy" type="button" title="コピー" aria-label="コピー"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg></button><pre><code>${highlight(body, code.lang)}</code></pre></div>`);
          code = null;
        } else code.lines.push(raw.replace(/\s+$/, ''));
        continue;
      }
      if ((m = t.match(FENCE))) { flushAll(); blanks = 0; code = { lang: m[1], lines: [] }; continue; }
      if (!t) flushTable();
      if (!t) { flushPara(); flushQuote(); if (list) listGap = true; blanks++; continue; }
      if (t.startsWith('|') && t.length > 1) { flushPara(); flushList(); flushQuote(); blanks = 0; table.push(t); continue; }
      flushTable();
      // 空行のあとに箇条書きでも字下げでもない行が来たら、箇条書きはそこで終わり
      if (list && listGap && !/^\s+\S/.test(line) && !/^\s*([-*+]|\d+[.)])\s+/.test(line)) flushList();
      // 空行を2行以上続けたら、1行ふえるごとに余白を足す
      if (blanks >= 2 && out().length && !list) out().push(`<div class="md-space" style="height:${Math.min(blanks - 1, 6) * 24}px"></div>`);
      blanks = 0;
      // [[video:保存場所|ファイル名]] だけの行は、アプリに保存した動画を再生する
      if ((m = t.match(/^\[\[video:([^|\]]+)(?:\|([^\]]*))?\]\]$/))) {
        flushAll();
        out().push(`<div class="video-file"><video controls playsinline preload="metadata" data-store="${esc(m[1])}" title="${esc(m[2] || '動画')}"></video></div>`);
        continue;
      }
      // [[pdf:保存場所|ファイル名]] だけの行は、PDF をページの中で表示する
      if ((m = t.match(/^\[\[pdf:([^|\]]+)(?:\|([^\]]*))?\]\]$/))) {
        flushAll();
        out().push(`<div class="pdf-viewer" data-pdf="${esc(m[1])}" title="${esc(m[2] || 'PDF')}"></div>`);
        continue;
      }
      // [[チャプターID]] だけの行は、そのチャプターへのカードリンク
      if ((m = t.match(/^\[\[([\w-]+)\]\]$/)) && linkRenderer) {
        const card = linkRenderer(m[1]);
        if (card) { flushAll(); out().push(card); continue; }
      }
      if ((m = t.match(/^:::\s*(.*)$/))) {
        flushAll();
        const words = m[1].split(/\s+/).filter(Boolean);
        const color = words.find(w => CALLOUT_COLORS.includes(w.toLowerCase()))?.toLowerCase() || 'caramel';
        const icon = words.filter(w => !CALLOUT_COLORS.includes(w.toLowerCase())).join(' ');
        callout = { color, icon, lines: [] };
        continue;
      }
      // 中身のない見出し（「##」だけの行）は表示しない
      if (/^#{1,6}$/.test(t)) { blanks = Math.min(blanks, 1); continue; }
      if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
        flushAll();
        const lv = m[1].length, text = m[2].replace(/^\*\*(.*)\*\*$/, '$1');
        if (lv === 1) { if (firstH1 && (!title || title.replace(/\s/g, '') === text.replace(/\s/g, ''))) { firstH1 = false; continue; } firstH1 = false; }
        if (lv <= 2 && !inner) sections.push({ head: inline(text), body: [] });
        else { const hl = inner ? Math.max(3, Math.min(lv, 4)) : Math.min(lv, 4); out().push(`<h${hl}>${inline(text)}</h${hl}>`); }
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flushAll(); out().push('<hr>'); continue; }
      if (/^https?:\/\/\S+$/.test(t) && videoEmbed(t)) {
        flushAll();
        out().push(`<div class="video-embed"><iframe src="${esc(videoEmbed(t))}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" loading="lazy"></iframe></div><a class="video-link" href="${esc(t)}" target="_blank" rel="noopener">動画を別タブで開く ↗</a>`);
        continue;
      }
      // X（Twitter）の投稿URLだけの行は、投稿のカードをそのまま表示する
      if ((m = t.match(/^\[?[^\]]*?\]?\(?(https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/(\w+)\/status(?:es)?\/(\d+))[^\s)]*\)?$/i))) {
        flushAll();
        const url = `https://twitter.com/${m[2]}/status/${m[3]}`;
        out().push(`<div class="tweet-embed"><blockquote class="twitter-tweet" data-lang="ja" data-dnt="true"><a href="${esc(url)}">${esc(url)}</a></blockquote></div>`);
        continue;
      }
      // URL だけの行（または [文字](URL) だけの行）は記事のリンクカードにする
      if ((m = t.match(/^(https?:\/\/\S+)$/) || t.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/))) {
        const url = m[2] || m[1], label = m[2] ? m[1] : '';
        const ch = label && resolveCh(url, label);
        if (ch && linkRenderer) { flushAll(); out().push(linkRenderer(ch.id)); continue; }
        let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
        flushAll();
        out().push(`<a class="bookmark" data-ogp="${esc(url)}" href="${esc(url)}" target="_blank" rel="noopener"><div class="bm-body"><b class="bm-title">${esc(label && label !== url ? label : host || url)}</b><span class="bm-desc"></span><span class="bm-site"><img class="bm-icon" alt="" hidden><span>${esc(host)}</span></span></div><div class="bm-thumb" hidden></div></a>`);
        continue;
      }
      // リンク付きの画像 [![説明](画像)](リンク) も写真として扱う
      if ((m = t.match(/^\[(!\[[^\]]*\]\([^)\s]+(?:\s+"[^"]*")?\))\]\([^)\s]+\)$/))) t = m[1];
      if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/))) {
        flushAll();
        // 「image」「画像」やファイル名だけの説明文は出さない
        const cap = /^(image|img|画像|写真|photo|picture|スクリーンショット|screenshot)?\s*\d*$|\.(png|jpe?g|gif|webp|svg)$/i.test(m[1].trim()) ? '' : m[1];
        out().push(`<figure><img ${imgSrc(m[2])} alt="${esc(m[1])}" loading="lazy">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`);
        continue;
      }
      if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
      if ((m = line.match(/^(\s*)([-*+]|\d+)[.)]?\s+(.*)$/)) && (/^[-*+]$/.test(m[2]) || /^\s*\d+[.)]\s/.test(line))) {
        flushPara(); flushQuote();
        const isOl = /\d/.test(m[2]);
        addItem(m[1].replace(/\t/g, '    ').length, isOl ? 'ol' : 'ul', isOl ? +m[2] : 0, m[3]);
        continue;
      }
      // 箇条書きの直後に続く行は、その項目の続き（改行）として扱う
      if (list) { const it = stack[stack.length - 1].items; it[it.length - 1].lines.push(t); listGap = false; continue; }
      if (quote.length) { quote.push(t); continue; }
      para.push(t);
    }
    flushAll();
    // 閉じ忘れた枠は最後まで枠にする
    if (callout) { lines.length = 0; const c = callout; callout = null; out().push(boxHtml(c)); }
    if (inner) return sections.map(s => s.body.join('')).join('');

    return sections
      .filter(s => s.head || s.body.length)
      .map(s => `<section class="card prose md">${s.head ? `<h2>${s.head}</h2>` : ''}${s.body.join('')}</section>`)
      .join('');
  }

  return { render, setLinkRenderer, setChapterResolver };
})();
