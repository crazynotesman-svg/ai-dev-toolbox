/**
 * AI Developer Toolbox - 共享类型与配置（技术元数据层）
 * 被 web / worker 共同引用，保证前后端契约一致
 *
 * ★ 分层约定：
 *   - 本文件只保存「技术元数据」（slug/category/status/inputLimit/priority 等）
 *   - 所有用户展示内容（title/description/keywords/seoTitle/seoDescription/features/faqs）
 *     一律存放于 web/src/locales/{lang}.json，由 web/src/lib/i18n 读取合并
 */

/** Worker 健康检查响应 */
export interface HealthResponse {
  status: "ok";
}

/** 站点全局技术配置（部署时替换 url 即可） */
export const SITE_CONFIG = {
  name: "AI Developer Toolbox",
  url: "https://ai-dev-toolbox.pages.dev", // TODO: 部署后替换为正式域名
  locale: "en", // 默认语言（BCP47）
} as const;

/** 语言配置：已上线语言（SEO/sitemap/language switcher 只读取此列表） */
export interface LocaleConfig {
  /** BCP47 语言码：en / zh-CN / zh-TW / ja / ko / es / fr / de */
  code: string;
  /** 语言原生名称（用于切换器展示） */
  name: string;
  /** URL 段：英文为空字符串（无前缀），其他如 "zh-CN" */
  path: string;
  /** 是否为默认语言（英文） */
  default?: boolean;
}

/** 已上线语言（Phase 1：en + zh-CN + ja） */
export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "en", name: "English", path: "", default: true },
  { code: "zh-CN", name: "简体中文", path: "zh-CN" },
  { code: "ja", name: "日本語", path: "ja" },
];

/** 规划中语言（架构支持，未生成页面；启用时移入 SUPPORTED_LOCALES 并提供翻译） */
export const PLANNED_LOCALES: LocaleConfig[] = [
  { code: "zh-TW", name: "繁體中文", path: "zh-TW" },
  { code: "ko", name: "한국어", path: "ko" },
  { code: "es", name: "Español", path: "es" },
  { code: "fr", name: "Français", path: "fr" },
  { code: "de", name: "Deutsch", path: "de" },
];

/** 全部语言（规划 + 上线），供未来扩展参考 */
export const ALL_LOCALES: LocaleConfig[] = [...SUPPORTED_LOCALES, ...PLANNED_LOCALES];

/** 默认语言 */
export const DEFAULT_LOCALE = "en";

/** 工具分类 ID */
export type ToolCategoryId = "json" | "developer" | "security";

/** 工具分类定义（仅技术元数据；展示名称/描述在 locales categories 区块） */
export interface ToolCategory {
  id: ToolCategoryId;
}

/** 工具状态：live = 已有独立功能页；planned = 占位页 */
export type ToolStatus = "live" | "planned";

/**
 * 工具配置模型（仅技术元数据，不含展示文案）
 * 新增工具 = TOOL_CONFIGS 追加一条 + locales 各语言补内容
 */
export interface ToolConfig {
  /** 唯一标识，同时作为路由 /tools/{slug} */
  slug: string;
  /** 所属分类 */
  category: ToolCategoryId;
  /** 状态：live = 独立功能页；planned = 占位页 */
  status: ToolStatus;
  /** 单次输入上限（字节），公共提示条展示与纯函数执行限制 */
  inputLimit?: number;
  /** 首页 Popular Tools 排序权重（数字越大越靠前；缺省不参与热门区） */
  priority?: number;
}

/** 分类展示顺序（独立事实源：决定首页 / 工具索引页 / Footer 的分区顺序） */
export const TOOL_CATEGORY_ORDER: ToolCategoryId[] = ["json", "developer", "security"];

/** 工具分类列表（技术元数据，按 TOOL_CATEGORY_ORDER 排序） */
export const TOOL_CATEGORIES: ToolCategory[] = TOOL_CATEGORY_ORDER.map((id) => ({ id }));

/** 工具配置（技术元数据；展示内容在 locales） */
export const TOOL_CONFIGS: ToolConfig[] = [
  {
    slug: "json-formatter",
    category: "json",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 10,
  },
  {
    slug: "json-to-typescript",
    category: "json",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 8,
  },
  {
    slug: "json-to-java",
    category: "json",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 7,
  },
  {
    slug: "jwt-decoder",
    category: "security",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 9,
  },
  {
    slug: "json-explain",
    category: "json",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 6,
  },
  {
    slug: "base64-encoder",
    category: "developer",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
    priority: 5,
  },
];

/** 已上线的工具（独立功能页，不走占位页路由） */
export const LIVE_TOOLS = TOOL_CONFIGS.filter((tool) => tool.status === "live");

/** 按 slug 查找工具配置 */
export function getToolBySlug(slug: string): ToolConfig | undefined {
  return TOOL_CONFIGS.find((tool) => tool.slug === slug);
}

/** 按分类获取工具列表 */
export function getToolsByCategory(category: ToolCategoryId): ToolConfig[] {
  return TOOL_CONFIGS.filter((tool) => tool.category === category);
}

/** 热门工具（按 priority 降序，缺省 priority 的工具不进入） */
export function getPopularTools(limit = 4): ToolConfig[] {
  return TOOL_CONFIGS.filter((tool) => tool.priority !== undefined)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, limit);
}
