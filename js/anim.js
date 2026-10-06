/* anime.js adapter: PERF + anime.js v4/v3 */
(function (global) {
  /* v49 device tier: phones/low-end default to no heavy animation */
  var PERF = (function () {
    var ua = navigator.userAgent || '';
    var mobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|Windows Phone/i.test(ua);
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var narrow = Math.min(screen.width || 9999, screen.height || 9999) <= 820;
    var low = mobile || narrow || cores <= 4 || mem <= 4;
    var q = String(location.search || '');
    if (q.indexOf('perf=high') >= 0) low = false;
    if (q.indexOf('perf=low') >= 0) low = true;
    try { if (document.body) document.body.classList.add(low ? 'perf-low' : 'perf-high'); } catch (e) {}
    return { mobile: mobile, cores: cores, narrow: narrow, low: low };
  })();
  global.PERF = PERF;

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
    if (PERF.low) return null;
    var lo = PERF.low;
    return animate(selector, { opacity: [0, 1], y: [lo ? 10 : 18, 0], scale: lo ? [1, 1] : [0.92, 1], duration: lo ? 340 : 620, delay: stagger(lo ? 18 : (gap || 55)), ease: lo ? 'outQuart' : 'outExpo' });
  }
  function fadeIn(selector, delay) {
    if (PERF.low) return null;
    var lo = PERF.low;
    return animate(selector, { opacity: [0, 1], y: [lo ? 6 : 10, 0], duration: lo ? 260 : 460, delay: delay || 0, ease: 'outQuart' });
  }
  function pageIn() {
    if (PERF.low) return null;
    var lo = PERF.low;
    return animate('#view > *', { opacity: [0, 1], y: [lo ? 8 : 14, 0], duration: lo ? 300 : 440, delay: stagger(lo ? 22 : 45), ease: 'outQuart' });
  }
  global.Anim = { ok: function () { return !!A(); }, animate: animate, stagger: stagger, enter: enter, fadeIn: fadeIn, pageIn: pageIn };
})(window);
