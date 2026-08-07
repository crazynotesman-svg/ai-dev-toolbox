import type { ContentSectionItem } from "@/components/tools/ToolPageShell";

/** 内容区块：功能介绍 / 使用教程 通用渲染（段落以 \n\n 分隔） */
export default function ContentSection({
  title,
  items,
}: {
  title: string;
  items: ContentSectionItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <div className="mt-6 space-y-8">
        {items.map((item) => (
          <div key={item.title}>
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <div className="mt-2 space-y-2 text-slate-600">
              {item.body.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
