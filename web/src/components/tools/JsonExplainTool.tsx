"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { mergeUiText, type UiText } from "@/lib/i18n/ui-text";
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
  object: "Object",
  array: "Array",
  string: "String",
  number: "Number",
  boolean: "Boolean",
  null: "Null",
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
export default function JsonExplainTool({ t }: { t?: Partial<UiText> }) {
  const ui = mergeUiText(t);
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
      setNotice({ type: "success", text: "Analysis complete ✓" });
    } else {
      setResult(null);
      setErrorText({ message: r.error.message, context: r.error.context });
      setNotice({ type: "error", text: r.error.message });
    }
  }, [input]);

  /** 复制分析结果（文本形式） */
  const copyResult = useCallback(async () => {
    if (!result) {
      setNotice({ type: "error", text: ui.emptyInput });
      return;
    }
    const lines = [
      `JSON structure analysis (${result.elapsedMs}ms)`,
      `- Root type: ${ROOT_TYPE_LABEL[result.rootType]}`,
      `- Top-level fields/elements: ${result.topLevelCount}`,
      `- Total fields: ${result.totalFieldCount}`,
      `- Max nesting depth: ${result.maxDepth}`,
      `- Type distribution: ${result.typeStats.map((t) => `${t.type}×${t.count}`).join(", ") || "none"}`,
      `- Arrays: ${result.arrayAnalysis.count} (max length ${result.arrayAnalysis.maxLength})`,
      `- Null values: ${result.nullCount}`,
    ];
    if (result.sensitiveFields.length > 0) {
      lines.push(`- Sensitive fields: ${result.sensitiveFields.map((s) => `${s.path}(${s.level})`).join(", ")}`);
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: "success", text: ui.copied });
    } catch {
      outputRef.current?.focus();
      document.execCommand("copy");
      setNotice({ type: "success", text: ui.copiedCompat });
    }
  }, [result, ui]);

  const loadSample = useCallback(() => {
    setInput(createExplainDemo());
    setResult(null);
    setErrorText(null);
    setNotice({ type: "info", text: "Sample loaded — click Analyze to try" });
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
          <label className="mb-2 block text-sm font-medium text-slate-700">JSON Input</label>
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
                : ui.inputStatsEmpty}
            </span>
            <span className="text-xs text-slate-400">{ui.localOnly}</span>
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
          <p className="text-sm font-semibold text-red-700">JSON parse failed</p>
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
              <h3 className="font-semibold text-slate-900">Structure Summary</h3>
              <span className="text-xs text-slate-400">{result.elapsedMs}ms</span>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Root type:</span>
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${
                    TYPE_COLORS[result.rootType] ?? TYPE_COLORS.object
                  }`}
                >
                  {ROOT_TYPE_LABEL[result.rootType]}
                </span>
              </div>
              <div ref={outputRef} tabIndex={-1} className="outline-none">
                <StatRow label="Top-level fields / elements" value={String(result.topLevelCount)} />
                <StatRow label="Total fields" value={String(result.totalFieldCount)} hint="recursive" />
                <StatRow label="Max nesting depth" value={`${result.maxDepth} levels`} />
                <StatRow
                  label="Arrays"
                  value={`${result.arrayAnalysis.count}`}
                  hint={result.arrayAnalysis.count > 0 ? `max length ${result.arrayAnalysis.maxLength}` : undefined}
                />
                <StatRow label="Null values" value={String(result.nullCount)} />
              </div>
            </div>
          </div>

          {/* 类型分布 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">Type Distribution</h3>
            </div>
            <div className="p-4">
              {result.typeStats.length === 0 ? (
                <p className="text-sm text-slate-400">No inner fields (empty object / primitive value)</p>
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
                  <p className="mb-2 text-sm text-slate-500">Array element types:</p>
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
              <h3 className="font-semibold text-slate-900">Security Alerts</h3>
            </div>
            <div className="p-4">
              {result.sensitiveFields.length === 0 ? (
                <p className="text-sm text-emerald-700">✓ No common sensitive fields detected</p>
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
                        {s.level === "high" ? "High risk" : "Notice"}
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
