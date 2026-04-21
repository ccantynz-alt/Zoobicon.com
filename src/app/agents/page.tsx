"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  Search,
  Gauge,
  RefreshCw,
  Database,
  Puzzle,
  Radio,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Clock,
  Shield,
  Users,
  BarChart3,
  Bell,
  ChevronRight,
  Zap,
  GitFork,
} from "lucide-react";
import { useState } from "react";

/* ─── animation variants ─── */
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

/* ─── copy-to-clipboard hook ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

/* ─── code block ─── */
function CodeBlock({
  code,
  language = "typescript",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1e293b]">
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-500/60" />
            <span className="w-3 h-3 rounded-full bg-stone-500/60" />
            <span className="w-3 h-3 rounded-full bg-stone-500/60" />
          </div>
          <span className="text-xs text-slate-400 font-mono ml-2">{filename}</span>
          <span className="text-xs text-slate-600 ml-auto">{language}</span>
        </div>
      )}
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-slate-300 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/* ─── features data ─── */
const FEATURES = [
  {
    icon: Search,
    title: "Task Discovery",
    desc: "Agents find their own work. Define what to look for, the framework handles scheduling and deduplication.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
  {
    icon: Gauge,
    title: "Confidence Scoring",
    desc: "Every execution returns a confidence score. Auto-execute when confidence is high, flag for review when low.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
  {
    icon: RefreshCw,
    title: "Retry & Self-Heal",
    desc: "Exponential backoff, configurable retries. Agents recover from failures automatically without intervention.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
  {
    icon: Database,
    title: "Pluggable Storage",
    desc: "InMemory for testing, PostgreSQL for production. Bring your own storage backend with a simple interface.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
  {
    icon: Puzzle,
    title: "Skills Marketplace",
    desc: "Extend agents with community-built skills. Like npm for AI capabilities. Install, compose, and share.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
  {
    icon: Radio,
    title: "Event System",
    desc: "Subscribe to agent events. Build dashboards, alerts, and integrations with hooks for every lifecycle stage.",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  },
];

/* ─── comparison data ─── */
const COMPARISON_ROWS = [
  { feature: "Setup time", agents: "2 minutes", openclaw: "30+ minutes", autogpt: "1+ hours" },
  { feature: "Runtime", agents: "Serverless (Vercel/AWS)", openclaw: "Local process", autogpt: "Local process" },
  { feature: "Language", agents: "TypeScript", openclaw: "TypeScript", autogpt: "Python" },
  { feature: "Dependencies", agents: "0 (core)", openclaw: "Many", autogpt: "Many" },
  { feature: "Storage", agents: "Pluggable (Postgres/Memory)", openclaw: "Markdown files", autogpt: "Vector DB" },
  { feature: "License", agents: "MIT", openclaw: "MIT", autogpt: "MIT" },
  { feature: "GitHub Stars", agents: "New", openclaw: "163K", autogpt: "170K" },
  { feature: "Enterprise hosted", agents: "Yes (Zoobicon)", openclaw: "No", autogpt: "No" },
];

/* ─── quickstart steps ─── */
const QUICKSTART_STEPS = [
  {
    step: 1,
    title: "Install",
    code: "npm install @zoobicon/agents",
    lang: "bash",
  },
  {
    step: 2,
    title: "Create an agent",
    code: `import { createAgent } from "@zoobicon/agents";

const agent = createAgent({
  id: "my-agent",
  name: "My First Agent",
  discover: async () => [{ task: "hello" }],
  execute: async (input) => ({
    output: { message: "Hello from agent!" },
    confidence: 1,
  }),
});`,
    lang: "typescript",
  },
  {
    step: 3,
    title: "Run it",
    code: `await agent.run();
// Agent discovers tasks and executes them`,
    lang: "typescript",
  },
  {
    step: 4,
    title: "Add scheduling",
    code: `const agent = createAgent({
  id: "scheduled-agent",
  name: "Scheduled Agent",
  scheduleIntervalSec: 300, // every 5 minutes
  discover: async () => [ /* ... */ ],
  execute: async (input) => { /* ... */ },
});`,
    lang: "typescript",
  },
  {
    step: 5,
    title: "Add persistence",
    code: `import { PostgresAgentStore } from "@zoobicon/agents/stores";

const store = new PostgresAgentStore(process.env.DATABASE_URL);

const agent = createAgent({
  id: "persistent-agent",
  name: "Persistent Agent",
  store, // results survive restarts
  discover: async () => [ /* ... */ ],
  execute: async (input) => { /* ... */ },
});`,
    lang: "typescript",
  },
  {
    step: 6,
    title: "Deploy anywhere",
    code: `# Works on Vercel, AWS Lambda, any Node.js server
vercel deploy

# Or run as a long-lived process
node agent.mjs`,
    lang: "bash",
  },
];

/* ─── hosted features ─── */
const HOSTED_FEATURES = [
  { icon: Clock, label: "Managed scheduling" },
  { icon: BarChart3, label: "Real-time dashboard" },
  { icon: Bell, label: "Email / Hash alerts" },
  { icon: Puzzle, label: "Skills marketplace" },
  { icon: Users, label: "Team access" },
  { icon: Shield, label: "SOC 2 infrastructure" },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white relative">
      <BackgroundEffects preset="technical" />

      {/* ──────────── HERO ──────────── */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-500/30 bg-stone-500/10 text-stone-300 text-sm font-medium">
                <Zap className="w-3.5 h-3.5" />
                Open Source &middot; MIT Licensed
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              Build{" "}
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
                Autonomous
              </span>{" "}
              AI&nbsp;Agents
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              An open-source framework for creating agents that discover tasks,
              execute them, and self-heal. 10 lines of code. Zero dependencies.
            </motion.p>

            {/* install command */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
              <div className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1e293b] border border-white/10 font-mono text-sm sm:text-base">
                <Terminal className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-slate-300">npm install</span>
                <span className="text-stone-400">@zoobicon/agents</span>
                <CopyButton text="npm install @zoobicon/agents" />
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-4"
            >
              <a
                href="#quickstart"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 text-white font-semibold transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/zoobicon/agents"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 text-white font-semibold transition-colors"
              >
                <GitFork className="w-4 h-4" />
                View on GitHub
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── CODE EXAMPLE ──────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
            >
              Ship an agent in minutes
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-400 text-center mb-10 max-w-xl mx-auto"
            >
              Here is a complete uptime monitor agent. It discovers URLs to
              check, pings them on a schedule, and reports results &mdash; all in
              one file.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <CodeBlock
                filename="uptime-monitor.ts"
                language="typescript"
                code={`import { createAgent } from "@zoobicon/agents";

const monitor = createAgent({
  id: "uptime-check",
  name: "Uptime Monitor",
  scheduleIntervalSec: 300,
  discover: async () => [
    { url: "https://mysite.com" },
    { url: "https://api.mysite.com/health" },
  ],
  execute: async (input) => {
    const res = await fetch(input.url);
    return {
      output: { status: res.status, up: res.ok },
      confidence: 1,
    };
  },
});

await monitor.run();`}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── FEATURES GRID ──────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
            >
              Everything you need for production agents
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-400 text-center mb-14 max-w-xl mx-auto"
            >
              Batteries included, but every piece is replaceable.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeInUp}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-colors"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                  >
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── ARCHITECTURE DIAGRAM ──────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
            >
              How it works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-400 text-center mb-10 max-w-xl mx-auto"
            >
              A simple loop: discover, execute, store, emit. Failures retry
              automatically.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <div className="rounded-2xl border border-white/10 bg-[#1e293b]/60 p-6 sm:p-10 overflow-x-auto">
                <pre className="text-sm sm:text-base font-mono text-slate-300 leading-loose whitespace-pre">
{`discover()
    │
    ▼
 [tasks]  ──────►  execute(task)
                        │
                        ▼
              ┌─── success? ───┐
              │                │
             yes              no
              │                │
              ▼                ▼
     { output,          retry with
       confidence }      backoff
              │                │
              ▼                └──► (max retries → fail event)
       store results
              │
              ▼
       emit events
  (dashboard, alerts, hooks)`}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── COMPARISON TABLE ──────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
            >
              How we compare
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-400 text-center mb-10 max-w-xl mx-auto"
            >
              Zoobicon Agents is built for the serverless era &mdash; minimal
              surface area, maximum flexibility.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="overflow-x-auto rounded-2xl border border-white/10"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-5 py-4 text-slate-400 font-medium">Feature</th>
                    <th className="px-5 py-4 text-stone-400 font-semibold">
                      Zoobicon Agents
                    </th>
                    <th className="px-5 py-4 text-slate-400 font-medium">OpenClaw</th>
                    <th className="px-5 py-4 text-slate-400 font-medium">AutoGPT</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/5 ${
                        i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-slate-300 font-medium">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {row.agents}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{row.openclaw}</td>
                      <td className="px-5 py-3.5 text-slate-400">{row.autogpt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── HOSTED CTA ──────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="rounded-3xl overflow-hidden relative"
          >
            {/* gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-600/30 via-[#1e293b] to-stone-600/20" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative px-8 py-14 sm:px-14 sm:py-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Don&apos;t want to run your own infrastructure?
              </h2>
              <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Zoobicon Agents Cloud runs your agents 24/7 with managed cron,
                dashboards, alerts, and team collaboration.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-10">
                {HOSTED_FEATURES.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300"
                  >
                    <f.icon className="w-4 h-4 text-stone-400" />
                    {f.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-stone-600 hover:bg-stone-500 text-white font-semibold transition-colors"
                >
                  Starting at $19/month
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-slate-500 text-sm">
                  Free tier available &middot; No credit card required
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── QUICKSTART ──────────── */}
      <section id="quickstart" className="relative py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
            >
              Quick Start
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-400 text-center mb-14 max-w-xl mx-auto"
            >
              From zero to a running agent in under five minutes.
            </motion.p>

            <div className="space-y-8">
              {QUICKSTART_STEPS.map((s) => (
                <motion.div key={s.step} variants={fadeInUp}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-600/20 text-stone-400 text-sm font-bold border border-stone-500/30">
                      {s.step}
                    </span>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <CodeBlock code={s.code} language={s.lang} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="relative py-16 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              @zoobicon/agents
            </span>
            <span className="text-slate-500 text-sm">MIT License</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <Link href="/developers" className="hover:text-white transition-colors">
              Developers
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/api-docs" className="hover:text-white transition-colors">
              API Docs
            </Link>
            <a
              href="https://github.com/zoobicon/agents"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
