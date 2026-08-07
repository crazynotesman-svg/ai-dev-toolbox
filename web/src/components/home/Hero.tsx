import Link from "next/link";
import { SITE_CONFIG, TOOL_CONFIGS } from "@toolbox/shared";

/** Hero 首屏 - 品牌主张 + CTA */
export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
      <p className="mx-auto mb-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-medium text-blue-700">
        {TOOL_CONFIGS.length} 个工具 · 持续上新
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {SITE_CONFIG.name}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{SITE_CONFIG.description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="#tools"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          开始使用 →
        </Link>
        <Link
          href="#advantages"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          了解更多
        </Link>
      </div>
    </section>
  );
}
