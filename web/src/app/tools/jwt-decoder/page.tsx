import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import JwtDecoderTool from "@/components/tools/JwtDecoderTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("jwt-decoder")!;

/** 独立 metadata（数据来自 shared 配置） */
export const metadata: Metadata = {
  title: { absolute: tool.seoTitle },
  description: tool.seoDescription,
  keywords: [...tool.keywords],
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: {
    type: "website",
    title: tool.seoTitle,
    description: tool.seoDescription,
    url: `/tools/${tool.slug}`,
  },
};

/** SoftwareApplication 结构化数据 */
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: tool.title,
  url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: tool.seoDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
  },
  featureList: ["JWT Header/Payload 解码", "exp/iat 时间分析", "安全检查", "alg none 检测"],
};

const features = [
  {
    title: "JWT 格式检测与解析",
    body: "自动识别标准 JWT（header.payload.signature 三段式），解码 Header 与 Payload 为可读 JSON，并展示 Signature。",
  },
  {
    title: "exp / iat 时间分析",
    body: "自动读取 exp（过期时间）与 iat（签发时间）声明，转换为北京时间可读文本，并计算过期状态与剩余有效期。",
  },
  {
    title: "安全体检",
    body: "自动执行 6 项安全检查：是否过期、是否缺少 exp、算法是否为 none（高危）、是否缺少 iat / iss，以及总体健康度提示。",
  },
  {
    title: "隐私安全 · 本地解析",
    body: "Token 全程在浏览器本地解析，绝不发送到任何服务器，适合排查线上环境的真实 token。",
  },
];

const guide = [
  {
    title: "第一步：粘贴 Token",
    body: "在输入框粘贴 JWT Token，或点击「载入演示 Token」快速体验（演示 token 为本地构造，非真实凭证）。",
  },
  {
    title: "第二步：查看解析结果",
    body: "点击「解析 Token」查看 Header、Payload、Signature、时间分析与安全检查结果。",
  },
  {
    title: "第三步：定位风险",
    body: "重点关注安全检查中的危险（红）与警告（黄）项，如 alg=none 或 token 已过期。",
  },
];

const faqs = [
  {
    question: "JWT 解析工具免费吗？",
    answer: "完全免费，无需注册，即开即用，无使用次数限制。",
  },
  {
    question: "我的 Token 会被发送到服务器吗？",
    answer:
      "不会。所有解析在浏览器本地完成，Token 不会离开您的设备，适合粘贴生产环境中的真实凭证进行排查。",
  },
  {
    question: "alg=none 是什么意思？",
    answer:
      "alg=none 表示 token 没有签名，攻击者可任意伪造。真实服务必须拒绝接受 alg=none 的 token，工具会将其标记为高危。",
  },
  {
    question: "能验证签名真实性吗？",
    answer:
      "不能。签名验证需要服务端密钥（secret），本工具为纯静态解析工具，仅展示 Signature 内容，不做真实性验证。",
  },
];

export default function JwtDecoderPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <JwtDecoderTool />
      </ToolPageShell>
    </>
  );
}
