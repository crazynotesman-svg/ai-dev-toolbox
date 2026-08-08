import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG, TOOL_CATEGORY_ORDER, getToolsByCategory } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/home/ToolCard";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import {
  getLocalizedTool,
  getLocalizedCategory,
  getHrefLang,
  getOgLocale,
  getHome,
  getDictionary,
  localizedPath,
  getStaticLocales,
} from "@/lib/i18n";

/** 多语言工具索引页 metadata（M2.5：全字段来自 locales + hreflang + canonical 自身） */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale) as { nav: { tools: string }; site: { description: string; keywords: string[] } };
  const title = `${dict.nav.tools} | ${SITE_CONFIG.name}`;
  const canonical = localizedPath(locale, "/tools");
  return {
    title: { absolute: title },
    description: dict.site.description,
    keywords: [...dict.site.keywords],
    alternates: {
      canonical,
      languages: getHrefLang(locale, "/tools"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_CONFIG.name,
      title,
      description: dict.site.description,
      locale: getOgLocale(locale),
      url: `${SITE_CONFIG.url}${canonical}`,
    },
    twitter: {
      card: "summary",
      title,
      description: dict.site.description,
    },
  };
}

export async function generateStaticParams() {
  return getStaticLocales().map((locale) => ({ locale }));
}

export default async function LocaleToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const home = getHome(locale);
  const dict = getDictionary(locale) as { nav: { tools: string } };
  const allTools = TOOL_CATEGORY_ORDER.flatMap((catId) =>
    getToolsByCategory(catId)
      .filter((t) => t.status === "live")
      .map((t) => getLocalizedTool(t.slug, locale))
      .filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_CONFIG.name} ${dict.nav.tools}`,
    itemListElement: allTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      description: tool.description,
      url: `${SITE_CONFIG.url}${localizedPath(locale, `/tools/${tool.slug}`)}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: SITE_CONFIG.name, path: localizedPath(locale, "/") },
          { name: dict.nav.tools, path: localizedPath(locale, "/tools") },
        ]}
      />
      <JsonLd data={itemListJsonLd} />
      <Header locale={locale} />
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="text-sm text-slate-500">
              {SITE_CONFIG.name} / <span className="text-slate-700">{dict.nav.tools}</span>
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {dict.nav.tools}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">{home.toolsSubtitle}</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          {TOOL_CATEGORY_ORDER.map((catId) => {
            const tools = getToolsByCategory(catId)
              .filter((t) => t.status === "live")
              .map((t) => getLocalizedTool(t.slug, locale))
              .filter((t): t is NonNullable<typeof t> => Boolean(t));
            if (tools.length === 0) return null;
            const cat = getLocalizedCategory(catId, locale);
            return (
              <div key={catId} className="mb-12 last:mb-0">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
                  <span className="text-sm text-slate-400">{tools.length}</span>
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

          <div className="mt-8 border-t border-slate-200 pt-6">
            <Link href={localizedPath(locale, "/")} className="text-sm text-blue-600 hover:underline">
              ← {SITE_CONFIG.name}
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
