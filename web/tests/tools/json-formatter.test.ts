/**
 * json 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 大输入限制
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatJson,
  minifyJson,
  validateJson,
  isEmpty,
  MAX_INPUT_BYTES,
} from "../../src/lib/tools/json.ts";

// ---------- formatJson 正常输入 ----------
test("formatJson：美化输出", () => {
  const r = formatJson('{"a":1,"b":[1,2]}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.output, '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  }
});

test("formatJson：保留中文与 Unicode", () => {
  const r = formatJson('{"name":"你好"}');
  assert.equal(r.ok, true);
  if (r.ok) assert.match(r.output, /你好/);
});

// ---------- minifyJson 正常输入 ----------
test("minifyJson：压缩输出", () => {
  const r = minifyJson('{\n  "a": 1,\n  "b": 2\n}');
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.output, '{"a":1,"b":2}');
});

// ---------- 空输入 ----------
test("formatJson：空输入报错", () => {
  const r = formatJson("");
  assert.equal(r.ok, false);
});

test("isEmpty：空字符串判断", () => {
  assert.equal(isEmpty(""), true);
  assert.equal(isEmpty("   "), true);
  assert.equal(isEmpty("{}"), false);
});

// ---------- 错误输入 ----------
test("validateJson：非法 JSON 返回错误定位", () => {
  const r = validateJson('{"a": }');
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.error.position !== undefined);
    assert.ok(r.error.line !== undefined && r.error.line >= 1);
    assert.ok(r.error.column !== undefined && r.error.column >= 1);
    assert.ok(r.error.message.length > 0);
  }
});

test("formatJson：非法 JSON 报错", () => {
  const r = formatJson("{invalid}");
  assert.equal(r.ok, false);
});

// ---------- 边界条件 ----------
test("formatJson：空对象与空数组", () => {
  const emptyObj = formatJson("{}");
  assert.equal(emptyObj.ok, true);
  const emptyArr = formatJson("[]");
  assert.equal(emptyArr.ok, true);
});

test("formatJson：深层嵌套不崩溃", () => {
  const deep = JSON.stringify({ a: { b: { c: { d: 1 } } } });
  const r = formatJson(deep);
  assert.equal(r.ok, true);
});

// ---------- 大输入限制 ----------
test("formatJson：超过上限报错", () => {
  const big = "[" + "1,".repeat(MAX_INPUT_BYTES / 2) + "1]";
  const r = formatJson(big);
  // 超限输入可能因解析超内存被 catch，但不应返回 ok
  assert.equal(r.ok, false);
});
