/* v102 首页：黑白编辑式学习控制台 */
(function (global) {
  'use strict';

  var WELCOME_KEY = 'gml_home_v102_seen';
  var homeTimer = null;
  var revealObserver = null;
  var scrollFrame = 0;
  var pointerFrame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var homeScrollHandler = null;
  var oldStopFx = global.Portal && global.Portal.stopFx;

  var GX_ICONS = {
    study: '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5zm0 7.8L4.6 7 12 3.4 19.4 7 12 10.8zM4 11.2V16l8 4 8-4v-4.8l-8 4-8-4z"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L18 9.8 14.2 6 3 17.2zM20.7 7.3a1 1 0 000-1.4l-2.6-2.6a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.7z"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M6 2a4 4 0 100 8 4 4 0 000-8zm12 12a4 4 0 100 8 4 4 0 000-8zM8 8l7.2 6.5-1.4 1.5L6.6 9.5 8 8z"/></svg>',
    wrong: '<svg viewBox="0 0 24 24"><path d="M4 3h13a3 3 0 013 3v15l-5-3-5 3-5-3-1 0V3zm3 5h7v2H7V8zm0 4h7v2H7v-2z"/></svg>',
    board: '<svg viewBox="0 0 24 24"><path d="M3 4h18v14H3V4zm2 2v10h14V6H5zm5 12h4v2h-4v-2z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 105 14.3l5.3 5.3 1.4-1.4-5.3-5.3A8 8 0 0010 2zm0 3a5 5 0 110 10 5 5 0 010-10z"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.7 0 3.2 1 4.2 2.6H7.8C8.8 5 10.3 4 12 4zM4.3 10h3.2c.1-1.2.4-2.3.8-3.2H5.6A7.9 7.9 0 004.3 10zm0 4a7.9 7.9 0 001.3 3.2h2.7c-.4-.9-.7-2-.8-3.2H4.3zm3.2-2H4.3c0-1 .2-2 .5-2.8h2.9c-.1.9-.2 1.8-.2 2.8zm9 0c0-1-.1-1.9-.2-2.8h2.9c.3.8.5 1.8.5 2.8h-3.2zm3.2 2c-.1 1.2-.4 2.3-.8 3.2h2.7A7.9 7.9 0 0019.7 14h-3.2zm-3.4 0c-.1 1.2-.4 2.3-.8 3.2h-3.8c-.4-.9-.7-2-.8-3.2h5.4zm0-2h-5.4c0-1 .3-1.9.8-2.8h3.8c.5.9.8 1.8.8 2.8zm1.6-5.4H16c.4.9.7 2 .8 3.2h-3.2c0-1-.1-2.1-.2-3.2z"/></svg>',
    solid: '<svg viewBox="0 0 24 24"><path d="M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7 3.5-7 3.5-7-3.5 7-3.5zM4 9.2l7 3.5v6.9l-7-3.5V9.2zm9 10.4v-6.9l7-3.5v6.9l-7 3.5z"/></svg>',
    calc: '<svg viewBox="0 0 24 24"><path d="M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v3h14V4H5zm1.6 5.4h2.8v2.8H6.6v-2.8zm4.4 0h2.8v2.8h-2.8v-2.8zm4.4 0h2.8v2.8h-2.8v-2.8zM6.6 14.4h2.8v2.8H6.6v-2.8zm4.4 0h2.8v5.6h-2.8v-5.6zm4.4 0h2.8v2.8h-2.8v-2.8zm0 4h2.8v1.6h-2.8v-1.6z"/></svg>',
    scan: '<svg viewBox="0 0 24 24"><path d="M9 3 7.2 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/></svg>',
    video: '<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm6 3.5v7l6-3.5-6-3.5z"/></svg>',
    doubao: '<svg viewBox="0 0 24 24"><path d="M7 3h10a4 4 0 014 4v6a4 4 0 01-4 4h-3l-5 4v-4H7a4 4 0 01-4-4V7a4 4 0 014-4zm1 5h8v2H8V8zm0 4h5v2H8v-2z"/></svg>'
  };

  var MODULES = [
    ['study', '学习台', '#/today', 0, '今日复习队列与学习热力'],
    ['practice', '练习', '#/practice', 0, '按节点、难度和题型训练'],
    ['map', '知识图谱', '#/map', 0, '先修关系与掌握度地图'],
    ['wrong', '错题本', '#/wrong', 0, '错因归因、重做与导出'],
    ['search', '搜索', '#/search', 0, '知识点、方法卡和题目检索'],
    ['video', 'B站视频', '#/video', 0, '按专题整理的精选课程'],
    ['globe', '地球', '#/globe', 0, '三维地球与高精度地图'],
    ['solid', '立体几何', 'https://www.geogebra.org/3d', 1, 'GeoGebra 三维作图'],
    ['calc', '计算器', 'https://www.geogebra.org/calculator', 1, 'GeoGebra 科学计算'],
    ['scan', '拍照解题', 'https://mathsolver.microsoft.com/', 1, '微软数学识别与求解'],
    ['board', '白板', 'https://drawnix.com', 1, '无限画布整理思路'],
    ['doubao', '豆包', 'https://www.doubao.com/chat/', 1, '外部 AI 对话助手']
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function dateLabel() {
    var d = new Date();
    var w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + w;
  }
  function clockLabel() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function examDays() {
    var raw = '';
    try { raw = localStorage.getItem('gml_exam_date') || ''; } catch (e) {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw = '2027-06-07';
    var target = new Date(raw + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  }
  function todayAttempts() {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    return Store.get().attempts.filter(function (a) { return (a.createdAt || 0) >= start.getTime(); }).length;
  }
  function streakDays() {
    var days = {};
    Store.get().attempts.forEach(function (a) {
      var d = new Date(a.createdAt || 0);
      d.setHours(0, 0, 0, 0);
      days[d.getTime()] = 1;
    });
    var n = 0;
    var t = new Date();
    t.setHours(0, 0, 0, 0);
    while (days[t.getTime()]) {
      n++;
      t.setDate(t.getDate() - 1);
    }
    return n;
  }
  function masteryAvg() {
    var nodes = global.DATA ? DATA.nodes : [];
    if (!nodes.length) return 0;
    var sum = 0;
    nodes.forEach(function (n) { sum += Store.masteryOf(n.id); });
    return Math.round(sum / nodes.length);
  }
  function rankedNodes(limit) {
    var nodes = global.DATA ? DATA.nodes.slice() : [];
    nodes.sort(function (a, b) { return Store.masteryOf(a.id) - Store.masteryOf(b.id); });
    return limit ? nodes.slice(0, limit) : nodes;
  }
  function currentModule() {
    return (Store.get().settings && Store.get().settings.module) || '函数与导数';
  }

  function metric(value, label, note) {
    return '<div class="gx-metric"><b>' + esc(value) + '</b><span>' + esc(label) + '</span><small>' + esc(note) + '</small></div>';
  }
  function heroLink(key, index, title, text, href, ext) {
    var attrs = ext ? ' target="_blank" rel="noopener"' : '';
    return '<a class="gx-hero-link" href="' + href + '"' + attrs + '>' +
      '<span class="gx-hero-link-media"><img src="./assets/ink-hero.jpg?v=102" alt="" loading="lazy"></span>' +
      '<span class="gx-hero-link-index">' + index + '</span>' +
      '<span class="gx-hero-link-copy"><b>' + esc(title) + '</b><small>' + esc(text) + '</small></span>' +
      '<span class="gx-hero-link-arrow">↗</span></a>';
  }
  function moduleCard(item, index) {
    var key = item[0], title = item[1], href = item[2], ext = item[3], text = item[4];
    var attrs = ext ? ' target="_blank" rel="noopener"' : '';
    return '<a class="gx-module" href="' + href + '"' + attrs + '>' +
      '<span class="gx-module-top"><span class="gx-module-no">' + String(index + 1).padStart(2, '0') + '</span><span class="gx-module-icon">' + (GX_ICONS[key] || '') + '</span></span>' +
      '<span class="gx-module-copy"><b>' + esc(title) + '</b><small>' + esc(text) + '</small></span>' +
      '<span class="gx-module-arrow">↗</span></a>';
  }
  function weakRows() {
    return rankedNodes(5).map(function (n) {
      var pct = Store.masteryOf(n.id);
      return '<a class="gx-weak-row" href="#/node/' + encodeURIComponent(n.id) + '">' +
        '<span class="gx-weak-title"><b>' + esc(n.title) + '</b><small>' + esc(n.module || '函数与导数') + '</small></span>' +
        '<span class="gx-weak-value">' + pct + '%</span>' +
        '<span class="gx-weak-bar"><i style="width:' + Math.max(3, pct) + '%"></i></span></a>';
    }).join('');
  }

  function renderPortal() {
    var v = document.getElementById('view');
    var night = global.Portal.isNight ? Portal.isNight() : false;
    var st = Store.stats();
    var avg = masteryAvg();
    var days = examDays();
    var due = Store.dueCards().length;
    var streak = streakDays();
    var today = todayAttempts();
    document.body.classList.add('pt-full');
    document.body.classList.toggle('portal-dark', night);

    v.innerHTML =
      '<div class="gx-home' + (night ? ' is-night' : '') + '" id="ptLanding">' +
        '<div class="gx-noise" aria-hidden="true"></div>' +
        '<header class="gx-nav">' +
          '<button class="gx-brand" type="button" onclick="Portal.homeScroll(\'gxTop\')">' +
            '<span class="gx-brand-mark">G</span><span class="gx-brand-copy"><b>高考学习台</b><small>GAOKAO MATH LAB / 2027</small></span>' +
          '</button>' +
          '<nav class="gx-navlinks" aria-label="首页导航">' +
            '<button type="button" onclick="Portal.homeScroll(\'gxFocus\')">今日</button>' +
            '<button type="button" onclick="Portal.homeScroll(\'gxModules\')">模块</button>' +
            '<button type="button" onclick="Portal.homeScroll(\'gxProgress\')">进度</button>' +
            '<button type="button" onclick="Portal.homeScroll(\'gxTools\')">工具</button>' +
            '<a href="#/settings">设置</a>' +
          '</nav>' +
          '<div class="gx-nav-meta"><span id="gxClock">' + clockLabel() + '</span><i></i><span>' + esc(dateLabel()) + '</span></div>' +
        '</header>' +

        '<section class="gx-hero" id="gxTop">' +
          '<div class="gx-hero-media" aria-hidden="true"><img src="./assets/ink-hero.jpg?v=102" alt=""></div>' +
          '<div class="gx-hero-shade" aria-hidden="true"></div>' +
          '<div class="gx-hero-grid">' +
            '<div class="gx-hero-copy gx-reveal">' +
              '<div class="gx-kicker"><span class="gx-chip">GML.26</span><span>本地优先 · 数据不上传 · 每天推进一点</span></div>' +
              '<h1><span>把每一步</span><span class="gx-outline">变成底气</span></h1>' +
              '<p>函数、三角、数列，以及物理与生物视频。先看方向，再做眼前这一题。</p>' +
              '<div class="gx-hero-actions">' +
                '<a class="gx-cta" href="#/practice/start"><span>开始今天的练习</span><i>↗</i></a>' +
                '<button class="gx-cta gx-cta-ghost" type="button" onclick="PortalPlan.open()"><span>打开今日计划</span><i>＋</i></button>' +
              '</div>' +
            '</div>' +
            '<aside class="gx-hero-aside gx-reveal">' +
              '<div class="gx-countdown"><small>DISTANCE / 高考</small><b>' + days + '</b><span>天</span><p>把今天过好，就够了。</p></div>' +
              '<div class="gx-hero-signal"><span>平均掌握</span><b>' + avg + '%</b><i style="--v:' + avg + '"></i></div>' +
            '</aside>' +
          '</div>' +
          '<div class="gx-hero-bottom gx-reveal">' +
            '<div class="gx-hero-status"><span>OVER TIME / 今日轨迹</span><p><b>' + today + '</b> 次作答 · <b>' + due + '</b> 张待复习 · 连续 <b>' + streak + '</b> 天</p></div>' +
            '<div class="gx-hero-links">' +
              heroLink('study', '01', '学习台', '先看清今天该做什么', '#/today', false) +
              heroLink('practice', '02', '智能训练', '从薄弱点直接开始', '#/practice', false) +
            '</div>' +
          '</div>' +
        '</section>' +

        '<div class="gx-ticker" aria-hidden="true"><span>28 KNOWLEDGE NODES</span><i></i><span>56 METHOD CARDS</span><i></i><span>112 PRACTICE QUESTIONS</span><i></i><span>LOCAL-FIRST LEARNING SYSTEM</span></div>' +

        '<section class="gx-section gx-focus" id="gxFocus">' +
          '<div class="gx-section-tag"><span>S.01</span><b>今日焦点</b></div>' +
          '<div class="gx-statement gx-reveal"><p>今天，只把眼前这一步做扎实。</p><h2>复习、练习、记录，<br>让每一步都有下一步。</h2></div>' +
          '<div class="gx-focus-grid">' +
            '<button class="gx-weather gx-reveal" type="button" onclick="Outfit.open()">' +
              '<span class="gx-weather-art" aria-hidden="true"><i></i><i></i><i></i></span>' +
              '<span class="gx-weather-top"><small>LOCAL WEATHER</small><span id="ptDesc">加载中…</span></span>' +
              '<span class="gx-weather-main"><b id="ptTemp">--°</b><span><strong id="ptCity">青树坪</strong><small id="ptRange">今日 --~--°</small></span></span>' +
              '<span class="gx-weather-foot"><b id="ptWOutfit">正在读取穿衣建议…</b><small>点开查看完整穿衣面板 ↗</small></span>' +
            '</button>' +
            '<div class="gx-stat-board gx-reveal">' +
              metric(DATA.nodes.length, '知识节点', 'NODES') +
              metric(DATA.methods.length, '方法卡', 'METHODS') +
              metric(DATA.questions.length, '练习题目', 'QUESTIONS') +
              metric(st.total, '累计作答', 'ATTEMPTS') +
              metric(st.wrongCount, '错题记录', 'REVIEW') +
              metric(avg + '%', '平均掌握', 'MASTERY') +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="gx-section gx-modules" id="gxModules">' +
          '<div class="gx-section-tag"><span>S.02</span><b>学习模块</b></div>' +
          '<div class="gx-statement gx-reveal"><p>你的学习，不只是一套题。</p><h2>从一个入口进入，<br>把知识变成可调用的方法。</h2></div>' +
          '<div class="gx-module-grid gx-reveal">' + MODULES.map(moduleCard).join('') + '</div>' +
          '<div class="gx-inline-link"><span>当前模块 · ' + esc(currentModule()) + '</span><a href="#/map">查看知识图谱 <i>↗</i></a></div>' +
        '</section>' +

        '<section class="gx-progress" id="gxProgress">' +
          '<div class="gx-progress-head gx-reveal"><span class="gx-chip">S.03</span><p>PROGRESS / 真实数据</p><h2>进度不会说谎。<br><span>它只告诉你下一步。</span></h2></div>' +
          '<div class="gx-progress-grid">' +
            '<div class="gx-orbit gx-reveal" style="--p:' + avg + '"><div><b>' + avg + '%</b><span>平均掌握</span></div></div>' +
            '<div class="gx-weak-list gx-reveal"><div class="gx-weak-head"><b>优先补强</b><span>掌握度最低的 5 个节点</span></div>' + weakRows() + '</div>' +
          '</div>' +
          '<div class="gx-progress-foot gx-reveal">' +
            '<div><b>' + days + '</b><span>距离高考</span></div><div><b>' + due + '</b><span>待复习卡片</span></div><div><b>' + streak + '</b><span>连续学习天数</span></div>' +
            '<a class="gx-cta" href="#/practice"><span>继续练习</span><i>↗</i></a>' +
          '</div>' +
        '</section>' +

        '<section class="gx-section gx-tools" id="gxTools">' +
          '<div class="gx-section-tag"><span>S.04</span><b>学习工具</b></div>' +
          '<div class="gx-statement gx-reveal"><p>工具不是装饰，是把问题往前推。</p><h2>写下思路，找到错因，<br>再做一道同类题。</h2></div>' +
          '<div class="gx-tool-rail gx-reveal">' +
            '<a class="gx-tool-card" href="#/practice"><small>01 / PRACTICE</small><h3>思路驱动练习</h3><p>文字、语音、手写都可以。答案之外，保留你的思考过程。</p><span>进入练习 ↗</span></a>' +
            '<a class="gx-tool-card" href="#/wrong"><small>02 / REVIEW</small><h3>错题归因</h3><p>按知识、方法、计算、审题、心态归类，找到真正丢分的位置。</p><span>打开错题本 ↗</span></a>' +
            '<a class="gx-tool-card" href="#/settings/ai"><small>03 / AI</small><h3>AI 讲解</h3><p>手动触发，不点不产生费用；断网时自动回退到离线规则分析。</p><span>配置 AI ↗</span></a>' +
          '</div>' +
        '</section>' +

        '<footer class="gx-footer">' +
          '<div class="gx-footer-mark"><span>G</span><p><b>高考数学学习台</b><small>把复杂的，变成会做的。</small></p></div>' +
          '<div class="gx-footer-meta"><span>v102 / HOMEPAGE</span><button type="button" onclick="App.forceUpdate()">检查更新</button><a href="#/settings">系统设置</a></div>' +
        '</footer>' +
      '</div>';

    global.Portal.loadWeather(false);
    startHomeMotion();
    mountWelcome();
  }

  function startHomeMotion() {
    stopHomeMotion();
    var home = document.getElementById('ptLanding');
    if (!home) return;
    var reduced = false;
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var reveals = home.querySelectorAll('.gx-reveal');
    if (reduced || !('IntersectionObserver' in global)) {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
    } else {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });
    }

    homeScrollHandler = function () {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(function () {
        scrollFrame = 0;
        home.classList.toggle('is-scrolled', (global.scrollY || document.documentElement.scrollTop || 0) > 24);
      });
    };
    global.addEventListener('scroll', homeScrollHandler, { passive: true });
    homeScrollHandler();

    if (!reduced) {
      var hero = home.querySelector('.gx-hero-media');
      home.addEventListener('pointermove', function (e) {
        pointerX = e.clientX / Math.max(1, global.innerWidth) - 0.5;
        pointerY = e.clientY / Math.max(1, global.innerHeight) - 0.5;
        if (pointerFrame || !hero) return;
        pointerFrame = requestAnimationFrame(function () {
          pointerFrame = 0;
          hero.style.transform = 'translate3d(' + (pointerX * -10).toFixed(1) + 'px,' + (pointerY * -8).toFixed(1) + 'px,0) scale(1.04)';
        });
      });
    }

    homeTimer = setInterval(function () {
      var clock = document.getElementById('gxClock');
      if (clock) clock.textContent = clockLabel();
    }, 30000);
    requestAnimationFrame(function () { home.classList.add('is-ready'); });
  }

  function stopHomeMotion() {
    if (homeTimer) { clearInterval(homeTimer); homeTimer = null; }
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    if (scrollFrame) { cancelAnimationFrame(scrollFrame); scrollFrame = 0; }
    if (pointerFrame) { cancelAnimationFrame(pointerFrame); pointerFrame = 0; }
    if (homeScrollHandler) {
      global.removeEventListener('scroll', homeScrollHandler);
      homeScrollHandler = null;
    }
    var welcome = document.getElementById('gxWelcome');
    if (welcome && welcome.parentNode) welcome.parentNode.removeChild(welcome);
    document.body.classList.remove('gx-welcome-open');
  }

  function homeScroll(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
    return false;
  }

  function mountWelcome() {
    var seen = false;
    try { seen = localStorage.getItem(WELCOME_KEY) === '1'; } catch (e) {}
    if (seen) {
      if (global.PortalPlan && PortalPlan.mount) PortalPlan.mount();
      return;
    }
    if (document.getElementById('gxWelcome')) return;
    var overlay = document.createElement('div');
    overlay.id = 'gxWelcome';
    overlay.className = 'gx-welcome';
    overlay.innerHTML =
      '<section class="gx-welcome-panel" role="dialog" aria-modal="true" aria-labelledby="gxWelcomeTitle">' +
        '<header class="gx-welcome-head"><span>NEW HOMEPAGE / v102</span><button type="button" aria-label="关闭新版介绍" onclick="Portal.closeHomeWelcome()">×</button></header>' +
        '<div class="gx-welcome-grid">' +
          '<div class="gx-welcome-index"><span>02</span><small>NEW<br>DIRECTION</small></div>' +
          '<div class="gx-welcome-copy">' +
            '<p class="gx-kicker"><span class="gx-chip">第一次见</span><span>同样的内容，换一种更清醒的打开方式</span></p>' +
            '<h2 id="gxWelcomeTitle">新版主页，<br>先把方向看清楚。</h2>' +
            '<p>入口更直接，进度更清楚。今天的任务、薄弱知识点和练习入口现在都在第一屏之后，继续向下就行。</p>' +
            '<div class="gx-welcome-points"><span><b>01</b> 一眼看到今日重点</span><span><b>02</b> 从薄弱点直接练习</span><span><b>03</b> 原有数据完整保留</span></div>' +
            '<button class="gx-cta" type="button" onclick="Portal.closeHomeWelcome()"><span>进入新版首页</span><i>↗</i></button>' +
          '</div>' +
        '</div>' +
      '</section>';
    document.body.appendChild(overlay);
    document.body.classList.add('gx-welcome-open');
    requestAnimationFrame(function () { overlay.classList.add('is-on'); });
    setTimeout(function () {
      var btn = overlay.querySelector('.gx-cta');
      if (btn) btn.focus();
    }, 380);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeWelcome();
    });
    document.addEventListener('keydown', welcomeKeydown);
  }

  function welcomeKeydown(e) {
    if (e.key === 'Escape') closeWelcome();
  }

  function closeWelcome() {
    var overlay = document.getElementById('gxWelcome');
    if (!overlay) return;
    try {
      localStorage.setItem(WELCOME_KEY, '1');
      localStorage.setItem('gml_plan_auto_date', todayKey());
    } catch (e) {}
    overlay.classList.remove('is-on');
    document.body.classList.remove('gx-welcome-open');
    document.removeEventListener('keydown', welcomeKeydown);
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (global.PortalPlan && PortalPlan.mount) PortalPlan.mount();
    }, 320);
  }

  Portal.renderPortal = renderPortal;
  Portal.homeScroll = homeScroll;
  Portal.closeHomeWelcome = closeWelcome;
  Portal.stopFx = function () {
    if (oldStopFx) oldStopFx();
    stopHomeMotion();
  };
})(window);
