/* 自建三维地球 v4：大圆航线 + 经纬网读数 + 昼夜 + 时区时差 */
(function (global) {
  var CITIES = global.CITIES || [];
  var rot = { yaw: -1.9, pitch: 0.5 }, zoom = 1, drag = null, auto = true, night = true;
  var route = null, phase = 0, cv = null, ctx = null, wrap = null, raf = null, last = 0, R0 = 6371;

  function rad(d) { return d * Math.PI / 180; }
  function toVec(lat, lng) { var f = rad(lat), l = rad(lng); return { x: Math.cos(f) * Math.sin(l), y: Math.sin(f), z: Math.cos(f) * Math.cos(l) }; }
  function rotate(v) {
    var cy1 = Math.cos(rot.yaw), sy1 = Math.sin(rot.yaw);
    var x1 = v.x * cy1 + v.z * sy1, z1 = v.z * cy1 - v.x * sy1;
    var cp = Math.cos(rot.pitch), sp = Math.sin(rot.pitch);
    var y2 = v.y * cp - z1 * sp, z2 = v.y * sp + z1 * cp;
    return { x: x1, y: y2, z: z2 };
  }
  function projectVec(v, cx, cy, R) { var q = rotate(v); return { x: cx + R * q.x, y: cy - R * q.y, vis: q.z > 0.02 }; }
  function project(lat, lng, cx, cy, R) { return projectVec(toVec(lat, lng), cx, cy, R); }
  function unproject(sx, sy, cx, cy, R) {
    var nx = (sx - cx) / R, ny = (cy - sy) / R;
    if (nx * nx + ny * ny > 1) return null;
    var nz = Math.sqrt(1 - nx * nx - ny * ny);
    var cp = Math.cos(rot.pitch), sp = Math.sin(rot.pitch);
    var y1 = ny * cp + nz * sp, z1 = -ny * sp + nz * cp, x1 = nx;
    var cy1 = Math.cos(rot.yaw), sy1 = Math.sin(rot.yaw);
    var x = x1 * cy1 - z1 * sy1, z = x1 * sy1 + z1 * cy1;
    return { lat: Math.asin(Math.max(-1, Math.min(1, y1))) * 180 / Math.PI, lng: Math.atan2(x, z) * 180 / Math.PI };
  }
  function subsolar() {
    var now = new Date();
    var utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    var doy = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
    var dec = 23.44 * Math.sin(2 * Math.PI * (doy - 81) / 365);
    var lng = 180 - utcH * 15;
    while (lng > 180) lng -= 360; while (lng < -180) lng += 360;
    return { lat: dec, lng: lng };
  }
  function sunAltitude(lat) {
    var d = subsolar();
    var h = 90 - Math.abs(lat - d.lat);
    return { h: Math.max(0, Math.round(h * 10) / 10), dec: d, polar: h <= 0 };
  }
  function localTimeSwap() {
    var a = cityByName((document.getElementById('ltA') || {}).value), b = cityByName((document.getElementById('ltB') || {}).value);
    var tv = ((document.getElementById('ltT') || {}).value || '08:00').split(':');
    var box = document.getElementById('ltInfo'); if (!a || !b || !box) return;
    var mins = (parseInt(tv[0], 10) || 0) * 60 + (parseInt(tv[1], 10) || 0);
    var deltaMin = Math.round((b.lng - a.lng) / 15 * 60);
    var t2 = ((mins + deltaMin) % 1440 + 1440) % 1440;
    function fmt(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
    var diffH = Math.round(deltaMin / 6) / 10;
    box.innerHTML = a.name + '（' + a.lng + '°E）' + fmt(mins) + ' 时，' + b.name + '（' + b.lng + '°E）地方时约 <b>' + fmt(t2) + '</b> ｜ 经度差 ' + Math.abs(Math.round(b.lng - a.lng)) + '° → 时差约 <b>' + Math.abs(diffH) + ' 小时</b>';
  }
  function updateSun() {
    var box = document.getElementById('sunInfo'); if (!box) return;
    var sel = document.getElementById('sunLat');
    var val = sel && sel.value !== '' ? parseFloat(sel.value) : null;
    var d = subsolar();
    var ns = d.lat >= 0 ? '北纬' : '南纬';
    var head = '此刻太阳直射点：<b>' + ns + ' ' + Math.abs(d.lat).toFixed(1) + '°</b>，经度 <b>' + d.lng.toFixed(1) + '°</b>';
    if (val === null || isNaN(val)) { box.innerHTML = head + '。选择一个地点即可算出正午太阳高度。'; return; }
    var r = sunAltitude(val);
    box.innerHTML = head + '。<br>该地正午太阳高度 <b>' + (r.polar ? 0 : r.h) + '°</b>' + (r.polar ? '（出现极夜）' : '') + '　<span class="muted">公式 H = 90° − |当地纬度 − 直射点纬度|</span>';
  }
  function sunVec() {
    var now = new Date();
    var utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    var doy = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
    var dec = 23.44 * Math.sin(2 * Math.PI * (doy - 81) / 365);
    var lng = 180 - utcH * 15;
    return toVec(dec, lng);
  }
  function isDay(v, s) { return v.x * s.x + v.y * s.y + v.z * s.z > 0; }
  function slerp(a, b, t) {
    var d = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z)), o = Math.acos(d), so = Math.sin(o);
    if (so < 1e-6) return a;
    var k1 = Math.sin((1 - t) * o) / so, k2 = Math.sin(t * o) / so;
    return { x: a.x * k1 + b.x * k2, y: a.y * k1 + b.y * k2, z: a.z * k1 + b.z * k2 };
  }
  function cityByName(n) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i].name === n) return CITIES[i]; return null; }
  function routeMeta(a, b) {
    var va = toVec(a.lat, a.lng), vb = toVec(b.lat, b.lng);
    var d = Math.max(-1, Math.min(1, va.x * vb.x + va.y * vb.y + va.z * vb.z)), o = Math.acos(d);
    var y = Math.sin((b.lng - a.lng) * Math.PI / 180) * Math.cos(rad(b.lat));
    var x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return { km: Math.round(o * R0), bearing: Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360) };
  }

  function draw() {
    if (!cv || !ctx) return;
    var W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36 * zoom;
    var s = sunVec();
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
    g.addColorStop(0, '#1e3a5f'); g.addColorStop(1, '#0b1220');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1;
    for (var la = -60; la <= 60; la += 30) {
      for (var lo = -180; lo < 180; lo += 4) {
        var v1 = toVec(la, lo), v2 = toVec(la, lo + 4);
        var p1 = projectVec(v1, cx, cy, R), p2 = projectVec(v2, cx, cy, R);
        if (!(p1.vis && p2.vis)) continue;
        var day = !night || isDay(v1, s);
        ctx.strokeStyle = day ? 'rgba(125,185,255,.26)' : 'rgba(70,105,160,.13)';
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    }
    for (var lo2 = -180; lo2 < 180; lo2 += 30) {
      for (var la2 = -90; la2 < 90; la2 += 4) {
        var w1 = toVec(la2, lo2), w2 = toVec(la2 + 4, lo2);
        var q1 = projectVec(w1, cx, cy, R), q2 = projectVec(w2, cx, cy, R);
        if (!(q1.vis && q2.vis)) continue;
        var day2 = !night || isDay(w1, s);
        ctx.strokeStyle = day2 ? 'rgba(125,185,255,.20)' : 'rgba(70,105,160,.10)';
        ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(150,200,255,.45)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    if (route) {
      var pts = [];
      for (var t = 0; t <= 90; t++) pts.push(slerp(toVec(route.a.lat, route.a.lng), toVec(route.b.lat, route.b.lng), t / 90));
      ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(45,212,191,.85)';
      ctx.beginPath(); var started = false;
      pts.forEach(function (v) { var p = projectVec(v, cx, cy, R); if (p.vis) { if (started) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); started = true; } } else started = false; });
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      for (var i = 0; i < 6; i++) { var pp = projectVec(pts[Math.floor(((phase + i / 6) % 1) * (pts.length - 1))], cx, cy, R); if (pp.vis) { ctx.beginPath(); ctx.arc(pp.x, pp.y, 3.2, 0, 6.2832); ctx.fill(); } }
    }
    if (night) {
      var ss = subsolar(), sv = toVec(ss.lat, ss.lng), sp = projectVec(sv, cx, cy, R);
      if (sp.vis) {
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 8, 0, 6.2832); ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 14, 0, 6.2832); ctx.strokeStyle = 'rgba(251,191,36,.6)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fde68a'; ctx.font = (12 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText('☀ 直射点', sp.x + 13, sp.y + 4);
      }
    }
    CITIES.forEach(function (c) {
      var v = toVec(c.lat, c.lng), p = projectVec(v, cx, cy, R); if (!p.vis) return;
      var day3 = !night || isDay(v, s);
      var inRoute = route && (c === route.a || c === route.b);
      ctx.beginPath(); ctx.arc(p.x, p.y, inRoute ? 6 : 3.4, 0, Math.PI * 2);
      ctx.fillStyle = inRoute ? (c === route.a ? '#2dd4bf' : '#f472b6') : (day3 ? '#93c5fd' : '#64748b'); ctx.fill();
      if (zoom > 1.15 || inRoute) { ctx.fillStyle = day3 ? 'rgba(226,232,240,.92)' : 'rgba(148,163,184,.75)'; ctx.font = (11 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(c.name, p.x + 8, p.y + 4); }
    });
  }

  function loop(ts) { var dt = last ? Math.min(3, (ts - last) / 16.7) : 1; last = ts; if (auto && !drag) rot.yaw += 0.0035 * dt; if (route) phase = (phase + 0.004 * dt) % 1; if ((auto || route) && !drag) draw(); raf = requestAnimationFrame(loop); }
  function setAuto(v) { auto = !!v; var b = document.getElementById('glAuto'); if (b) b.textContent = auto ? '⏸ 暂停自转' : '▶ 开始自转'; }
  function toggleNight() { night = !night; var b = document.getElementById('glNight'); if (b) b.textContent = night ? '🌗 昼夜开' : '🌗 昼夜关'; draw(); }
  function reset() { rot.yaw = -1.9; rot.pitch = 0.5; zoom = 1; draw(); }
  function focus(name) { var c = cityByName(name); if (!c) return; rot.yaw = -rad(c.lng); rot.pitch = rad(c.lat); zoom = Math.max(zoom, 1.15); setAuto(false); draw(); }
  function setRoute(f, t) {
    var a = cityByName(f), b = cityByName(t); if (!a || !b) return;
    route = { a: a, b: b, meta: routeMeta(a, b) };
    var info = document.getElementById('routeInfo');
    if (info) info.innerHTML = '<b>' + a.name + ' → ' + b.name + '</b> · 大圆航线约 <b>' + route.meta.km + ' km</b> · 初始方位角 <b>' + route.meta.bearing + '°</b>';
    var sf = document.getElementById('glFrom'), st = document.getElementById('glTo');
    if (sf) sf.value = f; if (st) st.value = t;
    draw();
  }
  function clearRoute() { route = null; var i = document.getElementById('routeInfo'); if (i) i.textContent = '未选择航线'; draw(); }
  function applyRoute() { setRoute((document.getElementById('glFrom') || {}).value, (document.getElementById('glTo') || {}).value); }
  function updateTZ() {
    var a = cityByName((document.getElementById('tzA') || {}).value), b = cityByName((document.getElementById('tzB') || {}).value);
    var box = document.getElementById('tzInfo'); if (!a || !b || !box) return;
    var oa = Math.round(a.lng / 15), ob = Math.round(b.lng / 15), diff = Math.abs(oa - ob);
    var now = new Date(), utc = now.getTime() + now.getTimezoneOffset() * 60000;
    function f(ms) { var d = new Date(ms); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
    box.innerHTML = a.name + '（UTC' + (oa >= 0 ? '+' : '') + oa + '）此刻 <b>' + f(utc + oa * 3600000) + '</b> ｜ ' + b.name + '（UTC' + (ob >= 0 ? '+' : '') + ob + '）此刻 <b>' + f(utc + ob * 3600000) + '</b> ｜ 时差 <b>' + diff + ' 小时</b>';
  }
  function zoneText(p) {
    if (!p) return '';
    var lat = p.lat, lng = p.lng;
    if (lng > 180) lng -= 360; if (lng < -180) lng += 360;
    var ns = lat >= 0 ? '北' : '南', ew = lng >= 0 ? '东' : '西';
    var band = Math.abs(lat) < 30 ? '低纬' : Math.abs(lat) < 60 ? '中纬' : '高纬';
    var off = Math.round(lng / 15);
    return ns + '纬 ' + Math.abs(lat).toFixed(1) + '° · ' + ew + '经 ' + Math.abs(lng).toFixed(1) + '° · ' + ns + '半球/' + ew + '半球 · ' + band + ' · 约 UTC' + (off >= 0 ? '+' : '') + off;
  }

  function render() {
    var v = document.getElementById('view');
    var opts = CITIES.map(function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('');
    v.innerHTML = '<div class="phead"><span class="ico">🌏</span><div class="grow"><h2>地球 · 地理考点</h2><p>航线 / 经纬网 / 昼夜 / 时区</p></div></div>' +
      '<div class="card elev2"><div class="row"><button class="btn sm" id="glAuto" onclick="Globe.setAuto(!Globe.isAuto())">⏸ 暂停自转</button><button class="btn sm" id="glNight" onclick="Globe.toggleNight()">🌗 昼夜开</button><button class="btn sm" onclick="Globe.reset()">↺ 重置</button><select id="glCity" onchange="if(this.value)Globe.focus(this.value)" style="padding:8px;border:1px solid var(--line);border-radius:10px"><option value="">定位城市…</option>' + opts + '</select></div>' +
      '<div class="row" style="margin-top:10px"><select id="glFrom" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><span class="muted">→</span><select id="glTo" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><button class="btn sm primary" onclick="Globe.applyRoute()">画航线</button><button class="btn sm" onclick="Globe.clearRoute()">清除</button></div>' +
      '<div class="row" style="margin-top:10px"><button class="chip" onclick="Globe.setRoute(&#39;北京&#39;,&#39;纽约&#39;)">北京→纽约</button><button class="chip" onclick="Globe.setRoute(&#39;上海&#39;,&#39;伦敦&#39;)">上海→伦敦</button><button class="chip" onclick="Globe.setRoute(&#39;青树坪&#39;,&#39;东京&#39;)">青树坪→东京</button></div>' +
      '<p class="small muted" id="routeInfo" style="margin:10px 0 0">未选择航线</p>' +
      '<div class="row" style="margin-top:8px"><select id="tzA" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.updateTZ()">' + opts + '</select><select id="tzB" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.updateTZ()">' + opts + '</select></div>' +
      '<p class="small" id="tzInfo" style="margin:8px 0 0">选择两座城市看时差</p></div>' +
      '<div class="globe-wrap" id="globeWrap"><canvas id="globeCv"></canvas><div class="globe-info" id="globeInfo">点球面任意位置读经纬度</div></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">☀️</span><div class="grow"><h2>太阳直射点 · 正午太阳高度</h2><p>H = 90° − |当地纬度 − 直射点纬度|</p></div></div>' +
      '<div class="row"><select id="sunLat" onchange="Globe.updateSun()" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px"><option value="">选择地点…</option>' +
      CITIES.map(function (c) { return '<option value="' + c.lat + '">' + c.name + '（' + c.lat + '°）</option>'; }).join('') +
      '<option value="0">赤道 0°</option><option value="23.5">北回归线 23.5°</option><option value="-23.5">南回归线 -23.5°</option><option value="66.5">北极圈 66.5°</option></select></div>' +
      '<p class="small" id="sunInfo" style="margin:10px 0 0"></p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🕐</span><div class="grow"><h2>地方时换算</h2><p>经度每差 15°，地方时差 1 小时</p></div></div>' +
      '<div class="row"><select id="ltA" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.localTime()">' + opts + '</select>' +
      '<input type="time" id="ltT" value="08:00" onchange="Globe.localTime()" style="padding:7px;border:1px solid var(--line);border-radius:10px">' +
      '<span class="muted">→</span><select id="ltB" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.localTime()">' + opts + '</select></div>' +
      '<p class="small" id="ltInfo" style="margin:10px 0 0"></p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">📐</span><div class="grow"><h2>三个地理考点</h2><p>点下面的按钮直接看</p></div></div><p class="small muted" style="margin:0"><b>① 最短航线</b>：球面两点最短路径是大圆，投到平面地图上就成弧线。<br><b>② 经纬网</b>：点球面任意位置，读出经纬度、东西/南北半球、低中高纬。<br><b>③ 昼夜</b>：亮线=昼半球、暗线=夜半球，分界就是晨昏线（随时间移动）。</p></div>';
    wrap = document.getElementById('globeWrap'); cv = document.getElementById('globeCv'); ctx = cv.getContext('2d');
    document.getElementById('glFrom').value = '北京'; document.getElementById('glTo').value = '纽约';
    document.getElementById('tzA').value = '北京'; document.getElementById('tzB').value = '伦敦';
    document.getElementById('ltA').value = '北京'; document.getElementById('ltB').value = '伦敦';
    updateTZ(); updateSun(); localTimeSwap();
    function resize() { var r = wrap.getBoundingClientRect(); cv.width = r.width * (devicePixelRatio || 1); cv.height = r.height * (devicePixelRatio || 1); draw(); }
    wrap.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', function (e) { if (!drag) return; rot.yaw += (e.clientX - drag.x) * 0.008; rot.pitch = Math.max(-1.3, Math.min(1.3, rot.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; draw(); });
    wrap.addEventListener('pointerup', function (e) {
      if (drag && Math.abs(e.clientX - drag.x) < 3 && Math.abs(e.clientY - drag.y) < 3) {
        var r = cv.getBoundingClientRect(), cx = cv.width / 2, cy = cv.height / 2, R = Math.min(cv.width, cv.height) * 0.36 * zoom;
        var mx = (e.clientX - r.left) * (devicePixelRatio || 1), my = (e.clientY - r.top) * (devicePixelRatio || 1);
        var hit = CITIES.map(function (c) { var p = project(c.lat, c.lng, cx, cy, R); return { c: c, d: p.vis ? Math.hypot(p.x - mx, p.y - my) : 1e9 }; }).sort(function (a, b) { return a.d - b.d; })[0];
        var box = document.getElementById('globeInfo');
        if (hit && hit.d < 22) { box.textContent = hit.c.name + ' · ' + zoneText({ lat: hit.c.lat, lng: hit.c.lng }); }
        else { var p = unproject(mx, my, cx, cy, R); box.textContent = p ? zoneText(p) : '点到了球外，请点球面'; }
      }
      drag = null;
    });
    wrap.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.4, zoom * (e.deltaY > 0 ? 0.94 : 1.06))); draw(); }, { passive: false });
    addEventListener('resize', resize);
    resize();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  global.Globe = { render: render, setAuto: setAuto, isAuto: function () { return auto; }, toggleNight: toggleNight, reset: reset, focus: focus, setRoute: setRoute, clearRoute: clearRoute, applyRoute: applyRoute, updateTZ: updateTZ, updateSun: updateSun, localTime: localTimeSwap };
})(window);
