import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_CONFIG, TOOL_CONFIGS } from "@toolbox/shared";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { getToolComponent } from "@/components/tools/registry";
import JsonLd from "@/components/seo/JsonLd";
import { getLocalizedTool, getUi, getHrefLang, getOgLocale, localizedPath, getStaticLocales } from "@/lib/i18n";

/** 静态导出：动态段必须显式列出所有组合 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const locales = getStaticLocales();
  const slugs = TOOL_CONFIGS.filter((t) => t.status === "live").map((t) => t.slug);
  // 生成 [locale]/[slug] 全部组合
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getLocalizedTool(slug, locale);
  if (!tool) return { title: "Tool not found" };
  const canonical = localizedPath(locale, `/tools/${tool.slug}`);
  return {
    title: { absolute: tool.seoTitle },
    description: tool.seoDescription,
    keywords: [...tool.keywords],
    alternates: {
      canonical,
      languages: getHrefLang(locale, `/tools/${tool.slug}`),
    },
    openGraph: {
      type: "website",
      siteName: SITE_CONFIG.name,
      title: tool.seoTitle,
      description: tool.seoDescription,
      locale: getOgLocale(locale),
      url: `${SITE_CONFIG.url}${canonical}`,
    },
    twitter: {
      card: "summary",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export default async function LocaleToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tool = getLocalizedTool(slug, locale);
  if (!tool) notFound();
  const ToolComponent = getToolComponent(slug);
  if (!ToolComponent) notFound();

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    url: `${SITE_CONFIG.url}/${locale}/tools/${tool.slug}`,
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

  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <ToolPageShell tool={tool} features={tool.features} guide={tool.guide} faqs={tool.faqs} locale={locale}>
        <ToolComponent t={getUi(locale)} />
      </ToolPageShell>
    </>
  );
}
