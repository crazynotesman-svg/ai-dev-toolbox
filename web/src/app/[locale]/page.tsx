import { TOOL_CATEGORY_ORDER, getToolsByCategory, getPopularTools } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ToolCard from "@/components/home/ToolCard";
import Advantages from "@/components/home/Advantages";
import FaqSection from "@/components/tools/FaqSection";
import { getLocalizedTool, getLocalizedCategory, getHome, getHomeFaqs, getStaticLocales } from "@/lib/i18n";

/**
 * 多语言首页（[locale]/page.tsx）
 * 英文由根路由 app/page.tsx 承担，本路由只生成非英文的 enabled 语言（zh-CN/ja）
 */
export async function generateStaticParams() {
  return getStaticLocales().map((locale) => ({ locale }));
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const home = getHome(locale);
  const homeFaqs = getHomeFaqs(locale);

  const popularTools = getPopularTools(4)
    .map((t) => getLocalizedTool(t.slug, locale))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">
        <Hero locale={locale} />

        {popularTools.length > 0 && (
          <section className="mx-auto max-w-5xl px-6 py-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{home.popularTitle}</h2>
            <p className="mt-2 text-slate-500">{home.popularSubtitle}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        )}

        <section id="categories" className="mx-auto max-w-5xl px-6 py-8">
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TOOL_CATEGORY_ORDER.map((catId) => {
              const cat = getLocalizedCategory(catId, locale);
              const count = getToolsByCategory(catId).filter((t) => t.status === "live").length;
              return (
                <a
                  key={catId}
                  href="#tools"
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"
                >
                  <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{count} tools</p>
                </a>
              );
            })}
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{home.toolsTitle}</h2>
          <p className="mt-2 text-slate-500">{home.toolsSubtitle}</p>

          {TOOL_CATEGORY_ORDER.map((catId) => {
            const tools = getToolsByCategory(catId)
              .filter((t) => t.status === "live")
              .map((t) => getLocalizedTool(t.slug, locale))
              .filter((t): t is NonNullable<typeof t> => Boolean(t));
            if (tools.length === 0) return null;
            const cat = getLocalizedCategory(catId, locale);
            return (
              <div key={catId} id={catId} className="mt-10 scroll-mt-20">
                <h3 className="text-lg font-semibold text-slate-900">{cat.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <Advantages />

        <section className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{home.faqTitle}</h2>
          <p className="mt-2 text-slate-500">{home.faqSubtitle}</p>
          <div className="mt-6">
            <FaqSection items={homeFaqs} />
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
