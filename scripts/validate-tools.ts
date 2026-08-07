#!/usr/bin/env node
/**
 * 工具元数据完整性检查脚本（发布质量门禁）
 *
 * 验证 shared TOOL_CONFIGS：
 *  - slug 唯一
 *  - title / description / seoTitle / seoDescription 存在且非空
 *  - category 合法（在 TOOL_CATEGORIES 中）
 *  - keywords 非空数组
 *  - inputLimit 为正数（若配置）
 *
 *  live 工具（status === "live"）必须完整具备三件套，缺一即错误：
 *  - page   ：web/src/app/tools/{slug}/page.tsx
 *  - component：页面 import 的 @/components/tools/*Tool 组件真实存在
 *  - test   ：web/tests/tools/{slug}.test.ts
 *
 *  planned 工具允许缺少 page/component/test（占位阶段），但配置字段必须完整。
 *
 * 运行：node --experimental-strip-types scripts/validate-tools.ts
 * 已纳入 pnpm validate / pnpm check，建议作为 CI 前置门禁。
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_CONFIGS, TOOL_CATEGORIES } from "../shared/src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, "..", "web");

/** 判断组件文件是否存在：读取页面源码，检查其 import 的 *Tool 组件是否真实存在 */
function componentExists(slug: string): boolean {
  const pagePath = join(webDir, "src", "app", "tools", slug, "page.tsx");
  if (!existsSync(pagePath)) return false;
  const source = readFileSync(pagePath, "utf8");
  // 匹配 import { XxxTool } from "@/components/tools/XxxTool"
  const refs = [...source.matchAll(/from\s+"@\/components\/tools\/([\w]+)"/g)].map((m) => m[1]);
  if (refs.length === 0) return false;
  return refs.every((name) => existsSync(join(webDir, "src", "components", "tools", `${name}.tsx`)));
}

/** 判断测试文件是否存在：web/tests/tools/{slug}.test.ts */
function testExists(slug: string): boolean {
  return existsSync(join(webDir, "tests", "tools", `${slug}.test.ts`));
}

const errors: string[] = [];
const warnings: string[] = [];
const seenSlugs = new Set<string>();
const validCategories = new Set(TOOL_CATEGORIES.map((c) => c.id));

for (const tool of TOOL_CONFIGS) {
  const tag = `[${tool.slug}]`;

  // slug 唯一
  if (seenSlugs.has(tool.slug)) {
    errors.push(`${tag} slug 重复`);
  }
  seenSlugs.add(tool.slug);

  // 必填字段非空
  for (const field of ["title", "description", "seoTitle", "seoDescription"] as const) {
    if (!tool[field] || tool[field].trim() === "") {
      errors.push(`${tag} 缺少 ${field}`);
    }
  }

  // category 合法
  if (!validCategories.has(tool.category)) {
    errors.push(`${tag} category 非法：${tool.category}`);
  }

  // keywords 非空
  if (!Array.isArray(tool.keywords) || tool.keywords.length === 0) {
    warnings.push(`${tag} keywords 为空`);
  }

  // inputLimit 正数
  if (tool.inputLimit !== undefined && (!Number.isInteger(tool.inputLimit) || tool.inputLimit <= 0)) {
    errors.push(`${tag} inputLimit 非法：${tool.inputLimit}`);
  }

  // live 工具必须完整具备 page / component / test 三件套
  if (tool.status === "live") {
    const pagePath = join(webDir, "src", "app", "tools", tool.slug, "page.tsx");
    if (!existsSync(pagePath)) {
      errors.push(`${tag} live 工具缺少页面 app/tools/${tool.slug}/page.tsx`);
    }
    if (!componentExists(tool.slug)) {
      errors.push(`${tag} live 工具缺少组件（页面 import 的 @/components/tools/* 不存在）`);
    }
    if (!testExists(tool.slug)) {
      errors.push(`${tag} live 工具缺少测试文件 tests/tools/${tool.slug}.test.ts`);
    }
  }
  // planned 工具允许缺少 page/component/test（由 create-tool 脚手架生成后补齐）
}

// 汇总
console.log(`=== 工具元数据检查（${TOOL_CONFIGS.length} 个工具）===`);
console.log(`slug 唯一性：${seenSlugs.size === TOOL_CONFIGS.length ? "✓" : "✗"}`);

if (errors.length > 0) {
  console.log("\n❌ 错误：");
  errors.forEach((e) => console.log("  " + e));
} else {
  console.log("❌ 错误：无");
}

if (warnings.length > 0) {
  console.log("\n⚠️ 警告：");
  warnings.forEach((w) => console.log("  " + w));
} else {
  console.log("⚠️ 警告：无");
}

if (errors.length > 0) {
  console.log("\n检查未通过（有错误）");
  process.exit(1);
}
console.log("\n检查通过 ✓");
