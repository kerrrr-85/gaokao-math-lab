/* 轻量间隔重复（SM-2 简化版），无需任何依赖 */
(function (global) {
  var DAY = 86400000;
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  var SRS = {
    newCard: function (refType, refId) {
      return { id: refType + ':' + refId, refType: refType, refId: refId, due: startOfToday(), interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0, state: 'new' };
    },
    grade: function (card, g) {
      var c = Object.assign({}, card);
      var now = Date.now();
      if (g === 0) {
        c.lapses += 1; c.reps = 0; c.interval = 0;
        c.ease = Math.max(1.3, c.ease - 0.2);
        c.state = 'relearn'; c.due = startOfToday() + DAY;
      } else {
        c.reps += 1;
        if (g === 1) { c.ease = Math.max(1.3, c.ease - 0.15); c.interval = c.interval ? Math.max(1, Math.round(c.interval * 1.4)) : 1; }
        else { c.ease = Math.min(3.0, c.ease + 0.05); c.interval = c.interval ? Math.round(c.interval * c.ease) : 1; }
        c.state = 'review'; c.due = startOfToday() + c.interval * DAY;
      }
      c.last = now;
      return c;
    },
    isDue: function (card) { return card.due <= startOfToday(); },
    label: function (g) { return g === 2 ? '会了' : g === 1 ? '半会' : '不会'; }
  };
  global.SRS = SRS;
})(window);
