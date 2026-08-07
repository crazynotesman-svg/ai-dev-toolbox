import Link from "next/link";
import { SITE_CONFIG, TOOL_CATEGORIES } from "@toolbox/shared";

/** 页脚 - 品牌 + 分类入口 + 版权 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900">{SITE_CONFIG.name}</p>
          <p className="mt-2 text-sm text-slate-500">{SITE_CONFIG.description}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">工具分类</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            {TOOL_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <Link href={`/#${cat.id}`} className="transition hover:text-blue-600">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">关于</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="transition hover:text-blue-600">
                首页
              </Link>
            </li>
            <li>
              <Link href="/#advantages" className="transition hover:text-blue-600">
                为什么选择我们
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {SITE_CONFIG.name} · 面向开发者的在线工具集
      </div>
    </footer>
  );
}
