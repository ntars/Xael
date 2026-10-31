/**
 * src/core/six-lines/timing.js —— 六爻应期（依据《增删卜易·各门类应期总注章第又二十六》）
 *
 * 大白话：断完吉凶之后，还要回答「什么时候应验」。古法不是猜日子，而是按用神当下的
 *   状态（静/动、空/破、入墓、被合、旺极/衰绝、化进/化退、受克/克神）各自套一条取期规则，
 *   再把「远事定之以年月、近事应之于日时」套上去定单位。
 *
 * 本书原文逐条（顺序照录，见 refs-texts/《增删卜易》第 961 行起）：
 *   ① 「静而逢值逢冲」——主事爻不动，逢其值日或冲日应之。
 *   ② 「动而逢合逢值」——主事爻发动，逢其合日或值日应之。
 *   ③ 「太旺者逢墓逢冲」——用神过旺，逢墓日或冲日应之。
 *   ④ 「衰绝者，遇生遇旺」——用神休囚无气，逢生扶之日月或当令之时应之。
 *   ⑤ 「入三墓俱喜冲开」——用神入日墓/动墓/化墓，喜冲开墓库之日月。
 *   ⑥ 「遇六合亦宜相击」——用神与月建或动爻作合，待冲开之日月应之。
 *   ⑦ 「月破喜填」——用神月破，逢填实之月（或破而逢合之日）应之。
 *   ⑧ 「旬空最爱填冲」——用神旬空，逢填实或冲空之日应之。
 *   ⑨ 「化进神、逢值逢合」——用神化进神，逢值日或合日应之。
 *   ⑩ 「化退神、忌值忌冲」——用神化退神，忌值日与冲日，另择他期。
 *   ⑪ 「大象吉而受克，须待克神受克」/「大象凶而受克，须防克者逢生」。
 *   ⑫ 「问有应于变爻动爻」——吉凶有本爻值日应者，也有变爻值日应者。
 *   ⑬ 「世空元动，须待元神逢值」——世爻旬空而元神发动，待元神值日。
 *   ⑭ 「世衰元静，必然是元气逢冲」——世爻衰而元神安静，待冲元神之日。
 *   ⑮ 「勿谓爻之不验，远近当分」——远事定之以年月，近事应之于日时。
 *
 * 只取原文可判的规则，不引入任何自定权重；每条结论都带「依据」原文短语。
 */

import { ZHI_Z, WX_TOMB, JIN, TUI, WX_SHENG, WX_KE } from './tables.js';
import { sixLinesCast, YONG } from './cast.js';
import { sixLinesStrengthOf } from './strength.js';

const BRANCHES = ZHI_Z.join('');
const zIdx = (z) => BRANCHES.indexOf(z);
/** 六合 */
const HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
/** 相冲 */
const chong = (z) => BRANCHES[(zIdx(z) + 6) % 12];
/** 原文依据前缀 */
const YJ = '《增删卜易·各门类应期总注章第又二十六》';

/**
 * 取主事爻：用神现则用神（多现取动者/临日月者），不现则世爻（《增删卜易·用神章》自占以世为先）。
 * @returns {{line:object|null, 来源:string}}
 */
function mainLineOf(c, st, key) {
  const wk = (st && st.爻) || [];
  const merge = (l) => {
    const w = wk.find((x) => x.爻 === l.爻) || {};
    return {
      ...l,
      强弱: w.强弱 || '',
      旺衰: w.旺衰 || '',
      月类: (w.月 && w.月.类) || '',
      日类: (w.日 && w.日.类) || '',
      空亡: !!w.空亡,
      月破: !!w.月破,
      动: !!(w.动 || (c.动爻 || []).indexOf(l.爻) >= 0),
      变: w.变 || null,
    };
  };
  if (key && key !== '世' && key !== '应') {
    const vis = (c.爻线 || []).filter((l) => l.六亲 === key);
    if (vis.length) {
      // 两现：动者优先，其次临月建/日辰者（《增删卜易·两现章》先后次序，非分值）
      const pick = vis.find((l) => (c.动爻 || []).indexOf(l.爻) >= 0)
        || vis.find((l) => l.五行 === (st && st.用神五行))
        || vis[0];
      return { line: merge(pick), 来源: `用神${key}` };
    }
  }
  const shi = (c.爻线 || [])[(c.世 || 1) - 1];
  if (!shi) return { line: null, 来源: '' };
  if (key === '世') return { line: merge(shi), 来源: '世爻（自占以世为先）' };
  if (key === '应') {
    const ying = (c.爻线 || [])[(c.应 || 4) - 1];
    return { line: merge(ying || shi), 来源: '用神即应爻（应作他人，《卜筮正宗·世应论用神第二》）' };
  }
  return { line: merge(shi), 来源: key ? `${key}不上卦，以世爻为用` : '世爻（自占以世为先）' };
}

/**
 * 应期推算。
 * @param {object} inp 与 sixLinesCast 同参（y/m/d/h/minute/事），可另给 远近:'远'|'近'
 * @returns {{用神:object|null, 取用:string, 条目:Array, 说明:string}}
 */
export function sixLinesTimingOf(inp) {
  const c = sixLinesCast(inp || {});
  if (c.错误) return { 用神: null, 取用: '', 条目: [], 说明: c.错误 };
  const st = sixLinesStrengthOf(inp || {});
  const key = (inp && inp.事 && YONG[inp.事]) ? YONG[inp.事] : null;
  const 远近 = (inp && inp.远近) || '近';
  const unit = 远近 === '远' ? '月' : '日';

  const { line, 来源 } = mainLineOf(c, st, key);
  if (!line) return { 用神: null, 取用: '', 条目: [], 说明: '未能取到主事爻，无法推应期。' };

  const zhi = (line.干支 || '').slice(1);
  const wx = line.五行;
  const 空 = c.旬空 || [];
  const 标记 = line.标记 || '';
  const 动 = !!line.动;
  const 条目 = [];
  const push = (规则, 取, 依据, extra) => 条目.push({ 规则, 取: 取.filter(Boolean), 单位: unit, 依据: `${YJ}「${依据}」`, ...(extra || {}) });

  // ⑦ 月破喜填（填实之月 / 破而逢合之日）
  if (line.月破 || 标记.indexOf('月破') >= 0) {
    push('月破喜填', [zhi, HE[zhi]], '月破喜填……后逢未日应之，谓之破而逢合', { 说明: '填实之月不破，或逢合之日' });
  }
  // ⑧ 旬空最爱填冲
  else if (line.空亡 || 空.indexOf(zhi) >= 0 || 标记.indexOf('空亡') >= 0) {
    push('旬空填冲', [zhi, chong(zhi)], '旬空最爱填冲', { 说明: '填实则实，冲空则起' });
  }
  // ⑥ 遇六合亦宜相击（与月建或日辰作合）
  if (HE[zhi] === c.月建 || HE[zhi] === c.日辰) {
    push('合处逢冲', [chong(zhi)], '遇六合亦宜相击……吉凶必待冲开之月日应之');
  }
  // ⑤ 入三墓俱喜冲开
  if (WX_TOMB[wx] && (WX_TOMB[wx] === c.日辰 || 标记.indexOf('墓') >= 0)) {
    push('入墓冲开', [chong(WX_TOMB[wx])], '入三墓俱喜冲开');
  }
  // ⑫ 问有应于变爻动爻（原文「如爻临戌土，变出酉金，其吉凶有戌日应者，有酉日应者」）
  if (动 && line.变 && line.变.变支 && line.变.变支 !== line.变.本支) {
    push('动变本变二支', [line.变.本支, line.变.变支], '问有应于变爻动爻', { 说明: '吉凶或应于本爻值日，或应于变爻值日' });
  }
  // ⑨⑩ 化进神 / 化退神（取本爻与变爻）
  if (line.变 && line.变.变支) {
    const 本支 = line.变.本支;
    const 变支 = line.变.变支;
    if (JIN[本支] === 变支) {
      push('化进神逢值逢合', [本支, HE[本支]], '化进神、逢值逢合');
    } else if (TUI[本支] === 变支) {
      push('化退神忌值忌冲', [变支, chong(变支)], '化退神、忌值忌冲', { 说明: '退神逢值逢冲皆为忌期，宜另择生扶之期' });
    }
  }
  // ⑪ 大象吉而受克 → 待克神受克；大象凶而受克 → 防克者逢生
  {
    // 克用神者：找 y 使 WX_KE[y] === 用神五行（WX_KE[x] 是「x 克什么」，方向不能反）
    const 克神五行 = Object.keys(WX_KE).find((k) => WX_KE[k] === wx) || '';
    const 受克 = !!克神五行 && (c.爻线 || []).some((l) => l.五行 === 克神五行);
    if (受克) {
      if (/旺|相/.test(line.强弱)) {
        push('待克神受克', [WX_TOMB[克神五行], chong(WX_TOMB[克神五行])], '大象吉而受克，须待克神受克',
          { 说明: `克用神者属${克神五行}，待其入墓或受冲之期` });
      } else {
        push('防克者逢生', [], '大象凶而受克，须防克者逢生', { 说明: `克用神者属${克神五行}，忌其得生扶之期` });
      }
    }
  }
  // ③ 太旺者逢墓逢冲
  if (/旺/.test(line.强弱) && !/弱/.test(line.强弱)) {
    push('太旺逢墓冲', [WX_TOMB[wx], chong(zhi)], '太旺者逢墓逢冲');
  }
  // ④ 衰绝者遇生遇旺
  if (/弱/.test(line.强弱) || /休囚/.test(line.旺衰)) {
    const 生我 = Object.keys(WX_SHENG).find((k) => WX_SHENG[k] === wx) || '';
    条目.push({
      规则: '衰绝遇生旺',
      取: [],
      单位: unit,
      依据: `${YJ}「衰绝者，遇生遇旺……后逢土月日或至秋令当时，则旺矣」`,
      说明: `待生${wx}之${生我}当令、或${wx}旺之季`,
    });
  }
  // ⑬ 世空元动，须待元神逢值
  {
    const 世 = (st && st.世爻) || null;
    const 元 = st && st.元忌仇 && st.元忌仇.原神;
    const 元动 = 元 && (元.爻 || []).some((x) => x.动);
    if (世 && 世.空亡 && 元动) {
      const 元支 = (元.爻.find((x) => x.动) || {}).干支 || '';
      push('世空元动待元神值', [元支.slice(1)].filter(Boolean), '世空元动，须待元神逢值');
    }
  }
  // ⑭ 世衰元静，必然是元气逢冲
  {
    const 世 = (st && st.世爻) || null;
    const 元 = st && st.元忌仇 && st.元忌仇.原神;
    const 元静 = 元 && (元.爻 || []).length > 0 && (元.爻 || []).every((x) => !x.动);
    if (世 && /弱|衰/.test(世.强弱 || '') && 元静 && 元.五行) {
      const 元支 = (元.爻[0] || {}).干支 || '';
      push('世衰元静冲元神', [元支.slice(1) || WX_TOMB[元.五行]].filter(Boolean), '世衰元静，必然是元气逢冲');
    }
  }
  // ①② 基础条（静/动）：若已由上面特例给出同样取期，则不重复
  const base = 动
    ? { 规则: '动而逢合逢值', 取: [HE[zhi], zhi], 依据: '动而逢合逢值' }
    : { 规则: '静而逢值逢冲', 取: [zhi, chong(zhi)], 依据: '静而逢值逢冲' };
  if (!条目.some((x) => x.取.join('') === base.取.join(''))) {
    push(base.规则, base.取, base.依据);
  }

  return {
    用神: { 爻: line.爻, 干支: line.干支, 六亲: line.六亲, 五行: wx, 强弱: line.强弱, 旺衰: line.旺衰 },
    取用: 来源,
    远近,
    条目,
    说明: '应期按《增删卜易·各门类应期总注章》逐条取：先看用神当下状态（空/破/墓/合/旺衰/动静/化进退/受克）'
      + '套对应规则，再按「勿谓爻之不验，远近当分：远事定之以年月，近事应之于日时」定单位。'
      + '原文又云「倘遇卦之不明，再占是一法」——一卦不决宜另占，不可强断。',
  };
}
