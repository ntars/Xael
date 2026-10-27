/**
 * src/shared/refs.js —— 参考文献的对外出口（单一真源在 settings.js）
 *
 * 大白话：书目只有一份，写在 settings.js 的 BOOKS 里（「参考文献」页、功能简介的
 * 「资料」字段都从那里取）。本文件只是把书目按组包一层，方便壳层直接读，
 * 不再另存一份书单——否则加一本书要改两处，早晚对不上。
 */

import { booksOf, refsPage, REF_COUNT } from './settings.js';

/** 全部书目（扁平：[{id, 书名, 作者}]） */
export const REFS = booksOf();

/** 参考文献页的说明文字（页脚用） */
export const REFS_NOTE = '以上文献均为公版古籍，本工具的演算口径以其通例为准；'
  + '演算结果由本地算法生成，内容仅供交流学习。';

/** 参考文献详情页条目（直接给「详情页」渲染） */
export { refsPage, REF_COUNT };
