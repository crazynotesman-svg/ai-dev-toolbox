import type { MetadataRoute } from "next";
import { SITE_CONFIG, LIVE_TOOLS } from "@toolbox/shared";

/**
 * sitemap.xml - 数据驱动生成
 * 首页 + 所有 live 工具页自动收录；planned（未上线）工具不进入 sitemap
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = LIVE_TOOLS.map((tool) => ({
    url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...toolEntries,
  ];
}
