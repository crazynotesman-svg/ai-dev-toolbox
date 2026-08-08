import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
 * 1. 优先读取 content/{locale}/tools/{slug}.mdx
 * 2. 文件不存在 → 返回 null（不影响现有工具页，调用方安全降级）
 * 3. 文件存在但 MDX 解析未接入（M3-2）→ 返回 null（安全降级，不抛错）
 *
 * Phase 1：目录已建立、无 MDX 文件 → 恒返回 null；
 *          MDX 解析管线（@next/mdx + 编译）在 M3-2 接入后启用 parseToolContent。
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
 * MDX → ToolContent 解析
 * M3-2 接入 MDX 编译（@next/mdx / remark-frontmatter 等）后实现：
 * 提取 frontmatter（introduction/features/guide/examples/useCases/faqs）
 * 并解析正文区块。当前：空内容返回 null，非空暂不解析（Phase 1 安全占位）。
 */
function parseToolContent(raw: string): ToolContent | null {
  if (!raw.trim()) return null; // 空内容 → null（防御）
  // TODO(M3-2): MDX frontmatter + 区块解析
  return null;
}
