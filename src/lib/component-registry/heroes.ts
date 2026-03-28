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

// ── Hero: Video Background ──
registerComponent({
  id: "hero-video",
  name: "Video Background Hero",
  category: "hero",
  variant: "video",
  description: "Full-screen video background with dark overlay and bold centered text. Ideal for agencies, studios, brands",
  tags: ["video", "agency", "brand", "cinematic", "studio", "creative", "marketing", "media", "production"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-gray-950">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop&q=80"
      >
        <source src="" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-950/60 to-gray-950" />
      <div className="relative text-center max-w-4xl mx-auto pt-16">
        <div className="inline-flex items-center gap-2 border border-white/20 text-white/70 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Award-Winning Creative Studio
        </div>
        <h1 className="text-5xl md:text-8xl font-extrabold text-white leading-[1.02] tracking-tight mb-6">
          We Make Brands
          <br />
          <span className="italic font-light">Unforgettable</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
          Strategy, design, and digital experiences that transform ambitious companies into cultural forces. From concept to launch in 12 weeks.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-white text-gray-950 font-bold rounded-full hover:bg-gray-100 transition-colors text-sm tracking-wide">
            View Our Work
          </button>
          <button className="group px-8 py-4 bg-transparent text-white font-semibold rounded-full border border-white/20 hover:bg-white/10 transition-all text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="group-hover:scale-110 transition-transform"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Showreel
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mt-14">
          {["Cannes Lions", "Webby Awards", "FWA Site of the Day"].map(a => (
            <span key={a} className="text-xs text-white/40 uppercase tracking-widest font-medium">{a}</span>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Animated / Floating Elements ──
registerComponent({
  id: "hero-animated",
  name: "Animated Floating Hero",
  category: "hero",
  variant: "animated",
  description: "Light background with floating animated dots and geometric shapes. Playful and modern",
  tags: ["animated", "playful", "modern", "startup", "saas", "product", "app", "mobile", "fun"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-[10%] w-16 h-16 rounded-full bg-blue-200/40 animate-bounce" style={{ animationDuration: "3s" }} />
      <div className="absolute top-40 right-[15%] w-10 h-10 rounded-lg bg-violet-200/50 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }} />
      <div className="absolute bottom-32 left-[20%] w-12 h-12 rounded-full bg-emerald-200/40 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
      <div className="absolute top-[60%] right-[8%] w-8 h-8 rounded-full bg-amber-200/50 animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "1.5s" }} />
      <div className="absolute top-[30%] left-[5%] w-6 h-6 rounded-full bg-pink-200/40 animate-pulse" />
      <div className="absolute bottom-[20%] right-[25%] w-14 h-14 rounded-xl bg-sky-200/30 animate-bounce" style={{ animationDuration: "5s" }} />

      <div className="relative text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 3l14 9-14 9V3z"/></svg>
          Now available on iOS &amp; Android
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
          Your Tasks,
          <br />
          <span className="text-blue-600">Beautifully Simple</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
          The productivity app that actually makes you productive. Intelligent prioritization, natural reminders, and a design so clean you&apos;ll want to open it every morning.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-600/25">
            Download Free
          </button>
          <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm">
            See How It Works
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Free forever
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            250K+ users
          </span>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Minimal ──
registerComponent({
  id: "hero-minimal",
  name: "Minimal Text Hero",
  category: "hero",
  variant: "minimal",
  description: "Ultra-clean hero with just bold typography and a single CTA. No image, no clutter. For portfolios and studios",
  tags: ["minimal", "clean", "portfolio", "designer", "studio", "freelance", "elegant", "simple", "architect", "writer"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-gray-400 uppercase tracking-[0.2em] font-medium mb-8">Design &amp; Development Studio</p>
        <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-extrabold text-gray-900 leading-[0.95] tracking-tight mb-8">
          We design
          <br />
          digital
          <br />
          <span className="text-gray-300">experiences.</span>
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-12">
          <button className="group px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors text-sm flex items-center gap-3">
            Start a Project
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <p className="text-sm text-gray-400 max-w-xs">
            Crafting brands, websites, and products for ambitious teams since 2018.
          </p>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Dark Gradient with Neon Accent ──
registerComponent({
  id: "hero-dark-gradient",
  name: "Dark Gradient Neon Hero",
  category: "hero",
  variant: "dark-gradient",
  description: "Deep dark background with neon accent glow lines. Cyberpunk/gaming/hacker aesthetic",
  tags: ["dark", "neon", "gradient", "cyber", "gaming", "hacker", "devtools", "infrastructure", "security", "ai"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-[#0a0a0f]">
      {/* Neon glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-violet-500/15 to-fuchsia-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-xs font-mono font-semibold px-4 py-1.5 rounded-full border border-cyan-500/20 mb-8">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          v4.0 &mdash; Now with AI-Powered Detection
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
          Stop Breaches
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Before They Start</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
          Autonomous threat detection powered by next-gen AI. Monitor every endpoint, analyze every packet, respond in milliseconds. Zero-day attacks don&apos;t stand a chance.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm shadow-xl shadow-cyan-500/20">
            Schedule Security Audit
          </button>
          <button className="px-8 py-3.5 bg-white/5 text-gray-300 font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm backdrop-blur-sm">
            Read the Docs
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400 font-mono">99.97%</div>
            <div className="text-gray-600 text-xs mt-1">Detection Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-400 font-mono">&lt;50ms</div>
            <div className="text-gray-600 text-xs mt-1">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fuchsia-400 font-mono">2.1M+</div>
            <div className="text-gray-600 text-xs mt-1">Threats Blocked</div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Dashboard Mockup ──
registerComponent({
  id: "hero-dashboard",
  name: "Dashboard Preview Hero",
  category: "hero",
  variant: "dashboard",
  description: "Shows a dashboard/app mockup below the headline. Great for SaaS products and tools",
  tags: ["dashboard", "saas", "app", "product", "tool", "analytics", "platform", "software", "startup", "b2b"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen px-6 pt-32 pb-16 overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/15 to-transparent rounded-full blur-[80px]" />
      <div className="relative max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-indigo-500/20 mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Backed by Y Combinator &middot; Series A
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
          Analytics That
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">Drive Decisions</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
          Stop guessing. See every metric that matters in one beautiful dashboard. Real-time insights, predictive trends, and AI-powered recommendations your whole team will actually use.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button className="px-8 py-3.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors text-sm shadow-lg shadow-indigo-500/25">
            Start Free Trial
          </button>
          <button className="px-8 py-3.5 bg-white/5 text-gray-300 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all text-sm">
            Book a Demo
          </button>
        </div>
        {/* Dashboard Mockup */}
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-3xl blur-2xl" />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-gray-500 ml-2 font-mono">app.metriq.io/dashboard</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Revenue", value: "$284K", change: "+23%", color: "emerald" },
                  { label: "Users", value: "18.2K", change: "+12%", color: "blue" },
                  { label: "Conversion", value: "4.8%", change: "+0.6%", color: "violet" },
                  { label: "Retention", value: "94%", change: "+3%", color: "amber" },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800/50 rounded-xl p-4 text-left">
                    <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                    <div className="text-xl font-bold text-white">{m.value}</div>
                    <div className={\`text-xs font-semibold mt-1 text-\${m.color}-400\`}>
                      {m.change} vs last month
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/30 rounded-xl h-48 flex items-end justify-between px-4 pb-4 gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md opacity-80" style={{ height: \`\${h}%\` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Stats ──
registerComponent({
  id: "hero-stats",
  name: "Stats Hero",
  category: "hero",
  variant: "stats",
  description: "Big stat numbers prominently displayed in the hero with headline. For established businesses showing traction",
  tags: ["stats", "numbers", "traction", "enterprise", "corporate", "fintech", "consulting", "agency", "growth", "established"],
  code: `export default function Hero() {
  const stats = [
    { value: "$2.4B+", label: "Revenue managed" },
    { value: "10K+", label: "Companies served" },
    { value: "99.9%", label: "Uptime guaranteed" },
    { value: "150+", label: "Countries reached" },
  ];
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16 bg-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-50 to-transparent rounded-full" />
      <div className="relative max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            Trusted Since 2012
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Financial Infrastructure
            <br />
            <span className="text-blue-600">Built for Scale</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
            The payment, lending, and banking APIs that power the world&apos;s most ambitious fintech companies. From seed stage to IPO and beyond.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-600/20">
              Talk to Sales
            </button>
            <button className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Read Documentation
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-gray-100">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{s.value}</div>
              <div className="text-sm text-gray-500 mt-2 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Two CTAs (Split Path) ──
registerComponent({
  id: "hero-two-cta",
  name: "Two-Path CTA Hero",
  category: "hero",
  variant: "two-cta",
  description: "Hero with two equal CTA paths splitting users by persona (Teams/Individuals, Buyers/Sellers). For platforms with dual audiences",
  tags: ["two-cta", "split", "dual", "marketplace", "platform", "saas", "service", "comparison", "audience"],
  code: `export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-violet-50/50 to-transparent" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-emerald-50/50 to-transparent" />
      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Join 50,000+ professionals worldwide
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
          One Platform,
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">Two Powerful Paths</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-14 max-w-2xl mx-auto">
          Whether you&apos;re scaling a team or growing solo, our platform adapts to your workflow. Pick your path and see results in the first week.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <button className="group relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-violet-400 transition-all shadow-sm hover:shadow-xl hover:shadow-violet-500/10 text-left">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-2">For Teams</div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">Shared workspaces, role-based access, real-time collaboration, and analytics for teams of 5 to 5,000.</p>
            <span className="text-sm font-semibold text-violet-600 group-hover:underline flex items-center gap-1">
              Start team trial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
          <button className="group relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-emerald-400 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-2">For Individuals</div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">Personal dashboard, unlimited projects, priority support, and AI-powered insights to grow 2x faster.</p>
            <span className="text-sm font-semibold text-emerald-600 group-hover:underline flex items-center gap-1">
              Start personal plan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}`,
});
