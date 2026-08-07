/**
 * Base64 编解码纯函数库（客户端本地执行，无 DOM 无 React）
 * 支持：encode(text) / decode(base64) / UTF-8 中文 / emoji / 非法 Base64 检测 / 错误提示
 */

/** 输入上限（字节）：与 shared inputLimit 保持一致 */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** 输入字节长度（UTF-8 安全） */
export function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}

export type Base64Result = { ok: true; output: string } | { ok: false; error: string };

/** 文本 → Base64（UTF-8 安全：先转字节再编码） */
export function encodeBase64(text: string): Base64Result {
  if (!text) return { ok: false, error: "Input is empty, please enter text to encode" };
  if (byteLength(text) > MAX_INPUT_BYTES) {
    return { ok: false, error: `Input exceeds the ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB limit, please trim and retry` };
  }
  try {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunk = 0x8000; // 大输入分块，避免栈溢出
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    return { ok: true, output: base64 };
  } catch {
    return { ok: false, error: "Encoding failed: unable to process input" };
  }
}

/** Base64 字符集检测：严格校验仅含合法字符（允许末尾 0-2 个 = 填充） */
function isValidBase64(input: string): boolean {
  if (input.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) return false;
  // = 只能在末尾，且最多 2 个
  const eqIndex = input.indexOf("=");
  if (eqIndex !== -1 && eqIndex < input.length - 2) return false;
  return true;
}

/** Base64 → 文本（UTF-8 安全：解码字节后按 UTF-8 还原） */
export function decodeBase64(base64: string): Base64Result {
  const input = base64.trim();
  if (!input) return { ok: false, error: "Input is empty, please enter Base64 to decode" };
  if (byteLength(input) > MAX_INPUT_BYTES) {
    return { ok: false, error: `Input exceeds the ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB limit, please trim and retry` };
  }
  if (!isValidBase64(input)) {
    return {
      ok: false,
      error: "Invalid Base64: only A-Z a-z 0-9 + / and trailing = padding allowed (length must be a multiple of 4)",
    };
  }
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    // UTF-8 解码（fatal: false 允许部分非 UTF-8 字节降级，不抛错）
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { ok: true, output: text };
  } catch {
    return { ok: false, error: "Decode failed: Base64 content could not be parsed" };
  }
}
