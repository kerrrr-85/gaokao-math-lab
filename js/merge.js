/* 云同步 · 纯函数合并引擎（Node 与浏览器通用） */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Merge = api;
})(typeof window !== 'undefined' ? window : this, function () {
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function attemptKey(a) {
    if (a && a.id != null && a.id !== '') return 'id:' + a.id;
    return 'q:' + ((a && a.questionId) || '') + '|' + ((a && a.createdAt) || 0);
  }
  function cardTime(c) { return num(c && (c.lastReview || c.due)); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function merge(local, remote) {
    var l = local || {}, r = remote || {};

    /* attempts：并集去重（追加型数据永不丢），按时间倒序，上限 2000 */
    var src = [].concat(l.attempts || [], r.attempts || []), seen = {}, att = [];
    for (var i = 0; i < src.length; i++) {
      var k = attemptKey(src[i]);
      if (seen[k]) continue;
      seen[k] = 1; att.push(src[i]);
    }
    att.sort(function (a, b) { return num(b && b.createdAt) - num(a && a.createdAt); });
    att = att.slice(0, 2000);

    /* reviews：逐卡取 lastReview 较新的一侧 */
    var rev = {}, lr = l.reviews || {}, rr = r.reviews || {}, kk;
    for (kk in lr) if (own(lr, kk)) rev[kk] = lr[kk];
    for (kk in rr) if (own(rr, kk)) {
      var c0 = rev[kk], c1 = rr[kk];
      if (!c0 || cardTime(c1) > cardTime(c0)) rev[kk] = c1;
    }

    /* mastery：逐节点取较大值 */
    var mas = {}, keys = {}, lm = l.mastery || {}, rm = r.mastery || {};
    for (kk in lm) if (own(lm, kk)) keys[kk] = 1;
    for (kk in rm) if (own(rm, kk)) keys[kk] = 1;
    Object.keys(keys).forEach(function (k2) { mas[k2] = Math.max(num(lm[k2]), num(rm[k2])); });

    /* settings：按 updatedAt 取较新；本机 sync 配置永远保留本地 */
    var lu = num(l.settings && l.settings.updatedAt), ru = num(r.settings && r.settings.updatedAt);
    var st = (ru > lu && r.settings) ? r.settings : (l.settings || r.settings || {});
    if (l.settings && l.settings.sync) {
      var copy = {}; for (var s in st) if (own(st, s)) copy[s] = st[s];
      copy.sync = l.settings.sync; st = copy;
    }

    var cas = [l.createdAt, r.createdAt].filter(function (v) { return typeof v === 'number' && v > 0; });
    return {
      version: l.version || r.version || 1,
      createdAt: cas.length ? Math.min.apply(null, cas) : Date.now(),
      reviews: rev, attempts: att, mastery: mas, settings: st
    };
  }
  return { merge: merge, attemptKey: attemptKey, cardTime: cardTime };
});
