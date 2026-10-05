/* 本地进度存储：全部数据只存浏览器 localStorage */
(function (global) {
  var KEY = 'gml_progress_v1';
  function defaults() {
    return { version: 1, reviews: {}, attempts: [], mastery: {}, settings: { newPerDay: 6, reviewPerDay: 20, ai: { enabled: false, proxyUrl: '', textModel: 'qwen-plus', visionModel: 'qwen-vl-max' }, voice: { engine: 'browser', rate: 1, voiceUri: '', autoSpeak: false } }, createdAt: Date.now() };
  }
  var state = load();
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.version === 1) { s.reviews = s.reviews || {}; s.attempts = s.attempts || []; s.mastery = s.mastery || {}; s.settings = s.settings || {}; if (!s.settings.ai) s.settings.ai = { enabled: false, proxyUrl: '', textModel: 'qwen-plus', visionModel: 'qwen-vl-max' }; if (!s.settings.voice) s.settings.voice = { engine: 'browser', rate: 1, voiceUri: '', autoSpeak: false }; return s; } } catch (e) {} return defaults(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var Store = {
    get: function () { return state; },
    save: save,
    reset: function () { state = defaults(); save(); },
    exportJSON: function () { return JSON.stringify(state, null, 2); },
    importJSON: function (json) { var s = JSON.parse(json); if (!s || !s.reviews) throw new Error('数据格式不正确'); state = s; state.attempts = state.attempts || []; state.mastery = state.mastery || {}; save(); },
    ensureCards: function (cards) { var changed = false; for (var i = 0; i < cards.length; i++) { if (!state.reviews[cards[i].id]) { state.reviews[cards[i].id] = cards[i]; changed = true; } } if (changed) save(); },
    allCards: function () { return Object.keys(state.reviews).map(function (k) { return state.reviews[k]; }); },
    dueCards: function () { return this.allCards().filter(function (c) { return SRS.isDue(c); }); },
    grade: function (cardId, g) { var c = state.reviews[cardId]; if (!c) return; state.reviews[cardId] = SRS.grade(c, g); save(); },
    addAttempt: function (a) {
      state.attempts.unshift(a);
      if (state.attempts.length > 2000) state.attempts.length = 2000;
      var nodes = a.nodeIds || [];
      for (var i = 0; i < nodes.length; i++) {
        var cur = state.mastery[nodes[i]] || 0;
        var delta = a.result === 'ok' ? 8 : a.result === 'half' ? 2 : -10;
        state.mastery[nodes[i]] = Math.max(0, Math.min(100, cur + delta));
      }
      save();
    },
    wrong: function () { return state.attempts.filter(function (a) { return a.result !== 'ok'; }); },
    masteryOf: function (nodeId) { return state.mastery[nodeId] || 0; },
    stats: function () {
      var a = state.attempts, byErr = {}, byDiff = {}, i, x;
      for (i = 0; i < a.length; i++) {
        x = a[i];
        if (x.errorType) byErr[x.errorType] = (byErr[x.errorType] || 0) + 1;
        if (x.difficulty) byDiff[x.difficulty] = (byDiff[x.difficulty] || 0) + 1;
      }
      return {
        total: a.length,
        ok: a.filter(function (y) { return y.result === 'ok'; }).length,
        half: a.filter(function (y) { return y.result === 'half'; }).length,
        no: a.filter(function (y) { return y.result === 'no'; }).length,
        byErr: byErr, byDiff: byDiff,
        wrongCount: a.filter(function (y) { return y.result !== 'ok'; }).length
      };
    }
  };
  global.Store = Store;
})(window);
