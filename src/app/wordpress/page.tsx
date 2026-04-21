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
  FileCode,
} from "lucide-react";

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
    title: "Build with AI",
    description: "Use the Zoobicon Builder to generate your website. Pick from 43 generators or describe what you want in plain English.",
    icon: Zap,
  },
  {
    step: "2",
    title: "Export as WordPress Theme",
    description: "Click Export → WordPress in the builder. Zoobicon generates a complete WordPress theme with style.css, functions.php, and templates.",
    icon: FileCode,
  },
  {
    step: "3",
    title: "Download Your Theme",
    description: "Download the theme as a ZIP file. Includes all HTML, CSS, and a WXR import file for your content. No plugin required.",
    icon: Download,
  },
  {
    step: "4",
    title: "Upload to WordPress",
    description: "In WordPress, go to Appearance → Themes → Add New → Upload. Install your theme and activate it. Done.",
    icon: Upload,
  },
];

const FEATURES = [
  { icon: Download, title: "Complete Theme Export", desc: "Full WordPress theme with style.css, functions.php, index.php, and template files. Ready to install." },
  { icon: FileCode, title: "Clean HTML + CSS", desc: "Styles embedded inline. No theme conflicts. Works alongside any existing WordPress setup." },
  { icon: Globe, title: "SEO Included", desc: "Meta titles, descriptions, and OG tags baked into the theme. Yoast SEO compatible out of the box." },
  { icon: Shield, title: "No Plugin Required", desc: "Pure theme export — works on any WordPress installation. Self-hosted, WordPress.com Business, any host." },
  { icon: RefreshCw, title: "WXR Content Import", desc: "WordPress XML import file included. Import your pages and content in one step via Tools → Import." },
  { icon: Zap, title: "Or Just Host on Zoobicon", desc: "Skip WordPress entirely. Deploy instantly to zoobicon.sh with free hosting, SSL, and CDN included." },
];

export default function WordPressPage() {
  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0b1530]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-stone-600 flex items-center justify-center">
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
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-400/20 bg-stone-400/5 mb-6">
              <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21.469 6.825c.84 4.471-2.015 9.235-6.38 10.638-4.366 1.403-9.1-.587-10.58-4.445C3.03 9.16 5.885 4.395 10.25 2.992c.227-.073.454-.134.681-.182l-.184 2.072 2.36-2.072 2.36 2.072-.184-2.072c3.528.958 6.04 3.9 6.186 7.015z"/></svg>
              <span className="text-xs font-medium text-stone-400">WordPress Export</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              AI Websites<br />
              <span className="gradient-text">→ WordPress</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed mb-10">
              Generate with AI. Export as a WordPress theme. Upload and go. Build your site in
              Zoobicon, then take it to WordPress — or host it free on zoobicon.sh.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3">
              <Link
                href="/builder"
                className="group btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Start Building
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/hosting" className="px-6 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 hover:text-white/70 transition-all flex items-center gap-2">
                Free Hosting on zoobicon.sh
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
              What You <span className="gradient-text">Get</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-white/60 text-center mb-12 max-w-2xl mx-auto">
              A complete WordPress theme generated by AI, ready to upload
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

      {/* Compatibility */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl font-black tracking-tight text-center mb-4">
              WordPress <span className="gradient-text">Compatibility</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-sm text-white/60 text-center mb-8">
              Theme export works everywhere. Here&apos;s what each WordPress setup supports:
            </motion.p>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60 divide-y divide-white/[0.08]">
                {[
                  { platform: "Self-hosted (WordPress.org)", theme: true, plugin: true, note: "Full support — themes, plugins, custom code" },
                  { platform: "WordPress.com Business+", theme: true, plugin: true, note: "Full support — upload themes and plugins" },
                  { platform: "WordPress.com Personal/Premium", theme: false, plugin: false, note: "Limited — no custom themes or plugins" },
                  { platform: "WordPress.com Free", theme: false, plugin: false, note: "Very limited — use zoobicon.sh hosting instead" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                    <span className="text-sm text-white/80 font-medium min-w-[200px]">{row.platform}</span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      row.theme ? "bg-stone-500/15 text-stone-400" : "bg-stone-500/15 text-stone-400"
                    }`}>{row.theme ? "✓ Theme" : "✗ Theme"}</span>
                    <span className="text-xs text-white/50 hidden md:block ml-auto">{row.note}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-6 bg-accent-cyan/5 border border-accent-cyan/10 rounded-xl p-4">
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="text-accent-cyan font-semibold">Recommendation:</span> For the fastest, easiest experience, host directly on <Link href="/hosting" className="text-accent-cyan hover:underline">zoobicon.sh</Link> — free hosting with SSL, CDN, and instant deploys. No WordPress needed.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready to <span className="gradient-text">Build</span>?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Build your site with AI, then export to WordPress or host free on zoobicon.sh.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/builder"
              className="btn-gradient px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Start Building
            </Link>
            <Link href="/hosting" className="px-8 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all">
              Free Hosting
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/50">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/50 hover:text-white/60">Home</Link>
            <Link href="/developers" className="text-xs text-white/50 hover:text-white/60">API</Link>
            <Link href="/support" className="text-xs text-white/50 hover:text-white/60">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
