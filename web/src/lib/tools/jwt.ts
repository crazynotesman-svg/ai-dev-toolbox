/**
 * JWT 解析纯函数库（客户端本地执行，token 绝不出浏览器）
 * 功能：格式检测 / Header 解析 / Payload 解析 / Signature 展示
 *      exp/iat 时间分析 / 安全检查（expired / missing exp / alg none / malformed）
 */

/** 安全检查结果 */
export interface JwtSecurityCheck {
  /** 严重级别 */
  severity: "danger" | "warning" | "info";
  /** 检查项 ID */
  id: string;
  /** 标题 */
  title: string;
  /** 详情 */
  detail: string;
}

/** 解析结果 */
export interface JwtParsedToken {
  /** Header 解码后的 JSON */
  header: Record<string, unknown>;
  /** Payload 解码后的 JSON */
  payload: Record<string, unknown>;
  /** Signature 原始（base64url） */
  signature: string;
  /** Signature 十六进制预览 */
  signatureHex: string;
  /** 签发时间（秒，如无则 undefined） */
  iat?: number;
  /** 过期时间（秒，如无则 undefined） */
  exp?: number;
  /** 过期时间可读文本 */
  expReadable?: string;
  /** 签发时间可读文本 */
  iatReadable?: string;
  /** 是否已过期 */
  isExpired?: boolean;
  /** 距离过期剩余描述 */
  expiresIn?: string;
  /** 安全检查列表 */
  checks: JwtSecurityCheck[];
}

export type JwtResult =
  | { ok: true; token: JwtParsedToken }
  | { ok: false; error: string };

/** base64url → UTF-8 文本（兼容 Unicode） */
function base64UrlDecode(input: string): string {
  // 还原填充
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  // atob → binary string → UTF-8
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** base64url → Uint8Array（用于 hex 展示） */
function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** 相对时间描述 */
function describeDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const sign = totalSeconds >= 0 ? "后" : "前";
  if (abs < 60) return `${totalSeconds >= 0 ? "" : "-"}${abs} 秒${sign}`;
  if (abs < 3600) return `${Math.floor(abs / 60)} 分钟${sign}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} 小时${sign}`;
  return `${Math.floor(abs / 86400)} 天${sign}`;
}

/** JWT 格式检测：是否三段式 header.payload.signature */
export function isJwtFormat(input: string): boolean {
  const parts = input.trim().split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p));
}

/** 解析 JWT */
export function parseJwt(input: string): JwtResult {
  const token = input.trim();
  if (!token) {
    return { ok: false, error: "请输入 JWT Token" };
  }

  // 1. 格式检测：必须三段。注意第三段（签名）允许为空——alg=none 攻击的常见形态
  const parts = token.split(".");
  if (parts.length < 3) {
    return {
      ok: false,
      error: `Token 格式不完整：JWT 应由 header.payload.signature 三段组成（以 . 分隔），当前仅 ${parts.length} 段`,
    };
  }
  if (parts.length > 3) {
    return {
      ok: false,
      error: `Token 格式异常：包含 ${parts.length} 段，JWT 应恰好为三段（header.payload.signature）`,
    };
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64) {
    return { ok: false, error: "Token 格式异常：header 与 payload 段不能为空" };
  }
  if ([headerB64, payloadB64].some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) {
    return {
      ok: false,
      error: "Token 包含非法字符：JWT 使用 base64url 编码（仅 A-Z a-z 0-9 - _），请检查是否有换行或空格",
    };
  }

  // 2. 解析 Header
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(headerB64)) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Header 解码失败：第一段不是合法的 base64url 编码 JSON" };
  }

  // 3. 解析 Payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Payload 解码失败：第二段不是合法的 base64url 编码 JSON" };
  }

  // 4. Signature 展示
  const signatureBytes = base64UrlToBytes(signatureB64);
  const signatureHex = Array.from(signatureBytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ")
    .toUpperCase();

  // 5. exp / iat 时间分析
  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  const iat = typeof payload.iat === "number" ? payload.iat : undefined;
  const isExpired = exp !== undefined && now >= exp;
  const expReadable = exp !== undefined
    ? new Date(exp * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    : undefined;
  const iatReadable = iat !== undefined
    ? new Date(iat * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    : undefined;
  const expiresIn =
    exp !== undefined && !isExpired
      ? describeDuration(exp - now) + "过期"
      : undefined;

  // 6. 安全检查
  const checks: JwtSecurityCheck[] = [];
  const alg = typeof header.alg === "string" ? header.alg.toUpperCase() : String(header.alg ?? "未知");

  if (alg === "NONE") {
    checks.push({
      severity: "danger",
      id: "alg-none",
      title: "算法为 none（高危）",
      detail: "Header 中的 alg 为 none，攻击者可伪造任意 token 而无需签名。生产环境必须拒绝接受 alg=none 的 token。",
    });
  }

  if (isExpired) {
    checks.push({
      severity: "warning",
      id: "expired",
      title: "Token 已过期",
      detail: exp !== undefined
        ? `该 token 已于 ${expReadable} 过期，应引导用户重新登录。`
        : "该 token 已过期。",
    });
  }

  if (exp === undefined) {
    checks.push({
      severity: "warning",
      id: "missing-exp",
      title: "缺少 exp 声明",
      detail: "Payload 未包含 exp（过期时间），token 永不过期。建议签发时始终携带 exp，并校验过期时间。",
    });
  }

  if (iat === undefined) {
    checks.push({
      severity: "info",
      id: "missing-iat",
      title: "缺少 iat 声明",
      detail: "Payload 未包含 iat（签发时间），建议签发时携带以便审计。",
    });
  }

  if (payload.iss === undefined) {
    checks.push({
      severity: "info",
      id: "missing-iss",
      title: "缺少 iss 声明",
      detail: "Payload 未包含 iss（签发者），建议明确标识签发方。",
    });
  }

  // 无明显问题时的确认提示
  if (checks.filter((c) => c.severity === "danger" || c.severity === "warning").length === 0) {
    checks.push({
      severity: "info",
      id: "looks-ok",
      title: "未发现明显问题",
      detail: "算法非 none、含 exp 且未过期。仍需注意：本工具仅做静态分析，无法验证签名真实性。",
    });
  }

  return {
    ok: true,
    token: {
      header,
      payload,
      signature: signatureB64,
      signatureHex,
      iat,
      exp,
      expReadable,
      iatReadable,
      isExpired,
      expiresIn,
      checks,
    },
  };
}

/** 生成一个演示用 JWT（HS256，纯客户端，无密钥签名，仅用于演示解析） */
export function createDemoToken(): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: "1234567890",
    name: "Alice",
    iat: now,
    exp: now + 3600,
    iss: "ai-dev-toolbox",
  };
  const encode = (obj: object) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode(header)}.${encode(payload)}.${"a".repeat(43)}`;
}
