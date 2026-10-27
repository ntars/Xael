/**
 * src/core/features/text/qimen.js —— 奇门遁甲七式 + 大六壬两式的文本出料
 *
 * 覆盖 9 项：排奇门（时家）· 排日家 · 排刻家 · 排宝鉴日奇 · 排年家月家 · 排飞盘 ·
 *            解奇门格局 · 排六壬 · 解毕法。
 * 各家盘面不是同一张盘，故每块都写明「本式与谁不同」，不把两派合成一张。
 */

import { qimenChart } from '../../qimen/qimen.js';
import { qimenRiChart } from '../../qimen/qimen-ri.js';
import { qimenKeChart } from '../../qimen/ke.js';
import { qimenBaojianChart } from '../../qimen/baojian.js';
import { qimenNianChart, qimenYueChart } from '../../qimen/nianyue.js';
import { qimenFeiChart } from '../../qimen/feipan.js';
import { qimenGeOf } from '../../qimen/ge.js';
import { ZHI12, GONG8, tidy } from '../text.js';
import { liurenChart } from '../../liuren/liuren.js';
import { bifaOf } from '../../liuren/bifa.js';

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

/** 口径类句子统一以单个句号收尾（内核文案本身已带句号） */
function dot(s) {
  const v = String(s == null ? '' : s).trim();
  return /[。！？]$/.test(v) ? v : v + '。';
}

/* ------------------------------------------------------------------ *
 * 一、时家转盘拆补（排奇门）
 * ------------------------------------------------------------------ */

export function qimenText(ent, text) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 0;
  const c = qimenChart({ y, m, d, h });

  const L = [];
  // 家数守门：问的是日家/刻家/年家/月家时，先提醒这并非同一张盘
  const fam = String(text || '').match(/(年家|月家|日家|刻家)/);
  if (fam) {
    L.push('注意：你问的是「' + fam[1] + '奇门」，它与时家不是同一张盘（起局单位与值符随法都不同）。'
      + '下面给的是同一时刻的时家局，只能当参考。' + fam[1] + '局请直接说「' + fam[1] + '奇门」。');
  }
  L.push('【奇门遁甲·时家】' + y + '年' + m + '月' + d + '日' + h + '时（时家·转盘·拆补）：');
  L.push('四柱 ' + c.干支.日.join('') + '日 ' + c.干支.时 + '时；' + c.遁 + c.局 + '（' + c.节气 + '），旬首' + c.旬首.join('')
    + '，值符「' + c.值符 + '」落' + c.值符宫 + '宫，值使「' + c.值使 + '」。');
  L.push('地盘布仪：' + GONG8.map((p) => '宫' + p + c.地盘[p]).join(' ') + '（中五寄坤二）。');
  L.push('天盘九星：' + gongCells(c.cells, '星') + '。');
  L.push('人盘八门：' + gongCells(c.cells, '门') + '。');
  L.push('神盘八神：' + gongCells(c.cells, '神') + '。');
  L.push('天盘干：' + gongCells(c.cells, '天盘干') + '（天禽随天芮同宫，该宫并见两干）。');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、日家（排日家）
 * ------------------------------------------------------------------ */

export function qimenRiText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const c = qimenRiChart({ y, m, d });

  const L = [];
  L.push('【日家奇门】' + y + '年' + m + '月' + d + '日（日柱 ' + c.日干支.join('') + '）：');
  L.push('日家以日为单元，六十日一局、一百八十日走完三元。本日' + c.遁 + c.局 + '，旬首' + c.旬首.join('')
    + '，值符「' + c.值符 + '」、值使「' + c.值使 + '」。');
  L.push('地盘布仪：' + GONG8.map((p) => '宫' + p + centerOr(c, p)).join(' ') + '（中五寄坤二）。');
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

export function qimenKeText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : null;
  const min = ent.time && ent.time.minute != null ? ent.time.minute : 0;
  if (h == null) return { prompt: '刻家奇门要精确到「时」才排得出，生辰请给到时辰（如「10时24分」）。' };
  const c = qimenKeChart({ y, m, d, h, min });

  const L = [];
  L.push('【刻家奇门】' + y + '年' + m + '月' + d + '日' + h + '时' + min + '分（本时辰 ' + c.时柱 + '，当日第 ' + c.刻序 + ' 刻，刻柱 ' + c.刻干支.join('') + '）：');
  L.push('刻家以十二分钟为一刻、一日百刻，起局仍落当日日家盘：' + c.遁 + c.局 + '，旬首' + (c.日家盘面.旬首 || []).join('')
    + '，值符「' + c.值符 + '」、值使「' + c.值使 + '」。');
  const dq = c.日家盘面;
  L.push('当日日家盘（刻家的底盘）：' + gongCells(dq.cells, '星') + '。');
  L.push('刻家的用处：同一时辰内问不同刻，只换刻柱不断盘，判断偏「此刻」的细节。');
  L.push('与日家的区别：日家一盘管整日，刻家在同日内另点刻柱，两者不是同一张盘，不可当一张看。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、宝鉴日奇（排宝鉴日奇）
 * ------------------------------------------------------------------ */

export function qimenBaojianText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const c = qimenBaojianChart({ y, m, d });

  const L = [];
  L.push('【宝鉴日奇门】' + y + '年' + m + '月' + d + '日（日柱 ' + String(c.日干支).replace(/,/g, '') + '）：');
  L.push('起星：' + c.起星 + '，' + c.起门 + '，八宫顺布。');
  L.push('天盘九星：' + GONG8.map((p) => { const x = c.cells.find((v) => v.宫 === p); return '宫' + p + (x ? x.星 : '—'); }).join(' ') + '。');
  L.push('人盘八门：' + GONG8.map((p) => { const x = c.cells.find((v) => v.宫 === p); return '宫' + p + (x ? x.门 : '—'); }).join(' ') + '。');
  L.push('与「日家」的区别：本式不按元起局、不用旬首值符值使，星与门各由日干、日支直接定起点，两套系统并列不合并，混排即错盘。');
  L.push('对照日家：' + c.对照日家.遁 + c.对照日家.局 + '。');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 五、年家 / 月家（排年家月家）
 * ------------------------------------------------------------------ */

export function qimenNianYueText(ent, text) {
  const isYue = /月家|月奇门/.test(String(text || ''));
  const y = ent.date.year;
  const m = ent.date.month || 6;
  const d = ent.date.day || 15;
  const c = isYue ? qimenYueChart({ y, m, d }) : qimenNianChart({ y, m, d });
  const fam = isYue ? '月家' : '年家';

  const L = [];
  L.push('【' + fam + '奇门】' + y + '年' + m + '月' + d + '日：');
  L.push(isYue ? ('月柱 ' + c.月干支 + '，' + c.月序 + '，属' + c.遁 + c.局 + '。')
    : ('年柱 ' + c.年干支 + '，' + c.遁 + c.局 + '。'));
  if (c.值符) L.push('值符「' + c.值符 + '」、值使「' + c.值使 + '」。');
  L.push('地盘布仪：' + GONG8.map((p) => '宫' + p + c.地盘[p]).join(' ') + '（中五寄坤二）。');
  L.push('与时家/日家/刻家的区别：' + fam + '以' + (isYue ? '月' : '年') + '为单位起局，与前述各家不是同一张盘。');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 六、飞盘（排飞盘）
 * ------------------------------------------------------------------ */

export function qimenFeiText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const c = qimenFeiChart({ y, m, d, h });

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

export function qimenGeText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const r = qimenGeOf({ y, m, d, h });

  const L = [];
  L.push('【奇门格局】' + y + '年' + m + '月' + d + '日' + h + '时，' + r.局 + '，值符「' + r.值符 + '」、值使「' + r.值使 + '」。');
  if (r.命中.length) {
    r.命中.forEach((x) => {
      L.push(x.名 + '（' + x.组合 + '，' + x.宫 + '宫，' + x.门 + x.星 + '）：' + x.说明 + '。');
    });
  } else {
    L.push('本局未检出库内格局（只列盘中实际出现的十干克应与经典口诀组合，不臆测）。');
  }
  L.push('总评：' + dot(tidy(r.判读)));
  L.push('口径：' + tidy(r.说明) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 八、大六壬（排六壬）
 * ------------------------------------------------------------------ */

export function liurenText(ent) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 0;
  const c = liurenChart({ y, m, d, h });

  const L = [];
  L.push('【大六壬】' + y + '年' + m + '月' + d + '日' + h + '时（时家·月将加占时）：');
  L.push('四柱 ' + c.干支.日.join('') + '日 ' + c.干支.时 + '时；月将' + c.月将.名 + '、占时' + c.干支.时 + '。');
  L.push('天地盘：' + c.天地盘.map((x) => x.地盘 + '上' + x.天盘).join(' ') + '（地盘恒为本身）。');
  L.push('四课：' + c.四课.map((k) => '(' + k.课 + ')' + k.位 + '上' + k.上).join(' ') + '。');
  L.push('发用' + c.发用 + '，三传：初' + c.三传[0].支 + ' → 中' + c.三传[1].支 + ' → 末' + c.三传[2].支 + '。');
  L.push('十二天将（' + c.贵人 + '贵·' + c.昼夜 + '）：'
    + ZHI12.map((z) => {
      const t = c.三传.find((x) => x.支 === z);
      if (t) return z + '乘' + t.天将;
      const tp = (c.天地盘 || []).find((v) => v.地盘 === z);
      return z + '上' + (tp ? tp.天盘 : '—');
    }).join(' ') + '。');
  L.push('三传所乘：' + c.三传.map((x) => x.传 + '传' + x.支 + '乘' + x.天将).join('，') + '。');
  L.push('口径：' + dot(tidy(c.口径)));
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 九、毕法赋（解毕法）
 * ------------------------------------------------------------------ */

export function bifaText(ent, text) {
  const y = ent.date.year;
  const m = ent.date.month || 1;
  const d = ent.date.day || 1;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const r = bifaOf({ y, m, d, h });

  const L = [];
  L.push('【毕法赋断课】' + y + '年' + m + '月' + d + '日' + h + '时，月将' + r.月将 + '，日干支' + r.日干支.join('') + '。');
  L.push('三传：' + r.三传 + '，发用' + r.发用 + '，贵人' + r.贵人 + '。');
  L.push('毕法：' + (r.命中.length ? r.命中.map((x) => '第' + x.序 + '法「' + x.名 + '」：' + x.说明).join('；') : '本课未命中可自动判定之毕法条目。'));
  L.push('覆盖：' + dot(tidy(r.覆盖)));
  L.push('标注：' + dot(tidy(r.说明)));
  return { text: L.join('\n') };
}
