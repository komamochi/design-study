// チャプターごとの線画イラスト（160x90）。class="acc" は机のキャラメルの差し色
// デザイン基礎（basic-1〜29）と Webデザイン（web-1〜40）。ほかのコースは従来のサムネになります。
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

// Webデザイン（web-1〜web-40）
const BROWSER = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/><path d="M${x} ${y + 7}h${w}"/><circle cx="${x + 4}" cy="${y + 3.5}" r=".8"/><circle cx="${x + 7.5}" cy="${y + 3.5}" r=".8"/>`;
const ILL_WEB = [
  // 1-1 グラフィックを学ぶ意味：モニターと紙
  `<rect x="40" y="22" width="52" height="36" rx="2"/><path d="M60 58v8M54 66h12"/><path d="M84 30h30l8 8v34H84z" fill="var(--il-bg, #fff)"/><path d="M114 30v8h8"/><rect class="acc" x="90" y="44" width="14" height="10"/><path d="M90 60h24M90 65h16"/>`,
  // 1-2 レイアウトの違い：固定の紙とスクロールする画面
  `<rect x="38" y="20" width="34" height="48" rx="1"/><path d="M44 28h22M44 34h16"/><rect class="acc" x="44" y="42" width="22" height="18"/>${'<rect x="88" y="18" width="40" height="54" rx="2"/><path d="M88 25h40"/>'}<path d="M96 32h24M96 38h16M96 46h24M96 52h18M96 60h24" opacity=".6"/><path d="M136 34v28M133 59l3 4 3-4M133 37l3-4 3 4"/>`,
  // 1-3 色の違い：RGBの光とCMYKのインク
  `<circle cx="54" cy="40" r="12"/><circle class="acc" cx="64" cy="40" r="12" opacity=".9"/><circle cx="59" cy="50" r="12"/><path d="M84 45h4" /><g><rect x="96" y="30" width="10" height="10"/><rect class="acc" x="108" y="30" width="10" height="10"/><rect x="96" y="42" width="10" height="10"/><rect x="108" y="42" width="10" height="10" fill="currentColor" stroke="none" opacity=".3"/></g>`,
  // 1-4 紙の基礎知識：重なった紙
  `<path d="M54 26h44v44H54z" opacity=".45"/><path d="M60 20h44v44H60z" opacity=".7"/><path d="M66 14h36l8 8v38H66z"/><path d="M102 14v8h8"/><path class="acc-s" d="M74 34h26M74 42h20M74 50h24"/>`,
  // 1-5 印刷の基礎知識：プリンター
  `<path d="M60 20h40v14H60z"/><rect x="48" y="34" width="64" height="24" rx="3"/><path d="M60 50h40v20H60z" fill="var(--il-bg, #fff)"/><path class="acc-s" d="M66 58h28M66 64h20"/><circle class="acc" cx="104" cy="41" r="2"/>`,
  // 1-6 特殊印刷・印刷加工：箔押しのカードときらめき
  `<rect x="46" y="24" width="60" height="42" rx="2"/><path class="acc" d="M76 33l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/><path d="M116 22v10M111 27h10M122 44v6M119 47h6"/>`,
  // 1-7 入稿データの作成とチェック：トンボとチェック
  `<rect x="54" y="24" width="44" height="40"/><path d="M48 24h-8M54 18v-8M98 18v-8M104 24h8M48 64h-8M54 70v8M98 70v8M104 64h8"/><circle class="acc" cx="112" cy="52" r="10"/><path d="M107 52l4 4 7-8" stroke="#fff"/>`,
  // 1-8 データ入稿のやり方：書類からクラウドへ
  `<path d="M42 30h26l6 6v32H42z"/><path d="M68 30v6h6"/><path d="M48 46h18M48 52h12"/><path d="M82 50h14M92 46l4 4-4 4"/><path class="acc" d="M108 58a9 9 0 0 1 0-18 12 12 0 0 1 22 4 7 7 0 0 1 0 14z"/>`,
  // 2-1 Webサイトの仕組み：サーバーとブラウザ
  `<rect x="40" y="24" width="26" height="12" rx="2"/><rect x="40" y="40" width="26" height="12" rx="2"/><circle class="acc" cx="60" cy="30" r="1.5"/><circle class="acc" cx="60" cy="46" r="1.5"/><path d="M70 38h16" stroke-dasharray="2 3"/><path d="M82 34l4 4-4 4"/>${'BROWSER'}`.replace('BROWSER', BROWSER(92, 22, 36, 32)),
  // 2-2 Webサイトのタイプと目的：3つのちがうページ
  `${BROWSER(36, 26, 26, 36)}<rect class="acc" x="40" y="37" width="18" height="8"/>${BROWSER(67, 26, 26, 36)}<path d="M71 38h18M71 44h18M71 50h12"/>${BROWSER(98, 26, 26, 36)}<rect x="102" y="37" width="8" height="8"/><rect x="112" y="37" width="8" height="8"/><rect x="102" y="48" width="8" height="8"/><rect x="112" y="48" width="8" height="8"/>`,
  // 2-3 Webレイアウトの基本：ヘッダー・メイン・サイド
  `${BROWSER(44, 18, 72, 54)}<rect x="50" y="30" width="60" height="6"/><rect class="acc" x="50" y="40" width="40" height="26"/><rect x="94" y="40" width="16" height="26"/>`,
  // 2-4 目的別レイアウト：ちがう並びの2画面
  `${BROWSER(38, 22, 40, 46)}<rect class="acc" x="42" y="33" width="32" height="12"/><path d="M42 50h32M42 56h24M42 62h28"/>${BROWSER(84, 22, 40, 46)}<rect x="88" y="33" width="14" height="12"/><rect x="106" y="33" width="14" height="12"/><rect class="acc" x="88" y="49" width="32" height="14"/>`,
  // 2-5 上流設計：階段を上るステップ
  `<path d="M40 70h20V56h20V42h20V28h20"/><circle class="acc" cx="110" cy="20" r="4"/><path d="M110 24v4"/><path d="M48 64h4M68 50h4M88 36h4" opacity=".5"/>`,
  // 2-6 企業を理解する：ビル
  `<path d="M56 70V26h28v44M84 70V40h20v30M48 70h64"/><path d="M63 34h4M73 34h4M63 44h4M73 44h4M63 54h4M73 54h4M90 48h8M90 56h8"/><rect class="acc" x="66" y="62" width="8" height="8"/>`,
  // 2-7 ターゲットを設定する：人と的
  `<circle cx="58" cy="32" r="7"/><path d="M46 62c0-10 5-17 12-17s12 7 12 17"/><circle cx="104" cy="44" r="18"/><circle cx="104" cy="44" r="11"/><circle class="acc" cx="104" cy="44" r="4"/><path d="M78 44h16"/><path d="M90 40l4 4-4 4"/>`,
  // 2-8 目的とゴールを設定する：山の上の旗
  `<path d="M38 70l26-30 14 14 12-12 30 28z"/><path d="M90 42V20"/><path class="acc" d="M90 20h16l-4 5 4 5H90z"/><path d="M50 66l10-6 8 4" stroke-dasharray="2 3"/>`,
  // 2-9 競合を調査する：グラフと虫めがね
  `<path d="M40 70h56"/><rect x="46" y="48" width="10" height="22"/><rect class="acc" x="62" y="36" width="10" height="34"/><rect x="78" y="54" width="10" height="16"/><circle cx="106" cy="34" r="12"/><path d="M115 43l9 9"/>`,
  // 2-10 フレームワークで分析する：4つのマス
  `<rect x="52" y="18" width="56" height="54" rx="2"/><path d="M80 18v54M52 45h56"/><rect class="acc" x="84" y="22" width="20" height="19" rx="1"/><path d="M58 28h14M58 54h14M88 54h14" opacity=".6"/>`,
  // 2-11 評価基準を設定する：チェックリストと星
  `<rect x="48" y="18" width="46" height="54" rx="2"/><path d="M56 30l3 3 5-6M56 44l3 3 5-6M56 58l3 3 5-6"/><path d="M70 30h16M70 44h16M70 58h12"/><path class="acc" d="M112 36l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z"/>`,
  // 2-12 施策の方向性を決める：道しるべ
  `<path d="M80 72V20"/><path d="M80 24h28l6 6-6 6H80z"/><path class="acc" d="M80 42H52l-6 6 6 6h28z"/><path d="M66 72h28"/>`,
  // 2-13 情報設計について：情報の木
  `<rect class="acc" x="70" y="16" width="20" height="12" rx="1"/><path d="M80 28v8M50 36h60M50 36v8M80 36v8M110 36v8"/><rect x="40" y="44" width="20" height="10" rx="1"/><rect x="70" y="44" width="20" height="10" rx="1"/><rect x="100" y="44" width="20" height="10" rx="1"/><path d="M45 54v10h10M105 54v10h10"/>`,
  // 2-14 サイトコンテンツを企画する：ふせん
  `<rect x="44" y="24" width="24" height="22" rx="1"/><rect class="acc" x="72" y="20" width="24" height="22" rx="1"/><rect x="100" y="26" width="24" height="22" rx="1"/><rect x="58" y="50" width="24" height="22" rx="1"/><rect x="88" y="52" width="24" height="20" rx="1" opacity=".6"/><path d="M48 32h14M76 28h14M104 34h14M62 58h14"/>`,
  // 2-15 サイトマップを作成する：つながったページ
  `<rect class="acc" x="70" y="14" width="20" height="14" rx="1"/><path d="M80 28v6M48 34h64M48 34v6M80 34v6M112 34v6"/><rect x="38" y="40" width="20" height="14" rx="1"/><rect x="70" y="40" width="20" height="14" rx="1"/><rect x="102" y="40" width="20" height="14" rx="1"/><path d="M80 54v6"/><rect x="70" y="60" width="20" height="14" rx="1"/>`,
  // 2-16 ワイヤーフレームを作成する：画像のバツ印
  `${BROWSER(44, 16, 72, 58)}<rect x="50" y="28" width="38" height="24"/><path d="M50 28l38 24M88 28L50 52"/><path d="M94 30h16M94 36h12M94 42h16"/><rect class="acc" x="50" y="58" width="20" height="8" rx="1"/>`,
  // 2-17 デザインについて：ペンツールの曲線
  `<path d="M40 62C56 20 96 70 120 28"/><path d="M58 40l-14 2M58 40l16-4" opacity=".6"/><rect x="55" y="37" width="6" height="6"/><rect class="acc" x="104" y="36" width="6" height="6"/><path d="M88 62l8-20 8 20-8 6z"/><path d="M96 42v14"/>`,
  // 2-18 デザインコンセプトを設計する：電球と色見本
  `<path d="M56 56c0-6-8-10-8-20a16 16 0 0 1 32 0c0 10-8 14-8 20z"/><path d="M58 62h12M60 67h8"/><rect class="acc" x="92" y="24" width="12" height="12"/><rect x="106" y="24" width="12" height="12"/><rect x="92" y="38" width="12" height="12"/><rect x="106" y="38" width="12" height="12" fill="currentColor" stroke="none" opacity=".25"/>`,
  // 2-19 参考デザインの探し方：画面と虫めがね
  `${BROWSER(40, 18, 60, 46)}<rect x="46" y="30" width="22" height="14"/><rect x="72" y="30" width="22" height="14"/><rect x="46" y="48" width="22" height="10"/><circle class="acc-s" cx="104" cy="52" r="12"/><path d="M113 61l9 9"/>`,
  // 2-20 デザインをチェックする：画面とチェック
  `${BROWSER(42, 18, 62, 48)}<path d="M48 32h40M48 40h30M48 48h36" opacity=".6"/><circle class="acc" cx="108" cy="58" r="12"/><path d="M102 58l4 4 8-8" stroke="#fff"/>`,
  // 2-21 提案資料を作成する：イーゼルのボード
  `<rect x="46" y="18" width="68" height="42" rx="2"/><path d="M80 60v12M64 74l16-14 16 14"/><rect class="acc" x="54" y="36" width="8" height="16"/><rect x="66" y="30" width="8" height="22"/><rect x="78" y="40" width="8" height="12"/><path d="M92 30h16M92 36h12"/>`,
  // 3-1 LPの基礎知識：縦に長い1枚のページ
  `<rect x="64" y="10" width="32" height="70" rx="2"/><rect class="acc" x="68" y="16" width="24" height="14"/><path d="M68 36h24M68 41h18M68 50h24M68 55h20M68 64h24"/><path d="M108 24v42M105 63l3 4 3-4"/>`,
  // 3-2 LPの構成：積み重なったブロック
  `<rect x="58" y="12" width="44" height="12" rx="1"/><rect x="58" y="27" width="44" height="12" rx="1"/><rect class="acc" x="58" y="42" width="44" height="12" rx="1"/><rect x="58" y="57" width="44" height="12" rx="1"/><path d="M48 18h4M48 33h4M48 48h4M48 63h4" opacity=".6"/>`,
  // 3-3 FVエリア：画面いっぱいのメインビジュアル
  `${BROWSER(42, 16, 76, 58)}<rect class="acc" x="46" y="27" width="68" height="30"/><path d="M54 38h28M54 44h20" stroke="#fff"/><path d="M70 64h20"/>`,
  // 3-4 ボディエリア：中ほどのセクション
  `${BROWSER(42, 16, 76, 58)}<rect x="46" y="27" width="68" height="10" opacity=".5"/><rect class="acc" x="46" y="40" width="20" height="16"/><rect class="acc" x="70" y="40" width="20" height="16"/><rect class="acc" x="94" y="40" width="20" height="16"/><path d="M46 62h68M46 67h44" opacity=".5"/>`,
  // 3-5 CTAエリア：ボタンとカーソル
  `<rect class="acc" x="46" y="32" width="62" height="20" rx="10"/><path d="M62 42h30" stroke="#fff"/><path d="M98 48l2 22 5-6 7 10 4-3-7-9 8-2z" fill="var(--il-bg, #fff)"/>`,
  // 課題：バナー：横長のバナー
  `<rect x="36" y="26" width="88" height="38" rx="2"/><path d="M44 38h34M44 46h24"/><rect class="acc" x="44" y="52" width="20" height="6" rx="1"/><circle cx="104" cy="45" r="11"/>`,
  // 課題：バナー（応用）：いろいろなサイズのバナー
  `<rect x="34" y="20" width="56" height="22" rx="1"/><rect class="acc" x="40" y="34" width="14" height="4" rx="1"/><path d="M40 27h24"/><rect x="96" y="20" width="30" height="50" rx="1"/><path d="M101 28h18M101 33h12"/><rect x="34" y="48" width="56" height="22" rx="1"/><circle cx="78" cy="59" r="6"/><path d="M40 56h24"/>`,
  // 課題：サイト模写（基礎）：お手本と写し
  `${BROWSER(34, 24, 40, 40)}<rect class="acc" x="38" y="35" width="32" height="10"/><path d="M38 50h32M38 56h22"/><path d="M78 44h4M78 48h4"/>${BROWSER(86, 24, 40, 40)}<rect x="90" y="35" width="32" height="10" stroke-dasharray="2 2"/><path d="M90 50h32M90 56h22" stroke-dasharray="2 2"/>`,
  // 課題：サイト模写（応用）：グリッドとトレースする鉛筆
  `${BROWSER(40, 16, 70, 54)}<path d="M52 23v47M64 23v47M76 23v47M88 23v47M100 23v47" opacity=".3"/><rect x="46" y="28" width="58" height="12"/><rect class="acc" x="46" y="44" width="28" height="18"/><path d="M108 70l12-30 6 2-12 30-7 3z"/>`,
  // 課題：コーポレートサイト：画面の中の会社
  `${BROWSER(40, 16, 80, 58)}<path d="M66 66V36h18v30M84 66V46h12v20M58 66h44"/><path class="acc-s" d="M71 42h8M71 50h8M71 58h8"/><path d="M48 28h20M92 28h20" opacity=".6"/>`,
  // 課題：LP：スマホの縦長ページ
  `<rect x="62" y="12" width="36" height="66" rx="5"/><path d="M76 16h8"/><rect class="acc" x="67" y="22" width="26" height="16"/><path d="M67 44h26M67 49h18M67 56h26"/><rect class="acc" x="70" y="62" width="20" height="7" rx="3.5"/><path d="M110 30v30M107 57l3 4 3-4"/>`,
];
Object.assign(ILLUST, Object.fromEntries(ILL_WEB.map((svg, i) => [`web-${i + 1}`, svg])));
export const illustSvg = id => ILLUST[id] ? `<svg viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ILLUST[id]}</svg>` : '';
