"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Globe,
  Palette,
  Bot,
  Video,
  Mail,
  Search,
  Bug,
  Languages,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Code2,
  Layers,
  Zap,
  Play,
  Send,
  Cpu,
  Brain,
  Rocket,
  MousePointerClick,
  PenTool,
  Wand2,
} from "lucide-react";

/* ───────── animation variants ───────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ───────── data ───────── */

const AI_TOOLS = [
  {
    icon: Globe,
    name: "AI Website Builder",
    description: "Describe your vision. Get a production-ready website in 60 seconds.",
    color: "from-zoo-500 to-zoo-700",
    glowColor: "shadow-zoo-500/25",
    tag: "Core",
  },
  {
    icon: Palette,
    name: "AI Brand Kit Generator",
    description: "Logo, colors, typography, brand guidelines — generated instantly.",
    color: "from-stone-500 to-stone-600",
    glowColor: "shadow-stone-500/25",
    tag: "Design",
  },
  {
    icon: Bot,
    name: "AI Chatbot Builder",
    description: "Deploy intelligent chatbots that understand your business.",
    color: "from-stone-500 to-stone-600",
    glowColor: "shadow-stone-500/25",
    tag: "Agent",
    href: "/chatbot-widget",
  },
  {
    icon: Video,
    name: "AI Video Creator",
    description: "Transform text scripts into professional marketing videos in minutes.",
    color: "from-accent-purple to-stone-700",
    glowColor: "shadow-stone-500/25",
    tag: "Video",
  },
  {
    icon: Mail,
    name: "AI Email Writer",
    description: "Campaigns, sequences, newsletters — written by AI.",
    color: "from-stone-500 to-stone-600",
    glowColor: "shadow-stone-500/25",
    tag: "Marketing",
  },
  {
    icon: Search,
    name: "AI SEO Agent",
    description: "Autonomous SEO that ranks your content automatically.",
    color: "from-accent-cyan to-stone-600",
    glowColor: "shadow-stone-500/25",
    tag: "Agent",
  },
  {
    icon: Bug,
    name: "AI Code Debugger",
    description: "Paste broken code. Get fixed, optimized code back.",
    color: "from-stone-500 to-stone-500",
    glowColor: "shadow-stone-500/25",
    tag: "Developer",
  },
  {
    icon: Languages,
    name: "AI Translation",
    description: "Translate your entire site to 30+ languages in one click.",
    color: "from-stone-500 to-stone-500",
    glowColor: "shadow-stone-500/25",
    tag: "Global",
  },
];

const EXAMPLE_PROMPTS = [
  "Build a SaaS landing page for a project management tool",
  "Create a portfolio website for a photographer",
  "Design an e-commerce store for handmade candles",
  "Make a restaurant website with online ordering",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: PenTool,
    title: "Describe",
    subtitle: "Tell AI what you want in plain English",
    description: "No wireframes, no mockups, no technical specs. Just describe your vision in a sentence or a paragraph — the AI understands both.",
    color: "from-zoo-500 to-zoo-700",
    glowColor: "shadow-zoo-500/30",
  },
  {
    step: "02",
    icon: Wand2,
    title: "Generate",
    subtitle: "AI builds it in seconds with auto-debugging",
    description: "Our AI writes production-grade code, designs responsive layouts, and auto-debugs every error — all in under 60 seconds.",
    color: "from-accent-purple to-stone-700",
    glowColor: "shadow-stone-500/30",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Deploy",
    subtitle: "One-click publish to your.zoobicon.sh or custom domain",
    description: "Hit deploy and your site goes live instantly. Free hosting on zoobicon.sh, or connect your own domain in one click.",
    color: "from-accent-cyan to-stone-600",
    glowColor: "shadow-stone-500/30",
  },
];

/* ───────── page component ───────── */

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPreview(null);

    try {
      const res = await fetch("/api/generate/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setGeneratedPreview(data.html || data.code || "<p>Preview generated successfully.</p>");
    } catch {
      setGeneratedPreview("<p style='color:#f87171;text-align:center;padding:2rem;'>Something went wrong. Try again.</p>");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden relative">
      <BackgroundEffects preset="technical" />
      {/* ───────── Navigation ───────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050508]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zoo-500 to-zoo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              zoobicon<span className="text-accent-purple">.ai</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <Link href="/" className="hover:text-white transition-colors">
              zoobicon.com
            </Link>
            <Link href="/developers" className="hover:text-white transition-colors">
              zoobicon.io
            </Link>
            <Link href="/cli" className="hover:text-white transition-colors">
              zoobicon.sh
            </Link>
            <Link
              href="/builder"
              className="btn-zoo"
            >
              Open Builder
            </Link>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      {/* ───────── Hero ───────── */}
      <section className="relative pt-32 pb-24 px-6">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-purple/30 bg-accent-purple/5 text-accent-purple text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              The AI-First Creation Platform
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Zoobicon.ai
              </span>
              <br />
              <span className="bg-gradient-to-r from-zoo-400 via-accent-purple to-accent-cyan bg-clip-text text-transparent">
                Where AI Creates
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              The most powerful AI creation suite on the internet. Generate websites, brands, videos,
              emails, and entire businesses — all from a single prompt.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/builder"
                className="btn-zoo group px-8 py-4 rounded-xl text-lg shadow-lg shadow-zoo-500/25 flex items-center gap-2"
              >
                Start Creating with AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="btn-zoo-outline px-8 py-4 rounded-xl text-lg flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try Live Demo
              </a>
            </motion.div>
          </motion.div>

          {/* Floating stats */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {[
              { value: "60s", label: "Average Build Time" },
              { value: "8+", label: "AI Tools" },
              { value: "30+", label: "Languages" },
              { value: "24/7", label: "Availability" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.05]"
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-zoo-400 to-accent-purple bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── AI Tools Grid ───────── */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-purple/3 to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zoo-500/30 bg-zoo-500/5 text-zoo-400 text-sm font-medium mb-4">
              <Cpu className="w-4 h-4" />
              AI-Powered Suite
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Every Tool You Need,
              </span>
              <br />
              <span className="bg-gradient-to-r from-zoo-400 to-accent-purple bg-clip-text text-transparent">
                Powered by AI
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 text-lg max-w-2xl mx-auto">
              Eight specialized AI tools working together as one unified creation engine.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {AI_TOOLS.map((tool) => {
              const href = (tool as { href?: string }).href;
              const Wrapper = ({ children }: { children: React.ReactNode }) =>
                href ? <Link href={href} className="block h-full">{children}</Link> : <>{children}</>;
              return (
              <motion.div
                key={tool.name}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" as const } }}
                className={`group relative p-6 rounded-2xl border border-white/10 bg-white/[0.05] hover:border-white/15 hover:bg-white/[0.07] transition-all cursor-pointer shadow-lg ${tool.glowColor}`}
              >
                <Wrapper>
                {/* Tag */}
                <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-gray-300 bg-white/5 px-2 py-0.5 rounded-full">
                  {tool.tag}
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{tool.description}</p>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-1 text-sm text-gray-300 group-hover:text-zoo-400 transition-colors">
                  Explore
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                </Wrapper>
              </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ───────── Live Demo Section ───────── */}
      <section id="demo" className="relative py-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-zoo-500/8 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan text-sm font-medium mb-4">
              <MousePointerClick className="w-4 h-4" />
              Interactive
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Try It Right Now
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 text-lg">
              Type a prompt and watch AI build your website in real time.
            </motion.p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-sm overflow-hidden"
          >
            {/* Prompt input area */}
            <div className="p-6 border-b border-white/10">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="Describe the website you want to build..."
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-zoo-500/50 focus:ring-1 focus:ring-zoo-500/25 transition-all text-base"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="btn-zoo px-6 py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {/* Example prompts */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-300">Try:</span>
                {EXAMPLE_PROMPTS.map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setPrompt(ep)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.05] text-gray-300 hover:text-white hover:border-white/15 hover:bg-white/[0.07] transition-all"
                  >
                    {ep}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview area */}
            <div className="min-h-[300px] flex items-center justify-center bg-[#0b1220]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-zoo-500/20 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-zoo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">AI is building your site...</p>
                    <p className="text-xs text-gray-300 mt-1">Writing code, designing layout, debugging errors</p>
                  </div>
                </div>
              ) : generatedPreview ? (
                <div className="w-full h-full min-h-[300px]">
                  <iframe
                    srcDoc={generatedPreview}
                    className="w-full h-[400px] border-0"
                    sandbox="allow-scripts"
                    title="Generated preview"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-300 py-12">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.05] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm">Your AI-generated preview will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zoo-500/3 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-500/30 bg-stone-500/5 text-stone-400 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Simple as 1-2-3
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-300 text-lg max-w-2xl mx-auto">
              From idea to live website in three steps. No code, no design skills, no hassle.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                className="relative group"
              >
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-60px)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}

                <div className={`relative p-8 rounded-2xl border border-white/10 bg-white/[0.05] hover:border-white/15 transition-all shadow-lg ${step.glowColor}`}>
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#050508] border border-white/15 flex items-center justify-center text-sm font-bold text-gray-300">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-zoo-400 font-medium text-sm mb-3">{step.subtitle}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── Powered by Claude ───────── */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-accent-purple/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-accent-cyan/7 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-sm overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Info */}
              <motion.div variants={slideInLeft} className="p-10 md:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-purple/30 bg-accent-purple/5 text-accent-purple text-sm font-medium mb-6 w-fit">
                  <Brain className="w-4 h-4" />
                  AI Foundation
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Powered by Claude
                  </span>
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Zoobicon.ai is built on Anthropic&apos;s Claude — the most capable and safety-focused AI model available. Claude understands nuanced prompts, writes production-quality code, and reasons about design decisions like a senior engineer.
                </p>
                <ul className="space-y-3">
                  {[
                    "Advanced reasoning for complex website architectures",
                    "Context-aware code generation with auto-debugging",
                    "Natural language understanding for precise outputs",
                    "Safety-first design with responsible AI practices",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center mt-0.5 shrink-0">
                        <Sparkles className="w-3 h-3 text-accent-purple" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Right: Visual */}
              <motion.div variants={slideInRight} className="relative bg-gradient-to-br from-accent-purple/5 to-zoo-500/5 p-10 md:p-12 flex items-center justify-center border-l border-white/10">
                <div className="relative">
                  {/* Glow ring */}
                  <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-accent-purple/30 to-zoo-500/30 blur-2xl" />
                  <div className="relative w-48 h-48 mx-auto rounded-full border border-white/15 bg-[#050508]/80 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border border-accent-purple/20 bg-gradient-to-br from-accent-purple/10 to-zoo-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <Brain className="w-12 h-12 text-accent-purple mx-auto mb-2" />
                        <p className="text-sm font-semibold text-white">Claude</p>
                        <p className="text-[10px] text-gray-300">by Anthropic</p>
                      </div>
                    </div>
                  </div>

                  {/* Orbiting dots */}
                  {["top-0 left-1/2 -translate-x-1/2 -translate-y-2", "bottom-0 left-1/2 -translate-x-1/2 translate-y-2", "left-0 top-1/2 -translate-y-1/2 -translate-x-2", "right-0 top-1/2 -translate-y-1/2 translate-x-2"].map((pos, i) => (
                    <div key={i} className={`absolute ${pos}`}>
                      <div className={`w-3 h-3 rounded-full ${["bg-zoo-500", "bg-accent-purple", "bg-accent-cyan", "bg-stone-500"][i]} shadow-lg`} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-zoo-500/15 via-accent-purple/15 to-accent-cyan/15 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Ready to Build
              </span>
              <br />
              <span className="bg-gradient-to-r from-zoo-400 via-accent-purple to-accent-cyan bg-clip-text text-transparent">
                with AI?
              </span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
              Join creators using Zoobicon.ai to build websites, brands, and businesses at the speed of thought.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/builder"
                className="btn-zoo group px-10 py-5 rounded-xl text-lg shadow-lg shadow-zoo-500/25 flex items-center gap-3"
              >
                Start Creating with AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-sm text-gray-300 mt-6">
              No credit card required. Free tier available.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-zoo-500 to-zoo-400 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-300">
              zoobicon<span className="text-accent-purple">.ai</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/" className="hover:text-white transition-colors">zoobicon.com</Link>
            <Link href="/developers" className="hover:text-white transition-colors">zoobicon.io</Link>
            <Link href="/cli" className="hover:text-white transition-colors">zoobicon.sh</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>

          <p className="text-xs text-gray-300">
            &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
