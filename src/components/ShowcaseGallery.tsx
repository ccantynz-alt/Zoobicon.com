"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Clock, Wand2 } from "lucide-react";

interface ShowcaseItem {
  id: number;
  name: string;
  category: string;
  buildTime: string;
  prompt: string;
  html: string;
}

const SHOWCASE_HTML: Record<string, string> = {
  saas_analytics: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f0b1a;font-family:system-ui,sans-serif;color:#fff;padding:24px}nav{display:flex;justify-content:space-between;align-items:center;padding:12px 0;margin-bottom:32px}nav .logo{font-size:18px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#6d28d9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav-links{display:flex;gap:20px;font-size:11px;color:rgba(255,255,255,.5)}.badge{display:inline-block;font-size:9px;padding:4px 10px;border-radius:99px;background:rgba(167,139,250,.15);color:#a78bfa;font-weight:600;margin-bottom:16px}h1{font-size:32px;font-weight:800;line-height:1.1;margin-bottom:10px;letter-spacing:-1px}p.sub{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:24px;line-height:1.5}.btn{display:inline-block;padding:10px 24px;border-radius:10px;font-size:12px;font-weight:700;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;text-decoration:none}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.metric{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px}.metric .val{font-size:22px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.metric .label{font-size:9px;color:rgba(255,255,255,.4);margin-top:4px}.chart{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;margin-top:4px}.chart-title{font-size:11px;font-weight:600;margin-bottom:12px}.bars{display:flex;align-items:end;gap:6px;height:60px}.bar{flex:1;border-radius:4px 4px 0 0;background:linear-gradient(to top,#7c3aed,#a78bfa)}</style></head><body><nav><div class="logo">NovaTech</div><div class="nav-links"><span>Dashboard</span><span>Analytics</span><span>Reports</span><span>Settings</span></div></nav><div class="badge">Live Analytics Dashboard</div><h1>Real-time insights<br>for modern teams</h1><p class="sub">Track every metric that matters. AI-powered anomaly detection alerts you before problems happen.</p><a class="btn" href="#">Start Free Trial</a><div class="metrics"><div class="metric"><div class="val">2.4M</div><div class="label">Active Users</div></div><div class="metric"><div class="val">99.9%</div><div class="label">Uptime SLA</div></div><div class="metric"><div class="val">$847K</div><div class="label">Revenue Today</div></div></div><div class="chart"><div class="chart-title">Weekly Performance</div><div class="bars"><div class="bar" style="height:45%"></div><div class="bar" style="height:62%"></div><div class="bar" style="height:38%"></div><div class="bar" style="height:80%"></div><div class="bar" style="height:55%"></div><div class="bar" style="height:90%"></div><div class="bar" style="height:72%"></div></div></div></body></html>`,

  ecommerce_fashion: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#faf8f5;font-family:system-ui,sans-serif;color:#1a1a1a;padding:20px}nav{display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin-bottom:24px;border-bottom:1px solid rgba(0,0,0,.08)}.logo{font-size:16px;font-weight:800;letter-spacing:2px;text-transform:uppercase}.nav-r{display:flex;gap:16px;font-size:10px;color:#666}.hero{position:relative;background:linear-gradient(135deg,#2d1b4e,#1a0a2e);border-radius:16px;padding:32px;margin-bottom:24px;color:#fff;overflow:hidden}.hero::after{content:'';position:absolute;top:0;right:0;width:45%;height:100%;background-image:url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop');background-size:cover;background-position:center;opacity:.2;mask-image:linear-gradient(to left,rgba(0,0,0,0.5),transparent)}.hero h1{font-size:28px;font-weight:800;line-height:1.1;margin-bottom:8px;position:relative;z-index:1}.hero p{font-size:11px;color:rgba(255,255,255,.6);margin-bottom:16px;position:relative;z-index:1}.hero .btn{display:inline-block;padding:10px 24px;background:#fbbf24;color:#000;font-weight:700;font-size:11px;border-radius:99px;text-decoration:none;position:relative;z-index:1}.products{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.product{background:#fff;border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,.06)}.product .img{height:100px;background-size:cover;background-position:center}.product .info{padding:10px}.product .name{font-size:11px;font-weight:600}.product .price{font-size:13px;font-weight:800;color:#7c3aed;margin-top:2px}.product .tag{font-size:8px;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px}</style></head><body><nav><div class="logo">Luxe & Thread</div><div class="nav-r"><span>New In</span><span>Women</span><span>Men</span><span>Sale</span></div></nav><div class="hero"><h1>Spring/Summer<br>Collection '26</h1><p>Curated luxury. Sustainable materials. Free express shipping.</p><a class="btn" href="#">Shop Now</a></div><div class="products"><div class="product"><div class="img" style="background-image:url('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=200&fit=crop');background-size:cover;background-position:center"></div><div class="info"><div class="name">Silk Wrap Dress</div><div class="price">$289</div><div class="tag">New</div></div></div><div class="product"><div class="img" style="background-image:url('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=200&fit=crop');background-size:cover;background-position:center"></div><div class="info"><div class="name">Linen Blazer</div><div class="price">$345</div></div></div><div class="product"><div class="img" style="background-image:url('https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=200&fit=crop');background-size:cover;background-position:center"></div><div class="info"><div class="name">Cashmere Knit</div><div class="price">$195</div><div class="tag">Bestseller</div></div></div></div></body></html>`,

  portfolio_dev: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0e17;font-family:'Courier New',monospace;color:#e2e8f0;padding:24px}.terminal-bar{display:flex;gap:6px;margin-bottom:20px}.dot{width:8px;height:8px;border-radius:50%}.greeting{font-size:10px;color:#22d3ee;margin-bottom:24px;font-family:monospace}h1{font-size:30px;font-weight:800;font-family:system-ui,sans-serif;line-height:1.1;margin-bottom:6px}h1 .accent{color:#22d3ee}.role{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:20px;font-family:system-ui}.links{display:flex;gap:8px;margin-bottom:28px}.link{padding:8px 16px;border-radius:8px;font-size:10px;font-weight:600;text-decoration:none;font-family:system-ui}.link.primary{background:#22d3ee;color:#0a0e17}.link.secondary{border:1px solid rgba(34,211,238,.3);color:#22d3ee}.section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.3);margin-bottom:12px;font-family:system-ui}.projects{display:grid;grid-template-columns:1fr 1fr;gap:10px}.project{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px}.project .name{font-size:12px;font-weight:700;font-family:system-ui;margin-bottom:4px}.project .desc{font-size:9px;color:rgba(255,255,255,.4);font-family:system-ui;line-height:1.4}.project .tech{display:flex;gap:4px;margin-top:8px}.project .tech span{font-size:8px;padding:2px 6px;border-radius:4px;background:rgba(34,211,238,.1);color:#22d3ee}</style></head><body><div class="terminal-bar"><div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div><div class="dot" style="background:#28c840"></div></div><div class="greeting">$ whoami</div><h1>Alex <span class="accent">Rivera</span></h1><div class="role">Full-Stack Engineer &bull; Open Source &bull; San Francisco</div><div class="links"><a class="link primary" href="#">View Projects</a><a class="link secondary" href="#">GitHub</a></div><div class="section-title">Featured Projects</div><div class="projects"><div class="project"><div class="name">StreamDB</div><div class="desc">Real-time database engine with sub-ms latency</div><div class="tech"><span>Rust</span><span>WASM</span><span>gRPC</span></div></div><div class="project"><div class="name">Nexus CLI</div><div class="desc">Full-stack scaffolding tool for modern apps</div><div class="tech"><span>Go</span><span>React</span><span>Docker</span></div></div></div></body></html>`,

  agency_creative: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0015;font-family:system-ui,sans-serif;color:#fff;padding:24px;overflow:hidden}nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px}.logo{font-size:15px;font-weight:800;letter-spacing:1px}.nav-links{display:flex;gap:16px;font-size:10px;color:rgba(255,255,255,.4)}.nav-btn{padding:6px 14px;border-radius:99px;font-size:10px;font-weight:600;background:linear-gradient(135deg,#0891b2,#22d3ee);color:#fff}h1{font-size:42px;font-weight:900;line-height:.95;letter-spacing:-2px;margin-bottom:12px}h1 .outline{-webkit-text-stroke:1.5px rgba(255,255,255,.6);-webkit-text-fill-color:transparent}.sub{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:28px;max-width:280px;line-height:1.5}.stats{display:flex;gap:24px;margin-bottom:32px}.stat .num{font-size:24px;font-weight:800;background:linear-gradient(135deg,#22d3ee,#0891b2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.stat .label{font-size:9px;color:rgba(255,255,255,.35);margin-top:2px}.cases-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.3);margin-bottom:12px}.cases{display:grid;grid-template-columns:1fr 1fr;gap:10px}.case{border-radius:12px;padding:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}.case .client{font-size:11px;font-weight:700;margin-bottom:2px}.case .type{font-size:9px;color:rgba(255,255,255,.35)}.case .result{font-size:14px;font-weight:800;color:#22d3ee;margin-top:8px}</style></head><body><nav><div class="logo">CATALYST</div><div class="nav-links"><span>Work</span><span>About</span><span>Contact</span></div><div class="nav-btn">Let's Talk</div></nav><h1>We make<br><span class="outline">brands</span> that<br>break through</h1><p class="sub">Award-winning creative agency. Strategy, design, and digital experiences that drive real results.</p><div class="stats"><div class="stat"><div class="num">200+</div><div class="label">Projects</div></div><div class="stat"><div class="num">98%</div><div class="label">Client Retention</div></div><div class="stat"><div class="num">14</div><div class="label">Awards</div></div></div><div class="cases-title">Recent Work</div><div class="cases"><div class="case"><div class="client">Meridian Health</div><div class="type">Brand + Web</div><div class="result">+340% leads</div></div><div class="case"><div class="client">Volt Energy</div><div class="type">Campaign</div><div class="result">12M reach</div></div></div></body></html>`,

  restaurant_bakery: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fdf6ee;font-family:'Georgia',serif;color:#3d2c1e;padding:20px}nav{display:flex;justify-content:space-between;align-items:center;padding:8px 0;margin-bottom:20px}.logo{font-size:18px;font-weight:700;color:#92400e}.nav-links{display:flex;gap:14px;font-size:10px;color:#78716c}.hero{background:linear-gradient(135deg,#92400e,#78350f);border-radius:16px;padding:28px;color:#fff;margin-bottom:20px;position:relative;overflow:hidden}.hero::after{content:'';position:absolute;right:0;top:0;width:45%;height:100%;background-image:url('https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop');background-size:cover;background-position:center;opacity:.25;mask-image:linear-gradient(to left,rgba(0,0,0,0.6),transparent)}.hero h1{font-size:26px;font-weight:700;line-height:1.1;margin-bottom:6px}.hero p{font-size:11px;opacity:.75;margin-bottom:14px}.hero .btn{display:inline-block;padding:8px 20px;background:#fbbf24;color:#78350f;font-weight:700;font-size:11px;border-radius:99px;text-decoration:none}.section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#a8a29e;margin-bottom:12px}.menu{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}.item{background:#fff;border-radius:12px;padding:12px;border:1px solid rgba(0,0,0,.06)}.item .name{font-size:12px;font-weight:700;margin-bottom:2px}.item .desc{font-size:9px;color:#78716c;line-height:1.3}.item .price{font-size:13px;font-weight:800;color:#92400e;margin-top:6px}.hours{background:#fff;border-radius:12px;padding:14px;border:1px solid rgba(0,0,0,.06)}.hours-row{display:flex;justify-content:space-between;font-size:10px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,.04)}.hours-row:last-child{border:none}</style></head><body><nav><div class="logo">Artisan Bakery</div><div class="nav-links"><span>Menu</span><span>About</span><span>Order</span><span>Visit</span></div></nav><div class="hero"><h1>Fresh-baked<br>every morning</h1><p>Handcrafted sourdough, pastries & seasonal specials since 2018</p><a class="btn" href="#">Order Online</a></div><div class="section-title">Popular Items</div><div class="menu"><div class="item"><div class="name">Sourdough Loaf</div><div class="desc">48hr fermented, stone-baked</div><div class="price">$8.50</div></div><div class="item"><div class="name">Almond Croissant</div><div class="desc">Butter pastry, frangipane fill</div><div class="price">$5.75</div></div><div class="item"><div class="name">Cinnamon Roll</div><div class="desc">Cream cheese glaze, pecans</div><div class="price">$6.25</div></div><div class="item"><div class="name">Avocado Toast</div><div class="desc">Sourdough, poached egg, chili</div><div class="price">$12.00</div></div></div><div class="section-title">Hours</div><div class="hours"><div class="hours-row"><span>Mon–Fri</span><span>6:30am – 5pm</span></div><div class="hours-row"><span>Saturday</span><span>7am – 4pm</span></div><div class="hours-row"><span>Sunday</span><span>8am – 2pm</span></div></div></body></html>`,

  saas_cloud: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#070c1a;font-family:system-ui,sans-serif;color:#fff;padding:24px}nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px}.logo{font-size:16px;font-weight:800;background:linear-gradient(135deg,#818cf8,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav-links{display:flex;gap:16px;font-size:10px;color:rgba(255,255,255,.4)}h1{font-size:34px;font-weight:800;line-height:1.05;letter-spacing:-1px;margin-bottom:10px;text-align:center}h1 .grad{background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.sub{text-align:center;font-size:12px;color:rgba(255,255,255,.4);margin-bottom:24px}.ctas{display:flex;justify-content:center;gap:8px;margin-bottom:28px}.cta{padding:10px 22px;border-radius:10px;font-size:11px;font-weight:700;text-decoration:none}.cta.primary{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff}.cta.secondary{border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7)}.pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.plan{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;text-align:center}.plan.pop{border-color:rgba(99,102,241,.4);background:rgba(99,102,241,.08)}.plan .name{font-size:11px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:4px}.plan .price{font-size:22px;font-weight:800;margin-bottom:4px}.plan .price span{font-size:11px;font-weight:400;color:rgba(255,255,255,.35)}.plan .feat{font-size:9px;color:rgba(255,255,255,.35);line-height:1.6}.plan .btn{display:block;margin-top:10px;padding:8px;border-radius:8px;font-size:10px;font-weight:700;background:rgba(99,102,241,.15);color:#818cf8;text-align:center}.plan.pop .btn{background:#6366f1;color:#fff}</style></head><body><nav><div class="logo">CloudSync Pro</div><div class="nav-links"><span>Features</span><span>Pricing</span><span>Docs</span><span>Login</span></div></nav><h1>Your files.<br><span class="grad">Everywhere. Instantly.</span></h1><p class="sub">End-to-end encrypted cloud storage with real-time sync across all devices.</p><div class="ctas"><a class="cta primary" href="#">Get Started Free</a><a class="cta secondary" href="#">View Demo</a></div><div class="pricing"><div class="plan"><div class="name">Starter</div><div class="price">$0<span>/mo</span></div><div class="feat">5GB storage<br>2 devices<br>Basic support</div><div class="btn">Start Free</div></div><div class="plan pop"><div class="name">Pro</div><div class="price">$12<span>/mo</span></div><div class="feat">1TB storage<br>Unlimited devices<br>Priority support</div><div class="btn">Upgrade</div></div><div class="plan"><div class="name">Enterprise</div><div class="price">$49<span>/mo</span></div><div class="feat">Unlimited storage<br>SSO + SAML<br>Dedicated CSM</div><div class="btn">Contact Sales</div></div></div></body></html>`,
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: 1,
    name: "NovaTech Analytics",
    category: "SaaS",
    buildTime: "47s",
    prompt: "A modern SaaS analytics dashboard landing page with dark theme, real-time metrics, and interactive charts",
    html: SHOWCASE_HTML.saas_analytics,
  },
  {
    id: 2,
    name: "Luxe & Thread",
    category: "E-commerce",
    buildTime: "52s",
    prompt: "Premium fashion e-commerce store with minimalist design, product filtering, and wishlist functionality",
    html: SHOWCASE_HTML.ecommerce_fashion,
  },
  {
    id: 3,
    name: "DevPortfolio Pro",
    category: "Portfolio",
    buildTime: "38s",
    prompt: "Developer portfolio with dark mode, terminal-inspired hero, project showcase with GitHub stats",
    html: SHOWCASE_HTML.portfolio_dev,
  },
  {
    id: 4,
    name: "Catalyst Creative",
    category: "Agency",
    buildTime: "61s",
    prompt: "Bold creative agency site with large typography, case studies grid, and animated transitions",
    html: SHOWCASE_HTML.agency_creative,
  },
  {
    id: 5,
    name: "Artisan Bakery",
    category: "Restaurant",
    buildTime: "43s",
    prompt: "Warm artisan bakery website with menu sections, online ordering, and location map",
    html: SHOWCASE_HTML.restaurant_bakery,
  },
  {
    id: 6,
    name: "CloudSync Pro",
    category: "SaaS",
    buildTime: "55s",
    prompt: "Cloud storage SaaS with pricing tiers, feature comparison table, and integration logos",
    html: SHOWCASE_HTML.saas_cloud,
  },
];

const categories = ["All", "SaaS", "E-commerce", "Portfolio", "Agency", "Restaurant"];

function IframePreview({ html }: { html: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/10" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0e0e18]/80 backdrop-blur-sm border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#ff5f57]/60" />
          <div className="w-[7px] h-[7px] rounded-full bg-[#febc2e]/60" />
          <div className="w-[7px] h-[7px] rounded-full bg-[#28c840]/60" />
        </div>
        <div className="ml-3 h-4 rounded-md flex-1 max-w-[120px] bg-white/[0.04] border border-white/[0.04]" />
      </div>
      {/* Real HTML rendered in sandboxed iframe */}
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        className="w-full border-0 pointer-events-none"
        style={{ height: "calc(100% - 28px)", transform: "scale(1)", transformOrigin: "top left" }}
        title="Site preview"
        loading="lazy"
      />
    </div>
  );
}

export default function ShowcaseGallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const filteredItems =
    activeFilter === "All"
      ? showcaseItems
      : showcaseItems.filter((item) => item.category === activeFilter);

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === cat
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 border border-violet-500/30"
                  : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/70 border border-white/[0.06]"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                  layout: { duration: 0.3 },
                }}
              >
                <motion.div
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset",
                  }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Top reflection */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />

                  {/* Live HTML preview */}
                  <IframePreview html={item.html} />

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[1]" />

                  {/* Info bar */}
                  <div className="relative z-[2] p-4 bg-[#0a0a12]/90 backdrop-blur-xl border-t border-white/[0.04]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-[15px] tracking-tight">{item.name}</h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/40 bg-white/[0.04] px-2 py-0.5 rounded-md font-mono">
                        <Clock className="w-3 h-3" />
                        {item.buildTime}
                      </span>
                      <Wand2 className="w-3 h-3 text-violet-400/60" />
                    </div>

                    <p className="text-[11px] text-white/30 italic line-clamp-2 leading-relaxed">
                      &ldquo;{item.prompt}&rdquo;
                    </p>

                    {/* Hover CTA */}
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: hoveredCard === item.id ? 1 : 0,
                        y: hoveredCard === item.id ? 0 : 8,
                      }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 flex items-center justify-between"
                    >
                      <Link
                        href="/builder"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
                      >
                        Build Similar
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-white/30 text-sm mb-5">
            Every site above was generated in under 60 seconds from a single prompt.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 text-sm"
          >
            Start Building for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
