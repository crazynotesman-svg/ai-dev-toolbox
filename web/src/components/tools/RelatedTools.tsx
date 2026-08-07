import Link from "next/link";
import { LIVE_TOOLS, DEFAULT_LOCALE } from "@toolbox/shared";
import { getLocalizedTool } from "@/lib/i18n";

/**
 * 相关工具交叉链接：展示其他已上线（live）工具
 * 用于工具页 SEO 内部链接（提升站内权重传递与用户浏览深度）
 * 数据来自本地化工具（默认英文），语言由站点 locale 决定
 */
export default function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const related = LIVE_TOOLS.filter((tool) => tool.slug !== currentSlug)
    .map((tool) => getLocalizedTool(tool.slug, DEFAULT_LOCALE))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  if (related.length === 0) return null;

  return (
    <section className="border-t border-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">More Tools</h2>
        <p className="mt-2 text-slate-500">Explore other free online developer tools</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
              <span className="mt-3 inline-block text-xs text-blue-600">Use now →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
