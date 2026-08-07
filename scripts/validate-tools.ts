#!/usr/bin/env node
/**
 * 工具元数据完整性检查脚本（发布质量门禁）
 *
 * 验证 shared TOOL_CONFIGS（技术元数据）：
 *  - slug 唯一
 *  - category 合法（在 TOOL_CATEGORY_ORDER 中）
 *  - inputLimit 为正数（若配置）
 *  - priority 为非负整数（若配置）
 *
 *  live 工具必须完整具备三件套，缺一即错误：
 *  - page   ：web/src/app/tools/{slug}/page.tsx
 *  - component：web/src/components/tools/registry.ts 中存在映射
 *  - test   ：web/tests/tools/{slug}.test.ts
 *
 *  多语言校验：
 *  - 每个 SUPPORTED_LOCALES 语言文件存在且 JSON 合法
 *  - 每个语言文件的 tools 区块必须覆盖全部 live slug
 *  - 每个语言文件键结构与 en.json 一致（防漏翻译）
 *
 *  planned 工具允许缺少 page/component/test（占位阶段），但技术字段必须完整。
 *
 * 运行：node --experimental-strip-types scripts/validate-tools.ts
 * 已纳入 pnpm validate / pnpm check。
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_CONFIGS, SUPPORTED_LOCALES, TOOL_CATEGORY_ORDER } from "../shared/src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, "..", "web");

/** registry 中声明的 slug 集合（读取 registry.ts 源码中的键） */
function registrySlugs(): Set<string> {
  const registryFile = join(webDir, "src", "components", "tools", "registry.ts");
  if (!existsSync(registryFile)) return new Set();
  const source = readFileSync(registryFile, "utf8");
  const slugs = new Set<string>();
  for (const m of source.matchAll(/"([a-z0-9-]+)":/g)) {
    slugs.add(m[1]);
  }
  return slugs;
}

/** 判断测试文件是否存在：web/tests/tools/{slug}.test.ts */
function testExists(slug: string): boolean {
  return existsSync(join(webDir, "tests", "tools", `${slug}.test.ts`));
}

/** 加载语言字典，返回解析结果 */
function loadLocale(locale: string): { ok: boolean; data?: Record<string, unknown>; error?: string } {
  const file = join(webDir, "src", "locales", `${locale}.json`);
  if (!existsSync(file)) return { ok: false, error: `语言文件缺失 src/locales/${locale}.json` };
  try {
    return { ok: true, data: JSON.parse(readFileSync(file, "utf8")) };
  } catch (e) {
    return { ok: false, error: `语言文件 JSON 解析失败：${(e as Error).message}` };
  }
}

const errors: string[] = [];
const warnings: string[] = [];
const seenSlugs = new Set<string>();
const validCategories = new Set<string>(TOOL_CATEGORY_ORDER);

// ---------- 1. 工具技术元数据校验 ----------
for (const tool of TOOL_CONFIGS) {
  const tag = `[${tool.slug}]`;

  if (seenSlugs.has(tool.slug)) errors.push(`${tag} slug 重复`);
  seenSlugs.add(tool.slug);

  if (!validCategories.has(tool.category)) {
    errors.push(`${tag} category 非法：${tool.category}`);
  }

  if (tool.inputLimit !== undefined && (!Number.isInteger(tool.inputLimit) || tool.inputLimit <= 0)) {
    errors.push(`${tag} inputLimit 非法：${tool.inputLimit}`);
  }

  if (tool.priority !== undefined && (!Number.isInteger(tool.priority) || tool.priority < 0)) {
    errors.push(`${tag} priority 非法：${tool.priority}（应为非负整数）`);
  }

  if (tool.status === "live") {
    const pagePath = join(webDir, "src", "app", "tools", tool.slug, "page.tsx");
    if (!existsSync(pagePath)) {
      errors.push(`${tag} live 工具缺少页面 app/tools/${tool.slug}/page.tsx`);
    }
    if (!testExists(tool.slug)) {
      errors.push(`${tag} live 工具缺少测试文件 tests/tools/${tool.slug}.test.ts`);
    }
  }
  // planned 工具允许缺少 page/component/test（脚手架生成后补齐）
}

// ---------- 2. registry 覆盖校验（live 工具必须有组件映射） ----------
const registry = registrySlugs();
for (const tool of TOOL_CONFIGS) {
  if (tool.status === "live" && !registry.has(tool.slug)) {
    errors.push(`[${tool.slug}] live 工具缺少 registry 组件映射（components/tools/registry.ts）`);
  }
}
// registry 中映射的工具必须在 TOOL_CONFIGS 中存在
for (const slug of registry) {
  if (!TOOL_CONFIGS.some((t) => t.slug === slug)) {
    warnings.push(`[${slug}] registry 中存在但 TOOL_CONFIGS 未定义`);
  }
}

// ---------- 3. 多语言校验（SUPPORTED_LOCALES 完整性） ----------
const enLocale = loadLocale("en");
if (!enLocale.ok) {
  errors.push(`语言基准 en 缺失：${enLocale.error}`);
} else {
  const enTools = (enLocale.data!.tools as Record<string, unknown>) ?? {};
  const enKeys = (o: Record<string, unknown>) => Object.keys(o).sort();

  for (const locale of SUPPORTED_LOCALES) {
    const result = loadLocale(locale.code);
    if (!result.ok) {
      errors.push(`[${locale.code}] ${result.error}`);
      continue;
    }
    const dict = result.data!;
    // 工具覆盖校验：每个 live slug 必须有本地化内容
    for (const tool of TOOL_CONFIGS) {
      if (tool.status !== "live") continue;
      const content = (dict.tools as Record<string, unknown> | undefined)?.[tool.slug];
      if (!content) {
        errors.push(`[${locale.code}] 缺少工具 ${tool.slug} 的本地化内容`);
        continue;
      }
      // 键结构一致性（与 en 基准对比）
      const enTool = enTools[tool.slug] as Record<string, unknown>;
      if (enTool && enKeys(enTool).join(",") !== enKeys(content as Record<string, unknown>).join(",")) {
        errors.push(`[${locale.code}] 工具 ${tool.slug} 键结构与 en 不一致`);
      }
    }
    // 顶层区块键一致性
    const enTopKeys = enKeys(enLocale.data!);
    const topKeys = enKeys(dict);
    const missingTop = enTopKeys.filter((k) => !topKeys.includes(k));
    if (missingTop.length > 0) {
      errors.push(`[${locale.code}] 缺失顶层区块：${missingTop.join(", ")}`);
    }
  }
}

// ---------- 汇总 ----------
console.log(`=== 工具元数据检查（${TOOL_CONFIGS.length} 个工具，${SUPPORTED_LOCALES.length} 种语言）===`);
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
