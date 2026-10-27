/**
 * src/core/qimen/baojian.js —— 奇门遁甲·宝鉴日奇（自研，零依赖）
 *
 * 大白话：《奇门宝鉴》一系的「日奇」用法，是日家奇门的一个具体流派做法：
 * 以日干为「值事」，日支定门，按六十日轮转布八门九星，专用于一日之内的择时择方。
 * 本项目取《奇门宝鉴》通行口诀，独立实现，与「排日家」的 180 日一元轮派并存——
 * 两派结果不完全相同，输出中分别标注，避免混算。
 *
 * 口径（本项目采用，文档同步声明）：
 *   · 值符星：由日干支所在旬首仪落宫取本宫星（与日家同法）；
 *   · 八门：日支三合局定起门——申子辰日起休门、寅午戌日起景门、
 *     巳酉丑日起生门、亥卯未日起开门，按八门环序顺布；
 *   · 九星：日干五合定起星（甲己起天蓬、乙庚起天芮、丙辛起天冲、
 *     丁壬起天辅、戊癸起天心），顺布。
 */

import { JIAZI, GAN, ZHI } from '../common/constants.js';
import { dayGanZhi, dayGanZhiIndex } from '../calendar/ganzhi.js';
import { qimenRiChart } from './qimen-ri.js';

/** 八门环序（阳顺） */
const DOOR_RING = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
/** 九星环序 */
const STAR_RING = ['天蓬', '天芮', '天冲', '天辅', '天英', '天柱', '天任', '天心'];
/** 八宫（不含中五） */
const GONG8 = [1, 8, 3, 4, 9, 2, 7, 6];

/** 日支三合局起门 */
const START_DOOR = { 申: '休门', 子: '休门', 辰: '休门', 寅: '景门', 午: '景门', 戌: '景门', 巳: '生门', 酉: '生门', 丑: '生门', 亥: '开门', 卯: '开门', 未: '开门' };

/** 日干五合起星 */
const START_STAR = { 甲: '天蓬', 己: '天蓬', 乙: '天芮', 庚: '天芮', 丙: '天冲', 辛: '天冲', 丁: '天辅', 壬: '天辅', 戊: '天心', 癸: '天心' };

/**
 * 宝鉴日奇。
 * @param {object} input {y,m,d}
 */
export function qimenBaojianChart(input) {
  const { y, m, d } = input;
  const gz = dayGanZhi(y, m, d);
  const [gan, zhi] = gz;

  const dStart = DOOR_RING.indexOf(START_DOOR[zhi]);
  const sStart = STAR_RING.indexOf(START_STAR[gan]);

  const cells = GONG8.map((gong, i) => ({
    宫: gong,
    门: DOOR_RING[(dStart + i) % 8],
    星: STAR_RING[(sStart + i) % 8],
  }));

  // 与「日家」并列输出，便于对照
  const ri = qimenRiChart({ y, m, d });

  return {
    日干支: gz,
    起门: `${zhi}日三合局 → ${START_DOOR[zhi]}`,
    起星: `${gan}干五合 → ${START_STAR[gan]}`,
    cells,
    对照日家: { 遁: ri['遁'], 局: ri['局'], 值符: ri['值符'], 值使: ri['值使'] },
    口径: '宝鉴日奇按《奇门宝鉴》日奇口诀：日支定起门、日干定起星，八宫顺布；与 180 日一元轮派日家并列展示，两派不混算。',
  };
}
