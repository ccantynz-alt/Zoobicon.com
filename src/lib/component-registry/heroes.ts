import { registerComponent } from "./index";

// ── Hero: Split Dark ──
registerComponent({
  id: "hero-split-dark",
  name: "Split Dark Hero",
  category: "hero",
  variant: "split-dark",
  description: "Dark background with text left, gradient visual right. Perfect for tech/SaaS/cybersecurity",
  tags: ["dark", "tech", "saas", "cyber", "software", "startup", "developer", "api", "platform"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gray-950 pt-24 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-400/20 mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Now in General Availability
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Ship Code
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">10x Faster</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
            The developer platform that automates infrastructure, monitors performance, and scales your applications from prototype to production in minutes.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3.5 bg-white text-gray-950 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm">
              Start Building Free
            </button>
            <button className="px-8 py-3.5 bg-gray-800 text-gray-200 font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 text-sm">
              View Documentation
            </button>
          </div>
          <div className="flex items-center gap-8 mt-10">
            <div className="flex -space-x-2">
              {[11, 26, 44, 52, 68].map(n => (
                <img key={n} src={\`https://randomuser.me/api/portraits/men/\${n}.jpg\`} alt="" className="w-8 h-8 rounded-full border-2 border-gray-950 object-cover" />
              ))}
            </div>
            <span className="text-sm text-gray-500">Trusted by <strong className="text-gray-300">12,000+</strong> developers</span>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-gray-500 ml-2 font-mono">deploy.config.ts</span>
            </div>
            <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
              <code>
{String.raw\`import { deploy } from "@nexus/sdk";

const app = deploy({
  name: "my-api",
  runtime: "edge",
  regions: ["us-east", "eu-west", "ap-south"],
  scaling: { min: 2, max: 100 },
  monitoring: true,
});

// Deployed in 4.2 seconds ✓
// 3 regions active ✓
// Auto-scaling enabled ✓\`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Centered Gradient ──
registerComponent({
  id: "hero-centered-gradient",
  name: "Centered Gradient Hero",
  category: "hero",
  variant: "centered-gradient",
  description: "Full-width gradient background with centered text and trust badges. Versatile for any industry",
  tags: ["gradient", "centered", "modern", "saas", "startup", "agency", "marketing", "business", "service"],
  code: `export default function Hero() {
  const logos = ["Stripe", "Vercel", "Linear", "Notion", "Figma"];
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-200/40 to-indigo-200/30 rounded-full blur-3xl" />
      <div className="relative text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Launching Spring 2026
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6">
          The Smarter Way to
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Grow Your Business</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          Automate your marketing, streamline operations, and unlock insights that drive real revenue growth. All from one beautiful dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 text-sm">
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Demo
          </button>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-6">Trusted by forward-thinking teams</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {logos.map(l => (
            <span key={l} className="text-gray-300 font-bold text-lg tracking-tight">{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Image Overlay ──
registerComponent({
  id: "hero-image-overlay",
  name: "Image Overlay Hero",
  category: "hero",
  variant: "image-overlay",
  description: "Full-bleed background image with dark overlay and centered text. Ideal for restaurants, events, hospitality",
  tags: ["image", "restaurant", "food", "dining", "event", "hospitality", "cafe", "warm", "photography", "travel", "hotel"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop&q=80"
        alt="Interior"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      <div className="relative text-center max-w-3xl mx-auto pt-16">
        <p className="text-amber-300 uppercase tracking-[0.3em] text-xs font-semibold mb-6">Est. 2019 &middot; Award Winning</p>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
          Tables Worth
          <br />
          <span className="italic font-serif font-normal">Traveling For</span>
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed mb-10 max-w-xl mx-auto">
          Seasonal ingredients, timeless techniques, and an atmosphere that turns every meal into a memory. Reservations now open for spring.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-amber-500 text-gray-950 font-bold rounded-full hover:bg-amber-400 transition-colors text-sm tracking-wide">
            Reserve a Table
          </button>
          <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm text-sm">
            View Our Menu
          </button>
        </div>
        <div className="flex justify-center items-center gap-8 mt-12 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            4.9 on Google
          </span>
          <span>&middot;</span>
          <span>James Beard Semi-Finalist</span>
          <span>&middot;</span>
          <span>Zagat Rated</span>
        </div>
      </div>
    </section>
  );
}`,
});
