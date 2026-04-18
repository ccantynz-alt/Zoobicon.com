import { registerComponent } from "./store";

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
  description: "Full-width gradient background with centered text, social proof, metrics, and trust badges. $100K agency quality",
  tags: ["gradient", "centered", "modern", "saas", "startup", "agency", "marketing", "business", "service"],
  code: `export default function Hero() {
  const logos = ["Stripe", "Vercel", "Linear", "Notion", "Figma"];
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
      {/* Animated glow orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-200/40 to-indigo-200/30 rounded-full blur-3xl" />
      <div className="relative text-center max-w-4xl mx-auto">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 bg-violet-100/80 backdrop-blur-sm text-violet-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-violet-200/50 shadow-sm">
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          New: AI-Powered Analytics Dashboard
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
          The Smarter Way to
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Grow Your Business</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          Automate your marketing, streamline operations, and unlock insights that drive real revenue growth. All from one beautiful dashboard.
        </p>
        {/* CTAs with gradient primary */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 text-sm flex items-center gap-2">
            Start Free Trial
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
          <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all duration-300 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-violet-600"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Demo
          </button>
        </div>
        {/* Social proof strip */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="flex -space-x-2">
            {[11, 26, 44, 52, 68].map(n => (
              <img key={n} src={\`https://randomuser.me/api/portraits/\${n % 2 === 0 ? "women" : "men"}/\${n}.jpg\`} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">Loved by <strong className="text-gray-800">12,000+</strong> teams</span>
        </div>
        {/* Metrics strip */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-14">
          {[
            { value: "99.9%", label: "Uptime SLA" },
            { value: "3.2s", label: "Avg. Setup" },
            { value: "40%", label: "Cost Savings" },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-extrabold text-gray-900">{m.value}</div>
              <div className="text-xs text-gray-400 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
        {/* Trust logos */}
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-6">Trusted by forward-thinking teams</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {logos.map(l => (
            <span key={l} className="text-gray-300 font-bold text-lg tracking-tight hover:text-gray-400 transition-colors cursor-default">{l}</span>
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
    <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16 bg-white overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-gray-50 via-gray-100/50 to-transparent rounded-full opacity-70" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-50 to-transparent rounded-full opacity-50" />

      <div className="relative max-w-5xl mx-auto w-full">
        {/* Animated accent line */}
        <div className="w-12 h-[2px] bg-gradient-to-r from-gray-900 to-gray-400 mb-8" />
        <p className="text-xs text-gray-400 uppercase tracking-[0.3em] font-medium mb-10">Design &amp; Development Studio</p>
        <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-extrabold text-gray-900 leading-[0.92] tracking-tight mb-8">
          We design
          <br />
          <em className="font-serif italic font-light text-gray-400 not-italic" style={{ fontStyle: "italic" }}>digital</em>
          <br />
          <span className="bg-gradient-to-r from-gray-900 via-gray-600 to-gray-300 bg-clip-text text-transparent">experiences.</span>
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-14">
          <button className="group relative px-10 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all text-sm flex items-center gap-3 shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:-translate-y-0.5">
            Start a Project
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-1.5 transition-transform duration-300"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Crafting brands, websites, and products for ambitious teams since 2018.
          </p>
        </div>

        {/* Selected clients strip */}
        <div className="mt-20 pt-10 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-300 font-medium mb-6">Selected Clients</p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {["Stripe", "Notion", "Linear", "Vercel", "Figma"].map(c => (
              <span key={c} className="text-sm font-semibold text-gray-200 hover:text-gray-400 transition-colors cursor-default tracking-wide">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-transparent" />
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
                  { label: "Revenue", value: "$284K", change: "+23%" },
                  { label: "Users", value: "18.2K", change: "+12%" },
                  { label: "Conversion", value: "4.8%", change: "+0.6%" },
                  { label: "Retention", value: "94%", change: "+3%" },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800/50 rounded-xl p-4 text-left">
                    <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                    <div className="text-xl font-bold text-white">{m.value}</div>
                    <div className="text-xs font-semibold mt-1 text-stone-300">
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
    { value: "$2.4B+", label: "Revenue managed", color: "from-blue-600 to-indigo-600" },
    { value: "10K+", label: "Companies served", color: "from-violet-600 to-purple-600" },
    { value: "99.9%", label: "Uptime guaranteed", color: "from-emerald-600 to-teal-600" },
    { value: "150+", label: "Countries reached", color: "from-amber-500 to-orange-500" },
  ];
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16 bg-white overflow-hidden">
      {/* Premium subtle background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-50/80 via-indigo-50/30 to-transparent rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-50/40 to-transparent rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-emerald-50/30 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2.5 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Trusted Since 2012 &middot; SOC 2 Certified
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Financial Infrastructure
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Built for Scale</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
            The payment, lending, and banking APIs that power the world&apos;s most ambitious fintech companies. From seed stage to IPO and beyond.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-600/25 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2">
              Talk to Sales
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="px-8 py-4 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm border border-gray-200">
              Read Documentation
            </button>
          </div>
          {/* Trust badges */}
          <div className="flex items-center gap-6 mb-16">
            {["SOC 2", "PCI DSS", "ISO 27001", "GDPR"].map(badge => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* Premium stats grid with gradient numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="group relative bg-gray-50/80 rounded-2xl p-6 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 border border-gray-100 hover:border-gray-200">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-blue-300 transition-colors" />
              <div className={\`text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r \${s.color} bg-clip-text text-transparent\`}>{s.value}</div>
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

// ── Hero: Cinematic Product Showcase ──
registerComponent({
  id: "hero-cinematic-showcase",
  name: "Cinematic Product Showcase Hero",
  category: "hero",
  variant: "cinematic-showcase",
  description: "Filmora-grade dark cinematic hero with centered headline, trust badges, and a massive product screenshot/mockup floating below. Purple-dominant gradients, glow effects, scroll-reveal.",
  tags: ["cinematic", "dark", "showcase", "product", "saas", "premium", "filmora", "video", "creative", "app", "software", "demo", "purple"],
  code: `export default function Hero() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { setVisible(true); }, []);
  return (
    <section className="relative min-h-screen bg-[#09090f] pt-24 pb-0 overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(168,85,247,0.08),transparent_70%)] pointer-events-none" />

      {/* Content */}
      <div className={\`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 \${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}\`}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full border border-violet-500/20 mb-8 backdrop-blur-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Trusted by 50,000+ creators worldwide
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
          Create Without
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">Limits</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
          The all-in-one platform that turns your ideas into polished, professional results — powered by AI, designed for humans.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button className="group px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-violet-600/25 transition-all duration-300 flex items-center gap-2">
            Start Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button className="px-8 py-3.5 bg-white/5 text-white text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Demo
          </button>
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 mb-16">
          <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SOC 2</span>
          <span className="w-px h-3 bg-gray-700" />
          <span>No credit card required</span>
          <span className="w-px h-3 bg-gray-700" />
          <span>Cancel anytime</span>
        </div>
      </div>

      {/* Product mockup — large floating screenshot */}
      <div className={\`relative z-10 max-w-6xl mx-auto px-6 transition-all duration-1000 delay-300 \${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}\`}>
        <div className="relative rounded-t-2xl overflow-hidden border border-white/10 bg-gray-900/50 backdrop-blur-sm shadow-2xl shadow-violet-900/20">
          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">app.acme.com/dashboard</div>
            </div>
          </div>
          {/* Simulated dashboard UI */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-gray-900 to-gray-950 min-h-[300px] sm:min-h-[400px]">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Users", value: "48,294", change: "+12.5%", color: "violet" },
                { label: "Revenue", value: "$2.4M", change: "+8.3%", color: "fuchsia" },
                { label: "Growth Rate", value: "156%", change: "+24.1%", color: "purple" },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
                  <div className={\`text-xs font-semibold mt-1 text-\${s.color}-400\`}>
                    <span className="inline-flex items-center gap-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                      {s.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Chart placeholder */}
            <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
              <div className="flex items-end justify-between h-32 gap-2">
                {[40,65,45,80,60,90,75,95,85,70,88,100].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-violet-600/60 to-fuchsia-500/40 rounded-t-sm" style={{ height: h + "%" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090f] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}`,
});

// ── Hero: Cinematic Video Dark ──
registerComponent({
  id: "hero-cinematic-video",
  name: "Cinematic Video Hero",
  category: "hero",
  variant: "cinematic-video",
  description: "Full-width dark hero with inline video player mockup, scroll-reveal animation, and purple-to-blue gradient accents. Inspired by Filmora/Runway aesthetic.",
  tags: ["cinematic", "dark", "video", "filmora", "runway", "creative", "production", "editor", "media", "content", "purple"],
  code: `export default function Hero() {
  const [visible, setVisible] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => { setVisible(true); }, []);
  return (
    <section className="relative min-h-screen bg-[#0a0a12] pt-24 pb-16 overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,rgba(139,92,246,0.12),transparent_65%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Text block */}
        <div className={\`text-center mb-16 transition-all duration-1000 \${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}\`}>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 text-xs font-bold px-4 py-2 rounded-full border border-purple-500/20 mb-8 uppercase tracking-wider">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            New Release
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[1.02] tracking-tight mb-6">
            Your Vision.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">Our Engine.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Professional-grade tools that make creating effortless. From first draft to final cut — everything you need in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white text-sm font-bold rounded-2xl hover:shadow-2xl hover:shadow-purple-600/30 transition-all duration-300 flex items-center gap-2">
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="px-8 py-4 text-white/80 text-sm font-semibold rounded-2xl border border-white/10 hover:bg-white/5 transition-all duration-300">
              See Pricing
            </button>
          </div>
        </div>

        {/* Video player mockup */}
        <div className={\`transition-all duration-1000 delay-500 \${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-16 scale-95"}\`}>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gray-900/60 backdrop-blur-xl shadow-2xl shadow-purple-900/20 group cursor-pointer" onClick={() => setPlaying(!playing)}>
            {/* Video content area */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-[#0f0f1a] to-gray-950 flex items-center justify-center">
              {/* Decorative timeline bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <button className="text-white/80 hover:text-white transition-colors">
                    {playing ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </button>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                  </div>
                  <span className="text-xs text-white/50 font-mono">1:24 / 3:45</span>
                </div>
              </div>
              {/* Center play icon */}
              {!playing && (
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600/40 transition-all duration-500">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="8 5 19 12 8 19 8 5"/></svg>
                </div>
              )}
              {/* Floating UI mockup elements */}
              <div className="absolute top-6 left-6 flex gap-2">
                {["Layers", "Effects", "Audio"].map((t, i) => (
                  <span key={i} className={\`text-[10px] font-semibold px-3 py-1.5 rounded-lg border backdrop-blur-sm \${i === 0 ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-white/40 border-white/10"}\`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logo strip */}
        <div className={\`mt-16 text-center transition-all duration-1000 delay-700 \${visible ? "opacity-100" : "opacity-0"}\`}>
          <p className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-6 font-medium">Trusted by teams at</p>
          <div className="flex items-center justify-center gap-10 opacity-30">
            {["Acme Corp", "Vertex", "Nebula", "Quantum", "Synapse"].map((name, i) => (
              <span key={i} className="text-sm font-bold text-white tracking-wider uppercase">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
});
