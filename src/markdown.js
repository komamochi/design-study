// 貼り付けた教材（Markdown 形式）を、見出しごとのカードに整形して表示する
export const MD = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^(https?:)?\/\//i.test(u) || /^data:image\//i.test(u) ? u : '#';

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
    let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, alt, u) => `<img src="${esc(safeUrl(u))}" alt="${alt}" loading="lazy">`);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${t}</a>`);
    s = s.replace(/(^|[\s（(「])(https?:\/\/[^\s<）)」]+)/g, (_, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
    return s;
  }

  // ブロック単位に分解して HTML 化。h2 ごとにセクションを分ける
  // [[チャプターID]] をカードにする関数（main.js から渡す）
  let linkRenderer = null;
  const setLinkRenderer = fn => { linkRenderer = fn; };

  // 枠（コールアウト）の色
  const CALLOUT_COLORS = ['caramel', 'gray', 'white', 'green', 'yellow', 'blue', 'red', 'beige'];

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
    const flushList = () => { if (list) { out().push(listHtml(list)); list = null; stack = []; listGap = false; } };
    const addItem = (indent, type, num, text) => {
      const top = () => stack[stack.length - 1];
      while (stack.length > 1 && (indent < top().indent || (indent === top().indent && type !== top().type))) stack.pop();
      const cur = top();
      const newList = () => ({ type, indent, start: num || 1, items: [] });
      if (!cur) { list = newList(); stack = [list]; }
      else if (cur.items.length && (indent > cur.indent || (type === 'ul' && cur.type === 'ol' && indent === cur.indent))) {
        // 字下げされた項目、または番号付きの直後の「・」は、その下の入れ子にする
        const child = newList(); cur.items[cur.items.length - 1].subs.push(child); stack.push(child);
      } else if (type !== cur.type) { flushList(); list = newList(); stack = [list]; }
      top().items.push({ lines: [text], subs: [] });
      listGap = false;
    };
    const flushQuote = () => { if (quote.length) { out().push(`<blockquote>${lines2(quote)}</blockquote>`); quote = []; } };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };
    let firstH1 = !inner;
    let callout = null;   // ::: 〜 ::: の中身をためる
    let blanks = 0;       // 続いた空行の数（2行以上で余白を足す）

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      let t = line.trim();
      let m;
      // 枠（コールアウト）： ::: で始めて ::: で閉じる。1行目に絵文字や色を書ける（例 :::💡 yellow）
      if (callout) {
        if (t === ':::') {
          flushAll();
          out().push(`<div class="callout c-${callout.color}">${callout.icon ? `<span class="callout-icon">${esc(callout.icon)}</span>` : ''}<div class="callout-body">${render(callout.lines.join('\n'), '', true)}</div></div>`);
          callout = null;
        } else callout.lines.push(raw);
        continue;
      }
      if (!t) { flushPara(); flushQuote(); if (list) listGap = true; blanks++; continue; }
      // 空行のあとに箇条書きでも字下げでもない行が来たら、箇条書きはそこで終わり
      if (list && listGap && !/^\s+\S/.test(line) && !/^\s*([-*+]|\d+[.)])\s+/.test(line)) flushList();
      // 空行を2行以上続けたら、1行ふえるごとに余白を足す
      if (blanks >= 2 && out().length && !list) out().push(`<div class="md-space" style="height:${Math.min(blanks - 1, 6) * 24}px"></div>`);
      blanks = 0;
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
      // URL だけの行（または [文字](URL) だけの行）は記事のリンクカードにする
      if ((m = t.match(/^(https?:\/\/\S+)$/) || t.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/))) {
        const url = m[2] || m[1], label = m[2] ? m[1] : '';
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
        out().push(`<figure><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" loading="lazy">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`);
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
    if (callout) { lines.length = 0; const c = callout; callout = null; out().push(`<div class="callout c-${c.color}">${c.icon ? `<span class="callout-icon">${esc(c.icon)}</span>` : ''}<div class="callout-body">${render(c.lines.join('\n'), '', true)}</div></div>`); }
    if (inner) return sections.map(s => s.body.join('')).join('');

    return sections
      .filter(s => s.head || s.body.length)
      .map(s => `<section class="card prose md">${s.head ? `<h2>${s.head}</h2>` : ''}${s.body.join('')}</section>`)
      .join('');
  }

  return { render, setLinkRenderer };
})();
