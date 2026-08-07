import Link from "next/link";
import { DEFAULT_LOCALE, TOOL_CATEGORY_ORDER } from "@toolbox/shared";
import { getDictionary, getLocalizedCategory } from "@/lib/i18n";

/** 页脚 - 品牌 + 分类入口 + 版权（文案来自 locales 字典，支持多语言） */
export default function Footer({ locale = DEFAULT_LOCALE }: { locale?: string }) {
  const dict = getDictionary(locale) as {
    site: { name: string };
    footer: {
      about: string;
      categories: string;
      aboutTitle: string;
      home: string;
      whyUs: string;
      copyright: string;
    };
  };
  const footer = dict.footer;
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900">{dict.site.name}</p>
          <p className="mt-2 text-sm text-slate-500">{footer.about}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{footer.categories}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            {TOOL_CATEGORY_ORDER.map((catId) => (
              <li key={catId}>
                <Link href={`${prefix}/#${catId}`} className="transition hover:text-blue-600">
                  {getLocalizedCategory(catId, locale).name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{footer.aboutTitle}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href={`${prefix}/`} className="transition hover:text-blue-600">
                {footer.home}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/#advantages`} className="transition hover:text-blue-600">
                {footer.whyUs}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {dict.site.name} · {footer.copyright}
      </div>
    </footer>
  );
}
