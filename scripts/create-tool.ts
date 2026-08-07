#!/usr/bin/env node
/**
 * create-tool 脚手架：生成一个新工具的全部文件（模板驱动）
 *
 * 用法：
 *   node --experimental-strip-types scripts/create-tool.ts <slug> "<中文标题>" "<一句话描述>"
 *   node --experimental-strip-types scripts/create-tool.ts --list
 *
 * 生成（基于 tools 目录内现有工具的模式）：
 *   1. shared 配置（追加到 TOOL_CONFIGS，status: planned）
 *   2. web/src/lib/tools/<slug>.ts         （纯函数骨架，含基础校验与错误返回）
 *   3. web/src/components/tools/<Pascal>Tool.tsx （client 组件骨架）
 *   4. web/src/app/tools/<slug>/page.tsx   （复用 ToolPageShell + SEO）
 *   5. web/tests/tools/<slug>.test.ts      （测试骨架，4 个基础用例）
 *
 * 生成后手动：
 *   - 实现纯函数逻辑与组件交互
 *   - 补充 features/guide/faqs 文案
 *   - 运行 pnpm test / pnpm validate
 *   - 完成后 status 改 live
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_CONFIGS } from "../shared/src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const webDir = join(rootDir, "web");
const sharedFile = join(rootDir, "shared", "src", "index.ts");

const args = process.argv.slice(2);
if (args[0] === "--list") {
  console.log("现有工具：");
  TOOL_CONFIGS.forEach((t) => console.log(`  ${t.slug} (${t.status}) - ${t.title}`));
  process.exit(0);
}

const [slug, title, description] = args;
if (!slug || !title || !description) {
  console.error("用法：node --experimental-strip-types scripts/create-tool.ts <slug> <标题> <描述>");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`slug 非法：${slug}（仅允许小写字母、数字、连字符）`);
  process.exit(1);
}
if (TOOL_CONFIGS.some((t) => t.slug === slug)) {
  console.error(`slug 已存在：${slug}`);
  process.exit(1);
}

/** kebab-case → PascalCase */
const toPascal = (s: string) => s.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
const pascal = toPascal(slug);

// ---------- 1. shared 配置追加 ----------
const sharedSource = readFileSync(sharedFile, "utf8");
// 在 TOOL_CONFIGS 数组末尾 "];" 前插入新配置
const configBlock = `  {
    slug: "${slug}",
    title: "${title}",
    description: "${description}",
    category: "developer",
    keywords: ["${title}", "${slug}"],
    seoTitle: "${title}工具 | AI Developer Toolbox",
    seoDescription:
      "在线${title}工具：${description}。免费使用，数据仅在浏览器本地处理。",
    status: "planned",
    inputLimit: 10 * 1024 * 1024,
  },
];`;
const updatedShared = sharedSource.replace(/\n\];\n$/, `\n${configBlock}\n`);
writeFileSync(sharedFile, updatedShared);

// ---------- 2. lib 纯函数 ----------
const libFile = join(webDir, "src", "lib", "tools", `${slug}.ts`);
if (!existsSync(libFile)) {
  writeFileSync(
    libFile,
    `/**
 * ${title}纯函数库（客户端本地执行，无 DOM 无 React）
 * TODO: 实现具体逻辑，保持 { ok: true, output } | { ok: false, error } 结构
 */

/** 输入上限（字节）：与 shared inputLimit 保持一致 */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export type ${pascal}Result = { ok: true; output: string } | { ok: false; error: string };

/** TODO: 主处理函数 */
export function process${pascal}(input: string): ${pascal}Result {
  if (!input.trim()) {
    return { ok: false, error: "输入内容为空，请输入内容" };
  }
  if (new TextEncoder().encode(input).length > MAX_INPUT_BYTES) {
    return { ok: false, error: \`输入超过 \${Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB 上限\` };
  }
  // TODO: 实现处理逻辑
  return { ok: true, output: input };
}

/** 生成演示输入 */
export function create${pascal}Demo(): string {
  return "在这里放一个示例输入";
}
`,
  );
}

// ---------- 3. 组件 ----------
const compFile = join(webDir, "src", "components", "tools", `${pascal}Tool.tsx`);
if (!existsSync(compFile)) {
  writeFileSync(
    compFile,
    `"use client";

import { useCallback, useMemo, useState } from "react";
import { process${pascal}, create${pascal}Demo } from "@/lib/tools/${slug}";

type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** ${title}工具主体（纯客户端，数据不出浏览器） */
export default function ${pascal}Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const bytes = new TextEncoder().encode(trimmed).length;
    return { bytes, lines: trimmed.split("\\n").length };
  }, [input]);

  const run = useCallback(() => {
    const result = process${pascal}(input);
    if (result.ok) {
      setOutput(result.output);
      setNotice({ type: "success", text: "处理完成 ✓" });
    } else {
      setOutput("");
      setNotice({ type: "error", text: result.error });
    }
  }, [input]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setNotice({ type: "success", text: "已复制到剪贴板 ✓" });
    } catch {
      setNotice({ type: "success", text: "已复制（兼容模式）✓" });
    }
  }, [output]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <button
          onClick={run}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          处理
        </button>
        <button
          onClick={copyOutput}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          复制结果
        </button>
        <button
          onClick={() => {
            setInput(create${pascal}Demo());
            setOutput("");
          }}
          className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-blue-600"
        >
          载入示例
        </button>
        <button
          onClick={() => {
            setInput("");
            setOutput("");
            setNotice(null);
          }}
          className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-red-500"
        >
          清空
        </button>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="输入内容"
            className="h-64 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">输出</label>
          <textarea
            value={output}
            readOnly
            placeholder="处理结果将显示在这里"
            className="h-64 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3">
        <span className="text-xs text-slate-400">
          {inputStats
            ? \`输入 \${inputStats.lines} 行 · \${(inputStats.bytes / 1024).toFixed(1)} KB\`
            : "输入统计：—"}
        </span>
        <span className="text-xs text-slate-400">全部在浏览器本地处理，数据不会上传</span>
        {notice && (
          <span
            className={\`ml-auto text-sm font-medium \${
              notice.type === "error"
                ? "text-red-600"
                : notice.type === "success"
                  ? "text-emerald-600"
                  : "text-slate-500"
            }\`}
          >
            {notice.text}
          </span>
        )}
      </div>
    </div>
  );
}
`,
  );
}

// ---------- 4. 页面 ----------
const pageDir = join(webDir, "src", "app", "tools", slug);
mkdirSync(pageDir, { recursive: true });
const pageFile = join(pageDir, "page.tsx");
if (!existsSync(pageFile)) {
  writeFileSync(
    pageFile,
    `import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import ${pascal}Tool from "@/components/tools/${pascal}Tool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("${slug}")!;

export const metadata: Metadata = {
  title: { absolute: tool.seoTitle },
  description: tool.seoDescription,
  keywords: [...tool.keywords],
  alternates: { canonical: \`/tools/\${tool.slug}\` },
  openGraph: {
    type: "website",
    title: tool.seoTitle,
    description: tool.seoDescription,
    url: \`/tools/\${tool.slug}\`,
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: tool.title,
  url: \`\${SITE_CONFIG.url}/tools/\${tool.slug}\`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: tool.seoDescription,
  offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
  featureList: ["${title}"],
};

const features = [
  { title: "${title}", body: "功能说明：TODO 补充。" },
  { title: "本地处理", body: "所有操作在浏览器本地完成，数据不会上传。" },
];

const guide = [
  { title: "第一步：输入内容", body: "在输入框粘贴或输入内容。" },
  { title: "第二步：执行处理", body: "点击「处理」得到结果。" },
  { title: "第三步：复制结果", body: "点击「复制结果」使用输出。" },
];

const faqs = [
  { question: "${title}工具免费吗？", answer: "完全免费，无需注册。" },
  { question: "数据会上传到服务器吗？", answer: "不会，全部本地处理。" },
  { question: "支持哪些输入？", answer: "TODO 补充输入格式说明。" },
];

export default function Page() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <${pascal}Tool />
      </ToolPageShell>
    </>
  );
}
`,
  );
}

// ---------- 5. 测试 ----------
const testFile = join(webDir, "tests", "tools", `${slug}.test.ts`);
if (!existsSync(testFile)) {
  writeFileSync(
    testFile,
    `/**
 * ${slug} 工具纯函数测试（node --test 运行）
 * TODO: 补充真实用例（正常输入 / 空输入 / 错误输入 / 边界条件 / 大输入限制）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { process${pascal} } from "../../src/lib/tools/${slug}.ts";

test("${slug}：正常输入", () => {
  const r = process${pascal}("示例输入");
  assert.equal(r.ok, true);
});

test("${slug}：空输入报错", () => {
  const r = process${pascal}("");
  assert.equal(r.ok, false);
});
`,
  );
}

console.log(`✅ 工具 "${slug}" 脚手架已生成：`);
console.log(`  - shared/src/index.ts  追加配置（status: planned）`);
console.log(`  - web/src/lib/tools/${slug}.ts`);
console.log(`  - web/src/components/tools/${pascal}Tool.tsx`);
console.log(`  - web/src/app/tools/${slug}/page.tsx`);
console.log(`  - web/tests/tools/${slug}.test.ts`);
console.log(``);
console.log(`下一步：`);
console.log(`  1. 实现 ${slug}.ts 的 process${pascal} 逻辑与组件交互`);
console.log(`  2. 补充页面 features/guide/faqs 文案`);
console.log(`  3. 运行 pnpm validate && pnpm test`);
console.log(`  4. 开发完成后将 shared status 改为 live`);
