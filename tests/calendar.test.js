/**
 * tests/calendar.test.js —— 历法内核测试（Node 直跑，零依赖断言）
 * 运行：node tests/calendar.test.js
 */

import {
  solarToJdn, jdnToSolar, dayNo, fromDayNo, weekday, isLeap, daysInMonth,
} from '../src/core/calendar/julian.js';
import { solarTermsTable, prevSolarTerm, nextSolarTerm } from '../src/core/calendar/solar-terms.js';
import { TIANSHEN_TABLE, TIANSHEN_ALIAS } from '../src/core/almanac/day-officers.js';
import { PENGZU_VARIANT } from '../src/core/almanac/directions.js';
import { xiu28Of } from '../src/core/almanac/lunar-mansions.js';
import { siLiSiJueOf, yueJiOf, monthBreakOf, criticalDaysOf } from '../src/core/almanac/critical-days.js';
import {
  solarToLunisolar, lunisolarToSolar, lunarYearDays, leapMonth, lunarDayText,
} from '../src/core/calendar/lunisolar.js';
import {
  daySexagenary, daySexagenaryIndex, yearSexagenary, monthSexagenary, hourSexagenary, effectiveDay, hourBranchIndex,
} from '../src/core/calendar/sexagenary.js';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  if (actual === expected) { pass++; } else { fail++; console.error(`✗ ${label}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`); }
}

// ---------- 儒略日 / 公历工具 ----------
eq(solarToJdn(2000, 1, 1), 2451545, 'JDN 2000-01-01');
eq(jdnToSolar(2451545).d, 1, 'JDN 反推日');
eq(jdnToSolar(2451545).m, 1, 'JDN 反推月');
eq(jdnToSolar(2451545).y, 2000, 'JDN 反推年');
eq(dayNo(1970, 1, 1), 0, 'Unix 日序原点');
eq(fromDayNo(0).y, 1970, '日序反推年');
eq(weekday(2024, 1, 1), 1, '2024-01-01 星期一');
eq(isLeap(2000), true, '2000 闰年');
eq(isLeap(1900), false, '1900 平年');
eq(daysInMonth(2000, 2), 29, '2000-02 天数');
eq(daysInMonth(1900, 2), 28, '1900-02 天数');

// ---------- 节气（天文算法，分钟级） ----------
const t2024 = solarTermsTable(2024);
eq(t2024['立春'].text, '2024-02-04', '2024 立春');
eq(t2024['冬至'].text, '2024-12-21', '2024 冬至');
eq(t2024['夏至'].text, '2024-06-21', '2024 夏至');
eq(t2024['小寒'].text, '2024-01-06', '2024 小寒');
eq(t2024['大雪'].text, '2024-12-06', '2024 大雪');
const t2000 = solarTermsTable(2000);
eq(t2000['春分'].text, '2000-03-20', '2000 春分');
eq(t2000['立春'].text, '2000-02-04', '2000 立春');
eq(t2000['冬至'].text, '2000-12-21', '2000 冬至');
eq(prevSolarTerm(2024, 2, 10).name, '立春', '2024-02-10 上一节气');
eq(nextSolarTerm(2024, 2, 10).name, '雨水', '2024-02-10 下一节气');
// 全表顺序单调递增（2020-2030 十年 × 24 节气）
let sorted = true;
for (let y = 2020; y <= 2030; y++) {
  const t = solarTermsTable(y);
  const seq = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  for (let i = 1; i < 24; i++) if (t[seq[i]].text < t[seq[i - 1]].text) { sorted = false; }
}
eq(sorted, true, '2020-2030 节气表年序单调');

// ---------- 农历（天文朔日版） ----------
eq(lunarDayText(2024, 2, 10), '正月初一', '2024 春节');
eq(lunarDayText(2025, 1, 29), '正月初一', '2025 春节');
eq(lunarDayText(2024, 9, 17), '八月十五', '2024 中秋');
eq(lunarDayText(2023, 3, 22), '闰二月初一', '2023 闰二月初一');
eq(lunarDayText(2025, 7, 25), '闰六月初一', '2025 闰六月初一');
eq(leapMonth(2023), 2, '2023 闰二月');
eq(leapMonth(2025), 6, '2025 闰六月');
eq(leapMonth(2024), 0, '2024 无闰月');
eq(lunarYearDays(2024), 384, '2024 农历年天数');
// 往返一致（1901-2099 广域抽样）
let rt = true;
for (let n = dayNo(1901, 1, 5); n <= dayNo(2099, 12, 25); n += 397) {
  const s = fromDayNo(n);
  const l = solarToLunisolar(s.y, s.m, s.d);
  if (!l) { rt = false; break; }
  const s2 = lunisolarToSolar(l.y, l.m, l.d, l.isLeap);
  if (s2.y !== s.y || s2.m !== s.m || s2.d !== s.d) { rt = false; console.error('往返失败', s, l, s2); break; }
}
eq(rt, true, '农历往返一致（1901-2099 抽样）');

// ---------- 干支（锚点=公开万年历事实） ----------
eq(daySexagenary(2000, 1, 1), '戊午', '2000-01-01 戊午日');
eq(daySexagenary(1949, 10, 1), '甲子', '1949-10-01 甲子日');
eq(daySexagenary(1984, 2, 2), '丙寅', '1984-02-02 丙寅日');
eq(daySexagenary(1900, 1, 1), '甲戌', '1900-01-01 甲戌日');
eq(yearSexagenary(2024, 2, 10), '甲辰', '2024-02-10 年柱 甲辰');
eq(yearSexagenary(2024, 2, 3), '癸卯', '2024-02-03（立春前）年柱 癸卯');
eq(yearSexagenary(2024, 2, 4), '甲辰', '2024-02-04（立春日）年柱 甲辰');
eq(monthSexagenary(2024, 2, 10), '丙寅', '2024-02-10 月柱 丙寅');
eq(monthSexagenary(2024, 1, 10), '乙丑', '2024-01-10（小寒后）月柱 乙丑');
eq(monthSexagenary(2024, 1, 5), '甲子', '2024-01-05（小寒前）月柱 甲子');
eq(monthSexagenary(2023, 12, 10), '甲子', '2023-12-10（大雪后）月柱 甲子');
eq(monthSexagenary(2023, 12, 5), '癸亥', '2023-12-05（大雪前）月柱 癸亥');
eq(hourBranchIndex(23), 0, '23 时子支');
eq(hourBranchIndex(0), 0, '0 时子支');
eq(hourBranchIndex(14), 7, '14 时未支');
eq(hourSexagenary('甲', 14), '辛未', '甲日 14 时 辛未时');
eq(hourSexagenary('甲', 23), '甲子', '甲日 23 时 甲子时');
eq(effectiveDay(2024, 1, 1, 23).d, 2, '23 时换次日');

// ---------- 黄历（部件核验，事实=公开万年历） ----------
const { almanacDaily, monthView, jieqiAround } = await import('../src/core/almanac/daily.js');
const h1 = almanacDaily(2024, 2, 10);
eq(h1.ganzhi.日, '甲辰', '黄历 2024-02-10 日柱');
eq(h1.值星.name, '满', '黄历 2024-02-10 值星');
eq(h1.二十八宿.宿, '氐', '黄历 2024-02-10 值宿二十八宿');
eq(h1.冲煞.冲, '戊戌', '黄历 2024-02-10 冲（冲干=日干+4，参照黄历口径）');
eq(h1.冲煞.冲生肖, '狗', '黄历 2024-02-10 甲辰日冲戊戌（戌=狗）');
eq(h1.冲煞.煞方, '南', '黄历 2024-02-10 煞方');
eq(h1.彭祖百忌.干, '甲不开仓财物耗散', '黄历 2024-02-10 彭祖干');
eq(h1.胎神, '占门栖 房内东', '黄历 2024-02-10 胎神（含空格与内外口径，参照黄历）');
eq(h1.法定假期.type, 'holiday', '黄历 2024-02-10 春节假期');
const h2 = almanacDaily(2024, 1, 1);
eq(h2.节日.includes('元旦'), true, '2024-01-01 元旦');
eq(h2.值星.name, '建', '2024-01-01 值星建');
const h3 = almanacDaily(2024, 2, 12); // 丙午日寅月 → 月德
eq(h3.吉神宜趋.includes('月德'), true, '2024-02-12 丙日寅月得月德');
const h4 = almanacDaily(2024, 2, 14); // 甲寅日 寅月支=寅 → 月破
eq(h4.凶煞宜忌.includes('月破'), true, '2024-02-14 甲寅寅月得月破');
eq(jieqiAround(2024, 2, 10).prev.name, '立春', '2024-02-10 上一节气');
eq(jieqiAround(2024, 2, 10).next.name, '雨水', '2024-02-10 下一节气');
eq(monthView(2024, 2).length, 29, '2024-02 月视图 29 天');

/* ------------------------------------------------------------------ *
 * 黄历·十二天神：用《钦定协纪辨方书·黄道黑道》的起法公式逐格校验 144 表
 * 书云「青龙正月起子……皆顺行六阳辰」「明堂正月起丑……顺行六阴辰」，
 * 即正月（寅月）子日青龙，换月青龙进二辰；当日天神 = ORDER[(日支 − 青龙临支) mod 12]。
 * ------------------------------------------------------------------ */
{
  const ORDER = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'];
  const ZHIS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  let bad = 0;
  for (let mz = 0; mz < 12; mz += 1) {
    const start = (((mz - 2) * 2) % 12 + 12) % 12; // 该月青龙所临日支
    for (let dz = 0; dz < 12; dz += 1) {
      const want = ORDER[((dz - start) % 12 + 12) % 12];
      if (TIANSHEN_TABLE[ZHIS[mz]][ZHIS[dz]] !== want) bad += 1;
    }
  }
  eq(bad, 0, '十二天神 144 格与《协纪辨方书》起法逐格相符');
}

// 吉神凶煞「历例复算」：《协纪辨方书·义例》起例公式 vs 通书表
{
  const { godsByRule, seasonOfBranch, RULE_GODS } = await import('../src/core/almanac/auspicious-rules.js');
  eq(seasonOfBranch('寅'), '春', '历例·寅月属春');
  eq(seasonOfBranch('辰'), '春', '历例·辰月归春（四季月归前季）');
  eq(seasonOfBranch('亥'), '冬', '历例·亥月属冬');
  eq(godsByRule('寅', '甲子').吉神.includes('生气'), true, '历例·寅月生气在子');
  eq(godsByRule('寅', '甲丑').吉神.includes('生气'), false, '历例·寅月丑日非生气');
  eq(godsByRule('寅', '甲午').凶煞.includes('死气'), true, '历例·寅月死气在午');
  eq(godsByRule('寅', '甲戌').凶煞.includes('月厌'), true, '历例·寅月月厌在戌');
  eq(godsByRule('卯', '甲酉').凶煞.includes('月厌'), true, '历例·卯月月厌在酉');
  eq(godsByRule('寅', '甲辰').吉神.includes('六仪'), true, '历例·寅月六仪在辰');
  eq(godsByRule('卯', '甲卯').吉神.includes('六仪'), true, '历例·卯月六仪在卯');
  eq(godsByRule('寅', '甲戌').吉神.includes('天医'), true, '历例·寅月天医在戌');
  eq(godsByRule('卯', '甲亥').吉神.includes('天医'), true, '历例·卯月天医在亥');
  eq(godsByRule('寅', '丙辰').吉神.includes('月恩'), true, '历例·寅月丙日为月恩');
  eq(godsByRule('卯', '丁巳').吉神.includes('月恩'), true, '历例·卯月丁日为月恩');
  eq(godsByRule('卯', '丙午').吉神.includes('四相'), true, '历例·春月丙日四相');
  eq(godsByRule('酉', '壬子').吉神.includes('四相'), true, '历例·秋月壬日四相');
  eq(godsByRule('寅', '甲巳').凶煞.includes('五虚'), true, '历例·春月巳日五虚');
  eq(godsByRule('寅', '戊寅').吉神.includes('天赦'), true, '历例·春戊寅为天赦');
  eq(godsByRule('寅', '甲寅').吉神.includes('天赦'), false, '历例·春甲寅非天赦');
  const day = almanacDaily(2024, 2, 10, 12);
  eq(Array.isArray(day.历例吉神), true, '历例吉神字段存在');
  eq(day.历例吉神.includes('福德'), true, '2024-02-10 历例含福德');
  eq(day.历例凶煞.includes('天狗'), true, '2024-02-10 历例含天狗');
  eq(godsByRule('寅', '甲寅').吉神.includes('要安'), true, '历例·寅月寅日要安');
  eq(godsByRule('寅', '甲申').吉神.includes('要安'), false, '历例·寅月申日非要安');
  eq(godsByRule('卯', '甲申').吉神.includes('要安'), true, '历例·卯月申日要安');
  eq(RULE_GODS.吉神.length + RULE_GODS.凶煞.length, 43, '历例覆盖 43 神');
  // 九坎/九焦：四季逆、四仲逆、四孟逆三段各四个月（《协纪·卷六》历例）
  eq(godsByRule('寅', '甲辰').凶煞.indexOf('九坎') >= 0, true, '九坎：寅月在辰');
  eq(godsByRule('卯', '甲丑').凶煞.indexOf('九坎') >= 0, true, '九坎：卯月在丑（四季逆）');
  eq(godsByRule('午', '甲卯').凶煞.indexOf('九坎') >= 0, true, '九坎：午月在卯（四仲逆）');
  eq(godsByRule('戌', '甲寅').凶煞.indexOf('九坎') >= 0, true, '九坎：戌月在寅（四孟逆）');
  eq(godsByRule('寅', '甲辰').凶煞.indexOf('九焦') >= 0, true, '九焦与九坎同例');
  // 新增「日神取一定干支者」（卷九·立成）：天恩、鸣吠、鸣吠对、五合、除神（=五离）、解神、
  // 八专、触水龙、重日 九神；宝日/义日/制日/专日/伐日/无禄 六神虽有定干支但通书两栏从不列，不推。
  eq(godsByRule('寅', '甲子').吉神.indexOf('天恩') >= 0, true, '天恩：甲子日（立成表首条）');
  eq(godsByRule('寅', '甲午').吉神.indexOf('鸣吠') >= 0, true, '鸣吠：甲午日');
  eq(godsByRule('寅', '丙子').吉神.indexOf('鸣吠对') >= 0, true, '鸣吠对：丙子日');
  eq(godsByRule('寅', '丙寅').吉神.indexOf('五合') >= 0, true, '五合：寅日（历例「五合者寅夘日也」）');
  eq(godsByRule('寅', '丙申').吉神.indexOf('除神') >= 0, true, '除神：申日（即五离之日，通书列吉神）');
  eq(godsByRule('寅', '丙申').凶煞.indexOf('五离') >= 0, true, '五离：申日（与除神同日、列凶煞）');
  eq(godsByRule('寅', '甲申').吉神.indexOf('解神') >= 0, true, '解神：正二月申（历例）');
  eq(godsByRule('寅', '甲寅').凶煞.indexOf('八专') >= 0, true, '八专：甲寅日');
  eq(godsByRule('寅', '丙子').凶煞.indexOf('触水龙') >= 0, true, '触水龙：丙子日');
  eq(godsByRule('寅', '己亥').凶煞.indexOf('重日') >= 0, true, '重日：己亥日');
  // 复日按《协纪·卷九·辨讹》取「月建所同之干」：正月甲、七月庚
  eq(godsByRule('寅', '甲子').凶煞.indexOf('复日') >= 0, true, '复日：正月（寅）见甲（辨讹正通书「正七连庚甲」之误）');
  eq(godsByRule('寅', '庚子').凶煞.indexOf('复日') >= 0, false, '复日：正月见庚不作复日（通书误）');
  eq(godsByRule('申', '庚子').凶煞.indexOf('复日') >= 0, true, '复日：七月（申）见庚');
  // 新增六神：天德（卯月取申）、天德合、月德（寅月见丙）、月德合、月空（寅月见壬）、不将（逐月表）
  eq(godsByRule('卯', '甲申').吉神.indexOf('天德') >= 0, true, '天德：卯月（坤位）见申日');
  eq(godsByRule('卯', '丁巳').吉神.indexOf('天德合') >= 0, true, '天德合：卯月天德在申（坤位），申之六合为巳');
  eq(godsByRule('寅', '丙午').吉神.indexOf('月德') >= 0, true, '月德：寅月见丙');
  eq(godsByRule('寅', '辛丑').吉神.indexOf('月德合') >= 0, true, '月德合：丙之合为辛');
  eq(godsByRule('寅', '壬子').吉神.indexOf('月空') >= 0, true, '月空：寅月见壬');
  eq(godsByRule('寅', '辛亥').吉神.indexOf('不将') >= 0, true, '不将：正月辛亥（历例首条）');
}
  // 《钦定协纪辨方书·卷一·二十八宿配日》七元说：
  //   「一元甲子日起虚，二元甲子起奎，三元起毕，四元起鬼，五元起翼，六元起氐，七元起箕，
  //     至七元尽而甲子又起虚，周而复始。但一元起于何年月日则不可得。」
  //   60 日与 28 日的公倍数是 420 日，故每 420 日甲子日的值宿必然走遍这七宿一圈。
  //   我们的锚点相位不同（原文自认相位不可得），但**周期结构必须与七元环同构**。
  {
    const SEVEN = ['虚', '奎', '毕', '鬼', '翼', '氐', '箕'];
    const seq = [];
    for (let i = 0; i < 421; i++) {
      const t = new Date(Date.UTC(2024, 0, 1 + i));
      const yy = t.getUTCFullYear(); const mm = t.getUTCMonth() + 1; const dd = t.getUTCDate();
      if (daySexagenaryIndex(yy, mm, dd) === 0) seq.push(xiu28Of(yy, mm, dd).宿);
    }
    eq(seq.length, 8, '二十八宿·420 日内恰 8 个甲子日');
    eq(seq[0], seq[7], '二十八宿·七元环闭合（第 8 个甲子日回到首宿）');
    eq(new Set(seq.slice(0, 7)).size, 7, '二十八宿·七元七宿互不相同');
    eq(seq.slice(0, 7).every((x) => SEVEN.indexOf(x) >= 0), true, '二十八宿·甲子日值宿必落七元之内');
  }


// —— 彭祖百忌：底本异文（《钦定协纪辨方书·百忌日》卷三十五附录 vs 通行本）——
{
  // 底本短式与通行本改字只有这三处，多一处少一处都是错
  eq(Object.keys(PENGZU_VARIANT).sort().join(','), '壬,戌,酉', '彭祖异文恰三处（壬/酉/戌）');
  eq(PENGZU_VARIANT['壬'].底本, '壬不决水', '彭祖底本·壬作决水');
  eq(PENGZU_VARIANT['酉'].底本, '酉不防客', '彭祖底本·酉作防客');
  eq(PENGZU_VARIANT['戌'].底本, '戌不乞狗', '彭祖底本·戌作乞狗');
  // 只在命中的日子出异文，别的日子不许乱出
  const v1 = almanacDaily(2024, 3, 9, 12).彭祖百忌.异文;
  eq(v1.length, 1, '2024-03-09 壬日有一条异文');
  eq(v1[0].includes('决水'), true, '2024-03-09 异文含「决水」');
  eq(almanacDaily(2024, 3, 10, 12).彭祖百忌.异文[0].includes('防客'), true, '2024-03-10 酉日异文含「防客」');
  eq(almanacDaily(2024, 3, 11, 12).彭祖百忌.异文[0].includes('乞狗'), true, '2024-03-11 戌日异文含「乞狗」');
  eq(almanacDaily(2024, 2, 10, 12).彭祖百忌.异文.length, 0, '2024-02-10 甲辰日无异文');
}

// —— 十二天神别名（《协纪·卷十》引曹震圭，十二神各有别名）——
{
  eq(Object.keys(TIANSHEN_ALIAS).length, 12, '十二天神别名齐备（含勾陈作土勃）');
  eq(TIANSHEN_ALIAS['金匮'], '天宝', '天神别名·金匮作天宝');
  eq(TIANSHEN_ALIAS['勾陈'], '土勃', '天神别名·勾陈作土勃');
}


/* ---- 黄历·四离四绝 / 月忌日 / 月破（《钦定协纪辨方书》）---- */
{
  const jue = siLiSiJueOf(2024, 2, 3);
  eq(jue && jue.类, '四绝', '四绝·立春前一日');
  eq(jue && jue.节气, '立春', '四绝·节气名');
  eq(siLiSiJueOf(2024, 2, 4), null, '四绝·立春当日不判（原文为前一辰）');
  const li = siLiSiJueOf(2024, 6, 20);
  eq(li && li.类, '四离', '四离·夏至前一日');
  eq(li && li.节气, '夏至', '四离·节气名');
  eq(siLiSiJueOf(2024, 3, 19) && siLiSiJueOf(2024, 3, 19).节气, '春分', '四离·春分前一日');
  eq(siLiSiJueOf(2024, 9, 21) && siLiSiJueOf(2024, 9, 21).节气, '秋分', '四离·秋分前一日');

  eq(!!yueJiOf(5) && !!yueJiOf(14) && !!yueJiOf(23), true, '月忌日·初五十四二十三');
  eq(yueJiOf(6), null, '月忌日·其余日不判');

  eq(!!monthBreakOf('未', '丑'), true, '月破·日支冲月建');
  eq(monthBreakOf('子', '丑'), null, '月破·非冲不判');

  const r1 = almanacDaily(2024, 2, 3);
  eq((r1['特别忌'] || []).some((x) => x.类 === '四绝'), true, '黄历·立春前一日出四绝');
  const r2 = almanacDaily(2024, 2, 14);
  eq((r2['特别忌'] || []).some((x) => x.类 === '月忌日'), true, '黄历·初五出月忌日');
  eq((r2['特别忌'] || []).some((x) => x.类 === '月破'), true, '黄历·月破日出月破');
  const all = criticalDaysOf(2024, 2, 14, '未', '丑');
  eq(all.every((x) => !('分' in x) && !('权重' in x)), true, '特别忌不打分、不设权重');
  eq(all.every((x) => /协纪辨方书/.test(x.依据)), true, '特别忌每条带篇名');
  eq(almanacDaily(2024, 2, 10)['特别忌'].length, 0, '黄历·平常日无特别忌');
}

/* ---- 黄历·宜忌表的可溯性边界（月破与原书不一致，须显式量化）---- */
{
  const r = almanacDaily(2024, 2, 14);
  const po = (r['特别忌'] || []).find((x) => x.类 === '月破');
  eq(!!po, true, '月破·该日出月破');
  eq(/不一致/.test(po.说明), true, '月破·说明须点明与「诸事不宜」不一致');
  eq(po.说明.includes(String(r.宜.length)), true, '月破·说明须写出当日宜项数');
  eq(/通书表/.test(po.说明), true, '月破·说明须点明来源为通书表而非原书');
}

export const passed = pass;
export const failed = fail;

if (process.argv[1] && process.argv[1].endsWith('calendar.test.js')) {
  console.log(`\n通过 ${pass} 项断言，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
}
