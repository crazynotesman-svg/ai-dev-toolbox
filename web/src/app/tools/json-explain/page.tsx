import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import JsonExplainTool from "@/components/tools/JsonExplainTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("json-explain")!;

/** 独立 metadata（数据来自 shared 配置） */
export const metadata: Metadata = {
  title: { absolute: "AI JSON 分析工具 - 结构与安全体检 | AI Developer Toolbox" },
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
  name: "AI JSON 分析工具",
  url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: tool.seoDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
  },
  featureList: ["JSON 结构分析", "字段类型统计", "嵌套深度检测", "敏感字段识别"],
};

const features = [
  {
    title: "JSON 结构分析",
    body: "粘贴 JSON 即可自动分析根类型、顶层字段数、递归字段总数与最大嵌套深度，快速掌握数据结构全貌。",
  },
  {
    title: "字段类型统计",
    body: "统计全部字段的类型分布（object / array / string / number / boolean / null），并单独展示数组元素类型构成。",
  },
  {
    title: "敏感字段识别",
    body: "自动识别常见敏感字段（密码、Token、API Key、卡号、身份证、手机号、邮箱等），按高危/注意两级提示，帮助排查数据泄露风险。",
  },
  {
    title: "本地处理 · 隐私安全",
    body: "所有分析在浏览器本地完成，数据不会上传到任何服务器，适合对含敏感信息的 JSON 做安全检查。",
  },
];

const guide = [
  {
    title: "第一步：粘贴 JSON",
    body: "在输入框粘贴 JSON 数据，或点击「载入示例」快速体验（示例包含嵌套对象、数组与敏感字段）。",
  },
  {
    title: "第二步：开始分析",
    body: "点击「开始分析」获取结构摘要、类型分布与安全提示。非法 JSON 会提示错误行列号与附近文本。",
  },
  {
    title: "第三步：复制结果",
    body: "点击「复制结果」将分析摘要复制到剪贴板，便于写入文档或报告。",
  },
];

const faqs = [
  {
    question: "AI JSON 分析工具免费吗？",
    answer: "完全免费，无需注册，即开即用，无使用次数限制。",
  },
  {
    question: "JSON 数据会上传到服务器吗？",
    answer:
      "不会。结构分析全部在浏览器本地完成，您的数据不会离开设备，可放心粘贴包含敏感信息的 JSON 做安全检查。",
  },
  {
    question: "最大嵌套深度是怎么计算的？",
    answer:
      "根节点计为第 1 层，每深入一层对象或数组，深度 +1。例如 {\"a\":{\"b\":1}} 的最大深度为 3。",
  },
  {
    question: "敏感字段识别有哪些规则？",
    answer:
      "覆盖常见敏感字段：password/passwd、secret、token、apiKey、authorization、信用卡号、身份证号、SSN、手机号、邮箱、生日、地址等，按高危与注意两级提示。",
  },
];

export default function JsonExplainPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <JsonExplainTool />
      </ToolPageShell>
    </>
  );
}
