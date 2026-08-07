import Link from "next/link";
import type { ToolCategoryId, ToolConfig } from "@toolbox/shared";

/** 分类 → 主题色（Tailwind 静态类，保证可被扫描到） */
const CATEGORY_STYLE: Record<
  ToolCategoryId,
  { badge: string; iconBg: string; iconText: string; hover: string }
> = {
  json: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    hover: "hover:border-blue-400",
  },
  developer: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-100",
    iconText: "text-purple-700",
    hover: "hover:border-purple-400",
  },
  security: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    hover: "hover:border-amber-400",
  },
};

/** 单个工具卡片 - 数据驱动渲染 */
export default function ToolCard({ tool }: { tool: ToolConfig }) {
  const style = CATEGORY_STYLE[tool.category];
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md ${style.hover}`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </span>
        <span className="text-xs text-slate-300 transition group-hover:text-slate-400">→</span>
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{tool.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
    </Link>
  );
}
