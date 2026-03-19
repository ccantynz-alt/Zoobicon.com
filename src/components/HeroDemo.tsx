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
    prompt: "Build a premium fintech dashboard with dark theme, glassmorphism cards, and real-time analytics",
    slug: "vaultpay",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
body{font-family:Inter,system-ui,sans-serif;background:#06060e;color:#e4e4ec;overflow:hidden}
nav{padding:12px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(6,6,14,0.8);backdrop-filter:blur(20px)}
.logo{display:flex;align-items:center;gap:10px}
.logo-mark{width:28px;height:28px;background:linear-gradient(135deg,#818cf8,#6366f1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;box-shadow:0 0 20px rgba(99,102,241,0.3)}
.logo span{font-weight:700;font-size:15px;letter-spacing:-0.02em}
.nav-r{display:flex;align-items:center;gap:16px}
.nav-pill{font-size:11px;color:rgba(255,255,255,0.4);font-weight:500}
.nav-cta{background:linear-gradient(135deg,#818cf8,#6366f1);border:none;color:#fff;padding:7px 18px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(99,102,241,0.25)}
.hero{text-align:center;padding:36px 28px 28px;position:relative}
.hero::before{content:'';position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:500px;height:300px;background:radial-gradient(ellipse,rgba(99,102,241,0.12),transparent 70%);pointer-events:none}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);color:#a5b4fc;font-size:10px;font-weight:600;padding:5px 14px;border-radius:100px;margin-bottom:14px;letter-spacing:0.04em}
.badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#818cf8;box-shadow:0 0 8px rgba(129,140,248,0.6)}
.hero h1{font-size:36px;font-weight:800;line-height:1.1;margin-bottom:10px;letter-spacing:-0.03em;background:linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:rgba(255,255,255,0.4);font-size:13px;max-width:380px;margin:0 auto 18px;line-height:1.6;font-weight:400}
.hero-btns{display:flex;gap:10px;justify-content:center}
.btn-p{background:linear-gradient(135deg,#818cf8,#6366f1);border:none;color:#fff;padding:11px 26px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(99,102,241,0.3),inset 0 1px 0 rgba(255,255,255,0.15)}
.btn-s{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:11px 26px;border-radius:12px;font-size:12px;font-weight:500;cursor:pointer;backdrop-filter:blur(8px)}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:6px 28px 16px;max-width:560px;margin:0 auto}
.metric{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:14px 12px;text-align:center;backdrop-filter:blur(8px);position:relative;overflow:hidden}
.metric::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)}
.metric-val{font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:2px}
.metric-val.indigo{background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.metric-val.emerald{background:linear-gradient(135deg,#34d399,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.metric-val.amber{background:linear-gradient(135deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.metric-val.cyan{background:linear-gradient(135deg,#22d3ee,#67e8f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.metric-lbl{font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;font-weight:500}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 28px 20px;max-width:560px;margin:0 auto}
.card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:14px;padding:16px;position:relative;overflow:hidden;backdrop-filter:blur(8px)}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)}
.card-icon{width:32px;height:32px;border-radius:10px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:14px}
.card h3{font-size:12px;font-weight:700;margin-bottom:3px;letter-spacing:-0.01em}
.card p{font-size:10px;color:rgba(255,255,255,0.35);line-height:1.6}
.trust{display:flex;justify-content:center;align-items:center;gap:24px;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.04)}
.trust-item{font-size:9px;color:rgba(255,255,255,0.25);letter-spacing:0.08em;text-transform:uppercase;font-weight:500;display:flex;align-items:center;gap:5px}
.trust-dot{width:4px;height:4px;border-radius:50%;background:rgba(52,211,153,0.5)}
</style></head><body>
<nav><div class="logo"><div class="logo-mark">V</div><span>VaultPay</span></div><div class="nav-r"><span class="nav-pill">Features</span><span class="nav-pill">Pricing</span><span class="nav-pill">Enterprise</span><button class="nav-cta">Open Account</button></div></nav>
<div class="hero"><div class="badge">Trusted by 2,400+ businesses</div><h1>The Future of<br>Business Finance</h1><p>Real-time analytics, intelligent forecasting, and seamless payments — all in one elegant dashboard.</p><div class="hero-btns"><button class="btn-p">Start Free Trial</button><button class="btn-s">Watch Demo</button></div></div>
<div class="metrics"><div class="metric"><div class="metric-val indigo">$4.2M</div><div class="metric-lbl">Processed</div></div><div class="metric"><div class="metric-val emerald">99.9%</div><div class="metric-lbl">Uptime</div></div><div class="metric"><div class="metric-val amber">0.3s</div><div class="metric-lbl">Transfers</div></div><div class="metric"><div class="metric-val cyan">256-bit</div><div class="metric-lbl">Encryption</div></div></div>
<div class="cards">
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,rgba(129,140,248,0.15),rgba(99,102,241,0.1));color:#818cf8">&#9783;</div><h3>Smart Analytics</h3><p>Real-time dashboards with predictive insights and anomaly detection.</p></div>
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.1));color:#34d399">&#10003;</div><h3>Instant Transfers</h3><p>Send and receive payments globally in under 300 milliseconds.</p></div>
<div class="card"><div class="card-icon" style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.1));color:#fbbf24">&#9881;</div><h3>AI Forecasting</h3><p>Machine learning models that predict cash flow 90 days ahead.</p></div>
</div>
<div class="trust"><div class="trust-item"><span class="trust-dot"></span>SOC 2 Certified</div><div class="trust-item"><span class="trust-dot"></span>PCI DSS Level 1</div><div class="trust-item"><span class="trust-dot"></span>GDPR Compliant</div><div class="trust-item"><span class="trust-dot"></span>Bank-Grade Security</div></div>
</body></html>`,
  },
  {
    prompt: "Create a luxury real estate platform with property listings, hero video placeholder, and dark elegant theme",
    slug: "meridian-estates",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#08070c;color:#ede9e3;overflow:hidden}
nav{padding:14px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);background:rgba(8,7,12,0.9);backdrop-filter:blur(20px)}
.logo{font-size:16px;font-weight:300;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.85)}
.logo b{font-weight:700;background:linear-gradient(135deg,#d4a574,#c49a6c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:28px;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;font-weight:400}
.nav-cta{background:transparent;border:1px solid rgba(212,165,116,0.3);color:#d4a574;padding:8px 20px;border-radius:2px;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer}
.hero{position:relative;padding:48px 32px 36px;text-align:center}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 30%,rgba(212,165,116,0.06),transparent 60%);pointer-events:none}
.hero-tag{display:inline-block;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(212,165,116,0.7);margin-bottom:16px;font-weight:500}
.hero h1{font-size:42px;font-weight:200;line-height:1.1;margin-bottom:12px;letter-spacing:-0.02em}
.hero h1 em{font-style:italic;font-weight:300;color:rgba(255,255,255,0.5)}
.hero p{font-size:13px;color:rgba(255,255,255,0.35);max-width:360px;margin:0 auto 22px;line-height:1.65;font-weight:300}
.hero-btns{display:flex;gap:12px;justify-content:center}
.btn-gold{background:linear-gradient(135deg,#d4a574,#b8956a);border:none;color:#0a0908;padding:11px 28px;border-radius:2px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer}
.btn-ghost{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);padding:11px 28px;border-radius:2px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;font-weight:400}
.listings{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:10px 32px 20px}
.listing{border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.02)}
.listing-img{height:100px;position:relative}
.listing-img::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent,rgba(8,7,12,0.8))}
.listing-body{padding:12px}
.listing-price{font-size:16px;font-weight:700;color:#d4a574;margin-bottom:2px;letter-spacing:-0.01em}
.listing-addr{font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:8px;font-weight:400}
.listing-meta{display:flex;gap:12px;font-size:9px;color:rgba(255,255,255,0.25);letter-spacing:0.04em}
.listing-meta span{display:flex;align-items:center;gap:3px}
.stats-bar{display:flex;justify-content:center;gap:40px;padding:16px 32px;border-top:1px solid rgba(255,255,255,0.04)}
.stat{text-align:center}
.stat-val{font-size:20px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:-0.02em}
.stat-lbl{font-size:8px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px;font-weight:500}
</style></head><body>
<nav><div class="logo"><b>Meridian</b> Estates</div><div class="nav-links"><span>Properties</span><span>Services</span><span>About</span><span>Contact</span></div><button class="nav-cta">Schedule Tour</button></nav>
<div class="hero"><div class="hero-tag">Exceptional Properties Worldwide</div><h1>Where Luxury<br>Meets <em>Legacy</em></h1><p>Discover curated properties in the world's most prestigious locations. White-glove service from first viewing to final key.</p><div class="hero-btns"><button class="btn-gold">View Collection</button><button class="btn-ghost">Private Consultation</button></div></div>
<div class="listings">
<div class="listing"><div class="listing-img" style="background:linear-gradient(135deg,#1a1520,#2a1f35)"></div><div class="listing-body"><div class="listing-price">$12.8M</div><div class="listing-addr">Bel Air, Los Angeles</div><div class="listing-meta"><span>6 Beds</span><span>8 Baths</span><span>12,400 sqft</span></div></div></div>
<div class="listing"><div class="listing-img" style="background:linear-gradient(135deg,#15181f,#1a2a3a)"></div><div class="listing-body"><div class="listing-price">$8.2M</div><div class="listing-addr">Upper East Side, NYC</div><div class="listing-meta"><span>4 Beds</span><span>5 Baths</span><span>6,800 sqft</span></div></div></div>
<div class="listing"><div class="listing-img" style="background:linear-gradient(135deg,#1a1815,#2a2418)"></div><div class="listing-body"><div class="listing-price">$15.5M</div><div class="listing-addr">Mayfair, London</div><div class="listing-meta"><span>7 Beds</span><span>9 Baths</span><span>14,200 sqft</span></div></div></div>
</div>
<div class="stats-bar"><div class="stat"><div class="stat-val">$4.8B+</div><div class="stat-lbl">Properties Sold</div></div><div class="stat"><div class="stat-val">12,000+</div><div class="stat-lbl">Listings</div></div><div class="stat"><div class="stat-val">48</div><div class="stat-lbl">Countries</div></div><div class="stat"><div class="stat-val">99%</div><div class="stat-lbl">Client Satisfaction</div></div></div>
</body></html>`,
  },
  {
    prompt: "Design a fitness app landing page with neon gradients, workout tracking features, and social proof",
    slug: "pulsefit",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#eeeef2;overflow:hidden}
nav{padding:12px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(10,10,15,0.9);backdrop-filter:blur(16px)}
.logo{display:flex;align-items:center;gap:8px}
.logo-icon{width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#f43f5e,#ec4899);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#fff;box-shadow:0 0 20px rgba(244,63,94,0.3)}
.logo span{font-weight:800;font-size:15px;letter-spacing:-0.02em}
.nav-r{display:flex;align-items:center;gap:16px}
.nav-link{font-size:11px;color:rgba(255,255,255,0.4);font-weight:500}
.nav-cta{background:linear-gradient(135deg,#f43f5e,#ec4899);border:none;color:#fff;padding:8px 20px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(244,63,94,0.25)}
.hero{text-align:center;padding:40px 28px 28px;position:relative}
.hero::before{content:'';position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(244,63,94,0.08),rgba(168,85,247,0.04),transparent 70%);pointer-events:none}
.hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.15);color:#fb7185;font-size:10px;font-weight:600;padding:5px 14px;border-radius:100px;margin-bottom:14px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:#f43f5e;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(244,63,94,0.4)}50%{opacity:0.8;box-shadow:0 0 0 6px rgba(244,63,94,0)}}
.hero h1{font-size:38px;font-weight:900;line-height:1.05;margin-bottom:10px;letter-spacing:-0.03em}
.hero h1 .gradient{background:linear-gradient(135deg,#f43f5e,#a855f7,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:rgba(255,255,255,0.4);font-size:13px;max-width:380px;margin:0 auto 20px;line-height:1.6}
.hero-btns{display:flex;gap:10px;justify-content:center}
.btn-fire{background:linear-gradient(135deg,#f43f5e,#ec4899);border:none;color:#fff;padding:12px 28px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 24px rgba(244,63,94,0.3),inset 0 1px 0 rgba(255,255,255,0.2)}
.btn-outline{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:12px 28px;border-radius:12px;font-size:12px;font-weight:500;cursor:pointer;backdrop-filter:blur(8px)}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:6px 28px 16px;max-width:560px;margin:0 auto}
.feat{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:14px;padding:18px 14px;text-align:center;position:relative;overflow:hidden}
.feat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.feat:nth-child(1)::before{background:linear-gradient(90deg,transparent,#f43f5e,transparent)}
.feat:nth-child(2)::before{background:linear-gradient(90deg,transparent,#a855f7,transparent)}
.feat:nth-child(3)::before{background:linear-gradient(90deg,transparent,#6366f1,transparent)}
.feat-icon{width:36px;height:36px;border-radius:10px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.feat h3{font-size:12px;font-weight:700;margin-bottom:4px;letter-spacing:-0.01em}
.feat p{font-size:10px;color:rgba(255,255,255,0.35);line-height:1.5}
.social{display:flex;justify-content:center;align-items:center;gap:20px;padding:16px 28px;border-top:1px solid rgba(255,255,255,0.04)}
.avatars{display:flex}
.avatar{width:24px;height:24px;border-radius:50%;border:2px solid #0a0a0f;margin-left:-6px}
.avatar:first-child{margin-left:0}
.social-text{font-size:11px;color:rgba(255,255,255,0.4)}
.social-text b{color:rgba(255,255,255,0.7)}
.stores{display:flex;gap:8px;padding:6px 28px 16px;justify-content:center}
.store-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 16px;display:flex;align-items:center;gap:8px;cursor:pointer}
.store-btn .icon{font-size:16px}
.store-btn .text{text-align:left}
.store-btn .text small{display:block;font-size:8px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.06em}
.store-btn .text span{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8)}
</style></head><body>
<nav><div class="logo"><div class="logo-icon">P</div><span>PulseFit</span></div><div class="nav-r"><span class="nav-link">Features</span><span class="nav-link">Pricing</span><span class="nav-link">Athletes</span><button class="nav-cta">Download App</button></div></nav>
<div class="hero"><div class="hero-badge"><span class="dot"></span>500K+ Active Athletes</div><h1>Train Smarter.<br><span class="gradient">Perform Better.</span></h1><p>AI-powered workout plans, real-time form analysis, and community challenges that push your limits.</p><div class="hero-btns"><button class="btn-fire">Start Free Trial</button><button class="btn-outline">Watch Demo</button></div></div>
<div class="features">
<div class="feat"><div class="feat-icon" style="background:linear-gradient(135deg,rgba(244,63,94,0.15),rgba(236,72,153,0.1));color:#fb7185">&#9829;</div><h3>AI Coach</h3><p>Personalized workout plans that adapt to your progress and recovery.</p></div>
<div class="feat"><div class="feat-icon" style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(139,92,246,0.1));color:#c084fc">&#9734;</div><h3>Form Analysis</h3><p>Real-time camera tracking ensures perfect technique on every rep.</p></div>
<div class="feat"><div class="feat-icon" style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(79,70,229,0.1));color:#818cf8">&#9775;</div><h3>Social Challenges</h3><p>Compete with friends, join global events, earn achievement badges.</p></div>
</div>
<div class="social"><div class="avatars"><div class="avatar" style="background:linear-gradient(135deg,#f43f5e,#ec4899)"></div><div class="avatar" style="background:linear-gradient(135deg,#a855f7,#6366f1)"></div><div class="avatar" style="background:linear-gradient(135deg,#22d3ee,#3b82f6)"></div><div class="avatar" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"></div><div class="avatar" style="background:linear-gradient(135deg,#10b981,#059669)"></div></div><div class="social-text"><b>500,000+</b> athletes training with PulseFit</div></div>
<div class="stores"><div class="store-btn"><div class="icon">&#61514;</div><div class="text"><small>Download on the</small><span>App Store</span></div></div><div class="store-btn"><div class="icon">&#9654;</div><div class="text"><small>Get it on</small><span>Google Play</span></div></div></div>
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
