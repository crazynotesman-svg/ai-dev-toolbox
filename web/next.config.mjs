/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出：构建产物为纯静态文件，可直接部署到 Cloudflare Pages
  output: "export",
  // 静态导出下不使用 Next 内置图片优化
  images: {
    unoptimized: true,
  },
  // 允许从 workspace 引入 TS 源码包
  transpilePackages: ["@toolbox/shared"],
};

export default nextConfig;
