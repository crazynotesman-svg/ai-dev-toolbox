import type { Metadata } from "next";
import { SITE_CONFIG } from "@toolbox/shared";
import JsonLd from "@/components/seo/JsonLd";
import "./globals.css";

/**
 * 站点级 metadata：数据驱动
 * 标题模板 / 描述 / 关键词 / Open Graph / Twitter / robots 全部来自 SITE_CONFIG
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} - 开发者在线工具集`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - 开发者在线工具集`,
    description: SITE_CONFIG.description,
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
  },
  twitter: {
    card: "summary",
    title: `${SITE_CONFIG.name} - 开发者在线工具集`,
    description: SITE_CONFIG.description,
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
      description: SITE_CONFIG.description,
      inLanguage: SITE_CONFIG.locale,
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
      description: SITE_CONFIG.description,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <JsonLd data={jsonLd} />
        {children}
      </body>
    </html>
  );
}
