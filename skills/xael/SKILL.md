---
name: xael
display_name_zh: 玄玖灵犀排盘
display_name_en: Xael Charting
description: >
  调用玄玖灵犀 Xael 本地引擎做传统术数排盘（八字 / 紫微 / 六爻 / 奇门 / 大六壬 / 梅花 / 飞星 / 黄历等 22 项）。
  当用户要求排盘、算八字、查黄历宜忌、起卦、排奇门局，且需要可核对的计算结果时使用。
  全部计算在本机完成，不联网、不登录、不上传输入。
description_en: >
  Run traditional Chinese Shushu charting (BaZi, Zi Wei, Liu Yao, Qimen, Da Liu Ren, Meihua, flying stars, almanac and 22 items in total)
  with the local Xael engine. Use when the user asks to cast a chart, read an almanac, or divine an event and needs verifiable computed output.
  All computation happens locally: no network, no login, no upload of user input.
---

# 玄玖灵犀 Xael 排盘

## 什么时候用

用户提出下列任一诉求，且希望拿到**算出来的盘**（而不是听解释、听建议）时：

- 排八字、看四柱/藏干/十神/旺衰/用神/大运流年
- 排紫微斗数、看十二宫与四化
- 起六爻、看本卦变卦与断语；看六爻旺衰
- 排奇门（时家/日家/刻家/宝鉴日奇/年月家/飞盘）、解奇门格局
- 排大六壬、解毕法赋
- 排梅花易数
- 飞星、命卦（八宅）
- 查黄历宜忌、查农历干支

不需要用的场合：纯粹问术数概念、要人生建议、要医疗/法律/投资结论（后者本引擎不产出）。

## 怎么调

**已装 MCP 时优先用工具**（最省事，不用管路径）：调 `xael_analyze`，参数 `query`、可选 `format: json|text`；
不确定支持哪些功能就先调 `xael_list_features`，看不清字段就先调 `xael_schema`。

**没有 MCP 时走命令行**（Node ≥ 18，零依赖）。若 `xael` 已在 PATH（`npm link` 或本地安装脚本会放一个启动器）：

```bash
xael ask "白玖玖，女，2005年6月9日子时 八字"      # 默认 JSON
xael ask "今日宜忌" --text                       # 与界面逐字一致的纯文本
xael list                                        # 22 项清单：key/名/短名/触发词
xael schema                                      # 返回字段契约
```

若 `xael` 不在 PATH，就在**仓库根**执行同样参数：

```bash
node bin/xael.js ask "白玖玖，女，2005年6月9日子时 八字"
node bin/xael.js ask "今日宜忌" --text
node bin/xael.js list
node bin/xael.js schema
```

> 不知道仓库在哪时，先 `ls ~/Documents/Github/Xael/bin/xael.js`；本项目只在本机运行，没有远端服务可调。

## 输入怎么写

一句大白话即可，引擎自己解析。四种生辰写法都认：

```
白玖玖，女，2005年6月9日子时            → 全套排盘（多块并列）
白玖玖 农历2005年五月初四 子时 女 八字   → 单块八字
1990年8月15日14时 奇门                  → 单块奇门
今日宜忌                                → 黄历
```

## 返回怎么读

`status` 七个取值：

| status | 含义 | 该怎么办 |
| --- | --- | --- |
| `ok` | 正常出结果 | 直接引用 `text`，需要结构化时读 `sections` |
| `need_birth` | 命中了功能块但连出生信息都没有 | 按 `text` 里那句话向用户索要，别自己编生辰 |
| `invalid_lunar` | 农历日期不存在 | 提示用户核对闰月与日期 |
| `invalid_pillar` | 四柱查不到日期 | 提示用户核对干支 |
| `invalid_solar` | 公历日期不合法 | 提示用户核对 |
| `refused` | 超出玄学与传统文化范围 | 说明本引擎只做术数，不作答 |
| `rejected` | 其它拦截（保留值） | 原样转达 `text` |

`sections` 仅在多命中并列时有值（每节 `{title, text}`），单块查询为 `null`。

## 硬约束

1. **不要改结果**：`text` 是引擎的权威输出，转述可以，删改术语、合并流派结论、把「缺口」抹平都不行。
2. **不要补算**：引擎说「单源待验」「流派并列」的地方，照原样保留；不要替它下结论。
3. **缺料先问**：`need_birth` 时向用户要，不许拿「今天」或猜测的生日顶替。
4. **边界如实说**：结论仅作传统文化学习与学术研究参考，不产出医疗、法律、投资建议。
5. **隐私**：排盘全在用户本机完成，脚本不联网；转述时不要把用户生辰写进任何外发内容。
