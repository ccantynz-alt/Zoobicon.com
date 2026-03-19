"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Palette,
  PenTool,
  LayoutGrid,
  Code2,
  Search,
  Sparkles,
  CheckCircle2,
  Globe,
  Rocket,
  Clock,
} from "lucide-react";

/* ─── pipeline agents ─── */

const AGENTS = [
  { name: "Strategist", icon: Lightbulb, phase: 1 },
  { name: "Designer", icon: Palette, phase: 2 },
  { name: "Copywriter", icon: PenTool, phase: 2 },
  { name: "Architect", icon: LayoutGrid, phase: 2 },
  { name: "Developer", icon: Code2, phase: 3 },
  { name: "SEO", icon: Search, phase: 4 },
  { name: "Animator", icon: Sparkles, phase: 4 },
] as const;

/* ─── 3 cycling demo sites ─── */

const DEMOS = [
  {
    prompt: "Build a modern SaaS landing page for an AI code review tool with dark theme",
    slug: "codelens",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#0a0a1a;color:#e0e0e8}
nav{padding:14px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06)}
.logo{display:flex;align-items:center;gap:8px}
.logo-icon{width:26px;height:26px;background:linear-gradient(135deg,#7c5aff,#3b82f6);border-radius:7px}
.logo span{font-weight:700;font-size:14px}
.nav-links{display:flex;gap:20px;font-size:12px;color:rgba(255,255,255,0.45)}
.nav-cta{background:linear-gradient(135deg,#7c5aff,#3b82f6);border:none;color:#fff;padding:7px 16px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer}
.hero{text-align:center;padding:48px 24px 36px}
.hero h1{font-size:32px;font-weight:800;line-height:1.1;margin-bottom:10px;background:linear-gradient(135deg,#c4b5fd,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:rgba(255,255,255,0.45);font-size:13px;max-width:380px;margin:0 auto 20px;line-height:1.5}
.hero-btns{display:flex;gap:10px;justify-content:center}
.btn-primary{background:linear-gradient(135deg,#7c5aff,#3b82f6);border:none;color:#fff;padding:10px 22px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer}
.btn-secondary{background:transparent;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.65);padding:10px 22px;border-radius:10px;font-size:12px;cursor:pointer}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 24px 36px;max-width:560px;margin:0 auto}
.card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px}
.card-icon{width:28px;height:28px;border-radius:7px;margin-bottom:10px}
.card h3{font-size:12px;font-weight:600;margin-bottom:4px}
.card p{font-size:10px;color:rgba(255,255,255,0.35);line-height:1.5}
.stats{display:flex;justify-content:center;gap:32px;padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06)}
.stat{text-align:center}
.stat-value{font-size:20px;font-weight:800;background:linear-gradient(135deg,#7c5aff,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-top:2px}
</style></head><body>
<nav><div class="logo"><div class="logo-icon"></div><span>CodeLens AI</span></div><div class="nav-links"><span>Features</span><span>Pricing</span><span>Docs</span></div><button class="nav-cta">Get Started</button></nav>
<div class="hero"><h1>Code Review,<br>Supercharged by AI</h1><p>Catch bugs, enforce standards, and ship 10x faster with intelligent code analysis.</p><div class="hero-btns"><button class="btn-primary">Start Free Trial</button><button class="btn-secondary">View Demo</button></div></div>
<div class="features">
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,#7c5aff,#a78bfa)"></div><h3>Smart Analysis</h3><p>Deep understanding beyond syntax to find logic errors.</p></div>
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,#3b82f6,#22d3ee)"></div><h3>Instant Reviews</h3><p>Comprehensive reviews in seconds, not hours.</p></div>
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,#10b981,#34d399)"></div><h3>Security Scan</h3><p>Auto-detects OWASP vulnerabilities and injection risks.</p></div>
</div>
<div class="stats"><div class="stat"><div class="stat-value">50K+</div><div class="stat-label">Reviews</div></div><div class="stat"><div class="stat-value">99.2%</div><div class="stat-label">Accuracy</div></div><div class="stat"><div class="stat-value">2.1s</div><div class="stat-label">Avg Time</div></div></div>
</body></html>`,
  },
  {
    prompt: "Create a photography portfolio with minimal design, dark gallery grid, and contact form",
    slug: "jcarter-photo",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#08080c;color:#e8e8ec}
nav{padding:16px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06)}
nav .name{font-size:13px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7)}
nav .links{display:flex;gap:24px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.05em}
.hero{text-align:center;padding:56px 28px 40px}
.hero h1{font-size:38px;font-weight:200;letter-spacing:-0.02em;line-height:1.15;margin-bottom:8px}
.hero h1 em{font-style:italic;color:rgba(255,255,255,0.5)}
.hero p{color:rgba(255,255,255,0.35);font-size:12px;letter-spacing:0.05em;margin-bottom:24px}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 28px 28px}
.gallery-item{aspect-ratio:1;border-radius:4px;position:relative;overflow:hidden}
.gallery-item:nth-child(1){background:linear-gradient(135deg,#1a1a2e,#2d1b69)}
.gallery-item:nth-child(2){background:linear-gradient(135deg,#1b2838,#0f4c75)}
.gallery-item:nth-child(3){background:linear-gradient(135deg,#2d1b2e,#6b2737)}
.gallery-item:nth-child(4){background:linear-gradient(135deg,#0d2137,#1a5276)}
.gallery-item:nth-child(5){background:linear-gradient(135deg,#2e1a1a,#8b4513);grid-column:span 2;aspect-ratio:2}
.gallery-item:nth-child(6){background:linear-gradient(135deg,#1a2e1a,#2d5a27)}
.cta{text-align:center;padding:32px 28px}
.cta h2{font-size:18px;font-weight:300;margin-bottom:6px;letter-spacing:-0.01em}
.cta p{font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:16px}
.cta-btn{background:transparent;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);padding:10px 28px;border-radius:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer}
</style></head><body>
<nav><div class="name">J. Carter</div><div class="links"><span>Work</span><span>About</span><span>Contact</span></div></nav>
<div class="hero"><h1>Capturing moments<br>in <em>light & shadow</em></h1><p>EDITORIAL · PORTRAIT · LANDSCAPE</p></div>
<div class="gallery"><div class="gallery-item"></div><div class="gallery-item"></div><div class="gallery-item"></div><div class="gallery-item"></div><div class="gallery-item"></div><div class="gallery-item"></div></div>
<div class="cta"><h2>Let's create something beautiful</h2><p>Available for commissions and collaborations worldwide</p><button class="cta-btn">Get in Touch</button></div>
</body></html>`,
  },
  {
    prompt: "Design an e-commerce store for artisan coffee with product grid, cart, and warm aesthetic",
    slug: "brewhaus",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#0f0d0a;color:#e8e2d8}
nav{padding:14px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06)}
.logo{display:flex;align-items:center;gap:8px}
.logo-icon{width:26px;height:26px;background:linear-gradient(135deg,#d97706,#92400e);border-radius:50%}
.logo span{font-weight:700;font-size:14px;color:#d4a574}
.nav-links{display:flex;gap:20px;font-size:11px;color:rgba(255,255,255,0.4)}
.cart-btn{background:rgba(217,119,6,0.15);border:1px solid rgba(217,119,6,0.3);color:#d97706;padding:6px 14px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer}
.hero{text-align:center;padding:44px 24px 32px;background:linear-gradient(180deg,rgba(217,119,6,0.06),transparent)}
.hero h1{font-size:30px;font-weight:800;line-height:1.15;margin-bottom:8px;color:#f5e6d3}
.hero p{color:rgba(255,255,255,0.4);font-size:12px;margin-bottom:20px}
.hero-btn{background:linear-gradient(135deg,#d97706,#b45309);border:none;color:#fff;padding:10px 24px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer}
.badge{display:inline-block;background:rgba(217,119,6,0.1);border:1px solid rgba(217,119,6,0.2);color:#d97706;font-size:9px;font-weight:600;padding:4px 10px;border-radius:20px;margin-bottom:12px;letter-spacing:0.08em;text-transform:uppercase}
.products{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 24px 32px}
.product{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden}
.product-img{height:80px;position:relative}
.product-img:nth-child(1){background:linear-gradient(135deg,#3d2b1f,#5c3d2e)}
.product-body{padding:10px}
.product h3{font-size:11px;font-weight:600;margin-bottom:2px}
.product .price{font-size:12px;font-weight:700;color:#d97706}
.product .tag{font-size:8px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em}
.product .add{width:100%;margin-top:8px;background:rgba(217,119,6,0.1);border:1px solid rgba(217,119,6,0.2);color:#d97706;padding:6px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer}
</style></head><body>
<nav><div class="logo"><div class="logo-icon"></div><span>BrewHaus</span></div><div class="nav-links"><span>Shop</span><span>About</span><span>Subscribe</span></div><button class="cart-btn">Cart (0)</button></nav>
<div class="hero"><div class="badge">Fresh Roasted Weekly</div><h1>Artisan Coffee,<br>Delivered to Your Door</h1><p>Single-origin beans roasted in small batches for maximum flavor.</p><button class="hero-btn">Shop Collection</button></div>
<div class="products">
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#3d2b1f,#5c3d2e);height:80px"></div><div class="product-body"><div class="tag">Single Origin</div><h3>Ethiopian Yirgacheffe</h3><div class="price">$18.99</div><button class="add">Add to Cart</button></div></div>
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#2d1f15,#4a3728);height:80px"></div><div class="product-body"><div class="tag">House Blend</div><h3>Morning Ritual</h3><div class="price">$14.99</div><button class="add">Add to Cart</button></div></div>
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#1f2d15,#3d4a28);height:80px"></div><div class="product-body"><div class="tag">Limited Edition</div><h3>Gesha Reserve</h3><div class="price">$32.99</div><button class="add">Add to Cart</button></div></div>
</div>
</body></html>`,
  },
];

/* ─── timing ─── */
const TYPING_DURATION = 2200;
const BUILD_DURATION = 4500;
const AGENT_DELAYS = [0, 400, 500, 600, 1200, 2800, 2900];
const AGENT_FINISH = [350, 550, 650, 1150, 2750, 3400, 3500];
const DEPLOY_SHOW_DELAY = 500;
const LOOP_PAUSE = 3500;

/* ─── reduced-motion hook ─── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ─── typing cursor ─── */
function TypingCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[1.1em] bg-violet-400 ml-[1px] align-middle rounded-full"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.53, repeat: Infinity, repeatType: "reverse" }}
    />
  );
}

/* ─── main component ─── */
export default function HeroDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const [demoIndex, setDemoIndex] = useState(0);

  type Phase = "typing" | "agents" | "building" | "deployed" | "pause";
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedLength, setTypedLength] = useState(0);
  const [agentStates, setAgentStates] = useState<("idle" | "active" | "done")[]>(
    AGENTS.map(() => "idle")
  );
  const [buildProgress, setBuildProgress] = useState(0);
  const [showDeploy, setShowDeploy] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const buildStartRef = useRef(0);
  const phaseStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const demo = DEMOS[demoIndex];

  /* reset for new loop */
  const reset = useCallback(() => {
    setTypedLength(0);
    setAgentStates(AGENTS.map(() => "idle"));
    setBuildProgress(0);
    setShowDeploy(false);
    setElapsedTime(0);
    setDemoIndex((prev) => (prev + 1) % DEMOS.length);
    setPhase("typing");
  }, []);

  /* typing phase */
  useEffect(() => {
    if (phase !== "typing") return;
    if (reducedMotion) {
      setTypedLength(demo.prompt.length);
      setPhase("agents");
      return;
    }
    phaseStartRef.current = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - phaseStartRef.current;
      const progress = Math.min(elapsed / TYPING_DURATION, 1);
      setTypedLength(Math.floor(progress * demo.prompt.length));
      if (progress >= 1) { setPhase("agents"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reducedMotion, demo.prompt.length]);

  /* agents phase */
  useEffect(() => {
    if (phase !== "agents") return;
    buildStartRef.current = Date.now();
    if (reducedMotion) {
      setAgentStates(AGENTS.map(() => "done"));
      setBuildProgress(1);
      setElapsedTime(95);
      setPhase("deployed");
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    AGENTS.forEach((_, i) => {
      timeouts.push(setTimeout(() => {
        setAgentStates((prev) => prev.map((s, idx) => (idx === i ? "active" : s)));
      }, AGENT_DELAYS[i]));
      timeouts.push(setTimeout(() => {
        setAgentStates((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      }, AGENT_FINISH[i]));
    });
    timeouts.push(setTimeout(() => setPhase("building"), 1400));
    /* start elapsed timer */
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - buildStartRef.current) / 1000;
      /* Map the ~6s animation to a simulated 95s build */
      setElapsedTime(Math.min(Math.round(elapsed * 15), 95));
    }, 100);
    return () => {
      timeouts.forEach(clearTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, reducedMotion]);

  /* building phase */
  useEffect(() => {
    if (phase !== "building") return;
    phaseStartRef.current = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - phaseStartRef.current) / BUILD_DURATION, 1);
      setBuildProgress(1 - Math.pow(1 - p, 3));
      if (p >= 1) { setPhase("deployed"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* deployed phase */
  useEffect(() => {
    if (phase !== "deployed") return;
    setBuildProgress(1);
    setAgentStates(AGENTS.map(() => "done"));
    setElapsedTime(95);
    if (timerRef.current) clearInterval(timerRef.current);
    const t1 = setTimeout(() => setShowDeploy(true), DEPLOY_SHOW_DELAY);
    const t2 = setTimeout(() => setPhase("pause"), DEPLOY_SHOW_DELAY + LOOP_PAUSE);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  /* pause → loop */
  useEffect(() => {
    if (phase !== "pause") return;
    const t = setTimeout(reset, 800);
    return () => clearTimeout(t);
  }, [phase, reset]);

  const typedText = demo.prompt.slice(0, typedLength);
  const isTyping = phase === "typing" && typedLength < demo.prompt.length;
  const isBuilding = phase === "building" || phase === "agents";
  const doneCount = agentStates.filter((s) => s === "done").length;

  return (
    <div className="w-full relative">
      {/* Ambient glow */}
      <div
        className="absolute -inset-12 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "radial-gradient(600px circle at 50% 40%, rgba(124,90,255,0.12), transparent 70%)",
        }}
      />

      <motion.div
        className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 100px -20px rgba(124,90,255,0.15), 0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Shimmer line */}
        {!reducedMotion && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-[1px] z-20 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(124,90,255,0.5) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
        )}

        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015]">
          <div className="flex gap-1.5">
            <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/70" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]/70" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]/70" />
          </div>
          <div className="ml-3 flex-1 h-5 rounded-md bg-white/[0.04] flex items-center px-2.5 gap-1.5">
            <Globe className="w-2.5 h-2.5 text-white/15" />
            <span className="text-[10px] text-white/25 font-mono tracking-wide">
              zoobicon.com/builder
            </span>
          </div>
          {/* Build timer */}
          {(isBuilding || phase === "deployed") && (
            <motion.div
              className="flex items-center gap-1.5 text-[10px] tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock className="w-3 h-3 text-white/30" />
              <span className={phase === "deployed" ? "text-emerald-400 font-semibold" : "text-white/40"}>
                {elapsedTime}s
              </span>
            </motion.div>
          )}
        </div>

        {/* Prompt bar */}
        <div className="px-4 pt-3 pb-2">
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] transition-all duration-500"
            style={isTyping ? { boxShadow: "0 0 24px rgba(124,90,255,0.08), inset 0 0 12px rgba(124,90,255,0.03)" } : undefined}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400/80 flex-shrink-0" />
            <span className="text-[11.5px] text-white/70 leading-snug min-h-[16px] flex items-center font-medium">
              {typedText}
              {isTyping && <TypingCursor />}
            </span>
          </div>
        </div>

        {/* Agent pipeline — horizontal bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 mr-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
              <span className="text-[9px] uppercase tracking-[0.12em] text-white/25 font-semibold whitespace-nowrap">
                Pipeline
              </span>
              {doneCount > 0 && (
                <span className="text-[9px] text-white/20 tabular-nums">{doneCount}/{AGENTS.length}</span>
              )}
            </div>
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              const state = agentStates[i];
              const isActive = state === "active";
              const isDone = state === "done";
              return (
                <motion.div
                  key={agent.name}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold tracking-wide select-none whitespace-nowrap transition-colors duration-300 ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                      : isDone
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/[0.03] text-white/20 border border-white/[0.05]"
                  }`}
                  animate={isActive && !reducedMotion ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={isActive ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                >
                  {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
                  <span className="hidden sm:inline">{agent.name}</span>
                </motion.div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #7c5aff, #a78bfa, #34d399)",
                width: `${Math.round(buildProgress * 100)}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Preview — REAL HTML site via iframe */}
        <div className="px-4 pb-2">
          <motion.div
            className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#08081a]"
            style={{ height: 380 }}
            animate={{
              borderColor: phase === "deployed" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)",
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Scan line while building */}
            <AnimatePresence>
              {isBuilding && !reducedMotion && (
                <motion.div
                  className="absolute inset-x-0 h-[1.5px] z-10 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent 10%, rgba(124,90,255,0.5) 50%, transparent 90%)" }}
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: ["0%", "100%"], opacity: [0, 0.8, 0.8, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </AnimatePresence>

            {/* The actual site preview */}
            <motion.div
              className="w-full h-full"
              animate={{
                opacity: phase === "typing" ? 0.15 : phase === "agents" ? 0.4 : 1,
                filter:
                  phase === "typing"
                    ? "blur(6px) brightness(0.4) saturate(0.3)"
                    : phase === "agents"
                      ? "blur(3px) brightness(0.6) saturate(0.6)"
                      : "blur(0px) brightness(1) saturate(1)",
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <AnimatePresence mode="wait">
                <motion.iframe
                  key={demoIndex}
                  srcDoc={demo.html}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  title={`Demo preview: ${demo.slug}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ pointerEvents: "none" }}
                />
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        {/* Deploy banner */}
        <div className="px-4 pb-3 pt-1">
          <AnimatePresence>
            {showDeploy && (
              <motion.div
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20"
                initial={{ opacity: 0, y: 10, scaleY: 0.8 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ boxShadow: "0 0 30px rgba(16,185,129,0.08)" }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-[12px] text-emerald-300 font-semibold tracking-wide">
                    Deployed in {elapsedTime}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/70">
                  <Globe className="w-3 h-3" />
                  <span className="font-mono tracking-wide">{demo.slug}.zoobicon.sh</span>
                  <Rocket className="w-3 h-3 text-emerald-400/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!showDeploy && <div className="h-[42px]" />}
        </div>
      </motion.div>
    </div>
  );
}
