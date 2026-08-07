/**
 * JWT 解析纯函数库（客户端本地执行，token 绝不出浏览器）
 * 功能：格式检测 / Header 解析 / Payload 解析 / Signature 展示
 *      exp/iat 时间分析 / 安全检查（expired / missing exp / alg none / malformed）
 * 文案统一为英文（默认语言；zh/ja 本地化映射由后续阶段实现）
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

/** 相对时间描述（英文） */
function describeDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const sign = totalSeconds >= 0 ? "from now" : "ago";
  if (abs < 60) return `${abs} second${abs === 1 ? "" : "s"} ${sign}`;
  if (abs < 3600) return `${Math.floor(abs / 60)} minute${Math.floor(abs / 60) === 1 ? "" : "s"} ${sign}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} hour${Math.floor(abs / 3600) === 1 ? "" : "s"} ${sign}`;
  return `${Math.floor(abs / 86400)} day${Math.floor(abs / 86400) === 1 ? "" : "s"} ${sign}`;
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
    return { ok: false, error: "Please enter a JWT token" };
  }

  // 1. 格式检测：必须三段。注意第三段（签名）允许为空——alg=none 攻击的常见形态
  const parts = token.split(".");
  if (parts.length < 3) {
    return {
      ok: false,
      error: `Malformed token: JWT must have 3 parts (header.payload.signature) separated by ".", found ${parts.length}`,
    };
  }
  if (parts.length > 3) {
    return {
      ok: false,
      error: `Malformed token: found ${parts.length} parts, JWT must have exactly 3 (header.payload.signature)`,
    };
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64) {
    return { ok: false, error: "Malformed token: header and payload parts cannot be empty" };
  }
  if ([headerB64, payloadB64].some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) {
    return {
      ok: false,
      error: "Invalid characters: JWT uses base64url (A-Z a-z 0-9 - _ only). Check for line breaks or spaces.",
    };
  }

  // 2. 解析 Header
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(headerB64)) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Header decode failed: first part is not valid base64url JSON" };
  }

  // 3. 解析 Payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Payload decode failed: second part is not valid base64url JSON" };
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
    ? new Date(exp * 1000).toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
    : undefined;
  const iatReadable = iat !== undefined
    ? new Date(iat * 1000).toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
    : undefined;
  const expiresIn =
    exp !== undefined && !isExpired
      ? describeDuration(exp - now) + " until expiry"
      : undefined;

  // 6. 安全检查
  const checks: JwtSecurityCheck[] = [];
  const alg = typeof header.alg === "string" ? header.alg.toUpperCase() : String(header.alg ?? "unknown");

  if (alg === "NONE") {
    checks.push({
      severity: "danger",
      id: "alg-none",
      title: "alg=none (high risk)",
      detail: "The alg is none, meaning the token is unsigned and attackers can forge tokens freely. Production must reject alg=none tokens.",
    });
  }

  if (isExpired) {
    checks.push({
      severity: "warning",
      id: "expired",
      title: "Token expired",
      detail: exp !== undefined
        ? `This token expired at ${expReadable}. Users should be asked to sign in again.`
        : "This token has expired.",
    });
  }

  if (exp === undefined) {
    checks.push({
      severity: "warning",
      id: "missing-exp",
      title: "Missing exp claim",
      detail: "Payload has no exp (expiration time), so the token never expires. Always include exp and validate it at issuance.",
    });
  }

  if (iat === undefined) {
    checks.push({
      severity: "info",
      id: "missing-iat",
      title: "Missing iat claim",
      detail: "Payload has no iat (issued-at time). Include it for auditability.",
    });
  }

  if (payload.iss === undefined) {
    checks.push({
      severity: "info",
      id: "missing-iss",
      title: "Missing iss claim",
      detail: "Payload has no iss (issuer). Clearly identify the issuer.",
    });
  }

  // 无明显问题时的确认提示
  if (checks.filter((c) => c.severity === "danger" || c.severity === "warning").length === 0) {
    checks.push({
      severity: "info",
      id: "looks-ok",
      title: "No obvious issues",
      detail: "Algorithm is not none, exp is present and not expired. Note: this tool only performs static analysis and cannot verify signature authenticity.",
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
