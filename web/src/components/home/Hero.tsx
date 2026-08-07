import Link from "next/link";
import { DEFAULT_LOCALE, LIVE_TOOLS } from "@toolbox/shared";
import { getDictionary, format } from "@/lib/i18n";

/** Hero 首屏 - 品牌主张 + 双 CTA（文案来自 locales 字典，支持多语言） */
export default function Hero({ locale = DEFAULT_LOCALE }: { locale?: string }) {
  const dict = getDictionary(locale) as {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      ctaPrimary: string;
      ctaSecondary: string;
      features: string[];
    };
  };
  const hero = dict.hero;

  return (
    <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
      <p className="mx-auto mb-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-medium text-blue-700">
        {format(hero.badge, { count: LIVE_TOOLS.length })}
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {hero.title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{hero.subtitle}</p>
      {/* 关键词特征行：fast / private / browser-based / AI utilities */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hero.features.map((f) => (
          <span
            key={f}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
          >
            {f}
          </span>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="#tools"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          {hero.ctaPrimary} →
        </Link>
        <Link
          href="#advantages"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          {hero.ctaSecondary}
        </Link>
      </div>
    </section>
  );
}
