import type { Metadata } from "next";
import { SITE_CONFIG, getToolBySlug } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import JsonToJavaTool from "@/components/tools/JsonToJavaTool";
import JsonLd from "@/components/seo/JsonLd";

const tool = getToolBySlug("json-to-java")!;

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
  featureList: ["JSON 转 Java POJO", "嵌套对象支持", "List 泛型数组", "getter/setter 生成"],
};

const features = [
  {
    title: "JSON 转 Java POJO 类",
    body: "粘贴 JSON 即可自动生成对应 Java 类，字段类型智能映射：字符串 → String、整数 → Integer/Long、小数 → Double、布尔 → Boolean，可直接用于项目。",
  },
  {
    title: "嵌套对象自动拆解",
    body: "嵌套对象自动生成为内部 static class，保持层次结构清晰，字段引用类型安全。",
  },
  {
    title: "数组对象 List 泛型",
    body: "对象数组自动映射为 List<ClassName>，基础类型数组映射为 List<String>/List<Integer> 等泛型，异构数组退化为 List<Object>。",
  },
  {
    title: "getter/setter 自动生成",
    body: "每个字段自动生成标准的 getXxx() / setXxx() 方法，符合 JavaBean 规范，可直接配合 Jackson / Gson 等序列化框架使用。",
  },
];

const guide = [
  {
    title: "第一步：粘贴 JSON",
    body: "在输入框粘贴 JSON 数据，或点击「载入示例」快速体验。",
  },
  {
    title: "第二步：设置类名",
    body: "自定义根类名（默认 RootObject），生成结果将以此作为主类名。",
  },
  {
    title: "第三步：生成并复制",
    body: "点击「生成 Java 类」得到 POJO 代码，点击「复制结果」即可粘贴到你的 Java 项目中。",
  },
];

const faqs = [
  {
    question: "JSON 转 Java 工具免费吗？",
    answer: "完全免费，无需注册，即开即用，无使用次数限制。",
  },
  {
    question: "数据会传到服务器吗？",
    answer:
      "不会。JSON 解析与 Java 类生成全部在浏览器本地完成，您的数据不会离开设备。",
  },
  {
    question: "生成的类可以直接用吗？",
    answer:
      "可以。生成的是标准 JavaBean（POJO）：包含 private 字段、getter/setter，配合 Jackson、Gson 等框架可开箱即用。",
  },
  {
    question: "字段名与 Java 关键字冲突怎么办？",
    answer:
      "若 JSON 字段名与 Java 关键字（如 class、new）冲突，工具会自动追加下划线后缀，保证生成代码可编译。",
  },
];

export default function JsonToJavaPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={features} guide={guide} faqs={faqs}>
        <JsonToJavaTool />
      </ToolPageShell>
    </>
  );
}
