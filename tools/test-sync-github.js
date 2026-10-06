/* e2e: 生成 -> 上传 -> 清空 -> 恢复 -> 合并 -> 清理 */
global.window = global;
global.localStorage = { _m:{}, getItem(k){return this._m[k]||null}, setItem(k,v){this._m[k]=String(v)}, removeItem(k){delete this._m[k]} };
const state = { version:1, createdAt:111, reviews:{r1:{id:'r1',lastReview:5}}, attempts:[{id:'a1',createdAt:9}], mastery:{n1:33}, settings:{theme:'dark',updatedAt:1,sync:{}} };
window.Store = { get:()=>state, save:()=>{}, applyMerged:(m)=>{Object.keys(m).forEach(k=>state[k]=m[k])} };
window.Merge = require('../js/merge.js');
window.SyncCrypto = require('../js/sync-crypto.js');
require('../js/sync.js');
const Sync = window.Sync, Crypto = window.SyncCrypto;
state.settings.sync = { token: process.env.GML_TOKEN, repo: process.env.GML_REPO, branch:'main', mode:'code' };
(async function () {
  const meta = await Sync.test();
  console.log('[1] repo=' + meta.repo + ' private=' + meta.private + ' canPush=' + meta.canPush);
  const code = await Sync.createCode();
  const hash = await Crypto.hashCode(code);
  console.log('[2] created code=' + code.slice(0,4) + '..' + code.slice(-4) + ' hash=' + hash.slice(0,10));
  const env0 = await Sync.readFile(hash);
  const hasPlain = /33|dark|a1/.test(JSON.stringify(env0.json));
  console.log('[3] cloud file size=' + JSON.stringify(env0.json).length + ' plaintext_leak=' + hasPlain);
  const keepSync = state.settings.sync;
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, { version:1, createdAt:222, reviews:{}, attempts:[], mastery:{}, settings:{ sync: keepSync } });
  const r = await Sync.restore(code);
  console.log('[4] restored attempts=' + state.attempts.length + ' reviews=' + Object.keys(state.reviews).length + ' mastery=' + state.mastery.n1 + ' theme=' + state.settings.theme + ' added=' + r.added);
  const ok = state.attempts.length===1 && Object.keys(state.reviews).length===1 && state.mastery.n1===33 && state.settings.theme==='dark';
  if (!ok) { console.log('FAIL data mismatch'); process.exit(2); }
  try { await Sync.deleteFile(hash); } catch (e) { console.log('[5] delete threw: ' + e.message); }
  const gone = await Sync.readFile(hash);
  console.log('[5] cleanup=' + (gone === null ? 'deleted' : 'STILL THERE'));
  console.log('RESULT PASS');
})().catch(e => { console.log('ERROR ' + e.message); process.exit(1); });
