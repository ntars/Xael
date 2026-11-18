/**
 * src/core/purple-star/readings.js —— 紫微斗数·星曜居宫断语取用
 *
 * 文献依据：refs-texts/《紫微斗数全书》-明·罗洪先（题陈希夷）.md
 *   「### 星居宫」断语格 168 条（十四主星 × 十二宫无缺格），已逐条录入
 *   data/palace-readings.js。原文照录，不改写、不增补。
 *
 * 取用规则（只做取用，不做发挥）：
 *   · 某宫若坐主星，则输出该主星在本宫的原文断语；
 *   · 某宫若坐两主星（同宫双星），两条断语并列给出，不合并、不改写；
 *   · 某宫无主星（空宫），不作「借对宫」推断——《紫微斗数全书》电子底本无借星明文
 *     （全书「借星」零命中），故如实留空，只标「无主星」。
 *
 * 本模块不含安星规则（安星见 chart.js，取中州派通行诀并已注明无原书直证）。
 */

import { PALACE_READINGS, READING_PALACES, READING_STARS } from './data/palace-readings.js';
import { purpleStarChart } from './chart.js';

/**
 * 取某宫某星的原文断语。
 * @param {string} palace 宫名（命宫/兄弟/夫妻/子女/财帛/疾厄/迁移/仆役/官禄/田宅/福德/父母）
 * @param {string} star 主星名（十四主星之一）
 * @returns {string|null} 原文；非十四主星或宫名不识别时返回 null
 */
export function palaceReadingOf(palace, star) {
  const row = PALACE_READINGS[palace];
  if (!row) return null;
  const txt = row[star];
  return txt || null;
}

/**
 * 按盘面取各宫断语。
 * @param {object} input 生辰输入 {y,m,d,h,minute?,gender?} 或已排好的盘（含 cells）
 * @returns {{
 *   cells: Array<{宫:string, 支:string, 主星:string[], 断语:Array<{星:string, 文:string}>}>,
 *   命宫: object|null, 身宫: object|null,
 *   依据: string, 缺口: string[]
 * }}
 */
export function purpleStarReadingsOf(input) {
  const chart = input && Array.isArray(input.cells) ? input : purpleStarChart(input);
  const cells = (chart.cells || []).map((c) => {
    const stars = (c.主星 || []).filter((s) => READING_STARS.includes(s));
    const 断语 = stars
      .map((s) => ({ 星: s, 文: palaceReadingOf(c.宫, s) }))
      .filter((x) => x.文);
    return { 宫: c.宫, 支: c.支, 主星: c.主星 || [], 断语 };
  });
  const pick = (flag) => cells.find((c) => {
    const raw = (chart.cells || []).find((x) => x.宫 === c.宫);
    return raw && raw[flag];
  }) || null;
  const 命宫 = pick('是命宫');
  const 身宫 = pick('是身宫');
  return {
    cells,
    命宫,
    身宫,
    依据: '《紫微斗数全书》「星居宫」断语 168 格（原书直录，十四主星 × 十二宫）',
    缺口: [
      '本断语只列「某主星坐某宫」的原文，不含庙旺利陷（原书电子底本无亮度表）、不含三方四正会照的增减论断。',
      '空宫不借对宫：《紫微斗数全书》电子底本「借星」零命中，无明文可依，故如实留空。',
      '原文为明代断语（含「仆役」「刑克」等当时用语），照录不改，避免以今义篡古。',
    ],
  };
}

export { READING_PALACES, READING_STARS };
