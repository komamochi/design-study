// 初期データ（サンプル）。ここを書き換えれば中身を差し替えられます。
export const ME = { id: 'me', name: 'なつみ', role: 'パーソナルコース受講生', avatar: '/cat.webp' };

const BASE_CHAPTER_TITLES = {
  basic: [
    '0-1 学習を最大限に活かすためのマインドセット', '0-2 ビジョンマップを作成しよう！',
    '1-1 デザインとは？', '1-2 世界のデザイン史（プロローグ）', '1-3 世界のデザイン史（前編）', '1-4 世界のデザイン史（後編）',
    '1-5 デザイン４原則：近接', '1-6 デザイン４原則：整列', '1-7 デザイン４原則：反復', '1-8 デザイン４原則：対比',
    '1-9 書体とフォントの基本', '1-10 文章のデザイン', '1-11 文字詰めの基礎', '1-12 色と配色設計の基本', '1-13 構図',
    '1-14 あしらいの基本', '1-15 あしらいを事例から学ぶ', '1-16 写真を使ったデザイン', '1-17 写真ストック素材の基本',
    '1-18 版面・マージンの基本と設計方法', '1-19 デザインリサーチ・参考収集の方法',
    '課題1-1 デザイン言語化ワーク', '課題1-2 デザイン史から“自分の好き”を探る', '課題2-1 フォントを知る、使う',
    '課題2-2 色を知る、使う', '課題2-3 形を知る、使う', '課題2-4 余白を知る、使う', '課題2-5 デイリーグラフィック', '課題 トンマナ分析ワーク',
  ],
};

function genChapters(prefix, n) {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i + 1} レッスン ${i + 1}`);
}

export const COURSES = [
  { id: 'basic', title: 'デザイン基礎', en: 'Design Fundamentals', start: '2025/09/15', chapters: BASE_CHAPTER_TITLES.basic },
  { id: 'web', title: 'Webデザイン', en: 'Web Design', label: 'ウェブデザイン', start: '2025/10/01', chapters: genChapters('W', 40) },
  { id: 'uiux', title: 'UIUXデザイン', en: 'UI/UX Design', start: '2025/10/05', chapters: genChapters('U', 21) },
  { id: 'graphic', title: 'グラフィックデザイン', en: 'Graphic Design', start: '2025/10/05', chapters: genChapters('G', 37) },
  { id: 'figma', title: 'Figma講座', en: 'Figma', dark: true, label: 'Figmaマスター講座', start: '2025/10/02', chapters: genChapters('F', 60) },
  { id: 'studio', title: 'Studio講座', en: 'Studio', dark: true, label: 'Studioマスター講座', start: '2025/10/05', chapters: genChapters('S', 46) },
  { id: 'ai', title: 'AI活用講座', en: 'AI Workshop', start: '2026/04/13', chapters: genChapters('AI', 4) },
  { id: 'webinar', title: 'ウェビナーアーカイブ', en: 'Webinar Archive', start: '2026/07/29', chapters: genChapters('WB', 57) },
  { id: 'docs', title: 'お役立ち資料', en: 'Resources', start: '2025/12/04', chapters: genChapters('D', 4) },
].map(c => ({ ...c, chapters: c.chapters.map((t, i) => ({ id: `${c.id}-${i + 1}`, title: t })) }));
