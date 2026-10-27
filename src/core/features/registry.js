/**
 * src/core/features/registry.js —— 功能注册表（单一真源）
 *
 * 大白话：全部 22 项功能的「触发词 → 处理器」清单在这里。
 * 搜索入口按「最长触发词优先」匹配；触发词表与功能介绍页逐字同源。
 * 排序原则：最长优先 + 常用性优先（排八字/排紫微/查黄历最常用，靠前）。
 */

import { chart as baziChart, pillarsText } from '../bazi/bazi.js';
import { ziweiChart } from '../ziwei/ziwei.js';
import { qimenChart } from '../qimen/qimen.js';
import { qimenRiChart } from '../qimen/qimen-ri.js';
import { liurenChart } from '../liuren/liuren.js';
import { liuyaoChart } from '../liuyao/liuyao.js';
import { meihuaChart } from '../meihua/meihua.js';
import { bazhaiChart } from '../fengshui/bazhai.js';
import { feixingChart } from '../fengshui/feixing.js';
import { daily } from '../huangli/daily.js';
import { solarToLunar, lunarToSolar } from '../calendar/lunar2.js';
import { GUA64_ORDER } from '../common/iching.js';
import { patternOf } from '../bazi/pattern.js';
import { shenshaOf } from '../bazi/shensha.js';
import { dayunOf } from '../bazi/dayun.js';
import { wangshuaiOf } from '../liuyao/wangshuai.js';
import { qimenKeChart } from '../qimen/ke.js';
import { qimenBaojianChart } from '../qimen/baojian.js';
import { qimenNianChart, qimenYueChart } from '../qimen/nianyue.js';
import { qimenFeiChart } from '../qimen/feipan.js';
import { qimenGeOf } from '../qimen/ge.js';
import { bifaOf } from '../liuren/bifa.js';
import { sihuaOf } from '../ziwei/sihua.js';

/** 全套排盘的 7 类分组（结果页分组标题） */
export const GROUPS = ['万年历黄历', '八字命理', '紫微斗数', '六爻占卜', '奇门遁甲', '梅花易数', '风水堪舆'];

/** 22 项功能注册（键 = 短名，与功能介绍页逐字同源） */
export const FEATURES = [
  { 短名: '排八字', 触发词: ['排八字', '八字', '排盘', '生辰八字'], 处理器: 'bazi', needsBirth: true },
  { 短名: '排紫微', 触发词: ['排紫微', '紫微斗数', '紫微'], 处理器: 'ziwei', needsBirth: true },
  { 短名: '排奇门', 触发词: ['排奇门', '奇门遁甲', '时家奇门'], 处理器: 'qimen' },
  { 短名: '排六爻', 触发词: ['排六爻', '六爻'], 处理器: 'liuyao' },
  { 短名: '排梅花', 触发词: ['排梅花', '梅花易数', '梅花'], 处理器: 'meihua' },
  { 短名: '排飞星', 触发词: ['排飞星', '玄空飞星', '飞星'], 处理器: 'feixing', needsBirth: true },
  { 短名: '查命卦', 触发词: ['查命卦', '命卦', '八宅'], 处理器: 'bazhai', needsBirth: true },
  { 短名: '排运程', 触发词: ['排运程', '大运', '运程'], 处理器: 'dayun', needsBirth: true },
  { 短名: '解格局', 触发词: ['解格局', '格局'], 处理器: 'bazi-pattern', needsBirth: true },
  { 短名: '查神煞', 触发词: ['查神煞', '神煞'], 处理器: 'bazi-shensha', needsBirth: true },
  { 短名: '解四化', 触发词: ['解四化', '四化'], 处理器: 'sihua', needsBirth: true },
  { 短名: '排日家', 触发词: ['排日家', '日家奇门'], 处理器: 'qimen-ri' },
  { 短名: '排刻家', 触发词: ['排刻家', '刻家奇门'], 处理器: 'qimen-ke' },
  { 短名: '排宝鉴日奇', 触发词: ['排宝鉴日奇', '宝鉴日奇'], 处理器: 'qimen-baojian' },
  { 短名: '排年家月家', 触发词: ['排年家月家', '年家奇门', '月家奇门'], 处理器: 'qimen-nianyue' },
  { 短名: '排飞盘', 触发词: ['排飞盘', '飞盘奇门'], 处理器: 'qimen-fei' },
  { 短名: '解奇门格局', 触发词: ['解奇门格局', '奇门格局'], 处理器: 'qimen-ge' },
  { 短名: '排六壬', 触发词: ['排六壬', '大六壬', '六壬'], 处理器: 'liuren' },
  { 短名: '解毕法', 触发词: ['解毕法', '毕法赋'], 处理器: 'liuren-bifa' },
  { 短名: '解六爻旺衰', 触发词: ['解六爻旺衰', '旺衰'], 处理器: 'liuyao-wangshuai' },
  { 短名: '查黄历', 触发词: ['查黄历', '黄历', '今日宜忌', '今日黄历'], 处理器: 'huangli' },
  { 短名: '查农历', 触发词: ['查农历', '农历', '万年历'], 处理器: 'lunar' },
];

/** 触发词索引（最长优先） */
export function matchFeature(q) {
  const hits = [];
  for (const f of FEATURES) {
    for (const t of f.触发词) {
      if (q.includes(t)) hits.push({ f, t });
    }
  }
  if (!hits.length) return [];
  hits.sort((a, b) => b.t.length - a.t.length);
  const maxLen = hits[0].t.length;
  return hits.filter((h) => h.t.length === maxLen).map((h) => h.f); // 多命中并列
}

/** 今日（查询型功能的默认日期） */
function today() {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours() };
}

/** 分发执行：feature → blocks（统一 {title, lead, blocks} 结构） */
export async function runFeature(f, birth) {
  const { y, m, d, h } = birth || {};
  switch (f.处理器) {
    case 'bazi': return { title: '八字命理', lead: '', blocks: [{ 类名: '八字命理', 短名: '四柱', 数据: baziChart({ y, m, d, h }) }] };
    case 'ziwei': return { title: '紫微斗数', lead: '', blocks: [{ 类名: '紫微斗数', 短名: '命盘', 数据: ziweiChart({ y, m, d, h }) }] };
    case 'qimen': return { title: '奇门遁甲', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '时家排盘', 数据: qimenChart({ y, m, d, h }) }] };
    case 'qimen-ri': return { title: '日家奇门', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '日家排盘', 数据: qimenRiChart({ y, m, d }) }] };
    case 'liuren': return { title: '大六壬', lead: '', blocks: [{ 类名: '大六壬', 短名: '时家排盘', 数据: liurenChart({ y, m, d, h }) }] };
    case 'liuyao': return { title: '六爻占卜', lead: '', blocks: [{ 类名: '六爻占卜', 短名: '铜钱卦', 数据: liuyaoChart({ y, m, d, h }) }] };
    case 'meihua': return { title: '梅花易数', lead: '', blocks: [{ 类名: '梅花易数', 短名: '起卦', 数据: meihuaChart({ y, m, d, h }) }] };
    case 'bazhai': return { title: '八宅风水', lead: '', blocks: [{ 类名: '风水堪舆', 短名: '命卦八宅', 数据: bazhaiChart(y, (birth && birth.gender) || '男') }] };
    case 'feixing': return { title: '玄空飞星', lead: '', blocks: [{ 类名: '风水堪舆', 短名: '紫白飞星', 数据: feixingChart({ y, m, d, h }) }] };
    case 'bazi-pattern': return { title: '八字格局', lead: '', blocks: [{ 类名: '八字命理', 短名: '格局判定', 数据: patternOf({ y, m, d, h }) }] };
    case 'bazi-shensha': return { title: '八字神煞', lead: '', blocks: [{ 类名: '八字命理', 短名: '神煞', 数据: shenshaOf({ y, m, d, h }) }] };
    case 'dayun': return { title: '大运流年', lead: '', blocks: [{ 类名: '八字命理', 短名: '大运', 数据: dayunOf({ y, m, d, h, gender: (birth && birth.gender) || '男' }) }] };
    case 'sihua': return { title: '紫微四化', lead: '', blocks: [{ 类名: '紫微斗数', 短名: '四化', 数据: sihuaOf({ y, m, d, h }) }] };
    case 'qimen-ke': return { title: '刻家奇门', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '刻家', 数据: qimenKeChart({ y, m, d, h }) }] };
    case 'qimen-baojian': return { title: '宝鉴日奇', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '宝鉴日奇', 数据: qimenBaojianChart({ y, m, d }) }] };
    case 'qimen-nianyue': return { title: '年家月家奇门', lead: '', blocks: [
      { 类名: '奇门遁甲', 短名: '年家', 数据: qimenNianChart({ y, m, d }) },
      { 类名: '奇门遁甲', 短名: '月家', 数据: qimenYueChart({ y, m, d }) },
    ] };
    case 'qimen-fei': return { title: '飞盘奇门', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '飞盘', 数据: qimenFeiChart({ y, m, d, h }) }] };
    case 'qimen-ge': return { title: '奇门格局', lead: '', blocks: [{ 类名: '奇门遁甲', 短名: '格局判读', 数据: qimenGeOf({ y, m, d, h }) }] };
    case 'liuren-bifa': return { title: '六壬毕法', lead: '', blocks: [{ 类名: '大六壬', 短名: '毕法判读', 数据: bifaOf({ y, m, d, h }) }] };
    case 'liuyao-wangshuai': return { title: '六爻旺衰', lead: '', blocks: [{ 类名: '六爻占卜', 短名: '旺衰', 数据: wangshuaiOf({ y, m, d, h }) }] };
    case 'huangli': {
      const t = birth || today();
      return { title: '黄历', lead: '', blocks: [{ 类名: '万年历黄历', 短名: '每日黄历', 数据: daily(t.y, t.m, t.d, t.h) }] };
    }
    case 'lunar': {
      const t = birth || today();
      return { title: '农历', lead: '', blocks: [{ 类名: '万年历黄历', 短名: '农历', 数据: solarToLunar(t.y, t.m, t.d) }] };
    }
    default: return { title: f.短名, lead: '该功能的细分演算在后续版本逐步开放。', blocks: [] };
  }
}
