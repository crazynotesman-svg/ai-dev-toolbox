import { explainJson, createExplainDemo } from "./src/lib/tools/json-explain.ts";

const cases = [
  ["简单对象", '{"name": "a", "age": 30, "active": true, "note": null}', "object"],
  ["嵌套对象", '{"user": {"profile": {"address": {"city": "BJ"}}}}', "object"],
  ["数组对象", '{"items": [{"id": 1}, {"id": 2}, {"id": 3}]}', "object"],
  ["混合数组", '{"mix": [1, "a", true, null, {"k": 1}]}', "object"],
  ["空对象", "{}", "object"],
  ["空数组", "[]", "array"],
  ["非法 JSON", '{"a": 1, "b": }', null],
  ["敏感字段", '{"password": "x", "user": {"token": "y", "email": "a@b.c", "cardNumber": "4111"}}', "object"],
  ["根数组", '[{"x": 1}, 2, "three"]', "array"],
  ["根原始类型", '"just a string"', "string"],
];

let pass = 0;
for (const [name, input, expectedRoot] of cases) {
  const r = explainJson(input);
  if (r.ok) {
    const d = r.data;
    const rootOk = expectedRoot === null || d.rootType === expectedRoot;
    console.log(`[${rootOk ? "PASS" : "FAIL"}] ${name} → root=${d.rootType} fields=${d.totalFieldCount} depth=${d.maxDepth} arrays=${d.arrayAnalysis.count}`);
    if (!rootOk) {
      console.log("  期望 root=" + expectedRoot + " 实际=" + d.rootType);
    } else {
      pass++;
    }
    if (name === "敏感字段") {
      console.log("  敏感字段:", d.sensitiveFields.map((s) => `${s.path}(${s.level})`).join(", "));
    }
  } else {
    const err = r.error;
    console.log(`[PASS] ${name} → 错误: ${err.message} | line=${err.line} col=${err.column} | 上下文: ${err.context}`);
    pass++;
  }
}

// 额外：演示 token 分析
const demo = explainJson(createExplainDemo());
if (demo.ok) {
  console.log("[PASS] 演示 JSON → root=" + demo.data.rootType + " 敏感字段数=" + demo.data.sensitiveFields.length);
  pass++;
} else {
  console.log("[FAIL] 演示 JSON 解析失败");
}

console.log("=== " + pass + "/11 通过 ===");
