import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG, TOOL_CATEGORIES, getToolsByCategory } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/home/ToolCard";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

/** 工具索引页 metadata */
export const metadata: Metadata = {
  title: { absolute: "全部在线开发工具 | AI Developer Toolbox" },
  description:
    "免费在线开发者工具集：JSON 格式化、JSON 转 TypeScript、JSON 转 Java、AI JSON 分析、JWT 解析。全部工具浏览器本地处理，无需注册。",
  keywords: [
    "在线开发工具",
    "JSON 工具",
    "JWT 解析",
    "开发者工具箱",
    "AI Developer Toolbox",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    type: "website",
    title: "全部在线开发工具 | AI Developer Toolbox",
    description:
      "免费在线开发者工具集：JSON 格式化、转换、分析与安全解析。浏览器本地处理，无需注册。",
    url: "/tools",
  },
};

/** 索引页 ItemList JSON-LD（工具列表结构化数据） */
const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AI Developer Toolbox 在线工具",
  itemListElement: TOOL_CATEGORIES.flatMap((category) =>
    getToolsByCategory(category.id).map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      description: tool.description,
      url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
    })),
  ),
};

export default function ToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "首页", path: "/" },
          { name: "全部工具", path: "/tools" },
        ]}
      />
      <JsonLd data={itemListJsonLd} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="text-sm text-slate-500">
              首页 / <span className="text-slate-700">全部工具</span>
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              全部开发工具
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              免费在线使用，数据仅在浏览器本地处理，无需注册登录。
            </p>
          </div>
        </section>

        {/* 分类分组 */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          {TOOL_CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category.id);
            if (tools.length === 0) return null;
            return (
              <div key={category.id} className="mb-12 last:mb-0">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                  <span className="text-sm text-slate-400">{tools.length} 个工具</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
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
              ← 返回首页
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
