/**
 * jwt-decoder 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 安全检查
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJwt, isJwtFormat, createDemoToken } from "../../src/lib/tools/jwt.ts";

function b64encode(obj: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---------- 正常输入 ----------
test("parseJwt：合法 token 解析", () => {
  const r = parseJwt(createDemoToken());
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.token.header.alg, "HS256");
    assert.ok(r.token.payload.sub);
    assert.ok(typeof r.token.exp === "number");
    assert.ok(r.token.expReadable);
    assert.ok(r.token.iatReadable);
  }
});

test("parseJwt：已过期 token 安全检查", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = `${b64encode({ alg: "HS256" })}.${b64encode({ exp: now - 100 })}.${"a".repeat(43)}`;
  const r = parseJwt(token);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.token.isExpired, true);
    assert.ok(r.token.checks.some((c) => c.id === "expired"));
  }
});

test("parseJwt：alg=none 高危检测", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = `${b64encode({ alg: "none" })}.${b64encode({ exp: now + 600 })}.`;
  const r = parseJwt(token);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.token.checks.some((c) => c.id === "alg-none" && c.severity === "danger"));
  }
});

test("parseJwt：缺少 exp 警告", () => {
  const token = `${b64encode({ alg: "HS256" })}.${b64encode({ sub: "1" })}.${"a".repeat(43)}`;
  const r = parseJwt(token);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.token.checks.some((c) => c.id === "missing-exp"));
  }
});

// ---------- 空输入 ----------
test("parseJwt：空输入报错", () => {
  const r = parseJwt("");
  assert.equal(r.ok, false);
});

// ---------- 错误输入 ----------
test("parseJwt：两段式报错", () => {
  const r = parseJwt("a.b");
  assert.equal(r.ok, false);
});

test("parseJwt：四段式报错", () => {
  const r = parseJwt("a.b.c.d");
  assert.equal(r.ok, false);
});

test("parseJwt：非法字符报错", () => {
  const r = parseJwt("a.b.c d");
  assert.equal(r.ok, false);
});

// ---------- 边界条件 ----------
test("isJwtFormat：格式检测", () => {
  assert.equal(isJwtFormat(createDemoToken()), true);
  assert.equal(isJwtFormat("not-a-jwt"), false);
});

test("parseJwt：签名 HEX 展示", () => {
  const token = `${b64encode({ alg: "HS256" })}.${b64encode({ sub: "1" })}.${"a".repeat(43)}`;
  const r = parseJwt(token);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.token.signatureHex, /^[0-9A-F ]+$/);
  }
});

// ---------- 大输入 ----------
test("parseJwt：超长 token 不崩溃", () => {
  const big = "a".repeat(1000000);
  const r = parseJwt(big);
  // 应返回错误而非崩溃
  assert.equal(r.ok, false);
});
