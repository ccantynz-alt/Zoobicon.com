"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  ArrowRight,
  Zap,
  FolderUp,
  Globe,
  RefreshCw,
  GitBranch,
  Workflow,
  Shield,
  Download,
  Package,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const CLI_COMMANDS = [
  { cmd: "zb init", desc: "Initialize a new Zoobicon project in current directory", category: "Setup" },
  { cmd: "zb generate", desc: "Generate a website from a prompt or template", category: "Generate" },
  { cmd: "zb generate --template saas", desc: "Generate from a specific template", category: "Generate" },
  { cmd: "zb generate --framework react", desc: "Output as React components", category: "Generate" },
  { cmd: "zb edit \"make the header sticky\"", desc: "AI-powered code editing with natural language", category: "Edit" },
  { cmd: "zb preview", desc: "Launch local preview server with hot-reload", category: "Preview" },
  { cmd: "zb deploy", desc: "Deploy to zoobicon.sh subdomain (free)", category: "Deploy" },
  { cmd: "zb deploy --domain mysite.com", desc: "Deploy to custom domain with SSL", category: "Deploy" },
  { cmd: "zb seo audit", desc: "Run a full SEO audit on your site", category: "SEO" },
  { cmd: "zb seo campaign --mode aggressive", desc: "Launch autonomous SEO campaign", category: "SEO" },
  { cmd: "zb video create --platform tiktok", desc: "Generate a promotional video", category: "Video" },
  { cmd: "zb sites list", desc: "List all your generated sites", category: "Manage" },
  { cmd: "zb sites export --format zip", desc: "Export site as downloadable archive", category: "Manage" },
  { cmd: "zb batch generate sites.csv", desc: "Bulk generate from CSV file", category: "Batch" },
  { cmd: "zb auth login", desc: "Authenticate with your API key", category: "Auth" },
];

const TERMINAL_DEMO = `$ zb generate "A landing page for an AI code review tool"

  ⚡ Zoobicon CLI v2.0.0

  🔍 Analyzing prompt...
  🎨 Selecting optimal design patterns...
  ⚙️  Generating HTML + CSS + JavaScript...

  ████████████████████████████████████ 100%

  ✓ Generated 4,832 characters
  ✓ Mobile responsive ✓ SEO optimized ✓ Accessible
  ✓ Saved to ./output/index.html

  📦 Preview: zb preview
  🚀 Deploy:  zb deploy

$ zb deploy --domain codereview.ai

  🌐 Deploying to codereview.ai...
  🔒 SSL certificate provisioned
  ✓ Live at https://codereview.ai

$ zb seo campaign --domain codereview.ai --mode aggressive

  🤖 SEO Agent activated
  📊 Analyzing 47 competitor keywords...
  📝 Content plan generated (12 articles)
  🔗 Backlink outreach started (200 targets)

  ✓ Campaign running autonomously
  ✓ Weekly reports → your@email.com`;

const PIPELINE_DEMO = `# .github/workflows/zoobicon.yml
name: Zoobicon CI/CD

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Zoobicon CLI
        run: npm install -g @zoobicon/cli

      - name: Generate site from config
        run: zb generate --config zoobicon.yml
        env:
          ZOOBICON_API_KEY: \${{ secrets.ZOOBICON_API_KEY }}

      - name: Run SEO audit
        run: zb seo audit --fail-under 85

      - name: Deploy to production
        run: zb deploy --domain mysite.com --env production

      - name: Notify Slack
        run: zb notify slack "Deployed successfully 🚀"`;

const FEATURES = [
  { icon: Zap, title: "Instant Generation", desc: "Generate full websites from your terminal in seconds. Pipe output, redirect to files, chain with Unix tools." },
  { icon: FolderUp, title: "One-Command Deploy", desc: "Deploy to a free zoobicon.sh subdomain or your custom domain. SSL included, CDN included." },
  { icon: Globe, title: "Multi-Framework Output", desc: "Output as HTML, React, Next.js, Vue, Svelte, or Astro. Framework flag on every command." },
  { icon: RefreshCw, title: "Watch & Rebuild", desc: "Watch mode re-generates your site whenever you update the prompt file. Live reload included." },
  { icon: GitBranch, title: "Git Integration", desc: "Auto-commit generated code. Branch per generation. Diff between versions." },
  { icon: Workflow, title: "CI/CD Pipelines", desc: "GitHub Actions, GitLab CI, Bitbucket Pipelines — deploy on every push with SEO checks." },
];

export default function CLIPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] top-[10%] -right-[100px] opacity-10" />
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] bottom-[20%] left-[5%] opacity-10" />
        <div className="grid-pattern fixed inset-0" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">.sh</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <a href="#commands" className="text-sm text-white/40 hover:text-white transition-colors">Commands</a>
              <a href="#pipelines" className="text-sm text-white/40 hover:text-white transition-colors">CI/CD</a>
              <a href="#features" className="text-sm text-white/40 hover:text-white transition-colors">Features</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-dark-200 border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono text-xs text-white/40">
              <span className="text-amber-400">$</span> npm i -g @zoobicon/cli
              <button onClick={() => copyText("npm i -g @zoobicon/cli", "nav")} className="text-white/20 hover:text-white/50 ml-1">
                {copied === "nav" ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
              <Terminal className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Command Line Interface</span>
              <span className="text-xs text-white/20 font-mono">zoobicon.sh</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Build From Your<br />
              <span className="gradient-text">Terminal.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg text-white/40 leading-relaxed mb-10">
              The full power of Zoobicon in your command line. Generate sites, deploy, run SEO campaigns,
              and automate everything — all without leaving your terminal. Pipe-friendly. Script-ready. CI/CD-native.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-16">
              <button
                onClick={() => copyText("npm install -g @zoobicon/cli", "hero")}
                className="group flex items-center gap-3 bg-dark-200 border border-white/[0.08] hover:border-amber-500/30 rounded-xl px-6 py-3 font-mono text-sm text-white/60 transition-all"
              >
                <span className="text-amber-400">$</span> npm install -g @zoobicon/cli
                {copied === "hero" ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4 text-white/20 group-hover:text-white/50" />}
              </button>
              <a href="#commands" className="px-6 py-3 rounded-xl text-sm font-medium text-white/50 border border-white/[0.08] hover:border-white/20 transition-all flex items-center gap-2">
                <Package className="w-4 h-4" />
                View All Commands
              </a>
            </motion.div>

            {/* Terminal Demo */}
            <motion.div variants={fadeInUp}>
              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="bg-dark-300/80 backdrop-blur-xl">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 text-center text-xs text-white/20 font-mono">zsh — zoobicon</div>
                  </div>
                  <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-white/50 max-h-[500px] overflow-y-auto">
                    <code>{TERMINAL_DEMO}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Commands */}
      <section id="commands" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Every Command<br /><span className="gradient-text">You Need</span>
              </h2>
            </motion.div>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60">
                {CLI_COMMANDS.map((cmd, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-3 ${i !== CLI_COMMANDS.length - 1 ? "border-b border-white/[0.03]" : ""} hover:bg-white/[0.02] transition-colors group`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded w-16 text-center flex-shrink-0">
                      {cmd.category}
                    </span>
                    <code className="text-sm font-mono text-accent-cyan/80 flex-shrink-0">{cmd.cmd}</code>
                    <span className="text-xs text-white/25 hidden md:block flex-1">{cmd.desc}</span>
                    <button
                      onClick={() => copyText(cmd.cmd, `cmd-${i}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      {copied === `cmd-${i}` ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3 text-white/20" />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CI/CD */}
      <section id="pipelines" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
                  <Workflow className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">CI/CD Ready</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Deploy on<br /><span className="gradient-text">Every Push</span>
                </h2>
                <p className="text-lg text-white/40 leading-relaxed mb-6">
                  Drop Zoobicon into your CI/CD pipeline. Generate, audit, and deploy automatically
                  on every commit. Works with GitHub Actions, GitLab CI, and any pipeline runner.
                </p>
                <div className="space-y-3">
                  {["Generate sites from config files in your repo", "Run SEO audits as quality gates", "Auto-deploy to production on merge to main", "Slack/Discord notifications on deploy"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                      <span className="text-sm text-white/50">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="bg-dark-300/80">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
                    <GitBranch className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs font-mono text-white/30">.github/workflows/zoobicon.yml</span>
                  </div>
                  <pre className="p-5 overflow-x-auto text-xs font-mono leading-relaxed text-white/50">
                    <code>{PIPELINE_DEMO}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-amber-400/50 mb-4 group-hover:text-amber-400 transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hosting */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
                <Globe className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Free Hosting</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                Every Site Gets a<br /><span className="text-amber-400">yourname.zoobicon.sh</span> Domain
              </h2>
              <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8">
                Instant deployment to our global CDN. Free SSL, DDoS protection, and 99.9% uptime.
                Upgrade to custom domains anytime.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-dark-400 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white/50">
                  <span className="text-accent-cyan">myportfolio</span>.zoobicon.sh
                </div>
                <div className="bg-dark-400 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white/50">
                  <span className="text-accent-cyan">client-store</span>.zoobicon.sh
                </div>
                <div className="bg-dark-400 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white/50">
                  <span className="text-accent-cyan">my-startup</span>.zoobicon.sh
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Terminal className="w-12 h-12 text-amber-400/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Install in <span className="gradient-text">10 Seconds</span>
          </h2>
          <p className="text-lg text-white/40 mb-8">One command. Infinite power.</p>
          <button
            onClick={() => copyText("npm install -g @zoobicon/cli && zb auth login", "cta")}
            className="group inline-flex items-center gap-3 bg-dark-200 border border-amber-500/20 hover:border-amber-500/40 rounded-xl px-8 py-4 font-mono text-sm text-white/60 transition-all mb-6"
          >
            <span className="text-amber-400">$</span>
            npm install -g @zoobicon/cli && zb auth login
            {copied === "cta" ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4 text-white/20 group-hover:text-white/50" />}
          </button>
          <div className="flex justify-center gap-4">
            <Link href="/auth/signup" className="btn-gradient px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
              <span>Get API Key</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/developers" className="px-8 py-3 rounded-xl text-sm font-medium text-white/50 border border-white/[0.08] hover:border-white/20 transition-all">
              API Docs
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
            <Link href="/developers" className="text-xs text-white/20 hover:text-white/40">Developers</Link>
            <Link href="/agencies" className="text-xs text-white/20 hover:text-white/40">Agencies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
