import type { Metadata } from "next";
import { SITE_CONFIG, DEFAULT_LOCALE } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { getToolComponent } from "@/components/tools/registry";
import JsonLd from "@/components/seo/JsonLd";
import { getLocalizedTool, getUi, getHrefLang, getOgLocale } from "@/lib/i18n";

const tool = getLocalizedTool("json-formatter", DEFAULT_LOCALE)!;
const ToolComponent = getToolComponent("json-formatter")!;

/** 独立 metadata（数据来自 locales；M2.5：hreflang + twitter + OG 补全） */
export const metadata: Metadata = {
  title: { absolute: tool.seoTitle },
  description: tool.seoDescription,
  keywords: [...tool.keywords],
  alternates: {
    canonical: `/tools/${tool.slug}`,
    languages: getHrefLang(DEFAULT_LOCALE, `/tools/${tool.slug}`),
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    title: tool.seoTitle,
    description: tool.seoDescription,
    locale: getOgLocale(DEFAULT_LOCALE),
    url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
  },
  twitter: {
    card: "summary",
    title: tool.seoTitle,
    description: tool.seoDescription,
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

export default function JsonFormatterPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={tool.features} guide={tool.guide} faqs={tool.faqs}>
        <ToolComponent t={getUi(DEFAULT_LOCALE)} />
      </ToolPageShell>
    </>
  );
}
