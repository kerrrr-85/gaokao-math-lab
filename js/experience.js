/* v107 云空间 · Apple-inspired quiet gallery */
(function (global) {
  'use strict';

  var INTRO_KEY = 'gml_cloud_room_intro_v107';
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
  function scenePickerHTML() {
    return GALLERY.map(function (item, i) {
      return '<button type="button" data-scene="' + i + '" aria-label="切换为背景：' + esc(item.title) + '">' +
        '<img src="' + item.src + '" alt="" loading="lazy"><span><b>' + esc(item.title) + '</b><small>' + ('0' + (i + 1)).slice(-2) + '</small></span></button>';
    }).join('');
  }
  function toolsHTML() {
    return TOOLS.map(function (t) {
      return '<a href="' + t[1] + '"><span>' + esc(t[0]) + '</span><small>' + esc(t[2]) + '</small><i>↗</i></a>';
    }).join('');
  }

  function render() {
    stop();
    slideIndex = 0;
    document.body.classList.add('pt-full');
    document.body.classList.toggle('portal-dark', !!(global.Portal && Portal.isNight && Portal.isNight()));
    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="ex-home' + (Portal.isNight && Portal.isNight() ? ' is-night' : '') + '" id="ptLanding">' +
        '<header class="ex-nav">' +
          '<a class="ex-brand" href="#/" onclick="return Portal.homeScroll(\'exTop\')"><i>G</i><span><b>我们的云空间</b><small>CLOUD ROOM / A QUIET PLACE</small></span></a>' +
          '<nav><button type="button" onclick="Portal.homeScroll(\'exTop\')">漫游</button><button type="button" onclick="CloudRoom.openScenes()">换景</button><button type="button" onclick="CloudRoom.openCabin()">小屋</button><button type="button" onclick="CloudRoom.openCassette()">磁带</button><button type="button" onclick="CloudRoom.toggleTools()">工具</button></nav>' +
          '<div class="ex-nav-time"><span id="exClock">' + clock() + '</span><small>' + dateText() + '</small></div>' +
        '</header>' +
        '<section class="ex-hero" id="exTop">' +
          '<div class="ex-slides" aria-hidden="true">' + GALLERY.map(function (g, i) { return '<img class="' + (i === 0 ? 'is-active' : '') + '" src="' + g.src + '?v=113" alt="">'; }).join('') + '</div>' +
          '<div class="ex-hero-shade" aria-hidden="true"></div>' +
          '<div class="ex-hero-copy">' +
            '<p class="ex-kicker"><span>ROOM 01</span> 给眼睛和心情的一点留白</p>' +
            '<h1 class="ex-title" role="button" tabindex="0" aria-label="进入隐藏彩蛋" title="点一下，看看会发生什么">在这里，<br><em>不必完成什么。</em></h1>' +
            '<p class="ex-lede">看看星空，听一会风铃，或者只是向下翻几张图。这里没有任务倒计时。</p>' +
            '<div class="ex-actions"><button type="button" onclick="Portal.homeScroll(\'exRoom\')">进入游乐场 <i>↓</i></button><button type="button" onclick="CloudRoom.openScenes()">换一幅风景 <i>↗</i></button><a href="./wind-chime.html" target="_blank" rel="noopener">去听风 <i>↗</i></a></div>' +
          '</div>' +
          '<div class="ex-hero-corner"><span>NOW PLAYING</span><b id="exSlideLabel">01 / 星海</b><i></i><small>SCROLL TO WANDER</small></div>' +
          '<div class="ex-hero-strip">' + GALLERY.slice(0,3).map(function (g,i) { return '<button type="button" data-scene="' + i + '"><img src="' + g.src + '" alt="" loading="lazy"><span>' + ('0'+(i+1)).slice(-2) + ' · ' + esc(g.title) + '</span></button>'; }).join('') + '</div>' +
        '</section>' +
        '<div class="ex-marquee" aria-hidden="true"><span>LOOK UP</span><i></i><span>BREATHE SLOW</span><i></i><span>NOTHING TO FINISH</span><i></i><span>STAY A WHILE</span></div>' +
        '<section class="ex-room" id="exRoom">' +
          '<div class="ex-room-head ex-reveal"><span class="ex-kicker">PLAY.02 / 小小游乐场</span><h2>不做什么，<br>也可以很好玩。</h2></div>' +
          '<div class="ex-room-grid">' +
            '<button class="ex-room-card cabin ex-reveal" type="button" onclick="CloudRoom.openCabin()"><img class="ex-room-thumb" src="./assets/gallery/cabin-preview.webp?v=108" alt="" loading="lazy"><span class="ex-room-copy"><small>SPACE / 01</small><h3>魔法小屋</h3><p>走进一座线稿森林，推开门，在会呼吸的木屋里待一会儿。</p><b>进入空间 ↗</b></span></button>' +
            '<button class="ex-room-card cassette ex-reveal" type="button" onclick="CloudRoom.openCassette()"><img class="ex-room-thumb" src="./assets/gallery/cassette-preview.svg?v=113" alt="" loading="lazy"><span class="ex-room-copy"><small>TAPE / 02</small><h3>三维磁带</h3><p>转动、拆开、翻面，再装进一首属于你的歌。它不负责完成什么，只负责让时间有一点质感。</p><b>拾起这盘磁带 ↗</b></span></button>' +
            '<a class="ex-room-card wind ex-reveal" href="./wind-chime.html" target="_blank" rel="noopener"><small>WIND / 01</small><h3>风铃室</h3><p>拖动玻璃球，把它扔进风里。手机也可以用手指玩。</p><span>打开风铃 ↗</span></a>' +
            '<a class="ex-room-card globe ex-reveal" href="#/globe"><small>EARTH / 02</small><h3>看看地球</h3><p>转到另一个半球，看看城市、晨昏线和很远的地方。</p><span>进入地球 ↗</span></a>' +
            '<a class="ex-room-card secret ex-reveal" href="#/" onclick="Portal.inkOpen(event);return false;"><small>HIDDEN / 03</small><h3>彩蛋房</h3><p>在标题里藏了一扇门。慢一点，再点一次标题也能进去。</p><span>进入隐藏空间 ↗</span></a>' +
          '</div>' +
        '</section>' +
        '<section class="ex-study ex-reveal" id="exStudy">' +
          '<button type="button" class="ex-study-toggle" onclick="CloudRoom.toggleTools()"><span><small>WHEN YOU NEED IT</small><b>需要学习时，再打开工具。</b></span><i>＋</i></button>' +
          '<div class="ex-tools" id="exTools"><div class="ex-tools-head"><span>STUDY DRAWER</span><button type="button" onclick="CloudRoom.toggleTools(false)">收起 ×</button></div><div class="ex-tools-grid">' + toolsHTML() + '</div><p>这些入口仍然可用，但不再占据首页。</p></div>' +
        '</section>' +
          '<footer class="ex-footer"><div class="ex-footer-mark"><i>G</i><span><b>我们的云空间</b><small>这里不是任务清单。</small></span></div><div><span>v113 / CLOUD ROOM</span><button type="button" onclick="App.forceUpdate()">检查更新</button><a href="#/settings">设置</a></div></footer>' +
      '</div>';
    bind();
    start();
    showIntro();
  }

  function bind() {
    document.querySelectorAll('[data-scene]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        setScene(Number(el.getAttribute('data-scene')));
      });
    });
    var title = document.querySelector('.ex-title');
    if (title) {
      title.addEventListener('click', function (e) { if (global.Portal && Portal.inkOpen) Portal.inkOpen(e); });
      title.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Portal.inkOpen(e); }
      });
    }
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
    if (!reduced) startSlideshow();
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
    closeCabin();
    closeCassette();
    closeScenes();
    document.body.classList.remove('ex-mode', 'ex-intro-open');
  }

  function startSlideshow() {
    var slides = document.querySelectorAll('.ex-slides img');
    if (!slides.length) return;
    slideTimer = setInterval(function () {
      if (!document.querySelector('.ex-home')) return;
      slides[slideIndex].classList.remove('is-active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('is-active');
      var label = document.getElementById('exSlideLabel');
      if (label) label.textContent = ('0' + (slideIndex + 1)).slice(-2) + ' / ' + GALLERY[slideIndex].title;
    }, 7000);
  }
  function setScene(i) {
    var item = GALLERY[i]; if (!item) return;
    var slides = document.querySelectorAll('.ex-slides img');
    if (slides.length) {
      slides[slideIndex].classList.remove('is-active');
      slideIndex = i % slides.length;
      slides[slideIndex].classList.add('is-active');
    }
    var label = document.getElementById('exSlideLabel');
    if (label) label.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + item.title;
    closeScenes();
  }
  function openScenes() {
    var box = document.getElementById('exScenes');
    if (!box) {
      box = document.createElement('div');
      box.id = 'exScenes';
      box.className = 'ex-scenes';
      box.setAttribute('aria-hidden', 'true');
      box.innerHTML = '<section><header><div><small>ATMOSPHERE</small><h2>换一幅风景</h2></div><button type="button" class="ex-scenes-close" aria-label="关闭换景面板">×</button></header><div class="ex-scenes-grid">' + scenePickerHTML() + '</div></section>';
      document.body.appendChild(box);
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.closest('.ex-scenes-close')) { closeScenes(); return; }
        var bit = e.target.closest('[data-scene]');
        if (bit) setScene(Number(bit.getAttribute('data-scene')));
      });
    }
    box.classList.add('on');
    box.setAttribute('aria-hidden', 'false');
  }
  function closeScenes() {
    var box = document.getElementById('exScenes');
    if (!box) return;
    box.classList.remove('on');
    box.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (box && !box.classList.contains('on')) box.remove(); }, 260);
  }
  function openCabin() {
    var layer = document.getElementById('exCabinLayer');
    var frame = document.getElementById('exCabinFrame');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'exCabinLayer';
      layer.className = 'ex-cabin-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = '<button type="button" class="ex-cabin-close">← 返回云空间</button><iframe id="exCabinFrame" title="线稿魔法小屋空间" allow="fullscreen; pointer-lock"></iframe><p>点击画面锁定视角 · Esc 释放鼠标</p>';
      document.body.appendChild(layer);
      frame = document.getElementById('exCabinFrame');
      layer.querySelector('.ex-cabin-close').addEventListener('click', closeCabin);
    }
    if (!frame) return;
    if (!frame.getAttribute('src')) frame.setAttribute('src', './magic-cabin/index.html');
    layer.classList.add('on');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ex-cabin-open');
  }
  function closeCabin() {
    var layer = document.getElementById('exCabinLayer');
    var frame = document.getElementById('exCabinFrame');
    if (!layer) return;
    layer.classList.remove('on');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ex-cabin-open');
    setTimeout(function () {
      if (!frame || layer.classList.contains('on')) return;
      frame.removeAttribute('src');
      layer.remove();
    }, 320);
  }
  function openCassette() {
    var layer = document.getElementById('exCassetteLayer');
    var frame = document.getElementById('exCassetteFrame');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'exCassetteLayer';
      layer.className = 'ex-cassette-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = '<button type="button" class="ex-cassette-close">← 返回云空间</button><iframe id="exCassetteFrame" title="三维磁带互动空间" allow="autoplay; fullscreen; pointer-lock"></iframe><p>拖动旋转 · 滚轮缩放 · 空格走带 · Esc 返回</p>';
      document.body.appendChild(layer);
      frame = document.getElementById('exCassetteFrame');
      layer.querySelector('.ex-cassette-close').addEventListener('click', closeCassette);
    }
    if (!frame) return;
    if (!frame.getAttribute('src')) frame.setAttribute('src', './cassette/index.html?v=113');
    layer.classList.add('on');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ex-cassette-open');
  }
  function closeCassette() {
    var layer = document.getElementById('exCassetteLayer');
    var frame = document.getElementById('exCassetteFrame');
    if (!layer) return;
    layer.classList.remove('on');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ex-cassette-open');
    setTimeout(function () {
      if (!frame || layer.classList.contains('on')) return;
      frame.removeAttribute('src');
      layer.remove();
    }, 320);
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
    box.innerHTML = '<section class="ex-intro-card" role="dialog" aria-modal="true" aria-labelledby="exIntroTitle"><img src="./assets/gallery/cosmos.webp?v=107" alt=""><div class="ex-intro-shade"></div><div class="ex-intro-copy"><p class="ex-kicker"><span>WELCOME</span> 这一次，不为完成任务</p><h2 id="exIntroTitle">先看看风景，<br>再决定要不要学习。</h2><p>任务、练习和统计都收进了下方的工具抽屉。这里的首页只负责好看、安静和一点点好玩。</p><button type="button" id="exEnter">进入云空间 <i>↗</i></button></div></section>';
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
  function closeTransient() { closeScenes(); closeIntro(); closeCabin(); closeCassette(); toggleTools(false); }
  function homeScroll(id) {
    var el = document.getElementById(id); if (!el) return false;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
    return false;
  }
  function keydown(e) {
    if (e.key === 'Escape') closeTransient();
  }
  document.addEventListener('keydown', keydown);
  global.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    if (e.data && e.data.type === 'gml-close-cassette') closeCassette();
  });

  global.CloudRoom = { toggleTools: toggleTools, closeIntro: closeIntro, openCabin: openCabin, closeCabin: closeCabin, openCassette: openCassette, closeCassette: closeCassette, openScenes: openScenes, closeScenes: closeScenes };
  Portal.renderPortal = render;
  Portal.homeScroll = homeScroll;
  Portal.closeHomeWelcome = closeIntro;
  Portal.stopFx = function () {
    if (oldStop) oldStop();
    stop();
  };
})(window);
