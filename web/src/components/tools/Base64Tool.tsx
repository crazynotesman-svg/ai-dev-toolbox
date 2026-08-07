"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { mergeUiText, type UiText } from "@/lib/i18n/ui-text";
import { encodeBase64, decodeBase64 } from "@/lib/tools/base64";

const SAMPLE_TEXT = "Hello, AI Developer Toolbox!\n你好，开发者工具箱！🎉";

type Mode = "encode" | "decode";
type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** Base64 编解码工具主体（纯客户端，数据不出浏览器） */
export default function Base64Tool({ t }: { t?: Partial<UiText> }) {
  const ui = mergeUiText(t);
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const bytes = new TextEncoder().encode(trimmed).length;
    return { bytes, lines: trimmed.split("\n").length };
  }, [input]);

  const convert = useCallback(() => {
    const result =
      mode === "encode" ? encodeBase64(input) : decodeBase64(input);
    if (result.ok) {
      setOutput(result.output);
      setNotice({ type: "success", text: `${mode === "encode" ? "Encoded" : "Decoded"} ✓` });
    } else {
      setOutput("");
      setNotice({ type: "error", text: result.error });
    }
  }, [mode, input]);

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
    setInput(SAMPLE_TEXT);
    setMode("encode");
    setOutput("");
    setNotice({ type: "info", text: "Sample loaded — click Convert to try" });
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
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setOutput("");
                setNotice(null);
              }}
              className={`px-3 py-2 text-sm transition ${
                mode === m
                  ? "bg-blue-600 font-medium text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {m === "encode" ? "Encode → Base64" : "Decode → Text"}
            </button>
          ))}
        </div>

        <button
          onClick={convert}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {mode === "encode" ? "Encode" : "Decode"}
        </button>
        <button
          onClick={copyOutput}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          复制结果
        </button>

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
          <label className="mb-2 text-sm font-medium text-slate-700">
            {mode === "encode" ? "Text Input" : "Base64 Input"}
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOutput("");
              setNotice(null);
            }}
            spellCheck={false}
            placeholder={
              mode === "encode"
                ? "Enter text to encode (supports Chinese and emoji)"
                : "Paste Base64 string"
            }
            className="h-64 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">
            {mode === "encode" ? "Base64 Output" : "Text Output"}
          </label>
          <textarea
            ref={outputRef}
            value={output}
            readOnly
            placeholder="Conversion result will appear here"
            className="h-64 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* 状态栏 */}
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
