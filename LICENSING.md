# 分层许可说明

> 本文件是人类可读的分层路由表。`LICENSE` 是 Apache-2.0 全文，`LICENSE-MIT` 是 MIT 全文。
> GitHub 只按 `LICENSE` 识别仓库主许可，因此显示为 Apache-2.0；MIT 覆盖的部分见下表。

本仓库按目录分层授权，只使用两种宽松许可证：**Apache License 2.0** 与 **MIT**。
许可全文见 [`LICENSE`](./LICENSE)（Apache-2.0）与 [`LICENSE-MIT`](./LICENSE-MIT)（MIT）。

Copyright (c) 2024-2026 星玖工作室 Ntarstudio

---

## 一、分层映射

| 路径 | 许可 | 说明 |
|---|---|---|
| `src/core/` | **Apache-2.0** | 演算内核：历法、四柱、紫微、奇门、六壬、六爻、梅花、玄空、黄历 |
| `src/shared/` | **Apache-2.0** | 跨端共享层：设置、存储、导出、守卫 |
| `mcp/` | **Apache-2.0** | MCP 服务端，供外部工具接入 |
| `experts/` | **Apache-2.0** | 专家包定义 |
| `src/shells/` | **MIT** | 三端外壳：PWA / 微信小程序 / uni-app |
| `bin/` | **MIT** | 命令行入口 |
| `tools/` `tests/` | **MIT** | 构建脚本与测试 |
| `refs-texts/` `material/` | **保留所有权利** | 古籍原文属公有领域；校勘、标点、数字化成果归 Ntarstudio |
| 品牌名称、Logo、界面设计 | **保留所有权利** | 不随代码许可授予 |

> 根目录的 `core/` `shared/` `index.html` `static/` `dist/` 是 `tools/build-web.js`
> 生成的构建产物，不入库（见 `.gitignore`），许可随其源文件。

## 二、Apache-2.0 的两条额外义务

选 Apache-2.0（而非纯 MIT）覆盖内核，是因为它多给两样东西：

1. **明示专利授权**（第 3 条）：贡献者授予你使用其专利的许可。算法类项目最怕专利地雷，这一条把它拆掉。
2. **NOTICE 保留义务**（第 4 条 d 项）：再分发时须保留 [`NOTICE`](./NOTICE) 中的归属声明。

除此之外，Apache-2.0 与 MIT 一样宽松：可商用、可闭源、可修改、可再许可，**没有传染性**。

## 三、商标

「星玖工作室」「Ntarstudio」「玄玖灵犀」「Xael」等名称、Logo 与界面设计归星玖工作室所有。
Apache-2.0 与 MIT 只授予**代码**权利，不授予商标权，也不授予「暗示获得原作者背书」的权利。
修改版请更换品牌标识，或明确标注为非官方版本。

## 四、第三方组件

详见 [`NOTICE`](./NOTICE)。本项目运行时零第三方依赖，仅依赖 ECMAScript 2015+ 标准。
