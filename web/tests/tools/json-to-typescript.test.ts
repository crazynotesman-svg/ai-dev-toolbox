/**
 * json-to-typescript 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 大输入限制
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonToTypeScript, DEFAULT_ROOT_NAME } from "../../src/lib/tools/typescript.ts";

// ---------- 正常输入 ----------
test("jsonToTypeScript：基础类型映射", () => {
  const r = jsonToTypeScript('{"id":1,"name":"x","active":true}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /interface RootObject/);
    assert.match(r.output, /id: number/);
    assert.match(r.output, /name: string/);
    assert.match(r.output, /active: boolean/);
  }
});

test("jsonToTypeScript：嵌套对象生成独立接口", () => {
  const r = jsonToTypeScript('{"user":{"name":"a","age":1}}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /user: User/);
    assert.match(r.output, /interface User/);
  }
});

test("jsonToTypeScript：数组类型推断", () => {
  const r = jsonToTypeScript('{"items":[{"id":1},{"id":2}]}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /items: Items\[\]/);
    assert.doesNotMatch(r.output, /Items \| Items2/);
  }
});

test("jsonToTypeScript：type 风格与自定义名", () => {
  const r = jsonToTypeScript('{"a":1}', { rootName: "MyData", style: "type" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /type MyData = /);
    assert.match(r.output, /a: number/);
  }
});

// ---------- 空输入 ----------
test("jsonToTypeScript：空输入报错", () => {
  const r = jsonToTypeScript("");
  assert.equal(r.ok, false);
});

// ---------- 错误输入 ----------
test("jsonToTypeScript：非法 JSON 报错", () => {
  const r = jsonToTypeScript('{"a": }');
  assert.equal(r.ok, false);
});

// ---------- 边界条件 ----------
test("jsonToTypeScript：空对象与空数组", () => {
  assert.equal(jsonToTypeScript("{}").ok, true);
  const arr = jsonToTypeScript("[]");
  assert.equal(arr.ok, true);
});

test("jsonToTypeScript：默认根名导出", () => {
  assert.equal(DEFAULT_ROOT_NAME, "RootObject");
});

// ---------- 大输入限制 ----------
test("jsonToTypeScript：大输入不崩溃或报错", () => {
  const bigObj = { data: "x".repeat(500000) };
  const r = jsonToTypeScript(JSON.stringify(bigObj));
  assert.equal(r.ok, true);
});
