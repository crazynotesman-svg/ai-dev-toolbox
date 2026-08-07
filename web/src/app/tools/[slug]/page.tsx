import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOL_CONFIGS, DEFAULT_LOCALE } from "@toolbox/shared";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getLocalizedTool } from "@/lib/i18n";

/** 静态导出（output: "export"）下 dynamicParams 必须为 false：未列出的 slug 一律 404 */
export const dynamicParams = false;

/** 静态导出：为尚未上线（planned）的工具生成占位页。
 *  Next 15.5 output:export 下 generateStaticParams 返回空数组会报
 *  "missing generateStaticParams()" 错误，因此全部 live 时返回哨兵参数；
 *  哨兵 slug（__none__）在页面内走 notFound() → 产物自带 <meta robots=noindex>，
 *  且 sitemap 仅收录 LIVE_TOOLS，哨兵页不会被搜索引擎收录。 */
export function generateStaticParams() {
  const planned = TOOL_CONFIGS.filter((tool) => tool.status === "planned");
  if (planned.length === 0) {
    return [{ slug: "__none__" }];
  }
  return planned.map((tool) => ({ slug: tool.slug }));
}

/** 数据驱动 metadata：来自本地化工具（默认英文） */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getLocalizedTool(slug, DEFAULT_LOCALE);
  if (!tool) return { title: "Tool not found" };
  return {
    // absolute：seoTitle 已含品牌后缀，避免与 layout template 重复追加
    title: { absolute: tool.seoTitle },
    description: tool.seoDescription,
    keywords: [...tool.keywords],
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    openGraph: {
      type: "website",
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: `/tools/${tool.slug}`,
    },
  };
}

/** 工具占位页（planned 状态，功能开发中） */
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getLocalizedTool(slug, DEFAULT_LOCALE);
  if (!tool) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <p className="text-sm text-slate-400">{tool.category} · In Development</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{tool.title}</h1>
          <p className="mt-2 text-slate-600">{tool.seoDescription}</p>
          <Link href="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
