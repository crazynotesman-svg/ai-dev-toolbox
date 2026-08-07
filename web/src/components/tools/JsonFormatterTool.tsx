"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formatJson, minifyJson, validateJson, isEmpty } from "@/lib/tools/json";
import { mergeUiText, type UiText } from "@/lib/i18n/ui-text";

const SAMPLE = `{
  "name": "AI Developer Toolbox",
  "version": "1.0.0",
  "features": ["format", "minify", "validate"],
  "free": true,
  "stats": { "users": 10000, "uptime": 99.9 }
}`;

type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** JSON 格式化工具主体（纯客户端；t 为可选的 UI 文案字典，缺省回退英文） */
export default function JsonFormatterTool({ t }: { t?: Partial<UiText> }) {
  const ui = mergeUiText(t);
  const [input, setInput] = useState(SAMPLE);
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const bytes = new TextEncoder().encode(trimmed).length;
    const lines = trimmed.split("\n").length;
    return { bytes, lines };
  }, [input]);

  const run = useCallback(
    (kind: "format" | "minify") => {
      if (isEmpty(input)) {
        setNotice({ type: "error", text: ui.emptyInput });
        return;
      }
      const result = kind === "format" ? formatJson(input) : minifyJson(input);
      if (result.ok) {
        setOutput(result.output);
        setNotice({ type: "success", text: kind === "format" ? "Formatted ✓" : "Minified ✓" });
      } else {
        setOutput("");
        setNotice({ type: "error", text: result.error.message });
      }
    },
    [input, ui.emptyInput],
  );

  const validate = useCallback(() => {
    if (isEmpty(input)) {
      setNotice({ type: "error", text: ui.emptyInput });
      return;
    }
    const result = validateJson(input);
    setNotice(
      result.ok
        ? { type: "success", text: "Valid JSON ✓" }
        : { type: "error", text: result.error.message },
    );
  }, [input, ui.emptyInput]);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setNotice({ type: "info", text: ui.emptyInput });
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setNotice({ type: "success", text: ui.copied });
    } catch {
      outputRef.current?.select();
      document.execCommand("copy");
      setNotice({ type: "success", text: ui.copiedCompat });
    }
  }, [output, ui]);

  const loadSample = useCallback(() => {
    setInput(SAMPLE);
    setOutput("");
    setNotice({ type: "info", text: "Sample loaded — click Format to try" });
  }, []);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setNotice(null);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <button
          onClick={() => run("format")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Format
        </button>
        <button
          onClick={() => run("minify")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          Minify
        </button>
        <button
          onClick={validate}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
        >
          Validate
        </button>
        <button
          onClick={copyOutput}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          {ui.copy}
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={loadSample}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-blue-600"
          >
            {ui.loadSample}
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-red-500"
          >
            {ui.clear}
          </button>
        </div>
      </div>

      {/* 输入 / 输出 */}
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">JSON Input</label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setNotice(null);
            }}
            spellCheck={false}
            placeholder='Paste JSON, e.g. {"name":"toolbox"}'
            className="h-72 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">{ui.output}</label>
          <textarea
            ref={outputRef}
            value={output}
            readOnly
            placeholder={ui.outputPlaceholder}
            className="h-72 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* 状态栏：统计 + 提示 */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3">
        <span className="text-xs text-slate-400">
          {inputStats
            ? `${inputStats.lines} lines · ${(inputStats.bytes / 1024).toFixed(1)} KB`
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
  );
}
