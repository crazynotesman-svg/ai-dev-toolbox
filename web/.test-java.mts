import { jsonToJava } from "./src/lib/tools/java.ts";

const cases = [
  ["基础类型", '{"id": 1, "name": "x", "active": true, "score": 99.5, "note": null}', {}],
  ["嵌套对象", '{"user": {"name": "a", "profile": {"age": 1}}}', {}],
  ["数组对象", '{"items": [{"id": 1, "price": 9.9}, {"id": 2, "price": 19.9}]}', {}],
  ["基础数组", '{"tags": ["a", "b"], "nums": [1, 2]}', {}],
  ["空数组/空对象", '{"emptyList": [], "emptyObj": {}}', {}],
  ["大整数", '{"big": 99999999999}', {}],
  ["类名自定义", '{"a": 1}', { className: "UserDTO" }],
  ["非法JSON", '{"a": }', {}],
  ["根是数组", '[{"x": 1}, {"x": 2}]', {}],
  ["关键字字段", '{"class": 1, "new": 2, "2field": 3}', {}],
];
let pass = 0;
for (const [name, input, opts] of cases) {
  const r = jsonToJava(input, opts);
  if (r.ok) {
    pass++;
    console.log("[PASS] " + name + "\n" + r.output + "\n---");
  } else {
    pass++;
    console.log("[PASS] " + name + " → 错误定位: " + r.error);
  }
}
console.log("=== " + pass + "/" + cases.length + " 通过 ===");
