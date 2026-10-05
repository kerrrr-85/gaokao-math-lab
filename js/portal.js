/* 门户首页（Portal）：天气小部件 + 图标墙 */
(function (global) {
  var ICONS = {
    study: '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5zm0 7.8L4.6 7 12 3.4 19.4 7 12 10.8zM4 11.2V16l8 4 8-4v-4.8l-8 4-8-4z"/></svg>',
    video: '<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm6 3.5v7l6-3.5-6-3.5z"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.7 0 3.2 1 4.2 2.6H7.8C8.8 5 10.3 4 12 4zM4.3 10h3.2c.1-1.2.4-2.3.8-3.2H5.6A7.9 7.9 0 004.3 10zm0 4a7.9 7.9 0 001.3 3.2h2.7c-.4-.9-.7-2-.8-3.2H4.3zm3.2-2H4.3c0-1 .2-2 .5-2.8h2.9c-.1.9-.2 1.8-.2 2.8zm9 0c0-1-.1-1.9-.2-2.8h2.9c.3.8.5 1.8.5 2.8h-3.2zm3.2 2c-.1 1.2-.4 2.3-.8 3.2h2.7A7.9 7.9 0 0019.7 14h-3.2zm-3.4 0c-.1 1.2-.4 2.3-.8 3.2h-3.8c-.4-.9-.7-2-.8-3.2h5.4zm0-2h-5.4c0-1 .3-1.9.8-2.8h3.8c.5.9.8 1.8.8 2.8zm1.6-5.4H16c.4.9.7 2 .8 3.2h-3.2c0-1-.1-2.1-.2-3.2z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 105 14.3l5.3 5.3 1.4-1.4-5.3-5.3A8 8 0 0010 2zm0 3a5 5 0 110 10 5 5 0 010-10z"/></svg>',
    doubao: '<svg viewBox="0 0 24 24"><path d="M7 3h10a4 4 0 014 4v6a4 4 0 01-4 4h-3l-5 4v-4H7a4 4 0 01-4-4V7a4 4 0 014-4zm1 5h8v2H8V8zm0 4h5v2H8v-2z"/></svg>',
    weather: '<svg viewBox="0 0 24 24"><path d="M6 19a4 4 0 010-8 6 6 0 0111.6-1.6A4.5 4.5 0 0117 19H6z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4c0-.4 0-.9-.1-1.3l2-1.5-2-3.4-2.3 1a9 9 0 00-2.2-1.3L15.9 3h-4l-.4 2.5a9 9 0 00-2.2 1.3l-2.3-1-2 3.4 2 1.5A9 9 0 006.9 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a9 9 0 002.2 1.3l.4 2.5h4l.4-2.5a9 9 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>'
  };
  var TILE_STYLE = {
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
  function renderPortal() {
    var v = document.getElementById('view');
    v.innerHTML = '<canvas class="galaxy-canvas" id="galaxyCanvas"></canvas><div class="pt-wrap">' +
      '<div class="hero2"><div><div class="hi">' + dateStr() + '</div><h1>' + greeting() + '，今天想做什么？</h1></div>' +
      '<div class="quick"><a href="#/today">待复习 ' + Store.dueCards().length + '</a><a href="#/practice/start">开始刷题</a><a href="#/globe">地球</a><a href="#/video">B站</a></div></div>' +
      '<div class="pt-wx" onclick="Portal.loadWeather(true)"><div><div class="small" id="ptCity">青树坪</div><div class="small" id="ptRange">今日 --~--°</div></div><div class="t" id="ptTemp">--°</div><div id="ptDesc">加载中…</div></div>' +
      '<div class="pt-group">学习</div><div class="pt-grid">' + tile('study','学习台','#/today') + tile('search','搜索','#/search') + '</div>' +
      '<div class="pt-group">工具</div><div class="pt-grid">' + tile('globe','地球','#/globe') + tile('weather','天气','#/today') + tile('settings','设置','#/settings') + '</div>' +
      '<div class="pt-group">娱乐</div><div class="pt-grid">' + tile('video','B站视频','#/video') + tile('doubao','豆包','https://www.doubao.com/chat/', true) + '</div>' +
      '<p class="small muted" style="text-align:center;margin-top:16px">学习进「学习台」，看视频进「B站视频」</p></div>';
    loadWeather(false);
    if (global.Galaxy) { var gc = document.getElementById('galaxyCanvas'); if (gc) global.Galaxy.mount(gc); }
    if (global.Anim && Anim.ok()) { Anim.fadeIn('.pt-wx', 60); Anim.enter('.pt-tile', 55); }
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
  function play(bvid) {
    var box = document.getElementById('pl_' + bvid); if (!box) return;
    if (box.innerHTML) { box.innerHTML = ''; return; }
    box.innerHTML = '<iframe class="bili-frame" src="https://player.bilibili.com/player.html?bvid=' + bvid + '&page=1&autoplay=0" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>';
  }
  function searchBili() {
    var q = (document.getElementById('biliQ') || {}).value || '';
    if (!q) return;
    window.open('https://search.bilibili.com/all?keyword=' + encodeURIComponent(q), '_blank');
  }
  global.Portal = { renderPortal: renderPortal, renderVideo: renderVideo, loadWeather: loadWeather, play: play, searchBili: searchBili };
})(window);
