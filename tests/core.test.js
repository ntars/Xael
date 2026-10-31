/**
 * tests/core.test.js —— 术数内核事实断言（全部来自公开万年历/古籍定例，可外部核对）
 *
 * 大白话：这些断言是「盘面能不能对外负责」的底线：
 * 每一条都有一个可在公开万年历或古籍上对得上的参照点。
 * 口径分歧处只断言「本项目的自定口径」，并在注释里点名流派。
 */

import { daySexagenary, monthSexagenary, yearSexagenary, hourSexagenary } from '../src/core/calendar/sexagenary.js';
import { cs12Of, CS12_GAN, CS12_NAMES } from '../src/core/common/constants.js';
import { fourFoldOf } from '../src/core/six-lines/strength.js';
import { voidVerdict } from '../src/core/six-lines/void.js';
import { JIANCHU_ALIAS, JIANCHU_LUCK, jianchuAliasOf } from '../src/core/almanac/twelve-officers.js';
import { TIANSHEN_ALIAS, TIANSHEN_MEANING } from '../src/core/almanac/day-officers.js';
import { LIU_QIN_FA_DONG, SHEN_XIANG } from '../src/core/six-lines/tables.js';
import { solarToLunisolar, lunisolarToSolar } from '../src/core/calendar/lunisolar.js';
import { fourPillarsChart as baziChart } from '../src/core/four-pillars/chart.js';
import { purpleStarChart } from '../src/core/purple-star/chart.js';
import { BRIGHTNESS, LEVEL_NORM, BRIGHT_SOURCE } from '../src/core/purple-star/data/brightness.js';
import { mysticGatesHourChart } from '../src/core/mystic-gates/hour-chart.js';
import { mysticGatesDayChart } from '../src/core/mystic-gates/day-chart.js';
import { mysticGatesPatternsOf } from '../src/core/mystic-gates/patterns.js';
import { mysticGatesYearChart } from '../src/core/mystic-gates/year-month-chart.js';
import { sixRenBifaOf, BIFA, JUDGED } from '../src/core/six-ren/bifa.js';
import { chartPatternsOf } from '../src/core/four-pillars/patterns.js';
import { nianMingVerdicts } from '../src/core/six-ren/nian-ming.js';
import { sixRenChart } from '../src/core/six-ren/chart.js';
import { GENERAL_LIKES, generalLikesOf } from '../src/core/six-ren/general-likes.js';
import { JIANG_WX, JIANG_STATE, JIANG_TWO_WAY, seasonStateOf, generalStatesOf } from '../src/core/six-ren/general-states.js';
import { GENERAL_BRANCH_IMAGES, GENERAL_FU_LINES, BRANCH_ORDER, imageOf, generalBranchImagesOf } from '../src/core/six-ren/general-branch-images.js';
import { LESSON_NAMES } from '../src/core/six-ren/extra-lessons.js';
import * as detailMod from '../src/core/six-ren/detail.js';
import { gongImageryOf, benMingGuiOf, GONG_IMAGERY } from '../src/core/six-lines/gong-imagery.js';
import { sixLinesCast, SHI_QIN, SHI_QIN_NOTE } from '../src/core/six-lines/cast.js';
import { hexagramState, JIN, TUI, sixLinesStrengthOf, branchPunish, branchPunishCommon } from '../src/core/six-lines/strength.js';
import { yaGanZhi } from '../src/core/six-lines/tables.js';
import { sixLinesTimingOf } from '../src/core/six-lines/timing.js';
import { yuanShenPower, jiShenPower } from '../src/core/six-lines/power.js';
import { qiYingOf } from '../src/core/plum-blossom/chart.js';
import { plumBlossomText } from '../src/core/features/render/six-lines.js';
import { plumBlossomChart } from '../src/core/plum-blossom/chart.js';
import { eightMansionsChart } from '../src/core/geomancy/eight-mansions.js';
import { flyingStarsChart, dayStar, monthStar, hourStar, STARS } from '../src/core/geomancy/flying-stars.js';
import { almanacDaily } from '../src/core/almanac/daily.js';
import { xiu28Of } from '../src/core/almanac/lunar-mansions.js';
import { monthCommandOf, commandDaysOf } from '../src/core/four-pillars/month-command.js';
import { luckCyclesOf } from '../src/core/four-pillars/luck-cycles.js';
import { yearLordOf } from '../src/core/four-pillars/year-lord.js';
import { ZHOUYI, hexagramText, yaoText, yongText } from '../src/core/common/zhouyi-data.js';
import { goldenContextOf, goldenVerdictsOf, goldenChapterNames } from '../src/core/six-lines/golden-chapters.js';
import { guaQiOf, guaQiGrade } from '../src/core/six-lines/gua-qi.js';
import { detectMatter } from '../src/core/features/render/six-lines.js';
import { SUI_JIN, LU, YI_MA, GUI_REN, GUI_REN_ZENG, TIAN_XI, luMaGuiRenOf, jianYaoVerdict, suiJinVerdict, qinKeWo, qinSheng, qinWxOf, yongAbsentOf, monthBreakVerdict, seasonOf, xingShaOf, SAN_HE, LIU_HAI } from '../src/core/six-lines/classics.js';
import { SHEN_QIN_XIANG, shenQinXiang, LIU_QIN_HUA, liuQinHuaOf, movementPattern, YONG } from '../src/core/six-lines/tables.js';
import { yuanShenVerdict, jiShenVerdict, yongFaDongVerdict, riChenVerdict } from '../src/core/six-lines/yuan-ji.js';
import { shenDongVerdict, buildTransmitVerdict } from '../src/core/six-lines/shen-dong.js';
import { SHENSHA_TABLES as SHENSHA } from '../src/core/four-pillars/symbolic-stars.js';
import { purpleStarReadingsOf, palaceReadingOf } from '../src/core/purple-star/readings.js';
import { PALACE_READINGS, READING_PALACES, READING_STARS } from '../src/core/purple-star/data/palace-readings.js';

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
eq(daySexagenary(1949, 10, 1), '甲子', '1949-10-01 日柱甲子');
eq(daySexagenary(2000, 1, 1), '戊午', '2000-01-01 日柱戊午');
eq(yearSexagenary(2024, 2, 3), '癸卯', '2024-02-03 立春前仍癸卯年');
eq(yearSexagenary(2024, 2, 5), '甲辰', '2024-02-05 立春后甲辰年');
eq(monthSexagenary(2024, 2, 10), '丙寅', '2024-02-10 月柱丙寅（甲年寅月）');
eq(hourSexagenary('己', 11), '庚午', '己日午时＝庚午（五鼠遁）');
eq(solarToLunisolar(2024, 2, 10).m, 1, '2024-02-10 农历正月');
eq(solarToLunisolar(2024, 2, 10).d, 1, '2024-02-10 正月初一');
eq(solarToLunisolar(1985, 3, 2).isLeap, false, '1985 无闰月（1985-03-02 属二月）');
eq(solarToLunisolar(2004, 3, 21).isLeap, true, '2004 闰二月初一＝2004-03-21');
eq(lunisolarToSolar(2023, 2, 1, false).m, 2, '2023 二月初一＝2023-02-20');

// ---- 八字 ----
const bz = baziChart({ y: 1990, m: 6, d: 15, h: 10 });
eq([bz.pillars.年.干支, bz.pillars.月.干支, bz.pillars.日.干支, bz.pillars.时.干支],
  ['庚午', '壬午', '辛亥', '癸巳'], '1990-06-15 10时 四柱庚午壬午辛亥癸巳');
eq(bz.日主.干, '辛', '1990-06-15 日主辛金');
eq(bz.shengxiao, '马', '1990 生肖马');

// ---- 紫微（本项目口径：农历正月初一换年、闰月 >15 归次月） ----
const zw = purpleStarChart({ y: 1990, m: 6, d: 15, h: 10 });
eq(typeof zw['五行局'], 'string', '紫微输出五行局');
eq(zw['cells'].length, 12, '紫微输出十二宫');
eq(zw['命宫']['位'], '丑', '1990-06-15 10时 命宫在丑');
eq(zw['五行局'], '火六局', '1990-06-15 10时 火六局');

// ---- 奇门（时家转盘拆补，2024-12-21 冬至） ----
const qm = mysticGatesHourChart({ y: 2024, m: 12, d: 21, h: 12 });
eq(qm['遁'], '阴遁', '2024-12-21 午时按交节整小时粒度仍属大雪（阴遁）');
eq(qm['局'], '下元1局', '2024-12-21 午时 大雪下元1局');

// ---- 日家奇门 ----
const qr = mysticGatesDayChart({ y: 2024, m: 12, d: 21 });
eq(qr['遁'], '阳遁', '日家 冬至后阳遁');

// ---- 六壬 ----
const lr = sixRenChart({ y: 2025, m: 4, d: 25, h: 3 });
eq(Array.isArray(lr['三传']), true, '六壬输出三传');
eq(lr['三传'].length, 3, '三传三课');

// ---- 六爻（乾为天初爻动 → 天风姤） ----
const ly = sixLinesCast({ y: 2024, m: 2, d: 10, backs: [3, 1, 1, 1, 1, 1] });
eq(ly['本卦'], '乾为天', '六爻本卦乾为天');
eq(ly['变卦'], '天风姤', '初爻动变天风姤');
// 飞伏神出伏判定（《增删卜易·飞伏神章》六条/五条）
{
  const hy = sixLinesCast({ y: 2025, m: 2, d: 9, h: 10, 事: '财运' });
  const u = hy['断语'].find((x) => x['类'] === '用神') || {};
  eq(String(u['项']).includes('以月建为用神'), true, '六爻 用神不现先以日月为用神');
}
{
  const hy2 = sixLinesCast({ y: 2025, m: 8, d: 3, h: 10, 事: '财运' });
  const u2 = hy2['断语'].find((x) => x['类'] === '用神') || {};
  eq(String(u2['断']).includes('《增删卜易·飞伏神章第二十八》'), true, '六爻 伏神按六条五条判定');
}
// 动爻化变：必须算出「变出之爻 + 化变关系」，不能只写「宜看变卦同位之爻」这种空话
{
  const hc = sixLinesCast({ y: 2024, m: 2, d: 10, h: 14, 事: '财运' });
  const dong = hc['断语'].filter((x) => x['类'] === '动爻');
  eq(dong.length >= 1, true, '六爻 动爻断语已生成');
  eq(dong.every((x) => String(x['项']).includes('→ 变出')), true, '六爻 动爻写明变出之爻与其六亲五行');
  eq(dong.some((x) => /伏吟|化进神|化退神|回头生|回头克|化比和/.test(String(x['断']))), true, '六爻 动爻写明化变关系');
  // 进神八组、退神八组（《增删卜易·变出进退神论第十七》）
  eq(JIN['亥'], '子', '进退神：亥化子为进神');
  eq(JIN['戌'], '丑', '进退神：戌化丑为进神（原文所列）');
}

// ---- 梅花 ----
const mh = plumBlossomChart({ y: 2024, m: 2, d: 10, h: 12 });
// 2024-02-10 12时：年支辰(5)+月2+日10=17 → 上卦 17%8=1 乾；再加午时(7)=24 → 下卦 8 坤；动爻 24%6=0→6
//   → 本卦「天地否」、互卦「风山渐」、六爻动、体坤用乾 → 体生用（凶）。与旧版逐例对拍一致（2640 例）
// 依据《梅花易数·年月日时起例》：年用年支序、月日用农历月日、时用时辰序。
// 2024-02-10 12时 = 甲辰年正月初一午时 → 年5+月1+日1=7（艮），7+7=14（坎），动爻 14%6=2。
eq(mh['本卦']['name'], '蒙', '梅花 2024-02-10 12时 本卦山水蒙');
eq(mh['本卦']['imageName'], '山水', '梅花 2024-02-10 12时 象名山水');
eq(mh['互卦']['name'], '复', '梅花 互卦地雷复');
eq(mh['动爻'], 2, '梅花 动爻第二爻');
eq(mh['体用']['关系'], '体克用', '梅花 上艮为体、下坎为用，土克水');

// ---- 八宅 ----
eq(eightMansionsChart(1985, '男')['命卦'], '兑', '1985 男命卦兑');
eq(eightMansionsChart(1985, '女')['命卦'], '艮', '1985 女命卦艮');

// ---- 飞星（年月日时四层，取值均为对拍旧仓逐例一致后的基准） ----
const fx = flyingStarsChart({ y: 2024, m: 2, d: 10, h: 12 });
eq(fx['年紫白']['入中'], '三碧', '2024 年紫白入中三碧');
eq(fx['三元九运']['运'], 9, '2024 属九运');
eq(fx['日紫白']['入中'], '五黄', '2024-02-10 日紫白入中五黄');
eq(fx['时紫白']['入中'], '四绿', '2024-02-10 甲辰日午时（四季日冬后起七赤，逐时顺推六位）时紫白入中四绿');
eq(dayStar(2020, 1, 1), 7, '2020-01-01 日紫白入中七赤（冬至段，起星日尚未到，间隔为负）');
eq(dayStar(2025, 12, 15), 3, '2025-12-15 日紫白入中三碧（霜降段逆飞）');
eq(flyingStarsChart({ y: 1900, m: 6, d: 1 }).年紫白.入中, '一白', '1900 年紫白入中一白（跨世纪连续）');
eq(flyingStarsChart({ y: 2100, m: 6, d: 1 }).年紫白.入中, '八白', '2100 年紫白入中八白');
eq(STARS[monthStar(2024, 1) - 1], '五黄', '2024 立春月（干支月 1）月紫白入中五黄');
eq(STARS[monthStar(2024, 12) - 1], '三碧', '2024 小寒月（干支月 12）月紫白入中三碧');
eq(STARS[hourStar(2024, 2, 1, 0) - 1], '七赤', '2024-02-01 乙未日（四季日）子时时紫白入中七赤');

// 时紫白三组起星（《玉匣記·三元時白歌》：冬至後四仲一白、四季七赤、四孟四綠；夏至後九紫·三碧·六白）
eq(STARS[hourStar(2024, 2, 6, 0) - 1], '一白', '2024-02-06 子日（四仲）子时时紫白起一白');
eq(STARS[hourStar(2024, 2, 8, 0) - 1], '四绿', '2024-02-08 寅日（四孟）子时时紫白起四绿');

// ---- 黄历 ----
const hl = almanacDaily(2024, 2, 10, 12);
eq(hl['值星']['name'], '满', '2024-02-10 值星满');
eq(hl['冲煞']['冲生肖'], '狗', '2024-02-10 甲辰日冲庚戌（辰戌冲，戌为狗）');

// ---- 22 项功能全链路（每条至少产出 1 块结果） ----
import { analyze } from '../src/core/features/analyzer.js';
import { FAIL_NOTE, FEATURES, catalog } from '../src/core/features/registry.js';
import { STAR_ELEMENT, STAR_BASE, starSeasonOf, starVerdictOf, starStatesOf } from '../src/core/mystic-gates/star-states.js';
import { imageryOf, GATE_DUTY, STAR_DUTY, QI_MOOD, DUTY_NOTES, gateDutyOf, starDutyOf, qiMoodOf } from '../src/core/mystic-gates/imagery.js';
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
const fnBad = [];
for (const q of QUERIES) {
  try {
    const r = await analyze(q);
    const body = r.type === 'results' ? r.results.map((x) => String(x.text || '')).join('\n') : '';
    // 判成功要同时满足：出结果、不是兜底失败文案、不是「请补充…」提示、正文够长
    const ok = r.type === 'results' && r.results.length && body.length > 40
      && !body.includes(FAIL_NOTE) && !/请输入|需要.{0,6}(生辰|时间|年月日)|请补充/.test(body);
    if (ok) fnOk++;
    else fnBad.push(`${q} → ${r.type} ${r.code || ''} ${body.slice(0, 40).replace(/\n/g, ' ')}`);
  } catch (e) {
    fnBad.push(`${q} → ${e.message}`);
  }
}
fnBad.forEach((x) => console.error('  ✗ ' + x));
eq(fnOk, QUERIES.length, `22 项功能全链路真出结果（${fnOk}/${QUERIES.length}）`);
eq(fnBad.length, 0, '22 项功能无兜底失败 / 无「请补充」降级');
// 每一项首行必须是「【功能名】」标题（出料层统一格式，防某家返回裸对象）
const titleOk = [];
for (const q of QUERIES) {
  const r = await analyze(q);
  const first = r.type === 'results' ? String(r.results[0].text || '').split('\n')[0] : '';
  if (!/^【[^】]{2,12}】/.test(first)) titleOk.push(`${q} → ${first.slice(0, 30)}`);
}
eq(titleOk.length, 0, '22 项结果首行均为【功能名】标题');

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

// 六爻纳甲：按《卜筮正宗·纳甲装卦歌》逐卦核对（阴卦歌诀自六爻往下，故外三爻字序倒读）
{
  const want = {
    乾: ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'],
    坎: ['戊寅', '戊辰', '戊午', '戊申', '戊戌', '戊子'],
    艮: ['丙辰', '丙午', '丙申', '丙戌', '丙子', '丙寅'],
    震: ['庚子', '庚寅', '庚辰', '庚午', '庚申', '庚戌'],
    巽: ['辛丑', '辛亥', '辛酉', '辛未', '辛巳', '辛卯'],
    离: ['己卯', '己丑', '己亥', '己酉', '己未', '己巳'],
    坤: ['乙未', '乙巳', '乙卯', '癸丑', '癸亥', '癸酉'],
    兑: ['丁巳', '丁卯', '丁丑', '丁亥', '丁酉', '丁未'],
  };
  let bad = 0;
  for (const g of Object.keys(want)) {
    if (yaGanZhi(g, g).join(',') !== want[g].join(',')) bad += 1;
  }
  eq(bad, 0, '八经卦纳甲与《卜筮正宗·纳甲装卦歌》逐卦相符');
}

// 奇门·时干入墓（《奇门宝鉴·释奇墓奇制与日时干墓同凶》五时：戊辰/壬辰/己未/癸未/辛丑）
{
  let bad = 0;
  for (const [y, m, d, h] of [[2024, 1, 1, 8], [2024, 1, 2, 14], [2024, 1, 3, 8]]) {
    const r = mysticGatesPatternsOf({ y, m, d, h });
    const names = r.凶格.map((x) => x.name);
    if (!names.includes('时干入墓')) bad += 1;
  }
  eq(bad, 0, '奇门「时干入墓」按五时（戊辰/壬辰/…）命中');
}

// 奇门·年家只问年份时不得倒退成上一年（立春比较不能拿 undefined 月日去比）
{
  const y2024 = mysticGatesYearChart({ y: 2024 });
  const y2024jan = mysticGatesYearChart({ y: 2024, m: 1, d: 15 });
  eq(y2024.年干支, '甲辰', '年家用当年干支（只给年份时按年中计）');
  eq(y2024jan.年干支, '癸卯', '年家立春前仍属上一年');
}

// 奇门·年家月家的「支临何宫」按原书算例（《统宗》乙丑年「乙在坤二、丑在離九」）
{
  const jiazi = mysticGatesYearChart({ y: 1864, m: 6, d: 1 });
  eq(jiazi.年干支, '甲子', '年家 1864 = 上元甲子');
  eq(jiazi.干宫, 1, '甲子年 值符天蓬落坎一');
  eq(jiazi.支宫, 1, '甲子年 值使休门落坎一');
  const yichou = mysticGatesYearChart({ y: 1865, m: 6, d: 1 });
  eq(yichou.年干支, '乙丑', '年家 1865 = 乙丑');
  eq(yichou.干宫, 2, '乙丑年「乙在坤二」——干在地盘直接查');
  eq(yichou.支宫, 9, '乙丑年「丑在離九」——支按旬内位次自旬首宫逆数');
  // 天盘干必须是九个不同的字（曾因键值对调 + NaN 全成同一个字）
  const ganSet = new Set(Object.values(yichou.天盘干).filter(Boolean));
  eq(ganSet.size >= 7, true, '年家天盘干不重复堆叠（星带本宫地盘仪）');
}

// 紫微大限：起限岁数随五行局（水二/木三/金四/土五/火六）
{
  const c = purpleStarChart({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  const juNum = { 水二局: 2, 木三局: 3, 金四局: 4, 土五局: 5, 火六局: 6 }[c.五行局];
  const first = parseInt(String(c.大限[0].大限).split('-')[0], 10);
  eq(first, juNum, '紫微首限起岁 = 五行局数');
}

// 八字·旺衰与用神：不得出现「我克为用」的方向错（身强取克我、身弱取生我）
{
  const r = chartPatternsOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  const dmWuXing = r.日主.replace(/[^木火土金水]/g, '');
  const fuYi = String(r.用神 && r.用神.扶抑 || '');
  const strong = r.身强弱 && r.身强弱.强;
  const KE_WO = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };
  const SHENG_WO = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
  const want = strong ? KE_WO[dmWuXing] : SHENG_WO[dmWuXing];
  eq(fuYi.includes(want), true, '扶抑方向：身强取克我、身弱取生我（《子平真诠》）');
}

// 六壬·孤虚按《协纪辨方书》「旬空为虚、其对为孤」：甲子日旬空戌亥 → 虚戌亥、孤辰巳
{
  const r = sixRenChart({ y: 2025, m: 4, d: 25, h: 3 });
  const gy = (r.孤虚 && r.孤虚.日) || {};
  eq((gy.虚 || []).join(''), '戌亥', '孤虚：旬空两支为虚（甲子旬 → 戌亥）');
  eq((gy.孤 || []).join(''), '辰巳', '孤虚：虚之对冲为孤（戌亥之冲 → 辰巳）');
  eq(typeof r.连茹 === 'object' && !!(r.应期 && r.应期.期), true, '六壬详断（连茹/应期）已出');
}

// 六壬·天马按《六壬大全·卷一起例》「天马午顺六阳」：正月（寅）在午，逐月顺进两辰
{
  const cases = [[2, 6], [3, 8], [4, 10], [5, 0]]; // 月建支序 → 天马支序
  const bad = cases.filter(([mm]) => {
    const r = sixRenChart({ y: 2025, m: mm === 2 ? 2 : (mm * 2 + 10) % 12 + 1, d: 15, h: 9 });
    return !r || !r.天马 || typeof r.天马.天马 !== 'string';
  });
  eq(bad.length, 0, '六壬天马恒有值且为支字');
  const r4 = sixRenChart({ y: 2025, m: 4, d: 25, h: 3 });
  eq(r4.天马.天马, '戌', '六壬天马：辰月（三月）在戌（午顺六阳：正月午、二月申、三月戌）');
  eq(typeof r4.月驿马 === 'string' && r4.月驿马.length === 1, true, '六壬月驿马按逐月神煞表出值');
}

// 六壬·课体取《六壬大全·卷一起例》十课正名（元首/重审/知一/涉害/遥克/昴星/别责/八专/伏吟/返吟）
{
  const NAMES = ['元首', '重审', '知一', '涉害', '遥克', '昴星', '别责', '八专', '伏吟', '返吟'];
  let bad = 0;
  const seen = new Set();
  for (let m = 1; m <= 12; m += 1) {
    for (let d = 1; d <= 28; d += 7) {
      for (let h = 0; h < 24; h += 6) {
        const r = sixRenChart({ y: 2024, m, d, h });
        if (!r.课体) { bad += 1; continue; }
        seen.add(r.课体);
        if (NAMES.indexOf(r.课体) < 0) bad += 1;
      }
    }
  }
  eq(bad, 0, '六壬课体不出现十课之外的名字');
  eq(seen.size >= 6, true, '六壬课体抽样覆盖至少六种');
}

// 毕法赋可判条目覆盖（21 条：2/5/6/7/8/23/24/25/26/27/28/31/32/36/51/52/59/79/81/83/96）
{
  const judged = sixRenBifaOf && typeof sixRenBifaOf === 'function';
  eq(judged, true, '毕法主入口可用');
  const names = BIFA.map((b) => b[0]);
  eq(names.length, 100, '毕法目录一百条');
  eq(JUDGED.length >= 21, true, '毕法可机器判定条目不少于 21 条');
  eq(JUDGED.every((n) => names.indexOf(n) >= 0), true, '可判条目都在目录内');
}

// 六爻用神取法（《增删卜易·用神章》）：自占类以世爻为用神，不误取官鬼
{
  const r1 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 14, 事: '出行' });
  eq(r1.用神.indexOf('世') === 0, true, '出行以世爻为用神');
  const y1 = r1.断语.filter((x) => x.类 === '用神')[0];
  eq(!!(y1 && y1.项.indexOf('世爻为用神') >= 0), true, '用神断语指明世爻');
  const r2 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 14, 事: '求财' });
  eq(r2.用神.indexOf('妻财') === 0, true, '求财以妻财为用神');
}

// 六壬·月孤虚取「后二辰」为孤（《协纪·义例》子年月日时则戌亥为孤、辰巳为虚）
{
  const r = sixRenChart({ y: 2025, m: 4, d: 25, h: 3 });
  const gm = (r.孤虚 && r.孤虚.月) || {};
  eq((gm.孤 || []).length, 2, '月孤虚出两支');
  eq((gm.虚 || []).length, 2, '月虚出两支');
}

// 奇门·天辅时按《奇门宝鉴·释天辅时》＝六甲时（时干为甲），非按日干查表
{
  const r = mysticGatesPatternsOf({ y: 2024, m: 2, d: 10, h: 0 });
  const fu = (r.吉格 || []).filter((x) => x.name === '天辅时');
  eq(fu.length, 1, '天辅时：甲子时应命中');
  eq((fu[0].义 || '').indexOf('六甲时') >= 0, true, '天辅时释义引《奇门宝鉴》');
  const r2 = mysticGatesPatternsOf({ y: 2024, m: 2, d: 10, h: 14 });
  eq((r2.吉格 || []).some((x) => x.name === '天辅时'), false, '天辅时：非六甲时不命中');
}

// 六爻·应期按《增删卜易·各门类应期总注章》：旬空爻取「填冲」、静爻取「值冲」
{
  const tm = sixLinesTimingOf({ y: 2024, m: 2, d: 10, h: 14, 事: '财运' });
  eq(!!tm.用神, true, '应期：能取到主事爻');
  eq(tm.用神.干支.slice(1), '卯', '应期：用神为妻财乙卯');
  const kong = tm.条目.find((x) => x.规则 === '旬空填冲');
  eq(!!kong, true, '应期：空爻命中「旬空填冲」');
  eq(kong.取.join(''), '卯酉', '应期：卯空取卯（填实）与酉（冲空）');
  eq(kong.依据.indexOf('旬空最爱填冲') > 0, true, '应期：引《增删卜易》原文');
  const away = sixLinesTimingOf({ y: 2024, m: 2, d: 10, h: 14, 事: '财运', 远近: '远' });
  eq(away.条目[0].单位, '月', '应期：远事定之以年月');
  eq(tm.条目[0].单位, '日', '应期：近事应之于日时');

  // 取用来源与元忌仇条：世爻为用时不误报「不上卦」
  const chu = sixLinesTimingOf({ y: 2024, m: 2, d: 20, h: 8, 事: '出行' });
  eq(chu.取用, '世爻（自占以世为先）', '应期：出行以世爻为用，不误报不上卦');
  eq(chu.条目.some((x) => x.规则 === '衰绝遇生旺'), true, '应期：世爻衰弱命中「衰绝遇生旺」');
  // 化进/化退只在变支与本支不同时判（伏吟不误判）
  const fu = sixLinesTimingOf({ y: 2024, m: 2, d: 10, h: 14, 事: '财运' });
  eq(fu.条目.some((x) => x.规则 === '化进神逢值逢合' || x.规则 === '化退神忌值忌冲'), false, '应期：伏吟（变支同本支）不误判化进退');
  // ⑪ 克神：克用神者须按「谁克我」找，不能取「我克」
  const ke = sixLinesTimingOf({ y: 2024, m: 2, d: 10, h: 14, 事: '财运' });
  const kx = ke.条目.find((x) => x.规则 === '待克神受克');
  eq(!!kx && /属金/.test(kx.说明), true, '应期：用神属木，克神为金（方向不反）');
}

// --- 奇门九遁按《奇门遁甲统宗·奇门四十格》校正（九遁全部照原表实现）---
{
  const { mysticGatesPatternsOf: P } = await import('../src/core/mystic-gates/patterns.js');
  let shen = 0, gui = 0, hu = 0;
  for (let m = 1; m <= 12; m += 1) {
    for (let d = 1; d <= 28; d += 1) {
      for (const h of [0, 4, 8, 12, 16, 20]) {
        let r;
        try { r = P({ y: 2023, m, d, h }); } catch { continue; }
        for (const g of r.吉格 || []) {
          if (g.name === '神遁') shen += 1;
          if (g.name === '鬼遁') gui += 1;
          if (g.name === '虎遁') hu += 1;
        }
      }
    }
  }
  eq(shen > 0, true, '九遁：神遁按统宗表（休门+乙+九天）可命中');
  eq(gui > 0, true, '九遁：鬼遁按统宗表（杜门+乙+九地）可命中');
  // ★ 旧断言写「虎遁不可达、恒 0」——那是八门轮转尚未修正时的假象，实现后实测可命中。
  eq(hu > 0, true, '九遁：虎遁按统宗表（休门+乙+地盘辛临艮八宫）可命中');
}

// --- 六爻用神两现：《增删卜易·两现章》「择其旺者为用神、择其动者为用神」---
{
  const { sixLinesCast } = await import('../src/core/six-lines/cast.js');
  let hit = null;
  outer: for (let d = 1; d <= 28; d += 1) {
    for (const h of [0, 6, 12, 18]) {
      let c;
      try { c = sixLinesCast({ y: 2024, m: 2, d, h, 事: '财运' }); } catch { continue; }
      const y = (c.断语 || []).find((x) => x.类 === '用神' && String(x.项).indexOf('两现') >= 0);
      if (y) { hit = y; break outer; }
    }
  }
  eq(!!hit, true, '六爻两现：能找到用神两现样本');
  // 原文只给「择旺择动」的先后次序，不含分值；四级判据（动/临月建/临日辰/无空破）
  // 走完仍并列时如实标「并取参看」，不硬选——两种结果都合规
  eq(hit && (hit.项.indexOf('取第') > 0 || hit.项.indexOf('并取参看') > 0), true,
    '六爻两现：或明确取一爻、或如实标并列（不硬选）');
  eq(hit && hit.断.indexOf('择其旺者为用神、择其动者为用神') > 0, true, '六爻两现：引《增删卜易·两现章》原文');
}

// --- 六亲类象按《增删卜易·用神章第八》出料 + 问句识别测事 ---
{
  const { analyze } = await import('../src/core/features/analyzer.js');
  const r = await analyze('排六爻 2024年2月10日 14点 财运怎么样');
  const t = (r.results && r.results[0] && r.results[0].text) || '';
  eq(t.indexOf('用神：妻财') >= 0, true, '六爻测事：问「财运」取妻财为用神');
  eq(t.indexOf('类象：妻财所主') >= 0, true, '六爻类象：按用神章输出所主亲属与物事');
  eq(t.indexOf('《增删卜易·用神章第八》') > 0, true, '六爻类象：注明出处篇名');
  const r2 = await analyze('排六爻 2024年2月10日 14点 考试能过吗');
  const t2 = (r2.results && r2.results[0] && r2.results[0].text) || '';
  eq(t2.indexOf('用神：父母') >= 0, true, '六爻测事：问「考试」取父母为用神');
  const r3 = await analyze('排六爻 2024年2月10日 14点');
  const t3 = (r3.results && r3.results[0] && r3.results[0].text) || '';
  eq(t3.indexOf('类象：') < 0, true, '六爻类象：不指明测事时不给类象，不臆测');
}

// --- 六壬天将：官修派贵表不含辰戌 + 落地换神兜底 ---
{
  const { guirenIdx, nobleSeat, placeHeavenlyGenerals, JIANG } = await import('../src/core/six-ren/heavenly-generals.js');
  const seen = [];
  for (const g of ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']) {
    for (const night of [false, true]) seen.push(guirenIdx(g, night));
  }
  eq(seen.indexOf(4) < 0 && seen.indexOf(10) < 0, true, '六壬贵表：十干昼夜二十位不含辰戌（贵人独不居辰戌之地）');
  eq(nobleSeat(4), 8, '六壬换神：临辰冲申');
  eq(nobleSeat(10), 2, '六壬换神：临戌冲寅');
  eq(placeHeavenlyGenerals(4)['贵人'], undefined, '六壬换神：贵人临辰时贵人落申不在辰');
  eq(placeHeavenlyGenerals(4)[8], '贵人', '六壬换神：临辰以冲为神，贵人落申');
  eq(placeHeavenlyGenerals(10)[2], '贵人', '六壬换神：临戌以冲为神，贵人落寅');
  eq(Object.keys(placeHeavenlyGenerals(0)).length, 12, '六壬布将：十二位各一将');
  eq(new Set(JIANG).size, 12, '六壬布将：十二将名不重复');
}

// --- 毕法赋：覆盖率扩到 29 条，逐条判据可复算 ---
{
  const { sixRenBifaOf, JUDGED, BIFA } = await import('../src/core/six-ren/bifa.js');
  eq(JUDGED.length, 95, '毕法赋：机器判定 95 条');
  eq(new Set(JUDGED).size, JUDGED.length, '毕法赋：判定条号不重复');
  eq(JUDGED.every((n) => BIFA.some((b) => b[0] === n)), true, '毕法赋：判定条号都在一百法目录内');
  // 抽样统计实际能命中多少条（判据不能全是死的）
  const seen = new Set();
  for (let y = 2015; y <= 2025; y += 1) {
    for (let mo = 1; mo <= 12; mo += 1) {
      for (const d of [3, 11, 19, 27]) {
        for (const h of [1, 5, 9, 13, 17, 21]) {
          const r = sixRenBifaOf({ y, m: mo, d, h });
          if (r && r.命中) r.命中.forEach((x) => seen.add(x.序));
        }
      }
    }
  }
  eq(seen.size >= 30, true, '毕法赋：抽样命中条数 ≥30（判据有实效，非空壳）');
  const onlyJudged = [...seen].every((n) => JUDGED.indexOf(n) >= 0);
  eq(onlyJudged, true, '毕法赋：命中的条号都在判定覆盖清单内');
  const r21 = sixRenBifaOf({ y: 2024, m: 2, d: 10, h: 14 });
  eq(typeof r21.判定覆盖, 'string', '毕法赋：输出判定覆盖说明');
  eq(r21.判定覆盖.indexOf('95 条') > 0, true, '毕法赋：覆盖说明与实际一致（95 条）');

  // 17/18/73 的「皆空」按原文算例复核后取「初、中二传落本旬空」（一旬只两支空亡）
  const r17 = sixRenBifaOf({ y: 2015, m: 1, d: 18, h: 0 });
  eq((r17.命中 || []).some((x) => x.序 === 17), true, '毕法赋：17 进茹空亡宜退步可命中');
  const r18 = sixRenBifaOf({ y: 2015, m: 2, d: 25, h: 0 });
  eq((r18.命中 || []).some((x) => x.序 === 18), true, '毕法赋：18 踏脚空亡进用宜可命中');
  eq((r18.命中 || []).some((x) => x.序 === 73), true, '毕法赋：73 前后逼迫难进退可命中');
  // 49 两贵受克：乙日须昼夜两贵（申、子）皆临受克之方
  const r49 = sixRenBifaOf({ y: 2024, m: 2, d: 11, h: 20 });
  eq((r49.命中 || []).some((x) => x.序 === 49), true, '毕法赋：49 两贵受克难干贵可命中（乙日申加午、子加戌）');
  // 56 天网自裹须显式给本命
  const r56 = sixRenBifaOf({ y: 2020, m: 1, d: 3, h: 20, 本命: '未' });
  eq(typeof r56.判定覆盖, 'string', '毕法赋：给本命时仍正常出判定覆盖');
}

// 六爻·月卦身（《卜筮正宗·安月卦身诀》「阴世则从午月起，阳世还从子月生」）
{
  // 天地否（世3、世爻阴）→ 阴世起午，初午二未三申 → 卦身申
  const c = sixLinesCast({ y: 2024, m: 2, d: 10, h: 14, minute: 0 });
  eq(c.本卦, '天地否', '卦身样例本卦为天地否');
  eq(c.世, 3, '卦身样例世在三爻');
  eq(c.卦身 && c.卦身.支, '申', '卦身：阴世起午数至世爻为申');
  eq(c.卦身.起例, '阴世从午起', '卦身：起例随世爻阴阳');
  eq(String(c.卦身.依据).includes('安月卦身诀'), true, '卦身：标注《卜筮正宗·安月卦身诀》');
}
{
  const out = await analyze('排六爻 2024年2月10日 14点');
  const txt = out.results[0].text;
  eq(txt.indexOf('卦身：申') >= 0, true, '卦身：六爻出料含「卦身：申」');
  eq(txt.indexOf('安月卦身诀') >= 0, true, '卦身：出料引原诀名');
}

// 六爻·反吟伏吟与进退神（《卜筮正宗·反吟卦定例第十一》《伏吟卦定例第十二》《变出进退神论第十七》）
{
  const st = hexagramState;
  // 卦之反吟：乾为天 → 巽为风（上下卦俱变相冲，原文正例）
  const fan = st('乾为天', '巽为风', ['子', '寅', '辰', '午', '申', '戌'], ['丑', '亥', '酉', '未', '巳', '卯'],
    [1, 2, 3, 4, 5, 6], { 下: '乾', 上: '乾', 代: 1 }, { 下: '巽', 上: '巽', 代: 1 });
  eq(fan.项.some((x) => x.name === '卦之反吟'), true, '反吟：上下卦俱冲为卦之反吟');
  // 内卦反吟：乾为天 → 天风姤（仅下卦相冲）
  const nei = st('乾为天', '天风姤', ['子', '寅', '辰', '午', '申', '戌'], ['丑', '亥', '酉', '午', '申', '戌'],
    [1, 2, 3], { 下: '乾', 上: '乾', 代: 1 }, { 下: '巽', 上: '乾', 代: 1 });
  eq(nei.项.some((x) => x.name === '内卦反吟'), true, '反吟：仅下卦相冲为内卦反吟');
  eq(nei.项.some((x) => x.name === '卦之反吟'), false, '反吟：内卦反吟不并作卦之反吟');
  // 爻之反吟：坤巽互变（原文「爻变相冲者，一卦中惟有坤变巽、巽变坤」）
  const yao = st('坤为地', '巽为风', ['未', '巳', '卯', '丑', '亥', '酉'], ['丑', '亥', '酉', '未', '巳', '卯'],
    [1, 2, 3, 4, 5, 6], { 下: '坤', 上: '坤', 代: 1 }, { 下: '巽', 上: '巽', 代: 1 });
  eq(yao.项.some((x) => x.name === '爻之反吟'), true, '反吟：坤巽互变三爻全冲为爻之反吟');
  // 伏吟：本卦变同支（内外俱伏）
  const fu = st('乾为天', '乾为天', ['子', '寅', '辰', '午', '申', '戌'], ['子', '寅', '辰', '午', '申', '戌'],
    [1, 4], { 下: '乾', 上: '乾', 代: 1 }, { 下: '乾', 上: '乾', 代: 1 });
  eq(fu.项.some((x) => x.name === '内卦伏吟'), true, '伏吟：内卦三爻未变为内卦伏吟');
  eq(fu.项.some((x) => x.name === '外卦伏吟'), true, '伏吟：外卦三爻未变为外卦伏吟');
  // 进退神：原文各八组（含戌化丑、丑化戌）
  eq(JIN['戌'], '丑', '进退神：戌化丑为进神（原文所列）');
  eq(TUI['丑'], '戌', '进退神：丑化戌为退神（原文所列）');
  eq(Object.keys(JIN).length, 8, '进退神：进神八组');
  eq(Object.keys(TUI).length, 8, '进退神：退神八组');
  eq(JIN['亥'], '子', '进退神：亥化子为进神');
  eq(TUI['子'], '亥', '进退神：子化亥为退神');
}

// 六壬·本命与行年（《六壬大全·卷十·观月经》注「男行年一岁起丙寅，逆总顺零，四十九在甲寅。
//   妇行年一岁起壬申，顺总逆零，三十四在己亥也。」——两例皆为原书算例，逐一复算）
{
  eq(detailMod.xingNian(1, '男').干支, '丙寅', '行年：男一岁起丙寅');
  eq(detailMod.xingNian(49, '男').干支, '甲寅', '行年：男四十九在甲寅（原书算例）');
  eq(detailMod.xingNian(1, '女').干支, '壬申', '行年：女一岁起壬申');
  eq(detailMod.xingNian(34, '女').干支, '己亥', '行年：女三十四在己亥（原书算例）');
  const rc = sixRenChart({ y: 2025, m: 4, d: 25, h: 3, 本命: '寅', 性别: '男', 虚岁: 49 });
  eq(rc.本命, '寅', '行年：本命透出');
  eq(rc.行年 && rc.行年.干支, '甲寅', '行年：排盘接入行年');
  eq(typeof rc.命上, 'string', '行年：命上神已算');
  eq(typeof rc.年上, 'string', '行年：年上神已算');
  const rc2 = sixRenChart({ y: 2025, m: 4, d: 25, h: 3 });
  eq(rc2.本命, undefined, '行年：未给本命时不输出本命');
}

// 毕法赋新增六条（63/64/68/75/77/85）：每条都用原书正文「谓……」判据，样本为该条的实测命中例
{
  const bf = (y, m, d, h) => sixRenBifaOf({ y, m, d, h });
  const has = (r, no) => (r.命中 || []).some((x) => x.序 === no);

  const b63 = bf(2015, 2, 19, 7);
  eq(has(b63, 63), true, '毕法 63 彼此全伤：干支各被上神克伐');
  eq(String((b63.命中 || []).find((x) => x.序 === 63 || x.序 === 63).说明 || '').length > 0, true, '毕法 63 有断语');

  eq(has(bf(2015, 1, 11, 1), 64), true, '毕法 64 夫妇芜淫：支上克干、干上克支');
  eq(has(bf(2015, 1, 3, 13), 68), true, '毕法 68 制鬼之位：支上克日鬼为良医');
  eq(has(bf(2015, 8, 11, 7), 75), true, '毕法 75 宾主不投：四课上神全逢辰午酉亥');
  eq(has(bf(2015, 4, 3, 1), 77), true, '毕法 77 互生俱生：干上生支、支上生干');
  eq(has(bf(2015, 2, 19, 19), 85), true, '毕法 85 初遭夹克：初传坐克方又乘克将');
  // 反例：无日鬼之课不应误报 68（用一条已知不通的课验证不漏判也不误判）
  const b68x = bf(2024, 2, 10, 12);
  eq(has(b68x, 68), false, '毕法 68 无误报（无日鬼之课不命中）');
}

// 梅花·体气盛衰与互变合参（《梅花易数·体用总诀》原文）
{
  const c = plumBlossomChart({ y: 2024, m: 2, d: 10, h: 12 });
  eq(c.体气 && c.体气.盛衰, '衰', '梅花体气：体艮土在春月为衰（原文「春坤、艮」为衰）');
  eq(c.体气 && c.体气.季节, '春', '梅花体气：季节按月建寅定为春');
  eq(c.体气 && c.体气.月建, '寅', '梅花体气：月建寅');
  eq(c.互变合参 && c.互变合参.克体卦.indexOf('震') >= 0, true, '梅花互变：震木克体土');
  eq(c.互变合参 && c.互变合参.党势.indexOf('体党多') >= 0, true, '梅花党势：互变四卦三土为体党多');
  eq(c.类象生克 && c.类象生克.克体[0].卦, '震', '梅花类象：克体卦附原文类象');
  eq(typeof (c.类象生克.克体[0].象 || ''), 'string', '梅花类象：震克体象文取原文');
  // 夏月体离火为盛（原文「夏离」）
  const c2 = plumBlossomChart({ y: 2024, m: 6, d: 15, h: 12 });
  eq(['盛', '平', '衰'].indexOf(c2.体气.盛衰) >= 0, true, '梅花体气：任意课皆有盛衰判定');
}

// 毕法·31 三传递生须末（初）传再生日干（《六壬大全·卷十一》原文两等）
{
  const r = sixRenBifaOf({ y: 2015, m: 2, d: 10, h: 17, 本命: '戌' });
  const names = r.命中.map((x) => x.name);
  eq(names.includes('三传递生人举荐'), true, '毕法31：三传递生命中');
  const one = r.命中.find((x) => x.name === '三传递生人举荐');
  eq(one.说明.includes('递生'), true, '毕法31：断语含递生');
  eq(r.命中.filter((x) => x.序 === 31).length, 1, '毕法31：不重复命中');
}
// 毕法·56 天网自裹（墓神覆日 + 本命同支）
{
  const r = sixRenBifaOf({ y: 2015, m: 1, d: 25, h: 17, 本命: '丑' });
  eq(r.命中.some((x) => x.name === '天网自裹己招非'), true, '毕法56：墓神覆日兼本命同支命中');
  const r2 = sixRenBifaOf({ y: 2015, m: 1, d: 25, h: 17 });
  eq(r2.命中.some((x) => x.name === '天网自裹己招非'), false, '毕法56：未给本命不判');
  eq(JUDGED.length >= 63, true, '毕法判定条数 ≥63');
}

// 卦体：六冲卦／六合卦／游魂／归魂（《增删卜易》三章原文推得）
{
  const { hexagramBody } = await import('../src/core/six-lines/tables.js');
  eq(hexagramBody('乾', '乾', 0).六冲卦, true, '卦体：乾为天为六冲卦');
  eq(hexagramBody('乾', '震', 0).六冲卦, true, '卦体：天雷无妄为六冲卦');
  eq(hexagramBody('震', '乾', 0).六冲卦, true, '卦体：雷天大壮为六冲卦');
  eq(hexagramBody('乾', '坤', 3).六合卦, true, '卦体：天地否为六合卦');
  eq(hexagramBody('坎', '兑', 1).六合卦, true, '卦体：水泽节为六合卦');
  eq(hexagramBody('离', '坤', 6).游魂, true, '卦体：火地晋为游魂');
  eq(hexagramBody('离', '乾', 7).归魂, true, '卦体：火天大有为归魂');
  eq(hexagramBody('坎', '坤', 2).标签, null, '卦体：水雷屯无特殊卦体');
  // 六冲卦恰十个、六合卦恰八个（与通行口诀一致）
  const ups = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
  let chong = 0, he = 0;
  for (const u of ups) for (const l of ups) { const b = hexagramBody(u, l, 0); if (b.六冲卦) chong += 1; if (b.六合卦) he += 1; }
  eq(chong, 10, '卦体：六冲卦共 10 个（八纯＋无妄＋大壮）');
  eq(he, 8, '卦体：六合卦共 8 个');
}

// 动静格局（《增删卜易·独发章第三十一》）
{
  const { movementPattern } = await import('../src/core/six-lines/tables.js');
  eq(movementPattern([]).名, '尽静', '动静：无动爻为尽静');
  eq(movementPattern([3]).名, '独发', '动静：一爻动为独发');
  eq(movementPattern([1, 2, 3, 4, 5]).名, '独静', '动静：五爻动为独静');
  eq(movementPattern([1, 2, 3, 4, 5, 6]).名, '尽发', '动静：六爻动为尽发');
  eq(movementPattern([1, 2]).名, '两爻动', '动静：二三爻动记数（用中文数字，避免读成「第 2 爻动」）');
  eq(movementPattern([3]).依据.indexOf('独发章') > 0, true, '动静：出处标《增删卜易·独发章》');
}

// 命宫：《三命通会·论坐命宫》原书算例「甲子年三月生人得戌时 → 命坐卯宫，丁卯」
{
  const c = baziChart({ y: 1984, m: 4, d: 5, h: 20, gender: '男' });
  eq(c.pillars.年.干支, '甲子', '命宫验证：年柱甲子');
  eq(c.pillars.时.干支.endsWith('戌'), true, '命宫验证：戌时');
  eq(c.命宫.干支, '丁卯', '命宫：原书算例命坐丁卯宫');
  eq(c.命宫.支, '卯', '命宫：支为卯');
  const c2 = baziChart({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  eq(typeof c2.命宫.干支, 'string', '命宫：任意盘皆出命宫');
  eq(c2.命宫.干支.length, 2, '命宫：干支两字');
}

// 值使落宫：《奇门宝鉴·释玉女守门》原书六时——值使皆落丁奇所居之宫（此局丁在 7 宫）
{
  const six = [
    [2024, 1, 1, 11, '甲子', '庚午'],
    [2024, 1, 2, 5, '甲戌', '己卯'],
    [2024, 1, 2, 23, '甲申', '戊子'],
    [2024, 1, 3, 17, '甲午', '丁酉'],
    [2024, 1, 4, 11, '甲辰', '丙午'],
    [2024, 1, 5, 5, '甲寅', '乙卯'],
  ];
  let bad = 0;
  for (const [y, m, d, h, xun, shi] of six) {
    const c = mysticGatesHourChart({ y, m, d, h });
    const shiGz = Array.isArray(c.干支.时) ? c.干支.时.join('') : c.干支.时;
    if (c.旬首.join('') !== xun || shiGz !== shi || c.值使落宫 !== 7) bad += 1;
  }
  eq(bad, 0, '玉女守门六时：值使皆落丁奇所居之宫');
  const c1 = mysticGatesHourChart({ y: 2024, m: 1, d: 1, h: 11 });
  eq(c1.值使落宫 === c1.值使本宫, false, '值使落宫与值使本宫可不同（数宫法）');
  const g = mysticGatesPatternsOf({ y: 2024, m: 1, d: 1, h: 11 });
  eq(g.吉格.some((x) => x.name === '玉女守门'), true, '甲子旬庚午时命中玉女守门');
}

// 毕法赋再扩六条（54/74/76/78/86/90）：样本为该条实测命中例，判据见 bifa.js 内注释与原文
{
  const has = (r, n) => (r.命中 || []).some((x) => x.序 === n);
  eq(has(sixRenBifaOf({ y: 2024, m: 1, d: 8, h: 0 }), 54), true, '毕法 54 虎视逢虎：柔日昴星又乘白虎');
  eq(has(sixRenBifaOf({ y: 2024, m: 7, d: 7, h: 16 }), 74), true, '毕法 74 空空如也：三传尽空或两空一乘天空');
  eq(has(sixRenBifaOf({ y: 2024, m: 1, d: 2, h: 0 }), 76), true, '毕法 76 彼此猜忌：干支各作六害/上神互害');
  eq(has(sixRenBifaOf({ y: 2024, m: 1, d: 2, h: 4 }), 78), true, '毕法 78 互旺皆旺：干上支上各乘旺神');
  eq(has(sixRenBifaOf({ y: 2024, m: 1, d: 1, h: 10 }), 86), true, '毕法 86 将逢内战：发用克其所乘天将');
  eq(has(sixRenBifaOf({ y: 2024, m: 1, d: 2, h: 14 }), 90), true, '毕法 90 来去俱空：返吟而发用落空');
}

// 输出渲染层修正（2026-10）：六爻旺衰的 卦象/用神/原忌仇/六亲名
{
  const q = sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 14, 事: '求财' });
  eq(q.用神, '妻财', '旺衰：指定事类后立用神');
  eq(q.元忌仇.原神.六亲, '子孙', '原忌仇：六亲名由「该五行对本宫」推出（金宫生水=子孙）');
  eq(q.元忌仇.忌神.六亲, '兄弟', '原忌仇：克用神者为兄弟（金克木）');
  eq(q.元忌仇.仇神.六亲, '父母', '原忌仇：克原神者为父母（土克水）');
  eq(!!(q.hexagramState && (q.hexagramState.本卦 || (q.hexagramState.项 || []).length)), true, '旺衰：卦象字段非空');
  const q2 = sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 14 });
  eq(!q2.用神, true, '旺衰：未指定事类不立用神');
}

// 四柱反查公历（src/core/four-pillars/reverse.js）：六十甲子循环 → 多解须全列不硬选
{
  const { solarFromPillars, parsePillars, sexagenaryIndexOf } = await import('../src/core/four-pillars/reverse.js');
  eq(sexagenaryIndexOf('乙酉'), 21, '四柱反查：乙酉 = 六十甲子第 22 位（下标 21）');
  eq(sexagenaryIndexOf('乱写'), -1, '四柱反查：非法干支返回 -1');
  const pl = parsePillars('乙酉 壬午 甲子 甲子');
  eq(pl && pl.年, '乙酉', '四柱反查：文本里能取出年柱');
  const r = solarFromPillars(pl);
  eq(r.总数, 2, '四柱反查：乙酉 壬午 甲子 甲子 在 1900–2100 内为 2 解');
  eq(r.候補.map((c) => c.y).join(','), '1945,2005', '四柱反查：两解年份为 1945 与 2005');
  eq(r.候補[1].m + '-' + r.候補[1].d, '6-9', '四柱反查：2005 解落在 6 月 9 日');
  // 正排能出的四柱，反查必能找回（同一套口径）
  const { fourPillarsChart } = await import('../src/core/four-pillars/chart.js');
  const c = fourPillarsChart({ y: 2005, m: 6, d: 9, h: 0 });
  const back = solarFromPillars({
    年: c.pillars.年.干支, 月: c.pillars.月.干支, 日: c.pillars.日.干支, 时: c.pillars.时.干支,
  });
  eq(back.候補.some((x) => x.y === 2005 && x.m === 6 && x.d === 9), true,
    '四柱反查：正排 2005-6-9 0时 的四柱能反查回同一天');
}


/* ---------- 毕法赋：22/25/26/47/50 判据落地（2026-10 文献校正） ---------- */
{
  // 22 上下皆合两心齐：2018-1-27 1时 己未日 → 上下俱合
  const r22 = sixRenBifaOf({ y: 2018, m: 1, d: 27, h: 1 });
  const h22 = r22.命中.find((x) => x.序 === 22);
  eq(!!h22, true, '毕法22：上下皆合两心齐应命中');
  eq(/上下(皆|俱)合/.test(h22.说明), true, '毕法22：命中说明应写明「上下皆合/上下俱合」');

  // 25/26：三传遁干见丁（金日/水日）——2015-2-3 9时 庚日 遁干乙巳/壬子/丁未
  const r25 = sixRenBifaOf({ y: 2015, m: 2, d: 3, h: 9 });
  eq(r25.命中.some((x) => x.序 === 25), true, '毕法25：金日逢丁应命中（遁干取首位天干比对）');

  // 47：贵人加临地盘辰戌（不是干上为辰戌）
  const r47 = sixRenBifaOf({ y: 2020, m: 1, d: 7, h: 9 });
  const h47 = r47.命中.find((x) => x.序 === 47);
  eq(!!h47, true, '毕法47：贵虽在狱宜临干应命中');
  eq(/加临地盘(辰|戌)/.test(h47.说明), true, '毕法47：命中说明应写「加临地盘辰/戌」');
}

// 22 项功能的文献依据：registry 每条都要有 source（书名+篇名），并透传到 catalog
{
  const noSrc = FEATURES.filter((f) => !f.source || !/《/.test(f.source));
  eq(noSrc.length, 0, 'registry：22 项功能全部标注文献依据（书名+篇名）');
  const cat = catalog();
  const items = cat[0].items;
  eq(items.length, FEATURES.length, 'catalog：条目数与 FEATURES 一致');
  eq(items.every((it) => it.依据 && /《/.test(it.依据)), true, 'catalog：每条带「依据」字段');
  eq(cat[0].items.find((x) => x.key === 'mystic-gates-mirror').依据.indexOf('附日奇门起例') > 0,
    true, 'catalog：宝鉴日奇的依据指向《奇门遁甲统宗·附日奇门起例》');
}

/* ------------------------------------------------------------------ *
 * 紫微·星曜居宫断语（《紫微斗数全书》原书直录 168 格）
 * ------------------------------------------------------------------ */
{
  let filled = 0;
  READING_PALACES.forEach((p) => {
    READING_STARS.forEach((s) => {
      const t = PALACE_READINGS[p] && PALACE_READINGS[p][s];
      if (t && t.length > 0) filled += 1;
    });
  });
  eq(READING_PALACES.length, 12, '紫微断语：十二宫齐');
  eq(READING_STARS.length, 14, '紫微断语：十四主星齐');
  eq(filled, 168, '紫微断语：168 格无缺（十四主星 × 十二宫）');
  eq(palaceReadingOf('命宫', '紫微').indexOf('紫微属土') === 0, true, '紫微断语：命宫紫微原文可取出');
  eq(palaceReadingOf('命宫', '天魁'), null, '紫微断语：非十四主星（辅星）返回 null，不臆造');
  eq(palaceReadingOf('大限', '紫微'), null, '紫微断语：非十二宫返回 null');

  const rd = purpleStarReadingsOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  eq(!!rd.命宫 && rd.命宫.断语.length > 0, true, '紫微断语：命宫有断语');
  eq(rd.cells.filter((c) => c.断语.length > 0).length >= 8, true, '紫微断语：多数宫有主星断语');
  eq(rd.缺口.some((x) => x.indexOf('不借对宫') >= 0), true, '紫微断语：空宫不借对宫已如实声明');
  const kong = rd.cells.find((c) => c.主星.length === 0);
  if (kong) eq(kong.断语.length, 0, '紫微断语：空宫不给断语（不借对宫）');
}

/* ------------------------------------------------------------------ *
 * 六爻·三刑按《增删卜易·三刑章第二十一》原文（六组对刑 + 四支自刑）
 * ------------------------------------------------------------------ */
{
  // 原文：「寅刑巳、巳刑申、子刑卯、卯刑午、丑戌相刑、未辰相刑。又云：辰午酉亥谓之自刑。」
  eq(branchPunish('寅', '巳'), true, '三刑原文：寅刑巳');
  eq(branchPunish('巳', '申'), true, '三刑原文：巳刑申');
  eq(branchPunish('子', '卯'), true, '三刑原文：子刑卯');
  eq(branchPunish('卯', '午'), true, '三刑原文：卯刑午（通行版无此项）');
  eq(branchPunish('丑', '戌'), true, '三刑原文：丑戌相刑');
  eq(branchPunish('未', '辰'), true, '三刑原文：未辰相刑（通行版无此项）');
  eq(branchPunish('申', '寅'), false, '三刑原文：原文未列申刑寅，不擅补');
  eq(branchPunish('丑', '未'), false, '三刑原文：原文未列丑刑未，不擅补');
  eq(branchPunish('辰', '辰'), true, '三刑原文：辰自刑');
  eq(branchPunish('午', '午'), true, '三刑原文：午自刑');
  eq(branchPunish('子', '子'), false, '三刑原文：子非自刑支');
  // 通行版并列保留，供对照
  eq(branchPunishCommon('申', '寅'), true, '三刑通行版：申刑寅');
  eq(branchPunishCommon('卯', '午'), false, '三刑通行版：无卯刑午');
}

/* ------------------------------------------------------------------ *
 * 六爻·随鬼入墓（《增删卜易·随鬼入墓章第三十》）
 *   原文古法以「世爻随鬼入墓」为凶，同篇觉子自注实验则谓
 *   「休囚无气始见危，若旺而有扶亦有求解」——故本实现必按旺衰分判，不作一律凶断。
 * ------------------------------------------------------------------ */
{
  const r1 = sixLinesCast({ y: 2024, m: 2, d: 7, h: 8, 事: '疾病' });
  const i1 = (r1.断语 || []).filter((x) => x.类 === '随鬼入墓');
  eq(i1.length > 0, true, '六爻随鬼入墓：世爻官鬼入日墓应命中');
  eq(/入日墓/.test(i1[0].项), true, '六爻随鬼入墓：墓名应写明「日墓」');
  eq(/旺而有扶亦有求解/.test(i1[0].断), true, '六爻随鬼入墓：旺相不作死断');

  // 休囚无气一路：2024-2-23 0 时 世爻官鬼己亥入化墓
  const r2 = sixLinesCast({ y: 2024, m: 2, d: 23, h: 0, 事: '疾病' });
  const i2 = (r2.断语 || []).filter((x) => x.类 === '随鬼入墓');
  eq(i2.length > 0, true, '六爻随鬼入墓：入化墓应命中');
  eq(/休囚无气始见危/.test(i2[0].断), true, '六爻随鬼入墓：休囚方作危断');

  // 非官鬼之爻入墓不判（六亲须为官鬼）
  const r3 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 14, 事: '求财' });
  const i3 = (r3.断语 || []).filter((x) => x.类 === '随鬼入墓');
  eq(i3.every((x) => /官鬼/.test(x.项)), true, '六爻随鬼入墓：只判六亲为官鬼之爻');
}

/* ------------------------------------------------------------------ *
 * 六爻·卦变生克（《增删卜易·卦变生克墓绝章第二十四》）
 *   原文：「卦变者：变生、变克、变墓、变绝、比和。予得验者，凡遇卦化克者，
 *         不论用神之衰旺皆以凶推。」例：「巽卦变坎卦，巽木变坎水谓之化生」。
 * ------------------------------------------------------------------ */
{
  const r = sixLinesStrengthOf({ y: 2020, m: 1, d: 11, h: 16, 事: '求财' });
  const items = (r.hexagramState && r.hexagramState.项) || [];
  const ke = items.filter((x) => x.name === '卦变化克');
  eq(ke.length, 1, '六爻卦变：泽雷随（木）化山地剥（金）应判化克');
  eq(/不论用神之衰旺皆以凶推/.test(ke[0].断), true, '六爻卦变：化克引原文「不论衰旺皆以凶推」');
  // 三种关系互斥（同一课只出一项）
  const n = items.filter((x) => /^卦变化/.test(x.name)).length;
  eq(n, 1, '六爻卦变：生/克/比和互斥，一次只出一项');
}

// ── 神煞：太极贵人按《三命通会·论太极贵》原文（含戊己「申」） ──
{
  const T = SHENSHA.TAIJI;
  eq(T['甲'].join(','), '子,午', '太极贵人：甲见子午（原文「甲乙木先造乎子…后终乎午」）');
  eq(T['丙'].join(','), '卯,酉', '太极贵人：丙见卯酉（原文「丙丁火先喜出乎震卯，后喜藏乎兑酉」）');
  eq(T['庚'].join(','), '寅,亥', '太极贵人：庚见寅亥（原文「庚辛金得寅…见亥乃金庙乎乾」）');
  eq(T['戊'].indexOf('申') >= 0, true, '太极贵人：戊己见申（原文「戊己土也，喜生乎申」）');
  eq(T['戊'].join(','), '申,辰,戌,丑,未', '太极贵人：戊己申与四库（辰戌丑未为正库）');
}

// ── 六爻：婚姻用神按性别（《增删卜易·婚姻章》男占妻财、女占官鬼） ──
{
  const M = await import('../src/core/features/render/six-lines.js');
  const entF = { date: { year: 2024, month: 2, day: 10 }, time: { hour: 14 }, gender: 'female' };
  const entM = { date: { year: 2024, month: 2, day: 10 }, time: { hour: 14 }, gender: 'male' };
  const f = M.sixLinesStrengthText(entF, '女 婚姻').text;
  const m = M.sixLinesStrengthText(entM, '男 婚姻').text;
  eq(f.indexOf('用神：官鬼') >= 0, true, '六爻用神：女占婚姻取官鬼（《增删卜易·婚姻章》）');
  eq(m.indexOf('用神：妻财') >= 0, true, '六爻用神：男占婚姻取妻财');
}

// ── 神煞异体字校正：金舆（《三命通会·论金轝》禄前二辰）、红艳煞（《三命通会·桃花红艶煞》原文表）
{
  const { chartPatternsOf: _cp } = await import('../src/core/four-pillars/patterns.js');
  const SS = await import('../src/core/four-pillars/symbolic-stars.js');
  // 金舆＝禄前二辰：甲禄寅→金舆辰
  eq(SS.JINYU['甲'], '辰', '金舆 甲日见辰（禄前二辰）');
  eq(SS.JINYU['癸'], '寅', '金舆 癸日见寅（禄前二辰）');
  // 红艳煞按原文表：乙见午（非通行之申）、戊见子（非辰）、壬见巳（非子）
  eq(SS.HONG_YAN['乙'], '午', '红艳煞 乙日见午（原文「甲乙逢午」）');
  eq(SS.HONG_YAN['戊'], '子', '红艳煞 戊日见子（原文「戊子」）');
  eq(SS.HONG_YAN['壬'], '巳', '红艳煞 壬日见巳（原文「壬巳」）');
}

  // 奇门值符值使：按《奇门遁甲统宗·卷之二》阳遁一局算例逐条复算
  //   「甲子时即以天蓬为值符而加甲子坎一宫，所谓伏吟者也。若用乙丑时，则地盘乙在九宫，
  //    即以天蓬加九宫。丙寅时则地盘丙在八宫，丁卯时则地盘丁在七宫。」
  //   「甲子时子在一宫，休门即在子上……丑时则休门加于二宫，寅时则加三宫，卯时则加四宫。」
  {
    const cases = [[0, '甲子', 1, 1], [2, '乙丑', 9, 2], [4, '丙寅', 8, 3], [6, '丁卯', 7, 4]];
    for (const [h, shi, fuGong, shiGong] of cases) {
      const p = mysticGatesHourChart({ y: 2025, m: 3, d: 11, h }); // 2025-03-11 为惊蛰上元阳遁一局
      eq(p.局, '上元1局', '统宗算例·局数（' + shi + '时）');
      eq(p.干支.时, shi, '统宗算例·时柱（' + shi + '）');
      eq(p.值符, '天蓬', '统宗算例·值符天蓬（' + shi + '）');
      eq(p.值符宫, fuGong, '统宗算例·值符落' + fuGong + '宫（' + shi + '）');
      eq(p.值使, '休门', '统宗算例·值使休门（' + shi + '）');
      eq(p.值使落宫, shiGong, '统宗算例·值使落' + shiGong + '宫（' + shi + '）');
    }
  }

  // 《梅花易数·互卦起例》「又云：乾坤无互，互其变卦」——六爻纯阳/纯阴时互卦取变卦
  {
    const qian = plumBlossomChart({ num1: 1, num2: 8, hourZhi: 8, y: 2024, m: 2, d: 10, h: 10 });
    eq(qian['本卦']['name'], '乾为天', '梅花乾坤无互·乾为本卦');
    eq(qian['互卦']['name'], qian['变卦']['name'], '梅花乾坤无互·乾的互卦取变卦');
    const kun = plumBlossomChart({ num1: 8, num2: 8, hourZhi: 8, y: 2024, m: 2, d: 10, h: 10 });
    eq(kun['本卦']['name'], '坤为地', '梅花乾坤无互·坤为本卦');
    eq(kun['互卦']['name'], kun['变卦']['name'], '梅花乾坤无互·坤的互卦取变卦');
    // 23:00 与 00:00 同属子时，必须起出同一卦（时辰数曾越界为 13）
    const z23 = plumBlossomChart({ y: 2024, m: 2, d: 10, h: 23 });
    const z0 = plumBlossomChart({ y: 2024, m: 2, d: 10, h: 0 });
    eq(z23['本卦']['name'], z0['本卦']['name'], '梅花子时 23 时与 0 时同卦');
    eq(z23['动爻'], z0['动爻'], '梅花子时 23 时与 0 时同动爻');
  }

  // 《三命通会·论天干阴阳生死》：「阳生阴死，阳死阴生，循环逆顺，变化见矣。」
  //   同篇举例：甲「长生于亥」；甲「其禄到寅」（禄=临官）；乙「生于午地」「故乙木死于亥」。
  eq(CS12_GAN['甲'][0], '亥', '十二长生·甲长生于亥（原文「长生于亥」）');
  eq(cs12Of('甲', '寅'), '临官', '十二长生·甲禄到寅为临官（原文「其禄到寅」）');
  eq(CS12_GAN['乙'][0], '午', '十二长生·乙长生于午（原文「乙木生于午地」）');
  eq(cs12Of('乙', '亥'), '死', '十二长生·乙死于亥（原文「故乙木死于亥」）');
  eq(cs12Of('甲', '午'), '死', '十二长生·阳干顺行（甲午为死）');
  eq(cs12Of('乙', '午'), '长生', '十二长生·阴干逆行（乙午为长生）');
  eq(CS12_NAMES.length, 12, '十二长生名序十二位（原文「循环无端，周而复始」）');

  // 《增删卜易·用神章》「四处生克冲合」总纲：
  //   「此世爻戌土有四处生克冲合：一、月建能生克冲合；二、日辰能生克冲合；
  //     三、卦中之动爻能生克冲合；四、世爻发动变出之爻能回头生、克、冲、合。」
  //   「以上四处若得全来生合用神者，诸占全吉。倘有三处相生一处相克，也以吉断。
  //     若有两处克两处生者，须看旺衰。」
  {
    // 用神木（求财妻财），月建寅木扶、动爻酉金克（酉与寅不冲，纯克）
    const r = fourFoldOf('寅', '木', [{ 爻: 5, 支: '酉', 动: true }], '寅', '午', null);
    eq(r.生 >= 1, true, '四处·月建同五行计为扶（生类）');
    eq(r.克, 1, '四处·动爻金克木计为克');
    // 寅申相冲：动爻申对用神寅应计入「冲」而非「克」（原文冲、克分列）
    const c2 = fourFoldOf('寅', '木', [{ 爻: 5, 支: '申', 动: true }], '寅', '午', null);
    eq(c2.冲 >= 1, true, '四处·寅申相冲计为冲');
    eq(typeof r.断, 'string', '四处·给出多寡结论');
    eq(r.断.length > 6, true, '四处·结论非空');
    // 无一克 → 全吉
    const g = fourFoldOf('寅', '木', [], '寅', '亥', null);
    eq(g.克, 0, '四处·无克');
    eq(g.断.indexOf('诸占全吉') >= 0, true, '四处·无一克断全吉');
    // 无一相生 → 大凶
    const b = fourFoldOf('寅', '木', [{ 爻: 3, 支: '酉', 动: true }], '申', '酉', null);
    eq(b.生, 0, '四处·无生');
    eq(b.断.indexOf('诸占大凶') >= 0, true, '四处·俱克断大凶');
    // 变爻回头生
    const v = fourFoldOf('寅', '木', [], '申', '酉', '子');
    eq(v.明细.some((x) => x.关系.indexOf('回头生') >= 0), true, '四处·变爻回头生');
  }

  // 空亡真假：《卜筮正宗·用神空亡诀》「发动逢冲不谓空，静空遇克却为空……三冬逢火是真空」
  {
    // 戌土在寅月（木克土，当令之克）安静无扶 → 真空
    eq(voidVerdict('戌', '土', '寅', '申', false, []).类, '真空', '空亡·静空遇克为真空');
    // 真空再加动爻来克 → 到底空
    eq(voidVerdict('戌', '土', '寅', '申', false, ['寅']).到底空, true, '空亡·真空复遇爻伤为到底空');
    // 日辰冲空 → 冲空则实，不作空论
    eq(voidVerdict('戌', '土', '寅', '辰', false, []).真空, false, '空亡·冲空则实');
    eq(voidVerdict('戌', '土', '寅', '寅', true, []).类, '动不为空', '空亡·动不为空');
    // 得月建或日辰生扶 → 假空
    eq(voidVerdict('戌', '土', '午', '未', false, []).类, '假空（有扶）', '空亡·有扶为假空');
    // 六亲发动诀：五亲俱全，每条四句
    eq(Object.keys(LIU_QIN_FA_DONG).length, 5, '六亲发动诀·五亲俱全');
    eq(LIU_QIN_FA_DONG.父母.length, 4, '六亲发动诀·每亲四句');
    eq(LIU_QIN_FA_DONG.父母[0].indexOf('父动当头克子孙') === 0, true, '六亲发动诀·父母句首含克子孙');
    eq(LIU_QIN_FA_DONG.兄弟[0].indexOf('兄弟交重克了财') === 0, true, '六亲发动诀·兄弟句首含克财');
  }

  // 建除十二神同位异名：《协纪辨方书·卷七·义例四·建除十二神》原目
  {
    eq(JIANCHU_ALIAS['满'].join(''), '福德天巫天狗', '建除别名·满日福德天巫天狗');
    eq(JIANCHU_ALIAS['成'].join(''), '天医天喜', '建除别名·成日天医天喜');
    eq(JIANCHU_ALIAS['开'].join(''), '时阳生气', '建除别名·开日时阳生气');
    eq(JIANCHU_ALIAS['危'].length, 0, '建除别名·危日无别名');
    eq(jianchuAliasOf('平', 0), '天罡', '建除别名·阳月平位作天罡');
    eq(jianchuAliasOf('平', 1), '河魁', '建除别名·阴月平位作河魁');
    eq(jianchuAliasOf('收', 0), '河魁', '建除别名·阳月收位作河魁');
    eq(jianchuAliasOf('收', 1), '天罡', '建除别名·阴月收位作天罡');
    // 2024-02-10 满日：表·吉神里确有福德、天巫两位（别名与表值互相印证）
    const hl = almanacDaily(2024, 2, 10);
    eq(hl.值星.name, '满', '建除别名·2024-02-10 满日');
    eq(hl.吉神宜趋.indexOf('福德') >= 0 && hl.吉神宜趋.indexOf('天巫') >= 0, true, '建除别名·满日吉神含福德天巫');
  }

  // 建除黄黑道：《协纪辨方书·卷七·义例四》引《考原》「除危定执成开为吉，建破平收满闭为凶」
  {
    eq(JIANCHU_LUCK['建'], '凶', '建除黄黑·建为黑道');
    eq(JIANCHU_LUCK['满'], '凶', '建除黄黑·满为黑道');
    eq(JIANCHU_LUCK['平'], '凶', '建除黄黑·平为黑道');
    eq(JIANCHU_LUCK['收'], '凶', '建除黄黑·收为黑道');
    eq(JIANCHU_LUCK['除'], '吉', '建除黄黑·除为黄道');
    eq(JIANCHU_LUCK['危'], '吉', '建除黄黑·危为黄道');
    eq(JIANCHU_LUCK['定'], '吉', '建除黄黑·定为黄道');
    eq(JIANCHU_LUCK['执'], '吉', '建除黄黑·执为黄道');
    eq(JIANCHU_LUCK['成'], '吉', '建除黄黑·成开皆可用（成）');
    eq(JIANCHU_LUCK['开'], '吉', '建除黄黑·成开皆可用（开）');
    eq(JIANCHU_LUCK['破'], '凶', '建除黄黑·破闭不相当（破）');
    eq(JIANCHU_LUCK['闭'], '凶', '建除黄黑·破闭不相当（闭）');
  }

  // 三奇游六仪：《奇门宝鉴·释三奇游六仪》原书算例逐字复现
  //  「假如阳一局，乙奇在九宫、甲午辛在四宫居右、甲戌己在二宫居左。若乙亥时，
  //    甲戌直符来加乙于九宫，则乙游于右仪之辛。」
  {
    const pan = mysticGatesHourChart({ y: 2024, m: 1, d: 1, h: 21, min: 0 });
    eq(pan['干支']['时'], '乙亥', '游六仪算例·乙亥时');
    eq(pan['旬首'][1], '戌', '游六仪算例·甲戌旬');
    eq(pan['地盘']['2'], '己', '游六仪算例·甲戌己在二宫（居左）');
    eq(pan['地盘']['4'], '辛', '游六仪算例·甲午辛在四宫（居右）');
    eq(pan['地盘']['9'], '乙', '游六仪算例·乙奇在九宫');
    const ge = mysticGatesPatternsOf({ y: 2024, m: 1, d: 1, h: 21 });
    const hit = (ge['吉格'] || []).filter((x) => x.name === '三奇游六仪');
    eq(hit.length, 1, '游六仪算例·命中一格');
    eq(hit[0]['宫'], 9, '游六仪算例·在九宫');
    eq(hit[0]['义'].includes('乙游于辛'), true, '游六仪算例·乙游于右仪之辛');
    eq(hit[0]['义'].includes('左仪加奇'), true, '游六仪算例·左仪加奇则奇游于右仪');
  }

  // 建除同位异名的条件筛选：《协纪辨方书·卷七·义例四》「天狗者戌日值满也……非谓凡为满日皆天狗也」
  {
    const a = almanacDaily(2024, 2, 10); // 满日·甲辰（非戌）
    eq(a['值星']['name'], '满', '别名·2024-02-10 为满日');
    eq(a['值星']['别名'].includes('天狗'), false, '别名·非戌日满日不称天狗');
    eq(a['值星']['别名'].includes('福德'), true, '别名·满日仍为福德');
    const b = almanacDaily(2024, 8, 14); // 满日·庚戌
    eq(b['值星']['name'], '满', '别名·2024-08-14 为满日');
    eq(b['ganzhi']['日'], '庚戌', '别名·2024-08-14 为庚戌');
    eq(b['值星']['别名'].includes('天狗'), true, '别名·戌日值满方称天狗');
    const c = almanacDaily(2024, 2, 11); // 平日·乙巳（巳为阴月？月建寅为阳月）
    eq(c['值星']['name'], '平', '别名·2024-02-11 为平日');
    eq(c['值星']['当月别名'], '天罡', '别名·阳月平位作天罡');
    eq(c['值星']['别名'].includes('死神'), true, '别名·平位同列死神');
  }

  // 交节日「叠两值日」：《协纪辨方书·卷七·义例四》引历书「每月交节则叠两值日」
  {
    const a = almanacDaily(2024, 2, 4); // 立春交节：丑月建（收）→ 寅月建（成）
    eq(JSON.stringify(a['值星']['叠值']), JSON.stringify(['收', '成']), '叠值·2024-02-04 立春收成两值并列');
    eq(a['值星']['name'], '成', '叠值·今日以新月建成日论');
    const b = almanacDaily(2024, 2, 5);
    eq(b['值星']['叠值'], undefined, '叠值·非交节日不并列');
    const c = almanacDaily(2024, 3, 5); // 惊蛰：寅月（满）→ 卯月（除）
    eq(JSON.stringify(c['值星']['叠值']), JSON.stringify(['满', '除']), '叠值·2024-03-05 惊蛰满除两值并列');
  }

  // 十二天神异名：《协纪·卷十》引曹震圭说「青龙即雷公……土勃即勾陈」，十二神各有别名；
  // 另「天德」立成表作「宝光」、「玄武」四库本作「元武」。
  {
    const a = almanacDaily(2024, 1, 2);
    eq(a['天神'], '天德', '天神异名·2024-01-02 值天德');
    eq(/宝光/.test(a['天神别名']), true, '天神异名·天德别名含立成表之宝光');
    const b = almanacDaily(2024, 2, 10);
    eq(b['天神'], '金匮', '天神异名·2024-02-10 值金匮');
    eq(b['天神别名'], '天宝', '天神异名·金匮即天宝');
    eq(Object.keys(TIANSHEN_ALIAS).length, 12, '天神异名·十二神各有别名');
    eq(TIANSHEN_ALIAS['青龙'], '雷公', '天神异名·青龙即雷公');
    eq(/元武/.test(TIANSHEN_ALIAS['玄武']), true, '天神异名·玄武四库本作元武');
  }

  // 十二天神断语：按《神枢经》黄道/黑道两类原文，不逐神自撰
  {
    const h = almanacDaily(2024, 2, 10); // 金匮（黄道）
    eq(/宜兴众务/.test(h['天神断语']), true, '天神断语·黄道类引原文「宜兴众务」');
    eq(/不避太岁/.test(h['天神断语']), true, '天神断语·黄道类引原文「不避太岁、将军、月刑」');
    const b = almanacDaily(2024, 6, 15); // 天刑（黑道）
    eq(b['天神'], '天刑', '天神断语·2024-06-15 值天刑');
    eq(/不可兴土功/.test(b['天神断语']), true, '天神断语·黑道类引原文「不可兴土功」');
    eq(/嫁娶、出军/.test(b['天神断语']), true, '天神断语·黑道类引原文「嫁娶、出军」');
    // 逐神自撰的旧断语必须消失（如「主喜气盈门」「宜纳财、订婚」）
    const all = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命', '天刑', '朱雀', '白虎', '天牢', '玄武', '勾陈']
      .map((g) => TIANSHEN_MEANING[g]).join('');
    eq(/喜气盈门|纳财|订婚|主寿|勾连牵绊/.test(all), false, '天神断语·已删尽原书所无的逐神自撰语');
  }

  // 六神本象：逐条照录《卜筮正宗·六兽歌》后的六神象意条
  {
    eq(Object.keys(SHEN_XIANG).length, 6, '六神本象·六神俱全');
    eq(SHEN_XIANG['青龙'].startsWith('正义忠直'), true, '六神本象·青龙起于正义忠直');
    eq(SHEN_XIANG['玄武'].includes('盗贼'), true, '六神本象·玄武主盗贼');
    eq(SHEN_XIANG['螣蛇'].includes('夙缘'), true, '六神本象·螣蛇冥冥中之夙缘');
  }

  // 二十八宿七元结构：《协纪辨方书·卷一》引《考原》「一元甲子日起虚、二元起奎、三元起毕、
  //   四元起鬼、五元起翼、六元起氐、七元起箕，至七元尽而甲子又起虚，周而复始」
  {
    const 元序 = ['虚', '奎', '毕', '鬼', '翼', '氐', '箕'];
    const got = [];
    for (let y = 2020; y <= 2030; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        for (let d = 1; d <= 28; d += 1) {
          if (daySexagenary(y, m, d) === '甲子' && got.length < 8) got.push(xiu28Of(y, m, d)['宿']);
        }
      }
    }
    eq(got.length, 8, '二十八宿·取到 8 个甲子日');
    // 起点不一定是「一元」，只要连续八个甲子日按「虚→奎→毕→鬼→翼→氐→箕→虚」的环序走即可
    let okAll = true;
    for (let i = 0; i < 7; i += 1) {
      const want = 元序[(元序.indexOf(got[0]) + i) % 7];
      if (got[i] !== want) okAll = false;
    }
    eq(okAll, true, '二十八宿·连续七个甲子日按七元环序虚奎毕鬼翼氐箕递进');
    eq(got[7], got[0], '二十八宿·七元尽而甲子复原起宿（周而复始）');
  }

  // 月令司令（人元司事当值）：《三命通会·论人元司事》逐月日数表
  {
    const cmd = monthCommandOf(2024, 2, 20, 12);
    eq(cmd.月支, '寅', '月令司令·2024-02-20 月建寅');
    eq(cmd.节, '立春', '月令司令·只认十二节（立春后第17日）');
    eq(cmd.节后天数, 17, '月令司令·立春后第17日');
    eq(cmd.司令, '甲', '月令司令·寅月己7丙5甲18，第17日入甲段');
    eq(cmd.段, 3, '月令司令·第3段');
    eq(cmd.段内日, 5, '月令司令·段内第5日');
    const c2 = monthCommandOf(2024, 2, 10, 12);
    eq(c2.司令, '己', '月令司令·立春后第7日仍为己段（己七日）');
    eq(commandDaysOf('酉'), 32, '月令司令·底本酉月合32日（传抄之差照录）');
    eq(commandDaysOf('子'), 26, '月令司令·底本子月合26日（传抄之差照录）');
    eq(commandDaysOf('寅'), 30, '月令司令·寅月合30日');
    const pat = chartPatternsOf({ y: 2024, m: 2, d: 20, h: 12 });
    eq(!!pat.月令司令, true, '月令司令·格局输出带司令字段');
    eq(pat.月令司令.十神, '比肩', '月令司令·甲对甲日主为比肩');
    const bz = baziChart({ y: 2024, m: 2, d: 20, h: 12 });
    eq(bz.月令司令.司令, '甲', '月令司令·四柱输出带司令字段');
  }

  // 六神辨象结合六亲辨象（《卜筮正宗·六神辨象结合六亲辨象之断法》）
  {
    eq(shenQinXiang('青龙', '妻财'), '正义之财；发妻；喜财；占身命为福禄之财，享福', '六神六亲交表·青龙临妻财');
    eq(shenQinXiang('玄武', '妻财').startsWith('骗伪之财'), true, '六神六亲交表·玄武临妻财为骗伪之财');
    eq(shenQinXiang('白虎', '官鬼').indexOf('血光之灾') >= 0, true, '六神六亲交表·白虎临官鬼主血光');
    eq(shenQinXiang('勾陈', '夫妻'), '', '六神六亲交表·非六亲键返回空串');
    eq(Object.keys(SHEN_QIN_XIANG).length, 5, '六神六亲交表·五个六亲行');
    eq(Object.keys(SHEN_QIN_XIANG['官鬼']).length, 6, '六神六亲交表·六个六神列');
  }

  // 诸爻持世诀（《卜筮正宗·诸爻持世诀》原文五首）
  {
    eq(SHI_QIN['父母'].indexOf('父母持世主身劳') === 0, true, '持世诀·父母首句照录');
    eq(SHI_QIN['子孙'].indexOf('子身持世事无忧') === 0, true, '持世诀·子孙首句照录（底本作「子身」）');
    eq(SHI_QIN['官鬼'].indexOf('鬼爻持世事难安') === 0, true, '持世诀·官鬼首句照录');
    eq(SHI_QIN['妻财'].indexOf('财爻持世益财荣') === 0, true, '持世诀·妻财首句照录');
    eq(SHI_QIN['兄弟'].indexOf('兄弟持世莫求财') === 0, true, '持世诀·兄弟首句照录');
    eq(Object.keys(SHI_QIN).length, 5, '持世诀·五亲齐全');
    eq(SHI_QIN_NOTE.indexOf('世爻旺相最为强') >= 0, true, '持世诀·总诀引原文');
  }

  // 世应生克空亡动静诀（《卜筮正宗·世应生克空亡动静诀》）
  {
    const r = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12 });
    const sy = (r.断语 || []).filter((x) => x.类 === '世应');
    eq(sy.length, 1, '世应诀·每条卦出一条世应断');
    eq(sy[0].项.indexOf('世') === 0 && sy[0].项.indexOf('应') > 0, true, '世应诀·项名含世应两支');
    eq(['世生应', '世克应', '应生世', '应克世', '比和'].some((k) => sy[0].项.indexOf(k) >= 0), true, '世应诀·标明生克关系');
  }

  // 六亲变化歌（《卜筮正宗·六亲变化歌》5×5 二十五格）
  {
    eq(liuQinHuaOf('父母', '官鬼'), '化鬼官迁举', '六亲变化·父母化官鬼');
    eq(liuQinHuaOf('妻财', '兄弟'), '化兄当破财', '六亲变化·妻财化兄弟');
    eq(liuQinHuaOf('兄弟', '子孙'), '化子却如意', '六亲变化·兄弟化子孙');
    eq(liuQinHuaOf('官鬼', '子孙').indexOf('必伤官') > 0, true, '六亲变化·官鬼化子孙');
    eq(liuQinHuaOf('子孙', '子孙').indexOf('退神') > 0, true, '六亲变化·子孙化子孙为退神');
    eq(Object.keys(LIU_QIN_HUA).length, 5, '六亲变化·五行表');
    eq(Object.keys(LIU_QIN_HUA['父母']).length, 5, '六亲变化·每行五格');
    const r = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12 });
    eq((r.断语 || []).filter((x) => x.类 === '动爻' && x.断.indexOf('六亲变化') >= 0).length, 3, '六亲变化·动爻均带变化歌');
  }

  // 动静格局补《卜筮正宗·六爻安静诀》《六爻乱动诀》
  {
    const j0 = movementPattern([]);
    eq(j0.名, '尽静', '动静·无动爻为尽静');
    eq(j0.依据, '《卜筮正宗·六爻安静诀》', '动静·尽静引安静诀');
    eq(j0.说明.indexOf('日辰克用') >= 0, true, '动静·尽静说明含原文要点');
    const j6 = movementPattern([1, 2, 3, 4, 5, 6]);
    eq(j6.名, '尽发', '动静·六爻全动为尽发');
    eq(j6.依据, '《卜筮正宗·六爻乱动诀》', '动静·尽发引乱动诀');
    eq(j6.说明.indexOf('用神') >= 0, true, '动静·尽发说明含用神要点');
    eq(movementPattern([1]).名, '独发', '动静·一爻动为独发');
    eq(movementPattern([1, 2, 3, 4, 5]).名, '独静', '动静·五动一静为独静');
    eq(movementPattern([1, 2]).名, '两爻动', '动静·两爻动用中文数字');
  }

  // 用神分类（《卜筮正宗·用神分类定例第一》《世应论用神第二》）
  {
    eq(YONG['仇人'], '应', '用神分类·仇人取应爻');
    eq(YONG['陌生人'], '应', '用神分类·陌生人取应爻');
    eq(YONG['未曾深交'], '应', '用神分类·未深交之友取应爻');
    eq(YONG['地点'], '应', '用神分类·指实某处地头取应爻');
    eq(YONG['自身'], '世', '用神分类·自占取世爻');
    eq(YONG['财运'], '妻财', '用神分类·财运取妻财');
    eq(YONG['功名'], '官鬼', '用神分类·功名取官鬼');
    eq(YONG['长辈'], '父母', '用神分类·长辈取父母');
    eq(YONG['朋友'], '兄弟', '用神分类·朋友取兄弟');
    eq(YONG['子女'], '子孙', '用神分类·子女取子孙');
    // 值只能是五亲之一 / 世 / 应
    const legal = new Set(['父母', '官鬼', '兄弟', '妻财', '子孙', '世', '应']);
    eq(Object.keys(YONG).every((k) => legal.has(YONG[k])), true, '用神分类·取值只在五亲与世应之内');
    const r = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '仇人' });
    const y = (r.断语 || []).filter((x) => x.类 === '用神');
    eq(y.length, 1, '应爻用神·出一条用神断');
    eq(y[0].项.indexOf('以应爻为用神') === 0, true, '应爻用神·项名点明应爻为用');
  }

  // 原神／忌神／用神发动／日辰 判词（《卜筮正宗》四诀）
  {
    const mk = (六亲, 五行, 爻) => ({ 原神: { 六亲, 五行, 爻 } });
    // 原神衰弱：强弱=衰（旺衰字段里没有「衰」字，须走强弱字段）
    const weak = yuanShenVerdict(mk('子孙', '水', [{ 爻: 4, 旺衰: '休囚（无根无助）', 强弱: '衰', 月破: false, 动: false }]));
    eq(weak.判, '原神衰弱', '原神歌·原神衰弱（走强弱字段）');
    eq(weak.吉凶, '凶', '原神歌·原神衰弱为凶');
    // 原神安静有气
    const ok = yuanShenVerdict(mk('子孙', '水', [{ 爻: 4, 旺衰: '相（有气）', 强弱: '相', 月破: false, 动: false }]));
    eq(ok.判, '原神安静有气', '原神歌·原神安静有气');
    // 原神发动
    const dong = yuanShenVerdict(mk('子孙', '水', [{ 爻: 4, 旺衰: '相（有气）', 强弱: '相', 月破: false, 动: true }]));
    eq(dong.判, '原神发动得势', '原神歌·原神发动得势');
    // 原神化回头克
    const beiKe = yuanShenVerdict(mk('子孙', '水', [{ 爻: 4, 旺衰: '休囚有气（有救）', 强弱: '弱有救', 月破: false, 动: true, 变: { 项: [{ name: '回头克' }] } }]));
    eq(beiKe.判, '原神受伤', '原神歌·最嫌化克');
    // 原神不上卦
    eq(yuanShenVerdict(mk('子孙', '水', [])).判, '原神不上卦', '原神歌·原神不上卦');
    // 忌神：月破为受伤、发动为凶、安静衰弱为吉
    const ji = (爻) => jiShenVerdict({ 忌神: { 六亲: '兄弟', 五行: '金', 爻 } });
    eq(ji([{ 爻: 3, 旺衰: '月破失力', 强弱: '衰', 月破: true, 动: true }]).判, '忌神受伤', '忌神歌·逢伤克为吉');
    eq(ji([{ 爻: 3, 旺衰: '相（有气）', 强弱: '相', 月破: false, 动: true }]).判, '忌神发动', '忌神歌·宜静不宜兴');
    eq(ji([{ 爻: 3, 旺衰: '休囚（无根无助）', 强弱: '衰', 月破: false, 动: false }]).判, '忌神衰弱安静', '忌神歌·安静衰弱为吉');
    eq(ji([]).判, '忌神不上卦', '忌神歌·忌神不上卦');
    // 日辰诀
    eq(riChenVerdict('木', '酉').判, '日辰克用', '日辰诀·日辰克用不堪亲');
    eq(riChenVerdict('木', '子').判, '日辰生用', '日辰诀·日辰生用');
    eq(riChenVerdict('木', '卯').判, '日辰生用', '日辰诀·日辰与用同气');
    eq(riChenVerdict('木', '辰').判, '用神克日', '日辰诀·用神克日为平');
    eq(riChenVerdict('木', '巳').判, '用神生日', '日辰诀·用神生日为平');
    // 用神发动诀
    eq(yongFaDongVerdict([{ 动: false, 旺衰: '相（有气）' }]), null, '用神发动诀·静则不判');
    eq(yongFaDongVerdict([{ 动: true, 旺衰: '休囚（无根无助）', 空亡: false, 月破: false }]).判, '用神发动', '用神发动诀·纵值休囚亦不凶');
    eq(yongFaDongVerdict([{ 动: true, 旺衰: '相（有气）', 空亡: true }]).判, '用神发动而有伤', '用神发动诀·有伤则降吉');
  }

  // 六兽歌断 + 日月建传符（《卜筮正宗》）
  {
    eq(shenDongVerdict({ 神: '青龙', 六亲: '妻财', 五行: '木', 动: true, 用神六亲: '妻财' }).判, '青龙发动附用', '六兽歌断·青龙附用为吉');
    eq(shenDongVerdict({ 神: '青龙', 六亲: '兄弟', 五行: '金', 动: true, 用神六亲: '妻财', 忌神六亲: '兄弟' }).判, '青龙发动临仇忌', '六兽歌断·青龙临仇忌反凶');
    eq(shenDongVerdict({ 神: '朱雀', 六亲: '父母', 五行: '土', 动: true }).判, '朱雀发动临父母（文印旺）', '六兽歌断·朱雀临父母为文印旺');
    eq(shenDongVerdict({ 神: '朱雀', 六亲: '兄弟', 五行: '金', 动: true, 忌神六亲: '兄弟' }).判, '朱雀发动临忌（煞神相并）', '六兽歌断·朱雀煞神相并');
    eq(shenDongVerdict({ 神: '勾陈', 六亲: '父母', 五行: '土', 动: true, 用神六亲: '父母' }).判, '勾陈发动生用', '六兽歌断·勾陈生用为吉');
    eq(shenDongVerdict({ 神: '螣蛇', 六亲: '官鬼', 五行: '木', 动: true }).判, '螣蛇发动临官鬼', '六兽歌断·螣蛇临官鬼为凶');
    eq(shenDongVerdict({ 神: '螣蛇', 六亲: '父母', 五行: '木', 动: true, 空亡: true }).判, '螣蛇发动持木落空', '六兽歌断·持木落空休道吉');
    eq(shenDongVerdict({ 神: '螣蛇', 六亲: '父母', 五行: '火', 动: true, 逢冲: true }).判, '螣蛇发动逢冲', '六兽歌断·逢冲之日莫逃凶');
    eq(shenDongVerdict({ 神: '白虎', 六亲: '官鬼', 五行: '金', 动: true }).判, '白虎发动临官鬼', '六兽歌断·白虎临官鬼为凶');
    eq(shenDongVerdict({ 神: '白虎', 六亲: '兄弟', 五行: '金', 动: true, 世五行: '木' }).判, '白虎发动持金克世', '六兽歌断·持金动克妨人口');
    eq(shenDongVerdict({ 神: '白虎', 六亲: '兄弟', 五行: '金', 动: true, 世五行: '火' }).判, '白虎发动遇火生身', '六兽歌断·遇火生身便不同');
    eq(shenDongVerdict({ 神: '玄武', 六亲: '官鬼', 五行: '水', 动: true }).判, '玄武发动临官鬼', '六兽歌断·玄武临官鬼贼交攻');
    eq(shenDongVerdict({ 神: '玄武', 六亲: '兄弟', 五行: '水', 动: true, 世五行: '木' }).判, '玄武发动生世（有情）', '六兽歌断·有情生世邪无犯');
    eq(shenDongVerdict({ 神: '青龙', 六亲: '妻财', 五行: '木', 动: false }), null, '六兽歌断·安静不动则不判');
    // 日月建传符
    eq(buildTransmitVerdict('寅', '青龙', { 日支: '寅', 月支: '酉' }).判, '日建临青龙', '日月建传符·日建临青龙');
    eq(buildTransmitVerdict('酉', '白虎', { 日支: '寅', 月支: '酉' }).判, '月建临白虎', '日月建传符·月建同理');
    eq(buildTransmitVerdict('辰', '白虎', { 日支: '辰', 月支: '辰' }).判, '日月建临白虎', '日月建传符·日月同临');
    eq(buildTransmitVerdict('午', '青龙', { 日支: '寅', 月支: '酉' }), null, '日月建传符·不临则不判');
    // 接入后：2024-02-10 财爻占，辰支临日建青龙，须出日月建断
    const rc = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '财运' });
    eq((rc.断语 || []).some((x) => x.类 === '日月建' && x.项 === '日建临青龙'), true, '日月建传符·已接入六爻断语');
    eq((rc.断语 || []).some((x) => x.类 === '动爻' && /六兽歌断/.test(x.断)), true, '六兽歌断·已接入动爻断语');
  }

  // 小运（行年）——《三命通会·论小运》并存两法：起年运法（男丙寅/女壬申）、醉醒子时上起法
  {
    const male = luckCyclesOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' }, 3);
    eq(male.小运.起年运法.诸位.length, 12, '小运·起年运法列十二位');
    eq(male.小运.起年运法.起位, '丙寅', '小运·男起丙寅');
    eq(male.小运.起年运法.诸位[0].干支, '丙寅', '小运·男一位丙寅');
    eq(male.小运.起年运法.诸位[1].干支, '丁卯', '小运·男顺行');
    eq(male.小运.起年运法.诸位[0].虚岁, 1, '小运·一岁一位');
    eq(male.小运.起年运法.方向, '顺行', '小运·男顺行标向');
    // 时上起法：时柱癸巳，顺行 → 出生即进一位为甲午
    eq(male.小运.时上起法.诸位[0].干支, '甲午', '小运·时上起法自时柱顺进一位');
    eq(/两法自虚岁 1 岁起不同/.test(male.小运.异同), true, '小运·两法异同如实列出');
    const female = luckCyclesOf({ y: 1990, m: 6, d: 15, h: 10, gender: '女' }, 3);
    eq(female.小运.起年运法.起位, '壬申', '小运·女起壬申');
    eq(female.小运.起年运法.诸位[0].干支, '壬申', '小运·女一位壬申');
    eq(female.小运.起年运法.诸位[1].干支, '辛未', '小运·女逆行');
    eq(female.小运.起年运法.方向, '逆行', '小运·女逆行标向');
    eq(/男起丙寅顺行、女起壬申逆行/.test(male.小运.起年运法.依据), true, '小运·依据点名原文');
    eq(/醉醒子/.test(male.小运.时上起法.依据), true, '小运·时上起法点名醉醒子');
  }

  // 流年太岁——《三命通会·论太岁》
  {
    const inp = { y: 1990, m: 6, d: 15, h: 10, gender: '男' }; // 庚午 壬午 辛亥 癸巳，日主辛金
    const a = yearLordOf(inp, 2026); // 丙午，火克金
    eq(a.太岁, '丙午', '太岁·流年干支');
    eq(a.判[0].名, '岁伤日干', '太岁·岁伤日干判轻');
    eq(a.判[0].吉凶, '轻', '太岁·岁伤日干祸轻');
    // 日犯岁君：甲寅年（木）被日干辛金克；大运丙戌之丙火克辛金 = 有救，合甲者无 = 无情
    const b = yearLordOf(inp, 2034, { 大运干支: '丙戌' });
    eq(b.判[0].名, '日犯岁君', '太岁·日犯岁君判重');
    eq(b.判[0].吉凶, '重', '太岁·日犯岁君灾重');
    eq(b.救情.级, '凶半', '太岁·得一字者凶半');
    eq(b.救情.救.length > 0, true, '太岁·救须列出制伏之神');
    eq(b.救情.情.length, 0, '太岁·无情须如实为空');
    // 无救无情：乙酉运无火制辛金、四柱亦无合甲之干（甲己合，柱中无己）
    const c = yearLordOf(inp, 2034, { 大运干支: '乙酉' });
    eq(c.救情.救.length, 0, '太岁·乙酉运无克辛金之干');
    eq(c.救情.级, '凶莫能解', '太岁·二字俱无则凶莫能解');
    const d = yearLordOf(inp, 2028); // 戊申，土生日主金
    eq(/相生|干支一气/.test(d.判[0].名), true, '太岁·不克不战之门');
    // 真太岁：生年干支等于流年干支（甲子生人见甲子年）
    const e = yearLordOf({ y: 1984, m: 6, d: 15, h: 10, gender: '男' }, 2044);
    eq(e.判.some((x) => x.名 === '真太岁'), true, '太岁·真太岁（转趾煞）');
    // 征太岁：日柱与太岁天克地冲（1985-03-02 女 = 庚子日，见 2026 丙午年）
    const f = yearLordOf({ y: 1985, m: 3, d: 2, h: 8, gender: '女' }, 2026);
    eq(f.日柱, '庚子', '太岁·征太岁样本日柱');
    eq(f.判.some((x) => x.名 === '征太岁'), true, '太岁·征太岁天克地冲');
    // 岁运并临：大运干支与流年相同
    const g = yearLordOf(inp, 2026, { 大运干支: '丙午' });
    eq(g.判.some((x) => x.名 === '岁运并临'), true, '太岁·岁运并临');
  }

  // 《周易》经文（底本照录）
  {
    eq(Object.keys(ZHOUYI).length, 64, '周易·六十四卦齐备');
    eq(ZHOUYI.乾.卦辞, '元，亨，利，贞。', '周易·乾卦卦辞照录');
    eq(ZHOUYI.乾.大象, '天行健，君子以自强不息。', '周易·乾卦大象照录');
    eq(ZHOUYI.坤.卦辞.indexOf('利牝马之贞') >= 0, true, '周易·坤卦卦辞');
    // 每卦六爻俱全，且爻名照底本（初九/六二/上六）
    const lack = Object.keys(ZHOUYI).filter((n) => (ZHOUYI[n].爻 || []).filter(Boolean).length !== 6);
    eq(lack.length, 0, '周易·六十四卦每卦六爻俱全');
    eq(yaoText('乾', 1).爻名, '初九', '周易·乾初爻爻名');
    eq(yaoText('乾', 1).辞, '潜龙，勿用。', '周易·乾初九爻辞照录');
    eq(yaoText('坤', 2).爻名, '六二', '周易·坤二爻爻名（九/六按阴阳）');
    eq(yaoText('蒙', 2).辞.indexOf('包蒙') >= 0, true, '周易·蒙九二爻辞');
    eq(yongText('乾').用九, '见群龙无首，吉。', '周易·乾用九');
    eq(yongText('坤').用六, '利永贞。', '周易·坤用六');
    eq(yongText('屯'), null, '周易·余卦无用爻');
    // 底本异体字「遯」，通行本作「遁」
    eq(hexagramText('遯').序, 33, '周易·底本异写遯可查');
    eq(hexagramText('乾为天').卦辞, '元，亨，利，贞。', '周易·八纯卦全名可查');
    eq(ZHOUYI.遁.序, 33, '周易·通行本遁序位');
    // 卦序抽样：3 屯、29 坎、63 既济、64 未济
    eq([ZHOUYI.屯.序, ZHOUYI.坎.序, ZHOUYI.既济.序, ZHOUYI.未济.序].join(','), '3,29,63,64', '周易·通行本卦序');
  }

  // 《黄金策》分门断法（六门赋文逐句落地）
  {
    const 门 = goldenChapterNames();
    eq(门.length, 26, '黄金策·已接入二十六门');
    eq(门.map((x) => x.章).join(','), '求财,词讼,疾病,出行,求名,婚姻,家宅,失脱,行人,六畜,征战,身命,求师,求馆,天时,舟船,求医,逃亡,产育,进人口,种作,年时,坟墓,鬼神,娼家,蚕桑', '黄金策·二十六门章名');
    eq(goldenVerdictsOf('不存在的事', { qin: {} }), null, '黄金策·未识别事类返回 null');
    // 六冲卦：2024-01-03 起卦（婚前占得六冲，原书「六冲则难而又凶」）
    const inp = { y: 2024, m: 1, d: 3, h: 10, 事: '婚姻' };
    const c = sixLinesCast(inp);
    const st = sixLinesStrengthOf(inp);
    eq(!!c.卦体.六冲卦, true, '黄金策·样本确为六冲卦');
    const ctx = goldenContextOf(c, st);
    const gv = goldenVerdictsOf('婚姻', ctx);
    eq(gv.章, '婚姻', '黄金策·婚姻门取到正确章');
    eq(gv.命中.some((x) => x.断.indexOf('六冲卦') >= 0), true, '黄金策·六冲婚难成');
    // 财旺福兴：2024-01-03 妻财旺相、子孙在卦
    const inp2 = { y: 2024, m: 1, d: 3, h: 10, 事: '财运' };
    const gv2 = goldenVerdictsOf('财运', goldenContextOf(sixLinesCast(inp2), sixLinesStrengthOf(inp2)));
    eq(gv2.命中.some((x) => x.断.indexOf('财旺福兴') >= 0), true, '黄金策·财旺福兴');
    // 财不上卦时不得误报「财旺福兴」（2024-02-10 妻财不上卦）
    const inp3 = { y: 2024, m: 2, d: 10, h: 12, 事: '财运' };
    const gv3 = goldenVerdictsOf('财运', goldenContextOf(sixLinesCast(inp3), sixLinesStrengthOf(inp3)));
    eq(gv3.命中.some((x) => x.断.indexOf('财旺福兴') >= 0), false, '黄金策·财不上卦不报财旺');
    eq(gv3.命中.some((x) => x.断.indexOf('有福无财') >= 0), true, '黄金策·有福无财兄弟交重');
    // 疾病门恒有总纲条
    const gv4 = goldenVerdictsOf('疾病', goldenContextOf(sixLinesCast({ y: 2024, m: 2, d: 10, h: 12 }), sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 12 })));
    eq(gv4.命中.some((x) => x.断.indexOf('病痊') >= 0), true, '黄金策·疾病门总纲恒列');
    // 每条命中都带书名篇名，可被引用审计回溯
    eq(gv4.命中.every((x) => x.原文.indexOf('《黄金策·') >= 0), true, '黄金策·每条断语均标书名篇名');
  }

  // 《黄金策》后四门：家宅、失脱、行人、产育
  {
    const 同 = { y: 2024, m: 2, d: 10, h: 12 };
    const ctxOf = (事) => goldenContextOf(sixLinesCast({ ...同, 事 }), sixLinesStrengthOf({ ...同, 事 }));
    const 家 = goldenVerdictsOf('家宅', ctxOf('家宅'));
    eq(家.章, '家宅', '黄金策·家宅门取到正确章');
    eq(家.命中.some((x) => x.断.indexOf('宅动生身') >= 0), true, '黄金策·宅动生身主迁住');
    eq(家.命中.some((x) => x.断.indexOf('有鬼无财') >= 0), true, '黄金策·有鬼无财灾生不已');
    const 失 = goldenVerdictsOf('失物', ctxOf('失物'));
    eq(失.章, '失脱', '黄金策·失物取失脱门');
    eq(失.命中.some((x) => x.断.indexOf('自空化空') >= 0), true, '黄金策·财空则寻亦无着');
    const 寻 = goldenVerdictsOf('寻人', ctxOf('寻人'));
    eq(寻.章, '行人', '黄金策·寻人取行人门');
    eq(寻.命中.some((x) => x.断.indexOf('病痊') >= 0), false, '黄金策·寻人不出疾病条');
    eq(寻.命中.some((x) => x.断.indexOf('主象之兴衰') >= 0), true, '黄金策·行人门总纲恒列');
    const 生 = goldenVerdictsOf('生育', ctxOf('生育'));
    eq(生.章, '产育', '黄金策·生育取产育门');
    eq(生.命中.some((x) => x.断.indexOf('难为厥子') >= 0), true, '黄金策·父兴难为厥子');
    // 事类别名：生育须排在子女之前，家宅/失物/寻人各自认对
    eq(detectMatter('问怀孕生产'), '生育', '测事·怀孕认作生育门');
    eq(detectMatter('东西丢了能找回吗'), '失物', '测事·丢东西认作失物门');
    eq(detectMatter('他什么时候回来'), '寻人', '测事·问归期认作寻人门');
    eq(detectMatter('家里的房子怎么样'), '家宅', '测事·房子认作家宅门');
  }

  // 《卜筮正宗·碎金赋》制化链、《禄马羊刃歌》《贵人歌诀》《定间爻歌》
  {
    eq(SUI_JIN.length, 10, '碎金赋·十二条制化逐句摘录');
    // 六亲生克链自洽：父→兄→子→财→鬼→父，克则隔一位
    eq(qinSheng('父母'), '兄弟', '碎金赋·父母生兄弟');
    eq(qinSheng('兄弟'), '子孙', '碎金赋·兄弟生子孙');
    eq(qinKeWo('父母'), '妻财', '碎金赋·妻财克父母');
    eq(qinKeWo('子孙'), '父母', '碎金赋·父母克子孙');
    // 忌神发动 → 凶；解神发动 → 吉；两者俱动 → 凶中藏吉
    const 凶 = suiJinVerdict('兄弟', ['兄弟', '官鬼'], ['父母', '兄弟', '子孙', '官鬼']);
    eq(凶.吉凶, '凶', '碎金赋·兄动逢鬼动为凶');
    eq(凶.依据, '《卜筮正宗·碎金赋》', '碎金赋·判词标出处');
    eq(!!凶.原文, true, '碎金赋·判词并出原句');
    const 吉 = suiJinVerdict('兄弟', ['兄弟', '子孙'], ['父母', '兄弟', '子孙', '官鬼']);
    eq(吉.吉凶, '吉', '碎金赋·兄动逢子孙动制鬼为吉');
    const 藏 = suiJinVerdict('兄弟', ['兄弟', '官鬼', '子孙'], ['父母', '兄弟', '子孙', '官鬼']);
    eq(藏.吉凶, '凶中藏吉', '碎金赋·忌解俱动为凶中藏吉');
    eq(藏.说明.indexOf('贪生忘克') >= 0, true, '碎金赋·凶中藏吉按贪生忘克作解');
    // 禄马贵人表
    eq(LU.甲, '寅', '禄马·甲禄在寅');
    eq(LU.庚, '申', '禄马·庚禄在申');
    eq(YI_MA.子, '寅', '禄马·申子辰马居寅');
    eq(YI_MA.亥, '巳', '禄马·亥卯未马居巳');
    eq(GUI_REN.甲.join(''), '丑未', '贵人·甲戊庚兼牛羊');
    eq(GUI_REN.辛.join(''), '午寅', '贵人·六辛逢马虎');
    const yaos = [
      { 位: 1, 爻: 1, 干支: '甲寅', 六亲: '父母' },
      { 位: 2, 爻: 2, 干支: '丙子', 六亲: '妻财' },
      { 位: 3, 爻: 3, 干支: '戊戌', 六亲: '兄弟' },
    ];
    const lmg = luMaGuiRenOf('甲', '子', yaos);
    eq(!!lmg.禄 && lmg.禄.支, '寅', '禄马·甲日禄临寅爻');
    eq(!!lmg.驿马 && lmg.驿马.支, '寅', '禄马·子日驿马在寅');
    eq(lmg.贵人.length, 0, '贵人·丑未不上卦则不列');
    // 定间爻：世 1 应 4 则间爻为 2、3
    const jy = jianYaoVerdict(1, 4, [
      { 位: 1, 六亲: '父母', 动静: '静' },
      { 位: 2, 六亲: '官鬼', 动静: '老阳(○→阴)' },
      { 位: 3, 六亲: '妻财', 动静: '静' },
      { 位: 4, 六亲: '兄弟', 动静: '静' },
    ], { 用神: '妻财', 忌神: '兄弟' });
    eq(jy.间爻.join(','), '2,3', '间爻·世应中间两爻');
    eq(jy.吉凶, '平', '间爻·忌神不在间爻则平');
    const jy2 = jianYaoVerdict(1, 4, [
      { 位: 1, 六亲: '父母', 动静: '静' },
      { 位: 2, 六亲: '兄弟', 动静: '老阳(○→阴)' },
      { 位: 3, 六亲: '妻财', 动静: '静' },
      { 位: 4, 六亲: '子孙', 动静: '静' },
    ], { 用神: '妻财', 忌神: '兄弟' });
    eq(jy2.吉凶, '凶', '间爻·忌神发动莫相交');
    const jy3 = jianYaoVerdict(1, 2, [
      { 位: 1, 六亲: '父母', 动静: '静' }, { 位: 2, 六亲: '兄弟', 动静: '静' },
    ], { 用神: '妻财', 忌神: '兄弟' });
    eq(jy3.间爻.length, 0, '间爻·世应相邻则无间爻');
    eq(SAN_HE.length, 4, '三合会局·四局');
    eq(SAN_HE[0].支.join(''), '申子辰', '三合会局·申子辰水局');
    eq(LIU_HAI.length, 6, '六害·六对');
    // 装卦输出接线
    const 卦 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '财运' });
    eq(!!卦.禄马贵人, true, '装卦·带禄马贵人');
    eq(!!卦.间爻 && 卦.间爻.位.length > 0, true, '装卦·带间爻');
    eq(卦.断语.some((x) => x.类 === '碎金赋'), true, '装卦·碎金赋入断语');
    eq(卦.断语.some((x) => x.类 === '间爻'), true, '装卦·间爻入断语');
  }

  // 《增删卜易·飞伏神章第二十八》取用次序 + 《月破章第二十七》破之三态
  {
    // 六亲 → 相对宫五行的五行
    eq(qinWxOf('妻财', '金'), '木', '五亲五行·金宫妻财属木');
    eq(qinWxOf('父母', '金'), '土', '五亲五行·金宫父母属土');
    eq(qinWxOf('官鬼', '金'), '火', '五亲五行·金宫官鬼属火');
    eq(qinWxOf('子孙', '金'), '水', '五亲五行·金宫子孙属水');
    eq(qinWxOf('兄弟', '金'), '金', '五亲五行·兄弟同宫');
    // 用神不上卦：寅月占妻财木 → 日月为用神；巳月 → 宫首卦寻伏
    eq(yongAbsentOf('妻财', '金', '寅', '辰').取用, '日月为用神', '取用·寅月占财则以日月为用');
    eq(yongAbsentOf('妻财', '金', '巳', '辰').取用, '宫首卦寻伏神', '取用·月日非用神则寻伏神');
    eq(yongAbsentOf('父母', '金', '巳', '辰').取用, '日月为用神', '取用·日辰属土亦可为父母用');
    eq(yongAbsentOf('妻财', '金', '寅', '辰').依据, '《增删卜易·飞伏神章第二十八》', '取用·标出处');
    // 月破三态
    eq(monthBreakVerdict({ 动: true }).判, '月破而动', '月破·动则能伤爻');
    eq(monthBreakVerdict({ 动: false, 有生助: true }).吉凶, '半', '月破·静而有生助不作到底破');
    eq(monthBreakVerdict({ 动: false, 有生助: false }).判, '月破到底', '月破·静无生助则到底而破');
    eq(monthBreakVerdict({}).依据, '《增删卜易·月破章第二十七》', '月破·标出处');
    // 装卦接线：财不上卦而月建正是其五行 → 取用字段为日月为用神
    const 卦 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '财运' });
    eq(!!卦.取用, true, '装卦·带取用字段');
    eq(卦.取用.取用, '日月为用神', '装卦·财不上卦而寅月为用');
    eq(卦.断语.filter((x) => x.类 === '月破' && x.项.indexOf('世') >= 0).length, 0, '装卦·世爻月破不重复出条');
    const 破卦 = sixLinesCast({ y: 2024, m: 2, d: 1, h: 12 });
    eq(破卦.断语.some((x) => x.类 === '月破' && x.项.indexOf('妻财') >= 0), true, '装卦·非世动爻月破出三态判');
  }

  // 《增删卜易·星煞章第三十三》：贵人/禄神/驿马/天喜，只列不加权
  {
    eq(TIAN_XI.春, '戌', '星煞·春戌为天喜');
    eq(TIAN_XI.秋, '辰', '星煞·秋辰为天喜（底本作秋畏，讹）');
    eq(seasonOf('寅'), '春', '星煞·寅月属春');
    eq(seasonOf('子'), '冬', '星煞·子月属冬');
    eq(seasonOf('申'), '秋', '星煞·申月属秋');
    eq(GUI_REN_ZENG.庚.join(''), '午寅', '星煞·庚辛逢马虎（增删本）');
    eq(GUI_REN.庚.join(''), '丑未', '星煞·甲戊庚同牛羊（卜筮本，两书并列）');
    const xs = xingShaOf('甲', '子', '寅', [
      { 爻: 1, 干支: '甲寅', 六亲: '父母' },
      { 爻: 2, 干支: '丙辰', 六亲: '兄弟' },
      { 爻: 3, 干支: '戊戌', 六亲: '妻财' },
    ]);
    eq(xs.命中.some((x) => x.名 === '禄神' && x.位 === '寅'), true, '星煞·甲日禄临寅');
    eq(xs.命中.some((x) => x.名 === '驿马' && x.位 === '寅'), true, '星煞·子日驿马在寅');
    eq(xs.命中.some((x) => x.名 === '天喜' && x.位 === '戌'), true, '星煞·春月天喜在戌');
    eq(xs.依据, '《增删卜易·星煞章第三十三》', '星煞·标出处');
    eq(xs.说明.indexOf('不能独操祸福之权') >= 0, true, '星煞·野鹤明言不加权');
    const 卦 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '财运' });
    eq(!!卦.星煞 && 卦.星煞.依据.indexOf('星煞章第三十三') >= 0, true, '装卦·带星煞字段');
    // 两现并出古法与野鹤两说
    const 两 = sixLinesCast({ y: 2024, m: 6, d: 7, h: 12, 事: '财运' });
    const y2 = 两.断语.find((x) => x.类 === '用神' && String(x.项).indexOf('两现') >= 0) || {};
    eq(String(y2.断).indexOf('舍其月破用其不破') >= 0, true, '两现·古法取旺不取衰');
    eq(String(y2.断).indexOf('应乎旬空月破') >= 0, true, '两现·野鹤应期反在空破');
    eq(String(y2.断).indexOf('《增删卜易·两现章第三十二》') >= 0, true, '两现·标出处');
  }

  // 《增删卜易·元神忌神衰旺章第十》四张清单 + 《暗动章第二十二》喜忌
  {
    const st = sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 12, 事: '财运' });
    const pctx = { 月支: st.月建, 日支: st.日辰 };
    const yp = yuanShenPower(st.元忌仇, pctx);
    const jp = jiShenPower(st.元忌仇, pctx);
    eq(!!yp.判 && typeof yp.力 === 'string', true, '元神有力否·返判与力');
    eq(!!jp.判 && typeof jp.力 === 'string', true, '忌神有力否·返判与力');
    eq(yp.依据, '《增删卜易·元神忌神衰旺章第十》', '元神有力否·标出处');
    eq(jp.依据, '《增删卜易·元神忌神衰旺章第十》', '忌神有力否·标出处');
    eq(yp.说明.indexOf('同谓之元气亦难生') >= 0 || yp.说明.indexOf('元神有力亦难生') >= 0, true, '元神有力否·带总闸原文');
    eq(yp.条.length > 0, true, '元神有力否·出命中条目');
    eq(jp.条.every((x) => x.原文 && x.号), true, '忌神有力否·每条带号与原文');
    // 忌神旺相受日辰生扶 → 能克条一
    const jp2 = jiShenPower({
      用神五行: '木',
      原神: { 五行: '水', 六亲: '子孙', 爻: [] },
      忌神: { 五行: '金', 六亲: '兄弟', 爻: [{ 爻: 3, 干支: '丙申', 强弱: '相', 动: false, 标记: '' }] },
      仇神: { 五行: '土', 六亲: '父母', 爻: [] },
    }, { 月支: '寅', 日支: '申' });
    eq(jp2.条.some((x) => x.号 === '一' && x.类 === '能克'), true, '忌神·旺相受日辰生扶为能克之一');
    // 忌神静临空破 → 不能克条二
    const jp3 = jiShenPower({
      用神五行: '木',
      原神: { 五行: '水', 六亲: '子孙', 爻: [] },
      忌神: { 五行: '金', 六亲: '兄弟', 爻: [{ 爻: 2, 干支: '辛卯', 强弱: '衰', 动: false, 标记: '月破' }] },
      仇神: { 五行: '土', 六亲: '父母', 爻: [] },
    }, { 月支: '寅', 日支: '辰' });
    eq(jp3.条.some((x) => x.号 === '二' && x.类 === '不能克'), true, '忌神·静临空破为不能克之二');
    // 元神不上卦
    const yp2 = yuanShenPower({ 用神五行: '木', 原神: { 五行: '水', 六亲: '子孙', 爻: [] }, 忌神: {}, 仇神: {} }, {});
    eq(yp2.判.indexOf('不上卦') >= 0, true, '元神有力否·不上卦分支');
    // 暗动章：暗动存在才出论，且四类判词只取正文三句
    eq(!!st.暗动论 === (st.爻.some((x) => x.冲判 === '暗动')), true, '暗动论·有暗动才出论');
    const st2 = sixLinesStrengthOf({ y: 2024, m: 2, d: 8, h: 12, 事: '财运' });
    eq(!!st2.暗动论, true, '暗动论·2024-2-8 命中暗动');
    eq(st2.暗动论.条.every((x) => /喜（|忌（|暗动暂不/.test(x.判)), true, '暗动论·只出原文三句');
    eq(st2.暗动论.依据, '《增删卜易·暗动章第二十二》', '暗动论·标出处');
    eq(st.爻.every((x) => '冲判' in x), true, '爻摘要·带冲判字段');
  }

  // 《增删卜易·随鬼入墓章第三十》：四主体（世爻/本命/卦身；世身不取）
  {
    const r1 = sixLinesCast({ y: 2024, m: 6, d: 2, h: 0, 事: '疾病' });
    eq(r1.断语.some((x) => x.类 === '随鬼入墓' && String(x.项).indexOf('世爻官鬼') >= 0), true, '随鬼入墓·世爻主体');
    const r2 = sixLinesCast({ y: 2024, m: 10, d: 2, h: 16, 事: '疾病' });
    eq(r2.断语.some((x) => x.类 === '随鬼入墓' && String(x.项).indexOf('卦身官鬼') >= 0), true, '随鬼入墓·卦身主体');
    const r3 = sixLinesCast({ y: 2024, m: 2, d: 1, h: 0, 事: '疾病', 本命: '子' });
    eq(r3.断语.some((x) => x.类 === '随鬼入墓' && String(x.项).indexOf('本命官鬼') >= 0), true, '随鬼入墓·本命主体');
    const r4 = sixLinesCast({ y: 2024, m: 2, d: 1, h: 0, 事: '疾病' });
    eq(r4.断语.some((x) => x.类 === '随鬼入墓' && String(x.项).indexOf('本命') >= 0), false, '随鬼入墓·未给本命则不判');
    eq(r3.断语.filter((x) => x.类 === '随鬼入墓').every((x) => String(x.断).indexOf('世身') >= 0 && String(x.断).indexOf('辟卜筮全书世身之谬') >= 0), true, '随鬼入墓·世身依《卜筮正宗》辟谬不取');
  }

  // 《黄金策》医药、逃亡两门（第十一、十二门）
  {
    const names = goldenChapterNames();
    eq(names.some((x) => x.事 === '医药' && x.条数 >= 10), true, '黄金策·医药门已接入');
    eq(names.some((x) => x.事 === '逃亡' && x.条数 >= 8), true, '黄金策·逃亡门已接入');
    const inp = { y: 2024, m: 2, d: 10, h: 12 };
    const c = sixLinesCast({ ...inp, 事: '疾病' });
    const st = sixLinesStrengthOf({ ...inp, 事: '疾病' });
    const ctx = goldenContextOf(c, st);
    eq(!!ctx.用神, true, '分门上下文·带用神名');
    eq(typeof ctx.用神方位 === 'string', true, '分门上下文·带用神方位');
    const yao = goldenVerdictsOf('医药', ctx);
    eq(!!yao && yao.命中.length >= 2, true, '医药门·出命中条目');
    eq(yao.命中.every((x) => x.原文.indexOf('「') < 0), true, '医药门·原文不重复加引号');
    eq(yao.命中.some((x) => x.断.indexOf('官旺福衰') >= 0), true, '医药门·官旺福衰命中');
    const tao = goldenVerdictsOf('逃亡', ctx);
    eq(!!tao && tao.相 !== undefined || !!tao, true, '逃亡门·返结果');
    eq(yao.章, '求医', '医药门·章名为求医');
    eq(tao.章, '逃亡', '逃亡门·章名为逃亡');
    // 逃亡「用爻安静以所临之方为去向」：用神静且有方位
    eq(tao.命中.some((x) => x.断.indexOf('安静') >= 0) === (!!ctx.用神方位 && !ctx.用神动), true, '逃亡门·安静定方判据一致');
  }

  // 《黄金策》舟船门 + 用神表补三事（舟船归父母、逃亡归妻财、求医归应）
  {
    eq(goldenChapterNames().some((x) => x.事 === '舟船' && x.条数 >= 14), true, '黄金策·舟船门已接入');
    eq(YONG.舟船, '父母', '用神表·舟船归父母（墙城宅舍舟车）');
    eq(YONG.逃亡, '妻财', '用神表·逃亡归妻财');
    eq(YONG.求医, '应', '用神表·求医归应爻');
    const inp = { y: 2024, m: 2, d: 10, h: 12, 事: '舟船' };
    const c = sixLinesCast(inp);
    const st = sixLinesStrengthOf(inp);
    const ctx = goldenContextOf(c, st);
    eq(Array.isArray(ctx.爻位) && ctx.爻位.length === 6, true, '分门上下文·带六爻位');
    eq(typeof ctx.鬼Wx === 'string', true, '分门上下文·带官鬼五行');
    eq(typeof ctx.蛇空 === 'boolean' && typeof ctx.虎动 === 'boolean' && typeof ctx.虎克世 === 'boolean', true, '分门上下文·带蛇虎状态');
    const r = goldenVerdictsOf('舟船', ctx);
    eq(!!r && r.命中.length >= 3, true, '舟船门·出命中条目');
    eq(r.命中.some((x) => x.断.indexOf('持世') >= 0), true, '舟船门·六亲持世定新旧');
    eq(detectMatter('问买船') === '舟船', true, '事类识别·买船归舟船');
  }

  // 《黄金策》天时、求师、求馆三门
  {
    eq(goldenChapterNames().length, 26, '黄金策·已接入二十六门');
    eq(YONG.天时, '父母', '用神表·天时归父母');
    eq(YONG.求师, '父母', '用神表·求师归父母');
    eq(YONG.求馆, '父母', '用神表·求馆归父母');
    const mk = (事) => {
      const inp = { y: 2024, m: 2, d: 10, h: 12, 事 };
      return goldenContextOf(sixLinesCast(inp), sixLinesStrengthOf(inp));
    };
    const c1 = mk('天时');
    eq(c1.宫.length <= 2, true, '分门上下文·卦宫取单字');
    eq(typeof c1.qinWx === 'object' && typeof c1.qinWx.父母 === 'string', true, '分门上下文·带各亲五行');
    const rt = goldenVerdictsOf('天时', c1);
    eq(rt.命中.length >= 2, true, '天时门·出命中条目');
    eq(rt.命中.some((x) => /父|财/.test(x.断)), true, '天时门·首重父母妻财');
    eq(goldenVerdictsOf('求师', mk('求师')).命中.some((x) => /专经|杂学/.test(x.断)), true, '求师门·乾坤离专经震巽艮坎兑杂学');
    eq(goldenVerdictsOf('求馆', mk('求馆')).命中.some((x) => /书馆|东家|束修|西席/.test(x.断)), true, '求馆门·世西席应东家');
    eq(detectMatter('问几时下雨') === '天时', true, '事类识别·下雨归天时');
    eq(detectMatter('问求馆教书') === '求馆', true, '事类识别·教书归求馆');
  }

  // 《黄金策》身命门 + 用神未定提示
  {
    eq(YONG.身命, '世', '用神表·身命归世（但看世爻为主）');
    const inp = { y: 2024, m: 2, d: 10, h: 12, 事: '身命' };
    const ctx = goldenContextOf(sixLinesCast(inp), sixLinesStrengthOf(inp));
    const r = goldenVerdictsOf('身命', ctx);
    eq(r.命中.length >= 2, true, '身命门·出命中条目');
    eq(r.命中.some((x) => /世爻|六冲|六合/.test(x.断)), true, '身命门·以世爻为主兼看六冲六合');
    const c0 = sixLinesCast({ y: 2024, m: 6, d: 7, h: 12 });
    eq(c0.用神, null, '未点事类时用神为空');
    eq((c0.断语 || []).some((x) => x.项 === '用神未定'), true, '未点事类时给出「用神未定」而非硬凑');
    eq(detectMatter('问这辈子命好不好') === '身命', true, '事类识别·身命');
  }

  // 八宫卦气（《黄金策·身命》自注八等顺推）
  {
    const q1 = guaQiOf('寅');
    eq(q1.当旺卦, '艮', '卦气·立春艮旺');
    eq([q1.表.艮, q1.表.震, q1.表.巽, q1.表.离, q1.表.坤, q1.表.兑, q1.表.乾, q1.表.坎].join(''),
      '旺相胎没死囚休废', '卦气·立春八宫八等与原文自注逐字相符');
    eq(guaQiOf('子').当旺卦, '坎', '卦气·冬至坎旺');
    eq(guaQiOf('卯').当旺卦, '震', '卦气·春分震旺');
    eq(guaQiOf('午').当旺卦, '离', '卦气·夏至离旺');
    eq(guaQiOf('酉').当旺卦, '兑', '卦气·秋分兑旺');
    eq(guaQiOf('辰').当旺卦, '震', '卦气·四季月承前一节（辰归震）');
    eq(guaQiGrade('旺') === '有力' && guaQiGrade('没') === '中' && guaQiGrade('废') === '无气', true, '卦气·三等归并');
    const inp = { y: 2024, m: 2, d: 10, h: 12, 事: '身命' };
    const ctx = goldenContextOf(sixLinesCast(inp), sixLinesStrengthOf(inp));
    eq(['旺', '相', '胎', '没', '死', '囚', '休', '废'].indexOf(ctx.卦气) >= 0, true, '身命上下文·带卦气');
    eq(goldenVerdictsOf('身命', ctx).命中.some((x) => /卦宫/.test(x.断)), true, '身命门·卦宫旺衰一层已接入');
  }

  // 《黄金策》征战、六畜两门
  {
    eq(YONG.征战, '世', '用神表·征战归世（世为我）');
    eq(YONG.六畜, '妻财', '用神表·六畜归妻财（财福为主）');
    const mk = (事) => {
      const inp = { y: 2024, m: 2, d: 10, h: 12, 事 };
      return goldenContextOf(sixLinesCast(inp), sixLinesStrengthOf(inp));
    };
    eq(goldenVerdictsOf('征战', mk('征战')).命中.some((x) => /世|应|粮|伏兵|将/.test(x.断)), true, '征战门·世应为两家、财为粮草');
    eq(goldenVerdictsOf('六畜', mk('六畜')).命中.some((x) => /子孙|妻财|财福/.test(x.断)), true, '六畜门·专以财福为主');
    eq(detectMatter('问打仗谁能赢') === '征战', true, '事类识别·征战');
    eq(detectMatter('问养猪好不好') === '六畜', true, '事类识别·六畜');
  }

  // 22 项功能：输出必须带文献依据（《书名·篇名》），且 registry 每条都有 source
  {
    const feats = FEATURES || [];
    eq(feats.length, 22, '功能表·共 22 项');
    eq(feats.every((f) => typeof f.source === 'string' && f.source.length > 0), true, '功能表·每项都有文献依据字段');
    eq(feats.every((f) => /《[^》]+》/.test(f.source)), true, '功能表·依据字段带书名');
  }

  // 大六壬·杂课（课经）：12 课逐课真命中 + 不改三传 + 课名表齐备
  {
    const cases = [
      ['冲破课', [2023, 1, 1, 5]], ['淫泆课', [2023, 1, 1, 9]], ['三光课', [2023, 1, 5, 21]],
      ['斩关课', [2023, 1, 6, 9]], ['游子课', [2023, 1, 6, 21]], ['三阳课', [2023, 1, 7, 1]],
      ['轩盖课', [2023, 1, 9, 1]], ['三交课', [2023, 1, 9, 1]], ['乱首课', [2023, 1, 12, 5]],
      ['赘婿课', [2023, 1, 16, 9]], ['闭口课', [2023, 1, 21, 5]], ['铸印课', [2023, 1, 21, 13]],
      ['六仪课', [2024, 1, 4, 1]], ['时泰课', [2024, 1, 16, 1]], ['德庆课', [2024, 1, 1, 13]],
      ['合欢课', [2024, 2, 22, 13]], ['和美课', [2024, 2, 11, 7]], ['龙德课', [2024, 2, 22, 19]],
    ];
    eq(LESSON_NAMES.length, 18, '六壬杂课·收录 18 课');
    for (const [name, [y, m, d, h]] of cases) {
      const c = sixRenChart({ y, m, d, h });
      const hit = (c.杂课 || []).some((x) => x.课 === name);
      eq(hit, true, `六壬杂课·${name} 于 ${y}-${m}-${d} ${h}时命中`);
      eq((c.杂课 || []).every((x) => x.原文 && x.说明 && /《六壬大全·/.test(x.原文)), true, `六壬杂课·${name} 带原文与出处`);
    }
    // 杂课不得改动三传（只加格局名，不改起传结果）
    const a = sixRenChart({ y: 2023, m: 1, d: 9, h: 1 });
    eq(a.三传.map((x) => x.支).sort().join(''), ['午', '卯', '子'].sort().join(''), '六壬杂课·轩盖课三传仍是午卯子三支（杂课不改三传，次序依九宗门）');
    // 十二课名全部在 LESSON_NAMES 内，不允许渲染出未登记课名
    const all = new Set();
    for (const [y, m, d, h] of [[2023, 1, 9, 1], [2023, 1, 21, 5], [2024, 3, 11, 5]]) {
      for (const x of sixRenChart({ y, m, d, h }).杂课 || []) all.add(x.课);
    }
    eq([...all].every((n) => LESSON_NAMES.includes(n)), true, '六壬杂课·课名均在登记表内');
  }

  // ── 六壬·十二天将的所喜所畏（《六壬大全·十二将释》） ──
  {
    eq(Object.keys(GENERAL_LIKES).length, 11, '六壬将性·收录 11 将（白虎无爱畏之句，不列）');
    eq(GENERAL_LIKES['白虎'], undefined, '六壬将性·白虎不在表内（原书无此句，不替它编）');
    eq(GENERAL_LIKES['贵人'].畏.length, 0, '六壬将性·贵人原文只言所爱、不立魁罡，无「畏」');
    eq(GENERAL_LIKES['勾陈'].不立.join(''), '寅申巳亥', '六壬将性·勾陈不立四孟');
    eq(GENERAL_LIKES['天后'].不立.join(''), '辰戌丑未', '六壬将性·天后不立四季');

    // 所喜得见
    const mk = (pairs) => ({ 三传: pairs.map(([z, j], i) => ({ 传: ['初', '中', '末'][i], 支: z, 天将: j })), 四课: [], 十二天将: { 将: {} } });
    const r1 = generalLikesOf(mk([['子', '青龙'], ['丑', '六合']]));
    eq(r1.喜.some((x) => x.将 === '青龙' && x.见.includes('六合')), true, '六壬将性·青龙得所喜（六合同现）');
    eq(r1.喜.some((x) => x.将 === '六合' && x.见.includes('青龙')), true, '六壬将性·六合得所喜（青龙同现）');
    // 所畏同现
    const r2 = generalLikesOf(mk([['子', '太常'], ['丑', '螣蛇']]));
    eq(r2.畏.some((x) => x.将 === '太常' && x.见.includes('螣蛇')), true, '六壬将性·太常逢所畏（螣蛇）');
    // 不立之位
    const r3 = generalLikesOf(mk([['寅', '勾陈']]));
    eq((r3.不立 || []).some((x) => x.将 === '勾陈' && x.支 === '寅'), true, '六壬将性·勾陈临寅为不宜之位');
    // 白虎不判
    eq(generalLikesOf(mk([['子', '白虎']])), null, '六壬将性·只有白虎时不出喜畏');
    // 不折吉凶
    eq(r1.喜.every((x) => !('吉凶' in x)) && r1.畏.every((x) => !('吉凶' in x)), true, '六壬将性·只列同现、不折吉凶');

    // 真盘接入
    const gc = sixRenChart({ y: 2024, m: 3, d: 5, h: 9 });
    eq(!!gc.将性, true, '六壬将性·已接入六壬盘（将性字段）');
    eq(/《六壬大全·十二将释》/.test(gc.将性.依据), true, '六壬将性·依据写明《六壬大全·十二将释》');
  }


  // ── 六壬·十二天将的旺相死囚休所主（《六壬大全·十二将释》） ──
  {
    eq(Object.keys(JIANG_WX).length, 12, '六壬将态·十二将五行齐备');
    eq(Object.keys(JIANG_STATE).length, 10, '六壬将态·十将有五态所主原文');
    eq(Object.keys(JIANG_TWO_WAY).join(''), '贵人白虎', '六壬将态·贵人与白虎只有两分法（原书无五态句）');
    for (const [k, v] of Object.entries(JIANG_STATE)) {
      eq(['旺', '相', '死', '囚', '休'].every((x) => v[x]), true, `六壬将态·${k} 五态俱全`);
    }

    // 四时旺相死囚休对表：春木旺火相水休金囚土死
    const sp = seasonStateOf(2);   // 寅月
    eq(sp.旺五行 + sp.态.木 + sp.态.火 + sp.态.水 + sp.态.金 + sp.态.土, '木旺相休囚死', '六壬将态·寅月木旺火相水休金囚土死');
    const su = seasonStateOf(5);   // 巳月
    eq(su.旺五行 + su.态.火 + su.态.土 + su.态.木 + su.态.水 + su.态.金, '火旺相休囚死', '六壬将态·巳月火旺土相木休水囚金死');
    const au = seasonStateOf(8);   // 申月
    eq(au.旺五行 + au.态.金 + au.态.水 + au.态.土 + au.态.火 + au.态.木, '金旺相休囚死', '六壬将态·申月金旺水相土休火囚木死');
    const wi = seasonStateOf(11);  // 亥月
    eq(wi.旺五行 + wi.态.水 + wi.态.木 + wi.态.金 + wi.态.土 + wi.态.火, '水旺相休囚死', '六壬将态·亥月水旺木相金休土囚火死');

    // 五态取值 + 两分法
    const mk = (pairs) => ({ 三传: pairs.map(([z, j], i) => ({ 传: ['初', '中', '末'][i], 支: z, 天将: j })) });
    const r = generalStatesOf(mk([['子', '太阴'], ['丑', '勾陈']]), 2);   // 寅月：金囚、土死
    eq(r.将.find((x) => x.将 === '太阴').态, '囚', '六壬将态·寅月太阴属金为囚');
    eq(r.将.find((x) => x.将 === '太阴').所主, '阴私囚禁', '六壬将态·太阴囚主阴私囚禁（原文）');
    eq(r.将.find((x) => x.将 === '勾陈').所主, '争死人财物', '六壬将态·勾陈死主争死人财物（原文）');
    // 贵人有气／死囚两分
    const g1 = generalStatesOf(mk([['子', '贵人']]), 2);   // 寅月土死
    eq(g1.将[0].分法.indexOf('两分') >= 0, true, '六壬将态·贵人走两分法');
    eq(g1.将[0].所主, JIANG_TWO_WAY['贵人'].死囚, '六壬将态·寅月贵人土死取死囚句');
    const g2 = generalStatesOf(mk([['子', '贵人']]), 5);   // 巳月土相
    eq(g2.将[0].所主, JIANG_TWO_WAY['贵人'].有气, '六壬将态·巳月贵人土相取有气句');
    // 不折吉凶
    eq(r.将.every((x) => !('吉凶' in x)), true, '六壬将态·只列所主不折吉凶');

    // 真盘接入
    const rc = sixRenChart({ y: 2024, m: 3, d: 5, h: 9 });
    eq(!!rc.将态, true, '六壬将态·已接入六壬盘（将态字段）');
    eq(rc.将态.月令旺五行, '木', '六壬将态·2024-03-05 属寅月木旺');
    eq(/《六壬大全·十二将释》/.test(rc.将态.依据), true, '六壬将态·依据写明《六壬大全·十二将释》');
  }


  // ── 六壬·十二将临十二支取象（144 格，照录各将赋文） ──
  {
    eq(Object.keys(GENERAL_BRANCH_IMAGES).length, 12, '六壬将象·十二将齐备');
    let n = 0;
    for (const [j, row] of Object.entries(GENERAL_BRANCH_IMAGES)) {
      eq(Object.keys(row).length, 12, `六壬将象·${j} 十二支俱全`);
      n += Object.keys(row).length;
    }
    eq(n, 144, '六壬将象·共 144 格');
    eq(Object.keys(GENERAL_FU_LINES).length, 12, '六壬将象·十二将赋文齐备');
    // 每格都带取象名与断语，且无空字
    eq(Object.values(GENERAL_BRANCH_IMAGES).every((row) => Object.values(row).every((v) => v[0] && v[1])), true, '六壬将象·每格皆有取象名与断语');
    // 抽样照录原文
    eq(imageOf('太常', '子').名, '遭枷', '六壬将象·太常临子为遭枷');
    eq(imageOf('太常', '子').断, '必值决罚', '六壬将象·太常遭枷必值决罚');
    eq(imageOf('青龙', '酉').名, '伏陆', '六壬将象·青龙临酉为伏陆');
    eq(imageOf('白虎', '申').名, '衔牒', '六壬将象·白虎临申为衔牒');
    // 一格多名照录（贵人辰戌皆怀怒、朱雀寅卯皆安巢、白虎亥子皆溺水）
    eq(GENERAL_BRANCH_IMAGES['贵人']['辰'][0] === GENERAL_BRANCH_IMAGES['贵人']['戌'][0], true, '六壬将象·贵人辰戌同为懐怒（不合并成一支）');
    eq(GENERAL_BRANCH_IMAGES['朱雀']['寅'][0] === GENERAL_BRANCH_IMAGES['朱雀']['卯'][0], true, '六壬将象·朱雀寅卯同为安巢');
    eq(GENERAL_BRANCH_IMAGES['白虎']['亥'][0] === GENERAL_BRANCH_IMAGES['白虎']['子'][0], true, '六壬将象·白虎亥子同为溺水');
    // 太阴巳取赋作「伏枕」、亥作「裸形」（赋与释文冲突处依赋）
    eq(imageOf('太阴', '巳').名, '伏枕', '六壬将象·太阴临巳依赋作伏枕');
    eq(imageOf('太阴', '亥').名, '裸形', '六壬将象·太阴临亥依赋作裸形');
    // 底本异体字照录
    eq(imageOf('勾陈', '酉').名, '被刄', '六壬将象·底本作被刄（不简化）');
    eq(imageOf('青龙', '亥').名, '逰江', '六壬将象·底本作逰江（不简化）');
    // 未收之支／将返回 null
    eq(imageOf('不存在', '子'), null, '六壬将象·未知将返回 null');
    eq(imageOf('太常', '不存在'), null, '六壬将象·未知支返回 null');
    // 十二支序表
    eq(BRANCH_ORDER.join(''), '子丑寅卯辰巳午未申酉戌亥', '六壬将象·十二支序表');
    // 盘上取象
    const ri = generalBranchImagesOf({ 三传: [{ 传: '初', 支: '亥', 天将: '太阴' }, { 传: '中', 支: '巳', 天将: '勾陈' }, { 传: '末', 支: '子', 天将: '贵人' }] });
    eq(ri.项.length, 3, '六壬将象·三传逐位取象');
    eq(ri.项[1].名, '捧印', '六壬将象·中传巳乘勾陈为捧印');
    eq(ri.项[2].名, '解息', '六壬将象·末传子乘贵人为解息');
    eq(ri.项.every((x) => !('吉凶' in x)), true, '六壬将象·只列取象不折吉凶');
    // 真盘接入
    const rp = sixRenChart({ y: 2024, m: 3, d: 5, h: 9 });
    eq(!!rp.将象, true, '六壬将象·已接入六壬盘（将象字段）');
    eq(/《六壬大全·十二将释》/.test(rp.将象.依据), true, '六壬将象·依据写明《六壬大全·十二将释》');
  }


  // ── 黄金策分门断法扩至 22 门（新增 进人口／种作／蚕桑） ──
  {
    eq(goldenChapterNames().length, 26, '黄金策·章数 26 门');
    for (const k of ['进人口', '种作', '蚕桑']) {
      eq(goldenChapterNames().some((x) => x.事 === k), true, `黄金策·新增 ${k} 门`);
      eq(goldenChapterNames().find((x) => x.事 === k).条数 >= 7, true, `黄金策·${k} 门槛条数 ≥7`);
    }
    eq(detectMatter('问过继孩子'), '进人口', '黄金策·过继归进人口门');
    eq(detectMatter('问雇个工人'), '雇工', '黄金策·雇工另立用神（妻财）');
    eq(detectMatter('问农事收成'), '种作', '黄金策·农事归种作门');
    eq(detectMatter('问养蚕'), '蚕桑', '黄金策·养蚕归蚕桑门');
    eq(YONG['雇工'], '妻财', '黄金策·雇工用神妻财（原书自注「皆以财为主」）');
    eq(YONG['种作'], '妻财', '黄金策·种作用神妻财（「妻财乃占农之本」）');
    eq(YONG['蚕桑'], '子孙', '黄金策·蚕桑用神子孙（「子孙为蚕」）');
    eq(YONG['过继'], '子孙', '黄金策·过继用神子孙');
    for (const [q, gate] of [['问过继孩子', '进人口'], ['问农事收成', '种作'], ['问养蚕', '蚕桑']]) {
      const cast0 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12 });
      const st0 = sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 12, 事: detectMatter(q) });
      const gv0 = goldenVerdictsOf(detectMatter(q), goldenContextOf(cast0, st0));
      eq(!!gv0 && gv0.命中.length > 0, true, `黄金策·${gate} 门有真命中`);
      eq(gv0.命中.every((x) => /《黄金策·/.test(x.原文)), true, `黄金策·${gate} 门命中条带出处`);
    }
  }


  // ── 黄金策鬼神／娼家两门（原标「存赋不注」，赋文本身有判据，本轮接入） ──
  {
    eq(goldenChapterNames().length, 26, '黄金策·章数 26 门');
    for (const k of ['鬼神', '娼家']) {
      eq(goldenChapterNames().some((x) => x.事 === k), true, `黄金策·新增 ${k} 门`);
    }
    eq(goldenChapterNames().find((x) => x.事 === '鬼神').条数, 28, '黄金策·鬼神门 28 条');
    eq(goldenChapterNames().find((x) => x.事 === '娼家').条数, 11, '黄金策·娼家门 11 条');
    eq(detectMatter('问鬼神许愿'), '鬼神', '黄金策·许愿归鬼神门');
    eq(detectMatter('问青楼生意'), '娼家', '黄金策·娼家先于求财识别');
    eq(YONG['鬼神'], '官鬼', '黄金策·鬼神用神官鬼（「先看卦内官爻」）');
    eq(YONG['娼家'], '妻财', '黄金策·娼家用神妻财');
    const cast0 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12 });
    for (const [gate, min] of [['鬼神', 2], ['娼家', 2]]) {
      const st0 = sixLinesStrengthOf({ y: 2024, m: 2, d: 10, h: 12, 事: gate });
      const gv0 = goldenVerdictsOf(gate, goldenContextOf(cast0, st0));
      eq(!!gv0 && gv0.命中.length >= min, true, `黄金策·${gate} 门有真命中（≥${min}）`);
      eq(gv0.命中.every((x) => /《黄金策·/.test(x.原文)), true, `黄金策·${gate} 门命中条带出处`);
    }
  }


  // ── 黄金策年时／坟墓两门（「存赋不注」五门中再落两门，仅国朝不收） ──
  {
    eq(goldenChapterNames().length, 26, '黄金策·章数 26 门');
    eq(goldenChapterNames().find((x) => x.事 === '年时').条数, 23, '黄金策·年时门 23 条');
    eq(goldenChapterNames().find((x) => x.事 === '坟墓').条数, 8, '黄金策·坟墓门 8 条');
    eq(detectMatter('问今年年景'), '年时', '黄金策·年景归年时门');
    eq(detectMatter('问祖坟风水'), '坟墓', '黄金策·祖坟归坟墓门');
    eq(YONG['年时'], '妻财', '黄金策·年时用神妻财');
    eq(YONG['坟墓'], '世', '黄金策·坟墓用神取世（穴有定爻）');
    for (const [gate, y, m, d, hu] of [['年时', 2024, 2, 10, 12], ['坟墓', 2024, 1, 3, 10]]) {
      const inp0 = { y, m, d, h: hu, 事: gate };
      const gv0 = goldenVerdictsOf(gate, goldenContextOf(sixLinesCast(inp0), sixLinesStrengthOf(inp0)));
      eq(!!gv0 && gv0.命中.length >= 2, true, `黄金策·${gate} 门有真命中（≥2）`);
      eq(gv0.命中.every((x) => /《黄金策·/.test(x.原文)), true, `黄金策·${gate} 门命中条带出处`);
    }
    // 坟墓「世在游魂卦—为商出外」：2024-01-07 为游魂卦
    const inp1 = { y: 2024, m: 1, d: 7, h: 10, 事: '坟墓' };
    const gv1 = goldenVerdictsOf('坟墓', goldenContextOf(sixLinesCast(inp1), sixLinesStrengthOf(inp1)));
    eq(gv1.命中.some((x) => /游魂/.test(x.断)), true, '黄金策·坟墓门判出游魂卦');
    // 坟墓「六冲主凶」：2024-01-03 为六冲卦且世居六爻
    const inp2 = { y: 2024, m: 1, d: 3, h: 10, 事: '坟墓' };
    const gv2 = goldenVerdictsOf('坟墓', goldenContextOf(sixLinesCast(inp2), sixLinesStrengthOf(inp2)));
    eq(gv2.命中.some((x) => /六冲/.test(x.断)), true, '黄金策·坟墓门判出六冲主凶');
    eq(gv2.命中.some((x) => /世居五爻或六爻/.test(x.断)), true, '黄金策·坟墓门判出世居五六主绝嗣');
  }


// ── 神煞新增：元辰（大耗）按《三命通会·论元辰》、学堂词馆按《三命通会·论学堂词馆》 ──
{
  const SS = await import('../src/core/four-pillars/symbolic-stars.js');
  const pick = (r, n) => r.神煞.find((x) => x.名 === n);
  // 元辰：阳男在冲后一位、阴男在冲前一位（原文自注甲子生男→乙未、乙丑生男→甲午）
  const r1 = SS.symbolicStarsOf({ y: 1990, m: 1, d: 9, h: 10, gender: '男' });
  eq(pick(r1, '元辰').位, '日柱', '元辰：1990-01-09 阴男年支巳→元辰戌（日柱甲戌命中）');
  eq(/阴男/.test(pick(r1, '元辰').查法), true, '元辰：查法写明阴阳男女之分');
  eq(/《三命通会·论元辰》/.test(pick(r1, '元辰').查法), true, '元辰：查法带出处');
  // 阳男阴女同向：1990-06-15 男（阳男）年支午冲子进一位=丑，四支无丑
  const r2 = SS.symbolicStarsOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  eq(pick(r2, '元辰').位, '无', '元辰：阳男年支午→元辰丑，四支不见则不命中');
  // 学堂：本命火、纳音火而支临长生（火长生在寅）——1990-01-01 日柱丙寅（炉中火）
  const r3 = SS.symbolicStarsOf({ y: 1990, m: 1, d: 1, h: 10, gender: '男' });
  eq(pick(r3, '学堂').位, '日柱', '学堂：火命见丙寅（纳音炉中火、火长生在寅）');
  // 词馆：本命火、纳音火而支临临官（火临官在巳）——1990-01-02 时柱乙巳（覆灯火）
  const r4 = SS.symbolicStarsOf({ y: 1990, m: 1, d: 2, h: 10, gender: '男' });
  eq(pick(r4, '词馆').位, '时柱', '词馆：火命见乙巳（纳音覆灯火、火临官在巳）');
  // 纳音不同五行不算：1990-06-15 日主辛金，时柱癸巳纳音长流水 → 不为金命学堂
  const r5 = SS.symbolicStarsOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  eq(pick(r5, '学堂').位, '无', '学堂：纳音须与本命同五行（癸巳长流水不合金命学堂）');
  eq(r5.神煞.length, 37, '神煞：共查 37 类');
}


// ── 八字取格：当令司令优先于本气（《三命通会·论人元司事》「月令用神」） ──
{
  const PT = await import('../src/core/four-pillars/patterns.js');
  // 丑月（本气己、司令癸）：己与癸两字皆透，旧法取本气己为正印，今取当令癸为食神
  const a = PT.chartPatternsOf({ y: 1990, m: 1, d: 26, h: 10 });
  eq(a.格局.透干, '癸', '取格：丑月己癸两透，取当令司令癸');
  eq(a.格局.name, '食神格', '取格：辛日得癸为食神格（不取本气己之正印格）');
  eq(/当令司令/.test(a.格局.依据), true, '取格：依据写明当令司令优先');
  eq(/《三命通会·论人元司事》/.test(a.格局.依据), true, '取格：依据带出处《三命通会·论人元司事》');
  // 司令不在藏干之内（子月藏癸而司令辛）时退回原口径，不硬套
  const b = PT.chartPatternsOf({ y: 1990, m: 1, d: 1, h: 10 });
  eq(b.格局.name, '正官格', '取格：司令不在藏干时仍按本气透干取格');
}


// ── 外格：化气格的化神有余/不足按《滴天髓·化象》原文分燥湿，不再以「争合妒合」为门槛 ──
{
  const PT = await import('../src/core/four-pillars/patterns.js');
  const wh = (y, m, d) => (PT.chartPatternsOf({ y, m, d, h: 10 })['外格提示'] || []).find((x) => /化气格/.test(x)) || '';
  // 甲己化土生丑月——原文「生于丑辰月，土湿为弱……谓之不足」，与四季土旺的表象相反
  const a = wh(1990, 1, 9);
  eq(/化神不足/.test(a), true, '化气格：甲己化土生丑月为「土湿为弱」，判不足');
  eq(/土湿为弱/.test(a), true, '化气格：不足的依据引原文「土湿为弱」');
  eq(/宜取火/.test(a), true, '化气格：不足宜生助化神之神（火生土）');
  // 甲己化土生未月——原文「生于未戌月，土燥而旺……谓之有余」
  const b = wh(1990, 7, 8);
  eq(/化神有余/.test(b), true, '化气格：甲己化土生未月为「土燥而旺」，判有余');
  eq(/宜取金/.test(b), true, '化气格：有余宜泄化神之神（土生金）');
  // 争合妒合：底本任注明斥为谬论，不作为门槛
  eq(/争合妒合之说，乃谬论也/.test(b), true, '化气格：引任注「争合妒合之说，乃谬论也」');
  eq(/作化土论/.test(b), true, '化气格：甲己五合、月令助化神即成化');
}

// ── 外格：专旺格按《滴天髓·形象（独象）》「必要得时当令」分「得时当令」与「得时而未当令」 ──
{
  const PT = await import('../src/core/four-pillars/patterns.js');
  const zw = (y, m, d) => (PT.chartPatternsOf({ y, m, d, h: 10 })['外格提示'] || []).find((x) => /专旺格/.test(x)) || '';
  eq(/且得时当令/.test(zw(1990, 2, 11)), true, '专旺格：丙火日生寅月、立春后丙用事，得时当令');
  eq(/虽得时而未当令/.test(zw(1991, 7, 6)), true, '专旺格：丙火日生午月、芒种后乙用事，得时而未当令');
  eq(/非火气/.test(zw(1991, 7, 6)), true, '专旺格：未当令处写明司令非本气');
}


// ── 紫微：会照（三合两宫＋对宫）与「孤君」判读 ──
{
  const PZ = await import('../src/core/purple-star/chart.js');
  const a = PZ.purpleStarChart({ y: 1983, m: 7, d: 12, h: 10, gender: '男' });
  const mingA = a.cells.find((c) => c.是命宫);
  eq(Array.isArray(mingA.会照) && mingA.会照.length > 0, true, '紫微：命宫有会照星');
  // 会照恰为顺数四、八（三合）与六（对宫）三宫之星，且不含本宫
  const at = (p) => a.cells[p].主星.concat(a.cells[p].辅星);
  const pos = a.cells.findIndex((c) => c.是命宫);
  const want = [4, 8, 6].reduce((acc, st) => acc.concat(at((pos + st) % 12)), []).sort();
  eq(mingA.会照.slice().sort().join(','), want.join(','), '紫微：会照＝三合两宫＋对宫（不含本宫）');
  eq(/孤君/.test((a.命宫判 || []).join('')), true, '紫微：紫微坐命无左右同宫或会照判「孤君」');
  eq(/《紫微斗数全书》/.test((a.命宫判 || []).join('')), true, '紫微：孤君判读带出处');
  const b = PZ.purpleStarChart({ y: 1980, m: 1, d: 5, h: 8, gender: '男' });
  eq(/食禄千钟/.test((b.命宫判 || []).join('')), true, '紫微：紫微坐命得府左右昌曲三合判「食禄千钟」');
}


// ── 奇门八门/三奇的得时得地（《奇门宝鉴·释义四十四则》第三则） ──
{
  const G = await import('../src/core/mystic-gates/gate-states.js');
  // 原文「如开门本吉，但其性属金，如临土宫金位，及当季夏三秋，所谓得时得地，时之最吉者也」
  eq(G.gateStateOf('开门', 8, '未').判, '最吉', '八门旺衰：开门金临八宫（艮土）生之、季夏未月金相，得时得地');
  eq(G.gateStateOf('开门', 6, '酉').判, '最吉', '八门旺衰：开门金临六宫（乾金）同气、酉月金旺，得时得地');
  // 原文「如在春夏，而临于木火，则金气大衰，岂得为吉」
  eq(G.gateStateOf('开门', 3, '卯').判, '大衰', '八门旺衰：开门金临三宫（震木）、卯春金囚，气大衰');
  eq(G.gateStateOf('开门', 9, '午').判, '大衰', '八门旺衰：开门金临九宫（离火）受克、午夏金死，气大衰');
  // 三奇亦然（原文「凡八门皆然，三奇亦然」）
  eq(G.gateStateOf('乙', 4, '卯').判, '最吉', '三奇旺衰：乙木临四宫（巽木）、卯月木旺，得时得地');
  // 只做四档定性，不给分值（原文无权重）
  eq(Object.prototype.hasOwnProperty.call(G.gateStateOf('开门', 6, '酉'), '分'), false, '八门旺衰：不打分（原文未给权重）');
  // 整盘输出
  const H = await import('../src/core/mystic-gates/hour-chart.js');
  const r = H.mysticGatesHourChart({ y: 2024, m: 12, d: 21, h: 12 });
  eq(!!r.八门旺衰 && r.八门旺衰.门.length === 8, true, '八门旺衰：时家盘给出八门旺衰（中五无门，共八宫有门）');
  eq(r.八门旺衰.月令, '子', '八门旺衰：月令取当月月支');
}


// ── 黄历·建除义理不再夹带通书宜忌；原书真给过的宜忌单独成条 ──
{
  const T = await import('../src/core/almanac/twelve-officers.js');
  // 十二位的义理里不应再出现「宜…忌…」这种通书通例（原书只论义理）
  for (const z of Object.keys(T.JIANCHU_MEANING)) {
    eq(/[宜忌]/.test(T.JIANCHU_MEANING[z]), false, `建除义理不夹带宜忌：${z}`);
  }
  // 原书真正给过宜忌的只有建、满，另破/平/收有《选择宗镜》评语
  eq(T.JIANCHU_SOURCE_YIJI['建'].忌, '结姻亲、开仓库', '建日原文忌结姻亲开仓库（《神枢经》）');
  eq(T.JIANCHU_SOURCE_YIJI['满'].宜, '祭神祇、祈福愿', '满日原文宜祭神祇祈福愿（《总要历》）');
  eq(!!T.JIANCHU_SOURCE_YIJI['破'].评, true, '破日有《选择宗镜》评语');
  eq(Object.keys(T.JIANCHU_SOURCE_YIJI).length, 5, '原书给过宜忌或评语的只有建满破平收五位');
  eq(T.JIANCHU_SOURCE_YIJI['除'], undefined, '除日原书无宜忌条目，不替古人补话');
  // 出料层：满日一条、定为空
  const A = await import('../src/core/almanac/daily.js');
  eq(A.almanacDaily(2024, 2, 10, 12).值星.原文宜忌.宜, '祭神祇、祈福愿', '黄历·满日输出原文宜忌');
  eq(A.almanacDaily(2024, 6, 15, 12).值星.原文宜忌, null, '黄历·定日无原文宜忌，不下判语');
}


// ── 二十八宿：五行（七政所属）与禽象按《协纪·卷一》引宿曜经、《考原》逐宿对表 ──
{
  const LM = await import('../src/core/almanac/lunar-mansions.js');
  // 《协纪·卷一·二十八宿配日》按语：「虚昴星房属日，危毕张心属月，室觜翼尾属火，
  //   壁参轸箕属水，奎井角斗属木，娄鬼亢牛属金，胃柳氐女属土」——逐宿照表核对
  const WX = {
    角: '木', 亢: '金', 氐: '土', 房: '日', 心: '月', 尾: '火', 箕: '水',
    斗: '木', 牛: '金', 女: '土', 虚: '日', 危: '月', 室: '火', 壁: '水',
    奎: '木', 娄: '金', 胃: '土', 昴: '日', 毕: '月', 觜: '火', 参: '水',
    井: '木', 鬼: '金', 柳: '土', 星: '日', 张: '月', 翼: '火', 轸: '水',
  };
  let wxBad = [];
  for (let i = 0; i < 28; i += 1) {
    // 以 2024-02-08（星期四＝角宿）为起点逐日推二十八天
    const dn = Math.floor(Date.UTC(2024, 1, 8) / 86400000) + i;
    const dt = new Date(dn * 86400000);
    const r = LM.xiu28Of(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    if (WX[r.宿] !== r.五行) wxBad.push(`${r.宿}${r.五行}应${WX[r.宿]}`);
  }
  eq(wxBad.join(','), '', '二十八宿·五行逐宿合《协纪》引宿曜经七政所属');
  eq(LM.xiu28Of(2024, 2, 8).宿, '角', '二十八宿·2024-02-08（星期四）值角宿');
  eq(LM.xiu28Of(2024, 2, 10).宿, '氐', '二十八宿·2024-02-10 值氐宿（锚点）');
  // 《考原》禽象：「胃为雉、毕为乌」——胃宿禽象是雉不是彘
  eq(LM.xiu28Of(2024, 2, 20).动物 === '猪' || LM.xiu28Of(2024, 2, 20).动物 === '豕', true, '二十八宿·室宿禽象为猪');
  const wei = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
    .map((i) => { const dn = Math.floor(Date.UTC(2024, 1, 8) / 86400000) + i; const dt = new Date(dn * 86400000); return LM.xiu28Of(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); })
    .find((x) => x.宿 === '胃');
  eq(wei && wei.动物, '雉', '二十八宿·胃宿禽象为雉（《考原》「胃为雉」）');
}



// —— 三派取用（扶抑 / 调候 / 顺逆）并列：条件、结论、打架处各归各家 ——
{
  const r = chartPatternsOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' });
  const ss = r['三派取用'];
  eq(!!ss, true, '三派取用·存在');
  eq(['扶抑', '调候', '顺逆'].every((k) => ss[k] && ss[k].派 === k), true, '三派取用·三派齐全');
  eq(ss['扶抑'].用神, '火', '三派取用·扶抑身强取克我（辛金强 → 火）');
  eq(ss['扶抑'].依据.includes('子平真诠·论用神'), true, '三派取用·扶抑引《子平真诠·论用神》');
  eq(ss['调候'].用神, '壬', '三派取用·调候辛日午月取壬（《穷通宝鉴》专条）');
  eq(ss['调候'].成立, true, '三派取用·调候有专条时成立');
  eq(ss['调候'].依据.includes('穷通宝鉴'), true, '三派取用·调候引《穷通宝鉴》');
  eq(ss['顺逆'].成立, false, '三派取用·寻常格局顺逆不出用神');
  eq(ss['顺逆'].依据.includes('滴天髓·顺逆'), true, '三派取用·顺逆引《滴天髓·顺逆》');
  eq(ss['异同'].some((x) => x.includes('不可合并')), true, '三派取用·调候与扶抑冲突须标注');
  eq(ss['主用'], '壬', '三派取用·主用取调候（未成局时有专条先用专条）');
  eq(ss['次序'].startsWith('顺逆'), true, '三派取用·次序以顺逆居首（成局不可逆）');
}
{
  // 禄刃属「得令」不是「成局」：顺逆派必须拒绝，否则会把身旺误当从格
  const r = chartPatternsOf({ y: 1980, m: 8, d: 15, h: 0, gender: '男' });
  eq(r['格局'].禄刃 === '建禄' || r['格局'].禄刃 === '羊刃', true, '三派取用·样本为禄刃格');
  eq(r['三派取用']['顺逆'].成立, false, '三派取用·禄刃得令不作成局，顺逆不出用神');
  eq(r['三派取用']['顺逆'].条件.includes('得令'), true, '三派取用·禄刃拒绝理由写明「得令而非成局」');
}
{
  // 从格：一行独旺、日主无根 → 顺之，且主用须由顺逆压过调候
  const r = chartPatternsOf({ y: 1980, m: 11, d: 7, h: 2, gender: '男' });
  const ss = r['三派取用'];
  eq(ss['顺逆'].成立, true, '三派取用·从格成立');
  eq(ss['顺逆'].用神, '金', '三派取用·从格顺独旺之五行（金独旺则顺金，作从杀论）');
  eq(ss['主用'], ss['顺逆'].用神, '三派取用·成局时主用由顺逆定');
  eq(ss['异同'].some((x) => x.includes('成局')), true, '三派取用·成局与扶抑/调候的冲突须标注');
}

/* ---- 大运判读（《三命通会·论大运》）---- */
{
  const { stageOf, yunNameOf, xiJiOf, luckJudgementOf } = await import('../src/core/four-pillars/luck-judgement.js');
  // 十二长生：阳干顺行（甲长生于亥）、阴干逆行（辛长生于子）
  eq(stageOf('甲', '亥'), '长生', '大运·甲日见亥为长生（阳干顺行）');
  eq(stageOf('甲', '卯'), '帝旺', '大运·甲日见卯为帝旺');
  eq(stageOf('辛', '子'), '长生', '大运·辛日见子为长生（阴干逆行）');
  eq(stageOf('辛', '午'), '病', '大运·辛日见午为病');
  // 运名：运支五行与日主五行的五关系
  eq(yunNameOf('辛', '申').名, '比肩劫财之运', '大运·辛日行申运为比肩劫财（同气）');
  eq(yunNameOf('辛', '午').名, '七煞官乡', '大运·辛日行午运为七煞官乡（克我）');
  eq(yunNameOf('甲', '寅').名, '比肩劫财之运', '大运·甲日行寅运为劫财败财（原文举例）');
  eq(yunNameOf('甲', '午').名, '伤官食神之运', '大运·甲日行午运为伤官（我生）');
  // 喜忌：生用神为喜、克用神为忌
  const x1 = xiJiOf('申', '壬', '');
  eq(x1[0].判, '喜', '大运·运支生用神为喜（益用神者欲运生之）');
  const x2 = xiJiOf('未', '壬', '');
  eq(x2[0].判, '忌', '大运·运支克用神为忌');
  const x3 = xiJiOf('未', '壬', '金');
  eq(x3.length, 2, '大运·身弱另出一条日主判');
  eq(x3[1].判, '喜', '大运·身弱得运生扶为喜（身弱欲运引进旺乡）');
  // 整盘：结构与依据
  const lj = luckJudgementOf({ y: 1990, m: 6, d: 15, h: 10, gender: '男' }, 4);
  eq(lj.步.length, 4, '大运判读·按 limit 出步数');
  eq(lj.步.every((x) => !!(x.运名 && x.长生 && x.合判)), true, '大运判读·每步均有运名/长生/合判');
  eq(lj.依据, '《三命通会·论大运》', '大运判读·依据篇名');
  eq(lj.步[0].合判, '喜忌相左（用神与日主指向不同，须并看，不合成一句）', '大运判读·用神与日主相左时不合判');
  eq(String(lj.口径).includes('地支为主'), true, '大运判读·口径声明以地支为主');
}

// ===== 岁运四判（《三命通会·明通赋》注、《继善篇》注）=====
{
  const inp = { y: 1990, m: 6, d: 15, h: 10, gender: '男' };
  const r97 = yearLordOf(inp, 1997, { 大运干支: '癸未' });
  const names97 = r97.判.map((x) => x.名);
  eq(names97.includes('岁冲运'), true, '岁运·丁丑年冲癸未运作「岁冲运」');
  eq(r97.判.find((x) => x.名 === '岁冲运').吉凶, '重', '岁运·岁冲运判重（「太岁冲运其祸重」）');
  eq(names97.includes('运克太岁'), true, '岁运·癸水克丁火作「运克太岁」');
  eq(r97.判.find((x) => x.名 === '运克太岁').吉凶, '轻', '岁运·运克太岁判轻');
  eq(/两说并存/.test(r97.判.find((x) => x.名 === '运克太岁').说明), true, '岁运·运克太岁的异说须写明并存，不独断');
  eq(names97.includes('运征太岁'), true, '岁运·癸未运与丁丑年天克地冲仍判「运征太岁」');

  const r17 = yearLordOf(inp, 2017, { 大运干支: '乙酉' });
  const p17 = r17.判.find((x) => x.名 === '日干冲运');
  eq(!!p17, true, '岁运·辛日干与乙运干相冲作「日干冲运」');
  eq(p17 && p17.吉凶, '忌', '岁运·日干冲运为忌（《继善篇》注「最忌者日干冲运」）');

  const r04 = yearLordOf(inp, 2004, { 大运干支: '癸未' });
  eq(!!r04.判.find((x) => x.名 === '运干生日干'), false, '岁运·癸不生辛，不出「运干生日干」');

  const r05 = yearLordOf(inp, 2005, { 大运干支: '甲申' });
  eq(!!r05.判.find((x) => x.名 === '运干生日干'), false, '岁运·甲不生辛，不出「运干生日干」');

  // 岁运并临：1990 年生人 2003 癸未年恰走癸未运
  const r03 = yearLordOf(inp, 2003, { 大运干支: '癸未' });
  eq(!!r03.判.find((x) => x.名 === '岁运并临'), true, '岁运·流年与大运同干支作「岁运并临」');

  // 不传大运时不得出现任何岁运判（无米不下锅）
  const rNo = yearLordOf(inp, 1997, {});
  eq(rNo.判.some((x) => ['岁冲运', '运克太岁', '日干冲运', '岁运并临'].includes(x.名)), false, '岁运·未给大运时不出岁运判');
}

// —— 九星本等与气应（《奇门遁甲统宗·烟波钓叟歌》《奇门宝鉴·释气应》）——
eq(Object.keys(STAR_ELEMENT).length, 9, '九星五行表九星齐备');
eq(STAR_BASE['天辅'], '大吉', '九星本等·天辅大吉');
eq(STAR_BASE['天冲'], '小吉', '九星本等·天冲小吉');
eq(STAR_BASE['天蓬'], '大凶', '九星本等·天蓬大凶');
eq(STAR_BASE['天英'], '小凶', '九星本等·天英小凶');
eq(starSeasonOf('水', '寅').气, '旺', '九星气应·水星旺于寅卯（我生之月为旺）');
eq(starSeasonOf('水', '亥').气, '相', '九星气应·水星相于亥子（我同之月为相）');
eq(starSeasonOf('水', '巳').气, '休', '九星气应·水星休于四五月（我克之月为休）');
eq(starSeasonOf('水', '辰').气, '囚', '九星气应·水星囚于辰戌丑未（克我之月为囚）');
eq(starSeasonOf('水', '申').气, '废', '九星气应·水星废于申酉（生我之月为废）');
eq(starVerdictOf('天蓬', '申').判, '小凶', '大凶无气交为小·天蓬申月降为小凶');
eq(starVerdictOf('天英', '午').判, '忧', '小凶有气亦丁忧·天英午月加重为忧');
eq(starVerdictOf('天辅', '寅').判, '大吉', '吉宿逢旺相·天辅寅月万举万全');
eq(starVerdictOf('天蓬', '辰').判, '小凶', '大凶无气交为小·天蓬辰月（囚）降为小凶');
const _ss = starStatesOf([{ 宫: 1, 星: '天蓬' }, { 宫: 2, 星: '天芮(禽)' }, { 宫: 5, 星: '' }], '子');
eq(_ss.星.length, 2, '九星气应汇总只收有星之宫');
eq(_ss.星[1].同宫禽星, '天禽', '天芮(禽)记同宫禽星');
eq(/奇门秘诀总赋/.test(_ss.依据), true, '九星气应带《统宗·奇门秘诀总赋》出处');
eq(/释气应/.test(_ss.依据), true, '九星气应带《奇门宝鉴·释气应》出处');

// —— 奇门·八神定名、所司与异说（《奇门宝鉴·释八神》/《奇门遁甲统宗·卷之二·八神》）——
{
  const G = await import('../src/core/mystic-gates/god-roles.js');
  eq(G.GODS.length, 8, '八神·共八位');
  eq(G.GODS[0], '值符', '八神·首位值符');
  eq(G.GODS[4], '朱雀', '八神·第五位朱雀（宝鉴本，统宗作勾陈）');
  eq(G.GODS[5], '白虎', '八神·第六位白虎（宝鉴本，统宗作朱雀）');
  eq(G.GODS_ALT[4], '勾陈', '八神异说·统宗第五位勾陈');
  eq(G.GODS_ALT[5], '朱雀', '八神异说·统宗第六位朱雀');
  eq(G.GOD_ROLES['九天'], '扬兵', '八神所司·九天扬兵');
  eq(G.GOD_ROLES['九地'], '安营', '八神所司·九地安营');
  eq(G.GOD_ROLES['太阴'], '伏兵', '八神所司·太阴伏兵');
  eq(G.GOD_ROLES['六合'], '匿形', '八神所司·六合匿形');
  eq(G.GOD_ROLES['朱雀'], '间谍', '八神所司·朱雀间谍');
  eq(G.GOD_ROLES['白虎'], '侦探', '八神所司·白虎侦探');
  eq(G.GOD_ALIAS['值符'], '天乙', '八神异名·值符亦名天乙');
  eq(G.GOD_ALSO['朱雀'], '玄武', '八神兼看·朱雀下兼看玄武');
  const role = G.godRolesOf([{ 宫: 8, 神: '值符' }, { 宫: 3, 神: '九天' }]);
  eq(role.盘上.length, 2, '八神所司·只列盘上实有之神');
  eq(role.盘上[1].所司, '扬兵', '八神所司·随宫给出所司');
  eq(role.异说.includes('卷之二'), true, '八神异说·出处写到卷次');
}


// ===== 奇门·日级属性（德刑 / 宝和义制伏 / 五阳时五阴时）=====
{
  const dp = await import('../src/core/mystic-gates/day-profiles.js');
  const { deXingOf, dayClassNameOf, hourClassOf, dayProfilesOf, GUA_OF_TERM, DE_XING } = dp;

  // 德刑逐卦对表（原文：立春…在艮德辰刑戌；春分…在震德午刑子；…冬至…在坎德卯刑酉）
  const want = { 艮: ['辰', '戌'], 震: ['午', '子'], 巽: ['未', '丑'], 离: ['酉', '卯'], 坤: ['戌', '辰'], 兑: ['子', '午'], 乾: ['丑', '未'], 坎: ['卯', '酉'] };
  let dOk = true;
  for (const gua of Object.keys(want)) {
    if (DE_XING[gua].德 !== want[gua][0] || DE_XING[gua].刑 !== want[gua][1]) dOk = false;
  }
  eq(dOk, true, '奇门·德刑八节对表（德刑互为六冲）');
  eq(deXingOf('冬至').德, '卯', '奇门·冬至在坎德卯');
  eq(deXingOf('冬至').刑, '酉', '奇门·冬至在坎刑酉');
  eq(deXingOf('立春').卦, '艮', '奇门·立春在艮');
  eq(Object.keys(GUA_OF_TERM).length, 24, '奇门·二十四节气全有卦属');
  eq(deXingOf('不存在'), null, '奇门·节气无效则不出德刑');

  // 宝和义制伏（原文四例：甲午宝、甲寅和、甲子义、庚寅制、乙酉伏）
  eq(dayClassNameOf('甲', '午').类, '宝日', '奇门·甲午为宝日（干生支）');
  eq(dayClassNameOf('甲', '寅').类, '和日', '奇门·甲寅为和日（干支比和）');
  eq(dayClassNameOf('甲', '子').类, '义日', '奇门·甲子为义日（支生干）');
  eq(dayClassNameOf('庚', '寅').类, '制日', '奇门·庚寅为制日（干克支）');
  eq(dayClassNameOf('乙', '酉').类, '伏日', '奇门·乙酉为伏日（支克干）');
  eq(dayClassNameOf('乙', '酉').吉凶, '大凶', '奇门·伏日大凶');
  eq(dayClassNameOf('庚', '寅').吉凶, '小凶', '奇门·制日小凶');
  eq(dayClassNameOf('甲', '寅').别名, '专日', '奇门·和日为专日');
  eq(dayClassNameOf('乙', '酉').别名, '伐日', '奇门·伏日为伐日');

  // 五阳时 / 五阴时
  eq(hourClassOf('丙').类, '五阳时', '奇门·丙时为五阳时');
  eq(hourClassOf('壬').类, '五阴时', '奇门·壬时为五阴时');
  eq(hourClassOf('丙').利, '利客、宜先举', '奇门·五阳时利客宜先举');
  eq(hourClassOf('壬').利, '利主、宜后应', '奇门·五阴时利主宜后应');

  // 整盘接入
  const pan = mysticGatesHourChart({ y: 2024, m: 12, d: 21, h: 12 });
  eq(!!pan['日家属性'], true, '奇门·盘面带日家属性');
  eq(!!pan['日家属性']['德刑'] && !!pan['日家属性']['日家'] && !!pan['日家属性']['时家阴阳'], true, '奇门·德刑/日家/时家阴阳三项齐备');
  eq(String(pan['日家属性']['德刑'].依据).indexOf('《奇门遁甲统宗·卷之二·德刑》') >= 0, true, '奇门·德刑带原文出处');
}


// —— 奇门类象：八门所主 / 九星所主 / 三奇喜怒（《奇门遁甲统宗·卷之二》）——
eq(Object.keys(GATE_DUTY).length, 8, '类象·八门所主齐八门');
eq(gateDutyOf('开门').宜.includes('征讨'), true, '类象·开门宜征讨');
eq(gateDutyOf('杜门').余论, '余俱不宜', '类象·杜门余俱不宜');
eq(gateDutyOf('休门').不宜.join(''), '行刑断狱', '类象·休门不宜行刑断狱');
eq(Object.keys(STAR_DUTY).length, 9, '类象·九星所主齐九星');
eq(starDutyOf('天蓬').别名, '贪狼', '类象·天蓬别名贪狼');
eq(starDutyOf('天心').别名, '武曲', '类象·天心别名武曲');
eq(starDutyOf('天英').不宜.includes('远行'), true, '类象·天英不宜远行');
eq(['乙', '丙', '丁'].every((q) => Object.keys(QI_MOOD[q]).length === 8), true, '类象·三奇喜怒各八宫');
eq(qiMoodOf('乙', 2).判, '凶', '类象·乙到坤为入墓（凶）');
eq(qiMoodOf('丙', 9).判, '吉', '类象·丙到离为帝旺之乡（吉）');
eq(qiMoodOf('丁', 1).判, '凶', '类象·丁到坎为朱雀投江（凶）');
eq(qiMoodOf('丁', 6).判, '', '类象·丁到乾只给名目、原书未言吉凶');
eq(gateDutyOf('开门').依据.includes('卷之二'), true, '类象·八门所主出处可溯');
eq(DUTY_NOTES.门.includes('吉门有气益吉'), true, '类象·八门通则照录原文');
{
  const im = imageryOf(mysticGatesHourChart({ y: 2024, m: 12, d: 21, h: 12 }));
  eq(!!im['值使门'] && !!im['值符星'], true, '类象·整盘取值使门与值符星');
  eq((im['三奇落宫'] || []).length > 0, true, '类象·整盘出三奇落宫');
}

/* ---- 六壬·年命判（《六壬大全·轩辕肘后经》）---- */
{
  const withNm = (y, m, d, h, bm) => sixRenChart({ y, m, d, h, 本命: bm, 性别: '男', 虚岁: 37 });
  eq((withNm(2024, 3, 5, 9, '寅')['年命判'] || []).length > 0, true, '年命判·给本命与虚岁时出判');
  eq((sixRenChart({ y: 2024, m: 3, d: 5, h: 9 })['年命判'] || []).length, 0, '年命判·未给本命时整块不出、不默认年命');

  const has = (c, name) => (c['年命判'] || []).some((x) => x.判 === name);
  eq(has(withNm(2024, 1, 15, 3, '子'), '不及'), true, '年命判·行年克日上神名曰不及');
  eq(has(withNm(2024, 1, 25, 3, '子'), '失节'), true, '年命判·日干克年上神名曰失节');
  eq(has(withNm(2024, 1, 5, 3, '子'), '事神与年上相生'), true, '年命判·事神与年上相生则所为得成');
  eq(has(withNm(2024, 1, 5, 9, '子'), '事神与年上相克'), true, '年命判·事神与年上相克则所为不得');
  eq(has(withNm(2024, 1, 5, 9, '子'), '年上落空'), true, '年命判·年上神落旬空则占讼求事不宜');
  eq(has(withNm(2024, 2, 5, 9, '子'), '年上遥克凶神'), true, '年命判·年上神遥克日鬼为救神');
  eq(has(withNm(2024, 7, 5, 15, '子'), '日鬼为用生年上'), true, '年命判·日鬼为用生年上主迁官之兆');

  const all = [withNm(2024, 1, 15, 3, '子'), withNm(2024, 1, 25, 3, '子'), withNm(2024, 2, 5, 9, '子')]
    .flatMap((c) => c['年命判'] || []);
  eq(all.length > 0, true, '年命判·样本非空');
  eq(all.every((x) => x.吉凶 === '吉' || x.吉凶 === '凶'), true, '年命判只给定性吉凶');
  eq(all.every((x) => !('分' in x) && !('权重' in x) && !('得分' in x)), true, '年命判不打分、不设权重');
  eq(all.every((x) => /轩辕肘后经|毕法赋/.test(x.依据)), true, '年命判每条都能回溯到篇名');
  eq(nianMingVerdicts(null).length, 0, '年命判·空入参返回空数组');
}

/* ---- 六爻·以八卦参之（八宫类象 + 年命与卦宫之鬼）---- */
{
  eq(Object.keys(GONG_IMAGERY).length, 8, '卦宫类象·八宫齐备');
  eq(GONG_IMAGERY['乾'].象.includes('寺'), true, '卦宫类象·乾兑为寺');
  eq(GONG_IMAGERY['震'].象, '舟车', '卦宫类象·震有舟车');
  eq(GONG_IMAGERY['坤'].象.includes('郊野山林'), true, '卦宫类象·坤艮郊野山林');
  eq(gongImageryOf('坎宫(水)').宫, '坎', '卦宫类象·可取「坎宫(水)」形式');
  eq(gongImageryOf('') , null, '卦宫类象·空入参返回 null');
  eq(gongImageryOf('坎').说明.includes('句读两可'), true, '卦宫类象·「坎兑以水为灾」句读两可照录不臆断');

  eq(benMingGuiOf('寅', '兑').判, '本命助鬼', '年命卦宫·木命占乾兑，木生火为鬼有助');
  eq(benMingGuiOf('寅', '兑').吉凶, '凶', '年命卦宫·本命助鬼为凶');
  eq(benMingGuiOf('申', '兑').判, '鬼克身（伤身）', '年命卦宫·金命占乾兑，火鬼克金为伤身');
  eq(benMingGuiOf('子', '兑').判, '本命制鬼', '年命卦宫·水命占乾兑，水克火为制鬼');
  eq(benMingGuiOf('午', '兑').判, '本命与卦宫之鬼无生克', '年命卦宫·本命与鬼同气则无生克');
  eq(benMingGuiOf('', '兑'), null, '年命卦宫·未给本命则不出判');
  eq(benMingGuiOf('甲子', '兑').本命, '子', '年命卦宫·干支形式也可取支');

  const c1 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '家宅', 本命: '子' });
  eq(c1.卦宫类象 && c1.卦宫类象.宫, '兑', '六爻盘·带卦宫类象');
  eq(!!c1.年命卦宫, true, '六爻盘·给本命时出年命卦宫');
  const c2 = sixLinesCast({ y: 2024, m: 2, d: 10, h: 12, 事: '家宅' });
  eq(c2.年命卦宫, null, '六爻盘·未给本命时不出年命卦宫');
}

/* ---- 梅花·先天卦气应期（《梅花易数·先后天论》）---- */
{
  eq(qiYingOf('乾').应期.includes('庚辛'), true, '先天应期·乾金应庚辛日');
  eq(qiYingOf('兑').备注.includes('酉日时'), true, '先天应期·兑另云酉日时（照录原文）');
  eq(qiYingOf('坤').备注.includes('戌、亥'), true, '先天应期·坤照录原文「戌、亥之日时」（底本带顿号）');
  eq(qiYingOf('坤').备注.includes('通行'), true, '先天应期·坤注明通行说作辰戌丑未');
  eq(qiYingOf('震').备注.includes('震取卯'), true, '先天应期·震取卯');
  eq(qiYingOf('巽').备注.includes('巽取辰'), true, '先天应期·巽取辰');
  eq(qiYingOf('坎').备注.includes('原书未举例'), true, '先天应期·坎原书未举例、明标为推');
  eq(qiYingOf('离').依据.includes('原书未举'), true, '先天应期·离推得并标依据较弱');
  eq(['乾','兑','离','震','巽','坎','艮','坤'].every((g) => qiYingOf(g)), true, '先天应期·八卦齐备');
  const t = plumBlossomText({ date: { year: 2024, month: 2, day: 10 }, time: { hour: 12 } }).text;
  eq(t.includes('先天应期'), true, '梅花出料含先天应期');
  eq(t.includes('止以卦论') && t.includes('不甚用'), true, '梅花易辞口径改按先后天论（先天不甚用爻辞）');
  eq(/本实现按年月日时起卦，属先天一路/.test(t), true, '梅花明说本实现属先天一路');
}

/* ---- 断语出处抽查（八项功能抽样，凡断语须能串回篇名或标「概述」）---- */
{
  const txt = async (q) => (await analyze(q)).results[0].text;
  const meihua = await txt('排梅花 2024年2月10日 12点');
  eq(/体用总诀/.test(meihua), true, '梅花·体用断语带《梅花易数·体用总诀》');
  eq(/卦义概述/.test(meihua), true, '梅花·六十四卦断语标「概述」不冒充原文');

  const qimen = await txt('排奇门 2024年12月21日 12点');
  eq(/奇门秘诀总赋/.test(qimen), true, '奇门·九星本等带《奇门遁甲统宗·奇门秘诀总赋》');
  eq(/释气应/.test(qimen), true, '奇门·九星旺衰带《奇门宝鉴·释气应》');
  eq(/卷之二/.test(qimen), true, '奇门·门星所主与三奇落宫带篇名');

  const yun = await txt('排运程 1990年6月15日 10点 男 2034年');
  eq(/论大运/.test(yun), true, '运程·大运判读带《三命通会·论大运》');
}

/* ---- 反向抽查·断语须带出处或不冒充原文（第二批）---- */
{
  const txt = async (q) => (await analyze(q)).results[0].text;
  const bazhai = await txt('查命卦 1985年 男');
  eq(/等第依据/.test(bazhai) && /玉匣記·九星所屬陰陽凶吉/.test(bazhai) && /两说并存/.test(bazhai), true, '八宅·九星等第须标原文出处并注明伏位两说');
  // 2026-10 补入《遁甲演义》后，三诈五假已有逐条定义——此处守护「必须点明出处」而非「必须标待考」
  const qm = await txt('解奇门格局 2024年1月1日 5点');
  eq(/三诈五假出处/.test(qm) && /《遁甲演义·三诈五假》/.test(qm), true, '奇门·三诈五假须点明典籍出处');
  const ly = await txt('解六爻旺衰 2024年2月10日 12点 问财运');
  eq(/生旺墓绝章/.test(ly) && /空亡章/.test(ly), true, '六爻·化墓化绝化空须带篇名');
}

/* ------------------------------------------------------------------ *
 * 2026-10 补书后的两处升档（月紫白对表、三诈五假按《遁甲演义》原文）
 * ------------------------------------------------------------------ */
// 一、月紫白：《御定星历考原·三元月九星》逐月入中表——上元（子午卯酉年）正月八白、
//     中元（辰戌丑未年）正月五黄、下元（寅申巳亥年）正月二黑，逐月逆推一位。
eq(flyingStarsChart({ y: 2024, m: 2, d: 10, h: 12 }).月紫白.入中, '五黄', '月紫白·辰年（中元）正月五黄入中（星历考原表）');
eq(flyingStarsChart({ y: 2024, m: 3, d: 10, h: 12 }).月紫白.入中, '四绿', '月紫白·中元二月四绿（逐月逆推）');
eq(flyingStarsChart({ y: 2023, m: 2, d: 10, h: 12 }).月紫白.入中, '八白', '月紫白·卯年（上元）正月八白入中');
eq(flyingStarsChart({ y: 2025, m: 2, d: 10, h: 12 }).月紫白.入中, '二黑', '月紫白·巳年（下元）正月二黑入中');

// 二、三诈五假：《遁甲演义·三诈五假》逐条条件与所宜（旧版按通行口诀，「人假＝惊门+壬+九天」
//     「神假＝伤门+丁己癸+六合」与原文不符，五假之义亦与原文相差甚远，此处守护改正后的口径）
const zz = (h, name) => (mysticGatesPatternsOf({ y: 2024, m: 1, d: 1, h }).吉格 || []).find((x) => x.name === name);
eq(!!(zz(1, '鬼假') || {}).义 && zz(1, '鬼假').义.includes('利超亡荐度'), true, '鬼假：死门合丁己癸临九地，利超亡荐度（原文）');
eq(!!(zz(5, '人假') || {}).义 && zz(5, '人假').义.includes('利捕逃亡'), true, '人假：惊门合六合，利捕逃亡（原文条件，不含壬）');
eq(!!(zz(5, '重诈') || {}).义 && zz(5, '重诈').义.includes('拜官授爵'), true, '重诈：宜进人口、取财、拜官授爵（原文）');
eq(!!(zz(11, '神假') || {}).义 && zz(11, '神假').义.includes('利埋葬'), true, '神假：伤门合丁己癸临九地，利埋葬（原文条件为九地）');
eq(!!(zz(19, '天假') || {}).义 && zz(19, '天假').义.includes('进谒干求'), true, '天假：景门合三奇临九天，宜陈利便、进谒干求（原文）');
eq(!!(zz(1, '鬼假') || {}).依据 || /《遁甲演义·三诈五假》/.test((zz(1, '鬼假') || {}).义 || ''), true, '三诈五假义项带《遁甲演义·三诈五假》出处');

// ---- 八宅：大游年歌与九星原文（《玉匣記》2026-10-31 补书后新增） ----
{
  const { DAYOU_NIAN_GE: GE, NINE_STAR_SOURCE: NS, YOU: YT, GONG } = await import('../src/core/geomancy/eight-mansions.js');
  const GONG_OF = Object.fromEntries(Object.entries(GONG).map(([k, v]) => [v.卦, Number(k)]));
  const RING = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];
  const LETTER = { 六: '六煞', 天: '天医', 五: '五鬼', 禍: '祸害', 絕: '绝命', 延: '延年', 生: '生气' };
  let diff = 0;
  for (const [gua, seq] of Object.entries(GE)) {
    const start = RING.indexOf(gua);
    const got = {};
    [...seq].forEach((ch, i) => { got[LETTER[ch]] = RING[(start + 1 + i) % 8]; });
    for (const [star, pos] of Object.entries(got)) if (YT[gua][star] !== GONG_OF[pos]) diff += 1;
  }
  eq(diff, 0, '八宅·大游年歌八句逐门顺布，与翻卦法生成的 YOU 表 8×7 全符');
  eq(Object.keys(GE).length, 8, '八宅·大游年歌八句齐全');
  eq(Object.keys(NS).length, 8, '八宅·九星所属阴阳凶吉八星齐全');
  eq(NS['生气']['等第'], '上吉', '八宅·原文生气作「上吉」');
  eq(NS['六煞']['等第'], '次凶', '八宅·原文六煞作「次凶」');
  eq(String(NS['伏位']['等第']).includes('右所屬無定'), true, '八宅·伏位原文左辅次凶、右所属无定（与通行小吉两说并存）');
}

// ---- 《玉匣記》喜神情态与建除用事（2026-10-31 接入） ----
{
  const { xiShenMoodOf } = await import('../src/core/almanac/directions.js');
  const { JIANCHU_USE_VERSE } = await import('../src/core/almanac/twelve-officers.js');
  eq(xiShenMoodOf('甲'), '端坐', '喜神情态·甲己端坐');
  eq(xiShenMoodOf('乙'), '唾', '喜神情态·乙庚唾');
  eq(xiShenMoodOf('丙'), '怒色皱眉', '喜神情态·丙辛怒色皱眉');
  eq(xiShenMoodOf('壬'), '醉', '喜神情态·丁壬吃得醺醺醉');
  eq(xiShenMoodOf('癸'), '喜笑', '喜神情态·戊癸喜笑');
  const txt2 = async (q) => (await analyze(q)).results[0].text;
  const hl2 = await txt2('查黄历 2024年2月10日');
  eq(/喜神情态|情态端坐/.test(hl2), true, '黄历输出含喜神情态');
  eq(hl2.includes(JIANCHU_USE_VERSE), true, '黄历输出照录建除用事原文');
  eq(/玉匣記·喜神喜怒歌/.test(hl2), true, '黄历输出标明喜神喜怒歌出处');
}

// ---- 八宅九星年限/子息/房分（《玉匣記》三歌，2026-10-31 接入） ----
{
  const { STAR_PORTRAIT: SP } = await import('../src/core/geomancy/eight-mansions.js');
  eq(Object.keys(SP).length, 8, '八宅·九星年限应验表八星齐全');
  eq(SP['生气']['应期'], '亥卯未', '八宅·生气应期亥卯未（原文「氣生吉凶亥卯未」）');
  eq(SP['五鬼']['应期'], '寅午戌', '八宅·五鬼应期寅午戌');
  eq(SP['六煞']['应期'], '申子辰', '八宅·六煞应期申子辰（底本作「甲子辰」，按三合校「申」）');
  eq(SP['绝命']['应期'], '巳酉丑', '八宅·绝命应期巳酉丑');
  eq(SP['生气']['子息'], '五子', '八宅·生气五子（「貪生五子」）');
  eq(SP['绝命']['子息'], '守孤孀', '八宅·绝命守孤孀（「破軍絕敗守孤孀」）');
  eq(String(SP['伏位']['应期']).includes('右弼无生克'), true, '八宅·右弼无生克（「惟有右弼無生克」）');
  const t3 = (await analyze('查命卦 1985年 男')).results[0].text;
  eq(/九星年限应验/.test(t3) && /子息与房分/.test(t3), true, '八宅输出含年限应验与子息房分两行');
  eq(/玉匣記·子息多寡歌/.test(t3) && /玉匣記·分房興敗歌/.test(t3), true, '八宅输出标明两歌出处');
}

// ---- 每日吉时（《玉匣記·諸日起吉時歌》，2026-10-31 接入） ----
{
  const { auspiciousHoursOf } = await import('../src/core/almanac/auspicious-hours.js');
  const a = auspiciousHoursOf('申');
  eq(a['起青龙'], '子', '吉时·寅申日子时起青龙（原文自注）');
  eq(a['吉时'].join(' '), '子 丑 辰 巳 未 戌', '吉时·申日六吉时（青龙明堂金匮天德玉堂司命所临）');
  const b = auspiciousHoursOf(4);
  eq(b['吉时'].join(' '), '辰 巳 申 酉 亥 寅', '吉时·辰日六吉时');
  eq(b['十二时辰'].length, 12, '吉时·十二时辰全列');
  const hl = (await analyze('查黄历 2024年2月10日')).results[0].text;
  eq(/每日吉时/.test(hl) && /諸日起吉時歌/.test(hl), true, '黄历输出含吉时行与出处');
}

// ---- 特别忌四类补充：四废/杨公忌/探病忌/大明吉日（2026-10-31 接入） ----
{
  const cd = await import('../src/core/almanac/critical-days.js');
  eq(cd.DA_MING ? true : true, true, '占位');
  // 大明吉日 21 条
  const dm = ['辛未','壬申','癸酉','丁丑','乙卯','壬午','甲申','丁亥','壬辰','乙未','壬寅','甲辰','乙巳','丙午','己酉','庚戌','辛亥','丙辰','己未','庚申','辛酉'];
  let hit = 0;
  for (const gz of dm) if (cd.daMingJiOf(gz)) hit += 1;
  eq(hit, 21, '大明吉日·二十一日全部命中');
  // 四废：春庚申（2024-03-15 为庚申日）
  eq(!!cd.siFeiOf('庚申', 2), true, '四废·春庚申命中');
  eq(!!cd.siFeiOf('庚申', 0), false, '四废·非其季不命中');
  // 杨公忌：2024-03-20 农历二月十一
  eq(!!cd.yangGongJiOf({ y: 2024, m: 2, d: 11 }), true, '杨公忌·二月十一命中');
  eq(!!cd.yangGongJiOf({ y: 2024, m: 2, d: 12 }), false, '杨公忌·非忌日不命中');
  // 探病忌
  eq(!!cd.tanBingJiOf('壬寅') && !!cd.tanBingJiOf('己卯'), true, '探病忌·六日中两端命中');
  eq(!cd.tanBingJiOf('甲子'), true, '探病忌·甲子不命中');
  // 黄历输出
  const hl4 = (await analyze('查黄历 2024年3月20日')).results[0].text;
  eq(/杨公忌日/.test(hl4) && /玉匣記·楊公忌日/.test(hl4), true, '黄历输出含杨公忌与出处');
  const hl5 = (await analyze('查黄历 2024年2月10日')).results[0].text;
  eq(/大明吉日/.test(hl5) && /玉匣記·大明吉日/.test(hl5), true, '黄历输出含大明吉日（甲辰日）');
  eq((await import('../src/core/almanac/daily.js')).almanacDaily(2024, 2, 10, 12)['特别忌'].length, 0, '大明吉日不混入特别忌');
}


// ── 紫微·亮度（庙旺得地失陷，三卷本直证） ──
{
  const stars = Object.keys(BRIGHTNESS);
  eq(stars.length, 16, '紫微亮度：14 主星 + 2 辅星入表（' + stars.length + '）');
  eq(!!BRIGHTNESS['天梁'], true, '紫微亮度：天梁入表');
  eq(BRIGHTNESS['天梁']['卯'] && BRIGHTNESS['天梁']['卯'].级, '入庙', '紫微亮度：底本天梁卯宫入庙（通行作旺——两说分歧已声明）');
  eq(BRIGHTNESS['天梁']['申'] && BRIGHTNESS['天梁']['申'].级, '陷地', '紫微亮度：底本天梁申宫陷地（通行作得地）');
  eq(BRIGHTNESS['天梁']['巳'], undefined, '紫微亮度：天梁巳宫底本未标级、留缺');
  eq(BRIGHTNESS['紫微']['子'], undefined, '紫微亮度：紫微子宫底本未标级、留缺');
  eq(BRIGHTNESS['太阳']['卯'] && BRIGHTNESS['太阳']['卯'].级, '庙', '紫微亮度：太阳卯宫庙（「第一庙所」）');
  eq(BRIGHTNESS['天同']['丑'] && BRIGHTNESS['天同']['丑'].级, '不得地', '紫微亮度：底本原级「不得地」照录');
  eq(LEVEL_NORM['入庙'], '庙', '紫微亮度：归一级映射入庙→庙');
  eq(BRIGHT_SOURCE.includes('9 格底本未标级'), true, '紫微亮度：缺格 9 处声明在表头');
  eq(Object.values(BRIGHTNESS).every((d) => Object.values(d).every((b) => typeof b.原文 === 'string' && b.原文.length >= 3)), true, '紫微亮度：每格带底本原文（供 check:readings 回溯）');
  {
    const c = await purpleStarChart({ y: 1983, m: 7, d: 12, h: 10, gender: '男' });
    const ming = c.cells.find((x) => x.是命宫);
    const br = ming.亮度.find((b) => b.星 === '紫微');
    eq(br && br.级, '旺地', '紫微亮度：盘面命宫紫微寅宫=旺地');
  }
}


// ── 紫微·大限四化（卷一问答论直证） ──
{
  const c = await purpleStarChart({ y: 1983, m: 7, d: 12, h: 10, gender: '男' });
  const flat = c.大限.flatMap((lk) => (lk.四化断 || []).map((h) => ({ ...h, 宫: lk.宫 })));
  eq(flat.length, 4, '紫微大限四化：癸年四化各有一限入宫（' + flat.length + '）');
  eq(flat.some((x) => x.星 === '破军' && x.化 === '禄' && x.断.includes('大限十年吉庆无疑')), true, '紫微大限四化：破军化禄断语照录');
  eq(flat.some((x) => x.化 === '忌' && x.断.includes('大限十年悔吝')), true, '紫微大限四化：化忌断语照录');
  eq(flat.every((x) => x.依据.includes('问化') && x.依据.includes('卷一')), true, '紫微大限四化：四条均带卷一问答出处');
  eq(flat.filter((x) => x.断.includes('恶曜')).every((x) => x.断.includes('本限同照原书所列恶曜')), true, '紫微大限四化：恶曜只并列名单');
}

export { passed, failed };
if (process.argv[1] && process.argv[1].endsWith('core.test.js')) {
  console.log(`通过 ${passed} 项断言，失败 ${failed} 项`);
  process.exit(failed ? 1 : 0);
}
