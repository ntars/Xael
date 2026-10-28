import { yueJiangOf, JIANG_NAME } from './src/core/liuren/tables.js';
console.log(yueJiangOf(2021,9,23), JIANG_NAME[yueJiangOf(2021,9,23)]);
import { prevJieqi } from './src/core/calendar/jieqi2.js';
console.log(JSON.stringify(prevJieqi(2021,9,23)));
