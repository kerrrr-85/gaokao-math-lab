/* 原生 Canvas 点阵背景（复刻 ReactBits DotGrid）：指针附近点被推开+放大+染色 */
(function (global) {
  var cv = null, ctx = null, raf = null, w = 0, h = 0, dpr = 1, dots = [];
  var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  function isDark() { return document.body.classList.contains('dark'); }
  function build() {
    dots = [];
    var gap = (innerWidth < 700 ? 32 : 26) * dpr;
    var cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) dots.push({ x: i * gap, y: j * gap, ox: 0, oy: 0, s: 0 });
  }
  function resize() { if (!cv) return; dpr = Math.min(devicePixelRatio || 1, 1.6); w = cv.width = cv.clientWidth * dpr; h = cv.height = cv.clientHeight * dpr; build(); }
  function onMove(e) { mouse.tx = e.clientX * dpr; mouse.ty = e.clientY * dpr; }
  function onLeave() { mouse.tx = -9999; mouse.ty = -9999; }
  function tick() {
    if (!ctx) return;
    mouse.x += (mouse.tx - mouse.x) * 0.16; mouse.y += (mouse.ty - mouse.y) * 0.16;
    var dark = isDark();
    var base = dark ? [51, 65, 85] : [203, 213, 225];
    var hot = dark ? [45, 212, 191] : [15, 118, 110];
    var INFL = (innerWidth < 700 ? 96 : 128) * dpr;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var dx = d.x - mouse.x, dy = d.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var t = Math.max(0, 1 - dist / INFL);
      var e = t * t * (3 - 2 * t);
      var ang = Math.atan2(dy, dx), push = e * 20 * dpr;
      d.ox += (Math.cos(ang) * push - d.ox) * 0.14;
      d.oy += (Math.sin(ang) * push - d.oy) * 0.14;
      d.s += (e - d.s) * 0.14;
      var r = (1.5 + d.s * 2.2) * dpr;
      var col = 'rgba(' + Math.round(base[0] + (hot[0] - base[0]) * d.s) + ',' + Math.round(base[1] + (hot[1] - base[1]) * d.s) + ',' + Math.round(base[2] + (hot[2] - base[2]) * d.s) + ',' + (0.35 + d.s * 0.6).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, r, 0, 6.2832); ctx.fillStyle = col; ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }
  function mount(canvas) {
    stop(); cv = canvas; if (!cv) return; ctx = cv.getContext('2d'); resize();
    addEventListener('resize', resize); addEventListener('pointermove', onMove); addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } removeEventListener('resize', resize); removeEventListener('pointermove', onMove); removeEventListener('pointerleave', onLeave); }
  global.DotGrid = { mount: mount, stop: stop };
})(window);
