import type { Metadata } from "next";
import { SITE_CONFIG, DEFAULT_LOCALE } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { getToolComponent } from "@/components/tools/registry";
import JsonLd from "@/components/seo/JsonLd";
import { getLocalizedTool, getUi } from "@/lib/i18n";

const tool = getLocalizedTool("base64-encoder", DEFAULT_LOCALE)!;
const ToolComponent = getToolComponent("base64-encoder")!;

/** 独立 metadata（数据来自 locales 本地化工具） */
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
    priceCurrency: "USD",
  },
  featureList: tool.features.map((f) => f.title),
};

export default function Base64EncoderPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={tool.features} guide={tool.guide} faqs={tool.faqs}>
        <ToolComponent t={getUi(DEFAULT_LOCALE)} />
      </ToolPageShell>
    </>
  );
}
