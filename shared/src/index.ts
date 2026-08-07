/**
 * AI Developer Toolbox - 共享类型与配置
 * 被 web / worker 共同引用，保证前后端契约一致
 * ★ 配置驱动：新增工具只需在 TOOL_CONFIGS 追加一项，首页 / SEO / sitemap 自动生效
 */

/** Worker 健康检查响应 */
export interface HealthResponse {
  status: "ok";
}

/** 站点全局配置（部署时替换 url 即可） */
export const SITE_CONFIG = {
  name: "AI Developer Toolbox",
  url: "https://ai-dev-toolbox.pages.dev", // TODO: 部署后替换为正式域名
  description:
    "面向开发者的在线工具箱：JSON 格式化、JSON 转 TypeScript、JSON 转 Java、JWT 解析、AI JSON 解释。",
  locale: "zh_CN",
  keywords: [
    "JSON 格式化",
    "JSON to TypeScript",
    "JSON to Java",
    "JWT 解析",
    "AI 工具",
    "开发者工具",
  ],
} as const;

/** 工具分类 ID */
export type ToolCategoryId = "json" | "security" | "developer";

/** 工具分类定义 */
export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  description: string;
}

/** 工具状态：live = 已有独立功能页；planned = 占位页 */
export type ToolStatus = "live" | "planned";

/** 工具配置模型（新增工具 = 追加一条） */
export interface ToolConfig {
  /** 唯一标识，同时作为路由 /tools/{slug} */
  slug: string;
  /** 展示标题（页面 H1 / 卡片标题） */
  title: string;
  /** 卡片描述（一句话） */
  description: string;
  /** 所属分类 */
  category: ToolCategoryId;
  /** SEO 关键词 */
  keywords: string[];
  /** 浏览器标题栏 / 搜索结果标题 */
  seoTitle: string;
  /** 搜索结果描述（≥60 字符效果最佳） */
  seoDescription: string;
  /** 状态：live = 独立功能页；planned = 占位页 */
  status: ToolStatus;
  /** 单次输入上限（字节），用于公共提示条展示；工具纯函数内部执行同一限制 */
  inputLimit?: number;
}

/**
 * 分类展示顺序（独立事实源：决定首页 / 工具索引页 / Footer 的分区顺序）
 * 新增分类时在此追加 id，并同步 ToolCategoryId 与 CATEGORY_META
 */
export const TOOL_CATEGORY_ORDER: ToolCategoryId[] = ["json", "developer", "security"];

/** 分类元数据定义（顺序无关，仅描述） */
const CATEGORY_META: ToolCategory[] = [
  { id: "json", name: "JSON 工具", description: "格式化、校验、转换与结构分析" },
  { id: "developer", name: "开发工具", description: "编码解码与开发者常用工具" },
  { id: "security", name: "安全解析", description: "Token 与鉴权相关解析" },
];

/** 工具分类列表（按 TOOL_CATEGORY_ORDER 排序导出，消费方无需感知顺序逻辑） */
export const TOOL_CATEGORIES: ToolCategory[] = TOOL_CATEGORY_ORDER.map((id) =>
  CATEGORY_META.find((c) => c.id === id)!,
);

/** 工具配置（当前 5 个，未来扩展在此追加） */
export const TOOL_CONFIGS: ToolConfig[] = [
  {
    slug: "json-formatter",
    title: "JSON 格式化",
    description: "JSON 美化、压缩与校验",
    category: "json",
    keywords: ["JSON 格式化", "JSON 美化", "JSON 压缩", "JSON 校验", "JSON validator"],
    seoTitle: "JSON 格式化工具 - 美化/压缩/校验 | AI Developer Toolbox",
    seoDescription:
      "免费的在线 JSON 格式化工具：一键美化、压缩并校验 JSON，错误自动定位到行列号，支持大文件处理。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
  },
  {
    slug: "json-to-typescript",
    title: "JSON 转 TypeScript",
    description: "根据 JSON 生成 TS 类型定义",
    category: "json",
    keywords: ["JSON to TypeScript", "JSON 转 TypeScript", "TS 类型生成", "interface 生成"],
    seoTitle: "JSON 转 TypeScript 类型生成器 | AI Developer Toolbox",
    seoDescription:
      "在线将 JSON 转换为 TypeScript interface/type 定义，支持嵌套对象、数组、可选字段与命名策略配置。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
  },
  {
    slug: "json-to-java",
    title: "JSON 转 Java",
    description: "根据 JSON 生成 Java POJO 类",
    category: "json",
    keywords: ["JSON to Java", "JSON 转 Java", "POJO 生成器", "Java 类生成"],
    seoTitle: "JSON 转 Java POJO 生成器 | AI Developer Toolbox",
    seoDescription:
      "在线将 JSON 转换为 Java POJO 类，自动映射字段类型、嵌套结构与数组集合，可直接用于项目。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
  },
  {
    slug: "jwt-decoder",
    title: "JWT 解析",
    description: "解码 JWT 的 Header 与 Payload",
    category: "security",
    keywords: ["JWT 解析", "JWT decoder", "JWT 解码", "token 解析", "JWT 过期"],
    seoTitle: "JWT 解析工具 - 解码 Header/Payload | AI Developer Toolbox",
    seoDescription:
      "在线解析 JWT：解码 Header 与 Payload，查看算法、过期时间与签发信息，全程浏览器本地处理。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
  },
  {
    slug: "json-explain",
    title: "AI JSON 分析",
    description: "分析 JSON 结构与安全风险",
    category: "json",
    keywords: ["AI JSON 分析", "JSON explainer", "JSON 结构分析", "JSON 安全", "JSON 分析"],
    seoTitle: "AI JSON 分析工具 - 结构与安全体检 | AI Developer Toolbox",
    seoDescription:
      "AI JSON 分析工具：一键分析 JSON 结构、字段类型、嵌套深度与敏感字段风险，全程浏览器本地处理，免费在线使用。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
  },
  {
    slug: "base64-encoder",
    title: "Base64 编码",
    description: "文本与 Base64 互转（UTF-8）",
    category: "developer",
    keywords: ["Base64 编码", "Base64 解码", "Base64 encode", "Base64 decode", "文本编码"],
    seoTitle: "Base64 编码解码工具 - 文本互转 | AI Developer Toolbox",
    seoDescription:
      "免费的在线 Base64 编码解码工具：支持 UTF-8 中文与 emoji，文本与 Base64 一键互转，全程浏览器本地处理。",
    status: "live",
    inputLimit: 10 * 1024 * 1024,
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
