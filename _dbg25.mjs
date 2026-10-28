import { prevJieqi } from './src/core/calendar/jieqi2.js';
import { YUEJIANG, yueJiangOf } from './src/core/liuren/tables.js';
const cur = prevJieqi(2021,9,23);
console.log('cur.名=', JSON.stringify(cur.名), 'in?', cur.名 in YUEJIANG, 'YUEJIANG[名]=', YUEJIANG[cur.名]);
console.log('yueJiangOf=', yueJiangOf(2021,9,23));
