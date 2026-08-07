import Link from "next/link";
import { SITE_CONFIG } from "@toolbox/shared";

/** 顶部导航 */
const NAV_LINKS = [
  { href: "/tools", label: "全部工具" },
  { href: "/#categories", label: "工具分类" },
  { href: "/#advantages", label: "使用优势" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </span>
          {SITE_CONFIG.name}
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
