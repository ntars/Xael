/**
 * src/core/mystic-gates/terms.js —— 奇门「阳遁半周」节气表（单一真源）
 *
 * 大白话：冬至到芒种这半年用阳遁，夏至到大雪用阴遁。
 *   原先 hour-chart.js 里写死一份、mirror-chart.js 又写死一份，改一处漏一处。
 */

/** 阳遁半周（冬至 → 芒种）；其余（夏至 → 大雪）为阴遁 */
export const YANG_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'];

/** 节气名是否属阳遁半周 */
export function isYangTerm(name) {
  return YANG_TERMS.includes(name);
}
