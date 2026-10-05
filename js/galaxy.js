/* 原生 Canvas 星系背景（复刻 ReactBits Galaxy 的观感，零依赖） */
(function (global) {
  var raf = null, cv = null, ctx = null, stars = [], w = 0, h = 0, mx = 0, my = 0;
  function onMove(e) { mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5); }
  function resize() { if (!cv) return; w = cv.width = cv.clientWidth * (devicePixelRatio || 1); h = cv.height = cv.clientHeight * (devicePixelRatio || 1); }
  function makeStars() {
    stars = [];
    var arms = 3;
    for (var i = 0; i < 700; i++) {
      var r = Math.pow(Math.random(), 0.62);
      var arm = Math.floor(Math.random() * arms);
      var ang = arm * (Math.PI * 2 / arms) + r * 2.7 + (Math.random() - 0.5) * 0.55;
      stars.push({ r: r, ang: ang, s: Math.random() * 1.5 + 0.25, tw: Math.random() * 6.283, sp: 0.2 + Math.random() * 0.5 });
    }
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    removeEventListener('resize', resize); removeEventListener('pointermove', onMove);
  }
  function mount(canvas) {
    stop(); cv = canvas; if (!cv) return;
    ctx = cv.getContext('2d'); resize(); makeStars();
    addEventListener('resize', resize); addEventListener('pointermove', onMove);
    var t = 0;
    function frame() {
      t += 0.008;
      var cx = w / 2 + mx * w * 0.07, cy = h / 2 + my * h * 0.07;
      var R = Math.min(w, h) * 0.62;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, 'rgba(130,100,255,.38)');
      g.addColorStop(0.35, 'rgba(60,40,170,.16)');
      g.addColorStop(1, 'rgba(5,7,15,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var a = st.ang + t * st.sp * 0.06;
        var rr = st.r * R;
        var x = cx + Math.cos(a) * rr;
        var y = cy + Math.sin(a) * rr * 0.58;
        var tw = 0.55 + 0.45 * Math.sin(st.tw + t * 2.4);
        var alpha = (1 - st.r) * 0.85 * tw + 0.12;
        ctx.beginPath(); ctx.arc(x, y, st.s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(215,225,255,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    frame();
  }
  global.Galaxy = { mount: mount, stop: stop };
})(window);
