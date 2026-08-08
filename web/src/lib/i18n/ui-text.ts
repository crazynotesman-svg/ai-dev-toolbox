/**
 * 工具组件 UI 文案（client 组件通过 props 接收）
 * 默认英文兜底；页面传入 getUi(locale) 实现多语言
 */
export interface UiText {
  copy: string;
  copied: string;
  copiedCompat: string;
  loadSample: string;
  clear: string;
  process: string;
  emptyInput: string;
  inputStats: string;
  inputStatsEmpty: string;
  localOnly: string;
  toolbar: string;
  output: string;
  outputPlaceholder: string;
  /** 工具页章节标题（ToolPageShell 使用） */
  features: string;
  howToUse: string;
  /** 内容系统章节标题（ToolContentRenderer 使用） */
  introduction: string;
  examples: string;
  useCases: string;
  faq: string;
  inputLabel: string;
  outputLabel: string;
}

/** 英文默认文案（兜底：任何语言缺失字段时回退英文） */
export const DEFAULT_UI_TEXT: UiText = {
  copy: "Copy Result",
  copied: "Copied ✓",
  copiedCompat: "Copied (compat mode) ✓",
  loadSample: "Load Sample",
  clear: "Clear",
  process: "Process",
  emptyInput: "Input is empty, please enter some content",
  inputStats: "{lines} lines · {kb} KB",
  inputStatsEmpty: "Input stats: —",
  localOnly: "All processing happens locally in your browser",
  toolbar: "Toolbar",
  output: "Output",
  outputPlaceholder: "Result will appear here",
  features: "Features",
  howToUse: "How to Use",
  introduction: "Introduction",
  examples: "Examples",
  useCases: "Use Cases",
  faq: "FAQ",
  inputLabel: "Input",
  outputLabel: "Output",
};

/** 合并工具 UI 文案：显式传入优先，缺失回退英文 */
export function mergeUiText(t?: Partial<UiText>): UiText {
  return { ...DEFAULT_UI_TEXT, ...t };
}
