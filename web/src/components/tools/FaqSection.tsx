import { SITE_CONFIG } from "@toolbox/shared";
import JsonLd from "@/components/seo/JsonLd";
import { getUi } from "@/lib/i18n";
import type { FaqItem } from "@/components/tools/ToolPageShell";

/**
 * FAQ 区块：可见内容 + FAQPage JSON-LD 结构化数据
 * 静态导出时 JSON-LD 直接写入 HTML，利于 SEO
 *
 * emitJsonLd：是否输出 FAQPage JSON-LD
 * - 默认 true（首页独立使用）
 * - 工具页传 false（由 ToolPageShell 统一生成 FAQPage，合并 locales + content faqs，避免重复）
 */
export default function FaqSection({
  items,
  emitJsonLd = true,
  locale = "en",
}: {
  items: FaqItem[];
  /** 是否输出 FAQPage JSON-LD（工具页关闭，避免与 ToolPageShell 统一生成重复） */
  emitJsonLd?: boolean;
  /** 语言（标题本地化） */
  locale?: string;
}) {
  if (items.length === 0) return null;

  const ui = getUi(locale);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{ui.faq}</h2>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-slate-200 bg-white p-5 open:shadow-sm"
            >
              <summary className="cursor-pointer font-medium text-slate-900">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          仍有疑问？欢迎访问 {SITE_CONFIG.name} 首页查看更多工具。
        </p>
      </div>
      {emitJsonLd && <JsonLd data={faqJsonLd} />}
    </section>
  );
}
