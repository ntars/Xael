import { xingTarget, chongOf, isZiXing } from './src/core/liuren/tables.js';
console.log('未=7 xing→', xingTarget(7), '(应 戌=10)');
console.log('戌=10 xing→', xingTarget(10), '(应 未=7)');
console.log('未 自刑?', isZiXing(7));
