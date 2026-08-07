/**
 * JSON → Java POJO 类生成纯函数（客户端本地执行）
 * 支持：基础类型映射 / nested object / array 对象 / 类名自定义
 * 输出：字段 + getter/setter + 嵌套 static class + 必要 import
 */

import { validateJson, isEmpty } from "./json.ts";

export interface JavaOptions {
  /** 根类名（自定义） */
  className: string;
}

export type JavaResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

/** 默认根类名 */
export const DEFAULT_CLASS_NAME = "RootObject";

/** Java 关键字：字段/类名冲突时加下划线后缀 */
const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while",
]);

/** key → 合法的 Java 类名（PascalCase） */
function toClassName(key: string): string {
  const parts = key
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1));
  if (parts.length === 0) return "Object";
  let name = parts.join("");
  if (/^[0-9]/.test(name)) name = "_" + name;
  return name;
}

/** key → 合法的 Java 字段名（camelCase），关键字加 _ 后缀 */
function toFieldName(key: string): string {
  const parts = key
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)));
  if (parts.length === 0) return "value";
  let name = parts.join("");
  if (/^[0-9]/.test(name)) name = "_" + name;
  if (JAVA_KEYWORDS.has(name)) name += "_";
  return name;
}

/** 去重：重名类型追加序号 */
function dedupe(name: string, used: Set<string>): string {
  let candidate = name;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${name}${i++}`;
  }
  used.add(candidate);
  return candidate;
}

/** 判断值是否为空对象 */
function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

interface GenerateContext {
  /** 已生成的嵌套类 */
  nestedClasses: { name: string; body: string }[];
  /** 已占用类名 */
  usedNames: Set<string>;
  /** 结构签名缓存：同构对象复用同一类名 */
  structureCache: Map<string, string>;
}

/** 值 → 类型 token（递归，只保留类型结构） */
function typeToken(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return "[" + value.map(typeToken).join(",") + "]";
  }
  if (typeof value === "object") {
    return objectSignature(value as Record<string, unknown>);
  }
  return typeof value;
}

/** 对象结构签名（字段名 + 类型 token） */
function objectSignature(value: Record<string, unknown>): string {
  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((k) => k + ":" + typeToken(value[k]))
      .join(",") +
    "}"
  );
}

/** JSON 值 → Java 类型 */
function inferJavaType(value: unknown, hint: string, ctx: GenerateContext): string {
  if (value === null) return "Object";
  if (Array.isArray(value)) {
    if (value.length === 0) return "List<Object>";
    const elementTypes = new Set(value.map((item) => inferJavaType(item, hint, ctx)));
    // 同构数组：单一元素类型；异构数组：Object
    if (elementTypes.size === 1) {
      return `List<${[...elementTypes][0]}>`;
    }
    return "List<Object>";
  }
  switch (typeof value) {
    case "string":
      return "String";
    case "boolean":
      return "Boolean";
    case "number": {
      // 整数：int 范围内用 Integer，超范围用 Long；小数用 Double
      if (Number.isInteger(value)) {
        const n = value as number;
        return n >= -2147483648 && n <= 2147483647 ? "Integer" : "Long";
      }
      return "Double";
    }
    case "object": {
      if (isEmptyObject(value)) return "Object";
      const sig = objectSignature(value as Record<string, unknown>);
      const cached = ctx.structureCache.get(sig);
      if (cached) return cached;
      const name = dedupe(toClassName(hint), ctx.usedNames);
      ctx.structureCache.set(sig, name);
      ctx.nestedClasses.push({ name, body: renderClassBody(value as Record<string, unknown>, ctx) });
      return name;
    }
    default:
      return "Object";
  }
}

/** 生成一个类的字段与 getter/setter（不包含嵌套类定义） */
function renderClassBody(
  obj: Record<string, unknown>,
  ctx: GenerateContext,
): string {
  // 先解析字段类型（会顺带注册嵌套类）
  const fields = Object.entries(obj).map(([key, val]) => ({
    name: toFieldName(key),
    type: inferJavaType(val, key, ctx),
  }));

  const fieldLines = fields.map((f) => `  private ${f.type} ${f.name};`);

  const accessorLines: string[] = [];
  for (const f of fields) {
    const upper = f.name[0].toUpperCase() + f.name.slice(1);
    accessorLines.push(
      "",
      `  public ${f.type} get${upper}() {`,
      `    return ${f.name};`,
      `  }`,
      "",
      `  public void set${upper}(${f.type} ${f.name}) {`,
      `    this.${f.name} = ${f.name};`,
      `  }`,
    );
  }
  return [...fieldLines, ...accessorLines].join("\n").replace(/\n{3,}/g, "\n\n");
}

/** JSON → Java POJO */
export function jsonToJava(input: string, options?: Partial<JavaOptions>): JavaResult {
  const opts: JavaOptions = {
    className: options?.className?.trim() || DEFAULT_CLASS_NAME,
  };

  if (isEmpty(input)) {
    return { ok: false, error: "输入内容为空，请粘贴 JSON 数据" };
  }
  const validation = validateJson(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error.message };
  }

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return { ok: false, error: "无法解析的 JSON" };
  }

  const rootClassName = dedupe(toClassName(opts.className), new Set());
  const ctx: GenerateContext = {
    nestedClasses: [],
    usedNames: new Set([rootClassName]),
    structureCache: new Map(),
  };

  // 根值不是普通对象（数组/标量）：生成一个持有字段的包装类
  const isPlainObject =
    typeof value === "object" && value !== null && !Array.isArray(value) && !isEmptyObject(value);

  if (!isPlainObject) {
    // 用一个虚拟包装：把根值作为字段 "data"
    const wrapper: Record<string, unknown> = { data: value };
    const body = renderClassBody(wrapper, ctx);
    const blocks = [
      `public class ${rootClassName} {`,
      body,
      ...ctx.nestedClasses.map((c) => `\n  public static class ${c.name} {\n${c.body}\n  }`),
      `}`,
    ];
    return { ok: true, output: blocks.join("\n") };
  }

  const body = renderClassBody(value as Record<string, unknown>, ctx);
  const nestedBlock = ctx.nestedClasses
    .map((c) => `\n  public static class ${c.name} {\n${c.body}\n  }`)
    .join("\n");

  const needsListImport = /List</.test(body) || /List</.test(nestedBlock);
  const imports = needsListImport ? "import java.util.List;\n\n" : "";
  const output = `${imports}public class ${rootClassName} {\n${body}${nestedBlock}\n}`;
  return { ok: true, output };
}
