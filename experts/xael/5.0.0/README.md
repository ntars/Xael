# 玄玖灵犀排盘专家包（5.0.0）

本目录是 Xael 的**专家包**形态：只放「专家的身份与工作方式」，不放任何算法。

- `agents/xael-charting-expert.md` —— 专家本体（frontmatter 含 name / description / color / emoji / vibe）。
- 需要调算法时，一律回到仓库根的同一份引擎与入口（`node bin/xael.js` 或 MCP 的 `xael_analyze`），
  **不复制 skill 与代码**：专家包若自带第二份 skill 或第二份算法，就会与主线脱节，这与项目「单一真源」铁律冲突。

安装方式（各宿主略有差异，通用做法）：

1. 把 `experts/xael/5.0.0/` 整个目录交给宿主的专家导入入口（或放进宿主的专家缓存目录）；
2. 确认宿主能读到仓库根，且 `node bin/xael.js version` 可执行；
3. 在会话里选用「玄玖灵犀排盘专家」，第一次提问前它会先确认支持范围与缺料。

许可：与主项目一致，AGPL-3.0。术数结论仅作传统文化学习与学术研究参考。
