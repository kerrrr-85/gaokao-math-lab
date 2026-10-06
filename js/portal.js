/* 门户首页（Portal）：天气小部件 + 图标墙 */
(function (global) {
  var ICONS = {
    study: '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5zm0 7.8L4.6 7 12 3.4 19.4 7 12 10.8zM4 11.2V16l8 4 8-4v-4.8l-8 4-8-4z"/></svg>',
    video: '<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm6 3.5v7l6-3.5-6-3.5z"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.7 0 3.2 1 4.2 2.6H7.8C8.8 5 10.3 4 12 4zM4.3 10h3.2c.1-1.2.4-2.3.8-3.2H5.6A7.9 7.9 0 004.3 10zm0 4a7.9 7.9 0 001.3 3.2h2.7c-.4-.9-.7-2-.8-3.2H4.3zm3.2-2H4.3c0-1 .2-2 .5-2.8h2.9c-.1.9-.2 1.8-.2 2.8zm9 0c0-1-.1-1.9-.2-2.8h2.9c.3.8.5 1.8.5 2.8h-3.2zm3.2 2c-.1 1.2-.4 2.3-.8 3.2h2.7A7.9 7.9 0 0019.7 14h-3.2zm-3.4 0c-.1 1.2-.4 2.3-.8 3.2h-3.8c-.4-.9-.7-2-.8-3.2h5.4zm0-2h-5.4c0-1 .3-1.9.8-2.8h3.8c.5.9.8 1.8.8 2.8zm1.6-5.4H16c.4.9.7 2 .8 3.2h-3.2c0-1-.1-2.1-.2-3.2z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 105 14.3l5.3 5.3 1.4-1.4-5.3-5.3A8 8 0 0010 2zm0 3a5 5 0 110 10 5 5 0 010-10z"/></svg>',
    doubao: '<svg viewBox="0 0 24 24"><path d="M7 3h10a4 4 0 014 4v6a4 4 0 01-4 4h-3l-5 4v-4H7a4 4 0 01-4-4V7a4 4 0 014-4zm1 5h8v2H8V8zm0 4h5v2H8v-2z"/></svg>',
    weather: '<svg viewBox="0 0 24 24"><path d="M6 19a4 4 0 010-8 6 6 0 0111.6-1.6A4.5 4.5 0 0117 19H6z"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L18 9.8 14.2 6 3 17.2zM20.7 7.3a1 1 0 000-1.4l-2.6-2.6a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.7z"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M6 2a4 4 0 100 8 4 4 0 000-8zm12 12a4 4 0 100 8 4 4 0 000-8zM8 8l7.2 6.5-1.4 1.5L6.6 9.5 8 8z"/></svg>',
    wrong: '<svg viewBox="0 0 24 24"><path d="M4 3h13a3 3 0 013 3v15l-5-3-5 3-5-3-1 0V3zm3 5h7v2H7V8zm0 4h7v2H7v-2z"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20h3V10H4v10zm6 0h3V4h-3v16zm6 0h3v-7h-3v7z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4c0-.4 0-.9-.1-1.3l2-1.5-2-3.4-2.3 1a9 9 0 00-2.2-1.3L15.9 3h-4l-.4 2.5a9 9 0 00-2.2 1.3l-2.3-1-2 3.4 2 1.5A9 9 0 006.9 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a9 9 0 002.2 1.3l.4 2.5h4l.4-2.5a9 9 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>'
  };
  var TILE_STYLE = {
    practice: 'linear-gradient(135deg,#0d9488,#5eead4)',
    map: 'linear-gradient(135deg,#4f46e5,#818cf8)',
    wrong: 'linear-gradient(135deg,#dc2626,#f87171)',
    stats: 'linear-gradient(135deg,#0891b2,#67e8f9)',
    study: 'linear-gradient(135deg,#0f766e,#2dd4bf)',
    video: 'linear-gradient(135deg,#ec4899,#f472b6)',
    globe: 'linear-gradient(135deg,#2563eb,#38bdf8)',
    search: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    doubao: 'linear-gradient(135deg,#7c3aed,#c084fc)',
    weather: 'linear-gradient(135deg,#06b6d4,#67e8f9)',
    settings: 'linear-gradient(135deg,#475569,#94a3b8)'
  };
  function tile(key, label, href, ext) {
    var a = ext ? '<a class="pt-tile" href="' + href + '" target="_blank" rel="noopener">' : '<a class="pt-tile" href="' + href + '">';
    var bg = TILE_STYLE[key] || TILE_STYLE.study;
    return a + '<span class="tile-badge" style="background:' + bg + '">' + (ICONS[key] || '') + '</span><span class="tlabel">' + label + '</span></a>';
  }
  function streakDays() {
    var days = {};
    Store.get().attempts.forEach(function (a) { var d = new Date(a.createdAt || 0); d.setHours(0, 0, 0, 0); days[d.getTime()] = 1; });
    var n = 0, t = new Date(); t.setHours(0, 0, 0, 0);
    while (days[t.getTime()]) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }
  function avgMastery() {
    var nodes = window.DATA ? DATA.nodes : [], sum = 0;
    nodes.forEach(function (x) { sum += Store.masteryOf(x.id); });
    return nodes.length ? Math.round(sum / nodes.length) : 0;
  }
  function todayCount() {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Store.get().attempts.filter(function (a) { return (a.createdAt || 0) >= t.getTime(); }).length;
  }
  function greeting() { var h = new Date().getHours(); return h < 6 ? '凌晨好' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了'; }
  function dateStr() { var d = new Date(), w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]; return (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + w; }
  function wmoText(c) { var m = {0:'晴',1:'基本晴朗',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'毛毛雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨',81:'阵雨',82:'强阵雨',85:'阵雪',95:'雷阵雨',96:'雷暴',99:'强雷暴'}; return m[c] || '--'; }
  function applyWeather(d) {
    var q = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    q('ptCity', d.city); q('ptDesc', wmoText(d.code)); q('ptTemp', Math.round(d.temp) + '°'); q('ptRange', '今日 ' + Math.round(d.min) + '~' + Math.round(d.max) + '°');
  }
  function loadWeather(force) {
    var wx = ((Store.get().settings || {}).weather || {});
    var city = wx.city || '青树坪', lat = wx.lat, lon = wx.lon;
    applyWeather({ city: city, code: -1, temp: 0, min: 0, max: 0 });
    var c = null; try { c = JSON.parse(localStorage.getItem('gml_weather')); } catch (e) {}
    if (!force && c && c.city === city && Date.now() - c.at < 600000) { applyWeather(c); return; }
    if (lat == null || lon == null) { var t = document.getElementById('ptDesc'); if (t) t.textContent = '未配置坐标'; return; }
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
      .then(function (r) { return r.json(); })
      .then(function (w) { var d = { city: city, at: Date.now(), temp: w.current.temperature_2m, code: w.current.weather_code, max: w.daily.temperature_2m_max[0], min: w.daily.temperature_2m_min[0] }; try { localStorage.setItem('gml_weather', JSON.stringify(d)); } catch (e) {} applyWeather(d); })
      .catch(function () { var t = document.getElementById('ptDesc'); if (t) t.textContent = '天气获取失败'; });
  }
  /* ---------- 门户落地页：浅蓝 · 安静 · 可扩展 ---------- */
  var MENU = [
    ['学习', [
      ['学习台', 'Study', '#/today', 0],
      ['练习', 'Practice', '#/practice', 0],
      ['知识图谱', 'Map', '#/map', 0],
      ['错题本', 'Wrong', '#/wrong', 0],
      ['统计', 'Stats', '#/stats', 0]
    ]],
    ['工具', [
      ['搜索', 'Search', '#/search', 0],
      ['地球', 'Globe', '#/globe', 0]
    ]],
    ['娱乐', [
      ['B站视频', 'Bilibili', '#/video', 0],
      ['豆包', 'Doubao', 'https://www.doubao.com/chat/', 1]
    ]]
  ];
  var fxRaf = null, fxCanvas = null, fxCtx = null, fxDots = [], fxW = 0, fxH = 0, fxLast = 0;
  var fxIo = null, fxTimer = null;

  function isNight() {
    var q = String(location.search || '');
    if (q.indexOf('night=1') >= 0) return true;
    if (q.indexOf('night=0') >= 0) return false;
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    return h >= 23.5 || h < 6;
  }
  function isLow() { return !!(global.PERF && global.PERF.low); }
  function reduceMotion() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---------- 隐藏彩蛋：晕染 → 空白特殊界面 ---------- */
  var inkEl = null, inkTxt = null, roomEl = null, inkHold = null, inkReady = false, roomOn = false;

  function inkBuild() {
    if (inkEl) return;
    inkEl = document.createElement('div');
    inkEl.className = 'ink-veil';
    inkEl.innerHTML = '<div class="ink-grain"></div><div class="ink-txt" id="inkTxt"><span>我</span><span>在</span><span>呢</span></div>';
    document.body.appendChild(inkEl);
    inkTxt = inkEl.querySelector('#inkTxt');
    roomEl = document.createElement('div');
    roomEl.className = 'ink-room';
    roomEl.innerHTML = '<div class="ink-room-body" id="roomBody"></div>';
    document.body.appendChild(roomEl);
    var lastTap = 0;
    roomEl.addEventListener('pointerup', function () {
      var now = Date.now();
      if (now - lastTap < 380) inkClose();
      lastTap = now;
    });
    if (!global.__inkKey) { global.__inkKey = 1; document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (roomOn || inkReady)) inkClose(); }); }
  }
  function inkOpen(e) {
    inkBuild();
    var x = 50, y = 50;
    if (e && e.clientX) { x = (e.clientX / global.innerWidth) * 100; y = (e.clientY / global.innerHeight) * 100; }
    inkEl.style.setProperty('--x', x.toFixed(2) + '%');
    inkEl.style.setProperty('--y', y.toFixed(2) + '%');
    inkEl.classList.remove('room-open');
    inkEl.classList.add('on');
    roomOn = false; inkReady = false;
    setTimeout(function () {
      if (!inkEl || !inkEl.classList.contains('on')) return;
      inkEl.classList.add('lit'); inkReady = true;
      inkHold = setTimeout(function () { inkHold = null; roomOpen(); }, 800);
    }, 520);
  }
  function inkHoldStop() { if (inkHold) { clearTimeout(inkHold); inkHold = null; } }
  /* ============================================================
     特殊界面内容（以后改这里就行）
     - 铭牌上的字：mark / word / line / sub / foot 五个变量
     - 想换成别的东西，直接替换 roomHTML 里的结构即可
     ============================================================ */
  var ROOM = {
    mark: '在',                 // 方块里的标记字
    word: '我在呢',              // 展开后的主字
    line: '函 数 · 三 角 · 数 列', // 展开后的小字
    sub: 'STUDY DESK',          // 常驻小注
    foot: 'GAOKAO MATH LAB'     // 展开后底部铭文
  };
  function roomHTML() {
    return '<div class="irm-card" id="irmCard">' +
      '<div class="irm-border"></div>' +
      '<div class="irm-content">' +
        '<div class="irm-logo"><span class="irm-logo1">' + ROOM.mark + '</span>' +
        '<span class="irm-logo2">' + ROOM.word + '</span><span class="irm-trail"></span></div>' +
        '<div class="irm-under">' + ROOM.line + '</div>' +
      '</div>' +
      '<div class="irm-sub">' + ROOM.sub + '</div>' +
      '<div class="irm-foot">' + ROOM.foot + '</div>' +
    '</div>';
  }
  function roomOpen() {
    if (!roomEl || roomOn) return;
    roomOn = true;
    inkEl.classList.add('room-open');
    roomEl.classList.add('on');
    var b = document.getElementById('roomBody');
    if (b) {
      b.innerHTML = roomHTML();
      var card = document.getElementById('irmCard');
      if (card) {
        var isTouch = false; try { isTouch = matchMedia('(hover:none)').matches; } catch (e) {}
        if (isTouch) {
          card.addEventListener('click', function () { card.classList.toggle('open'); });
        } else {
          card.addEventListener('mouseenter', function () { card.classList.add('open'); });
          card.addEventListener('mouseleave', function () { card.classList.remove('open'); });
          card.addEventListener('click', function () { card.classList.toggle('open'); });
        }
      }
    }
  }
  function inkClose() {
    inkHoldStop();
    roomOn = false; inkReady = false;
    if (roomEl) roomEl.classList.remove('on');
    if (inkEl) { inkEl.classList.remove('lit'); inkEl.classList.remove('room-open'); inkEl.classList.remove('on'); }
  }
  function inkDestroy() {
    inkClose();
    if (inkEl && inkEl.parentNode) inkEl.parentNode.removeChild(inkEl);
    if (roomEl && roomEl.parentNode) roomEl.parentNode.removeChild(roomEl);
    inkEl = null; roomEl = null; inkTxt = null;
  }

  function gridHTML() {
    var cells = [
      ['study', '学习台', '#/today', 0],
      ['practice', '练习', '#/practice', 0],
      ['map', '知识图谱', '#/map', 0],
      ['wrong', '错题本', '#/wrong', 0],
      ['stats', '统计', '#/stats', 0],
      ['search', '搜索', '#/search', 0],
      ['globe', '地球', '#/globe', 0],
      ['video', 'B站视频', '#/video', 0],
      ['doubao', '豆包', 'https://www.doubao.com/chat/', 1]
    ];
    return cells.map(function (c) { return tile(c[0], c[1], c[2], c[3]); }).join('');
  }

  function renderPortal() {
    var v = document.getElementById('view');
    var night = isNight();
    document.body.classList.add('pt-full');
    v.innerHTML =
      '<div class="pt-landing' + (night ? ' is-night' : '') + '" id="ptLanding">' +
        '<canvas class="pt-fx" id="ptFx" aria-hidden="true"></canvas>' +
        '<div class="pt-grain" aria-hidden="true"></div>' +
        '<canvas class="galaxy-canvas" id="galaxyCanvas" style="display:none" aria-hidden="true"></canvas>' +
        '<header class="pt-hero">' +
          '<div class="pt-hero-copy">' +
            '<p class="pt-eyebrow pt-reveal">' + dateStr() + ' · 青树坪</p>' +
            '<h1 class="pt-title" aria-label="我在呢"><span style="--i:0">我</span><span style="--i:1">在</span><span style="--i:2">呢</span></h1>' +
            '<p class="pt-lede pt-reveal" id="ptTrigger" title="">今天想从哪儿开始？</p>' +
            '<button class="pt-weather pt-reveal" onclick="Portal.loadWeather(true)" title="点一下刷新天气">' +
              '<span class="pt-temp" id="ptTemp">--°</span>' +
              '<span class="pt-wxmeta"><b id="ptCity">青树坪</b><i id="ptDesc">加载中…</i></span>' +
              '<span class="pt-wxrange" id="ptRange">今日 --~--°</span>' +
            '</button>' +
          '</div>' +
          '<figure class="pt-hero-art pt-reveal"><img src="./assets/ink-hero.jpg?v=66" alt="" decoding="async"></figure>' +
        '</header>' +
        '<div class="pt-grid-wrap pt-reveal"><div class="pt-grid">' + gridHTML() + '</div></div>' +
        '<footer class="pt-foot pt-reveal">' +
          '<span class="pt-more">更多模块 · 陆续开放</span>' +
          '<span class="pt-hint" id="ptHint">' + (night ? '夜深了 · 星空已亮' : '23:30 之后，这里会亮起星空') + '</span>' +
        '</footer>' +
      '</div>';
    loadWeather(false);
    applyNight(night);
    startFx();
  }

  function applyNight(night) {
    var land = document.getElementById('ptLanding');
    if (land) land.classList.toggle('is-night', night);
    document.body.classList.toggle('portal-dark', night);
    var gc = document.getElementById('galaxyCanvas');
    if (global.Galaxy && gc) {
      if (night) { gc.style.display = ''; global.Galaxy.mount(gc); }
      else { global.Galaxy.stop(); gc.style.display = 'none'; }
    }
  }
  function applyNightNow() {
    var n = isNight();
    applyNight(n);
    var h = document.getElementById('ptHint');
    if (h) h.textContent = n ? '夜深了 · 星空已亮' : '23:30 之后，这里会亮起星空';
  }

  function fxBuild() {
    var n = isLow() ? 26 : 58;
    fxDots = [];
    for (var i = 0; i < n; i++) {
      var k = i % 9 === 0 ? 2 : (i % 4 === 0 ? 1 : 0);
      fxDots.push({
        x: Math.random() * fxW, y: Math.random() * fxH,
        r: k === 2 ? 9 + Math.random() * 13 : (k === 1 ? 1.2 + Math.random() * 1.1 : 1.6 + Math.random() * 1.9),
        vx: (Math.random() - 0.5) * 0.16, vy: -(0.05 + Math.random() * 0.20),
        a: k === 2 ? 0.05 + Math.random() * 0.05 : (k === 1 ? 0.24 + Math.random() * 0.22 : 0.10 + Math.random() * 0.14),
        k: k, ph: Math.random() * 6.283
      });
    }
  }
  function fxResize() {
    if (!fxCanvas) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 1.6);
    fxW = fxCanvas.width = Math.round(fxCanvas.clientWidth * dpr);
    fxH = fxCanvas.height = Math.round(fxCanvas.clientHeight * dpr);
    fxBuild();
  }
  function fxDraw(t) {
    if (!fxCtx) return;
    fxCtx.clearRect(0, 0, fxW, fxH);
    for (var i = 0; i < fxDots.length; i++) {
      var d = fxDots[i];
      d.x += d.vx; d.y += d.vy;
      if (d.y < -30) { d.y = fxH + 20; d.x = Math.random() * fxW; }
      if (d.x < -30) d.x = fxW + 20; else if (d.x > fxW + 30) d.x = -20;
      var tw = d.k === 2 ? 1 : 0.72 + 0.28 * Math.sin(t * 0.0009 + d.ph);
      fxCtx.beginPath();
      fxCtx.arc(d.x, d.y, d.r, 0, 6.2832);
      fxCtx.fillStyle = d.k === 2 ? 'rgba(44,110,143,' + d.a + ')'
        : d.k === 1 ? 'rgba(191,160,106,' + (d.a * tw).toFixed(3) + ')'
        : 'rgba(27,36,64,' + (d.a * tw).toFixed(3) + ')';
      fxCtx.fill();
    }
  }
  function fxLoop(ts) {
    fxRaf = requestAnimationFrame(fxLoop);
    var gap = isLow() ? 33 : 22;
    if (ts && fxLast && ts - fxLast < gap) return;
    fxLast = ts || 0;
    fxDraw(ts || 0);
  }
  function startFx() {
    if (global.Portal && Portal.stopFx) Portal.stopFx();
    fxCanvas = document.getElementById('ptFx');
    if (!fxCanvas) return;
    fxCtx = fxCanvas.getContext('2d');
    fxResize();
    fxIo = null;
    var els = document.querySelectorAll('.pt-reveal');
    if (reduceMotion() || !('IntersectionObserver' in global)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); });
    } else {
      fxIo = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); fxIo.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      Array.prototype.forEach.call(els, function (e) { fxIo.observe(e); });
    }
    global.addEventListener('resize', fxResize);
    var _trig = document.getElementById('ptTrigger');
    if (_trig) _trig.addEventListener('click', function (ev) { ev.preventDefault(); inkOpen(ev); });
    setTimeout(function () {
      var vh = global.innerHeight || 800;
      Array.prototype.forEach.call(document.querySelectorAll('.pt-reveal:not(.in)'), function (e) {
        if (e.getBoundingClientRect().top < vh) e.classList.add('in');
      });
    }, 900);
    if (!reduceMotion()) fxRaf = requestAnimationFrame(fxLoop); else fxDraw(0);
    fxTimer = setInterval(applyNightNow, 60000);
  }
  function fxStop() {
    inkDestroy();
    if (fxRaf) { cancelAnimationFrame(fxRaf); fxRaf = null; }
    if (fxTimer) { clearInterval(fxTimer); fxTimer = null; }
    if (fxIo) { fxIo.disconnect(); fxIo = null; }
    global.removeEventListener('resize', fxResize);
    fxCtx = null; fxCanvas = null; fxDots = [];
  }

  function renderVideo() {
    var v = document.getElementById('view');
    var list = global.BILI || [];
    var cards = list.map(function (b) {
      return '<div class="card" style="padding:0;overflow:hidden;box-shadow:var(--sh1)">' +
        '<div class="bili-cover" id="cv_' + b.bvid + '"><span>加载封面…</span></div>' +
        '<div style="padding:12px 14px"><b>' + b.title + '</b><div class="small muted" style="margin-top:2px">' + b.bvid + '</div>' +
        '<div class="row" style="margin-top:8px"><button class="btn sm primary" onclick="Portal.play(\'' + b.bvid + '\')">▶ 站内播放</button><a class="btn sm" href="https://www.bilibili.com/video/' + b.bvid + '" target="_blank" rel="noopener">去B站</a></div>' +
        '<div id="pl_' + b.bvid + '"></div></div></div>';
    }).join('');
    v.innerHTML = '<div class="phead"><span class="ico">📺</span><div class="grow"><h2>B站视频区</h2><p>收藏 ' + list.length + ' 个 · 点「站内播放」直接看</p></div></div>' +
      '<div class="card elev2"><div class="row"><input type="text" id="biliQ" placeholder="搜 B站，如：导数 压轴 技巧" style="flex:1"><button class="btn primary" onclick="Portal.searchBili()">搜索</button></div></div>' +
      (cards ? '<div class="grid2">' + cards + '</div>' : '<div class="card muted">还没有收藏视频，把 BV 号发我就能加。</div>');
    list.forEach(function (b) {
      fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + b.bvid)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var box = document.getElementById('cv_' + b.bvid); if (!box) return;
          if (j && j.code === 0 && j.data && j.data.pic) { box.style.backgroundImage = 'url(' + j.data.pic + ')'; box.innerHTML = ''; }
          else { box.innerHTML = '<span style="opacity:.6">B站封面不可用</span>'; }
        })
        .catch(function () { var box2 = document.getElementById('cv_' + b.bvid); if (box2) box2.innerHTML = '<span style="opacity:.6">封面需联网</span>'; });
    });
    if (window.Anim && Anim.ok()) Anim.enter('.card', 45);
  }
  function play(bvid, title) {
    var oldm = document.getElementById('vidModal'); if (oldm && oldm.parentNode) oldm.parentNode.removeChild(oldm);
    var m = document.createElement('div'); m.id = 'vidModal'; m.className = 'modal';
    m.innerHTML = '<div class="modalbox" style="max-width:940px"><div class="row"><b class="grow">' + (title || bvid) + '</b><button class="btn sm" onclick="Portal.closeVideo()">关闭</button></div>' +
      '<iframe class="bili-frame" style="margin-top:10px" src="https://player.bilibili.com/player.html?bvid=' + bvid + '&page=1&autoplay=1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe></div>';
    m.addEventListener('click', function (e) { if (e.target === m) closeVideo(); });
    document.body.appendChild(m);
    try { localStorage.setItem('gml_last_bili', bvid); } catch (e) {}
  }
  function closeVideo() { var m = document.getElementById('vidModal'); if (m && m.parentNode) m.parentNode.removeChild(m); }
  function searchBili() {
    var q = (document.getElementById('biliQ') || {}).value || '';
    if (!q) return;
    window.open('https://search.bilibili.com/all?keyword=' + encodeURIComponent(q), '_blank');
  }
  global.Portal = { inkOpen: inkOpen, inkClose: inkClose, roomOpen: roomOpen, isNight: isNight, stopFx: fxStop, refreshNight: applyNightNow, closeVideo: closeVideo, openModule: function (m) { App.openModule(m); }, renderPortal: renderPortal, renderVideo: renderVideo, loadWeather: loadWeather, play: play, searchBili: searchBili };
})(window);
