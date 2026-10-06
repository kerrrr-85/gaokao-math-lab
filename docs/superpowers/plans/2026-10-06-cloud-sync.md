# 云同步（Supabase）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给纯静态学习台加两条云同步通道——免登录「同步码」（零知识加密）与邮箱魔法链接账号登录——让多设备数据一致，同时保留本地导出/导入兜底。

**Architecture:** 全部走 Supabase（国内可达性优先）。第一步：客户端用 Web Crypto 从同步码派生密钥，加密 `{reviews,attempts,mastery,settings}` 后写入 `sync_codes` 表，读写只经 `SECURITY DEFINER` RPC，表本身对 anon 无策略（拒绝直读）。第二步：Supabase Auth 邮箱 OTP + **PKCE**（凭证走 `?code=` 查询参数，避开本项目 HashRouter 与 `#access_token` 的冲突），数据存 `user_data` 表，RLS 按 `auth.uid()` 隔离。冲突一律**合并**而非覆盖。

**Tech Stack:** 原生 ES5 风格 JS + `fetch` + Web Crypto (`crypto.subtle`) + Supabase REST/Auth HTTP API。**不引入 npm、不引入 @supabase/supabase-js SDK、不加构建步骤**（保持双击 `index.html` 可用）。

**Spec:** 本计划的 Spec 为 2026-10-06 对话中确认的口径：同步范围 `reviews / attempts / mastery / settings`；草稿纸不同步；保留导出/导入；退出登录时询问是否保留云端数据；旧同步码重生即作废。

## Global Constraints

- 零 npm 依赖、无构建步骤；双击 `dist/index.html`（即仓库根 `index.html`）必须仍可完整使用
- 云同步是**可选且懒加载**：不点「云同步」不加载 sync 模块；任何网络失败都必须只提示、不阻断、不改本地数据
- 同步范围**仅** `reviews / attempts / mastery / settings`；**永不**同步 `gml_draft_*`、`gml_weather`、`gml_last_bili`
- `Store.exportJSON()` / `Store.importJSON()` 行为**不得改变**（本地兜底）
- 同步码明文只在客户端出现：上传的只有 `code_hash`（sha256）与 AES-GCM 密文；任何日志不得打印同步码
- 一次同步的载荷上限 **256 KB**（超出给明确错误，不截断、不覆盖）
- 所有 UI 文案中文简体；错误提示必须说明「下一步怎么办」
- Supabase 的 Project URL 与 anon key 由用户在「设置 → 数据 → 云同步」里填写，存 `settings.sync`，**不硬编码**在仓库里
- 恢复/拉取一律**合并**（`Merge.merge`），禁止用远端整体覆盖本地
- 版本号：本次发布升到 **v65**（`index.html? v=`、`sw.js` CACHE、设置页版本号三处同步）

## Review Focus

以下 7 条是 Spec 没逐条写、但最容易被真实用户踩到的输入/条件，各自绑定到拥有该代码的任务：

1. **在 `file://` 双击打开时用同步** → Web Crypto 可能不可用 → 必须提示「请用线上网址打开」并保持其他功能正常（Task 2 / Task 5）
2. **同步码输错一位** → 必须报「码不对或已被替换」，绝不能半途写入导致本地数据损坏（Task 4 / Task 5）
3. **在新设备上恢复** → 必须与本地空数据合并后仍然可用；在有数据设备上恢复 → 本地已练记录不得被远端旧数据抹掉（Task 1 / Task 4）
4. **点邮件链接回跳** → 地址栏出现 `?code=`，HashRouter 不得跳到空白页，且能自动换到会话（Task 6）
5. **本地时间被改 / `updatedAt` 缺失**（老数据无 `settings.updatedAt`）→ 不得因此判定远端更新而覆盖（Task 1）
6. **token 过期或网络中途断** → 保留会话失败态并提供「重新登录」，本地数据不丢（Task 6 / Task 7）
7. **两台设备同时上传** → 必须走合并再回写，绝不静默覆盖（Task 1 / Task 7）

---

## File Structure

**Create**
- `js/merge.js` — 纯函数合并引擎（无 DOM、无网络，可被 Node 直接测）
- `js/sync-crypto.js` — 同步码生成、密钥派生、AES-GCM 加解密、code_hash（无 DOM 依赖）
- `js/sync.js` — 网络层与状态机：Supabase REST/Auth、同步码流程、账号流程、自动上传
- `db/supabase-schema.sql` — 建表 + RLS + RPC + 索引 + 限流（在 Supabase SQL Editor 执行一次）
- `tools/test-sync-merge.js` — `node` 直接跑的合并测试（自带 assert，无依赖）
- `tools/test-sync-crypto.js` — `node` 直接跑的加解密往返测试
- `docs/superpowers/plans/2026-10-06-cloud-sync.md` — 本计划

**Modify**
- `js/store.js` — `settings.sync` 默认值、`settings.updatedAt`、`Store.onChange()` 变更通知、`Store.applyMerged()`；导出/导入保持原样
- `js/app.js` — 设置「数据」Tab 增加「云同步」分组与全部点击处理
- `css/style.css` — 云同步分组 + 同步码弹层样式
- `sw.js` — CACHE `gml-v65`，ASSETS 增加三个新 js
- `index.html` — 版本号 v65
- `README.md` — Supabase 接入步骤、同步范围说明、常见问题

**Responsibility split**
- `merge.js` 只做纯数据合并；`sync-crypto.js` 只做密码学；`sync.js` 只做网络与状态；`app.js` 只做 UI 绑定。互不越界，便于单独测试。

---

### Task 1: 合并引擎 `js/merge.js`

**Files:**
- Create: `js/merge.js`
- Test: `tools/test-sync-merge.js`

**Interfaces:**
- Consumes: 无（纯函数）
- Produces:
  - `Merge.merge(local, remote) -> merged`（两者皆为 `{version,reviews,attempts,mastery,settings}` 形态，容忍缺字段）
  - `Merge.attemptKey(attempt) -> string`（`id`；无 id 时用 `questionId + '|' + createdAt`）
  - `Merge.cardTime(card) -> number`（`card.lastReview || card.due || 0`）

- [ ] **Step 1: 写失败测试** `tools/test-sync-merge.js`

```js
// 断言：并集不丢、去重、排序、上限、LWW 取新、缺字段容忍
const M = require('../js/merge.js');
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) { console.error('FAIL', msg, a, b); process.exit(1); } }
const l = { version: 1, attempts: [{ id: 'a1', createdAt: 100 }], reviews: { r1: { id: 'r1', lastReview: 100 } }, mastery: { n1: 40 }, settings: { theme: 'dark' } };
const r = { version: 1, attempts: [{ id: 'a2', createdAt: 200 }], reviews: { r1: { id: 'r1', lastReview: 300 } }, mastery: { n1: 70 }, settings: { theme: 'light' } };
const m = M.merge(l, r);
eq(m.attempts.map(x => x.id), ['a2', 'a1'], 'attempts 并集且按时间倒序');
eq(m.reviews.r1.lastReview, 300, 'reviews 取 lastReview 较新');
eq(m.mastery.n1, 70, 'mastery 取较大值');
// 老数据无 updatedAt 时：本地 settings 胜出（不得被无时间戳的远端覆盖）
eq(M.merge({ settings: { theme: 'dark' } }, { settings: { theme: 'light', updatedAt: 0 } }).settings.theme, 'dark', '无时间戳不覆盖');
console.log('merge tests passed');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node tools/test-sync-merge.js`
Expected: FAIL（`Cannot find module '../js/merge.js'`）

- [ ] **Step 3: 实现 `js/merge.js`**

要点：`attempts` 按 key 求并集 → 按 `createdAt` 倒序 → `slice(0, 2000)`；`reviews` 逐 key 取 `cardTime` 大者；`mastery` 逐 key 取 `Math.max`；`settings` 比较 `updatedAt`（任一缺失则**保留本地**）；`createdAt` 取两者较早值。

- [ ] **Step 4: 再跑测试确认通过**

Run: `node tools/test-sync-merge.js`
Expected: PASS 且输出 `merge tests passed`

- [ ] **Step 5: 提交**

```bash
git add js/merge.js tools/test-sync-merge.js
git commit -m "feat(sync): pure merge engine for attempts/reviews/mastery/settings"
```

---

### Task 2: 密码学信封 `js/sync-crypto.js`

**Files:**
- Create: `js/sync-crypto.js`
- Test: `tools/test-sync-crypto.js`

**Interfaces:**
- Consumes: `Merge`（不需要）、Web Crypto（Node 侧用 `require('crypto').webcrypto` 注入 `global.crypto`）
- Produces:
  - `SyncCrypto.newCode() -> string`（Crockford Base32，20 字符，去掉易混字符）
  - `SyncCrypto.hashCode(code) -> Promise<string>`（sha256 hex，用于 `code_hash`）
  - `SyncCrypto.encrypt(obj, code) -> Promise<{v:1, salt:string, iv:string, data:string}>`
  - `SyncCrypto.decrypt(env, code) -> Promise<obj>`（密钥不符时抛 `Error('BAD_CODE')`）
  - 派生：PBKDF2-SHA256，`iterations=150000`，`salt` 16 字节随机存于信封

- [ ] **Step 1: 写失败测试** `tools/test-sync-crypto.js`

```js
if (!global.crypto) global.crypto = require('crypto').webcrypto;
const C = require('../js/sync-crypto.js');
(async () => {
  const code = C.newCode();
  if (!/^[0-9A-HJ-NP-TV-Z]{20}$/.test(code)) { console.error('FAIL code format', code); process.exit(1); }
  const obj = { reviews: { a: 1 }, attempts: [{ id: 'x' }], mastery: { n: 3 }, settings: { theme: 'dark' } };
  const env = await C.encrypt(obj, code);
  const back = await C.decrypt(env, code);
  if (JSON.stringify(back) !== JSON.stringify(obj)) { console.error('FAIL roundtrip'); process.exit(1); }
  let ok = false;
  try { await C.decrypt(env, C.newCode()); } catch (e) { ok = (e.message === 'BAD_CODE'); }
  if (!ok) { console.error('FAIL wrong code must throw BAD_CODE'); process.exit(1); }
  const h1 = await C.hashCode(code), h2 = await C.hashCode(code);
  if (h1 !== h2 || h1.length !== 64) { console.error('FAIL hash'); process.exit(1); }
  console.log('crypto tests passed');
})();
```

- [ ] **Step 2: 跑测试确认失败** — Run: `node tools/test-sync-crypto.js`，Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `js/sync-crypto.js`**

要点：`crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', ...)` → `deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'}, {name:'AES-GCM',length:256})`；解密失败（`OperationError`）统一转成 `Error('BAD_CODE')`；base64 用 `btoa/atob` 包装。**不在此文件做任何网络请求。**

- [ ] **Step 4: 跑测试确认通过** — Run: `node tools/test-sync-crypto.js`，Expected: PASS

- [ ] **Step 5: 提交** — `git commit -m "feat(sync): zero-knowledge envelope (PBKDF2 + AES-GCM)"`

---

### Task 3: Supabase 结构与 RPC `db/supabase-schema.sql`

**Files:**
- Create: `db/supabase-schema.sql`

**Interfaces:**
- Produces（供 Task 4/6 调用）：
  - RPC `sync_save(p_hash text, p_payload text, p_iv text, p_size int) -> void`
  - RPC `sync_load(p_hash text) -> table(payload text, iv text, updated_at timestamptz)`
  - RPC `sync_drop(p_hash text) -> void`
  - 表 `public.user_data(user_id uuid pk, payload jsonb, updated_at timestamptz, device text)`

- [ ] **Step 1: 写 SQL 文件**

包含：两张表；`enable row level security`；`sync_codes` **不建任何 anon 策略**（默认拒绝直读直写，只能走 RPC）；三个 `security definer` 函数内做 `p_size <= 262144` 校验与「同一 hash 5 秒内只能写一次」的最小限流；`user_data` 建 `select/insert/update` 三条策略，条件均为 `auth.uid() = user_id`；`grant execute on function ... to anon, authenticated`；`revoke all on public.sync_codes from anon, authenticated`。

- [ ] **Step 2: 在 Supabase 执行（用户操作，逐步照做）**

1. supabase.com → New project（区域选 **Singapore** 或 **Tokyo**，国内延迟较低）→ 记下数据库密码
2. 左侧 **SQL Editor** → 粘贴 `db/supabase-schema.sql` 全部内容 → Run
3. 左侧 **Settings → API** → 复制 `Project URL` 与 `anon public` key（**不是** service_role）
4. 左侧 **Authentication → URL Configuration** → `Site URL` 填 `https://kerrrr-85.github.io/gaokao-math-lab/`；`Redirect URLs` 增加同一地址（末尾带斜杠）

- [ ] **Step 3: 验证 RPC 真的可用（PowerShell 一次性检查）**

```powershell
$u='<Project URL>'; $k='<anon key>'
Invoke-RestMethod -Method Post -Uri "$u/rest/v1/rpc/sync_load" -Headers @{apikey=$k;Authorization="Bearer $k";'Content-Type'='application/json'} -Body '{"p_hash":"deadbeef"}'
```
Expected: 返回空数组（不报 404/403）。若报 `function does not exist` → SQL 未执行成功。

- [ ] **Step 4: 验证拒绝直读**

```powershell
Invoke-RestMethod -Uri "$u/rest/v1/sync_codes?select=*" -Headers @{apikey=$k;Authorization="Bearer $k"}
```
Expected: 返回 `[]`（RLS 拒绝，不是数据泄漏）

- [ ] **Step 5: 提交** — `git add db/supabase-schema.sql && git commit -m "feat(sync): supabase schema with RPC-gated sync_codes"`

---

### Task 4: 浏览器同步网络层 `js/sync.js`（同步码通道）

**Files:**
- Create: `js/sync.js`
- Modify: `js/store.js`（`settings.sync` 默认值 + `settings.updatedAt` + `Store.onChange`）

**Interfaces:**
- Consumes: `Merge.merge`、`SyncCrypto.*`、`Store.get()/save()`
- Produces:
  - `Sync.configure({url, key})`（读 `settings.sync`，缺省则空）
  - `Sync.status() -> {mode:'off'|'code'|'account', codeHint:string|null, lastSyncAt:number|null, user:string|null}`
  - `Sync.createCode() -> Promise<string>`（生成并上传，返回给 UI 展示一次）
  - `Sync.restore(code) -> Promise<{merged:boolean, added:number}>`
  - `Sync.rotate() -> Promise<string>`（新码 + 覆盖写入 + 删除旧 hash）
  - `Sync.push() -> Promise<void>` / `Sync.pull() -> Promise<object>`

- [ ] **Step 1: 先扩展 `js/store.js`**

`defaults().settings.sync = { url:'', key:'', mode:'off', codeHash:'', codeHint:'', lastSyncAt:0, auto:true }`；`saveSettings` 时写 `settings.updatedAt = Date.now()`；新增 `Store.onChange(fn)`，在 `save()` 末尾调用所有监听者（用于自动上传防抖）。**不得改动 `exportJSON/importJSON/reset` 的语义。**

- [ ] **Step 2: 实现 `js/sync.js` 的同步码通道**

`createCode`：`newCode()` → `encrypt(scope, code)` → `hashCode(code)` → `POST {url}/rest/v1/rpc/sync_save`，body `{p_hash, p_payload: env.data, p_iv: env.iv, p_size}`；成功后写 `settings.sync = {mode:'code', codeHash, codeHint: code.slice(0,4)+'…'+code.slice(-4), lastSyncAt:Date.now()}`。
`restore`：`sync_load(p_hash=hashCode(code))` → 空则抛 `Error('CODE_NOT_FOUND')` → `decrypt` → `Merge.merge(local, remote)` → `Store.applyMerged(merged)`（新增：合并后写回并 `save()`）→ 返回新增条数。
`rotate`：生成新码 → 上传新 hash → 成功后 `sync_drop(oldHash)` → 更新 settings。
**所有失败路径**：抛出带中文 message 的 Error，且**不修改任何本地数据**。

- [ ] **Step 3: 手工验证（两浏览器）**

1. 设置 → 数据 → 云同步：填 URL/key → 生成同步码 → 记下码
2. 开一个**无痕窗口**（或另一台设备）打开线上站 → 输入同步码 → 点恢复
3. Expected：无痕窗口出现相同的复习卡数量/作答数/掌握度；本机数据“只多不少”
4. 故意把码改最后一位再恢复 → Expected：提示「同步码不对或已被替换」，本地数据无变化

- [ ] **Step 4: 验证旧码作废**

点「重新生成同步码」→ 用**旧码**在新无痕窗口恢复 → Expected：`CODE_NOT_FOUND` 提示。

- [ ] **Step 5: 提交** — `git commit -m "feat(sync): sync-code channel over supabase rpc"`

---

### Task 5: 设置页「云同步」UI

**Files:**
- Modify: `js/app.js`（设置 → 数据 Tab 增加分组）、`css/style.css`

**Interfaces:**
- Consumes: `Sync.status/createCode/restore/rotate/configure`
- Produces: DOM 钩子 `#syncUrl #syncKey #syncCodeBox #syncCodeInput #syncMsg` 与 `App.syncSave() / App.syncCreate() / App.syncRestore() / App.syncRotate() / App.syncCopy()`

- [ ] **Step 1: 在「数据」Tab 顶部插入「云同步」分组**

行内容：`项目地址`（`#syncUrl`）、`anon key`（`#syncKey`）、`保存并启用`、`生成同步码`、`用同步码恢复`、`重新生成（旧码作废）`、状态行（`最后同步 …` / `未启用`），以及一个**同步码弹层**（大字号、分组显示、一键复制、明确写「只显示这一次」）。
说明文案必须写清：**只同步复习卡/作答记录/掌握度/设置；手写草稿不同步**。

- [ ] **Step 2: 样式**

复用既有 `.set-group/.set-row/.set-note` 体系；弹层用 `.modal/.modalbox`（已存在），同步码用等宽字体 + `letter-spacing`。

- [ ] **Step 3: 手工验证 + 截图**

手机宽度（约 390px）与桌面各截一张，确认无溢出、按钮可点、弹层可关闭。

- [ ] **Step 4: 提交** — `git commit -m "feat(sync): settings UI for sync code"`

---

### Task 6: 账号通道（魔法链接 + PKCE）

**Files:**
- Modify: `js/sync.js`（新增账号流程）、`js/app.js`（登录/退出 UI）

**Interfaces:**
- Produces:
  - `Sync.login(email) -> Promise<void>`（存 `code_verifier`，跳转 Supabase 授权页，`redirect_to` = 当前站根地址 + `?sync=1`）
  - `Sync.handleRedirect() -> Promise<boolean>`（识别 `?code=`，用 verifier 换 token，清理地址栏，随后 `pull+merge+push`）
  - `Sync.logout(keepCloud:boolean) -> Promise<void>`
  - `Sync.autoStart()`（登录态下：启动 5s 防抖自动上传 + `visibilitychange` 拉取）

- [ ] **Step 1: 实现 PKCE 登录**

`POST {url}/auth/v1/otp` body `{email, create_user:true, gotrue_meta_security:{}, code_challenge, code_challenge_method:'S256'}`；跳转链接形如 `{url}/auth/v1/verify?type=magiclink&token=...&redirect_to=...`。回跳拿到 `?code=` → `POST {url}/auth/v1/token?grant_type=pkce` body `{auth_code, code_verifier}` → 存 `{access_token, refresh_token, expires_at}` 到 `localStorage['gml_sync_session']`。

- [ ] **Step 2: 实现自动同步与冲突合并**

`autoStart()`：`Store.onChange` → 5s 防抖 → `pull` → `Merge.merge` → `PATCH /rest/v1/user_data?user_id=eq.<uid>`（带 `Prefer: resolution=merge-duplicates`）；`visibilitychange→visible` 时先 `pull+merge`。`updatedAt` 用服务端 `now()`。

- [ ] **Step 3: 登录/退出 UI**

设置页：邮箱输入 + `发送登录链接`；已登录时显示 `已登录：<email>` + `立即同步` + `退出登录`。`退出登录` 弹确认：「是否同时删除云端数据？」→ 保留 / 删除 / 取消。

- [ ] **Step 4: 手工验证（关键：回跳不能跳空白页）**

1. 桌面打开线上站 → 输入邮箱 → 收信点链接 → Expected：回到站点，**仍停留在设置页**，显示已登录
2. 地址栏不得残留 `?code=`；控制台无未捕获异常
3. 换无痕窗口登录同一邮箱 → Expected：数据自动出现且经过合并（数字 ≥ 原来）
4. 退出登录选「保留云端数据」→ 重新登录 → 数据仍在；选「删除」→ 云端行被删除，本地数据保留

- [ ] **Step 5: 提交** — `git commit -m "feat(sync): magic-link account channel with PKCE and merge"`

---

### Task 7: 安全与容错收口

**Files:**
- Modify: `js/sync.js`、`db/supabase-schema.sql`、`README.md`

- [ ] **Step 1: 客户端护栏**

载荷 > 256KB → 抛「数据太大（含草稿），请先导出备份并用同步码备份主数据」；网络失败统一转「网络不可用，稍后重试（本地数据未变）」；`Sync` 模块首次使用时才 `import()`/注入 `<script>`（懒加载）。

- [ ] **Step 2: 服务端限流复核**

确认 `sync_save` 内 5 秒最小写入间隔与 `p_size <= 262144` 生效；对同一 hash 连续写两次 → 第二次报错。

- [ ] **Step 3: 回归测试（必须全过）**

- `node tools/validate-content.js`（内容未破坏）
- `node tools/test-sync-merge.js`、`node tools/test-sync-crypto.js`
- `node --check js/sync.js js/merge.js js/sync-crypto.js js/store.js js/app.js`
- 断网（DevTools Offline）→ 打开站点、练一道题、导出 JSON：全部正常
- `file://` 双击打开 → 云同步区域显示「请用线上网址打开」，其余功能正常（Review Focus #1）

- [ ] **Step 4: README 记录**（Supabase 步骤、同步范围、常见问题、`file://` 限制）

- [ ] **Step 5: 提交** — `git commit -m "chore(sync): limits, offline fallbacks and docs"`

---

### Task 8: 发版

**Files:** `index.html`、`sw.js`、`js/app.js`、`README.md`

- [ ] **Step 1: 版本升到 v65**（三处同步）；`sw.js` CACHE → `gml-v65`，ASSETS 增加 `./js/merge.js ./js/sync-crypto.js ./js/sync.js`
- [ ] **Step 2: 全量命令门槛** — `node --check` 全部 js + 三个测试脚本，全绿
- [ ] **Step 3: 本地截图验证**（桌面 + 手机 390px：数据 Tab、同步码弹层、登录态）
- [ ] **Step 4: 推送 GitHub（API 方式）并等待 Pages 部署成功**
- [ ] **Step 5: 线上验证** — 手机打开 → 生成同步码 → 另一浏览器恢复成功

---

## 实施顺序与依赖

- Task 1、2 可并行（纯函数，互不依赖）
- Task 3 需要**你先注册 Supabase 并把 URL/key 给我或自己填**（我不需要、也不应看到 service_role key）
- Task 4 依赖 1+2+3；Task 5 依赖 4；Task 6 依赖 5；Task 7、8 收口
- 每个 Task 结束都能独立验证，且**不破坏现有功能**（导出/导入、离线、双击可用）

## 已确认的决定（2026-10-06）

1. **云同步 UI：新增第 5 个 Tab「同步」**（外观 / 语音 / AI / 数据 / 同步）
2. **账号通道不加密**：用 RLS 按 `auth.uid()` 隔离，服务端可见该账号下的数据；只有「同步码」通道是零知识加密
3. **同步码长度 20 位** Crockford Base32（约 100 bit，不可暴力枚举）

## 附：开通步骤

逐步点击说明见 `docs/superpowers/cloud-sync-setup.md`（含 anon key 的确切位置与辨认方法）。
