"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Download,
  ArrowRight,
  Upload,
  Shield,
  Zap,
  RefreshCw,
  Globe,
  Check,
  FileCode,
  Copy,
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

const STEPS = [
  {
    step: "1",
    title: "Install the Plugin",
    description: "Download the Zoobicon Connect plugin and install it on your WordPress site via Plugins → Add New → Upload Plugin.",
    icon: Download,
  },
  {
    step: "2",
    title: "Copy Your Connect Key",
    description: "After activation, go to Zoobicon in the WordPress sidebar. Your Connect Key is auto-generated and ready to copy.",
    icon: Shield,
  },
  {
    step: "3",
    title: "Deploy from Zoobicon",
    description: "In the Zoobicon Builder, click Export → WordPress → Deploy. Enter your site URL and Connect Key, then hit Deploy.",
    icon: Upload,
  },
  {
    step: "4",
    title: "Page Goes Live",
    description: "Your AI-generated page appears in WordPress as a draft or published page. Edit it in WordPress or re-deploy from Zoobicon anytime.",
    icon: Zap,
  },
];

const FEATURES = [
  { icon: Upload, title: "One-Click Deploy", desc: "Push directly from the Zoobicon builder to WordPress. No downloads, no FTP, no copy-paste." },
  { icon: RefreshCw, title: "Update in Place", desc: "Re-deploy to update existing pages. Version history preserved. Roll back anytime." },
  { icon: Shield, title: "Secure Authentication", desc: "Connect Key auth over HTTPS. Keys never leave your server. Regenerate anytime." },
  { icon: Globe, title: "SEO Preserved", desc: "Meta titles, descriptions, and OG images deploy with the page. Yoast SEO compatible." },
  { icon: FileCode, title: "Full HTML + CSS", desc: "Styles embedded inline. No theme conflicts. Works with any WordPress theme." },
  { icon: Zap, title: "Agency Ready", desc: "Deploy to multiple client WordPress sites. Save connections for repeat deployments." },
];

export default function WordPressPage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-emerald-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">Z</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="text-sm text-white/60 hover:text-white transition-colors">Builder</Link>
            <Link href="/developers" className="text-sm text-white/60 hover:text-white transition-colors">API</Link>
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/20 bg-blue-400/5 mb-6">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21.469 6.825c.84 4.471-2.015 9.235-6.38 10.638-4.366 1.403-9.1-.587-10.58-4.445C3.03 9.16 5.885 4.395 10.25 2.992c.227-.073.454-.134.681-.182l-.184 2.072 2.36-2.072 2.36 2.072-.184-2.072c3.528.958 6.04 3.9 6.186 7.015z"/></svg>
              <span className="text-xs font-medium text-blue-400">WordPress Plugin</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              AI Websites<br />
              <span className="gradient-text">→ WordPress</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed mb-10">
              Generate with AI. Deploy to WordPress. One click. The Zoobicon Connect plugin
              turns your WordPress site into a deployment target for AI-generated pages.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3">
              <a
                href="/wordpress-plugin/zoobicon-connect.php"
                download="zoobicon-connect.php"
                className="group btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Plugin v1.0
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link href="/builder" className="px-6 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 hover:text-white/70 transition-all flex items-center gap-2">
                Open Builder
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black tracking-tight text-center mb-16">
              How It <span className="gradient-text">Works</span>
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-6">
              {STEPS.map((s) => (
                <motion.div key={s.step} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-5 h-5 text-accent-cyan" />
                    </div>
                    <div>
                      <div className="text-xs text-accent-cyan font-mono mb-1">Step {s.step}</div>
                      <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                      <p className="text-sm text-white/60 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black tracking-tight text-center mb-4">
              Why <span className="gradient-text">Zoobicon Connect</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-white/60 text-center mb-12 max-w-2xl mx-auto">
              The fastest way to get AI-generated content onto WordPress
            </motion.p>

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

      {/* REST API */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl font-black tracking-tight text-center mb-4">
              Plugin <span className="gradient-text">REST API</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-sm text-white/60 text-center mb-8">
              The plugin registers these endpoints on your WordPress site:
            </motion.p>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60 divide-y divide-white/[0.08]">
                {[
                  { method: "POST", path: "/wp-json/zoobicon/v1/deploy", desc: "Deploy a page from Zoobicon" },
                  { method: "GET", path: "/wp-json/zoobicon/v1/status", desc: "Plugin health check" },
                  { method: "GET", path: "/wp-json/zoobicon/v1/pages", desc: "List deployed pages" },
                  { method: "DELETE", path: "/wp-json/zoobicon/v1/pages/:id", desc: "Delete a deployed page" },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      ep.method === "POST" ? "bg-brand-500/15 text-brand-400"
                        : ep.method === "DELETE" ? "bg-red-500/15 text-red-400"
                        : "bg-accent-cyan/15 text-accent-cyan"
                    }`}>{ep.method}</span>
                    <code className="text-xs font-mono text-white/70">{ep.path}</code>
                    <span className="text-xs text-white/50 hidden md:block ml-auto">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-6">
              <div className="bg-dark-300/60 border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Auth header</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText('X-Zoobicon-Key: zbc_your_key_here'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="text-white/40 hover:text-white/60"
                  >
                    {copied ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <code className="text-sm font-mono text-accent-cyan">X-Zoobicon-Key: zbc_your_key_here</code>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready to <span className="gradient-text">Connect</span>?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Download the plugin, activate it, and deploy your first AI page in under 2 minutes.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/wordpress-plugin/zoobicon-connect.php"
              download="zoobicon-connect.php"
              className="btn-gradient px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Plugin
            </a>
            <Link href="/builder" className="px-8 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all">
              Open Builder
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
            <Link href="/developers" className="text-xs text-white/40 hover:text-white/60">API</Link>
            <Link href="/support" className="text-xs text-white/40 hover:text-white/60">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
