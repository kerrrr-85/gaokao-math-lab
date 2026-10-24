/* v104 本地秒读训练：调速阅读 + 理解测验 + 本机记录 */
(function (global) {
  'use strict';

  var STORE_KEY = 'gml_speedread_v1';
  var R = null;

  var PASSAGES = [
    {
      id: 'reading-rules',
      title: '快读不是跳过理解',
      category: '阅读方法',
      text: '真正有效的快速阅读，不是让视线匆匆掠过每一个字，而是用更短的时间建立清楚的结构。开始读一篇文章前，先看标题、开头、结尾和段落首句，大致判断作者要解决什么问题。这个过程像先拿到地图，再决定走哪条路。\n\n阅读时不要平均用力。关键概念、转折词、数字、结论和条件通常承载更多信息，可以适当放慢；重复解释和熟悉例子则可以快速带过。遇到陌生词，不要立刻停住。先根据上下文猜测，再在全文结束后回头确认。频繁停顿会切碎思路，也会让人误以为自己读得很认真。\n\n读完后用一句话复述核心观点，再检查支撑它的证据。如果能说清楚“作者主张什么、为什么、有什么限制”，才说明速度真正产生了效果。阅读速度应当服务于理解；理解率长期低于八成时，继续加速只会制造虚假的成就感。',
      questions: [
        { q: '作者认为读文章前先看什么？', options: ['所有生词的解释', '标题、开头、结尾和段落首句', '每个标点', '作者的全部生平'], answer: 1 },
        { q: '遇到陌生词时，作者建议怎么做？', options: ['立即停止阅读', '跳过整段', '先根据上下文猜测，读完后确认', '查遍所有词典'], answer: 2 },
        { q: '什么时候说明加速产生了效果？', options: ['只要读完就算', '能够复述观点、理由和限制', '阅读时不眨眼', '完全不看细节'], answer: 1 }
      ]
    },
    {
      id: 'function-graph',
      title: '函数图像在说什么',
      category: '数学阅读',
      text: '函数图像不是公式的装饰，而是变量关系的一张地图。横轴和纵轴先告诉我们每个点代表什么，单调性告诉我们变化方向，极值点提示变化发生转折的位置，零点则表示图像与横轴相交。读图时如果只记住“上升”或“下降”，很容易漏掉题目真正关心的范围。\n\n看图像要按顺序提出问题。定义域在哪里？曲线是否连续？有没有渐近线？在哪些区间递增或递减？端点是否取到？这些问题的答案常常比某一个具体的函数值更重要。若不先确认定义域，就可能把图像之外的点误认为答案。\n\n图像还能帮助检查代数结果。例如求出驻点后，如果图像在该点没有转折，就要回头检查计算或判断二阶信息。反过来，代数结论也能解释图像为何出现某个形状。数与形互相校对，比单独依赖一种信息更可靠。最终写答案时，要把图像中的视觉判断转化为区间、不等式或明确的条件。',
      questions: [
        { q: '作者把函数图像比作什么？', options: ['公式的装饰', '变量关系的地图', '一张草稿纸', '只有答案的表格'], answer: 1 },
        { q: '读图时为什么先确认定义域？', options: ['为了避免把图像之外的点当成答案', '为了记住更多数字', '为了画得更漂亮', '定义域决定字体'], answer: 0 },
        { q: '图像与代数结果应该是什么关系？', options: ['只看图像即可', '两者互相校对', '只保留计算', '彼此无关'], answer: 1 }
      ]
    },
    {
      id: 'wrong-question',
      title: '错题的价值在哪里',
      category: '学习方法',
      text: '错题最重要的价值，不是提醒自己“这题不会”，而是暴露错误出现的环节。同样一个错误答案，可能来自概念混淆、方法选择不当、计算失误、审题遗漏，也可能只是时间压力带来的慌乱。如果不区分原因，只重复看一遍解析，下一次很可能以另一种形式再次出错。\n\n整理错题时，可以先写下当时为什么选择这条路。即使思路不完整，也比只抄标准答案更有用。随后把错误分成两层：第一层是结果错在哪里，第二层是产生这个结果的决定发生在什么时候。例如，选错分类标准通常属于方法问题，而把负号写丢更可能是计算或书写问题。\n\n有效的重做不是背答案，而是在一段时间后重新面对题干，独立完成关键步骤，再比较两次思路的差异。如果同一个知识点连续出错，就应回到方法卡或基础例题，而不是继续堆新题。错题本的目标是减少同类错误的概率，不是收集更多题目。',
      questions: [
        { q: '作者认为错题首先要暴露什么？', options: ['题目的页码', '错误出现的环节', '答案长度', '做题速度'], answer: 1 },
        { q: '有效的重做应该怎么做？', options: ['立刻背答案', '只抄解析', '间隔一段时间后独立完成关键步骤', '把题目删掉'], answer: 2 },
        { q: '错题本的主要目标是什么？', options: ['收藏更多题', '减少同类错误', '把本子写满', '只记录分数'], answer: 1 }
      ]
    },
    {
      id: 'spacing',
      title: '记忆为什么需要间隔',
      category: '认知科学',
      text: '连续重复同一内容，会让人很快产生熟悉感。可是熟悉并不等于能够回忆。合上书以后还能主动说出要点，才是更可靠的掌握信号。把复习分散到不同时间，比在一天内反复抄写更有利于长期记忆。\n\n间隔复习的关键，是在快要忘记但仍然能够想起的时候重新接触。间隔太短，复习会变得轻松却没有挑战；间隔太长，线索可能已经完全断开。因此计划需要根据掌握情况调整。答得顺畅的内容可以延长下次复习时间，答得不稳的内容则应更快出现。\n\n每次复习也不应只是重读。合上书回忆、用自己的话解释、做一道新题，都会迫使大脑重新提取信息。提取越费力但仍然成功，记忆往往越牢固。合理的快速阅读训练也遵循同样的原则：文章可以读得快，但读后必须通过问题检验，否则顺畅感会掩盖理解上的空白。',
      questions: [
        { q: '熟悉感为什么不能代表真正掌握？', options: ['因为它一定让人疲劳', '因为熟悉不等于能主动回忆', '因为文字会变模糊', '因为阅读没有声音'], answer: 1 },
        { q: '更合适的复习时机是什么？', options: ['完全忘记以后', '越频繁越好', '快要忘记但仍能想起时', '只在考试前'], answer: 2 },
        { q: '读完后怎样检验理解？', options: ['继续重读一遍', '通过问题主动提取信息', '只看字数', '加快下一页速度'], answer: 1 }
      ]
    },
    {
      id: 'symmetry',
      title: '对称不只是好看',
      category: '数学阅读',
      text: '对称是数学中一种节省思考的结构。看到轴对称或中心对称，我们不必重新计算每一个位置，而可以由已知部分推断未知部分。函数的奇偶性、图形的翻折、方程的成对根，本质上都利用了某种保持不变的关系。\n\n使用对称时要先说清楚“关于什么对称”和“什么量保持不变”。只说图像看起来对称，并不能直接得到结论。比如偶函数满足变量取相反数时函数值相同，因此图像关于纵轴对称；奇函数则满足符号改变，图像关于原点对称。两者都可能简化计算，但适用的条件不同。\n\n对称还能帮助发现错误。如果计算结果破坏了一个本应保留的对称关系，就值得重新检查。不过，并非所有看起来相似的图形都有严格对称。视觉上的近似不能代替条件验证。数学阅读中遇到“对称”二字，应当继续追问对称轴、对称中心、对应关系以及是否对所有点成立。',
      questions: [
        { q: '作者认为对称的主要价值是什么？', options: ['让图形漂亮', '由已知部分推断未知部分', '增加计算步骤', '替代所有证明'], answer: 1 },
        { q: '使用对称前必须说明什么？', options: ['字体大小', '关于什么对称、什么量不变', '图片颜色', '题号'], answer: 1 },
        { q: '视觉上看起来对称能否直接当结论？', options: ['可以', '必须用条件验证', '只要老师说可以', '只需量角度'], answer: 1 }
      ]
    },
    {
      id: 'attention',
      title: '专注不是一直紧绷',
      category: '学习状态',
      text: '专注并不等于从头到尾保持同样的紧张程度。真正可持续的专注，是有明确目标、减少无关切换，并在疲劳出现前主动安排短暂停顿。长时间盯着同一段文字，却不断想起消息、计划和其他任务，看似没有离开书桌，注意力其实已经反复中断。\n\n开始一段学习前，可以给任务规定一个清楚的完成标准。例如，不是“看一会数学”，而是“理解一个方法并独立做对两道题”。标准越具体，大脑越容易判断什么时候该继续、什么时候可以结束。短时间集中完成后，再安排几十秒离开屏幕，通常比无休止地硬撑更有效。\n\n阅读速度训练也需要注意状态。身体疲惫、情绪焦虑或睡眠不足时，强行提高速度只会降低理解率。记录速度时，应同时记录正确率。找到那个“略快但仍能清楚复述”的区间，再逐渐推进。训练的目标是扩大能力边界，不是每次都把自己推到崩溃边缘。',
      questions: [
        { q: '作者认为可持续的专注需要什么？', options: ['始终紧绷', '明确目标、减少切换并安排停顿', '一直看屏幕', '不停喝咖啡'], answer: 1 },
        { q: '清楚的任务完成标准有什么作用？', options: ['让学习时间无限延长', '帮助判断何时继续和结束', '替代所有知识', '让题目变简单'], answer: 1 },
        { q: '记录阅读速度时还应记录什么？', options: ['天气', '正确率', '桌椅颜色', '文章页数'], answer: 1 }
      ]
    }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function readStore() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY));
      if (d && d.version === 1) {
        d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
        return d;
      }
    } catch (e) {}
    return { version: 1, sessions: [] };
  }
  function saveStore(d) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {}
  }
  function summary(list) {
    var valid = list.filter(function (x) { return x.accuracy >= 80; });
    var best = valid.length ? Math.max.apply(null, valid.map(function (x) { return x.wpm; })) : 0;
    var avg = list.length ? Math.round(list.reduce(function (a, x) { return a + x.accuracy; }, 0) / list.length) : 0;
    return { count: list.length, best: best, accuracy: avg };
  }
  function dateText(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function historyHTML(store) {
    var rows = store.sessions.slice(0, 5);
    if (!rows.length) return '<div class="sr-empty">还没有训练记录。第一篇完成后，这里会显示速度和理解率。</div>';
    return rows.map(function (x) {
      return '<div class="sr-history-row"><span><b>' + esc(x.title) + '</b><small>' + dateText(x.at) + ' · ' + esc(x.mode === 'flash' ? '闪读' : '跟随') + '</small></span><span><b>' + x.wpm + '</b><small>字/分钟</small></span><span class="' + (x.accuracy >= 80 ? 'good' : '') + '"><b>' + x.accuracy + '%</b><small>理解率</small></span></div>';
    }).join('');
  }

  function render() {
    stop();
    document.body.classList.add('reading-mode');
    var store = readStore();
    var s = summary(store.sessions);
    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="sr-page">' +
        '<header class="sr-hero">' +
          '<div class="sr-hero-media" aria-hidden="true"><img src="./assets/gallery/starry-night.webp?v=104" alt=""></div>' +
          '<div class="sr-hero-shade" aria-hidden="true"></div>' +
          '<div class="sr-hero-copy">' +
            '<p><span>SPEED READING</span> 本地训练 / 无需学校账号</p>' +
            '<h1>把阅读的节奏，<br><em>调快一点。</em></h1>' +
            '<p class="sr-hero-lede">先用可控速度跟随文字，再通过理解题检验。速度与正确率同时达标，才算真正读得快。</p>' +
          '</div>' +
          '<div class="sr-hero-stats"><div><b>' + s.best + '</b><span>最佳速度</span><small>字/分钟</small></div><div><b>' + s.accuracy + '%</b><span>近期理解</span><small>已有记录</small></div><div><b>' + s.count + '</b><span>完成篇数</span><small>本机保存</small></div></div>' +
        '</header>' +
        '<main class="sr-shell">' +
          '<section class="sr-intro"><span class="sr-kicker">READ.01 / 训练设置</span><h2>三分钟，读一篇真正读懂的文章。</h2><p>跟随模式保留全文并用高亮引导视线；闪读模式把文字分块呈现。结束后必须完成三道理解题。</p></section>' +
          '<section class="sr-setup">' +
            '<div class="sr-setting"><label>阅读方式</label><div class="sr-segment" id="srMode"><button type="button" class="on" data-mode="follow">跟随高亮</button><button type="button" data-mode="flash">中央闪读</button></div><small>首次使用建议先从跟随高亮开始。</small></div>' +
            '<div class="sr-setting"><label for="srSpeed">目标速度 <b id="srSpeedValue">600</b> 字/分钟</label><input id="srSpeed" type="range" min="240" max="1200" step="30" value="600"><div class="sr-range-labels"><span>慢 · 稳</span><span>快 · 挑战</span></div><small>理解率低于 80% 时，先降低速度再重新训练。</small></div>' +
            '<div class="sr-setting"><label>单次时长</label><div class="sr-segment" id="srDuration"><button type="button" data-duration="60">1 分钟</button><button type="button" class="on" data-duration="120">2 分钟</button><button type="button" data-duration="180">3 分钟</button></div><small>文章读完会提前结束，不必等到计时归零。</small></div>' +
            '<button class="sr-start" type="button" id="srStart"><span>开始训练</span><i>→</i></button>' +
          '</section>' +
          '<section class="sr-principles"><article><span>01</span><h3>读得快</h3><p>让视线按稳定节奏移动，减少回看和无声逐字朗读。</p></article><article><span>02</span><h3>读得懂</h3><p>读后主动提取信息，用三题理解测验验证真实效果。</p></article><article><span>03</span><h3>看得见</h3><p>速度、理解率和历史记录只保存在当前设备。</p></article></section>' +
          '<section class="sr-history"><div class="sr-history-head"><div><span class="sr-kicker">READ.02 / 本地记录</span><h2>最近训练</h2></div><a href="https://miaoduai.com/v2/" target="_blank" rel="noopener">官方秒读课堂 ↗</a></div>' + historyHTML(store) + '</section>' +
          '<p class="sr-disclaimer">本模块是独立的通用速度阅读训练，不是“秒读课堂”官方产品，也不包含其课程或账号数据。</p>' +
        '</main>' +
      '</div>';
    R = { mode: 'follow', speed: 600, durationSec: 120, state: 'idle', raf: 0 };
    bindSetup();
  }

  function bindSetup() {
    var modeBox = document.getElementById('srMode');
    var speed = document.getElementById('srSpeed');
    var speedValue = document.getElementById('srSpeedValue');
    var duration = document.getElementById('srDuration');
    if (modeBox) modeBox.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (!btn) return;
      R.mode = btn.getAttribute('data-mode');
      Array.prototype.forEach.call(modeBox.querySelectorAll('button'), function (b) { b.classList.toggle('on', b === btn); });
    });
    if (speed) speed.addEventListener('input', function () {
      R.speed = parseInt(speed.value, 10);
      if (speedValue) speedValue.textContent = R.speed;
    });
    if (duration) duration.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-duration]');
      if (!btn) return;
      R.durationSec = parseInt(btn.getAttribute('data-duration'), 10);
      Array.prototype.forEach.call(duration.querySelectorAll('button'), function (b) { b.classList.toggle('on', b === btn); });
    });
    var start = document.getElementById('srStart');
    if (start) start.addEventListener('click', startSession);
  }

  function tokenize(text, size) {
    var tokens = [];
    text.split('\n').forEach(function (paragraph, pIndex, all) {
      var chars = Array.from(paragraph);
      for (var i = 0; i < chars.length; i += size) {
        var chunk = chars.slice(i, i + size).join('');
        tokens.push({ text: chunk, chars: chunk.replace(/\s/g, '').length });
      }
      if (pIndex < all.length - 1) tokens.push({ br: true, chars: 0 });
    });
    return tokens;
  }

  function startSession() {
    var passage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    R.passage = passage;
    R.tokens = tokenize(passage.text, 4);
    R.totalChars = R.tokens.reduce(function (a, x) { return a + x.chars; }, 0);
    R.elapsed = 0;
    R.startedAt = 0;
    R.current = -1;
    R.state = 'ready';
    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="sr-session sr-mode-' + R.mode + '">' +
        '<header class="sr-session-head"><a href="#/reading" onclick="setTimeout(function(){Reading.render()},0)">← 返回设置</a><div><span>' + esc(passage.category) + '</span><h1>' + esc(passage.title) + '</h1></div><div class="sr-session-speed"><b>' + R.speed + '</b><span>字/分钟</span></div></header>' +
        '<div class="sr-progress"><i id="srProgress"></i></div>' +
        '<section class="sr-stage" id="srStage"><div class="sr-guide-text" id="srGuideText"></div><div class="sr-flash-word" id="srFlashWord">准备</div></section>' +
        '<footer class="sr-session-foot"><div><b id="srClock">00:00</b><span id="srStatus">准备开始</span></div><div class="sr-controls"><button type="button" id="srPause">暂停</button><button type="button" id="srFinish">结束并答题</button></div></footer>' +
        '<div class="sr-countdown" id="srCountdown"><b>3</b><span>把注意力放到文字上</span></div>' +
      '</div>';
    bindSession();
    countdown(function () { beginTimer(); });
  }

  function bindSession() {
    var guide = document.getElementById('srGuideText');
    if (!guide) return;
    guide.innerHTML = R.tokens.map(function (t, i) {
      return t.br ? '<br>' : '<span data-token="' + i + '">' + esc(t.text) + '</span>';
    }).join('');
    R.elements = Array.prototype.slice.call(guide.querySelectorAll('[data-token]'));
    document.getElementById('srPause').addEventListener('click', togglePause);
    document.getElementById('srFinish').addEventListener('click', function () { endReading(false); });
  }

  function countdown(done) {
    var box = document.getElementById('srCountdown');
    var n = 3;
    function step() {
      if (!box || R.state === 'stopped') return;
      var b = box.querySelector('b');
      if (b) b.textContent = n > 0 ? n : '读';
      if (n < 0) {
        box.classList.remove('on');
        setTimeout(done, 220);
        return;
      }
      box.classList.add('on');
      n--;
      setTimeout(step, 650);
    }
    step();
  }

  function beginTimer() {
    if (!R || R.state !== 'ready' || !R.passage) return;
    R.state = 'running';
    R.startedAt = Date.now() - R.elapsed;
    var status = document.getElementById('srStatus');
    if (status) status.textContent = '阅读中';
    R.raf = requestAnimationFrame(loop);
  }

  function loop() {
    if (!R || R.state !== 'running') return;
    R.elapsed = Date.now() - R.startedAt;
    var seconds = Math.floor(R.elapsed / 1000);
    var expectedChars = R.speed * R.elapsed / 60000;
    var cumulative = 0;
    var idx = R.tokens.length - 1;
    for (var i = 0; i < R.tokens.length; i++) {
      cumulative += R.tokens[i].chars;
      if (cumulative >= expectedChars) { idx = i; break; }
    }
    setCurrentToken(idx);
    var clock = document.getElementById('srClock');
    if (clock) clock.textContent = ('0' + Math.floor(seconds / 60)).slice(-2) + ':' + ('0' + (seconds % 60)).slice(-2);
    var bar = document.getElementById('srProgress');
    if (bar) bar.style.width = Math.min(100, expectedChars * 100 / R.totalChars) + '%';
    if (expectedChars >= R.totalChars || seconds >= R.durationSec) {
      endReading(expectedChars >= R.totalChars);
      return;
    }
    R.raf = requestAnimationFrame(loop);
  }

  function setCurrentToken(idx) {
    if (!R || idx === R.current) return;
    R.current = idx;
    if (R.mode === 'follow') {
      var stage = document.getElementById('srStage');
      var el = R.elements[idx];
      if (el && stage) {
        Array.prototype.forEach.call(R.elements, function (item, i) {
          item.classList.toggle('is-read', i < idx);
          item.classList.toggle('is-current', i === idx);
        });
        stage.scrollTop = Math.max(0, el.offsetTop - stage.clientHeight * 0.43);
      }
    } else {
      var word = document.getElementById('srFlashWord');
      if (word) word.textContent = R.tokens[idx] && R.tokens[idx].text || '';
    }
  }

  function togglePause() {
    if (!R) return;
    var btn = document.getElementById('srPause');
    if (R.state === 'running') {
      R.state = 'paused';
      R.elapsed = Date.now() - R.startedAt;
      cancelAnimationFrame(R.raf);
      if (btn) btn.textContent = '继续';
      var status = document.getElementById('srStatus'); if (status) status.textContent = '已暂停';
    } else if (R.state === 'paused') {
      R.state = 'running';
      R.startedAt = Date.now() - R.elapsed;
      if (btn) btn.textContent = '暂停';
      var status2 = document.getElementById('srStatus'); if (status2) status2.textContent = '阅读中';
      R.raf = requestAnimationFrame(loop);
    }
  }

  function endReading(completed) {
    if (!R || ['quiz', 'stopped'].indexOf(R.state) >= 0) return;
    if (R.startedAt && R.state === 'running') R.elapsed = Date.now() - R.startedAt;
    R.state = 'quiz';
    cancelAnimationFrame(R.raf);
    var seconds = Math.max(5, Math.min(R.durationSec, Math.round(R.elapsed / 1000)));
    var chars = completed ? R.totalChars : Math.min(R.totalChars, Math.round(R.speed * seconds / 60));
    R.result = { seconds: seconds, chars: chars, wpm: Math.round(chars * 60 / seconds), completed: completed };
    renderQuiz();
  }

  function renderQuiz() {
    var p = R.passage;
    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="sr-quiz-wrap">' +
        '<header class="sr-quiz-head"><span>理解测验</span><b>' + R.speed + ' 字/分钟</b></header>' +
        '<main class="sr-quiz"><p class="sr-kicker">READ.03 / 不看原文，只用记忆回答</p><h1>你到底读懂了多少？</h1><form id="srQuizForm">' +
          p.questions.map(function (q, qi) {
            return '<fieldset><legend><span>0' + (qi + 1) + '</span>' + esc(q.q) + '</legend>' +
              q.options.map(function (opt, oi) {
                return '<label><input type="radio" name="q' + qi + '" value="' + oi + '"><span>' + esc(opt) + '</span></label>';
              }).join('') + '</fieldset>';
          }).join('') +
          '<button class="sr-submit" type="submit">提交并查看结果 →</button></form>' +
        '</main></div>';
    document.getElementById('srQuizForm').addEventListener('submit', submitQuiz);
  }

  function submitQuiz(e) {
    e.preventDefault();
    var answers = [];
    for (var i = 0; i < R.passage.questions.length; i++) {
      var picked = document.querySelector('input[name="q' + i + '"]:checked');
      if (!picked) { alert('还有题目没有作答。'); return; }
      answers.push(Number(picked.value));
    }
    var correct = 0;
    R.passage.questions.forEach(function (q, i) { if (answers[i] === q.answer) correct++; });
    var accuracy = Math.round(correct * 100 / R.passage.questions.length);
    var rec = { at: Date.now(), title: R.passage.title, passageId: R.passage.id, mode: R.mode, speed: R.speed, seconds: R.result.seconds, chars: R.result.chars, wpm: R.result.wpm, accuracy: accuracy, correct: correct, total: R.passage.questions.length };
    var store = readStore();
    store.sessions.unshift(rec);
    store.sessions = store.sessions.slice(0, 80);
    saveStore(store);
    renderResult(rec);
  }

  function renderResult(rec) {
    var view = document.getElementById('view');
    var level = rec.accuracy >= 80 ? '速度和理解已同时达标' : '先降低速度，把理解找回来';
    view.innerHTML =
      '<div class="sr-result"><section class="sr-result-panel">' +
        '<p class="sr-kicker">SESSION COMPLETE / 本地记录已保存</p>' +
        '<span class="sr-result-status ' + (rec.accuracy >= 80 ? 'good' : '') + '">' + esc(level) + '</span>' +
        '<h1>' + rec.wpm + '<small>字/分钟</small></h1>' +
        '<div class="sr-result-grid"><div><b>' + rec.accuracy + '%</b><span>理解率</span></div><div><b>' + rec.correct + '/' + rec.total + '</b><span>答对题目</span></div><div><b>' + rec.seconds + 's</b><span>阅读用时</span></div></div>' +
        '<p>' + (rec.accuracy >= 80 ? '下一次可尝试提高 30-60 字/分钟。' : '下一次建议降低 60-120 字/分钟，先把理解率稳定在 80% 以上。') + '</p>' +
        '<div class="sr-result-actions"><button type="button" id="srAgain">再读一篇</button><a href="#/reading" onclick="setTimeout(function(){Reading.render()},0)">返回设置</a></div>' +
      '</section></div>';
    document.getElementById('srAgain').addEventListener('click', function () {
      R.mode = rec.mode;
      R.speed = rec.accuracy >= 80 ? Math.min(1200, rec.speed + 30) : Math.max(240, rec.speed - 90);
      R.durationSec = 120;
      startSession();
    });
  }

  function stop() {
    if (R && R.raf) cancelAnimationFrame(R.raf);
    if (R) R.state = 'stopped';
    document.body.classList.remove('reading-mode');
  }

  global.Reading = {
    render: render,
    stop: stop,
    passages: PASSAGES.map(function (p) { return { id: p.id, title: p.title, category: p.category, chars: p.text.replace(/\s/g, '').length, questions: p.questions.length }; })
  };
})(window);
