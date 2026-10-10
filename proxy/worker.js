/* Cloudflare Worker：学习台的 AI 讲解代理（通义千问 DashScope）。
   密钥只保存在 Worker 的 secret 里，前端与 GitHub 仓库不会出现 Key。 */

const SYSTEM_PROMPT = `你是一位资深高中数学老师。请针对学生的作答给出精准、简短的点评，帮助学生明白"思路哪里错了"。
只输出 JSON，不要输出任何多余文字，格式严格如下：
{"verdict":"整体判定","whereWrong":[{"where":"第几步/哪个环节","what":"错在什么","why":"为什么会错"}],"correctSteps":"关键正确步骤","reminder":"一句提醒","similarPractice":"同类练习建议"}
要求：
1. 全部使用中文，公式可用简单 LaTeX 或普通文本；
2. whereWrong 给 1~3 条，聚焦真正的思维错误，不要泛泛而谈；
3. correctSteps 只给关键步骤，不要长篇大论；
4. 若学生答案正确，也要指出可以更简洁或更严谨的地方。`;

function corsHeaders(env, origin) {
  const allow = String(env.ALLOW_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
  let acao = '*';
  if (allow.length && allow[0] !== '*') acao = allow.indexOf(origin) >= 0 ? origin : allow[0];
  return {
    'Access-Control-Allow-Origin': acao,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function json(obj, headers, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({}, headers, { 'Content-Type': 'application/json; charset=utf-8' }) });
}
function buildPrompt(b) {
  return [
    '【题目】' + (b.question || ''),
    '【参考答案】' + (b.reference || ''),
    '【参考解析】' + (b.refSteps || ''),
    '【学生的答案】' + (b.userAnswer || '（未填写）'),
    '【学生的思路/过程】' + (b.userSteps || '（未填写）'),
    '【学生自评错因】' + (b.errorType || '（未标）'),
    '请判断他的思路在哪一步出错，并说明为什么错、正确应该怎么走。'
  ].join('\n');
}
function safeParse(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = t.indexOf('{'), z = t.lastIndexOf('}');
  if (a >= 0 && z > a) t = t.slice(a, z + 1);
  try { return JSON.parse(t); } catch (e) { return { verdict: '', whereWrong: [], correctSteps: t, reminder: '', similarPractice: '' }; }
}
const hits = new Map();
const biliCache = new Map();
function rateLimited(ip, limit) {
  const now = Date.now(), win = 3600000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > (limit || 60);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const h = corsHeaders(env, origin);
    if (request.method === 'OPTIONS') return new Response(null, { headers: h });
    if (url.pathname === '/health') return json({ ok: true, ts: Date.now() }, h);
    if (url.pathname === '/tts') return json({ error: 'tts not enabled in v1' }, h, 501);
    if (url.pathname === '/asr') {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, h, 405);
      if (!env.DASHSCOPE_API_KEY) return json({ error: '录音识别需要通义千问 Key（DASHSCOPE_API_KEY）；DeepSeek 目前没有语音识别' }, h, 500);
      let ab;
      try { ab = await request.json(); } catch (e) { return json({ error: 'bad json' }, h, 400); }
      if (!ab || !ab.audio) return json({ error: 'missing audio' }, h, 400);
      if (ab.audio.length > 8000000) return json({ error: 'audio too large (<= 8MB)' }, h, 413);
      const abase = env.DASHSCOPE_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      let aresp;
      try {
        aresp = await fetch(abase + '/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.DASHSCOPE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: env.ASR_MODEL || 'qwen3-asr-flash', messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: ab.audio, format: 'wav' } }] }] })
        });
      } catch (e) { return json({ error: 'upstream fetch failed: ' + e.message }, h, 502); }
      const at = await aresp.text();
      if (!aresp.ok) return json({ error: 'upstream ' + aresp.status, detail: at.slice(0, 400) }, h, 502);
      let aj = {}; try { aj = JSON.parse(at); } catch (e) {}
      const txt = aj && aj.choices && aj.choices[0] && aj.choices[0].message ? aj.choices[0].message.content : '';
      return json({ text: String(txt || '').trim() }, h);
    }
    if (url.pathname === '/bili/playurl') {
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, h, 405);
      const bvid = String(url.searchParams.get('bvid') || '');
      const p = Math.max(1, parseInt(url.searchParams.get('p') || '1', 10) || 1);
      if (!/^BV[0-9A-Za-z]+$/.test(bvid)) return json({ error: 'bad bvid' }, h, 400);
      const key = bvid + ':' + p;
      const hit = biliCache.get(key);
      if (hit && hit.exp > Date.now()) return json(hit.data, h);
      const bh = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bilibili.com/' };
      try {
        const vr = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + encodeURIComponent(bvid), { headers: bh });
        const vj = await vr.json();
        if (!vj || vj.code !== 0 || !vj.data || !Array.isArray(vj.data.pages)) return json({ error: 'view failed', detail: (vj && vj.message) || 'bad response' }, h, 502);
        const page = vj.data.pages[p - 1];
        if (!page) return json({ error: 'page not found' }, h, 404);
        const pr = await fetch('https://api.bilibili.com/x/player/playurl?bvid=' + encodeURIComponent(bvid) + '&cid=' + page.cid + '&qn=32&fnval=0&fourk=1&platform=html5&high_quality=1', { headers: bh });
        const pj = await pr.json();
        if (!pj || pj.code !== 0 || !pj.data || !pj.data.durl || !pj.data.durl[0]) return json({ error: 'playurl failed', detail: (pj && pj.message) || 'bad response' }, h, 502);
        const data = { ok: true, bvid: bvid, p: p, cid: page.cid, title: vj.data.title || '', part: page.part || '', duration: page.duration || vj.data.duration || 0, url: pj.data.durl[0].url, quality: pj.data.quality, format: pj.data.format, expireAt: Date.now() + 45 * 60 * 1000 };
        biliCache.set(key, { exp: Date.now() + 10 * 60 * 1000, data: data });
        return json(data, h);
      } catch (e) {
        return json({ error: 'bili upstream failed', detail: String(e && e.message || e) }, h, 502);
      }
    }
    if (url.pathname === '/analyze') {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, h, 405);
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (rateLimited(ip, parseInt(env.RATE_LIMIT_PER_HOUR || '60', 10))) return json({ error: 'too many requests' }, h, 429);
      let b;
      try { b = await request.json(); } catch (e) { return json({ error: 'bad json' }, h, 400); }
      if (!b || !b.question) return json({ error: 'missing question' }, h, 400);
      const img = b.imageDataUrl || '';
      if (img && img.length > 3000000) return json({ error: 'image too large' }, h, 413);
      const useVision = !!img;
      let base, key, model;
      if (useVision) {
        base = env.DASHSCOPE_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        key = env.DASHSCOPE_API_KEY;
        model = env.VISION_MODEL || 'qwen-vl-max';
        if (!key) return json({ error: '手写识别需要通义千问 Key（DASHSCOPE_API_KEY）；DeepSeek 目前没有视觉模型' }, h, 400);
      } else if ((env.TEXT_PROVIDER || 'deepseek').toLowerCase() === 'deepseek') {
        base = env.DEEPSEEK_BASE || 'https://api.deepseek.com/v1';
        key = env.DEEPSEEK_API_KEY;
        model = env.DEEPSEEK_MODEL || 'deepseek-chat';
        if (!key) return json({ error: 'server missing DEEPSEEK_API_KEY' }, h, 500);
      } else {
        base = env.DASHSCOPE_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        key = env.DASHSCOPE_API_KEY;
        model = env.TEXT_MODEL || 'qwen-plus';
        if (!key) return json({ error: 'server missing DASHSCOPE_API_KEY' }, h, 500);
      }
      const prompt = buildPrompt(b);
      const content = useVision
        ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: img } }]
        : prompt;
      let resp;
      try {
        resp = await fetch(base + '/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: content }], temperature: 0.2, max_tokens: parseInt(env.MAX_TOKENS || '1200', 10) })
        });
      } catch (e) { return json({ error: 'upstream fetch failed: ' + e.message }, h, 502); }
      if (!resp.ok) { const t = await resp.text(); return json({ error: 'upstream ' + resp.status, detail: t.slice(0, 400) }, h, 502); }
      const data = await resp.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
      const out = safeParse(text);
      out.source = 'ai'; out.model = model;
      return json(out, h);
    }
    return json({ error: 'not found' }, h, 404);
  }
};

