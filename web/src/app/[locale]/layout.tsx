import type { Metadata } from "next";
import { SITE_CONFIG } from "@toolbox/shared";
import { getSite } from "@/lib/i18n";
import LocaleLangSetter from "@/components/seo/LocaleLangSetter";

/**
 * [locale] 段 layout：为每个语言生成独立 metadata
 * 注：App Router 中 [locale] 无法嵌套 html 标签（根 layout 负责），此处仅注入 metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const site = getSite(locale);
  return {
    title: {
      default: site.title,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: site.description,
    keywords: [...site.keywords],
    alternates: { canonical: `/${locale === "en" ? "" : `${locale}/`}` },
    openGraph: {
      type: "website",
      siteName: SITE_CONFIG.name,
      title: site.title,
      description: site.description,
      url: `${SITE_CONFIG.url}/${locale === "en" ? "" : `${locale}/`}`,
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
