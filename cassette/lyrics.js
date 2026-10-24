(function () {
  'use strict';

  var stage = document.getElementById('lyric-stage');
  var audio = document.getElementById('tape-audio');
  var trigger = document.getElementById('btn-add');
  var lineElements = stage ? Array.prototype.slice.call(stage.querySelectorAll('.lyric-line')) : [];
  if (!stage || !audio || !trigger || lineElements.length < 2) return;

  var CUES = [
    {
      id: 'dream',
      start: 0.75,
      end: 6.35,
      main: '这一秒像梦一般的心跳',
      sub: '只有你能够明了',
      mainStart: 0.8,
      subStart: 3.45,
      stagger: 0.075
    },
    {
      id: 'stars',
      start: 6.65,
      end: 13.35,
      main: '你的眼睛像星星',
      sub: '在我夜空闪耀',
      mainStart: 6.72,
      subStart: 9.05,
      stagger: 0.11
    }
  ];

  var currentCue = null;
  var lastTick = 0;
  var raf = 0;

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function easeOutCubic(v) {
    return 1 - Math.pow(1 - clamp01(v), 3);
  }

  function makeChars(element, text) {
    element.setAttribute('aria-label', text);
    element.innerHTML = '';
    return Array.prototype.map.call(text, function (char) {
      var span = document.createElement('span');
      span.className = 'lyric-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char;
      element.appendChild(span);
      return span;
    });
  }

  var renderedCue = '';
  var charSets = [[], []];

  function prepare(cue) {
    if (renderedCue === cue.id) return;
    renderedCue = cue.id;
    charSets[0] = makeChars(lineElements[0], cue.main);
    charSets[1] = makeChars(lineElements[1], cue.sub);
    stage.setAttribute('data-cue', cue.id);
    stage.setAttribute('aria-label', cue.main + '，' + cue.sub);
  }

  function paintChars(chars, start, stagger, time) {
    var newest = -1;
    chars.forEach(function (char, index) {
      var p = easeOutCubic((time - start - index * stagger) / 0.42);
      var lift = (1 - p) * 0.72;
      var rotation = (1 - p) * (index % 2 ? 2.6 : -2.2);
      char.style.opacity = p.toFixed(3);
      char.style.transform = 'translate3d(0,' + lift.toFixed(3) + 'em,0) rotate(' + rotation.toFixed(2) + 'deg) scale(' + (0.92 + p * 0.08).toFixed(3) + ')';
      char.style.filter = 'blur(' + ((1 - p) * 0.22).toFixed(3) + 'em)';
      if (time >= start + index * stagger) newest = index;
      char.classList.remove('is-lit');
    });
    if (newest >= 0) {
      chars[newest].classList.add('is-lit');
      if (newest > 0) chars[newest - 1].classList.add('is-lit');
    }
  }

  function findCue(time) {
    for (var i = 0; i < CUES.length; i++) {
      if (time >= CUES[i].start - 0.35 && time <= CUES[i].end) return CUES[i];
    }
    return null;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - lastTick < 32) return;
    lastTick = now;

    var selected = trigger.getAttribute('data-current-track') === 'take05';
    var cue = selected ? findCue(audio.currentTime) : null;
    var visible = !!cue;
    stage.classList.toggle('on', visible);
    stage.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.body.classList.toggle('lyrics-active', visible);
    if (!cue) return;

    prepare(cue);
    currentCue = cue;
    paintChars(charSets[0], cue.mainStart, cue.stagger, audio.currentTime);
    paintChars(charSets[1], cue.subStart, cue.stagger * 1.18, audio.currentTime);
  }

  window.addEventListener('gml:trackchange', function () {
    if (trigger.getAttribute('data-current-track') !== 'take05') {
      stage.classList.remove('on');
      stage.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lyrics-active');
    }
  });

  raf = requestAnimationFrame(frame);
  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(raf);
  }, { once: true });
})();
