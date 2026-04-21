"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Terminal,
  Copy,
  Check,
  ArrowRight,
  Globe,
  Shield,
  Rocket,
  GitBranch,
  Workflow,
  Eye,
  FolderPlus,
  Sparkles,
  Pencil,
  Upload,
  Languages,
  Search,
  Bug,
  ExternalLink,
  ChevronRight,
  Lock,
  Network,
  Server,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ── Terminal animation data ─────────────────────────────────── */

interface TerminalLine {
  text: string;
  type: "command" | "response" | "blank";
  delay?: number;
}

const TERMINAL_LINES: TerminalLine[] = [
  { text: "npm install -g zoobicon-cli", type: "command", delay: 60 },
  { text: "", type: "blank" },
  { text: "$ zb init my-portfolio", type: "command", delay: 50 },
  { text: "\u2713 Project initialized", type: "response" },
  { text: "", type: "blank" },
  { text: "$ zb generate \"A modern portfolio for a UX designer\"", type: "command", delay: 40 },
  { text: "\u2713 Website generated (2.3s)", type: "response" },
  { text: "", type: "blank" },
  { text: "$ zb deploy", type: "command", delay: 55 },
  { text: "\u2713 Deployed to my-portfolio.zoobicon.sh", type: "response" },
];

/* ── CLI Commands ────────────────────────────────────────────── */

const CLI_COMMANDS = [
  { cmd: "zb init [name]", desc: "Initialize a new project", icon: FolderPlus, color: "text-stone-400" },
  { cmd: "zb generate \"[prompt]\"", desc: "Generate a website from prompt", icon: Sparkles, color: "text-stone-400" },
  { cmd: "zb edit \"[instruction]\"", desc: "Edit with natural language", icon: Pencil, color: "text-stone-400" },
  { cmd: "zb deploy", desc: "Deploy to zoobicon.sh subdomain", icon: Upload, color: "text-zoo-400" },
  { cmd: "zb deploy --domain custom.com", desc: "Deploy to custom domain", icon: Globe, color: "text-stone-400" },
  { cmd: "zb export --wordpress", desc: "Export as WordPress theme", icon: ExternalLink, color: "text-stone-400" },
  { cmd: "zb translate --lang es,fr,de", desc: "Add translations", icon: Languages, color: "text-stone-400" },
  { cmd: "zb seo --analyze", desc: "Run SEO analysis", icon: Search, color: "text-stone-400" },
  { cmd: "zb debug", desc: "Auto-detect and fix errors", icon: Bug, color: "text-stone-400" },
  { cmd: "zb preview", desc: "Open local preview in browser", icon: Eye, color: "text-stone-400" },
];

/* ── Deployment Pipeline ─────────────────────────────────────── */

const PIPELINE_STEPS = [
  { label: "Local Dev", icon: Terminal, color: "text-white/60" },
  { label: "zb generate", icon: Sparkles, color: "text-stone-400" },
  { label: "Preview", icon: Eye, color: "text-stone-400" },
  { label: "zb deploy", icon: Upload, color: "text-zoo-400" },
  { label: "Live on zoobicon.sh", icon: Rocket, color: "text-zoo-400" },
];

/* ── CI/CD snippets ──────────────────────────────────────────── */

const GITHUB_ACTIONS_YAML = `name: Zoobicon Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install CLI
        run: npm install -g zoobicon-cli

      - name: Generate site
        run: zb generate --config zoobicon.yml
        env:
          ZOOBICON_API_KEY: \${{ secrets.ZOOBICON_API_KEY }}

      - name: Deploy
        run: zb deploy --domain mysite.com`;

const GITLAB_CI_YAML = `stages:
  - deploy

deploy:
  stage: deploy
  image: node:20
  only:
    - main
  script:
    - npm install -g zoobicon-cli
    - zb generate --config zoobicon.yml
    - zb deploy --domain mysite.com
  variables:
    ZOOBICON_API_KEY: $ZOOBICON_API_KEY`;

/* ── Typewriter terminal component ───────────────────────────── */

function AnimatedTerminal() {
  const [renderedLines, setRenderedLines] = useState<{ text: string; type: string }[]>([]);
  const [currentChar, setCurrentChar] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let lineIdx = 0;
    let charIdx = 0;
    let lines: { text: string; type: string; fullText: string }[] = [];
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (lineIdx >= TERMINAL_LINES.length) {
        setIsTyping(false);
        return;
      }

      const currentLine = TERMINAL_LINES[lineIdx];

      if (currentLine.type === "blank") {
        lines = [...lines, { text: "", type: "blank", fullText: "" }];
        setRenderedLines(lines.map(l => ({ text: l.text, type: l.type })));
        lineIdx++;
        charIdx = 0;
        timeout = setTimeout(tick, 200);
        return;
      }

      if (currentLine.type === "response") {
        lines = [...lines, { text: currentLine.text, type: "response", fullText: currentLine.text }];
        setRenderedLines(lines.map(l => ({ text: l.text, type: l.type })));
        scrollToBottom();
        lineIdx++;
        charIdx = 0;
        timeout = setTimeout(tick, 600);
        return;
      }

      // command — typewriter
      const displayText = currentLine.type === "command" && lineIdx === 0
        ? currentLine.text
        : currentLine.text.replace(/^\$ /, "");
      const prefix = lineIdx === 0 ? "$ " : "";

      if (charIdx === 0) {
        lines = [...lines, { text: prefix, type: "command", fullText: prefix + displayText }];
        setRenderedLines(lines.map(l => ({ text: l.text, type: l.type })));
        scrollToBottom();
      }

      if (charIdx < displayText.length) {
        const updated = [...lines];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: prefix + displayText.slice(0, charIdx + 1),
        };
        lines = updated;
        setRenderedLines(lines.map(l => ({ text: l.text, type: l.type })));
        scrollToBottom();
        charIdx++;
        timeout = setTimeout(tick, currentLine.delay || 50);
      } else {
        lineIdx++;
        charIdx = 0;
        timeout = setTimeout(tick, 400);
      }
    };

    timeout = setTimeout(tick, 800);
    return () => clearTimeout(timeout);
  }, [scrollToBottom]);

  return (
    <div className="gradient-border rounded-2xl overflow-hidden">
      <div className="bg-[#111a2e]/90 backdrop-blur-xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.10]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-stone-500/60" />
            <div className="w-3 h-3 rounded-full bg-stone-500/60" />
            <div className="w-3 h-3 rounded-full bg-stone-500/60" />
          </div>
          <div className="flex-1 text-center text-xs text-white/60 font-mono">zsh &mdash; zoobicon</div>
        </div>
        {/* Content */}
        <div ref={terminalRef} className="p-6 font-mono text-sm leading-relaxed min-h-[280px] max-h-[400px] overflow-y-auto">
          {renderedLines.map((line, i) => {
            if (line.type === "blank") return <div key={i} className="h-4" />;
            if (line.type === "response") {
              return (
                <div key={i} className="text-stone-400">
                  {line.text}
                </div>
              );
            }
            return (
              <div key={i} className="text-white/70">
                <span className="text-stone-400/80">{line.text.startsWith("$ ") ? "$ " : ""}</span>
                <span>{line.text.replace(/^\$ /, "")}</span>
                {i === renderedLines.length - 1 && isTyping && (
                  <span className="inline-block w-2 h-4 bg-stone-400 ml-0.5 animate-pulse align-middle" />
                )}
              </div>
            );
          })}
          {!isTyping && (
            <div className="mt-2 text-white/70">
              <span className="text-stone-400/80">$ </span>
              <span className="inline-block w-2 h-4 bg-stone-400 animate-pulse align-middle" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */

export default function ZoobiconShPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"github" | "gitlab">("github");

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* ─── Navigation ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#060e1f]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zoo-500 to-zoo-400 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              <span className="text-xs font-mono text-zoo-400 bg-zoo-500/10 px-2 py-0.5 rounded-md border border-zoo-500/20">.sh</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <a href="#commands" className="text-sm text-white/60 hover:text-white transition-colors">Commands</a>
              <a href="#hosting" className="text-sm text-white/60 hover:text-white transition-colors">Hosting</a>
              <a href="#pipeline" className="text-sm text-white/60 hover:text-white transition-colors">Pipeline</a>
              <a href="#cicd" className="text-sm text-white/60 hover:text-white transition-colors">CI/CD</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-dark-200 border border-white/[0.10] rounded-lg px-3 py-1.5 font-mono text-xs text-white/60">
              <span className="text-stone-400">$</span> npm i -g zoobicon-cli
              <button onClick={() => copyText("npm i -g zoobicon-cli", "nav")} className="text-white/50 hover:text-white/50 ml-1">
                {copied === "nav" ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zoo-500/20 bg-zoo-500/5 mb-6">
              <Terminal className="w-3 h-3 text-zoo-400" />
              <span className="text-xs font-medium text-zoo-400">CLI &amp; Deployment Hub</span>
              <span className="text-xs text-white/60 font-mono">zoobicon.sh</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[0.95] mb-6">
              Zoobicon.sh &mdash; Deploy<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-400 via-accent-purple to-accent-cyan">
                from Your Terminal
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg text-white/60 leading-relaxed mb-10">
              Generate, build, and deploy AI-powered websites without leaving your command line.
              Free subdomains included.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-16">
              <button
                onClick={() => copyText("npm install -g zoobicon-cli", "hero")}
                className="group flex items-center gap-3 bg-dark-200 border border-white/[0.12] hover:border-zoo-500/30 rounded-xl px-6 py-3 font-mono text-sm text-white/60 transition-all"
              >
                <span className="text-stone-400">$</span> npm install -g zoobicon-cli
                {copied === "hero" ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4 text-white/50 group-hover:text-white/50" />}
              </button>
              <a
                href="#commands"
                className="px-6 py-3 rounded-xl text-sm font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-2"
              >
                View Commands
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* ─── Terminal Demo ──────────────────────────────── */}
            <motion.div variants={fadeInUp}>
              <AnimatedTerminal />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CLI Commands Reference ──────────────────────────── */}
      <section id="commands" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
                CLI Commands<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-400 to-accent-purple">Reference</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">Everything you need, right from your terminal.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3">
              {CLI_COMMANDS.map((cmd, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="gradient-border rounded-xl group hover:bg-white/[0.05] transition-colors"
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className="mt-0.5 flex-shrink-0">
                      <cmd.icon className={`w-5 h-5 ${cmd.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-zoo-400/90 truncate">{cmd.cmd}</code>
                        <button
                          onClick={() => copyText(cmd.cmd, `cmd-${i}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          {copied === `cmd-${i}` ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3 text-white/50" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/50">{cmd.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Free Subdomain Hosting ──────────────────────────── */}
      <section id="hosting" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zoo-500/20 bg-zoo-500/5 mb-6">
                  <Globe className="w-3 h-3 text-zoo-400" />
                  <span className="text-xs font-medium text-zoo-400">Free Subdomain Hosting</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-4">
                  Every Project Gets a Free<br />
                  <span className="text-zoo-400 font-mono">*.zoobicon.sh</span> Subdomain
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Deploy instantly with zero configuration. Free subdomains for every project.
                </p>
              </div>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { icon: Lock, title: "SSL Included", desc: "Automatic HTTPS on every subdomain" },
                  { icon: Network, title: "Fast Hosting", desc: "Reliable site delivery" },
                  { icon: Globe, title: "Custom Domains", desc: "Bring your own domain — coming soon" },
                  { icon: Shield, title: "Secure by Default", desc: "Built with security in mind" },
                ].map((feat, i) => (
                  <motion.div key={i} variants={scaleIn} className="bg-white/[0.05] border border-white/[0.10] rounded-xl p-4 text-center">
                    <feat.icon className="w-6 h-6 text-zoo-400/60 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold mb-1">{feat.title}</h4>
                    <p className="text-xs text-white/50">{feat.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Example subdomains */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { name: "portfolio", highlight: true },
                  { name: "my-startup", highlight: true },
                  { name: "agency-client", highlight: true },
                ].map((sub, i) => (
                  <div key={i} className="bg-[#111a2e] border border-white/[0.10] rounded-lg px-4 py-2 font-mono text-sm text-white/65">
                    <span className="text-zoo-400">{sub.name}</span>.zoobicon.sh
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Deployment Pipeline ─────────────────────────────── */}
      <section id="pipeline" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
                From Idea to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-400 to-accent-cyan">Production</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">A streamlined pipeline from local development to live deployment.</p>
            </motion.div>

            {/* Pipeline visual */}
            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl p-6 md:p-10">
              {/* Desktop horizontal pipeline */}
              <div className="hidden md:flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-white/10 via-zoo-500/30 to-accent-purple/30 -translate-y-1/2" />

                {PIPELINE_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    variants={scaleIn}
                    className="relative z-10 flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#111a2e] border border-white/[0.12] flex items-center justify-center">
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <span className="text-xs font-mono text-white/65 text-center whitespace-nowrap">{step.label}</span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-1/2 hidden md:block">
                        <ChevronRight className="w-4 h-4 text-white/10" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Mobile vertical pipeline */}
              <div className="md:hidden flex flex-col items-center gap-1">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#111a2e] border border-white/[0.12] flex items-center justify-center">
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <span className="text-xs font-mono text-white/65 mt-2 mb-1">{step.label}</span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="w-px h-6 bg-gradient-to-b from-white/10 to-zoo-500/20" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CI/CD Integration ───────────────────────────────── */}
      <section id="cicd" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left — info */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zoo-500/20 bg-zoo-500/5 mb-6">
                  <Workflow className="w-3 h-3 text-zoo-400" />
                  <span className="text-xs font-medium text-zoo-400">CI/CD Integration</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
                  Deploy on<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-400 to-accent-purple">Every Push</span>
                </h2>
                <p className="text-lg text-white/60 leading-relaxed mb-8">
                  Drop Zoobicon into any CI/CD pipeline. Generate, test, and deploy automatically on every commit to main.
                </p>
                <div className="space-y-3">
                  {[
                    "Deploy on every push to main",
                    "Run SEO audits as quality gates",
                    "Works with GitHub Actions & GitLab CI",
                    "Environment-based deployments (staging / production)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-zoo-400 flex-shrink-0" />
                      <span className="text-sm text-white/65">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — code tabs */}
              <div>
                <div className="gradient-border rounded-2xl overflow-hidden">
                  <div className="bg-[#111a2e]/90">
                    {/* Tab bar */}
                    <div className="flex items-center border-b border-white/[0.10]">
                      <button
                        onClick={() => setActiveTab("github")}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-mono transition-colors border-b-2 ${
                          activeTab === "github"
                            ? "border-zoo-500 text-zoo-400"
                            : "border-transparent text-white/50 hover:text-white/70"
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        GitHub Actions
                      </button>
                      <button
                        onClick={() => setActiveTab("gitlab")}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-mono transition-colors border-b-2 ${
                          activeTab === "gitlab"
                            ? "border-zoo-500 text-zoo-400"
                            : "border-transparent text-white/50 hover:text-white/70"
                        }`}
                      >
                        <Server className="w-3.5 h-3.5" />
                        GitLab CI
                      </button>
                    </div>
                    <div className="relative">
                      <pre className="p-5 overflow-x-auto text-xs font-mono leading-relaxed text-white/65 max-h-[420px] overflow-y-auto">
                        <code>{activeTab === "github" ? GITHUB_ACTIONS_YAML : GITLAB_CI_YAML}</code>
                      </pre>
                      <button
                        onClick={() => copyText(activeTab === "github" ? GITHUB_ACTIONS_YAML : GITLAB_CI_YAML, "cicd")}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                      >
                        {copied === "cicd" ? <Check className="w-3.5 h-3.5 text-accent-cyan" /> : <Copy className="w-3.5 h-3.5 text-white/50" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Terminal className="w-12 h-12 text-zoo-400/30 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
                Install the <span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-400 to-accent-cyan">CLI</span>
              </h2>
              <p className="text-lg text-white/60 mb-8">One command to deploy AI-powered websites from your terminal.</p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <button
                onClick={() => copyText("npm install -g zoobicon-cli", "cta")}
                className="group inline-flex items-center gap-3 bg-dark-200 border border-zoo-500/20 hover:border-zoo-500/40 rounded-xl px-8 py-4 font-mono text-sm text-white/60 transition-all mb-8"
              >
                <span className="text-stone-400">$</span>
                npm install -g zoobicon-cli
                {copied === "cta" ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4 text-white/50 group-hover:text-white/50" />}
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signup"
                className="btn-zoo px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/builder"
                className="btn-zoo-outline px-8 py-3 rounded-xl text-sm font-medium text-white flex items-center gap-2 border border-white/20 hover:bg-white/5 transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                Connect GitHub
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/60">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/60 hover:text-white/80">Home</Link>
            <Link href="/cli" className="text-xs text-white/60 hover:text-white/80">CLI Docs</Link>
            <Link href="/developers" className="text-xs text-white/60 hover:text-white/80">Developers</Link>
            <Link href="/pricing" className="text-xs text-white/60 hover:text-white/80">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
