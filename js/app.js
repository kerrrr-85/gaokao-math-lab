/* 应用主体：路由 + 各页面视图 */
(function () {
  var D = window.DATA, Store = window.Store, SRS = window.SRS;
  var view = document.getElementById('view'), toastEl = document.getElementById('toast');
  var nodeById = {}, methodById = {}, qById = {};
  D.nodes.forEach(function (n) { nodeById[n.id] = n; });
  D.methods.forEach(function (m) { methodById[m.id] = m; });
  D.questions.forEach(function (q) { qById[q.id] = q; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(function () { toastEl.classList.remove('show'); }, 1500); }
  function diffTag(d) { var c = d === '基础' ? 'd1' : d === '中档' ? 'd2' : 'd3'; return '<span class="tag ' + c + '">' + d + '</span>'; }
  function typeName(t) { return t === 'choice' ? '选择' : t === 'fill' ? '填空' : '解答'; }
  function cardTitle(c) { if (c.refType === 'method') { var m = methodById[c.refId]; return m ? m.title : c.refId; } var q = qById[c.refId]; return q ? (typeName(q.type) + '题 · ' + q.stem.slice(0, 24)) : c.refId; }

  var cards = [];
  D.methods.forEach(function (m) { cards.push(SRS.newCard('method', m.id)); });
  D.questions.forEach(function (q) { cards.push(SRS.newCard('question', q.id)); });
  Store.ensureCards(cards);

  function curModule() { return (Store.get().settings || {}).module || '函数与导数'; }
  function inMod(x) { return !x.module || x.module === curModule(); }
  function setModule(m) { Store.get().settings.module = m; Store.save(); toast('已切换到 ' + m); router(); }
  function openModule(m) { Store.get().settings.module = m; Store.save(); go('#/today'); }
  function modbar() {
    var ms = ['函数与导数', '三角函数', '数列'];
    return '<div class="modbar">' + ms.map(function (m) { return '<button class="btn sm' + (m === curModule() ? ' primary' : '') + '" onclick="App.setModule(\'' + m + '\')">' + m + '</button>'; }).join('') + '</div>';
  }
  function cardMod(c) {
    if (c.refType === 'method') { var m = methodById[c.refId]; return m ? (m.module || '函数与导数') : ''; }
    var q = qById[c.refId]; return q ? (q.module || '函数与导数') : '';
  }
  function isNew(c) { return c.state === 'new'; }
  function dueReview() { return Store.allCards().filter(function (c) { return !isNew(c) && SRS.isDue(c); }); }
  function newCards() { return Store.allCards().filter(isNew); }

  function updateMini() {
    document.getElementById('todayMini').textContent = '待复习 ' + dueReview().length + ' · 新卡 ' + newCards().length + ' · 已练 ' + Store.stats().total + ' 题';
  }
  function setTab(page) {
    if (page !== 'portal' && page) document.body.classList.remove('pt-full');
    if (page !== 'portal' && window.Portal && Portal.stopFx) Portal.stopFx();
    var _night = (page === 'portal' || !page) && window.Portal && Portal.isNight && Portal.isNight();
    document.body.classList.toggle('portal-dark', !!_night);
    if (page !== 'portal' && window.Galaxy) Galaxy.stop();
    if (page !== 'globe' && window.Globe && Globe.stop) Globe.stop();
    var studyPages = { today: 1, map: 1, node: 1, method: 1, practice: 1, wrong: 1, stats: 1, settings: 1, search: 1 };
    var isStudy = !!studyPages[page];
    document.body.classList.toggle('study-bg', isStudy);
    document.body.classList.remove('mod-func', 'mod-trig', 'mod-seq');
    var _mm = curModule();
    document.body.classList.add(_mm === '三角函数' ? 'mod-trig' : _mm === '数列' ? 'mod-seq' : 'mod-func');
    if (window.DotGrid) { if (isStudy) DotGrid.mount(document.getElementById('dotCanvas')); else DotGrid.stop(); }
    var bb = document.getElementById('backBtn');
    if (bb) bb.style.display = (page === 'portal' || !page) ? 'none' : 'inline-flex';
    var tm = document.getElementById('todayMini'); if (tm) tm.style.display = (page === 'portal' || !page) ? 'none' : '';
    var learn = { today: 1, map: 1, node: 1, method: 1, practice: 1, wrong: 1, stats: 1, settings: 1, study: 1 };
    var bar = document.getElementById('tabbar');
    if (bar) bar.style.display = learn[page] ? 'flex' : 'none';
    var map = { study: 'today', today: 'today', map: 'map', node: 'map', method: 'map', practice: 'practice', wrong: 'wrong', stats: 'stats', settings: 'settings' };
    var t = map[page] || '';
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar a'), function (a) { a.classList.toggle('active', a.dataset.tab === t); });
  }

  /* ============ 功能中心（前置首页） ============ */
  var ICONS = {
    today: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.4V7z"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L18 9.8 14.2 6 3 17.2zM20.7 7.3a1 1 0 000-1.4l-2.6-2.6a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.7z"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M6 2a4 4 0 100 8 4 4 0 000-8zm12 12a4 4 0 100 8 4 4 0 000-8zM8 8l7.2 6.5-1.4 1.5L6.6 9.5 8 8z"/></svg>',
    wrong: '<svg viewBox="0 0 24 24"><path d="M4 3h13a3 3 0 013 3v15l-5-3-5 3-5-3-1 0V3zm3 5h7v2H7V8zm0 4h7v2H7v-2z"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20h3V10H4v10zm6 0h3V4h-3v16zm6 0h3v-7h-3v7z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 105 14.3l5.3 5.3 1.4-1.4-5.3-5.3A8 8 0 0010 2zm0 3a5 5 0 110 10 5 5 0 010-10z"/></svg>',
    weather: '<svg viewBox="0 0 24 24"><path d="M6 19a4 4 0 010-8 6 6 0 0111.6-1.6A4.5 4.5 0 0117 19H6z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a9 9 0 00-.1-1.3l2-1.5-2-3.4-2.3 1a9 9 0 00-2.2-1.3L15.9 3h-4l-.4 2.5a9 9 0 00-2.2 1.3l-2.3-1-2 3.4 2 1.5A9 9 0 006.9 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a9 9 0 002.2 1.3l.4 2.5h4l.4-2.5a9 9 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></svg>'
  };
  function hubTile(key, label, href) {
    return '<a class="hubTile" href="' + href + '">' + (ICONS[key] || '') + '<span>' + label + '</span></a>';
  }
  function renderHub() {
    var st = Store.stats();
    view.innerHTML = '<div class="hub"><h1 style="text-align:center">学习中心</h1><p class="muted" style="text-align:center">选择要进入的功能</p>' +
      '<div class="hubGrid">' +
      hubTile('today', '今日任务', '#/today') +
      hubTile('practice', '刷题练习', '#/practice') +
      hubTile('map', '知识图谱', '#/map') +
      hubTile('wrong', '错题本', '#/wrong') +
      hubTile('stats', '学习统计', '#/stats') +
      hubTile('search', '搜索', '#/search') +
      
      hubTile('settings', '设置', '#/settings') +
      '</div><p class="small muted" style="text-align:center;margin-top:18px">已练习 ' + st.total + ' 题 · 待复习 ' + dueReview().length + ' 张</p></div>';
  }
  function ringHTML(pct, big, small) {
    var r = 46, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct || 0));
    var off = c * (1 - p / 100);
    return '<div class="ring"><svg width="112" height="112" viewBox="0 0 112 112">' +
      '<circle cx="56" cy="56" r="' + r + '" fill="none" stroke="#e8eaee" stroke-width="10"/>' +
      '<circle class="rprog" cx="56" cy="56" r="' + r + '" fill="none" stroke="url(#rg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/>' +
      '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>' +
      '</svg><div class="val"><b>' + big + '</b><span>' + small + '</span></div></div>';
  }
  function animateRings() {
    Array.prototype.forEach.call(document.querySelectorAll('.rprog'), function (el) {
      var to = el.getAttribute('data-off');
      requestAnimationFrame(function () { setTimeout(function () { el.setAttribute('stroke-dashoffset', to); }, 30); });
    });
  }
  function heatHTML(v) {
    var on = Math.round((v || 0) / 20);
    var h = '<span class="heat">';
    for (var i = 0; i < 5; i++) h += '<i class="' + (i < on ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  var pomo = { left: 1500, running: false, timer: null };
  function pomoRender() { var el = document.getElementById('pomoTime'); if (el) el.textContent = ('0' + Math.floor(pomo.left / 60)).slice(-2) + ':' + ('0' + (pomo.left % 60)).slice(-2); }
  function pomoToggle() {
    if (pomo.running) { clearInterval(pomo.timer); pomo.running = false; }
    else { pomo.running = true; pomo.timer = setInterval(function () { pomo.left--; if (pomo.left <= 0) { clearInterval(pomo.timer); pomo.running = false; pomo.left = 0; toast('🍅 一个番茄钟完成，休息 5 分钟'); } pomoRender(); }, 1000); }
    pomoRender();
  }
  function pomoReset() { clearInterval(pomo.timer); pomo.running = false; pomo.left = 1500; pomoRender(); }
  function addCustomWrong() {
    var stem = ((document.getElementById('cwStem') || {}).value || '').trim();
    if (!stem) { toast('请先写下题干'); return; }
    var ans = ((document.getElementById('cwAns') || {}).value || '').trim();
    var err = (document.getElementById('cwErr') || {}).value || '知识';
    var st = Store.get().settings; st.customWrong = st.customWrong || [];
    st.customWrong.unshift({ id: 'cw' + Date.now(), stem: stem, answer: ans, err: err, at: Date.now() });
    Store.save(); toast('已加入错题速记'); renderWrong();
  }
  function delCustomWrong(id) {
    var st = Store.get().settings; st.customWrong = (st.customWrong || []).filter(function (x) { return x.id !== id; });
    Store.save(); renderWrong();
  }
  function heatmapHTML() {
    var counts = {};
    Store.get().attempts.forEach(function (a) { var d = new Date(a.createdAt || 0); d.setHours(0, 0, 0, 0); counts[d.getTime()] = (counts[d.getTime()] || 0) + 1; });
    var end = new Date(); end.setHours(0, 0, 0, 0);
    var start = new Date(end); start.setDate(start.getDate() - 83);
    var cells = '';
    for (var i = 0; i < 84; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var c = counts[d.getTime()] || 0;
      var lv = c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4;
      cells += '<i class="hm l' + lv + '" title="' + (d.getMonth() + 1) + '/' + d.getDate() + ' · ' + c + ' 题"></i>';
    }
    return '<div class="card"><div class="phead"><span class="ico">🗓️</span><div class="grow"><h2>学习热力图</h2><p>近 12 周 · 颜色越深当天练得越多</p></div></div><div class="heatmap">' + cells + '</div></div>';
  }
  /* ============ 今日（四 Tab + 拉杆式牌堆） ============ */
  var dayKey = 'today';
  var deckState = { off: {}, list: {}, down: null, swiped: 0, dragging: false };

  function ringSm(pct, big) {
    var r = 26, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct || 0));
    var off = c * (1 - p / 100);
    return '<div class="ring sm"><svg width="64" height="64" viewBox="0 0 64 64">' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="#e8eaee" stroke-width="6"/>' +
      '<circle class="rprog" cx="32" cy="32" r="' + r + '" fill="none" stroke="#0f766e" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/>' +
      '</svg><div class="val"><b>' + big + '</b></div></div>';
  }
  function setDayTab(k) {
    var keys = ['today', 'review', 'weak', 'focus'];
    var i = keys.indexOf(k); if (i < 0) i = 0;
    dayKey = keys[i];
    var seg = document.getElementById('daySeg');
    if (seg) Array.prototype.forEach.call(seg.querySelectorAll('.set-segbtn'), function (b, n) { b.classList.toggle('on', n === i); });
    var ind = document.getElementById('dayInd');
    if (ind) ind.style.transform = 'translateX(' + (i * 100) + '%)';
    keys.forEach(function (key, n) {
      var pn = document.getElementById('dayp-' + key); if (pn) pn.classList.toggle('on', n === i);
    });
  }
  function deckList(kind) { return deckState.list[kind] || []; }
  function deckOff(kind) { return deckState.off[kind] || 0; }
  function deckClamp(kind, v) { var n = deckList(kind).length; return Math.max(0, Math.min(n ? n - 1 : 0, v)); }
  function deckStepPx(el) {
    var v = 0; try { v = parseFloat(getComputedStyle(el).getPropertyValue('--step')); } catch (e) {}
    return v || 78;
  }
  function deckApply(kind) {
    var el = document.getElementById('deck-' + kind);
    if (!el) return;
    var cards = el.querySelectorAll('.deck-card');
    var off = deckOff(kind), step = deckStepPx(el), center = Math.round(off);
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], pos = i - off, ap = Math.abs(pos);
      if (i === center) c.classList.add('picked'); else c.classList.remove('picked');
      if (ap > 4.2) {
        if (c._far !== 1) { c._far = 1; c.style.opacity = '0'; c.style.pointerEvents = 'none'; }
        continue;
      }
      c._far = 0;
      c.style.opacity = ap > 3.4 ? '0' : '1';
      c.style.pointerEvents = '';
      c.style.transform = 'translateX(' + (pos * step).toFixed(1) + 'px) rotate(' + (pos * 5.5).toFixed(2) +
        'deg) scale(' + (1 - Math.min(ap, 3) * 0.045).toFixed(3) + ')';
      c.style.zIndex = String(Math.round(200 - ap * 20));
    }
  }
  function deckPanel(kind) {
    var arr = deckList(kind), idx = Math.round(deckOff(kind)), sel = arr[idx] || null;
    var nav = '<div class="deck-nav"><button class="deck-arrow" title="上一张" onclick="App.deckStep(\'' + kind + '\',-1)">‹</button>' +
      '<span class="deck-count">' + (arr.length ? ((idx + 1) + ' / ' + arr.length) : '0 / 0') + '</span>' +
      '<button class="deck-arrow" title="下一张" onclick="App.deckStep(\'' + kind + '\',1)">›</button></div>';
    if (!arr.length) return nav + '<p class="set-note" style="padding:4px 2px">这里暂时是空的。</p>';
    if (!sel) return nav + '<p class="set-note" style="padding:4px 2px">拖动牌堆，或点一张牌</p>';
    var act;
    if (kind === 'due') {
      act = '<div class="row" style="margin-top:10px;gap:8px">' +
        '<button class="btn sm" onclick="App.reviewCard(\'' + sel.id + '\',0)">不会</button>' +
        '<button class="btn sm" onclick="App.reviewCard(\'' + sel.id + '\',1)">半会</button>' +
        '<button class="btn sm primary" onclick="App.reviewCard(\'' + sel.id + '\',2)">会了</button></div>';
    } else if (sel.refType === 'method') {
      act = '<div class="row" style="margin-top:10px;gap:8px"><a class="btn sm primary" href="#/method/' + sel.refId + '">看这张方法卡</a><a class="btn sm" href="#/practice">去练习</a></div>';
    } else {
      act = '<div class="row" style="margin-top:10px;gap:8px"><button class="btn sm primary" onclick="App.startSingle(\'' + sel.refId + '\')">练这道题</button><a class="btn sm" href="#/node/' + (qById[sel.refId] ? qById[sel.refId].node : '') + '">看知识点</a></div>';
    }
    return nav + '<div class="deck-detail"><div class="set-lab"><b>' + esc(cardTitle(sel)) + '</b>' +
      '<span>' + (sel.refType === 'method' ? '方法卡' : '题目卡') + ' · 已复习 ' + sel.reps + ' 次' +
      (kind === 'due' ? ' · ' + esc(cardMod(sel)) : '') + '</span></div>' + act + '</div>';
  }
  function deckPanelRefresh(kind) {
    var pn = document.getElementById('deckpanel-' + kind);
    if (pn) pn.innerHTML = deckPanel(kind);
  }
  function deckHTML(kind, cards, opts) {
    opts = opts || {};
    deckState.list[kind] = cards || [];
    if (deckState.off[kind] == null) deckState.off[kind] = 0;
    var max = opts.max || 400;
    var show = (cards || []).slice(0, max);
    var body = show.map(function (c, i) {
      return '<button class="deck-card" data-id="' + c.id + '" data-i="' + i + '"' +
        ' onclick="App.deckPick(\'' + kind + '\',\'' + c.id + '\')">' +
        '<span class="dc-top">' + (opts.tag ? opts.tag(c) : '') + '</span>' +
        '<b class="dc-title">' + esc(opts.title(c)) + '</b>' +
        '<span class="dc-meta">' + esc(opts.meta1 ? opts.meta1(c) : '') + '</span>' +
        (opts.meta2 ? '<span class="dc-meta">' + esc(opts.meta2(c)) + '</span>' : '') +
        '</button>';
    }).join('');
    if (!show.length) return '<div class="deck-empty">这里暂时是空的。</div><div class="deck-panel" id="deckpanel-' + kind + '">' + deckPanel(kind) + '</div>';
    return '<div class="deck" id="deck-' + kind + '"' +
      ' onpointerdown="App.deckDown(event,\'' + kind + '\')" onpointermove="App.deckMove(event,\'' + kind + '\')"' +
      ' onpointerup="App.deckUp(event,\'' + kind + '\')" onpointercancel="App.deckCancel(event,\'' + kind + '\')">' +
      body + '</div><div class="deck-panel" id="deckpanel-' + kind + '">' + deckPanel(kind) + '</div>';
  }
  function deckGoTo(kind, n) {
    deckState.off[kind] = deckClamp(kind, n);
    deckApply(kind);
    deckPanelRefresh(kind);
  }
  function deckPick(kind, id) {
    if (Date.now() - (deckState.swiped || 0) < 320) return;
    var arr = deckList(kind);
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) { deckGoTo(kind, i); return; }
  }
  function deckStep(kind, dir) { deckGoTo(kind, Math.round(deckOff(kind)) + dir); }
  function deckDown(ev, kind) {
    var el = document.getElementById('deck-' + kind);
    deckState.down = { x: ev.clientX, y: ev.clientY, kind: kind, t: Date.now(), drag: false, off0: deckOff(kind) };
    try { if (el && el.setPointerCapture) el.setPointerCapture(ev.pointerId); } catch (e) {}
  }
  function deckMove(ev, kind) {
    var d = deckState.down;
    if (!d || d.kind !== kind) return;
    var dx = ev.clientX - d.x, dy = ev.clientY - d.y;
    if (!d.drag) {
      if (Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy)) { d.drag = true; var el0 = document.getElementById('deck-' + kind); if (el0) el0.classList.add('dragging'); }
      else return;
    }
    var el = document.getElementById('deck-' + kind);
    if (!el) return;
    var step = deckStepPx(el);
    deckState.off[kind] = deckClamp(kind, d.off0 - dx / step);
    deckApply(kind);
  }
  function deckEnd(ev, kind) {
    var d = deckState.down; deckState.down = null;
    var el = document.getElementById('deck-' + kind);
    if (el) el.classList.remove('dragging');
    try { if (el && el.releasePointerCapture) el.releasePointerCapture(ev.pointerId); } catch (e) {}
    if (!d || d.kind !== kind) return;
    if (!d.drag) return;
    deckState.swiped = Date.now();
    var off = deckOff(kind), dt = Math.max(16, Date.now() - d.t);
    var v = (off - d.off0) / dt;
    var kick = Math.max(-3, Math.min(3, v * 170));
    deckGoTo(kind, Math.round(off + kick));
  }
  function deckUp(ev, kind) { deckEnd(ev, kind); }
  function deckCancel(ev, kind) { deckEnd(ev, kind); }

  function renderToday(startKey) {
    if (startKey && ['today', 'review', 'weak', 'focus'].indexOf(startKey) >= 0) dayKey = startKey;
    var mod = curModule();
    var due = dueReview().filter(function (c) { return cardMod(c) === mod; });
    var nw = newCards().filter(function (c) { return cardMod(c) === mod; });
    var st = Store.stats();
    var nodes = D.nodes.filter(function (n) { return (n.module || '函数与导数') === mod; });
    var avg = 0; nodes.forEach(function (n) { avg += Store.masteryOf(n.id); });
    avg = nodes.length ? Math.round(avg / nodes.length) : 0;
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var doneToday = Store.get().attempts.filter(function (a) { return (a.createdAt || 0) >= t0.getTime(); }).length;
    var goal = Store.get().settings.reviewPerDay || 20;
    var pct = Math.min(100, Math.round(doneToday * 100 / goal));
    var weak = nodes.slice().sort(function (a, b) { return Store.masteryOf(a.id) - Store.masteryOf(b.id); }).slice(0, 3);
    var nextTxt = due.length ? ('先清复习队列：有 ' + due.length + ' 张到期')
      : (Store.wrong().length ? ('错题本还有 ' + Store.wrong().length + ' 道待重做') : '没有到期复习，正好开新卡建立记忆');

    var tabToday =
      '<div class="day-hero">' + ringSm(pct, doneToday + '') +
        '<div class="grow"><b>今日 ' + doneToday + ' / ' + goal + '</b><p>' + esc(nextTxt) + '</p></div>' +
        '<a class="btn sm primary" href="#/practice/start">开始练</a></div>' +
      '<div class="day-mini">' +
        '<div class="dm"><b>' + due.length + '</b><span>待复习</span></div>' +
        '<div class="dm"><b>' + nw.length + '</b><span>新卡</span></div>' +
        '<div class="dm"><b>' + st.wrongCount + '</b><span>错题</span></div>' +
        '<div class="dm"><b>' + avg + '%</b><span>掌握度</span></div>' +
      '</div>' +
      '<div class="set-group" style="padding-top:4px"><div class="set-h">新卡 · ' + nw.length + ' 张</div>' +
        '<div style="padding:0 14px 14px">' + deckHTML('nw', nw, {
          max: 400, tag: function () { return '新卡'; },
          title: function (c) { return cardTitle(c); },
          meta1: function (c) { return c.refType === 'method' ? '方法卡' : '题目卡'; },
          meta2: function (c) { return cardMod(c); }
        }) + '</div></div>';

    var tabReview =
      '<div class="set-group"><div class="set-h">到期卡片 · ' + due.length + ' 张</div>' +
        '<div style="padding:0 14px 16px">' + deckHTML('due', due, {
          max: 400, tag: function () { return '到期'; },
          title: function (c) { return cardTitle(c); },
          meta1: function (c) { return (c.refType === 'method' ? '方法卡' : '题目卡') + ' · 已复习 ' + c.reps + ' 次'; },
          meta2: function (c) { return cardMod(c); }
        }) + '</div></div>' +
      '<p class="set-note">牌堆叠在一起，点「展开」或直接把鼠标移上去 → 像扇子一样张开；点某张牌即可评分。</p>';

    var tabWeak =
      '<div class="set-group"><div class="set-h">薄弱知识点 · 掌握度最低</div>' +
        (weak.length ? weak.map(function (n) {
          var m = Store.masteryOf(n.id);
          return '<div class="set-row"><div class="set-lab"><b>' + esc(n.title) + '</b><span>' + esc(n.brief) + '</span>' +
            '<div class="bar" style="margin-top:6px"><i style="width:' + m + '%"></i></div></div>' +
            '<div class="weak-act"><span class="set-val">' + m + '%</span><a class="btn sm" href="#/node/' + n.id + '">看</a></div></div>';
        }).join('') : '<p class="set-note">暂无数据。</p>') + '</div>' +
      '<div class="set-group">' + heatmapHTML() + '</div>';

    var tabFocus =
      '<div class="set-group" style="padding:22px 16px;text-align:center">' +
        '<div class="set-h" style="padding:0 0 12px">专注番茄钟</div>' +
        '<b id="pomoTime" style="display:block;font-size:46px;font-weight:700;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:var(--primary)">25:00</b>' +
        '<p class="set-note" style="padding:8px 0 16px">25 分钟专注 · 5 分钟休息</p>' +
        '<div class="row" style="justify-content:center"><button class="btn primary" onclick="App.pomoToggle()">开始 / 暂停</button><button class="btn" onclick="App.pomoReset()">重置</button></div>' +
      '</div>' +
      '<div class="set-group"><div class="set-h">最近 7 天</div><div style="padding:0 14px 14px">' + heatmapHTML() + '</div></div>';

    view.innerHTML = modbar() +
      '<div class="set-wrap">' +
        '<div class="set-seg" id="daySeg">' +
          '<button class="set-segbtn" onclick="App.setDayTab(\'today\')">今日</button>' +
          '<button class="set-segbtn" onclick="App.setDayTab(\'review\')">复习</button>' +
          '<button class="set-segbtn" onclick="App.setDayTab(\'weak\')">薄弱</button>' +
          '<button class="set-segbtn" onclick="App.setDayTab(\'focus\')">专注</button>' +
          '<span class="set-segind" id="dayInd"></span>' +
        '</div>' +
        '<div class="set-panel" id="dayp-today">' + tabToday + '</div>' +
        '<div class="set-panel" id="dayp-review">' + tabReview + '</div>' +
        '<div class="set-panel" id="dayp-weak">' + tabWeak + '</div>' +
        '<div class="set-panel" id="dayp-focus">' + tabFocus + '</div>' +
      '</div>';
    setDayTab(dayKey);
    deckApply('nw');
    deckApply('due');
    animateRings();
    pomoRender();
  }

  function wmoText(c) { var m = {0:'晴',1:'基本晴朗',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'毛毛雨',53:'小雨',55:'中雨',56:'冻雨',57:'冻雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'冻雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨',81:'阵雨',82:'强阵雨',85:'阵雪',86:'阵雪',95:'雷阵雨',96:'雷阵雨伴冰雹',99:'雷暴'}; return m[c] || '--'; }
  function applyWeather(d) { var q = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }; q('wxCity', d.city); q('wxDesc', wmoText(d.code)); q('wxTemp', Math.round(d.temp) + '°'); q('wxMin', Math.round(d.min) + '°'); q('wxMax', Math.round(d.max) + '°'); }
  function refreshWeather() { loadWeather(true); }
  function loadWeather(force) {
    var wx = ((Store.get().settings || {}).weather || {});
    var city = wx.city || '青树坪', wlat = wx.lat, wlon = wx.lon;
    var el = document.getElementById('wxCity'); if (el) el.textContent = city;
    var cache = null; try { cache = JSON.parse(localStorage.getItem('gml_weather')); } catch (e) {}
    if (!force && cache && cache.city === city && Date.now() - cache.at < 600000) { applyWeather(cache); return; }
    if (wlat != null && wlon != null) {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + wlat + '&longitude=' + wlon + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
        .then(function (r) { return r.json(); })
        .then(function (w) { var d = { city: city, at: Date.now(), temp: w.current.temperature_2m, code: w.current.weather_code, max: w.daily.temperature_2m_max[0], min: w.daily.temperature_2m_min[0] }; try { localStorage.setItem('gml_weather', JSON.stringify(d)); } catch (e) {} applyWeather(d); })
        .catch(function () { var t = document.getElementById('wxDesc'); if (t) t.textContent = '天气获取失败（点卡片重试）'; });
      return;
    }
    var desc = document.getElementById('wxDesc'); if (desc) desc.textContent = '加载中…';
    fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=zh&name=' + encodeURIComponent(city))
      .then(function (r) { return r.json(); })
      .then(function (g) {
        if (!g.results || !g.results.length) throw new Error('找不到城市');
        var c = g.results[0];
        return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + c.latitude + '&longitude=' + c.longitude + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
          .then(function (r) { return r.json(); })
          .then(function (w) { var d = { city: c.name, at: Date.now(), temp: w.current.temperature_2m, code: w.current.weather_code, max: w.daily.temperature_2m_max[0], min: w.daily.temperature_2m_min[0] }; try { localStorage.setItem('gml_weather', JSON.stringify(d)); } catch (e) {} applyWeather(d); });
      })
      .catch(function () { var t = document.getElementById('wxDesc'); if (t) t.textContent = '天气获取失败（点卡片重试）'; });
  }
  /* ============ 知识图谱 ============ */
  function renderMap() {
    var MAP = D.nodes.filter(inMod);
    var depth = {}; MAP.forEach(function (n) { depth[n.id] = 0; });
    for (var k = 0; k < 6; k++) MAP.forEach(function (n) { (n.prereq || []).forEach(function (p) { if (depth[p] != null && depth[p] + 1 > depth[n.id]) depth[n.id] = depth[p] + 1; }); });
    var layers = {}; MAP.forEach(function (n) { (layers[depth[n.id]] = layers[depth[n.id]] || []).push(n); });
    var keys = Object.keys(layers).sort(function (x, y) { return x - y; });
    var W = 940, padY = 80, rowGap = 150, padX = 120;
    var H = Math.max(320, padY * 2 + rowGap * Math.max(1, keys.length - 1));
    var pos = {}, rad = {}, qcount = {};
    MAP.forEach(function (n) {
      qcount[n.id] = D.questions.filter(function (q) { return q.node === n.id; }).length;
      rad[n.id] = 24 + Math.min(12, qcount[n.id] * 0.6);
    });
    keys.forEach(function (d, di) {
      var arr = layers[d];
      var usable = W - padX * 2;
      var y = keys.length === 1 ? H / 2 : padY + (H - 2 * padY) * di / (keys.length - 1);
      arr.forEach(function (n, i) {
        var x = arr.length === 1 ? W / 2 : padX + usable * i / (arr.length - 1);
        pos[n.id] = { x: x, y: y };
      });
    });
    /* 推荐顺序：按层级从浅到深，同层按掌握度低优先 */
    var order = MAP.slice().sort(function (a, b) {
      if (depth[a.id] !== depth[b.id]) return depth[a.id] - depth[b.id];
      return Store.masteryOf(a.id) - Store.masteryOf(b.id);
    });

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    MAP.forEach(function (n) {
      (n.prereq || []).forEach(function (pr) {
        if (!pos[pr] || !pos[n.id]) return;
        var A = pos[pr], B = pos[n.id];
        var y1 = A.y + rad[pr] + 4, y2 = B.y - rad[n.id] - 4;
        svg += '<path class="edge" data-from="' + pr + '" data-to="' + n.id + '" d="M' + A.x + ' ' + y1 + ' C' + A.x + ' ' + (y1 + 52) + ', ' + B.x + ' ' + (y2 - 52) + ', ' + B.x + ' ' + y2 + '"/>';
      });
    });
    MAP.forEach(function (n) {
      var p = pos[n.id], m = Store.masteryOf(n.id), r = rad[n.id];
      var fill = m >= 75 ? '#0f766e' : m >= 50 ? '#2dd4bf' : m >= 25 ? '#fbbf24' : '#e2e8f0';
      var tcol = m >= 50 ? '#ffffff' : '#0f172a';
      svg += '<g class="gnode" data-id="' + n.id + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="' + r.toFixed(0) + '" fill="' + fill + '" stroke="rgba(15,23,42,.16)" stroke-width="1.5"/>' +
        '<text y="4" style="font-size:12px;fill:' + tcol + ';font-weight:700">' + m + '%</text>' +
        '<text class="gnode-label" y="' + (r + 20) + '">' + esc(n.title) + '</text></g>';
    });
    svg += '</svg>';

    var rail = '<div class="map-rail">' + order.map(function (n, i) {
      var m = Store.masteryOf(n.id);
      return '<button class="map-step' + (m >= 75 ? ' done' : '') + '" data-id="' + n.id + '" onclick="App.graphStep(\'' + n.id + '\')">' +
        '<span class="ms-no">' + (i + 1) + '</span><i></i><b>' + esc(n.title) + '</b><span class="ms-m">' + m + '%</span></button>';
    }).join('') + '</div>';

    view.innerHTML = modbar() +
      '<div class="phead"><span class="ico">🧭</span><div class="grow"><h2>' + esc(curModule()) + ' · 知识图谱</h2><p>圆越大题量越多 · 颜色越深掌握越好 · 悬停看详情</p></div></div>' +
      '<div class="card tight" style="margin-bottom:12px"><div class="small muted" style="margin-bottom:8px">推荐顺序（点一下定位到该节点）</div>' + rail + '</div>' +
      '<div class="graphbar" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
        '<button class="btn sm" onclick="App.graphZoom(-1)">－</button>' +
        '<span class="zi" id="gvPct">100%</span>' +
        '<button class="btn sm" onclick="App.graphZoom(1)">＋</button>' +
        '<button class="btn sm" onclick="App.graphReset()">↺ 重置</button>' +
        '<button class="btn sm" id="gvFull" onclick="App.graphFull()">⛶ 全屏</button>' +
        '<span class="small muted">滚轮/双指缩放 · 拖拽平移</span>' +
      '</div>' +
      '<div class="graph graphbox elev2" id="graphBox">' + svg +
        '<div class="gnode-card" id="gnodeCard"></div>' +
      '</div>';
    graphInit();
  }
  function masteryBar(id) { var m = Store.masteryOf(id); return '<div class="mastery"><div class="bar"><i style="width:' + m + '%"></i></div><span class="small">' + m + '%</span></div>'; }
  var gv = { s: 1, tx: 0, ty: 0 }, gvTimer = null, gvPtrs = {};
  function gvTouch() { try { return matchMedia('(hover:none)').matches; } catch (e) { return false; } }
  function graphApply() {
    var svgEl = document.querySelector('#graphBox svg');
    if (svgEl) svgEl.style.transform = 'translate(' + gv.tx + 'px,' + gv.ty + 'px) scale(' + gv.s + ')';
    var pc = document.getElementById('gvPct');
    if (pc) pc.textContent = Math.round(gv.s * 100) + '%';
  }
  function graphReset() { gv = { s: 1, tx: 0, ty: 0 }; graphApply(); }
  function graphZoom(dir) {
    gv.s = Math.max(0.5, Math.min(3.2, gv.s * (dir > 0 ? 1.18 : 0.85)));
    graphApply();
  }
  function graphFull() {
    var box = document.getElementById('graphBox');
    if (!box) return;
    var on = !box.classList.contains('full');
    box.classList.toggle('full', on);
    var b = document.getElementById('gvFull');
    if (b) b.textContent = on ? '⤡ 退出全屏' : '⛶ 全屏';
    document.body.classList.toggle('map-full', on);
  }
  function graphHover(id, on) {
    Array.prototype.forEach.call(document.querySelectorAll('.gnode'), function (g) { g.classList.toggle('dim', on && g.getAttribute('data-id') !== id); g.classList.toggle('hot', on && g.getAttribute('data-id') === id); });
    Array.prototype.forEach.call(document.querySelectorAll('.edge'), function (e) { var rel = on && (e.getAttribute('data-from') === id || e.getAttribute('data-to') === id); e.classList.toggle('hot', rel); e.classList.toggle('dim', on && !rel); });
    Array.prototype.forEach.call(document.querySelectorAll('.map-step'), function (s) { s.classList.toggle('hot', on && s.getAttribute('data-id') === id); });
  }
  function graphCard(id) {
    var box = document.getElementById('graphBox'), card = document.getElementById('gnodeCard');
    if (!box || !card) return;
    if (gvTimer) { clearTimeout(gvTimer); gvTimer = null; }
    if (!id) {
      gvTimer = setTimeout(function () { card.classList.remove('on'); graphHover(null, false); }, 180);
      return;
    }
    var n = nodeById[id]; if (!n) return;
    var m = Store.masteryOf(id);
    var qn = D.questions.filter(function (q) { return q.node === id; }).length;
    var ms = (D.methods || []).filter(function (x) { return (x.nodeIds || []).indexOf(id) >= 0; });
    var pre = (n.prereq || []).map(function (p) { return nodeById[p]; }).filter(Boolean);
    card.innerHTML =
      '<div class="gnc-title">' + esc(n.title) + '</div>' +
      '<div class="gnc-brief">' + esc(n.brief || '') + '</div>' +
      '<div class="gnc-row"><span>掌握度</span><b>' + m + '%</b></div>' +
      '<div class="bar"><i style="width:' + m + '%"></i></div>' +
      '<div class="gnc-row"><span>题量</span><b>' + qn + ' 题</b></div>' +
      (pre.length ? '<div class="gnc-row" style="align-items:flex-start"><span>前置</span><span class="gnc-chips">' + pre.map(function (x) { return '<a class="gnc-chip" href="#/node/' + x.id + '">' + esc(x.title) + '</a>'; }).join('') + '</span></div>' : '') +
      (ms.length ? '<div class="gnc-row" style="align-items:flex-start"><span>方法卡</span><span class="gnc-chips">' + ms.slice(0, 3).map(function (x) { return '<a class="gnc-chip" href="#/method/' + x.id + '">' + esc(x.title) + '</a>'; }).join('') + '</span></div>' : '') +
      '<div class="row" style="margin-top:10px"><a class="btn sm primary" href="#/node/' + id + '">进入节点</a><button class="btn sm" onclick="App.startNode(\'' + id + '\')">练这个</button></div>';
    card.classList.add('on');
    graphHover(id, true);
    var g = box.querySelector('.gnode[data-id="' + id + '"]');
    if (!g) return;
    var br = box.getBoundingClientRect(), gr = g.getBoundingClientRect();
    var cw = card.offsetWidth || 250, ch = card.offsetHeight || 180;
    var left = gr.left - br.left + gr.width / 2 + 14;
    var top = gr.top - br.top + gr.height / 2 - 20;
    if (left + cw > br.width - 8) left = gr.left - br.left - gr.width / 2 - cw - 14;
    card.style.left = Math.max(8, Math.min(Math.max(8, br.width - cw - 8), left)) + 'px';
    card.style.top = Math.max(8, Math.min(Math.max(8, br.height - ch - 8), top)) + 'px';
  }
  function graphStep(id) {
    var box = document.getElementById('graphBox');
    if (!box) return;
    if (!box.classList.contains('full')) { /* 保持当前视图模式 */ }
    graphCard(id);
    var g = box.querySelector('.gnode[data-id="' + id + '"]');
    if (!g) return;
    var br = box.getBoundingClientRect(), gr = g.getBoundingClientRect();
    gv.tx -= (gr.left + gr.width / 2) - (br.left + br.width / 2);
    gv.ty -= (gr.top + gr.height / 2) - (br.top + br.height / 2);
    graphApply();
    graphCard(id);
  }
  function graphInit() {
    gv = { s: 1, tx: 0, ty: 0 }; gvPtrs = {};
    var box = document.getElementById('graphBox'); if (!box) return;
    var drag = null;
    function mid() {
      var ks = Object.keys(gvPtrs); if (ks.length < 2) return null;
      var a = gvPtrs[ks[0]], b = gvPtrs[ks[1]];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
    }
    box.addEventListener('pointerdown', function (e) {
      gvPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
      if (Object.keys(gvPtrs).length === 1) drag = { x: e.clientX, y: e.clientY, tx: gv.tx, ty: gv.ty };
      else drag = null;
    });
    box.addEventListener('pointermove', function (e) {
      if (!gvPtrs[e.pointerId]) return;
      gvPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(gvPtrs).length;
      if (n >= 2) {
        var mm = mid(); if (!mm) return;
        if (!box._pd) { box._pd = mm; return; }
        var ratio = mm.d / (box._pd.d || mm.d);
        gv.s = Math.max(0.5, Math.min(3.2, gv.s * ratio));
        gv.tx += mm.x - box._pd.x; gv.ty += mm.y - box._pd.y;
        box._pd = mm; graphApply(); return;
      }
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) > 6 || Math.abs(e.clientY - drag.y) > 6) box._moved = 1;
      gv.tx = drag.tx + (e.clientX - drag.x); gv.ty = drag.ty + (e.clientY - drag.y); graphApply();
    });
    function up(e) {
      delete gvPtrs[e.pointerId];
      if (Object.keys(gvPtrs).length < 2) box._pd = null;
      if (!Object.keys(gvPtrs).length) drag = null;
    }
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('wheel', function (e) { e.preventDefault(); gv.s = Math.max(0.5, Math.min(3.2, gv.s * (e.deltaY > 0 ? 0.92 : 1.08))); graphApply(); }, { passive: false });
    /* 节点：桌面悬停出卡片，触屏点按出卡片；双击/进入按钮才跳转 */
    box.addEventListener('mouseover', function (e) {
      var g = e.target.closest ? e.target.closest('.gnode') : null;
      if (g && !gvTouch()) graphCard(g.getAttribute('data-id'));
    });
    box.addEventListener('mouseout', function (e) {
      var g = e.target.closest ? e.target.closest('.gnode') : null;
      if (g && !gvTouch()) graphCard(null);
    });
    box.addEventListener('click', function (e) {
      if (box._moved) { box._moved = 0; return; }
      var g = e.target.closest ? e.target.closest('.gnode') : null;
      if (!g) return;
      var id = g.getAttribute('data-id');
      if (gvTouch()) { e.preventDefault(); graphCard(id); } else { go('#/node/' + id); }
    });
    var cardEl = document.getElementById('gnodeCard');
    if (cardEl) {
      cardEl.addEventListener('mouseenter', function () { if (gvTimer) { clearTimeout(gvTimer); gvTimer = null; } });
      cardEl.addEventListener('mouseleave', function () { graphCard(null); });
    }
  }
  function startNode(id) {
    var ids = D.questions.filter(function (q) { return q.node === id; }).map(function (q) { return q.id; });
    if (!ids.length) { toast('该节点还没有题目'); return; }
    startPractice(ids.join(','));
  }
  function renderNode(id) {
    var n = nodeById[id]; if (!n) { view.innerHTML = '<div class="card">未找到该知识节点。</div>'; return; }
    var ms = D.methods.filter(function (m) { return n.methods.indexOf(m.id) >= 0; });
    var qs = D.questions.filter(function (q) { return q.node === n.id; });
    var m = Store.masteryOf(n.id);
    var html = '<div class="phead"><span class="ico">📗</span><div class="grow"><h2>' + esc(n.title) + '</h2><p>' + esc(n.module || '函数与导数') + ' · ' + (n.diff || '') + ' · ' + qs.length + ' 道题</p></div></div>';
    html += '<div class="card elev2" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">' + ringHTML(m, m + '%', '掌握度') +
      '<div class="grow" style="min-width:210px"><p class="muted small" style="margin:0 0 8px">' + esc(n.brief) + '</p>' +
      '<p class="small" style="margin:0"><b>课标要求：</b>' + esc(n.req) + '</p>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" onclick="App.startPractice(\'' + qs.map(function (q) { return q.id; }).join(',') + '\')">练本节点</button><a class="btn" href="#/map">回到图谱</a></div></div></div>';
    var atts = Store.get().attempts.filter(function (a) { return (a.nodeIds || []).indexOf(n.id) >= 0; });
    var okc = atts.filter(function (a) { return a.result === 'ok'; }).length;
    var acc = atts.length ? Math.round(okc * 100 / atts.length) : 0;
    var lastT = atts.length ? new Date(atts[0].createdAt).toLocaleDateString() : '还没练过';
    html += '<div class="kpi" style="margin-bottom:14px"><div class="stat"><b>' + acc + '%</b><span>本节点正确率</span></div><div class="stat"><b>' + atts.length + '</b><span>已练次数</span></div><div class="stat"><b>' + qs.length + '</b><span>题目总数</span></div><div class="stat"><b style="font-size:15px;padding-top:4px">' + lastT + '</b><span>最近练习</span></div></div>';
    html += '<div class="card"><div class="phead"><span class="ico">🧩</span><div class="grow"><h2>方法卡</h2><p>共 ' + ms.length + ' 张 · 识别信号 → 步骤 → 易错点</p></div></div><div class="list">' +
      ms.map(function (mm) { return '<a class="item elev" href="#/method/' + mm.id + '"><div class="row"><b class="grow">' + esc(mm.title) + '</b>' + diffTag(mm.diff) + '</div><div class="small muted" style="margin-top:4px">' + esc(mm.trigger) + '</div></a>'; }).join('') + '</div></div>';
    html += '<div class="card"><div class="phead"><span class="ico">📝</span><div class="grow"><h2>相关题目</h2><p>按难度分组 · 可单题练习</p></div></div>' +
      ['基础', '中档', '压轴'].map(function (d) {
        var arr = qs.filter(function (q) { return q.diff === d; });
        if (!arr.length) return '';
        return '<div class="small muted" style="margin:10px 0 6px">' + d + ' · ' + arr.length + ' 道</div><div class="list">' +
          arr.map(function (q) { return '<div class="item"><div>' + esc(q.stem) + '</div><div class="row" style="margin-top:8px"><span class="tag">' + typeName(q.type) + '</span><button class="btn sm primary" onclick="App.startSingle(\'' + q.id + '\')">练这题</button></div></div>'; }).join('') + '</div>';
      }).join('') + '</div>';
    view.innerHTML = html;
    animateRings();
  }
  function renderMethod(id) {
    var m = methodById[id]; if (!m) { view.innerHTML = '<div class="card">未找到该方法卡。</div>'; return; }
    var n = nodeById[m.node] || {};
    var card = Store.get().reviews['method:' + m.id] || {};
    var html = '<div class="phead"><span class="ico">🧩</span><div class="grow"><h2>方法卡</h2><p>' + esc(n.title || '') + ' · ' + (m.diff || '') + '</p></div></div>';
    html += '<div class="flip" onclick="App.flipCard()"><div class="flip-inner" id="flipInner">' +
      '<div class="flip-face front"><div class="flip-tag">识别信号</div><h2>' + esc(m.title) + '</h2><p class="muted">' + esc(m.trigger) + '</p><div class="flip-hint">点击翻面看步骤 →</div></div>' +
      '<div class="flip-face back"><div class="flip-tag">步骤 · 公式 · 易错点</div><ol class="steps">' + m.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="small"><b>公式/依据：</b>' + esc(m.formula) + '</p><p class="small" style="color:#b91c1c"><b>易错：</b>' + esc(m.mistake) + '</p><div class="flip-hint">点击翻回正面 ←</div></div>' +
      '</div></div>';
    html += '<div class="card" style="text-align:center"><p class="small muted" style="margin-top:0">这张卡掌握得怎么样？</p><div class="row" style="justify-content:center"><button class="btn" onclick="event.stopPropagation();App.reviewCard(\'method:' + m.id + '\',0)">不会</button><button class="btn" onclick="event.stopPropagation();App.reviewCard(\'method:' + m.id + '\',1)">半会</button><button class="btn primary" onclick="event.stopPropagation();App.reviewCard(\'method:' + m.id + '\',2)">会了</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">已复习 ' + (card.reps || 0) + ' 次</p>' +
      '<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm" onclick="event.stopPropagation();App.toggleFav(\'' + m.id + '\')">' + (isFav(m.id) ? '★ 已收藏' : '☆ 收藏') + '</button><a class="btn sm" href="#/node/' + m.node + '">看所属知识点</a></div></div>';
    view.innerHTML = html;
    if (window.Anim && Anim.ok()) Anim.fadeIn('.flip', 40);
  }
  function flipCard() { var el = document.getElementById('flipInner'); if (el) el.classList.toggle('flipped'); }
  function isFav(id) { var f = (Store.get().settings || {}).fav || []; return f.indexOf(id) >= 0; }
  function toggleFav(id) {
    var st = Store.get().settings; st.fav = st.fav || [];
    var i = st.fav.indexOf(id);
    if (i >= 0) st.fav.splice(i, 1); else st.fav.push(id);
    Store.save(); toast(i >= 0 ? '已取消收藏' : '已收藏该方法卡'); router();
  }
  function applyTheme() { var t = (Store.get().settings || {}).theme || 'light'; document.body.classList.toggle('dark', t === 'dark'); }
  function setTheme(t) { Store.get().settings.theme = t; Store.save(); applyTheme(); toast(t === 'dark' ? '已切换到深色' : '已切换到浅色'); renderSettings(); }
  function clearDraft() { var q = session.list[session.i]; if (q && window.InputTools && InputTools.clearPad) InputTools.clearPad('draftPad', q.id); }
  /* ============ 练习 ============ */
  var session = { list: [], i: 0, answered: false, lastAttempt: null };
  var pf = { diff: '', type: '', count: 8, adaptive: true };
  function setPF(k, v) { pf[k] = v; renderPractice(); }
  function renderPractice() {
    if (session.list.length) { renderQuestion(); return; }
    var qs = D.questions.filter(function (q) { return inMod(q); });
    var basic = qs.filter(function (q) { return q.diff === '基础'; }).length;
    var mid = qs.filter(function (q) { return q.diff === '中档'; }).length;
    var hard = qs.filter(function (q) { return q.diff === '压轴'; }).length;
    var total = qs.length || 1;
    var html = modbar();
    html += '<div class="card elev2"><div class="phead"><span class="ico">✏️</span><div class="grow"><h2>练习设置</h2><p>' + esc(curModule()) + ' · 共 ' + qs.length + ' 题</p></div></div>';
    html += '<div class="small muted" style="margin-bottom:6px">难度</div><div class="row">' + ['', '基础', '中档', '压轴'].map(function (d) { return '<button class="chip' + (pf.diff === d ? ' on' : '') + '" onclick="App.setPF(\'diff\',\'' + d + '\')">' + (d || '全部') + '</button>'; }).join('') + '</div>';
    html += '<div class="small muted" style="margin:12px 0 6px">题型</div><div class="row">' + [['', '全部'], ['choice', '选择'], ['fill', '填空'], ['solution', '解答']].map(function (t) { return '<button class="chip' + (pf.type === t[0] ? ' on' : '') + '" onclick="App.setPF(\'type\',\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') + '</div>';
    html += '<div class="small muted" style="margin:12px 0 6px">题量</div><div class="row">' + [8, 12, 20, 48].map(function (n) { return '<button class="chip' + (pf.count === n ? ' on' : '') + '" onclick="App.setPF(\'count\',' + n + ')">' + n + '</button>'; }).join('') + '</div>';
    html += '<div class="small muted" style="margin:12px 0 6px">出题策略</div><div class="row"><button class="chip' + (pf.adaptive !== false ? ' on' : '') + '" onclick="App.setPF(\'adaptive\',' + (pf.adaptive === false ? 'true' : 'false') + ')">自适应：弱项多练</button></div>' +
      '<div class="small muted" style="margin:14px 0 6px">本模块难度分布</div><div class="bars7" style="height:72px">' +
      '<div><i style="height:' + Math.max(4, Math.round(basic * 100 / total)) + '%"></i><span>基础 ' + basic + '</span></div>' +
      '<div><i style="height:' + Math.max(4, Math.round(mid * 100 / total)) + '%"></i><span>中档 ' + mid + '</span></div>' +
      '<div><i style="height:' + Math.max(4, Math.round(hard * 100 / total)) + '%"></i><span>压轴 ' + hard + '</span></div></div>';
    html += '<div class="row" style="margin-top:16px"><button class="btn primary" onclick="App.beginPractice()">开始练习</button><button class="btn" onclick="App.beginPractice(true)">交错练习</button></div></div>';
    var favs = (Store.get().settings.fav || []).map(function (id) { return methodById[id]; }).filter(Boolean);
    if (favs.length) html += '<div class="card"><div class="phead"><span class="ico">⭐</span><div class="grow"><h2>收藏的方法</h2><p>共 ' + favs.length + ' 张，随时翻看</p></div></div><div class="list">' + favs.map(function (mm) { return '<a class="item elev" href="#/method/' + mm.id + '"><div class="row"><b class="grow">' + esc(mm.title) + '</b>' + diffTag(mm.diff) + '</div><div class="small muted" style="margin-top:4px">' + esc(mm.trigger) + '</div></a>'; }).join('') + '</div></div>';
    var ns = D.nodes.filter(function (n) { return (n.module || '函数与导数') === curModule(); });
    var rec = ns.map(function (n) { return { n: n, m: Store.masteryOf(n.id) }; }).filter(function (r) { return D.questions.some(function (q) { return q.node === r.n.id; }); }).sort(function (a, b) { return a.m - b.m; }).slice(0, 3);
    if (rec.length) {
      html += '<div class="card"><div class="phead"><span class="ico">🧠</span><div class="grow"><h2>智能推荐</h2><p>按掌握度最低挑选，优先补短板</p></div></div><div class="list">' + rec.map(function (r) {
        var ids = D.questions.filter(function (q) { return q.node === r.n.id; }).map(function (q) { return q.id; });
        return '<div class="item"><div class="row"><div class="grow"><b>' + esc(r.n.title) + '</b><div class="small muted">' + esc(r.n.brief) + '</div></div><span class="tag">' + r.m + '%</span></div><div class="row" style="margin-top:8px"><button class="btn sm primary" onclick="App.startPractice(\'' + ids.join(',') + '\')">练这个节点</button></div></div>';
      }).join('') + '</div></div>';
    }
    var wrong = qs.filter(function (q) { return Store.wrong().some(function (a) { return a.questionId === q.id; }); });
    if (wrong.length) html += '<div class="card"><div class="phead"><span class="ico">🧯</span><div class="grow"><h2>重点复习</h2><p>做错过的题 · ' + wrong.length + ' 道</p></div></div><button class="btn accent" onclick="App.startPractice(\'' + wrong.map(function (q) { return q.id; }).join(',') + '\')">全部重做</button></div>';
    view.innerHTML = html;
  }
  function pickQuestions(interleave) {
    var d = pf.diff, t = pf.type, c = pf.count || 8;
    var arr = D.questions.filter(function (q) { return inMod(q) && (!d || q.diff === d) && (!t || q.type === t); });
    if (interleave) { var seen = {}, out = []; arr.forEach(function (q) { if (!seen[q.node]) { seen[q.node] = 1; out.push(q); } }); arr.forEach(function (q) { if (out.indexOf(q) < 0) out.push(q); }); arr = out; }
    else if (pf.adaptive !== false && !d) {
      arr = arr.map(function (q) { return { q: q, r: Math.random() * 28 }; })
        .sort(function (a, b) { return (Store.masteryOf(a.q.node) - a.r) - (Store.masteryOf(b.q.node) - b.r); })
        .map(function (x) { return x.q; });
    }
    return arr.slice(0, c);
  }
  function beginPractice(interleave) { session = { list: pickQuestions(interleave), i: 0, answered: false, lastAttempt: null, done: 0, got: 0, results: [] }; if (!session.list.length) { toast('没有符合条件的题目'); return; } renderQuestion(); }
  function startPractice(ids) { session = { list: ids.split(',').map(function (x) { return qById[x]; }).filter(Boolean), i: 0, answered: false, lastAttempt: null, done: 0, got: 0, results: [] }; renderQuestion(); }
  function startSingle(id) { startPractice(id); }
  function renderQuestion() {
    var q = session.list[session.i]; if (!q) { renderSessionEnd(); return; }
    var html = '<div class="card"><div class="row"><span class="tag">第 ' + (session.i + 1) + ' / ' + session.list.length + ' 题</span>' + diffTag(q.diff) + '<span class="tag p">' + typeName(q.type) + '</span><a class="tag" href="#/node/' + q.node + '">' + esc(nodeById[q.node].title) + '</a></div>';
    html += '<div class="qbox" style="margin-top:12px;font-size:16px">' + esc(q.stem) + '</div>';
    if (q.type === 'choice') {
      html += '<div style="margin-top:12px" id="opts">' + q.options.map(function (o, i) { return '<div class="opt" data-k="' + 'ABCD'[i] + '" onclick="App.selOpt(this)"><b>' + 'ABCD'[i] + '.</b><span>' + esc(o) + '</span></div>'; }).join('') + '</div>';
    } else if (q.type === 'fill') {
      html += '<div style="margin-top:12px"><input type="text" id="fillInput" placeholder="输入答案，如 x≥1"></div>' + InputTools.toolbarHTML('fillInput');
    } else {
      html += '<div style="margin-top:12px"><textarea id="solInput" placeholder="写下你的解答过程"></textarea></div>' + InputTools.toolbarHTML('solInput');
    }
    html += '<div class="seclabel" style="margin-top:16px">你的思路（可选，AI 据此指出错在哪）</div><textarea id="stepsInput" placeholder="例如：先求定义域 → 求导 → 判断单调性 → 找极值"></textarea>' + InputTools.toolbarHTML('stepsInput');
    html += '<div class="card tight draft-card" id="draftCard" style="margin-top:12px">' +
      '<div class="row"><b class="grow small">草稿纸 · 自动保存</b>' +
      '<span class="penwrap" data-penfor="draftPad">' + [3, 6, 10].map(function (w, i) { return '<button class="penbtn' + (i === 0 ? ' on' : '') + '" data-w="' + w + '" onclick="InputTools.padPen(\'draftPad\',' + w + ')">' + (i === 0 ? '细' : i === 1 ? '中' : '粗') + '</button>'; }).join('') + '</span>' +
      '<button class="btn sm" onclick="InputTools.padUndo(\'draftPad\')">撤销</button>' +
      '<button class="btn sm" onclick="App.clearDraft()">清空</button>' +
      '<button class="btn sm primary" id="draftFullBtn" onclick="InputTools.padFull(\'draftPad\')">全屏</button></div>' +
      '<canvas id="draftPad" class="draft" width="760" height="320"></canvas></div>';
    html += '<div id="ansArea"></div>';
    html += '<div class="row" style="margin-top:14px"><button class="btn primary" id="submitBtn" onclick="App.submit()">提交</button><button class="btn ghost" onclick="App.nextQ()">跳过</button></div>';
    html += '</div>';
    view.innerHTML = html;
    session.answered = false;
    session.qStart = Date.now();
    if (window.InputTools && InputTools.pad) InputTools.pad('draftPad', q.id);
  }
  function selOpt(el) { Array.prototype.forEach.call(document.querySelectorAll('#opts .opt'), function (o) { o.classList.remove('sel'); }); el.classList.add('sel'); }
  function norm(s) { return String(s || '').replace(/\s+/g, '').replace(/[×xX]/g, 'x').replace(/[－—–−]/g, '-').replace(/[，,]/g, '').toLowerCase(); }
  function submit() {
    if (session.answered) return;
    var q = session.list[session.i], result = 'no', userAnswer = '';
    if (q.type === 'choice') { var sel = document.querySelector('#opts .opt.sel'); if (!sel) { toast('请选择一个选项'); return; } userAnswer = sel.dataset.k; result = (userAnswer === q.answer) ? 'ok' : 'no'; }
    else if (q.type === 'fill') { userAnswer = (document.getElementById('fillInput') || {}).value || ''; result = (norm(userAnswer) === norm(q.answer)) ? 'ok' : 'no'; }
    else { userAnswer = (document.getElementById('solInput') || {}).value || ''; result = 'half'; }
    var userSteps = (document.getElementById('stepsInput') || {}).value || '';
    var img = (window.InputTools ? (InputTools.getImage('fillInput') || InputTools.getImage('solInput') || InputTools.getImage('stepsInput')) : null);
    session.answered = true;
    var attempt = { id: 'a' + Date.now(), questionId: q.id, nodeIds: [q.node], methodIds: q.methods, difficulty: q.diff, userAnswer: userAnswer, userSteps: userSteps, imageDataUrl: img || '', result: result, errorType: '', createdAt: Date.now() };
    attempt.timeSpent = session.qStart ? Math.round((Date.now() - session.qStart) / 1000) : 0;
    session.results = session.results || [];
    session.results.push({ qid: q.id, result: result, spent: attempt.timeSpent });
    Store.addAttempt(attempt); session.lastAttempt = attempt; session.done = (session.done || 0) + 1; if (result === 'ok') session.got = (session.got || 0) + 1;
    Store.grade('question:' + q.id, result === 'ok' ? 2 : result === 'half' ? 1 : 0);
    q.methods.forEach(function (mid) { if (Store.get().reviews['method:' + mid]) Store.grade('method:' + mid, result === 'ok' ? 2 : result === 'half' ? 1 : 0); });
    showAnswer(q, result, userAnswer);
    updateMini();
  }
  function showAnswer(q, result, userAnswer) {
    var label = result === 'ok' ? '<span class="result-ok">✓ 正确</span>' : result === 'half' ? '<span class="result-half">≈ 已自评</span>' : '<span class="result-no">✗ 再想想</span>';
    var html = '<div class="ans-area"><div class="row">' + label + '<span class="grow"></span><span class="small muted">你的答案：' + esc(userAnswer || '（未填）') + '</span></div>';
    html += '<p style="margin-top:10px"><b>参考答案：</b>' + esc(q.answer) + '</p><p><b>解析：</b>' + esc(q.steps) + '</p>';
    if (result === 'solution') { }
    if (q.type === 'solution') {
      html += '<p class="small muted">自评（写入复习计划）：</p><div class="row"><button class="btn sm" onclick="App.selfRate(0)">不会</button><button class="btn sm" onclick="App.selfRate(1)">半会</button><button class="btn sm primary" onclick="App.selfRate(2)">会了</button></div>';
    } else if (result !== 'ok') {
      var sug = suggestErr(q, userAnswer, (session.lastAttempt || {}).userSteps || '');
      var sim = D.questions.filter(function (x) { return x.id !== q.id && x.node === q.node && x.diff === q.diff; })[0] || D.questions.filter(function (x) { return x.id !== q.id && x.node === q.node; })[0];
      if (sim) html += '<p style="margin-top:8px"><button class="btn sm primary" onclick="App.startSingle(\'' + sim.id + '\')">练一道相似的</button></p>';
      html += '<p class="small muted" style="margin-top:8px">错因归类（已按你的作答自动推荐：<b>' + sug + '</b>，可改）：</p><div class="row">' + ['知识', '方法', '计算', '审题', '心态'].map(function (t) { return '<button class="chip' + (t === sug ? ' on' : '') + '" onclick="App.tagError(\'' + t + '\')">' + t + '</button>'; }).join('') + '</div>' + '<p style="margin-top:8px"><button class="btn sm" onclick="App.overrideOk()">其实我会，标为掌握</button></p>';
    }
    html += '<div id="aiArea"></div>';
    html += '<div class="row" style="margin-top:12px"><button class="btn accent" onclick="App.aiExplain()">🤖 AI 讲解</button><button class="btn" onclick="App.speakAnswer()">🔊 朗读解析</button><button class="btn" onclick="App.stopSpeak()">⏹ 停止</button><button class="btn primary" onclick="App.nextQ()">下一题 →</button></div></div>';
    document.getElementById('ansArea').innerHTML = html;
    document.getElementById('submitBtn').disabled = true;
  }
  function suggestErr(q, ua, us) {
    var ref = q.answer || '', spent = session.qStart ? (Date.now() - session.qStart) / 1000 : 99;
    if (!us) return '方法';
    if (spent < 8) return '审题';
    var a = String(ua || '').replace(/[\s×x]/g, ''), b = String(ref).replace(/[\s×x]/g, '');
    if (a && b && a !== b && (a.length === b.length || a.replace(/[-−]/g, '') === b.replace(/[-−]/g, ''))) return '计算';
    return '知识';
  }
  function selfRate(g) { var q = session.list[session.i]; Store.grade('question:' + q.id, g); if (session.lastAttempt) { session.lastAttempt.result = g === 2 ? 'ok' : g === 1 ? 'half' : 'no'; } toast(SRS.label(g) + '，已安排复习'); }
  function tagError(t) { if (session.lastAttempt) { session.lastAttempt.errorType = t; var a = Store.get().attempts; for (var i = 0; i < a.length; i++) { if (a[i].id === session.lastAttempt.id) a[i].errorType = t; } Store.save(); } toast('已标记：' + t); }
  function overrideOk() { var q = session.list[session.i]; var a = Store.get().attempts; for (var i = 0; i < a.length; i++) { if (a[i].id === session.lastAttempt.id) { a[i].result = 'ok'; } } Store.save(); Store.grade('question:' + q.id, 2); toast('已标为掌握'); }
  function nextQ() { session.i += 1; session.answered = false; if (session.i >= session.list.length) renderSessionEnd(); else renderQuestion(); }
  function renderSessionEnd() {
    var done = session.done || 0, got = session.got || 0;
    var pct = done ? Math.round(got * 100 / done) : 0;
    var res = session.results || [];
    var wrongIds = res.filter(function (r) { return r.result !== 'ok'; }).map(function (r) { return r.qid; });
    var listHtml = res.map(function (r, i) {
      var q = qById[r.qid] || {};
      var mark = r.result === 'ok' ? '<span class="result-ok">✓</span>' : r.result === 'half' ? '<span class="result-half">≈</span>' : '<span class="result-no">✗</span>';
      return '<div class="item"><div class="row"><span style="width:20px">' + mark + '</span><span class="grow small">' + esc((q.stem || '').slice(0, 30)) + '…</span><span class="small muted">' + r.spent + ' 秒</span></div></div>';
    }).join('');
    view.innerHTML = '<div class="card elev2" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">' +
      ringHTML(pct, pct + '%', '正确率') +
      '<div class="grow" style="min-width:200px"><h1 style="margin:0">本组完成 🎉</h1>' +
      '<p class="muted small" style="margin:6px 0 12px">共 ' + done + ' 题 · 正确 ' + got + ' 题 · 已计入掌握度与复习计划</p>' +
      '<div class="row"><button class="btn primary" onclick="App.resetPractice()">再来一组</button>' +
      (wrongIds.length ? '<button class="btn accent" onclick="App.startPractice(\'' + wrongIds.join(',') + '\')">只重做错题（' + wrongIds.length + '）</button>' : '') +
      '<a class="btn" href="#/stats">查看统计</a></div></div></div>' +
      (res.length ? '<div class="card"><div class="phead"><span class="ico">📋</span><div class="grow"><h2>本组逐题回顾</h2><p>对错与用时</p></div></div><div class="list">' + listHtml + '</div></div>' : '');
    animateRings();
  }
  function resetPractice() { session = { list: [], i: 0, answered: false }; renderPractice(); }

  function speakAnswer() { var q = session.list[session.i]; if (!q) return; InputTools.speak('题目。' + q.stem + '。参考答案：' + q.answer + '。解析：' + q.steps, Store.get().settings.voice || {}); }
  function stopSpeak() { InputTools.stopSpeak(); }
  function aiExplain() {
    var q = session.list[session.i], box = document.getElementById('aiArea'); if (!q || !box) return;
    var att = session.lastAttempt || {}, cfg = Store.get().settings.ai || {};
    if (!cfg.enabled || !cfg.proxyUrl) { renderAI(AI.rule(q, att.userAnswer, att.userSteps)); return; }
    box.innerHTML = AI.blobHTML('AI 正在分析你的思路…');
    AI.analyze({ question: q.stem, reference: q.answer, refSteps: q.steps, userAnswer: att.userAnswer || '', userSteps: att.userSteps || '', errorType: att.errorType || '', imageDataUrl: att.imageDataUrl || '' }, cfg.proxyUrl)
      .then(function (a) { a.source = 'ai'; renderAI(a); })
      .catch(function () { renderAI(AI.rule(q, att.userAnswer, att.userSteps)); });
  }
  function renderAI(a) {
    var box = document.getElementById('aiArea'); if (!box) return;
    box.innerHTML = AI.render(a);
    if (session.lastAttempt) {
      session.lastAttempt.aiAnalysis = a; session.lastAttempt.aiAt = Date.now();
      var arr = Store.get().attempts;
      for (var i = 0; i < arr.length; i++) { if (arr[i].id === session.lastAttempt.id) { arr[i].aiAnalysis = a; arr[i].aiAt = Date.now(); } }
      Store.save();
    }
    var v = Store.get().settings.voice || {};
    if (v.autoSpeak) { var txt = '判定：' + (a.verdict || '') + '。' + (a.whereWrong || []).map(function (x) { return (x.where || '') + '：' + (x.what || '') + '。' + (x.why || ''); }).join('') + ' 正确步骤：' + (a.correctSteps || ''); InputTools.speak(txt, v); }
  }
  /* ============ 错题本 ============ */
  var wf = { err: '', mod: '' };
  function setWF(k, v) { wf[k] = v; renderWrong(); }
  function renderWrong() {
    var wrongs = Store.wrong(), seen = {}, list = [];
    wrongs.forEach(function (a) { if (!seen[a.questionId]) { seen[a.questionId] = 1; list.push(a); } });
    var cnt = {}, lastErr = {};
    wrongs.forEach(function (a) { cnt[a.questionId] = (cnt[a.questionId] || 0) + 1; if (!lastErr[a.questionId] && a.errorType) lastErr[a.questionId] = a.errorType; });
    var byErr = {}; wrongs.forEach(function (a) { if (a.errorType) byErr[a.errorType] = (byErr[a.errorType] || 0) + 1; });
    var topErr = Object.keys(byErr).sort(function (a, b) { return byErr[b] - byErr[a]; })[0];
    var ADVICE = { '知识': '先把对应知识点的方法卡过一遍，再回来做题', '方法': '重点练「识别信号 → 步骤」，看方法卡比盲目刷题更有效', '计算': '做题时把关键步骤写下来，避免跳步和符号错误', '审题': '读题时圈出条件与所求，先想清楚再动笔', '心态': '做限时训练，先从基础题找回手感' };
    var errs = ['知识', '方法', '计算', '审题', '心态'];
    var html = '<div class="phead"><span class="ico">📕</span><div class="grow"><h2>错题本</h2><p>共 ' + list.length + ' 道待攻克</p></div>' + (list.length ? '<button class="btn sm accent" onclick="App.startPractice(\'' + list.map(function (a) { return a.questionId; }).join(',') + '\')">全部重做</button>' : '') + '</div>';
    var customs = (Store.get().settings.customWrong || []);
    html += '<div class="card"><div class="phead"><span class="ico">✍️</span><div class="grow"><h2>错题速记</h2><p>把试卷上的错题抄下来，随时回看</p></div></div>' +
      '<textarea id="cwStem" placeholder="题干（可只写关键条件）"></textarea>' +
      '<div class="row" style="margin-top:8px"><input type="text" id="cwAns" placeholder="参考答案（可空）" style="flex:1"><select id="cwErr" style="padding:8px;border:1px solid var(--line);border-radius:10px"><option>知识</option><option>方法</option><option>计算</option><option>审题</option><option>心态</option></select><button class="btn sm primary" onclick="App.addCustomWrong()">加入错题本</button></div>' +
      (customs.length ? '<div class="list" style="margin-top:12px">' + customs.map(function (c) { return '<div class="item"><div class="row"><span class="tag a">' + esc(c.err) + '</span><span class="small muted grow">' + new Date(c.at).toLocaleDateString() + '</span></div><div style="margin-top:6px">' + esc(c.stem) + '</div>' + (c.answer ? '<div class="small muted" style="margin-top:4px">参考答案：' + esc(c.answer) + '</div>' : '') + '<div class="row" style="margin-top:8px"><button class="btn sm" onclick="App.delCustomWrong(\'' + c.id + '\')">删除</button></div></div>'; }).join('') + '</div>' : '') + '</div>';
    html += (function () {
      if (!topErr) return '';
      var ids = list.filter(function (a) { return a.errorType === topErr; }).map(function (a) { return a.questionId; });
      return '<div class="card elev2" style="border-left:5px solid var(--accent)"><div class="phead" style="margin-bottom:6px"><span class="ico">🩺</span><div class="grow"><h2>错因分析报告</h2><p>你最常犯的是「' + topErr + '」类错误（' + byErr[topErr] + ' 次）</p></div></div><p class="small" style="margin:0 0 10px"><b>建议：</b>' + (ADVICE[topErr] || '') + '</p>' + (ids.length ? '<button class="btn accent" onclick="App.startPractice(\'' + ids.join(',') + '\')">针对「' + topErr + '」专项练习（' + ids.length + '）</button>' : '') + '</div>';
    })();
    html += '<div class="card"><div class="small muted" style="margin-bottom:6px">按错因筛选</div><div class="row"><button class="chip' + (wf.err === '' ? ' on' : '') + '" onclick="App.setWF(\'err\',\'\')">全部</button>' +
      errs.map(function (e) { return '<button class="chip' + (wf.err === e ? ' on' : '') + '" onclick="App.setWF(\'err\',\'' + e + '\')">' + e + '</button>'; }).join('') + '</div>' +
      '<div class="small muted" style="margin:12px 0 6px">错误次数</div><div class="row"><button class="chip' + ((wf.times || 'all') === 'all' ? ' on' : '') + '" onclick="App.setWF(\'times\',\'all\')">全部</button><button class="chip' + (wf.times === '2' ? ' on' : '') + '" onclick="App.setWF(\'times\',\'2\')">错 2 次以上</button></div>' +
      '<div class="small muted" style="margin:12px 0 6px">按模块筛选</div><div class="row"><button class="chip' + (wf.mod === '' ? ' on' : '') + '" onclick="App.setWF(\'mod\',\'\')">全部</button>' +
      ['函数与导数', '三角函数', '数列'].map(function (m) { return '<button class="chip' + (wf.mod === m ? ' on' : '') + '" onclick="App.setWF(\'mod\',\'' + m + '\')">' + m + '</button>'; }).join('') + '</div></div>';
    var show = list.filter(function (a) {
      var q = qById[a.questionId]; if (!q) return false;
      if (wf.times === '2' && (cnt[a.questionId] || 0) < 2) return false;
      if (wf.err && a.errorType !== wf.err) return false;
      if (wf.mod && (q.module || '函数与导数') !== wf.mod) return false;
      return true;
    });
    if (!show.length) html += '<div class="card muted small">没有符合条件的错题。</div>';
    else html += '<div class="list">' + show.map(function (a) {
      var q = qById[a.questionId];
      return '<div class="item elev"><div class="row">' + diffTag(q.diff) + '<span class="tag p">' + esc(q.module || '函数与导数') + '</span>' + (a.errorType ? '<span class="tag a">' + a.errorType + '</span>' : '<span class="tag">未归因</span>') + '<span class="tag">错 ' + (cnt[a.questionId] || 1) + ' 次</span>' + '</div>' +
        '<div style="margin-top:6px">' + esc(q.stem) + '</div>' +
        '<div class="row" style="margin-top:8px"><button class="btn sm primary" onclick="App.startSingle(\'' + q.id + '\')">重做</button><a class="btn sm" href="#/node/' + q.node + '">看知识点</a></div></div>';
    }).join('') + '</div>';
    view.innerHTML = html;
  }
  /* ============ 统计 ============ */
  function radarSVG(items) {
    var n = items.length; if (!n) return '';
    var cx = 170, cy = 150, R = 100, axes = '', poly = [], rings = '';
    [0.25, 0.5, 0.75, 1].forEach(function (k) {
      var pts = [];
      items.forEach(function (it, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push((cx + Math.cos(a) * R * k).toFixed(1) + ',' + (cy + Math.sin(a) * R * k).toFixed(1)); });
      rings += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#eef1f4"/>';
    });
    items.forEach(function (it, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * R).toFixed(1) + '" y2="' + (cy + Math.sin(a) * R).toFixed(1) + '" stroke="#e2e8f0"/>';
      axes += '<text x="' + (cx + Math.cos(a) * (R + 28)).toFixed(1) + '" y="' + (cy + Math.sin(a) * (R + 28)).toFixed(1) + '" font-size="10" fill="#64748b" text-anchor="middle">' + esc(it.n.title.slice(0, 6)) + '</text>';
      var rr = R * it.m / 100;
      poly.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    });
    var pstr = poly.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 340 300" style="width:100%;height:auto;max-width:380px;margin:0 auto;display:block">' + rings + axes + '<polygon points="' + pstr + '" fill="rgba(15,118,110,.22)" stroke="#0f766e" stroke-width="2"/>' + poly.map(function (q) { return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3" fill="#0f766e"/>'; }).join('') + '</svg>';
  }
  function hourHeatSVG() {
    var grid = [], max = 1, w, h;
    for (w = 0; w < 7; w++) { grid.push([]); for (h = 0; h < 24; h++) grid[w].push(0); }
    Store.get().attempts.forEach(function (a) { var d = new Date(a.createdAt || 0), ww = (d.getDay() + 6) % 7, hh = d.getHours(); grid[ww][hh]++; if (grid[ww][hh] > max) max = grid[ww][hh]; });
    var cells = '', labels = ['一', '二', '三', '四', '五', '六', '日'];
    for (w = 0; w < 7; w++) for (h = 0; h < 24; h++) { var v = grid[w][h]; var op = v ? (0.18 + 0.82 * v / max).toFixed(2) : 0; cells += '<rect x="' + (h * 15) + '" y="' + (w * 15) + '" width="13" height="13" rx="3" fill="' + (v ? 'rgba(15,118,110,' + op + ')' : '#eef1f4') + '"/>'; }
    for (w = 0; w < 7; w++) cells += '<text x="-6" y="' + (w * 15 + 10) + '" font-size="9" fill="#94a3b8" text-anchor="end">' + labels[w] + '</text>';
    [0, 6, 12, 18].forEach(function (hh) { cells += '<text x="' + (hh * 15) + '" y="118" font-size="9" fill="#94a3b8">' + hh + '时</text>'; });
    return '<svg viewBox="-22 -4 380 128" style="width:100%;height:auto">' + cells + '</svg>';
  }
  function renderStats() {
    var st = Store.stats();
    var rate = st.total ? Math.round((st.ok + st.half * 0.5) * 100 / st.total) : 0;
    var days = [];
    for (var i = 6; i >= 0; i--) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); days.push({ t: d.getTime(), n: 0, label: (d.getMonth() + 1) + '/' + d.getDate() }); }
    Store.get().attempts.forEach(function (a) { for (var i = 0; i < days.length; i++) { var end = i < days.length - 1 ? days[i + 1].t : Infinity; if ((a.createdAt || 0) >= days[i].t && (a.createdAt || 0) < end) { days[i].n++; break; } } });
    var maxDay = Math.max(1, Math.max.apply(null, days.map(function (x) { return x.n; })));
    var errs = ['知识', '方法', '计算', '审题', '心态'], colors = ['#0f766e', '#2563eb', '#f59e0b', '#ec4899', '#94a3b8'];
    var totalErr = errs.reduce(function (a, e) { return a + (st.byErr[e] || 0); }, 0) || 1;
    var C = 2 * Math.PI * 54, off = 0, segs = '';
    errs.forEach(function (e, i) { var v = st.byErr[e] || 0; var len = C * v / totalErr; segs += '<circle cx="66" cy="66" r="54" fill="none" stroke="' + colors[i] + '" stroke-width="18" stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 66 66)"/>'; off += len; });
    var nodes = D.nodes.filter(function (n) { return (n.module || '函数与导数') === curModule(); });
    var ranked = nodes.map(function (n) { return { n: n, m: Store.masteryOf(n.id) }; }).sort(function (a, b) { return a.m - b.m; });

    var html = modbar() + '<div class="phead"><span class="ico">📊</span><div class="grow"><h2>学习统计</h2><p>' + esc(curModule()) + ' · 共 ' + st.total + ' 次作答</p></div></div>';
    html += '<div class="kpi" style="margin-bottom:14px">' +
      '<div class="stat"><b>' + st.total + '</b><span>累计作答</span></div>' +
      '<div class="stat"><b>' + rate + '%</b><span>加权正确率</span></div>' +
      '<div class="stat"><b>' + st.wrongCount + '</b><span>错题</span></div>' +
      '<div class="stat"><b>' + dueReview().length + '</b><span>待复习</span></div></div>';
    html += '<div class="card"><div class="phead"><span class="ico">📅</span><div class="grow"><h2>近 7 天活跃</h2><p>每天完成的作答数</p></div></div><div class="bars7">' +
      days.map(function (x) { return '<div><i style="height:' + Math.max(4, Math.round(x.n * 100 / maxDay)) + '%"></i><span>' + x.label + '</span></div>'; }).join('') + '</div></div>';
    html += '<div class="card"><div class="phead"><span class="ico">🧯</span><div class="grow"><h2>错因分布</h2><p>标记过的错题按原因归类</p></div></div><div class="row" style="align-items:center;gap:22px">' +
      '<div class="donut"><svg width="132" height="132" viewBox="0 0 132 132"><circle cx="66" cy="66" r="54" fill="none" stroke="#eef1f4" stroke-width="18"/>' + segs + '</svg>' +
      '<div class="val" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:var(--primary)">' + totalErr + '</div></div>' +
      '<div class="legend">' + errs.map(function (e, i) { return '<span><i style="background:' + colors[i] + '"></i>' + e + ' ' + (st.byErr[e] || 0) + '</span>'; }).join('') + '</div></div></div>';
    var allN = D.nodes, mSum = 0; allN.forEach(function (n) { mSum += Store.masteryOf(n.id); });
    var mAvg = allN.length ? Math.round(mSum / allN.length) : 0;
    var est = Math.round(mAvg / 100 * 150);
    html += '<div class="card elev2" style="border-left:5px solid var(--primary)"><div class="phead" style="margin-bottom:6px"><span class="ico">🎯</span><div class="grow"><h2>预估得分区间</h2><p>按总掌握度 ' + mAvg + '% 粗略折算（满分 150）</p></div></div><div class="row"><b style="font-size:34px;color:var(--primary)">' + Math.max(0, est - 12) + ' ~ ' + Math.min(150, est + 12) + '</b><span class="small muted">分　（仅供参考，不等于真实考试结果）</span></div></div>';
    var radarItems = D.nodes.filter(function (n) { return (n.module || '函数与导数') === curModule(); }).slice(0, 8).map(function (n) { return { n: n, m: Store.masteryOf(n.id) }; });
    html += '<div class="card"><div class="phead"><span class="ico">🕸️</span><div class="grow"><h2>知识点雷达</h2><p>每个方向=一个节点，越靠外掌握越好</p></div></div>' + radarSVG(radarItems) + '</div>';
    html += '<div class="card"><div class="phead"><span class="ico">⏰</span><div class="grow"><h2>学习时段热力图</h2><p>横轴=24 小时 · 纵轴=周一到周日</p></div></div>' + hourHeatSVG() + '</div>';
    html += '<div class="card"><div class="phead"><span class="ico">📚</span><div class="grow"><h2>三个模块对比</h2><p>掌握度 / 题量 / 已练</p></div></div>' +
      ['函数与导数', '三角函数', '数列'].map(function (mn) {
        var ns = D.nodes.filter(function (n) { return (n.module || '函数与导数') === mn; });
        var sum = 0; ns.forEach(function (n) { sum += Store.masteryOf(n.id); });
        var avg2 = ns.length ? Math.round(sum / ns.length) : 0;
        var qs2 = D.questions.filter(function (q) { return (q.module || '函数与导数') === mn; });
        var ids = {}; qs2.forEach(function (q) { ids[q.id] = 1; });
        var done2 = Store.get().attempts.filter(function (a) { return ids[a.questionId]; }).length;
        var grad = mn === '三角函数' ? 'linear-gradient(90deg,#2563eb,#38bdf8)' : mn === '数列' ? 'linear-gradient(90deg,#7c3aed,#c084fc)' : 'linear-gradient(90deg,#0f766e,#2dd4bf)';
        return '<div style="margin:10px 0"><div class="row"><b class="grow small">' + mn + '</b><span class="small muted">已练 ' + done2 + '/' + qs2.length + ' 题 · ' + avg2 + '%</span></div>' +
          '<div class="bar" style="margin-top:6px"><i style="width:' + avg2 + '%;background:' + grad + '"></i></div></div>';
      }).join('') + '</div>';
    html += '<div class="card"><div class="phead"><span class="ico">🎯</span><div class="grow"><h2>掌握度排行</h2><p>按掌握度从低到高</p></div></div><div class="list">' +
      ranked.map(function (r) { return '<div class="item"><div class="row"><span class="grow small">' + esc(r.n.title) + '</span><b class="small">' + r.m + '%</b></div><div class="bar" style="margin-top:6px"><i style="width:' + r.m + '%"></i></div></div>'; }).join('') + '</div></div>';
    view.innerHTML = html;
  }
  /* ============ 搜索 ============ */
  var se = { engine: 'local' };
  function setSE(e) { se.engine = e; renderSearch(); }
  function renderSearch() {
    var engines = [['local', '站内'], ['baidu', '百度'], ['bili', 'B站'], ['zhihu', '知乎']];
    view.innerHTML = '<div class="phead"><span class="ico">🔍</span><div class="grow"><h2>搜索</h2><p>站内搜知识点/方法卡/题目，或跳到外部引擎</p></div></div>' +
      '<div class="card elev2"><div class="row" style="margin-bottom:10px">' + engines.map(function (e) { return '<button class="chip' + (se.engine === e[0] ? ' on' : '') + '" onclick="App.setSE(\'' + e[0] + '\')">' + e[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row"><input type="text" id="q" placeholder="' + (se.engine === 'local' ? '输入关键词，如：单调性、切线、恒成立' : '输入关键词后回车，跳到对应网站') + '" style="flex:1" oninput="App.doSearch()" onkeydown="if(event.key===String.fromCharCode(13))App.doSearch()"><button class="btn primary" onclick="App.doSearch()">搜索</button></div></div><div id="searchRes"></div>';
  }

  function doSearch() {
    var k = (document.getElementById('q').value || '').trim(); var box = document.getElementById('searchRes');
    function hl(s2) { return esc(s2).split(esc(k)).join('<mark>' + esc(k) + '</mark>'); }
    if (!k) { box.innerHTML = ''; return; }
    if (se.engine !== 'local') {
      var map = { baidu: 'https://www.baidu.com/s?wd=', bili: 'https://search.bilibili.com/all?keyword=', zhihu: 'https://www.zhihu.com/search?type=content&q=' };
      window.open(map[se.engine] + encodeURIComponent(k), '_blank');
      box.innerHTML = '<div class="card small muted">已在新标签打开「' + se.engine + '」搜索：' + esc(k) + '</div>';
      return;
    }
    var ns = D.nodes.filter(function (n) { return (n.title + n.brief + n.req).indexOf(k) >= 0; });
    var ms = D.methods.filter(function (m) { return (m.title + m.trigger + m.steps.join('') + m.formula + m.mistake).indexOf(k) >= 0; });
    var qs = D.questions.filter(function (q) { return (q.stem + q.answer + q.steps).indexOf(k) >= 0; });
    var html = '';
    if (ns.length) html += '<div class="card"><h2>知识点</h2><div class="list">' + ns.map(function (n) { return '<a class="item" href="#/node/' + n.id + '"><b>' + hl(n.title) + '</b><div class="small muted">' + hl(n.brief) + '</div></a>'; }).join('') + '</div></div>';
    if (ms.length) html += '<div class="card"><h2>方法卡</h2><div class="list">' + ms.map(function (m) { return '<a class="item" href="#/method/' + m.id + '"><b>' + hl(m.title) + '</b><div class="small muted">' + hl(m.trigger) + '</div></a>'; }).join('') + '</div></div>';
    if (qs.length) html += '<div class="card"><h2>题目</h2><div class="list">' + qs.map(function (q) { return '<div class="item"><div class="row">' + diffTag(q.diff) + '<span class="tag">' + typeName(q.type) + '</span></div><div style="margin-top:6px">' + hl(q.stem) + '</div><button class="btn sm" style="margin-top:8px" onclick="App.startSingle(\'' + q.id + '\')">练这题</button></div>'; }).join('') + '</div></div>';
    box.innerHTML = html || '<div class="card muted">没有找到相关内容。</div>';
  }

  /* ============ 设置 ============ */
  /* ============ 设置（iOS 式分段 Tab） ============ */
  var setKey = 'look';
  function setSetTab(k) {
    var keys = ['look', 'voice', 'ai', 'data', 'sync'];
    var i = keys.indexOf(k); if (i < 0) i = 0;
    setKey = keys[i];
    var seg = document.getElementById('setSeg');
    if (seg) Array.prototype.forEach.call(seg.querySelectorAll('.set-segbtn'), function (b, n) { b.classList.toggle('on', n === i); });
    var ind = document.getElementById('setInd');
    if (ind) ind.style.transform = 'translateX(' + (i * 100) + '%)';
    keys.forEach(function (key, n) {
      var panel = document.getElementById('setp-' + key);
      if (panel) panel.classList.toggle('on', n === i);
    });
  }
  function setRow(label, note, control) {
    return '<div class="set-row"><div class="set-lab"><b>' + label + '</b>' + (note ? '<span>' + note + '</span>' : '') + '</div>' + control + '</div>';
  }
  function toggle(id, checked) {
    return '<label class="set-switch"><input type="checkbox" id="' + id + '" class="set-cb"' + (checked ? ' checked' : '') + '><span class="set-sw"></span></label>';
  }
  function select(id, opts, cur) {
    return '<select class="set-select" id="' + id + '">' + opts.map(function (v) { return '<option' + (String(v) === String(cur) ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>';
  }
  /* ---------- 云同步：UI 处理 ---------- */
  function syncMsg(txt, ok) {
    var el = document.getElementById('syncMsg');
    if (el) { el.textContent = txt; el.style.color = ok ? '' : 'var(--warn)'; }
  }
  function syncRefresh() {
    if (!window.Sync) { syncMsg('同步模块未加载', false); return; }
    var st = Sync.status();
    if (!st.configured) { syncMsg('未启用：先填上面两项', false); return; }
    var t = st.lastSyncAt ? new Date(st.lastSyncAt).toLocaleString() : '还没同步过';
    syncMsg('已启用 · ' + st.repo + ' · ' + (st.codeHint ? '当前码 ' + st.codeHint + ' · ' : '') + '最近同步：' + t, true);
  }
  function syncSave() {
    if (!window.Sync) return;
    var repo = (document.getElementById('syncRepo') || {}).value || '';
    var token = (document.getElementById('syncToken') || {}).value || '';
    var branch = ((document.getElementById('syncBranch') || {}).value || 'main').trim() || 'main';
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').trim())) { syncMsg('仓库要写成 owner/repo，例如 kerrrr-85/gml-sync', false); return; }
    if (token.trim().length < 20) { syncMsg('Token 看起来不完整', false); return; }
    if (/^sb_|supabase/i.test(token)) { syncMsg('这是 Supabase 的密钥，这里要填 GitHub token', false); return; }
    Sync.saveCfg({ repo: repo.trim(), token: token.trim(), branch: branch, mode: 'code' });
    toast('已保存');
    syncRefresh();
  }
  function syncTest() {
    if (!window.Sync) return;
    syncMsg('检测中…', true);
    Sync.test().then(function (r) {
      if (!r.private) { syncMsg('⚠️ 这个仓库是公开的！请改成私有，否则密文会被别人看到', false); return; }
      if (!r.canPush) { syncMsg('token 只能读不能写：请在细粒度 token 里给 Contents 读写权限', false); return; }
      syncMsg('连接正常：' + r.repo + '（私有）· 可读写', true);
    }).catch(function (e) { syncMsg(e.message, false); });
  }
  function syncShowCode(code, title) {
    var old = document.getElementById('syncCodeModal');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.className = 'modal'; box.id = 'syncCodeModal';
    box.innerHTML = '<div class="modalbox" style="max-width:420px;text-align:center">' +
      '<h2 style="margin-bottom:6px">' + title + '</h2>' +
      '<p class="small muted" style="margin-bottom:14px">这串码就是密钥，<b>只显示这一次</b>，请抄到安全的地方</p>' +
      '<div style="font-family:ui-monospace,Consolas,monospace;font-size:19px;font-weight:700;letter-spacing:.14em;padding:16px 10px;border:1px dashed var(--line);border-radius:14px;word-break:break-all">' + code + '</div>' +
      '<div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary" onclick="App.syncCopy(\'' + code + '\')">复制</button>' +
      '<button class="btn" onclick="document.getElementById(\'syncCodeModal\').remove()">我已保存</button></div></div>';
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
    document.body.appendChild(box);
  }
  function syncCopy(code) { if (window.InputTools && InputTools.copyText) { InputTools.copyText(code); toast('已复制'); } else { toast('请手动选中复制'); } }
  function syncCreate() {
    if (!window.Sync) return;
    syncMsg('正在加密上传…', true);
    Sync.createCode().then(function (code) { syncRefresh(); syncShowCode(code, '同步码已生成'); })
      .catch(function (e) { syncMsg(e.message, false); });
  }
  function syncRotate() {
    if (!window.Sync) return;
    syncMsg('正在生成新码并作废旧码…', true);
    Sync.rotate().then(function (code) { syncRefresh(); syncShowCode(code, '新同步码已生成（旧码已作废）'); })
      .catch(function (e) { syncMsg(e.message, false); });
  }
  function syncRestore() {
    if (!window.Sync) return;
    var v = (document.getElementById('syncCodeInput') || {}).value || '';
    var box = document.getElementById('syncCodeMsg');
    if (box) box.textContent = '正在拉取并合并…';
    Sync.restore(v).then(function (r) {
      if (box) box.textContent = '已合并：作答记录 ' + r.total + ' 条（本次新增 ' + r.added + ' 条）。本机数据只多不少。';
      toast('恢复完成');
      updateMini();
    }).catch(function (e) { if (box) box.textContent = e.message; });
  }

  function renderSettings(startKey) {
    if (startKey && ['look', 'voice', 'ai', 'data', 'sync'].indexOf(startKey) >= 0) setKey = startKey;
    var s = Store.get().settings, raw = Store.get();
    var size = 0; try { size = (JSON.stringify(raw).length / 1024).toFixed(1); } catch (e) {}
    var cards = Object.keys(raw.reviews || {}).length, tries = (raw.attempts || []).length;
    var theme = s.theme || 'light';

    var look =
      '<div class="set-group">' +
        '<div class="set-h">主题</div>' +
        setRow('浅色 / 深色', '深色适合夜里刷题', '<div class="row" style="gap:8px"><button class="chip' + (theme === 'light' ? ' on' : '') + '" onclick="App.setTheme(\'light\')">浅色</button><button class="chip' + (theme === 'dark' ? ' on' : '') + '" onclick="App.setTheme(\'dark\')">深色</button></div>') +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">星空彩蛋</div>' +
        setRow('夜间星空', '23:30 之后门户自动亮起，次日 06:00 恢复', '<a class="btn sm" href="?night=1#/" target="_blank" rel="noopener">预览</a>') +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">关于</div>' +
        setRow('版本', '函数与导数 · 三角函数 · 数列', '<span class="set-val">v54</span>') +
        setRow('数据存储', '只存在这台设备，不上传', '<span class="set-val">本机</span>') +
      '</div>';

    var voice =
      '<div class="set-group">' +
        '<div class="set-h">朗读</div>' +
        setRow('语速', '越大读得越快', '<div class="set-range"><input type="range" id="voRate" min="0.6" max="1.6" step="0.1" value="' + ((s.voice && s.voice.rate) || 1) + '"><span id="voRateVal">' + ((s.voice && s.voice.rate) || 1) + '×</span></div>') +
        setRow('音色', '来自系统语音库', '<select class="set-select" id="voVoice"></select>') +
        setRow('自动朗读', 'AI 讲解结束后自动读', toggle('voAuto', !!(s.voice && s.voice.autoSpeak))) +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">自检</div>' +
        '<div class="set-row set-actions"><button class="btn sm" onclick="App.testVoice()">试听</button><button class="btn sm" onclick="App.voiceDiag()">语音诊断</button></div>' +
        '<p class="set-note" id="voDiag">点「语音诊断」检查环境是否支持朗读与语音输入</p>' +
      '</div>';

    var ai =
      '<div class="set-group">' +
        '<div class="set-h">AI 讲解</div>' +
        setRow('启用 AI 讲解', '答题后手动点击才调用', toggle('aiEnabled', !!(s.ai && s.ai.enabled))) +
        setRow('代理地址', 'Cloudflare Worker，Key 不进前端', '<input type="text" class="set-input" id="aiUrl" value="' + esc((s.ai && s.ai.proxyUrl) || '') + '" placeholder="https://xxx.workers.dev">') +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">连通性</div>' +
        '<div class="set-row set-actions"><button class="btn sm primary" onclick="App.testAI()">测试连接</button></div>' +
        '<p class="set-note" id="aiTest">未测试</p>' +
      '</div>';

    var data =
      '<div class="set-group">' +
        '<div class="set-h">本机数据</div>' +
        setRow('复习卡', '按遗忘曲线排期', '<span class="set-val">' + cards + ' 张</span>') +
        setRow('作答记录', '含错因与用时', '<span class="set-val">' + tries + ' 次</span>') +
        setRow('占用体积', '含草稿与设置', '<span class="set-val">约 ' + size + ' KB</span>') +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">学习节奏</div>' +
        setRow('每日新卡', '每天最多解锁几张', select('sNew', [4, 6, 10, 15, 20], s.newPerDay)) +
        setRow('每日复习', '每天最多复习几张', select('sRev', [10, 20, 30, 50, 80], s.reviewPerDay)) +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">导出 / 导入</div>' +
        '<div class="set-row set-actions"><button class="btn sm" onclick="App.exportData()">导出 JSON</button><button class="btn sm" onclick="App.exportWrongMd()">导出错题本 MD</button><button class="btn sm" onclick="document.getElementById(\'impFile\').click()">导入 JSON</button><input type="file" id="impFile" accept="application/json" style="display:none" onchange="App.importData(this)"></div>' +
        '<p class="set-note">换设备时：先导出 JSON，再到新设备导入即可完整迁移进度。</p>' +
      '</div>' +
      '<div class="set-group set-danger">' +
        '<div class="set-h">危险操作</div>' +
        '<div class="set-row set-actions"><button class="btn sm" onclick="App.forceUpdate()">强制更新</button><button class="btn sm accent" onclick="App.resetData()">清空全部进度</button></div>' +
        '<p class="set-note">清空不可恢复，建议先导出备份。</p>' +
      '</div>';

    var sync =
      '<div class="set-group">' +
        '<div class="set-h">GitHub 私有仓</div>' +
        setRow('仓库', '形如 kerrrr-85/gml-sync，必须是私有的', '<input type="text" class="set-input" id="syncRepo" value="' + esc((s.sync && s.sync.repo) || '') + '" placeholder="owner/repo">') +
        setRow('Token', '细粒度 PAT，只给这一个库的 Contents 读写', '<input type="password" class="set-input" id="syncToken" value="' + esc((s.sync && s.sync.token) || '') + '" placeholder="github_pat_... 或 ghp_...">') +
        setRow('分支', '一般不用改', '<input type="text" class="set-input" id="syncBranch" style="max-width:140px" value="' + esc((s.sync && s.sync.branch) || 'main') + '" placeholder="main">') +
        '<div class="set-row set-actions"><button class="btn sm primary" onclick="App.syncSave()">保存并启用</button><button class="btn sm" onclick="App.syncTest()">连通性自检</button></div>' +
        '<p class="set-note" id="syncMsg">读取中…</p>' +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">通道一 · 同步码（免登录）</div>' +
        '<div class="set-row set-actions"><button class="btn sm primary" onclick="App.syncCreate()">生成同步码</button><button class="btn sm" onclick="App.syncRotate()">重新生成（旧码作废）</button></div>' +
        '<div class="set-row"><div class="set-lab"><b>用同步码恢复</b><span>在另一台设备输入这 20 位</span></div><input type="text" class="set-input" id="syncCodeInput" maxlength="26" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" style="font-family:ui-monospace,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase"></div>' +
        '<div class="set-row set-actions"><button class="btn sm" onclick="App.syncRestore()">恢复并合并</button></div>' +
        '<p class="set-note" id="syncCodeMsg">同步码就是密钥，服务端只存密文、我们也解不开，丢了只能重新生成。</p>' +
      '</div>' +
      '<div class="set-group">' +
        '<div class="set-h">账号登录 · 暂缓</div>' +
        '<p class="set-note" id="syncAcct">真账号需要一台中间服务器：GitHub 的登录接口不允许网页直连（没有跨域头），而 Cloudflare 的免费域名在国内又不通。<br><br>' +
        '现在用下面这两套兜底就够：<br>' +
        '① <b>同步码</b>（上面的通道一）：换设备搬数据<br>' +
        '② <b>导出 / 导入 JSON</b>（「数据」页）：最后一道保险，永远可用</p>' +
      '</div>' +
      '<p class="set-note" style="padding:0 4px 14px">只同步 <b>复习卡 / 作答记录 / 掌握度 / 设置</b>；手写草稿纸、天气缓存、B站记录<b>不同步</b>。<br>换设备前建议先到「数据」页<b>导出 JSON</b> 备份一次 —— 那是永远可用的最后一道保险。</p>';

    view.innerHTML =
      '<div class="set-wrap">' +
        '<div class="phead"><span class="ico">⚙</span><div class="grow"><h2>设置</h2><p>版本 v76 · 数据只存在本机</p></div></div>' +
        '<div class="set-seg five" id="setSeg">' +
          '<button class="set-segbtn" data-k="look" onclick="App.setSetTab(\'look\')">外观</button>' +
          '<button class="set-segbtn" data-k="voice" onclick="App.setSetTab(\'voice\')">语音</button>' +
          '<button class="set-segbtn" data-k="ai" onclick="App.setSetTab(\'ai\')">AI</button>' +
          '<button class="set-segbtn" data-k="data" onclick="App.setSetTab(\'data\')">数据</button>' +
          '<button class="set-segbtn" data-k="sync" onclick="App.setSetTab(\'sync\')">同步</button>' +
          '<span class="set-segind" id="setInd"></span>' +
        '</div>' +
        '<div class="set-panel" id="setp-look">' + look + '</div>' +
        '<div class="set-panel" id="setp-voice">' + voice + '</div>' +
        '<div class="set-panel" id="setp-ai">' + ai + '</div>' +
        '<div class="set-panel" id="setp-data">' + data + '</div>' +
        '<div class="set-panel" id="setp-sync">' + sync + '</div>' +
        '<div class="set-save"><span class="set-note">改动只保存在这台设备</span><button class="btn primary" onclick="App.saveSettings()">保存设置</button></div>' +
      '</div>';
    setSetTab(setKey);
    fillVoices();
    syncRefresh();
    var r = document.getElementById('voRate'), rv = document.getElementById('voRateVal');
    if (r && rv) r.addEventListener('input', function () { rv.textContent = r.value + '×'; });
  }

  function fillVoices() { setTimeout(function () { var sel = document.getElementById('voVoice'); if (!sel) return; var vs = InputTools.voices(); var cur = (Store.get().settings.voice || {}).voiceUri || ''; sel.innerHTML = '<option value="">系统默认</option>' + vs.map(function (v) { var nm = String(v.name).replace(/^Microsoft\s+/i, '').replace(/\s*-\s*[^-]*$/, ''); if (nm.length > 16) nm = nm.slice(0, 16) + '…'; return '<option value="' + v.voiceURI + '"' + (cur === v.voiceURI ? ' selected' : '') + '>' + nm + '（' + v.lang + '）</option>'; }).join(''); }, 250); }
  function testVoice() { InputTools.speak('这是一段语音试听。如果听到了，说明朗读功能正常。', Store.get().settings.voice || {}); }
  function voiceDiag() {
    var d = InputTools.diag(), box = document.getElementById('voDiag');
    var txt = 'HTTPS：' + (d.https ? '是' : '否（语音输入会失败）') + '｜网页语音识别：' + (d.hasASR ? '支持' : '不支持') + '｜朗读：' + (d.hasTTS ? '支持' : '不支持') + '｜可用音色：' + d.voices + ' 个（中文 ' + d.zhVoices + ' 个）';
    if (!d.zhVoices && d.hasTTS) txt += '｜未检测到中文音色，朗读可能无声，请在系统设置安装中文语音包。';
    if (box) box.textContent = txt; else alert(txt);
  }
  function testAI() { var url = (document.getElementById('aiUrl') || {}).value || ''; var box = document.getElementById('aiTest'); if (box) box.textContent = '检测中…'; AI.health(url).then(function (r) { if (box) box.textContent = (r && r.ok) ? '连接成功 ✓' : '返回异常'; }).catch(function (e) { if (box) box.textContent = '连接失败：' + e.message; }); }
  function saveSettings() { var s = Store.get().settings; s.newPerDay = parseInt(document.getElementById('sNew').value, 10); s.reviewPerDay = parseInt(document.getElementById('sRev').value, 10); s.ai = s.ai || {}; s.ai.proxyUrl = (document.getElementById('aiUrl') || {}).value || ''; s.ai.enabled = !!(document.getElementById('aiEnabled') || {}).checked; s.voice = s.voice || {}; s.voice.rate = parseFloat((document.getElementById('voRate') || {}).value || '1'); s.voice.voiceUri = (document.getElementById('voVoice') || {}).value || ''; s.voice.autoSpeak = !!(document.getElementById('voAuto') || {}).checked; Store.save(); toast('已保存'); updateMini(); }
  function exportWrongMd() {
    var list = Store.wrong(), seen = {}, lines = ['# 错题本', '', '导出时间：' + new Date().toLocaleString(), ''];
    list.forEach(function (a) {
      if (seen[a.questionId]) return; seen[a.questionId] = 1;
      var q = qById[a.questionId]; if (!q) return;
      var node = nodeById[q.node] || {};
      lines.push('## ' + (q.module || '函数与导数') + ' · ' + node.title + ' · ' + q.diff);
      lines.push(''); lines.push('**题目：** ' + q.stem);
      lines.push(''); lines.push('**我的错因：** ' + (a.errorType || '未归因'));
      lines.push(''); lines.push('**参考答案：** ' + q.answer);
      lines.push(''); lines.push('**解析：** ' + q.steps);
      lines.push(''); lines.push('---'); lines.push('');
    });
    var b = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a2 = document.createElement('a'); a2.href = URL.createObjectURL(b); a2.download = '错题本.md'; a2.click();
  }
  function exportData() { var b = new Blob([Store.exportJSON()], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gaokao-math-progress.json'; a.click(); }
  function importData(input) { var f = input.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { Store.importJSON(r.result); toast('导入成功'); router(); } catch (e) { toast('导入失败：' + e.message); } }; r.readAsText(f); }
  function forceUpdate() {
    function done() { location.reload(); }
    if (!('serviceWorker' in navigator)) { done(); return; }
    var p1 = navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); });
    var p2 = (window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : Promise.resolve());
    Promise.all([p1, p2]).then(done, done);
  }
  function resetData() { if (confirm('确定清空所有进度吗？此操作不可恢复。')) { Store.reset(); toast('已清空'); router(); } }


  /* ============ 路由 ============ */
  function router() {
    var h = location.hash.replace(/^#\/?/, ''); var parts = h.split('/').filter(Boolean); var page = parts[0] || 'portal';
    window.scrollTo(0, 0); setTab(page);
    if (page === 'node') renderNode(parts[1]);
    else if (page === 'method') renderMethod(parts[1]);
    else if (page === 'map') renderMap();
    else if (page === 'practice') { renderPractice(); if (parts[1] === 'start' && !session.list.length) { setTimeout(function () { beginPractice(false); }, 0); } }
    else if (page === 'wrong') renderWrong();
    else if (page === 'stats') renderStats();
    else if (page === 'search') renderSearch();
    else if (page === 'settings') renderSettings(parts[1]);
    else if (page === 'today') renderToday(parts[1]);
    else if (page === 'study') { history.replaceState(null, '', '#/today'); renderToday(); }
    else if (page === 'portal') Portal.renderPortal();
    else if (page === 'video') Portal.renderVideo();
    else if (page === 'globe') Globe.render(parts[1]);
    else renderHub();
    updateMini();
    if (window.Anim && Anim.ok() && page !== 'portal') Anim.pageIn();
  }

  window.App = {
    go: go, back: back, setModule: setModule, pomoToggle: pomoToggle, pomoReset: pomoReset, addCustomWrong: addCustomWrong, delCustomWrong: delCustomWrong, openModule: openModule, setPF: setPF, flipCard: flipCard, toggleFav: toggleFav, graphHover: graphHover, graphInit: graphInit, graphReset: graphReset, graphZoom: graphZoom, graphFull: graphFull, graphCard: graphCard, graphStep: graphStep, startNode: startNode, setTheme: setTheme, setSetTab: setSetTab, syncSave: syncSave, syncTest: syncTest, syncCreate: syncCreate, syncRotate: syncRotate, syncRestore: syncRestore, syncCopy: syncCopy, syncRefresh: syncRefresh, setDayTab: setDayTab, deckPick: deckPick, deckStep: deckStep, deckDown: deckDown, deckMove: deckMove, deckUp: deckUp, deckCancel: deckCancel, clearDraft: clearDraft,
    forceUpdate: forceUpdate,
    reviewCard: function (id, g) { Store.grade(id, g); toast(SRS.label(g) + '，复习计划已更新'); router(); },
    selOpt: selOpt, submit: submit, nextQ: nextQ, beginPractice: beginPractice, resetPractice: resetPractice,
    startPractice: startPractice, startSingle: startSingle, selfRate: selfRate, tagError: tagError, overrideOk: overrideOk,
    doSearch: doSearch, setWF: setWF, setSE: setSE, saveSettings: saveSettings, exportData: exportData, importData: importData, resetData: resetData,
    aiExplain: aiExplain, exportWrongMd: exportWrongMd, refreshWeather: refreshWeather, speakAnswer: speakAnswer, stopSpeak: stopSpeak, testAI: testAI, testVoice: testVoice, voiceDiag: voiceDiag
  };
  /* 站内跳转用 pushState：返回键可回到上一页；顶部「首页」一键回门户 */
  var navDepth = 0;
  function go(path) {
    if (location.hash === path) return;
    history.pushState(null, '', path);
    navDepth += 1;
    router();
  }
  function back() {
    if (navDepth > 0) { navDepth -= 1; history.back(); } else { go('#/'); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', function () { if (navDepth > 0) navDepth -= 1; router(); });
  window.addEventListener('hashchange', router);
  setInterval(function () { if (document.getElementById('wxDesc')) loadWeather(true); }, 900000);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) { navigator.serviceWorker.register('./sw.js').catch(function () {}); }
  document.addEventListener('keydown', function (e) {
    if (!session.list.length) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Enter' && tag === 'input' && !session.answered) { e.preventDefault(); submit(); }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (session.answered) nextQ(); else submit(); }
    else if (e.key === 'ArrowRight') nextQ();
    else if (e.key === '1') selfRate(0);
    else if (e.key === '2') selfRate(1);
    else if (e.key === '3') selfRate(2);
  });
  applyTheme();
  router();
})();
