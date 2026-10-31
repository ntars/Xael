**简体中文** | [English](README_EN.md)

# 玄玖灵犀 Xael

> 玄之又玄，众妙之门。
>
> 演乾坤 · 知天命。

**Xael**（玄玖灵犀）是本地离线的中华文化术数文献库，兼作文献整理、校勘与数字化演算工具。它在你的设备上把历法换算、四柱八字、紫微斗数、奇门遁甲、大六壬、六爻、梅花易数、玄空飞星与黄历择吉**从零算一遍**——不查表、不联网、不调用任何第三方术数接口。

| | |
|---|---|
| 产品 | 玄玖灵犀 Xael |
| 版本 | 5.0.0 |
| 状态 | 5.0.0 重构完成：算法按库内公版古籍逐条校正，命名体系全英文；约 536 万例回归对拍作为基线；网页版 / 小程序 / uni-app 三端外壳齐备 |
| 仓库 | <https://github.com/ntars/Xael> |
| 官网 | <https://x.ntars.cn/> |
| 形态 | 浏览器 PWA（已实现）/ 微信小程序（已实现）/ uni-app（已实现，产物由 HBuilderX 生成） |
| 许可 | AGPL-3.0（品牌与界面归星玖工作室 Ntarstudio） |
| 运行时依赖 | 零（纯 JavaScript，不引入任何 npm 包） |
| 规模 | 内核 61 个模块 12,518 行（含自研天文数据表）；共享层 9 个模块 1,148 行；三端外壳 59 个文件 |

## 简介

**背景**：术数软件长期是两极——闭源商业排盘站（算法不透明、口径不可查、离线不可用）与零散开源脚本（单点功能、无统一历法底座、出问题无从复核）。想认真读、认真核、认真改的人，几乎没有可站的地面。

**问题**：三个硬骨头。一是**历法**：农历要靠真朔日与真节气，查表法在边界日必错；二是**口径**：紫微四化、奇门定元、六壬发用各派并存，混用即错；三是**可验证性**：给出结果却给不出依据，等于无法校验。

**做法**：把「天文历法」和「术数规则」严格分层。最底层 `src/core/calendar/` 用天文级数实时求太阳黄经、日月合朔与节气时刻，不依赖任何历表；中间层每个术数模块只消费标准化的干支/节气数据；最上层是端壳（小程序 / PWA / uni-app），只负责交互。所有流派选择都写进 [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md)，代码与文档不允许各说一套。

**适用**：术数研究者的文献校对与手工排盘复核；开发者集成（生辰→八字、节气提醒、黄历数据）；传统历法教学；以及需要自建透明内核的产品。

## 22 项功能

搜索是唯一入口：在首页搜索胶囊里输入一句话，触发词按「最长优先、多命中并列」匹配。命理类功能必须先给生辰；按时起局类功能未给时间时按此刻起盘。

| 分组 | 功能（短名） | 输入 | 输出要点 |
|---|---|---|---|
| 万年历黄历 | 查黄历 | 日期（默认今日） | 公历/农历/干支、值星、黄黑道、二十八宿、冲煞、彭祖百忌、胎神、宜忌、吉神凶煞 |
| 万年历黄历 | 查农历 | 日期（默认今日） | 农历月日、闰月、节气、生肖 |
| 八字命理 | 排八字 | 生辰 | 四柱、十神、藏干、纳音、旬空、胎元、五行分布 |
| 八字命理 | 解格局 | 生辰 | 月令、月令十神、透干、格局名、强弱评分与依据 |
| 八字命理 | 查神煞 | 生辰 | 天乙贵人、文昌、桃花、驿马、华盖、将星、羊刃、禄神、空亡、孤辰寡宿、红鸾天喜、天德月德等（逐条注明取法） |
| 八字命理 | 排运程 | 生辰 | 顺逆排法、起运岁数（三日折一年）、八步大运、小运两法并列、十年流年与太岁（岁伤日干/日犯岁君/真太岁/征太岁/岁运并临） |
| 紫微斗数 | 排紫微 | 生辰 | 十二宫、五行局、命身宫、十四主星、辅星、大限、星曜居宫断语（《紫微斗数全书》168 格原文） |
| 紫微斗数 | 解四化 | 生辰 | 生年四化、四化落宫、十干四化全表 |
| 奇门遁甲 | 排奇门 | 日期时间 | 时家转盘·拆补：遁局、旬首、值符值使、九宫天地盘、九星八门八神 |
| 奇门遁甲 | 排日家 | 日期 | 180 日一元轮派：局数、值符值使、九宫盘面 |
| 奇门遁甲 | 排刻家 | 日期时间 | 一时辰 50 刻制、刻干支、刻序、日家盘面 |
| 奇门遁甲 | 排宝鉴日奇 | 日期 | 日支定起门、日干定起星、八宫门星、日家对照 |
| 奇门遁甲 | 排年家月家 | 日期 | 年家局数与阴阳遁、月家正月 8 局递推 |
| 奇门遁甲 | 排飞盘 | 日期时间 | 飞盘派九宫飞泊、中宫不寄宫、天禽单列 |
| 奇门遁甲 | 解奇门格局 | 日期时间 | 青龙返首、飞鸟跌穴等十干克应格局检出、五不遇时 |
| 六爻占卜 | 排六爻 | 日期时间 / 铜钱 | 本卦变卦、八宫世应、京房纳甲、六亲六神、旬空月破日冲；分门断法（求财·词讼·疾病·出行·求名·婚姻）逐句引《黄金策》 |
| 六爻占卜 | 解六爻旺衰 | 日期时间 | 月建日建关系、旺相平休囚、月破旬空暗动标记 |
| 梅花易数 | 排梅花 | 日期时间 | 本卦、互卦、变卦、体用生克，并出《周易》卦辞、大象与动爻爻辞（后天起卦用爻辞兼卦辞） |
| 风水堪舆 | 查命卦 | 出生年+性别 | 命卦、大游年八星与八方吉凶 |
| 风水堪舆 | 排飞星 | 日期时间 | 年/月/日/时四层紫白、三元九运 |
| 大六壬 | 排六壬 | 日期时间 | 月将、天地盘、四课、九宗门发用、三传、天将 |
| 大六壬 | 解毕法 | 日期时间 | 三传四课结构化、毕法条目检出（实现 10 条明确条件者） |

## 核心亮点

### 1. 历法自底向上重算，不查历表

公历↔儒略日→太阳黄经（VSOP87 截断级数 + 章动/光行差/ΔT）→日月合朔（1985 年前走寿星精密朔表 SHUO_KB，之后走级数）→朔日定月→两冬至间无中气置闰。节气精确到秒：1901–2049 共 3,576 个节气与高精度参照对拍，平均偏差 0 秒、p99 = 1 秒、最大 60 秒、日期全部一致。**证据**：2004/2023 闰二月、2020 闰四月、1984 闰十月、1903 闰五月、1914 旧年代朔日全部命中；1985 无闰（正月初一＝2 月 20 日）。

### 2. 全部算法自研，零第三方内嵌

5.0.0 重构前，内核曾内嵌第三方历法/紫微发行包；重构后**全部移除**，农历、干支、节气、紫微安星、奇门、六壬、六爻、梅花、飞星均为本项目独立实现（内核 61 文件 12,518 行）。参考过的项目在 [NOTICE](NOTICE) 中逐条声明——只参考思路与规则，不复制代码与数据。

### 3. 算法以古籍原文为准，536 万例回归对拍证明无回归

**正确性以文献为准，不以任何既有实现为准**。凡库内 18 部公版古籍有明文者，一律按原文改判：身强弱改《滴天髓》得时/得地/得势三要素、扶抑方向改《子平真诠》「强者抑之」、格局派用神补顺逆用、天乙/文昌/羊刃/孤鸾/四废按《三命通会》改正、调候逐条对《穷通宝鉴》核改 13 条、巳藏干改「丙戊庚」、纳音改「沙中金」、外格专旺/从格改按《滴天髓·独象》《顺逆》原文判、奇门补「时干入墓」并分层「三奇合吉门/三奇得使」——逐条出处见 [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md)「文献校正」节；**22 项功能的证据强度总表见 [`docs/EVIDENCE-MAP.md`](docs/EVIDENCE-MAP.md)**（原书直证 / 结构自洽 / 库外通行三档，逐项标明哪些能站住、哪些只是有交代）；文献无载者（太极贵人/金舆/红艳煞）如实标注「待考」，不伪装有据。

在此之上做 1901–2100 全日期 × 十二时辰的回归对拍，证明重构未引入回归：八字 876,588 例、大运 1,753,176 例、紫微 1,779,456 例、奇门全家 876,588 例、黄历与农历转换 73,049 天全字段、八宅 596 例，合计约 536 万例。逐项记录见 [`docs/COMPARISON-REPORT.md`](docs/COMPARISON-REPORT.md)。

### 4. 口径显式化，分歧点名

紫微闰月归属（十五含在本月）、四化取中州主流、奇门取拆补定元、六壬昼夜贵人取卯至申、刻家取一时辰十刻（一刻十二分钟）——每一条都在 [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md) 里写明，并注明「另派如何」。改动口径＝改动单一表，不藏逻辑。

### 5. 大功能拆小模块，全项目模块化

奇门按「家」拆在 `src/core/mystic-gates/` 下：`hour-chart.js`（时家转盘）、`day-chart.js`（日家）、`quarter-chart.js`（刻家）、`mirror-chart.js`（宝鉴日奇）、`year-month-chart.js`（年家月家）、`flying-chart.js`（飞盘）、`patterns.js`（格局）。六壬在 `src/core/six-ren/` 下：`tables.js`/`three-transmissions.js`/`heavenly-generals.js`/`bifa.js`/`chart.js`。每个文件单一职责，可单独测试。

### 6. 三端共用一套内核

内核不感知任何端。小程序把 ESM 逐文件转写为 CommonJS（`tools/build-mp.js`），PWA 直接把 ESM 放到站点根目录（`tools/build-web.js`），uni-app 复用同一批模块。产物一致性由 `npm run check` 逐文件比对。

### 7. 可直接托管：网页版就在仓库根目录

`npm run build:web` 产出 `index.html` / `static/` / `core/` / `shared/` 到仓库根目录，EdgeOne 等静态托管平台连接仓库即可自动部署，无需额外配置构建目录。

## 设计细节

- **搜索唯一入口**：四种生辰写法（国历 / 农历 / 四柱）容错解析。输入归一化层（`src/core/features/normalizer.js`）清零宽与 BOM、全角与花式数字、上标下标、英文月份，中文数字转阿拉伯（60 余条功能词占位保护不被数字化），分隔符统一，连续数字按 14/12/8 位日期时间、6 位 YYMMDD、倒序 D-M-Y、日期后 HHMM、孤立 MMDD 拆分（9–11 位视为身份证不拆）。九种写法 `1990年6月15日` / `1990-6-15` / `1990.6.15` / `1990/6/15` / `15/6/1990` / `19900615` / 含零宽 / 全角 / 中文数字 → 同一盘。口语宜忌（「今天适合搬家吗」）转查黄历。缺时辰补 14 时；命理类缺生辰走四拒绝码就地提示，查询类（今日黄历、查农历）不受限制。
- **结果页三分支**：单算法 / 多命中并列 / 全套排盘分组（七类），「标签：值」两栏排版，长值自动折行。
- **开屏与动效**：开屏 1.2s 停留 + 400ms 缩放交接；页面双层视差转场；按压 120ms；弹窗「先播后摘」；柔晕呼吸光环 4400ms 常驻。
- **深浅主题**：320ms 交叉过渡，手动优先于系统，小程序端同步 `wx.setBackgroundColor`。
- **响应式**：<360px 满宽、360–767 设计稿、768–1023 居中 640、≥1024 居中 720，字号恒定。
- **单位纪律**：全项目 px / rem，不使用 rpx。uni-app 端如需条件编译适配小程序尺寸，见 [docs/DEPLOY.md](docs/DEPLOY.md)。
- **导出图片**：结果页镜像排版，2 倍图，单页超 4096pt 自动分页并标注「(接上页)」「第 i/n 张」。
- **存储三承诺**：读取不抛错、缺失给默认值、只清本项目前缀（`xael_`）的键，1MB 上限。
- **错误守卫**：只监听 `window` 的 error / unhandledrejection，不吞错、不外泄堆栈、带频控。
- **离线**：Service Worker 三级兜底（网络 → 缓存 → 离线页），404 页零外部请求。

## 技术栈与依赖清单

### 直接依赖

**运行时：无。** 零 npm 依赖，只用 ECMAScript 2015+。

### 开发与测试

| 工具 | 版本 | 版权方 | 许可证 | 地址 | 用途 | 是否修改 |
|---|---|---|---|---|---|---|
| Node.js | ≥ 18 | OpenJS Foundation | MIT | <https://nodejs.org/> | 运行测试与构建脚本 | 否 |
| uni-app | 3.x（可选） | DCloud | Apache-2.0 | <https://uniapp.dcloud.net.cn/> | uni-app 端构建（仅开发期） | 否 |
| Vue 3 | 3.x（可选） | Evan You | MIT | <https://vuejs.org/> | uni-app 端框架（仅开发期） | 否 |

测试为零依赖的自写断言（`tests/calendar.test.js` 154 项 + `tests/core.test.js` 1104 项 + `tests/mp-shell.test.js` 33 项 + `tests/ai-entry.test.js` 14 项 + `tests/tolerance.test.js` 33 项 + `tests/geomancy.test.js` 48 项，合计 1389 项），由 `tests/run.js` 统一执行，不需要测试框架。

### 参考过的项目（仅思路，未复制代码）

| 项目 | 版权方 | 许可证 | 地址 | 参考内容 |
|---|---|---|---|---|
| lunar-javascript | 6tail | MIT | <https://github.com/6tail/lunar-javascript> | 农历/干支/节气接口组织方式、子初换日与立春换年口径 |
| iztro | Sylar Long | MIT | <https://github.com/SylarLong/iztro> | 紫微安星步骤顺序、闰月归属处理（仅作口径参照与结果对拍） |
| 《万年历算法》逆向材料 | 佚名（网络流传） | 无明确许可证 | — | 仅参考功能划分；源码与内嵌数据一律未采用 |

另：历法天文级数理论出自 Jean Meeus《Astronomical Algorithms》第二版（算法思想不受版权保护，本项目独立实现）；法定节假日数据依据国务院历年公告自行录入。完整声明见 [NOTICE](NOTICE)。

### 间接依赖

无。不存在传递依赖。

## 安装与运行

```bash
git clone https://github.com/ntars/Xael.git
cd Xael
npm test          # 1389 项断言
npm run build     # 生成网页版（根目录）与小程序产物（dist/mp-weixin）
npm run build:uni # 校验 uni-app 壳（导入/样式约束，产物由 HBuilderX 生成）
npm run check     # 十二项发布自检
npm run check:cites # 文献引用审计（《书名·篇名》逐条回到 refs-texts/ 底本核）
```

作为库使用：

```javascript
import { chart } from './src/core/four-pillars/chart.js';
const c = chart({ y: 1990, m: 6, d: 15, h: 10 });
console.log(c.pillars.年.干支, c.pillars.月.干支, c.pillars.日.干支, c.pillars.时.干支);
// 庚午 壬午 辛亥 癸巳
```

## AI 接入（命令行 / MCP / 技能 / 专家包）

Xael 另提供三种本机 AI 宿主接入形态（全部本地演算，无网络、无后端）：

| 形态 | 入口 | 用法 |
|---|---|---|
| 命令行 | `bin/xael.js` | `xael ask "白玖玖，女，2005年6月9日子时 八字"` / `xael ask "今日宜忌" --text` / `xael list` / `xael schema` / `xael version`（`npm link` 后可用短命令） |
| MCP（stdio） | `mcp/server.js` | 三个工具：`xael_analyze` / `xael_list_features` / `xael_schema`；JSON-RPC 2.0 按行分帧，Claude Desktop / Cursor 等客户端以子进程接入 |
| 技能 | `skills/xael/SKILL.md` | AI 技能卡：何时调用、输入怎么写、status 七值怎么处理 |
| 专家包 | `experts/xael/5.0.0/` | 专家身份卡 `agents/xael-charting-expert.md`（原盘 + 白话 + 原文依据三件套工作法） |

**契约**：所有形态共用同一层 `bin/xael-api.js`（`xael/analysis@1`），命令行与 MCP 输出必然一致。
`status` 七值：`ok` / `need_birth` / `invalid_lunar` / `invalid_pillar` / `invalid_solar` / `refused` / `rejected`；
多命中并列时 `sections` 给出每节 `{title, text}`。冒烟覆盖见 `tests/ai-entry.test.js`（14 项）。

## 快速开始

```javascript
// 1. 农历换算（天文朔日，不查表）
import { solarToLunisolar } from './src/core/calendar/lunisolar.js';
solarToLunisolar(2004, 3, 21);   // { m: 2, d: 1, isLeap: true, monthName: '闰二月', dayName: '初一', text: '闰二月初一' }

// 2. 四柱
import { fourPillarsChart } from './src/core/four-pillars/chart.js';
fourPillarsChart({ y: 2024, m: 2, d: 10, h: 12 }).pillars;   // 甲辰 丙寅 甲辰 庚午

// 3. 黄历
import { almanacDaily } from './src/core/almanac/daily.js';
almanacDaily(2024, 2, 10).宜;

// 4. 一句话走搜索链路（与端上完全一致的入口）
import { analyze } from './src/core/features/analyzer.js';
await analyze('排奇门 2024年12月21日 12点');
```

## API 说明

| 模块 | 源码 | 主要导出 |
|---|---|---|
| calendar/julian | `src/core/calendar/julian.js` | `solarToJdn` / `jdnToSolar` / `dayNo` / `fromDayNo` / `weekday` |
| calendar/solar-terms | `src/core/calendar/solar-terms.js` | `solarTermsTable` / `prevSolarTerm` / `nextSolarTerm` / `prevSolarTermAt` / `nextSolarTermAt` |
| calendar/lunisolar | `src/core/calendar/lunisolar.js` | `solarToLunisolar` / `lunisolarToSolar` / `lunarYearStructure` / `lunarDayText` |
| calendar/sexagenary | `src/core/calendar/sexagenary.js` | `daySexagenary` / `monthSexagenary` / `yearSexagenary` / `hourSexagenary` / `effectiveDay` / `zodiacSign` |
| almanac/daily | `src/core/almanac/daily.js` | `almanacDaily` / `monthView` / `jieqiAround` |
| four-pillars | `src/core/four-pillars/{chart,patterns,symbolic-stars,luck-cycles,luck-judgement,year-lord,minor-cycles,yong-shen,month-command}.js` | `fourPillarsChart` / `chartPatternsOf` / `symbolicStarsOf` / `luckCyclesOf` / `luckJudgementOf` / `yearLordOf` / `minorCyclesOf` / `threeSchoolsOf` / `monthCommandOf` |
| purple-star | `src/core/purple-star/{chart,transformations,readings}.js` | `purpleStarChart` / `transformationsOf` / `purpleStarReadingsOf` |
| mystic-gates | `src/core/mystic-gates/{hour-chart,day-chart,quarter-chart,year-month-chart,flying-chart,mirror-chart,patterns}.js` | `mysticGatesHourChart` / `mysticGatesDayChart` / `mysticGatesQuarterChart` / `mysticGatesYearChart` / `mysticGatesMonthChart` / `mysticGatesFlyingChart` / `mysticGatesMirrorChart` / `mysticGatesPatternsOf` |
| six-ren | `src/core/six-ren/{chart,bifa,detail,extra-lessons,nian-ming}.js` | `sixRenChart` / `sixRenBifaOf` / `yingqiOf` / `extraLessonsOf` / `nianMingVerdicts` |
| six-lines | `src/core/six-lines/{cast,strength,timing,void,golden-chapters}.js` | `sixLinesCast` / `sixLinesStrengthOf` / `sixLinesTimingOf` / `voidVerdict` / `goldenVerdictsOf` |
| plum-blossom / geomancy | `src/core/plum-blossom/chart.js`、`src/core/geomancy/{eight-mansions,flying-stars}.js` | `plumBlossomChart` / `eightMansionsChart` / `flyingStarsChart` |
| features | `src/core/features/{registry,analyzer}.js` | `FEATURES` / `matchAll` / `catalog` / `analyze` |

## 性能

历法为纯数学运算：单次农历换算 < 5ms，八字排盘 < 1ms，奇门/六壬排盘 < 2ms（Node 24，M1）。小程序产物 270KB，网页版 425KB，均在首屏可承受范围。

## 安全与隐私

内核不发起任何网络请求、不读文件系统（节假日等数据内置于源码）、不收集任何用户信息；端壳只加载站点自身静态资源。生辰数据只经纯函数计算，存于本地存储且仅本项目前缀可清理，不上传、不落服务端。

## 兼容性

ECMAScript 2015+；Node ≥ 18 与现代浏览器直跑；微信小程序经 `tools/build-mp.js` 转写；uni-app 走 Vue 3 编译。

## 已知问题与限制

- 刻家、宝鉴日奇、年家月家、飞盘的流派分歧极大，本项目各取一种写明口径，不保证与商业软件一致；
- 毕法赋仅实现 10 条判定条件明确无争议的条目，其余不臆造；
- 奇门格局按十干克应检出典型格，未收录条目一律不生成；
- 节假日数据截至 2026 年国务院公告，之后年份需随源码更新；
- 天文算法与《中国天文年历》存在秒级差异，对术数应用无影响，不宜用于天文观测。

## 路线图

1. 补齐毕法条目与更多奇门格局（需逐条给判定条件与文献出处）；
2. 六爻纳甲补充神煞层与六亲旺衰的月日加权细则；
3. 官网 <https://x.ntars.cn/> 内容完善与文档站；
4. 交节边界 3 例（见对拍报告）随天文级数精化收敛；
5. 小程序分包与首屏体积进一步优化。

## 贡献

欢迎以 Issue 提出口径质疑（请附文献依据）与 bug 报告（请附可复现输入与期望输出）。代码贡献请守两条纪律：**口径改动必须同步 `docs/CALIBER-NOTES.md`；历法边界行为必须有测试断言。**

## 版权与许可

Copyright (c) 2024–2026 星玖工作室 Ntarstudio

本项目以 **GNU Affero General Public License v3.0（AGPL-3.0）** 授权，全文见 [LICENSE](LICENSE)。你可以自由使用、修改、再分发，但衍生作品须同样以 AGPL-3.0 开源；若作为网络服务提供，须向使用者提供完整源代码。「星玖工作室」「Ntarstudio」「玄玖灵犀」「Xael」等名称与标识归星玖工作室所有；AGPL-3.0 只给代码权利，不给商标权。

## NOTICE

运行时零第三方依赖。参考过的项目（lunar-javascript、iztro、《万年历算法》逆向材料）、天文算法理论出处、节假日数据来源，逐条列于 [NOTICE](NOTICE)。新增任何第三方组件时，必须先在该表登记（名称、版本、版权方、许可证、地址、用途、是否修改），再合入代码。
