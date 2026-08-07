import type { Metadata } from "next";
import { SITE_CONFIG } from "@toolbox/shared";
import { getSite, getHrefLang, getOgLocale, localizedPath } from "@/lib/i18n";
import LocaleLangSetter from "@/components/seo/LocaleLangSetter";

/**
 * [locale] 段 layout：为每个语言生成独立 metadata
 * M2.5：canonical 指向自身 + hreflang 全语言标注 + Open Graph locale/twitter
 * 注：App Router 中 [locale] 无法嵌套 html 标签（根 layout 负责），此处仅注入 metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const site = getSite(locale);
  const canonicalPath = localizedPath(locale, "/");
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: site.title,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: site.description,
    keywords: [...site.keywords],
    alternates: {
      canonical: canonicalPath,
      languages: getHrefLang(locale, "/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_CONFIG.name,
      title: site.title,
      description: site.description,
      locale: getOgLocale(locale),
      url: `${SITE_CONFIG.url}${canonicalPath}`,
    },
    twitter: {
      card: "summary",
      title: site.title,
      description: site.description,
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // async component 需要等待 params；此处用组件读取
  return <LocaleLayoutInner params={params}>{children}</LocaleLayoutInner>;
}

async function LocaleLayoutInner({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <LocaleLangSetter locale={locale} />
      {children}
    </>
  );
}
