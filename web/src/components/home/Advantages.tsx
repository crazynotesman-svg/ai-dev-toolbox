/** 使用优势区 - 固定 4 大卖点 */
const ADVANTAGES = [
  {
    title: "本地处理 · 隐私安全",
    desc: "格式化与转换在浏览器本地完成，数据不出设备，敏感信息零泄露。",
    icon: "shield",
  },
  {
    title: "极速响应",
    desc: "纯函数即时运算，毫秒级出结果，无需等待服务器往返。",
    icon: "bolt",
  },
  {
    title: "AI 增强",
    desc: "DeepSeek 驱动的智能解释，帮助你理解复杂 JSON 的业务含义。",
    icon: "spark",
  },
  {
    title: "免费 · 免登录",
    desc: "开箱即用，无需注册账号，随时随地在任何设备上使用。",
    icon: "free",
  },
];

const ICONS: Record<string, React.ReactNode> = {
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  spark: (
    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.5L5.7 21.4 8 14 2 9.4h7.6L12 2z" />
  ),
  free: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-4.5 5h4a4.5 4.5 0 0 1 0 9h-1a2 2 0 1 1 0-4h2M12 7v12" />
  ),
};

/** 首页优势区 */
export default function Advantages() {
  return (
    <section id="advantages" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">为什么选择我们</h2>
      <p className="mt-2 text-center text-slate-500">面向开发者的高效工具集，兼顾速度、安全与智能</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ADVANTAGES.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[item.icon]}
              </svg>
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
