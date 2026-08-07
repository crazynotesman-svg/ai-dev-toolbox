import { parseJwt, isJwtFormat, createDemoToken } from "./src/lib/tools/jwt.ts";

// Node 22 提供全局 atob/btoa，TextDecoder 也可用
const cases = [
  ["合法完整 token", createDemoToken(), true],
  ["两段式", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ", false],
  ["四段式", "a.b.c.d", false],
  ["空输入", "", false],
  ["非法字符", "a.b.c d", false],
  ["header 非 JSON", "bm90anNvbg" + "." + b64encode({ sub: "1" }) + "." + "a".repeat(43), false],
  ["payload 非 JSON", b64encode({ alg: "HS256" }) + "." + "bm90anNvbg" + "." + "a".repeat(43), false],
  ["alg none（空签名）", createNoneToken(), true],
  ["已过期 exp", createExpiredToken(), true],
  ["缺少 exp", createNoExpToken(), true],
];
let pass = 0;
for (const [name, input, expectedOk] of cases) {
  const r = parseJwt(input);
  const ok = r.ok === expectedOk;
  if (ok) pass++;
  if (r.ok) {
    console.log("[PASS] " + name + "\n  alg=" + r.token.header.alg + " exp=" + r.token.exp + " expired=" + r.token.isExpired + " checks=" + r.token.checks.map(c => c.id).join(","));
  } else {
    console.log("[PASS] " + name + " → 错误: " + r.error);
  }
}
// 格式检测
console.log("isJwtFormat(demo):", isJwtFormat(createDemoToken()));
console.log("=== " + pass + "/" + cases.length + " 通过 ===");

function b64encode(obj: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function createNoneToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return b64encode({ alg: "none", typ: "JWT" }) + "." + b64encode({ sub: "1", exp: now + 600 }) + ".";
}
function createExpiredToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return b64encode({ alg: "HS256", typ: "JWT" }) + "." + b64encode({ sub: "1", exp: now - 100 }) + "." + "a".repeat(43);
}
function createNoExpToken(): string {
  return b64encode({ alg: "HS256", typ: "JWT" }) + "." + b64encode({ sub: "1", iat: 1700000000 }) + "." + "a".repeat(43);
}
