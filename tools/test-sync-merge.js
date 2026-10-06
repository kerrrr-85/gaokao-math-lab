/* 云同步合并引擎测试：node tools/test-sync-merge.js */
const M = require('../js/merge.js');
let n = 0;
function eq(a, b, msg) { n++; if (JSON.stringify(a) !== JSON.stringify(b)) { console.error('FAIL ' + msg + '\n  got ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); process.exit(1); } }
function ok(c, msg) { n++; if (!c) { console.error('FAIL ' + msg); process.exit(1); } }

const l = { version: 1, createdAt: 1000,
  attempts: [{ id: 'a1', createdAt: 100 }, { id: 'a2', createdAt: 300 }],
  reviews: { r1: { id: 'r1', lastReview: 100 }, r2: { id: 'r2', lastReview: 500 } },
  mastery: { n1: 40, n2: 10 },
  settings: { theme: 'dark', updatedAt: 100, sync: { url: 'LOCAL', mode: 'code' } } };
const r = { version: 1, createdAt: 2000,
  attempts: [{ id: 'a2', createdAt: 300 }, { id: 'a3', createdAt: 200 }],
  reviews: { r1: { id: 'r1', lastReview: 300 }, r3: { id: 'r3', lastReview: 50 } },
  mastery: { n1: 70 },
  settings: { theme: 'light', updatedAt: 900, sync: { url: 'REMOTE', mode: 'account' } } };

const m = M.merge(l, r);
eq(m.attempts.map(x => x.id), ['a2', 'a3', 'a1'], 'attempts 并集去重并按时间倒序');
eq(m.reviews.r1.lastReview, 300, 'reviews 取 lastReview 较新');
eq(m.reviews.r2.lastReview, 500, 'reviews 保留仅有的一侧');
eq(m.reviews.r3.lastReview, 50, 'reviews 合并远端新增');
eq(m.mastery, { n1: 70, n2: 10 }, 'mastery 逐节点取较大值');
eq(m.settings.theme, 'light', 'settings 按 updatedAt 取较新');
eq(m.settings.sync.url, 'LOCAL', 'settings.sync 必须保留本机配置（不被远端覆盖）');
eq(m.createdAt, 1000, 'createdAt 取较早');

eq(M.merge({ settings: { theme: 'dark' } }, { settings: { theme: 'light', updatedAt: 0 } }).settings.theme, 'dark', '远端无有效时间戳时保留本地');
eq(M.merge({}, {}).attempts, [], '空对象不报错');
const many = []; for (let i = 0; i < 2100; i++) many.push({ id: 'x' + i, createdAt: i });
eq(M.merge({ attempts: many }, {}).attempts.length, 2000, 'attempts 上限 2000');
eq(M.merge({ attempts: [{ questionId: 'q1', createdAt: 5 }] }, { attempts: [{ questionId: 'q1', createdAt: 5 }] }).attempts.length, 1, '无 id 时按 questionId+createdAt 去重');

console.log('merge tests passed (' + n + ' assertions)');
