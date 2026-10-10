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
    board: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20h1.6a1.9 1.9 0 001.5-3.1c-.5-.6-.1-1.6.7-1.6H18A4 4 0 0022 13c0-6.1-4.5-11-10-11zM6.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>',
    solid: '<svg viewBox="0 0 24 24"><path d="M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7 3.5-7 3.5-7-3.5 7-3.5zM4 9.2l7 3.5v6.9l-7-3.5V9.2zm9 10.4v-6.9l7-3.5v6.9l-7 3.5z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4c0-.4 0-.9-.1-1.3l2-1.5-2-3.4-2.3 1a9 9 0 00-2.2-1.3L15.9 3h-4l-.4 2.5a9 9 0 00-2.2 1.3l-2.3-1-2 3.4 2 1.5A9 9 0 006.9 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a9 9 0 002.2 1.3l.4 2.5h4l.4-2.5a9 9 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>'
  };
  var TILE_STYLE = {
    practice: 'linear-gradient(135deg,#0d9488,#5eead4)',
    map: 'linear-gradient(135deg,#4f46e5,#818cf8)',
    wrong: 'linear-gradient(135deg,#dc2626,#f87171)',
    board: 'linear-gradient(135deg,#6366f1,#22d3ee)',
    solid: 'linear-gradient(135deg,#3730a3,#60a5fa)',
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
    q('ptCity', d.city); q('ptDesc', wmoText(d.code)); q('ptTemp', Math.round(d.temp) + '°'); q('ptRange', '今日 ' + Math.round(d.min) + '~' + Math.round(d.max) + '°' + (d.feels != null ? ' · 体感 ' + Math.round(d.feels) + '°' : '')); q('ptWOutfit', (global.Outfit && Outfit.tip) ? Outfit.tip(d) : ((global.Outfit && Outfit.short) ? Outfit.short(d) : ''));
    if (d.code >= 0 && global.PortalPlan && PortalPlan.onWeather) PortalPlan.onWeather(d);
  }
  function loadWeather(force) {
    var wx = ((Store.get().settings || {}).weather || {});
    var city = wx.city || '青树坪', lat = wx.lat, lon = wx.lon;
    applyWeather({ city: city, code: -1, temp: 0, min: 0, max: 0 });
    var c = null; try { c = JSON.parse(localStorage.getItem('gml_weather')); } catch (e) {}
    if (!force && c && c.city === city && Date.now() - c.at < 600000) { applyWeather(c); return; }
    if (lat == null || lon == null) { var t = document.getElementById('ptDesc'); if (t) t.textContent = '未配置坐标'; return; }
        fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=1')
      .then(function (r) { return r.json(); })
      .then(function (w) {
        var cur = w.current || {}, day = w.daily || {};
        var first = function (a) { return (a && a.length) ? a[0] : null; };
        var d = {
          city: city, at: Date.now(),
          temp: cur.temperature_2m, code: cur.weather_code,
          feels: cur.apparent_temperature, hum: cur.relative_humidity_2m, wind: cur.wind_speed_10m,
          max: first(day.temperature_2m_max), min: first(day.temperature_2m_min),
          rain: first(day.precipitation_probability_max), uv: first(day.uv_index_max)
        };
        try { localStorage.setItem('gml_weather', JSON.stringify(d)); } catch (e) {}
        applyWeather(d);
      })
      .catch(function () { var t = document.getElementById('ptDesc'); if (t) t.textContent = '天气获取失败'; });  }
  /* ---------- 门户落地页：浅蓝 · 安静 · 可扩展 ---------- */
  var MENU = [
    ['学习', [
      ['学习台', 'Study', '#/today', 0],
      ['练习', 'Practice', '#/practice', 0],
      ['知识图谱', 'Map', '#/map', 0],
      ['错题本', 'Wrong', '#/wrong', 0],
      ['白板', 'Board', 'https://drawnix.com', 1]
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
  var vidSubject = 'math';
  var WATCH_KEY = 'gml_video_watched_v1';
  function watchedMap() { try { var m = JSON.parse(localStorage.getItem(WATCH_KEY)); return m && typeof m === 'object' ? m : {}; } catch (e) { return {}; } }
  function isWatched(id) { return !!watchedMap()[id]; }
  function saveWatched(m) { try { localStorage.setItem(WATCH_KEY, JSON.stringify(m)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function toggleWatched(id) { var m = watchedMap(); if (m[id]) delete m[id]; else m[id] = Date.now(); saveWatched(m); var btn = document.getElementById('vidWatchBtn'); if (btn) btn.textContent = m[id] ? '取消已看' : '标记看完'; renderVideo(); }

  function starryMode() {
    var p = ((Store.get().settings || {}).portal || {});
    return p.starry === 'on' || p.starry === 'off' ? p.starry : 'auto';
  }
  function isNight() {
    var q = String(location.search || '');
    if (q.indexOf('night=1') >= 0) return true;
    if (q.indexOf('night=0') >= 0) return false;
    var m = starryMode();
    if (m === 'on') return true;
    if (m === 'off') return false;
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
      if (now - lastTap < 380 && !(global.EggGallery && global.EggGallery.isOpen())) inkClose();
      lastTap = now;
    });
    if (!global.__inkKey) { global.__inkKey = 1; document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (roomOn || inkReady)) inkClose(); }); }
    if (!global.__lanyardMsg) { global.__lanyardMsg = 1; global.addEventListener('message', function (e) { if (!e.data) return; if (e.data.type === 'egg-lanyard-open') { var b = document.getElementById('roomBody'); if (b && global.EggGallery) global.EggGallery.open(b); } else if (e.data.type === 'egg-lanyard-close') { closeLanyard(); } }); }
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
    line: '宝 宝 发 现 彩 蛋 了', // 展开后的小字
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
      b.innerHTML = roomHTML() + '<div class="irm-hint">轻触中心 · 展开「我在呢」</div>';
      var card = document.getElementById('irmCard');
      if (card) {
        card.addEventListener('pointerup', function (e) { e.stopPropagation(); });
        var isTouch = false; try { isTouch = matchMedia('(hover:none)').matches; } catch (e) {}
        if (isTouch) {
          card.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!card.classList.contains('open')) {
              card.classList.add('open');
              var hint = document.querySelector('.irm-hint'); if (hint) hint.textContent = '再点一下 · 进入挂绳空间';
              card.setAttribute('data-ready-at', String(Date.now() + 1000));
              return;
            }
            if (Date.now() < Number(card.getAttribute('data-ready-at') || 0)) return;
            openLanyard();
          });
        } else {
          card.addEventListener('mouseenter', function () { card.classList.add('open'); });
          card.addEventListener('mouseleave', function () { card.classList.remove('open'); });
          card.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!card.classList.contains('open')) {
              card.classList.add('open');
              var hint = document.querySelector('.irm-hint'); if (hint) hint.textContent = '再点一下 · 进入挂绳空间';
              card.setAttribute('data-ready-at', String(Date.now() + 1000));
              return;
            }
            if (Date.now() < Number(card.getAttribute('data-ready-at') || 0)) return;
            openLanyard();
          });
        }
      }
    }
  }
  function openLanyard() {
    var body = document.getElementById('roomBody'); if (!body) return;
    var old = document.getElementById('irmLanyard'); if (old) { old.classList.add('on'); return; }
    var box = document.createElement('div'); box.id = 'irmLanyard'; box.className = 'irm-lanyard';
    box.innerHTML = '<iframe src="./lanyard.html" title="我们的云空间挂绳卡" loading="lazy" allow="fullscreen"></iframe><button type="button" class="irm-lanyard__close" onclick="Portal.closeLanyard()">返回</button>';
    body.appendChild(box); requestAnimationFrame(function () { box.classList.add('on'); });
  }
  function closeLanyard() {
    var box = document.getElementById('irmLanyard'); if (!box) return;
    box.classList.remove('on');
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 420);
  }
  function inkClose() {
    if (global.EggGallery) global.EggGallery.close();
    closeLanyard();
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
      ['board', '白板', 'https://drawnix.com', 1],
      ['search', '搜索', '#/search', 0],
      ['globe', '地球', '#/globe', 0],
      ['solid', '立体几何', 'https://www.geogebra.org/3d', 1],
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
            '<div class="pt-quickrow pt-reveal">' +
              '<button class="pt-pcard" id="ptWCard" type="button" onclick="Outfit.open()" title="点一下看详细穿衣建议">' +
                '<svg class="pt-psprite" aria-hidden="true" focusable="false"><defs><filter id="ptWNoise" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="turbulence" baseFrequency="1.2" numOctaves="2" seed="1" stitchTiles="stitch" result="ptTurb"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="ptTurb" scale="0" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter></defs></svg>' +
                '<span class="pt-pblob" aria-hidden="true"></span>' +
                '<span class="pt-ptitle" id="ptTemp">--°</span>' +
                '<span class="pt-pmeta"><span class="pt-prow"><b id="ptCity">青树坪</b><i id="ptDesc">加载中…</i></span><span class="pt-prow"><i id="ptRange">今日 --~--°</i></span></span>' +
                '<span class="pt-pdesc"><b id="ptWOutfit">正在读取穿衣建议…</b><em>点开看详细穿衣建议</em></span>' +
              '</button>' +
              '<button class="pt-plan-open" type="button" onclick="PortalPlan.open()" title="打开今日计划"><b id="ptPlanDays">--</b><small>天后高考 · 今日计划</small></button>' +
            '</div>' +
          '</div>' +
          '<figure class="pt-hero-art pt-reveal"><img src="./assets/ink-hero.jpg?v=77" alt="" decoding="async"></figure>' +
        '</header>' +
        '<div class="pt-grid-wrap pt-reveal"><div class="pt-grid">' + gridHTML() + '</div></div>' +
        '<footer class="pt-foot pt-reveal">' +
          '<span class="pt-foot-actions"><span class="pt-more">更多模块 · 陆续开放</span>' +
          nightSegHTML() + '<button class="pt-update" type="button" onclick="App.forceUpdate()">强制更新</button></span>' +
          '<span class="pt-hint" id="ptHint">' + (night ? '夜深了 · 星空已亮' : '23:30 之后，这里会亮起星空') + '</span>' +
        '</footer>' +
      '</div>';
    loadWeather(false);
    applyNight(night);
    syncStarryUI();
    tuneWeatherCard();
    startFx();
    if (global.PortalPlan && PortalPlan.mount) PortalPlan.mount();
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
  function nightSegHTML() {
    var m = starryMode();
    var ic = {
      auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2l2.3 6.6 6.6 2.3-6.6 2.3L12 20l-2.3-6.6L3.1 11l6.6-2.3z"/></svg>',
      off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zm0 2.6a7 7 0 1 1 0 14 7 7 0 0 1 0-14z"/><rect x="4.4" y="10.9" width="15.2" height="2.2" rx="1.1" transform="rotate(45 12 12)"/></svg>'
    };
    var opts = [['auto', '自动'], ['on', '常亮'], ['off', '关闭']];
    var html = '<div class="radio-inputs" role="radiogroup" aria-label="星空显示方式">';
    for (var i = 0; i < opts.length; i++) {
      var k = opts[i][0];
      html += '<label><input class="radio-input" type="radio" name="ptNight" value="' + k + '"' + (k === m ? ' checked' : '') + ' onchange="Portal.setNightMode(\'' + k + '\')">' +
        '<span class="radio-tile"><span class="radio-icon">' + ic[k] + '</span><span class="radio-label">' + opts[i][1] + '</span></span></label>';
    }
    return html + '</div>';
  }  function starryHint(n) {
    var m = starryMode();
    if (m === 'on') return '星空：常亮 · 手动设置';
    if (m === 'off') return '星空：关闭 · 手动设置';
    return n ? '星空：自动 · 已亮（23:30-06:00）' : '23:30 后自动亮起 · 也可手动常亮';
  }
  function syncStarryUI() {
    var n = isNight();
    var m = starryMode();
    var ins = document.querySelectorAll('.radio-inputs .radio-input');
    for (var i = 0; i < ins.length; i++) ins[i].checked = (ins[i].value === m);
    var h = document.getElementById('ptHint');
    if (h) h.textContent = starryHint(n);
  }  function applyNightNow() {
    applyNight(isNight());
    syncStarryUI();
  }
  function setNightMode(mode) {
    if (mode !== 'on' && mode !== 'off') mode = 'auto';
    var st = Store.get().settings;
    st.portal = st.portal || {};
    st.portal.starry = mode;
    Store.save();
    if (document.getElementById('ptLanding')) applyNightNow();
  }
  function cycleNightMode() {
    var m = starryMode();
    setNightMode(m === 'auto' ? 'on' : m === 'on' ? 'off' : 'auto');
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
    var SUBJECTS = {
      math: { label: '数学', data: 'BILI', order: ['函数与导数', '圆锥曲线', '数列', '立体几何', '三角与解三角形', '概率统计', '不等式', '直线与圆', '总复习'] },
      phy: { label: '物理', data: 'BILI_PHY', order: ['基础', '一轮', '力学', '电磁', '动量', '实验', '选修', '压轴', '方法', '真题', '资讯'] },
      bio: { label: '生物', data: 'BILI_BIO', order: ['基础', '一轮', '方法', '细胞', '代谢', '遗传', '稳态', '生态', '基工', '实验', '冲刺', '真题', '动画'] }
    };
    var subject = SUBJECTS[vidSubject] || SUBJECTS.math;
    var list = global[subject.data] || [];
    var ORDER = subject.order;
    var groups = {};
    list.forEach(function (b) { var k = b.tag || '未分类'; (groups[k] = groups[k] || []).push(b); });
    var keys = ORDER.filter(function (k) { return groups[k] && groups[k].length; });
    Object.keys(groups).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    function fv(n) { n = n || 0; return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n); }
    function fd(s) { s = s || 0; return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function card(b) {
      var ttl = String(b.title || '').replace(/'/g, '');
      var watched = isWatched(b.bvid);
      var go = 'https://www.bilibili.com/video/' + b.bvid;
      var mm = (b.parts || 1) > 1 ? '<span class="vcard__parts">合集 ' + b.parts + ' 集</span>' : '';
      return '<article class="vcard' + (watched ? ' watched' : '') + '" onclick="Portal.play(\'' + b.bvid + '\',\'' + ttl + '\')">' +
        '<a class="vcard__go" href="' + go + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">去B站看 ↗</a>' + mm +
        '<div class="vcard__view" style="background-image:url(\'' + (b.cover || '') + '\')">' +
          '<div class="vcard__badges"><span class="vcard__len">' + fd(b.dur) + '</span>' +
          (watched ? '<span class="vcard__done">✓ 已看完</span>' : '') +
          '<span class="vcard__play">▶</span><span class="vcard__prev">站内试看·去B站选集</span></div></div>' +
        '<div class="vcard__content"><div class="vcard__name">' + (b.title || '') + '</div>' +
          '<div class="vcard__data"><div class="vcard__img">' + String(b.up || '?').slice(0, 1) + '</div>' +
          '<div class="vcard__text"><span class="vcard__up">' + (b.up || '') + '</span>' +
          '<span class="vcard__sub"><span>' + fv(b.views) + '播放</span><span>' + fd(b.dur) + '</span></span>' +
          '</div></div></div></article>';
    }
    var html = '<div class="phead"><span class="ico">📺</span><div class="grow"><h2>视频 · ' + subject.label + '</h2><p>共 ' + list.length + ' 条 · 按专题分板块 · 精选优先，备选按需展开</p></div></div>';
    html += '<div class="card tight" style="margin-bottom:12px"><div class="row"><input type="text" id="biliQ" placeholder="搜 B站（新标签打开）" style="flex:1">' +
      '<button class="btn sm primary" onclick="Portal.searchBili()">去 B站搜</button></div>' +
      '<div class="row vsubs">' +
        ['math', 'phy', 'bio'].map(function (s) {
          var sub = SUBJECTS[s];
          return '<button class="chip vsub' + (vidSubject === s ? ' on' : '') + '" onclick="Portal.videoSubject(\'' + s + '\')">' + sub.label + ' <b>' + (global[sub.data] || []).length + '</b></button>';
        }).join('') +
        '<button class="chip vsub' + (html5On() ? ' on' : '') + '" onclick="Portal.toggleHtml5()">HTML5 2× ' + (html5On() ? '开' : '关') + '</button>' +
      '</div>' +
      '<div class="row" style="margin-top:10px">' + keys.map(function (k, n) {
        return '<button class="chip vtag' + (n === 0 ? ' on' : '') + '" onclick="Portal.videoTag(\'' + k + '\')">' + k + ' <b>' + groups[k].length + '</b></button>';
      }).join('') + '</div></div>';
    keys.forEach(function (k, n) {
      var main = groups[k].filter(function (b) { return (b.tier || 'main') !== 'more'; });
      var more = groups[k].filter(function (b) { return b.tier === 'more'; });
      if (!main.length) { main = more; more = []; }
      html += '<section class="vsec" data-tag="' + k + '" style="display:' + (n === 0 ? 'block' : 'none') + '">' +
        '<div class="vsec__head"><span>' + k + '</span><span class="muted">精选 ' + main.length + ' 条' + (more.length ? ' · 备选 ' + more.length + ' 条' : '') + '</span></div>' +
        '<div class="vrail">' + main.map(card).join('') + '</div>';
      if (more.length) {
        html += '<details class="vmore"><summary>展开备选 · ' + more.length + ' 条 <span>内容有重复或非必需，按需查看</span></summary>' +
          '<div class="vrail vrail--more">' + more.map(card).join('') + '</div></details>';
      }
      html += '</section>';
    });
    v.innerHTML = html;
  }
  function videoTag(k) {
    Array.prototype.forEach.call(document.querySelectorAll('.vsec'), function (s) {
      s.style.display = s.getAttribute('data-tag') === k ? 'block' : 'none';
    });
    Array.prototype.forEach.call(document.querySelectorAll('.vtag'), function (b) {
      b.classList.toggle('on', b.textContent.indexOf(k) === 0);
    });
    window.scrollTo(0, 0);
  }
  function videoSubject(s) {
    vidSubject = ['math', 'phy', 'bio'].indexOf(s) >= 0 ? s : 'math';
    renderVideo();
  }
  var BILI_RESOLVER = 'https://api.injahow.cn/bparse/';
  function html5On() { try { return localStorage.getItem('gml_html5_mode') !== '0'; } catch (e) { return true; } }
  function setHtml5Mode(on) { try { localStorage.setItem('gml_html5_mode', on ? '1' : '0'); } catch (e) {} }
  function html5Rate() { try { var r = parseFloat(localStorage.getItem('gml_html5_rate') || '1'); return r >= 0.25 && r <= 4 ? r : 1; } catch (e) { return 1; } }
  function setHtml5Rate(r) { try { localStorage.setItem('gml_html5_rate', String(r)); } catch (e) {} }
  function speedText(r) { r = Number(r || 1); return (r % 1 ? r.toFixed(2) : r.toFixed(1)) + '×'; }
  function cycleSpeed() { var rates = [1, 1.25, 1.5, 2]; var i = rates.indexOf(html5Rate()); var r = rates[(i + 1) % rates.length]; setHtml5Rate(r); var v = document.getElementById('biliVideo'); if (v) v.playbackRate = r; var b = document.getElementById('speedBtn'); if (b) b.textContent = speedText(r); }
  function resolverUrl(bvid, p) { return BILI_RESOLVER + '?bv=' + encodeURIComponent(bvid) + '&p=' + p + '&q=32&format=mp4&otype=json'; }
  function fallbackIframe(bvid, p, msg) {
    var box = document.getElementById('biliPlayerBox'); if (!box) return;
    p = Math.max(1, parseInt(p || 1, 10) || 1);
    box.innerHTML = '<iframe id="vidFrame" data-bv="' + bvid + '" data-p="' + p + '" class="bili-frame" style="margin-top:10px" src="https://player.bilibili.com/player.html?bvid=' + bvid + '&p=' + p + '&page=' + p + '&autoplay=1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>';
    var s = document.getElementById('html5Status'); if (s) s.textContent = msg || '已切换 B站原版播放器';
  }
  function bindHtml5Speed(v) {
    var shell = document.getElementById('html5Shell'); if (!shell || !v) return;
    var timer = null, active = false, prev = html5Rate();
    function clear() { if (timer) clearTimeout(timer); timer = null; }
    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      clear(); active = false; prev = v.playbackRate || html5Rate();
      timer = setTimeout(function () { active = true; v.playbackRate = 2; shell.classList.add('speedup'); }, 420);
    }
    function up() { clear(); if (active) { v.playbackRate = prev; shell.classList.remove('speedup'); active = false; } }
    shell.addEventListener('pointerdown', down);
    shell.addEventListener('pointerup', up);
    shell.addEventListener('pointercancel', up);
    shell.addEventListener('pointerleave', up);
  }
  function loadHtml5(bvid, p) {
    var box = document.getElementById('biliPlayerBox'); if (!box) return;
    var status = document.getElementById('html5Status'); if (status) status.textContent = '正在解析 HTML5 播放地址…';
    p = Math.max(1, parseInt(p || 1, 10) || 1);
    fetch(resolverUrl(bvid, p)).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
      if (!d || d.code !== 0 || !d.url) throw new Error(d && d.message || 'no url');
      box.innerHTML = '<div class="html5-shell" id="html5Shell"><video id="biliVideo" controls playsinline preload="metadata" title="长按视频临时 2× 倍速"></video><div class="html5-speed-tip" id="html5SpeedTip">2× 倍速</div></div>';
      var v = document.getElementById('biliVideo'); if (!v) return;
      v.playbackRate = html5Rate(); v.src = d.url; v.play().catch(function () {});
      bindHtml5Speed(v);
      if (status) status.textContent = 'HTML5 模式 · 清晰度 ' + (d.quality || '自动') + ' · 长按视频 2×';
      var m = document.getElementById('vidModal'); if (m) m.setAttribute('data-p', p);
    }).catch(function () { fallbackIframe(bvid, p, 'HTML5 解析失败，已自动切换 B站原版'); });
  }
  function toggleHtml5() {
    var on = !html5On(); setHtml5Mode(on);
    var btn = document.getElementById('html5ModeBtn'); if (btn) btn.textContent = 'HTML5 ' + (on ? '开' : '关');
    var m = document.getElementById('vidModal'); if (!m) { renderVideo(); return; }
    var bv = m.getAttribute('data-bv') || ''; var p = parseInt(m.getAttribute('data-p') || '1', 10) || 1;
    if (on) loadHtml5(bv, p); else fallbackIframe(bv, p, 'B站原版播放器');
  }

  function partInfo(bvid) {
    var list = (global.BILI_PHY || []).concat(global.BILI_BIO || []).concat(global.BILI || []);
    for (var i = 0; i < list.length; i++) if (list[i].bvid === bvid) return list[i];
    return null;
  }
  function partsRow(bvid) {
    var b = partInfo(bvid);
    if (!b || !b.partNames || b.partNames.length < 2) return '';
    return '<div class="vparts">' + b.partNames.map(function (n, i) {
      return '<button class="vpart' + (i === 0 ? ' on' : '') + '" data-p="' + (i + 1) + '" title="' + esc(n) + '" onclick="Portal.pickPart(' + (i + 1) + ')">' + (i + 1) + '. ' + esc(n.slice(0, 16)) + '</button>';
    }).join('') + '</div>';
  }
  function pickPart(n) {
    var m = document.getElementById('vidModal');
    var f = document.getElementById('vidFrame');
    var bv = (m && m.getAttribute('data-bv')) || (f && f.getAttribute('data-bv')) || '';
    if (!bv) return;
    n = Math.max(1, parseInt(n || 1, 10) || 1);
    if (m) m.setAttribute('data-p', n);
    Array.prototype.forEach.call(document.querySelectorAll('.vpart'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-p') === String(n));
    });
    var box = document.getElementById('vpartNow'); if (box) box.textContent = '正在播放 第 ' + n + ' 集';
    if (html5On()) loadHtml5(bv, n); else if (f) fallbackIframe(bv, n, 'B站原版播放器');
  }
  function play(bvid, title) {
    var oldm = document.getElementById('vidModal'); if (oldm && oldm.parentNode) oldm.parentNode.removeChild(oldm);
    var m = document.createElement('div'); m.id = 'vidModal'; m.className = 'modal';
    m.setAttribute('data-bv', bvid); m.setAttribute('data-p', '1');
    var b = partInfo(bvid) || {};
    var n = (b.partNames && b.partNames.length) || 1;
    var on = html5On();
    m.innerHTML = '<div class="modalbox" style="max-width:940px">' +
      '<div class="row"><b class="grow">' + (title || bvid) + '</b>' +
      '<button class="btn sm" id="html5ModeBtn" onclick="Portal.toggleHtml5()">HTML5 ' + (on ? '开' : '关') + '</button>' +
      '<button class="btn sm" id="speedBtn" onclick="Portal.cycleSpeed()">' + speedText(html5Rate()) + '</button>' +
      '<button class="btn sm" id="vidWatchBtn" onclick="Portal.toggleWatched(\'' + bvid + '\')">' + (isWatched(bvid) ? '取消已看' : '标记看完') + '</button>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://www.bilibili.com/video/' + bvid + '">去B站看 ↗</a>' +
      '<button class="btn sm" onclick="Portal.closeVideo()">关闭</button></div>' +
      (n > 1 ? '<div class="row" style="margin-top:8px"><span class="small muted" id="vpartNow">共 ' + n + ' 集 · 点下面的集数切换</span></div>' + partsRow(bvid) : '') +
      '<div id="biliPlayerBox"></div>' +
      '<div class="small muted" id="html5Status" style="margin-top:8px">' + (on ? 'HTML5 模式 · 长按视频临时 2× · 点倍速可切换' : 'B站原版播放器') + '</div>' +
      '<div class="small muted" style="margin-top:4px">HTML5 模式不显示弹幕；需要弹幕可点“去B站看”。</div></div>';
    m.addEventListener('click', function (e) { if (e.target === m) closeVideo(); });
    document.body.appendChild(m);
    try { localStorage.setItem('gml_last_bili', bvid); } catch (e) {}
    if (on) loadHtml5(bvid, 1); else fallbackIframe(bvid, 1, 'B站原版播放器');
  }

  function closeVideo() { var m = document.getElementById('vidModal'); if (m && m.parentNode) m.parentNode.removeChild(m); }
  function searchBili() {
    var q = (document.getElementById('biliQ') || {}).value || '';
    if (!q) return;
    window.open('https://search.bilibili.com/all?keyword=' + encodeURIComponent(q), '_blank');
  }
  global.Portal = { videoTag: videoTag, videoSubject: videoSubject, toggleWatched: toggleWatched, toggleHtml5: toggleHtml5, cycleSpeed: cycleSpeed, closeLanyard: closeLanyard, pickPart: pickPart, inkOpen: inkOpen, inkClose: inkClose, roomOpen: roomOpen, isNight: isNight, cycleNightMode: cycleNightMode, setNightMode: setNightMode, stopFx: fxStop, refreshNight: applyNightNow, closeVideo: closeVideo, openModule: function (m) { App.openModule(m); }, renderPortal: renderPortal, renderVideo: renderVideo, loadWeather: loadWeather, play: play, searchBili: searchBili };
})(window);













