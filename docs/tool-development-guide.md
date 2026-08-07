# AI Developer Toolbox — 工具开发指南

> 面向"新增 1 个工具"的标准流程与平台约定。遵循本指南，新增工具只需写 3 个文件 + 改 1 处配置，其余能力（SEO / 互链 / 索引 / sitemap / 公共提示）全部自动获得。

---

## 1. 平台架构总览

```
shared/src/index.ts          ← 工具唯一元数据来源（配置驱动）
web/src/lib/tools/*.ts       ← 纯函数层（无 React 依赖，Node 可单测）
web/src/components/tools/*.tsx ← 工具交互（client component）
web/src/app/tools/[slug]/page.tsx ← 独立工具页（server component，复用 ToolPageShell）
web/src/app/tools/page.tsx   ← 工具索引页（自动展示所有 live 工具）
web/src/components/tools/ToolPageShell.tsx ← 工具页骨架（自动注入公共能力）
web/src/components/tools/RelatedTools.tsx  ← 工具互链（自动）
```

## 2. 标准开发流程（5 步）

### 2.1 shared 增加配置

文件：`shared/src/index.ts` → `TOOL_CONFIGS` 追加一项。

```ts
{
  slug: "base64-encoder",          // 路由 = /tools/{slug}
  title: "Base64 编码",
  description: "文本与 Base64 互转",
  category: "convert",             // 已有分类直接复用；新分类需扩展 ToolCategoryId + TOOL_CATEGORIES
  keywords: ["Base64", "编码解码"],
  seoTitle: "Base64 编码工具 | AI Developer Toolbox",
  seoDescription: "在线 Base64 编解码……（建议 ≥60 字符）",
  status: "planned",               // 开发中先 planned（自动生成占位页）；完成后改 live
  inputLimit: 10 * 1024 * 1024,    // 可选：输入上限字节，公共提示条展示；缺省默认 10MB
}
```

> **分类**：当前已有 `json`（4 个）与 `security`（1 个）。新增分类时同步：
> 1. `ToolCategoryId` 联合类型加新值
> 2. `TOOL_CATEGORIES` 追加 `{ id, name, description }`
> 3. `web/src/components/home/ToolCard.tsx` 的 `CATEGORY_STYLE` 加对应颜色键（TS Record 严格匹配，缺了编译报错）

### 2.2 创建纯函数

文件：`web/src/lib/tools/{name}.ts`

要求：
- **不依赖 React**（可被 Node `--experimental-strip-types` 直接单测）
- 返回统一结构：`{ ok: true, ... } | { ok: false, error: string }`
- 输入为空时返回明确错误信息
- 超过 `inputLimit` 时返回大小限制错误
- JSON 类工具可复用 `web/src/lib/tools/json.ts` 的 `validateJson` / `locateJsonError` / `MAX_INPUT_BYTES`

跨文件 import 必须带 `.ts` 扩展名（如 `import { validateJson } from "./json.ts"`），否则 Node 直测失败；`web/tsconfig.json` 已开启 `allowImportingTsExtensions`。

### 2.3 创建 client component

文件：`web/src/components/tools/{Name}Tool.tsx`

参考既有实现（`JsonToTypescriptTool.tsx` / `JsonToJavaTool.tsx` / `JwtDecoderTool.tsx`）保持交互风格统一：
- `"use client"` 顶部声明
- 输入区（textarea）+ 主操作按钮 + 复制结果 + 载入示例 + 清空
- 状态栏：输入统计（行数/KB）+ "数据仅在浏览器本地处理" + 操作反馈 notice
- notice 类型统一为 `{ type: "success" | "error" | "info"; text: string }`
- 复制成功反馈："已复制到剪贴板 ✓"（`navigator.clipboard` + `execCommand` 降级）
- **纯客户端**：禁止 AI / 数据库 / 登录 / Worker 调用

### 2.4 创建独立页面

文件：`web/src/app/tools/{slug}/page.tsx`

```tsx
import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { NameTool } from "@/components/tools/NameTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("base64-encoder")!;

export const metadata: Metadata = {
  title: { absolute: tool.seoTitle },
  description: tool.seoDescription,
  keywords: [...tool.keywords],
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { /* title/description/url */ },
};

const softwareJsonLd = { /* SoftwareApplication + Offer */ };

export default function Page() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={...} guide={...} faqs={...}>
        <NameTool />
      </ToolPageShell>
    </>
  );
}
```

- `features`（功能介绍 3-4 条）/ `guide`（使用教程 3 步）/ `faqs`（FAQ 3-4 条）
- FAQ 会由 `FaqSection` 自动生成 **FAQPage JSON-LD**
- `ToolPageShell` 自动注入 **BreadcrumbList JSON-LD** + 公共提示条

### 2.5 上线

把 shared 中该工具 `status` 从 `planned` 改为 `live`，执行 `pnpm build` 验证。

## 2.6 一键脚手架（D10 新增）

```bash
# 自动生成 5 类文件（shared 配置 / lib 纯函数 / 组件 / 页面 / 测试）
node --experimental-strip-types scripts/create-tool.ts <slug> "<标题>" "<描述>"
# 查看现有工具
node --experimental-strip-types scripts/create-tool.ts --list
```

生成后补充逻辑与文案，再执行验收（见第 4 节）。

## 2.7 工程化命令（D10 新增）

```bash
pnpm test       # 工具纯函数测试（node --test，65+ 用例）
pnpm validate   # 工具元数据完整性检查（slug 唯一/字段完整/category 合法/live 有页面与组件）
pnpm typecheck  # 类型检查
pnpm lint       # ESLint
pnpm build      # 静态导出
```

`validate` 会在新增工具时提前发现配置错误（如 slug 重复、live 工具缺页面/组件），建议 CI 前置。

## 3. 自动获得的能力（零代码）

| 能力 | 来源 |
|---|---|
| sitemap 收录 | `web/src/app/sitemap.ts`（仅 live） |
| robots.txt | 自动指向 sitemap |
| BreadcrumbList JSON-LD | ToolPageShell 统一注入 |
| SoftwareApplication JSON-LD | 页面内 JsonLd（各页自配） |
| FAQPage JSON-LD | FaqSection 自动派生 |
| RelatedTools 互链 | RelatedTools 自动过滤 live 且非当前 |
| /tools 索引页 | tools/page.tsx 数据驱动 |
| 首页分类分区 | page.tsx 数据驱动 |
| Header/Footer 导航 | 数据驱动 |
| 公共提示条（空输入/inputLimit/隐私） | ToolPageShell 统一注入 |

## 4. 验收清单

```bash
# 0. 一键质量门禁（validate + test + lint + typecheck，任一失败立即退出）
pnpm check

# 1. 元数据完整性检查（live 工具必须 page + component + test 三件套齐全）
pnpm validate

# 2. 工具纯函数测试（node --test，覆盖正常/空/错误/边界/大输入）
pnpm test

# 3. 构建（静态导出）
pnpm build

# 4. 浏览器实测（静态产物 + playwright-cli）
#    - 正常输入 → 输出 + 成功反馈
#    - 非法输入 → 错误行列号/提示
#    - 页面 SEO：canonical / JSON-LD / breadcrumb
#    - RelatedTools 互链出现新工具
```

## 5. 工具生命周期（Tool Lifecycle）

```
idea
  │  1. 确认需求（纯函数可实现、无需服务器）
  ▼
planned
  │  2. shared/src/index.ts 追加配置（status: "planned"）
  │     → 自动获得占位页 / 首页分区 / sitemap（不收录）
  ▼
create-tool
  │  3. node --experimental-strip-types scripts/create-tool.ts <slug> <标题> <描述>
  │     → 自动生成 lib 纯函数 / 组件 / 页面 / 测试 四类骨架
  ▼
development
  │  4. 实现纯函数逻辑（保持 { ok, output|error } 结构）
  │  5. 实现组件交互（复用现有工具交互模式）
  │  6. 补充页面 features / guide / faqs 文案
  ▼
validate + test
  │  7. pnpm validate：配置字段完整、slug 唯一、category 合法
  │     pnpm test：纯函数用例全过（正常/空/错误/边界/大输入）
  ▼
build
  │  8. pnpm build：静态导出成功，产物完整（页面生成、sitemap 收录）
  │  9. 浏览器实测：工具交互 / SEO JSON-LD / RelatedTools 互链
  ▼
live
  │  10. shared status 改为 "live"
  │      → 自动进入 sitemap / /tools 索引 / 首页分区 / RelatedTools 互链
  ▼
maintenance
     11. 后续变更跑 pnpm check + pnpm build 回归
```

### 关键决策点

| 阶段 | 改 status 时机 | 必须通过的检查 |
|---|---|---|
| idea | — | — |
| planned | 追加配置时 | `pnpm validate`（字段完整） |
| development | 保持 planned | 纯函数可用（本地测试） |
| live | **仅当 page + component + test 三件套齐全且 build 成功** | `pnpm check` + `pnpm build` + 浏览器实测 |

> **规则**：`planned → live` 是发布动作。live 工具缺失任一组件（page/component/test）时 `pnpm validate` 会直接报错拒绝。

### 新工具上线 checklist

- [ ] shared 配置字段完整（slug/title/description/category/keywords/seoTitle/seoDescription/status/inputLimit）
- [ ] `pnpm validate` 通过（0 错误）
- [ ] 纯函数测试文件存在且 `pnpm test` 全过
- [ ] `pnpm lint` / `pnpm typecheck` 通过
- [ ] `pnpm build` 成功且产物完整（新工具页 + sitemap 收录）
- [ ] 浏览器实测：工具交互正常 + SEO（canonical/JSON-LD/breadcrumb）+ RelatedTools 互链
- [ ] status 改为 live 后重新 `pnpm build` 确认全站无回归

## 6. 已知约定与坑

1. **slug 必须与页面目录一致**（`app/tools/{slug}/page.tsx`），RelatedTools 互链与 sitemap 均基于 slug。
2. `[slug]/page.tsx`（占位页）：`generateStaticParams` 返回 planned 工具；**全部 live 时返回哨兵 `["__none__"]`**（Next 15.5 output:export 空数组会报 "missing generateStaticParams"）。哨兵页自带 `robots=noindex` 且不进 sitemap，安全。
3. 静态导出下 `dynamicParams` 必须为 `false`（占位页已设置）。
4. **eslint flat config ignores 需含 `out*/**`**（备份目录的构建产物会被扫描报错）。
5. Windows 环境 `web/out` 目录可能被 WorkBuddy 保护（删除失败）——构建时保留即可，不要手动删。
6. 修改 shared 后如 build 未识别新配置，`touch shared/src/index.ts` 触发重新编译。
7. 纯函数跨文件 import 用 `.ts` 扩展名；组件跨文件 import 用无扩展名（Next 约定），勿混用。
