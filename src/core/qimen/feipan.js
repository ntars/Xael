/**
 * src/core/qimen/feipan.js —— 奇门遁甲·飞盘（自研，零依赖）
 *
 * 大白话：奇门分「转盘」与「飞盘」两派。转盘是整盘一起转（本项目的时家即是）；
 * 飞盘是按九宫飞泊次序 1→2→3…逐宫飞布，中宫不寄宫，天禽星单列。
 * 本模块输出飞盘派的地盘/天盘/九星/八门四层，方便两派对照。
 *
 * 口径：
 *   · 地盘：六仪三奇按飞泊次序（1→2→3…→9，阳顺阴逆）自局数宫起排；
 *   · 天盘：以时干落宫为值符宫，星按「蓬芮冲辅禽心柱任英」飞泊次序自值符宫排；
 *   · 八门：以值使门为本位，按 休生伤杜景死惊开 顺序飞泊；
 *   · 中宫照排（飞盘不寄宫）。流派分歧见 docs/CALIBER-NOTES.md。
 */

import { qimenChart } from './qimen.js';
import { GAN, ZHI } from '../common/constants.js';

/** 飞泊次序（1→9 洛书宫序） */
const FLY = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
const FEI_STARS = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
const FEI_DOORS = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];

/** 飞布：从 start 宫起，按 dir（+1 阳 / −1 阴）逐宫推 */
function flyPan(items, startGong, yang) {
  const out = {};
  for (let i = 0; i < items.length; i++) {
    const gong = ((startGong - 1 + (yang ? i : i * -1) + 9 * 10) % 9) + 1;
    out[gong] = items[i];
  }
  return out;
}

/**
 * 飞盘奇门。
 * @param {object} input {y,m,d,h}
 */
export function qimenFeiChart(input) {
  const base = qimenChart(input);
  const yang = base['遁'] === '阳遁';
  const ju = Number(String(base['局']).replace(/[^0-9]/g, '').slice(0, 1)) || 1;

  // 地盘：自局数宫飞布六仪三奇
  const 地盘 = flyPan(YI, ju, yang);

  // 天盘：九星随值符星所在宫飞布；天盘干取「星本宫地盘仪」——
  // 即该星在转盘派的固定本宫（蓬1芮2冲3辅4禽5心6柱7任8英9）上的地盘干，与转盘一致性好对照
  const STAR_HOME_IDX = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 与 FEI_STARS 一一对应的本宫
  const 天盘 = {};
  const fuGong = Number(base['值符宫']) || ju; // 值符星落宫（转盘同口径）
  const 九星 = flyPan(FEI_STARS, fuGong, yang);
  for (const gong of FLY) {
    const star = 九星[gong];
    const home = STAR_HOME_IDX[FEI_STARS.indexOf(star)];
    天盘[gong] = 地盘[home];
  }

  // 八门：自值使门本位飞布（简化口径：以 1 宫起排）
  const 八门 = flyPan(FEI_DOORS, 1, yang);

  const cells = FLY.map((gong) => ({
    宫: gong,
    天盘干: 天盘[gong],
    地盘干: 地盘[gong],
    星: 九星[gong],
    门: 八门[gong] || '中宫无门',
  }));

  return {
    遁: base['遁'],
    局: base['局'],
    值符: base['值符'],
    值使: base['值使'],
    cells,
    口径: '飞盘派：九宫飞泊、中宫不寄宫、天禽单列。转盘派见「排奇门」。两派结果可对照，不可混算。',
  };
}
