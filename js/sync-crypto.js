/* 云同步 · 零知识信封（Node 与浏览器通用）
   同步码 = 密钥：PBKDF2-SHA256(150k) 派生 AES-GCM-256；服务端只见 sha256(code) 与密文 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SyncCrypto = api;
})(typeof window !== 'undefined' ? window : this, function () {
  var ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   /* Crockford：去掉 I L O U */
  var ITER = 150000;
  var PEPPER = 'gml-sync-v1|';

  function wc() {
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle) return crypto;
    if (typeof require === 'function') { try { return require('crypto').webcrypto; } catch (e) {} }
    return null;
  }
  function rnd(n) { var a = new Uint8Array(n); wc().getRandomValues(a); return a; }
  function b64(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function ub64(str) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(str, 'base64'));
    var bin = atob(str), o = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    return o;
  }
  function enc(str) { return new TextEncoder().encode(str); }
  function dec(buf) { return new TextDecoder().decode(buf); }

  function newCode() { var r = rnd(20), s = ''; for (var i = 0; i < 20; i++) s += ALPHA[r[i] % 32]; return s; }

  function hashCode(code) {
    var c = wc(); if (!c) return Promise.reject(new Error('NO_CRYPTO'));
    return c.subtle.digest('SHA-256', enc(PEPPER + String(code).toUpperCase())).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function deriveKey(code, salt) {
    var c = wc(); if (!c) return Promise.reject(new Error('NO_CRYPTO'));
    return c.subtle.importKey('raw', enc(PEPPER + String(code).toUpperCase()), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return c.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' }, base,
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encrypt(obj, code) {
    var c = wc(); if (!c) return Promise.reject(new Error('NO_CRYPTO'));
    var salt = rnd(16), iv = rnd(12);
    return deriveKey(code, salt).then(function (k) {
      return c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, enc(JSON.stringify(obj)));
    }).then(function (buf) {
      return { v: 1, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(buf)) };
    });
  }
  function decrypt(env, code) {
    var c = wc(); if (!c) return Promise.reject(new Error('NO_CRYPTO'));
    if (!env || !env.salt || !env.iv || !env.data) return Promise.reject(new Error('BAD_CODE'));
    return deriveKey(code, ub64(env.salt)).then(function (k) {
      return c.subtle.decrypt({ name: 'AES-GCM', iv: ub64(env.iv) }, k, ub64(env.data));
    }).then(function (buf) {
      return JSON.parse(dec(buf));
    }).catch(function () { throw new Error('BAD_CODE'); });
  }
  return { newCode: newCode, hashCode: hashCode, encrypt: encrypt, decrypt: decrypt, iterations: ITER };
});
