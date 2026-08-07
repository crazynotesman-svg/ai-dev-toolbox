# AI Developer Toolbox 架构设计文档

> 版本 v1.0 · 2026-08-05
> 目标：对标 JSON.cn 的 AI 开发者工具平台（MVP 阶段 5 个工具）

## 0. 项目概述

| 项 | 决策 |
|---|---|
| 定位 | 开发者工具聚合平台：纯工具 + AI 增强 |
| 前端 | Next.js 15（App Router）+ TypeScript + Tailwind CSS |
| 前端部署 | Cloudflare Pages |
| 后端 | Cloudflare Workers（独立服务，Hono） |
| 数据库 | Supabase（第二阶段引入） |
| AI | DeepSeek API（deepseek-chat，SSE 流式） |
| 工程化 | pnpm workspace + Turborepo Monorepo |

**MVP 功能清单**
1. JSON 格式化（美化 / 压缩 / 校验 / 错误定位）
2. JSON → TypeScript（interface/type、命名策略可配）
3. JSON → Java（POJO 生成）
4. JWT 解析（Header / Payload 解码、过期判断）
5. AI JSON 解释（DeepSeek 流式讲解 JSON 结构含义）

### 核心设计原则
1. **客户端优先（Client-First）**：格式化、转 TS/Java、JWT 解码全部在浏览器本地执行——零延迟、零服务器成本、数据不出浏览器。这是对齐 JSON.cn 体验的关键，也是 Worker 免费配额下的必然选择。
2. **Worker 薄服务化**：Worker 只承载"必须服务端"的能力——AI 调用（保护密钥）、限流、未来的用户态接口。保持 CPU 占用极低（Free 计划 10ms CPU/请求）。
3. **渐进增强**：MVP 无登录、无数据库；Supabase 从接口层预留扩展点，不提前引入复杂度。
4. **类型共享**：前后端共享 DTO 定义，杜绝接口漂移。
5. **AI 供应商可替换**：DeepSeek 封装为独立服务层，后续可无缝切换或多模型路由。

---

## 1. 推荐项目目录结构

采用 **pnpm workspace + Turborepo 单仓库**，前端与 Worker 独立应用、共享类型包：

```
ai-dev-toolbox/
├── apps/
│   ├── web/                          # Next.js 15 前端（部署 Cloudflare Pages）
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # 全局布局（导航/页脚/主题）
│   │   │   │   ├── page.tsx          # 首页：工具聚合
│   │   │   │   ├── tools/
│   │   │   │   │   ├── json-formatter/page.tsx
│   │   │   │   │   ├── json-to-typescript/page.tsx
│   │   │   │   │   ├── json-to-java/page.tsx
│   │   │   │   │   ├── jwt-decoder/page.tsx
│   │   │   │   │   └── ai-json-explainer/page.tsx
│   │   │   │   └── not-found.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # 基础组件（Button/Input/Tabs/Badge...）
│   │   │   │   ├── editor/           # CodeMirror 6 封装（高亮/折叠/校验）
│   │   │   │   ├── layout/           # Header / Footer / 工具卡
│   │   │   │   └── tools/            # 各工具专用组件（错误面板/AI 面板等）
│   │   │   ├── lib/
│   │   │   │   ├── tools/            # ★ 核心：纯函数转换逻辑（可单测）
│   │   │   │   │   ├── json.ts       # 格式化/压缩/校验/错误定位
│   │   │   │   │   ├── to-typescript.ts
│   │   │   │   │   ├── to-java.ts
│   │   │   │   │   └── jwt.ts        # base64url 解码/过期判断
│   │   │   │   ├── api-client.ts     # Worker API 封装（fetch + SSE）
│   │   │   │   └── utils/
│   │   │   ├── hooks/                # 自定义 hooks
│   │   │   └── types/                # 前端内部类型
│   │   ├── public/                   # 静态资源 / OG 图
│   │   ├── tests/                    # vitest 单测 + Playwright e2e
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Cloudflare Workers（独立 Worker）
│       ├── src/
│       │   ├── index.ts              # Hono 入口
│       │   ├── routes/
│       │   │   ├── health.ts
│       │   │   └── ai.ts             # /api/ai/explain（SSE 流式）
│       │   ├── services/
│       │   │   └── deepseek.ts       # DeepSeek 封装（fetch + 流式透传）
│       │   ├── middleware/
│       │   │   ├── cors.ts
│       │   │   ├── rate-limit.ts
│       │   │   └── error-handler.ts
│       │   └── types/
│       ├── wrangler.toml             # 环境/绑定/secret 引用
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                       # 前后端共享
│       └── src/
│           ├── types/                # API DTO / 工具结果类型 / 错误码
│           └── utils/                # 通用工具（大小限制、键名规范等）
│
├── docs/                             # 架构文档、接口约定
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**选型理由**
- **Hono 而非原生 fetch handler**：TS 优先、类型安全路由、中间件生态成熟、体积极小（<20KB），CF Workers 上最流行的框架。
- **CodeMirror 6 而非 Monaco**：Monaco ~5MB，CodeMirror 6 树摇后约 300KB–1MB；工具箱场景的高亮/折叠/校验插件齐全，后续做 AI 补全 UI 仍可扩展。
- **共享类型包**：`/api/ai/explain` 的 DTO 在 `packages/shared` 定义，前后端共同引用，杜绝字段漂移。
- 备选：若未来强依赖 Next.js 全栈能力（RSC + Server Actions 直连 Supabase），可评估 `@opennextjs/cloudflare` 把整个 Next.js 跑在 Workers 上；MVP 阶段"静态前端 + 独立 Worker"更简单可控。

---

## 2. 前后端架构

### 2.1 前端架构（Next.js 15 App Router）

| 层 | 方案 |
|---|---|
| 渲染策略 | 首页/静态页用 Server Components（SEO 好、首屏快）；工具页为 Client Component（编辑器交互密集） |
| 编辑器 | CodeMirror 6：`@codemirror/lang-json` 高亮 + `@codemirror/lint` 校验 + fold 折叠 |
| 状态管理 | MVP 不引入 Redux/Zustand：工具配置放 URL query（可分享、刷新可保留）；复杂度上来后再考虑 |
| 转换逻辑 | 全部为 `lib/tools` 下纯函数（输入 JSON 字符串 → 输出字符串/结构化结果），vitest 全量单测 |
| 大文件策略 | 超阈值（如 5MB）走文件导入；解析放 Web Worker 防主线程卡顿；输出面板虚拟滚动 |
| 错误处理 | 捕获解析异常并映射行列号、高亮错误位置——对标 JSON.cn 的体验关键 |

### 2.2 后端架构（Cloudflare Workers + Hono）

- 路由表：`/api/health`、`/api/ai/explain`（流式）
- 中间件链：`CORS(白名单) → 限流 → 鉴权(预留) → 路由 → 错误处理`
- DeepSeek 服务层：
  - 密钥 `DEEPSEEK_API_KEY` 存为 Worker Secret，前端永远接触不到
  - 统一处理上游错误（超时/429/5xx）并映射为业务错误码
  - SSE 流式转发：Worker 拿到 DeepSeek 流后原样透传给浏览器，边收边转
- 限流：Cloudflare 免费档 Rate Limiting 规则（按 IP）+ Worker 内计数器双保险

### 2.3 部署拓扑

```
浏览器 ──► Cloudflare Pages（web.你的域名）
   │          └─ 静态资源 + 边缘缓存 + 自动 HTTPS
   └──► Cloudflare Workers（api.你的域名）
              └─ Hono API，仅暴露 /api/*，CORS 白名单限定前端域
```

---

## 3. 页面规划

### 3.1 信息架构

| 路由 | 页面 | 类型 | 说明 |
|---|---|---|---|
| `/` | 首页 | 静态 | Hero + 工具卡片网格 + 使用指引 |
| `/tools/json-formatter` | JSON 格式化 | 工具页 | 美化/压缩/校验/错误定位/复制/下载 |
| `/tools/json-to-typescript` | JSON→TS | 工具页 | interface/type、命名、可选字段配置 |
| `/tools/json-to-java` | JSON→Java | 工具页 | POJO 生成、Lombok 可选 |
| `/tools/jwt-decoder` | JWT 解析 | 工具页 | Header/Payload 解码、过期判断 |
| `/tools/ai-json-explainer` | AI JSON 解释 | 工具页 | JSON + AI 流式讲解 |
| `/about` `/not-found` | 辅助页 | 静态 | 简介 / 404 |

### 3.2 工具页通用模板（复用）

```
┌───────────────────────────────────────────────┐
│ 顶部导航（全局，预留搜索框）                       │
├───────────────────────┬───────────────────────┤
│ 输入区（CodeMirror）    │ 输出区（只读/高亮）      │
│  JSON 输入             │  转换结果               │
├───────────────────────┴───────────────────────┤
│ 工具栏：格式化｜压缩｜校验｜复制｜下载｜清空｜示例    │
│ 错误面板：解析错误定位（行/列 + 高亮）             │
└───────────────────────────────────────────────┘
```

AI 页在此基础上增加底部 AI 面板（补充问题 → 流式回答）。

### 3.3 SEO 与元数据
- 每个工具页独立 `generateMetadata`：title / description / Open Graph / JSON-LD
- 静态页面全部可预渲染，利于 Pages 边缘缓存

---

## 4. 数据流设计

### 4.1 纯客户端转换流（格式化 / 转 TS / 转 Java / JWT）

```
输入 JSON（编辑器）→ lib/tools 纯函数 → 结果 → 输出面板渲染 → 复制/下载
     （parse）         （transform）               （0 次网络请求）
```
- 特点：零网络、零成本、数据不出浏览器、秒级响应
- 边界：输入大小限制（如 10MB），超出提示走文件导入

### 4.2 AI 解释流（唯一跨网络链路）

```
① 输入 JSON → 前端裁剪/结构提取（只发前 N KB 或结构摘要，省 token）
② POST /api/ai/explain
③ Worker：CORS/限流校验 → 组装 Prompt → 调 DeepSeek（SSE）
④ DeepSeek 流式返回 → Worker 原样透传
⑤ 前端逐字渲染 → 流结束标记来源/耗时
```
- 关键：**发送前先裁剪**。整段大 JSON 直接发给 LLM 又贵又易触发限流；先提取"键路径/类型/嵌套深度"摘要 + 用户问题，效果更好且成本低一个量级。

### 4.3 未来 Supabase 数据流（第二阶段）

```
登录（Supabase Auth）→ 历史记录/收藏/配置保存 → 个人中心
Worker 增加鉴权中间件（JWT 校验）→ /api/history/*
```
- MVP 阶段预留：`api-client.ts` 统一出口 + DTO 契约，后续加 Auth 不改页面层。

---

## 5. API 设计

Base URL：`https://api.你的域名`（自定义域绑定 Worker）

### 5.1 接口总表

| 方法 | 路径 | 用途 | 鉴权 | 频率限制 |
|---|---|---|---|---|
| GET | `/api/health` | 健康检查 | 无 | 宽松 |
| POST | `/api/ai/explain` | AI 解释 JSON（SSE 流式） | 无（IP 限流） | 20 req/min/IP |
| （未来）POST | `/api/ai/transform` | AI 转任意格式 | 同上 | — |
| （未来）GET/POST | `/api/history/*` | 历史记录 | Supabase JWT | — |
| （未来）POST | `/api/auth/*` | 登录/注册 | — | — |

### 5.2 `/api/ai/explain` 契约（示例）

请求：
```json
{
  "json": "{\"name\":\"Alice\",\"age\":30}",
  "question": "解释这个 JSON 的业务含义",
  "mode": "structure"
}
```
响应：`Content-Type: text/event-stream`，SSE 分片返回文本；结束帧携带 `usage`（token 数，可做成本展示）。

### 5.3 统一错误码

| HTTP | 错误码 | 场景 |
|---|---|---|
| 400 | INVALID_JSON / INVALID_PARAM | 请求体非法 |
| 413 | PAYLOAD_TOO_LARGE | 超过 2MB（默认上限） |
| 429 | RATE_LIMITED | 触发限流 |
| 502 | UPSTREAM_ERROR / UPSTREAM_TIMEOUT | DeepSeek 上游异常 |
| 500 | INTERNAL | 兜底 |

---

## 6. 开发顺序（依赖驱动）

| 阶段 | 内容 | 交付物 / 验收标准 | 依赖 |
|---|---|---|---|
| P0 脚手架 | monorepo + CI + 设计系统 + 全局布局 + 路由骨架 | 5 个工具页可访问、导航可用 | 无 |
| P1 JSON 格式化 | lib/tools/json + 工具页模板 + 错误定位 | 美化/压缩/校验正确、错误行号高亮、单测通过 | P0 |
| P2 转 TS / Java | 转换纯函数 + 配置项 UI | 常见 JSON 全覆盖、快照测试 | P1（模板复用） |
| P3 JWT 解析 | jwt.ts + 页面 | 解码/过期判断正确、纯前端完成 | P1 |
| P4 AI 解释 | Worker 脚手架 + Hono + DeepSeek 服务层 + SSE 页面 | 流式渲染、限流生效、密钥不落前端 | P0 + P1 |
| P5 上线部署 | Pages + Workers + 自定义域 + Rate Limiting + 监控 | 生产可用、日志/告警接入 | P2–P4 |
| P6 打磨扩展 | SEO / i18n / 文件导入 / 历史记录 / Supabase Auth | 全站审计 + Lighthouse 90+ | P5 |

> 关键路径：P0 → P1 → P2/P3 → P4 → P5。P4 是唯一跨前后端的阶段，建议单独排期，前端先用 mock 数据联调 SSE 协议。

---

## 7. 风险点与应对

| # | 风险 | 等级 | 说明与应对 |
|---|---|---|---|
| 1 | Next.js 15 在 Cloudflare Pages 的构建/运行时限制 | 高 | Next 全栈特性（SSR API）在 Pages 有限制。应对：工具页全部客户端化 + 静态导出优先；确需全栈再评估 `@opennextjs/cloudflare`；P0 必须做构建冒烟验证 |
| 2 | DeepSeek 成本与限流 | 中 | 发送前 JSON 裁剪/结构化摘要；同结构结果做 KV 缓存；流式渲染降低等待感；上游异常时优雅降级提示 |
| 3 | Worker 免费档限制（100k req/天、10ms CPU/请求） | 中 | 转换全在客户端，Worker 仅网络透传（I/O 不计 CPU）；超量再升级付费档或加 CDN 缓存 |
| 4 | 大 JSON 性能 | 中 | 超 5MB 走文件导入 + Web Worker 解析；输出虚拟滚动；解析设超时保护 |
| 5 | 安全：密钥泄露 / Prompt 注入 | 高 | 密钥只存 Worker Secret；AI 提示词将用户内容视为"数据"而非指令（隔离注入）；请求体限 2MB；后续加输出审计 |
| 6 | CORS / 跨域配置错误 | 低 | 严格白名单仅前端域；正确处理预检 OPTIONS；上线前 curl 全链路验证 |
| 7 | 解析器边界（大数精度、重复键、BOM/编码） | 低 | 统一 JSON.parse + 规范化；边界用例进单测；与 JSON.cn 行为对齐测试 |
| 8 | 编辑器体积拖慢首屏 | 低 | CodeMirror 按需引入 + 工具页路由级 code splitting（动态加载） |
| 9 | 多语言/多站点扩展被锁死 | 低 | i18n 路由结构预留（/zh、/en），首期不做但目录不堵路 |

---

### 附：关键决策速览（TL;DR）

1. **所有纯转换工具客户端执行**，Worker 只做 AI 代理 → 便宜、快、隐私好。
2. **Monorepo（pnpm+Turborepo）+ 共享类型包**：前端 Pages 静态优先，后端 Hono Worker。
3. **AI 是唯一网络链路**：先裁剪 JSON 再调用 DeepSeek，SSE 流式透传。
4. **Supabase 第二阶段接入**，通过 API 层预留，不提前耦合。
5. **最大技术风险是 Next.js 15 × Pages 兼容性**，P0 阶段必须做构建冒烟验证。
