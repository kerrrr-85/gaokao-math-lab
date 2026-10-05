/* 输入工具：数学符号面板 / 手写画布 / 语音输入 / 语音朗读。
   全部基于浏览器原生能力，离线可用（语音识别需浏览器支持）。 */
(function (global) {
  var SYM = [
    ['运算', ['+', '−', '×', '÷', '±', '√', '^', '∑', '∏', '∫', '!', '(', ')', '[', ']', '|']],
    ['关系', ['=', '≠', '<', '>', '≤', '≥', '≈', '∝', '∈', '∉', '⊂', '⊆', '⇒', '⇔', '∀', '∃']],
    ['代数', ['²', '³', 'ⁿ', '₀', '₁', '₂', '∞', '·', 'π', 'e']],
    ['函数', ['f(x)', 'ln', 'log', 'sin', 'cos', 'tan', 'f′(x)', 'dy/dx', 'lim', 'Δ']],
    ['希腊', ['α', 'β', 'γ', 'θ', 'λ', 'μ', 'σ', 'φ', 'ω', 'Σ']],
    ['片段', ['√(x)', 'x²', 'x³', '1/x', 'f(x)=', 'x∈R', '(−∞,+∞)', '定义域', '单调递增', '恒成立']]
  ];
  var images = {};

  function insert(id, text) {
    var el = document.getElementById(id); if (!el) return;
    var s = el.selectionStart, e = el.selectionEnd;
    if (typeof s === 'number') {
      el.value = el.value.slice(0, s) + text + el.value.slice(e);
      el.selectionStart = el.selectionEnd = s + text.length;
    } else { el.value += text; }
    el.focus();
  }
  function paletteHTML(id) {
    var g = SYM.map(function (grp) {
      var btns = grp[1].map(function (c) {
        return '<button type="button" class="symbtn" onclick="InputTools.insert(\'' + id + '\',\'' + c.replace(/'/g, "\\'") + '\')">' + c + '</button>';
      }).join('');
      return '<div class="symrow"><span class="symlabel">' + grp[0] + '</span>' + btns + '</div>';
    }).join('');
    return '<div class="palette" id="pal_' + id + '" style="display:none">' + g + '</div>';
  }
  function toolbarHTML(id) {
    return '<div class="itools"><div class="row" style="gap:8px">' +
      '<button type="button" class="btn sm" onclick="InputTools.toggle(\'' + id + '\')">∑ 符号</button>' +
      '<button type="button" class="btn sm" onclick="InputTools.voice(\'' + id + '\')">🎤 语音</button>' + '<button type="button" class="btn sm" onclick="InputTools.record(\'' + id + '\')">🎙️ 录音识别</button>' +
      '<button type="button" class="btn sm" onclick="InputTools.canvas(\'' + id + '\')">✍️ 手写</button>' +
      '<span class="small muted" id="hw_' + id + '"></span></div>' + paletteHTML(id) + '</div>';
  }
  function toggle(id) { var p = document.getElementById('pal_' + id); if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; }

  /* ---- 手写画布 ---- */
  function canvas(id) {
    var old = document.getElementById('hwModal'); if (old) old.parentNode.removeChild(old);
    var m = document.createElement('div'); m.id = 'hwModal'; m.className = 'modal';
    m.innerHTML = '<div class="modalbox"><div class="row"><b>手写（手指 / 触控笔）</b><span class="grow"></span>' +
      '<button class="btn sm" id="hwUndo">撤销</button><button class="btn sm" id="hwClear">清空</button>' +
      '<button class="btn sm primary" id="hwDone">完成</button><button class="btn sm" id="hwCancel">取消</button></div>' +
      '<canvas id="hwCanvas" width="900" height="520"></canvas>' +
      '<p class="small muted">写完点“完成”，图片会随答案交给 AI 识别并讲解思路。</p></div>';
    document.body.appendChild(m);
    var cv = document.getElementById('hwCanvas'), ctx = cv.getContext('2d');
    function clear() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    clear();
    var strokes = [], cur = [], drawing = false;
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
    function redraw() {
      clear();
      var all = strokes.concat(drawing && cur.length ? [cur] : []);
      all.forEach(function (st) { ctx.beginPath(); st.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); });
    }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drawing = true; cur = [pos(e)]; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; e.preventDefault(); cur.push(pos(e)); redraw(); });
    cv.addEventListener('pointerup', function (e) { if (!drawing) return; drawing = false; strokes.push(cur); cur = []; redraw(); });
    cv.addEventListener('pointercancel', function () { drawing = false; });
    document.getElementById('hwUndo').onclick = function () { strokes.pop(); redraw(); };
    document.getElementById('hwClear').onclick = function () { strokes = []; cur = []; drawing = false; redraw(); };
    document.getElementById('hwCancel').onclick = function () { m.parentNode.removeChild(m); };
    document.getElementById('hwDone').onclick = function () {
      var max = 1024, w = cv.width, h = cv.height, sc = Math.min(1, max / Math.max(w, h));
      var out = document.createElement('canvas'); out.width = Math.round(w * sc); out.height = Math.round(h * sc);
      var octx = out.getContext('2d'); octx.fillStyle = '#fff'; octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(cv, 0, 0, out.width, out.height);
      var url = out.toDataURL('image/jpeg', 0.7);
      images[id] = url;
      var tag = document.getElementById('hw_' + id); if (tag) tag.textContent = '已附手写图 ✓';
      m.parentNode.removeChild(m);
    };
  }
  function pad(id, key) {
    var cv = document.getElementById(id); if (!cv) return;
    var ctx = cv.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a';
    try { var saved = localStorage.getItem('gml_draft_' + key); if (saved) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, cv.width, cv.height); }; img.src = saved; } } catch (e) {}
    var drawing = false;
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; e.preventDefault(); var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    cv.addEventListener('pointerup', function () { drawing = false; try { localStorage.setItem('gml_draft_' + key, cv.toDataURL('image/png')); } catch (err) {} });
  }
  function clearPad(id, key) { var cv = document.getElementById(id); if (!cv) return; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); try { localStorage.removeItem('gml_draft_' + key); } catch (e) {} }
  function getImage(id) { return images[id] || null; }
  function clearImage(id) { delete images[id]; }

  /* ---- 语音输入 ---- */
  function mathify(t) {
    return String(t || '')
      .replace(/的平方/g, '²').replace(/的立方/g, '³')
      .replace(/大于等于|大于或等于/g, '≥').replace(/小于等于|小于或等于/g, '≤')
      .replace(/不等于/g, '≠').replace(/正负/g, '±').replace(/根号|开根号/g, '√')
      .replace(/乘以|乘/g, '×').replace(/除以/g, '÷').replace(/无穷(大)?/g, '∞')
      .replace(/圆周率|派/g, 'π').replace(/阿尔法/g, 'α').replace(/贝塔/g, 'β').replace(/西塔/g, 'θ').replace(/德尔塔/g, 'Δ')
      .replace(/属于/g, '∈').replace(/空集/g, '∅').replace(/大于/g, '>').replace(/小于/g, '<');
  }
  var activeRec = null;
  function voice(id) {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) { alert('当前浏览器不支持网页语音输入。\n\n替代方案：\n1) 点输入框，用手机输入法自带的麦克风说话；\n2) 用「✍️ 手写」或「∑ 符号」输入。'); return; }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { alert('语音输入需要 HTTPS。请用线上网址打开：https://kerrrr-85.github.io/gaokao-math-lab/'); return; }
    if (activeRec) { try { activeRec.abort(); } catch (e) {} activeRec = null; }
    var r = new SR(); activeRec = r;
    r.lang = 'zh-CN'; r.interimResults = false; r.continuous = false; r.maxAlternatives = 1;
    var finalText = '';
    r.onresult = function (e) { finalText = e.results[0][0].transcript; };
    r.onerror = function (e) {
      var msg = {
        'not-allowed': '麦克风权限被拒绝。请点地址栏的锁形图标，把“麦克风”设为允许，再试一次。',
        'service-not-allowed': '浏览器不允许使用语音服务（设备策略限制）。请改用手机输入法的麦克风。',
        'audio-capture': '没有找到麦克风，或麦克风被其他应用占用。',
        'network': '浏览器的语音服务连不上（国内 Chrome 常见，走的是谷歌服务）。建议：① 用手机输入法自带的麦克风说话；② 换 Edge 安卓版；③ 用符号面板/手写。',
        'aborted': '识别被中断（可能是重复点击或权限弹窗被关掉）。请再点一次「🎤 语音」，并允许麦克风。',
        'no-speech': '没有听到声音，请靠近麦克风再说一次。'
      };
      alert('语音识别失败：' + (msg[e.error] || e.error));
    };
    r.onend = function () { if (finalText) insert(id, mathify(finalText)); activeRec = null; };
    try { r.start(); } catch (err) { alert('无法启动语音识别：' + (err && err.message ? err.message : err) + '\n可改用手机输入法的麦克风。'); activeRec = null; }
  }

  /* ---- 录音识别（走 Worker + 通义 ASR，国内可用） ---- */
  function blobToWavBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var AC = global.AudioContext || global.webkitAudioContext;
        var ctx = new AC();
        ctx.decodeAudioData(fr.result, function (buf) {
          var ch = buf.getChannelData(0), sr = buf.sampleRate, len = ch.length;
          var ab = new ArrayBuffer(44 + len * 2), v = new DataView(ab);
          function ws(o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }
          ws(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
          v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
          v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
          ws(36, 'data'); v.setUint32(40, len * 2, true);
          for (var i = 0; i < len; i++) { var x = Math.max(-1, Math.min(1, ch[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7FFF, true); }
          var bytes = new Uint8Array(ab), bin = '';
          for (var j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
          resolve('data:audio/wav;base64,' + btoa(bin));
        }, reject);
      };
      fr.onerror = reject;
      fr.readAsArrayBuffer(blob);
    });
  }
  function showCube(text) {
    var el = document.getElementById('cubeOverlay');
    if (!el) {
      el = document.createElement('div'); el.id = 'cubeOverlay'; el.className = 'cube-overlay';
      el.innerHTML = '<div class="cube-loader"><div class="loader_cube loader_cube--glowing"></div><div class="loader_cube loader_cube--color"></div></div><div class="cube-text" id="cubeText"></div>';
      document.body.appendChild(el);
    }
    var t = document.getElementById('cubeText'); if (t) t.textContent = text || '';
  }
  function hideCube() { var el = document.getElementById('cubeOverlay'); if (el && el.parentNode) el.parentNode.removeChild(el); }
  function record(id) {
    var cfg = (global.Store && Store.get().settings.ai) || {};
    var proxy = (cfg.proxyUrl || '').replace(/\/+$/, '');
    if (!proxy) { alert('录音识别需要先在「设置 → AI 讲解」填写 Cloudflare Worker 代理地址。\n也可以直接用手机输入法自带的麦克风。'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !global.MediaRecorder) { alert('当前浏览器不支持录音，请改用手机输入法麦克风或手写。'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var chunks = [], mr = new MediaRecorder(stream);
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); }); showCube('正在识别语音…');
        var blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        blobToWavBase64(blob).then(function (b64) {
          fetch(proxy + '/asr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: b64 }) })
            .then(function (r) { return r.json(); })
            .then(function (j) { hideCube(); if (j && j.text) { insert(id, mathify(j.text)); } else { alert('识别失败：' + ((j && j.error) || '未知')); } })
            .catch(function (e) { hideCube(); alert('识别请求失败：' + e.message); });
        }).catch(function (e) { alert('音频处理失败：' + e.message); });
      };
      mr.start(); showCube('正在录音…（6 秒）');
      if (global.toast) {} 
      setTimeout(function () { try { mr.stop(); } catch (e) {} }, 6000);
    }).catch(function (e) { hideCube(); alert('无法使用麦克风：' + e.message); });
  }

  /* ---- 语音朗读 ---- */
  var voiceCache = [];
  function refreshVoices() { try { voiceCache = global.speechSynthesis ? (speechSynthesis.getVoices() || []) : []; } catch (e) { voiceCache = []; } }
  function voices() { if (!voiceCache.length) refreshVoices(); var zh = voiceCache.filter(function (v) { return /zh|Chinese/i.test(v.lang + ' ' + v.name); }); return zh.length ? zh : voiceCache; }
  function speak(text, opt) {
    if (!global.speechSynthesis) { alert('当前浏览器不支持语音朗读。'); return false; }
    var full = String(text || '').trim(); if (!full) return false;
    try { speechSynthesis.cancel(); } catch (e) {}
    var chunks = full.match(/[^。！？!?；;\n]{1,120}[。！？!?；;]?/g) || [full];
    var chosen = null, vs = voices(), k;
    if (opt && opt.voiceUri) { for (k = 0; k < vs.length; k++) { if (vs[k].voiceURI === opt.voiceUri) chosen = vs[k]; } }
    var i = 0;
    function next() {
      if (i >= chunks.length) return;
      var u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = 'zh-CN';
      if (opt && opt.rate) u.rate = Math.max(0.5, Math.min(2, opt.rate));
      if (chosen) u.voice = chosen;
      u.onend = next;
      u.onerror = function () { setTimeout(next, 40); };
      try { speechSynthesis.speak(u); } catch (e) {}
    }
    setTimeout(function () { try { speechSynthesis.resume(); } catch (e) {} next(); }, 80);
    return true;
  }
  function stopSpeak() { if (global.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} } }
  function diag() {
    var hasTTS = !!global.speechSynthesis; if (hasTTS) refreshVoices();
    return { https: location.protocol === 'https:', hasASR: !!(global.SpeechRecognition || global.webkitSpeechRecognition), hasTTS: hasTTS, voices: voiceCache.length, zhVoices: hasTTS ? voiceCache.filter(function (v) { return /zh|Chinese/i.test(v.lang + ' ' + v.name); }).length : 0, ua: navigator.userAgent };
  }
  function copyText(t) { try { navigator.clipboard.writeText(String(t || '')); return true; } catch (e) { return false; } }
  if (global.speechSynthesis && typeof speechSynthesis.addEventListener === 'function') { speechSynthesis.addEventListener('voiceschanged', refreshVoices); }

  global.InputTools = { insert: insert, toggle: toggle, voice: voice, canvas: canvas, getImage: getImage, clearImage: clearImage, toolbarHTML: toolbarHTML, speak: speak, stopSpeak: stopSpeak, voices: voices, mathify: mathify, diag: diag, copyText: copyText, record: record, showCube: showCube, hideCube: hideCube, pad: pad, clearPad: clearPad };
})(window);
