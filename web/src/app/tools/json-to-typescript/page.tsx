import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import JsonToTypescriptTool from "@/components/tools/JsonToTypescriptTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("json-to-typescript")!;

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
  featureList: ["JSON 转 TypeScript", "嵌套对象支持", "数组类型推断", "类型名自定义"],
};

const features = [
  {
    title: "JSON 转 TypeScript 类型",
    body: "粘贴 JSON 即可自动生成对应的 TypeScript interface 或 type 定义，覆盖字符串、数字、布尔值、null、数组与嵌套对象等全部基础类型。",
  },
  {
    title: "嵌套对象自动拆解",
    body: "嵌套对象会拆解为独立的命名接口，字段引用保持类型安全，结构清晰易维护。",
  },
  {
    title: "数组类型智能推断",
    body: "同构数组推断为单元素类型数组（如 Item[]），异构数组自动生成联合类型（如 (string | number)[]）。",
  },
  {
    title: "类型名与风格自定义",
    body: "支持自定义根接口名称，并可一键切换 interface / type 两种输出风格，适配不同项目规范。",
  },
];

const guide = [
  {
    title: "第一步：粘贴 JSON",
    body: "在输入框粘贴 JSON 数据，或点击「载入示例」快速体验。",
  },
  {
    title: "第二步：配置选项",
    body: "自定义根类型名（默认 RootObject），并选择 interface 或 type 输出风格。",
  },
  {
    title: "第三步：生成并复制",
    body: "点击「生成类型」得到 TypeScript 定义，点击「复制结果」即可粘贴到你的 .ts 文件中。",
  },
];

const faqs = [
  {
    question: "JSON 转 TypeScript 工具免费吗？",
    answer: "完全免费，无需注册，即开即用，无使用次数限制。",
  },
  {
    question: "数据会传到服务器吗？",
    answer:
      "不会。JSON 解析与类型生成全部在浏览器本地完成，您的数据不会离开设备，适合处理敏感数据。",
  },
  {
    question: "数组里元素类型不同怎么办？",
    answer:
      "工具会自动推断为联合类型数组，例如 [1, \"a\", true] 会生成 (number | string | boolean)[]，保证类型覆盖所有元素。",
  },
  {
    question: "支持哪些 JSON 值类型？",
    answer:
      "支持 string、number、boolean、null、数组、嵌套对象与空对象（Record<string, unknown>），覆盖 JSON 规范全部类型。",
  },
];

export default function JsonToTypescriptPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <JsonToTypescriptTool />
      </ToolPageShell>
    </>
  );
}
