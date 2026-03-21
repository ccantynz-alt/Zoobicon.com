"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Globe,
  ArrowRight,
  Shield,
  Lock,
  Image,
  BarChart3,
  Server,
  GitBranch,
  Terminal,
  Upload,
  Sparkles,
  RefreshCw,
  Clock,
  Gauge,
  Network,
  Eye,
  FileCode,
  Check,
  Minus,
  ChevronRight,
  Cpu,
  Workflow,
  Layers,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const SPEED_STATS = [
  { value: "50ms", label: "Global edge latency" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "300+", label: "Edge locations" },
  { value: "0s", label: "Auto-scaling" },
];

const COMPETITOR_FEATURES = [
  { name: "AI Website Generation", zoobicon: true, siteground: false, cloudflare: false, vercel: false, netlify: false },
  { name: "Auto-Debugging", zoobicon: true, siteground: false, cloudflare: false, vercel: false, netlify: false },
  { name: "Global CDN", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Automatic SSL", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Custom Domains", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Edge Functions", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "DDoS Protection", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: false },
  { name: "Image Optimization", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: false },
  { name: "Analytics Dashboard", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "DNS Management", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "WordPress Export", zoobicon: true, siteground: true, cloudflare: false, vercel: false, netlify: false },
  { name: "Staging Environments", zoobicon: true, siteground: true, cloudflare: false, vercel: true, netlify: true },
  { name: "Instant Rollbacks", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "CLI Deployment", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "GitHub Integration", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "Free Tier", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
];

const HOSTING_FEATURES = [
  { icon: Globe, title: "Global CDN", desc: "300+ edge locations. Your site loads in under 50ms worldwide." },
  { icon: Lock, title: "Automatic SSL", desc: "Free SSL certificates, auto-renewed. HTTPS everywhere." },
  { icon: Shield, title: "DDoS Protection", desc: "Enterprise-grade protection included on every plan." },
  { icon: RefreshCw, title: "Smart Caching", desc: "Intelligent cache invalidation. Always fresh content." },
  { icon: Image, title: "Image Optimization", desc: "Auto WebP/AVIF conversion. 60% smaller images." },
  { icon: FileCode, title: "Brotli Compression", desc: "Next-gen compression. 20% smaller than gzip." },
  { icon: Cpu, title: "Edge Computing", desc: "Run serverless functions at the edge. Zero cold starts." },
  { icon: Layers, title: "Staging Environments", desc: "Test before you deploy. Preview URLs for every change." },
  { icon: Clock, title: "Instant Rollbacks", desc: "One-click rollback to any previous deployment." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time visitors, bandwidth, performance scores." },
  { icon: Network, title: "DNS Management", desc: "Full DNS zone editor with proxied records." },
  { icon: Workflow, title: "WAF & Security", desc: "Web Application Firewall with managed rulesets." },
];

const DEPLOY_METHODS = [
  {
    icon: Sparkles,
    title: "AI Builder",
    desc: "Describe → Generate → Deploy. Your site goes live in 60 seconds.",
    color: "from-brand-500 to-accent-purple",
    content: (
      <div className="mt-4 rounded-lg bg-white/[0.06] border border-white/[0.10] p-4">
        <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
          <Sparkles className="w-3 h-3" /> AI Builder
        </div>
        <p className="text-sm text-white/65">&quot;Build me a portfolio site with a dark theme and project gallery&quot;</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400">Deploying to portfolio.zoobicon.sh...</span>
        </div>
      </div>
    ),
  },
  {
    icon: Terminal,
    title: "CLI",
    desc: "Deploy from your terminal in one command.",
    color: "from-emerald-500 to-teal-600",
    content: (
      <div className="mt-4 rounded-lg bg-black/60 border border-white/[0.10] p-4 font-mono text-sm">
        <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="text-white/60">$ <span className="text-accent-cyan">zb deploy</span></div>
        <div className="text-white/60 mt-1">✓ Building project...</div>
        <div className="text-white/60">✓ Optimizing assets...</div>
        <div className="text-green-400">✓ Deployed to my-site.zoobicon.sh</div>
      </div>
    ),
  },
  {
    icon: GitBranch,
    title: "GitHub",
    desc: "Push to main, auto-deploy. Zero config CI/CD.",
    color: "from-gray-400 to-gray-600",
    content: (
      <div className="mt-4 rounded-lg bg-white/[0.06] border border-white/[0.10] p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/65">main</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">deployed</span>
        </div>
        <div className="text-xs text-white/60">feat: update hero section</div>
        <div className="text-xs text-white/60 mt-1">Deployed 3s ago</div>
      </div>
    ),
  },
  {
    icon: Upload,
    title: "Drag & Drop",
    desc: "Upload your HTML/CSS/JS files directly.",
    color: "from-amber-500 to-orange-600",
    content: (
      <div className="mt-4 rounded-lg border-2 border-dashed border-white/[0.12] p-6 text-center">
        <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
        <p className="text-xs text-white/60">Drop your files here</p>
        <p className="text-xs text-white/60 mt-1">HTML, CSS, JS, images</p>
      </div>
    ),
  },
];

const LIGHTHOUSE_SCORES = [
  { label: "Performance", score: 100, color: "text-green-400" },
  { label: "Accessibility", score: 100, color: "text-green-400" },
  { label: "Best Practices", score: 100, color: "text-green-400" },
  { label: "SEO", score: 100, color: "text-green-400" },
];

const CORE_VITALS = [
  { metric: "LCP", value: "< 1s", label: "Largest Contentful Paint", status: "Good" },
  { metric: "FID", value: "< 50ms", label: "First Input Delay", status: "Good" },
  { metric: "CLS", value: "< 0.05", label: "Cumulative Layout Shift", status: "Good" },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for personal projects and experiments.",
    features: [
      "1 site",
      "1GB storage",
      "10GB/mo bandwidth",
      ".zoobicon.sh subdomain",
      "Shared SSL",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For professionals and growing businesses.",
    features: [
      "10 sites",
      "25GB storage",
      "100GB/mo bandwidth",
      "Custom domains",
      "Dedicated SSL",
      "Global CDN",
      "Analytics dashboard",
      "Email support",
    ],
    cta: "Start Pro Trial",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$49",
    period: "/mo",
    description: "For teams that need advanced features.",
    features: [
      "50 sites",
      "100GB storage",
      "500GB/mo bandwidth",
      "WAF protection",
      "Staging environments",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
    ],
    cta: "Start Business Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/mo",
    description: "Unlimited everything. White-glove service.",
    features: [
      "Unlimited sites",
      "Unlimited storage",
      "Unlimited bandwidth",
      "99.99% SLA",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Custom edge rules",
      "SOC 2 compliance",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const MIGRATION_FEATURES = [
  { icon: Upload, title: "One-Click Import", desc: "Import your existing site from any provider with a single click." },
  { icon: Network, title: "Automatic DNS Transfer", desc: "We handle the DNS migration seamlessly. Zero manual config." },
  { icon: Clock, title: "Zero-Downtime Migration", desc: "Your site stays live throughout the entire migration process." },
  { icon: Sparkles, title: "Free Migration Assistance", desc: "Our team handles the migration for you, free of charge." },
];

export default function HostingPage() {
  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">Hosting</span>
          </div>
          <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
            <span>Deploy Now</span>
          </Link>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* ============================================ */}
      {/* 1. HERO SECTION                              */}
      {/* ============================================ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
              <Server className="w-3 h-3 text-accent-cyan" />
              <span className="text-xs font-medium text-accent-cyan">Zoobicon Hosting</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Web Hosting That<br />
              <span className="gradient-text-hero">Actually Keeps Up</span><br />
              <span className="gradient-text-hero">With You</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-3xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              AI-powered hosting with global CDN, automatic SSL, edge caching, and 99.99% uptime.
              Deploy in seconds, scale to millions.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-12 max-w-3xl">
              {["Global CDN", "Auto SSL", "Edge Functions", "DDoS Protection", "Smart Caching", "Instant Rollbacks"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white/65"
                >
                  <Check className="w-3 h-3 text-accent-cyan" />
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/builder" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow">
                <span>Deploy Your First Site Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#pricing" className="px-8 py-4 rounded-2xl text-base font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-3">
                <Gauge className="w-5 h-5" />
                <span>View Plans</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. SPEED STATS BANNER                        */}
      {/* ============================================ */}
      <section className="relative py-16 border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {SPEED_STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text-static mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. FEATURE COMPARISON VS COMPETITORS         */}
      {/* ============================================ */}
      <section className="relative py-24 lg:py-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[700px] h-[700px] top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-5" />
          <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-1/3 right-0 opacity-5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Eye className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Industry Comparison</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                See How We<br />
                <span className="gradient-text">Stack Up</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                The only hosting platform with AI generation, auto-debugging, and a full suite of infrastructure tools.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-0 mb-2">
                  <div className="p-4" />
                  <div className="p-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500/20 to-accent-purple/20 border border-brand-500/30">
                      <Zap className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-bold text-white">Zoobicon</span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">SiteGround</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Cloudflare</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Vercel</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Netlify</span>
                  </div>
                </div>

                {/* Feature Rows */}
                {COMPETITOR_FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`grid grid-cols-6 gap-0 ${i % 2 === 0 ? "bg-white/[0.05]" : ""} rounded-lg`}
                  >
                    <div className="p-4 flex items-center">
                      <span className="text-sm text-white/60">{feature.name}</span>
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </div>
                    </div>
                    {[feature.siteground, feature.cloudflare, feature.vercel, feature.netlify].map((has, j) => (
                      <div key={j} className="p-4 flex items-center justify-center">
                        {has ? (
                          <Check className="w-4 h-4 text-white/60" />
                        ) : (
                          <Minus className="w-4 h-4 text-white/50" />
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 4. HOSTING FEATURES GRID                     */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Infrastructure That<br /><span className="gradient-text">Just Works</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Enterprise-grade hosting features on every plan. No surprises, no hidden limits.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {HOSTING_FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-accent-cyan/50 mb-4 group-hover:text-accent-cyan transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. DEPLOYMENT METHODS                        */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Deploy <span className="gradient-text">Your Way</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Four ways to go live. Pick the one that fits your workflow.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {DEPLOY_METHODS.map((method, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{method.title}</h3>
                      <p className="text-sm text-white/60">{method.desc}</p>
                    </div>
                  </div>
                  {method.content}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. PERFORMANCE SHOWCASE                      */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Performance That<br /><span className="gradient-text">Speaks for Itself</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Faster than 99% of websites. Every metric, green.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Lighthouse Scores */}
              <motion.div variants={fadeInUp} className="gradient-border p-8 rounded-2xl">
                <h3 className="text-sm font-semibold text-white/65 uppercase tracking-wider mb-8">Lighthouse Scores</h3>
                <div className="grid grid-cols-2 gap-6">
                  {LIGHTHOUSE_SCORES.map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-3">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/[0.05]" />
                          <circle
                            cx="50" cy="50" r="42"
                            stroke="currentColor" strokeWidth="6" fill="none"
                            className="text-green-400"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-2xl font-black ${item.color}`}>{item.score}</span>
                        </div>
                      </div>
                      <span className="text-sm text-white/65">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Core Web Vitals */}
              <motion.div variants={fadeInUp} className="gradient-border p-8 rounded-2xl">
                <h3 className="text-sm font-semibold text-white/65 uppercase tracking-wider mb-8">Core Web Vitals</h3>
                <div className="space-y-6">
                  {CORE_VITALS.map((vital, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-white">{vital.metric}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{vital.status}</span>
                        </div>
                        <span className="text-sm text-white/60">{vital.label}</span>
                      </div>
                      <div className="text-2xl font-black text-green-400">{vital.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
                  <Gauge className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-green-400">Faster than 99% of websites</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. PRICING SECTION                           */}
      {/* ============================================ */}
      <section id="pricing" className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Simple, Transparent<br /><span className="gradient-text">Pricing</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Start free. Scale as you grow. No hidden fees.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRICING_TIERS.map((tier, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`relative p-6 rounded-2xl ${
                    tier.highlighted
                      ? "bg-gradient-to-b from-brand-500/10 to-accent-purple/10 border-2 border-brand-500/30"
                      : "gradient-border"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-black">{tier.price}</span>
                    {tier.period && <span className="text-sm text-white/60">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-white/60 mb-6">{tier.description}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.price === "Free" ? "/builder" : "/auth/signup"}
                    className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                      tier.highlighted
                        ? "btn-gradient text-white shadow-glow"
                        : "border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. MIGRATION SECTION                         */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
                <RefreshCw className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Easy Migration</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Moving from SiteGround<br /><span className="gradient-text">or Cloudflare?</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Switch to Zoobicon Hosting in minutes. We handle everything.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MIGRATION_FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                    <f.icon className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 9. FINAL CTA                                 */}
      {/* ============================================ */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
            >
              Deploy Your First<br />
              <span className="gradient-text-hero">Site Free</span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/60 mb-10">
              No credit card required. Go from zero to live in under 60 seconds
              with Zoobicon Hosting.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/hosting"
                className="group btn-gradient px-10 py-5 rounded-2xl text-lg font-bold text-white flex items-center gap-3 shadow-glow"
              >
                <span>Deploy Your First Site Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> Free subdomain</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> Deploy in seconds</span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
