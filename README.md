<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gBnkBSLmNM_jzHQTky9ZLbpUjz--bvA3

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/huhk345/alphagen-ai)

- 使用上面的按钮一键将本仓库部署到 Cloudflare，Cloudflare 会自动识别为 Vite 前端项目并创建 Pages/Workers 项目。

**准备工作**

- 拥有一个 Cloudflare 账号，并启用 Workers/Pages。
- 在本地安装 Wrangler CLI（可选，本地预览或手动部署时需要）：`npm install -g wrangler`
- 在 Cloudflare 项目配置中添加环境变量（与本地 .env.local 对齐）：
  - 前端调用后端的地址：`VITE_API_URL`（默认本地为 `http://localhost:3001/api`）
  - 如果后端也部署到 Cloudflare Workers/其他环境，对应服务端需要配置：`GEMINI_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY` 等。

**Wrangler 命令（可选）**

- 使用 Wrangler 手动部署：`wrangler deploy`
- 本地调试 Worker：`wrangler dev`
- Worker 配额与限制参考：https://developers.cloudflare.com/workers/platform/limits/#worker-limits
