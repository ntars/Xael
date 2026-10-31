/**
 * src/core/almanac/yongshi.js —— 逐日宜忌「按神推」层（自研，零依赖）
 *
 * 大白话：《协纪》卷二十九开头写明铺注原理——「铺注万年书则以事为经以神为纬」。
 *   就是说逐日宜忌不是另一张神秘表，而是：当天轮到哪些神，就把这些神各自
 *   「所宜的事项」「所忌的事项」并起来。本模块按这个原理程序化生成宜忌，
 *   与通书逐日表（库外《玉匣記》系）并列输出，两路来源各自标明。
 *
 * 依据（库内原文）：
 *   · 《钦定协纪辨方书》-清·允禄等奉敕撰 refs-texts 第 2041 行——
 *     「选择用事宜忌备矣然**铺注万年书则以事为经以神为纬**选择吉日时则以神为目以事为纲盖铺注以事序而选择由事起也」
 *   · 同卷「表例附」（refs-texts 第 1644–2042 行）——79 组神各给「宜【事项串】」「忌【事项串】」，
 *     已程序化解析为 src/core/almanac/data/yongshi-table.js（每组保留原文串与底本行号）。
 *   · 事项词表＝同卷「御用六十七事／民用三十七事」（refs-texts 第 2044–2077 行）。
 *
 * 不做的事（不臆造）：
 *   · 神与神相冲突（一事既在某神之宜又在另一神之忌）时，原书未给轻重——**不折算、不取舍**，
 *     该事项从宜/忌两边同时拿出，写进「冲突」并列输出；
 *   · 只取当日**确实值到**的神（历例复算 + 建除值日 + 天神黄黑道），不把全天神表铺进来。
 */

import { YONGSHI_TABLE, YONGSHI_NOTE } from './data/yongshi-table.js';

/** 表组神名归一：剥「【】」别名（底本别名分隔为全角空格/斜杠），主名+别名都收 */
const GROUP_INDEX = (() => {
  const map = new Map();
  for (const g of YONGSHI_TABLE) {
    const names = [];
    // 外层拆分不能用空格——别名内部也有全角空格（满日【天巫　福德】）。
    // 先抓「名【别名】」整段或裸名，别名块【】整体保护。
    const arr = Array.isArray(g.神) ? g.神 : (String(g.神).match(/[^　\s【】]+(?:【[^】]+】)?/g) || []);
    for (const n of arr) {
      const m = n.match(/^([^【】]+)(?:【([^】]+)】)?$/);
      if (!m) continue;
      names.push(m[1]);
      if (m[2]) names.push(...m[2].split(/[／/ \t\s　]+/));
    }
    for (const n of names) if (!map.has(n)) map.set(n, g);
  }
  return map;
})();

/** 查组：精确名 → 无则试加「日」后缀（值星名是「满」，表组名是「满日」） */
const groupOf = (n) => GROUP_INDEX.get(n) || GROUP_INDEX.get(n + '日') || null;

export const YONGSHI_GROUPS = YONGSHI_TABLE.length;

/**
 * 按神推宜忌。
 * @param {{历例吉神?:string[], 历例凶煞?:string[], 值星?:{name:string, 叠值?:any}, 天神?:string}} c almanacDaily 结果
 */
export function yongShenYiJiOf(c) {
  const names = [...(c.历例吉神 || []), ...(c.历例凶煞 || [])];
  const 值日 = c.值星 && c.值星.name ? [c.值星.name] : [];
  const 叠值 = c.值星 && Array.isArray(c.值星.叠值) ? c.值星.叠值.map((x) => x && x.name).filter(Boolean) : [];
  const 神名 = [...new Set([...names, ...值日, ...叠值, ...(c.天神 ? [c.天神] : [])])];

  const hit = [];
  for (const n of 神名) {
    const g = groupOf(n);
    if (g) hit.push({ 神: n, 组: g });
  }

  const 宜集 = new Set();
  const 忌集 = new Set();
  for (const h of hit) {
    for (const x of h.组.宜) 宜集.add(x);
    for (const x of h.组.忌) 忌集.add(x);
  }
  const 冲突 = [...宜集].filter((x) => 忌集.has(x));
  const 宜 = [...宜集].filter((x) => !忌集.has(x));
  const 忌 = [...忌集].filter((x) => !宜集.has(x));

  const 行号 = hit.map((h) => h.组.行);
  return {
    值神: hit.map((h) => h.神),
    未入表: 神名.filter((n) => !groupOf(n)),
    宜, 忌, 冲突,
    组数: hit.length,
    依据: YONGSHI_NOTE + `（引用组底本行：${行号.join('/')}）`,
  };
}

/** 供测试与文档核对：全表 79 组、解析出的宜项总数/忌项总数 */
export function yongShenStats() {
  let yi = 0, ji = 0;
  for (const g of YONGSHI_TABLE) { yi += g.宜.length; ji += g.忌.length; }
  return { 组: YONGSHI_TABLE.length, 宜项: yi, 忌项: ji };
}
