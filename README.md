**简体中文** | [English](README_EN.md)

# 玄玖灵犀 Xael

> 本地离线的术数文献库。代号 Xael，内核代号 NT-Xhex。

「术数」（命理、择吉、星象、卦占）是绵延两千余年的中国传统知识体系，但其文献与实践长期停留在三个状态：**口诀靠背**、**历法靠翻**、**排盘靠手**。Xael 把这一整套知识做成可被程序调用的开源计算内核——历法换算、八字排盘、紫微命盘、奇门遁甲、大六壬、六爻、梅花易数、黄历择吉，全部由代码精确计算，不查表、不抄网页、不调用任何第三方术数 API。

| | |
|---|---|
| 代号 | Xael（内核 NT-Xhex） |
| 仓库 | <https://github.com/ntars/Xael> |
| 官网 | <https://x.ntars.cn/> |
| 现状 | 产品已上线，微信小程序与公众号同名；核心内核 v4.3.0 已实现并通过 66 项断言测试 |
| 许可 | AGPL-3.0 |
| 语言 | 纯 JavaScript（CommonJS），零 npm 依赖 |
| 版权 | Copyright (c) 2026 星玖工作室 Ntarstudio |

## 简介

**背景**：传统术数软件市场被两类产品占据——闭源的商业排盘站（算法不透明、广告泛滥、数据不可控）和零散的开源脚本（单个功能、无统一口径、无文档）。想认真研究或集成术数计算的开发者，几乎没有一个可信、可读、可扩展的起点。

**问题**：术数计算存在三个公认的难点。一是**历法**：公历↔农历↔干支的换算涉及天文朔日与节气精确到分钟，查表法在边界日期上必然出错；二是**口径**：同一件事（如紫微四化、奇门局数）存在多个流派，混用口径是计算错误的头号来源；三是**可验证性**：闭源工具给出结果，使用者无从复核计算过程。

**核心思路**：把「天文历法」与「术数规则」严格分层——底层 `calendar/` 用天文级数（Meeus 算法）实时计算朔日、节气、儒略日，不依赖任何查表；上层每个术数模块只消费底层输出的标准干支/节气数据，并在 `docs/CALIBER-NOTES.md` 中显式声明自己采用的流派口径。每一行计算代码都是可读、可复核、可单元测试的。

**适用场景**：术数研究者的文献核对与手工排盘复核；开发者集成（生日转八字、节气提醒、黄历数据）；传统历法教学演示；以及对算法透明度有要求的商业产品自建内核。

## 核心功能

| 模块 | 功能 | 状态 |
|---|---|---|
| calendar | 公历↔儒略日↔干支纪年↔天文朔日农历↔节气（精确到分钟）↔节日 | ✅ 已实现 + 66 项断言 |
| bazi | 八字排盘：四柱干支、五行旺衰、纳音 | ✅ 已实现 |
| ziwei | 紫微斗数：安星（中州派口径）、十二宫、四化 | ✅ 已实现 |
| huangli | 黄历：每日宜忌、冲煞、值神、建除十二神 | ✅ 已实现（7 个子模块） |
| qimen | 奇门遁甲：阳遁/阴遁局数、九宫排盘 | 🚧 规划中 |
| liuren | 大六壬：九宗门起课、四课三传 | 🚧 规划中 |
| liuyao | 六爻：京房纳甲、世应六亲 | 🚧 规划中 |
| meihua | 梅花易数：体用生克 | 🚧 规划中 |
| fengshui | 八宅 / 玄空飞星 | 🚧 规划中 |

## 核心亮点

### 1. 天文级农历，不查表

农历每月初一必须是真实的朔日（月球合朔时刻所在日）。Xael 在 `src/core/calendar/lunar2.js` 中用 Meeus 级数直接计算日月黄经差，逐日求朔，再以节气定闰月——这套算法与《中国天文年历》同源。**差异化**：绝大多数开源农历库用预生成对照表，表覆盖年限之外即失效；Xael 可算任意年份。**证据**：`solarToJdn(2026, 1, 1) === 2461042`，66 项 `tests/calendar.test.js` 断言全部通过。

### 2. 口径显式化：每个流派选择都有出处

`docs/CALIBER-NOTES.md` 逐条记录计算口径：干支纪年以**立春**为界（铁律）；紫微四化采用**中州派**主流表；奇门局数采用阳遁阴遁标准局数表；六爻纳甲用**京房**体系；大六壬用**九宗门**起课法。**差异化**：其它开源实现通常把流派选择埋在代码里，Xael 把口径选择沉淀为一份可讨论、可替换的文档。**证据**：笔记 78 行，覆盖全部已实现与规划模块。

### 3. 零依赖纯 JavaScript

`package.json` 不存在，因为不需要——全部 2,633 行源码（23 个文件）只用 JavaScript 原生能力。**差异化**：同类项目动辄引入 moment、luxon 或各类农历包，Xael 的历法是自己算的。**证据**：`node tests/calendar.test.js` 在裸 Node 下直接运行，无任何 install 步骤。

### 4. 单一真源的字表体系

天干、地支（含藏干）、五行、阴阳、生肖全部集中在 `src/core/common/constants.js`（163 行）一处定义，其余模块只引用不重复。**价值**：修一处错即全局生效，杜绝「两个模块藏干表不一致」这类隐蔽 bug。**证据**：grep 验证所有模块的干支引用均指向 constants。

### 5. 自有节假日数据，不怕接口失效

法定节假日（含调休）由 Xael 自行录入 2007–2026 年国务院公告数据，存于 `src/core/calendar/festival.js`。**差异化**：常见做法是调用第三方节假日 API，接口一旦下线或改版整个功能瘫痪；Xael 的数据随源码分发、离线可用。**证据**：`festival.js` 98 行，含 20 年完整数据。

## 设计细节与小巧思

- **节气精确到分钟**：`jieqi2.js` 求解太阳视黄经为 15° 整数倍的精确时刻，在 `huangli` 模块中用于判定「节气日当天换月柱」的边界情形——这正是多数查表实现出错的地方。
- **2-gram 倒排检索**：`memory` 检索（规划中）与文档检索统一用 2-gram 分词（中文按字、英文小写整词），避免引入分词器依赖。
- **历法四层分离**：`solar`（公历↔儒略日）→ `astronomy`（天体位置）→ `lunar2`（朔日/闰月）→ `ganzhi/jieqi`（干支与节气），每层只依赖下一层，可单独测试。
- **测试即文档**：66 项断言覆盖朔日边界、闰月位置、立春年界、儒略日往返，读测试即知口径。
- **壳与核分离**：`shells/`（小程序、PWA、uni-app）只是对同一内核的封装，内核 `src/core/` 不感知任何端。

## 技术栈与依赖清单

### 直接依赖

**运行时：无。** 全部 2,633 行源码为纯 JavaScript（CommonJS），仅依赖 Node.js 原生能力，零 npm 依赖。

### 开发与测试

| 工具 | 版本 | 版权方 | 许可证 | 官方地址 | 用途 | 是否修改 |
|---|---|---|---|---|---|---|
| Node.js | ≥ 14（测试运行环境） | OpenJS Foundation | MIT | https://nodejs.org/ | 运行测试与脚本 | 否 |

测试框架为零依赖的自写断言（`tests/calendar.test.js`），无需安装任何东西。

### 算法与数据来源（非代码依赖，一并声明）

| 来源 | 版权方 | 类型 | 官方地址 | 用途 | 是否修改 |
|---|---|---|---|---|---|
| Jean Meeus, *Astronomical Algorithms*（第二版，Willmann-Bell, 1998） | Jean Meeus / Willmann-Bell | 天文算法思想（不受版权约束，本项目独立实现） | https://www.willbell.com/math/mc1.htm | 历法层（solar / astronomy / lunar2 / jieqi2）的太阳黄经、朔日与 ΔT 级数 | 算法思想参照，代码全新实现 |
| 2007–2026 年国务院历年节假日公告 | 中国政府网 | 公开数据自行录入 | https://www.gov.cn/ | `src/core/calendar/festival.js` 法定节假日与调休数据 | 录入整理 |

### 间接依赖

无。不存在传递依赖。

## 安装与部署

无需安装。克隆即用：

```bash
git clone https://github.com/ntars/Xael.git
cd Xael
node tests/calendar.test.js   # 66 项断言验证环境正常
```

作为库引入：

```javascript
const { solarToJdn } = require('./src/core/calendar/solar');
const { getBazi } = require('./src/core/bazi/bazi');
```

多端壳（微信小程序 / PWA / uni-app）目录已预留（`shells/`），尚未开始开发。

## 快速开始

```javascript
// 1. 公历 → 儒略日
const { solarToJdn } = require('./src/core/calendar/solar');
const jdn = solarToJdn(2026, 1, 1);   // 2461042

// 2. 公历 → 干支纪年（以立春为界）
const { getGanzhiYear } = require('./src/core/calendar/ganzhi');
getGanzhiYear(2026, 2, 5);   // 丙午（2026-02-04 立春之后）

// 3. 八字排盘
const { getBazi } = require('./src/core/bazi/bazi');
getBazi(2026, 1, 15, 10);

// 4. 当日黄历（宜忌、冲煞、建除）
const { getDaily } = require('./src/core/huangli/daily');
getDaily(2026, 1, 15);
```

## API / 模块说明

内核以 CommonJS 模块对外导出纯函数，按历法四层与术数模块组织：

| 模块 | 入口 | 导出（示例） | 说明 |
|---|---|---|---|
| calendar/solar | `src/core/calendar/solar.js` | `solarToJdn(y,m,d)` / `jdnToSolar(jdn)` | 公历与儒略日数互转，全部换算的基座 |
| calendar/ganzhi | `src/core/calendar/ganzhi.js` | `getGanzhiYear(y,m,d)` 等 | 干支年/月/日，年界立春 |
| calendar/lunar2 | `src/core/calendar/lunar2.js` | 农历年月日与闰月判定 | 天文朔日版农历，不查表 |
| calendar/jieqi2 | `src/core/calendar/jieqi2.js` | 节气时刻（精确到分钟） | 太阳视黄经 15° 求解 |
| calendar/festival | `src/core/calendar/festival.js` | 法定节假日/调休查询 | 2007–2026 公告数据 |
| bazi | `src/core/bazi/bazi.js` | `getBazi(y,m,d,h)` | 四柱、五行旺衰、纳音 |
| ziwei | `src/core/ziwei/ziwei.js` | 安星与四化 | 中州派口径 |
| huangli | `src/core/huangli/daily.js` | `getDaily(y,m,d)` | 每日宜忌、冲煞、值神、十二建除 |
| common/constants | `src/core/common/constants.js` | 天干地支/藏干/五行/阴阳/生肖字表 | 单一真源，其余模块引用 |

所有函数均为无副作用纯函数：输入公历日期时间，输出结构化结果；不做 IO、不发网络请求。

## 配置说明

内核无配置文件——所有口径在 `docs/CALIBER-NOTES.md` 中以文档形式声明，改动口径即改动代码，二者不允许分离。这一设计是刻意的：术数软件最容易出问题的就是「文档说一套、代码算一套」。

## 目录结构

```
Xael/
├── src/
│   ├── core/
│   │   ├── calendar/       # 历法内核
│   │   │   ├── solar.js        # 公历↔儒略日
│   │   │   ├── astronomy.js    # 天体黄经（Meeus 级数）
│   │   │   ├── lunar2.js       # 天文朔日农历与闰月
│   │   │   ├── jieqi2.js       # 节气（精确到分钟）
│   │   │   ├── ganzhi.js       # 干支纪年/月/日
│   │   │   └── festival.js     # 法定节假日（2007–2026 公告数据）
│   │   ├── bazi/           # 八字排盘
│   │   ├── ziwei/          # 紫微斗数（中州派口径）
│   │   ├── huangli/        # 黄历（7 个子模块）
│   │   ├── qimen/ liuren/ liuyao/ meihua/ fengshui/   # 规划中
│   │   └── common/constants.js  # 天干/地支/藏干/五行/生肖单一真源
│   └── shells/             # 小程序 / PWA / uni-app 壳（规划中）
├── tests/
│   └── calendar.test.js    # 66 项零依赖断言
├── docs/
│   └── CALIBER-NOTES.md    # 口径笔记（流派选择与依据）
└── tools/                  # 辅助工具（规划中）
```

## 性能

历法计算为纯数学运算：单次八字排盘 < 1ms，农历换算 < 5ms，全部离线完成，无任何网络请求。

## 安全与隐私

内核不发起任何网络请求、不读写文件系统（节日数据内置于源码）、不收集任何用户信息。生辰数据只经过纯函数计算，不落盘、不上传。

## 兼容性

运行时仅依赖 ECMAScript 2015+ 特性，Node.js ≥ 14 与所有现代浏览器均可直接运行。未使用任何 Node 专属 API，同一份代码可在小程序与浏览器环境中复用。

## 已知问题与限制

- 奇门、六壬、六爻、梅花、风水五个模块目录已建立但尚无实现；
- 多端壳（小程序 / PWA / uni-app）未开始开发，小程序与公众号为当前主要入口；
- 节假日数据截至 2026 年国务院公告，之后年份需随源码更新；
- 天文算法精度与《中国天文年历》存在秒级差异，对术数应用无影响，但不宜直接用于天文观测。

## 路线图

1. 补齐奇门遁甲与大六壬（口径已定，见 CALIBER-NOTES）；
2. 六爻、梅花易数与风水模块；
3. 第一个端壳（PWA 优先，端壳与内核同为纯 JavaScript，可直接复用）；
4. 官网 `x.ntars.cn` 内容完善并在此登记。

## 贡献

欢迎以 Issue 提出口径质疑（请附文献依据）与 bug 报告（请附可复现的输入与期望输出）。代码贡献请保持两条纪律：口径改动必须同步 `docs/CALIBER-NOTES.md`；历法边界行为必须有测试断言。

## 版权与许可

Copyright (c) 2026 星玖工作室 Ntarstudio

本项目以 **GNU Affero General Public License v3.0（AGPL-3.0）** 授权，全文见 [LICENSE](./LICENSE)。这意味着：你可以自由使用、修改、再分发，但衍生作品必须同样以 AGPL-3.0 开源；若将其作为网络服务提供，必须向服务使用者提供完整源代码。许可证英文原文以 [LICENSE](./LICENSE) 文件为准，本节仅为摘要。

## NOTICE

第三方组件与来源声明：

| 组件 | 版本 | 版权方 | 许可证 | 地址 | 用途 | 是否修改 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | 运行时零第三方依赖 | — |

开发期使用的 Node.js（OpenJS Foundation，MIT）为外部运行环境，不随本项目分发。历法天文级数算法的理论出处为 Jean Meeus《Astronomical Algorithms》（第二版，Willmann-Bell, 1998）——算法思想不受版权保护，本项目实现为独立编写。

新增任何第三方组件时，必须先在此表登记（名称、版本、版权方、许可证、地址、用途、是否修改），再合入代码。
