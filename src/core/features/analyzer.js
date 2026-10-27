/**
 * src/core/features/analyzer.js —— 搜索入口总调度（纯文本出料版）
 *
 * 大白话：一句话进来，依次过五道关：
 *   1. 主题指令（切换深色/浅色/跟随系统）→ 直接给回执，不进推演；
 *   2. 触发词匹配（最长优先、去从属、常用序排列，多命中并列）；
 *   3. 生辰解析（国历/农历/四柱三种写法，中文数字与全角容错，姓名性别可夹带）；
 *   4. 生辰闸门（缺生辰/农历写法坏/四柱写法 → 就地提示，不跳页）；
 *   5. 出料：每项功能把盘面渲染成多行文本，交给页面切段渲染。
 *
 * 返回值：
 *   {type:'theme', value, message}                 —— 主题已切换
 *   {type:'results', results:[{key,名,短名,text}]} —— 正常结果（可能多块并列）
 *   {type:'refuse', code, message}                 —— birth / lunar / pillar / nonmeta / kernel
 */

import { THEME_COMMANDS, themeSwitched, setTheme, effectiveTheme } from '../../shared/settings.js';
import { matchAll, rendererOf, FAIL_NOTE } from './registry.js';

/** 非本领域问句词表：命中且无功能命中时给一句得体的拒绝 */
const NON_META = [
  '天气', '股票', '彩票', '汇率', '编程', '代码', '写诗', '翻译', '作文', '菜谱',
  '电影', '游戏', '新闻', '政治', '医疗', '看病', '法律', '合同', '招聘', '面试',
];

/** 查询型问法（不受生辰闸门约束，默认取今日） */
const QUERY_RE = /(今天|今日|明天|明日|后天|本周|这周|本月|下月|今年|明年|当前|现在|此刻|当下|即日)/;

/** 引导语（无命中时给可用问法） */
const GUIDE = [
  '可以这样问我：',
  '· 排八字：白玖玖，女，2005年6月9日子时',
  '· 排紫微：1990年6月15日 10点 排紫微',
  '· 排奇门：2024年12月21日 12点 排奇门',
  '· 查黄历：今日宜忌 / 查黄历',
  '· 查农历：2026年10月27日 查农历',
].join('\n');

/** 缺生辰提示 */
const BIRTH_HINT = '请输入农历、国历、四柱、八字。\n例如：农历二〇〇五年五月初三 / 2005年6月9日 / 乙酉 壬午 甲子 甲子。';

/* ------------------------------------------------------------------ *
 * 生辰解析
 * ------------------------------------------------------------------ */

/** 汉字数字 → 值（逐字与十百进位都支持） */
const CN_DIGIT = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 全角数字 → 半角 */
function toHalfWidth(s) {
  return String(s).replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

/** 中文数字串 → 数值（「二〇〇五」→2005，「廿三」由 parseLunarDay 处理） */
function cnToNum(str) {
  const s = String(str);
  if (!/[〇零一二三四五六七八九十]/.test(s)) return NaN;
  if (!/十/.test(s)) {
    let out = '';
    for (const c of s) out += CN_DIGIT[c] != null ? CN_DIGIT[c] : '';
    return out ? parseInt(out, 10) : NaN;
  }
  const parts = s.split('十');
  if (parts.length === 2) {
    const hi = parts[0] ? cnToNum(parts[0]) : 1;
    const lo = parts[1] ? cnToNum(parts[1]) : 0;
    return hi * 10 + lo;
  }
  return NaN;
}

/** 时间：14:30 / 14点 / 14时 / 午时 → {hour, minute} */
export function parseTime(text) {
  const t = toHalfWidth(String(text || ''));
  let m = t.match(/(\d{1,2})\s*[:：]\s*(\d{2})/);
  if (m) return { hour: +m[1], minute: +m[2] };
  const ZT = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
  // 十二时辰先判（「子时」里的「时」不能被下面的数字点判成小时）
  m = t.match(/([子丑寅卯辰巳午未申酉戌亥])时/);
  if (m) return { hour: ZT[m[1]] + 1, minute: 0 };
  m = t.match(/(\d{1,2})\s*[点時时]/);
  if (m) return { hour: +m[1], minute: 0 };
  return null;
}

/** 性别 */
export function parseGender(text) {
  if (/女/.test(text)) return 'female';
  if (/男/.test(text)) return 'male';
  return null;
}

/** 姓名（「白玖玖，女，…」这类夹带） */
export function parseName(text) {
  const m = String(text || '').match(/^\s*([\u4e00-\u9fa5]{2,4})\s*[，,、\s]/);
  if (!m) return '';
  const v = m[1];
  if (/^(农历|国历|公历|阳历|阴历|今日|今天|明天|今年|男|女)$/.test(v)) return '';
  // 以功能触发词开头的不是姓名（「排八字 白玖玖…」里的第一段是命令词）
  if (matchAll(v).length) return '';
  return v;
}

/** 农历日号：「初三」「十五」「廿三」「二十三」「三十」 */
function parseLunarDay(s) {
  const v = String(s || '').trim();
  if (/^[0-9]{1,2}$/.test(v)) return +v;
  if (v === '三十') return 30;
  const m = v.match(/^(初|十|廿|二十)?([一二三四五六七八九十])$/);
  if (!m) return NaN;
  const base = m[1] || '';
  const unit = CN_DIGIT[m[2]];
  if (base === '初') return unit;
  if (base === '十') return 10 + unit;
  if (base === '廿' || base === '二十') return 20 + unit;
  return unit;
}

/**
 * 生辰解析：国历 1990年6月15日 / 农历二〇〇五年五月初三 / 四柱 乙酉 壬午 甲子 甲子。
 * @returns {null|{calendar,y,m,d,h,minute,gender,name,error?}}
 */
export function parseBirth(text) {
  const raw = String(text || '');
  const t = toHalfWidth(raw);
  const name = parseName(t);
  const gender = parseGender(t);
  const time = parseTime(t);
  const h = time ? time.hour : 14;
  const minute = time ? time.minute : 0;

  // 一、四柱写法（四个干支相邻出现）
  const p = t.match(/([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])[\s,，、]*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])[\s,，、]*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])(?:[\s,，、]*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥]))?/);
  if (p) {
    return { calendar: 'pillar', h, minute, gender, name, error: 'pillar' };
  }

  // 二、农历写法
  const lm = t.match(/[农历陰阴]{1,2}[^\d〇零一二三四五六七八九十]{0,3}((?:19|20)\d{2}|[〇零一二三四五六七八九]{4})\s*年?([正一二三四五六七八九十冬腊]{1,3})\s*月([初十廿三]?[一二三四五六七八九十]{1,2})/);
  if (lm) {
    const y = /^\d{4}$/.test(lm[1]) ? +lm[1] : cnToNum(lm[1]);
    const MNAMES = { 正: 1, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 冬: 11, 腊: 12 };
    const mm = MNAMES[lm[2]] || NaN;
    const dd = parseLunarDay(lm[3]);
    if (!y || !mm || !dd) return { calendar: 'lunar', y, m: mm, d: dd, h, minute, gender, name, error: 'lunar' };
    return { calendar: 'lunar', y, m: mm, d: dd, h, minute, gender, name };
  }

  // 三、国历写法
  const m = t.match(/((?:19|20)\d{2}|[〇零一二三四五六七八九]{4})\s*年\s*([0-9]{1,2}|[一二三四五六七八九十]{1,3})\s*月\s*([0-9]{1,2}|[初十廿三]?[一二三四五六七八九十]{1,3})\s*[日号]?/);
  if (m) {
    const y = /^\d{4}$/.test(m[1]) ? +m[1] : cnToNum(m[1]);
    const mm = /^\d{1,2}$/.test(m[2]) ? +m[2] : cnToNum(m[2]);
    const dd = /^\d{1,2}$/.test(m[3]) ? +m[3] : parseLunarDay(m[3]);
    if (!y || !mm || !dd || y < 1900 || y > 2100) {
      return { calendar: 'solar', y, m: mm, d: dd, h, minute, gender, name, error: 'solar' };
    }
    return { calendar: 'solar', y, m: mm, d: dd, h, minute, gender, name };
  }

  // 只有月日（如「6月9日子时」）：补今年
  if (/月/.test(t) && /日/.test(t)) {
    const md = t.match(/([0-9]{1,2}|[一二三四五六七八九十]{1,3})\s*月\s*([0-9]{1,2}|[初十廿三]?[一二三四五六七八九十]{1,3})\s*[日号]/);
    if (md) {
      const mm = /^\d{1,2}$/.test(md[1]) ? +md[1] : cnToNum(md[1]);
      const dd = /^\d{1,2}$/.test(md[2]) ? +md[2] : parseLunarDay(md[2]);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        return { calendar: 'solar', y: new Date().getFullYear(), m: mm, d: dd, h, minute, gender, name };
      }
    }
  }

  // 只有年份：查命卦这类只按年推算
  const y4 = t.match(/((?:19|20)\d{2})/);
  if (y4 && /命卦|八宅|飞星/.test(t)) {
    return { calendar: 'solar', y: +y4[1], m: 6, d: 15, h: 14, minute: 0, gender, name, yearOnly: true };
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 主入口
 * ------------------------------------------------------------------ */

/**
 * 一句问话 → 页面渲染模型。
 * @param {string} q
 */
export async function analyze(q) {
  const text = String(q || '').trim();
  if (!text) return { type: 'refuse', code: 'nonmeta', message: '想了解点什么？\n\n' + GUIDE };

  // 一、主题指令
  for (const cmd of THEME_COMMANDS) {
    for (const w of cmd.words) {
      if (text.includes(w)) {
        setTheme(cmd.value);
        const v = effectiveTheme();
        return { type: 'theme', value: cmd.value, message: themeSwitched[v] || '主题已切换' };
      }
    }
  }

  // 二、触发词
  const hits = matchAll(text);

  // 三、生辰
  const birth = parseBirth(text);
  if (birth && birth.error) {
    return { type: 'refuse', code: birth.error, message: msgOfCode(birth.error, birth) };
  }

  // 四、无命中：先看是否非本领域，再给引导
  if (!hits.length) {
    if (NON_META.some((w) => text.includes(w))) {
      return {
        type: 'refuse', code: 'nonmeta',
        message: '玄玖灵犀只做传统术数与历法文献整理，其他领域的问题请另找工具。\n\n' + GUIDE,
      };
    }
    return { type: 'refuse', code: 'birth', message: BIRTH_HINT };
  }

  // 五、生辰闸门
  const needBirth = hits.some((x) => x.feature.needsBirth);
  if (needBirth && !birth) return { type: 'refuse', code: 'birth', message: BIRTH_HINT };

  // 六、出料
  const results = [];
  for (const x of hits) {
    const fn = rendererOf(x.feature);
    if (!fn) continue;
    let r;
    try {
      r = fn(birth || {}, text);
    } catch (e) {
      r = { prompt: FAIL_NOTE };
    }
    if (!r) continue;
    if (r.text) {
      results.push({ key: x.feature.key, 名: x.feature.名, 短名: x.feature.短名, text: r.text });
    } else if (r.prompt) {
      results.push({
        key: x.feature.key, 名: x.feature.名, 短名: x.feature.短名,
        text: '【' + x.feature.短名 + '】' + r.prompt,
      });
    }
  }
  if (!results.length) return { type: 'refuse', code: 'kernel', message: FAIL_NOTE };
  return { type: 'results', results };
}

/** 拒绝码 → 文案 */
function msgOfCode(code, birth) {
  if (code === 'lunar') {
    return '这个农历日期读不出来'
      + (birth && birth.y ? '（' + birth.y + '年）' : '')
      + '，请检查闰月与日期后重新输入。\n' + BIRTH_HINT;
  }
  if (code === 'pillar') {
    return '四柱写法本版只识别不反查，请改用国历或农历写法。\n' + BIRTH_HINT;
  }
  if (code === 'solar') {
    return '暂只支持 1900–2100 年的日期推算，请检查年份。\n' + BIRTH_HINT;
  }
  return BIRTH_HINT;
}
