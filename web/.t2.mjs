import { validateJson } from './src/lib/tools/json.ts';
const s = '{"a": "x\q"}';
console.log('原始字符串:', JSON.stringify(s));
try { JSON.parse(s); console.log('JSON.parse: 合法'); } catch(e) { console.log('JSON.parse 抛错:', e.message); }
const v = validateJson(s);
console.log('validateJson:', v.ok ? '合法' : v.error.message);
