// コースごとのモノクロ線アイコン（currentColor で色が変わる）
const ICONS = {
  // デザイン基礎：○△□
  basic: '<circle cx="7" cy="7" r="4"/><path d="M17 3l4 7h-8z"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
  // Webデザイン：ブラウザ
  web: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 8.5h19"/><circle cx="5.5" cy="6.25" r=".6" fill="currentColor"/><circle cx="7.8" cy="6.25" r=".6" fill="currentColor"/><path d="M6 12h6M6 15h9M15 12h3"/>',
  // UIUXデザイン：スマホ＋タップ
  uiux: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 5h3"/><circle cx="12" cy="13" r="2.2"/><circle cx="12" cy="13" r="4.5" stroke-dasharray="2 2"/>',
  // グラフィックデザイン：ペンツール
  graphic: '<path d="M12 3l5.5 9.5L12 21l-5.5-8.5z"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v7.4"/>',
  // Figma講座：Figmaのロゴ形（白一色）
  figma: '<path d="M12 3H9a3 3 0 0 0 0 6h3z" fill="currentColor" stroke="none"/><path d="M12 3h3a3 3 0 0 1 0 6h-3z" fill="currentColor" stroke="none" opacity=".75"/><path d="M12 9H9a3 3 0 0 0 0 6h3z" fill="currentColor" stroke="none" opacity=".85"/><circle cx="15" cy="12" r="3" fill="currentColor" stroke="none" opacity=".6"/><path d="M12 15H9a3 3 0 1 0 3 3z" fill="currentColor" stroke="none" opacity=".9"/>',
  // Studio講座：STUDIOのロゴ形（／S）
  studio: '<path d="M3.5 18.5L9 5.5" stroke-width="1.4"/><path d="M19.5 8.3c-.7-1.2-1.9-1.8-3.3-1.8-1.9 0-3.2 1-3.2 2.5 0 3.4 6.8 2.1 6.8 5.8 0 1.6-1.4 2.7-3.5 2.7-1.6 0-2.9-.7-3.6-1.9" stroke-width="1.4"/>',
  // ウェビナー：再生画面
  webinar: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M10 8.2v4.6l4-2.3z" fill="currentColor"/><path d="M8 21h8M12 17v4"/>',
  // イベントアーカイブ：カレンダー
  'event-archive': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>',
  // AI活用講座：きらめき
  ai: '<path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
  // お役立ち資料：ドキュメント
  docs: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5"/><path d="M8 12.5h8M8 16h8M8 9h3"/>',
};
export const icon = id => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ''}</svg>`;
