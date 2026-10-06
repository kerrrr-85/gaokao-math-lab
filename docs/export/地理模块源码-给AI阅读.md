# 高考地理 · 3D 地球仪模块 —— 源码包（给 AI 阅读用）

> 这份包是**给你现有项目的实际状态**，不是设想。请基于它出方案，不要假设 React / Vue / Tailwind / 构建工具。

## 一、项目硬约束（改动必须遵守）

| 约束 | 说明 |
| --- | --- |
| **零依赖、无构建** | 纯原生 JS（ES5 风格 + fetch/Promise），没有 package.json、没有 npm、没有打包步骤。可以直接双击 `index.html` 打开使用 |
| **GitHub Pages 托管** | 线上地址 https://kerrrr-85.github.io/gaokao-math-lab/ ；仓库 kerrrr-85/gaokao-math-lab |
| **手机性能敏感** | 用户明确抱怨过"卡"。已有 PERF 分级：手机/低端机自动降 pixelRatio、降帧率、关重特效；离开页面必须停止 rAF |
| **`file://` 限制（已踩坑）** | ① 本地图片**不能**上传为 WebGL 贴图（浏览器按跨源拦截，会报 SecurityError）→ 现状解法：本地模式改用 base64 内联贴图 ② 本地 JSON 不能用 fetch 读 |
| **国内网络** | 用户在国内。`*.workers.dev` 被墙、`*.supabase.co` 被墙；GitHub（api.github.com / github.io）可正常访问 |
| **已有用户数据不能丢** | localStorage 键 `gml_progress_v1`（reviews/attempts/mastery/settings），有导出/导入 JSON 兜底 |

## 二、地球模块现状（已经做出来的）

页面路由 `#/globe`，**5 个板块（标签页）**，默认进入「真实地球」：

| 板块 | 内容 |
| --- | --- |
| **真实地球**（three.js 3D） | 真实地貌贴图 + 昼夜晨昏线（按当前时刻真实计算）+ 大气辉光 + 夜景灯光 + 城市标记与中文标签 + 大圆航线（北京→纽约，含距离）+ 时间轴滑块（0–24h 回放）+ 经纬网 + 自转开关 + 复位视角 + 点击球面读经纬度/昼夜/与直射点角距 |
| 地球运动 | 2D canvas 球 + 太阳直射点/正午太阳高度计算 + 年曲线 |
| 航线与经纬 | 大圆航线、经纬网读数、地方时、时区 |
| 大气与海洋 | 气压带风带、洋流 |
| 地质·气候·植被 | 板块与地震带、气候类型判读、等高线判读示意图、自然带 |

**已实现的 8 项能力**（用户要求的基线，均已存在）：经纬网读数 / 昼夜与晨昏线 / 太阳直射点与正午太阳高度 / 地方时与时区 / 洋流 / 板块与地震带 / 气压带风带 / 大圆航线。

**资源体积现状**（已压缩，勿轻易替换成更大的素材）：
- `vendor/three.min.js` 603 KB（r128 UMD）
- `vendor/earth-day.jpg` 297 KB（2048×1024 压缩版）
- `vendor/earth-night.jpg` 117 KB
- `vendor/earth-topo.jpg` 24 KB
- `vendor/earth-water.jpg` 75 KB（海面反光遮罩）
- `vendor/earth-tex-inline.js` 683 KB（**仅 `file://` 本地模式**加载的 base64 内联贴图）
- 合计约 1.8 MB，且**只在进入地球板块时才加载**

## 三、当前已知的两个体验问题（用户原话）

1. **"不能放大"** —— 已定位根因：3D 地球有滚轮缩放和拖拽，但**没有实现双指捏合**，所以**手机上无法缩放**。
2. **"画面很杂乱"** —— 默认一进页面就有：19 个城市中文标签 + 一条橙色大圆航线 + 夜景灯光 + 大气辉光，信息密度过高。

## 四、脚本加载顺序（index.html）

```
js/data.js → data/module-trig.js → data/module-seq.js → js/srs.js → js/store.js
→ data/videos.js → data/cities.js → vendor/anime.umd.min.js → js/anim.js
→ js/dotgrid.js → js/galaxy.js → js/portal.js → js/globe.js → js/earth3d.js
→ js/input.js → js/ai.js → js/app.js
```

## 五、源码

下面依次是：`js/globe.js`（2D 地球 + 5 板块 UI）、`js/earth3d.js`（three.js 真实地球）、`data/cities.js`（城市数据）、地理相关 CSS 片段。

---

# 文件：js/globe.js

```javascript
﻿/* 自建三维地球 v4：大圆航线 + 经纬网读数 + 昼夜 + 时区时差 */
(function (global) {
  var CITIES = global.CITIES || [];
  var rot = { yaw: -1.9, pitch: 0.5 }, zoom = 1, drag = null, auto = true, night = true;
  var route = null, phase = 0, cv = null, ctx = null, wrap = null, raf = null, last = 0, R0 = 6371, pressure = false, currentsOn = false, platesOn = false, resizeFn = null, pick = null, MIN_DT = (global.PERF && global.PERF.low) ? 33 : 16;

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
  var CLIMATE = [
    { lat: 0, pos: 'any', n: '热带雨林气候', f: '全年高温多雨', c: '常年受赤道低压带控制' },
    { lat: 10, pos: 'west', n: '热带草原气候', f: '全年高温，干湿季分明', c: '赤道低压与信风带交替控制' },
    { lat: 10, pos: 'east', n: '热带季风气候', f: '全年高温，旱雨两季分明', c: '海陆热力差异 + 气压带风带移动' },
    { lat: 10, pos: 'mid', n: '热带草原气候', f: '全年高温，干湿季分明', c: '赤道低压与信风带交替控制' },
    { lat: 20, pos: 'west', n: '热带沙漠气候', f: '全年炎热干燥', c: '常年受副热带高压或信风控制' },
    { lat: 20, pos: 'east', n: '亚热带季风气候', f: '夏季高温多雨，冬季温和少雨', c: '海陆热力差异' },
    { lat: 20, pos: 'mid', n: '热带沙漠气候', f: '全年炎热干燥', c: '深居内陆，水汽难以到达' },
    { lat: 30, pos: 'west', n: '地中海气候', f: '夏季炎热干燥，冬季温和多雨', c: '副热带高压与西风带交替控制' },
    { lat: 30, pos: 'east', n: '亚热带季风气候', f: '夏季高温多雨，冬季温和少雨', c: '海陆热力差异' },
    { lat: 30, pos: 'mid', n: '温带大陆性气候', f: '冬冷夏热，降水稀少', c: '深居内陆，远离海洋' },
    { lat: 40, pos: 'west', n: '温带海洋性气候', f: '全年温和湿润', c: '常年受西风带控制' },
    { lat: 40, pos: 'east', n: '温带季风气候', f: '夏季高温多雨，冬季寒冷干燥', c: '海陆热力差异' },
    { lat: 40, pos: 'mid', n: '温带大陆性气候', f: '冬冷夏热，降水少且集中夏季', c: '深居内陆' },
    { lat: 60, pos: 'any', n: '亚寒带针叶林气候', f: '冬季严寒漫长，夏季短促温暖', c: '纬度高，太阳辐射少' }
  ];
  function climate() {
    var lat = parseInt((document.getElementById('clLat') || {}).value || '0', 10);
    var pos = (document.getElementById('clPos') || {}).value || 'west';
    var box = document.getElementById('clInfo'); if (!box) return;
    var hit = null;
    for (var i = 0; i < CLIMATE.length; i++) { var c = CLIMATE[i]; if (c.lat === lat && (c.pos === pos || c.pos === 'any')) { hit = c; break; } }
    if (!hit) { box.textContent = '该组合对应温带大陆性气候（深居内陆）。'; return; }
    box.innerHTML = '判读结果：<b>' + hit.n + '</b><br>气候特征：' + hit.f + '<br>成因：' + hit.c;
  }
  function updateSun() {
    var box = document.getElementById('sunInfo'); if (!box) return;
    var sel = document.getElementById('sunLat');
    var val = sel && sel.value !== '' ? parseFloat(sel.value) : null;
    var d = subsolar();
    var ns = d.lat >= 0 ? '北纬' : '南纬';
    var head = '此刻太阳直射点：<b>' + ns + ' ' + Math.abs(d.lat).toFixed(1) + '°</b>，经度 <b>' + d.lng.toFixed(1) + '°</b>';
    var chart = document.getElementById('sunChart');
    if (val === null || isNaN(val)) { box.innerHTML = head + '。选择一个地点即可算出正午太阳高度。'; if (chart) chart.innerHTML = ''; return; }
    var r = sunAltitude(val);
    box.innerHTML = head + '。<br>该地正午太阳高度 <b>' + (r.polar ? 0 : r.h) + '°</b>' + (r.polar ? '（出现极夜）' : '') + '　<span class="muted">H = 90° − |当地纬度 − 直射点纬度|</span>';
    if (chart) chart.innerHTML = sunChartSVG(val);
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

  function latBand(lat, color, width, cx, cy, R) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    var started = false;
    for (var lo = -180; lo <= 180; lo += 4) {
      var p = project(lat, lo, cx, cy, R);
      if (p.vis) { if (started) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); started = true; } } else started = false;
    }
    ctx.stroke();
  }
  function windArrow(lat1, lng1, lat2, lng2, color, cx, cy, R) {
    var p1 = project(lat1, lng1, cx, cy, R), p2 = project(lat2, lng2, cx, cy, R);
    if (!p1.vis || !p2.vis) return;
    ctx.strokeStyle = color; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.beginPath(); ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - 7 * Math.cos(ang - 0.45), p2.y - 7 * Math.sin(ang - 0.45));
    ctx.lineTo(p2.x - 7 * Math.cos(ang + 0.45), p2.y - 7 * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  var CURRENTS = [
    { n: '墨西哥湾暖流', w: true, p: [[25, -80], [32, -72], [38, -60], [42, -48]] },
    { n: '北大西洋暖流', w: true, p: [[42, -48], [50, -30], [55, -15], [62, 5]] },
    { n: '加那利寒流', w: false, p: [[32, -15], [25, -18], [18, -21], [12, -24]] },
    { n: '拉布拉多寒流', w: false, p: [[62, -58], [55, -54], [48, -50]] },
    { n: '北赤道暖流', w: true, p: [[12, -35], [12, -55], [12, -75]] },
    { n: '南赤道暖流', w: true, p: [[-5, -30], [-5, -50], [-5, -70]] },
    { n: '巴西暖流', w: true, p: [[-8, -34], [-20, -40], [-32, -48]] },
    { n: '秘鲁寒流', w: false, p: [[-42, -76], [-25, -74], [-10, -80], [-2, -85]] },
    { n: '本格拉寒流', w: false, p: [[-32, 16], [-20, 12], [-10, 9]] },
    { n: '黑潮', w: true, p: [[20, 122], [28, 130], [35, 140]] },
    { n: '亲潮', w: false, p: [[50, 160], [44, 150], [40, 145]] },
    { n: '加利福尼亚寒流', w: false, p: [[40, -126], [32, -120], [24, -114]] },
    { n: '东澳大利亚暖流', w: true, p: [[-15, 150], [-25, 154], [-35, 152]] },
    { n: '西澳大利亚寒流', w: false, p: [[-32, 110], [-24, 110], [-16, 112]] },
    { n: '西风漂流', w: false, p: [[-52, -60], [-55, 0], [-52, 60], [-55, 120], [-52, 180]] }
  ];
  var PLATES = [
    { n: '环太平洋地震带', c: 'rgba(251,146,60,.95)', w: 3, p: [[58, -152], [52, -132], [40, -124], [26, -112], [14, -94], [-2, -80], [-22, -70], [-40, -74], [-54, -66], [-42, -100], [-20, -140], [0, -162], [20, 160], [34, 142], [46, 152], [56, 168], [60, -175], [58, -152]] },
    { n: '地中海—喜马拉雅地震带', c: 'rgba(250,204,21,.95)', w: 3, p: [[40, 8], [37, 24], [34, 44], [30, 60], [28, 76], [27, 88], [20, 100], [6, 104], [-6, 115], [-9, 126], [-5, 136], [4, 142]] },
    { n: '大西洋中脊', c: 'rgba(56,189,248,.85)', w: 2.2, p: [[64, -22], [54, -30], [40, -40], [22, -44], [2, -32], [-20, -16], [-40, -12], [-54, -2]] },
    { n: '东非裂谷带', c: 'rgba(52,211,153,.85)', w: 2.2, p: [[16, 40], [6, 36], [-6, 35], [-16, 34]] }
  ];
  function drawPlates(cx, cy, R) {
    PLATES.forEach(function (pl) {
      ctx.strokeStyle = pl.c; ctx.lineWidth = pl.w;
      ctx.beginPath(); var started = false;
      pl.p.forEach(function (pt) {
        var q = project(pt[0], pt[1], cx, cy, R);
        if (q.vis) { if (started) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); started = true; } } else started = false;
      });
      ctx.stroke();
      var mid = pl.p[Math.floor(pl.p.length / 2)], lp = project(mid[0], mid[1], cx, cy, R);
      if (lp.vis) { ctx.fillStyle = pl.c; ctx.font = (11 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(pl.n, lp.x + 8, lp.y - 4); }
    });
  }
  function drawCurrents(cx, cy, R) {
    CURRENTS.forEach(function (c) {
      var col = c.w ? 'rgba(248,113,113,.95)' : 'rgba(96,165,250,.95)';
      for (var i = 0; i < c.p.length - 1; i++) {
        var a1 = project(c.p[i][0], c.p[i][1], cx, cy, R), b1 = project(c.p[i + 1][0], c.p[i + 1][1], cx, cy, R);
        if (!a1.vis || !b1.vis) continue;
        ctx.strokeStyle = col; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.stroke();
        var ang = Math.atan2(b1.y - a1.y, b1.x - a1.x);
        var mx = (a1.x + b1.x) / 2, my = (a1.y + b1.y) / 2;
        ctx.beginPath(); ctx.moveTo(mx, my);
        ctx.lineTo(mx - 8 * Math.cos(ang - 0.45), my - 8 * Math.sin(ang - 0.45));
        ctx.lineTo(mx - 8 * Math.cos(ang + 0.45), my - 8 * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      var label = project(c.p[c.p.length - 1][0], c.p[c.p.length - 1][1], cx, cy, R);
      if (label.vis) { ctx.fillStyle = c.w ? '#fca5a5' : '#93c5fd'; ctx.font = (11 * (devicePixelRatio || 1)) + 'px sans-serif'; ctx.fillText(c.n, label.x + 7, label.y + 3); }
    });
  }
  function drawPressure(cx, cy, R) {
    latBand(0, 'rgba(56,189,248,.30)', 9, cx, cy, R);
    latBand(30, 'rgba(248,113,113,.28)', 9, cx, cy, R); latBand(-30, 'rgba(248,113,113,.28)', 9, cx, cy, R);
    latBand(60, 'rgba(56,189,248,.26)', 9, cx, cy, R); latBand(-60, 'rgba(56,189,248,.26)', 9, cx, cy, R);
    latBand(84, 'rgba(248,113,113,.26)', 9, cx, cy, R); latBand(-84, 'rgba(248,113,113,.26)', 9, cx, cy, R);
    var los = [-140, -80, -20, 40, 100, 160];
    los.forEach(function (lo) {
      windArrow(25, lo - 6, 15, lo + 6, 'rgba(251,191,36,.95)', cx, cy, R);
      windArrow(10, lo - 6, 20, lo + 6, 'rgba(251,191,36,.95)', cx, cy, R);
      windArrow(35, lo + 6, 50, lo - 6, 'rgba(45,212,191,.95)', cx, cy, R);
      windArrow(62, lo - 6, 75, lo + 6, 'rgba(167,139,250,.95)', cx, cy, R);
      windArrow(-25, lo - 6, -15, lo + 6, 'rgba(251,191,36,.95)', cx, cy, R);
      windArrow(-35, lo + 6, -50, lo - 6, 'rgba(45,212,191,.95)', cx, cy, R);
      windArrow(-62, lo - 6, -75, lo + 6, 'rgba(167,139,250,.95)', cx, cy, R);
    });
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
    if (pressure) drawPressure(cx, cy, R);
    if (currentsOn) drawCurrents(cx, cy, R);
    if (platesOn) drawPlates(cx, cy, R);
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

  function loop(ts) {
    if (!ctx || !cv || cv.isConnected === false) { raf = null; return; }
    raf = requestAnimationFrame(loop);
    if (ts && last && ts - last < MIN_DT - 1) return;
    var dt = last ? Math.min(3, (ts - last) / 16.7) : 1; last = ts;
    if (auto && !drag) rot.yaw += 0.0035 * dt;
    if (route) phase = (phase + 0.004 * dt) % 1;
    if ((auto || route) && !drag) draw();
  }
  function setAuto(v) { auto = !!v; var b = document.getElementById('glAuto'); if (b) b.textContent = auto ? '⏸ 暂停自转' : '▶ 开始自转'; }
  function togglePlates() { platesOn = !platesOn; var b = document.getElementById('glPlate'); if (b) b.textContent = platesOn ? '🗺 板块开' : '🗺 板块关'; draw(); }
  function toggleCurrents() { currentsOn = !currentsOn; var b = document.getElementById('glCur'); if (b) b.textContent = currentsOn ? '🌊 洋流开' : '🌊 洋流关'; draw(); }
  function togglePressure() { pressure = !pressure; var b = document.getElementById('glPres'); if (b) b.textContent = pressure ? '🌀 气压带开' : '🌀 气压带关'; draw(); }
  function sunChartSVG(lat) {
    var pts = [], maxH = 0, minH = 90;
    for (var d = 0; d < 365; d += 5) {
      var dec = 23.44 * Math.sin(2 * Math.PI * (d + 1 - 81) / 365);
      var h = Math.max(0, 90 - Math.abs(lat - dec));
      pts.push({ d: d, h: h }); if (h > maxH) maxH = h; if (h < minH) minH = h;
    }
    var W = 620, H = 132, pad = 24;
    var path = pts.map(function (p, i) {
      var x = pad + (W - pad * 2) * p.d / 365;
      var y = H - pad - (H - pad * 2) * p.h / 90;
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;margin-top:8px">' +
      '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" stroke="#cbd5e1"/>' +
      '<path d="' + path + '" fill="none" stroke="#0f766e" stroke-width="2.4"/>' +
      '<text x="' + pad + '" y="' + (H - 8) + '" font-size="11" fill="#64748b">1月</text>' +
      '<text x="' + (W / 2 - 14) + '" y="' + (H - 8) + '" font-size="11" fill="#64748b">7月</text>' +
      '<text x="' + (W - pad - 26) + '" y="' + (H - 8) + '" font-size="11" fill="#64748b">12月</text>' +
      '<text x="' + pad + '" y="16" font-size="11" fill="#0f766e">年最大 ' + maxH.toFixed(1) + '°</text>' +
      '<text x="' + (W - pad - 90) + '" y="16" font-size="11" fill="#64748b">年最小 ' + minH.toFixed(1) + '°</text></svg>';
  }
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

  function fullscreen() {
    document.body.classList.toggle('globe-full');
    var b = document.getElementById('glFull'); if (b) b.textContent = document.body.classList.contains('globe-full') ? '⤡ 退出全屏' : '⛶ 全屏';
    setTimeout(function () { if (resizeFn) resizeFn(); }, 80);
  }
  function pickCity(name) {
    var c = cityByName(name); if (!c) return;
    var box = document.getElementById('globeInfo');
    if (!pick || !pick.a) { pick = { a: c }; if (box) box.textContent = '起点：' + c.name + '，再点一座城市作为终点'; return; }
    setRoute(pick.a.name, c.name);
    if (box) box.textContent = '航线：' + pick.a.name + ' → ' + c.name + '（再点城市重新选）';
    pick = null;
  }
  function tab(id) {
    ['real', 'motion', 'route', 'air', 'earth'].forEach(function (k) {
      var el = document.getElementById('gs-' + k); if (el) el.style.display = (k === id) ? 'block' : 'none';
      var ch = document.getElementById('tab-' + k); if (ch) ch.className = 'chip' + (k === id ? ' on' : '');
    });
    var gw = document.getElementById('globeWrap'), gt = document.getElementById('globeTools');
    var isReal = (id === 'real');
    if (gw) gw.style.display = isReal ? 'none' : 'block';
    if (gt) gt.style.display = isReal ? 'none' : 'block';
    if (global.Earth3D) { if (isReal) Earth3D.resume(); else Earth3D.pause(); }
    if (!isReal) { setTimeout(function () { if (resizeFn) resizeFn(); }, 0); }
    draw();
  }
  function render(startTab) {
    var v = document.getElementById('view');
    var opts = CITIES.map(function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('');
    v.innerHTML = '<div class="phead"><span class="ico">🌏</span><div class="grow"><h2>地球 · 地理</h2><p>分板块查看：点下面的标签切换</p></div></div>' +
      '<div class="row" style="margin-bottom:10px"><button class="chip on" id="tab-real" onclick="Globe.tab(&#39;real&#39;)">真实地球</button>' +
      '<button class="chip" id="tab-motion" onclick="Globe.tab(&#39;motion&#39;)">地球运动</button>' +
      '<button class="chip" id="tab-route" onclick="Globe.tab(&#39;route&#39;)">航线与经纬</button>' +
      '<button class="chip" id="tab-air" onclick="Globe.tab(&#39;air&#39;)">大气与海洋</button>' +
      '<button class="chip" id="tab-earth" onclick="Globe.tab(&#39;earth&#39;)">地质·气候·植被</button></div>' +
      '<div class="card elev2" id="globeTools" style="margin-bottom:12px"><div class="row"><button class="btn sm" id="glFull" onclick="Globe.fullscreen()">⛶ 全屏</button><button class="btn sm" id="glAuto" onclick="Globe.setAuto(!Globe.isAuto())">⏸ 暂停自转</button>' +
      '<button class="btn sm" id="glNight" onclick="Globe.toggleNight()">🌗 昼夜开</button>' +
      '<button class="btn sm" id="glPres" onclick="Globe.togglePressure()">🌀 气压带关</button>' +
      '<button class="btn sm" id="glCur" onclick="Globe.toggleCurrents()">🌊 洋流关</button>' +
      '<button class="btn sm" id="glPlate" onclick="Globe.togglePlates()">🗺 板块关</button>' +
      '<select id="glCity" onchange="if(this.value)Globe.focus(this.value)" style="padding:8px;border:1px solid var(--line);border-radius:10px"><option value="">定位城市…</option>' + opts + '</select></div></div>' +
      '<div class="globe-wrap" id="globeWrap"><canvas id="globeCv"></canvas><div class="globe-info" id="globeInfo">点城市=设航线起点/终点；点球面=读经纬度</div><button class="globe-x" onclick="Globe.fullscreen()">✕ 退出全屏</button></div>' +

      '<div id="gs-real" class="gsec">' +
      '<div class="card elev2" style="margin-top:12px;padding:12px">' +
      '<div class="e3-wrap" id="e3Wrap"><div class="e3-labels" id="e3Labels"></div><div class="e3-hud" id="e3Info">拖动=转视角 · 滚轮/双指=缩放 · 点击球面读经纬度</div></div>' +
      '<div class="row" style="margin-top:10px"><button class="btn sm" id="e3Auto" onclick="Earth3D.toggleAuto()">暂停自转</button><button class="btn sm" id="e3Lbl" onclick="Earth3D.toggleLabels()">城市名开</button><button class="btn sm" id="e3Grid" onclick="Earth3D.toggleGrid()">经纬网关</button><button class="btn sm" id="e3Night" onclick="Earth3D.toggleNight()">夜景开</button><button class="btn sm" onclick="Earth3D.reset()">复位视角</button></div>' +
      '<div class="row" style="margin-top:10px"><b class="small">时间轴</b><input type="range" id="e3Hour" min="0" max="24" step="0.25" value="12" oninput="Earth3D.setHour(this.value)" style="flex:1;min-width:150px"><span class="small muted" id="e3Time"></span><button class="btn sm primary" id="e3Live" onclick="Earth3D.setLive()">实时</button></div>' +
      '<div class="row" style="margin-top:10px"><b class="small">最短航线</b><select id="e3From" onchange="Earth3D.applyRoute()" style="padding:7px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><select id="e3To" onchange="Earth3D.applyRoute()" style="padding:7px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><button class="btn sm primary" onclick="Earth3D.applyRoute()">画大圆航线</button><button class="btn sm" onclick="Earth3D.clearRoute()">清除</button></div>' +
      '<div class="small muted" id="e3Route" style="margin-top:8px"></div></div>' +
      '<div class="card"><div class="phead"><div class="grow"><h2>为什么最短航线走「大圆」</h2><p>北京 → 纽约看似横穿太平洋，实际最短是向北掠过北极圈</p></div></div>' +
      '<p class="small muted" style="margin:0">球面上两点间最短路径 = 过球心的<b>大圆</b>劣弧。所以北半球中高纬之间的飞行/航海，多选择<b>偏向极地</b>的路线；赤道附近两点才接近沿纬线。橙色弧线即大圆航线，距离按地球半径 6371km 计算。</p></div>' +
      '</div>' +
      '<div id="gs-motion" class="gsec" style="display:none">' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">☀️</span><div class="grow"><h2>太阳直射点 · 正午太阳高度</h2><p>H = 90° − |当地纬度 − 直射点纬度|</p></div></div>' +
      '<div class="row"><select id="sunLat" onchange="Globe.updateSun()" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px"><option value="">选择地点…</option>' +
      CITIES.map(function (c) { return '<option value="' + c.lat + '">' + c.name + '（' + c.lat + '°）</option>'; }).join('') +
      '<option value="0">赤道 0°</option><option value="23.5">北回归线 23.5°</option><option value="-23.5">南回归线 -23.5°</option><option value="66.5">北极圈 66.5°</option></select></div>' +
      '<p class="small" id="sunInfo" style="margin:10px 0 0"></p><div id="sunChart"></div></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🕐</span><div class="grow"><h2>地方时换算</h2><p>经度每差 15°，地方时差 1 小时</p></div></div>' +
      '<div class="row"><select id="ltA" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.localTime()">' + opts + '</select>' +
      '<input type="time" id="ltT" value="08:00" onchange="Globe.localTime()" style="padding:7px;border:1px solid var(--line);border-radius:10px">' +
      '<span class="muted">→</span><select id="ltB" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.localTime()">' + opts + '</select></div>' +
      '<p class="small" id="ltInfo" style="margin:10px 0 0"></p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🌐</span><div class="grow"><h2>时区与时差</h2><p>区时 = 中央经线的地方时</p></div></div>' +
      '<div class="row"><select id="tzA" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.updateTZ()">' + opts + '</select>' +
      '<select id="tzB" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px" onchange="Globe.updateTZ()">' + opts + '</select></div>' +
      '<p class="small" id="tzInfo" style="margin:10px 0 0"></p></div>' +
      '</div>' +

      '<div id="gs-route" class="gsec" style="display:none">' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">✈️</span><div class="grow"><h2>最短航线（大圆航线）</h2><p>球面两点最短路径是大圆的一段</p></div></div>' +
      '<div class="row"><select id="glFrom" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><span class="muted">→</span><select id="glTo" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px">' + opts + '</select><button class="btn sm primary" onclick="Globe.applyRoute()">画航线</button><button class="btn sm" onclick="Globe.clearRoute()">清除</button></div>' +
      '<div class="row" style="margin-top:10px"><button class="chip" onclick="Globe.setRoute(&#39;北京&#39;,&#39;纽约&#39;)">北京→纽约</button><button class="chip" onclick="Globe.setRoute(&#39;上海&#39;,&#39;伦敦&#39;)">上海→伦敦</button><button class="chip" onclick="Globe.setRoute(&#39;青树坪&#39;,&#39;东京&#39;)">青树坪→东京</button></div>' +
      '<p class="small muted" id="routeInfo" style="margin:10px 0 0">未选择航线</p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">📐</span><div class="grow"><h2>经纬网与航线要点</h2><p>球面摊平会有形变</p></div></div>' +
      '<p class="small muted" style="margin:0"><b>经纬网</b>：点球面任意位置，读出经纬度、东西/南北半球、低中高纬。<br><b>最短航线</b>：球面两点最短路径是大圆，投到平面地图上就成了弧线——北京飞纽约往北极方向「绕一下」反而更短。<br><b>昼夜</b>：亮线=昼半球、暗线=夜半球，分界就是晨昏线（随时间移动）。</p></div>' +
      '</div>' +

      '<div id="gs-air" class="gsec" style="display:none">' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🌀</span><div class="grow"><h2>气压带与风带</h2><p>开「气压带」按钮看球面叠加</p></div></div>' +
      '<p class="small muted" style="margin:0"><b>7 个气压带</b>：赤道低压带、副热带高压带（南北）、副极地低压带（南北）、极地高压带（南北）。<br><b>6 个风带</b>：低纬信风（东北信风/东南信风）、中纬西风、极地东风。<br>口诀：<b>低压上升多雨，高压下沉干燥；由高压吹向低压，北半球右偏</b>。</p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🌊</span><div class="grow"><h2>洋流</h2><p>开「洋流」按钮看球面箭头</p></div></div>' +
      '<p class="small muted" style="margin:0"><span style="color:#dc2626">红=暖流</span>、<span style="color:#2563eb">蓝=寒流</span>。暖流增温增湿，寒流降温减湿；<b>寒暖流交汇处</b>（纽芬兰、北海道）和<b>上升流处</b>（秘鲁）易形成大渔场。</p></div>' +
      '</div>' +

      '<div id="gs-earth" class="gsec" style="display:none">' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🗺️</span><div class="grow"><h2>板块与地震带</h2><p>开「板块」按钮看球面边界</p></div></div>' +
      '<p class="small muted" style="margin:0">橙色=环太平洋地震带，黄色=地中海—喜马拉雅地震带，蓝色=大西洋中脊，绿色=东非裂谷。板块交界处地壳活跃，多火山地震；张裂成裂谷/海岭，碰撞成山脉/海沟。</p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🌦️</span><div class="grow"><h2>气候类型判读</h2><p>选纬度带 + 海陆位置</p></div></div>' +
      '<div class="row"><select id="clLat" onchange="Globe.climate()" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px"><option value="0">0°~10°</option><option value="10">10°~20°</option><option value="20">20°~30°</option><option value="30">30°~40°</option><option value="40">40°~60°</option><option value="60">60°~70°</option></select>' +
      '<select id="clPos" onchange="Globe.climate()" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:10px"><option value="west">大陆西岸</option><option value="mid">大陆内部</option><option value="east">大陆东岸</option></select></div>' +
      '<p class="small" id="clInfo" style="margin:10px 0 0"></p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">⛰️</span><div class="grow"><h2>等高线地形判读</h2><p>山峰·鞍部·山谷·陡崖</p></div></div>' +
      '<svg viewBox="0 0 620 250" style="width:100%;height:auto">' +
      '<ellipse cx="150" cy="115" rx="125" ry="75" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="150" cy="115" rx="92" ry="55" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="150" cy="115" rx="58" ry="34" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="150" cy="115" rx="26" ry="15" fill="none" stroke="#94a3b8" stroke-width="1.6"/><text x="150" y="119" text-anchor="middle" font-size="13" fill="#0f766e">山峰</text>' +
      '<ellipse cx="360" cy="105" rx="70" ry="48" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="360" cy="105" rx="44" ry="30" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="360" cy="105" rx="20" ry="13" fill="none" stroke="#94a3b8" stroke-width="1.6"/>' +
      '<ellipse cx="440" cy="135" rx="58" ry="42" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="440" cy="135" rx="34" ry="24" fill="none" stroke="#94a3b8" stroke-width="1.6"/><ellipse cx="440" cy="135" rx="14" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.6"/><text x="400" y="122" text-anchor="middle" font-size="13" fill="#b45309">鞍部</text>' +
      '<path d="M540 40 L500 105 L555 105 L520 175 L585 175" fill="none" stroke="#94a3b8" stroke-width="1.6"/><path d="M555 40 L520 105 L575 105 L540 175 L600 175" fill="none" stroke="#94a3b8" stroke-width="1.6"/><text x="556" y="205" text-anchor="middle" font-size="13" fill="#2563eb">山谷</text>' +
      '<line x1="60" y1="212" x2="150" y2="212" stroke="#dc2626" stroke-width="4"/><line x1="66" y1="220" x2="150" y2="220" stroke="#dc2626" stroke-width="4"/><line x1="72" y1="228" x2="150" y2="228" stroke="#dc2626" stroke-width="4"/><text x="105" y="246" text-anchor="middle" font-size="12" fill="#dc2626">陡崖（等高线重合）</text></svg>' +
      '<p class="small muted" style="margin:8px 0 0"><b>山峰</b>闭合中间高；<b>鞍部</b>两峰之间低地；<b>山谷</b>等高线向<b>高处</b>凸（有河流）；<b>山脊</b>向<b>低处</b>凸（分水岭）；<b>陡崖</b>等高线重合。</p></div>' +
      '<div class="card" style="margin-top:12px"><div class="phead"><span class="ico">🌿</span><div class="grow"><h2>自然带</h2><p>从赤道到两极</p></div></div>' +
      '<div class="zone"><div style="background:#166534">热带雨林带</div><div style="background:#4d7c0f">热带草原带</div><div style="background:#b45309">热带荒漠带</div><div style="background:#0f766e">亚热带常绿硬叶林</div><div style="background:#15803d">温带落叶阔叶林</div><div style="background:#065f46">亚寒带针叶林</div><div style="background:#7c3aed">苔原带</div><div style="background:#38bdf8">冰原带</div></div>' +
      '<p class="small muted" style="margin:10px 0 0">赤道→两极：热量减少，自然带依次更替（纬度地带性）；同纬度沿海→内陆：水分减少，森林→草原→荒漠（经度地带性）；山地随海拔升高出现类似更替（垂直地带性）。</p></div>' +
      '</div>';
    wrap = document.getElementById('globeWrap'); cv = document.getElementById('globeCv'); ctx = cv.getContext('2d');
    var _gf = document.getElementById('glFrom'), _gt = document.getElementById('glTo');
    var _ta = document.getElementById('tzA'), _tb = document.getElementById('tzB');
    var _la = document.getElementById('ltA'), _lb = document.getElementById('ltB');
    if (_gf) _gf.value = '北京'; if (_gt) _gt.value = '纽约';
    if (_ta) _ta.value = '北京'; if (_tb) _tb.value = '伦敦';
    if (_la) _la.value = '北京'; if (_lb) _lb.value = '伦敦';
    updateTZ(); updateSun(); localTimeSwap(); climate();
    function resize() { var r = wrap.getBoundingClientRect(); var _dpr = Math.min(devicePixelRatio || 1, (global.PERF && global.PERF.low) ? 1.25 : 2); cv.width = Math.max(1, r.width * _dpr); cv.height = Math.max(1, r.height * _dpr); draw(); }
    resizeFn = resize;
    if (resizeFn && resizeFn !== resize) removeEventListener('resize', resizeFn); resizeFn = resize; addEventListener('resize', resizeFn);
    wrap.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', function (e) { if (!drag) return; rot.yaw += (e.clientX - drag.x) * 0.008; rot.pitch = Math.max(-1.3, Math.min(1.3, rot.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; draw(); });
    wrap.addEventListener('pointerup', function (e) {
      if (drag && Math.abs(e.clientX - drag.x) < 3 && Math.abs(e.clientY - drag.y) < 3) {
        var r = cv.getBoundingClientRect(), cx = cv.width / 2, cy = cv.height / 2, R = Math.min(cv.width, cv.height) * 0.36 * zoom;
        var mx = (e.clientX - r.left) * (devicePixelRatio || 1), my = (e.clientY - r.top) * (devicePixelRatio || 1);
        var hit = CITIES.map(function (c) { var p2 = project(c.lat, c.lng, cx, cy, R); return { c: c, d: p2.vis ? Math.hypot(p2.x - mx, p2.y - my) : 1e9 }; }).sort(function (a, b) { return a.d - b.d; })[0];
        var box = document.getElementById('globeInfo');
        if (hit && hit.d < 22) { box.textContent = hit.c.name + ' · ' + zoneText({ lat: hit.c.lat, lng: hit.c.lng }) + '（再点一次设为航线点）'; pickCity(hit.c.name); }
        else { var pp = unproject(mx, my, cx, cy, R); box.textContent = pp ? zoneText(pp) : '点到了球外，请点球面'; }
      }
      drag = null;
    });
    wrap.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.4, zoom * (e.deltaY > 0 ? 0.94 : 1.06))); draw(); }, { passive: false });
    resize();
    if (global.Earth3D) Earth3D.mount(document.getElementById('e3Wrap'));
    if (!raf) raf = requestAnimationFrame(loop);
    tab(startTab || 'real');
  }

  function stop() {
    if (global.Earth3D) Earth3D.unmount();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (resizeFn) { removeEventListener('resize', resizeFn); resizeFn = null; }
    last = 0;
  }
  global.Globe = { render: render, stop: stop, setAuto: setAuto, isAuto: function () { return auto; }, toggleNight: toggleNight, reset: reset, focus: focus, setRoute: setRoute, clearRoute: clearRoute, applyRoute: applyRoute, updateTZ: updateTZ, tab: tab, fullscreen: fullscreen, togglePressure: togglePressure, toggleCurrents: toggleCurrents, togglePlates: togglePlates, climate: climate, updateSun: updateSun, localTime: localTimeSwap };
})(window);

```

---

# 文件：js/earth3d.js

```javascript
/* 真实地球 v1：three.js 着色地球 + 昼夜晨昏线 + 城市 + 大圆最短航线（懒加载，离线可用） */
(function (global) {
  var THREE = null, loading = false, pending = [];
  var renderer = null, scene = null, camera = null, earth = null, atmo = null, sunLight = null;
  var gridObj = null, routeObj = null, markerGroup = null;
  var wrap = null, canvas = null, labelBox = null, raf = null, mounted = false;
  var textures = {}, texQueue = 0, texDone = 0;
  var cities = global.CITIES || [];
  var markers = [], labels = [], labelPool = [];
  var stars = null;

  var st = {
    yaw: 0.9, pitch: 0.32, dist: 3.1, minD: 1.6, maxD: 6.5,
    hour: null, live: true, auto: true, showLabels: true, showGrid: false,
    showNight: true, route: null, drag: null, moved: 0, lastT: 0, frame: 0
  };
  var LOW = !!(global.PERF && global.PERF.low);

  function asset(u) { return './' + u; }

  function isFile() { return String(location.protocol || '').indexOf('file') === 0; }
  function ensure(cb) {
    if (global.THREE && (!isFile() || global.EARTH_TEX)) { THREE = global.THREE; cb(); return; }
    pending.push(cb);
    if (loading) return;
    loading = true;
    var need = [];
    if (isFile() && !global.EARTH_TEX) need.push('vendor/earth-tex-inline.js?v=50');
    if (!global.THREE) need.push('vendor/three.min.js?v=50');
    function done() { loading = false; THREE = global.THREE; var q = pending; pending = []; q.forEach(function (f) { f(); }); }
    function fail() { loading = false; pending = []; if (wrap) wrap.innerHTML = '<div class="e3-fail">3D 地球资源加载失败，请切回「地球运动」板块。</div>'; }
    (function next() {
      if (!need.length) { done(); return; }
      var s = document.createElement('script');
      s.src = asset(need.shift());
      s.onload = next;
      s.onerror = fail;
      document.head.appendChild(s);
    })();
  }

  function hud(txt) { var h = document.getElementById('e3Info'); if (h) h.textContent = txt; }
  var TEX_TOTAL = 4;
  function tex(name, url) {
    var src = (global.EARTH_TEX && global.EARTH_TEX[name]) ? global.EARTH_TEX[name] : (asset(url) + '?v=50');
    return new THREE.TextureLoader().load(src, function () {
      texDone++;
      if (texDone >= TEX_TOTAL) { setTime(true); hud('拖动=转视角 · 滚轮/双指=缩放 · 点击球面读经纬度'); }
    }, undefined, function () {
      texDone++;
      hud('贴图加载失败（浏览器限制本地文件），请用线上网址打开；其余地理板块不受影响');
    });
  }

  function latLonVec(lat, lon, r) {
    var la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
    return new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)).multiplyScalar(r == null ? 1 : r);
  }
  function vecLatLon(v) {
    var n = v.clone().normalize();
    return { lat: Math.asin(Math.max(-1, Math.min(1, n.y))) * 180 / Math.PI, lon: Math.atan2(-n.z, n.x) * 180 / Math.PI };
  }
  function subsolar(ts) {
    var d = new Date(ts == null ? Date.now() : ts);
    var y = d.getUTCFullYear();
    var doy = (Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(y, 0, 0)) / 86400000;
    var decl = -23.44 * Math.cos(2 * Math.PI * (doy + 10) / 365.24);
    var utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    var lon = 180 - utcH * 15;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return { lat: decl, lon: lon, date: d };
  }
  function nowTs() {
    if (st.live) return Date.now();
    var d = new Date();
    d.setHours(Math.floor(st.hour), Math.round((st.hour % 1) * 60), 0, 0);
    return d.getTime();
  }

  var VERT = [
    'varying vec2 vUv; varying vec3 vN; varying vec3 vP;',
    'void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vP = (modelMatrix * vec4(position,1.0)).xyz;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
  ].join('\n');
  var FRAG = [
    'uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D specMap; uniform sampler2D topoMap;',
    'uniform vec3 sunDir; uniform float nightOn;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vP;',
    'void main(){',
    '  vec3 n = normalize(vN); vec3 s = normalize(sunDir); float d = dot(n, s);',
    '  float lit = smoothstep(-0.12, 0.26, d);',
    '  vec3 day = texture2D(dayMap, vUv).rgb;',
    '  vec3 ngt = texture2D(nightMap, vUv).rgb;',
    '  float spc = texture2D(specMap, vUv).r;',
    '  float topo = texture2D(topoMap, vUv).r;',
    '  vec3 dcol = day * (0.10 + 1.05 * max(d, 0.0));',
    '  dcol *= (0.90 + 0.20 * topo);',
    '  dcol += vec3(0.80,0.90,1.0) * pow(max(d,0.0), 14.0) * spc * 0.55;',
    '  vec3 ncol = ngt * (2.30 * nightOn);',
    '  vec3 col = mix(ncol, dcol, lit);',
    '  vec3 V = normalize(cameraPosition - vP);',
    '  float rim = pow(1.0 - max(dot(n, V), 0.0), 2.6);',
    '  col += vec3(0.22,0.45,0.92) * rim * (0.35 + 0.65 * lit) * 0.75;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  var ATMO_V = 'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vP=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  var ATMO_F = [
    'varying vec3 vN; varying vec3 vP; uniform vec3 sunDir;',
    'void main(){ vec3 V=normalize(cameraPosition-vP); float rim=pow(1.0-max(dot(vN,V),0.0),3.2);',
    '  float s=clamp(dot(vN,normalize(sunDir))*0.5+0.78,0.0,1.0);',
    '  gl_FragColor=vec4(vec3(0.30,0.58,1.0)*rim*s*1.1, rim*s*0.9); }'
  ].join('\n');

  function buildGraticule() {
    var pts = [], r = 1.001, i, j, a;
    for (i = -60; i <= 60; i += 30) {
      for (j = 0; j < 360; j += 4) {
        pts.push(latLonVec(i, j, r), latLonVec(i, j + 4, r));
      }
    }
    for (a = 0; a < 360; a += 30) {
      for (j = -88; j < 88; j += 4) {
        pts.push(latLonVec(j, a, r), latLonVec(j + 4, a, r));
      }
    }
    var g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x7fb0ff, transparent: true, opacity: 0.22 }));
  }

  function buildStars() {
    var n = LOW ? 700 : 1600, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (v.length() < 0.001) v.set(0, 0, 1);
      v.normalize().multiplyScalar(60 + Math.random() * 40);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdbe6ff, size: 0.42, sizeAttenuation: true, transparent: true, opacity: 0.85 }));
  }

  var onReady = null;
  function build() {
    if (!wrap || mounted) return;
    var W = Math.max(200, wrap.clientWidth || 320), H = Math.max(180, wrap.clientHeight || 260);
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !LOW, alpha: false });
    } catch (e) { wrap.innerHTML = '<div class="e3-fail">此设备不支持 WebGL，请切回「地球运动」板块。</div>'; return; }
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, LOW ? 1.25 : 2));
    renderer.setSize(W, H, false);
    renderer.domElement.className = 'e3-cv';
    wrap.insertBefore(renderer.domElement, wrap.firstChild);
    canvas = renderer.domElement;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 400);
    scene.add(buildStars());
    sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    scene.add(sunLight);

    hud('正在加载地球贴图…');
    textures.day = tex('day', 'vendor/earth-day.jpg');
    textures.night = tex('night', 'vendor/earth-night.jpg');
    textures.spec = tex('water', 'vendor/earth-water.jpg');
    textures.topo = tex('topo', 'vendor/earth-topo.jpg');
    texQueue = 4;

    var uni = {
      dayMap: { value: textures.day }, nightMap: { value: textures.night },
      specMap: { value: textures.spec }, topoMap: { value: textures.topo },
      sunDir: { value: new THREE.Vector3(1, 0, 0) }, nightOn: { value: st.showNight ? 1 : 0 }
    };
    var mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG });
    earth = new THREE.Mesh(new THREE.SphereGeometry(1, LOW ? 48 : 96, LOW ? 32 : 64), mat);
    earth.userData.uni = uni;
    scene.add(earth);
    atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 40, 28), new THREE.ShaderMaterial({
      uniforms: { sunDir: uni.sunDir }, vertexShader: ATMO_V, fragmentShader: ATMO_F,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
    }));
    scene.add(atmo);

    gridObj = buildGraticule(); gridObj.visible = st.showGrid; earth.add(gridObj);

    markerGroup = new THREE.Group(); earth.add(markerGroup);
    var mg = new THREE.SphereGeometry(0.009, 8, 8);
    var mm = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    cities.forEach(function (c) {
      var m = new THREE.Mesh(mg, mm);
      m.position.copy(latLonVec(c.lat, c.lng, 1.004));
      m.userData.city = c;
      markerGroup.add(m); markers.push(m);
      var el = document.createElement('div');
      el.className = 'e3-lb'; el.textContent = c.name;
      if (labelBox) { labelBox.appendChild(el); labelPool.push(el); labels.push({ el: el, obj: m }); }
    });

    bindInput();
    mounted = true;
    st.lastT = 0;
    raf = requestAnimationFrame(loop);
    var sel = document.getElementById('e3From'), sel2 = document.getElementById('e3To');
    if (sel) sel.value = '北京';
    if (sel2) sel2.value = '纽约';
    applyRoute();
  }

  function setTime(force) {
    if (!earth) return;
    var su = subsolar(nowTs());
    var la = su.lat * Math.PI / 180, lo = su.lon * Math.PI / 180;
    earth.rotation.y = -lo;
    earth.userData.uni.sunDir.value.set(Math.cos(la), Math.sin(la), 0);
    if (sunLight) sunLight.position.copy(earth.userData.uni.sunDir.value).multiplyScalar(10);
    var t = document.getElementById('e3Time');
    if (t) {
      var d = su.date, hh = d.getHours(), mm = d.getMinutes();
      t.textContent = '北京 ' + ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2) +
        '　直射点 ' + su.lat.toFixed(1) + '°' + (su.lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(su.lon).toFixed(1) + '°' + (su.lon >= 0 ? 'E' : 'W');
    }
    var hr = document.getElementById('e3Hour');
    if (hr && !st.live) hr.value = String(st.hour);
  }

  function arcPoints(a, b, n) {
    var va = latLonVec(a.lat, a.lng, 1), vb = latLonVec(b.lat, b.lng, 1);
    var om = Math.acos(Math.max(-1, Math.min(1, va.dot(vb)))), out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, p;
      if (om < 1e-6) p = va.clone();
      else {
        var s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
        p = va.clone().multiplyScalar(s1).add(vb.clone().multiplyScalar(s2));
      }
      p.normalize().multiplyScalar(1 + 0.055 * Math.sin(Math.PI * t));
      out.push(p);
    }
    return { pts: out, rad: om };
  }
  function cityByName(n) { for (var i = 0; i < cities.length; i++) if (cities[i].name === n) return cities[i]; return null; }

  function setRoute(aName, bName) {
    if (!earth) return;
    if (routeObj) { earth.remove(routeObj); routeObj = null; }
    var a = cityByName(aName), b = cityByName(bName);
    if (!a || !b) return;
    var r = arcPoints(a, b, LOW ? 90 : 160);
    var curve = new THREE.CatmullRomCurve3(r.pts);
    var geo = new THREE.TubeGeometry(curve, LOW ? 60 : 120, 0.0042, 6, false);
    routeObj = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    earth.add(routeObj);
    var el = document.getElementById('e3Route');
    if (el) el.textContent = a.name + ' → ' + b.name + ' 大圆距离 ' + Math.round(6371 * r.rad) + ' km（最短航线，球面走大圆）';
  }
  function clearRoute() {
    if (routeObj && earth) { earth.remove(routeObj); routeObj = null; }
    var el = document.getElementById('e3Route'); if (el) el.textContent = '';
  }
  function applyRoute() {
    var a = (document.getElementById('e3From') || {}).value || '北京';
    var b = (document.getElementById('e3To') || {}).value || '纽约';
    setRoute(a, b);
  }

  function loop(ts) {
    if (!mounted || !renderer) return;
    raf = requestAnimationFrame(loop);
    var minGap = LOW ? 33 : 16;
    if (ts && st.lastT && ts - st.lastT < minGap - 1) return;
    var dt = st.lastT ? Math.min(3, (ts - st.lastT) / 16.7) : 1;
    st.lastT = ts;
    st.frame++;
    if (!st.drag) {
      if (st.auto) st.yaw += 0.0016 * dt;
      if (st.pitch > 1.15) st.pitch = 1.15;
    }
    if (st.live && st.frame % 30 === 0) setTime();
    placeCamera();
    if (st.showLabels) updateLabels();
    renderer.render(scene, camera);
  }
  function placeCamera() {
    var cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
    camera.position.set(st.dist * cp * Math.sin(st.yaw), st.dist * sp, st.dist * cp * Math.cos(st.yaw));
    camera.lookAt(0, 0, 0);
  }
  function updateLabels() {
    if (!labelBox) return;
    if (LOW && st.frame % 3 !== 0) return;
    var W = wrap.clientWidth, H = wrap.clientHeight;
    var v = new THREE.Vector3(), camDir = camera.position.clone().normalize();
    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      v.copy(L.obj.position).applyMatrix4(earth.matrixWorld);
      var nrm = v.clone().normalize();
      var facing = nrm.dot(camDir);
      var p = v.clone().project(camera);
      var x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
      var show = facing > 0.18 && p.z < 1;
      L.el.style.display = show ? 'block' : 'none';
      if (show) { L.el.style.left = x.toFixed(0) + 'px'; L.el.style.top = y.toFixed(0) + 'px'; }
    }
  }

  function bindInput() {
    if (!wrap) return;
    wrap.addEventListener('pointerdown', function (e) {
      wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId);
      st.drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      st.moved = 0;
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!st.drag || st.drag.id !== e.pointerId) return;
      var dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      st.moved += Math.abs(dx) + Math.abs(dy);
      st.yaw -= dx * 0.006;
      st.pitch = Math.max(-1.25, Math.min(1.25, st.pitch + dy * 0.005));
      st.drag.x = e.clientX; st.drag.y = e.clientY;
    });
    function up(e) {
      if (!st.drag) return;
      var wasClick = st.moved < 6;
      st.drag = null;
      if (wasClick) pick(e);
    }
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointercancel', function () { st.drag = null; });
    wrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      st.dist = Math.max(st.minD, Math.min(st.maxD, st.dist * (e.deltaY > 0 ? 1.06 : 0.94)));
    }, { passive: false });
  }

  function pick(e) {
    if (!earth || !canvas) return;
    var r = canvas.getBoundingClientRect();
    var m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    var ray = new THREE.Raycaster();
    ray.setFromCamera(m, camera);
    var hit = ray.intersectObject(earth, false)[0];
    var box = document.getElementById('e3Info');
    if (!hit) { if (box) box.textContent = '点到了球外，请点地球表面'; return; }
    var local = earth.worldToLocal(hit.point.clone());
    var ll = vecLatLon(local);
    var s = subsolar(nowTs());
    var d = latLonVec(ll.lat, ll.lon, 1).dot(latLonVec(s.lat, s.lon, 1));
    var localNoon = Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
    var isDay = d > 0;
    if (box) box.textContent = ll.lat.toFixed(1) + '°' + (ll.lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(ll.lon).toFixed(1) + '°' + (ll.lon >= 0 ? 'E' : 'W') +
      '　' + (isDay ? '白昼' : '黑夜') + '　与直射点相距 ' + localNoon.toFixed(0) + '°';
  }

  function resize() {
    if (!renderer || !wrap) return;
    var W = Math.max(200, wrap.clientWidth), H = Math.max(180, wrap.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }

  function mount(box) {
    wrap = box || document.getElementById('e3Wrap');
    if (!wrap) return;
    labelBox = document.getElementById('e3Labels');
    if (mounted) { resize(); return; }
    ensure(build);
  }
  function pause() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  function resume() { if (mounted && !raf) { st.lastT = 0; resize(); raf = requestAnimationFrame(loop); } }
  function unmount() {
    mounted = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (renderer) {
      try { renderer.dispose(); } catch (e) {}
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = null; scene = null; camera = null; earth = null; atmo = null; gridObj = null; routeObj = null;
    markers = []; labels = [];
    if (labelBox) labelBox.innerHTML = '';
    Object.keys(textures).forEach(function (k) { try { textures[k].dispose(); } catch (e) {} });
    textures = {};
  }
  function toggleAuto() { st.auto = !st.auto; var b = document.getElementById('e3Auto'); if (b) b.textContent = st.auto ? '暂停自转' : '开始自转'; }
  function toggleLabels() { st.showLabels = !st.showLabels; var b = document.getElementById('e3Lbl'); if (b) b.textContent = st.showLabels ? '城市名开' : '城市名关'; if (!st.showLabels) { labels.forEach(function (L) { L.el.style.display = 'none'; }); } }
  function toggleGrid() { st.showGrid = !st.showGrid; if (gridObj) gridObj.visible = st.showGrid; var b = document.getElementById('e3Grid'); if (b) b.textContent = st.showGrid ? '经纬网开' : '经纬网关'; }
  function toggleNight() { st.showNight = !st.showNight; if (earth) earth.userData.uni.nightOn.value = st.showNight ? 1 : 0; var b = document.getElementById('e3Night'); if (b) b.textContent = st.showNight ? '夜景开' : '夜景关'; }
  function setHour(v) { st.live = false; st.hour = parseFloat(v); setTime(); var b = document.getElementById('e3Live'); if (b) b.className = 'btn sm'; }
  function setLive() { st.live = true; setTime(); var b = document.getElementById('e3Live'); if (b) b.className = 'btn sm primary'; }
  function reset() { st.yaw = 0.9; st.pitch = 0.32; st.dist = 3.1; }
  function resizeEv() { if (mounted) resize(); }

  global.addEventListener('resize', resizeEv);
  global.Earth3D = {
    mount: mount, unmount: unmount, resize: resize, pause: pause, resume: resume,
    toggleAuto: toggleAuto, toggleLabels: toggleLabels, toggleGrid: toggleGrid, toggleNight: toggleNight,
    setHour: setHour, setLive: setLive, reset: reset, applyRoute: applyRoute, clearRoute: clearRoute
  };
})(window);

```

---

# 文件：data/cities.js

```javascript
﻿window.CITIES = [
  { name: '北京', lat: 39.90, lng: 116.41 },
  { name: '上海', lat: 31.23, lng: 121.47 },
  { name: '广州', lat: 23.13, lng: 113.26 },
  { name: '成都', lat: 30.57, lng: 104.07 },
  { name: '乌鲁木齐', lat: 43.83, lng: 87.62 },
  { name: '拉萨', lat: 29.65, lng: 91.14 },
  { name: '三亚', lat: 18.25, lng: 109.51 },
  { name: '长沙', lat: 28.23, lng: 112.94 },
  { name: '青树坪', lat: 27.38, lng: 112.02 },
  { name: '东京', lat: 35.68, lng: 139.69 },
  { name: '新加坡', lat: 1.35, lng: 103.82 },
  { name: '伦敦', lat: 51.51, lng: -0.13 },
  { name: '莫斯科', lat: 55.75, lng: 37.62 },
  { name: '开罗', lat: 30.04, lng: 31.24 },
  { name: '开普敦', lat: -33.92, lng: 18.42 },
  { name: '纽约', lat: 40.71, lng: -74.01 },
  { name: '洛杉矶', lat: 34.05, lng: -118.24 },
  { name: '里约', lat: -22.91, lng: -43.17 },
  { name: '悉尼', lat: -33.87, lng: 151.21 }
];

```

---

# 地理相关 CSS 片段（从 css/style.css 中筛出）

```css
.gnode{cursor:pointer}
.gnode circle{fill:#fff;stroke:#94a3b8;stroke-width:1.5}
.gnode:hover circle{stroke:var(--primary);stroke-width:2.5}
.gnode text{font-size:11px;fill:#334155;text-anchor:middle}
.gnode.done circle{fill:var(--primary-soft);stroke:var(--primary)}
.globe-wrap{width:100%;height:min(70vh,560px);background:#0b1220;border-radius:16px;overflow:hidden;position:relative;touch-action:none;cursor:grab}
.globe-wrap canvas{display:block;width:100%;height:100%}
.globe-info{position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.55);color:#fff;padding:8px 12px;border-radius:10px;font-size:13px}
.rail{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.rail>*{scroll-snap-align:start;flex:0 0 auto}
.rail::-webkit-scrollbar{height:6px}
.rail::-webkit-scrollbar-thumb{background:#dbe2ea;border-radius:99px}
.bars7{display:flex;align-items:flex-end;gap:6px;height:92px}
.bars7>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end}
.bars7 i{display:block;width:100%;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#2dd4bf,#0f766e);min-height:3px}
.bars7 span{font-size:10px;color:var(--muted)}
.donut{position:relative;width:132px;height:132px;flex:none}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--ink2)}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}
.heatmap{display:grid;grid-template-rows:repeat(7,11px);grid-auto-flow:column;grid-auto-columns:11px;gap:3px;overflow-x:auto;padding:2px 0 6px}
body.dark .gnode text{fill:#cbd5e1}
.gnode-label{font-size:12px;fill:#334155;text-anchor:middle;paint-order:stroke;stroke:rgba(255,255,255,.9);stroke-width:3px;stroke-linejoin:round}
body.dark .gnode-label{fill:#cbd5e1;stroke:rgba(15,23,42,.9)}
.graphbox{position:relative;overflow:hidden;touch-action:none;cursor:grab}
.graphbox svg{transform-origin:0 0;transition:transform .12s linear}
.gnode.dim{opacity:.22}
.gnode.hot circle{stroke:#0f766e;stroke-width:3}
.zone{display:flex;height:46px;border-radius:10px;overflow:hidden;box-shadow:var(--sh1)}
.zone div{flex:1;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;text-align:center;padding:2px;line-height:1.2}
@media (max-width:700px){.zone{height:auto;flex-wrap:wrap}.zone div{flex:1 0 25%;min-height:44px}}
.globe-wrap{width:100%;height:min(78vh,720px);background:#0b1220;border-radius:18px;overflow:hidden;position:relative;touch-action:none;cursor:grab;box-shadow:var(--sh2)}
.gsec{display:block}
@media (max-width:700px){.globe-wrap{height:min(62vh,480px)}}
.globe-x{display:none;position:absolute;right:14px;top:14px;z-index:5;background:rgba(10,15,30,.78);color:#e7c986;border:1px solid rgba(217,179,108,.6);border-radius:999px;padding:8px 16px;font-family:inherit;font-size:14px;cursor:pointer}
body.globe-full .globe-wrap{position:fixed;inset:0;height:100vh;width:100vw;border-radius:0;z-index:200}
body.globe-full .globe-x{display:block}
body.globe-full .topbar,body.globe-full .bottombar,body.globe-full .dot-canvas{display:none}
.e3-wrap{position:relative;width:100%;height:min(62vh,520px);background:#04070f;border-radius:14px;overflow:hidden;touch-action:none;cursor:grab}
.e3-wrap:active{cursor:grabbing}
.e3-cv{display:block;width:100%;height:100%}
.e3-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.e3-lb{position:absolute;transform:translate(-50%,-50%);font-size:11px;line-height:1.2;color:#fff;background:rgba(6,12,26,.55);border:1px solid rgba(150,180,255,.35);border-radius:6px;padding:1px 5px;text-shadow:0 1px 3px #000;white-space:nowrap}
.e3-hud{position:absolute;left:10px;bottom:10px;right:10px;font-size:12px;color:#cbd5e1;background:rgba(4,7,15,.62);padding:5px 9px;border-radius:9px}
.e3-fail{padding:22px;color:#fca5a5;font-size:13px}
@media (max-width:700px){.e3-wrap{height:min(52vh,420px)}}
.btn,.chip,.opt,.tabbar a,.pt-item,.pt-weather,.penbtn,.symbtn,.homebtn,.globe-x{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.rail{-webkit-overflow-scrolling:touch;scroll-behavior:smooth;overscroll-behavior-x:contain;scroll-snap-type:x proximity}
.rail>*{scroll-snap-align:start}
  .btn,.chip,.opt,.item,.mini,.card,.tabbar a,.rail{transition:none}
.map-rail{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
.map-step{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:var(--card);
.map-step:hover{border-color:var(--pt-line-2,rgba(27,36,64,.3));transform:translateY(-1px)}
.map-step.hot{border-color:#0f766e;color:#0f766e}
.map-step i{flex:none;width:8px;height:8px;border-radius:50%;background:#e2e8f0}
.map-step.done i{background:#0f766e}
.map-step .ms-no{font-size:10.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.map-step .ms-m{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
.graphbox{position:relative;height:min(74vh,620px)}
.gnode-card{position:absolute;left:0;top:0;z-index:30;width:252px;padding:13px 14px;background:var(--card);
.gnode-card.on{opacity:1;pointer-events:auto;transform:none}
.graphbox.full{position:fixed;inset:0;z-index:180;width:100vw;height:100vh;border-radius:0;border:0}
body.map-full{overflow:hidden}
body.map-full .topbar,body.map-full .tabbar,body.map-full .dot-canvas{display:none}
  .graphbox{height:min(62vh,520px)}
  .gnode-card{width:min(252px,86vw)}
@media (prefers-reduced-motion: reduce){ .gnode-card,.map-step{transition:none} }
```

---

# 附：数据规模与内容现状

- 题库总规模：28 个知识节点 / 56 张方法卡 / 112 道题（函数与导数、三角函数、数列三个模块）
- **地理模块目前没有配套题目**（地理只是"看"的教具，还没接练习与错题本）
- 习题系统（练习/错题本/FSRS 复习）已存在，可对接，但需要先有地理题目内容

# 附：用户已明确拒绝/排除的方案

- ❌ React / Vue / Tailwind / shadcn / 任何需要 npm 构建的方案
- ❌ `*.workers.dev`（国内被墙）
- ❌ `*.supabase.co`（国内被墙，已实测 TLS 被重置）
- ❌ 引入体积很大的贴图（现有 2048×1024 已够用，首屏体积要控制）
- ⚠️ 三方的 JS 库只有在**必须且体积小**时才考虑；能原生实现就原生实现（已有先例：用原生 canvas 复刻了 ReactBits 的 Galaxy 点阵背景）
