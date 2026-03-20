"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import HeroDemo from "@/components/HeroDemo";
import ScrollProgress from "@/components/ScrollProgress";
import {
  ArrowRight,
  Menu,
  X,
  Check,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const ShowcaseGallery = dynamic(() => import("@/components/ShowcaseGallery"), { ssr: false });

/* ─── animation presets ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ─── rotating word in hero ─── */
const WORDS = ["websites", "apps", "stores", "portfolios", "dashboards", "landing pages"];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-block relative h-[1.1em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#7c5aff] to-[#b794ff]"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── animated counter ─── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) { setStarted(true); } },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const dur = 1800;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── immersive hero background — interactive mesh with mouse-reactive glow ─── */
function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    document.addEventListener("mousemove", onMove);

    // Orbs — large floating gradients
    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 200 + Math.random() * 300,
      hue: [265, 280, 230, 300, 250][i],
      sat: 60 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
    }));

    // Grid dots
    const GRID = 40;
    const dots: { x: number; y: number }[] = [];
    for (let gx = 0; gx < w + GRID; gx += GRID) {
      for (let gy = 0; gy < h + GRID; gy += GRID) {
        dots.push({ x: gx, y: gy });
      }
    }

    let t = 0;
    const draw = () => {
      t += 0.005;
      ctx.clearRect(0, 0, w, h);

      // Animated orbs
      for (const orb of orbs) {
        orb.phase += 0.003;
        orb.x += orb.vx + Math.sin(orb.phase) * 0.4;
        orb.y += orb.vy + Math.cos(orb.phase * 0.7) * 0.3;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        const alpha = 0.06 + Math.sin(orb.phase) * 0.02;
        g.addColorStop(0, `hsla(${orb.hue}, ${orb.sat}%, 55%, ${alpha})`);
        g.addColorStop(0.5, `hsla(${orb.hue}, ${orb.sat}%, 45%, ${alpha * 0.4})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouse glow
      const mx = mouse.current.x, my = mouse.current.y;
      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 250);
        mg.addColorStop(0, "rgba(124, 90, 255, 0.08)");
        mg.addColorStop(0.5, "rgba(124, 90, 255, 0.03)");
        mg.addColorStop(1, "transparent");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, 250, 0, Math.PI * 2);
        ctx.fill();
      }

      // Grid dots — subtle, react to mouse
      for (const dot of dots) {
        const dx = dot.x - mx, dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / 300);
        const size = 0.5 + proximity * 1.5;
        const alpha = 0.04 + proximity * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizontal scan line (subtle)
      const scanY = (h * 0.3) + Math.sin(t * 2) * h * 0.3;
      const scanG = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1);
      scanG.addColorStop(0, "transparent");
      scanG.addColorStop(0.5, "rgba(124, 90, 255, 0.03)");
      scanG.addColorStop(1, "transparent");
      ctx.fillStyle = scanG;
      ctx.fillRect(0, scanY - 40, w, 80);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("zoobicon_user"); if (s) setUser(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

  return (
    <div className="relative bg-[#050505] text-white selection:bg-[#7c5aff]/30 selection:text-white">
      <ScrollProgress />

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all ${scrolled ? "h-14" : "h-16"}`}>
            <Link href="/" className="text-lg font-bold tracking-tight">
              Zoobicon
            </Link>
            <div className="hidden md:flex items-center gap-8 text-[13px] text-white/50">
              <Link href="/generators" className="hover:text-white transition-colors">Generators</Link>
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/developers" className="hover:text-white transition-colors">Developers</Link>
              <Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="text-[13px] text-white/50 hover:text-white transition-colors">Sign in</Link>
              )}
              <Link
                href="/builder"
                className="text-[13px] font-semibold px-5 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
              >
                Start Building
              </Link>
            </div>
            <button className="md:hidden text-white/60" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden fixed inset-0 top-14 bg-[#050505]/98 backdrop-blur-2xl z-40 px-6 py-8 flex flex-col"
            >
              <div className="space-y-1 flex-1">
                {[
                  { href: "/generators", label: "Generators" },
                  { href: "/marketplace", label: "Marketplace" },
                  { href: "/developers", label: "Developers" },
                  { href: "/agencies", label: "Agencies" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/support", label: "Support" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-lg font-medium text-white/60 hover:text-white py-3 border-b border-white/[0.06]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="pt-6 border-t border-white/[0.06]">
                <Link href="/builder" onClick={() => setMobileMenuOpen(false)} className="block py-4 rounded-xl text-center text-base font-bold bg-white text-black">
                  Start Building Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO
          Immersive background + demo = the product sells itself
          ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen pt-28 pb-4 md:pt-36 md:pb-8 overflow-hidden">
        {/* Immersive interactive background */}
        <HeroBackground />
        {/* Top gradient fade from nav */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#050505] to-transparent z-[1] pointer-events-none" />
        {/* Bottom gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent z-[1] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-[2]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16 md:mb-20"
          >
            <h1 className="text-[clamp(2.5rem,8vw,7rem)] font-extrabold tracking-[-0.05em] leading-[0.9] mb-6">
              One prompt.<br />
              Stunning <RotatingWord />.
            </h1>
            <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto mb-10 leading-relaxed font-light">
              7 AI agents collaborate in real-time to build production-ready
              websites. Watch it happen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/builder"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-black text-[15px] font-bold hover:bg-white/90 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Start Building Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-medium text-white/50 border border-white/[0.1] hover:border-white/[0.2] hover:text-white/70 transition-all"
              >
                See Examples
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/30">
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-white/15" />
              <span>Free forever</span>
              <span className="w-1 h-1 rounded-full bg-white/15" />
              <span>No limits</span>
            </div>
          </motion.div>

          {/* The live demo — this IS the product proof */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Subtle glow behind the demo */}
            <div className="absolute -inset-20 bg-[#7c5aff]/[0.04] rounded-[40px] blur-3xl pointer-events-none" />
            <HeroDemo />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — PROOF (numbers + showcase)
          "Don't tell me. Show me."
          ═══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Stats strip — real numbers */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden mb-24 md:mb-32"
          >
            {[
              { val: 44, suffix: "", label: "Specialized generators" },
              { val: 100, suffix: "+", label: "Ready-made templates" },
              { val: 95, suffix: "s", label: "Average build time" },
              { val: 7, suffix: "", label: "AI agents per build" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#0a0a0a] p-8 md:p-10 text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  <Counter end={s.val} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/30 uppercase tracking-[0.15em]">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Showcase gallery */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Real output. Not mockups.
              </h2>
              <p className="text-base md:text-lg text-white/35 max-w-xl mx-auto">
                Every site below was generated by Zoobicon from a single prompt.
                Click to see the prompt that created it.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} id="showcase">
              <ShowcaseGallery />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (3 steps, simple)
          ═══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Describe it. We build it.
              </h2>
              <p className="text-base md:text-lg text-white/35 max-w-lg mx-auto">
                Three steps. No code. No templates. No compromise.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-12">
              {[
                {
                  num: "01",
                  title: "Describe your vision",
                  body: "Type what you want in plain English. A fintech dashboard, a bakery site, an e-commerce store — anything.",
                },
                {
                  num: "02",
                  title: "7 agents build it",
                  body: "Strategist, designer, copywriter, architect, developer, SEO specialist, and animator work in parallel.",
                },
                {
                  num: "03",
                  title: "Deploy instantly",
                  body: "Your site goes live with one click. Edit visually, export to React or WordPress, connect a custom domain.",
                },
              ].map((step, i) => (
                <motion.div key={i} variants={fadeUp} className="relative">
                  <div className="text-[80px] md:text-[100px] font-black text-white/[0.03] leading-none absolute -top-6 -left-2 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className="relative pt-8">
                    <div className="text-xs font-bold text-[#7c5aff] mb-3 tracking-[0.2em] uppercase">
                      Step {step.num}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed">{step.body}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-16 -right-6 lg:-right-8 w-4 text-white/10">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* What it can build */}
            <motion.div variants={fadeUp} className="mt-20 text-center">
              <p className="text-xs text-white/25 uppercase tracking-[0.2em] mb-6">What you can build</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "SaaS Landing Pages", "E-Commerce Stores", "Portfolios", "Dashboards",
                  "Restaurants", "Agency Sites", "Blogs", "Full-Stack Apps",
                  "Multi-Page Sites", "Email Templates",
                ].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full border border-white/[0.06] text-xs text-white/30 hover:text-white/50 hover:border-white/[0.12] transition-all cursor-default">
                    {tag}
                  </span>
                ))}
                <Link
                  href="/generators"
                  className="px-4 py-2 rounded-full border border-[#7c5aff]/20 text-xs text-[#7c5aff]/60 hover:text-[#7c5aff] hover:border-[#7c5aff]/40 transition-all"
                >
                  +34 more generators →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4 — PRICING (clean, minimal)
          ═══════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Simple pricing.
              </h2>
              <p className="text-base text-white/35">
                No credits. No tokens. No usage traps. Start free, upgrade when ready.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-4">
              {/* Free */}
              <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm text-white/40 mb-2">Free</div>
                <div className="text-4xl font-extrabold mb-1">$0</div>
                <div className="text-xs text-white/30 mb-6">Forever</div>
                <ul className="space-y-3 mb-8">
                  {["3 sites / month", "7-agent AI pipeline", "Opus-quality builds", "Free hosting"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/45">
                      <Check className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/builder" className="block w-full py-3 text-center rounded-full border border-white/[0.1] text-sm font-semibold text-white/60 hover:text-white hover:border-white/[0.2] transition-all">
                  Get Started
                </Link>
              </div>

              {/* Pro — featured */}
              <div className="relative p-8 rounded-2xl border border-[#7c5aff]/30 bg-[#7c5aff]/[0.04]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#7c5aff] text-[11px] font-bold text-white">
                  Most Popular
                </div>
                <div className="text-sm text-[#7c5aff]/70 mb-2">Pro</div>
                <div className="text-4xl font-extrabold mb-1">$49<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-xs text-white/30 mb-6">Full arsenal</div>
                <ul className="space-y-3 mb-8">
                  {["Unlimited sites", "All 44 generators", "Custom domains", "GitHub & WP export", "Visual editor", "Multi-page sites"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-[#7c5aff]/60 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full py-3 text-center rounded-full bg-[#7c5aff] text-sm font-bold text-white hover:bg-[#6d3bff] transition-colors">
                  Start Pro Trial
                </Link>
              </div>

              {/* Agency */}
              <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm text-white/40 mb-2">Agency</div>
                <div className="text-4xl font-extrabold mb-1">$99<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-xs text-white/30 mb-6">White-label</div>
                <ul className="space-y-3 mb-8">
                  {["Everything in Pro", "White-label platform", "Client portal", "Bulk generation", "API access", "Priority support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/45">
                      <Check className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full py-3 text-center rounded-full border border-white/[0.1] text-sm font-semibold text-white/60 hover:text-white hover:border-white/[0.2] transition-all">
                  Start Agency Trial
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mt-8">
              <p className="text-xs text-white/25">
                Need more? <a href="mailto:sales@zoobicon.com" className="text-white/40 underline underline-offset-4 hover:text-white/60 transition-colors">Contact sales</a> for Enterprise.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — FINAL CTA
          ═══════════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 border-t border-white/[0.04] overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7c5aff]/[0.03] to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-[-0.05em] leading-[0.9] mb-6"
            >
              Stop browsing.<br />
              Start building.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/30 max-w-lg mx-auto mb-10">
              Join creators, agencies, and entrepreneurs who ship
              production-ready websites in minutes, not months.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link
                href="/builder"
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black text-lg font-bold hover:bg-white/90 transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.12)]"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="text-lg font-bold mb-4">Zoobicon</div>
              <p className="text-sm text-white/30 max-w-xs leading-relaxed mb-6">
                The AI platform for building, launching, and scaling
                websites and web applications.
              </p>
              <div className="flex gap-2">
                {["zoobicon.com", "zoobicon.ai", "zoobicon.io", "zoobicon.sh"].map((d) => (
                  <span key={d} className="text-[10px] text-white/20 bg-white/[0.04] px-2 py-1 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2">
                {[
                  ["/products/website-builder", "Website Builder"],
                  ["/products/seo-agent", "SEO Agent"],
                  ["/products/email-support", "Email Support"],
                  ["/generators", "44 Generators"],
                  ["/marketplace", "Marketplace"],
                  ["/domains", "Domains"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/25 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2">
                {[
                  ["/developers", "API Docs"],
                  ["/cli", "CLI Tools"],
                  ["/hosting", "Hosting"],
                  ["/wordpress", "WordPress"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/25 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Company</div>
              <ul className="space-y-2">
                {[
                  ["/agencies", "For Agencies"],
                  ["/support", "Support"],
                  ["/pricing", "Pricing"],
                  ["/privacy", "Privacy"],
                  ["/terms", "Terms"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/25 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/20">&copy; 2026 Zoobicon. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-white/20 hover:text-white/40 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-white/20 hover:text-white/40 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
