import { validateJson, locateJsonError } from './src/lib/tools/json.ts';
// String.raw 保证反斜杠不被 JS 转义处理
const bad = String.raw`{"a": "x\q"}`;
const good = String.raw`{"a": "x\n"}`;
console.log('bad 实际内容:', JSON.stringify(bad));
console.log('locateJsonError(bad):', locateJsonError(bad));
console.log('validateJson(bad):', JSON.stringify(validateJson(bad)));
console.log('validateJson(good):', JSON.stringify(validateJson(good)));
