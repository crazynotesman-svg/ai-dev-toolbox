/**
 * i18n 工具函数层（纯函数，无 React 依赖，Node 可直测）
 * 职责：读取 locales JSON → 合并 shared 技术元数据 → 提供本地化数据
 *
 * 数据流：
 *   shared（技术元数据：slug/category/status/inputLimit/priority）
 *   + locales/{lang}.json（展示内容：title/description/seo/features/faqs/ui）
 *   → getLocalizedTool() 合并 → 页面渲染
 */
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getToolBySlug } from "@toolbox/shared";
import type { ToolCategoryId } from "@toolbox/shared";

import en from "../../locales/en.json";
import zhCN from "../../locales/zh-CN.json";
import ja from "../../locales/ja.json";

/* ==================== 类型定义 ==================== */

/** 语言码（已上线语言） */
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];

/** 本地化工具内容（来自 locales JSON tools 区块） */
export interface LocalizedToolContent {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  features: { title: string; body: string }[];
  guide: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
}

/** 本地化分类内容 */
export interface LocalizedCategory {
  name: string;
  description: string;
}

/** 合并后的工具（技术元数据 + 本地化内容） */
export interface LocalizedTool {
  slug: string;
  category: ToolCategoryId;
  status: string;
  inputLimit?: number;
  priority?: number;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  features: { title: string; body: string }[];
  guide: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
}

/* ==================== 字典加载 ==================== */

const dictionaries: Record<string, unknown> = {
  en,
  "zh-CN": zhCN,
  ja,
};

/** 获取语言字典（缺失语言回退英文） */
export function getDictionary(locale: string): Record<string, unknown> {
  return (dictionaries[locale] ?? en) as Record<string, unknown>;
}

/** 获取语言字典的 UI 区块（带类型） */
export function getUi(locale: string) {
  const dict = getDictionary(locale) as {
    ui: {
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
    };
  };
  return dict.ui;
}

/** 模板替换：{key} → value */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

/* ==================== 工具本地化 ==================== */

/**
 * 获取本地化工具（技术元数据来自 shared，展示内容来自 locales）
 * locale 缺失或工具内容缺失时回退英文
 */
export function getLocalizedTool(slug: string, locale: string): LocalizedTool | undefined {
  const tool = getToolBySlug(slug);
  if (!tool) return undefined;

  // 从目标语言字典取工具内容，缺失回退 en
  const dict = getDictionary(locale) as { tools?: Record<string, LocalizedToolContent> };
  const enDict = en as { tools: Record<string, LocalizedToolContent> };
  const content = dict.tools?.[slug] ?? enDict.tools[slug];
  if (!content) return undefined;

  return {
    slug: tool.slug,
    category: tool.category as ToolCategoryId,
    status: tool.status,
    inputLimit: tool.inputLimit,
    priority: tool.priority,
    title: content.title,
    description: content.description,
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    keywords: content.keywords,
    features: content.features,
    guide: content.guide,
    faqs: content.faqs,
  };
}

/** 获取本地化分类 */
export function getLocalizedCategory(
  categoryId: string,
  locale: string,
): LocalizedCategory {
  const dict = getDictionary(locale) as { categories?: Record<string, LocalizedCategory> };
  const enDict = en as { categories: Record<string, LocalizedCategory> };
  return dict.categories?.[categoryId] ?? enDict.categories[categoryId];
}

/** 获取站点级文案（site 区块） */
export function getSite(locale: string) {
  const dict = getDictionary(locale) as {
    site: {
      name: string;
      title: string;
      description: string;
      tagline: string;
      keywords: string[];
    };
  };
  return dict.site;
}

/** 获取首页 FAQ 列表 */
export function getHomeFaqs(locale: string) {
  const dict = getDictionary(locale) as { homeFaqs: { question: string; answer: string }[] };
  return dict.homeFaqs;
}

/** 获取首页文案（home 区块） */
export function getHome(locale: string) {
  const dict = getDictionary(locale) as {
    home: {
      popularTitle: string;
      popularSubtitle: string;
      toolsTitle: string;
      toolsSubtitle: string;
      categoriesTitle: string;
      categoriesSubtitle: string;
      faqTitle: string;
      faqSubtitle: string;
    };
  };
  return dict.home;
}

/* ==================== 路径与 SEO ==================== */

/**
 * 本地化路径：en → "/tools/x"（无前缀），其他 → "/zh-CN/tools/x"
 * 供 M2 路由分层使用
 */
export function localizedPath(locale: string, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  const config = SUPPORTED_LOCALES.find((l) => l.code === locale);
  if (!config || config.path === "") return path;
  return `/${config.path}${path}`;
}

/**
 * 全语言 hreflang 映射（含 x-default 指向英文）
 * 供 M2 generateMetadata 使用
 */
export function getHrefLang(locale: string, path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const url = localizedPath(l.code, path);
    if (l.code === DEFAULT_LOCALE) {
      languages["x-default"] = url;
      languages[DEFAULT_LOCALE] = url;
    } else {
      languages[l.code] = url;
    }
  }
  return languages;
}

/* ==================== 未来扩展接口（Phase 2 MDX） ==================== */

/**
 * 工具长内容（Introduction/Examples 等 SEO 文章型内容）
 * Phase 1 未引入 MDX，返回 null；Phase 2 接入 content/{lang}/tools/{slug}.mdx 后实现
 */
export function getToolContent(): null {
  return null;
}
