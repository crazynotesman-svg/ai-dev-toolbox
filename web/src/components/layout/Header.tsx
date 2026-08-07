import Link from "next/link";
import { DEFAULT_LOCALE } from "@toolbox/shared";
import { getDictionary } from "@/lib/i18n";

/** 顶部导航（文案来自 locales 字典，默认英文） */
export default function Header() {
  const dict = getDictionary(DEFAULT_LOCALE) as {
    nav: { tools: string; categories: string; advantages: string };
    site: { name: string };
  };
  const NAV_LINKS = [
    { href: "/tools", label: dict.nav.tools },
    { href: "/#categories", label: dict.nav.categories },
    { href: "/#advantages", label: dict.nav.advantages },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
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
