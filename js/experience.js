/* v106 云空间 · 视觉漫游首页 */
(function (global) {
  'use strict';

  var INTRO_KEY = 'gml_cloud_room_intro_v106';
  var slideTimer = 0;
  var clockTimer = 0;
  var revealObserver = null;
  var scrollHandler = null;
  var slideIndex = 0;
  var oldStop = global.Portal && global.Portal.stopFx;

  var GALLERY = [
    { src: './assets/gallery/cosmos.webp', title: '星海', sub: '抬头，看看比今天更大的东西。', label: '01 / COSMOS' },
    { src: './assets/gallery/reading-starry.jpg', title: '星夜', sub: '允许自己只做一场梦。', label: '02 / DREAM' },
    { src: './assets/gallery/snow-sunset.webp', title: '群山', sub: '让今天停在日落之前。', label: '03 / STILLNESS' },
    { src: './assets/gallery/temple.webp', title: '白塔', sub: '把喧闹放远一点。', label: '04 / QUIET' },
    { src: './assets/gallery/city-lights.webp', title: '雨夜', sub: '城市还在发光。', label: '05 / CITY' },
    { src: './assets/gallery/world-hands.webp', title: '世界', sub: '你可以先不赶路。', label: '06 / WORLD' },
    { src: './assets/gallery/car-interior.webp', title: '夜行', sub: '路会在前方慢慢展开。', label: '07 / NIGHT DRIVE' }
  ];

  var TOOLS = [
    ['学习台', '#/today', '今日复习'],
    ['练习', '#/practice', '按知识点训练'],
    ['知识图谱', '#/map', '关系与掌握度'],
    ['错题本', '#/wrong', '错因与重做'],
    ['搜索', '#/search', '站内检索'],
    ['秒读训练', '#/reading', '调速阅读'],
    ['B站视频', '#/video', '数学视频'],
    ['地球', '#/globe', '3D 与地图'],
    ['设置', '#/settings', '外观、AI 与数据']
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function clock() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function dateText() {
    var d = new Date();
    var w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2) + ' / 星期' + w;
  }
  function galleryHTML() {
    return GALLERY.map(function (item, i) {
      return '<button type="button" class="ex-photo ex-reveal" data-gallery="' + i + '" aria-label="查看图片：' + esc(item.title) + '">' +
        '<img src="' + item.src + '" alt="' + esc(item.title) + '" loading="lazy">' +
        '<span class="ex-photo-shade"></span>' +
        '<span class="ex-photo-meta"><small>' + item.label + '</small><b>' + esc(item.title) + '</b><em>' + esc(item.sub) + '</em></span>' +
        '<span class="ex-photo-arrow">↗</span></button>';
    }).join('');
  }
  function toolsHTML() {
    return TOOLS.map(function (t) {
      return '<a href="' + t[1] + '"><span>' + esc(t[0]) + '</span><small>' + esc(t[2]) + '</small><i>↗</i></a>';
    }).join('');
  }

  function render() {
    stop();
    document.body.classList.add('pt-full');
    document.body.classList.toggle('portal-dark', !!(global.Portal && Portal.isNight && Portal.isNight()));
    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="ex-home' + (Portal.isNight && Portal.isNight() ? ' is-night' : '') + '" id="ptLanding">' +
        '<header class="ex-nav">' +
          '<a class="ex-brand" href="#/" onclick="return Portal.homeScroll(\'exTop\')"><i>G</i><span><b>我们的云空间</b><small>CLOUD ROOM / A QUIET PLACE</small></span></a>' +
          '<nav><button type="button" onclick="Portal.homeScroll(\'exTop\')">漫游</button><button type="button" onclick="Portal.homeScroll(\'exGallery\')">光影</button><a href="./wind-chime.html" target="_blank" rel="noopener">风铃</a><button type="button" onclick="CloudRoom.toggleTools()">工具</button></nav>' +
          '<div class="ex-nav-time"><span id="exClock">' + clock() + '</span><small>' + dateText() + '</small></div>' +
        '</header>' +
        '<section class="ex-hero" id="exTop">' +
          '<div class="ex-slides" aria-hidden="true">' +
            '<img class="is-active" src="./assets/gallery/cosmos.webp?v=106" alt="">' +
            '<img src="./assets/gallery/snow-sunset.webp?v=106" alt="">' +
            '<img src="./assets/gallery/reading-starry.jpg?v=106" alt="">' +
          '</div>' +
          '<div class="ex-hero-shade" aria-hidden="true"></div>' +
          '<div class="ex-hero-copy">' +
            '<p class="ex-kicker"><span>ROOM 01</span> 给眼睛和心情的一点留白</p>' +
            '<h1 class="ex-title" role="button" tabindex="0" aria-label="进入隐藏彩蛋" title="点一下，看看会发生什么">在这里，<br><em>不必完成什么。</em></h1>' +
            '<p class="ex-lede">看看星空，听一会风铃，或者只是向下翻几张图。这里没有任务倒计时。</p>' +
            '<div class="ex-actions"><button type="button" onclick="Portal.homeScroll(\'exGallery\')">开始漫游 <i>↓</i></button><a href="./wind-chime.html" target="_blank" rel="noopener">去听风 <i>↗</i></a></div>' +
          '</div>' +
          '<div class="ex-hero-corner"><span>NOW PLAYING</span><b id="exSlideLabel">01 / 星海</b><i></i><small>SCROLL TO WANDER</small></div>' +
          '<div class="ex-hero-strip">' + GALLERY.slice(0,3).map(function (g,i) { return '<button type="button" data-gallery="' + i + '"><img src="' + g.src + '" alt="" loading="lazy"><span>' + ('0'+(i+1)).slice(-2) + ' · ' + esc(g.title) + '</span></button>'; }).join('') + '</div>' +
        '</section>' +
        '<div class="ex-marquee" aria-hidden="true"><span>LOOK UP</span><i></i><span>BREATHE SLOW</span><i></i><span>NOTHING TO FINISH</span><i></i><span>STAY A WHILE</span></div>' +
        '<section class="ex-section ex-gallery-sec" id="exGallery">' +
          '<div class="ex-section-head ex-reveal"><div><span class="ex-kicker">VISUAL.01 / 光影收藏</span><h2>七种画面，<br>七种不赶时间的方式。</h2></div><p>点击任意画面，安静地看一会儿。</p></div>' +
          '<div class="ex-gallery">' + galleryHTML() + '</div>' +
        '</section>' +
        '<section class="ex-room">' +
          '<div class="ex-room-head ex-reveal"><span class="ex-kicker">PLAY.02 / 小小游乐场</span><h2>不做什么，<br>也可以很好玩。</h2></div>' +
          '<div class="ex-room-grid">' +
            '<a class="ex-room-card wind ex-reveal" href="./wind-chime.html" target="_blank" rel="noopener"><small>WIND / 01</small><h3>风铃室</h3><p>拖动玻璃球，把它扔进风里。手机也可以用手指玩。</p><span>打开风铃 ↗</span></a>' +
            '<a class="ex-room-card globe ex-reveal" href="#/globe"><small>EARTH / 02</small><h3>看看地球</h3><p>转到另一个半球，看看城市、晨昏线和很远的地方。</p><span>进入地球 ↗</span></a>' +
            '<a class="ex-room-card secret ex-reveal" href="#/" onclick="Portal.inkOpen(event);return false;"><small>HIDDEN / 03</small><h3>彩蛋房</h3><p>在标题里藏了一扇门。慢一点，再点一次标题也能进去。</p><span>进入隐藏空间 ↗</span></a>' +
          '</div>' +
        '</section>' +
        '<section class="ex-study ex-reveal" id="exStudy">' +
          '<button type="button" class="ex-study-toggle" onclick="CloudRoom.toggleTools()"><span><small>WHEN YOU NEED IT</small><b>需要学习时，再打开工具。</b></span><i>＋</i></button>' +
          '<div class="ex-tools" id="exTools"><div class="ex-tools-head"><span>STUDY DRAWER</span><button type="button" onclick="CloudRoom.toggleTools(false)">收起 ×</button></div><div class="ex-tools-grid">' + toolsHTML() + '</div><p>这些入口仍然可用，但不再占据首页。</p></div>' +
        '</section>' +
        '<footer class="ex-footer"><div class="ex-footer-mark"><i>G</i><span><b>我们的云空间</b><small>这里不是任务清单。</small></span></div><div><span>v106 / CLOUD ROOM</span><button type="button" onclick="App.forceUpdate()">检查更新</button><a href="#/settings">设置</a></div></footer>' +
        '<div class="ex-lightbox" id="exLightbox" aria-hidden="true"><button type="button" data-close-lightbox aria-label="关闭图片">×</button><figure><img id="exLightboxImg" alt=""><figcaption><small id="exLightboxLabel"></small><b id="exLightboxTitle"></b><span id="exLightboxSub"></span></figcaption></figure></div>' +
      '</div>';
    bind();
    start();
    showIntro();
  }

  function bind() {
    document.querySelectorAll('[data-gallery]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openGallery(Number(el.getAttribute('data-gallery')));
      });
    });
    var title = document.querySelector('.ex-title');
    if (title) {
      title.addEventListener('click', function (e) { if (global.Portal && Portal.inkOpen) Portal.inkOpen(e); });
      title.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Portal.inkOpen(e); }
      });
    }
    var lb = document.getElementById('exLightbox');
    if (lb) lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('[data-close-lightbox]')) closeGallery(); });
  }

  function start() {
    stop();
    document.body.classList.add('ex-mode');
    var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var reveals = document.querySelectorAll('.ex-reveal');
    if (reduced || !('IntersectionObserver' in global)) reveals.forEach(function (el) { el.classList.add('is-in'); });
    else {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); } });
      }, { threshold: 0.06 });
      reveals.forEach(function (el) { revealObserver.observe(el); });
    }
    var slides = document.querySelectorAll('.ex-slides img');
    if (!reduced && slides.length) {
      slideTimer = setInterval(function () {
        if (!document.querySelector('.ex-home')) return;
        slides[slideIndex].classList.remove('is-active');
        slideIndex = (slideIndex + 1) % slides.length;
        slides[slideIndex].classList.add('is-active');
        var label = document.getElementById('exSlideLabel');
        if (label) label.textContent = ['01 / 星海','02 / 群山','03 / 星夜'][slideIndex];
      }, 7000);
    }
    clockTimer = setInterval(function () { var c = document.getElementById('exClock'); if (c) c.textContent = clock(); }, 30000);
    scrollHandler = function () {
      var nav = document.querySelector('.ex-nav');
      if (nav) nav.classList.toggle('is-scrolled', (scrollY || document.documentElement.scrollTop) > 28);
    };
    global.addEventListener('scroll', scrollHandler, { passive: true });
    scrollHandler();
  }

  function stop() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = 0; }
    if (clockTimer) { clearInterval(clockTimer); clockTimer = 0; }
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    if (scrollHandler) { removeEventListener('scroll', scrollHandler); scrollHandler = null; }
    var intro = document.getElementById('exIntro'); if (intro) intro.remove();
    document.body.classList.remove('ex-mode', 'ex-intro-open');
  }

  function openGallery(i) {
    var item = GALLERY[i]; if (!item) return;
    var box = document.getElementById('exLightbox'); if (!box) return;
    document.getElementById('exLightboxImg').src = item.src;
    document.getElementById('exLightboxImg').alt = item.title;
    document.getElementById('exLightboxLabel').textContent = item.label;
    document.getElementById('exLightboxTitle').textContent = item.title;
    document.getElementById('exLightboxSub').textContent = item.sub;
    box.classList.add('on'); box.setAttribute('aria-hidden', 'false');
  }
  function closeGallery() {
    var box = document.getElementById('exLightbox');
    if (box) { box.classList.remove('on'); box.setAttribute('aria-hidden', 'true'); }
  }
  function toggleTools(force) {
    var sec = document.getElementById('exStudy');
    if (!sec) return;
    var open = typeof force === 'boolean' ? force : !sec.classList.contains('is-open');
    sec.classList.toggle('is-open', open);
    if (open) setTimeout(function () {
      var tools = document.getElementById('exStudy');
      if (tools) tools.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 20);
  }
  function showIntro() {
    var seen = false; try { seen = localStorage.getItem(INTRO_KEY) === '1'; } catch (e) {}
    if (seen || document.getElementById('exIntro')) return;
    var box = document.createElement('div'); box.id = 'exIntro'; box.className = 'ex-intro';
    box.innerHTML = '<section class="ex-intro-card" role="dialog" aria-modal="true" aria-labelledby="exIntroTitle"><img src="./assets/gallery/cosmos.webp?v=106" alt=""><div class="ex-intro-shade"></div><div class="ex-intro-copy"><p class="ex-kicker"><span>WELCOME</span> 这一次，不为完成任务</p><h2 id="exIntroTitle">先看看风景，<br>再决定要不要学习。</h2><p>任务、练习和统计都收进了下方的工具抽屉。这里的首页只负责好看、安静和一点点好玩。</p><button type="button" id="exEnter">进入云空间 <i>↗</i></button></div></section>';
    document.body.appendChild(box);
    document.body.classList.add('ex-intro-open');
    requestAnimationFrame(function () { box.classList.add('on'); });
    box.querySelector('#exEnter').addEventListener('click', closeIntro);
  }
  function closeIntro() {
    var box = document.getElementById('exIntro'); if (!box) return;
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
    box.classList.remove('on'); document.body.classList.remove('ex-intro-open');
    setTimeout(function () { box.remove(); }, 350);
  }
  function closeTransient() { closeGallery(); closeIntro(); toggleTools(false); }
  function homeScroll(id) {
    var el = document.getElementById(id); if (!el) return false;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
    return false;
  }
  function keydown(e) {
    if (e.key === 'Escape') closeTransient();
  }
  document.addEventListener('keydown', keydown);

  global.CloudRoom = { toggleTools: toggleTools, closeIntro: closeIntro };
  Portal.renderPortal = render;
  Portal.homeScroll = homeScroll;
  Portal.closeHomeWelcome = closeIntro;
  Portal.stopFx = function () {
    if (oldStop) oldStop();
    stop();
  };
})(window);
