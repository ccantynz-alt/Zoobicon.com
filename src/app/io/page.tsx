"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Mail,
  Globe,
  Shield,
  Zap,
  Server,
  BarChart3,
  ArrowRight,
  Check,
  Copy,
  Search,
  Lock,
  Send,
  Inbox,
  Users,
  Bot,
  ChevronRight,
  Rocket,
  Code2,
  Terminal,
  Clock,
  AlertTriangle,
  MousePointerClick,
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

/* ─── Domain Search Component ─── */

function DomainSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ domain: string; available: boolean; price?: number }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setSearching(true);
    setSearched(false);

    try {
      const res = await fetch(
        `/api/domains/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Find your perfect domain..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-lg"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="btn-gradient px-8 py-4 rounded-xl font-semibold text-white disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {searched && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden"
        >
          {results.slice(0, 8).map((r) => (
            <div
              key={r.domain}
              className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    r.available ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span className="font-mono text-sm text-white">{r.domain}</span>
              </div>
              {r.available ? (
                <div className="flex items-center gap-3">
                  <span className="text-brand-400 font-semibold">
                    ${r.price?.toFixed(2)}/yr
                  </span>
                  <Link
                    href="/auth/signup"
                    className="px-3 py-1.5 bg-brand-500/10 text-brand-400 rounded-lg text-xs font-semibold hover:bg-brand-500/20 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <span className="text-gray-600 text-sm">Taken</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Copy Button ─── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-brand-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

/* ─── API Example Tabs ─── */

const API_EXAMPLES = [
  {
    id: "send",
    label: "Send Email",
    method: "POST",
    code: `curl -X POST https://api.zoobicon.io/v1/email/send \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "hello@yourdomain.com",
    "to": "customer@gmail.com",
    "subject": "Welcome aboard!",
    "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
    "tags": { "campaign": "onboarding" }
  }'`,
  },
  {
    id: "domain",
    label: "Add Domain",
    method: "POST",
    code: `curl -X POST https://api.zoobicon.io/v1/email/domains \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "yourdomain.com",
    "email": "you@yourdomain.com"
  }'

# Returns DNS records to configure:
# SPF, DKIM (3 selectors), DMARC — all auto-generated`,
  },
  {
    id: "register",
    label: "Register Domain",
    method: "POST",
    code: `curl -X POST https://api.zoobicon.io/v1/domains/register \\
  -H "Authorization: Bearer zbk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "myawesomesite.com",
    "period": 1,
    "privacyProtection": true,
    "registrant": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "phone": "+1.5555551234",
      "address1": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postalCode": "78701",
      "country": "US"
    }
  }'`,
  },
  {
    id: "analytics",
    label: "Email Analytics",
    method: "GET",
    code: `curl https://api.zoobicon.io/v1/email/analytics?domain=yourdomain.com&period=30d \\
  -H "Authorization: Bearer zbk_live_abc123..."

# Response:
# {
#   "stats": { "sent": 12450, "delivered": 12301, "opened": 4892 },
#   "rates": {
#     "deliveryRate": "98.8%",
#     "openRate": "39.8%",
#     "bounceRate": "0.4%"
#   }
# }`,
  },
];

/* ─── Features ─── */

const EMAIL_FEATURES = [
  {
    icon: Send,
    title: "Transactional Email API",
    description:
      "Send via REST API or SMTP relay. Automatic retry, queuing, and throttling. $0.10 per 1,000 emails.",
    color: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: Inbox,
    title: "Email Receiving & Routing",
    description:
      "Receive email on your domain. Forward, store, or process with webhooks. Catch-all and per-address rules.",
    color: "text-green-400",
    border: "border-green-500/20",
  },
  {
    icon: Shield,
    title: "Auto Authentication",
    description:
      "Full-featured SDK with TypeScript types, streaming support, and automatic retries. Coming soon.",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgGlow: "bg-yellow-500/8",
  },
  {
    icon: Bot,
    title: "AI Deliverability Agent",
    description:
      "Pythonic interface with async support, Pydantic models, and comprehensive type hints. Coming soon.",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/8",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track sends, deliveries, opens, clicks, bounces, and complaints. Webhooks for every event.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    icon: Users,
    title: "Mailbox Hosting",
    description:
      "Create mailboxes on your domain. info@, support@, hello@ — with forwarding, auto-reply, and 1GB storage.",
    color: "text-pink-400",
    border: "border-pink-500/20",
  },
];

const DOMAIN_FEATURES = [
  {
    icon: Globe,
    title: "Domain Registration",
    description:
      "Direct HTTP calls with JSON. OpenAPI 3.1 spec available. Works with any language.",
    color: "text-brand-400",
    borderColor: "border-green-500/30",
    bgGlow: "bg-green-500/8",
  },
  {
    icon: Lock,
    title: "Free WHOIS Privacy",
    description:
      "Generate, deploy, and manage sites from your terminal. Perfect for scripting and automation.",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/8",
  },
  {
    icon: Server,
    title: "DNS Management",
    description:
      "Auto-deploy on push. Preview environments for PRs. Full CI/CD integration. Coming soon.",
    color: "text-gray-300",
    borderColor: "border-gray-500/30",
    bgGlow: "bg-gray-500/8",
  },
  {
    icon: Zap,
    title: "One-Click Email Setup",
    description:
      "Real-time notifications for build completion, deployment, SEO alerts, and more.",
    color: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgGlow: "bg-orange-500/8",
  },
];

/* ─── Pricing ─── */

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For personal projects",
    features: [
      "1,000 emails/month",
      "1 domain",
      "2 mailboxes",
      "Basic analytics",
      "Community support",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$25",
    period: "/mo",
    description: "For growing businesses",
    features: [
      "50,000 emails/month",
      "10 domains",
      "25 mailboxes",
      "Full analytics + webhooks",
      "AI deliverability agent",
      "Priority support",
      "Custom DKIM signing",
    ],
    cta: "Start Growing",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$99",
    period: "/mo",
    description: "For high-volume senders",
    features: [
      "500,000 emails/month",
      "Unlimited domains",
      "Unlimited mailboxes",
      "Dedicated IP pool",
      "AI deliverability + abuse detection",
      "SLA guarantee",
      "Dedicated account manager",
      "Domain reseller API",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

/* ─── SDK Cards ─── */

const SDK_CARDS = [
  {
    icon: Code2,
    title: "Node.js / TypeScript",
    color: "text-green-400",
    borderColor: "border-green-500/20",
    bgGlow: "bg-green-500/8",
    install: "npm install @zoobicon/sdk",
    description: "Full-featured SDK with TypeScript types, streaming support, and automatic retries.",
  },
  {
    icon: Terminal,
    title: "Python",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    bgGlow: "bg-yellow-500/8",
    install: "pip install zoobicon",
    description: "Pythonic interface with async support, Pydantic models, and comprehensive type hints.",
  },
  {
    icon: Globe,
    title: "REST API",
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgGlow: "bg-blue-500/8",
    install: "curl https://api.zoobicon.io/v1/...",
    description: "Direct HTTP calls with JSON. OpenAPI 3.1 spec available. Works with any language.",
  },
];

/* ─── Comparison ─── */

const COMPARISON = [
  { feature: "Transactional Email API", zoobicon: true, mailgun: true, sendgrid: true },
  { feature: "Domain Registration", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "AI Deliverability Agent", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Auto SPF/DKIM/DMARC Setup", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Mailbox Hosting", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Website Builder Integration", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Site Hosting", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Free WHOIS Privacy", zoobicon: true, mailgun: false, sendgrid: false },
  { feature: "Starting Price", zoobicon: "Free", mailgun: "$35/mo", sendgrid: "$19.95/mo" },
];

/* ─── Helper Components ─── */

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-1.5 rounded bg-white/8 hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative group">
      <CodeCopyButton text={code} />
      <pre className="overflow-x-auto p-5 pt-4 text-sm leading-relaxed font-mono text-gray-300 bg-[#111a2e] rounded-b-xl border border-white/10">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Main Page ─── */

export default function ZoobiconIOPage() {
  const [activeExample, setActiveExample] = useState(0);
  const [activeLang, setActiveLang] = useState<"curl" | "javascript" | "python">("curl");

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-hidden relative">
      <BackgroundEffects preset="technical" />
      <CursorGlowTracker />

      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-24 px-4">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />

        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/5 text-brand-400 text-sm font-mono mb-8"
          >
            <Mail className="w-4 h-4" />
            Email Infrastructure + Domain Registration
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="gradient-text">Your email.</span>
            <br />
            <span className="gradient-text">Your domain.</span>
            <br />
            <span className="text-white/90">Your platform.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Register domains, send transactional email, host mailboxes, and
            monitor deliverability — all from one platform. AI handles the
            hard parts so you don&apos;t need a team.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <Link
              href="/auth/signup"
              className="btn-gradient inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl text-lg"
            >
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/15 hover:border-white/20 bg-white/8 hover:bg-white/10 rounded-lg transition-colors font-mono text-sm"
            >
              View API Docs
              <Code2 className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Quick install */}
          <motion.div variants={fadeInUp} className="mt-12 max-w-lg mx-auto">
            <div className="flex items-center gap-3 bg-[#111a2e] border border-white/15 rounded-lg px-5 py-3 font-mono text-sm">
              <span className="text-brand-400">$</span>
              <span className="text-gray-300">npm install @zoobicon/sdk</span>
              <CopyButton text="npm install @zoobicon/sdk" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Email Features ─── */}
      <section id="email" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Email Infrastructure{" "}
              <span className="text-brand-400">That Just Works</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 max-w-2xl mx-auto"
            >
              Send, receive, and monitor email on your own domain. AI handles
              authentication, deliverability, and abuse detection automatically.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {EMAIL_FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                className={`relative group p-6 rounded-xl border ${feature.border} bg-white/[0.01] hover:bg-white/[0.03] transition-all`}
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Sending in{" "}
              <span className="text-brand-400">Under 5 Minutes</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-8"
          >
            {[
              {
                step: "1",
                title: "Add your domain",
                desc: "Enter your domain name. We generate all required DNS records (SPF, DKIM, DMARC) automatically.",
                icon: Globe,
              },
              {
                step: "2",
                title: "Configure DNS",
                desc: "Copy the generated records to your DNS provider. Or if you registered through us, it's already done.",
                icon: Shield,
              },
              {
                step: "3",
                title: "Start sending",
                desc: "Use the REST API or SMTP relay to send. AI monitors deliverability in real-time.",
                icon: Send,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="flex gap-5 items-start"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-mono text-brand-400 font-bold text-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-brand-400" />
                    <h3 className="font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Domain Registration ─── */}
      <section id="domains" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Domain Registration{" "}
              <span className="text-brand-400">+ Email in One Place</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 max-w-2xl mx-auto"
            >
              Register your domain and get email set up in a single flow. No
              separate registrar, no manual DNS configuration.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {DOMAIN_FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                className="p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:border-brand-500/20 hover:bg-brand-500/[0.02] transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* TLD pricing preview */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { tld: ".com", price: "$12.99" },
                { tld: ".io", price: "$39.99" },
                { tld: ".ai", price: "$79.99" },
                { tld: ".dev", price: "$14.99" },
                { tld: ".sh", price: "$24.99" },
                { tld: ".co", price: "$29.99" },
                { tld: ".org", price: "$11.99" },
                { tld: ".xyz", price: "$9.99" },
              ].map((item) => (
                <div
                  key={item.tld}
                  className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg"
                >
                  <span className="font-mono text-white font-semibold">
                    {item.tld}
                  </span>
                  <span className="text-brand-400 text-sm font-semibold">
                    {item.price}/yr
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">
              100+ TLDs available. All include free WHOIS privacy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── API Showcase ─── */}
      <section id="api" className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Developer-First{" "}
              <span className="text-brand-400">REST API</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 max-w-2xl mx-auto">
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
                      ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
                      : "bg-white/8 text-gray-300 border border-white/10 hover:border-white/15 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold mr-2 opacity-60">
                    {ex.method}
                  </span>
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Code window */}
            <div className="rounded-xl border border-white/15 bg-[#111a2e] overflow-hidden">
              {/* Window header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs font-mono text-gray-300">
                  {API_EXAMPLES[activeExample].method} {API_EXAMPLES[activeExample].label}
                </span>
                <div className="flex gap-1">
                  {(["curl", "javascript", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        activeLang === lang
                          ? "bg-brand-500/15 text-brand-400"
                          : "text-gray-300 hover:text-gray-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed font-mono text-gray-300">
                <code>{API_EXAMPLES[activeExample].code}</code>
              </pre>
            </div>

            {/* API endpoints summary */}
            <div className="mt-8 grid md:grid-cols-2 gap-3">
              {[
                {
                  method: "POST",
                  path: "/api/email/send",
                  desc: "Send transactional or marketing email",
                },
                {
                  method: "POST",
                  path: "/api/email/domains",
                  desc: "Add domain with auto SPF/DKIM/DMARC",
                },
                {
                  method: "POST",
                  path: "/api/email/mailboxes",
                  desc: "Create mailboxes on your domain",
                },
                {
                  method: "GET",
                  path: "/api/email/analytics",
                  desc: "Delivery stats, opens, clicks, bounces",
                },
                {
                  method: "POST",
                  path: "/api/email/inbound",
                  desc: "Receive email via webhook",
                },
                {
                  method: "GET",
                  path: "/api/domains/search",
                  desc: "Search domain availability + pricing",
                },
                {
                  method: "POST",
                  path: "/api/domains/register",
                  desc: "Register, renew, transfer domains",
                },
                {
                  method: "GET",
                  path: "/api/domains/manage",
                  desc: "WHOIS, pricing, domain management",
                },
              ].map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg"
                >
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      endpoint.method === "POST"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm text-gray-300 flex-1">
                    {endpoint.path}
                  </span>
                  <span className="text-xs text-gray-600 hidden lg:block">
                    {endpoint.desc}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Why <span className="text-brand-400">Zoobicon.io</span>?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 max-w-2xl mx-auto">
              First-class support for every workflow. Choose your language, your tools, your way.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="border border-white/10 rounded-xl overflow-hidden"
          >
            {SDK_CARDS.map((sdk) => (
              <motion.div
                key={sdk.title}
                variants={scaleIn}
                className={`relative group p-6 rounded-xl border ${sdk.borderColor} ${sdk.bgGlow} hover:bg-white/[0.06] transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <sdk.icon className={`w-5 h-5 ${sdk.color}`} />
                  <h3 className="font-semibold text-white">{sdk.title}</h3>
                </div>
                <div className="font-mono text-xs bg-black/30 rounded-lg px-3 py-2 mb-4 text-gray-300 border border-white/10">
                  <span className="text-brand-400 mr-1">$</span> {sdk.install}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{sdk.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Simple, <span className="text-brand-400">Transparent</span>{" "}
              Pricing
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 max-w-2xl mx-auto">
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
            {PRICING.map((tier) => (
              <motion.div
                key={tier.name}
                variants={scaleIn}
                className={`relative p-8 rounded-xl border transition-all ${
                  tier.highlight
                    ? "border-brand-500/40 bg-brand-500/[0.03] shadow-[0_0_60px_-15px_rgba(37,99,235,0.15)]"
                    : "border-white/15 bg-white/[0.05] hover:border-white/15"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-brand-400">{tier.price}</span>
                  <span className="text-gray-300 text-sm">{tier.period}</span>
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <span className="text-gray-300 font-mono">{tier.generations}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <span className="text-gray-300 font-mono">{tier.rateLimit}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-brand-400/70 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    tier.name === "Scale" ? "/support" : "/auth/signup"
                  }
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? "btn-gradient text-white"
                      : "bg-white/8 hover:bg-white/10 text-white border border-white/15"
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center text-gray-600 text-sm mt-8"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-brand-400">Authentication</span>
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Secure API key authentication. Generate keys in your dashboard and start building in minutes.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-mono text-brand-400 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Generate an API key</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Navigate to{" "}
                    <Link href="/auth/settings" className="text-brand-400 hover:underline">
                      Settings
                    </Link>{" "}
                    and create a new API key. Keys use the format:
                  </p>
                  <div className="font-mono text-sm bg-[#111a2e] border border-white/15 rounded-lg px-4 py-3 text-gray-300">
                    zbk_live_<span className="text-brand-400">xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-mono text-brand-400 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Add to your request headers</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Include your key in the <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header of every request.
                  </p>
                  <div className="relative font-mono text-sm bg-[#111a2e] border border-white/15 rounded-lg px-4 py-3 text-gray-300">
                    <CopyButton text='Authorization: Bearer zbk_live_abc123...' />
                    <span className="text-gray-300">Authorization:</span> Bearer zbk_live_abc123...
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-mono text-brand-400 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Security best practices</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-400/70 flex-shrink-0" />
                      Never expose API keys in client-side code or public repositories
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-400/70 flex-shrink-0" />
                      Use environment variables: <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs">ZOOBICON_API_KEY</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-400/70 flex-shrink-0" />
                      Rotate keys regularly and revoke unused keys immediately
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-400/70 flex-shrink-0" />
                      Use test keys (<code className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded text-xs">zbk_test_...</code>) for development
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Platform Integration ─── */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Part of the{" "}
              <span className="text-brand-400">Zoobicon Platform</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 max-w-2xl mx-auto">
              From solo developers to enterprise teams, the API adapts to your use case.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                domain: "zoobicon.ai",
                tagline: "Build it",
                desc: "AI website builder with 32+ generators, multi-page sites, and full-stack apps.",
                href: "/ai",
                icon: Bot,
              },
              {
                domain: "zoobicon.sh",
                tagline: "Host it",
                desc: "Deploy to zoobicon.sh with CDN, SSL, and custom domains. One-click from the builder.",
                href: "/sh",
                icon: Server,
              },
              {
                domain: "zoobicon.io",
                tagline: "Email it",
                desc: "Register domains, send email, host mailboxes. AI deliverability built in.",
                href: "/io",
                icon: Mail,
                active: true,
              },
            ].map((platform) => (
              <motion.div
                key={platform.domain}
                variants={scaleIn}
                className="group p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:border-brand-500/20 hover:bg-brand-500/[0.02] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <platform.icon
                    className={`w-5 h-5 ${
                      platform.active ? "text-brand-400" : "text-gray-400"
                    }`}
                  />
                  <span className="font-mono text-sm text-gray-400">
                    {platform.domain}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2">{platform.tagline}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{platform.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-500/[0.03] to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/8 rounded-full blur-[100px]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/5 text-brand-400 text-xs font-mono mb-8"
          >
            <Rocket className="w-3 h-3" />
            Ready to own your email?
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Stop renting.
            <br />
            <span className="text-brand-400">Start owning.</span>
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-gray-300 mb-10 text-lg">
            Free tier included. No credit card required.
            <br />
            No third-party lock-in. No per-seat pricing.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/auth/signup"
              className="btn-gradient inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl text-lg"
            >
              Get Started Free
              <Mail className="w-5 h-5" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/15 hover:border-brand-500/30 bg-white/8 hover:bg-white/10 rounded-lg transition-colors font-semibold"
            >
              API Documentation
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-10 font-mono text-sm text-gray-300">
            <span className="text-brand-400/50">$</span> curl https://api.zoobicon.io/v1/health
            <span className="text-brand-400 ml-3">{"{ \"status\": \"ok\" }"}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-brand-400" />
                <span className="font-bold">
                  Zoobicon<span className="text-brand-400">.io</span>
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Email infrastructure and domain registration platform. Part of
                the Zoobicon ecosystem.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Email</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Transactional API
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Mailbox Hosting
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Deliverability
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">
                Domains
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Register Domain
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    Transfer Domain
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    DNS Management
                  </Link>
                </li>
                <li>
                  <Link href="/io" className="hover:text-gray-300">
                    TLD Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/" className="hover:text-gray-300">
                    zoobicon.com
                  </Link>
                </li>
                <li>
                  <Link href="/ai" className="hover:text-gray-300">
                    zoobicon.ai
                  </Link>
                </li>
                <li>
                  <Link href="/sh" className="hover:text-gray-300">
                    zoobicon.sh
                  </Link>
                </li>
                <li>
                  <Link href="/developers" className="hover:text-gray-300">
                    Developer Docs
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-400">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-400">
                Terms
              </Link>
              <Link href="/support" className="hover:text-gray-400">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
