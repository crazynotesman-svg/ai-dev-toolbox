import { SITE_CONFIG } from "@toolbox/shared";
import JsonLd from "@/components/seo/JsonLd";
import type { FaqItem } from "@/components/tools/ToolPageShell";

/**
 * FAQ 区块：可见内容 + FAQPage JSON-LD 结构化数据
 * 静态导出时 JSON-LD 直接写入 HTML，利于 SEO
 */
export default function FaqSection({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">常见问题</h2>
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
      <JsonLd data={faqJsonLd} />
    </section>
  );
}
