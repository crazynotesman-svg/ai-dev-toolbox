# AI Developer Toolbox — 30 天 MVP 调整方案（架构评审修订版）

> 版本 v1.1 · 2026-08-05 · 基于 v1.0 架构评审结果修订
> 目标：**30 天内上线可用的 MVP**，优先 SEO 与快速上线，砍掉一切非必要工程复杂度

---

## 0. 调整摘要

| 评审结论 | 调整动作 | 原因 |
|---|---|---|
| Turborepo 编排对 2 个应用是过度设计 | **移除 Turborepo**，保留轻量 pnpm workspace | 只有 web/worker 两个包，turbo 缓存编排收益趋近于零 |
| Monorepo 全栈链路复杂 | **单仓库简化结构**：web / worker / shared 三目录 | 一套 `pnpm install` 完成，无跨仓库同步成本 |
| Next.js 15 全特性在 Pages 有兼容风险 | **采用静态导出（`output: 'export'`）**，放弃 SSR/ISR | MVP 工具页全部客户端交互，静态 HTML 完全够用，且 SEO 最优、部署最简单 |
| AI 服务需独立部署 | **保留 Cloudflare Worker + Hono**（独立子域） | 密钥保护 + 限流，与前端解耦 |
| AI 能力不可砍 | **保留 DeepSeek API**（SSE 流式） | MVP 差异化卖点 |
| 上线节奏 | **30 天倒排**：第一周出可跑骨架 | 先上线再打磨，避免完美主义拖延 |

**一句话总结调整**：v1.0 是"工程化完备"架构，v1.1 是"最快可上线"架构——去掉编排层、静态化前端、双端独立部署、周为单位交付。

---

## 1. 简化后的项目目录

```
ai-dev-toolbox/                          # GitHub 单仓库根
├── package.json                         # 根：仅 workspace 脚本（dev/build/deploy）
├── pnpm-workspace.yaml                  # packages: [web, worker, shared]
├── .gitignore
├── README.md                            # 快速启动 + 部署说明
├── .github/
│   └── workflows/
│       ├── deploy-web.yml               # 触发 Cloudflare Pages 构建（GitHub 连接即可，可省略）
│       └── deploy-worker.yml            # wrangler-action 部署 Worker
│
├── web/                                 # ★ Next.js 15 前端 → Cloudflare Pages
│   ├── package.json                     # name: @toolbox/web
│   ├── next.config.mjs                  # output: 'export' + 图片/路径配置
│   ├── tsconfig.json
│   ├── public/
│   │   ├── favicon.ico
│   │   └── og-cover.png
│   └── src/
│       ├── app/
│       │   ├── layout.tsx               # 全局 layout：导航 + 页脚 + 全局 metadata
│       │   ├── page.tsx                 # 首页：工具聚合 + 工具卡片（SEO 落地页）
│       │   ├── sitemap.ts               # 自动生成 sitemap.xml
│       │   ├── robots.ts                # robots.txt
│       │   ├── not-found.tsx
│       │   └── tools/
│       │       ├── json-formatter/page.tsx
│       │       ├── json-to-typescript/page.tsx
│       │       ├── json-to-java/page.tsx
│       │       ├── jwt-decoder/page.tsx
│       │       └── ai-json-explainer/page.tsx
│       ├── components/
│       │   ├── ui/                      # Button / Select / Tabs / Toast…
│       │   ├── editor/                  # CodeMirror 6 封装（动态加载，保 CWV）
│       │   ├── layout/                  # Header / Footer / ToolCard
│       │   └── tools/                   # 工具页共享：InputPane / OutputPane / ErrorPanel
│       ├── lib/
│       │   ├── tools/                   # ★ 纯函数：json.ts / to-typescript.ts / to-java.ts / jwt.ts
│       │   └── api-client.ts            # 调 Worker 的 fetch 封装（唯一网络出口）
│       └── styles/globals.css
│
├── worker/                              # ★ Cloudflare Worker + Hono → Workers 子域
│   ├── package.json                     # name: @toolbox/worker
│   ├── wrangler.toml                    # name / routes / vars / [vars] 配置
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                     # Hono 入口 + CORS + 错误处理
│       ├── routes/
│       │   ├── health.ts                # GET /api/health
│       │   └── ai.ts                    # POST /api/ai/explain（SSE 流式）
│       ├── services/
│       │   └── deepseek.ts              # DeepSeek 封装（密钥读取 + 流式透传）
│       └── types.ts
│
└── shared/                              # 前后端共享类型（仅 1 个接口，体积极小）
    ├── package.json                     # name: @toolbox/shared
    └── src/
        ├── index.ts                     # ExplainRequest / ExplainChunk / 错误码枚举
        └── tsconfig.json
```

**设计要点**
- 根目录只有脚本，没有构建编排逻辑；构建全部交给 Cloudflare 平台侧。
- `web/` 静态导出后产物是纯 HTML，Pages 托管即可，**前端零运行时服务器**。
- `worker/` 独立于前端，`wrangler.toml` 自包含，`npx wrangler deploy` 即上线。
- `shared/` 仅放接口类型，被两端以 `workspace:*` 引用，量小、无打包负担。

---

## 2. 初始化步骤

前置条件：Node ≥ 20、pnpm ≥ 9、GitHub 账号、Cloudflare 账号、DeepSeek API Key。

| # | 步骤 | 命令 / 操作 | 验收标准 |
|---|---|---|---|
| 1 | 创建 GitHub 仓库 | GitHub 新建 `ai-dev-toolbox`（Public，含 README） | 仓库可访问 |
| 2 | 本地初始化 | `git clone` + `cd`，创建 `package.json` + `pnpm-workspace.yaml` | `pnpm -v` 正常 |
| 3 | 创建 shared 包 | 手写 `shared/`（package.json + src/index.ts + tsconfig） | 类型可被 import |
| 4 | 创建 web 应用 | `pnpm dlx create-next-app@15 web --ts --tailwind --eslint --app --no-src-dir` 后按目录结构调整 | `pnpm --filter web dev` 可访问首页 |
| 5 | 配置静态导出 | `next.config.mjs` 加 `output: 'export'` | `pnpm --filter web build` 产出 `out/` 目录 |
| 6 | 创建 worker | 手写 `worker/`（Hono + wrangler.toml） | `pnpm --filter worker dev` 本地起 Hono |
| 7 | 配置 DeepSeek | 本地 `.dev.vars` 放 `DEEPSEEK_API_KEY`（gitignore） | 本地 curl `/api/health` 返回 200 |
| 8 | 本地全链路联调 | web dev + worker dev，前端直连 worker 本地地址 | AI 解释页能流式出字 |
| 9 | 首次提交 | `git add -A && git commit && git push` | 远端仓库结构完整 |
| 10 | 双端首次部署 | 按第 4 节流程部署 Pages + Worker | 线上域名可访问、AI 可调用 |

**关键配置示意（非业务代码）**
- `web/next.config.mjs`：`output: 'export'`、`images.unoptimized = true`、`trailingSlash: false`
- `worker/wrangler.toml`：`name = "ai-toolbox-api"`、`main = "src/index.ts"`、`compatibility_date` 最新、`[vars]` 放非敏感配置；密钥用 `wrangler secret put DEEPSEEK_API_KEY`

---

## 3. GitHub 仓库结构

```
ai-dev-toolbox (main 分支，单仓库)
├── web/            # 前端（部署：Cloudflare Pages，由 GitHub 连接自动构建）
├── worker/         # 后端（部署：Cloudflare Workers，由 GitHub Actions 触发）
├── shared/         # 共享类型
├── .github/workflows/
│   ├── deploy-web.yml       # 可选：push main 时通知 Pages 重新构建
│   └── deploy-worker.yml    # push main 时 wrangler-action 部署 Worker
├── package.json / pnpm-workspace.yaml
└── README.md       # 启动说明、部署说明、环境变量清单
```

**分支策略（MVP 从简）**
| 策略 | 说明 |
|---|---|
| 直接开发 main | 单人/小团队 MVP 阶段，PR 流程从简 |
| 保护规则 | main 开启"要求 PR 通过"（可选，第 3 周再开） |
| Tag 版本 | 里程碑打 tag：v0.1（骨架）、v0.2（AI 上线）、v1.0（正式发布） |

**CI 职责划分**
| 触发 | 动作 | 部署目标 |
|---|---|---|
| push main | Pages 连接式自动构建（零配置） | Cloudflare Pages |
| push main（worker 路径变更） | wrangler-action `deploy` | Cloudflare Workers |

> 说明：Pages 可直接在 Cloudflare 控制台连接 GitHub 仓库并配置构建命令，**web 端可以完全不用写 workflow**；Worker 因涉及密钥与自定义域，建议用 GitHub Actions + `CLOUDFLARE_API_TOKEN` secret 管理。

---

## 4. Cloudflare 部署流程

### 4.1 前端 → Cloudflare Pages

| 步骤 | 操作 | 说明 |
|---|---|---|
| 1 | 控制台 → Workers & Pages → Create → Pages → Connect to Git | 选择 `ai-dev-toolbox` 仓库 |
| 2 | 构建配置 | Build command: `pnpm --filter web build`<br>Output directory: `web/out`<br>Root directory: `/` |
| 3 | 环境变量（如有） | 例如 `NEXT_PUBLIC_API_BASE`（指向 Worker 域名） |
| 4 | 自定义域 | 绑定 `www.你的域名` 或子域 `tools.你的域名`，自动 HTTPS |
| 5 | 首次部署验证 | 访问首页 + 各工具页，检查 metadata/sitemap.xml |

### 4.2 后端 → Cloudflare Workers

| 步骤 | 操作 | 说明 |
|---|---|---|
| 1 | 本地 `wrangler login` 或配置 `CLOUDFLARE_API_TOKEN` | GitHub Actions secret 中存 token |
| 2 | `wrangler.toml` 指定 `name = "ai-toolbox-api"`、`routes`（如 `api.你的域名/*`） | 绑定自定义域 |
| 3 | `wrangler secret put DEEPSEEK_API_KEY` | 密钥永不出现在代码仓库 |
| 4 | GitHub Actions：`cloudflare/wrangler-action@v3` 部署 | push main 自动发布 |
| 5 | CORS 白名单 | Worker 仅允许前端域（`https://tools.你的域名`）跨域调用 |
| 6 | 验证 | `curl https://api.你的域名/api/health` 返回 200 |

### 4.3 上线前检查清单

- [ ] Pages 自定义域 HTTPS 生效，sitemap.xml / robots.txt 可访问
- [ ] Worker 子域可访问，CORS 仅放行前端域
- [ ] `DEEPSEEK_API_KEY` 已作为 secret 配置（非明文）
- [ ] Rate Limiting 规则生效（Cloudflare 面板或 Worker 内限流）
- [ ] 错误页/降级提示（AI 不可用时前端友好提示）
- [ ] Google Search Console 提交 sitemap；Analytics（如 Plausible/GA）接入

---

## 5. 第一周开发任务拆解

> 目标：**第 7 天结束，线上已有一个能跑通全部 5 个工具的 MVP 骨架**（静态部署 + AI 可用，可后续迭代打磨）。

| 天 | 任务 | 交付物 | 验收标准 |
|---|---|---|---|
| **D1** | 仓库初始化 + 双端骨架 + 首次部署 | 空主页上线 Pages、健康检查上线 Worker | 线上能访问首页；`/api/health` 返回 200 |
| **D2** | 全局布局 + 首页 + SEO 基础 | Header/Footer/ToolCard、首页工具网格、`layout.tsx` metadata、sitemap/robots | 首页 5 张工具卡可点；sitemap.xml 生成；Lighthouse SEO 90+ |
| **D3** | JSON 格式化工具（模板定型） | 工具页模板（输入/输出/工具栏/错误面板）+ 纯函数 `json.ts` | 美化/压缩/校验正确，解析错误定位行列号并高亮 |
| **D4** | JSON → TypeScript + JSON → Java | `to-typescript.ts` / `to-java.ts` + 两个工具页 | 常见 JSON 结构转换正确，含嵌套/数组/可选字段 |
| **D5** | JWT 解析 | `jwt.ts` + 工具页 | Header/Payload 正确解码，过期时间判断准确（纯前端） |
| **D6** | Worker + DeepSeek 服务 | `worker/` 全部路由 + `deepseek.ts` + SSE 实现 | 本地 curl 流式返回；超时/限流/错误映射为统一错误码 |
| **D7** | AI 解释页面前端 + 联调 + 缓冲 | AI 页面（输入/流式渲染/降级提示）、`api-client.ts` | 线上端到端：输入 JSON → 流式出字 → 失败时友好降级 |

**第一周关键纪律**
1. **工具页模板在 D3 一次定型**，D4/D5 全部复用，避免每个工具各自为战。
2. 所有转换逻辑是纯函数，**当天写当天测**（vitest），不留技术债。
3. D6 前前端用 mock SSE 联调协议，避免前后端互相等待。
4. 每天结束必须能部署到线上（哪怕丑），保持"永远可上线"状态。

---

## 6. 30 天全周期节奏（附）

| 周 | 主题 | 核心产出 |
|---|---|---|
| W1 | 骨架 + 5 工具全部可跑 + 上线 | 线上 MVP v0.1（第 1 节拆解） |
| W2 | 质量打磨 | AI 解释体验优化（提示词/流式/历史）、边界用例测试、错误处理完善、SEO 补全（OG/JSON-LD/每页描述） |
| W3 | 性能 + 扩展 | 大文件处理（Web Worker/虚拟滚动）、CodeMirror 动态加载优化 CWV、i18n（zh/en）、1–2 个 SEO 内容页 |
| W4 | 上线冲刺 | Lighthouse 全站审计、限流/监控/告警、Search Console 提交、Analytics、正式发布 v1.0 + 内容营销准备 |

---

## 7. 调整后剩余风险复核

| # | 风险 | 等级 | 应对（调整后） |
|---|---|---|---|
| 1 | Next.js 静态导出限制（无 SSR/动态路由 API） | 低 | 工具全客户端、AI 走独立 Worker，静态导出完全覆盖 MVP 需求；若未来要 SSR 再加 `@opennextjs/cloudflare` |
| 2 | 无 Turbo 后构建效率 | 低 | 仅 2 包，Cloudflare 平台侧构建，本地 `pnpm -r build` 足够 |
| 3 | DeepSeek 成本/限流 | 中 | 保持"先裁剪再调用"策略 + Worker 限流 + 错误降级 |
| 4 | CORS/密钥安全 | 中 | CORS 白名单 + `wrangler secret`，密钥不进仓库 |
| 5 | 30 天节奏压力 | 中 | W1 先保"能跑"，W2 再打磨；每日可部署 + 纯函数当日单测防债 |

---

*本文档替代 v1.0 中与快速上线冲突的部分；目录结构、API 契约、数据流设计等未受影响的内容继续沿用 v1.0 约定。*
