/* 门户 · 今日穿衣面板（Open-Meteo 数据 + 本机衣柜）
 * 天气读取 localStorage.gml_weather（由 portal.js 缓存）
 * 衣柜与「每日计划」共用 localStorage.gml_wardrobe_v1 */
(function (global) {
  'use strict';

  var WARDROBE_KEY = 'gml_wardrobe_v1';
  var WARDROBE = ['短袖', '衬衫', '卫衣', '毛衣', '薄外套', '厚外套', '羽绒服', '长裤', '运动鞋', '防水鞋'];

  var BANDS = [
    { max: 0,  name: '极冷', inner: ['长袖打底', '秋衣'], mid: ['毛衣', '抓绒衣'], outer: ['羽绒服'], bottom: ['加绒长裤', '长裤'], shoes: ['保暖鞋', '运动鞋'], extra: ['围巾', '手套', '帽子'] },
    { max: 8,  name: '很冷', inner: ['长袖打底', '秋衣'], mid: ['毛衣'], outer: ['羽绒服', '厚外套'], bottom: ['长裤'], shoes: ['运动鞋'], extra: ['围巾'] },
    { max: 15, name: '偏冷', inner: ['卫衣', '长袖'], mid: ['毛衣', '卫衣'], outer: ['厚外套', '薄外套'], bottom: ['长裤'], shoes: ['运动鞋'], extra: [] },
    { max: 22, name: '微凉', inner: ['衬衫', '长袖', '短袖'], mid: ['卫衣'], outer: ['薄外套'], bottom: ['长裤'], shoes: ['运动鞋'], extra: [] },
    { max: 28, name: '舒适', inner: ['短袖', '衬衫'], mid: [], outer: ['薄外套'], bottom: ['长裤', '短裤'], shoes: ['运动鞋'], extra: [] },
    { max: 33, name: '偏热', inner: ['短袖'], mid: [], outer: [], bottom: ['短裤', '长裤'], shoes: ['运动鞋'], extra: ['遮阳帽'] },
    { max: 99, name: '很热', inner: ['短袖', '背心'], mid: [], outer: [], bottom: ['短裤'], shoes: ['运动鞋'], extra: ['遮阳帽', '防晒衣'] }
  ];

  var overlay = null, lastFocus = null, shuffled = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function readWardrobe() {
    try {
      var v = JSON.parse(localStorage.getItem(WARDROBE_KEY));
      if (Array.isArray(v)) return v.filter(function (x) { return WARDROBE.indexOf(x) >= 0; });
    } catch (e) {}
    return WARDROBE.slice();
  }
  function writeWardrobe(list) { try { localStorage.setItem(WARDROBE_KEY, JSON.stringify(list)); } catch (e) {} }
  function readWeather() { try { return JSON.parse(localStorage.getItem('gml_weather')); } catch (e) { return null; } }

  function wx(code) {
    var c = Number(code);
    var map = { 0: '晴', 1: '基本晴朗', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇', 51: '毛毛雨', 53: '小雨', 55: '中雨', 61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒', 80: '阵雨', 81: '阵雨', 82: '强阵雨', 85: '阵雪', 95: '雷阵雨', 96: '雷暴', 99: '强雷暴' };
    return {
      label: map[c] || '--',
      rain: [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].indexOf(c) >= 0,
      snow: [71, 73, 75, 77, 85].indexOf(c) >= 0,
      storm: [95, 96, 99].indexOf(c) >= 0,
      fog: [45, 48].indexOf(c) >= 0
    };
  }
  function band(temp) {
    for (var i = 0; i < BANDS.length; i++) if (temp <= BANDS[i].max) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }
  function items(list, pool, shift) {
    var owned = [], rest = [];
    (list || []).forEach(function (n) { (pool.indexOf(n) >= 0 ? owned : rest).push(n); });
    var all = owned.concat(rest);
    if (shift && all.length > 1) { var k = shift % all.length; all = all.slice(k).concat(all.slice(0, k)); }
    return all.slice(0, 3).map(function (n) { return { name: n, own: pool.indexOf(n) >= 0 }; });
  }
  function tempOf(d) {
    if (!d) return 20;
    if (d.feels != null) return Number(d.feels);
    if (d.temp != null) return Number(d.temp);
    return 20;
  }

  function tip(d) {
    var raw = d || readWeather() || {};
    var temp = tempOf(raw), b = band(temp), pool = readWardrobe(), w = wx(raw.code);
    var outer = items(b.outer, pool, 0)[0], mid = items(b.mid, pool, 0)[0], inner = items(b.inner, pool, 0)[0], bottom = items(b.bottom, pool, 0)[0];
    var main = outer ? outer.name : (mid ? mid.name : (inner ? inner.name : ''));
    var parts = [];
    if (main) parts.push(main);
    if (bottom) parts.push(bottom.name);
    var line = parts.join(' + ');
    if (w.rain || (raw.rain != null && raw.rain >= 40)) line += ' · 带伞';
    else if (w.snow) line += ' · 防滑';
    return line || '正在读取穿衣建议…';
  }

  function short(d) {
    var raw = d || readWeather() || {};
    var temp = tempOf(raw), b = band(temp), w = wx(raw.code), pool = readWardrobe();
    var outer = items(b.outer, pool, 0)[0], mid = items(b.mid, pool, 0)[0], inner = items(b.inner, pool, 0)[0], bottom = items(b.bottom, pool, 0)[0];
    var parts = [];
    if (outer) parts.push(outer.name);
    else if (mid) parts.push(mid.name);
    else if (inner) parts.push(inner.name);
    if (bottom) parts.push(bottom.name);
    var line = parts.join(' + ');
    if (w.rain || (raw.rain != null && raw.rain >= 40)) line += ' · 带伞';
    else if (w.snow) line += ' · 防滑';
    if (raw.max != null && raw.min != null && raw.max - raw.min >= 8) line += ' · 早晚加一层';
    return line || '正在读取穿衣建议…';
  }

  function alerts(m) {
    var d = m.d || {}, out = [];
    var diff = (d.max != null && d.min != null) ? d.max - d.min : null;
    if (diff != null && diff >= 8) out.push({ k: '温差', t: '早晚差 ' + Math.round(diff) + '°', s: '出门带一件能脱的外套，晚自习结束会更冷。' });
    if (m.wx.rain || (d.rain != null && d.rain >= 40)) out.push({ k: '降水', t: d.rain != null ? '降水概率 ' + Math.round(d.rain) + '%' : '有降水', s: '带伞；鞋换成防水款，裤脚别太长。' });
    if (d.wind != null && d.wind >= 25) out.push({ k: '风', t: '风速 ' + Math.round(d.wind) + ' km/h', s: '外层选防风的，别穿下摆太宽的。' });
    if (d.uv != null && d.uv >= 6) out.push({ k: '紫外线', t: 'UV ' + Math.round(d.uv), s: '中午前后注意防晒，能戴帽子就戴。' });
    if (d.hum != null && d.hum >= 80 && m.temp >= 24) out.push({ k: '闷热', t: '湿度 ' + Math.round(d.hum) + '%', s: '选透气面料，纯棉湿了不容易干。' });
    if (!out.length) out.push({ k: '舒适', t: '今天没什么特别要注意的', s: '按上面的分层穿就行，教室空调凉的话加件薄的。' });
    return out;
  }

  function layerHTML(m) {
    var L = [
      ['内搭', m.band.inner, '贴身层'],
      ['中层', m.band.mid, '保暖层'],
      ['外层', m.band.outer, '挡风层'],
      ['下装', m.band.bottom, ''],
      ['鞋', m.band.shoes, ''],
      ['配件', m.band.extra, '']
    ];
    return L.map(function (x) {
      var list = items(x[1], m.pool, shuffled);
      var body = list.length
        ? list.map(function (t) { return '<span class="of-tag' + (t.own ? ' own' : '') + '">' + esc(t.name) + '</span>'; }).join('')
        : '<span class="of-none">' + ((x[0] === '中层' || x[0] === '外层') ? '今天可以省略' : '按习惯来') + '</span>';
      return '<div class="of-layer"><h4>' + x[0] + (x[2] ? ' · ' + x[2] : '') + '</h4><p>' + body + '</p></div>';
    }).join('');
  }

  function sheetHTML(m) {
    var d = m.d || {};
    var range = (d.min != null && d.max != null) ? (Math.round(d.min) + '~' + Math.round(d.max) + '°') : '--';
    var pos = Math.max(0, Math.min(100, ((m.temp + 5) / 43) * 100)).toFixed(1);
    var meta = [];
    if (d.feels != null) meta.push('体感 ' + Math.round(d.feels) + '°');
    if (d.hum != null) meta.push('湿度 ' + Math.round(d.hum) + '%');
    if (d.wind != null) meta.push('风 ' + Math.round(d.wind) + ' km/h');
    if (d.rain != null) meta.push('降水 ' + Math.round(d.rain) + '%');
    var alertHTML = alerts(m).map(function (a) {
      return '<div class="of-alert"><b>' + esc(a.k) + '</b><div><strong>' + esc(a.t) + '</strong><p>' + esc(a.s) + '</p></div></div>';
    }).join('');
    return '<section class="dp-sheet of-sheet" role="dialog" aria-modal="true" aria-labelledby="ofTitle">' +
      '<div class="dp-handle" aria-hidden="true"></div>' +
      '<header class="dp-head"><div><p class="dp-kicker">OUTFIT · ' + esc(d.city || '青树坪') + '</p><h2 id="ofTitle">今天这样穿</h2></div>' +
      '<button type="button" class="dp-close" data-action="close" aria-label="关闭">×</button></header>' +
      '<div class="of-now"><b>' + Math.round(m.temp) + '°</b><div class="of-now-meta">' +
        '<strong>' + esc(m.wx.label) + ' · ' + m.band.name + '</strong>' +
        '<span>今日 ' + range + '</span>' +
        '<span>' + esc(meta.join(' · ') || '等待天气数据') + '</span>' +
      '</div></div>' +
      '<div class="of-band"><div class="of-band-track"><i style="left:' + pos + '%"></i></div>' +
      '<div class="of-band-ticks"><span>-5°</span><span>10°</span><span>25°</span><span>38°</span></div></div>' +
      '<div class="of-layers">' + layerHTML(m) + '</div>' +
      '<div class="of-actions"><button type="button" class="of-btn" data-action="shuffle">换一套</button>' +
      '<span class="of-note">深色标记 = 你衣柜里有的</span></div>' +
      '<div class="of-alerts">' + alertHTML + '</div>' +
      '<details class="dp-details" id="ofWardrobeBox"><summary>我有的衣服（点一下切换）</summary>' +
      '<div class="dp-detail-body"><div class="dp-wardrobe" id="ofWardrobe"></div></div></details>' +
      '<p class="dp-footnote">穿衣建议按体感温度和天气自动生成，数据只保存在这台设备。</p>' +
      '</section>';
  }

  function renderWardrobe() {
    if (!overlay) return;
    var box = overlay.querySelector('#ofWardrobe');
    if (!box) return;
    var chosen = readWardrobe();
    box.innerHTML = WARDROBE.map(function (n) {
      return '<button type="button" class="dp-wardrobe-chip' + (chosen.indexOf(n) >= 0 ? ' on' : '') + '" data-of-wardrobe="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
  }

  function refresh(keepOpen) {
    if (!overlay) return;
    var m = model();
    overlay.innerHTML = sheetHTML(m);
    renderWardrobe();
    var box = overlay.querySelector('#ofWardrobeBox');
    if (box && keepOpen) box.setAttribute('open', 'open');
  }

  function model() {
    var d = readWeather() || {};
    var t = tempOf(d);
    return { d: d, temp: t, wx: wx(d.code), band: band(t), pool: readWardrobe() };
  }

  function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) close(); }

  function onOverlayClick(e) {
    if (e.target === overlay) { close(); return; }
    var closeBtn = e.target.closest && e.target.closest('[data-action="close"]');
    if (closeBtn) { close(); return; }
    var shuffleBtn = e.target.closest && e.target.closest('[data-action="shuffle"]');
    if (shuffleBtn) { shuffled++; refresh(true); return; }
    var chip = e.target.closest && e.target.closest('[data-of-wardrobe]');
    if (chip) {
      var name = chip.getAttribute('data-of-wardrobe');
      var list = readWardrobe();
      var i = list.indexOf(name);
      if (i >= 0) list.splice(i, 1); else list.push(name);
      writeWardrobe(list);
      refresh(true);
    }
  }

  function open() {
    lastFocus = document.activeElement;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'dp-overlay';
      overlay.id = 'ofOverlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', onOverlayClick);
      document.addEventListener('keydown', onKey);
    }
    var m = model();
    overlay.innerHTML = sheetHTML(m);
    renderWardrobe();
    document.body.classList.add('dp-open');
    requestAnimationFrame(function () { overlay.classList.add('on'); });
    var c = overlay.querySelector('.dp-close');
    if (c) { try { c.focus(); } catch (e) {} }
    if (!m.d || !m.d.at || (Date.now() - m.d.at) > 600000) {
      try { if (global.Portal && Portal.loadWeather) Portal.loadWeather(false); } catch (e) {}
    }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('on');
    document.body.classList.remove('dp-open');
    setTimeout(function () { if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } }, 260);
  }

  global.Outfit = { open: open, close: close, short: short, tip: tip, alerts: alerts, model: model };
})(window);