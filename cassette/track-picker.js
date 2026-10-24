(function () {
  'use strict';

  var tracks = {
    demo: {
      src: 'assets/tracks/lu-guo-ni-de-quan-shi-jie.mp3',
      filename: '路過你的銓世界 - 抖音.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 01'
    },
    take02: {
      src: 'assets/tracks/lu-guo-02.mp3',
      filename: '路過你的銓世界 - 抖音 02.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 02'
    },
    take03: {
      src: 'assets/tracks/lu-guo-03.mp3',
      filename: '路過你的銓世界 - 抖音 03.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 03'
    },
    take04: {
      src: 'assets/tracks/lu-guo-04.mp3',
      filename: '路過你的銓世界 - 抖音 04.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 04'
    },
    take05: {
      src: 'assets/tracks/lu-guo-05.mp3',
      filename: '路過你的銓世界 - 抖音 05.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 05'
    },
    take06: {
      src: 'assets/tracks/lu-guo-06.mp3',
      filename: '路過你的銓世界 - 抖音 06.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 06'
    },
    take07: {
      src: 'assets/tracks/lu-guo-07.mp3',
      filename: '路過你的銓世界 - 抖音 07.mp3',
      type: 'audio/mpeg',
      title: '路過你的銓世界',
      artist: '抖音收藏',
      album: 'DEMO 07'
    },
    mv: {
      src: 'assets/tracks/lu-guo-mv.mp4',
      filename: '路過你的銓世界 - MV.mp4',
      type: 'audio/mp4',
      title: '路過你的銓世界 · MV 音轨',
      artist: '抖音收藏',
      album: 'DEMO 08'
    },
    ambient: {
      src: 'assets/cloud-tape-ambient.wav',
      filename: '静夜磁带.wav',
      type: 'audio/wav',
      title: '静夜磁带',
      artist: 'CLOUD TAPE',
      album: 'ROOM 111'
    }
  };

  var library = document.getElementById('track-library');
  var trigger = document.getElementById('btn-add');
  var closeButton = document.getElementById('track-close');
  var importButton = document.getElementById('track-import');
  var fileInput = document.getElementById('tape-file');
  var status = document.getElementById('track-status');
  var previousButton = document.getElementById('track-prev');
  var nextButton = document.getElementById('track-next');
  var choices = Array.prototype.slice.call(document.querySelectorAll('[data-track]'));
  var order = ['demo', 'take02', 'take03', 'take04', 'take05', 'take06', 'take07', 'mv', 'ambient'];
  var closeTimer = 0;
  var busy = false;
  var currentId = 'demo';

  if (!library || !trigger || !fileInput || !choices.length) return;

  function setActive(id) {
    if (tracks[id]) currentId = id;
    choices.forEach(function (button) {
      var active = button.getAttribute('data-track') === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', active ? 'true' : 'false');
      var state = button.querySelector('.track-state');
      if (state) state.textContent = active ? '当前' : '装载';
    });
  }

  function setOpen(open) {
    clearTimeout(closeTimer);
    if (open) {
      library.hidden = false;
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { library.classList.add('open'); });
      closeButton.focus({ preventScroll: true });
      return;
    }
    library.classList.remove('open');
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    closeTimer = setTimeout(function () {
      if (!library.classList.contains('open')) library.hidden = true;
    }, 280);
  }

  function openLibrary() {
    status.textContent = '';
    setActive(trigger.getAttribute('data-current-track') || 'demo');
    setOpen(true);
  }

  async function chooseTrack(id) {
    if (busy || !tracks[id]) return;
    var wasPlaying = document.body.classList.contains('playing');
    var choice = choices.find(function (button) { return button.getAttribute('data-track') === id; });
    var state = choice && choice.querySelector('.track-state');
    busy = true;
    if (choice) choice.classList.add('is-loading');
    if (state) state.textContent = '装载中';
    status.textContent = '正在把音乐写进磁带…';

    try {
      if (window.CloudTapeLibrary && window.CloudTapeLibrary.load) {
        await window.CloudTapeLibrary.load(tracks[id]);
      } else {
        var response = await fetch(tracks[id].src);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var blob = await response.blob();
        var file = new File([blob], tracks[id].filename, {
          type: blob.type || tracks[id].type,
          lastModified: Date.now()
        });
        var transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      trigger.setAttribute('data-current-track', id);
      setActive(id);
      if (wasPlaying) {
        var playButton = document.getElementById('btn-play');
        if (playButton) playButton.click();
      }
      status.textContent = '已装载，按“走带”开始播放。';
      setTimeout(function () { setOpen(false); }, 260);
    } catch (error) {
      status.textContent = '装载失败，请重试或导入本地文件。';
      if (state) state.textContent = '重试';
    } finally {
      busy = false;
      if (choice) choice.classList.remove('is-loading');
    }
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest || !event.target.closest('#btn-add')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openLibrary();
  }, true);

  choices.forEach(function (button) {
    button.addEventListener('click', function () {
      chooseTrack(button.getAttribute('data-track'));
    });
  });

  function stepTrack(direction) {
    var index = order.indexOf(currentId);
    if (index < 0) index = 0;
    var next = (index + direction + order.length) % order.length;
    chooseTrack(order[next]);
  }

  if (previousButton) previousButton.addEventListener('click', function () { stepTrack(-1); });
  if (nextButton) nextButton.addEventListener('click', function () { stepTrack(1); });

  closeButton.addEventListener('click', function () { setOpen(false); });
  library.addEventListener('click', function (event) {
    if (event.target === library) setOpen(false);
  });

  importButton.addEventListener('click', function () {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length) {
      trigger.removeAttribute('data-current-track');
      currentId = '';
      choices.forEach(function (button) {
        button.classList.remove('is-active');
        button.setAttribute('aria-checked', 'false');
        var state = button.querySelector('.track-state');
        if (state) state.textContent = '装载';
      });
      setTimeout(function () { setOpen(false); }, 220);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || library.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false);
  }, true);

  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'track-library');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('data-current-track', 'demo');
  setActive('demo');
})();
