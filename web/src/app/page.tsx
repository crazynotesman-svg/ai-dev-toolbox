import { DEFAULT_LOCALE, TOOL_CATEGORY_ORDER, getToolsByCategory, getPopularTools } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ToolCard from "@/components/home/ToolCard";
import Advantages from "@/components/home/Advantages";
import FaqSection from "@/components/tools/FaqSection";
import { getDictionary, getLocalizedTool, getLocalizedCategory, getHome, getHomeFaqs } from "@/lib/i18n";

/**
 * 首页（默认英文）：Hero → Popular Tools → Tool Categories → Why Choose → FAQ
 * 全部数据驱动：技术元数据来自 shared，展示内容来自 locales
 */
export default function Home() {
  const dict = getDictionary(DEFAULT_LOCALE) as {
    home: {
      popularTitle: string;
      popularSubtitle: string;
      toolsTitle: string;
      toolsSubtitle: string;
      faqTitle: string;
      faqSubtitle: string;
    };
    categories: Record<string, { name: string; description: string }>;
  };
  const home = getHome(DEFAULT_LOCALE);
  const homeFaqs = getHomeFaqs(DEFAULT_LOCALE);

  // 热门工具（shared priority 降序）
  const popularTools = getPopularTools(4)
    .map((t) => getLocalizedTool(t.slug, DEFAULT_LOCALE))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />

        {/* Popular Tools（热门工具） */}
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

        {/* Tool Categories（分类导航锚点，修复 #categories 死链） */}
        <section id="categories" className="mx-auto max-w-5xl px-6 py-8">
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TOOL_CATEGORY_ORDER.map((catId) => {
              const cat = getLocalizedCategory(catId, DEFAULT_LOCALE);
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

        {/* All Tools（工具分类 + 工具卡） */}
        <section id="tools" className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{home.toolsTitle}</h2>
          <p className="mt-2 text-slate-500">{home.toolsSubtitle}</p>

          {TOOL_CATEGORY_ORDER.map((catId) => {
            const tools = getToolsByCategory(catId)
              .filter((t) => t.status === "live")
              .map((t) => getLocalizedTool(t.slug, DEFAULT_LOCALE))
              .filter((t): t is NonNullable<typeof t> => Boolean(t));
            if (tools.length === 0) return null;
            const cat = getLocalizedCategory(catId, DEFAULT_LOCALE);
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

        {/* 首页 FAQ（复用 FaqSection，自动生成 FAQPage JSON-LD） */}
        <section className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{home.faqTitle}</h2>
          <p className="mt-2 text-slate-500">{home.faqSubtitle}</p>
          <div className="mt-6">
            <FaqSection items={homeFaqs} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
