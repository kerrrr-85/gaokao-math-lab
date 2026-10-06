# 云同步 · Supabase 开通步骤（照着点就行）

> 全程免费。你只需要点 7 步，其中第 3 步是把我写好的 SQL 粘进去。

---

## 第 1 步 · 注册 / 登录

打开 **https://supabase.com** → 右上角 **Start your project** → 用 GitHub 或邮箱登录（免费）。

## 第 2 步 · 新建项目

1. 进入 Dashboard → **New project**
2. **Organization**：没有就点 **New organization** 建一个（名字随便，Type 选 Personal）
3. **Name**：`gaokao-math-lab`
4. **Database Password**：点右边的 **Generate a password** → **把密码复制存到别处**（以后基本用不到，但别丢）
5. **Region**：选 **Southeast Asia (Singapore)** ← 国内延迟最低；备选 **Northeast Asia (Tokyo)**
6. 点 **Create new project** → 等 1～2 分钟（状态从 `Setting up project` 变绿）

## 第 3 步 · 建表（把我写好的 SQL 跑一遍）

1. 左侧栏点 **SQL Editor**（图标像 `>_`）
2. 点 **New query**
3. 打开项目里的 `db/supabase-schema.sql`，**全选复制**，粘到右边编辑区
4. 点右下角 **Run**（或按 `Ctrl + Enter`）
5. 看到 **Success. No rows returned** 就成功了

> 这个脚本干了什么：建 2 张表（同步码 / 账号数据）、打开行级安全、只允许通过受控函数读写、限制单次上传 256KB。

## 第 4 步 · 拿 Project URL

左侧 **Project Settings**（齿轮图标）→ **Data API** → 复制 **Project URL**，长这样：

```
https://abcdefghijklmn.supabase.co
```

（旧版界面在 **Settings → API → Project URL**，是同一个东西）

## 第 5 步 · 拿 anon key ← 你问的就是这个

左侧 **Project Settings**（齿轮）→ **API Keys**，这一页通常有**两组**：

| 标签页 | 里面是什么 | 你要哪个 |
|---|---|---|
| **Publishable and secret API keys** | 新式：`sb_publishable_...` / `sb_secret_...` | 可作备用（用 publishable，**绝不用 secret**） |
| **Legacy API keys** | 旧式：**`anon` `public`** / `service_role` `secret` | ✅ **就要这个 `anon`** |

**要复制的就是 `anon` 那一行**，长得像：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.xxxxxxxxxxxxxxxx
```

（很长，`eyJ` 开头，中间有个 `.` 分成三段 —— 这是正常的）

**怎么确认没拿错**：把这段文本用 https://jwt.io 解码，里面的 `"role"` 必须是 **`anon`**。如果是 `service_role` 就错了。

**如果这一页找不到 Legacy 那一栏**：新项目默认可能收起了旧 key —— 那就用 **Publishable** 标签里的 `sb_publishable_...`，效果一样（前端只用得着这个级别）。

> ⚠️ **绝对不要**把 `service_role` 或 `sb_secret_...` 填进网页或发给我 —— 那是管理员密钥，泄漏等于数据库全开。
> `anon` / `sb_publishable_...` 是**设计上就公开**的，填进前端是正常做法（真正的防护靠第 3 步里的 RLS 策略）。

## 第 6 步 · 配置邮箱登录的回跳地址

左侧 **Authentication** → **URL Configuration**：

1. **Site URL** 填：
   ```
   https://kerrrr-85.github.io/gaokao-math-lab/
   ```
2. **Redirect URLs** → **Add URL** → 再填一遍同一个地址（**末尾的 `/` 不要少**）
3. 保存

> 如果以后想在本地起服务测试登录，再加一条 `http://localhost:8000/`。
> 注意：**`file://` 双击打开的方式无法用于邮箱登录**（收不到合法回跳地址）—— 那种情况下用「同步码」通道，或者用线上地址。

## 第 7 步 · 把两个值填进站内

打开 https://kerrrr-85.github.io/gaokao-math-lab/ → **设置 → 同步** Tab：

- **Project URL**：第 4 步复制的
- **anon key**：第 5 步复制的
- 点 **保存并启用** → 看到「已启用」就通了

然后就能：

| 想做什么 | 操作 |
|---|---|
| 换设备（免登录） | 点 **生成同步码** → 在另一台设备点 **用同步码恢复** |
| 旧码作废 | 点 **重新生成同步码**（旧码立刻失效） |
| 长期多设备 | 填邮箱 → **发送登录链接** → 邮件里点一下 → 以后自动同步 |
| 退出 | **退出登录** → 会问你「是否删除云端数据」 |

---

## 常见问题

**Q：anon key 会不会泄漏我的数据？**
不会。anon key 只代表「匿名访问者」这个身份，能读能写什么完全由第 3 步的 RLS 策略决定。你的账号数据只有拿着你的登录 token 才能读写。

**Q：同步码能恢复什么？**
复习卡（reviews）、作答记录（attempts）、掌握度（mastery）、设置（settings）。
**手写草稿纸不同步**（体积太大），天气缓存和 B站记录也不需要同步。

**Q：同步码丢了怎么办？**
用不回来 —— 它本身就是密钥（服务端只存密文，我们也解不开）。但你可以在**任何一台还在的设备上重新生成**，或者用本机的「导出 JSON」兜底。

**Q：会不会把我的数据覆盖掉？**
不会。恢复和同步都是**合并**：作答记录按 id 求并集（永不丢）、复习卡取更新的那张、掌握度取较大值。只有设置是按时间戳取新的。
