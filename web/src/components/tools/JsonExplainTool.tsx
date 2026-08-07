"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { explainJson, createExplainDemo, type JsonExplainResult } from "@/lib/tools/json-explain";

type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** 类型徽章颜色 */
const TYPE_COLORS: Record<string, string> = {
  object: "bg-blue-50 text-blue-700 border-blue-200",
  array: "bg-purple-50 text-purple-700 border-purple-200",
  string: "bg-emerald-50 text-emerald-700 border-emerald-200",
  number: "bg-amber-50 text-amber-700 border-amber-200",
  boolean: "bg-sky-50 text-sky-700 border-sky-200",
  null: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROOT_TYPE_LABEL: Record<string, string> = {
  object: "对象（Object）",
  array: "数组（Array）",
  string: "字符串（String）",
  number: "数字（Number）",
  boolean: "布尔值（Boolean）",
  null: "空值（Null）",
};

/** 单条摘要行 */
function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">({hint})</span>}
      </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

/** JSON 结构分析工具主体（纯客户端，数据不出浏览器） */
export default function JsonExplainTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<JsonExplainResult | null>(null);
  const [errorText, setErrorText] = useState<{ message: string; context?: string } | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const bytes = new TextEncoder().encode(trimmed).length;
    return { bytes, lines: trimmed.split("\n").length };
  }, [input]);

  const analyze = useCallback(() => {
    const r = explainJson(input);
    if (r.ok) {
      setResult(r.data);
      setErrorText(null);
      setNotice({ type: "success", text: "分析完成 ✓" });
    } else {
      setResult(null);
      setErrorText({ message: r.error.message, context: r.error.context });
      setNotice({ type: "error", text: r.error.message });
    }
  }, [input]);

  /** 复制分析结果（文本形式） */
  const copyResult = useCallback(async () => {
    if (!result) {
      setNotice({ type: "error", text: "暂无分析结果可复制" });
      return;
    }
    const lines = [
      `JSON 结构分析（耗时 ${result.elapsedMs}ms）`,
      `- 根类型：${ROOT_TYPE_LABEL[result.rootType]}`,
      `- 顶层字段/元素：${result.topLevelCount}`,
      `- 字段总数：${result.totalFieldCount}`,
      `- 最大嵌套深度：${result.maxDepth}`,
      `- 类型分布：${result.typeStats.map((t) => `${t.type}×${t.count}`).join(", ") || "无字段"}`,
      `- 数组数量：${result.arrayAnalysis.count}（最大长度 ${result.arrayAnalysis.maxLength}）`,
      `- 空值数量：${result.nullCount}`,
    ];
    if (result.sensitiveFields.length > 0) {
      lines.push(`- 敏感字段：${result.sensitiveFields.map((s) => `${s.path}(${s.level})`).join(", ")}`);
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: "success", text: "已复制分析结果 ✓" });
    } catch {
      outputRef.current?.focus();
      document.execCommand("copy");
      setNotice({ type: "success", text: "已复制（兼容模式）✓" });
    }
  }, [result]);

  const loadSample = useCallback(() => {
    setInput(createExplainDemo());
    setResult(null);
    setErrorText(null);
    setNotice({ type: "info", text: "已载入示例数据，点击「开始分析」试试" });
  }, []);

  const clearAll = useCallback(() => {
    setInput("");
    setResult(null);
    setErrorText(null);
    setNotice(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* 输入区 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <button
            onClick={analyze}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            开始分析
          </button>
          <button
            onClick={copyResult}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            复制结果
          </button>
          <button
            onClick={loadSample}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            载入示例
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-red-500"
          >
            清空
          </button>
        </div>
        <div className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">JSON 输入</label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
              setErrorText(null);
              setNotice(null);
            }}
            spellCheck={false}
            placeholder='粘贴 JSON，例如：{"user": {"name": "Alice"}}'
            className="h-48 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="text-xs text-slate-400">
              {inputStats
                ? `输入 ${inputStats.lines} 行 · ${(inputStats.bytes / 1024).toFixed(1)} KB`
                : "输入统计：—"}
            </span>
            <span className="text-xs text-slate-400">全部在浏览器本地处理，数据不会上传</span>
            {notice && (
              <span
                className={`ml-auto text-sm font-medium ${
                  notice.type === "error"
                    ? "text-red-600"
                    : notice.type === "success"
                      ? "text-emerald-600"
                      : "text-slate-500"
                }`}
              >
                {notice.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {errorText && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">JSON 解析失败</p>
          <p className="mt-1 font-mono text-sm text-red-600">{errorText.message}</p>
          {errorText.context && (
            <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 font-mono text-xs text-red-700">
              {errorText.context}
            </p>
          )}
        </div>
      )}

      {/* 分析结果卡片 */}
      {result && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">数据结构摘要</h3>
              <span className="text-xs text-slate-400">耗时 {result.elapsedMs}ms</span>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">根类型：</span>
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${
                    TYPE_COLORS[result.rootType] ?? TYPE_COLORS.object
                  }`}
                >
                  {ROOT_TYPE_LABEL[result.rootType]}
                </span>
              </div>
              <div ref={outputRef} tabIndex={-1} className="outline-none">
                <StatRow label="顶层字段 / 元素数" value={String(result.topLevelCount)} />
                <StatRow label="字段总数" value={String(result.totalFieldCount)} hint="递归统计" />
                <StatRow label="最大嵌套深度" value={`${result.maxDepth} 层`} />
                <StatRow
                  label="数组数量"
                  value={`${result.arrayAnalysis.count} 个`}
                  hint={result.arrayAnalysis.count > 0 ? `最大长度 ${result.arrayAnalysis.maxLength}` : undefined}
                />
                <StatRow label="空值（null）数量" value={String(result.nullCount)} />
              </div>
            </div>
          </div>

          {/* 类型分布 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">类型分布</h3>
            </div>
            <div className="p-4">
              {result.typeStats.length === 0 ? (
                <p className="text-sm text-slate-400">JSON 无内部字段（空对象/原始值）</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.typeStats.map((stat) => (
                    <span
                      key={stat.type}
                      className={`rounded-full border px-3 py-1 text-sm font-medium ${
                        TYPE_COLORS[stat.type] ?? TYPE_COLORS.object
                      }`}
                    >
                      {stat.type} × {stat.count}
                    </span>
                  ))}
                </div>
              )}
              {result.arrayAnalysis.count > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-sm text-slate-500">数组元素类型分布：</p>
                  <div className="flex flex-wrap gap-2">
                    {result.arrayAnalysis.elementTypes.map((stat) => (
                      <span
                        key={stat.type}
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${
                          TYPE_COLORS[stat.type] ?? TYPE_COLORS.object
                        }`}
                      >
                        {stat.type} × {stat.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 安全提示 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">安全提示</h3>
            </div>
            <div className="p-4">
              {result.sensitiveFields.length === 0 ? (
                <p className="text-sm text-emerald-700">✓ 未检测到常见敏感字段</p>
              ) : (
                <div className="space-y-2">
                  {result.sensitiveFields.map((s) => (
                    <div
                      key={s.path}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                        s.level === "high"
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <span className="font-mono text-sm text-slate-800">{s.path}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.level === "high"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {s.level === "high" ? "高危" : "注意"}
                      </span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-slate-500">
                    检测到敏感字段（如密码、Token、卡号等），请勿将包含真实敏感数据的 JSON 粘贴到公开位置。
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
