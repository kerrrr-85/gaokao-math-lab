/* 云同步密码学测试：node tools/test-sync-crypto.js */
if (!global.crypto) global.crypto = require('crypto').webcrypto;
const C = require('../js/sync-crypto.js');
let n = 0;
function ok(c, msg) { n++; if (!c) { console.error('FAIL ' + msg); process.exit(1); } }
(async () => {
  const code = C.newCode();
  ok(/^[0-9A-HJ-NP-TV-Z]{20}$/.test(code), '功能码格式：20 位 Crockford Base32，无易混字符 → ' + code);
  const code2 = C.newCode();
  ok(code !== code2, '两次生成不重复');

  const obj = { reviews: { a: { lastReview: 1 } }, attempts: [{ id: 'x', createdAt: 2 }], mastery: { n: 3 }, settings: { theme: 'dark' } };
  const env = await C.encrypt(obj, code);
  ok(env && env.v === 1 && typeof env.salt === 'string' && typeof env.iv === 'string' && typeof env.data === 'string', '信封结构 {v,salt,iv,data}');
  ok(JSON.stringify(env).indexOf('reviews') < 0, '密文里不含明文');
  const back = await C.decrypt(env, code);
  ok(JSON.stringify(back) === JSON.stringify(obj), '同码解密可还原');

  let bad = '';
  try { await C.decrypt(env, C.newCode()); } catch (e) { bad = e.message; }
  ok(bad === 'BAD_CODE', '错误同步码必须抛 BAD_CODE（实际 ' + bad + '）');

  const h1 = await C.hashCode(code), h2 = await C.hashCode(code);
  ok(h1 === h2 && h1.length === 64 && /^[0-9a-f]{64}$/.test(h1), 'code_hash 稳定且为 sha256 hex');
  ok((await C.hashCode(code2)) !== h1, '不同码 hash 不同');

  const env2 = await C.encrypt(obj, code);
  ok(env2.iv !== env.iv || env2.salt !== env.salt, '每次加密使用新 salt/iv');

  console.log('crypto tests passed (' + n + ' assertions)');
})().catch(function (e) { console.error('ERROR', e && e.message); process.exit(1); });
