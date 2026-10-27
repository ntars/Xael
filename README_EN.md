[简体中文](README.md) | **English**

# Xuanjiu Lingxi Xael

> A local, offline library of traditional divination literature. Code name Xael, kernel code name NT-Xhex.

Shùshù (数术 — fate calculation, date selection, astrology, hexagram divination) is a body of traditional Chinese knowledge spanning over two thousand years, yet its literature and practice have long been stuck in three states: **formulas memorized by rote**, **calendars consulted by hand**, and **charts plotted manually**. Xael turns this entire system into an open-source computation core that programs can call — calendar conversion, BaZi charts, Ziwei charts, Qimen Dunjia, Da Liu Ren, Liu Yao, Meihua Yishu, and almanac date selection, all computed precisely by code. No lookup tables, no copied web pages, no third-party divination APIs.

| | |
|---|---|
| Code name | Xael (kernel: NT-Xhex) |
| Repository | <https://github.com/ntars/Xael> |
| Website | <https://x.ntars.cn/> |
| Status | Product live, with a same-named WeChat mini program and official account; core kernel v4.3.0 implemented and passing 66 assertions |
| License | AGPL-3.0 |
| Language | Pure JavaScript (CommonJS), zero npm dependencies |
| Copyright | Copyright (c) 2026 星玖工作室 Ntarstudio |

## Introduction

**Background**: the market for traditional divination software is split between two kinds of products — closed-source commercial charting sites (opaque algorithms, ads everywhere, data you don't control) and scattered open-source scripts (one feature each, no unified conventions, no documentation). A developer who wants to seriously study or integrate divination computations has almost no trustworthy, readable, extensible starting point.

**The problem**: divination computation has three well-known traps. First, **calendars**: Gregorian↔lunar↔sexagenary conversion requires new moons and solar terms precise to the minute — table-based approaches inevitably break on boundary dates. Second, **conventions**: for any given rule (Ziwei's Four Transformations, Qimen'sJu numbers) there are multiple schools, and mixing conventions is the number-one source of computational errors. Third, **verifiability**: closed-source tools give you a result, but nobody can check how it was derived.

**Core idea**: strictly layer "astronomical calendrics" above "divination rules". The `calendar/` layer computes new moons, solar terms and Julian day numbers from astronomical series (Meeus algorithms) in real time, with no tables; each divination module consumes only the standardized ganzhi/solar-term output of that layer, and explicitly declares its school convention in `docs/CALIBER-NOTES.md`. Every line of computational code is readable, reviewable and unit-testable.

**Use cases**: researchers cross-checking literature and verifying hand-plotted charts; developers integrating features (birthday→BaZi, solar-term reminders, almanac data); teaching traditional calendrics in the classroom; and commercial products with transparency requirements building their own kernel.

## Core Features

| Module | Capability | Status |
|---|---|---|
| calendar | Gregorian↔Julian day↔sexagenary years↔astronomical lunar calendar↔solar terms (to the minute)↔festivals | ✅ implemented + 66 assertions |
| bazi | BaZi charts: four pillars, five-element strength, Nayin | ✅ implemented |
| ziwei | Zi Wei Dou Shu: star placement (Zhongzhou school), twelve palaces, Four Transformations | ✅ implemented |
| huangli | Almanac: daily do's and don'ts, clashes,值班 deities, twelve day officers | ✅ implemented (7 submodules) |
| qimen | Qimen Dunjia: yang/yin Ju numbers, nine-palace charts | 🚧 planned |
| liuren | Da Liu Ren: nine-gate lesson casting, four lessons & three transmissions | 🚧 planned |
| liuyao | Liu Yao: Jingfang Najia, world/reponse lines and six relatives | 🚧 planned |
| meihua | Meihua Yishu: body/use generation and control | 🚧 planned |
| fengshui | Eight Mansions / Xuan Kong Flying Stars | 🚧 planned |

## Highlights

### 1. Astronomical lunar calendar — no tables

The first day of every lunar month must be a true new moon (the day containing the lunar conjunction). `src/core/calendar/lunar2.js` computes lunar and solar ecliptic longitudes from Meeus series, scans day by day for conjunctions, then determines leap months by solar terms — the same approach as the *Chinese Astronomical Almanac*. **Differentiation**: most open-source lunar libraries use pre-generated conversion tables that expire outside their covered range; Xael can compute any year. **Evidence**: `solarToJdn(2026, 1, 1) === 2461042`; all 66 assertions in `tests/calendar.test.js` pass.

### 2. Explicit conventions: every school choice is documented

`docs/CALIBER-NOTES.md` records each computation convention line by line: sexagenary years turn at **Lichun** (an iron rule); Ziwei's Four Transformations follow the mainstream **Zhongzhou school** table; Qimen Ju numbers follow the standard yang/yin table; Liu Yao uses the **Jingfang** Najia system; Da Liu Ren uses the **nine-gate** casting method. **Differentiation**: other implementations bury school choices inside code; Xael turns them into a document that can be discussed and swapped. **Evidence**: 78 lines covering every implemented and planned module.

### 3. Zero-dependency pure JavaScript

There is no `package.json`, because none is needed — all 1,969 lines of source (18 files) rely only on native JavaScript. **Differentiation**: comparable projects pull in moment, luxon or assorted lunar packages; Xael computes its own calendar. **Evidence**: `node tests/calendar.test.js` runs on bare Node with no install step.

### 4. Single source of truth for character tables

Heavenly stems, earthly branches (with hidden stems), five elements, yin-yang and zodiac animals are defined once in `src/core/common/constants.js` (163 lines); every other module references instead of repeating them. **Value**: one fix takes effect everywhere, eliminating the classic bug of two modules disagreeing on hidden stems. **Evidence**: grep confirms all ganzhi references across modules resolve to constants.

### 5. In-house holiday data that can't be taken away

Statutory holidays (with adjusted working days) are entered from the 2007–2026 State Council announcements and stored in `src/core/calendar/festival.js`. **Differentiation**: the common approach calls a third-party holiday API, and the feature dies when the API is retired; Xael's data ships with the source and works offline. **Evidence**: `festival.js`, 98 lines, 20 full years.

## Design details

- **Solar terms to the minute**: `jieqi2.js` solves for the precise instant the apparent solar longitude crosses multiples of 15°, used in `huangli` to decide the "month pillar changes on the solar-term day" boundary — exactly where table-based implementations go wrong.
- **2-gram inverted index**: memory and document search (planned) share one 2-gram tokenizer (per-character for Chinese, lowercased whole words for English), avoiding a segmentation dependency.
- **Four-layer calendar separation**: `solar` (Gregorian↔JDN) → `astronomy` (celestial positions) → `lunar2` (new moons / leap months) → `ganzhi` / `jieqi` (sexagenary and solar terms); each layer depends only on the one below and is tested in isolation.
- **Tests as documentation**: the 66 assertions cover new-moon boundaries, leap-month placement, the Lichun year boundary and Julian-day round trips; reading the tests reveals the conventions.
- **Shell/kernel separation**: `shells/` (mini program, PWA, uni-app) only wrap the same kernel; `src/core/` knows nothing about any platform.

## Tech Stack & Dependencies

### Direct dependencies

**Runtime: none.** All 1,969 lines are pure JavaScript (CommonJS) on native Node.js capabilities — zero npm dependencies.

### Development & testing

| Tool | Version | Copyright | License | Purpose | Modified |
|---|---|---|---|---|---|
| Node.js | ≥ 14 (test runtime) | OpenJS Foundation | MIT | running tests and scripts | No |

The test harness is a zero-dependency assertion script (`tests/calendar.test.js`); nothing to install.

### Indirect dependencies

None. There are no transitive dependencies.

## Installation & Deployment

No installation. Clone and run:

```bash
git clone https://github.com/ntars/Xael.git
cd Xael
node tests/calendar.test.js   # 66 assertions verify the environment
```

Import as a library:

```javascript
const { solarToJdn } = require('./src/core/calendar/solar');
const { getBazi } = require('./src/core/bazi/bazi');
```

The multi-platform shells (WeChat mini program / PWA / uni-app) have reserved directories under `shells/` but development has not started.

## Quick Start

```javascript
// 1. Gregorian → Julian day number
const { solarToJdn } = require('./src/core/calendar/solar');
const jdn = solarToJdn(2026, 1, 1);   // 2461042

// 2. Gregorian → sexagenary year (turning at Lichun)
const { getGanzhiYear } = require('./src/core/calendar/ganzhi');
getGanzhiYear(2026, 2, 5);   // 丙午 (after Lichun on 2026-02-04)

// 3. BaZi chart
const { getBazi } = require('./src/core/bazi/bazi');
getBazi(2026, 1, 15, 10);

// 4. Daily almanac (do's and don'ts, clashes, day officer)
const { getDaily } = require('./src/core/huangli/daily');
getDaily(2026, 1, 15);
```

## API / Module Reference

The kernel exports pure functions as CommonJS modules, organised by the four calendar layers and the divination modules:

| Module | Entry | Exports (examples) | Description |
|---|---|---|---|
| calendar/solar | `src/core/calendar/solar.js` | `solarToJdn(y,m,d)` / `jdnToSolar(jdn)` | Gregorian↔Julian day number; the base of all conversions |
| calendar/ganzhi | `src/core/calendar/ganzhi.js` | `getGanzhiYear(y,m,d)` and siblings | Sexagenary year/month/day, with the year turning at Lichun |
| calendar/lunar2 | `src/core/calendar/lunar2.js` | lunar year/month/day and leap-month determination | Astronomical new-moon lunar calendar, no tables |
| calendar/jieqi2 | `src/core/calendar/jieqi2.js` | solar-term instants (minute precision) | Solving the apparent solar longitude at 15° multiples |
| calendar/festival | `src/core/calendar/festival.js` | statutory holiday / adjusted workday lookup | 2007–2026 announcement data |
| bazi | `src/core/bazi/bazi.js` | `getBazi(y,m,d,h)` | Four pillars, five-element strength, Nayin |
| ziwei | `src/core/ziwei/ziwei.js` | star placement and Four Transformations | Zhongzhou school conventions |
| huangli | `src/core/huangli/daily.js` | `getDaily(y,m,d)` | Daily do's and don'ts, clashes, duty deity, twelve day officers |
| common/constants | `src/core/common/constants.js` | stems/branches/hidden stems/elements/zodiac tables | Single source of truth, referenced by all other modules |

Every function is a side-effect-free pure function: Gregorian date-time in, structured result out; no I/O, no network requests.

## Configuration

The kernel has no configuration file — all conventions are declared as documentation in `docs/CALIBER-NOTES.md`. Changing a convention means changing code; the two are never allowed to separate. This is deliberate: the classic failure mode of divination software is "the docs say one thing, the code computes another".

## Directory Structure

```
Xael/
├── src/
│   ├── core/
│   │   ├── calendar/       # calendrical kernel
│   │   │   ├── solar.js        # Gregorian↔Julian day number
│   │   │   ├── astronomy.js    # celestial longitudes (Meeus series)
│   │   │   ├── lunar2.js       # astronomical new-moon lunar calendar & leap months
│   │   │   ├── jieqi2.js       # solar terms (to the minute)
│   │   │   ├── ganzhi.js       # sexagenary year/month/day
│   │   │   └── festival.js     # statutory holidays (2007–2026 announcements)
│   │   ├── bazi/           # BaZi charts
│   │   ├── ziwei/          # Zi Wei Dou Shu (Zhongzhou school)
│   │   ├── huangli/        # almanac (7 submodules)
│   │   ├── qimen/ liuren/ liuyao/ meihua/ fengshui/   # planned
│   │   └── common/constants.js  # stems/branches/hidden stems/elements/zodiac — single source
│   └── shells/             # mini program / PWA / uni-app shells (planned)
├── tests/
│   └── calendar.test.js    # 66 zero-dependency assertions
├── docs/
│   └── CALIBER-NOTES.md    # convention notes (school choices and rationale)
└── tools/                  # auxiliary tools (planned)
```

## Performance

Calendar computation is pure math: a full BaZi chart takes under 1 ms, lunar conversion under 5 ms, entirely offline with zero network requests.

## Security & Privacy

The kernel makes no network requests, touches no file system (holiday data is embedded in the source), and collects nothing. Birth data passes through pure functions — nothing is written to disk or uploaded.

## Compatibility

The runtime needs only ECMAScript 2015+ features; Node.js ≥ 14 and all modern browsers run it directly. No Node-specific APIs are used, so the same code can be reused in mini programs and browsers.

## Known Issues & Limitations

- The Qimen, Liuren, Liuyao, Meihua and Fengshui directories exist but contain no implementation;
- The platform shells (mini program / PWA / uni-app) have not started; the mini program and official account are the primary entry points for now;
- Holiday data covers State Council announcements through 2026; later years require a source update;
- The astronomical algorithms differ from the *Chinese Astronomical Almanac* at the seconds level — irrelevant for divination use, but unsuitable for direct astronomical observation.

## Roadmap

1. Complete Qimen Dunjia and Da Liu Ren (conventions already fixed, see CALIBER-NOTES);
2. Liu Yao, Meihua Yishu and Fengshui modules;
3. The first platform shell (PWA first — it shares the kernel's pure JavaScript);
4. Polish the content of `x.ntars.cn` and register it here.

## Contributing

Issues are welcome, both for challenging conventions (please cite literature) and for bug reports (please include a reproducible input and expected output). Keep two disciplines when contributing code: any convention change must update `docs/CALIBER-NOTES.md` in the same commit, and boundary calendrical behaviour must come with test assertions.

## Copyright & License

Copyright (c) 2026 星玖工作室 Ntarstudio

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**; the full text is in [LICENSE](./LICENSE). In short: you may freely use, modify and redistribute it, but derivatives must also be licensed under AGPL-3.0, and if you offer it as a network service you must provide the complete source code to the users of that service. The authoritative English legal text is the [LICENSE](./LICENSE) file; this section is a summary only.

## NOTICE

Third-party components and provenance:

| Component | Version | Copyright | License | URL | Purpose | Modified |
|---|---|---|---|---|---|---|
| None | — | — | — | — | zero third-party runtime dependencies | — |

Node.js (OpenJS Foundation, MIT) is used during development as an external runtime and is not distributed with this project. The theoretical provenance of the astronomical series algorithms is Jean Meeus, *Astronomical Algorithms* (2nd ed., Willmann-Bell, 1998) — algorithmic ideas are not copyrightable, and this project's implementation was written independently.

Any new third-party component must be registered in this table (name, version, copyright holder, license, URL, purpose, modified or not) before its code is merged.
