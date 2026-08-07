import { encodeBase64, decodeBase64 } from "./src/lib/tools/base64.ts";

let pass = 0;
const total = 8;

function check(name: string, cond: boolean) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}`);
  if (cond) pass++;
}

// 1. 英文
const en = encodeBase64("Hello, World!");
check("英文编码", en.ok && en.output === "SGVsbG8sIFdvcmxkIQ==");
const enD = decodeBase64("SGVsbG8sIFdvcmxkIQ==");
check("英文解码", enD.ok && enD.output === "Hello, World!");

// 2. 中文（UTF-8）
const zh = encodeBase64("你好，世界");
console.log("  中文编码结果:", zh.ok ? zh.output : zh.error);
check("中文编码", zh.ok && zh.output === "5L2g5aW977yM5LiW55WM");
const zhD = decodeBase64("5L2g5aW977yM5LiW55WM");
check("中文解码", zhD.ok && zhD.output === "你好，世界");

// 3. emoji（4 字节 UTF-8）
const em = encodeBase64("Hello 👋 世界 🎉");
check("emoji 编码", em.ok && em.output === "SGVsbG8g8J+RiyDkuJbnlYwg8J+OiQ==");
const emD = decodeBase64("SGVsbG8g8J+RiyDkuJbnlYwg8J+OiQ==");
check("emoji 解码", emD.ok && emD.output === "Hello 👋 世界 🎉");

// 4. 空输入
check("空输入编码报错", !encodeBase64("").ok);
check("空输入解码报错", !decodeBase64("  ").ok);

// 5. 非法 Base64
const bad1 = decodeBase64("SGVsbG8hIWEhIQ==="); // 3 个 =
check("非法1(3个=)", !bad1.ok);
const bad2 = decodeBase64("abc"); // 长度非 4 倍数
check("非法2(长度)", !bad2.ok);
const bad3 = decodeBase64("SGVsbG8*IQ=="); // 含非法字符 *
check("非法3(字符)", !bad3.ok);

// 6. 大输入限制（构造超限输入）
const bigText = "x".repeat(10 * 1024 * 1024 + 1);
const big = encodeBase64(bigText);
check("大输入编码限制", !big.ok && big.error.includes("上限"));

// 7. 往返一致性（随机 Unicode 样本）
const samples = ["abc", "中文测试", "🎉🎊", "mixed 中 en 123", "line\nbreak\t tab"];
let roundtripOk = true;
for (const s of samples) {
  const enc = encodeBase64(s);
  if (!enc.ok) { roundtripOk = false; break; }
  const dec = decodeBase64(enc.output);
  if (!dec.ok || dec.output !== s) { roundtripOk = false; break; }
}
check("往返一致性", roundtripOk);

// 8. URL 安全对比：标准 Base64 含 +/=
const urlEnc = encodeBase64("a+b/c=d");
check("URL 特殊字符", urlEnc.ok && urlEnc.output === "YStiL2M9ZA==");

console.log(`=== ${pass}/${total} 通过 ===`);
