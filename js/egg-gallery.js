/* 隐藏彩蛋相册：无限螺旋卡牌 + 点击灯箱放大 */
(function (global) {
  var DEFAULT_PHOTOS = [];
  for (var i = 1; i <= 16; i++) {
    var n = ('0' + i).slice(-2);
    DEFAULT_PHOTOS.push({ src: './assets/egg/photo-' + n + '.jpg', thumb: './assets/egg/photo-' + n + '-thumb.jpg', title: '\u7167\u7247 ' + n, sub: '\u751f\u6d3b\u7559\u5f71' });
  }
  var activeRoot = null, activeContainer = null, raf = 0, cleanup = [];
  var stage, spiral, cards = [], photos = [], progress = 0, target = 0, lastTime = 0;
  var radius = 150, spacing = 58, cardW = 98, cardH = 122;
  var dragging = false, dragMoved = false, lastY = 0, hovered = false;
  var lightbox, lbImg, lbTitle, lbSub, lbIndex = 0, lbOn = false;
  var reduce = false;

  function modulo(v, n) { return ((v % n) + n) % n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smoothstep(a, b, v) { var x = clamp((v - a) / ((b - a) || 1), 0, 1); return x * x * (3 - 2 * x); }

  function renderShell() {
    var root = document.createElement('div');
    root.className = 'egm';
    root.id = 'egm';
    root.innerHTML = '<div class="egm__aura"></div>' +
      '<header class="egm__head"><div><small>PRIVATE COLLECTION</small><h3>我在呢 · 相册</h3></div><button type="button" class="egm__close" id="egmClose" aria-label="关闭相册">关闭</button></header>' +
      '<div class="egm__stage" id="egmStage"><div class="egm__spiral" id="egmSpiral"></div></div>' +
      '<div class="egm__foot"><span>拖动浏览</span><span>点击照片放大</span></div>' +
      '<div class="egm__lightbox" id="egmLightbox" aria-hidden="true">' +
        '<button type="button" class="egm__lbclose" id="egmLbClose" aria-label="关闭大图">×</button>' +
        '<button type="button" class="egm__nav egm__nav--prev" id="egmPrev" aria-label="上一张">‹</button>' +
        '<figure class="egm__figure"><img id="egmLarge" alt=""><figcaption><b id="egmLargeTitle"></b><span id="egmLargeSub"></span></figcaption></figure>' +
        '<button type="button" class="egm__nav egm__nav--next" id="egmNext" aria-label="下一张">›</button>' +
      '</div>';
    return root;
  }

  function buildCards() {
    spiral.innerHTML = '';
    cards = [];
    photos.forEach(function (item, i) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'egm__card';
      card.setAttribute('aria-label', item.title || ('照片 ' + (i + 1)));
      card.innerHTML = '<img src="' + (item.thumb || item.src) + '" alt="' + (item.title || '') + '" draggable="false"><span class="egm__cap"><b>' + (item.title || '') + '</b><i>' + (item.sub || '') + '</i></span>';
      card.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (dragMoved) return;
        openLightbox(i);
      });
      spiral.appendChild(card);
      cards.push(card);
    });
  }
  function resize() {
    if (!stage || !cards.length) return;
    var w = stage.clientWidth || 360, h = stage.clientHeight || 520;
    radius = Math.min(178, Math.max(86, w * 0.34));
    spacing = Math.min(66, Math.max(42, h * 0.082));
    cardW = Math.min(108, Math.max(74, w * 0.205));
    cardH = cardW * 1.24;
    cards.forEach(function (c) { c.style.width = cardW + 'px'; c.style.height = cardH + 'px'; });
  }
  function layout(t) {
    var n = cards.length; if (!n) return;
    var dt = Math.min((t - lastTime) / 1000 || 0, 0.05); lastTime = t;
    if (!dragging && !hovered && !reduce) target += 0.42 * dt;
    progress += (target - progress) * 0.10;
    var half = n / 2;
    cards.forEach(function (card, i) {
      var offset = modulo(i - progress + half, n) - half;
      var edge = Math.min(Math.abs(offset) / half, 1);
      var focus = 1 - Math.min(Math.abs(offset) / (n * 0.34), 1);
      var angle = offset * (360 / Math.max(n, 1)) * (Math.PI / 180);
      var x = Math.sin(angle) * radius;
      var y = offset * spacing;
      var z = Math.cos(angle) * radius;
      var depth = clamp(1000 / Math.max(1000 - z, 260), 0.72, 1.42);
      var scale = (1 + (0.22 * focus)) * depth;
      var opacity = 1 - smoothstep(0.70, 1, edge);
      card.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z.toFixed(2) + 'px) rotateZ(' + (offset * 1.2).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(Math.round((z / Math.max(radius, 1) + 1) * 10000) + i);
      card.style.filter = edge > 0.68 ? 'blur(' + ((edge - 0.68) * 18).toFixed(2) + 'px)' : 'none';
      card.style.pointerEvents = opacity > 0.24 ? 'auto' : 'none';
    });
    raf = requestAnimationFrame(layout);
  }
  function startLoop() { cancelAnimationFrame(raf); lastTime = 0; raf = requestAnimationFrame(layout); }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0; }

  function setLightbox(i) {
    if (!photos.length) return;
    lbIndex = modulo(i, photos.length);
    var item = photos[lbIndex];
    lbImg.src = item.src; lbImg.alt = item.title || '';
    lbTitle.textContent = item.title || ''; lbSub.textContent = item.sub || '';
  }
  function openLightbox(i) { lbOn = true; setLightbox(i); lightbox.classList.add('on'); lightbox.setAttribute('aria-hidden', 'false'); }
  function closeLightbox() { lbOn = false; lightbox.classList.remove('on'); lightbox.setAttribute('aria-hidden', 'true'); }
  function navLightbox(d) { setLightbox(lbIndex + d); }

  function onKey(e) {
    if (!activeRoot) return;
    if (e.key === 'Escape') { if (lbOn) closeLightbox(); else close(); }
    else if (lbOn && e.key === 'ArrowLeft') navLightbox(-1);
    else if (lbOn && e.key === 'ArrowRight') navLightbox(1);
  }

  function bindStage() {
    stage.addEventListener('mouseenter', function () { hovered = true; });
    stage.addEventListener('mouseleave', function () { hovered = false; });
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; dragMoved = false; lastY = e.clientY;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = e.clientY - lastY; lastY = e.clientY;
      if (Math.abs(d) > 1) dragMoved = true;
      target -= d / Math.max(spacing, 24);
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId); } catch (err) {}
      setTimeout(function () { dragMoved = false; }, 120);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
  }
  function bindLightbox() {
    document.getElementById('egmClose').addEventListener('click', close);
    document.getElementById('egmLbClose').addEventListener('click', closeLightbox);
    document.getElementById('egmPrev').addEventListener('click', function () { navLightbox(-1); });
    document.getElementById('egmNext').addEventListener('click', function () { navLightbox(1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    var sx = 0;
    lightbox.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    lightbox.addEventListener('pointerup', function (e) { var dx = e.clientX - sx; if (Math.abs(dx) > 48) navLightbox(dx > 0 ? -1 : 1); });
  }

  function open(container) {
    close();
    activeContainer = container || document.body;
    photos = Array.isArray(global.EGG_PHOTOS) && global.EGG_PHOTOS.length ? global.EGG_PHOTOS : DEFAULT_PHOTOS;
    reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    activeRoot = renderShell();
    activeContainer.appendChild(activeRoot);
    stage = document.getElementById('egmStage');
    spiral = document.getElementById('egmSpiral');
    lightbox = document.getElementById('egmLightbox'); lbImg = document.getElementById('egmLarge');
    lbTitle = document.getElementById('egmLargeTitle'); lbSub = document.getElementById('egmLargeSub');
    buildCards(); bindStage(); bindLightbox(); resize();
    cleanup.push(function () { window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); });
    window.addEventListener('resize', resize); document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { activeRoot.classList.add('on'); });
    startLoop();
  }
  function close() {
    stopLoop(); lbOn = false; dragging = false; hovered = false;
    cleanup.forEach(function (fn) { try { fn(); } catch (e) {} }); cleanup = [];
    if (activeRoot && activeRoot.parentNode) {
      activeRoot.classList.remove('on');
      var old = activeRoot; activeRoot = null;
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 420);
    }
    activeContainer = null;
  }

  global.EggGallery = { open: open, close: close, isOpen: function () { return !!activeRoot; } };
})(window);

