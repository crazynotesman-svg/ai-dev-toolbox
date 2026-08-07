import Link from "next/link";
import { DEFAULT_LOCALE } from "@toolbox/shared";
import { getDictionary } from "@/lib/i18n";

/** 顶部导航（文案来自 locales 字典，支持多语言） */
export default function Header({ locale = DEFAULT_LOCALE }: { locale?: string }) {
  const dict = getDictionary(locale) as {
    nav: { tools: string; categories: string; advantages: string; language: string };
    site: { name: string };
  };
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const NAV_LINKS = [
    { href: `${prefix}/tools`, label: dict.nav.tools },
    { href: `${prefix}/#categories`, label: dict.nav.categories },
    { href: `${prefix}/#advantages`, label: dict.nav.advantages },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href={`${prefix}/`} className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </span>
          {dict.site.name}
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-blue-600">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
