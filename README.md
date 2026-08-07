# AI Developer Toolbox

对标 JSON.cn 的 AI 开发者工具平台。MVP 阶段提供 JSON 格式化、JSON→TypeScript、JSON→Java、JWT 解析、AI JSON 解释五个工具。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 · TypeScript · Tailwind CSS（静态导出，部署 Cloudflare Pages） |
| 后端 | Cloudflare Workers · Hono · TypeScript |
| 共享 | workspace 类型包（web / worker 共用） |
| AI | DeepSeek API（后续阶段接入） |

## 仓库结构

```
.
├── web/        # Next.js 15 前端（output: export 静态导出）
├── worker/     # Cloudflare Workers + Hono API
└── shared/     # 前后端共享类型与常量
```

## 快速开始

```bash
# 安装依赖（pnpm >= 9）
pnpm install

# 前端开发（默认 http://localhost:3000）
pnpm dev:web

# Worker 开发（默认 http://localhost:8787）
pnpm dev:worker

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 前端 lint
pnpm lint
```

## 验证

- Worker 健康检查：`curl http://localhost:8787/api/health` → `{"status":"ok"}`
- 前端构建产物：`web/out/`（静态导出，可直接部署到 Cloudflare Pages）

## 部署

- `web/` → Cloudflare Pages（构建命令 `pnpm --filter web build`，输出目录 `web/out`）
- `worker/` → Cloudflare Workers（`pnpm --filter worker deploy`）
