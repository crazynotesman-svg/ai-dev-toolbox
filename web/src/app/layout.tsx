import type { Metadata } from "next";
import { SITE_CONFIG, DEFAULT_LOCALE } from "@toolbox/shared";
import { getSite, getHrefLang, getOgLocale } from "@/lib/i18n";
import JsonLd from "@/components/seo/JsonLd";
import "./globals.css";

/**
 * 站点级 metadata（默认语言 = en）
 * 标题模板 / 描述 / 关键词 / Open Graph / Twitter 全部来自 locales en.json
 * M2.5：英文首页 hreflang（en/zh-CN/ja + x-default）全语言标注
 */
const locale = DEFAULT_LOCALE;
const site = getSite(locale);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: site.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  alternates: {
    canonical: "/",
    languages: getHrefLang(DEFAULT_LOCALE, "/"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    title: site.title,
    description: site.description,
    locale: getOgLocale(DEFAULT_LOCALE),
    url: SITE_CONFIG.url,
  },
  twitter: {
    card: "summary",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** WebSite + Organization 结构化数据（全站注入） */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: site.description,
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_CONFIG.url}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: site.description,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <JsonLd data={jsonLd} />
        {children}
      </body>
    </html>
  );
}
