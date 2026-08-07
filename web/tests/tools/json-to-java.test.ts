/**
 * json-to-java 工具纯函数测试（node --test 运行）
 * 覆盖：正常输入 / 空输入 / 错误输入 / 边界条件 / 大输入限制
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonToJava, DEFAULT_CLASS_NAME } from "../../src/lib/tools/java.ts";

// ---------- 正常输入 ----------
test("jsonToJava：基础类型映射", () => {
  const r = jsonToJava('{"id":1,"name":"x","price":9.9,"active":true}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /class RootObject/);
    assert.match(r.output, /private Integer id/);
    assert.match(r.output, /private String name/);
    assert.match(r.output, /private Double price/);
    assert.match(r.output, /private Boolean active/);
  }
});

test("jsonToJava：嵌套对象生成 static class", () => {
  const r = jsonToJava('{"user":{"name":"a"}}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /static class User/);
    assert.match(r.output, /private User user/);
  }
});

test("jsonToJava：数组生成 List 泛型", () => {
  const r = jsonToJava('{"items":[{"id":1},{"id":2}]}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /import java.util.List/);
    assert.match(r.output, /private List<Items> items/);
  }
});

test("jsonToJava：getter/setter 生成", () => {
  const r = jsonToJava('{"id":1}');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.match(r.output, /public Integer getId\(\)/);
    assert.match(r.output, /public void setId\(Integer id\)/);
  }
});

// ---------- 空输入 ----------
test("jsonToJava：空输入报错", () => {
  const r = jsonToJava("");
  assert.equal(r.ok, false);
});

// ---------- 错误输入 ----------
test("jsonToJava：非法 JSON 报错", () => {
  const r = jsonToJava('{"a": }');
  assert.equal(r.ok, false);
});

// ---------- 边界条件 ----------
test("jsonToJava：类名自定义", () => {
  const r = jsonToJava('{"a":1}', { className: "UserDTO" });
  assert.equal(r.ok, true);
  if (r.ok) assert.match(r.output, /class UserDTO/);
});

test("jsonToJava：关键字字段加后缀", () => {
  const r = jsonToJava('{"class":1}');
  assert.equal(r.ok, true);
  if (r.ok) assert.match(r.output, /private Integer class_/);
});

test("jsonToJava：默认类名", () => {
  assert.equal(DEFAULT_CLASS_NAME, "RootObject");
});

// ---------- 大输入限制 ----------
test("jsonToJava：大输入正常处理", () => {
  const bigObj = { data: "x".repeat(500000) };
  const r = jsonToJava(JSON.stringify(bigObj));
  assert.equal(r.ok, true);
});
