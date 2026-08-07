import type { ToolConfig } from "@toolbox/shared";

/** 工具页 Hero：面包屑 + H1 + 描述 */
export default function ToolHero({ tool }: { tool: ToolConfig }) {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-500">
          首页 / 工具 / <span className="text-slate-700">{tool.title}</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">{tool.description}</p>
      </div>
    </section>
  );
}
