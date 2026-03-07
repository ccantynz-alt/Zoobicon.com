"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Terminal,
  Code2,
  Globe,
  Zap,
  Key,
  Webhook,
  Package,
  GitBranch,
  ArrowRight,
  Copy,
  Check,
  Server,
  Cpu,
  Languages,
  Search,
  Building2,
  Layers,
  Paintbrush,
  Bot,
  Rocket,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ─── Code Examples ─── */

const API_EXAMPLES = [
  {
    id: "generate",
    label: "Generate Website",
    method: "POST",
    endpoint: "/api/generate",
    curl: `curl -X POST https://api.zoobicon.io/v1/generate \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Modern SaaS landing page for a project management tool",
    "style": "minimal",
    "pages": ["home", "pricing", "about"],
    "framework": "nextjs"
  }'`,
    javascript: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon("zbk_live_abc123...");

const site = await zb.generate({
  prompt: "Modern SaaS landing page for a project management tool",
  style: "minimal",
  pages: ["home", "pricing", "about"],
  framework: "nextjs",
});

console.log(site.url);       // https://my-site.zoobicon.app
console.log(site.previewUrl); // https://preview.zoobicon.io/abc123`,
    python: `import zoobicon

client = zoobicon.Client("zbk_live_abc123...")

site = client.generate(
    prompt="Modern SaaS landing page for a project management tool",
    style="minimal",
    pages=["home", "pricing", "about"],
    framework="nextjs",
)

print(site.url)         # https://my-site.zoobicon.app
print(site.preview_url) # https://preview.zoobicon.io/abc123`,
  },
  {
    id: "chat",
    label: "Edit with AI",
    method: "POST",
    endpoint: "/api/chat",
    curl: `curl -N -X POST https://api.zoobicon.io/v1/chat \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_id": "site_abc123",
    "message": "Change the hero background to a gradient and add a CTA button",
    "stream": true
  }'

# Response (Server-Sent Events):
# data: {"type":"delta","content":"Updating hero section..."}
# data: {"type":"delta","content":"Adding gradient background..."}
# data: {"type":"delta","content":"Inserting CTA button..."}
# data: {"type":"done","site_url":"https://my-site.zoobicon.app"}`,
    javascript: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon("zbk_live_abc123...");

const stream = await zb.chat({
  siteId: "site_abc123",
  message: "Change the hero background to a gradient and add a CTA button",
  stream: true,
});

for await (const event of stream) {
  if (event.type === "delta") {
    process.stdout.write(event.content);
  }
  if (event.type === "done") {
    console.log("\\nUpdated:", event.siteUrl);
  }
}`,
    python: `import zoobicon

client = zoobicon.Client("zbk_live_abc123...")

stream = client.chat(
    site_id="site_abc123",
    message="Change the hero background to a gradient and add a CTA button",
    stream=True,
)

for event in stream:
    if event.type == "delta":
        print(event.content, end="", flush=True)
    if event.type == "done":
        print(f"\\nUpdated: {event.site_url}")`,
  },
  {
    id: "export",
    label: "Export to WordPress",
    method: "POST",
    endpoint: "/api/export/wordpress",
    curl: `curl -X POST https://api.zoobicon.io/v1/export/wordpress \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_id": "site_abc123",
    "wordpress_url": "https://mysite.com",
    "username": "admin",
    "app_password": "xxxx xxxx xxxx xxxx",
    "include_media": true
  }'`,
    javascript: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon("zbk_live_abc123...");

const result = await zb.export.wordpress({
  siteId: "site_abc123",
  wordpressUrl: "https://mysite.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx",
  includeMedia: true,
});

console.log(result.status);  // "exported"
console.log(result.pages);   // 5 pages exported`,
    python: `import zoobicon

client = zoobicon.Client("zbk_live_abc123...")

result = client.export.wordpress(
    site_id="site_abc123",
    wordpress_url="https://mysite.com",
    username="admin",
    app_password="xxxx xxxx xxxx xxxx",
    include_media=True,
)

print(result.status)  # "exported"
print(result.pages)   # 5 pages exported`,
  },
  {
    id: "seo",
    label: "SEO Analysis",
    method: "POST",
    endpoint: "/api/seo/analyze",
    curl: `curl -X POST https://api.zoobicon.io/v1/seo/analyze \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_id": "site_abc123",
    "checks": ["meta", "performance", "accessibility", "keywords"],
    "competitors": ["competitor1.com", "competitor2.com"]
  }'`,
    javascript: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon("zbk_live_abc123...");

const report = await zb.seo.analyze({
  siteId: "site_abc123",
  checks: ["meta", "performance", "accessibility", "keywords"],
  competitors: ["competitor1.com", "competitor2.com"],
});

console.log(report.score);          // 94
console.log(report.suggestions);    // [{...}, {...}]
console.log(report.competitorGap);  // keyword opportunities`,
    python: `import zoobicon

client = zoobicon.Client("zbk_live_abc123...")

report = client.seo.analyze(
    site_id="site_abc123",
    checks=["meta", "performance", "accessibility", "keywords"],
    competitors=["competitor1.com", "competitor2.com"],
)

print(report.score)           # 94
print(report.suggestions)     # [{...}, {...}]
print(report.competitor_gap)  # keyword opportunities`,
  },
  {
    id: "translate",
    label: "Translate",
    method: "POST",
    endpoint: "/api/translate",
    curl: `curl -X POST https://api.zoobicon.io/v1/translate \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_id": "site_abc123",
    "target_languages": ["es", "fr", "de", "ja"],
    "preserve_seo": true,
    "localize_images": true
  }'`,
    javascript: `import { Zoobicon } from "@zoobicon/sdk";

const zb = new Zoobicon("zbk_live_abc123...");

const result = await zb.translate({
  siteId: "site_abc123",
  targetLanguages: ["es", "fr", "de", "ja"],
  preserveSeo: true,
  localizeImages: true,
});

console.log(result.translations); // { es: "https://...", fr: "https://..." }
console.log(result.wordCount);    // 12,450 words translated`,
    python: `import zoobicon

client = zoobicon.Client("zbk_live_abc123...")

result = client.translate(
    site_id="site_abc123",
    target_languages=["es", "fr", "de", "ja"],
    preserve_seo=True,
    localize_images=True,
)

print(result.translations)  # {"es": "https://...", "fr": "https://..."}
print(result.word_count)    # 12,450 words translated`,
  },
];

const SDK_CARDS = [
  {
    icon: Code2,
    title: "JavaScript / TypeScript SDK",
    install: "npm install @zoobicon/sdk",
    description:
      "Full-featured SDK with TypeScript types, streaming support, and automatic retries.",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgGlow: "bg-yellow-500/5",
  },
  {
    icon: Terminal,
    title: "Python SDK",
    install: "pip install zoobicon",
    description:
      "Pythonic interface with async support, Pydantic models, and comprehensive type hints.",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/5",
  },
  {
    icon: Globe,
    title: "REST API",
    install: "https://api.zoobicon.io/v1",
    description:
      "Direct HTTP calls with JSON. OpenAPI 3.1 spec available. Works with any language.",
    color: "text-green-400",
    borderColor: "border-green-500/30",
    bgGlow: "bg-green-500/5",
  },
  {
    icon: Terminal,
    title: "CLI",
    install: "npm install -g zoobicon-cli",
    description:
      "Generate, deploy, and manage sites from your terminal. Perfect for scripting and automation.",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgGlow: "bg-purple-500/5",
  },
  {
    icon: GitBranch,
    title: "GitHub Actions",
    install: "zoobicon/deploy-action@v1",
    description:
      "Auto-deploy on push. Preview environments for PRs. Full CI/CD integration.",
    color: "text-gray-300",
    borderColor: "border-gray-500/30",
    bgGlow: "bg-gray-500/5",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    install: "POST your-endpoint.com/webhook",
    description:
      "Real-time notifications for build completion, deployment, SEO alerts, and more.",
    color: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgGlow: "bg-orange-500/5",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    generations: "50 generations/month",
    rateLimit: "20 req/min",
    features: [
      "Community support",
      "Basic analytics",
      "Single project",
      "Zoobicon subdomain",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    generations: "1,000 generations/month",
    rateLimit: "120 req/min",
    features: [
      "Priority support",
      "Advanced analytics",
      "Unlimited projects",
      "Custom domains",
      "Webhooks",
      "Team access (5 seats)",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    generations: "Unlimited generations",
    rateLimit: "Dedicated infrastructure",
    features: [
      "24/7 dedicated support",
      "SLA guarantee (99.99%)",
      "Unlimited everything",
      "On-premise option",
      "Custom integrations",
      "SSO / SAML",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: "Bulk Website Generation",
    description:
      "Agencies can generate hundreds of client sites programmatically from templates or prompts.",
  },
  {
    icon: GitBranch,
    title: "CI/CD Automated Deployment",
    description:
      "Push to main and auto-deploy. Preview environments on every PR. Rollback in seconds.",
  },
  {
    icon: Paintbrush,
    title: "White-Label Integration",
    description:
      "Embed Zoobicon's builder in your own platform. Full customization, your branding.",
  },
  {
    icon: Layers,
    title: "Headless CMS + AI Generation",
    description:
      "Use your CMS content with AI to auto-generate and update website pages.",
  },
  {
    icon: Search,
    title: "Automated SEO Pipeline",
    description:
      "Continuously analyze, optimize, and track SEO performance across all your sites.",
  },
  {
    icon: Languages,
    title: "Multi-Language Deployment",
    description:
      "Deploy sites in 50+ languages simultaneously with SEO-optimized translations.",
  },
];

/* ─── Helper Components ─── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative group">
      <CopyButton text={code} />
      <pre className="overflow-x-auto p-5 pt-4 text-sm leading-relaxed font-mono text-gray-300 bg-[#0d0d14] rounded-b-xl border border-white/5">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Main Page ─── */

export default function ZoobiconIOPage() {
  const [activeExample, setActiveExample] = useState(0);
  const [activeLang, setActiveLang] = useState<"curl" | "javascript" | "python">("curl");

  const example = API_EXAMPLES[activeExample];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/5 rounded-full blur-[120px]" />

        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-sm font-mono mb-8">
            <Terminal className="w-4 h-4" />
            Developer Platform
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-green-400">Zoobicon.io</span>
            <br />
            <span className="text-white/90">The Developer Platform</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            REST API, SDKs, webhooks, and CI/CD integrations.
            <br className="hidden md:block" />
            Build AI-powered websites programmatically at scale.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
            >
              Get Your API Key
              <Key className="w-4 h-4" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-mono text-sm"
            >
              $ zoobicon --docs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Quick install */}
          <motion.div variants={fadeInUp} className="mt-12 max-w-lg mx-auto">
            <div className="flex items-center gap-3 bg-[#0d0d14] border border-white/10 rounded-lg px-5 py-3 font-mono text-sm">
              <span className="text-green-400">$</span>
              <span className="text-gray-300">npm install @zoobicon/sdk</span>
              <CopyButton text="npm install @zoobicon/sdk" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── API Showcase ─── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-green-400">API</span> Showcase
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Powerful endpoints for every step of the website lifecycle. Generate, edit, analyze, translate, and export — all through simple API calls.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            {/* Endpoint tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {API_EXAMPLES.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => setActiveExample(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                    activeExample === i
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/10 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold mr-2 opacity-60">{ex.method}</span>
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Code window */}
            <div className="rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden">
              {/* Window header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {example.method} {example.endpoint}
                </span>
                <div className="flex gap-1">
                  {(["curl", "javascript", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        activeLang === lang
                          ? "bg-green-500/15 text-green-400"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <CodeBlock
                code={example[activeLang]}
                language={activeLang}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SDK Cards ─── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              SDKs & <span className="text-green-400">Integrations</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              First-class support for every workflow. Choose your language, your tools, your way.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {SDK_CARDS.map((sdk) => (
              <motion.div
                key={sdk.title}
                variants={scaleIn}
                className={`relative group p-6 rounded-xl border ${sdk.borderColor} ${sdk.bgGlow} hover:bg-white/[0.03] transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <sdk.icon className={`w-5 h-5 ${sdk.color}`} />
                  <h3 className="font-semibold text-white">{sdk.title}</h3>
                </div>
                <div className="font-mono text-xs bg-black/30 rounded-lg px-3 py-2 mb-4 text-gray-400 border border-white/5">
                  <span className="text-green-400 mr-1">$</span> {sdk.install}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{sdk.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Rate Limits & Pricing ─── */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Rate Limits & <span className="text-green-400">Pricing</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Transparent pricing. No hidden fees. Scale as you grow.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {PRICING_TIERS.map((tier) => (
              <motion.div
                key={tier.name}
                variants={scaleIn}
                className={`relative p-8 rounded-xl border transition-all ${
                  tier.highlight
                    ? "border-green-500/40 bg-green-500/[0.03] shadow-[0_0_60px_-15px_rgba(34,197,94,0.15)]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-green-500 text-black text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-green-400">{tier.price}</span>
                  <span className="text-gray-500 text-sm">{tier.period}</span>
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 font-mono">{tier.generations}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 font-mono">{tier.rateLimit}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.name === "Enterprise" ? "/contact" : "/auth/settings"}
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? "bg-green-500 hover:bg-green-400 text-black"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Authentication ─── */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-green-400">Authentication</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Secure API key authentication. Generate keys in your dashboard and start building in minutes.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center font-mono text-green-400 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Generate an API key</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Navigate to{" "}
                    <Link href="/auth/settings" className="text-green-400 hover:underline">
                      Settings
                    </Link>{" "}
                    and create a new API key. Keys use the format:
                  </p>
                  <div className="font-mono text-sm bg-[#0d0d14] border border-white/10 rounded-lg px-4 py-3 text-gray-300">
                    zbk_live_<span className="text-green-400">xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center font-mono text-green-400 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Add to your request headers</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Include your key in the <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header of every request.
                  </p>
                  <div className="relative font-mono text-sm bg-[#0d0d14] border border-white/10 rounded-lg px-4 py-3 text-gray-300">
                    <CopyButton text='Authorization: Bearer zbk_live_abc123...' />
                    <span className="text-gray-500">Authorization:</span> Bearer zbk_live_abc123...
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center font-mono text-green-400 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Security best practices</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                      Never expose API keys in client-side code or public repositories
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                      Use environment variables: <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">ZOOBICON_API_KEY</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                      Rotate keys regularly and revoke unused keys immediately
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                      Use test keys (<code className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded text-xs">zbk_test_...</code>) for development
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Use Cases Grid ─── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="text-green-400">Every Workflow</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              From solo developers to enterprise teams, the API adapts to your use case.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {USE_CASES.map((useCase) => (
              <motion.div
                key={useCase.title}
                variants={scaleIn}
                className="group p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:border-green-500/20 hover:bg-green-500/[0.02] transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <useCase.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{useCase.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-green-500/[0.03] to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/5 rounded-full blur-[100px]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-xs font-mono mb-8">
            <Rocket className="w-3 h-3" />
            Ready to ship?
          </motion.div>

          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
            Start building with the
            <br />
            <span className="text-green-400">Zoobicon API</span> today
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-gray-400 mb-10 text-lg">
            Free tier included. No credit card required.
            <br />
            Go from zero to deployed in minutes.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/settings"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors text-lg"
            >
              Get Your API Key
              <Key className="w-5 h-5" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-green-500/30 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-semibold"
            >
              Read the Docs
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-10 font-mono text-sm text-gray-600">
            <span className="text-green-500/50">$</span> curl https://api.zoobicon.io/v1/health
            <span className="text-green-400 ml-3">{"{ \"status\": \"ok\" }"}</span>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
