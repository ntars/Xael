/**
 * tests/geomancy.test.js —— 八宅 / 飞星 文献口径校验（Node 直跑，零依赖断言）
 *
 * 八宅部分：用《钦定协纪辨方书·卷二·大游年变卦》的翻卦法逐步复算大游年八星，
 * 与 src/core/geomancy/eight-mansions.js 的 YOU 表逐卦逐星比对；同时校验八星各占一宫（无重复）。
 */

import { YOU, eightMansionsChart, lifeGua, lifeGuaSanYuan } from '../src/core/geomancy/eight-mansions.js';
import { flyingStarsChart } from '../src/core/geomancy/flying-stars.js';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = typeof actual === 'object' ? JSON.stringify(actual) : actual;
  const e = typeof expected === 'object' ? JSON.stringify(expected) : expected;
  if (a === e) { pass += 1; } else { fail += 1; console.error(`✗ ${label}: 期望 ${e}，实际 ${a}`); }
}

// --- 三爻表示（自下而上：初、二、三）---
const TRIGRAM = {
  乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
const NAME_OF = Object.fromEntries(Object.entries(TRIGRAM).map(([k, v]) => [v.join(''), k]));
const GONG_NUM = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
// 翻卦次序：上爻、中爻、下爻、中爻、上爻、中爻、下爻、中爻
const FLIP = [2, 1, 0, 1, 2, 1, 0, 1];
const STAR_ORDER = ['生气', '五鬼', '延年', '六煞', '祸害', '天医', '绝命', '伏位'];

function flipTable(gua) {
  const t = [...TRIGRAM[gua]];
  const out = {};
  FLIP.forEach((bit, i) => {
    t[bit] = 1 - t[bit];
    out[STAR_ORDER[i]] = GONG_NUM[NAME_OF[t.join('')]];
  });
  return out;
}

for (const gua of Object.keys(YOU)) {
  eq(YOU[gua], flipTable(gua), `${gua} 卦大游年与《协纪辨方书》翻卦法逐星相符`);
  const gongs = Object.values(YOU[gua]).sort((a, b) => a - b).join(',');
  const want = Object.values(GONG_NUM).filter((n) => n !== 5).sort((a, b) => a - b).join(',');
  eq(gongs, want, `${gua} 卦八星各占一宫不重复`);
}

// --- 命卦（后两位叠加法 + 男寄艮女寄坤）---
eq(lifeGua(1985, '男').卦, '兑', '1985 男命卦兑');
eq(lifeGua(1985, '女').卦, '艮', '1985 女命卦艮');
eq(lifeGua(1900, '男').卦, '坎', '1900 男命卦坎');
eq(lifeGua(2000, '女').卦, '巽', '2000 女命卦巽（后两位 0 → 4，坎离震巽为东四命）');

// --- 排盘结构 ---
const c = eightMansionsChart(1985, '男');
eq(c.命卦, '兑', '卦宅 1985 男命卦');
eq(c.八方.length, 8, '八方共八条');
eq(c.八方.find((x) => x.星 === '伏位').卦, '兑', '兑宅伏位在兑');
eq(c.八方.find((x) => x.星 === '生气').卦, '乾', '兑宅生气在乾（乾兑互变上爻）');

// --- 命卦·三元九宫法：《钦定协纪辨方书·卷三十四·男女九宫》引《三元经》三处元首锚点 ---
{
  const t = lifeGuaSanYuan;
  eq(t(1864, '男').命卦数, 1, '三元九宫：上元甲子男起坎一');
  eq(t(1864, '男').元, '上元', '三元九宫：1864 属上元');
  eq(t(1924, '男').命卦数, 4, '三元九宫：中元甲子男起巽四');
  eq(t(1924, '男').元, '中元', '三元九宫：1924 属中元');
  eq(t(1984, '男').命卦数, 7, '三元九宫：下元甲子男起兑七');
  eq(t(1984, '男').元, '下元', '三元九宫：1984 属下元');
  eq(t(1864, '女').命卦数, 5, '三元九宫：上元甲子女起中五');
  eq(t(1924, '女').命卦数, 2, '三元九宫：中元甲子女起坤二');
  eq(t(1984, '女').命卦数, 8, '三元九宫：下元甲子女起艮八');
  eq(t(1864, '女').说明.indexOf('无卦可寄') > 0, true, '三元九宫：中五如实留空不推定');
  eq(t(1985, '男').命卦数, 6, '三元九宫：下元甲子次年男逆行一步至乾六');
}

/* ---------- 年紫白：对拍《协纪辨方书·卷十四·三元紫白》（2026-10 文献校正） ---------- */
{
  // 盘面阅读序 巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6 → 索引 = 位置
  const ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const at = (c, gong) => c.年紫白.盘.split(' | ')[ORDER.indexOf(gong)];

  // 原文「上元 一白中 六白坎 八白震 九紫巽」——上元甲子年（1864）
  const c1864 = flyingStarsChart({ y: 1864, m: 6, d: 15 });
  eq(c1864.年紫白.入中, '一白', '年紫白：1864 上元甲子入中一白（协纪卷十四）');
  eq(at(c1864, 5), '一白', '年紫白：1864 中宫一白');
  eq(at(c1864, 1), '六白', '年紫白：1864 坎宫六白');
  eq(at(c1864, 3), '八白', '年紫白：1864 震宫八白');
  eq(at(c1864, 4), '九紫', '年紫白：1864 巽宫九紫');

  // 原文「中元 一白坤 六白兑 八白离 九紫坎」——中元甲子年（1924）
  const c1924 = flyingStarsChart({ y: 1924, m: 6, d: 15 });
  eq(at(c1924, 2), '一白', '年紫白：1924 坤宫一白');
  eq(at(c1924, 7), '六白', '年紫白：1924 兑宫六白');
  eq(at(c1924, 9), '八白', '年紫白：1924 离宫八白');
  eq(at(c1924, 1), '九紫', '年紫白：1924 坎宫九紫');

  // 原文下元甲子（1984）条作「一白艮 六白防 八白干 九紫兑」：
  // 「干」即乾宫（6），「防」为「巽」的 OCR 讹字（巽宫 4）——四星各占一宫，与我们盘面逐星相符。
  const c1984 = flyingStarsChart({ y: 1984, m: 6, d: 15 });
  eq(at(c1984, 8), '一白', '年紫白：1984 艮宫一白（协纪卷十四）');
  eq(at(c1984, 4), '六白', '年紫白：1984 巽宫六白（原文「防」为「巽」之讹）');
  eq(at(c1984, 6), '八白', '年紫白：1984 乾宫八白（原文「干」即乾）');
  eq(at(c1984, 7), '九紫', '年紫白：1984 兑宫九紫');
}

export const passed = pass;
export const failed = fail;

if (process.argv[1] && process.argv[1].endsWith('geomancy.test.js')) {
  console.log(`\n通过 ${pass} 项断言，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
}
