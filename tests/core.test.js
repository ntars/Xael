/**
 * tests/core.test.js —— 术数内核事实断言（全部来自公开万年历/古籍定例，可外部核对）
 *
 * 大白话：这些断言是「盘面能不能对外负责」的底线：
 * 每一条都有一个可在公开万年历或古籍上对得上的参照点。
 * 口径分歧处只断言「本项目的自定口径」，并在注释里点名流派。
 */

import { dayGanZhi, monthGanZhi, yearGanZhiByLichun, hourGanZhi } from '../src/core/calendar/ganzhi.js';
import { solarToLunar, lunarToSolar } from '../src/core/calendar/lunar2.js';
import { chart as baziChart } from '../src/core/bazi/bazi.js';
import { ziweiChart } from '../src/core/ziwei/ziwei.js';
import { qimenChart } from '../src/core/qimen/qimen.js';
import { qimenRiChart } from '../src/core/qimen/qimen-ri.js';
import { liurenChart } from '../src/core/liuren/liuren.js';
import { liuyaoChart } from '../src/core/liuyao/liuyao.js';
import { meihuaChart } from '../src/core/meihua/meihua.js';
import { bazhaiChart } from '../src/core/fengshui/bazhai.js';
import { feixingChart } from '../src/core/fengshui/feixing.js';
import { daily } from '../src/core/huangli/daily.js';

let passed = 0;
let failed = 0;
function eq(actual, expect, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expect);
  if (a === b) { passed++; return; }
  failed++;
  console.error(`✗ ${label}\n   实际 ${a}\n   期望 ${b}`);
}

// ---- 历法 ----
eq(dayGanZhi(1949, 10, 1), '甲子', '1949-10-01 日柱甲子');
eq(dayGanZhi(2000, 1, 1), '戊午', '2000-01-01 日柱戊午');
eq(yearGanZhiByLichun(2024, 2, 3), '癸卯', '2024-02-03 立春前仍癸卯年');
eq(yearGanZhiByLichun(2024, 2, 5), '甲辰', '2024-02-05 立春后甲辰年');
eq(monthGanZhi(2024, 2, 10), '丙寅', '2024-02-10 月柱丙寅（甲年寅月）');
eq(hourGanZhi('己', 11), '庚午', '己日午时＝庚午（五鼠遁）');
eq(solarToLunar(2024, 2, 10).m, 1, '2024-02-10 农历正月');
eq(solarToLunar(2024, 2, 10).d, 1, '2024-02-10 正月初一');
eq(solarToLunar(1985, 3, 2).isLeap, false, '1985 无闰月（1985-03-02 属二月）');
eq(solarToLunar(2004, 3, 21).isLeap, true, '2004 闰二月初一＝2004-03-21');
eq(lunarToSolar(2023, 2, 1, false).m, 2, '2023 二月初一＝2023-02-20');

// ---- 八字 ----
const bz = baziChart({ y: 1990, m: 6, d: 15, h: 10 });
eq([bz.pillars.年.干支, bz.pillars.月.干支, bz.pillars.日.干支, bz.pillars.时.干支],
  ['庚午', '壬午', '辛亥', '癸巳'], '1990-06-15 10时 四柱庚午壬午辛亥癸巳');
eq(bz.日主.干, '辛', '1990-06-15 日主辛金');
eq(bz.shengxiao, '马', '1990 生肖马');

// ---- 紫微（本项目口径：农历正月初一换年、闰月 >15 归次月） ----
const zw = ziweiChart({ y: 1990, m: 6, d: 15, h: 10 });
eq(typeof zw['五行局'], 'string', '紫微输出五行局');
eq(zw['cells'].length, 12, '紫微输出十二宫');
eq(zw['命宫']['位'], '丑', '1990-06-15 10时 命宫在丑');
eq(zw['五行局'], '火六局', '1990-06-15 10时 火六局');

// ---- 奇门（时家转盘拆补，2024-12-21 冬至） ----
const qm = qimenChart({ y: 2024, m: 12, d: 21, h: 12 });
eq(qm['遁'], '阳遁', '冬至后为阳遁');
eq(qm['局'], '下元4局', '2024-12-21 午时 下元4局');

// ---- 日家奇门 ----
const qr = qimenRiChart({ y: 2024, m: 12, d: 21 });
eq(qr['遁'], '阳遁', '日家 冬至后阳遁');

// ---- 六壬 ----
const lr = liurenChart({ y: 2025, m: 4, d: 25, h: 3 });
eq(Array.isArray(lr['三传']), true, '六壬输出三传');
eq(lr['三传'].length, 3, '三传三课');

// ---- 六爻（乾为天初爻动 → 天风姤） ----
const ly = liuyaoChart({ y: 2024, m: 2, d: 10, coins: [3, 1, 1, 1, 1, 1] });
eq(ly['本卦']['卦名'], '乾为天', '六爻本卦乾为天');
eq(ly['变卦']['卦名'], '天风姤', '初爻动变天风姤');

// ---- 梅花 ----
const mh = meihuaChart({ y: 2024, m: 2, d: 10, h: 12 });
eq(mh['本卦']['名'], '夬', '梅花 2024-02-10 12时 本卦泽天夬（名=夬，象名=泽天）');
eq(mh['本卦']['象名'], '泽天', '梅花 2024-02-10 12时 本卦象名泽天');

// ---- 八宅 ----
eq(bazhaiChart(1985, '男')['命卦'], '乾', '1985 男命卦乾');
eq(bazhaiChart(1985, '女')['命卦'], '离', '1985 女命卦离');

// ---- 飞星 ----
const fx = feixingChart({ y: 2024, m: 2, d: 10, h: 12 });
eq(fx['年紫白']['入中'], '三碧', '2024 年紫白入中三碧');
eq(fx['三元九运']['运'], 9, '2024 属九运');

// ---- 黄历 ----
const hl = daily(2024, 2, 10, 12);
eq(hl['值星']['名'], '满', '2024-02-10 值星满');
eq(hl['冲煞']['冲生肖'], '狗', '2024-02-10 甲辰日冲庚戌（辰戌冲，戌为狗）');

// ---- 22 项功能全链路（每条至少产出 1 块结果） ----
import { analyze } from '../src/core/features/analyzer.js';
const QUERIES = [
  '排八字 1990年6月15日 10点', '排紫微 1990年6月15日 10点', '排奇门 2024年12月21日 12点',
  '排六爻 2024年2月10日', '排梅花 2024年2月10日', '排飞星 2026年10月27日',
  '查命卦 1990年6月15日', '排运程 1990年6月15日 10点', '解格局 1990年6月15日 10点',
  '查神煞 1990年6月15日 10点', '解四化 1990年6月15日 10点', '排日家 2024年12月21日',
  '排刻家 2024年12月21日 12点', '排宝鉴日奇 2024年12月21日', '排年家月家 2026年10月27日',
  '排飞盘 2024年12月21日 12点', '解奇门格局 2024年12月21日 12点', '排六壬 2025年4月25日 3点',
  '解毕法 2025年4月25日 3点', '解六爻旺衰 2024年2月10日', '查黄历 2024年2月10日', '查农历 2024年2月10日',
];
let fnOk = 0;
for (const q of QUERIES) {
  try {
    const r = await analyze(q);
    if (r.type === 'results' && r.results.length && String(r.results[0].text || '').length > 20) fnOk++;
    else failed++, console.error(`✗ 功能链路 ${q}：${r.type} ${r.code || ''}`);
  } catch (e) {
    failed++;
    console.error(`✗ 功能链路 ${q}：${e.message}`);
  }
}
eq(fnOk, QUERIES.length, `22 项功能全链路可执行（${fnOk}/${QUERIES.length}）`);

// 四拒绝码
const noBirth = await analyze('排八字');
eq(noBirth.code, 'birth', '缺生辰 → birth 拒绝码');
const nonMeta = await analyze('今天天气怎么样');
eq(nonMeta.code, 'nonmeta', '非术数问句 → nonmeta 拒绝码');
// 主题指令就地切换、不进推演
const th = await analyze('深色模式');
eq(th.type, 'theme', '「深色模式」→ 主题指令');
// 多命中并列：一句话里两项功能都不缺料
const multi = await analyze('排八字 排紫微 1990年6月15日 10点');
eq(multi.type === 'results' ? multi.results.length : 0, 2, '多命中并列（排八字 + 排紫微）');

export { passed, failed };
if (process.argv[1] && process.argv[1].endsWith('core.test.js')) {
  console.log(`通过 ${passed} 项断言，失败 ${failed} 项`);
  process.exit(failed ? 1 : 0);
}
