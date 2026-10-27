/**
 * src/core/meihua/meihua.js —— 梅花易数（自研，零依赖）
 *
 * 大白话：梅花易数起卦用「数字」：两数（或时间数）除八取余得上卦下卦，
 * 两数之和加时辰数除六取余定动爻；再拆本卦/互卦/变卦，按体用五行生克断吉凶。
 *
 * 口径：
 *   · 先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8（除 8 取余，余 0 作 8）；
 *   · 动爻：总数除 6 取余（余 0 作 6），自初爻数起；
 *   · 互卦：本卦二三四爻为下卦、三四五爻为上卦；
 *   · 变卦：动爻阴阳反转；
 *   · 体用：动爻所在卦为「用」、静卦为「体」；体克用吉、用生体吉、
 *     用克体凶、体生用耗、体用比和吉。
 */

import { ZHI } from '../common/constants.js';

/** 先天八卦数 → 卦名 */
const NUM2GUA = { 1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤' };
/** 卦名 → 爻象（自下而上） */
const GUA_BITS = { 乾: [1,1,1], 兑: [1,1,0], 离: [1,0,1], 震: [1,0,0], 巽: [0,1,1], 坎: [0,1,0], 艮: [0,0,1], 坤: [0,0,0] };
/** 卦五行 */
const GUA_WX = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' };
/** 象名 */
const Xiang = {
  乾: '天', 兑: '泽', 离: '火', 震: '雷', 巽: '风', 坎: '水', 艮: '山', 坤: '地',
};

function mod8(n) { return ((n - 1) % 8 + 8) % 8 + 1; }
function mod6(n) { return ((n - 1) % 6 + 6) % 6 + 1; }

/** 生克（体/用） */
function guanXi(a, b) {
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  if (a === b) return '比和';
  if (SHENG[a] === b) return a + '生' + b;
  if (SHENG[b] === a) return b + '生' + a;
  if (KE[a] === b) return a + '克' + b;
  return b + '克' + a;
}

function panMian(upper, lower, dongIdx, bits) {
  const key = upper + lower;
  return { 卦: bits, 上卦: upper, 下卦: lower };
}

/**
 * 梅花起卦。
 * @param {Object} input
 *   方式一 {num1, num2, hourZhi?} 数字起卦（num1 上卦、num2 下卦、和+时支序动爻）
 *   方式二 {y,m,d,h} 时间起卦（年支序+月+日 为上卦；再加时支序 为下卦）
 */
export function meihuaChart(input) {
  let n1, n2, total, dongShu;
  if (input.num1 != null) {
    n1 = mod8(input.num1); n2 = mod8(input.num2);
    const hourZhi = input.hourZhi != null ? input.hourZhi : 1;
    total = input.num1 + input.num2;
    dongShu = mod6(total + hourZhi);
  } else {
    const { y, m, d, h = 12 } = input;
    // 年支序（简化以公历年近似：子=1…亥=12，按 (y-3)%12+1，文档声明口径）
    const yearZhi = ((y - 3) % 12 + 12) % 12 + 1;
    const hourZhi = Math.floor(((h + 1) % 24) / 2) + 1;
    n1 = mod8(yearZhi + m + d);
    n2 = mod8(yearZhi + m + d + hourZhi);
    dongShu = mod6(yearZhi + m + d + hourZhi);
  }
  const upper = NUM2GUA[n1], lower = NUM2GUA[n2];
  const bits = [...GUA_BITS[lower], ...GUA_BITS[upper]]; // 自初爻起：下卦三爻+上卦三爻
  const dongIdx = dongShu - 1; // 0 起
  const upperIsDong = dongIdx >= 3;

  // 互卦：二三四爻为下卦、三四五爻为上卦
  const huBits = [bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]];
  const huLower = guaName(huBits.slice(0, 3));
  const huUpper = guaName(huBits.slice(3));

  // 变卦：动爻反转
  const bianBits = [...bits];
  bianBits[dongIdx] = 1 - bianBits[dongIdx];
  const bianLower = guaName(bianBits.slice(0, 3));
  const bianUpper = guaName(bianBits.slice(3));

  // 体用
  const ti = upperIsDong ? lower : upper;
  const yong = upperIsDong ? upper : lower;
  const rel = guanXi(GUA_WX[ti], GUA_WX[yong]);
  const panJue = rel === '比和' || rel.includes(ti + '克' + yong) || rel.includes(yong + '生' + ti) ? '吉' : rel.includes(yong + '克' + ti) ? '凶' : '平';

  return {
    input,
    起卦: input.num1 != null ? '数字' : '时间',
    本卦: { 名: Xiang[upper] + Xiang[lower], 上卦: upper, 下卦: lower, 爻: bits },
    互卦: { 名: Xiang[huUpper] + Xiang[huLower], 上卦: huUpper, 下卦: huLower, 爻: huBits },
    变卦: { 名: Xiang[bianUpper] + Xiang[bianLower], 上卦: bianUpper, 下卦: bianLower, 爻: bianBits },
    动爻: dongShu,
    体用: { 体: ti + '(' + GUA_WX[ti] + ')', 用: yong + '(' + GUA_WX[yong] + ')', 生克: rel, 断: panJue },
    口径: '先天八卦数起卦；动爻总数除6；互卦二三四/三四五；体用生克',
  };
}

function guaName(bits3) {
  for (const g in GUA_BITS) if (GUA_BITS[g].join('') === bits3.join('')) return g;
  return '';
}
