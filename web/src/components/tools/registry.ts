/**
 * 工具组件 Registry（server 模块）
 * 映射：tool slug → client 组件引用
 * 本文件为 server-safe（无 "use client"）：仅引用 client 组件并返回给 server 页面渲染
 * shared 保持纯技术元数据（不含 component 字段），组件映射统一在此维护
 * 组件接收可选 t prop（UI 文案字典），用于多语言
 */
import type { ComponentType } from "react";
import type { UiText } from "@/lib/i18n/ui-text";
import JsonFormatterTool from "@/components/tools/JsonFormatterTool";
import JsonToTypescriptTool from "@/components/tools/JsonToTypescriptTool";
import JsonToJavaTool from "@/components/tools/JsonToJavaTool";
import JwtDecoderTool from "@/components/tools/JwtDecoderTool";
import JsonExplainTool from "@/components/tools/JsonExplainTool";
import Base64Tool from "@/components/tools/Base64Tool";

/** 工具组件类型：接收可选 UI 文案 prop */
export type ToolComponent = ComponentType<{ t?: Partial<UiText> }>;

/** 工具组件注册表 */
export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  "json-formatter": JsonFormatterTool,
  "json-to-typescript": JsonToTypescriptTool,
  "json-to-java": JsonToJavaTool,
  "jwt-decoder": JwtDecoderTool,
  "json-explain": JsonExplainTool,
  "base64-encoder": Base64Tool,
};

/** 按 slug 获取工具组件 */
export function getToolComponent(slug: string): ToolComponent | undefined {
  return TOOL_COMPONENTS[slug];
}
