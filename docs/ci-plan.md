# CI 接入方案（workflow 已就绪 · 待 git 托管后启用）

> workflow 文件已创建（`.github/workflows/quality.yml`），当前仓库尚未初始化 git 远程，CI 将在仓库推送至 GitHub 后自动生效。

## 1. 环境基线

| 项 | 版本 | 来源 |
|---|---|---|
| Node | 22（满足 engines >=20） | `package.json` engines + workflow |
| pnpm | 9.15.9 | `package.json` packageManager + workflow |
| 包管理器 | pnpm workspace（4 包：root/shared/web/worker） | pnpm-workspace.yaml |
| 构建 | Next.js 15.5 静态导出（`output: "export"` → out/） | web/next.config |
| lockfile | pnpm-lock.yaml（已存在，CI 用 --frozen-lockfile） | 仓库根 |

## 2. Workflow 文件

**位置**：`.github/workflows/quality.yml`

**触发条件**：
- `pull_request` → main 分支
- `push` → main 分支
- `concurrency`：同分支新 run 取消旧 run（节省资源）

**环境**：`ubuntu-latest`，Node 22，pnpm 9.15.9（pnpm/action-setup + setup-node cache=pnpm）

## 3. Pipeline 顺序（失败立即终止）

```
pnpm install --frozen-lockfile
        │  lockfile 冻结安装，保证 CI 与本地依赖一致
        ▼
pnpm validate
        │  工具元数据完整性（slug 唯一/字段/category/live 三件套）
        ▼
pnpm test
        │  工具纯函数测试（65+ 用例，node --test）
        ▼
pnpm lint
        │  ESLint（web）
        ▼
pnpm typecheck
        │  tsc（shared/web/worker 三包）
        ▼
pnpm build
        │  Next 静态导出 → web/out
        ▼
upload-artifact
        web/out 上传为构建产物（供后续部署阶段使用，本 workflow 不部署）
```

> 每步 `run:` 独立；任一步非零退出即终止后续步骤（GitHub Actions 默认行为）。

## 4. 本地与 CI 对应命令

| 阶段 | CI（workflow step） | 本地等价命令 |
|---|---|---|
| 安装 | `pnpm install --frozen-lockfile` | `pnpm install` |
| 元数据 | `pnpm validate` | `pnpm validate` |
| 测试 | `pnpm test` | `pnpm test` |
| Lint | `pnpm lint` | `pnpm lint` |
| 类型 | `pnpm typecheck` | `pnpm typecheck` |
| 构建 | `pnpm build` | `pnpm build` |

本地一键门禁：`pnpm check`（= validate && test && lint && typecheck，失败即停）→ `pnpm build`。
CI 与之等价：`pnpm check` 的五步拆成独立 step 以便定位失败，`build` 独立 step 生成产物。

## 5. 部署边界（本 CI 不部署）

当前 workflow **只负责质量门禁**：validate / test / lint / typecheck / build。
- ❌ 不执行任何 deploy 步骤（无 wrangler / cloudflare / pages 动作）
- ✅ 仅上传 `web/out` 为 artifact（`retention-days: 7`），供后续部署阶段取用

**部署保持后续阶段处理**（建议方案见下）。

## 6. 部署建议（后续阶段）

- 静态站点（web/out）→ **Cloudflare Pages**（域名已预留 `ai-dev-toolbox.pages.dev`），构建命令 `pnpm build`，输出目录 `web/out`
- Worker（worker/）→ 独立 `wrangler deploy`，与静态站分离
- 发布门禁：merge 到 main 前必须通过 Quality Gate（本 workflow 全绿 + build 成功）

## 7. 启用步骤（前置条件）

1. 初始化 git 仓库并推到 GitHub（当前为非 git 仓库，尚未初始化）
2. 确认 `pnpm-lock.yaml` 已提交（当前已存在）
3. workflow 文件已就绪（`.github/workflows/quality.yml`），推送后自动生效
4. Cloudflare Pages 关联仓库，配置构建命令与输出目录（部署阶段实施）

## 8. 已知说明

- CI 使用 ubuntu 干净环境，不受本地 Windows 的 `web/out` 目录保护问题影响，build trace 卡死预期不会在 CI 出现
- `pnpm install` 未锁定 store 版本，依赖解析由 lockfile 保证一致性
