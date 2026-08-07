import type { MetadataRoute } from "next";
import { SITE_CONFIG, LIVE_TOOLS, SUPPORTED_LOCALES } from "@toolbox/shared";
import { getHrefLang, localizedPath } from "@/lib/i18n";

/**
 * sitemap.xml - 数据驱动生成（M2.5 多语言）
 * SUPPORTED_LOCALES（en/zh-CN/ja）×（首页 + /tools 索引 + 全部 live 工具页）
 * 每个 URL 带全语言 hreflang（alternates.languages + x-default 指向英文）
 * planned（未上线）工具与未启用语言不进入 sitemap
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    const code = locale.code;

    // 首页（每语言）
    pages.push({
      url: `${SITE_CONFIG.url}${localizedPath(code, "/")}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: getHrefLang(code, "/") },
    });

    // 工具索引页（每语言）
    pages.push({
      url: `${SITE_CONFIG.url}${localizedPath(code, "/tools")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: getHrefLang(code, "/tools") },
    });

    // 全部 live 工具页（每语言）
    for (const tool of LIVE_TOOLS) {
      pages.push({
        url: `${SITE_CONFIG.url}${localizedPath(code, `/tools/${tool.slug}`)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: getHrefLang(code, `/tools/${tool.slug}`) },
      });
    }
  }

  return pages;
}
