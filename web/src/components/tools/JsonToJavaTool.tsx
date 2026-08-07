"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { mergeUiText, type UiText } from "@/lib/i18n/ui-text";
import { jsonToJava, DEFAULT_CLASS_NAME } from "@/lib/tools/java";

const SAMPLE = `{
  "id": 101,
  "name": "ThinkPad X1",
  "category": "laptop",
  "inStock": true,
  "price": 1299.99,
  "tags": ["2026", "ultrabook"],
  "specs": {
    "cpu": "Intel Core Ultra 7",
    "ram": "32GB",
    "weight": 1.12
  }
}`;

type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** JSON → Java 工具主体（纯客户端，数据不出浏览器） */
export default function JsonToJavaTool({ t }: { t?: Partial<UiText> }) {
  const ui = mergeUiText(t);
  const [input, setInput] = useState(SAMPLE);
  const [className, setClassName] = useState(DEFAULT_CLASS_NAME);
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const bytes = new TextEncoder().encode(trimmed).length;
    return { bytes, lines: trimmed.split("\n").length };
  }, [input]);

  const generate = useCallback(() => {
    const result = jsonToJava(input, { className });
    if (result.ok) {
      setOutput(result.output);
      setNotice({ type: "success", text: "Java classes generated ✓" });
    } else {
      setOutput("");
      setNotice({ type: "error", text: result.error });
    }
  }, [input, className]);

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
    setNotice({ type: "info", text: "Sample loaded — click Generate Java Classes to try" });
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
          onClick={generate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          生成 Java 类
        </button>
        <button
          onClick={copyOutput}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          复制结果
        </button>

        <label className="ml-2 flex items-center gap-1 text-sm text-slate-500">
          类名
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder={DEFAULT_CLASS_NAME}
            className="w-36 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500"
          />
        </label>

        <div className="ml-auto flex gap-2">
          <button
            onClick={loadSample}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-blue-600"
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
          <label className="mb-2 text-sm font-medium text-slate-700">Java Class Output</label>
          <textarea
            ref={outputRef}
            value={output}
            readOnly
            placeholder="Generated Java POJO classes will appear here"
            className="h-72 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* 状态栏 */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3">
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
  );
}
