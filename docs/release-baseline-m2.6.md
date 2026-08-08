# Release Baseline — M2.6（i18n / SEO 基线冻结）

> 基线提交：`01ad16f`（M2.5 SEO 国际化）→ 冻结版本 `v1.0-i18n-seo`
> 本文档是**冻结检查清单**：任何变更后按此核对，确保不破坏 i18n / SEO 基线。

---

## 1. Routing

| 路由 | 语言 | 状态 |
|---|---|---|
| `/` | en（默认，无前缀） | ✅ |
| `/tools` | en | ✅ |
| `/tools/{slug}` | en（6 个 live 工具） | ✅ |
| `/zh-CN/*` | zh-CN | ✅ |
| `/ja/*` | ja | ✅ |

**规则（不得违反）**：
- ✅ 英文使用**根路径**（无 `/en/` 前缀）
- ✅ 不生成 `/en/`（`/en/` 应 404）
- ✅ **只有 enabled 语言生成静态页**——`[locale]` 路由的 `generateStaticParams()` 必须用 `getStaticLocales()`（从 `SUPPORTED_LOCALES` 派生），**禁止硬编码语言列表**

```ts
// ✅ 正确写法（web/src/lib/i18n/index.ts）
export function getStaticLocales(): string[] {
  return SUPPORTED_LOCALES.filter((l) => !l.default).map((l) => l.code);
}
```

**启用新语言**：`shared/src/index.ts` 的 `SUPPORTED_LOCALES` 加一条 + 提交 `locales/{code}.json` 即可，路由/sitemap/hreflang 全自动（零代码）。

## 2. SEO

每个公开页面必须包含：

| 要素 | 状态 | 来源 |
|---|---|---|
| `title` | ✅ | `locales/{lang}.json`（site / tools.{slug}.seoTitle） |
| `description` | ✅ | `locales/{lang}.json` |
| `canonical` | ✅ | 每语言指向自身（en 无前缀，zh-CN/ja 带前缀） |
| `hreflang`（en / zh-CN / ja / x-default） | ✅ | `getHrefLang(locale, path)` |

**hreflang 输出**（Next.js 序列化为 `hrefLang` 驼峰——HTML 属性名大小写不敏感，正常生效）：

```html
<link rel="alternate" hrefLang="x-default" href="/tools/json-formatter"/>
<link rel="alternate" hrefLang="en" href="/tools/json-formatter"/>
<link rel="alternate" hrefLang="zh-CN" href="/zh-CN/tools/json-formatter"/>
<link rel="alternate" hrefLang="ja" href="/ja/tools/json-formatter"/>
```

**sitemap**（`web/src/app/sitemap.ts`）：
- ✅ **24 URL**（3 语言 × 8 页：首页 + /tools + 6 工具）
- ✅ 每条 URL 带 `alternates.languages`（96 个 xhtml:link）
- ✅ **无 disabled locale**（只用 `SUPPORTED_LOCALES`，不硬编码）
- ✅ 工具列表用 `LIVE_TOOLS`（shared registry），planned 不收录

## 3. Metadata

| 页面类型 | metadata 来源 |
|---|---|
| 首页 | `locales/{lang}.json` → `site` 区块（`getSite`） |
| 工具页 | `locales/{lang}.json` → `tools.{slug}`（`getLocalizedTool`） |
| 未来 MDX 长文 | `content/{lang}/tools/{slug}.mdx`（`getToolContent()` 占位，Phase 2） |

**metadata 一致性要点**：
- 所有页面统一输出：title / description / keywords / openGraph（siteName / locale / 绝对 url）/ twitter
- `alternates.languages` 一律通过 `getHrefLang()`，禁止手写
- Open Graph locale 用 `getOgLocale(locale)`（en_US / zh_CN / ja_JP）
- 已知优化点（不阻塞冻结）：6 个英文工具页的 `metadata` 为模板复制（结构相同、数据来自 tool 对象）；未来可抽 `buildToolMetadata(tool, locale)` helper 统一，冻结期不动。

## 4. Components（server / client 边界）

| 规则 | 状态 |
|---|---|
| `registry.ts` **不允许** `"use client"` | ✅（M2 已修：registry 是 server 模块，仅引用 client 组件） |
| server component **不调用** client module 的 function | ✅（`getToolComponent()` 在 server 页面调用，registry 无 `"use client"`） |
| client 组件文案通过 props 传 `t`（无 React Context） | ✅（`ToolComponent t={getUi(locale)}`） |

> 教训（M2 CI 修复）：registry 若带 `"use client"`，server 页面调用其导出函数会构建失败——此规则不可回退。

## 5. Validation（发布门禁）

```bash
pnpm check   # = validate && test && lint && typecheck（任一失败立即中断）
```

| 环节 | 内容 |
|---|---|
| `pnpm validate` | 工具元数据完整性 + locales 键结构一致性（三语言） + registry 覆盖 |
| `pnpm test` | 65 个纯函数用例（node --test） |
| `pnpm lint` | ESLint 0 error |
| `pnpm typecheck` | shared / web / worker 三包 |

构建验证：CI（GitHub Actions quality.yml）在 Linux 干净环境执行 `pnpm build`（本地 Windows build 卡死为已知环境问题，以 CI 为准）。

## 冻结范围

- ✅ 已冻结：i18n 架构（shared 瘦身 / locales / registry / 路由分层 / hreflang / canonical / sitemap / JSON-LD）
- ⏸️ 冻结期不改：6 个工具业务逻辑、路由结构、组件架构
- 🔜 后续阶段：M3 内容系统（MDX）、新增工具、新增语言
