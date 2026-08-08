/**
 * ToolContent — 工具页 SEO 文章型内容（MDX 数据模型，schema v2）
 *
 * 职责边界：
 * - 本类型只描述「内容」（Introduction / Features / Guide / Examples / Use Cases / FAQs）
 * - 不含 slug / locale / 主要 SEO metadata —— 这些属于其他系统：
 *   - slug / category / status / inputLimit → shared（技术元数据）
 *   - title / seoTitle / seoDescription / keywords → locales（本地化展示字段）
 * - schema v2 新增 seo.keywords（内容级附加关键词，增强而非替代 locales keywords）
 *
 * 存储：content/{locale}/tools/{slug}.mdx（frontmatter + 结构化区块）
 * 加载：web/src/lib/content/index.ts → getToolContent(locale, slug)
 */

/** 工具长文介绍（价值主张，2-3 句） */
export interface ToolContent {
  /** 页面 Introduction 段落（Markdown 文本） */
  introduction?: string;

  /** 功能介绍（补充 locales 已有 features 的长文版，可选） */
  features?: {
    title: string;
    description: string;
  }[];

  /** 使用教程（步骤化） */
  guide?: {
    step: number;
    title: string;
    description: string;
  }[];

  /** 输入/输出示例（可渲染代码块） */
  examples?: {
    title: string;
    input?: string;
    output?: string;
  }[];

  /** 典型使用场景（长尾 SEO 关键词承载） */
  useCases?: string[];

  /** 扩展 FAQ（追加到 locales faqs 之后，可选） */
  faqs?: {
    question: string;
    answer: string;
  }[];

  /** 内容级 SEO 附加数据（schema v2：增强页面 SEO，不替代 locales） */
  seo?: {
    /** 附加关键词（合并进页面 keywords metadata） */
    keywords?: string[];
  };
}
