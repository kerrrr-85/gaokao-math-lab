/* AI 讲解：调用 Cloudflare Worker 代理（通义千问），失败时回退到离线规则版分析。 */
(function (global) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pretty(s) {
    if (!s) return '';
    return String(s)
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\neq/g, '≠')
      .replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\pi/g, 'π')
      .replace(/\\ln/g, 'ln').replace(/\\log/g, 'log')
      .replace(/\^\{2\}/g, '²').replace(/\^\{3\}/g, '³').replace(/\^2/g, '²').replace(/\^3/g, '³')
      .replace(/\\/g, '');
  }
  function rule(q, userAnswer, userSteps) {
    var issues = [], stem = q.stem || '', ref = q.answer || '', ua = (userAnswer || '').trim(), us = (userSteps || '').trim(), all = ua + ' ' + us;
    if (/定义域|x≠|分母|根号|log|ln/.test(stem) && !/(定义域|x>|x≥|x≤|x≠|x∈)/.test(all)) issues.push({ where: '第一步', what: '没有先确定定义域', why: '含分式/根号/对数的函数必须先定定义域，否则后面的单调性、最值都会失效。' });
    if (/参数|求a|a的取值|恒成立/.test(stem) && !/(分类|讨论|a=)/.test(all)) issues.push({ where: '分类讨论', what: '没有对参数分类', why: '参数会改变导数的符号和最值位置，必须按临界值分类讨论。' });
    if (/(零点|实根|几个根)/.test(stem) && !/(单调|极值|图象|数形|交点)/.test(all)) issues.push({ where: '方法选择', what: '没有借助单调性/图象判断根的个数', why: '零点个数问题通常先研究单调性与极值，再数交点。' });
    if (!us && !/(选择|判断)/.test(q.stem || '')) issues.push({ where: '过程', what: '没有写下解题步骤', why: '只给结果很难定位问题；写下关键步骤后，AI 才能指出具体是哪一步出错。' });
    if (ua && ref && ua.replace(/\s/g, '') !== ref.replace(/\s/g, '')) issues.push({ where: '最终答案', what: '答案与参考答案不一致', why: '优先检查符号、代入与计算；若方法无误，多半是计算环节出错。' });
    if (!issues.length) issues.push({ where: '整体', what: '思路方向基本正确', why: '建议再核对每一步的等价性与取等条件。' });
    return { verdict: (ua && ref && ua.replace(/\s/g, '') === ref.replace(/\s/g, '')) ? '基本正确' : '需要检查', whereWrong: issues, correctSteps: q.steps || '', reminder: '注意每一步的等价性与取等条件。', similarPractice: '建议再做一道同知识点的中档题巩固。', source: 'rule' };
  }
  function analyze(payload, proxyUrl) {
    var url = (proxyUrl || '').replace(/\/+$/, '') + '/analyze';
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function health(proxyUrl) {
    var url = (proxyUrl || '').replace(/\/+$/, '') + '/health';
    return fetch(url).then(function (r) { return r.json(); });
  }
  function render(a) {
    if (!a) return '';
    var h = '<div class="aiBox">';
    h += '<p><b>判定：</b>' + esc(a.verdict || '') + '</p>';
    if (a.whereWrong && a.whereWrong.length) h += '<p><b>错在哪：</b></p><ul class="steps">' + a.whereWrong.map(function (x) { return '<li><b>' + esc(x.where || '') + '</b>：' + esc(x.what || '') + '<br><span class="muted small">' + esc(x.why || '') + '</span></li>'; }).join('') + '</ul>';
    if (a.correctSteps) h += '<p><b>正确步骤：</b>' + esc(pretty(a.correctSteps)) + '</p>';
    if (a.reminder) h += '<p><b>提醒：</b>' + esc(a.reminder) + '</p>';
    if (a.similarPractice) h += '<p><b>同类练习：</b>' + esc(a.similarPractice) + '</p>';
    h += '<p class="small muted">' + (a.source === 'rule' ? '（离线规则版分析）' : '（AI 分析）') + '</p></div>';
    return h;
  }
  global.AI = { rule: rule, analyze: analyze, health: health, render: render, pretty: pretty };
})(window);
