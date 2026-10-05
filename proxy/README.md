# AI 代理部署说明（Cloudflare Worker）

学习台的「AI 讲解」需要一个代理来保管 API Key——**Key 绝不能写进网页或 GitHub 仓库**。

## 一、准备
1. 注册 Cloudflare 账号（免费）：https://dash.cloudflare.com/sign-up
2. 注册通义千问 DashScope，创建 API Key：https://bailian.console.aliyun.com/
3. 本机已有 Node.js，安装 wrangler：
   ```
   npm i -g wrangler
   ```

## 二、部署
在本目录（`proxy/`）执行：
```
wrangler login
wrangler secret put DASHSCOPE_API_KEY      # 粘贴你的 Key，不会显示在终端
wrangler deploy
```
部署成功会输出一个地址，例如：
```
https://gaokao-math-ai.你的子域.workers.dev
```

## 三、接入学习台
1. 打开学习台 →「设置」→「AI 讲解」；
2. 把上面的地址填进「代理地址」；
3. 勾选「启用 AI 讲解」→ 点「测试连接」，显示“连接成功 ✓”即可；
4. 答题后点「🤖 AI 讲解」，就会指出你思路错在哪。

## 四、常见问题
- **在国内打不开 workers.dev**：给 Worker 绑定一个自己的域名（Cloudflare 后台 → Workers → 自定义域）。
- **提示 upstream 401**：Key 不对或没设置，重新执行 `wrangler secret put DASHSCOPE_API_KEY`。
- **提示 too many requests**：触发了频率限制，修改 `wrangler.toml` 里的 `RATE_LIMIT_PER_HOUR` 后重新 `wrangler deploy`。
- **模型名**：默认 `qwen-plus`（文字）与 `qwen-vl-max`（读手写图），可在 `wrangler.toml` 里改。

## 五、费用
按 token 计费，单次讲题消耗很小；手动点「AI 讲解」才会调用，不会自动产生费用。

## 六、语音输入（录音识别）

- 学习台点「🎙️ 录音识别」→ 录 6 秒 → 浏览器转成 WAV → 发到本 Worker 的 `/asr` → 调通义 `qwen3-asr-flash` → 返回文字并自动填入输入框。
- 需要同一个 `DASHSCOPE_API_KEY`（与 AI 讲解共用）；模型可在 `wrangler.toml` 的 `ASR_MODEL` 修改。
- 若返回 `upstream 400/404`，说明该账号未开通该语音识别模型，可在阿里云百炼控制台开通，或把 `ASR_MODEL` 换成其他可用的 ASR 模型。
- 注意：网页内的「🎤 语音」用的是浏览器自带识别（国内 Chrome 常不可用）；「🎙️ 录音识别」走本代理，国内可用。
