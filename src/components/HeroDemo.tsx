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
    prompt: "Build a gourmet food delivery platform with product cards, cart, warm amber branding on white background",
    slug: "savorly",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
body{font-family:Inter,system-ui,sans-serif;background:#FFFAF5;color:#1a1a1a;overflow:hidden}
nav{padding:12px 28px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #f0e6d9;box-shadow:0 1px 8px rgba(180,120,60,0.06)}
.logo{display:flex;align-items:center;gap:8px}
.logo-mark{width:30px;height:30px;background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;box-shadow:0 2px 12px rgba(245,158,11,0.3)}
.logo span{font-weight:800;font-size:16px;letter-spacing:-0.02em;color:#92400E}
.nav-r{display:flex;align-items:center;gap:14px}
.nav-pill{font-size:11px;color:#78716C;font-weight:500}
.nav-cart{background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;padding:6px 14px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px}
.nav-cta{background:linear-gradient(135deg,#F59E0B,#D97706);border:none;color:#fff;padding:8px 18px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(245,158,11,0.25)}
.hero{text-align:center;padding:28px 28px 20px;position:relative;background:linear-gradient(180deg,#FFFAF5,#FFF7ED)}
.hero-tag{display:inline-flex;align-items:center;gap:5px;background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;font-size:10px;font-weight:700;padding:5px 14px;border-radius:100px;margin-bottom:12px;letter-spacing:0.03em}
.hero h1{font-size:34px;font-weight:900;line-height:1.1;margin-bottom:8px;letter-spacing:-0.03em;color:#1C1917}
.hero h1 .warm{background:linear-gradient(135deg,#F59E0B,#DC2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:#78716C;font-size:13px;max-width:380px;margin:0 auto 16px;line-height:1.6}
.hero-btns{display:flex;gap:10px;justify-content:center}
.btn-warm{background:linear-gradient(135deg,#F59E0B,#D97706);border:none;color:#fff;padding:11px 26px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(245,158,11,0.3)}
.btn-outline{background:#fff;border:2px solid #F59E0B;color:#92400E;padding:10px 26px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer}
.products{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:10px 28px 16px}
.product{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #F5F0EB;box-shadow:0 2px 12px rgba(0,0,0,0.04)}
.product-img{height:90px;position:relative}
.product-badge{position:absolute;top:8px;left:8px;background:#DC2626;color:#fff;font-size:8px;font-weight:800;padding:3px 8px;border-radius:6px;letter-spacing:0.04em}
.product-body{padding:12px}
.product-name{font-size:12px;font-weight:700;color:#1C1917;margin-bottom:2px}
.product-desc{font-size:9px;color:#A8A29E;margin-bottom:8px;line-height:1.4}
.product-row{display:flex;align-items:center;justify-content:space-between}
.product-price{font-size:16px;font-weight:800;color:#D97706}
.product-btn{background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;font-size:9px;font-weight:700;padding:5px 12px;border-radius:8px;cursor:pointer}
.stats{display:flex;justify-content:center;gap:32px;padding:14px 28px;background:#fff;border-top:1px solid #F5F0EB}
.stat{text-align:center}
.stat-val{font-size:18px;font-weight:800;color:#D97706;letter-spacing:-0.02em}
.stat-lbl{font-size:8px;color:#A8A29E;text-transform:uppercase;letter-spacing:0.1em;margin-top:1px;font-weight:600}
</style></head><body>
<nav><div class="logo"><div class="logo-mark">S</div><span>Savorly</span></div><div class="nav-r"><span class="nav-pill">Menu</span><span class="nav-pill">About</span><span class="nav-pill">Catering</span><div class="nav-cart">&#128722; 3 items</div><button class="nav-cta">Order Now</button></div></nav>
<div class="hero"><div class="hero-tag">&#127860; Free delivery on orders over $40</div><h1>Gourmet Meals<br><span class="warm">Delivered Fresh</span></h1><p>Chef-crafted dishes made with locally sourced ingredients. From our kitchen to your door in under 30 minutes.</p><div class="hero-btns"><button class="btn-warm">Browse Menu</button><button class="btn-outline">Gift Cards</button></div></div>
<div class="products">
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A)"><span class="product-badge">BESTSELLER</span></div><div class="product-body"><div class="product-name">Truffle Wagyu Burger</div><div class="product-desc">A5 wagyu patty, truffle aioli, aged gruyere, brioche bun</div><div class="product-row"><span class="product-price">$28</span><button class="product-btn">Add to Cart</button></div></div></div>
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#DCFCE7,#BBF7D0)"><span class="product-badge" style="background:#16A34A">NEW</span></div><div class="product-body"><div class="product-name">Miso Glazed Salmon</div><div class="product-desc">Wild-caught salmon, white miso, pickled ginger, jasmine rice</div><div class="product-row"><span class="product-price">$34</span><button class="product-btn">Add to Cart</button></div></div></div>
<div class="product"><div class="product-img" style="background:linear-gradient(135deg,#FEE2E2,#FECACA)"></div><div class="product-body"><div class="product-name">Berry Panna Cotta</div><div class="product-desc">Vanilla bean panna cotta, mixed berry compote, mint</div><div class="product-row"><span class="product-price">$16</span><button class="product-btn">Add to Cart</button></div></div></div>
</div>
<div class="stats"><div class="stat"><div class="stat-val">4.9 &#9733;</div><div class="stat-lbl">Rating</div></div><div class="stat"><div class="stat-val">12K+</div><div class="stat-lbl">Orders/mo</div></div><div class="stat"><div class="stat-val">28 min</div><div class="stat-lbl">Avg Delivery</div></div><div class="stat"><div class="stat-val">100%</div><div class="stat-lbl">Fresh Guarantee</div></div></div>
</body></html>`,
  },
  {
    prompt: "Create a project management SaaS dashboard with team analytics, red accent theme on clean white background",
    slug: "launchpad-io",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
body{font-family:Inter,system-ui,sans-serif;background:#FAFAFA;color:#18181B;overflow:hidden}
nav{padding:12px 28px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #F1F1F4;box-shadow:0 1px 4px rgba(0,0,0,0.03)}
.logo{display:flex;align-items:center;gap:8px}
.logo-mark{width:28px;height:28px;background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;box-shadow:0 2px 10px rgba(220,38,38,0.25)}
.logo span{font-weight:800;font-size:15px;letter-spacing:-0.02em;color:#18181B}
.nav-r{display:flex;align-items:center;gap:14px}
.nav-pill{font-size:11px;color:#71717A;font-weight:500}
.nav-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#DC2626,#F59E0B);border:2px solid #fff;box-shadow:0 0 0 1px #E4E4E7}
.nav-cta{background:#DC2626;border:none;color:#fff;padding:7px 16px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(220,38,38,0.2)}
.dash{padding:20px 28px 14px}
.dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.dash-header h1{font-size:22px;font-weight:800;letter-spacing:-0.02em}
.dash-header .date{font-size:11px;color:#A1A1AA;font-weight:500}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.m-card{background:#fff;border-radius:12px;padding:14px;border:1px solid #F1F1F4;box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.m-label{font-size:9px;color:#A1A1AA;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:4px}
.m-val{font-size:22px;font-weight:800;letter-spacing:-0.02em}
.m-val.red{color:#DC2626}
.m-val.green{color:#16A34A}
.m-val.blue{color:#2563EB}
.m-val.amber{color:#D97706}
.m-change{font-size:9px;font-weight:600;margin-top:2px}
.m-change.up{color:#16A34A}
.m-change.down{color:#DC2626}
.panels{display:grid;grid-template-columns:1.6fr 1fr;gap:10px}
.panel{background:#fff;border-radius:12px;padding:14px;border:1px solid #F1F1F4}
.panel-title{font-size:11px;font-weight:700;color:#18181B;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.panel-title .badge{background:#FEE2E2;color:#DC2626;font-size:8px;font-weight:700;padding:3px 8px;border-radius:6px}
.task{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #FAFAFA}
.task:last-child{border-bottom:none}
.task-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.task-name{font-size:10px;font-weight:600;color:#3F3F46;flex:1}
.task-status{font-size:8px;font-weight:700;padding:2px 8px;border-radius:6px}
.task-status.done{background:#DCFCE7;color:#16A34A}
.task-status.prog{background:#FEF3C7;color:#D97706}
.task-status.todo{background:#F1F1F4;color:#71717A}
.member{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #FAFAFA}
.member:last-child{border-bottom:none}
.member-av{width:24px;height:24px;border-radius:50%;flex-shrink:0}
.member-info{flex:1}
.member-name{font-size:10px;font-weight:700;color:#18181B}
.member-role{font-size:8px;color:#A1A1AA}
.member-tasks{font-size:9px;font-weight:700;color:#DC2626}
</style></head><body>
<nav><div class="logo"><div class="logo-mark">L</div><span>Launchpad</span></div><div class="nav-r"><span class="nav-pill">Projects</span><span class="nav-pill">Timeline</span><span class="nav-pill">Reports</span><button class="nav-cta">+ New Project</button><div class="nav-avatar"></div></div></nav>
<div class="dash"><div class="dash-header"><h1>Sprint Dashboard</h1><div class="date">March 2026 &bull; Sprint 14</div></div>
<div class="metrics"><div class="m-card"><div class="m-label">Active Tasks</div><div class="m-val red">47</div><div class="m-change up">&#9650; 12% vs last sprint</div></div><div class="m-card"><div class="m-label">Completed</div><div class="m-val green">128</div><div class="m-change up">&#9650; 24% this week</div></div><div class="m-card"><div class="m-label">Team Velocity</div><div class="m-val blue">94</div><div class="m-change up">&#9650; 8 pts improvement</div></div><div class="m-card"><div class="m-label">On-time Rate</div><div class="m-val amber">96%</div><div class="m-change up">&#9650; Best quarter yet</div></div></div>
<div class="panels"><div class="panel"><div class="panel-title">Current Sprint Tasks <span class="badge">5 due today</span></div><div class="task"><div class="task-dot" style="background:#DC2626"></div><div class="task-name">API authentication refactor</div><span class="task-status prog">In Progress</span></div><div class="task"><div class="task-dot" style="background:#16A34A"></div><div class="task-name">User dashboard redesign</div><span class="task-status done">Complete</span></div><div class="task"><div class="task-dot" style="background:#D97706"></div><div class="task-name">Payment webhook integration</div><span class="task-status prog">In Progress</span></div><div class="task"><div class="task-dot" style="background:#2563EB"></div><div class="task-name">Mobile responsive overhaul</div><span class="task-status todo">To Do</span></div><div class="task"><div class="task-dot" style="background:#16A34A"></div><div class="task-name">E2E test coverage expansion</div><span class="task-status done">Complete</span></div></div>
<div class="panel"><div class="panel-title">Team</div><div class="member"><div class="member-av" style="background:linear-gradient(135deg,#DC2626,#F59E0B)"></div><div class="member-info"><div class="member-name">Sarah Chen</div><div class="member-role">Lead Engineer</div></div><div class="member-tasks">12 tasks</div></div><div class="member"><div class="member-av" style="background:linear-gradient(135deg,#2563EB,#7C3AED)"></div><div class="member-info"><div class="member-name">Marcus Reid</div><div class="member-role">Full Stack Dev</div></div><div class="member-tasks">9 tasks</div></div><div class="member"><div class="member-av" style="background:linear-gradient(135deg,#16A34A,#2DD4BF)"></div><div class="member-info"><div class="member-name">Aiko Tanaka</div><div class="member-role">UI Designer</div></div><div class="member-tasks">7 tasks</div></div><div class="member"><div class="member-av" style="background:linear-gradient(135deg,#F59E0B,#EF4444)"></div><div class="member-info"><div class="member-name">James Park</div><div class="member-role">Backend Dev</div></div><div class="member-tasks">11 tasks</div></div></div></div></div>
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
