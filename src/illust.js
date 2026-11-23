// チャプターごとの線画イラスト（160x90）。class="acc" は机のキャラメルの差し色
// いまはデザイン基礎（basic-1〜basic-29）のみ。ほかのコースは従来のサムネになります。
const ILL_BASIC = [
  // 0-1 マインドセット：横顔と電球
  `<path d="M62 70c0-8-6-10-6-20a20 20 0 0 1 40 0c0 3-1 5 2 9l-4 2v6c0 3-3 4-6 4h-6v6"/><circle class="acc" cx="104" cy="30" r="7"/><path d="M104 20v-4M114 30h4M111 23l3-3M97 23l-3-3"/><path d="M101 40h6M102 44h4"/>`,
  // 0-2 ビジョンマップ：地図と旗
  `<path d="M40 26l24-8 32 8 24-8v46l-24 8-32-8-24 8z"/><path d="M64 18v46M96 26v46"/><path d="M50 56c10-4 14 6 24 0s12-16 26-14" stroke-dasharray="3 3"/><path d="M104 42V26"/><path class="acc" d="M104 26h10l-3 4 3 4h-10z"/>`,
  // 1-1 デザインとは？：はてなと鉛筆
  `<circle cx="72" cy="45" r="22"/><path d="M65 38a7 7 0 1 1 10 6c-2 1-3 3-3 5"/><circle class="acc" cx="72" cy="56" r="2"/><path d="M104 66l14-34 6 2-14 34-7 3z"/><path d="M116 37l6 2"/>`,
  // 1-2 デザイン史（プロローグ）：古代の壺
  `<path d="M72 18h16M74 18v8c0 4-14 8-14 22 0 12 8 20 20 20s20-8 20-20c0-14-14-18-14-22v-8"/><path d="M74 28c-8 0-12 4-12 9M86 28c8 0 12 4 12 9"/><path class="acc" d="M61 46h38v6H61z"/><path d="M66 58h28" stroke-dasharray="2 3"/><path d="M56 72h48"/>`,
  // 1-3 世界のデザイン史（前編）：神殿の柱
  `<path d="M50 34l30-14 30 14z"/><path d="M52 34h56M54 70h52M50 74h60"/><path d="M60 38v30M72 38v30M88 38v30M100 38v30"/><circle class="acc" cx="80" cy="28" r="2.5"/>`,
  // 1-4 世界のデザイン史（後編）：バウハウスの形
  `<rect x="44" y="30" width="26" height="26"/><circle class="acc" cx="92" cy="43" r="13"/><path d="M110 56l12-26 12 26z"/><path d="M40 66h96"/>`,
  // 1-5 近接：グループになった点
  `<g class="acc"><circle cx="50" cy="38" r="4"/><circle cx="60" cy="38" r="4"/><circle cx="50" cy="48" r="4"/><circle cx="60" cy="48" r="4"/></g><circle cx="98" cy="38" r="4"/><circle cx="108" cy="38" r="4"/><circle cx="98" cy="48" r="4"/><circle cx="108" cy="48" r="4"/><path d="M42 60h26M90 60h26" stroke-dasharray="2 3"/>`,
  // 1-6 整列：左揃えのバー
  `<path d="M52 22v48" class="acc-s" stroke-dasharray="3 3"/><rect x="52" y="26" width="56" height="8" rx="1"/><rect x="52" y="40" width="40" height="8" rx="1"/><rect class="acc" x="52" y="54" width="64" height="8" rx="1"/>`,
  // 1-7 反復：くり返すモチーフ
  `${[0,1,2,3,4].map(i => `<g transform="translate(${44 + i * 16} 0)"><circle cx="0" cy="36" r="5" ${i === 2 ? 'class="acc"' : ''}/><path d="M-5 52h10"/></g>`).join('')}<path d="M36 62h88"/>`,
  // 1-8 対比：大きい丸と小さい丸
  `<circle cx="66" cy="46" r="24"/><circle class="soft" cx="66" cy="46" r="24"/><circle class="acc" cx="108" cy="58" r="7"/>`,
  // 1-9 書体とフォント：Aa
  `<text x="80" y="60" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="currentColor" stroke="none">A<tspan fill="var(--wood)" font-family="Montserrat, sans-serif" font-weight="600">a</tspan></text><path d="M44 62h72" stroke-dasharray="2 3"/>`,
  // 1-10 文章のデザイン：段落
  `<path d="M50 28h60M50 36h60M50 44h60M50 52h44"/><path class="acc-s" d="M50 62h24" stroke-width="2.4"/><path d="M44 28v34" opacity=".4"/>`,
  // 1-11 文字詰め：文字と矢印
  `<text x="80" y="56" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="30" font-weight="500" letter-spacing="8" fill="currentColor" stroke="none">AVA</text><path class="acc-s" d="M70 66h-8m0 0l3-3m-3 3l3 3M90 66h8m0 0l-3-3m3 3l-3 3"/>`,
  // 1-12 色と配色：パレット
  `<path d="M80 22c-18 0-32 11-32 24s12 22 24 22c5 0 6-3 5-6s0-6 5-6h10c11 0 20-6 20-14 0-11-14-20-32-20z"/><circle class="acc" cx="64" cy="40" r="4"/><circle cx="78" cy="32" r="4" fill="currentColor" stroke="none" opacity=".75"/><circle cx="94" cy="34" r="4" fill="currentColor" stroke="none" opacity=".4"/><circle cx="100" cy="46" r="4" fill="currentColor" stroke="none" opacity=".2"/>`,
  // 1-13 構図：三分割と主役
  `<rect x="44" y="20" width="72" height="50"/><path d="M68 20v50M92 20v50M44 37h72M44 53h72" opacity=".45"/><circle class="acc" cx="92" cy="37" r="6"/>`,
  // 1-14 あしらいの基本：リボンと飾り線
  `<path d="M48 40h64l-6 8 6 8H48l6-8z"/><path d="M60 64c6-4 10 4 16 0s10 4 16 0 10 4 16 0"/><path class="acc" d="M80 20l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z"/>`,
  // 1-15 あしらいを事例から学ぶ：虫めがねとカード
  `<rect x="44" y="24" width="48" height="40" rx="2"/><path d="M52 34h24M52 42h32M52 50h18"/><circle cx="104" cy="52" r="12"/><path d="M113 61l9 9"/><path class="acc-s" d="M98 52h12" stroke-width="2"/>`,
  // 1-16 写真を使ったデザイン：カメラ
  `<rect x="50" y="30" width="60" height="38" rx="4"/><path d="M66 30l4-6h20l4 6"/><circle cx="80" cy="49" r="11"/><circle class="acc" cx="80" cy="49" r="5"/><circle cx="102" cy="37" r="1.5" fill="currentColor"/>`,
  // 1-17 写真ストック素材：重なった写真
  `<rect x="58" y="22" width="50" height="36" rx="2" transform="rotate(8 83 40)" opacity=".5"/><rect x="52" y="28" width="50" height="36" rx="2"/><path d="M56 58l12-12 10 9 8-6 12 11"/><circle class="acc" cx="90" cy="38" r="4"/>`,
  // 1-18 版面・マージン：ページとマージン
  `<rect x="56" y="16" width="48" height="60" rx="1"/><rect x="64" y="24" width="32" height="44" stroke-dasharray="2 2" class="acc-s"/><path d="M68 32h24M68 38h24M68 44h18"/>`,
  // 1-19 リサーチ・参考収集：ブックマークと虫めがね
  `<rect x="42" y="26" width="30" height="40" rx="2"/><rect x="62" y="22" width="30" height="40" rx="2"/><path class="acc" d="M82 22v12l-4-3-4 3V22z"/><circle cx="108" cy="46" r="11"/><path d="M116 54l8 8"/>`,
  // 課題1-1 デザイン言語化ワーク：目と吹き出し
  `<path d="M46 46s12-14 28-14 28 14 28 14-12 14-28 14-28-14-28-14z"/><circle class="acc" cx="74" cy="46" r="6"/><path d="M104 22h22a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-14l-6 6v-6h-2a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z"/><path d="M110 30h12M110 35h8"/>`,
  // 課題1-2 デザイン史から“自分の好き”を探る：ハートと柱
  `<path d="M44 34l18-8 18 8zM46 34v30M62 34v30M78 34v30M42 66h40"/><path class="acc" d="M108 64s-18-11-18-23a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23z"/>`,
  // 課題2-1 フォントを知る、使う：Aとガイド線
  `<path d="M40 28h80M40 66h80M40 40h80" opacity=".35" stroke-dasharray="2 3"/><text x="80" y="66" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="currentColor" stroke="none">G</text><circle class="acc" cx="104" cy="30" r="3"/>`,
  // 課題2-2 色を知る、使う：スウォッチ
  `<rect class="acc" x="44" y="28" width="22" height="34" rx="2"/><rect x="70" y="28" width="22" height="34" rx="2" fill="currentColor" stroke="none" opacity=".7"/><rect x="96" y="28" width="22" height="34" rx="2" fill="currentColor" stroke="none" opacity=".3"/>`,
  // 課題2-3 形を知る、使う：○△□
  `<circle cx="54" cy="46" r="12"/><path class="acc" d="M80 34l13 24H67z"/><rect x="96" y="34" width="22" height="22"/>`,
  // 課題2-4 余白を知る、使う：広い余白と小さな四角
  `<rect x="40" y="18" width="80" height="54" stroke-dasharray="3 3" opacity=".5"/><rect class="acc" x="74" y="40" width="12" height="12"/>`,
  // 課題2-5 デイリーグラフィック：カレンダーと鉛筆
  `<rect x="46" y="24" width="46" height="44" rx="3"/><path d="M46 34h46M56 20v8M82 20v8"/><rect class="acc" x="60" y="42" width="10" height="10"/><path d="M104 66l12-28 5 2-12 28-6 2z"/>`,
  // 課題 トンマナ分析ワーク：ムードボード
  `<rect x="42" y="20" width="32" height="26" rx="2"/><rect class="acc" x="78" y="20" width="40" height="16" rx="2"/><rect x="78" y="40" width="18" height="30" rx="2"/><rect x="100" y="40" width="18" height="30" rx="2" fill="currentColor" stroke="none" opacity=".25"/><rect x="42" y="50" width="32" height="20" rx="2"/><path d="M48 60h20"/>`,
];
const ILLUST = Object.fromEntries(ILL_BASIC.map((svg, i) => [`basic-${i + 1}`, svg]));
export const illustSvg = id => ILLUST[id] ? `<svg viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ILLUST[id]}</svg>` : '';
