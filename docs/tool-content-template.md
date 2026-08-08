# Tool Content Template（工具内容模板）

> 内容系统数据源规范：`content/{locale}/tools/{slug}.mdx`（frontmatter）
> 链路：`MDX → gray-matter → ToolContent → validate → Renderer → FAQ JSON-LD`
> 参考样板：`content/en/tools/json-formatter.mdx`、`content/en/tools/base64-encoder.mdx`

---

## Introduction（介绍）

**用途**：页面 Introduction 区块（SEO 长文价值主张）。

**写法**：
- 面向真实搜索用户，自然覆盖该工具的核心搜索词
- 至少 **2 段**，每段 2-4 句
- 第 1 段：工具是什么 + 为什么需要（场景）
- 第 2 段：本工具的价值主张（本地处理 / 免费 / 免登录 / 特色能力）

**SEO 注意事项**：
- 自然融入关键词（如 "encode text"、"decode base64"），**不要关键词堆积**
- 每段一个主题，避免段落过长

## Features（功能）

**格式**：

```yaml
features:
  - title: Beautify JSON with clean indentation
    description: One click converts compressed JSON into readable structure...
```

**数量建议**：**3-6 项**（样板使用 4 项）
- 每项 title 一句话（含能力关键词），description 2-3 句解释价值

## Guide（教程）

**格式**：

```yaml
guide:
  - step: 1
    title: Paste your JSON
    description: Type or paste your JSON text into the input area...
```

**规则**：
- `step` 必须**连续**（1 → 2 → 3，`validateToolContent` 会检查不连续）
- 数量建议 **3 步**（样板固定 3 步）
- 每步 title 短、description 含操作细节

## Examples（示例）

**格式**：

```yaml
examples:
  - title: Format a minified API response
    input: |
      {"name":"tool"}
    output: |
      {
        "name": "tool"
      }
```

**规则**：
- 至少 **2 个**（`validateToolContent` 检查 ≥1）
- input/output 用 YAML `|` 块保留原始格式（代码/JSON/文本）
- 示例需真实可复现

## Use Cases（使用场景）

**格式**：

```yaml
useCases:
  - Debugging raw API responses during development
  - Encoding text before embedding in a data URL
```

**规则**：
- 至少 **4 项**（长尾 SEO 关键词承载）
- 每项一句话，动词开头

## FAQ（常见问题）

**格式**：

```yaml
faqs:
  - question: Is the tool free to use?
    answer: Yes, the tool is completely free...
```

**规则**：
- 至少 **2 项**（样板使用 4 项）
- question 用用户真实提问口吻；answer 明确、具体
- 内容 FAQ 会自动合并进页面 FAQPage JSON-LD（与 locales faqs 合并）

## SEO Keywords（附加关键词）

**格式**：

```yaml
seo:
  keywords:
    - base64 encoder
    - decode base64
```

**说明**：
- **辅助字段**（schema v2）：内容级附加关键词
- **不替代 metadata**：页面主要 title/description/keywords 仍来自 `locales/{lang}.json`
- 用于补充内容特有长尾词

---

## 发布检查（完成一个内容后）

1. **validateToolContent**（内容结构）：

```bash
cd web && node --experimental-strip-types -e "
import { getToolContent } from './src/lib/content/index.ts';
import { validateToolContent } from './src/lib/content/validate.ts';
const c = getToolContent('en', '<slug>');
console.log(validateToolContent(c));
"
```

期望：`valid: true`（warnings 为空）

2. **pnpm check**（发布门禁）：

```bash
pnpm check   # validate + test + lint + typecheck
```

3. **页面 SSR 验证**（build/部署后）：

```bash
curl https://ai-dev-toolbox.pages.dev/tools/<slug> | grep -o "Introduction\|Features\|Examples\|FAQ"
```

确认内容区出现在 **SSR HTML**（非 hydration 后出现）。

4. **内容变更文件清单**（提交前确认）：

```bash
git diff --name-only   # 应只含 content/{locale}/tools/<slug>.mdx 及必要的模板/文档
```

---

## 内容生产检查项速查

| 字段 | 最低要求 | 建议 |
|---|---|---|
| introduction | 存在 | ≥2 段 |
| features | — | 3-6 项 |
| guide | — | 3 步（step 连续） |
| examples | ≥1 | ≥2 |
| useCases | — | ≥4 |
| faqs | — | ≥2（建议 4） |
| seo.keywords | — | 3-5 个 |
