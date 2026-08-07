"use client";

import { useEffect } from "react";

/**
 * 客户端语言设置器：hydration 后把 <html lang> 更新为当前页面语言
 * 背景：output:export 静态导出下根 layout 无法按 [locale] 动态渲染 html lang，
 * 首屏 SSG HTML 保持默认（en），SEO 语言信号由后续 hreflang + content-language 补强；
 * 本组件保证浏览器端无障碍/语义正确。
 */
export default function LocaleLangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
