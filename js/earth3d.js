/* 真实地球 v1：three.js 着色地球 + 昼夜晨昏线 + 城市 + 大圆最短航线（懒加载，离线可用） */
(function (global) {
  var THREE = null, loading = false, pending = [];
  var renderer = null, scene = null, camera = null, earth = null, atmo = null, sunLight = null;
  var gridObj = null, routeObj = null, markerGroup = null;
  var wrap = null, canvas = null, labelBox = null, raf = null, mounted = false;
  var textures = {}, texQueue = 0, texDone = 0;
  var cities = global.CITIES || [];
  var markers = [], labels = [], labelPool = [], geoLabels = [], geoGroup = null, zoneObj = null;
  /* 默认极简：首屏只呈现“课本地球仪”的要素 —— 大洲大洋 + 五带 */
  var GEO = [
    { n: '亚洲', t: '洲', lat: 34, lon: 90 }, { n: '欧洲', t: '洲', lat: 52, lon: 18 },
    { n: '非洲', t: '洲', lat: 5, lon: 20 }, { n: '北美洲', t: '洲', lat: 45, lon: -100 },
    { n: '南美洲', t: '洲', lat: -15, lon: -60 }, { n: '大洋洲', t: '洲', lat: -25, lon: 140 },
    { n: '南极洲', t: '洲', lat: -78, lon: 0 },
    { n: '太平洋', t: '洋', lat: 0, lon: -150 }, { n: '大西洋', t: '洋', lat: 10, lon: -30 },
    { n: '印度洋', t: '洋', lat: -20, lon: 80 }, { n: '北冰洋', t: '洋', lat: 80, lon: 0 }
  ];
  var ZONES = [
    { n: '北极圈 66°34′N', lat: 66.56 }, { n: '北回归线 23°26′N', lat: 23.44 },
    { n: '赤道 0°', lat: 0 }, { n: '南回归线 23°26′S', lat: -23.44 },
    { n: '南极圈 66°34′S', lat: -66.56 }
  ];
  var stars = null;

  var st = {
    yaw: 0.9, pitch: 0.32, dist: 3.1, minD: 1.6, maxD: 6.5,
    hour: null, live: true, auto: true, showLabels: false, showGrid: true,
    showNight: true, showZones: true, showGeo: true, route: null, drag: null, moved: 0, lastT: 0, frame: 0
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

    /* 五带纬线（比普通经纬网更醒目） */
    zoneObj = (function () {
      var pts = [], r = 1.002;
      ZONES.forEach(function (z) {
        var prev = null;
        for (var a = 0; a <= 360; a += 4) {
          var v = latLonVec(z.lat, a, r);
          if (prev) pts.push(prev.clone(), v.clone());
          prev = v;
        }
      });
      var g = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.55 }));
    })();
    zoneObj.visible = st.showZones; earth.add(zoneObj);

    /* 大洲大洋 + 五带文字标注（复用城市标签那套 HTML 投影） */
    geoGroup = new THREE.Group(); earth.add(geoGroup);
    GEO.concat(ZONES.map(function (z) { return { n: z.n, t: '带', lat: z.lat, lon: -35 }; })).forEach(function (g) {
      var o = new THREE.Object3D();
      o.position.copy(latLonVec(g.lat, g.lon, 1.006));
      geoGroup.add(o);
      var el = document.createElement('div');
      el.className = 'e3-lb ' + (g.t === '带' ? 'e3-lb-zone' : 'e3-lb-geo');
      el.textContent = g.n;
      if (labelBox) { labelBox.appendChild(el); labelPool.push(el); }
      geoLabels.push({ el: el, obj: o, grp: g.t === '带' ? 'zone' : 'geo' });
    });

    markerGroup = new THREE.Group(); markerGroup.visible = st.showLabels; earth.add(markerGroup);
    var mg = new THREE.SphereGeometry(0.009, 8, 8);
    var mm = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    cities.forEach(function (c) {
      var m = new THREE.Mesh(mg, mm);
      m.position.copy(latLonVec(c.lat, c.lng, 1.004));
      m.userData.city = c;
      markerGroup.add(m); markers.push(m);
      var el = document.createElement('div');
      el.className = 'e3-lb'; el.textContent = c.name;
      if (labelBox) { labelBox.appendChild(el); labelPool.push(el); labels.push({ el: el, obj: m, grp: 'city' }); }
    });

    bindInput();
    mounted = true;
    st.lastT = 0;
    raf = requestAnimationFrame(loop);
    var sel = document.getElementById('e3From'), sel2 = document.getElementById('e3To');
    if (sel) sel.value = '北京';
    if (sel2) sel2.value = '纽约';
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
    if (st.showLabels || st.showGeo || st.showZones) updateLabels();
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
    var all = labels.concat(geoLabels);
    for (var i = 0; i < all.length; i++) {
      var L = all[i];
      var vis = L.grp === 'city' ? st.showLabels : (L.grp === 'geo' ? st.showGeo : st.showZones);
      if (!vis) { if (L.el.style.display !== 'none') L.el.style.display = 'none'; continue; }
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
    var ptrs = {}, pinch = null;
    function ptrDist() {
      var ks = Object.keys(ptrs); if (ks.length < 2) return 0;
      var a = ptrs[ks[0]], b = ptrs[ks[1]];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    wrap.addEventListener('pointerdown', function (e) {
      wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(ptrs).length >= 2) {
        pinch = { d: ptrDist(), dist: st.dist };   /* 双指：进入捏合模式 */
        st.drag = null;
      } else {
        st.drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
        st.moved = 0;
      }
    });
    wrap.addEventListener('pointermove', function (e) {
      if (ptrs[e.pointerId]) { ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY; }
      if (pinch && Object.keys(ptrs).length >= 2) {
        var d = ptrDist();
        if (d > 8 && pinch.d > 8) st.dist = Math.max(st.minD, Math.min(st.maxD, pinch.dist * (pinch.d / d)));
        st.moved = 99;
        return;
      }
      if (!st.drag || st.drag.id !== e.pointerId) return;
      var dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      st.moved += Math.abs(dx) + Math.abs(dy);
      st.yaw -= dx * 0.006;
      st.pitch = Math.max(-1.25, Math.min(1.25, st.pitch + dy * 0.005));
      st.drag.x = e.clientX; st.drag.y = e.clientY;
    });
    function up(e) {
      delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length < 2) pinch = null;
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
  function toggleGeo() { st.showGeo = !st.showGeo; var b = document.getElementById('e3Geo'); if (b) b.textContent = st.showGeo ? '大洲大洋开' : '大洲大洋关'; updateLabels(); }
  function toggleLabels() { st.showLabels = !st.showLabels; if (markerGroup) markerGroup.visible = st.showLabels; var b = document.getElementById('e3Lbl'); if (b) b.textContent = st.showLabels ? '城市名开' : '城市名关'; if (!st.showLabels) { labels.forEach(function (L) { L.el.style.display = 'none'; }); } }
  function toggleZones() { st.showZones = !st.showZones; if (zoneObj) zoneObj.visible = st.showZones; updateLabels(); var b = document.getElementById('e3Zone'); if (b) b.textContent = st.showZones ? '五带开' : '五带关'; }
  function toggleGrid() { st.showGrid = !st.showGrid; if (gridObj) gridObj.visible = st.showGrid; var b = document.getElementById('e3Grid'); if (b) b.textContent = st.showGrid ? '经纬网开' : '经纬网关'; }
  function toggleNight() { st.showNight = !st.showNight; if (earth) earth.userData.uni.nightOn.value = st.showNight ? 1 : 0; var b = document.getElementById('e3Night'); if (b) b.textContent = st.showNight ? '夜景开' : '夜景关'; }
  function setHour(v) { st.live = false; st.hour = parseFloat(v); setTime(); var b = document.getElementById('e3Live'); if (b) b.className = 'btn sm'; }
  function setLive() { st.live = true; setTime(); var b = document.getElementById('e3Live'); if (b) b.className = 'btn sm primary'; }
  function reset() { st.yaw = 0.9; st.pitch = 0.32; st.dist = 3.1; }
  function resizeEv() { if (mounted) resize(); }

  global.addEventListener('resize', resizeEv);
  global.Earth3D = {
    mount: mount, unmount: unmount, resize: resize, pause: pause, resume: resume,
    toggleAuto: toggleAuto, toggleLabels: toggleLabels, toggleGrid: toggleGrid, toggleZones: toggleZones, toggleGeo: toggleGeo, toggleNight: toggleNight,
    setHour: setHour, setLive: setLive, reset: reset, applyRoute: applyRoute, clearRoute: clearRoute
  };
})(window);
