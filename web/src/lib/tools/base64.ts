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
  if (!text) return { ok: false, error: "输入内容为空，请输入要编码的文本" };
  if (byteLength(text) > MAX_INPUT_BYTES) {
    return { ok: false, error: `输入超过 ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB 上限，请裁剪后重试` };
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
    return { ok: false, error: "编码失败：无法处理的输入内容" };
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
  if (!input) return { ok: false, error: "输入内容为空，请输入要解码的 Base64" };
  if (byteLength(input) > MAX_INPUT_BYTES) {
    return { ok: false, error: `输入超过 ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB 上限，请裁剪后重试` };
  }
  if (!isValidBase64(input)) {
    return {
      ok: false,
      error: "非法 Base64：仅允许 A-Z a-z 0-9 + / 与末尾 = 填充（长度须为 4 的倍数）",
    };
  }
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    // UTF-8 解码（fatal: false 允许部分非 UTF-8 字节降级，不抛错）
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { ok: true, output: text };
  } catch {
    return { ok: false, error: "解码失败：Base64 内容无法解析" };
  }
}
