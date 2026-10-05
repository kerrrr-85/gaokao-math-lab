/* 自建三维地球 v3：大圆航线（最短航线）+ 城市定位 + 自转 + 拖拽缩放 */
(function (global) {
  var CITIES = global.CITIES || [];
  var rot = { yaw: -1.9, pitch: 0.5 }, zoom = 1, drag = null, auto = true;
  var route = null, phase = 0, cv = null, ctx = null, wrap = null, raf = null, last = 0, R0 = 6371;

  function toVec(lat, lng) {
    var f = lat * Math.PI / 180, l = lng * Math.PI / 180;
    return { x: Math.cos(f) * Math.sin(l), y: Math.sin(f), z: Math.cos(f) * Math.cos(l) };
  }
  function projectVec(v, cx, cy, R) {
    var cy1 = Math.cos(rot.yaw), sy1 = Math.sin(rot.yaw);
    var x1 = v.x * cy1 + v.z * sy1, z1 = v.z * cy1 - v.x * sy1;
    var cp = Math.cos(rot.pitch), sp = Math.sin(rot.pitch);
    var y2 = v.y * cp - z1 * sp, z2 = v.y * sp + z1 * cp;
    return { x: cx + R * x1, y: cy - R * y2, vis: z2 > 0.02, z: z2 };
  }
  function project(lat, lng, cx, cy, R) { return projectVec(toVec(lat, lng), cx, cy, R); }
  function slerp(a, b, t) {
    var d = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
    var o = Math.acos(d), so = Math.sin(o);
    if (so < 1e-6) return { x: a.x, y: a.y, z: a.z };
    var k1 = Math.sin((1 - t) * o) / so, k2 = Math.sin(t * o) / so;
    return { x: a.x * k1 + b.x * k2, y: a.y * k1 + b.y * k2, z: a.z * k1 + b.z * k2 };
  }
  function cityByName(n) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i].name === n) return CITIES[i]; return null; }
  function greatCircle(a, b, steps) {
    var va = toVec(a.lat, a.lng), vb = toVec(b.lat, b.lng), out = [];
    for (var i = 0; i <= steps; i++) out.push(slerp(va, vb, i / steps));
    return out;
  }
  function routeMeta(a, b) {
    var va = toVec(a.lat, a.lng), vb = toVec(b.lat, b.lng);
    var d = Math.max(-1, Math.min(1, va.x * vb.x + va.y * vb.y + va.z * vb.z));
    var o = Math.acos(d), km = Math.round(o * R0);
    var y = Math.sin((b.lng - a.lng) * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
    var x = Math.cos(a.lat * Math.PI / 180) * Math.sin(b.lat * Math.PI / 180) - Math.sin(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.cos((b.lng - a.lng) * Math.PI / 180);
    var brg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return { km: km, bearing: Math.round(brg) };
  }

  function draw() {
    if (!cv || !ctx) return;
    var W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36 * zoom;
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
    g.addColorStop(0, '#1e3a5f'); g.addColorStop(1, '#0b1220');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(120,180,255,.20)'; ctx.lineWidth = 1;
    for (var la = -60; la <= 60; la += 30) { ctx.beginPath(); for (var lo = -180; lo <= 180; lo += 4) { var p = project(la, lo, cx, cy, R); if (p.vis) { p.x ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } } ctx.stroke(); }
    for (var lo2 = -180; lo2 < 180; lo2 += 30) { ctx.beginPath(); for (var la2 = -90; la2 <= 90; la2 += 4) { var q = project(la2, lo2, cx, cy, R); if (q.vis) { q.x ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } } ctx.stroke(); }
    ctx.strokeStyle = 'rgba(150,200,255,.45)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    if (route) {
      var pts = greatCircle(route.a, route.b, 90).map(function (v) { return projectVec(v, cx, cy, R); });
      ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(45,212,191,.85)';
      ctx.beginPath(); var started = false;
      pts.forEach(function (p) { if (p.vis) { if (started) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); started = true; } } else started = false; });
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      for (var i = 0; i < 6; i++) {
        var idx = Math.floor(((phase + i / 6) % 1) * (pts.length - 1));
        var pp = pts[idx]; if (pp && pp.vis) { ctx.beginPath(); ctx.arc(pp.x, pp.y, 3.2, 0, 6.2832); ctx.fill(); }
      }
      [[route.a, '#2dd4bf'], [route.b, '#f472b6']].forEach(function (cc) {
        var p = project(cc[0].lat, cc[0].lng, cx, cy, R); if (!p.vis) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 6.2832); ctx.fillStyle = cc[1]; ctx.fill();
        ctx.fillStyle = '#eaf2ff'; ctx.font = (12 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(cc[0].name, p.x + 9, p.y + 4);
      });
    }
    CITIES.forEach(function (c) {
      var p = project(c.lat, c.lng, cx, cy, R); if (!p.vis) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fillStyle = '#93c5fd'; ctx.fill();
      if (zoom > 1.15) { ctx.fillStyle = 'rgba(226,232,240,.9)'; ctx.font = (11 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(c.name, p.x + 6, p.y + 4); }
    });
  }

  function loop(ts) {
    var dt = last ? Math.min(3, (ts - last) / 16.7) : 1; last = ts;
    var need = auto || route;
    if (auto && !drag) rot.yaw += 0.0035 * dt;
    if (route) phase = (phase + 0.004 * dt) % 1;
    if (need && !drag) draw();
    raf = requestAnimationFrame(loop);
  }

  function setAuto(v) { auto = !!v; var b = document.getElementById('glAuto'); if (b) b.textContent = auto ? '⏸ 暂停自转' : '▶ 开始自转'; }
  function reset() { rot.yaw = -1.9; rot.pitch = 0.5; zoom = 1; draw(); }
  function focus(name) { var c = cityByName(name); if (!c) return; rot.yaw = -c.lng * Math.PI / 180; rot.pitch = c.lat * Math.PI / 180; zoom = Math.max(zoom, 1.15); setAuto(false); draw(); }
  function setRoute(f, t) {
    var a = cityByName(f), b = cityByName(t); if (!a || !b) return;
    route = { a: a, b: b, meta: routeMeta(a, b) };
    var info = document.getElementById('routeInfo');
    if (info) info.innerHTML = '<b>' + a.name + ' → ' + b.name + '</b> · 大圆航线约 <b>' + route.meta.km + ' km</b> · 初始方位角 <b>' + route.meta.bearing + '°</b>';
    var sf = document.getElementById('glFrom'), st = document.getElementById('glTo');
    if (sf) sf.value = f; if (st) st.value = t;
    draw();
  }
  function clearRoute() { route = null; var info = document.getElementById('routeInfo'); if (info) info.textContent = '未选择航线'; draw(); }

  function render() {
    var v = document.getElementById('view');
    var opts = CITIES.map(function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('');
    v.innerHTML = '<div class="phead"><span class="ico">🌏</span><div class="grow"><h2>地球 · 最短航线</h2><p>拖拽旋转 · 滚轮缩放 · 点城市看坐标</p></div></div>' +
      '<div class="card elev2"><div class="row"><button class="btn sm" id="glAuto" onclick="Globe.setAuto(!Globe.isAuto())">⏸ 暂停自转</button><button class="btn sm" onclick="Globe.reset()">↺ 重置</button><select id="glCity" onchange="if(this.value)Globe.focus(this.value)" style="padding:8px;border:1px solid var(--line);border-radius:10px"><option value="">定位城市…</option>' + opts + '</select></div>' +
      '<div class="row" style="margin-top:10px"><select id="glFrom" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><span class="muted">→</span><select id="glTo" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><button class="btn sm primary" onclick="Globe.applyRoute()">画航线</button><button class="btn sm" onclick="Globe.clearRoute()">清除</button></div>' +
      '<div class="row" style="margin-top:10px"><button class="chip" onclick="Globe.setRoute(\'北京\',\'纽约\')">北京→纽约</button><button class="chip" onclick="Globe.setRoute(\'上海\',\'伦敦\')">上海→伦敦</button><button class="chip" onclick="Globe.setRoute(\'青树坪\',\'东京\')">青树坪→东京</button><button class="chip" onclick="Globe.setRoute(\'北京\',\'悉尼\')">北京→悉尼</button></div>' +
      '<p class="small muted" id="routeInfo" style="margin:10px 0 0">未选择航线</p></div>' +
      '<div class="globe-wrap" id="globeWrap"><canvas id="globeCv"></canvas><div class="globe-info" id="globeInfo">拖动试试</div></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">📐</span><div class="grow"><h2>为什么最短航线是弯的？</h2><p>球面上两点间最短路径是「大圆」的一段</p></div></div><p class="small muted" style="margin:0">地球是球体，把球面摊成平面地图时会产生形变：大圆航线投到平面地图上就成了弧线。所以北京飞纽约，往北极方向「绕一下」反而比直线更短——这就是大圆航线。</p></div>';
    wrap = document.getElementById('globeWrap'); cv = document.getElementById('globeCv'); ctx = cv.getContext('2d');
    document.getElementById('glFrom').value = '北京'; document.getElementById('glTo').value = '纽约';
    function resize() { var r = wrap.getBoundingClientRect(); cv.width = r.width * (devicePixelRatio || 1); cv.height = r.height * (devicePixelRatio || 1); draw(); }
    wrap.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', function (e) { if (!drag) return; rot.yaw += (e.clientX - drag.x) * 0.008; rot.pitch = Math.max(-1.3, Math.min(1.3, rot.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; draw(); });
    wrap.addEventListener('pointerup', function (e) {
      if (drag && Math.abs(e.clientX - drag.x) < 3 && Math.abs(e.clientY - drag.y) < 3) {
        var r = cv.getBoundingClientRect(), cx = cv.width / 2, cy = cv.height / 2, R = Math.min(cv.width, cv.height) * 0.36 * zoom;
        var mx = (e.clientX - r.left) * (devicePixelRatio || 1), my = (e.clientY - r.top) * (devicePixelRatio || 1);
        var hit = CITIES.map(function (c) { var p = project(c.lat, c.lng, cx, cy, R); return { c: c, d: p.vis ? Math.hypot(p.x - mx, p.y - my) : 1e9 }; }).sort(function (a, b) { return a.d - b.d; })[0];
        if (hit && hit.d < 22) { document.getElementById('globeInfo').textContent = hit.c.name + ' · ' + hit.c.lat + ', ' + hit.c.lng; }
      }
      drag = null;
    });
    wrap.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.4, zoom * (e.deltaY > 0 ? 0.94 : 1.06))); draw(); }, { passive: false });
    addEventListener('resize', resize);
    resize();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  global.Globe = { render: render, setAuto: setAuto, isAuto: function () { return auto; }, reset: reset, focus: focus, setRoute: setRoute, clearRoute: clearRoute, applyRoute: function () { setRoute((document.getElementById('glFrom') || {}).value, (document.getElementById('glTo') || {}).value); } };
})(window);
