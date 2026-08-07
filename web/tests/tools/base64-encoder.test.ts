/**
 * base64 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 大输入限制
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeBase64, decodeBase64, byteLength, MAX_INPUT_BYTES } from "../../src/lib/tools/base64.ts";

// ---------- 正常输入 ----------
test("encodeBase64：英文编码", () => {
  const r = encodeBase64("Hello, World!");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "SGVsbG8sIFdvcmxkIQ==");
});

test("decodeBase64：英文解码", () => {
  const r = decodeBase64("SGVsbG8sIFdvcmxkIQ==");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "Hello, World!");
});

test("encodeBase64：中文编码", () => {
  const r = encodeBase64("你好，世界");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "5L2g5aW977yM5LiW55WM");
});

test("decodeBase64：中文解码", () => {
  const r = decodeBase64("5L2g5aW977yM5LiW55WM");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "你好，世界");
});

test("encode/decode：emoji 无损往返", () => {
  const enc = encodeBase64("Hello 👋 世界 🎉");
  assert.equal(enc.ok, true);
  if (enc.ok) {
    const dec = decodeBase64(enc.output);
    assert.equal(dec.ok, true);
    if (dec.ok) assert.equal(dec.output, "Hello 👋 世界 🎉");
  }
});

// ---------- 空输入 ----------
test("encodeBase64：空输入报错", () => {
  const r = encodeBase64("");
  assert.equal(r.ok, false);
});

test("decodeBase64：空白输入报错", () => {
  const r = decodeBase64("   ");
  assert.equal(r.ok, false);
});

// ---------- 错误输入 ----------
test("decodeBase64：非法填充（3个=）", () => {
  const r = decodeBase64("SGVsbG8hIWEhIQ===");
  assert.equal(r.ok, false);
});

test("decodeBase64：长度非 4 倍数", () => {
  const r = decodeBase64("abc");
  assert.equal(r.ok, false);
});

test("decodeBase64：非法字符", () => {
  const r = decodeBase64("SGVsbG8*IQ==");
  assert.equal(r.ok, false);
});

// ---------- 边界条件 ----------
test("byteLength：UTF-8 字节统计", () => {
  assert.equal(byteLength("abc"), 3);
  assert.equal(byteLength("你好"), 6); // 每字 3 字节
  assert.equal(byteLength("🎉"), 4); // emoji 4 字节
});

test("decodeBase64：容忍前后空白", () => {
  const r = decodeBase64("  SGVsbG8sIFdvcmxkIQ==  ");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "Hello, World!");
});

test("encodeBase64：URL 特殊字符", () => {
  const r = encodeBase64("a+b/c=d");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, "YStiL2M9ZA==");
});

// ---------- 大输入限制 ----------
test("encodeBase64：超过上限报错", () => {
  const big = "x".repeat(MAX_INPUT_BYTES + 1);
  const r = encodeBase64(big);
  assert.equal(r.ok, false);
});

test("encodeBase64：大输入分块不崩溃", () => {
  const big = "中".repeat(200000); // 60 万字节
  const r = encodeBase64(big);
  assert.equal(r.ok, true);
});
