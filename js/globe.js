/* 自建三维地球：canvas 正交投影，可拖拽旋转 / 滚轮缩放 / 点击城市 */
(function (global) {
  var CITIES = global.CITIES || [];
  var rot = { yaw: -1.9, pitch: 0.5 }, zoom = 1, drag = null;
  function project(lat, lng, cx, cy, R) {
    var la = lat * Math.PI / 180, lo = lng * Math.PI / 180 + rot.yaw;
    var x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    var y2 = y * Math.cos(rot.pitch) - z * Math.sin(rot.pitch);
    var z2 = y * Math.sin(rot.pitch) + z * Math.cos(rot.pitch);
    return { x: cx + R * x, y: cy - R * y2, vis: z2 > 0.02 };
  }
  function render() {
    var v = document.getElementById('view');
    v.innerHTML = '<h1>地球</h1><p class="small muted">拖拽旋转 · 滚轮/双指缩放 · 点击城市查看坐标</p><div class="globe-wrap" id="globeWrap"><canvas id="globeCv"></canvas><div class="globe-info" id="globeInfo">拖动试试</div></div>';
    var wrap = document.getElementById('globeWrap'), cv = document.getElementById('globeCv'), ctx = cv.getContext('2d');
    function resize() { var r = wrap.getBoundingClientRect(); cv.width = r.width * (devicePixelRatio || 1); cv.height = r.height * (devicePixelRatio || 1); draw(); }
    function draw() {
      var W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38 * zoom;
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
      g.addColorStop(0, '#1e3a5f'); g.addColorStop(1, '#0b1220');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(120,180,255,.25)'; ctx.lineWidth = 1;
      for (var la = -60; la <= 60; la += 30) { ctx.beginPath(); for (var lo = -180; lo <= 180; lo += 4) { var p = project(la, lo, cx, cy, R); if (p.vis) { p.x ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } } ctx.stroke(); }
      for (var lo2 = -180; lo2 < 180; lo2 += 30) { ctx.beginPath(); for (var la2 = -90; la2 <= 90; la2 += 4) { var q = project(la2, lo2, cx, cy, R); if (q.vis) { q.x ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } } ctx.stroke(); }
      ctx.strokeStyle = 'rgba(150,200,255,.45)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      CITIES.forEach(function (c) {
        var p = project(c.lat, c.lng, cx, cy, R); if (!p.vis) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#2dd4bf'; ctx.fill();
        ctx.fillStyle = '#e8edf7'; ctx.font = (12 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(c.name, p.x + 7, p.y + 4);
      });
    }
    wrap.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', function (e) { if (!drag) return; rot.yaw += (e.clientX - drag.x) * 0.008; rot.pitch = Math.max(-1.3, Math.min(1.3, rot.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; draw(); });
    wrap.addEventListener('pointerup', function (e) {
      if (drag && Math.abs(e.clientX - drag.x) < 3 && Math.abs(e.clientY - drag.y) < 3) {
        var r = cv.getBoundingClientRect(), cx2 = cv.width / 2, cy2 = cv.height / 2, R2 = Math.min(cv.width, cv.height) * 0.38 * zoom;
        var mx = (e.clientX - r.left) * (devicePixelRatio || 1), my = (e.clientY - r.top) * (devicePixelRatio || 1);
        var hit = CITIES.map(function (c) { var p = project(c.lat, c.lng, cx2, cy2, R2); return { c: c, d: p.vis ? Math.hypot(p.x - mx, p.y - my) : 1e9 }; }).sort(function (a, b) { return a.d - b.d; })[0];
        if (hit && hit.d < 24) { document.getElementById('globeInfo').textContent = hit.c.name + ' · ' + hit.c.lat + ', ' + hit.c.lng; }
      }
      drag = null;
    });
    wrap.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.2, zoom * (e.deltaY > 0 ? 0.94 : 1.06))); draw(); }, { passive: false });
    addEventListener('resize', resize);
    resize();
  }
  global.Globe = { render: render };
})(window);
