/* 门户每日计划 · Parallax Pills 原生复刻
 * 无 React / 无外部依赖，数据仅存本机 localStorage。 */
(function (global) {
  'use strict';

  var PLAN_KEY = 'gml_daily_plan_v1';
  var WARDROBE_KEY = 'gml_wardrobe_v1';
  var EXAM_KEY = 'gml_exam_date';
  var AUTO_KEY = 'gml_plan_auto_date';
  var DEFAULT_EXAM = '2027-06-07';
  var CURRENT_SUBJECT = '全部';
  var overlay = null;
  var sheet = null;
  var lastFocus = null;
  var frame = 0;
  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var SUBJECTS = ['数学', '物理', '生物', '英语', '语文', '其他'];
  var COLORS = {
    '数学': '#2C6E8F', '物理': '#1D8FA3', '生物': '#4F7A62',
    '英语': '#9A6A47', '语文': '#7B648F', '其他': '#6B7280'
  };
  var WARDROBE = [
    '短袖', '衬衫', '卫衣', '毛衣', '薄外套', '厚外套', '羽绒服',
    '长裤', '运动鞋', '防水鞋'
  ];
  var DEFAULT_TASKS = [
    { text: '数学：先复习函数与导数，再做 1 组新题', subject: '数学' },
    { text: '物理：回看 1 个薄弱模型，完成 10 道基础题', subject: '物理' },
    { text: '生物：整理 1 个易错知识点', subject: '生物' },
    { text: '英语：单词 + 阅读各 20 分钟', subject: '英语' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function uuid() {
    return 'dp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function readJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function getExamDate() {
    var value = '';
    try { value = localStorage.getItem(EXAM_KEY) || ''; } catch (e) {}
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : DEFAULT_EXAM;
  }
  function daysToExam() {
    var target = new Date(getExamDate() + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  }
  function getPlan() {
    var all = readJSON(PLAN_KEY, {});
    var key = todayKey();
    if (!Array.isArray(all[key]) || !all[key].length) {
      all[key] = DEFAULT_TASKS.map(function (item) {
        return { id: uuid(), text: item.text, subject: item.subject, done: false, skipped: false, createdAt: Date.now() };
      });
      writeJSON(PLAN_KEY, all);
    }
    return all;
  }
  function savePlan(all) { writeJSON(PLAN_KEY, all); }
  function getWardrobe() {
    var saved = readJSON(WARDROBE_KEY, null);
    return Array.isArray(saved) ? saved.filter(function (x) { return WARDROBE.indexOf(x) >= 0; }) : WARDROBE.slice();
  }
  function saveWardrobe(list) { writeJSON(WARDROBE_KEY, list); }
  function weatherCache() {
    try { return JSON.parse(localStorage.getItem('gml_weather')); } catch (e) { return null; }
  }
  function weatherText(code, temp) {
    var rain = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].indexOf(Number(code)) >= 0;
    var snow = [71, 73, 75, 77, 85].indexOf(Number(code)) >= 0;
    var wardrobe = getWardrobe();
    function pick(list) {
      for (var i = 0; i < list.length; i++) if (wardrobe.indexOf(list[i]) >= 0) return list[i];
      return '';
    }
    var outer = '';
    if (temp <= 7) outer = pick(['羽绒服', '厚外套', '毛衣', '卫衣']);
    else if (temp <= 14) outer = pick(['厚外套', '毛衣', '卫衣', '薄外套']);
    else if (temp <= 21) outer = pick(['薄外套', '卫衣', '衬衫', '毛衣']);
    else if (temp <= 27) outer = pick(['衬衫', '短袖', '薄外套']);
    else outer = pick(['短袖', '衬衫']);
    var bottom = pick(['长裤']);
    var shoes = rain || snow ? pick(['防水鞋', '运动鞋']) : pick(['运动鞋']);
    var parts = [outer, bottom, shoes].filter(Boolean);
    if (!parts.length) return '先在下面选一下衣柜里现有的衣服。';
    var advice = parts.join(' + ');
    if (rain) advice += '，记得带伞';
    else if (snow) advice += '，注意保暖和防滑';
    else if (temp <= 7) advice += '，早晚再加一层';
    else if (temp >= 30) advice += '，注意防晒和补水';
    return advice;
  }
  function updateWeatherUI() {
    var d = weatherCache();
    var outfit = d ? weatherText(d.code, Number(d.temp)) : '正在读取天气，稍后给出穿衣建议。';
    var out = document.getElementById('dpOutfit');
    var mini = document.getElementById('ptPlanOutfit');
    if (out) out.textContent = outfit;
    if (mini) mini.textContent = outfit;
  }
  function updateCountdownUI() {
    var days = daysToExam();
    var main = document.getElementById('dpDays');
    var mini = document.getElementById('ptPlanDays');
    if (main) main.textContent = String(days);
    if (mini) mini.textContent = String(days);
    var input = document.getElementById('dpExamDate');
    if (input) input.value = getExamDate();
  }
  function activeItems(items) {
    return items.filter(function (x) { return !x.skipped; });
  }
  function subjectPills() {
    var subjects = ['全部'].concat(SUBJECTS);
    return subjects.map(function (name) {
      var on = name === CURRENT_SUBJECT;
      return '<button type="button" class="dp-pill dp-subject' + (on ? ' on' : '') + '" data-subject="' + esc(name) + '">' + esc(name) + '</button>';
    }).join('');
  }
  function taskCard(item) {
    var state = item.done ? ' done' : (item.skipped ? ' skipped' : '');
    var color = COLORS[item.subject] || COLORS['其他'];
    return '<article class="dp-task dp-pill' + state + '" data-id="' + esc(item.id) + '">' +
      '<button type="button" class="dp-check" data-action="done" aria-label="完成">' + (item.done ? '✓' : '') + '</button>' +
      '<div class="dp-task-copy"><span class="dp-subject-tag" style="--tag:' + color + '">' + esc(item.subject) + '</span>' +
      '<p>' + esc(item.text) + '</p></div>' +
      '<button type="button" class="dp-skip" data-action="skip" aria-label="跳过">×</button>' +
    '</article>';
  }
  function renderList() {
    var list = document.getElementById('dpList');
    if (!list) return;
    var items = getPlan()[todayKey()];
    var visible = CURRENT_SUBJECT === '全部' ? items : items.filter(function (x) { return x.subject === CURRENT_SUBJECT; });
    list.innerHTML = visible.length ? visible.map(taskCard).join('') : '<div class="dp-empty">这一科今天还没有任务，点右上角添加一条。</div>';
    var active = activeItems(items);
    var done = active.filter(function (x) { return x.done; }).length;
    var count = document.getElementById('dpCount');
    var bar = document.getElementById('dpBar');
    if (count) count.textContent = done + ' / ' + active.length;
    if (bar) bar.style.width = (active.length ? Math.round(done / active.length * 100) : 0) + '%';
    resetParallax();
  }
  function renderWardrobe() {
    var box = document.getElementById('dpWardrobeChips');
    if (!box) return;
    var chosen = getWardrobe();
    box.innerHTML = WARDROBE.map(function (name) {
      return '<button type="button" class="dp-wardrobe-chip' + (chosen.indexOf(name) >= 0 ? ' on' : '') + '" data-wardrobe="' + esc(name) + '">' + esc(name) + '</button>';
    }).join('');
  }

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'dp-overlay';
    overlay.id = 'dpOverlay';
    overlay.innerHTML =
      '<section class="dp-sheet" role="dialog" aria-modal="true" aria-labelledby="dpTitle">' +
        '<div class="dp-handle" aria-hidden="true"></div>' +
        '<header class="dp-head">' +
          '<div><p class="dp-kicker">DAILY PLAN · ' + todayKey() + '</p><h2 id="dpTitle">今天，只做眼前这一步</h2></div>' +
          '<button type="button" class="dp-close" data-action="close" aria-label="关闭">×</button>' +
        '</header>' +
        '<div class="dp-summary">' +
          '<div class="dp-count"><span id="dpDays">--</span><small>天后高考</small><em>把今天过好，就够了</em></div>' +
          '<div class="dp-outfit"><span class="dp-summary-label">今日穿衣</span><p id="dpOutfit">正在读取天气与衣柜…</p><span id="ptPlanOutfit" hidden></span></div>' +
        '</div>' +
        '<div class="dp-toolbar">' +
          '<div class="dp-subjects" id="dpSubjects">' + subjectPills() + '</div>' +
          '<button type="button" class="dp-add-toggle" data-action="toggle-add">+ 添加任务</button>' +
        '</div>' +
        '<form class="dp-add dp-hidden" id="dpAddForm">' +
          '<input id="dpNewText" type="text" maxlength="72" placeholder="今天要完成什么？" autocomplete="off">' +
          '<select id="dpNewSubject">' + SUBJECTS.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
          '<button type="submit">加入</button>' +
        '</form>' +
        '<div class="dp-list" id="dpList"></div>' +
        '<div class="dp-progress"><span id="dpCount">0 / 0</span><i><b id="dpBar"></b></i></div>' +
        '<details class="dp-details">' +
          '<summary>衣柜与考试日期</summary>' +
          '<div class="dp-detail-body">' +
            '<p class="dp-detail-label">我已有的衣服（点一下切换）</p><div class="dp-wardrobe" id="dpWardrobeChips"></div>' +
            '<label class="dp-date">高考日期 <input type="date" id="dpExamDate"></label>' +
          '</div>' +
        '</details>' +
        '<p class="dp-footnote">数据只保存在这台设备。每天第一次进入会弹出；之后点「今日计划」即可打开。</p>' +
      '</section>';
    document.body.appendChild(overlay);
    sheet = overlay.querySelector('.dp-sheet');
    renderList();
    renderWardrobe();
    updateCountdownUI();
    updateWeatherUI();
    bindEvents();
  }

  function bindEvents() {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var closeBtn = e.target.closest('[data-action="close"]');
      if (closeBtn) { close(); return; }
      var toggle = e.target.closest('[data-action="toggle-add"]');
      if (toggle) {
        var form = document.getElementById('dpAddForm');
        if (form) form.classList.toggle('dp-hidden');
        return;
      }
      var sub = e.target.closest('.dp-subject');
      if (sub) {
        CURRENT_SUBJECT = sub.getAttribute('data-subject') || '全部';
        var pills = overlay.querySelectorAll('.dp-subject');
        Array.prototype.forEach.call(pills, function (p) { p.classList.toggle('on', p === sub); });
        renderList();
        return;
      }
      var action = e.target.closest('[data-action]');
      if (action && action.closest('.dp-task')) {
        var task = action.closest('.dp-task');
        setTaskState(task.getAttribute('data-id'), action.getAttribute('data-action'));
        return;
      }
      var w = e.target.closest('[data-wardrobe]');
      if (w) {
        var list = getWardrobe();
        var name = w.getAttribute('data-wardrobe');
        var i = list.indexOf(name);
        if (i >= 0) list.splice(i, 1); else list.push(name);
        saveWardrobe(list);
        w.classList.toggle('on', i < 0);
        updateWeatherUI();
      }
    });
    var form = document.getElementById('dpAddForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('dpNewText');
      var subject = document.getElementById('dpNewSubject').value || '其他';
      var text = (input.value || '').trim();
      if (!text) return;
      var all = getPlan();
      all[todayKey()].push({ id: uuid(), text: text, subject: subject, done: false, skipped: false, createdAt: Date.now() });
      savePlan(all);
      input.value = '';
      form.classList.add('dp-hidden');
      CURRENT_SUBJECT = subject;
      var box = document.getElementById('dpSubjects');
      if (box) box.innerHTML = subjectPills();
      renderList();
    });
    var date = document.getElementById('dpExamDate');
    if (date) date.addEventListener('change', function () {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date.value)) {
        try { localStorage.setItem(EXAM_KEY, date.value); } catch (e) {}
      }
      updateCountdownUI();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('on')) close();
    });
    overlay.addEventListener('pointermove', moveParallax);
    overlay.addEventListener('pointerleave', resetParallax);
  }

  function setTaskState(id, action) {
    var all = getPlan();
    var items = all[todayKey()] || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id !== id) continue;
      if (action === 'done') { items[i].done = !items[i].done; if (items[i].done) items[i].skipped = false; }
      if (action === 'skip') { items[i].skipped = !items[i].skipped; if (items[i].skipped) items[i].done = false; }
      break;
    }
    savePlan(all);
    renderList();
  }

  function moveParallax(e) {
    if (reduced || e.pointerType === 'touch' || !sheet) return;
    var pills = sheet.querySelectorAll('.dp-pill');
    var x = e.clientX, y = e.clientY;
    Array.prototype.forEach.call(pills, function (p) {
      var r = p.getBoundingClientRect();
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var force = Math.max(0, 1 - dist / 230);
      p.style.setProperty('--px', (dx / 22 * force).toFixed(2) + 'px');
      p.style.setProperty('--py', (dy / 22 * force).toFixed(2) + 'px');
      p.style.setProperty('--rot', (dx / 280 * force).toFixed(2) + 'deg');
    });
  }
  function resetParallax() {
    if (!sheet) return;
    Array.prototype.forEach.call(sheet.querySelectorAll('.dp-pill'), function (p) {
      p.style.setProperty('--px', '0px');
      p.style.setProperty('--py', '0px');
      p.style.setProperty('--rot', '0deg');
    });
  }

  function open(auto) {
    build();
    lastFocus = document.activeElement;
    document.body.classList.add('dp-open');
    try { localStorage.setItem(AUTO_KEY, todayKey()); } catch (e) {}
    requestAnimationFrame(function () {
      overlay.classList.add('on');
      updateWeatherUI();
      updateCountdownUI();
      if (!auto) { var f = document.getElementById('dpNewText'); if (f) setTimeout(function () { f.focus(); }, 420); }
    });
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('on');
    document.body.classList.remove('dp-open');
    setTimeout(function () {
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }, 260);
  }
  function mount() {
    updateCountdownUI();
    updateWeatherUI();
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null; sheet = null;
    var last = '';
    try { last = localStorage.getItem(AUTO_KEY) || ''; } catch (e) {}
    if (last !== todayKey()) {
      clearTimeout(frame);
      frame = setTimeout(function () {
        if (document.body.classList.contains('pt-full')) open(true);
      }, 850);
    }
  }

  global.PortalPlan = {
    mount: mount,
    open: function () { open(false); },
    close: close,
    onWeather: function () { updateWeatherUI(); },
    updateWeather: updateWeatherUI,
    updateCountdown: updateCountdownUI
  };
})(window);