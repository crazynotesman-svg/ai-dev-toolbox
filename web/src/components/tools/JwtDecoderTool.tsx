"use client";

import { useCallback, useMemo, useState } from "react";
import { mergeUiText, type UiText } from "@/lib/i18n/ui-text";
import { parseJwt, isJwtFormat, createDemoToken } from "@/lib/tools/jwt";

type Notice = { type: "success" | "error"; text: string } | null;

/** 时间分析展示行 */
function TimeRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-mono text-sm text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

/** JWT 解析工具主体（纯客户端，token 绝不出浏览器） */
export default function JwtDecoderTool({ t }: { t?: Partial<UiText> }) {
  const ui = mergeUiText(t);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [result, setResult] = useState<ReturnType<typeof parseJwt> | null>(null);

  const isFormatted = useMemo(() => isJwtFormat(input), [input]);

  const decode = useCallback(() => {
    const r = parseJwt(input);
    setResult(r);
    setNotice(
      r.ok
        ? { type: "success", text: "解析完成 ✓" }
        : { type: "error", text: r.error },
    );
  }, [input]);

  const loadDemo = useCallback(() => {
    setInput(createDemoToken());
    setResult(null);
    setNotice(null);
  }, []);

  const clearAll = useCallback(() => {
    setInput("");
    setResult(null);
    setNotice(null);
  }, []);

  const token = result?.ok ? result.token : null;

  return (
    <div className="space-y-4">
      {/* 输入区 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <button
            onClick={decode}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            解析 Token
          </button>
          <button
            onClick={loadDemo}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            载入演示 Token
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:text-red-500"
          >
            清空
          </button>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
              isFormatted
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isFormatted ? "格式检测：✓ 标准 JWT" : "格式检测：待输入 / 非标准格式"}
          </span>
        </div>
        <div className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">JWT Token 输入</label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
              setNotice(null);
            }}
            spellCheck={false}
            placeholder="粘贴 JWT Token（header.payload.signature），例如 eyJhbGciOi... .eyJzdWIi... .SflKxwRJSMe..."
            className="h-32 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center gap-4">
            <span className="text-xs text-slate-400">{ui.localOnly}</span>
            {notice && (
              <span
                className={`ml-auto text-sm font-medium ${
                  notice.type === "error" ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {notice.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 解析结果 */}
      {token && (
        <>
          {/* 安全检查 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">安全检查</h3>
            </div>
            <div className="space-y-2 p-4">
              {token.checks.map((check) => (
                <div
                  key={check.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    check.severity === "danger"
                      ? "border-red-200 bg-red-50"
                      : check.severity === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      check.severity === "danger"
                        ? "bg-red-500"
                        : check.severity === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  >
                    {check.severity === "danger" ? "!" : check.severity === "warning" ? "!" : "✓"}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        check.severity === "danger"
                          ? "text-red-700"
                          : check.severity === "warning"
                            ? "text-amber-700"
                            : "text-emerald-700"
                      }`}
                    >
                      {check.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Header / Payload / Signature */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-900">Header</h3>
              </div>
              <pre className="max-h-64 overflow-auto p-4 font-mono text-sm text-slate-800">
                {JSON.stringify(token.header, null, 2)}
              </pre>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-900">Payload</h3>
              </div>
              <pre className="max-h-64 overflow-auto p-4 font-mono text-sm text-slate-800">
                {JSON.stringify(token.payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Signature 展示 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">Signature</h3>
            </div>
            <div className="p-4">
              <p className="break-all font-mono text-sm text-slate-700">
                {token.signature || "（空签名 — 常见于 alg=none 攻击）"}
              </p>
              {token.signature && (
                <p className="mt-2 font-mono text-xs text-slate-400">
                  HEX（前 16 字节）：{token.signatureHex}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                本工具不验证签名真实性（需密钥）；Signature 仅作展示。
              </p>
            </div>
          </div>

          {/* 时间分析 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-900">时间分析（Asia/Shanghai）</h3>
            </div>
            <div className="p-4">
              <TimeRow label="签发时间 iat" value={token.iatReadable} />
              <TimeRow label="过期时间 exp" value={token.expReadable} />
              <TimeRow
                label="过期状态"
                value={token.isExpired ? "已过期" : token.expiresIn ?? "未设置 exp"}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
