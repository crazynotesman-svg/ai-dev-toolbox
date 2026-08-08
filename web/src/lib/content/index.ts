import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import type { ToolContent } from "./types";

/**
 * 内容目录根（web/src/content）
 * 结构：content/{locale}/tools/{slug}.mdx
 */
const CONTENT_DIR = join(process.cwd(), "src", "content");

/**
 * 获取工具长内容（SEO 文章型内容）
 *
 * 规则：
 * 1. 优先读取 content/{locale}/tools/{slug}.mdx（frontmatter → ToolContent）
 * 2. 文件不存在 → 返回 null（不影响现有工具页，调用方安全降级）
 * 3. frontmatter 缺失 / 解析失败 → 返回 null（安全降级，不抛错）
 */
export function getToolContent(locale: string, slug: string): ToolContent | null {
  const filePath = join(CONTENT_DIR, locale, "tools", `${slug}.mdx`);
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf8");
    return parseToolContent(raw);
  } catch {
    // 读取/解析失败一律降级为 null，绝不破坏工具页渲染
    return null;
  }
}

/**
 * frontmatter（YAML）→ ToolContent
 * 支持结构（与 types.ts 一致）：
 *   introduction: string | string[]（多行段落 join）
 *   features: [{ title, description }]
 *   guide: [{ step, title, description }]
 *   examples: [{ title, input?, output? }]
 *   useCases: string[]
 *   faqs: [{ question, answer }]
 * 正文（frontmatter 之后）当前阶段不解析渲染，保留在文件中供后续富文本阶段使用。
 */
function parseToolContent(raw: string): ToolContent | null {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  if (!data || Object.keys(data).length === 0) return null;

  const content: ToolContent = {};

  // introduction：支持字符串或多段落数组
  const intro = data.introduction;
  if (typeof intro === "string" && intro.trim()) {
    content.introduction = intro.trim();
  } else if (Array.isArray(intro)) {
    const paragraphs = intro.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
    if (paragraphs.length > 0) content.introduction = paragraphs.join("\n\n");
  }

  // features
  if (Array.isArray(data.features)) {
    content.features = data.features
      .filter((f): f is { title: string; description: string } =>
        Boolean(f && typeof f === "object" && typeof f.title === "string" && typeof f.description === "string"),
      )
      .map((f) => ({ title: f.title, description: f.description }));
    if (content.features.length === 0) delete content.features;
  }

  // guide（step 缺失时按顺序补）
  if (Array.isArray(data.guide)) {
    const steps = data.guide
      .filter(
        (g): g is { step?: number; title: string; description: string } =>
          Boolean(
            g &&
              typeof g === "object" &&
              (g as Record<string, unknown>).title !== undefined &&
              typeof (g as Record<string, unknown>).title === "string" &&
              typeof (g as Record<string, unknown>).description === "string",
          ),
      )
      .map((g, i) => ({
        step: typeof g.step === "number" ? g.step : i + 1,
        title: g.title,
        description: g.description,
      }));
    if (steps.length > 0) content.guide = steps;
  }

  // examples
  if (Array.isArray(data.examples)) {
    content.examples = data.examples
      .filter((e): e is { title: string; input?: string; output?: string } =>
        Boolean(e && typeof e === "object" && typeof e.title === "string"),
      )
      .map((e) => ({
        title: e.title,
        input: typeof e.input === "string" ? e.input : undefined,
        output: typeof e.output === "string" ? e.output : undefined,
      }));
    if (content.examples.length === 0) delete content.examples;
  }

  // useCases
  if (Array.isArray(data.useCases)) {
    const cases = data.useCases.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    if (cases.length > 0) content.useCases = cases;
  }

  // faqs
  if (Array.isArray(data.faqs)) {
    content.faqs = data.faqs
      .filter((f): f is { question: string; answer: string } =>
        Boolean(f && typeof f === "object" && typeof f.question === "string" && typeof f.answer === "string"),
      )
      .map((f) => ({ question: f.question, answer: f.answer }));
    if (content.faqs.length === 0) delete content.faqs;
  }

  // 没有任何有效字段 → null（不产生空内容区块）
  if (Object.keys(content).length === 0) return null;
  return content;
}
