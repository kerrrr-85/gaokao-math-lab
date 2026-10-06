/* 云同步 · GitHub 私有仓版（无后端、无 SDK、无构建）
   存储：{repo}/sync/<code_hash>.json —— 内容是客户端加密后的密文，仓库里永远没有明文
   通道一 同步码：手动快照（生成=上传当前数据，恢复=拉取并合并）
   通道二 账号  ：GitHub OAuth Device Flow（需要 OAuth App 的 Client ID） */
(function (global) {
  var API = 'https://api.github.com';
  var DIR = 'sync';
  var SESSION_KEY = 'gml_sync_session';

  function store() { return global.Store; }
  function settings() { return store().get().settings || {}; }
  function conf() { return settings().sync || {}; }
  function normRepo(r) {
    return String(r || '').trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '').replace(/\/+$/, '');
  }
  function base() {
    var c = conf();
    if (!c.token || !c.repo) throw new Error('还没填 GitHub token 和仓库（owner/repo）');
    return { token: String(c.token).trim(), repo: normRepo(c.repo), branch: (c.branch || 'main').trim(), mode: c.mode || 'off', codeHash: c.codeHash || '' };
  }
  function saveCfg(patch) {
    var st = settings();
    st.sync = Object.assign({}, st.sync || {}, patch);
    st.updatedAt = Date.now();
    store().save();
  }
  function scope() {
    var d = store().get(), st = {};
    for (var k in (d.settings || {})) if (k !== 'sync') st[k] = d.settings[k];
    return { version: 1, createdAt: d.createdAt, reviews: d.reviews || {}, attempts: d.attempts || [], mastery: d.mastery || {}, settings: st };
  }
  /* 合并用的“本地侧”：与上传不同，这里必须保留 settings.sync，
     否则恢复之后本机会丢掉 token/仓库配置（e2e 发现的真 bug） */
  function localSide() {
    var s = scope();
    s.settings = store().get().settings || {};
    return s;
  }
  function session() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function setSession(s) { try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  /* UTF-8 安全的 base64（GitHub Contents API 要求） */
  function b64enc(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64dec(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function gh(path, opt) {
    opt = opt || {};
    var b = base(), tok = opt.token || b.token;
    return fetch(API + path, {
      method: opt.method || 'GET',
      headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: opt.body === undefined ? undefined : JSON.stringify(opt.body)
    }).then(function (r) {
      if (r.status === 404) return null;
      return r.text().then(function (txt) {
        var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
        if (r.ok) return j;
        var msg = (j && j.message) || ('HTTP ' + r.status);
        if (r.status === 401) throw new Error('token 无效或已过期，请重新生成一个');
        if (r.status === 403 && /rate limit/i.test(msg)) throw new Error('GitHub 接口调用太频繁，请过几分钟再试');
        if (r.status === 403) throw new Error('token 权限不足：需要该私有仓的 Contents 读写权限');
        if (r.status === 404) throw new Error('找不到仓库：检查 owner/repo 是否写对，token 是否包含该仓库');
        if (r.status === 409) throw new Error('云端文件刚被别的设备改动，请重试一次');
        throw new Error(msg);
      });
    }).catch(function (e) {
      if (e && e.name === 'TypeError') throw new Error('连不上 GitHub：检查网络');
      throw e;
    });
  }
  function filePath(hash) { return DIR + '/' + hash + '.json'; }

  function readFile(hash) {
    var b = base();
    return gh('/repos/' + b.repo + '/contents/' + filePath(hash) + '?ref=' + encodeURIComponent(b.branch))
      .then(function (j) { return j ? { json: JSON.parse(b64dec(j.content)), sha: j.sha } : null; });
  }
  function writeFile(hash, obj, sha, msg) {
    var b = base();
    var body = { message: msg || ('sync ' + hash.slice(0, 8)), content: b64enc(JSON.stringify(obj)), branch: b.branch };
    if (sha) body.sha = sha;
    return gh('/repos/' + b.repo + '/contents/' + filePath(hash), { method: 'PUT', body: body });
  }
  function deleteFile(hash) {
    return readFile(hash).then(function (cur) {
      if (!cur) return null;
      var b = base();
      return gh('/repos/' + b.repo + '/contents/' + filePath(hash), { method: 'DELETE', body: { message: 'drop ' + hash.slice(0, 8), sha: cur.sha, branch: b.branch } });
    });
  }

  /* ---------- 通道一：同步码 ---------- */
  function createCode() {
    if (!global.SyncCrypto) return Promise.reject(new Error('加密模块未加载'));
    var code = global.SyncCrypto.newCode();
    return global.SyncCrypto.encrypt(scope(), code).then(function (env) {
      return global.SyncCrypto.hashCode(code).then(function (h) {
        return readFile(h).then(function (cur) {
          return writeFile(h, env, cur && cur.sha, 'sync snapshot ' + h.slice(0, 8)).then(function () {
            saveCfg({ mode: 'code', codeHash: h, codeHint: code.slice(0, 4) + '…' + code.slice(-4), lastSyncAt: Date.now() });
            return code;
          });
        });
      });
    });
  }
  function restore(code) {
    var up = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (up.length !== 20) return Promise.reject(new Error('同步码是 20 位，请检查是否输全'));
    return global.SyncCrypto.hashCode(up).then(function (h) {
      return readFile(h).then(function (cur) {
        if (!cur) throw new Error('同步码不对，或云端还没有这份快照');
        return global.SyncCrypto.decrypt(cur.json, up).then(function (remote) {
          var before = (store().get().attempts || []).length;
          var merged = global.Merge.merge(localSide(), remote);
          store().applyMerged(merged);
          saveCfg({ mode: 'code', codeHash: h, codeHint: up.slice(0, 4) + '…' + up.slice(-4), lastSyncAt: Date.now() });
          return { added: Math.max(0, (merged.attempts || []).length - before), total: (merged.attempts || []).length };
        });
      });
    });
  }
  function rotate() {
    var oldHash = conf().codeHash;
    return createCode().then(function (code) {
      if (oldHash && oldHash !== conf().codeHash) return deleteFile(oldHash).then(function () { return code; }, function () { return code; });
      return code;
    });
  }
  function test() {
    var b = base();
    return gh('/repos/' + b.repo).then(function (j) {
      if (!j) throw new Error('找不到仓库：检查 owner/repo');
      return { repo: j.full_name, private: !!j.private, canPush: !!(j.permissions && j.permissions.push) };
    });
  }
  function status() {
    var c = conf(), s = session();
    return { configured: !!(c.token && c.repo), mode: c.mode || 'off', codeHint: c.codeHint || '', lastSyncAt: c.lastSyncAt || 0, repo: c.repo || '', user: (s && s.login) || null };
  }

  global.Sync = {
    status: status, normRepo: normRepo, test: test,
    createCode: createCode, restore: restore, rotate: rotate,
    scope: scope, localSide: localSide, session: session, setSession: setSession, saveCfg: saveCfg, gh: gh, readFile: readFile, writeFile: writeFile, deleteFile: deleteFile
  };
})(window);
