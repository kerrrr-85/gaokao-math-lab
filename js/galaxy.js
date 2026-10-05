/* 原生 Canvas 星系背景 v2：更浓、明显旋转、星云+尘埃+脉冲（零依赖） */
(function (global) {
  var raf = null, cv = null, ctx = null, stars = [], dust = [], nebs = [], sprite = null;
  var w = 0, h = 0, mx = 0, my = 0, DPR = 1;

  function onMove(e) { mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5); }
  function resize() { if (!cv) return; DPR = Math.min(devicePixelRatio || 1, 1.5); w = cv.width = cv.clientWidth * DPR; h = cv.height = cv.clientHeight * DPR; }

  function makeSprite() {
    sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
    var c = sprite.getContext('2d');
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(200,215,255,1)'); g.addColorStop(0.35, 'rgba(150,175,255,0.45)'); g.addColorStop(1, 'rgba(120,140,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(32, 32, 32, 0, 6.2832); c.fill();
  }

  function make() {
    stars = []; dust = []; nebs = [];
    var arms = 3;
    for (var i = 0; i < 1600; i++) {
      var r = Math.pow(Math.random(), 0.58);
      var arm = Math.floor(Math.random() * arms);
      var ang = arm * (Math.PI * 2 / arms) + r * 2.9 + (Math.random() - 0.5) * 0.75;
      stars.push({ r: r, ang: ang, s: (Math.random() * 1.7 + 0.3) * DPR, tw: Math.random() * 6.283, sp: 0.14 + Math.random() * 0.42, big: Math.random() < 0.055 });
    }
    for (var j = 0; j < 140; j++) {
      dust.push({ r: Math.pow(Math.random(), 0.5), ang: Math.random() * 6.283, sz: (18 + Math.random() * 46) * DPR, a: 0.05 + Math.random() * 0.10, sp: 0.04 + Math.random() * 0.12 });
    }
    nebs = [
      { c: 'rgba(126,92,255,', x: 0.50, y: 0.50, r: 0.80, sp: 0.05 },
      { c: 'rgba(72,178,255,', x: 0.63, y: 0.40, r: 0.55, sp: -0.08 },
      { c: 'rgba(255,96,200,', x: 0.40, y: 0.62, r: 0.50, sp: 0.11 }
    ];
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    removeEventListener('resize', resize); removeEventListener('pointermove', onMove);
  }

  function mount(canvas) {
    stop(); cv = canvas; if (!cv) return;
    ctx = cv.getContext('2d'); resize(); make(); if (!sprite) makeSprite();
    if (innerWidth < 700 && stars.length > 900) { stars = stars.slice(0, 900); dust = dust.slice(0, 70); }
    addEventListener('resize', resize); addEventListener('pointermove', onMove);
    var t = 0;
    function frame() {
      t += 0.0065;
      var pulse = 1 + 0.06 * Math.sin(t * 0.45);
      var cx = w / 2 + mx * w * 0.09, cy = h / 2 + my * h * 0.09, R = Math.min(w, h) * 0.62 * pulse;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04050c'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var n = 0; n < nebs.length; n++) {
        var nb = nebs[n];
        var nr = R * nb.r;
        var nx = cx + Math.cos(t * nb.sp + n * 2.1) * R * nb.r * 0.55;
        var ny = cy + Math.sin(t * nb.sp * 1.3 + n * 1.7) * R * nb.r * 0.34;
        var g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, nb.c + '0.34)');
        g.addColorStop(0.45, nb.c + '0.12)');
        g.addColorStop(1, nb.c + '0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }

      for (var d = 0; d < dust.length; d++) {
        var du = dust[d], da = du.ang + t * du.sp, dr = du.r * R;
        var dx = cx + Math.cos(da) * dr, dy = cy + Math.sin(da) * dr * 0.58;
        ctx.globalAlpha = du.a;
        ctx.drawImage(sprite, dx - du.sz / 2, dy - du.sz / 2, du.sz, du.sz);
      }
      ctx.globalAlpha = 1;

      for (var i = 0; i < stars.length; i++) {
        var st = stars[i], a = st.ang + t * st.sp, rr = st.r * R;
        var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.58;
        var tw = 0.5 + 0.5 * Math.sin(st.tw + t * 2.2);
        var alpha = (1 - st.r) * 0.85 * tw + 0.14;
        if (st.big) {
          var bs = st.s * 5;
          ctx.globalAlpha = Math.min(0.75, alpha);
          ctx.drawImage(sprite, x - bs / 2, y - bs / 2, bs, bs);
          ctx.globalAlpha = 1;
        }
        ctx.beginPath(); ctx.arc(x, y, st.s, 0, 6.2832);
        ctx.fillStyle = 'rgba(222,232,255,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    frame();
  }

  global.Galaxy = { mount: mount, stop: stop };
})(window);
