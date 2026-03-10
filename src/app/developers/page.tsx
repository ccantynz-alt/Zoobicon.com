"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Code2,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  Layers,
  Webhook,
  Key,
  BarChart3,
  Shield,
  Globe,
  Cpu,
  GitBranch,
  Braces,
  Package,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const CODE_EXAMPLES = {
  generate: `const response = await fetch("https://api.zoobicon.io/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer zb_live_sk_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "A modern SaaS landing page with pricing",
    framework: "html",       // html | react | nextjs | vue
    style: "modern-dark",    // 20+ style presets
    responsive: true,
    seo: true
  })
});

const { code, preview_url, metadata } = await response.json();
// code: Full HTML/React source code
// preview_url: Live preview at zoobicon.sh/preview/abc123
// metadata: { tokens_used, generation_time_ms, framework }`,
  seo: `const campaign = await zoobicon.seo.createCampaign({
  domain: "yoursite.com",
  competitors: ["competitor1.com", "competitor2.com"],
  keywords: "auto-discover",  // AI finds best keywords
  budget: "aggressive",
  agent: {
    contentGeneration: true,
    backlinkOutreach: true,
    technicalAudit: true,
    weeklyReports: true
  }
});

// Agent runs autonomously — check status anytime
const status = await zoobicon.seo.getCampaign(campaign.id);
// { rank_improvements: 47, new_backlinks: 12, content_published: 8 }`,
  video: `const video = await zoobicon.video.create({
  prompt: "Product launch announcement for a fitness app",
  platform: "tiktok",      // tiktok | instagram | youtube | facebook
  duration: 30,            // seconds
  style: "energetic",
  music: "upbeat-electronic",
  branding: {
    logo_url: "https://yoursite.com/logo.png",
    colors: ["#FF6B35", "#004E98"]
  }
});

// Returns video URL + platform-optimized versions
// { video_url, thumbnail_url, platforms: { tiktok, instagram, youtube } }`,
  sdk: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon({ apiKey: process.env.ZOOBICON_API_KEY });

// Generate a website
const site = await zb.sites.generate({
  prompt: "Photography portfolio with dark theme",
  framework: "nextjs"
});

// Deploy instantly
const deployment = await zb.deploy.create({
  siteId: site.id,
  domain: "photos.yoursite.com"  // or use free *.zoobicon.sh subdomain
});

// Start an SEO campaign
const seo = await zb.seo.launch({ siteId: site.id, mode: "aggressive" });

// Create a promotional video
const video = await zb.video.create({
  siteId: site.id,
  platform: "instagram",
  style: "cinematic"
});`,
};

const API_ENDPOINTS = [
  { method: "POST", path: "/v1/generate", desc: "Generate a website from prompt" },
  { method: "POST", path: "/v1/generate/stream", desc: "Stream generation in real-time" },
  { method: "POST", path: "/v1/edit", desc: "Edit existing site with instructions" },
  { method: "GET", path: "/v1/sites", desc: "List all generated sites" },
  { method: "GET", path: "/v1/sites/:id", desc: "Get site details and code" },
  { method: "POST", path: "/v1/deploy", desc: "Deploy site to custom domain" },
  { method: "POST", path: "/v1/seo/campaigns", desc: "Create SEO campaign" },
  { method: "GET", path: "/v1/seo/campaigns/:id", desc: "Get campaign status & metrics" },
  { method: "POST", path: "/v1/video/create", desc: "Generate AI video" },
  { method: "POST", path: "/v1/brand/generate", desc: "Generate brand kit" },
  { method: "POST", path: "/v1/chatbot/create", desc: "Create AI chatbot" },
  { method: "GET", path: "/v1/usage", desc: "Get API usage and billing" },
];

const SDKS = [
  { lang: "JavaScript/TypeScript", pkg: "@zoobicon/sdk", install: "npm install @zoobicon/sdk", color: "text-yellow-400" },
  { lang: "Python", pkg: "zoobicon", install: "pip install zoobicon", color: "text-blue-400" },
  { lang: "Go", pkg: "go-zoobicon", install: "go get github.com/zoobicon/go-zoobicon", color: "text-cyan-400" },
  { lang: "Ruby", pkg: "zoobicon-ruby", install: "gem install zoobicon", color: "text-red-400" },
  { lang: "PHP", pkg: "zoobicon/sdk", install: "composer require zoobicon/sdk", color: "text-blue-400" },
  { lang: "cURL", pkg: "REST API", install: "Works with any HTTP client", color: "text-green-400" },
];

const FEATURES = [
  { icon: Webhook, title: "Webhooks", desc: "Real-time notifications for generation, deployment, and SEO events." },
  { icon: Shield, title: "OAuth 2.0", desc: "Secure authentication with scoped API keys and team permissions." },
  { icon: BarChart3, title: "Rate Limiting", desc: "Generous limits: 100 req/min (Free), 1000 req/min (Pro), Unlimited (Enterprise)." },
  { icon: Layers, title: "Batch Operations", desc: "Generate up to 50 sites in a single batch request with parallel processing." },
  { icon: Globe, title: "CDN Hosting", desc: "Auto-deploy to our global CDN. Custom domains with free SSL certificates." },
  { icon: GitBranch, title: "Version Control", desc: "Every generation is versioned. Roll back, diff, and branch your sites." },
];

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof CODE_EXAMPLES>("sdk");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] -top-[200px] right-[10%] opacity-10" />
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] bottom-[20%] -left-[100px] opacity-10" />
        <div className="grid-pattern fixed inset-0" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-emerald-600 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-md border border-accent-cyan/20">.io</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <a href="#api" className="text-sm text-white/40 hover:text-white transition-colors">API</a>
              <a href="#sdks" className="text-sm text-white/40 hover:text-white transition-colors">SDKs</a>
              <a href="#endpoints" className="text-sm text-white/40 hover:text-white transition-colors">Endpoints</a>
              <a href="#features" className="text-sm text-white/40 hover:text-white transition-colors">Features</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get API Key</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5">
                <Terminal className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Developer Platform</span>
              </div>
              <span className="text-xs text-white/20 font-mono">zoobicon.io</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Build With the<br />
              <span className="gradient-text">Most Powerful API</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg text-white/40 leading-relaxed mb-10">
              One API to generate websites, run SEO campaigns, create videos, and automate your entire digital pipeline.
              SDKs for every language. Ship in minutes, not months.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-16">
              <Link href="/auth/signup" className="group btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Get Free API Key</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#api" className="px-6 py-3 rounded-xl text-sm font-medium text-white/50 border border-white/[0.08] hover:border-white/20 hover:text-white/70 transition-all flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Read the Docs
              </a>
            </motion.div>

            {/* Code example */}
            <motion.div variants={fadeInUp} id="api">
              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="bg-dark-300/80 backdrop-blur-xl">
                  {/* Tabs */}
                  <div className="flex border-b border-white/[0.06] overflow-x-auto">
                    {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab
                            ? "text-accent-cyan border-b-2 border-accent-cyan"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        {tab === "sdk" ? "SDK Quick Start" : tab === "generate" ? "Generate Site" : tab === "seo" ? "SEO Agent" : "Video Creator"}
                      </button>
                    ))}
                  </div>
                  {/* Code */}
                  <div className="relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES[activeTab], activeTab)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors z-10"
                    >
                      {copiedEndpoint === activeTab ? (
                        <Check className="w-4 h-4 text-accent-cyan" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/30" />
                      )}
                    </button>
                    <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-white/60">
                      <code>{CODE_EXAMPLES[activeTab]}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SDKs */}
      <section id="sdks" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
                <Package className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Official SDKs</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Your Language.<br /><span className="gradient-text">Our Power.</span>
              </h2>
              <p className="text-lg text-white/40 max-w-xl mx-auto">First-class SDKs for every major language. Type-safe, well-documented, battle-tested.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SDKS.map((sdk) => (
                <motion.div key={sdk.lang} variants={fadeInUp} className="gradient-border card-hover p-5 rounded-xl group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold ${sdk.color}`}>{sdk.lang}</span>
                    <span className="text-[10px] font-mono text-white/20">{sdk.pkg}</span>
                  </div>
                  <div className="bg-dark-400/80 rounded-lg px-3 py-2 font-mono text-xs text-white/40 flex items-center justify-between">
                    <code>{sdk.install}</code>
                    <button
                      onClick={() => copyCode(sdk.install, sdk.lang)}
                      className="text-white/20 hover:text-white/50 transition-colors ml-2 flex-shrink-0"
                    >
                      {copiedEndpoint === sdk.lang ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Endpoints */}
      <section id="endpoints" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                API <span className="gradient-text">Reference</span>
              </h2>
              <p className="text-lg text-white/40">RESTful API with streaming support. Base URL: <code className="text-accent-cyan font-mono text-sm">https://api.zoobicon.io/v1</code></p>
            </motion.div>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60">
                {API_ENDPOINTS.map((endpoint, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-3.5 ${i !== API_ENDPOINTS.length - 1 ? "border-b border-white/[0.04]" : ""} hover:bg-white/[0.02] transition-colors`}>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      endpoint.method === "POST" ? "bg-brand-500/15 text-brand-400" : "bg-accent-cyan/15 text-accent-cyan"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-white/70 flex-shrink-0">{endpoint.path}</code>
                    <span className="text-sm text-white/30 hidden md:block">{endpoint.desc}</span>
                    <ChevronRight className="w-4 h-4 text-white/10 ml-auto" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Enterprise <span className="gradient-text">Infrastructure</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl">
                  <f.icon className="w-8 h-8 text-accent-cyan/60 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                API <span className="gradient-text">Pricing</span>
              </h2>
              <p className="text-lg text-white/40">Start free. Pay only for what you use.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              <motion.div variants={fadeInUp} className="gradient-border p-6 rounded-xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Free</div>
                <div className="text-3xl font-black mb-1">$0</div>
                <div className="text-xs text-white/30 mb-4">100 requests/day</div>
                <ul className="space-y-2 mb-6 text-sm text-white/40">
                  <li>50 site generations/month</li>
                  <li>Basic SEO audit</li>
                  <li>Community support</li>
                  <li>1 API key</li>
                </ul>
                <Link href="/auth/signup" className="block text-center py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-white/60 hover:border-white/20 transition-all">
                  Get Started
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="relative p-6 rounded-xl border border-accent-cyan/30 bg-accent-cyan/[0.02] shadow-glow-cyan">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-accent-cyan to-emerald-500 text-xs font-bold text-white">
                  Popular
                </div>
                <div className="text-sm font-semibold text-accent-cyan mb-2">Pro</div>
                <div className="text-3xl font-black mb-1">$79<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-xs text-white/30 mb-4">1,000 requests/min</div>
                <ul className="space-y-2 mb-6 text-sm text-white/50">
                  <li>Unlimited generations</li>
                  <li>Full SEO agent</li>
                  <li>Video creation API</li>
                  <li>Priority support</li>
                  <li>10 API keys</li>
                </ul>
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-emerald-500 text-sm font-bold text-white">
                  Start Pro
                </button>
              </motion.div>

              <motion.div variants={fadeInUp} className="gradient-border p-6 rounded-xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Enterprise</div>
                <div className="text-3xl font-black mb-1">Custom</div>
                <div className="text-xs text-white/30 mb-4">Unlimited everything</div>
                <ul className="space-y-2 mb-6 text-sm text-white/40">
                  <li>Dedicated infrastructure</li>
                  <li>Custom model training</li>
                  <li>SLA guarantee</li>
                  <li>Unlimited API keys</li>
                  <li>24/7 support</li>
                </ul>
                <a href="mailto:sales@zoobicon.com?subject=Enterprise API Inquiry" className="block w-full py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-white/60 hover:border-white/20 transition-all text-center">
                  Contact Sales
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Cpu className="w-12 h-12 text-accent-cyan/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Start Building <span className="gradient-text">Today</span>
          </h2>
          <p className="text-lg text-white/40 mb-8">Free API key. No credit card. Ship your first integration in under 5 minutes.</p>
          <div className="inline-flex items-center gap-2 bg-dark-200 border border-white/[0.08] rounded-xl px-5 py-3 font-mono text-sm text-white/50 mb-6">
            <span className="text-accent-cyan">$</span> npm install @zoobicon/sdk
            <button onClick={() => copyCode("npm install @zoobicon/sdk", "cta-install")} className="ml-2 text-white/20 hover:text-white/50">
              {copiedEndpoint === "cta-install" ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-center gap-3">
            <Link href="/auth/signup" className="btn-gradient px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
              <span>Get API Key</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/20">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40">Home</Link>
            <Link href="/agencies" className="text-xs text-white/20 hover:text-white/40">Agencies</Link>
            <Link href="/cli" className="text-xs text-white/20 hover:text-white/40">CLI</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
