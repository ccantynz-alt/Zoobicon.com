"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  Zap,
  Building2,
  Users,
  Palette,
  Globe,
  ArrowRight,
  Shield,
  BarChart3,
  Layers,
  Crown,
  Briefcase,
  Check,
  Star,
  Workflow,
  FolderOpen,
  PaintBucket,
  UserPlus,
  FileText,
  TrendingUp,
  Lock,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const WHITE_LABEL_FEATURES = [
  { icon: PaintBucket, title: "Your Brand, Everywhere", desc: "Custom logo, colors, domain, emails — your clients never see Zoobicon. It's 100% your platform." },
  { icon: Users, title: "Unlimited Client Seats", desc: "Invite every client to their own workspace. Each gets their own dashboard, projects, and analytics." },
  { icon: Crown, title: "Resell at Your Price", desc: "Set your own pricing. Charge $99, $299, or $999/month per client. Keep 100% of the markup." },
  { icon: Lock, title: "Client Isolation", desc: "Complete data isolation between clients. Each workspace is a sandboxed environment." },
  { icon: FileText, title: "Custom Proposals", desc: "AI generates client proposals with your branding. Project scopes, timelines, and pricing — all automated." },
  { icon: Workflow, title: "Approval Workflows", desc: "Built-in approval flows. Clients review, comment, and approve designs before publishing." },
];

const AGENCY_TOOLS = [
  {
    title: "Bulk Website Generation",
    desc: "Generate 50+ client websites simultaneously. Upload a CSV with client details and let AI handle the rest.",
    stat: "50x faster",
    icon: Layers,
  },
  {
    title: "Client Dashboard",
    desc: "Each client gets their own branded portal to view their sites, SEO reports, and video content.",
    stat: "∞ clients",
    icon: FolderOpen,
  },
  {
    title: "Team Collaboration",
    desc: "Assign designers, developers, and managers to projects. Role-based access control with audit logs.",
    stat: "Unlimited seats",
    icon: UserPlus,
  },
  {
    title: "SEO Campaign Management",
    desc: "Run SEO campaigns across all clients from one dashboard. AI agents work 24/7 on every account.",
    stat: "Autonomous",
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Agency Owner", text: "We went from 5 websites a month to 50. Zoobicon literally 10x'd our output.", stars: 5 },
  { name: "Marcus T.", role: "Digital Director", text: "The white-label platform let us launch our own SaaS without writing a line of code.", stars: 5 },
  { name: "Lisa M.", role: "Freelance Designer", text: "I use Zoobicon for every client project now. The AI editor saves me hours of revision time.", stars: 5 },
];

const TIERS = [
  {
    name: "Agency Starter",
    price: "$149",
    period: "/mo",
    desc: "Perfect for freelancers and small agencies",
    features: [
      "Up to 10 client workspaces",
      "White-label branding",
      "100 sites/month",
      "SEO Agent (5 campaigns)",
      "Priority email support",
      "Custom domain",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Agency Pro",
    price: "$399",
    period: "/mo",
    desc: "For growing agencies that need scale",
    features: [
      "Unlimited client workspaces",
      "Full white-label platform",
      "Unlimited site generation",
      "Unlimited SEO campaigns",
      "AI Video Creator",
      "Bulk generation (CSV upload)",
      "Team roles & permissions",
      "Priority chat support",
      "API access",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large agencies and franchises",
    features: [
      "Everything in Agency Pro",
      "Custom AI model training",
      "Dedicated infrastructure",
      "99.99% SLA guarantee",
      "Custom integrations",
      "Dedicated account manager",
      "On-boarding & training",
      "Invoiced billing",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function AgenciesPage() {
  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="premium" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              <span className="text-xs font-semibold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-md border border-accent-purple/20">Agencies</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <a href="#white-label" className="text-sm text-white/60 hover:text-white transition-colors">White Label</a>
              <a href="#tools" className="text-sm text-white/60 hover:text-white transition-colors">Tools</a>
              <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/agencies/dashboard" className="text-sm text-white/50 hover:text-white/70 transition-colors">
              Dashboard
            </Link>
            <Link href="/agencies/portal" className="text-sm text-white/50 hover:text-white/70 transition-colors">
              Client Portal
            </Link>
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Start Free Trial</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/5 mb-6">
              <Building2 className="w-3 h-3 text-accent-purple" />
              <span className="text-xs font-medium text-accent-purple">Built for Agencies</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Your Agency.<br />
              <span className="gradient-text-hero">Supercharged by AI.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg text-white/60 leading-relaxed mb-10">
              White-label the most advanced AI platform under your brand. Generate client websites in bulk,
              run autonomous SEO campaigns, and scale your agency to 100+ clients without hiring.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-16">
              <Link href="/auth/signup" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow">
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="mailto:sales@zoobicon.com?subject=Agency Demo Request" className="px-8 py-4 rounded-2xl text-base font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-3">
                <Briefcase className="w-5 h-5" />
                <span>Book a Demo</span>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "50x", label: "Faster delivery" },
                { value: "100%", label: "Your branding" },
                { value: "$0", label: "Per client seat" },
                { value: "24/7", label: "AI agents working" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* White Label */}
      <section id="white-label" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/5 mb-6">
                <Palette className="w-3 h-3 text-accent-purple" />
                <span className="text-xs font-medium text-accent-purple">White Label Platform</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Your Platform.<br /><span className="gradient-text">Your Rules.</span>
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Rebrand Zoobicon as your own AI platform. Your logo, your colors, your domain.
                Clients will think you built it.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHITE_LABEL_FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-accent-purple/60 mb-4 group-hover:text-accent-purple transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agency Tools */}
      <section id="tools" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Scale Without <span className="gradient-text">Hiring</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {AGENCY_TOOLS.map((tool, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-8 rounded-2xl group">
                  <div className="flex items-start justify-between mb-4">
                    <tool.icon className="w-10 h-10 text-brand-400/60" />
                    <span className="text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-2.5 py-1 rounded-full">{tool.stat}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{tool.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Agencies <span className="gradient-text">Love Us</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Agency <span className="gradient-text">Pricing</span>
              </h2>
              <p className="text-lg text-white/60">14-day free trial. No credit card required.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {TIERS.map((tier, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`p-6 rounded-xl ${
                    tier.featured
                      ? "border border-brand-500/30 bg-brand-500/[0.02] shadow-glow relative"
                      : "gradient-border"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-bold text-white">
                      Best Value
                    </div>
                  )}
                  <div className="text-sm font-semibold text-white/65 mb-2">{tier.name}</div>
                  <div className="text-3xl font-black mb-0.5">{tier.price}<span className="text-base font-normal text-white/50">{tier.period}</span></div>
                  <div className="text-xs text-white/50 mb-4">{tier.desc}</div>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/65">
                        <Check className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {tier.cta === "Contact Sales" ? (
                    <a
                      href="mailto:sales@zoobicon.com?subject=Agency Enterprise Inquiry"
                      className="block w-full py-2.5 rounded-xl text-sm font-bold text-center border border-white/[0.12] text-white/60 hover:border-white/20 transition-all"
                    >
                      Contact Sales
                    </a>
                  ) : (
                    <Link
                      href="/auth/signup"
                      className={`block w-full py-2.5 rounded-xl text-sm font-bold text-center ${
                        tier.featured
                          ? "btn-gradient text-white"
                          : "border border-white/[0.12] text-white/60 hover:border-white/20 transition-all"
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Ready to Scale <span className="gradient-text">Your Agency?</span>
          </h2>
          <p className="text-lg text-white/60 mb-8">Join hundreds of agencies using Zoobicon to 10x their output.</p>
          <Link href="/auth/signup" className="inline-flex group btn-gradient px-10 py-4 rounded-2xl text-lg font-bold text-white items-center gap-3 shadow-glow-lg">
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/40">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/40 hover:text-white/60">Home</Link>
            <Link href="/developers" className="text-xs text-white/40 hover:text-white/60">Developers</Link>
            <Link href="/cli" className="text-xs text-white/40 hover:text-white/60">CLI</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
