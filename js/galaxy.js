/* 原生 Canvas 星空 v3：远近星层 · 银河薄雾 · 缓慢视差 · 少量流星 */
(function (global) {
  'use strict';

  var raf = null, cv = null, ctx = null, sprite = null;
  var stars = [], haze = [], shooters = [], w = 0, h = 0;
  var mx = 0, my = 0, tx = 0, ty = 0, last = 0, t = 0;
  var DPR = 1, low = false, visCb = null;

  function onMove(e) {
    tx = (e.clientX / innerWidth - 0.5);
    ty = (e.clientY / innerHeight - 0.5);
  }

  function resize() {
    if (!cv) return;
    DPR = Math.min(devicePixelRatio || 1, low ? 1 : 1.5);
    w = cv.width = Math.max(1, cv.clientWidth * DPR);
    h = cv.height = Math.max(1, cv.clientHeight * DPR);
  }

  function makeSprite() {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    var c = sprite.getContext('2d');
    var g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.13, 'rgba(220,233,255,.94)');
    g.addColorStop(0.38, 'rgba(154,190,255,.42)');
    g.addColorStop(0.72, 'rgba(111,153,230,.10)');
    g.addColorStop(1, 'rgba(90,130,210,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(48, 48, 48, 0, Math.PI * 2);
    c.fill();
  }

  function make() {
    stars = [];
    haze = [];
    shooters = [];
    var area = Math.max(320000, innerWidth * innerHeight);
    var count = low ? 290 : Math.min(1700, Math.round(area / 1050));
    for (var i = 0; i < count; i++) {
      var depth = 0.16 + Math.random() * 0.84;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        depth: depth,
        size: (0.38 + Math.random() * 1.35) * DPR * (0.55 + depth * 0.7),
        phase: Math.random() * Math.PI * 2,
        speed: 0.55 + Math.random() * 1.55,
        color: Math.random() < 0.12 ? [183, 214, 255] : (Math.random() < 0.08 ? [255, 224, 178] : [231, 239, 255]),
        big: Math.random() < (low ? 0.015 : 0.045)
      });
    }
    var hz = low ? 2 : 4;
    var colors = [
      { c: '90,138,210', a: 0.085, x: .20, y: .30, r: .72 },
      { c: '50,161,178', a: 0.065, x: .78, y: .28, r: .64 },
      { c: '164,126,214', a: 0.052, x: .62, y: .74, r: .70 },
      { c: '218,183,126', a: 0.035, x: .45, y: .54, r: .52 }
    ];
    for (var j = 0; j < hz; j++) {
      var c = colors[j];
      haze.push({ c: c.c, a: c.a, x: c.x, y: c.y, r: c.r, ph: Math.random() * Math.PI * 2 });
    }
  }

  function spawnShooter() {
    if (low || shooters.length > 1) return;
    var angle = Math.PI * (0.17 + Math.random() * 0.08);
    var speed = 260 + Math.random() * 240;
    shooters.push({
      x: w * (0.06 + Math.random() * 0.56),
      y: h * (0.05 + Math.random() * 0.22),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 1.25 + Math.random() * 0.55,
      len: 70 + Math.random() * 90,
      alpha: 0.45 + Math.random() * 0.25
    });
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    if (visCb) { document.removeEventListener('visibilitychange', visCb); visCb = null; }
  }

  function drawHaze() {
    for (var i = 0; i < haze.length; i++) {
      var q = haze[i];
      var drift = Math.sin(t * 0.025 + q.ph) * w * 0.018;
      var x = q.x * w + drift + mx * w * 0.018;
      var y = q.y * h + Math.cos(t * 0.022 + q.ph) * h * 0.012 + my * h * 0.018;
      var r = Math.max(w, h) * q.r;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + q.c + ',' + q.a + ')');
      g.addColorStop(0.48, 'rgba(' + q.c + ',' + (q.a * 0.42) + ')');
      g.addColorStop(1, 'rgba(' + q.c + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawStars() {
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var x = st.x * w + mx * w * 0.026 * st.depth;
      var y = st.y * h + my * h * 0.020 * st.depth;
      var tw = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
      var alpha = (0.20 + tw * 0.64) * (0.45 + st.depth * 0.55);
      if (st.big) {
        var bs = st.size * (8 + tw * 4);
        ctx.globalAlpha = alpha * 0.72;
        ctx.drawImage(sprite, x - bs / 2, y - bs / 2, bs, bs);
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(x, y, st.size * (st.big ? 1.25 : 1), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + st.color[0] + ',' + st.color[1] + ',' + st.color[2] + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
  }

  function drawShooters(dt) {
    for (var i = shooters.length - 1; i >= 0; i--) {
      var s = shooters[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life += dt;
      var fade = Math.max(0, 1 - s.life / s.max);
      var a = s.alpha * fade;
      var angle = Math.atan2(s.vy, s.vx);
      var tailX = s.x - Math.cos(angle) * s.len;
      var tailY = s.y - Math.sin(angle) * s.len;
      var g = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      g.addColorStop(0, 'rgba(180,215,255,0)');
      g.addColorStop(0.72, 'rgba(194,224,255,' + (a * 0.56).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,' + a.toFixed(3) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2 * DPR;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.globalAlpha = a * 0.8;
      ctx.drawImage(sprite, s.x - 10 * DPR, s.y - 10 * DPR, 20 * DPR, 20 * DPR);
      ctx.globalAlpha = 1;
      if (s.life >= s.max || s.x > w + 120 || s.y > h + 120) shooters.splice(i, 1);
    }
  }

  function frame(now) {
    if (!cv || !ctx) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    t += dt;
    mx += (tx - mx) * 0.035;
    my += (ty - my) * 0.035;

    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#03050d');
    bg.addColorStop(0.55, '#060a18');
    bg.addColorStop(1, '#0a1021');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    drawHaze();
    drawStars();
    if (!low && Math.random() < 0.00035) spawnShooter();
    drawShooters(dt);
    ctx.globalCompositeOperation = 'source-over';

    var vignette = ctx.createRadialGradient(w * .5, h * .48, Math.min(w, h) * .16, w * .5, h * .48, Math.max(w, h) * .78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.72, 'rgba(0,0,0,.13)');
    vignette.addColorStop(1, 'rgba(0,0,0,.46)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function mount(canvas) {
    stop();
    cv = canvas;
    if (!cv) return;
    low = !!(global.PERF && global.PERF.low);
    ctx = cv.getContext('2d');
    resize();
    make();
    if (!sprite) makeSprite();
    addEventListener('resize', resize);
    addEventListener('pointermove', onMove);
    visCb = function () {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', visCb);
    if (!low) setTimeout(function () { if (cv) spawnShooter(); }, 1600);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  global.Galaxy = { mount: mount, stop: stop };
})(window);