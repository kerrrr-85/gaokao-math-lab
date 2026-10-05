/* anime.js 适配层：兼容 v4（anime.animate）与 v3（anime()）两种全局形态 */
(function (global) {
  function A() { return global.anime; }
  function animate(targets, opts) {
    var a = A(); if (!a) return null;
    if (typeof a === 'function') return a(Object.assign({ targets: targets }, opts));
    if (typeof a.animate === 'function') return a.animate(targets, opts);
    if (a.default && typeof a.default.animate === 'function') return a.default.animate(targets, opts);
    return null;
  }
  function stagger(v) {
    var a = A(); if (!a) return v;
    var s = a.stagger || (a.default && a.default.stagger);
    return typeof s === 'function' ? s(v) : v;
  }
  function enter(selector, gap) {
    return animate(selector, { opacity: [0, 1], y: [18, 0], scale: [0.92, 1], duration: 620, delay: stagger(gap || 55), ease: 'outExpo' });
  }
  function fadeIn(selector, delay) {
    return animate(selector, { opacity: [0, 1], y: [10, 0], duration: 460, delay: delay || 0, ease: 'outQuad' });
  }
  function pageIn() {
    return animate('#view > *', { opacity: [0, 1], y: [14, 0], duration: 440, delay: stagger(45), ease: 'outQuad' });
  }
  global.Anim = { ok: function () { return !!A(); }, animate: animate, stagger: stagger, enter: enter, fadeIn: fadeIn, pageIn: pageIn };
})(window);
