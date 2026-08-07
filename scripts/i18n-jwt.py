# -*- coding: utf-8 -*-
"""jwt.ts 纯函数英文化（错误信息 / 时间描述 / 安全检查项）"""
import io, re

with io.open('web/src/lib/tools/jwt.ts', encoding='utf-8') as f:
    src = f.read()

# 1. describeDuration 英文化
old_dur = '''/** 相对时间描述 */
function describeDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const sign = totalSeconds >= 0 ? "后" : "前";
  if (abs < 60) return `${totalSeconds >= 0 ? "" : "-"}${abs} 秒${sign}`;
  if (abs < 3600) return `${Math.floor(abs / 60)} 分钟${sign}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} 小时${sign}`;
  return `${Math.floor(abs / 86400)} 天${sign}`;
}'''
new_dur = '''/** 相对时间描述（英文） */
function describeDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const sign = totalSeconds >= 0 ? "from now" : "ago";
  if (abs < 60) return `${abs} second${abs === 1 ? "" : "s"} ${sign}`;
  if (abs < 3600) return `${Math.floor(abs / 60)} minute${Math.floor(abs / 60) === 1 ? "" : "s"} ${sign}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} hour${Math.floor(abs / 3600) === 1 ? "" : "s"} ${sign}`;
  return `${Math.floor(abs / 86400)} day${Math.floor(abs / 86400) === 1 ? "" : "s"} ${sign}`;
}'''
assert old_dur in src, 'describeDuration not found'
src = src.replace(old_dur, new_dur)

# 2. 错误信息英文化
replaces = [
    ('"请输入 JWT Token"', '"Please enter a JWT token"'),
    ('`Token 格式不完整：JWT 应由 header.payload.signature 三段组成（以 . 分隔），当前仅 ${parts.length} 段`',
     '`Malformed token: JWT must have 3 parts (header.payload.signature) separated by ".", found ${parts.length}`'),
    ('`Token 格式异常：包含 ${parts.length} 段，JWT 应恰好为三段（header.payload.signature）`',
     '`Malformed token: found ${parts.length} parts, JWT must have exactly 3 (header.payload.signature)`'),
    ('"Token 格式异常：header 与 payload 段不能为空"', '"Malformed token: header and payload parts cannot be empty"'),
    ('"Token 包含非法字符：JWT 使用 base64url 编码（仅 A-Z a-z 0-9 - _），请检查是否有换行或空格"',
     '"Invalid characters: JWT uses base64url (A-Z a-z 0-9 - _ only). Check for line breaks or spaces."'),
    ('"Header 解码失败：第一段不是合法的 base64url 编码 JSON"', '"Header decode failed: first part is not valid base64url JSON"'),
    ('"Payload 解码失败：第二段不是合法的 base64url 编码 JSON"', '"Payload decode failed: second part is not valid base64url JSON"'),
]
for old, new in replaces:
    if old in src:
        src = src.replace(old, new)
    else:
        print('MISS:', old[:60])

# 3. 时间格式 en-US
src = src.replace('new Date(exp * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })',
                  'new Date(exp * 1000).toLocaleString("en-US", { timeZone: "Asia/Shanghai" })')
src = src.replace('new Date(iat * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })',
                  'new Date(iat * 1000).toLocaleString("en-US", { timeZone: "Asia/Shanghai" })')
src = src.replace('? describeDuration(exp - now) + "过期"', '? describeDuration(exp - now) + " until expiry"')

# 4. 安全检查项英文化
src = src.replace('String(header.alg ?? "未知")', 'String(header.alg ?? "unknown")')

sec_replaces = [
    ('''      title: "算法为 none（高危）",
      detail: "Header 中的 alg 为 none，攻击者可伪造任意 token 而无需签名。生产环境必须拒绝接受 alg=none 的 token。",''',
     '''      title: "alg=none (high risk)",
      detail: "The alg is none, meaning the token is unsigned and attackers can forge tokens freely. Production must reject alg=none tokens.",'''),
    ('''      title: "Token 已过期",
      detail: exp !== undefined
        ? `该 token 已于 ${expReadable} 过期，应引导用户重新登录。`
        : "该 token 已过期。",''',
     '''      title: "Token expired",
      detail: exp !== undefined
        ? `This token expired at ${expReadable}. Users should be asked to sign in again.`
        : "This token has expired.",'''),
    ('''      title: "缺少 exp 声明",
      detail: "Payload 未包含 exp（过期时间），token 永不过期。建议签发时始终携带 exp，并校验过期时间。",''',
     '''      title: "Missing exp claim",
      detail: "Payload has no exp (expiration time), so the token never expires. Always include exp and validate it at issuance.",'''),
    ('''      title: "缺少 iat 声明",
      detail: "Payload 未包含 iat（签发时间），建议签发时携带以便审计。",''',
     '''      title: "Missing iat claim",
      detail: "Payload has no iat (issued-at time). Include it for auditability.",'''),
    ('''      title: "缺少 iss 声明",
      detail: "Payload 未包含 iss（签发者），建议明确标识签发方。",''',
     '''      title: "Missing iss claim",
      detail: "Payload has no iss (issuer). Clearly identify the issuer.",'''),
    ('''      title: "未发现明显问题",
      detail: "算法非 none、含 exp 且未过期。仍需注意：本工具仅做静态分析，无法验证签名真实性。",''',
     '''      title: "No obvious issues",
      detail: "Algorithm is not none, exp is present and not expired. Note: this tool only performs static analysis and cannot verify signature authenticity.",'''),
]
for old, new in sec_replaces:
    if old in src:
        src = src.replace(old, new)
    else:
        print('SEC MISS:', old[:50])

with io.open('web/src/lib/tools/jwt.ts', 'w', encoding='utf-8', newline='') as f:
    f.write(src)
print('jwt.ts 英文化完成')
zh = re.findall(r'"[^"]*[\u4e00-\u9fff][^"]*"', src)
print('残留中文:', zh if zh else '无')
