/* 应用主体：路由 + 各页面视图 */
(function () {
  var D = window.DATA, Store = window.Store, SRS = window.SRS;
  var view = document.getElementById('view'), toastEl = document.getElementById('toast');
  var nodeById = {}, methodById = {}, qById = {};
  D.nodes.forEach(function (n) { nodeById[n.id] = n; });
  D.methods.forEach(function (m) { methodById[m.id] = m; });
  D.questions.forEach(function (q) { qById[q.id] = q; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(function () { toastEl.classList.remove('show'); }, 1500); }
  function diffTag(d) { var c = d === '基础' ? 'd1' : d === '中档' ? 'd2' : 'd3'; return '<span class="tag ' + c + '">' + d + '</span>'; }
  function typeName(t) { return t === 'choice' ? '选择' : t === 'fill' ? '填空' : '解答'; }
  function cardTitle(c) { if (c.refType === 'method') { var m = methodById[c.refId]; return m ? m.title : c.refId; } var q = qById[c.refId]; return q ? (typeName(q.type) + '题 · ' + q.stem.slice(0, 24)) : c.refId; }

  var cards = [];
  D.methods.forEach(function (m) { cards.push(SRS.newCard('method', m.id)); });
  D.questions.forEach(function (q) { cards.push(SRS.newCard('question', q.id)); });
  Store.ensureCards(cards);

  function isNew(c) { return c.state === 'new'; }
  function dueReview() { return Store.allCards().filter(function (c) { return !isNew(c) && SRS.isDue(c); }); }
  function newCards() { return Store.allCards().filter(isNew); }

  function updateMini() {
    document.getElementById('todayMini').textContent = '待复习 ' + dueReview().length + ' · 新卡 ' + newCards().length + ' · 已练 ' + Store.stats().total + ' 题';
  }
  function setTab(page) {
    var map = { today: 'today', map: 'map', node: 'map', method: 'map', practice: 'practice', wrong: 'wrong', stats: 'stats', settings: 'settings', search: 'search' };
    var t = map[page] || 'today';
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar a'), function (a) { a.classList.toggle('active', a.dataset.tab === t); });
  }

  /* ============ 今日 ============ */
  function renderToday() {
    var due = dueReview(), nw = newCards(), st = Store.stats();
    var avg = 0, cnt = 0;
    D.nodes.forEach(function (n) { avg += Store.masteryOf(n.id); cnt++; });
    avg = cnt ? Math.round(avg / cnt) : 0;
    var html = '<div class="hero"><div class="wxCardContainer"><div class="wxCard" onclick="App.refreshWeather()"><div style="text-align:center"><p class="wxCity" id="wxCity">' + (((Store.get().settings||{}).weather||{}).city || '北京') + '</p><p class="wxWeather" id="wxDesc">加载中…</p></div><div class="wxTemp" id="wxTemp">--°</div><div class="wxMinMax"><div class="wxMin"><span class="wxMinH">最低</span><span class="wxMinT" id="wxMin">--°</span></div><div class="wxMax"><span class="wxMaxH">最高</span><span class="wxMaxT" id="wxMax">--°</span></div></div></div></div><div class="heroText"><h1>今天，先把该复习的做完</h1><p>待复习 ' + due.length + ' 张 · 新卡 ' + nw.length + ' 张 · 累计练习 ' + st.total + ' 题</p><div class="row" style="margin-top:12px"><button class="btn primary" onclick="go(\'#/practice/start\')">开始练习</button><button class="btn" onclick="go(\'#/map\')">看知识图谱</button></div></div></div>';
    html += '<div class="kpi">' +
      '<div class="card"><b>' + due.length + '</b><span class="small muted">待复习卡</span></div>' +
      '<div class="card"><b>' + nw.length + '</b><span class="small muted">新卡</span></div>' +
      '<div class="card"><b>' + st.total + '</b><span class="small muted">累计练习</span></div>' +
      '<div class="card"><b>' + avg + '%</b><span class="small muted">平均掌握度</span></div>' +
      '</div>';
    html += '<div class="card"><div class="row"><h2 class="grow">复习队列</h2><span class="small muted">按遗忘曲线安排</span></div>';
    if (!due.length) html += '<p class="muted">当前没有到期的复习卡。可以去做新题。</p>';
    else {
      html += '<div class="list">';
      due.slice(0, Store.get().settings.reviewPerDay).forEach(function (c) {
        html += '<div class="item"><div class="row"><div class="grow"><b>' + esc(cardTitle(c)) + '</b><div class="small muted">' + (c.refType === 'method' ? '方法卡' : '题目卡') + ' · 第 ' + (c.reps + 1) + ' 次</div></div></div>' +
          '<div class="row" style="margin-top:8px"><button class="btn sm" onclick="App.reviewCard(\'' + c.id + '\',0)">不会</button><button class="btn sm" onclick="App.reviewCard(\'' + c.id + '\',1)">半会</button><button class="btn sm primary" onclick="App.reviewCard(\'' + c.id + '\',2)">会了</button></div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="card"><div class="row"><h2 class="grow">新卡</h2><button class="btn sm primary" onclick="App.go(\'#/practice\')">去练习</button></div>';
    html += '<p class="muted small">先从方法卡和例题开始建立记忆，之后系统会自动安排复习。</p>';
    html += '<div class="list">' + nw.slice(0, Store.get().settings.newPerDay).map(function (c) {
      return '<a class="item" href="' + (c.refType === 'method' ? '#/method/' + c.refId : '#/practice') + '"><b>' + esc(cardTitle(c)) + '</b><div class="small muted">' + (c.refType === 'method' ? '方法卡' : '题目卡') + '</div></a>';
    }).join('') + '</div></div>';
    view.innerHTML = html;
    loadWeather();
  }

  function wmoText(c) { var m = {0:'晴',1:'基本晴朗',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'毛毛雨',53:'小雨',55:'中雨',56:'冻雨',57:'冻雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'冻雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨',81:'阵雨',82:'强阵雨',85:'阵雪',86:'阵雪',95:'雷阵雨',96:'雷阵雨伴冰雹',99:'雷暴'}; return m[c] || '--'; }
  function applyWeather(d) { var q = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }; q('wxCity', d.city); q('wxDesc', wmoText(d.code)); q('wxTemp', Math.round(d.temp) + '°'); q('wxMin', Math.round(d.min) + '°'); q('wxMax', Math.round(d.max) + '°'); }
  function refreshWeather() { loadWeather(true); }
  function loadWeather(force) {
    var city = ((Store.get().settings || {}).weather || {}).city || '北京';
    var el = document.getElementById('wxCity'); if (el) el.textContent = city;
    var cache = null; try { cache = JSON.parse(localStorage.getItem('gml_weather')); } catch (e) {}
    if (!force && cache && cache.city === city && Date.now() - cache.at < 1800000) { applyWeather(cache); return; }
    var desc = document.getElementById('wxDesc'); if (desc) desc.textContent = '加载中…';
    fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=zh&name=' + encodeURIComponent(city))
      .then(function (r) { return r.json(); })
      .then(function (g) {
        if (!g.results || !g.results.length) throw new Error('找不到城市');
        var c = g.results[0];
        return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + c.latitude + '&longitude=' + c.longitude + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
          .then(function (r) { return r.json(); })
          .then(function (w) { var d = { city: c.name, at: Date.now(), temp: w.current.temperature_2m, code: w.current.weather_code, max: w.daily.temperature_2m_max[0], min: w.daily.temperature_2m_min[0] }; try { localStorage.setItem('gml_weather', JSON.stringify(d)); } catch (e) {} applyWeather(d); });
      })
      .catch(function () { var t = document.getElementById('wxDesc'); if (t) t.textContent = '天气获取失败（点卡片重试）'; });
  }
  /* ============ 知识图谱 ============ */
  function renderMap() {
    var depth = {}; D.nodes.forEach(function (n) { depth[n.id] = 0; });
    for (var k = 0; k < 6; k++) { D.nodes.forEach(function (n) { n.prereq.forEach(function (p) { if (depth[p] + 1 > depth[n.id]) depth[n.id] = depth[p] + 1; }); }); }
    var layers = {}; D.nodes.forEach(function (n) { (layers[depth[n.id]] = layers[depth[n.id]] || []).push(n); });
    var W = 900, H = 520, pad = 70, pos = {};
    Object.keys(layers).forEach(function (d) {
      var arr = layers[d], y = pad + (H - 2 * pad) * (Object.keys(layers).length === 1 ? 0.5 : d / (Object.keys(layers).length - 1));
      arr.forEach(function (n, i) { pos[n.id] = { x: W * (i + 1) / (arr.length + 1), y: y }; });
    });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    D.nodes.forEach(function (n) { n.prereq.forEach(function (p) { if (pos[p] && pos[n.id]) { var a = pos[p], b = pos[n.id]; svg += '<path class="edge" d="M' + a.x + ' ' + (a.y + 22) + ' C' + a.x + ' ' + (a.y + 60) + ', ' + b.x + ' ' + (b.y - 60) + ', ' + b.x + ' ' + (b.y - 22) + '"/>'; } }); });
    D.nodes.forEach(function (n) {
      var p = pos[n.id], m = Store.masteryOf(n.id);
      svg += '<g class="gnode' + (m >= 60 ? ' done' : '') + '" transform="translate(' + p.x + ',' + p.y + ')" onclick="App.go(\'#/node/' + n.id + '\')"><circle r="22"/><text y="44">' + esc(n.title) + '</text><text y="0" dy="4" style="font-size:12px;fill:#0f766e">' + m + '%</text></g>';
    });
    svg += '</svg>';
    view.innerHTML = '<h1>知识图谱</h1><p class="muted small">节点为知识模块，连线是先修关系；绿色表示掌握度 ≥ 60%。点击节点查看详情。</p><div class="graph">' + svg + '</div>';
  }

  /* ============ 节点 / 方法 ============ */
  function masteryBar(id) { var m = Store.masteryOf(id); return '<div class="mastery"><div class="bar"><i style="width:' + m + '%"></i></div><span class="small">' + m + '%</span></div>'; }
  function renderNode(id) {
    var n = nodeById[id]; if (!n) { view.innerHTML = '<div class="card">未找到该知识节点。</div>'; return; }
    var ms = D.methods.filter(function (m) { return n.methods.indexOf(m.id) >= 0; });
    var qs = D.questions.filter(function (q) { return q.node === n.id; });
    var html = '<div class="card"><div class="row">' + diffTag(n.diff) + '<span class="tag p">' + esc(n.title) + '</span></div><h1 style="margin-top:10px">' + esc(n.title) + '</h1><p class="muted">' + esc(n.brief) + '</p>' + masteryBar(n.id) + '<p class="small" style="margin-top:10px"><b>课标要求：</b>' + esc(n.req) + '</p></div>';
    html += '<div class="card"><h2>方法卡（' + ms.length + '）</h2><div class="list">' + ms.map(function (m) { return '<a class="item" href="#/method/' + m.id + '"><b>' + esc(m.title) + '</b><div class="small muted">' + esc(m.trigger) + '</div></a>'; }).join('') + '</div></div>';
    html += '<div class="card"><div class="row"><h2 class="grow">相关题目（' + qs.length + '）</h2><button class="btn sm primary" onclick="App.startPractice(\'' + qs.map(function (q) { return q.id; }).join(',') + '\')">全部练习</button></div><div class="list">' + qs.map(function (q) { return '<div class="item"><div class="row">' + diffTag(q.diff) + '<span class="tag">' + typeName(q.type) + '</span></div><div style="margin-top:6px">' + esc(q.stem) + '</div><button class="btn sm" style="margin-top:8px" onclick="App.startSingle(\'' + q.id + '\')">练这题</button></div>'; }).join('') + '</div></div>';
    view.innerHTML = html;
  }
  function renderMethod(id) {
    var m = methodById[id]; if (!m) { view.innerHTML = '<div class="card">未找到该方法卡。</div>'; return; }
    var n = nodeById[m.node];
    var html = '<div class="card"><div class="row">' + diffTag(m.diff) + '<a class="tag p" href="#/node/' + m.node + '">' + esc(n ? n.title : '') + '</a></div><h1 style="margin-top:10px">' + esc(m.title) + '</h1>' +
      '<p><b>识别信号：</b>' + esc(m.trigger) + '</p>' +
      '<p><b>公式/依据：</b>' + esc(m.formula) + '</p>' +
      '<p><b>易错点：</b>' + esc(m.mistake) + '</p>' +
      '<h3>操作步骤</h3><ol class="steps">' + m.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<div class="row" style="margin-top:14px"><button class="btn" onclick="App.reviewCard(\'method:' + m.id + '\',0)">不会</button><button class="btn" onclick="App.reviewCard(\'method:' + m.id + '\',1)">半会</button><button class="btn primary" onclick="App.reviewCard(\'method:' + m.id + '\',2)">会了</button></div></div>';
    view.innerHTML = html;
  }

  /* ============ 练习 ============ */
  var session = { list: [], i: 0, answered: false, lastAttempt: null };
  function renderPractice() {
    if (session.list.length) { renderQuestion(); return; }
    var html = '<h1>练习</h1><div class="card"><div class="grid2">' +
      '<label>知识节点<select id="fNode" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px"><option value="">全部</option>' + D.nodes.map(function (n) { return '<option value="' + n.id + '">' + esc(n.title) + '</option>'; }).join('') + '</select></label>' +
      '<label>难度<select id="fDiff" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px"><option value="">全部</option><option>基础</option><option>中档</option><option>压轴</option></select></label>' +
      '<label>题型<select id="fType" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px"><option value="">全部</option><option value="choice">选择</option><option value="fill">填空</option><option value="solution">解答</option></select></label>' +
      '<label>数量<select id="fCount" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px"><option>8</option><option>12</option><option>20</option><option>48</option></select></label>' +
      '</div><div class="row" style="margin-top:12px"><button class="btn primary" onclick="App.beginPractice()">开始练习</button><button class="btn" onclick="App.beginPractice(true)">交错练习</button></div></div>';
    var wrong = D.questions.filter(function (q) { return Store.wrong().some(function (a) { return a.questionId === q.id; }); });
    if (wrong.length) html += '<div class="card"><h2>重点复习（错过的题）</h2><button class="btn accent" onclick="App.startPractice(\'' + wrong.map(function (q) { return q.id; }).join(',') + '\')">重做错题（' + wrong.length + '）</button></div>';
    view.innerHTML = html;
  }
  function pickQuestions(interleave) {
    var n = (document.getElementById('fNode') || {}).value || '', d = (document.getElementById('fDiff') || {}).value || '', t = (document.getElementById('fType') || {}).value || '', c = parseInt((document.getElementById('fCount') || {}).value || '8', 10);
    var arr = D.questions.filter(function (q) { return (!n || q.node === n) && (!d || q.diff === d) && (!t || q.type === t); });
    if (interleave) { var seen = {}, out = []; arr.forEach(function (q) { if (!seen[q.node]) { seen[q.node] = 1; out.push(q); } }); arr.forEach(function (q) { if (out.indexOf(q) < 0) out.push(q); }); arr = out; }
    return arr.slice(0, c);
  }
  function beginPractice(interleave) { session = { list: pickQuestions(interleave), i: 0, answered: false, lastAttempt: null }; if (!session.list.length) { toast('没有符合条件的题目'); return; } renderQuestion(); }
  function startPractice(ids) { session = { list: ids.split(',').map(function (x) { return qById[x]; }).filter(Boolean), i: 0, answered: false, lastAttempt: null }; renderQuestion(); }
  function startSingle(id) { startPractice(id); }
  function renderQuestion() {
    var q = session.list[session.i]; if (!q) { renderSessionEnd(); return; }
    var html = '<div class="card"><div class="row"><span class="tag">第 ' + (session.i + 1) + ' / ' + session.list.length + ' 题</span>' + diffTag(q.diff) + '<span class="tag p">' + typeName(q.type) + '</span><a class="tag" href="#/node/' + q.node + '">' + esc(nodeById[q.node].title) + '</a></div>';
    html += '<div class="qbox" style="margin-top:12px;font-size:16px">' + esc(q.stem) + '</div>';
    if (q.type === 'choice') {
      html += '<div style="margin-top:12px" id="opts">' + q.options.map(function (o, i) { return '<div class="opt" data-k="' + 'ABCD'[i] + '" onclick="App.selOpt(this)"><b>' + 'ABCD'[i] + '.</b><span>' + esc(o) + '</span></div>'; }).join('') + '</div>';
    } else if (q.type === 'fill') {
      html += '<div style="margin-top:12px"><input type="text" id="fillInput" placeholder="输入答案，如 x≥1"></div>' + InputTools.toolbarHTML('fillInput');
    } else {
      html += '<div style="margin-top:12px"><textarea id="solInput" placeholder="写下你的解答过程"></textarea></div>' + InputTools.toolbarHTML('solInput');
    }
    html += '<div class="seclabel" style="margin-top:16px">你的思路（可选，AI 据此指出错在哪）</div><textarea id="stepsInput" placeholder="例如：先求定义域 → 求导 → 判断单调性 → 找极值"></textarea>' + InputTools.toolbarHTML('stepsInput');
    html += '<div id="ansArea"></div>';
    html += '<div class="row" style="margin-top:14px"><button class="btn primary" id="submitBtn" onclick="App.submit()">提交</button><button class="btn ghost" onclick="App.nextQ()">跳过</button></div>';
    html += '</div>';
    view.innerHTML = html;
    session.answered = false;
  }
  function selOpt(el) { Array.prototype.forEach.call(document.querySelectorAll('#opts .opt'), function (o) { o.classList.remove('sel'); }); el.classList.add('sel'); }
  function norm(s) { return String(s || '').replace(/\s+/g, '').replace(/[×xX]/g, 'x').replace(/[－—–−]/g, '-').replace(/[，,]/g, '').toLowerCase(); }
  function submit() {
    if (session.answered) return;
    var q = session.list[session.i], result = 'no', userAnswer = '';
    if (q.type === 'choice') { var sel = document.querySelector('#opts .opt.sel'); if (!sel) { toast('请选择一个选项'); return; } userAnswer = sel.dataset.k; result = (userAnswer === q.answer) ? 'ok' : 'no'; }
    else if (q.type === 'fill') { userAnswer = (document.getElementById('fillInput') || {}).value || ''; result = (norm(userAnswer) === norm(q.answer)) ? 'ok' : 'no'; }
    else { userAnswer = (document.getElementById('solInput') || {}).value || ''; result = 'half'; }
    var userSteps = (document.getElementById('stepsInput') || {}).value || '';
    var img = (window.InputTools ? (InputTools.getImage('fillInput') || InputTools.getImage('solInput') || InputTools.getImage('stepsInput')) : null);
    session.answered = true;
    var attempt = { id: 'a' + Date.now(), questionId: q.id, nodeIds: [q.node], methodIds: q.methods, difficulty: q.diff, userAnswer: userAnswer, userSteps: userSteps, imageDataUrl: img || '', result: result, errorType: '', createdAt: Date.now() };
    Store.addAttempt(attempt); session.lastAttempt = attempt;
    Store.grade('question:' + q.id, result === 'ok' ? 2 : result === 'half' ? 1 : 0);
    q.methods.forEach(function (mid) { if (Store.get().reviews['method:' + mid]) Store.grade('method:' + mid, result === 'ok' ? 2 : result === 'half' ? 1 : 0); });
    showAnswer(q, result, userAnswer);
    updateMini();
  }
  function showAnswer(q, result, userAnswer) {
    var label = result === 'ok' ? '<span class="result-ok">✓ 正确</span>' : result === 'half' ? '<span class="result-half">≈ 已自评</span>' : '<span class="result-no">✗ 再想想</span>';
    var html = '<div class="ans-area"><div class="row">' + label + '<span class="grow"></span><span class="small muted">你的答案：' + esc(userAnswer || '（未填）') + '</span></div>';
    html += '<p style="margin-top:10px"><b>参考答案：</b>' + esc(q.answer) + '</p><p><b>解析：</b>' + esc(q.steps) + '</p>';
    if (result === 'solution') { }
    if (q.type === 'solution') {
      html += '<p class="small muted">自评（写入复习计划）：</p><div class="row"><button class="btn sm" onclick="App.selfRate(0)">不会</button><button class="btn sm" onclick="App.selfRate(1)">半会</button><button class="btn sm primary" onclick="App.selfRate(2)">会了</button></div>';
    } else if (result !== 'ok') {
      html += '<p class="small muted" style="margin-top:8px">错因归类（帮助统计薄弱点）：</p><div class="row">' + ['知识', '方法', '计算', '审题', '心态'].map(function (t) { return '<button class="btn sm" onclick="App.tagError(\'' + t + '\')">' + t + '</button>'; }).join('') + '</div><p style="margin-top:8px"><button class="btn sm" onclick="App.overrideOk()">其实我会，标为掌握</button></p>';
    }
    html += '<div id="aiArea"></div>';
    html += '<div class="row" style="margin-top:12px"><button class="btn accent" onclick="App.aiExplain()">🤖 AI 讲解</button><button class="btn" onclick="App.speakAnswer()">🔊 朗读解析</button><button class="btn" onclick="App.stopSpeak()">⏹ 停止</button><button class="btn primary" onclick="App.nextQ()">下一题 →</button></div></div>';
    document.getElementById('ansArea').innerHTML = html;
    document.getElementById('submitBtn').disabled = true;
  }
  function selfRate(g) { var q = session.list[session.i]; Store.grade('question:' + q.id, g); if (session.lastAttempt) { session.lastAttempt.result = g === 2 ? 'ok' : g === 1 ? 'half' : 'no'; } toast(SRS.label(g) + '，已安排复习'); }
  function tagError(t) { if (session.lastAttempt) { session.lastAttempt.errorType = t; var a = Store.get().attempts; for (var i = 0; i < a.length; i++) { if (a[i].id === session.lastAttempt.id) a[i].errorType = t; } Store.save(); } toast('已标记：' + t); }
  function overrideOk() { var q = session.list[session.i]; var a = Store.get().attempts; for (var i = 0; i < a.length; i++) { if (a[i].id === session.lastAttempt.id) { a[i].result = 'ok'; } } Store.save(); Store.grade('question:' + q.id, 2); toast('已标为掌握'); }
  function nextQ() { session.i += 1; session.answered = false; if (session.i >= session.list.length) renderSessionEnd(); else renderQuestion(); }
  function renderSessionEnd() {
    view.innerHTML = '<div class="card"><h1>本组完成 🎉</h1><p class="muted">这一组的作答已计入掌握度和复习计划。</p><div class="row"><button class="btn primary" onclick="App.resetPractice()">再来一组</button><button class="btn" onclick="App.go(\'#/stats\')">查看统计</button></div></div>';
  }
  function resetPractice() { session = { list: [], i: 0, answered: false }; renderPractice(); }

  function speakAnswer() { var q = session.list[session.i]; if (!q) return; InputTools.speak('题目。' + q.stem + '。参考答案：' + q.answer + '。解析：' + q.steps, Store.get().settings.voice || {}); }
  function stopSpeak() { InputTools.stopSpeak(); }
  function aiExplain() {
    var q = session.list[session.i], box = document.getElementById('aiArea'); if (!q || !box) return;
    var att = session.lastAttempt || {}, cfg = Store.get().settings.ai || {};
    if (!cfg.enabled || !cfg.proxyUrl) { renderAI(AI.rule(q, att.userAnswer, att.userSteps)); return; }
    box.innerHTML = AI.blobHTML('AI 正在分析你的思路…');
    AI.analyze({ question: q.stem, reference: q.answer, refSteps: q.steps, userAnswer: att.userAnswer || '', userSteps: att.userSteps || '', errorType: att.errorType || '', imageDataUrl: att.imageDataUrl || '' }, cfg.proxyUrl)
      .then(function (a) { a.source = 'ai'; renderAI(a); })
      .catch(function () { renderAI(AI.rule(q, att.userAnswer, att.userSteps)); });
  }
  function renderAI(a) {
    var box = document.getElementById('aiArea'); if (!box) return;
    box.innerHTML = AI.render(a);
    if (session.lastAttempt) {
      session.lastAttempt.aiAnalysis = a; session.lastAttempt.aiAt = Date.now();
      var arr = Store.get().attempts;
      for (var i = 0; i < arr.length; i++) { if (arr[i].id === session.lastAttempt.id) { arr[i].aiAnalysis = a; arr[i].aiAt = Date.now(); } }
      Store.save();
    }
    var v = Store.get().settings.voice || {};
    if (v.autoSpeak) { var txt = '判定：' + (a.verdict || '') + '。' + (a.whereWrong || []).map(function (x) { return (x.where || '') + '：' + (x.what || '') + '。' + (x.why || ''); }).join('') + ' 正确步骤：' + (a.correctSteps || ''); InputTools.speak(txt, v); }
  }
  /* ============ 错题本 ============ */
  function renderWrong() {
    var wrongs = Store.wrong(), seen = {}, list = [];
    wrongs.forEach(function (a) { if (!seen[a.questionId]) { seen[a.questionId] = 1; list.push(a); } });
    var html = '<h1>错题本</h1>';
    if (!list.length) html += '<div class="card muted">还没有错题。去练习吧。</div>';
    else {
      html += '<div class="card"><div class="row"><span class="grow">共 ' + list.length + ' 道需要复习</span><button class="btn sm accent" onclick="App.startPractice(\'' + list.map(function (a) { return a.questionId; }).join(',') + '\')">全部重做</button></div></div>';
      html += '<div class="list">' + list.map(function (a) {
        var q = qById[a.questionId]; if (!q) return '';
        return '<div class="item"><div class="row">' + diffTag(q.diff) + '<span class="tag p">' + esc(nodeById[q.node].title) + '</span>' + (a.errorType ? '<span class="tag a">' + a.errorType + '</span>' : '') + '</div><div style="margin-top:6px">' + esc(q.stem) + '</div><div class="row" style="margin-top:8px"><button class="btn sm primary" onclick="App.startSingle(\'' + q.id + '\')">重做</button></div></div>';
      }).join('') + '</div>';
    }
    view.innerHTML = html;
  }

  /* ============ 统计 ============ */
  function renderStats() {
    var st = Store.stats();
    var rate = st.total ? Math.round((st.ok + st.half * 0.5) * 100 / st.total) : 0;
    var html = '<h1>学习统计</h1><div class="kpi">' +
      '<div class="card"><b>' + st.total + '</b><span class="small muted">累计作答</span></div>' +
      '<div class="card"><b>' + rate + '%</b><span class="small muted">加权正确率</span></div>' +
      '<div class="card"><b>' + st.wrongCount + '</b><span class="small muted">错题数</span></div>' +
      '<div class="card"><b>' + dueReview().length + '</b><span class="small muted">待复习</span></div></div>';
    html += '<div class="card"><h2>各知识节点掌握度</h2>';
    D.nodes.forEach(function (n) { html += '<div style="margin:10px 0"><div class="row"><span class="grow small">' + esc(n.title) + '</span></div>' + masteryBar(n.id) + '</div>'; });
    html += '</div>';
    html += '<div class="card"><h2>错因分布</h2>';
    var errs = ['知识', '方法', '计算', '审题', '心态'], max = 1;
    errs.forEach(function (e) { max = Math.max(max, st.byErr[e] || 0); });
    errs.forEach(function (e) { var v = st.byErr[e] || 0; html += '<div class="row small"><span style="width:44px">' + e + '</span><div class="bar grow"><i style="width:' + Math.round(v * 100 / max) + '%"></i></div><span>' + v + '</span></div>'; });
    html += '</div>';
    html += '<div class="card"><h2>难度分布</h2>';
    ['基础', '中档', '压轴'].forEach(function (d) { var v = st.byDiff[d] || 0; html += '<div class="row small"><span style="width:44px">' + d + '</span><div class="bar grow"><i style="width:' + Math.min(100, v * 100 / Math.max(1, st.total)) + '%"></i></div><span>' + v + '</span></div>'; });
    html += '</div>';
    view.innerHTML = html;
  }

  /* ============ 搜索 ============ */
  function renderSearch() {
    view.innerHTML = '<h1>搜索</h1><div class="card"><input type="text" id="q" placeholder="输入关键词，如：单调性、切线、恒成立" oninput="App.doSearch()"></div><div id="searchRes"></div>';
  }
  function doSearch() {
    var k = (document.getElementById('q').value || '').trim(); var box = document.getElementById('searchRes');
    if (!k) { box.innerHTML = ''; return; }
    var ns = D.nodes.filter(function (n) { return (n.title + n.brief + n.req).indexOf(k) >= 0; });
    var ms = D.methods.filter(function (m) { return (m.title + m.trigger + m.steps.join('') + m.formula + m.mistake).indexOf(k) >= 0; });
    var qs = D.questions.filter(function (q) { return (q.stem + q.answer + q.steps).indexOf(k) >= 0; });
    var html = '';
    if (ns.length) html += '<div class="card"><h2>知识点</h2><div class="list">' + ns.map(function (n) { return '<a class="item" href="#/node/' + n.id + '"><b>' + esc(n.title) + '</b><div class="small muted">' + esc(n.brief) + '</div></a>'; }).join('') + '</div></div>';
    if (ms.length) html += '<div class="card"><h2>方法卡</h2><div class="list">' + ms.map(function (m) { return '<a class="item" href="#/method/' + m.id + '"><b>' + esc(m.title) + '</b><div class="small muted">' + esc(m.trigger) + '</div></a>'; }).join('') + '</div></div>';
    if (qs.length) html += '<div class="card"><h2>题目</h2><div class="list">' + qs.map(function (q) { return '<div class="item"><div class="row">' + diffTag(q.diff) + '<span class="tag">' + typeName(q.type) + '</span></div><div style="margin-top:6px">' + esc(q.stem) + '</div><button class="btn sm" style="margin-top:8px" onclick="App.startSingle(\'' + q.id + '\')">练这题</button></div>'; }).join('') + '</div></div>';
    box.innerHTML = html || '<div class="card muted">没有找到相关内容。</div>';
  }

  /* ============ 设置 ============ */
  function renderSettings() {
    var s = Store.get().settings;
    view.innerHTML = '<h1>设置 <span class="tag" style="font-size:12px;vertical-align:middle">版本 v12</span></h1>' +
      '<div class="card"><h2>每日上限</h2><div class="grid2"><label>新卡<select id="sNew" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px">' + [4, 6, 10, 15, 20].map(function (v) { return '<option ' + (v === s.newPerDay ? 'selected' : '') + '>' + v + '</option>'; }).join('') + '</select></label><label>复习<select id="sRev" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px">' + [10, 20, 30, 50, 80].map(function (v) { return '<option ' + (v === s.reviewPerDay ? 'selected' : '') + '>' + v + '</option>'; }).join('') + '</select></label></div><button class="btn primary" style="margin-top:12px" onclick="App.saveSettings()">保存</button></div>' +
      '<div class="card"><h2>AI 讲解</h2><p class="small muted">需要 Cloudflare Worker 代理；密钥只放在 Worker 里，前端不保存 Key。</p>' +
      '<label class="small">代理地址<input type="text" id="aiUrl" value="' + esc((s.ai && s.ai.proxyUrl) || '') + '" placeholder="https://xxx.workers.dev"></label>' +
      '<div class="row" style="margin-top:10px"><label class="small"><input type="checkbox" id="aiEnabled" ' + ((s.ai && s.ai.enabled) ? 'checked' : '') + '> 启用 AI 讲解</label><button class="btn sm" onclick="App.testAI()">测试连接</button></div><p class="small muted" id="aiTest"></p></div>' +
      '<div class="card"><h2>语音</h2><p class="small muted">朗读用浏览器语音（免费）；语音输入需安卓 Chrome/Edge。</p>' +
      '<label class="small">语速 <input type="range" id="voRate" min="0.6" max="1.6" step="0.1" value="' + ((s.voice && s.voice.rate) || 1) + '"></label>' +
      '<label class="small" style="display:block;margin-top:8px">音色<select id="voVoice" style="width:100%;padding:9px;border:1px solid #e8eaee;border-radius:10px"></select></label>' +
      '<label class="small" style="display:block;margin-top:8px"><input type="checkbox" id="voAuto" ' + ((s.voice && s.voice.autoSpeak) ? 'checked' : '') + '> AI 讲解后自动朗读</label>' + '<div class="row" style="margin-top:10px"><button class="btn sm" onclick="App.testVoice()">🔊 试听</button><button class="btn sm" onclick="App.voiceDiag()">🩺 语音诊断</button></div><p class="small muted" id="voDiag"></p></div>' +
      '<div class="card"><h2>数据</h2><p class="small muted">进度只存在本机浏览器，不上传。换设备时可导出再导入。</p><div class="row"><button class="btn" onclick="App.exportData()">导出 JSON</button><button class="btn" onclick="document.getElementById(\'impFile\').click()">导入 JSON</button><button class="btn" onclick="App.resetData()">清空进度</button><button class="btn accent" onclick="App.forceUpdate()">强制更新</button><input type="file" id="impFile" accept="application/json" style="display:none" onchange="App.importData(this)"></div></div>' +
      '<div class="card"><h2>安装到手机</h2><p class="small muted">用手机浏览器打开线上网址后，选择“添加到主屏幕”，即可像 App 一样使用。</p></div>';
    fillVoices();
  }
  function fillVoices() { setTimeout(function () { var sel = document.getElementById('voVoice'); if (!sel) return; var vs = InputTools.voices(); var cur = (Store.get().settings.voice || {}).voiceUri || ''; sel.innerHTML = '<option value="">系统默认</option>' + vs.map(function (v) { return '<option value="' + v.voiceURI + '"' + (cur === v.voiceURI ? ' selected' : '') + '>' + v.name + '（' + v.lang + '）</option>'; }).join(''); }, 250); }
  function testVoice() { InputTools.speak('这是一段语音试听。如果听到了，说明朗读功能正常。', Store.get().settings.voice || {}); }
  function voiceDiag() {
    var d = InputTools.diag(), box = document.getElementById('voDiag');
    var txt = 'HTTPS：' + (d.https ? '是' : '否（语音输入会失败）') + '｜网页语音识别：' + (d.hasASR ? '支持' : '不支持') + '｜朗读：' + (d.hasTTS ? '支持' : '不支持') + '｜可用音色：' + d.voices + ' 个（中文 ' + d.zhVoices + ' 个）';
    if (!d.zhVoices && d.hasTTS) txt += '｜未检测到中文音色，朗读可能无声，请在系统设置安装中文语音包。';
    if (box) box.textContent = txt; else alert(txt);
  }
  function testAI() { var url = (document.getElementById('aiUrl') || {}).value || ''; var box = document.getElementById('aiTest'); if (box) box.textContent = '检测中…'; AI.health(url).then(function (r) { if (box) box.textContent = (r && r.ok) ? '连接成功 ✓' : '返回异常'; }).catch(function (e) { if (box) box.textContent = '连接失败：' + e.message; }); }
  function saveSettings() { var s = Store.get().settings; s.newPerDay = parseInt(document.getElementById('sNew').value, 10); s.reviewPerDay = parseInt(document.getElementById('sRev').value, 10); s.ai = s.ai || {}; s.ai.proxyUrl = (document.getElementById('aiUrl') || {}).value || ''; s.ai.enabled = !!(document.getElementById('aiEnabled') || {}).checked; s.voice = s.voice || {}; s.voice.rate = parseFloat((document.getElementById('voRate') || {}).value || '1'); s.voice.voiceUri = (document.getElementById('voVoice') || {}).value || ''; s.voice.autoSpeak = !!(document.getElementById('voAuto') || {}).checked; Store.save(); toast('已保存'); updateMini(); }
  function exportData() { var b = new Blob([Store.exportJSON()], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gaokao-math-progress.json'; a.click(); }
  function importData(input) { var f = input.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { Store.importJSON(r.result); toast('导入成功'); router(); } catch (e) { toast('导入失败：' + e.message); } }; r.readAsText(f); }
  function forceUpdate() {
    function done() { location.reload(); }
    if (!('serviceWorker' in navigator)) { done(); return; }
    var p1 = navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); });
    var p2 = (window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : Promise.resolve());
    Promise.all([p1, p2]).then(done, done);
  }
  function resetData() { if (confirm('确定清空所有进度吗？此操作不可恢复。')) { Store.reset(); toast('已清空'); router(); } }

  /* ============ 路由 ============ */
  function router() {
    var h = location.hash.replace(/^#\/?/, ''); var parts = h.split('/').filter(Boolean); var page = parts[0] || 'today';
    window.scrollTo(0, 0); setTab(page);
    if (page === 'node') renderNode(parts[1]);
    else if (page === 'method') renderMethod(parts[1]);
    else if (page === 'map') renderMap();
    else if (page === 'practice') { renderPractice(); if (parts[1] === 'start' && !session.list.length) { setTimeout(function () { beginPractice(false); }, 0); } }
    else if (page === 'wrong') renderWrong();
    else if (page === 'stats') renderStats();
    else if (page === 'search') renderSearch();
    else if (page === 'settings') renderSettings();
    else renderToday();
    updateMini();
  }

  window.App = {
    go: go,
    forceUpdate: forceUpdate,
    reviewCard: function (id, g) { Store.grade(id, g); toast(SRS.label(g) + '，复习计划已更新'); router(); },
    selOpt: selOpt, submit: submit, nextQ: nextQ, beginPractice: beginPractice, resetPractice: resetPractice,
    startPractice: startPractice, startSingle: startSingle, selfRate: selfRate, tagError: tagError, overrideOk: overrideOk,
    doSearch: doSearch, saveSettings: saveSettings, exportData: exportData, importData: importData, resetData: resetData,
    aiExplain: aiExplain, refreshWeather: refreshWeather, speakAnswer: speakAnswer, stopSpeak: stopSpeak, testAI: testAI, testVoice: testVoice, voiceDiag: voiceDiag
  };
  /* A+C：站内跳转用 replaceState（不堆历史），返回键不再一页页退 */
  function go(path) {
    if (location.hash === path) return;
    history.replaceState(null, '', path);
    router();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', function () {
    if (location.hash && location.hash !== '#/' && location.hash !== '#') {
      history.replaceState(null, '', '#/');
      router();
    }
  });
  window.addEventListener('hashchange', router);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) { navigator.serviceWorker.register('./sw.js').catch(function () {}); }
  router();
})();
