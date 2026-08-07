/**
 * json-explain 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 敏感字段
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { explainJson, createExplainDemo } from "../../src/lib/tools/json-explain.ts";

// ---------- 正常输入 ----------
test("explainJson：基础结构分析", () => {
  const r = explainJson('{"a":1,"b":"x","c":true}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.rootType, "object");
    assert.equal(r.data.topLevelCount, 3);
    assert.equal(r.data.totalFieldCount, 3);
    assert.ok(r.data.maxDepth >= 2);
  }
});

test("explainJson：嵌套深度统计", () => {
  const r = explainJson('{"a":{"b":{"c":{"d":1}}}}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.maxDepth, 5);
    assert.equal(r.data.totalFieldCount, 4);
  }
});

test("explainJson：数组分析", () => {
  const r = explainJson('{"items":[{"id":1},{"id":2}]}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.arrayAnalysis.count, 1);
    assert.equal(r.data.arrayAnalysis.maxLength, 2);
    assert.ok(r.data.arrayAnalysis.elementTypes.some((t) => t.type === "object"));
  }
});

test("explainJson：敏感字段识别", () => {
  const r = explainJson('{"password":"x","user":{"token":"y","email":"a@b.c"}}');
  assert.equal(r.ok, true);
  if (r.ok) {
    const fields = r.data.sensitiveFields;
    assert.ok(fields.some((f) => f.path === "password" && f.level === "high"));
    assert.ok(fields.some((f) => f.path === "user.token"));
    assert.ok(fields.some((f) => f.field === "email"));
  }
});

// ---------- 空输入 ----------
test("explainJson：空输入报错", () => {
  const r = explainJson("");
  assert.equal(r.ok, false);
});

// ---------- 错误输入 ----------
test("explainJson：非法 JSON 返回行列号与上下文", () => {
  const r = explainJson('{"a": }');
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.error.line !== undefined && r.error.line >= 1);
    assert.ok(r.error.column !== undefined && r.error.column >= 1);
    assert.ok(r.error.context && r.error.context.length > 0);
  }
});

// ---------- 边界条件 ----------
test("explainJson：空对象与根数组", () => {
  const emptyObj = explainJson("{}");
  assert.equal(emptyObj.ok, true);
  if (emptyObj.ok) assert.equal(emptyObj.data.rootType, "object");
  const rootArr = explainJson("[1,2,3]");
  assert.equal(rootArr.ok, true);
  if (rootArr.ok) assert.equal(rootArr.data.rootType, "array");
});

test("explainJson：根原始类型", () => {
  const r = explainJson('"just a string"');
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.rootType, "string");
});

test("explainJson：演示数据可解析", () => {
  const r = explainJson(createExplainDemo());
  assert.equal(r.ok, true);
});

// ---------- 大输入 ----------
test("explainJson：大输入正常分析", () => {
  const big = { arr: Array.from({ length: 10000 }, (_, i) => ({ i })) };
  const r = explainJson(JSON.stringify(big));
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(r.data.totalFieldCount >= 10000);
});
