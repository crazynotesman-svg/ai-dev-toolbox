/**
 * JSON 工具纯函数库（客户端本地执行，无任何网络依赖）
 * 输入字符串 → 输出字符串 / 校验结果
 * 内置轻量 JSON 语法检查器：兼容新版 V8（错误消息不含位置），提供行列号精确定位
 */

export interface JsonError {
  /** 错误类型 */
  code: "empty" | "invalid" | "too-large";
  /** 人类可读错误信息 */
  message: string;
  /** 出错位置（0 起始字符索引，可选） */
  position?: number;
  /** 出错行（1 起始） */
  line?: number;
  /** 出错列（1 起始） */
  column?: number;
}

export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; error: JsonError };

/** 输入大小上限（10MB，超出提示走文件/服务端） */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** 计算 UTF-8 字节数（浏览器兼容，Node 亦可用） */
function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}

/** 由字符索引计算行列号 */
function positionToLineColumn(input: string, position: number): { line: number; column: number } {
  const before = input.slice(0, position);
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

/* ================= 轻量 JSON 语法检查器（用于错误定位） ================= */

class JsonSyntaxError extends Error {
  position: number;
  constructor(position: number, message: string) {
    super(message);
    this.position = position;
  }
}

/**
 * 校验 JSON 语法并返回首错位置。
 * 成功返回 -1，失败返回错误字符索引。
 * 与 JSON.parse 规则对齐：字符串/数字/对象/数组/字面量。
 */
export function locateJsonError(input: string): number {
  let pos = 0;
  const n = input.length;

  const fail = (p: number): never => {
    throw new JsonSyntaxError(p, "invalid");
  };

  const skipWs = (): void => {
    while (pos < n && " \t\n\r".includes(input[pos])) pos++;
  };

  const expect = (ch: string): void => {
    skipWs();
    if (input[pos] !== ch) fail(pos);
    pos++;
  };

  const parseString = (): void => {
    // 当前 pos 指向引号
    pos++; // 跳过开引号
    while (pos < n) {
      const c = input[pos];
      if (c === '"') {
        pos++; // 闭引号
        return;
      }
      if (c === "\\") {
        const esc = input[pos + 1];
        if (esc === undefined) fail(pos);
        // JSON 合法转义：\" \\ \/ \b \f \n \r \t \uXXXX
        if ('"\\/bfnrt'.includes(esc)) {
          pos += 2;
        } else if (esc === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(input.slice(pos + 2, pos + 6))) fail(pos);
          pos += 6;
        } else {
          fail(pos);
        }
      } else if (c < " ") {
        // 字符串内不允许裸控制字符
        fail(pos);
      } else {
        pos++;
      }
    }
    fail(pos); // 未闭合
  };

  const parseNumber = (): void => {
    const rest = input.slice(pos);
    const m = rest.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!m) throw new JsonSyntaxError(pos, "invalid");
    if (m[0].length === 0) throw new JsonSyntaxError(pos, "invalid");
    pos += m[0].length;
    // 数字后紧跟字母/数字视为错误（如 1e 后无数字或 1x）
    const next = input[pos];
    if (next !== undefined && /[0-9a-zA-Z]/.test(next)) throw new JsonSyntaxError(pos, "invalid");
  };

  const parseLiteral = (word: string): void => {
    if (input.slice(pos, pos + word.length) !== word) fail(pos);
    pos += word.length;
    const next = input[pos];
    if (next !== undefined && /[0-9a-zA-Z]/.test(next)) fail(pos);
  };

  const parseValue = (): void => {
    skipWs();
    if (pos >= n) fail(pos);
    const c = input[pos];
    if (c === "{") {
      pos++;
      skipWs();
      if (input[pos] === "}") {
        pos++;
        return;
      }
      for (;;) {
        skipWs();
        if (input[pos] !== '"') fail(pos);
        parseString();
        expect(":");
        parseValue();
        skipWs();
        if (input[pos] === ",") {
          pos++;
          continue;
        }
        if (input[pos] === "}") {
          pos++;
          return;
        }
        fail(pos);
      }
    } else if (c === "[") {
      pos++;
      skipWs();
      if (input[pos] === "]") {
        pos++;
        return;
      }
      for (;;) {
        parseValue();
        skipWs();
        if (input[pos] === ",") {
          pos++;
          continue;
        }
        if (input[pos] === "]") {
          pos++;
          return;
        }
        fail(pos);
      }
    } else if (c === '"') {
      parseString();
    } else if (c === "-" || (c >= "0" && c <= "9")) {
      parseNumber();
    } else if (input.startsWith("true", pos)) {
      parseLiteral("true");
    } else if (input.startsWith("false", pos)) {
      parseLiteral("false");
    } else if (input.startsWith("null", pos)) {
      parseLiteral("null");
    } else {
      fail(pos);
    }
  };

  try {
    parseValue();
    skipWs();
    if (pos < n) return pos; // 尾部有残留内容
    return -1;
  } catch (e) {
    if (e instanceof JsonSyntaxError) return e.position;
    throw e;
  }
}

/** 解析 JSON 并返回带错误定位的结果 */
function parse(input: string): { value: unknown } | { error: JsonError } {
  if (input.trim() === "") {
    return { error: { code: "empty", message: "输入内容为空，请粘贴 JSON 数据" } };
  }
  if (byteLength(input) > MAX_INPUT_BYTES) {
    return {
      error: { code: "too-large", message: "输入超过 10MB 限制，请减小数据量后重试" },
    };
  }
  try {
    return { value: JSON.parse(input) };
  } catch (err) {
    // 新版 V8 消息无位置，用内置检查器精确定位
    const position = locateJsonError(input);
    const raw = err instanceof Error ? err.message : "无法解析的 JSON";
    if (position < 0) {
      return { error: { code: "invalid", message: raw, position: undefined } };
    }
    const { line, column } = positionToLineColumn(input, position);
    return {
      error: {
        code: "invalid",
        message: `第 ${line} 行第 ${column} 列附近：${raw}`,
        position,
        line,
        column,
      },
    };
  }
}

/** 格式化：美化输出（2 空格缩进） */
export function formatJson(input: string): JsonResult {
  const result = parse(input);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, output: JSON.stringify(result.value, null, 2) };
}

/** 压缩：移除所有空白 */
export function minifyJson(input: string): JsonResult {
  const result = parse(input);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, output: JSON.stringify(result.value) };
}

/** 校验：仅返回是否合法 + 错误信息（不输出） */
export function validateJson(input: string): { ok: true } | { ok: false; error: JsonError } {
  const result = parse(input);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true };
}

/** 校验输入是否为空 */
export function isEmpty(input: string): boolean {
  return input.trim() === "";
}
