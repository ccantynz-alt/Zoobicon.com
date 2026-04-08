"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Globe,
  Video,
  Search,
  Code,
  Zap,
  Shield,
  Star,
  ChevronRight,
  Play,
  Mail,
  Layers,
  Eye,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const PROMPTS = [
  "A dental clinic website with online booking",
  "An e-commerce store for handmade ceramics",
  "A SaaS landing page for project management",
  "A restaurant site with menu and reservations",
  "A portfolio for a freelance photographer",
];

function TypewriterText() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const cur = PROMPTS[idx];
    if (!del && text === cur) { const t = setTimeout(() => setDel(true), 2000); return () => clearTimeout(t); }
    if (del && text === "") { setDel(false); setIdx((i) => (i + 1) % PROMPTS.length); return; }
    const t = setTimeout(() => setText(del ? cur.slice(0, text.length - 1) : cur.slice(0, text.length + 1)), del ? 25 : 45);
    return () => clearTimeout(t);
  }, [text, del, idx]);
  return <span className="text-white/40">{text}<span className="animate-pulse">|</span></span>;
}

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased overflow-x-hidden">
      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-[10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/builder" className="text-sm text-white/60 hover:text-white transition-colors">Builder</Link>
            <Link href="/video-creator" className="text-sm text-white/60 hover:text-white transition-colors">Video</Link>
            <Link href="/domains" className="text-sm text-white/60 hover:text-white transition-colors">Domains</Link>
            <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            <Link href="/builder" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/20 transition-all">
              Start building
            </Link>
          </div>
          <button className="md:hidden text-white/60" onClick={() => setMenu(!menu)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
        </div>
        {menu && (
          <div className="border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl px-6 py-4 md:hidden flex flex-col gap-3">
            <Link href="/builder" className="text-sm text-white/80">Builder</Link>
            <Link href="/video-creator" className="text-sm text-white/80">Video</Link>
            <Link href="/domains" className="text-sm text-white/80">Domains</Link>
            <Link href="/pricing" className="text-sm text-white/80">Pricing</Link>
            <Link href="/auth/login" className="text-sm text-white/80">Sign in</Link>
          </div>
        )}
      </nav>

      {/* hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-24">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-powered platform — builder, video, domains, hosting
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            Build anything{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">with AI</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-white/50 sm:text-xl">
            Describe your business. Get a complete website, spokesperson video, custom domain, and hosting — all in under 60 seconds.
          </motion.p>

          {/* prompt box with animated gradient border */}
          <motion.form variants={fadeUp} onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) router.push(`/builder?prompt=${encodeURIComponent(prompt.trim())}`); }} className="relative mx-auto mt-10 max-w-2xl">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 opacity-60 blur-[2px] animate-[gradient-shift_4s_ease_infinite]" style={{ backgroundSize: "200% 200%" }} />
            <div className="relative flex items-center rounded-2xl bg-zinc-900 px-5 py-4">
              <Sparkles className="mr-3 h-5 w-5 text-violet-400 shrink-0" />
              <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none sm:text-lg" />
              {!prompt && <div className="pointer-events-none absolute left-14 text-base sm:text-lg"><TypewriterText /></div>}
              <button type="submit" className="ml-3 shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] transition-all">
                Build <ArrowRight className="ml-1 inline h-4 w-4" />
              </button>
            </div>
          </motion.form>

          <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["SaaS landing page", "Restaurant", "Portfolio", "E-commerce"].map((ex) => (
              <button key={ex} onClick={() => router.push(`/builder?prompt=${encodeURIComponent(ex)}`)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 hover:border-white/20 hover:text-white/80 transition-all">
                {ex}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* floating UI fragments */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] left-[8%] h-32 w-48 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm opacity-30 -rotate-[8deg] animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute top-[25%] right-[10%] h-24 w-40 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm opacity-20 rotate-[5deg] animate-[float_10s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-[20%] left-[15%] h-20 w-36 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm opacity-25 rotate-[3deg] animate-[float_9s_ease-in-out_infinite_0.5s]" />
        </div>
      </section>

      {/* metrics strip */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6 py-6 sm:gap-16">
          {[{ v: "30s", l: "generation time" }, { v: "100+", l: "components" }, { v: "99.9%", l: "uptime" }, { v: "$49", l: "/mo for everything" }].map((m) => (
            <div key={m.l} className="text-center">
              <div className="text-2xl font-bold text-white">{m.v}</div>
              <div className="text-xs text-white/40">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 product cards */}
      <section className="py-24 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Everything you need. <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">One platform.</span></h2>
            <p className="mt-4 text-lg text-white/50">Website builder, video creator, domains, hosting, email — bundled.</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Code, title: "AI Website Builder", desc: "Describe your business. Get a complete, responsive website in under 30 seconds. Edit anything with chat.", href: "/builder", grad: "from-violet-500 to-indigo-500" },
              { icon: Video, title: "AI Video Creator", desc: "Type a description. Get a professional spokesperson video with AI voice, realistic face, and burned-in captions.", href: "/video-creator", grad: "from-cyan-500 to-blue-500" },
              { icon: Globe, title: "Domains & Hosting", desc: "Search 500+ TLDs with real-time availability. Register instantly. Deploy to a custom domain in one click.", href: "/domains", grad: "from-fuchsia-500 to-pink-500" },
            ].map((c) => (
              <motion.div key={c.title} variants={fadeUp}>
                <Link href={c.href} className="group relative block rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:shadow-xl hover:shadow-violet-500/5">
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.grad}`}><c.icon className="h-6 w-6 text-white" /></div>
                  <h3 className="mb-3 text-xl font-semibold">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{c.desc}</p>
                  <div className="mt-6 flex items-center gap-1 text-sm font-medium text-white/60 group-hover:text-white transition-colors">Try it free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* builder demo */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6"><Code className="h-3 w-3" /> AI Website Builder</div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Prompt to production in <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">30 seconds</span></h2>
              <p className="text-white/50 mb-8">No templates. No drag-and-drop. Describe what you need and watch your site build itself — React components, responsive design, real copy, deployed.</p>
              <ul className="space-y-3 mb-8">
                {["100+ pre-built components assembled by AI", "Edit anything with natural language chat", "One-click deploy to your custom domain", "Full-stack: auth, database, payments auto-wired"].map((i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/60"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />{i}</li>
                ))}
              </ul>
              <Link href="/builder" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                Start building <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-1 shadow-2xl">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" /><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" /><div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-[11px] text-white/30 font-mono">zoobicon.com/builder</span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="h-3 w-3/4 rounded bg-white/[0.06]" /><div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="h-20 rounded-lg bg-gradient-to-br from-violet-500/20 to-transparent border border-white/[0.06]" />
                    <div className="h-20 rounded-lg bg-gradient-to-br from-cyan-500/20 to-transparent border border-white/[0.06]" />
                    <div className="h-20 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-transparent border border-white/[0.06]" />
                  </div>
                  <div className="h-3 w-2/3 rounded bg-white/[0.06]" /><div className="h-3 w-1/3 rounded bg-white/[0.06]" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* video demo */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={fadeUp} className="order-2 lg:order-1">
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 shadow-2xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 hover:scale-105 transition-all cursor-pointer">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                    <span className="text-xs text-white/40">AI-generated spokesperson video</span>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 mb-6"><Video className="h-3 w-3" /> AI Video Creator</div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Professional videos <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">from a sentence</span></h2>
              <p className="text-white/50 mb-8">Describe what you want. Our AI writes the script, generates a realistic spokesperson, adds professional voice and captions — ready to share.</p>
              <ul className="space-y-3 mb-8">
                {["AI script writing from a single prompt", "Realistic talking-head avatar generation", "Professional voice with emotion control", "Auto-captions in 4 styles"].map((i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/60"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />{i}</li>
                ))}
              </ul>
              <Link href="/video-creator" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Create a video <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* domain search */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Find your perfect <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">domain</span></h2>
            <p className="text-white/50 mb-8">Real-time availability across 500+ TLDs. AI-powered name suggestions. Register and deploy in one click.</p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link href="/domains" className="group relative mx-auto flex max-w-xl items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur hover:border-white/[0.15] transition-all">
              <Search className="mr-3 h-5 w-5 text-white/30" /><span className="text-base text-white/30">Search for a domain name...</span>
              <span className="ml-auto shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/60 group-hover:bg-white/15 transition-colors">Search</span>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {[".com", ".ai", ".io", ".sh", ".app", ".dev"].map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-white/40">{t}</span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* features grid */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">75+ products. <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">One subscription.</span></h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Code, label: "AI Builder", d: "Full-stack websites" },
              { icon: Video, label: "AI Video", d: "Spokesperson videos" },
              { icon: Globe, label: "Domains", d: "500+ TLDs" },
              { icon: Shield, label: "SSL & CDN", d: "Free, automatic" },
              { icon: Mail, label: "Email", d: "Business mailboxes" },
              { icon: Layers, label: "Hosting", d: "One-click deploy" },
              { icon: Eye, label: "SEO Tools", d: "12 free tools" },
              { icon: Star, label: "Agency", d: "White-label resell" },
            ].map((f) => (
              <motion.div key={f.label} variants={fadeUp} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                <f.icon className="mb-3 h-5 w-5 text-white/40" />
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-white/40">{f.d}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* pricing teaser */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-5xl text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple pricing. <span className="text-white/40">No surprises.</span></h2>
            <p className="text-white/50 mb-12">Everything included. Cancel anytime.</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { n: "Starter", p: "$49", d: "1 site, AI builder, domain, email", f: false },
              { n: "Pro", p: "$129", d: "3 sites, video creator, SEO, AI auto-reply", f: true },
              { n: "Agency", p: "$299", d: "10 sites, white-label, API, priority", f: false },
            ].map((pl) => (
              <motion.div key={pl.n} variants={fadeUp}>
                <Link href="/pricing" className={`group relative block rounded-2xl border p-6 text-left hover:-translate-y-1 transition-all duration-300 ${pl.f ? "border-violet-500/30 bg-violet-500/[0.05] shadow-lg shadow-violet-500/10" : "border-white/[0.08] bg-white/[0.03]"}`}>
                  {pl.f && <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Most popular</span>}
                  <div className="text-sm font-medium text-white/60">{pl.n}</div>
                  <div className="mt-2 text-3xl font-bold">{pl.p}<span className="text-base font-normal text-white/40">/mo</span></div>
                  <div className="mt-2 text-sm text-white/40">{pl.d}</div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-white/50 group-hover:text-white transition-colors">See details <ChevronRight className="h-4 w-4" /></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* cta */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
            Ready to build the <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">future</span>?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/50 mb-8">Join thousands of businesses using Zoobicon to build, create, and grow.</motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-8 py-4 text-base font-semibold hover:opacity-90 hover:shadow-xl hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all">
              Start building — it&apos;s free <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-950 py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400"><Sparkles className="h-3.5 w-3.5 text-white" /></div>
                <span className="font-bold">Zoobicon</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">The AI platform for building websites, creating videos, and launching businesses.</p>
            </div>
            <div>
              <div className="text-sm font-semibold mb-4">Products</div>
              <div className="flex flex-col gap-2">
                <Link href="/builder" className="text-sm text-white/40 hover:text-white transition-colors">AI Builder</Link>
                <Link href="/video-creator" className="text-sm text-white/40 hover:text-white transition-colors">AI Video</Link>
                <Link href="/domains" className="text-sm text-white/40 hover:text-white transition-colors">Domains</Link>
                <Link href="/pricing" className="text-sm text-white/40 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-4">Tools</div>
              <div className="flex flex-col gap-2">
                <Link href="/tools" className="text-sm text-white/40 hover:text-white transition-colors">Free SEO Tools</Link>
                <Link href="/tools/business-names" className="text-sm text-white/40 hover:text-white transition-colors">Name Generator</Link>
                <Link href="/developers" className="text-sm text-white/40 hover:text-white transition-colors">API</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-4">Company</div>
              <div className="flex flex-col gap-2">
                <Link href="/auth/login" className="text-sm text-white/40 hover:text-white transition-colors">Sign in</Link>
                <Link href="/auth/signup" className="text-sm text-white/40 hover:text-white transition-colors">Sign up</Link>
                <Link href="/disclaimers" className="text-sm text-white/40 hover:text-white transition-colors">Legal</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/30">© {new Date().getFullYear()} Zoobicon. All rights reserved.</div>
            <div className="text-xs text-white/30 font-mono">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
    </div>
  );
}
