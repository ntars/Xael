/**
 * src/core/features/render/four-pillars.js —— 八字相关功能的文本出料
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 覆盖 4 项：八字完整排盘（排八字）· 八字运程（排运程）· 格局喜用（解格局）· 神煞全表（查神煞）。
 * 各函数返回多行文本，首行【标题】，行内不出现中文分号。
 */

import { fourPillarsChart as baziChart } from '../../four-pillars/chart.js';
import { luckCyclesOf } from '../../four-pillars/luck-cycles.js';
import { luckJudgementOf } from '../../four-pillars/luck-judgement.js';
import { yearLordOf } from '../../four-pillars/year-lord.js';
import { chartPatternsOf } from '../../four-pillars/patterns.js';
import { symbolicStarsOf } from '../../four-pillars/symbolic-stars.js';
import { GANZHI60, tidy, dot } from './shared.js';

/* ------------------------------------------------------------------ *
 * 一、八字完整排盘（排八字）
 * ------------------------------------------------------------------ */

/**
 * @param {Object} ent 生辰实体 {date:{year,month,day}, time:{hour,minute}, gender:'male'|'female', name}
 * @returns {{text?:string, prompt?:string}}
 */
export function fourPillarsText(ent) {
  if (!ent || !ent.date || !ent.date.year) {
    return { prompt: '八字排盘需要出生年月日，例如「白玖玖，女，2005年6月9日」（可含时辰）。' };
  }
  if (!ent.date.month || !ent.date.day) {
    return { prompt: '排盘需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const g = zhGender(ent);
  if (!g) return { prompt: '排盘需出生性别（男/女），请补充，例如「白玖玖，女，2005年6月9日子时」。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const i = (ent.time && ent.time.minute) || 0;
  const name = ent.name || '命主';
  const c = baziChart({ y, m, d, h, i, gender: g, name });
  const P = c.pillars;

  const L = [];
  L.push('【八字排盘】' + name + '（' + g + '）' + y + '年' + m + '月' + d + '日' + h + '时，' + c.lunar + '。');
  L.push('年柱：' + P.年.干支 + '（' + P.年.干 + '）');
  L.push('月柱：' + P.月.干支 + '（' + P.月.干 + '）');
  L.push('日柱：' + P.日.干支 + '（' + P.日.干 + '·日主）');
  L.push('时柱：' + P.时.干支 + '（' + P.时.干 + '）');
  L.push('藏干：年' + P.年.藏干.join('') + ' 月' + P.月.藏干.join('') + ' 日' + P.日.藏干.join('') + ' 时' + P.时.藏干.join('') + '。');
  L.push('十神：年' + P.年.十神 + ' 月' + P.月.十神 + ' 时' + P.时.十神 + '（日主' + c.日主.干 + '·' + c.日主.五行 + '）。');
  // 十二长生：星运=日主对各柱地支，自坐=各柱天干坐本地支
  L.push('十二长生：星运 ' + [P.年.星运, P.月.星运, P.日.星运, P.时.星运].join(' ')
    + '；自坐 ' + [P.年.自坐, P.月.自坐, P.日.自坐, P.时.自坐].join(' ') + '（年/月/日/时）。');
  L.push('纳音：' + P.年.纳音 + ' ' + P.月.纳音 + ' ' + P.日.纳音 + ' ' + P.时.纳音
    + '；胎元' + c.胎元 + ' 旬空' + [P.年.旬空.join(''), P.月.旬空.join(''), P.日.旬空.join(''), P.时.旬空.join('')].join('/') + '。');
  if (c.命宫 && c.命宫.干支) {
    L.push('命宫：' + c.命宫.干支 + '（生月从子上起正月逆行、生时加之顺行逢卯安命，'
      + '《三命通会·论坐命宫》；宫干由年干五虎遁推）。');
  }
  L.push('五行：' + ['木', '火', '土', '金', '水']
    .map((wx) => wx + c.五行.统计[wx] + '个（' + c.五行.百分比[wx] + '%）').join('，')
    + '，' + (c.五行.缺.length ? c.五行.缺文本 : '五行不缺') + '。');
  if (c.月令司令) {
    const cd = c.月令司令;
    L.push('月令司令：' + cd.月支 + '月' + (cd.节 ? cd.节 + '后第' + cd.节后天数 + '日，' : '')
      + '「' + cd.司令 + '」用事（第' + cd.段 + '段' + cd.段日数 + '日中之第' + cd.段内日 + '日，'
      + '《三命通会·论人元司事》）。');
  }
  L.push('换日口径：' + c.换日口径 + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、八字运程（排运程）
 * ------------------------------------------------------------------ */

export function luckCyclesText(ent, text) {
  if (!ent || !ent.date || !ent.date.year) return { prompt: '推运程需要出生年月日，例如「1990年8月1日」。' };
  if (!ent.date.month || !ent.date.day) return { prompt: '推运程需要完整的出生年月日，请补充，例如「1990年8月1日」。' };
  const g = zhGender(ent);
  if (!g) return { prompt: '推运程需出生性别（男/女，定顺逆），请补充。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const c = baziChart({ y, m, d, h, i: (ent.time && ent.time.minute) || 0, gender: g, name: ent.name || '命主' });
  const P = c.pillars;
  const dm = c.日主.干;
  const dy = luckCyclesOf({ y, m, d, h, gender: g }, 8);

  const L = [];
  L.push('【八字运程】' + P.年.干支 + '年 ' + P.月.干支 + '月 ' + P.日.干支 + '日 ' + P.时.干支 + '时，日主' + dm
    + '（' + c.日主.五行 + '），' + dy.排法依据 + '。');
  L.push('起运：' + dy.起运.文本 + '（交节 ' + dy.起运.交节 + '，落地 ' + dy.起运.落地 + '）。');
  L.push('起运折算：' + dot(tidy(dy.起运.note)));
  L.push('大运：' + dy.大运.map((x) => x.干支 + '（' + x.岁数区间 + '·' + x.年份区间 + '）').join('、') + '。');
  // 大运判读（运名 / 长生阶段 / 喜忌），依据《三命通会·论大运》
  const lj = luckJudgementOf({ y, m, d, h, gender: g }, 8);
  L.push('大运以地支为主（《三命通会·论大运》「在支则弃天干之物」），逐步判读（主用' + (lj.主用 || '未定') + '，身' + lj.身强弱 + '）：');
  lj.步.forEach((x) => {
    L.push(x.干支 + '（' + x.岁数区间 + '·' + x.运名 + '·' + x.长生 + '）' + x.长生断语 + '；' + (x.喜忌.join('；') || '无可判') + '；合判：' + x.合判 + '。');
  });
  L.push('大运判读口径：' + dot(tidy(lj.口径)));

  if (dy.小运) {
    const q = dy.小运.起年运法;
    const s2 = dy.小运.时上起法;
    L.push('小运（起年运法·' + q.方向 + '，一岁一位）：' + q.诸位.slice(0, 10).map((x) => x.虚岁 + '岁' + x.干支).join('、') + '。');
    if (s2.诸位.length) L.push('小运（时上起法·' + s2.方向 + '，自时柱起）：' + s2.诸位.slice(0, 10).map((x) => x.虚岁 + '岁' + x.干支).join('、') + '。');
    L.push('小运异同：' + dot(tidy(dy.小运.异同)));
    L.push('小运口径：' + dot(tidy(dy.小运.口径)));
  }

  // 流年：默认从今年起十年，附对日主的十神
  const t = String(text || '');
  // 问句里若出现两个年份，第二个视为要看的流年（「排运程 1990年… 2034年」）；
  // 只出现一个年份且不是出生年，或明说「流年」时，也按它算。
  const years = (t.match(/(19|20)\d{2}/g) || []).map(Number);
  const py = pullYear(t);
  const second = years.find((x) => x !== y);
  const y0 = (second && second !== y) ? second
    : ((py && (py !== y || /流年|流月|流日/.test(t))) ? py : new Date().getFullYear());
  const ln = [];
  for (let k = 0; k < 10; k++) {
    const yy = y0 + k;
    const gz = GANZHI60[((yy - 4) % 60 + 60) % 60];
    ln.push(yy + '『' + gz + '』');
  }
  L.push('流年（' + y0 + ' 起十年）：' + ln.join('、') + '。');

  // 流年太岁：按《三命通会·论太岁》判与日主、日柱、大运的关系
  const curLuck = dy.大运.find((x) => y0 >= x.起始年份 && y0 <= x.结束年份);
  const yl = yearLordOf({ y, m, d, h, gender: g }, y0, curLuck ? { 大运干支: curLuck.干支 } : {});
  L.push('太岁（' + yl.流年 + ' ' + yl.太岁 + '）：' + yl.判.map((x) => x.名 + '（' + x.吉凶 + '）——' + x.说明).join('；') + '。');
  if (yl.救情) L.push('救与情：' + yl.救情.说明 + '（救：' + (yl.救情.救.length ? yl.救情.救.join('、') : '无') + '；情：' + (yl.救情.情.length ? yl.救情.情.join('、') : '无') + '）。');
  L.push('口径：大运起于月柱，阳男阴女顺排、阴男阳女逆排，一位十年，以立春换柱；流年太岁与日主的关系依《三命通会·论太岁》（岁伤日干祸轻、日犯岁君灾重，五行有救四柱有情则凶反为吉）；流年与大运之间的岁运四判（岁冲运则崩、运冲岁则晦、运克太岁则祸轻、日干冲运最忌）依《三命通会·明通赋》注与《三命通会·巫咸撮要》注。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、格局喜用（解格局）
 * ------------------------------------------------------------------ */

export function chartPatternsText(ent) {
  if (!ent || !ent.date || !ent.date.year) return { prompt: '看格局需要出生年月日，例如「1990年8月15日14时 看格局」（时辰缺失按 14 时补）。' };
  if (!ent.date.month || !ent.date.day) return { prompt: '看格局需要完整的出生年月日，请补充，例如「1990年8月15日14时 看格局」。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const g = zhGender(ent) || '男';
  const r = chartPatternsOf({ y, m, d, h, i: (ent.time && ent.time.minute) || 0, gender: g });

  const L = [];
  const ge = r.格局 || {};
  const ws = r.身强弱 || {};
  const th = r.调候 || {};
  const ys = r.用神 || {};
  const xj = r.喜忌 || {};

  L.push('【八字格局·用神】' + (r.命主 || '命主') + '，' + [r.四柱.年, r.四柱.月, r.四柱.日, r.四柱.时].join(' ' ) + '。');
  L.push('日主：' + r.日主 + '；月令：' + r.月令 + '。');
  L.push('格局：' + (ge.name || '—') + (ge.类别 ? '（' + ge.类别 + '）' : '') + '。');
  L.push('取格依据：' + dot(tidy(ge.依据 || '—')));
  if (r.月令司令) {
    const c = r.月令司令;
    L.push('月令司令：' + c.月支 + '月' + (c.节 ? c.节 + '后第' + c.节后天数 + '日，' : '') + '「' + c.司令 + '」用事（' + (c.十神 || '') + '，第' + c.段 + '段' + c.段日数 + '日中之第' + c.段内日 + '日）。');
  }
  L.push('成格要：' + dot(tidy((r.格局成败 && r.格局成败.成格要) || '—'))
    + '破格忌：' + dot(tidy((r.格局成败 && r.格局成败.破格忌) || '—')));
  L.push('强弱：' + (ws.判 || '—') + '（得令 ' + (ws.得令 ? '是' : '否') + '，通根 ' + ws.得地 + '，帮扶 ' + ws.得势 + '）。');
  L.push('调候：' + (th.第一用神 ? th.第一用神 + ' 为主，佐 ' + (th.佐 || []).join('、') : '—') + '（' + dot(tidy(th.note || '')) + '）');
  L.push('通关：' + (r.通关 && r.通关.length
    ? r.通关.map((x) => x.相战 + '取' + x.通关).join('；')
    : '无两行相战需通关') + '。');
  L.push('用神：扶抑取 ' + ys.扶抑 + '，调候取 ' + (ys.调候 || '—') + '，通关取 ' + (ys.通关 || '—') + '，综合主用 ' + ys.综合主用 + '。');
  if (ys.格局) {
    L.push('格局用神（《子平真诠》' + ys.格局.顺逆 + '）：喜 ' + (ys.格局.喜 || []).join('、') + '；忌 ' + (ys.格局.忌 || []).join('、') + '。');
    L.push(dot(tidy(ys.格局.依据 || '')));
  }
  if (ys.冲突提示) L.push('分歧标注：' + dot(tidy(ys.冲突提示)));
  // 三派取用并列：把「扶抑 / 调候 / 顺逆」各自的成立条件与结论摆出来，打架处直说，不合成一句
  const ss = r['三派取用'];
  if (ss) {
    const one = (x) => (x && x.成立
      ? `${x.派}取${x.用神}（${x.条件}）`
      : `${x.派}不出用神（${x.条件 || '条件不成立'}）`);
    L.push('三派取用：' + [one(ss['扶抑']), one(ss['调候']), one(ss['顺逆'])].join('；') + '。');
    L.push('取用次序：' + dot(tidy(ss['次序'] || '')) + '本仓主用 ' + (ss['主用'] || '—') + '。');
    if ((ss['异同'] || []).length) L.push('流派异同：' + tidy(ss['异同'].join(' ')));
    if (ss['说明']) L.push(dot(tidy(ss['说明'])));
  }
  L.push('喜忌（扶抑派）：喜 ' + xj.喜神五行 + '、忌 ' + xj.忌神五行 + '。');
  if (r.外格提示 && r.外格提示.length) L.push('外格提示：' + r.外格提示.map((x) => tidy(x)).join(' '));
  if (r.缺口) L.push('口径与缺口：' + dot(tidy(r.缺口)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、神煞全表（查神煞）
 * ------------------------------------------------------------------ */

export function symbolicStarsText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '神煞需出生年月日时，例如「1990年8月15日14时 八字神煞」。' };
  }
  const h = ent.time && ent.time.hour != null ? ent.time.hour : null;
  if (h == null) return { prompt: '神煞须给时辰（时柱决定半数神煞落位），例如「1990年8月15日14时 八字神煞」。' };

  const r = symbolicStarsOf({
    y: ent.date.year, m: ent.date.month, d: ent.date.day, h,
    i: (ent.time && ent.time.minute) || 0, gender: ent.gender,
  });

  const L = [];
  L.push('【八字·神煞】' + r.四柱 + '。');
  const hit = r.命中 || [];
  if (hit.length) {
    hit.forEach((x) => {
      L.push(x.名 + '：在' + (x.位 || '—') + '——' + dot(tidy(x.义 || '')) + '查法：' + dot(tidy(x.查法 || '')));
    });
  } else {
    L.push('本盘常用神煞皆未落柱。');
  }
  if (r.汇总) L.push('汇总：' + dot(tidy(r.汇总)));
  if (r.缺口) L.push('标注：' + dot(tidy(r.缺口)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 公共小件
 * ------------------------------------------------------------------ */

/** 实体性别 → 中文（无则 null） */
export function zhGender(ent) {
  const g = ent && ent.gender;
  if (g === 'female' || g === '女') return '女';
  if (g === 'male' || g === '男') return '男';
  return null;
}

/** 从文本里抓四位年份（流年起点的显式声明用） */
export function pullYear(text) {
  const m = String(text || '').match(/(19|20)\d{2}/);
  return m ? +m[0] : 0;
}
