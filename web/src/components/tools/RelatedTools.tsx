import Link from "next/link";
import { TOOL_CONFIGS, type ToolConfig } from "@toolbox/shared";

/**
 * 相关工具交叉链接：展示其他已上线（live）工具
 * 用于工具页 SEO 内部链接（提升站内权重传递与用户浏览深度）
 * 放在每个工具页底部，与其他工具互链
 */
export default function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const related = TOOL_CONFIGS.filter(
    (tool) => tool.status === "live" && tool.slug !== currentSlug,
  );
  if (related.length === 0) return null;

  return (
    <section className="border-t border-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">更多工具</h2>
        <p className="mt-2 text-slate-500">探索其他免费在线开发者工具</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((tool: ToolConfig) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
              <span className="mt-3 inline-block text-xs text-blue-600">立即使用 →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
