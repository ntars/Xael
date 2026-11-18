/**
 * normalizer.js —— 搜索框的「输入容错层」（纯函数，可单独单测）
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 * 各功能的规则依据见 registry 内 note 字段与其内核模块文件头；本层不引入任何新口径。
 *
 * 大白话：用户在搜索框里可能粘贴出各种古怪写法——零宽字符、全角数字、
 * 花体数字、`1990.6.15`、`19900615`、`15/6/1990`、`10点30`、`十点半`、`8pm`……
 * 这一层把它们统一成后续解析器认得的规整写法，避免"明明写对了却提示要给生辰"。
 *
 * 处理顺序（顺序本身有讲究，改顺序会互相打架）：
 *   ① 清隐形字符 → ② 花式数字/全角归一 → ③ 中文数字转阿拉伯（保护功能词）
 *   → ④ 中文日期单位与各种分隔符统一成半角 '-' 与 ':' → ⑤ 连续数字拆分（8/12/14/6 位）
 *
 * ⚠️ 汉字功能词保护：「八字」「四柱」「六爻」「六壬」「九宫」「八宅」「四化」「五行」
 *   「六十甲子」「十二时辰」等词里的数字不能被数字化，否则「8点八字」的「八」会被
 *   塞进分钟槽，凭空造出一个出生分钟。
 */

/** 软连字符、零宽、双向控制符、BOM：粘贴时最常见，肉眼不可见却会让正则全盘失配 */
const INVISIBLE_RE = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

/** 上标 ⁰¹²³⁴⁵⁶⁷⁸⁹ + 下标 ₀₁₂₃₄₅₆₇₈₉（两种字母表已各自连续，取模 10 即还原） */
const SUP_SUB = '⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉';

/** 汉字数字 */
const CN_DIGIT = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const CN_UNIT = { 十: 10, 百: 100, 千: 1000, 万: 10000 };

/** 含汉字数字、又绝不能数字化的功能词（长词在前，避免短词抢先切断长词） */
const PROTECT_WORDS = [
  '六十甲子', '十二时辰', '二十四节气', '二十八宿', '十二宫',
  '四柱', '八字', '六爻', '六壬', '九宫', '八宅', '四化', '五行', '三奇', '六仪',
  '九星', '八门', '九运', '三元', '大运', '流年', '紫微', '奇门', '梅花', '毕法',
];

/** 英文月份（顺手支持 jun 15 这类写法，中文场景用得少但零成本） */
const EN_MONTH = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** 中文数字串 → 整数（「二〇〇五」→2005、「二十三」→23；认不出返回 NaN） */
export function cnToNumber(s) {
  const str = String(s || '');
  if (!str) return NaN;
  if (!/[十百千万]/.test(str)) {
    let out = '';
    for (const ch of str) {
      const d = CN_DIGIT[ch];
      if (d === undefined) return NaN;
      out += d;
    }
    return out ? parseInt(out, 10) : NaN;
  }
  let total = 0;
  let section = 0;
  let num = 0;
  for (const ch of str) {
    if (CN_DIGIT[ch] !== undefined) {
      num = CN_DIGIT[ch];
    } else if (CN_UNIT[ch] !== undefined) {
      const u = CN_UNIT[ch];
      if (u === 10000) {
        section = (section + num) * u;
        total += section;
        section = 0;
      } else {
        section += (num || 1) * u;
      }
      num = 0;
    }
  }
  return total + section + num;
}

/** ① 清隐形字符 */
function stripInvisible(s) {
  return s.replace(INVISIBLE_RE, '');
}

/** ② 花式数字与全角符号归一 */
function normalizeGlyphs(s) {
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i);
    const next = s.charCodeAt(i + 1);
    // 数学数字区（粗体/双线/无衬线/等宽，各 0–9 连续）：代理对 0xD835 + 0xDFCE..0xDFFF
    if (code === 0xd835 && next >= 0xdfce && next <= 0xdfff) {
      out += String((next - 0xdfce) % 10);
      i += 1;
      continue;
    }
    const k = SUP_SUB.indexOf(s.charAt(i));
    if (k >= 0) {
      out += String(k % 10);
    } else if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCharCode(code - 0xfee0); // 全角 ASCII → 半角
    } else {
      out += s.charAt(i);
    }
  }
  return out
    .replace(/\u3000/g, ' ') // 全角空格
    .replace(/[：]/g, ':')
    // 日期分隔的各种写法统一成 '-'（点/斜杠/反斜杠/长短破折号/波浪号）
    .replace(/[．。.／/\\－—–〜～]/g, '-');
}

/** ③ 中文数字转阿拉伯（先摘出功能词，转完再放回） */
function cnNumbersToArabic(s) {
  const slots = [];
  const sorted = PROTECT_WORDS.slice().sort((a, b) => b.length - a.length);
  let out = s;
  sorted.forEach((w) => {
    out = out.split(w).join(`\u0001${slots.push(w) - 1}\u0001`);
  });
  out = out
    .replace(/廿([一二三四五六七八九])/g, '二十$1')
    .replace(/廿/g, '二十')
    .replace(/卅/g, '三十')
    .replace(/[零〇一二两三四五六七八九十百千万]+/g, (m) => {
      const n = cnToNumber(m);
      return Number.isNaN(n) ? m : String(n);
    });
  return out.replace(/\u0001(\d+)\u0001/g, (_, i) => slots[+i]);
}

/**
 * ④ 单位与分隔符统一：年/月/日/号 → '-'，数字后的「时/点」→ ':'，
 *   把「分/秒」字样去掉（`10点30分` → `10:30`）。
 */
function normalizeSeparators(s) {
  return s
    .replace(/(\d)\s*[时点]/g, '$1:') // 「10点」→「10:」；「子时」的「时」前面不是数字，不受影响
    .replace(/[分秒]/g, '')
    .replace(/[年月]/g, '-')
    .replace(/[日号]/g, '-')
    .replace(/[、，,；;|\\#@*&()'"[\]]/g, '-')
    .replace(/[!！?？]/g, ' ')
    .replace(/(\d)\s*:?\s*半/g, '$1:30') // 「十点半」「10点半」→ 10:30
    .replace(/(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)/gi, (m, h, mi, ap) => {
      let hh = +h;
      const lower = ap.toLowerCase();
      if (lower === 'pm' && hh < 12) hh += 12;
      if (lower === 'am' && hh === 12) hh = 0;
      return `${hh}:${mi || '00'}`;
    })
    .replace(/-+/g, '-')
    .replace(/-\s+/g, ' ')
    .replace(/^[-:\s]+|[-:\s]+$/g, '');
}

/**
 * ⑤ 连续数字拆分：把 `19900615`、`199006151030`、`900615`、`0609` 这类
 * 人肉输入还原成带分隔的日期时间；同时把 `15-6-1990` 这种倒序纠正成 `1990-6-15`。
 */
function splitDigits(s) {
  // 9 位以上连续数字多半是身份证/手机号，不拆（拆了会误判成日期）
  if (/[0-9]{9,}/.test(s) && !/[0-9]{12,}/.test(s)) return s;
  let out = s
    // 14 位：YYYYMMDDHHmmss
    .replace(/(\d{14})(?!\d)/g, (m) => `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)} ${m.slice(8, 10)}:${m.slice(10, 12)}`)
    // 12 位：YYYYMMDDHHmm
    .replace(/(\d{12})(?!\d)/g, (m) => `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)} ${m.slice(8, 10)}:${m.slice(10, 12)}`)
    // 8 位：YYYYMMDD
    .replace(/(\d{8})(?!\d)/g, (m) => `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)}`)
    // 6 位：YYMMDD（≤26 记 20xx、≥27 记 19xx——跨世纪两位年惯例）
    .replace(/(\d{6})(?!\d)/g, (m) => {
      const yy = parseInt(m.slice(0, 2), 10);
      const yyyy = yy <= 26 ? 2000 + yy : 1900 + yy;
      return `${yyyy}-${m.slice(2, 4)}-${m.slice(4, 6)}`;
    })
    // 日期后面紧跟的 4 位数字 = HHMM（1990-06-15 1030 → 1990-06-15 10:30）
    .replace(/(\d{4}-\d{1,2}-\d{1,2})\s+(\d{4})(?!\d)/g, (m, date, four) => {
      const hh = +four.slice(0, 2);
      const mi = +four.slice(2, 4);
      return hh <= 23 && mi <= 59 ? `${date} ${hh}:${mi}` : m;
    })
    // 倒序 D-M-Y / M-D-Y → Y-M-D
    .replace(/(\d{1,2})-(\d{1,2})-(\d{4})(?![-:\d])/g, (m, a, b, y) => {
      const first = +a;
      const second = +b;
      return first > 12 && second <= 12 ? `${y}-${second}-${first}` : `${y}-${first}-${second}`;
    })
    // 2 位年 + 月日：05-6-9 → 2005-6-9
    .replace(/(^|[^\d])(\d{2})-(\d{1,2})-(\d{1,2})(?![-:\d])/g, (m, pre, yy, mo, dd) => {
      const n = +yy;
      const yyyy = n <= 26 ? 2000 + n : 1900 + n;
      return `${pre}${yyyy}-${mo}-${dd}`;
    })
    // 日期后紧跟 4 位紧凑时间：2005-6-9-1400 → 2005-6-9 14:00
    .replace(/(\d{4})-(\d{1,2})-(\d{1,2})-(\d{4})(?![-:\d])/g, (m, y, mo, dd, hhmm) => {
      const hh = +hhmm.slice(0, 2);
      const mi = +hhmm.slice(2, 4);
      return hh <= 23 && mi <= 59 ? `${y}-${mo}-${dd} ${hh}:${mi}` : m;
    })
    // 孤立 4 位：0609 → 06-09（补当年月份日，交给下游「只有月日」分支）
    .replace(/(^|[^\d:])(\d{4})(?![-:\d])/g, (m, pre, four) => {
      const mm = +four.slice(0, 2);
      const dd = +four.slice(2, 4);
      return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 ? `${pre}${four.slice(0, 2)}-${four.slice(2, 4)}` : m;
    });
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

/** 英文月份映射：jun 15 2005 → 6-15-2005 */
function mapEnglishMonths(s) {
  return s.toLowerCase().replace(/[a-z]+/g, (w) => (EN_MONTH[w] ? String(EN_MONTH[w]) : w));
}

/**
 * 对外唯一入口：把任意用户输入整理成解析器认得的规整写法。
 * @param {string} raw 原始输入
 * @returns {string} 归一化后的文本（不改变语义，只统一写法）
 */
export function normalizeInput(raw) {
  const text = String(raw == null ? '' : raw);
  if (!text.trim()) return '';
  let s = stripInvisible(text);
  s = normalizeGlyphs(s);
  s = mapEnglishMonths(s);
  s = cnNumbersToArabic(s);
  s = normalizeSeparators(s);
  s = splitDigits(s);
  return s;
}

export default normalizeInput;
