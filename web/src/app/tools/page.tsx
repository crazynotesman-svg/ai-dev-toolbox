import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG, DEFAULT_LOCALE, TOOL_CATEGORY_ORDER, getToolsByCategory } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/home/ToolCard";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { getLocalizedTool, getLocalizedCategory, getHrefLang, getOgLocale } from "@/lib/i18n";

/** 工具索引页 metadata（英文默认） */
const indexTitle = "All Developer Tools | AI Developer Toolbox";
const indexDescription =
  "Free online developer tools: JSON formatter, JSON to TypeScript, JSON to Java, AI JSON analyzer and JWT decoder. All tools run locally in your browser, no registration required.";

export const metadata: Metadata = {
  title: { absolute: indexTitle },
  description: indexDescription,
  keywords: [
    "online developer tools",
    "JSON tools",
    "JWT decoder",
    "developer toolbox",
    "AI Developer Toolbox",
  ],
  alternates: {
    canonical: "/tools",
    languages: getHrefLang(DEFAULT_LOCALE, "/tools"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    title: indexTitle,
    description: indexDescription,
    locale: getOgLocale(DEFAULT_LOCALE),
    url: `${SITE_CONFIG.url}/tools`,
  },
  twitter: {
    card: "summary",
    title: indexTitle,
    description: indexDescription,
  },
};

export default function ToolsPage() {
  const allTools = TOOL_CATEGORY_ORDER.flatMap((catId) =>
    getToolsByCategory(catId)
      .filter((t) => t.status === "live")
      .map((t) => getLocalizedTool(t.slug, DEFAULT_LOCALE))
      .filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );

  /** ItemList JSON-LD（数据驱动） */
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Developer Toolbox Tools",
    itemListElement: allTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      description: tool.description,
      url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "All Tools", path: "/tools" },
        ]}
      />
      <JsonLd data={itemListJsonLd} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="text-sm text-slate-500">
              Home / <span className="text-slate-700">All Tools</span>
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              All Developer Tools
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Free to use, processed locally in your browser. No registration required.
            </p>
          </div>
        </section>

        {/* 分类分组 */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          {TOOL_CATEGORY_ORDER.map((catId) => {
            const tools = getToolsByCategory(catId)
              .filter((t) => t.status === "live")
              .map((t) => getLocalizedTool(t.slug, DEFAULT_LOCALE))
              .filter((t): t is NonNullable<typeof t> => Boolean(t));
            if (tools.length === 0) return null;
            const cat = getLocalizedCategory(catId, DEFAULT_LOCALE);
            return (
              <div key={catId} className="mb-12 last:mb-0">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
                  <span className="text-sm text-slate-400">{tools.length} tools</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* 底部返回 */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
