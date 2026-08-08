import type { ToolContent } from "@/lib/content/types";
import { getUi } from "@/lib/i18n";

/**
 * ToolContent 渲染器（server component）
 *
 * 结构渲染（非 markdown 渲染）：遍历 ToolContent 字段输出语义化 section
 * 章节标题来自 locales ui 区块（多语言），字段内容来自 MDX frontmatter
 *
 * 渲染结构（存在才输出）：
 *   Introduction → Features → Examples → Guide → Use Cases → FAQ
 */
export default function ToolContentRenderer({
  content,
  locale,
}: {
  content: ToolContent;
  /** 语言（章节标题本地化） */
  locale: string;
}) {
  const ui = getUi(locale);

  return (
    <div className="mt-4 space-y-8">
      {content.introduction && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.introduction}</h2>
          {content.introduction.split(/\n\n+/).map((paragraph, i) => (
            <p key={i} className="mt-3 text-sm leading-6 text-slate-600">
              {paragraph}
            </p>
          ))}
        </section>
      )}

      {content.features && content.features.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.features}</h2>
          <ul className="mt-4 space-y-3">
            {content.features.map((feature, i) => (
              <li key={i} className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-900">{feature.title}：</span>
                {feature.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.examples && content.examples.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.examples}</h2>
          <div className="mt-4 space-y-6">
            {content.examples.map((example, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-slate-900">{example.title}</h3>
                {example.input !== undefined && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400">{ui.inputLabel}</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-100">
                      {example.input}
                    </pre>
                  </div>
                )}
                {example.output !== undefined && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400">{ui.outputLabel}</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-800">
                      {example.output}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.guide && content.guide.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.howToUse}</h2>
          <ol className="mt-4 space-y-4">
            {content.guide.map((step) => (
              <li key={step.step} className="flex gap-3 text-sm leading-6 text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {step.step}
                </span>
                <span>
                  <span className="font-semibold text-slate-900">{step.title}：</span>
                  {step.description}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.useCases && content.useCases.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.useCases}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            {content.useCases.map((useCase, i) => (
              <li key={i}>{useCase}</li>
            ))}
          </ul>
        </section>
      )}

      {content.faqs && content.faqs.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">{ui.faq}</h2>
          <div className="mt-4 space-y-4">
            {content.faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
