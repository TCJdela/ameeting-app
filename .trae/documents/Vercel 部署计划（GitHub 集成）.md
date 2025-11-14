## 前置检查
- 仓库已推送到 GitHub：`TCJdela/ameeting-app`
- 关键后端入口：`api/index.ts:7` 导出 Vercel Serverless 函数；Express 路由注册在 `api/app.ts:35-38`
- 前端构建目录：`dist/`（由 `pnpm build` 生成）
- 配置文件需保持简洁：`vercel.json` 不同时使用 `builds` 与 `functions`

## 项目导入
- 登录 https://vercel.com（使用 GitHub 账号）
- 点击 "New Project" → "Import Git Repository" → 选择 `TCJdela/ameeting-app`

## 构建设置
- Framework Preset：选择 "Vite" 或 "Other"
- Build Command：`pnpm build`（或 `npm run build`）
- Output Directory：`dist`
- Node 运行时：使用 Vercel 默认（建议 Node 18+），无需 CLI 本地运行

## 环境变量配置
- 在 Vercel 项目 Settings → Environment Variables 添加：
  - `VITE_SUPABASE_URL`（.env 第 4 行）
  - `VITE_SUPABASE_ANON_KEY`（.env 第 5 行）
  - `OPENAI_API_KEY`（.env 第 8 行）
  - `NODE_ENV=production`（部署环境）
- 不上传 `.env` 到仓库，使用 Vercel 环境变量注入

## API 路由与期望
- 入口函数：`api/index.ts:7` 将请求交由 Express `app`
- 可用接口：
  - 健康检查：`GET /api/health`（`api/app.ts:43-51`）
  - 启动转写：`POST /api/transcribe/start`（`api/transcribe.ts:24-97`）
  - 查询转写：`GET /api/transcribe/result/:id`（`api/transcribe.ts:197-230`）
  - 更新转写：`PUT /api/transcribe/update`（`api/transcribe.ts:233-268`）
  - 生成纪要：`POST /api/meeting/generate`（`api/meeting.ts:13-154`）

## 部署与验证
1. 点击 "Deploy"，等待构建与上线
2. 验证：
   - `GET {your-url}/api/health` 返回 `{ success: true, message: 'ok' }`
   - 前端首页加载正常（`/`）
   - 录音上传后，后端接收并在 Supabase 存储（`audio-files` bucket）
   - 触发转写（`Whisper`，`api/transcribe.ts:145-151`）并生成文本
   - 纪要生成（`GPT-3.5-turbo`，`api/meeting.ts:65-111`）

## 常见问题与处理
- 报错 “functions 与 builds 不能同时使用”：保留 `functions`（或移除两者），使用面板设置构建与输出目录
- 资产 404 或路由回退：确保 Output Directory 配置为 `dist`；Vite SPA 由 Vercel 自动处理
- CLI 版本或 Node 版本冲突：改用网页导入部署
- OpenAI 连接失败：检查 `OPENAI_API_KEY` 有效性与配额；重试生成接口

## 成功标准
- 接口健康检查通过
- 录音上传与转写成功，能在历史内查看
- 纪要生成返回结构化内容并可导出（PDF/Word/Markdown）

请确认以上计划，一旦确认我将按此步骤执行部署与验证。