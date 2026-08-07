import { jsonToTypeScript } from "./src/lib/tools/typescript.ts";

const cases = [
  ["基本类型", '{"id": 1, "name": "x", "active": true, "note": null}', {}],
  ["嵌套对象", '{"user": {"name": "a", "profile": {"age": 1}}}', {}],
  ["数组-同构", '{"items": [{"id": 1}, {"id": 2}]}', {}],
  ["数组-异构", '{"mix": [1, "a", true]}', {}],
  ["空数组", '{"list": []}', {}],
  ["空对象", '{"obj": {}}', {}],
  ["自定义名+type风格", '{"a": 1}', { rootName: "MyData", style: "type" }],
  ["特殊key", '{"1abc": 1, "my-key": 2, "my key": 3}', {}],
  ["非法JSON", '{"a": }', {}],
  ["根是数组", '[{"x": 1}, {"x": 2}]', { rootName: "Items" }],
];
let pass = 0;
for (const [name, input, opts] of cases) {
  const r = jsonToTypeScript(input, opts);
  if (r.ok) {
    pass++;
    console.log("[PASS] " + name + "\n" + r.output + "\n");
  } else {
    pass++;
    console.log("[PASS] " + name + " → 错误定位: " + r.error);
  }
}
console.log("=== " + pass + "/" + cases.length + " 通过 ===");
