import { SITE_CONFIG } from "@toolbox/shared";
import JsonLd from "@/components/seo/JsonLd";

/**
 * 面包屑 BreadcrumbList JSON-LD（站点级统一注入）
 * 使用方式：<BreadcrumbJsonLd items={[{ name, path }]} />
 * path 为站点相对路径（如 /tools/json-formatter）
 */
export default function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  if (items.length === 0) return null;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.path}`,
    })),
  };
  return <JsonLd data={breadcrumb} />;
}
