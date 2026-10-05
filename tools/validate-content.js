const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
function load(rel, w) {
  const f = path.join(root, rel);
  if (!fs.existsSync(f)) return false;
  new Function('window', fs.readFileSync(f, 'utf8'))(w);
  return true;
}
const w = {};
load('js/data.js', w);
load('data/module-trig.js', w);
load('data/module-seq.js', w);
const D = w.DATA;
if (!D) { console.error('FAIL: window.DATA 未定义'); process.exit(1); }
const MODULES = ['函数与导数', '三角函数', '数列'];
const DIFFS = ['基础', '中档', '压轴'];
const TYPES = ['choice', 'fill', 'solution'];
const errs = [];
const ids = new Set();
function dup(o, kind) { if (ids.has(o.id)) errs.push('重复ID: ' + o.id); ids.add(o.id); if (!o.module) errs.push(kind + ' ' + o.id + ' 缺少 module'); else if (MODULES.indexOf(o.module) < 0) errs.push(kind + ' ' + o.id + ' module 非法: ' + o.module); }
(D.nodes || []).forEach(n => { dup(n, 'node'); if (DIFFS.indexOf(n.diff) < 0) errs.push('node ' + n.id + ' diff 非法'); });
(D.methods || []).forEach(m => { dup(m, 'method'); if (DIFFS.indexOf(m.diff) < 0) errs.push('method ' + m.id + ' diff 非法'); if (!m.node) errs.push('method ' + m.id + ' 缺 node'); else if (!(D.nodes || []).some(n => n.id === m.node)) errs.push('method ' + m.id + ' node 不存在: ' + m.node); });
(D.questions || []).forEach(q => {
  dup(q, 'question');
  if (DIFFS.indexOf(q.diff) < 0) errs.push('question ' + q.id + ' diff 非法');
  if (TYPES.indexOf(q.type) < 0) errs.push('question ' + q.id + ' type 非法');
  if (!q.node || !(D.nodes || []).some(n => n.id === q.node)) errs.push('question ' + q.id + ' node 不存在: ' + q.node);
  if (q.type === 'choice') { if (!q.options || q.options.length !== 4) errs.push('question ' + q.id + ' 选择题需 4 个选项'); if (!/^[ABCD]$/.test(q.answer || '')) errs.push('question ' + q.id + ' 选择题答案须为 A-D'); }
  if (q.type === 'fill' && !q.answer) errs.push('question ' + q.id + ' 填空题缺 answer');
});
(D.nodes || []).forEach(n => { if (!(D.methods || []).some(m => m.node === n.id)) errs.push('node ' + n.id + ' 没有任何方法卡'); });
const n = (D.nodes || []).length, m = (D.methods || []).length, q = (D.questions || []).length;
if (errs.length) { console.error('FAIL (' + errs.length + ')'); errs.slice(0, 15).forEach(e => console.error(' - ' + e)); process.exit(1); }
console.log('OK  nodes=' + n + ' methods=' + m + ' questions=' + q);
