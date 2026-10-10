/* 原生 Canvas 星空 v4：星河主带 · 远近星层 · 缓慢视差 · 定时流星 */
(function (global) {
  'use strict';

  var raf = null, cv = null, ctx = null, sprite = null, bandCanvas = null;
  var stars = [], haze = [], band = [], shooters = [], w = 0, h = 0;
  var mx = 0, my = 0, tx = 0, ty = 0, last = 0, t = 0, nextShot = 0.75;
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
    if (bandCanvas) buildBand();
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

  function bandPoint(p, spread) {
    return {
      x: p * 1.10 - 0.05 + (Math.random() - 0.5) * spread,
      y: 0.12 + p * 0.74 + Math.sin(p * Math.PI * 2.25) * 0.035 + (Math.random() - 0.5) * spread * 1.35
    };
  }

  function make() {
    stars = [];
    haze = [];
    band = [];
    shooters = [];
    var area = Math.max(320000, innerWidth * innerHeight);
    var count = low ? 300 : Math.min(1700, Math.round(area / 1050));
    for (var i = 0; i < count; i++) {
      var river = Math.random() < 0.58;
      var p = Math.random();
      var bp = bandPoint(p, river ? 0.11 : 0.95);
      var x = river ? bp.x : Math.random();
      var y = river ? bp.y : Math.random();
      var depth = 0.16 + Math.random() * 0.84;
      stars.push({
        x: x,
        y: y,
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
      { c: '90,138,210', a: 0.080, x: .20, y: .30, r: .72 },
      { c: '50,161,178', a: 0.060, x: .78, y: .28, r: .64 },
      { c: '164,126,214', a: 0.045, x: .62, y: .74, r: .70 },
      { c: '218,183,126', a: 0.028, x: .45, y: .54, r: .52 }
    ];
    for (var j = 0; j < hz; j++) {
      var q = colors[j];
      haze.push({ c: q.c, a: q.a, x: q.x, y: q.y, r: q.r, ph: Math.random() * Math.PI * 2 });
    }
    var bandN = low ? 20 : 38;
    for (var b = 0; b < bandN; b++) {
      var f = b / (bandN - 1);
      var point = bandPoint(f, 0.045);
      var center = Math.sin(Math.PI * f);
      band.push({
        x: point.x, y: point.y,
        r: 0.17 + center * 0.10,
        a: 0.035 + center * 0.055,
        c: '91,137,213'
      });
      if (b % 3 === 0) {
        band.push({
          x: point.x + 0.006, y: point.y - 0.008,
          r: 0.045 + center * 0.035,
          a: 0.055 + center * 0.075,
          c: '232,226,207'
        });
      }
    }
    buildBand();
  }

  function buildBand() {
    if (!w || !h) return;
    bandCanvas = bandCanvas || document.createElement('canvas');
    bandCanvas.width = w;
    bandCanvas.height = h;
    var b = bandCanvas.getContext('2d');
    b.clearRect(0, 0, w, h);
    b.globalCompositeOperation = 'lighter';
    for (var i = 0; i < band.length; i++) {
      var q = band[i];
      var x = q.x * w;
      var y = q.y * h;
      var r = q.r * Math.max(w, h);
      var g = b.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + q.c + ',' + q.a + ')');
      g.addColorStop(0.38, 'rgba(' + q.c + ',' + (q.a * 0.46) + ')');
      g.addColorStop(1, 'rgba(' + q.c + ',0)');
      b.fillStyle = g;
      b.fillRect(0, 0, w, h);
    }
    b.globalCompositeOperation = 'source-over';
    for (var k = 0; k < band.length; k += 3) {
      var d = band[k];
      var dx = (d.x + 0.018) * w;
      var dy = (d.y - 0.012) * h;
      var dr = (0.06 + Math.sin(k) * 0.015) * Math.max(w, h);
      var dg = b.createRadialGradient(dx, dy, 0, dx, dy, dr);
      dg.addColorStop(0, 'rgba(3,6,17,.18)');
      dg.addColorStop(0.5, 'rgba(3,6,17,.07)');
      dg.addColorStop(1, 'rgba(3,6,17,0)');
      b.fillStyle = dg;
      b.fillRect(dx - dr, dy - dr, dr * 2, dr * 2);
    }
  }

  function spawnShooter() {
    if (shooters.length > (low ? 0 : 1)) return;
    var angle = Math.PI * (0.19 + Math.random() * 0.07);
    var speed = low ? (175 + Math.random() * 75) : (245 + Math.random() * 150);
    shooters.push({
      x: w * (0.04 + Math.random() * 0.52),
      y: h * (0.04 + Math.random() * 0.20),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: low ? (1.60 + Math.random() * 0.35) : (1.35 + Math.random() * 0.45),
      len: low ? (125 + Math.random() * 55) : (150 + Math.random() * 75),
      alpha: low ? 0.54 : (0.62 + Math.random() * 0.18)
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

  function drawBand() {
    if (!bandCanvas) return;
    ctx.globalAlpha = low ? 0.68 : 0.86;
    ctx.drawImage(bandCanvas, mx * w * 0.013, my * h * 0.010, w, h);
    ctx.globalAlpha = 1;
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
      g.addColorStop(0.68, 'rgba(194,224,255,' + (a * 0.60).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,' + a.toFixed(3) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = (low ? 1.9 : 2.25) * DPR;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.globalAlpha = a * 0.86;
      ctx.drawImage(sprite, s.x - 11 * DPR, s.y - 11 * DPR, 22 * DPR, 22 * DPR);
      ctx.globalAlpha = 1;
      if (s.life >= s.max || s.x > w + 140 || s.y > h + 140) shooters.splice(i, 1);
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
    drawBand();
    drawStars();
    if (t >= nextShot) { spawnShooter(); nextShot = t + (low ? (10 + Math.random() * 6) : (7 + Math.random() * 5)); }
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
    t = 0;
    nextShot = 0.75;
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
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  global.Galaxy = { mount: mount, stop: stop };
})(window);