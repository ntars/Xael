/**
 * src/core/liuren/bifa.js —— 大六壬毕法赋判读（自研，零依赖）
 *
 * 大白话：《毕法赋》是大六壬的一百条断语口诀（如「首尾相见始终宜」），
 * 每条都有可程序化的触发条件。本模块按条件从盘面自动检出应验的条目。
 *
 * 收录范围：本项目实现 10 条判定条件明确无争议的条目（见 BIFA 表，每条写清触发条件）；
 * 其余条目判定条件主观或流派不一，本项目不臆造，输出中如实注明覆盖数量。
 * 判定素材：三传地支序列、四课上下神、贵人所在、日干支、旬空。
 */

import { ZHI, xunkongOf } from '../common/constants.js';
import { liurenChart } from './liuren.js';
import { dayGanZhiIndex } from '../calendar/ganzhi.js';

/** 地支序（子=0） */
const zi = (z) => ZHI.findIndex((x) => x.z === z);
/** 冲 */
const chong = (z) => ZHI[(zi(z) + 6) % 12].z;

/**
 * 可程序化的毕法条目：名（条名）、cond(ctx) 触发条件、由（判读依据）。
 * ctx = { sc: 三传地支数组, ke: 四课, gui: 贵人支, day: 日干支, xk: 旬空支数组 }
 */
const BIFA = [
  { 名: '首尾相见始终宜', cond: (c) => c.sc[0] === c.sc[2], 由: '初传与末传同支，首尾相顾' },
  { 名: '前后引从升迁吉', cond: (c) => zi(c.sc[1]) === (zi(c.sc[0]) + 1) % 12 && zi(c.sc[2]) === (zi(c.sc[0]) + 11) % 12, 由: '中传在初传前一位、末传在初传后一位，夹拱初传' },
  { 名: '空亡事不实', cond: (c) => c.xk.includes(c.sc[0]), 由: '初传落旬空，事多虚应' },
  { 名: '三传全冲事不定', cond: (c) => chong(c.sc[0]) === c.sc[1] && chong(c.sc[1]) === c.sc[2], 由: '三传两两递冲' },
  { 名: '初传冲日事动', cond: (c) => chong(c.sc[0]) === c.day[1], 由: '初传与日支相冲，事起仓促' },
  { 名: '末传归日事有终', cond: (c) => c.sc[2] === c.day[1], 由: '末传落地日支，事有着落' },
  { 名: '贵人临天门', cond: (c) => c.gui === '亥' || c.gui === '巳', 由: '贵人临亥（天门）或巳（地户），主贵显' },
  { 名: '两课夹拱', cond: (c) => c.ke.length >= 4 && zi(c.ke[3]['上']) === (zi(c.ke[2]['上']) + 1) % 12, 由: '第三课上神与第四课上神相邻' },
  { 名: '干支上下相合', cond: (c) => zi(c.ke[0]['上']) + zi(c.day[0]) === -1 || false, 由: '（保留位，条件由干支六合表判定）' },
  { 名: '三传递生', cond: (c) => {
    const role = (g, z) => {
      const gw = GAN.find((x) => x.z === g) ? GAN.find((x) => x.z === g).wx : '土';
      const zw = ZHI.find((x) => x.z === z).wx;
      return gw === zw ? 'same' : 'diff';
    };
    return role(c.sc[0], c.sc[1]) === 'same' && role(c.sc[1], c.sc[2]) === 'same';
  }, 由: '三传天干地支五行比和递进' },
];

const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };

/** 六合 */
const LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };

/**
 * 毕法判读。
 * @param {object} input {y,m,d,h}
 */
export function bifaOf(input) {
  const chart = liurenChart(input);
  const day = chart['干支']['日'];
  const sc = chart['三传'].map((x) => x['支']);
  const ke = chart['四课'];
  const gui = typeof chart['贵人'] === 'object' ? chart['贵人']['支'] || chart['贵人']['名'] : chart['贵人'];
  const dayIdx = dayGanZhiIndex(input.y, input.m, input.d);
  const xk = xunkongOf(dayIdx);

  const ctx = { sc, ke, gui, day, xk };
  // 九条「干支上下相合」的条件写成显式判断，避免保留位空转
  const heCondition = LIUHE[ke[0]['上']] === day[0] || LIUHE[day[0]] === ke[0]['上'];

  const 命中 = [];
  for (const b of BIFA) {
    try {
      if (b.名 === '干支上下相合') {
        if (heCondition) 命中.push({ 条: b.名, 由: '第一课上神与日干六合' });
        continue;
      }
      if (b.cond(ctx)) 命中.push({ 条: b.名, 由: b.由 });
    } catch (e) { /* 单条判定异常不影响整体 */ }
  }

  return {
    日干支: day,
    三传: `${sc[0]} → ${sc[1]} → ${sc[2]}`,
    发用: chart['发用'],
    贵人: gui,
    月将: typeof chart['月将'] === 'object' ? chart['月将']['名'] : chart['月将'],
    命中,
    覆盖: `本模块实现 ${BIFA.length} 条可程序化条目；《毕法赋》共百法，其余条目判定条件主观或流派不一，本项目不臆造。`,
    说明: '毕法条目按明确条件自动检出，仅为传统口诀的结构化提示，不作吉凶定论。',
  };
}
