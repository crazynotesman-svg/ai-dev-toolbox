import { TOOL_CATEGORIES, getToolsByCategory } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ToolCard from "@/components/home/ToolCard";
import Advantages from "@/components/home/Advantages";

/**
 * 首页：Hero + 工具分类 + 工具卡 + 使用优势 + Footer
 * 全部数据驱动：分类与工具来自 shared 配置，新增工具自动渲染
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />

        {/* 工具分类 + 工具卡 */}
        <section id="tools" className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">全部工具</h2>
          <p className="mt-2 text-slate-500">按需选用，全部免费，持续上新</p>

          {TOOL_CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category.id);
            if (tools.length === 0) return null;
            return (
              <div key={category.id} id={category.id} className="mt-10 scroll-mt-20">
                <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
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
      </main>
      <Footer />
    </div>
  );
}
