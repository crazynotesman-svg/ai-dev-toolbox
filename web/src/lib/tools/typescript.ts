/**
 * JSON → TypeScript 类型生成纯函数（客户端本地执行）
 * 支持：string / number / boolean / null / array / nested object
 * 支持：interface 名称自定义、interface | type 两种风格
 */

import { validateJson, isEmpty } from "./json.ts";

export type TsStyle = "interface" | "type";

export interface TypeScriptOptions {
  /** 根接口名（自定义） */
  rootName: string;
  /** 输出风格：interface | type */
  style: TsStyle;
}

export type TypeScriptResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

/** 默认根接口名 */
export const DEFAULT_ROOT_NAME = "RootObject";

/** key → 合法的 TypeScript 类型名（PascalCase） */
function toTypeName(key: string): string {
  const parts = key
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1));
  if (parts.length === 0) return "Object";
  let name = parts.join("");
  // 首字符不能是数字，加下划线前缀
  if (/^[0-9]/.test(name)) name = "_" + name;
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
  /** 已生成的命名类型（嵌套对象） */
  namedTypes: { name: string; body: string }[];
  /** 已占用类型名 */
  usedNames: Set<string>;
  style: TsStyle;
  /** 结构签名缓存：相同结构的对象复用同一类型名（如数组同构元素） */
  structureCache: Map<string, string>;
}

/** 值 → 类型 token（递归，忽略具体值，只保留类型结构） */
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

/** 对象结构签名（字段名 + 类型 token，用于复用同构类型） */
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

/** 将对象渲染为类型 body（字段行），嵌套对象递归入 namedTypes */
function renderObjectBody(
  obj: Record<string, unknown>,
  ctx: GenerateContext,
): string {
  const lines = Object.entries(obj).map(([key, val]) => {
    // 字段名需为合法标识符，否则加引号
    const fieldName = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `"${key}"`;
    return `  ${fieldName}: ${inferType(val, key, ctx)};`;
  });
  return lines.join("\n");
}

/** 递归推断类型；namedHint 用于生成嵌套类型名 */
function inferType(
  value: unknown,
  namedHint: string,
  ctx: GenerateContext,
): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const elementTypes = new Set(
      value.map((item) => inferType(item, namedHint, ctx)),
    );
    // 同构数组：单一元素类型；异构数组：联合类型
    if (elementTypes.size === 1) {
      return `${[...elementTypes][0]}[]`;
    }
    return `(${[...elementTypes].join(" | ")})[]`;
  }
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object": {
      // 空对象：无法推断字段，退化为 Record<string, unknown>
      if (isEmptyObject(value)) return "Record<string, unknown>";
      // 结构缓存：相同结构（字段名+值类型）复用已有类型名
      const sig = objectSignature(value as Record<string, unknown>);
      const cached = ctx.structureCache.get(sig);
      if (cached) return cached;
      const name = dedupe(toTypeName(namedHint), ctx.usedNames);
      ctx.structureCache.set(sig, name);
      ctx.namedTypes.push({ name, body: renderObjectBody(value as Record<string, unknown>, ctx) });
      return name;
    }
    default:
      return "unknown";
  }
}

/** 按风格渲染命名类型 */
function renderNamedType(name: string, body: string, style: TsStyle): string {
  return style === "interface"
    ? `export interface ${name} {\n${body}\n}`
    : `export type ${name} = {\n${body}\n};`;
}

/** JSON → TypeScript 类型 */
export function jsonToTypeScript(
  input: string,
  options?: Partial<TypeScriptOptions>,
): TypeScriptResult {
  const opts: TypeScriptOptions = {
    rootName: options?.rootName?.trim() || DEFAULT_ROOT_NAME,
    style: options?.style ?? "interface",
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

  const rootTypeName = dedupe(toTypeName(opts.rootName), new Set());
  const ctx: GenerateContext = {
    namedTypes: [],
    usedNames: new Set([rootTypeName]),
    style: opts.style,
    structureCache: new Map(),
  };

  // 根值是普通对象：生成根接口（不经过 inferType 的 dedupe，避免根名被改名）
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isEmptyObject(value)
  ) {
    const rootBody = renderObjectBody(value as Record<string, unknown>, ctx);
    const blocks = [
      renderNamedType(rootTypeName, rootBody, opts.style),
      ...ctx.namedTypes.map((t) => renderNamedType(t.name, t.body, opts.style)),
    ];
    return { ok: true, output: blocks.join("\n\n") };
  }

  // 根值是数组/标量/空对象：生成根类型别名引用
  const rootType = inferType(value, opts.rootName, ctx);
  const rootAlias = `export type ${rootTypeName} = ${rootType};`;
  const blocks = [
    rootAlias,
    ...ctx.namedTypes.map((t) => renderNamedType(t.name, t.body, opts.style)),
  ];
  return { ok: true, output: blocks.join("\n\n") };
}
