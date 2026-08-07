import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@toolbox/shared";

/** robots.txt - 允许全站爬取，指向 sitemap */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
