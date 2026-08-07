/**
 * JSON 结构分析纯函数（客户端本地执行）
 * 输入 JSON string → 输出结构分析结果
 * 支持：object / array / primitive / nested object / mixed array
 * 错误定位复用 json.ts 的 locateJsonError（行列号 + 附近文本）
 */

import { validateJson, isEmpty, locateJsonError } from "./json.ts";

/** 字段类型统计项 */
export interface TypeStat {
  type: string;
  count: number;
}

/** 数组分析结果 */
export interface ArrayAnalysis {
  /** 数组字段数量 */
  count: number;
  /** 数组元素类型分布（去重） */
  elementTypes: TypeStat[];
  /** 最大数组长度 */
  maxLength: number;
}

/** 敏感字段提示 */
export interface SensitiveField {
  /** 字段路径，如 user.password */
  path: string;
  /** 字段名 */
  field: string;
  /** 风险等级 */
  level: "high" | "medium";
}

/** 结构分析结果 */
export interface JsonExplainResult {
  /** JSON 是否有效 */
  valid: boolean;
  /** 根类型 */
  rootType: "object" | "array" | "string" | "number" | "boolean" | "null";
  /** 顶层字段数量（object 为 key 数，array 为元素数） */
  topLevelCount: number;
  /** 全部字段数量（递归统计 object 的 key 总数） */
  totalFieldCount: number;
  /** 最大嵌套深度（根为 1） */
  maxDepth: number;
  /** 字段类型统计（所有值节点，根除外） */
  typeStats: TypeStat[];
  /** 数组分析 */
  arrayAnalysis: ArrayAnalysis;
  /** 空值（null）统计 */
  nullCount: number;
  /** 敏感字段提示 */
  sensitiveFields: SensitiveField[];
  /** 处理耗时（ms） */
  elapsedMs: number;
}

export type JsonExplainResultType =
  | { ok: true; data: JsonExplainResult }
  | { ok: false; error: { message: string; line?: number; column?: number; context?: string } };

/** 获取错误位置附近文本（前后各 12 字符） */
function errorContext(input: string, position: number): string {
  const start = Math.max(0, position - 12);
  const end = Math.min(input.length, position + 12);
  const before = position > start ? "…" : "";
  const after = position < end ? "…" : "";
  return `${before}${input.slice(start, end)}${after}`;
}

/** 敏感字段关键词 → 风险等级 */
const SENSITIVE_RULES: { pattern: RegExp; level: "high" | "medium" }[] = [
  { pattern: /pass(word|wd)?$/i, level: "high" },
  { pattern: /secret$/i, level: "high" },
  { pattern: /(access|refresh)_?token$/i, level: "high" },
  { pattern: /token$/i, level: "medium" },
  { pattern: /api[_-]?key$/i, level: "high" },
  { pattern: /key$/i, level: "medium" },
  { pattern: /authorization$/i, level: "high" },
  { pattern: /credit[_-]?card/i, level: "high" },
  { pattern: /card[_-]?number/i, level: "high" },
  { pattern: /cvv/i, level: "high" },
  { pattern: /(id[_-]?card|identity[_-]?number|ssn|social[_-]?security)/i, level: "high" },
  { pattern: /phone|mobile$/i, level: "medium" },
  { pattern: /email/i, level: "medium" },
  { pattern: /birth(date|day)?/i, level: "medium" },
  { pattern: /address$/i, level: "medium" },
];

/** 判断字段名是否敏感 */
function isSensitive(field: string): { level: "high" | "medium" } | null {
  for (const rule of SENSITIVE_RULES) {
    if (rule.pattern.test(field)) return { level: rule.level };
  }
  return null;
}

interface TraverseState {
  totalFieldCount: number;
  maxDepth: number;
  nullCount: number;
  typeStats: Map<string, number>;
  arrayCount: number;
  arrayElementTypes: Map<string, number>;
  maxArrayLength: number;
  sensitiveFields: SensitiveField[];
}

function typeName(value: unknown): "object" | "array" | "string" | "number" | "boolean" | "null" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "object";
  }
}

/** 递归遍历并收集统计 */
function traverse(value: unknown, path: string, depth: number, state: TraverseState): void {
  if (depth > state.maxDepth) state.maxDepth = depth;

  if (Array.isArray(value)) {
    state.arrayCount += 1;
    if (value.length > state.maxArrayLength) state.maxArrayLength = value.length;
    for (const item of value) {
      const t = typeName(item);
      state.arrayElementTypes.set(t, (state.arrayElementTypes.get(t) ?? 0) + 1);
      traverse(item, `${path}[]`, depth + 1, state);
    }
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      state.totalFieldCount += 1;
      const fullPath = path ? `${path}.${key}` : key;
      const sensitive = isSensitive(key);
      if (sensitive) {
        state.sensitiveFields.push({ path: fullPath, field: key, level: sensitive.level });
      }
      const t = typeName(val);
      state.typeStats.set(t, (state.typeStats.get(t) ?? 0) + 1);
      if (val === null) state.nullCount += 1;
      traverse(val, fullPath, depth + 1, state);
    }
    return;
  }

  // 原始类型：已在上层统计，这里仅处理 null 的深度场景
  if (value === null) state.nullCount += 1;
}

/** 解析 JSON 并输出结构分析 */
export function explainJson(input: string): JsonExplainResultType {
  const startedAt = performance.now();

  if (isEmpty(input)) {
    return { ok: false, error: { message: "Input is empty, please paste JSON data" } };
  }
  const validation = validateJson(input);
  if (!validation.ok) {
    // 复用 json.ts 的错误定位：行号/列号 + 附近文本
    const position = locateJsonError(input);
    const context = position >= 0 ? errorContext(input, position) : undefined;
    return {
      ok: false,
      error: {
        message: validation.error.message,
        line: validation.error.line,
        column: validation.error.column,
        context,
      },
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return { ok: false, error: { message: "Unable to parse JSON" } };
  }

  const rootType = typeName(value);
  const state: TraverseState = {
    totalFieldCount: 0,
    maxDepth: 1,
    nullCount: 0,
    typeStats: new Map(),
    arrayCount: 0,
    arrayElementTypes: new Map(),
    maxArrayLength: 0,
    sensitiveFields: [],
  };

  // 根节点：计入深度与类型统计，但不计入 totalFieldCount（那是字段数）
  traverse(value, "", 1, state);

  const topLevelCount =
    rootType === "object"
      ? Object.keys(value as Record<string, unknown>).length
      : rootType === "array"
        ? (value as unknown[]).length
        : 1;

  const typeStats: TypeStat[] = [...state.typeStats.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const elementTypes: TypeStat[] = [...state.arrayElementTypes.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const elapsedMs = Math.round((performance.now() - startedAt) * 100) / 100;

  return {
    ok: true,
    data: {
      valid: true,
      rootType,
      topLevelCount,
      totalFieldCount: state.totalFieldCount,
      maxDepth: state.maxDepth,
      typeStats,
      arrayAnalysis: {
        count: state.arrayCount,
        elementTypes,
        maxLength: state.maxArrayLength,
      },
      nullCount: state.nullCount,
      sensitiveFields: state.sensitiveFields,
      elapsedMs,
    },
  };
}

/** 生成演示 JSON（覆盖 object/array/nested/mixed） */
export function createExplainDemo(): string {
  return JSON.stringify(
    {
      user: {
        id: 42,
        name: "Alice",
        email: "alice@example.com",
        password: "secret-hash",
        profile: {
          age: 30,
          isActive: true,
          address: { city: "Beijing", zip: "100000" },
        },
      },
      roles: ["admin", "editor", "viewer"],
      stats: [1, 2.5, 3, null, "pending"],
      tags: [],
      note: null,
    },
    null,
    2,
  );
}
