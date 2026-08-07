import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import JsonFormatterTool from "@/components/tools/JsonFormatterTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("json-formatter")!;

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

/** SoftwareApplication 结构化数据（工具类页面标准 schema） */
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
  featureList: ["JSON 格式化", "JSON 压缩", "JSON 校验", "一键复制"],
};

const features = [
  {
    title: "JSON 格式化",
    body: "将压缩或杂乱的 JSON 一键美化，采用 2 空格缩进，层级清晰易读，方便快速检查数据结构和字段关系。",
  },
  {
    title: "JSON 压缩（Minify）",
    body: "移除所有多余空白与换行，将 JSON 压缩为单行，适合减少存储体积、日志输出或接口传输时的数据量。",
  },
  {
    title: "JSON 校验",
    body: "对输入进行严格的语法校验，非法 JSON 会提示错误类型，并自动定位到出错的行号与列号，方便快速修复。",
  },
  {
    title: "本地处理 · 隐私安全",
    body: "所有处理均在浏览器本地完成，数据不会上传到任何服务器，适合粘贴包含敏感信息的业务数据。",
  },
];

const guide = [
  {
    title: "第一步：粘贴 JSON",
    body: "在左侧输入框中粘贴需要处理的 JSON 文本，或点击「载入示例」快速体验。",
  },
  {
    title: "第二步：选择操作",
    body: "点击「格式化」美化缩进，点击「压缩」生成单行紧凑格式，点击「校验」检查语法合法性。",
  },
  {
    title: "第三步：复制结果",
    body: "处理结果出现在右侧输出区，点击「复制结果」一键复制到剪贴板，可直接粘贴到代码或文档中。",
  },
];

const faqs = [
  {
    question: "这个 JSON 格式化工具是免费的吗？",
    answer: "完全免费，无需注册登录，即开即用，没有使用次数限制。",
  },
  {
    question: "我的 JSON 数据会上传到服务器吗？",
    answer:
      "不会。格式化、压缩、校验全部在浏览器本地完成，您的数据不会离开您的设备，适合处理敏感业务数据。",
  },
  {
    question: "格式化时出现语法错误怎么办？",
    answer:
      "工具会提示错误的具体位置（行号与列号），您可以据此定位到输入文本中的问题区域。常见错误包括缺少逗号、引号不匹配、多余的尾逗号等。",
  },
  {
    question: "支持多大的 JSON 文件？",
    answer:
      "单次输入上限为 10MB，足以覆盖绝大多数日常场景。超大文件建议先裁剪后处理。",
  },
];

export default function JsonFormatterPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <JsonFormatterTool />
      </ToolPageShell>
    </>
  );
}
