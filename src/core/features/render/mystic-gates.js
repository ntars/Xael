/**
 * src/core/features/render/mystic-gates.js —— 奇门遁甲七式 + 大六壬两式的文本出料
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 覆盖 9 项：排奇门（时家）· 排日家 · 排刻家 · 排宝鉴日奇 · 排年家月家 · 排飞盘 ·
 *            解奇门格局 · 排六壬 · 解毕法。
 * 各家盘面不是同一张盘，故每块都写明「本式与谁不同」，不把两派合成一张。
 */

import { mysticGatesHourChart } from '../../mystic-gates/hour-chart.js';
import { mysticGatesDayChart } from '../../mystic-gates/day-chart.js';
import { mysticGatesQuarterChart } from '../../mystic-gates/quarter-chart.js';
import { mysticGatesMirrorChart } from '../../mystic-gates/mirror-chart.js';
import { mysticGatesYearChart, mysticGatesMonthChart } from '../../mystic-gates/year-month-chart.js';
import { mysticGatesFlyingChart } from '../../mystic-gates/flying-chart.js';
import { mysticGatesPatternsOf } from '../../mystic-gates/patterns.js';
import { ZHI12, GONG8, tidy, dot } from './shared.js';
import { sixRenChart } from '../../six-ren/chart.js';
import { sixRenBifaOf, JUDGED } from '../../six-ren/bifa.js';

/** 九宫格里的「宫N值」串（只取有值的宫，中五单列） */
function gongCells(cells, key) {
  return GONG8.map((p) => {
    const c = cells.find((x) => x.宫 === p);
    return '宫' + p + (c && c[key] ? c[key] : '—');
  }).join(' ');
}

/** 地盘仪：从 cells 里取该宫的地盘干（日家不单列地盘对象） */
function centerOr(c, p) {
  const x = (c.cells || []).find((v) => v.宫 === p);
  return (x && x.地盘干) || '—';
}

/** 中五宫（有星无门的说明用） */
function centerCell(cells) {
  return cells.find((x) => x.宫 === 5) || {};
}

/* ------------------------------------------------------------------ *
 * 一、时家转盘拆补（排奇门）
 * ------------------------------------------------------------------ */

export function mysticGatesHourText(ent, text) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 0;
  const c = mysticGatesHourChart({ y, m, d, h });

  const L = [];
  // 家数守门：问的是日家/刻家/年家/月家时，先提醒这并非同一张盘
  const fam = String(text || '').match(/(年家|月家|日家|刻家)/);
  if (fam) {
    L.push('注意：你问的是「' + fam[1] + '奇门」，它与时家不是同一张盘（起局单位与值符随法都不同）。'
      + '下面给的是同一时刻的时家局，只能当参考。' + fam[1] + '局请直接说「' + fam[1] + '奇门」。');
  }
  L.push('【奇门遁甲·时家】' + y + '年' + m + '月' + d + '日' + h + '时（时家·转盘·拆补）：');
  L.push('四柱 ' + c.干支.日.join('') + '日 ' + c.干支.时 + '时；' + c.遁 + c.局 + '（' + c.节气 + '），旬首' + c.旬首.join('')
    + '，值符「' + c.值符 + '」落' + c.值符宫 + '宫，值使「' + c.值使 + '」落' + c.值使落宫 + '宫。');
  L.push('地盘布仪：' + GONG8.map((p) => '宫' + p + c.地盘[p]).join(' ') + '（中五寄坤二）。');
  L.push('天盘九星：' + gongCells(c.cells, '星') + '。');
  L.push('人盘八门：' + gongCells(c.cells, '门') + '。');
  L.push('神盘八神：' + gongCells(c.cells, '神') + '。');
  // 谁管什么事：值使门所主、值符星所主、三奇落宫喜怒（照录《统宗·卷之二》三节）
  if (c['类象']) {
    const im = c['类象'];
    if (im.值使门) {
      const g = im.值使门;
      L.push('值使' + g.门 + '所主：宜' + (g.宜.length ? g.宜.join('、') : '（无）')
        + (g.不宜.length ? '；不宜' + g.不宜.join('、') : '')
        + (g.余论 ? '；' + g.余论 : '') + '——《奇门遁甲统宗·卷之二》。');
    }
    if (im.值符星) {
      const st = im.值符星;
      L.push('值符' + st.星 + '（' + st.别名 + '）所主：宜' + (st.宜.length ? st.宜.join('、') : '（无）')
        + (st.不宜.length ? '；不宜' + st.不宜.join('、') : '') + '——《奇门遁甲统宗·卷之二》。');
    }
    if ((im.三奇落宫 || []).length) {
      const q = im.三奇落宫.map((x) => x.奇 + '奇在' + x.宫 + '宫「' + x.名 + '」' + (x.判 ? '（' + x.判 + '）' : ''));
      L.push('三奇落宫：' + q.join('；') + '——《奇门遁甲统宗·卷之二》。');
    }
  }

  if (c.八神所司 && (c.八神所司.盘上 || []).length) {
    const 司 = c.八神所司.盘上.map((x) => x.神 + '（' + x.宫 + '宫）：' + x.所司);
    L.push('八神所司：' + 司.join('；') + '——《奇门宝鉴·释八神》。');

  if (c['日家属性']) {
    const d = c['日家属性'];
    if (d['德刑']) L.push(`德刑：${d['德刑'].节}在${d['德刑'].卦}，德在${d['德刑'].德}、刑在${d['德刑'].刑}——《奇门遁甲统宗·卷之二·德刑》。`);
    if (d['日家']) L.push(`日家：${d['日家'].类}（${d['日家'].说明}·${d['日家'].吉凶}）${d['日家'].别名 ? '，历家称' + d['日家'].别名 : ''}——《奇门遁甲统宗·卷之二·宝和义制伏》。`);
    if (d['时家阴阳']) {
      // 引用写成字面量：模板变量会被引用审计当成篇名
      const 时引 = d['时家阴阳'].类 === '五阴时'
        ? '《奇门遁甲统宗·卷之二·五阴时》'
        : '《奇门遁甲统宗·卷之二·五阳时》';
      L.push(`${d['时家阴阳'].类}：${d['时家阴阳'].利}；${d['时家阴阳'].断语}——${时引}。`);
    }
  }
    L.push('八神异说：' + c.八神所司.异说 + '。');
  }
  L.push('天盘干：' + gongCells(c.cells, '天盘干') + '（天禽随天芮同宫，该宫并见两干）。');
  // 八门旺衰（《奇门宝鉴·释义四十四则》「凡八门皆然，三奇亦然」）：
  //   吉门落失时失地之宫，「金气大衰，岂得为吉」，故单列一行，不改门本身的原吉凶。
  if (c.八门旺衰 && (c.八门旺衰.门 || []).length) {
    const 组 = { 最吉: [], 减力: [], 大衰: [] };
    c.八门旺衰.门.forEach((x) => { (组[x.判] = 组[x.判] || []).push(x.名 + '（' + x.宫 + '宫·' + x.时态 + '·' + x.地关系 + '）'); });
    const 段 = ['最吉', '减力', '大衰'].filter((k) => 组[k] && 组[k].length)
      .map((k) => k + '：' + 组[k].join('、'));
    L.push('八门旺衰（' + c.八门旺衰.月令 + '月·得时看季节旺相、得地看宫生扶）：' + 段.join('；') + '。');
    L.push('旺衰口径：《奇门宝鉴·释义四十四则》第三则——「奇门选择，最重衰旺休囚……凡八门皆然，三奇亦然」；'
      + '门五行按门之本位宫，宫五行按洛书九宫，季节旺衰按《三命通会·论五行旺相休囚死》。');
  }
  // 九星本等与气应（《奇门遁甲统宗·奇门秘诀总赋》定本等，《奇门宝鉴·释气应》定「我生之月为旺」）：
  //   九星旺衰与常法相反，故单列一行并在口径里点明，避免读者按季节旺衰套错。
  if (c.九星气应 && (c.九星气应.星 || []).length) {
    const 组 = {};
    c.九星气应.星.forEach((x) => { (组[x.判] = 组[x.判] || []).push(x.名 + '（' + x.宫 + '宫·' + x.本等 + '·' + x.气 + '）'); });
    const 序 = ['大吉', '小吉', '小吉（力薄）', '吉减', '忧', '小凶', '大凶'];
    const 段 = 序.filter((k) => 组[k] && 组[k].length).map((k) => k + '：' + 组[k].join('、'));
    L.push('九星本等与气应（' + c.九星气应.月令 + '月）：' + 段.join('；') + '——《奇门遁甲统宗·奇门秘诀总赋》定本等，《奇门宝鉴·释气应》定「我生之月为旺」。');
    L.push('九星口径：本等依《奇门遁甲统宗·奇门秘诀总赋》「辅禽心星为大吉，冲任小吉未全亨，大凶蓬芮不堪遇，小凶英柱在中宫」；'
      + '气应依《奇门宝鉴·释气应》——九星「以我生之月为旺、我同之月为相、我克之月为休、克我之月为囚、生我之月为废」，'
      + '与常法「当令者旺」相反（如水星旺于寅卯木月）；「大凶无气交为小，小凶有气亦丁忧」。');
  }
  L.push('口径：' + dot(tidy(c.口径)));
  // 文献依据：起局、值符加时干、值使数宫法三条都有《奇门遁甲统宗》算例直证，另附《奇门宝鉴》篇名备查
  L.push('依据：《奇门遁甲统宗·遁甲起例》，另见《奇门宝鉴·释直符直使》——起局按拆补法（节气定上中下元、符头甲己定元），'
    + '值符以时干所在之宫起、值使自旬首宫按旬内位次数九宫（阳顺阴逆、落中五寄坤二）。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、日家（排日家）
 * ------------------------------------------------------------------ */

export function mysticGatesDayText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const c = mysticGatesDayChart({ y, m, d });

  const L = [];
  L.push('【日家奇门】' + c.日期 + '（日柱 ' + c.日干支 + '，' + c.日干 + '日 · ' + c.日支 + '支）：');
  L.push('日家以日为单元、六十日进一元。本日' + c.遁 + c.元 + c.局 + '（第 ' + c.局数 + ' 局）；段起点 '
    + c.段起点 + '，距起算甲子日（' + c.起算甲子日 + '）第 ' + c.距起算天数 + ' 天。');
  L.push('局：' + c.遁 + c.局 + '；元：' + c.元 + '；日干落' + c.日干宫 + '宫（第 ' + c.日干位次 + ' 位）。');
  L.push('旬首：' + c.旬首 + '（' + c.旬首仪 + '）居 ' + c.旬首宫 + ' 宫。');
  L.push('值符：' + c.值符星 + '，值使：' + c.值使门 + '（本宫 ' + c.值使本宫 + '，落 ' + c.值使落宫 + ' 宫）。');
  L.push('地盘布仪：' + GONG8.map((p2) => '宫' + p2 + (c.地盘[p2] || '—')).join(' ') + '。');
  L.push('天盘九星：' + gongCells(c.cells, '星') + '。');
  L.push('人盘八门：' + gongCells(c.cells, '门') + '。');
  L.push('神盘八神：' + gongCells(c.cells, '神') + '。');
  L.push('与时家的区别：时家锚时干时支、日家锚日柱，两者不是同一张盘，不能互相顶替。');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、刻家（排刻家）
 * ------------------------------------------------------------------ */

export function mysticGatesQuarterText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : null;
  const min = ent.time && ent.time.minute != null ? ent.time.minute : 0;
  if (h == null) return { prompt: '刻家奇门要精确到「时」才排得出，生辰请给到时辰（如「10时24分」）。' };
  const c = mysticGatesQuarterChart({ y, m, d, h, min });
  const S = c.四柱;

  const L = [];
  L.push('【刻家奇门】' + S.年 + '年 ' + S.月 + '月 ' + S.日 + '日 ' + S.时 + '时（本时辰第 ' + c.刻序 + ' 刻，刻柱 ' + c.刻干支.join('') + '）：');
  L.push('时家定局：' + c.遁 + c.时家局数 + ' 局；值时第 ' + c.刻序 + ' 刻' + (c.八门逆行 ? '逆' : '顺') + '推 ' + c.移宫
    + ' 宫 → 刻局 ' + c.刻局数 + ' 局。');
  L.push('旬首：' + c.旬首 + '（' + c.旬首仪 + '）居 ' + c.旬首宫 + ' 宫；值符：' + c.值符 + '，值使：' + c.值使 + '。');
  L.push('刻干' + (c.刻干阳 ? '阳' : '阴') + '落 ' + c.刻干宫 + ' 宫（值符随之），值使落 ' + c.值使落宫 + ' 宫。');
  L.push('地盘布仪：' + GONG8.map((p2) => '宫' + p2 + (c.地盘[p2] || '—')).join(' ') + '。');
  L.push('天盘九星：' + GONG8.map((p2) => '宫' + p2 + (c.天盘[p2] || '—')).join(' ') + '。');
  L.push('人盘八门：' + GONG8.map((p2) => '宫' + p2 + (c.八门[p2] || '—')).join(' ') + '。');
  L.push('神盘八神：' + GONG8.map((p2) => '宫' + p2 + (c.八神[p2] || '—')).join(' ') + '。');
  L.push('与日家的区别：日家一盘管整日，刻家在同日内另点刻柱、按刻移位，两者不是同一张盘。');
  if (c.缺口) L.push('缺口：' + dot(tidy(c.缺口)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、宝鉴日奇（排宝鉴日奇）
 * ------------------------------------------------------------------ */

export function mysticGatesMirrorText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const c = mysticGatesMirrorChart({ y, m, d });

  const L = [];
  L.push('【宝鉴日奇门】' + y + '年' + m + '月' + d + '日（日柱 ' + c.日干支 + '）：');
  L.push('定局：' + c.定局依据 + '，' + c.阴阳遁 + c.局数 + ' 局（甲子日锚，日差 ' + c.日差 + ' 日）。');
  L.push('地盘布仪：' + GONG8.map((p) => '宫' + p + (c.地盘[p] || '—')).join(' ') + '。');
  L.push('天盘九星：' + GONG8.map((p) => '宫' + p + (c.九星[p] || '—')).join(' ') + '。');
  L.push('人盘八门：' + GONG8.map((p) => '宫' + p + (c.八门[p] || '—')).join(' ') + '。');
  L.push('与「日家」的区别：本式按日支定局、星随日干起、门随日支起，不用旬首值符值使；两套系统并列不合并，混排即错盘。');
  L.push('法源：' + c.name + '。');
  if (c.缺口) L.push('缺口：' + dot(tidy(c.缺口)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 五、年家 / 月家（排年家月家）
 * ------------------------------------------------------------------ */

export function mysticGatesYearMonthText(ent, text) {
  const q = String(text || '');
  // 「排年家月家 2024年」这种问法两家都点名：两张盘一起给，不能只挑一家（若一律当月家，等于吞掉年家）
  const wantYear = /年家|年奇门/.test(q);
  const wantMonth = /月家|月奇门/.test(q);
  const both = wantYear && wantMonth;

  const y = ent.date.year;
  const m = ent.date.month || 6;
  const d = ent.date.day || 15;
  // 只问到年月时（年家用年、月家用月柱），不要把内部补的 15 日写出来
  const ymOnly = ent.yearMonthOnly || ent.yearOnly
    || (q && !/\d+\s*[日号]/.test(q) && /月/.test(q));
  const stamp = ent.yearOnly ? y + '年' : (y + '年' + m + '月' + (ymOnly ? '' : d + '日'));

  const L = [];
  L.push('【年家月家奇门】' + stamp + '：');

  if (!wantMonth || both) {
    const c = mysticGatesYearChart({ y, m: ent.date.month, d: ent.date.day });
    L.push('年家：年柱 ' + c.年干支 + '，' + c.遁 + c.局 + '（' + c.元 + '）。');
    // ★ 内核字段名是「值符星 / 值使门」，此处曾写 c.值符 / c.值使（恒 undefined），
    //   导致年家、月家两行值符值使与地盘整段被静默吞掉。
    if (c.值符星) L.push('年家值符「' + c.值符星 + '」、值使「' + c.值使门 + '」，地盘：'
      + GONG8.map((p) => '宫' + p + (c.地盘[p] || '—')).join(' ') + '。');
    if (both) L.push('');
  }
  // 只给年份却问月家：不代拟月份（月家必须落在具体月柱上）
  const monthMissing = !!ent.yearOnly; // yearOnly = 用户只给了年份（m/d 是 analyzer 补的占位值）
  if ((wantMonth || both || !wantYear) && monthMissing) {
    L.push('月家：须给具体月份（如「排年家月家 2024年5月」）——月家按月柱起局，'
      + '只给年份时无从定月柱，此处不代拟月份。');
  } else if (wantMonth || both || !wantYear) {
    const c = mysticGatesMonthChart({ y, m, d });
    L.push('月家：月柱 ' + c.月干支 + '，' + c.月序 + '，属' + c.遁 + c.局 + '。');
    if (c.值符星) L.push('月家值符「' + c.值符星 + '」、值使「' + c.值使门 + '」，地盘：'
      + GONG8.map((p) => '宫' + p + (c.地盘[p] || '—')).join(' ') + '。');
  }
  const fam = both ? '年家与月家分别以年、月为单位起局' : (wantMonth ? '月家以月为单位起局' : '年家以年为单位起局');
  L.push('与时家/日家/刻家的区别：' + fam + '，与前述各家不是同一张盘。');
  L.push('口径：年家三元九运上元甲子=1864、中元=1924、下元=1984，180 年一周；月家按月柱六十甲子序 mod 15 分三元；'
    + '两家的三元局数一律取 1/4/7 且一律阴遁，值符随干、值使随支，八神加于值符逆排——《奇門遁甲統宗》「附年奇門起例」「附月奇門起例」。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 六、飞盘（排飞盘）
 * ------------------------------------------------------------------ */

export function mysticGatesFlyingText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const c = mysticGatesFlyingChart({ y, m, d, h });

  const L = [];
  L.push('【飞盘奇门】' + y + '年' + m + '月' + d + '日' + h + '时，' + c.遁 + c.局 + '，值符「' + c.值符 + '」、值使「' + c.值使 + '」。');
  // 九宫按洛书方格铺：巽四 离九 坤二 / 震三 中五 兑七 / 艮八 坎一 乾六
  const order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  for (let i = 0; i < 9; i += 3) {
    L.push(order.slice(i, i + 3).map((p) => {
      const x = c.cells.find((v) => v.宫 === p) || {};
      return p + '宫 ' + (x.地盘干 || '—') + '·' + (x.星 || '—').replace('天', '') + '·' + (x.门 || '—');
    }).join(' │ '));
  }
  L.push('（中五宫有星无门，地盘中五保留不寄坤，与转盘不同）');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 七、格局判读（解奇门格局）
 * ------------------------------------------------------------------ */

export function mysticGatesPatternsText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const r = mysticGatesPatternsOf({ y, m, d, h });

  const L = [];
  L.push('【奇门格局】' + y + '年' + m + '月' + d + '日' + h + '时，' + r.阴阳遁 + r.局数 + '，旬首 '
    + (Array.isArray(r.旬首) ? r.旬首.join('') : r.旬首) + '。');
  L.push('吉格 ' + r.吉格数 + ' 个、凶格 ' + r.凶格数 + ' 个。');
  if (r.吉格 && r.吉格.length) {
    L.push('吉格：' + r.吉格.map((x) => x.name + (x.宫 ? '（' + x.宫 + '宫）' : '（按时辰，不系宫）')).join('、') + '。');
    L.push('吉格细目：' + r.吉格.map((x) => x.name + '——' + tidy(x.义)).join(' '));
    // 三诈五假：库内《奇门遁甲统宗》两处只提其名、无逐条定义，但《遁甲演义·三诈五假》有完整定义，
    // 本仓按该书实现（每格义项已带篇名）。此处点明出处，别让读者以为只是通行口诀。
    if (r.吉格.some((x) => /诈|假/.test(x.name))) {
      L.push('· 三诈五假出处：条件与所宜依《遁甲演义·三诈五假》原文逐条实现（《奇门遁甲统宗》只言其名、无逐条定义；人假「下临九天宫」一层未见可判读法，已在该格注明）。');
    }
  }
  if (r.凶格 && r.凶格.length) {
    L.push('凶格：' + r.凶格.map((x) => x.name + (x.宫 ? '（' + x.宫 + '宫）' : '（按时辰，不系宫）')).join('、') + '。');
  }
  if (r.十干克应 && r.十干克应.length) {
    L.push('十干克应：' + r.十干克应.slice(0, 6).map((x) => x.宫 + '宫' + x.天盘干 + '加' + x.地盘干 + '「' + x.patternName + '」' + x.吉凶).join('；')
      + (r.十干克应.length > 6 ? '（另 ' + (r.十干克应.length - 6) + ' 宫从略）' : '') + '。');
  }
  L.push('总评：' + dot(tidy(r.总评)));
  if (r.破格提示) L.push('破格提示：' + dot(tidy(r.破格提示)));
  if (r.缺口) L.push('缺口：' + dot(tidy(r.缺口)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 八、大六壬（排六壬）
 * ------------------------------------------------------------------ */

export function sixRenText(ent, text) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 0;
  // 本命与行年：《六壬大全·观月经》「男一岁起丙寅顺行、女一岁起壬申逆行」，
  //   需另给「本命某支」与「虚岁」——六壬的占时不是生辰，二者不可混用，
  //   故不从生辰推，只从问句里显式取（如「排六壬 2025年4月25日 3点 本命子 虚岁35 男」）。
  const t = String(text || '');
  const benming = (t.match(/本命\s*([子丑寅卯辰巳午未申酉戌亥])/) || [])[1] || ent.本命 || null;
  // 虚岁：优先「虚岁 N」，其次「N 岁」（传统命理说岁数即虚岁），再次 ent.虚岁
  const xusui = +((t.match(/虚岁\s*(\d{1,3})/) || [])[1]
    || (t.match(/(\d{1,3})\s*岁/) || [])[1] || ent.虚岁 || 0) || null;
  const c = sixRenChart({
    y, m, d, h, 本命: benming, 性别: ent.性别 || ent.gender, 虚岁: xusui,
  });

  const L = [];
  L.push('【大六壬】' + y + '年' + m + '月' + d + '日' + h + '时（时家·月将加占时）：');
  L.push('四柱 ' + c.干支.日.join('') + '日 ' + c.干支.时 + '时；月将' + c.月将.name + '、占时' + c.干支.时 + '。');
  L.push('天地盘：' + c.天地盘.map((x) => x.地盘 + '上' + x.天盘).join(' ') + '（地盘恒为本身）。');
  L.push('四课：' + c.四课.map((k) => '(' + k.课 + ')' + k.位 + '上' + k.上).join(' ') + '。');
  const COURSE_NOTE = {
    元首: '一上克下，事顺理直', 重审: '一下贼上，须详审后动', 知一: '又名比用，多课择与日干阴阳相比者',
    涉害: '涉害深浅定用，孟深仲浅季当休', 遥克: '四课无克，取神克日为蒿矢、日克神为弹射',
    昴星: '无遥无克，阳日仰取酉上、阴日俯取酉下', 别责: '四课不全，刚日取干合上神、柔日取支前三合',
    八专: '干支同位，阳日顺数三神、阴日逆数三神', 伏吟: '天地盘同位，主迟滞呻吟', 返吟: '天地盘相冲，主反复不宁',
  };
  L.push('课体' + (c.课体 || '—') + (COURSE_NOTE[c.课体] ? '（' + COURSE_NOTE[c.课体] + '）' : '')
    + '；发用' + c.发用 + '，三传：初' + c.三传[0].支 + ' → 中' + c.三传[1].支 + ' → 末' + c.三传[2].支 + '。');
  {
    const 将盘 = (c.十二天将 && c.十二天将.将) || {};
    const 顺逆 = (c.十二天将 && c.十二天将.顺逆) || '';
    L.push('十二天将（' + c.贵人 + '贵·' + c.昼夜 + (顺逆 ? '·' + 顺逆 + '布' : '') + '）：'
      + ZHI12.map((z) => (将盘[z] ? z + 将盘[z] : null)).filter(Boolean).join(' ') + '。');
  }
  L.push('三传所乘：' + c.三传.map((x) => x.传 + '传' + x.支 + '乘' + x.天将).join('，') + '。');
  if (c.将象) {
    L.push('天将临支取象：' + c.将象.项.map((x) => x.传 + '传' + x.支 + '乘' + x.将 + '为「' + x.名 + '」（' + x.断 + '）').join('；') + '。');
  }
  if (c.将态) {
    L.push('天将旺衰（' + c.将态.月令旺五行 + '旺之月）：'
      + c.将态.将.map((x) => x.将 + '属' + x.五行 + '为' + x.态 + '，主' + x.所主).join('；') + '。');
    L.push('旺衰口径：' + c.将态.说明 + '（' + c.将态.依据 + '）');
  }
  if (c.将性) {
    const 段 = [];
    for (const x of c.将性.喜) 段.push(x.将 + '得所喜（' + x.见.join('、') + '）');
    for (const x of c.将性.畏) 段.push(x.将 + '逢所畏（' + x.见.join('、') + '）');
    if (段.length) L.push('天将喜畏：' + 段.join('；') + '。');
    // 去重：同一将同一位可能被多条判据命中，重复输出会让读者以为有两回事
    const seenBuLi = new Set();
    for (const x of c.将性.不立) {
      const key = x.将 + x.支;
      if (seenBuLi.has(key)) continue;
      seenBuLi.add(key);
      L.push('· ' + x.将 + '临' + x.支 + '，为不宜之位（' + x.备注 + '）');
    }
    L.push('喜畏口径：' + c.将性.说明 + '（' + c.将性.依据 + '）');
  }
  if ((c.杂课 || []).length) {
    L.push('杂课（课经）：' + c.杂课.map((x) => x.课 + '（' + x.断 + '）').join('、') + '。');
    for (const x of c.杂课) L.push('· ' + x.课 + '——' + x.说明 + '（' + x.原文 + '）');
  }
  if ((c['年命判'] || []).length) {
    const nm = c['年命判'];
    L.push('年命判（本命' + (c.本命 || '—') + '、行年' + (c.行年 ? c.行年.干支 : '—') + '）：'
      + nm.map((x) => x.判 + '（' + x.吉凶 + '）').join('；') + '。');
    for (const x of nm) L.push('· ' + x.判 + '——' + x.说明 + '（' + x.依据 + '）');
  }
  L.push('旬首 ' + (c.旬首 || '—') + '、旬空 ' + ((c.旬空 || []).join('') || '—')
    + '；驿马 ' + (c.驿马 || '—') + '（日支三合之冲）、月驿马 ' + (c.月驿马 || '—')
    + '、天马 ' + (c.天马 && c.天马.天马 ? c.天马.天马 : '—')
    + (c.天马 && c.天马.三传带马 ? '（三传带马）' : '') + '；'
    + '三传遁干 ' + ((c.三传遁干 || []).join(' ') || '—') + '。');
  if (c.连茹) L.push('连茹：' + (c.连茹.是 ? '真连茹（三传支相连属一路）' : '非真连茹（三传不成一路）') + '。');
  if (c.孤虚) {
    const dj = c.孤虚.日 || {}; const mj = c.孤虚.月 || {};
    L.push('孤虚（《协纪辨方书·义例》：日以旬空为虚、月以后二辰为孤）：日孤 ' + ((dj.孤 || []).join('') || '—')
      + '、日虚 ' + ((dj.虚 || []).join('') || '—')
      + '；月孤 ' + ((mj.孤 || []).join('') || '—')
      + '、月虚 ' + ((mj.虚 || []).join('') || '—') + '。');
  }
  if (c.本命) {
    L.push('本命 ' + c.本命 + '（命上神 ' + (c.命上 || '—') + '）。');
    if (c.行年) L.push(c.行年.说明 + '，行年 ' + c.行年.干支 + '（年上神 ' + (c.年上 || '—') + '）。');
  }
  if (c.应期 && c.应期.期) {
    const gl = c.应期.粒度 && c.应期.粒度 !== '未定' ? `取${c.应期.粒度}建` : '发用不临四建，粒度待参';
    L.push(`应期：${c.应期.期}（${gl}；${c.应期.速迟}）。`);
  }
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 九、毕法赋（解毕法）
 * ------------------------------------------------------------------ */

export function sixRenBifaText(ent, text) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const r = sixRenBifaOf({ y, m, d, h });

  const L = [];
  L.push('【毕法赋断课】' + y + '年' + m + '月' + d + '日' + h + '时，月将' + r.月将.name + '，' + r.日干 + r.日支 + '日。');
  L.push('三传：初' + r.三传[0] + ' → 中' + r.三传[1] + ' → 末' + r.三传[2] + '（遁干 ' + (r.三传遁干 || []).join(' ') + '）。');
  L.push('四课：' + (r.四课 || []).map((k) => '(' + k.课 + ')' + k.位 + '上' + k.上).join(' ') + '；旬空 ' + (r.旬空 || []).join('') + '。');
  L.push('命中毕法 ' + r.命中数 + ' 条：');
  if (r.命中 && r.命中.length) {
    r.命中.forEach((x) => L.push('第' + x.序 + '法「' + x.name + '」（' + x.卷 + '卷）：' + tidy(x.说明 || x.note || '')));
  } else {
    L.push('本课未命中可机器判定的 ' + JUDGED.length + ' 条毕法（不是无断，是条件未满足或须人工合参）。');
  }
  L.push('判定覆盖：' + dot(tidy(r.判定覆盖)));
  if (r.缺口) L.push('缺口：' + dot(tidy(r.缺口)));
  return { text: L.join('\n') };
}
