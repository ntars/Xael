[简体中文](README.md) | **English**

# Xael · 玄玖灵犀

> *The mystery of mysteries — the gate of all wonders.* (Laozi, Daodejing)
>
> Xuanjiu Lingxi · Xael.

**Xael** (玄玖灵犀) is a local, offline library of traditional Chinese mantic literature (术数), also serving as a toolkit for collating, proofreading and digitally computing that corpus. It computes the calendar, Four Pillars, Zi Wei Dou Shu, Qi Men Dun Jia, Da Liu Ren, Liu Yao, Mei Hua Yi Shu, Xuan Kong Fei Xing and the almanac **from first principles, on your device** — no lookup tables, no network, no third-party divination API.

| | |
|---|---|
| Product | Xael (玄玖灵犀) |
| Version | 5.0.0 |
| Status | Product live (WeChat Mini Program and official account); kernel 5.0.0 in development |
| Repository | <https://github.com/ntars/Xael> |
| Website | <https://x.ntars.cn/> |
| Targets | browser PWA (implemented) / WeChat Mini Program (buildable) / uni-app (implemented, pending HBuilderX build) |
| License | AGPL-3.0 (brand and UI © Ntarstudio) |
| Runtime dependencies | none (pure JavaScript, no npm packages) |
| Size | 50 kernel modules, 5,764 lines; 1,134 lines shared layer; 59 shell files |

## Overview

**Background.** Divination software sits on two unsatisfying poles: closed commercial charting sites (opaque algorithms, undocumented conventions, no offline use) and scattered open scripts (single-purpose, no shared calendar base, impossible to audit).

**Problem.** Three hard parts. *Calendar*: the Chinese lunisolar calendar needs true new moons and true solar terms; table-driven code fails on boundary days. *Convention*: Zi Wei four transformations, Qi Men Dun Jia's *dingyuan* rule and Liu Ren's *fayong* chain each have competing schools — mixing them silently produces wrong charts. *Verifiability*: a result without a stated basis cannot be checked.

**Approach.** Strict layering. `src/core/calendar/` computes solar longitude, new moons and solar terms from astronomical series in real time. Each mantic module only consumes normalized sexagenary/term data. Shells only handle interaction. Every school choice is written down in [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md).

**Who it is for.** Researchers proofreading texts or hand-checking charts; developers integrating birth-data conversion; calendar teaching; anyone who needs a transparent engine.

## 22 Features

Search is the only entry point: type a sentence into the capsule on the home screen; trigger words match by longest-first, ties shown side by side. Chart features that need a birth date always require one; time-based features (Qi Men, Liu Ren, Liu Yao, Mei Hua) fall back to the current moment when no time is given.

| Group | Feature | Input | Output |
|---|---|---|---|
| Almanac | 查黄历 Almanac | date (default today) | Gregorian/lunar/sexagenary, day officer, 12 day gods, 28 mansions, clashes, Peng Zu taboos, fetal deity, do/don't, auspicious and inauspicious spirits |
| Almanac | 查农历 Lunar | date | lunar month/day, leap month, solar term, zodiac |
| Ba Zi | 排八字 Four Pillars | birth | four pillars, ten gods, hidden stems, Na Yin, void branches, fetal origin, five-element distribution |
| Ba Zi | 解格局 Pattern | birth | month command, month ten-god, exposed stems, pattern name, strength score with reasons |
| Ba Zi | 查神煞 Shen Sha | birth | noble, literary star, peach blossom, travelling horse, canopy, general star, blade, wealth sign, void, solitary stars, etc. (rule cited per entry) |
| Ba Zi | 排运程 Luck cycles | birth | direction rule, starting age (3 days = 1 year), eight decade pillars, ten yearly pillars |
| Zi Wei | 排紫微 Zi Wei chart | birth | twelve palaces, five-phase bureau, life/body palaces, 14 major stars, auxiliary stars, decade limits |
| Zi Wei | 解四化 Four transformations | birth | natal four transformations, their palaces, full ten-stem table |
| Qi Men | 排奇门 Time Qi Men | date-time | rotating-plate Chaibu: dun bureau, xun head, chief, nine palaces, stars, gates, deities |
| Qi Men | 排日家 Day Qi Men | date | 180-day yuan rotation: bureau, chief, nine-palace board |
| Qi Men | 排刻家 Ke Qi Men | date-time | 50-ke division, ke sexagenary, order, day board |
| Qi Men | 排宝鉴日奇 Baojian | date | gate by day branch, star by day stem, eight-palace board |
| Qi Men | 排年家月家 Year/Month | date | year bureau and yin/yang dun, month bureaus from 8 |
| Qi Men | 排飞盘 Flying plate | date-time | Fei Pan school, no hostel, Tian Qin separate |
| Qi Men | 解奇门格局 Patterns | date-time | stem-combination patterns (Qing Long Fan Shou etc.), Wu Bu Yu hours |
| Liu Yao | 排六爻 Hexagram | date-time or coins | original/changed hexagrams, palace, generation/response, Na Jia, six relatives, six spirits, void/break/clash |
| Liu Yao | 解六爻旺衰 Strength | date-time | month/day relations, vigour levels, break/void/hidden-move flags |
| Mei Hua | 排梅花 Plum Blossom | date-time | original, nuclear, changed hexagrams; body/use mutual production |
| Feng Shui | 查命卦 Life trigram | birth year + gender | trigram, eight-star ring, direction fortune |
| Feng Shui | 排飞星 Flying stars | date-time | year/month/day/hour purple-white, three-yuan nine-period |
| Da Liu Ren | 排六壬 Liu Ren | date-time | month general, heaven/earth plates, four lessons, nine-gate fayong, three transmissions, generals |
| Da Liu Ren | 解毕法 Bi Fa rules | date-time | structured lessons/transmissions, Bi Fa entries (the 10 with unambiguous conditions) |

## Highlights

### 1. Calendar recomputed from the bottom up, no tables

Gregorian ↔ Julian day → solar longitude (Meeus low-precision series) → true new moon → month start → leap month by the "no major solar term between two winter solstices" theorem. **Evidence:** leap second months 2004, 2023; leap fourth 2020; leap tenth 1984 all hit; 1985 has *no* leap month (first month starts Feb 20) — a case that exposed and killed an earlier "nearest solar term from the month midpoint" implementation.

### 2. Fully self-implemented, zero embedded third-party code

Before 5.0.0 the kernel embedded third-party calendar and Zi Wei packages. They are **all gone**: lunar calendar, sexagenary, solar terms, Zi Wei star placement, Qi Men, Liu Ren, Liu Yao, Mei Hua and flying stars are independent implementations (50 files, 5,764 lines). Referenced projects are declared in [NOTICE](NOTICE) — ideas and rules only, never code or data.

### 3. Conventions made explicit, disagreements named

Zi Wei leap-month attribution (day 15 belongs to the current month), four transformations per the Zhongzhou mainstream table, Qi Men *chaibu* dingyuan, Liu Ren daytime noble starting at the *mao* hour, Ke-school 50-ke division — every one is stated in [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md) with "what the other school does".

### 4. Large features split into small modules

Qi Men is split by school: `qimen.js` (time), `qimen-ri.js` (day), `ke.js`, `baojian.js`, `nianyue.js`, `feipan.js`, `ge.js`. Liu Ren into `tables.js` / `fayong.js` / `tianjiang.js` / `bifa.js` / `liuren.js`. One responsibility per file, independently testable.

### 5. One kernel, three shells

The kernel knows nothing about platforms. The Mini Program build transpiles ESM to CommonJS file by file (`tools/build-mp.js`); the PWA build copies ESM to the site root (`tools/build-web.js`); uni-app reuses the same modules. Artifact consistency is checked file by file by `npm run check`.

### 6. Deployable as-is: the web build lives in the repository root

`npm run build:web` emits `index.html` / `static/` / `core/` / `shared/` into the repository root, so EdgeOne or any static host can auto-deploy straight from the repo.

## Design details

- **Single search entry**: four birth-date notations (Gregorian / lunar / four pillars) with Chinese-numeral and full-width normalization; missing hour defaults to 14:00; birth-dependent features raise four rejection codes in place; query-type features (today's almanac, lunar date) are never gated.
- **Three result shapes**: single feature / multiple matches / full chart grouped into seven categories, laid out as "label: value" columns.
- **Motion**: 1.2s splash hold plus 400ms handoff; double-layer parallax page transitions; 120ms press; modals animate out before removal; a 4400ms breathing halo.
- **Themes**: 320ms cross-fade, manual choice overrides system, `wx.setBackgroundColor` mirrored on the Mini Program.
- **Responsive**: full width below 360px, design width 360–767, centred 640 (768–1023), centred 720 (≥1024); type sizes constant.
- **Units**: px / rem throughout, never rpx. Conditional compilation for Mini Program sizing is documented in [docs/DEPLOY.md](docs/DEPLOY.md).
- **Image export**: mirrored layout, 2× DPR, automatic paging beyond 4096pt with "(continued)" and "page i/n" marks.
- **Storage contract**: reads never throw, defaults on miss, only the `xael_` prefix is cleared, 1MB cap.
- **Error guard**: listens to `window` error / unhandledrejection only, never swallows, never leaks stack traces, rate-limited.
- **Offline**: three-tier service-worker fallback, external-request-free 404 page.

## Tech stack and dependencies

### Direct dependencies

**Runtime: none.** Zero npm dependencies, ECMAScript 2015+ only.

### Development and testing

| Tool | Version | Owner | License | URL | Purpose | Modified |
|---|---|---|---|---|---|---|
| Node.js | ≥ 18 | OpenJS Foundation | MIT | <https://nodejs.org/> | tests and build scripts | no |
| uni-app | 3.x (optional) | DCloud | Apache-2.0 | <https://uniapp.dcloud.net.cn/> | uni-app build only | no |
| Vue 3 | 3.x (optional) | Evan You | MIT | <https://vuejs.org/> | uni-app framework only | no |

Tests use hand-written assertions (`tests/calendar.test.js`, `tests/core.test.js`); no test framework is needed.

### Referenced projects (ideas only, no code copied)

| Project | Owner | License | URL | What was referenced |
|---|---|---|---|---|
| lunar-javascript | 6tail | MIT | <https://github.com/6tail/lunar-javascript> | API organisation for lunar/sexagenary/terms; day changes at 23:00 and year changes at Lichun conventions |
| iztro | Sylar Long | MIT | <https://github.com/SylarLong/iztro> | Zi Wei star placement order and leap-month handling (convention reference and output cross-check only) |
| "Wan Nian Li algorithm" reverse-engineered material | unknown (circulated) | none stated | — | feature partitioning only; neither code nor embedded data used |

Astronomical series follow Jean Meeus, *Astronomical Algorithms*, 2nd ed. (algorithms are not copyrightable; the implementation here is independent). Public-holiday data are transcribed from State Council announcements. Full statement in [NOTICE](NOTICE).

### Indirect dependencies

None.

## Install and run

```bash
git clone https://github.com/ntars/Xael.git
cd Xael
npm test          # 145 assertions
npm run build     # web build (repo root) + Mini Program build (dist/mp-weixin)
npm run build:uni # validate uni-app shell (imports/style constraints; artifacts come from HBuilderX)
npm run check     # eight pre-release checks
```

As a library:

```javascript
import { chart } from './src/core/bazi/bazi.js';
const c = chart({ y: 1990, m: 6, d: 15, h: 10 });
console.log(c.pillars.年.干支, c.pillars.月.干支, c.pillars.日.干支, c.pillars.时.干支);
// 庚午 壬午 辛亥 癸巳
```

## Quick start

```javascript
// 1. Lunisolar conversion (true new moons, no tables)
import { solarToLunar } from './src/core/calendar/lunar2.js';
solarToLunar(2004, 3, 21);   // { m: 2, d: 1, isLeap: true, monthName: '闰二月' }

// 2. Four pillars
import { chart } from './src/core/bazi/bazi.js';
chart({ y: 2024, m: 2, d: 10, h: 12 }).pillars;   // 甲辰 丙寅 甲辰 庚午

// 3. Almanac
import { daily } from './src/core/huangli/daily.js';
daily(2024, 2, 10).宜;

// 4. Full search path, identical to the UI
import { analyze } from './src/core/features/analyzer.js';
await analyze('排奇门 2024年12月21日 12点');
```

## API

| Module | Entry | Exports |
|---|---|---|
| calendar/solar | `src/core/calendar/solar.js` | `solarToJdn` / `jdnToSolar` / `dayNo` / `fromDayNo` / `weekday` |
| calendar/astronomy | `src/core/calendar/astronomy.js` | apparent solar longitude, new-moon JDE, ΔT |
| calendar/jieqi2 | `src/core/calendar/jieqi2.js` | `jieqiTable(y)` / `jieqiAround` |
| calendar/lunar2 | `src/core/calendar/lunar2.js` | `solarToLunar` / `lunarToSolar` |
| calendar/ganzhi | `src/core/calendar/ganzhi.js` | `dayGanZhi` / `monthGanZhi` / `yearGanZhiByLichun` / `hourGanZhi` / `effectiveDay` |
| huangli/daily | `src/core/huangli/daily.js` | `daily` / `monthView` / `jieqiAround` |
| bazi | `src/core/bazi/{bazi,pattern,shensha,dayun}.js` | `chart` / `patternOf` / `shenshaOf` / `dayunOf` |
| ziwei | `src/core/ziwei/{ziwei,sihua}.js` | `ziweiChart` / `sihuaOf` |
| qimen | `src/core/qimen/{qimen,qimen-ri,ke,baojian,nianyue,feipan,ge}.js` | seven Qi Men boards and pattern detection |
| liuren | `src/core/liuren/{liuren,fayong,tianjiang,bifa}.js` | `liurenChart` / `bifaOf` |
| liuyao | `src/core/liuyao/{liuyao,gonggua,najia,wangshuai}.js` | `liuyaoChart` / `wangshuaiOf` |
| meihua / fengshui | `src/core/meihua/meihua.js`, `src/core/fengshui/{bazhai,feixing}.js` | `meihuaChart` / `bazhaiChart` / `feixingChart` |
| features | `src/core/features/{registry,analyzer}.js` | `FEATURES` / `matchFeature` / `runFeature` / `analyze` |

Every function is pure: date-time or birth data in, structured object out. No IO, no network.

## Configuration

The kernel has no config file; all conventions are documented in [`docs/CALIBER-NOTES.md`](docs/CALIBER-NOTES.md). Shell configuration:

- `src/shells/mp-weixin/project.config.json`: Mini Program appid `wx7d40cfd5e4849d0d`;
- `src/shells/uniapp/manifest.json`: app name and `mp-weixin.appid` (same appid);
- `src/shells/pwa/manifest.webmanifest`: PWA name, theme colour, icons.

## Project structure

```
Xael/
├── index.html              # web entry (generated by npm run build:web)
├── static/ core/ shared/   # web assets and kernel copy (generated)
├── src/
│   ├── core/               # kernel (platform-agnostic)
│   │   ├── calendar/       #   solar / astronomy / jieqi2 / lunar2 / ganzhi / festival
│   │   ├── huangli/        #   daily / jianchu / tianshen / xiu28 / position / jishen / chongsha
│   │   ├── bazi/           #   bazi / pattern / shensha / dayun
│   │   ├── ziwei/          #   ziwei / ziwei-support / sihua
│   │   ├── qimen/          #   qimen / qimen-ri / ke / baojian / nianyue / feipan / ge
│   │   ├── liuren/         #   liuren / fayong / tianjiang / tables / bifa
│   │   ├── liuyao/         #   liuyao / gonggua / najia / wangshuai
│   │   ├── meihua/ fengshui/  #   meihua / bazhai / feixing
│   │   ├── common/         #   constants (single source of tables) / iching (64 hexagrams)
│   │   └── features/       #   registry (22 features) / analyzer (search path)
│   ├── shared/             # storage / conversation / result-format / settings /
│   │                       # refs / theme / inflight / guard / export-image
│   └── shells/             # pwa / mp-weixin / uniapp
├── tests/                  # calendar.test.js (66) / core.test.js (35) / run.js
├── tools/                  # build-web.js / build-mp.js / preflight.js
├── docs/                   # CALIBER-NOTES.md / DEPLOY.md
└── dist/mp-weixin/         # Mini Program build output (generated, not committed)
```

## Performance

Pure arithmetic: lunar conversion < 5ms, Four Pillars < 1ms, Qi Men / Liu Ren < 2ms (Node 24, Apple M1). Mini Program bundle 270KB, web build 425KB.

## Security and privacy

The kernel makes no network requests, touches no filesystem (holiday data ships in the source) and collects no telemetry; the shells load only the site's own static assets. Birth data passes through pure functions, is stored locally under the `xael_` prefix only, never uploaded.

## Compatibility

ECMAScript 2015+; runs directly on Node ≥ 18 and modern browsers; Mini Program via `tools/build-mp.js`; uni-app via Vue 3 compilation.

## Known limitations

- Ke school, Baojian, year/month Qi Men and the flying plate differ widely between schools; one convention each is implemented and documented, not matched to commercial software.
- Only the 10 Bi Fa entries with unambiguous conditions are implemented; no invented rules.
- Qi Men patterns are limited to stem-combination patterns; unlisted cases are never generated.
- Holiday data end at the 2026 State Council announcement.
- Astronomical accuracy is within seconds; unsuitable for observational astronomy.

## Roadmap

1. More Bi Fa entries and Qi Men patterns (each needs a stated condition and a textual source);
2. Liu Yao: extra shen-sha layer and month/day weighting for six relatives;
3. Website <https://x.ntars.cn/> content and documentation site;
4. Further Mini Program subpackage optimisation.

## Contributing

Open an issue to question a convention (cite the source text) or report a bug (include reproducible input and expected output). Two rules for code: **convention changes must update `docs/CALIBER-NOTES.md`; calendar boundary behaviour must have assertions.**

## License

Copyright (c) 2024–2026 Ntarstudio

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**; see [LICENSE](LICENSE). You may use, modify and redistribute, provided derivative works stay AGPL-3.0 and, if you offer it as a network service, users can obtain the complete source. 「星玖工作室」, Ntarstudio, 玄玖灵犀 (Xael) and its marks belong to Ntarstudio; AGPL-3.0 grants rights to code only, not to trademarks.

## NOTICE

No third-party runtime dependencies. Referenced projects (lunar-javascript, iztro, the reverse-engineered "Wan Nian Li" material), the astronomical textbook, and holiday data sources are listed one by one in [NOTICE](NOTICE). Any new third-party component must be registered there (name, version, owner, licence, URL, purpose, modified) before it is merged.
