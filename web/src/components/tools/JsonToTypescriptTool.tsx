"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  jsonToTypeScript,
  DEFAULT_ROOT_NAME,
  type TsStyle,
} from "@/lib/tools/typescript";

const SAMPLE = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "isActive": true,
  "roles": ["admin", "editor"],
  "address": {
    "city": "Beijing",
    "zip": "100000"
  },
  "orders": [
    { "orderId": "A100", "total": 99.9 },
    { "orderId": "A101", "total": 199.9 }
  ]
}`;

type Notice = { type: "success" | "error" | "info"; text: string } | null;

/** JSON → TypeScript 工具主体（纯客户端，数据不出浏览器） */
export default function JsonToTypescriptTool() {
  const [input, setInput] = useState(SAMPLE);
  const [rootName, setRootName] = useState(DEFAULT_ROOT_NAME);
  const [style, setStyle] = useState<TsStyle>("interface");
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
    const result = jsonToTypeScript(input, { rootName, style });
    if (result.ok) {
      setOutput(result.output);
      setNotice({ type: "success", text: "类型生成成功 ✓" });
    } else {
      setOutput("");
      setNotice({ type: "error", text: result.error });
    }
  }, [input, rootName, style]);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setNotice({ type: "info", text: "暂无输出内容可复制" });
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setNotice({ type: "success", text: "已复制到剪贴板 ✓" });
    } catch {
      outputRef.current?.select();
      document.execCommand("copy");
      setNotice({ type: "success", text: "已复制（兼容模式）✓" });
    }
  }, [output]);

  const loadSample = useCallback(() => {
    setInput(SAMPLE);
    setOutput("");
    setNotice({ type: "info", text: "已载入示例数据，点击「生成类型」试试" });
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
          生成类型
        </button>
        <button
          onClick={copyOutput}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          复制结果
        </button>

        {/* 根类型名 */}
        <label className="ml-2 flex items-center gap-1 text-sm text-slate-500">
          类型名
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder={DEFAULT_ROOT_NAME}
            className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500"
          />
        </label>

        {/* 风格切换 */}
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          {(["interface", "type"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-3 py-1.5 text-sm transition ${
                style === s
                  ? "bg-blue-600 font-medium text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

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
          <label className="mb-2 text-sm font-medium text-slate-700">JSON 输入</label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setNotice(null);
            }}
            spellCheck={false}
            placeholder='粘贴 JSON，例如：{"name":"toolbox"}'
            className="h-72 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-slate-700">TypeScript 输出</label>
          <textarea
            ref={outputRef}
            value={output}
            readOnly
            placeholder="生成的 interface / type 将显示在这里"
            className="h-72 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* 状态栏 */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3">
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
  );
}
