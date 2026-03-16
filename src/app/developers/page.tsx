"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
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
  generate: `// POST /api/v1/generate — Generate a complete website
const response = await fetch("https://zoobicon.com/api/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer zbk_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "A modern SaaS landing page with pricing tables",
    generator: "saas",          // 43 specialized generators
    tier: "premium",            // standard | premium
    style: "dark minimal",      // freeform style description
    deploy: true,               // auto-deploy to zoobicon.sh
    deploy_name: "my-saas",     // custom subdomain
    webhook_url: "https://your-app.com/hooks/zoobicon"
  })
});

const { data } = await response.json();
// data.id:               "a1b2c3d4-..."
// data.html:             "<!DOCTYPE html>..."  (complete site)
// data.tokens_used:      18420
// data.generation_time_ms: 12500
// data.deployed.url:     "https://my-saas.zoobicon.sh"`,
  deploy: `// POST /api/v1/deploy — Deploy any HTML to zoobicon.sh
const response = await fetch("https://zoobicon.com/api/v1/deploy", {
  method: "POST",
  headers: {
    "Authorization": "Bearer zbk_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    html: myGeneratedHTML,
    name: "Client Portfolio",
    slug: "client-portfolio",        // → client-portfolio.zoobicon.sh
    commit_message: "Initial launch"
  })
});

const { data } = await response.json();
// data.site_id:        "uuid-..."
// data.url:            "https://client-portfolio.zoobicon.sh"
// data.deployment_id:  "uuid-..."

// Update later with PUT /api/v1/sites
await fetch("https://zoobicon.com/api/v1/sites", {
  method: "PUT",
  headers: { "Authorization": "Bearer zbk_live_...", "Content-Type": "application/json" },
  body: JSON.stringify({ slug: "client-portfolio", html: updatedHTML })
});`,
  sites: `// GET /api/v1/sites — List all your deployed sites
const response = await fetch("https://zoobicon.com/api/v1/sites?page=1&limit=20", {
  headers: { "Authorization": "Bearer zbk_live_..." }
});

const { data } = await response.json();
// data.sites: [
//   { id, name, slug, url, plan, status, created_at },
//   ...
// ]
// data.pagination: { page: 1, limit: 20, total: 47, totalPages: 3 }

// DELETE /api/v1/sites — Deactivate a site
await fetch("https://zoobicon.com/api/v1/sites", {
  method: "DELETE",
  headers: { "Authorization": "Bearer zbk_live_...", "Content-Type": "application/json" },
  body: JSON.stringify({ slug: "old-site" })
});`,
  status: `// GET /api/v1/status — API health + account info
const response = await fetch("https://zoobicon.com/api/v1/status", {
  headers: { "Authorization": "Bearer zbk_live_..." }
});

const { data } = await response.json();
// data.status:     "operational"
// data.plan:       "pro"
// data.rate_limit: { limit: 60, window_ms: 60000 }
// data.usage:      { sites_count: 47, deployments_count: 132, generations_count: 89 }
// data.endpoints:  [{ method, path, description }, ...]
// data.version:    "1.0.0"

// White-label branding (agency plans)
const branded = await fetch("https://zoobicon.com/api/v1/generate", {
  method: "POST",
  headers: { "Authorization": "Bearer zbk_live_...", "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Restaurant website for Bella Italia",
    agency_brand: {
      agencyName: "WebCraft Agency",
      primaryColor: "#1e40af",
      logoUrl: "https://webcraft.agency/logo.png"
    }
  })
});`,
};

const API_ENDPOINTS = [
  { method: "POST", path: "/api/v1/generate", desc: "Generate a website from prompt with 43 specialized generators" },
  { method: "GET", path: "/api/v1/sites", desc: "List all your deployed sites with pagination" },
  { method: "PUT", path: "/api/v1/sites", desc: "Update site HTML and create new deployment version" },
  { method: "DELETE", path: "/api/v1/sites", desc: "Deactivate a site by ID or slug" },
  { method: "POST", path: "/api/v1/deploy", desc: "Deploy HTML to zoobicon.sh with custom slug" },
  { method: "GET", path: "/api/v1/deploy", desc: "Get deployment history for a site" },
  { method: "GET", path: "/api/v1/status", desc: "API health check, usage stats, and account info" },
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
  { icon: BarChart3, title: "Rate Limiting", desc: "Tiered limits: 10 req/min (Free), 60 req/min (Pro), 600 req/min (Enterprise)." },
  { icon: Layers, title: "Batch Operations", desc: "Generate up to 50 sites in a single batch request with parallel processing." },
  { icon: Globe, title: "CDN Hosting", desc: "Auto-deploy to our global CDN. Custom domains with free SSL certificates." },
  { icon: GitBranch, title: "Version Control", desc: "Every generation is versioned. Roll back, diff, and branch your sites." },
];

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof CODE_EXAMPLES>("generate");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
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
              <a href="#api" className="text-sm text-white/60 hover:text-white transition-colors">API</a>
              <a href="#sdks" className="text-sm text-white/60 hover:text-white transition-colors">SDKs</a>
              <a href="#endpoints" className="text-sm text-white/60 hover:text-white transition-colors">Endpoints</a>
              <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get API Key</span>
            </Link>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5">
                <Terminal className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Developer Platform</span>
              </div>
              <span className="text-xs text-white/40 font-mono">zoobicon.io</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Build With the<br />
              <span className="gradient-text">Most Powerful API</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg text-white/60 leading-relaxed mb-10">
              One API to generate websites, run SEO campaigns, create videos, and automate your entire digital pipeline.
              SDKs for every language. Ship in minutes, not months.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-16">
              <Link href="/auth/signup" className="group btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Get Free API Key</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#api" className="px-6 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 hover:text-white/70 transition-all flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Read the Docs
              </a>
            </motion.div>

            {/* Code example */}
            <motion.div variants={fadeInUp} id="api">
              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="bg-dark-300/80 backdrop-blur-xl">
                  {/* Tabs */}
                  <div className="flex border-b border-white/[0.10] overflow-x-auto">
                    {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab
                            ? "text-accent-cyan border-b-2 border-accent-cyan"
                            : "text-white/50 hover:text-white/60"
                        }`}
                      >
                        {tab === "generate" ? "Generate" : tab === "deploy" ? "Deploy" : tab === "sites" ? "Manage Sites" : "Status & Branding"}
                      </button>
                    ))}
                  </div>
                  {/* Code */}
                  <div className="relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES[activeTab], activeTab)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.08] transition-colors z-10"
                    >
                      {copiedEndpoint === activeTab ? (
                        <Check className="w-4 h-4 text-accent-cyan" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
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
      <section id="sdks" className="py-20 border-t border-white/[0.08]">
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
              <p className="text-lg text-white/60 max-w-xl mx-auto">First-class SDKs for every major language. Type-safe, well-documented, battle-tested.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SDKS.map((sdk) => (
                <motion.div key={sdk.lang} variants={fadeInUp} className="gradient-border card-hover p-5 rounded-xl group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold ${sdk.color}`}>{sdk.lang}</span>
                    <span className="text-[10px] font-mono text-white/40">{sdk.pkg}</span>
                  </div>
                  <div className="bg-dark-400/80 rounded-lg px-3 py-2 font-mono text-xs text-white/60 flex items-center justify-between">
                    <code>{sdk.install}</code>
                    <button
                      onClick={() => copyCode(sdk.install, sdk.lang)}
                      className="text-white/40 hover:text-white/65 transition-colors ml-2 flex-shrink-0"
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
      <section id="endpoints" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                API <span className="gradient-text">Reference</span>
              </h2>
              <p className="text-lg text-white/60">RESTful API with Bearer token auth. Base URL: <code className="text-accent-cyan font-mono text-sm">https://zoobicon.com/api/v1</code></p>
            </motion.div>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60">
                {API_ENDPOINTS.map((endpoint, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-3.5 ${i !== API_ENDPOINTS.length - 1 ? "border-b border-white/[0.06]" : ""} hover:bg-white/[0.05] transition-colors`}>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      endpoint.method === "POST" ? "bg-brand-500/15 text-brand-400" : "bg-accent-cyan/15 text-accent-cyan"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-white/70 flex-shrink-0">{endpoint.path}</code>
                    <span className="text-sm text-white/50 hidden md:block">{endpoint.desc}</span>
                    <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-white/[0.08]">
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
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                API <span className="gradient-text">Pricing</span>
              </h2>
              <p className="text-lg text-white/60">Start free. Pay only for what you use.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              <motion.div variants={fadeInUp} className="gradient-border p-6 rounded-xl">
                <div className="text-sm font-semibold text-white/65 mb-2">Free</div>
                <div className="text-3xl font-black mb-1">$0</div>
                <div className="text-xs text-white/50 mb-4">10 requests/min</div>
                <ul className="space-y-2 mb-6 text-sm text-white/60">
                  <li>Standard tier generation</li>
                  <li>Deploy to zoobicon.sh</li>
                  <li>Community support</li>
                  <li>1 API key</li>
                </ul>
                <Link href="/auth/signup" className="block text-center py-2.5 rounded-xl border border-white/[0.12] text-sm font-semibold text-white/60 hover:border-white/20 transition-all">
                  Get Started
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="relative p-6 rounded-xl border border-accent-cyan/30 bg-accent-cyan/[0.02] shadow-glow-cyan">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-accent-cyan to-emerald-500 text-xs font-bold text-white">
                  Popular
                </div>
                <div className="text-sm font-semibold text-accent-cyan mb-2">Pro</div>
                <div className="text-3xl font-black mb-1">$79<span className="text-lg font-normal text-white/50">/mo</span></div>
                <div className="text-xs text-white/50 mb-4">60 requests/min</div>
                <ul className="space-y-2 mb-6 text-sm text-white/65">
                  <li>Premium tier generation</li>
                  <li>43 specialized generators</li>
                  <li>White-label branding</li>
                  <li>Webhook callbacks</li>
                  <li>Priority support</li>
                </ul>
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-emerald-500 text-sm font-bold text-white">
                  Start Pro
                </button>
              </motion.div>

              <motion.div variants={fadeInUp} className="gradient-border p-6 rounded-xl">
                <div className="text-sm font-semibold text-white/65 mb-2">Enterprise</div>
                <div className="text-3xl font-black mb-1">Custom</div>
                <div className="text-xs text-white/50 mb-4">600 requests/min</div>
                <ul className="space-y-2 mb-6 text-sm text-white/60">
                  <li>Dedicated rate limits</li>
                  <li>Custom model routing</li>
                  <li>SLA guarantee</li>
                  <li>Agency bulk generation</li>
                  <li>24/7 support</li>
                </ul>
                <a href="mailto:sales@zoobicon.com?subject=Enterprise API Inquiry" className="block w-full py-2.5 rounded-xl border border-white/[0.12] text-sm font-semibold text-white/60 hover:border-white/20 transition-all text-center">
                  Contact Sales
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Cpu className="w-12 h-12 text-accent-cyan/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Start Building <span className="gradient-text">Today</span>
          </h2>
          <p className="text-lg text-white/60 mb-8">Free API key. No credit card. Ship your first integration in under 5 minutes.</p>
          <div className="inline-flex items-center gap-2 bg-dark-200 border border-white/[0.12] rounded-xl px-5 py-3 font-mono text-sm text-white/65 mb-6">
            <span className="text-accent-cyan">$</span> npm install @zoobicon/sdk
            <button onClick={() => copyCode("npm install @zoobicon/sdk", "cta-install")} className="ml-2 text-white/40 hover:text-white/65">
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
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/40">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/40 hover:text-white/60">Home</Link>
            <Link href="/agencies" className="text-xs text-white/40 hover:text-white/60">Agencies</Link>
            <Link href="/cli" className="text-xs text-white/40 hover:text-white/60">CLI</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
