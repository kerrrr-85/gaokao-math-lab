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
      '<button type="button" class="btn sm" onclick="InputTools.voice(\'' + id + '\')">🎤 语音</button>' +
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
  function voice(id) {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) { alert('当前浏览器不支持语音输入。建议用安卓 Chrome / Edge，或改用符号面板和手写。'); return; }
    var r = new SR(); r.lang = 'zh-CN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = function (e) { var t = e.results[0][0].transcript; insert(id, mathify(t)); };
    r.onerror = function (e) { alert('语音识别失败：' + (e.error || '未知错误')); };
    try { r.start(); } catch (err) {}
  }

  /* ---- 语音朗读 ---- */
  function voices() {
    if (!global.speechSynthesis) return [];
    return (speechSynthesis.getVoices() || []).filter(function (v) { return /zh|Chinese/i.test(v.lang + ' ' + v.name); });
  }
  function speak(text, opt) {
    if (!global.speechSynthesis || !text) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'zh-CN';
    if (opt) {
      if (opt.rate) u.rate = Math.max(0.5, Math.min(2, opt.rate));
      if (opt.voiceUri) { var v = voices().filter(function (x) { return x.voiceURI === opt.voiceUri; })[0]; if (v) u.voice = v; }
    }
    speechSynthesis.speak(u);
  }
  function stopSpeak() { if (global.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} } }

  global.InputTools = { insert: insert, toggle: toggle, voice: voice, canvas: canvas, getImage: getImage, clearImage: clearImage, toolbarHTML: toolbarHTML, speak: speak, stopSpeak: stopSpeak, voices: voices, mathify: mathify };
})(window);
