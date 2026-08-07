import { validateJson } from './src/lib/tools/json.ts';

const cases = [
  ['非法转义 \q', '{"a": "x\q"}', false],
  ['合法转义 \n', '{"a": "x\n"}', true],
  ['合法转义 \u4e2d\u6587', '{"u":"\u4e2d\u6587"}', true],
  ['合法 \/ 转义', '{"url":"a\/b"}', true],
  ['BOM 前缀', '\uFEFF{"a":1}', false],
  ['多行错误定位', '{\n  "a": 1,\n  "b": }\n}', false],
];
let pass = 0;
for (const [name, input, expected] of cases) {
  const v = validateJson(input);
  const ok = v.ok === expected;
  if (ok) pass++;
  console.log((ok?'[PASS] ':'[FAIL] ') + name + (v.ok ? ' → 合法' : ' → ' + v.error.message));
}
console.log('===', pass + '/' + cases.length, '通过 ===');
