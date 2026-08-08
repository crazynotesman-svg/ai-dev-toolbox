import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@toolbox/shared";
import type { LocalizedTool } from "@/lib/i18n";
import { getNav, getUi } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolHero from "@/components/tools/ToolHero";
import ContentSection from "@/components/tools/ContentSection";
import FaqSection from "@/components/tools/FaqSection";
import RelatedTools from "@/components/tools/RelatedTools";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

/** 默认输入上限（工具未配置 inputLimit 时兜底，字节） */
const DEFAULT_INPUT_LIMIT = 10 * 1024 * 1024;

/** 输入上限可读文案（单一事实源：tool.inputLimit，缺省用默认值） */
function formatInputLimit(tool: { inputLimit?: number }): string {
  const bytes = tool.inputLimit ?? DEFAULT_INPUT_LIMIT;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContentSectionItem {
  title: string;
  /** 支持 markdown 风格段落：\n\n 分隔段落 */
  body: string;
}

/**
 * 工具页通用骨架：Hero → 工具区域 → 功能介绍 → 使用教程 → FAQ → 相关工具
 * 统一注入 BreadcrumbList JSON-LD（站点级 SEO，不复制到各页）
 * 接收 LocalizedTool（技术元数据 + 本地化内容）与 locale（默认 en）
 */
export default function ToolPageShell({
  tool,
  children,
  features,
  guide,
  faqs,
  locale = DEFAULT_LOCALE,
}: {
  tool: LocalizedTool;
  /** 工具交互区（client component） */
  children: ReactNode;
  /** 功能介绍 */
  features: ContentSectionItem[];
  /** 使用教程 */
  guide: ContentSectionItem[];
  /** FAQ */
  faqs: FaqItem[];
  /** 语言（默认 en） */
  locale?: string;
}) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const nav = getNav(locale);
  const ui = getUi(locale);

  return (
    <div className="flex min-h-screen flex-col">
      {/* 面包屑结构化数据：首页 / 工具 / 当前工具（名称本地化） */}
      <BreadcrumbJsonLd
        items={[
          { name: nav.home, path: `${prefix}/` },
          { name: nav.tools, path: `${prefix}/tools` },
          { name: tool.title, path: `${prefix}/tools/${tool.slug}` },
        ]}
      />
      <Header locale={locale} />
      <main className="flex-1">
        <ToolHero tool={tool} />
        {/* 工具交互区 */}
        <section className="mx-auto max-w-5xl px-6 py-8">
          {/* 统一公共提示：输入限制与隐私说明（站点级，所有工具生效） */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">⚡</span> Empty-input detection · Limit {formatInputLimit(tool)} per request
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">🔒</span> Data is processed locally in your browser
            </span>
          </div>
          {children}
        </section>
        {/* 功能介绍 */}
        <ContentSection title={ui.features} items={features} />
        {/* 使用教程 */}
        <ContentSection title={ui.howToUse} items={guide} />
        {/* FAQ */}
        <FaqSection items={faqs} />
        {/* 相关工具交叉链接（SEO 内部链接） */}
        <RelatedTools currentSlug={tool.slug} locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
