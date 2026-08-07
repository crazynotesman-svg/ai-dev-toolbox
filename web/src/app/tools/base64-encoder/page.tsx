import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import Base64Tool from "@/components/tools/Base64Tool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("base64-encoder")!;

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
  featureList: ["Base64 编码", "Base64 解码", "UTF-8 中文支持", "emoji 支持"],
};

const features = [
  {
    title: "Base64 编解码互转",
    body: "文本与 Base64 一键互转：输入文本编码为 Base64，或粘贴 Base64 解码为文本，支持切换模式。",
  },
  {
    title: "UTF-8 中文与 emoji 支持",
    body: "基于 UTF-8 字节编码，中文、emoji 等多字节字符均可无损编解码，往返一致。",
  },
  {
    title: "非法输入检测",
    body: "自动检测非法 Base64（非法字符、错误填充、长度不符），给出明确的错误提示，避免输出乱码。",
  },
  {
    title: "本地处理 · 隐私安全",
    body: "所有编解码在浏览器本地完成，数据不会上传到任何服务器，适合处理敏感文本。",
  },
];

const guide = [
  {
    title: "第一步：选择模式",
    body: "在工具栏选择「编码 → Base64」或「解码 → 文本」，或点击「载入示例」快速体验。",
  },
  {
    title: "第二步：输入内容",
    body: "输入要转换的文本或 Base64 字符串（编码支持中文与 emoji，解码自动校验格式）。",
  },
  {
    title: "第三步：转换并复制",
    body: "点击「编码/解码」得到结果，点击「复制结果」即可粘贴到你的代码或文档中。",
  },
];

const faqs = [
  {
    question: "Base64 编码工具免费吗？",
    answer: "完全免费，无需注册，即开即用，无使用次数限制。",
  },
  {
    question: "支持中文和 emoji 吗？",
    answer:
      "支持。工具基于 UTF-8 字节编码，中文、日文、emoji 等多字节字符均可无损编解码，往返结果一致。",
  },
  {
    question: "数据会上传到服务器吗？",
    answer:
      "不会。所有编解码操作在浏览器本地完成，您的数据不会离开设备，可放心处理敏感文本。",
  },
  {
    question: "Base64 是加密吗？",
    answer:
      "不是。Base64 仅是一种编码方式（可逆），不提供任何安全性。请勿用它保护敏感数据，真实敏感信息应使用加密算法。",
  },
];

export default function Base64EncoderPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <Base64Tool />
      </ToolPageShell>
    </>
  );
}
