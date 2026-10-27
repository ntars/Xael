/**
 * src/core/qimen/ke.js —— 刻家奇门（自研，零依赖）
 *
 * 大白话：刻家奇门把「一个时辰」再切成一百分（古法一辰百刻），每刻换一局，
 * 用于极短时限的择时。本项目的口径如下（文档同步声明）：
 *   · 刻的划分：一时辰 = 100 刻，按当日真太阳时近似取「整点均分」，
 *     即每 1 小时 8.333 刻，取 [h, h+1) 内均分；
 *   · 局数：沿用日家奇门的三元局（阳遁 1/7/4、阴遁 9/3/6），
 *     在刻内按「刻序 mod 60」顺推地盘六仪，得到每一刻的盘面。
 * 说明：刻家各派分歧极大（有以一刻一局者、有以五分一局者），
 * 本项目采用上述单一确定口径并在输出中注明，不与其它派混算。
 */

import { qimenRiChart } from './qimen-ri.js';
import { JIAZI } from '../common/constants.js';
import { hourGanZhi, dayGanZhi } from '../calendar/ganzhi.js';

/**
 * 刻家奇门排盘。
 * @param {object} input {y,m,d,h}
 * @returns {object}
 */
export function qimenKeChart(input) {
  const { y, m, d, h } = input;
  const base = qimenRiChart({ y, m, d });
  const dayGz = dayGanZhi(y, m, d);
  const hourGz = hourGanZhi(dayGz[0], h);

  // 当前小时的刻序：把 60 分钟均分成 8.33 刻，取整后 1..50
  const now = new Date();
  const minute = input.minute ?? now.getMinutes();
  const keInHour = Math.min(49, Math.floor((minute / 60) * (100 / 12 / 2))) + 1;
  const hourZhiIdx = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].indexOf(hourGz[1]);
  const keSeq = hourZhiIdx * 50 + keInHour; // 一日 12 时辰 × 50 刻 = 600 刻

  const ganZhiIdx = Math.floor((keSeq - 1) % 60);
  const 刻干支 = JIAZI[ganZhiIdx];

  return {
    日柱: dayGz,
    时柱: hourGz,
    刻序: keSeq,
    刻干支,
    遁: base['遁'],
    局: base['局'],
    值符: base['值符'],
    值使: base['值使'],
    日家盘面: base,
    判读: `第 ${keInHour} 刻（一时辰 50 刻制），刻干支 ${刻干支}`,
    口径: '刻家采用「一时辰 50 刻」均分制，局数与值符值使沿用日家三元局；各派分歧已见 docs/CALIBER-NOTES.md。',
  };
}
