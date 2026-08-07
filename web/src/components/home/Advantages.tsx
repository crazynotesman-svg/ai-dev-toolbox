import { DEFAULT_LOCALE } from "@toolbox/shared";
import { getDictionary } from "@/lib/i18n";

const ICONS: Record<string, React.ReactNode> = {
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  spark: <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.5L5.7 21.4 8 14 2 9.4h7.6L12 2z" />,
  free: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-4.5 5h4a4.5 4.5 0 0 1 0 9h-1a2 2 0 1 1 0-4h2M12 7v12" />,
};

/** 首页优势区（文案来自 locales 字典） */
export default function Advantages() {
  const dict = getDictionary(DEFAULT_LOCALE) as {
    advantages: {
      title: string;
      subtitle: string;
      items: { title: string; desc: string; icon: string }[];
    };
  };
  const adv = dict.advantages;

  return (
    <section id="advantages" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">{adv.title}</h2>
      <p className="mt-2 text-center text-slate-500">{adv.subtitle}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adv.items.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[item.icon]}
              </svg>
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
