"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  Scale,
  FileCheck,
  AlertTriangle,
  Zap,
  Brain,
  FileText,
  Users,
  Building2,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  BadgeCheck,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const JURISDICTIONS = [
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "United States", thresholds: "H-1B, O-1, EB-2 NIW, L-1", color: "from-blue-500 to-blue-700" },
  { code: "UK", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", thresholds: "Skilled Worker, GBM, Global Talent", color: "from-red-500 to-red-700" },
  { code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australia", thresholds: "SID Core, SID Specialist, 186 ENS", color: "from-yellow-500 to-yellow-700" },
  { code: "NZ", flag: "\u{1F1F3}\u{1F1FF}", name: "New Zealand", thresholds: "AEWV, SMC Residence, Work to Residence", color: "from-emerald-500 to-emerald-700" },
];

const AGENTS = [
  { name: "Cross-Border Ghost", icon: Globe, desc: "4 concurrent jurisdiction checks from one profile. Instant conflict-of-law detection.", color: "text-blue-400" },
  { name: "RFE Pre-emptor", icon: Shield, desc: "Mirrors USCIS Evidence Classifier logic. Catches document weaknesses before you file.", color: "text-red-400" },
  { name: "Live-Law Syncer", icon: Zap, desc: "Real-time regulatory updates from government gazettes across all 4 jurisdictions.", color: "text-yellow-400" },
  { name: "Evidence Generator", icon: FileText, desc: "AI-drafted legal letters with jurisdiction-specific citations and 2026 compliance.", color: "text-green-400" },
  { name: "Audit Trail Reporter", icon: Eye, desc: "EU AI Act compliant reasoning trails. Every decision cited and explainable.", color: "text-purple-400" },
];

const FEATURES = [
  { title: "Anti-RFE Shield", desc: "Our AI runs the same classification logic as USCIS to flag \"unreadable\" evidence before you submit.", icon: Shield },
  { title: "Wage Compliance Engine", desc: "UK per-pay-period auditing, NZ median wage lock tracking, AU TSMIT indexation monitoring.", icon: Scale },
  { title: "EB-2 NIW Analyzer", desc: "Dhanasar three-prong analysis with NIST AI RMF alignment checking and specificity scoring.", icon: Brain },
  { title: "O-1 Criteria Scanner", desc: "Extraordinary ability threshold analysis with adjudicator fatigue trigger detection.", icon: Sparkles },
  { title: "Sponsor Health Monitor", desc: "Real-time licence status, STP payroll matching, eVisa share code vault, dead time prevention.", icon: Building2 },
  { title: "Smart Intake", desc: "Drop a CV or LinkedIn profile. AI maps it to visa categories across all 4 countries in seconds.", icon: FileCheck },
  { title: "Decision-Ready Accelerator", desc: "Pre-check agent verifies Health, Character, and experience against AU \"Decision-Ready\" standards.", icon: BadgeCheck },
  { title: "Predictive Compliance", desc: "\"If you pay this person this much in June, you will trigger an audit in July.\"", icon: AlertTriangle },
];

const COMPETITORS = [
  { name: "Fragomen", weakness: "Slow (5-6 week petitions)", ours: "Decision-ready in days" },
  { name: "Alma", weakness: "US-only (O-1/H-1B)", ours: "Native 4-country logic" },
  { name: "Docketwise", weakness: "No AU/NZ/UK compliance", ours: "Global Passport view" },
  { name: "Envoy Global", weakness: "Database, not AI-native", ours: "Adversarial AI auditing" },
];

const PRICING = [
  {
    name: "Boutique",
    price: "$1,000",
    period: "/mo",
    target: "Small firms (1-5 lawyers)",
    features: ["Up to 20 audit-ready filings/mo", "4-jurisdiction assessment", "Smart Intake (CV parser)", "Evidence letter generation", "Regulatory update alerts"],
  },
  {
    name: "Professional",
    price: "$3,500",
    period: "/mo",
    target: "Mid-market firms",
    popular: true,
    features: ["Unlimited filings", "Anti-RFE Shield (USCIS Mirror)", "EB-2 NIW + O-1 analyzers", "Sponsor payroll sentinel (UK/AU)", "eVisa share code vault", "Priority processing advisor", "EU AI Act audit reports"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    target: "Multinational corps & large firms",
    features: ["Everything in Professional", "Unlimited users + API access", "Real-time HR payroll integration", "Custom jurisdiction rules", "White-label deployment", "Dedicated compliance officer", "SLA-backed uptime guarantee"],
  },
];

export default function ImmigrationPage() {
  const [activeJurisdiction, setActiveJurisdiction] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      <BackgroundEffects />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-400" />
            <span className="text-xl font-bold">Zoobicon <span className="text-blue-400">Immigration</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#agents" className="hover:text-white transition">AI Agents</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <Link href="/immigration/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition">
              Launch Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Zap className="w-4 h-4" />
            Global Mobility Compliance Engine — 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Immigration Law<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Treated as Code
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
          >
            One candidate. Four countries. Instant compliance assessment. The AI that mirrors government rejection engines so you never file a losing petition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/immigration/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-500/25"
            >
              Start Assessing <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-white/10 hover:border-white/20 rounded-xl text-lg text-gray-300 hover:text-white transition"
            >
              See Features
            </a>
          </motion.div>

          {/* Jurisdiction Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {JURISDICTIONS.map((j, i) => (
              <button
                key={j.code}
                onClick={() => setActiveJurisdiction(i)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  activeJurisdiction === i
                    ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <span className="text-3xl">{j.flag}</span>
                <h3 className="text-sm font-semibold mt-2">{j.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{j.thresholds}</p>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Jurisdictions", value: "4", sub: "US, UK, AU, NZ" },
            { label: "Visa Categories", value: "12+", sub: "Work, Skilled, Talent" },
            { label: "Compliance Checks", value: "50+", sub: "Per assessment" },
            { label: "Assessment Time", value: "<10s", sub: "All 4 countries" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm font-medium text-gray-300 mt-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5 AI Agents */}
      <section id="agents" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">5 Autonomous AI Agents</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 max-w-2xl mx-auto">
              Each agent specializes in a critical compliance domain. They run concurrently, share intelligence, and produce audit-proof reasoning trails.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-5 gap-4">
            {AGENTS.map((agent) => (
              <motion.div key={agent.name} variants={fadeUp} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all group">
                <agent.icon className={`w-8 h-8 ${agent.color} mb-4`} />
                <h3 className="font-semibold text-white mb-2">{agent.name}</h3>
                <p className="text-sm text-gray-400">{agent.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">Features That Smash the Competition</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 max-w-2xl mx-auto">
              Not a form-filler. A Compliance Engine that uses AI to defeat the government&apos;s AI.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:border-blue-500/20 hover:bg-blue-500/5 transition-all group">
                <feature.icon className="w-8 h-8 text-blue-400 mb-4 group-hover:text-blue-300 transition" />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competitor Table */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-center mb-4">Why We Win</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-center max-w-xl mx-auto mb-12">
              Every competitor has a gap. We exploit all of them simultaneously.
            </motion.p>

            <motion.div variants={fadeUp} className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-gray-300">
                    <th className="text-left p-4 font-medium">Competitor</th>
                    <th className="text-left p-4 font-medium">Their Weakness</th>
                    <th className="text-left p-4 font-medium">Our Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map((c) => (
                    <tr key={c.name} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-white">{c.name}</td>
                      <td className="p-4 text-red-400">{c.weakness}</td>
                      <td className="p-4 text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        {c.ours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Explainable AI Section */}
      <section className="relative z-10 py-24 px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
                Explainable AI.<br />
                <span className="text-blue-400">Not a Black Box.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-400 mb-6">
                Under the EU AI Act, immigration AI is classified as &quot;high-risk.&quot; Every decision must be transparent, every recommendation cited. Our Reasoning Trail engine provides:
              </motion.p>
              <motion.ul variants={stagger} className="space-y-3">
                {[
                  "Citation to specific legislation (INA, UK Rules, Migration Act, Immigration Act)",
                  "Step-by-step reasoning for every eligibility check",
                  "Conflict-of-law detection between jurisdictions",
                  "Human oversight markers per EU AI Act Article 14",
                  "Bias assessment certification per Article 10(2)(f)",
                ].map((item) => (
                  <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-gray-300">
                    <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <motion.div variants={fadeUp} className="bg-[#0f1019] rounded-xl border border-white/10 p-6 font-mono text-sm">
              <div className="text-gray-500 mb-4">// Reasoning Trail — Sample Output</div>
              <div className="space-y-3">
                <div>
                  <span className="text-emerald-400">[PASS]</span>
                  <span className="text-white ml-2">Occupation Eligibility</span>
                  <p className="text-gray-500 ml-6 text-xs mt-1">&quot;Software Engineer&quot; maps to SOC 15-1252 (US), SOC 2134 (UK), ANZSCO 261313 (AU), NOL-ICT-2134 (NZ)</p>
                </div>
                <div>
                  <span className="text-emerald-400">[PASS]</span>
                  <span className="text-white ml-2">Wage Threshold</span>
                  <p className="text-gray-500 ml-6 text-xs mt-1">USD $95,000 meets Level 2 prevailing wage. Citation: INA &sect;212(n)(1); 20 CFR &sect;655.731</p>
                </div>
                <div>
                  <span className="text-yellow-400">[WARN]</span>
                  <span className="text-white ml-2">NZ Median Wage Lock</span>
                  <p className="text-gray-500 ml-6 text-xs mt-1">Lock date: 2026-03-18 at NZD $35.00/hr. Valid for 5 years. Citation: Immigration Act 2009 s49; SMC Operational Manual SM4</p>
                </div>
                <div>
                  <span className="text-blue-400">[INFO]</span>
                  <span className="text-white ml-2">EU AI Act Compliance</span>
                  <p className="text-gray-500 ml-6 text-xs mt-1">High-risk classification. Human oversight required. Transparency met. Bias check passed.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">Pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400">Access + Consumption. Predictable costs, unlimited compliance.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`p-8 rounded-xl border ${
                  plan.popular
                    ? "border-blue-500/50 bg-blue-500/5 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20"
                    : "border-white/10 bg-white/[0.02]"
                } relative`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.target}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/immigration/dashboard"
                  className={`block w-full text-center py-3 rounded-lg font-medium transition ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent to-blue-500/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Global Mobility is Broken.<br />We Just Fixed the Code.</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Stop paying for 5-week human reviews. Start filing decision-ready petitions in days.
          </p>
          <Link
            href="/immigration/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-500/25"
          >
            Launch Compliance Engine <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>&copy; {new Date().getFullYear()} Zoobicon Immigration. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/support" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
