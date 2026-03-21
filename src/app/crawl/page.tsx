"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Search,
  Globe,
  Code2,
  Layers,
  Palette,
  Type,
  Shield,
  BarChart3,
  Eye,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ExternalLink,
  Cpu,
  MessageSquare,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronRight,
  Copy,
  Sparkles,
} from "lucide-react";

interface TechItem {
  name: string;
  category: string;
  confidence: string;
}

interface CrawlResult {
  url: string;
  mode: string;
  fetchDuration: number;
  techStack: TechItem[];
  features: string[];
  meta: Record<string, string>;
  colors: string[];
  fonts: string[];
  htmlSize: number;
  aiAnalysis?: {
    summary?: string;
    positioning?: {
      targetAudience?: string;
      valueProposition?: string;
      pricePosition?: string;
      tone?: string;
    };
    designAnalysis?: {
      layout?: string;
      heroStyle?: string;
      visualIdentity?: string;
      strengths?: string[];
      weaknesses?: string[];
    };
    contentStrategy?: {
      messagingApproach?: string;
      ctaStrategy?: string;
      socialProof?: string;
      contentGaps?: string[];
    };
    competitiveInsights?: {
      uniqueAdvantages?: string[];
      vulnerabilities?: string[];
      opportunities?: string[];
      threats?: string[];
    };
    recommendations?: string[];
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Framework: <Code2 className="w-3.5 h-3.5" />,
  CMS: <Layers className="w-3.5 h-3.5" />,
  CSS: <Palette className="w-3.5 h-3.5" />,
  Analytics: <BarChart3 className="w-3.5 h-3.5" />,
  Hosting: <Globe className="w-3.5 h-3.5" />,
  CDN: <Globe className="w-3.5 h-3.5" />,
  Auth: <Lock className="w-3.5 h-3.5" />,
  Payments: <CreditCard className="w-3.5 h-3.5" />,
  Chat: <MessageSquare className="w-3.5 h-3.5" />,
  Email: <MessageSquare className="w-3.5 h-3.5" />,
  Library: <Code2 className="w-3.5 h-3.5" />,
  Animation: <Sparkles className="w-3.5 h-3.5" />,
  "3D": <Cpu className="w-3.5 h-3.5" />,
  Monitoring: <Shield className="w-3.5 h-3.5" />,
  Search: <Search className="w-3.5 h-3.5" />,
  Fonts: <Type className="w-3.5 h-3.5" />,
  Icons: <Layers className="w-3.5 h-3.5" />,
  Security: <Shield className="w-3.5 h-3.5" />,
  "Feature Flags": <Target className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Framework: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  CMS: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  CSS: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  Analytics: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Hosting: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  CDN: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Auth: "text-red-400 bg-red-500/10 border-red-500/20",
  Payments: "text-green-400 bg-green-500/10 border-green-500/20",
  Chat: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  Email: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  Library: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  Animation: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "3D": "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  Monitoring: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Search: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  Fonts: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  Icons: "text-lime-400 bg-lime-500/10 border-lime-500/20",
  Security: "text-red-400 bg-red-500/10 border-red-500/20",
  "Feature Flags": "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

function Collapsible({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white/50">{icon}</span>
          <span className="text-sm font-semibold text-white/80">{title}</span>
          {badge !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CrawlPage() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"quick" | "deep">("deep");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCrawl = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed (HTTP ${res.status})`);
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const groupedTech = result?.techStack.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, TechItem[]>
  );

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/50">/</span>
            <span className="text-sm text-white/65">Intelligent Crawler</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/seo" className="text-sm text-white/50 hover:text-white/70 transition-colors">
              SEO Agent
            </Link>
            <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              Builder
            </Link>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="relative">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-400 text-sm font-medium mb-6">
            <Eye className="w-3.5 h-3.5" />
            Competitive Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Intelligent Crawler
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Enter any URL. We&apos;ll detect their tech stack, analyze their design,
            and find vulnerabilities you can exploit.
          </p>
        </motion.div>
        </section>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                placeholder="competitor.com"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.07] border border-white/[0.12] rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-brand-500/30 text-base"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] rounded-xl px-3">
              <button
                onClick={() => setMode("quick")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  mode === "quick"
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/50 hover:text-white/60"
                }`}
              >
                Quick
              </button>
              <button
                onClick={() => setMode("deep")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  mode === "deep"
                    ? "bg-brand-500/20 text-brand-400 font-medium"
                    : "text-white/50 hover:text-white/60"
                }`}
              >
                Deep AI
              </button>
            </div>
            <button
              onClick={handleCrawl}
              disabled={!url.trim() || loading}
              className="btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Crawl
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-white/50">
            <span>Quick: tech stack + features only (~2s)</span>
            <span>Deep AI: full competitive analysis with Claude (~10s)</span>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 flex items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary header */}
            <div className="gradient-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-white hover:text-brand-400 transition-colors flex items-center gap-2"
                  >
                    {result.url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="w-4 h-4 text-white/50" />
                  </a>
                  {result.meta.title && (
                    <p className="text-sm text-white/50 mt-1">{result.meta.title}</p>
                  )}
                  {result.meta.description && (
                    <p className="text-xs text-white/50 mt-1 max-w-xl">{result.meta.description}</p>
                  )}
                </div>
                <div className="text-right text-xs text-white/50 space-y-1">
                  <div>{(result.htmlSize / 1024).toFixed(0)} KB HTML</div>
                  <div>{result.fetchDuration}ms fetch</div>
                  <div>{result.techStack.length} technologies</div>
                  <div>{result.features.length} features</div>
                </div>
              </div>

              {/* AI Summary */}
              {result.aiAnalysis?.summary && (
                <div className="p-4 rounded-lg bg-brand-500/5 border border-brand-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">AI Analysis</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{result.aiAnalysis.summary}</p>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg bg-white/[0.04]">
                  <div className="text-lg font-bold">{result.meta.wordCount || "?"}</div>
                  <div className="text-[10px] text-white/50">Words</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.04]">
                  <div className="text-lg font-bold">{result.meta.imageCount || "0"}</div>
                  <div className="text-[10px] text-white/50">Images</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.04]">
                  <div className="text-lg font-bold">{result.meta.linkCount || "0"}</div>
                  <div className="text-[10px] text-white/50">Links</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.04]">
                  <div className="text-lg font-bold">{result.meta.formCount || "0"}</div>
                  <div className="text-[10px] text-white/50">Forms</div>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <Collapsible
              title="Tech Stack"
              icon={<Cpu className="w-5 h-5" />}
              badge={result.techStack.length}
              defaultOpen
            >
              {groupedTech && Object.keys(groupedTech).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedTech).map(([category, techs]) => (
                    <div key={category}>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">{category}</div>
                      <div className="flex flex-wrap gap-2">
                        {techs.map((t) => (
                          <span
                            key={t.name}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
                              CATEGORY_COLORS[category] || "text-white/60 bg-white/5 border-white/10"
                            }`}
                          >
                            {CATEGORY_ICONS[category] || <Code2 className="w-3 h-3" />}
                            {t.name}
                            {t.confidence === "high" && (
                              <CheckCircle2 className="w-3 h-3 opacity-50" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No technologies detected — site may use server-rendered HTML with no identifiable frameworks.</p>
              )}
            </Collapsible>

            {/* Features */}
            <Collapsible
              title="Detected Features"
              icon={<Layers className="w-5 h-5" />}
              badge={result.features.length}
              defaultOpen
            >
              {result.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.features.map((f) => (
                    <span key={f} className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No standard features detected.</p>
              )}
            </Collapsible>

            {/* Design: Colors & Fonts */}
            <Collapsible title="Visual Identity" icon={<Palette className="w-5 h-5" />}>
              <div className="space-y-4">
                {result.colors.length > 0 && (
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Color Palette</div>
                    <div className="flex flex-wrap gap-2">
                      {result.colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => navigator.clipboard.writeText(c)}
                          className="group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] hover:border-white/20 transition-all"
                          title={`Click to copy: ${c}`}
                        >
                          <div
                            className="w-5 h-5 rounded border border-white/10"
                            style={{ backgroundColor: c }}
                          />
                          <span className="text-[10px] text-white/50 group-hover:text-white/70 font-mono">{c}</span>
                          <Copy className="w-2.5 h-2.5 text-white/50 group-hover:text-white/50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {result.fonts.length > 0 && (
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Typography</div>
                    <div className="flex flex-wrap gap-2">
                      {result.fonts.map((f) => (
                        <span key={f} className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Collapsible>

            {/* AI Deep Analysis sections */}
            {result.aiAnalysis?.positioning && (
              <Collapsible title="Market Positioning" icon={<Target className="w-5 h-5" />} defaultOpen>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Target Audience</div>
                    <p className="text-sm text-white/70">{result.aiAnalysis.positioning.targetAudience}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Value Proposition</div>
                    <p className="text-sm text-white/70">{result.aiAnalysis.positioning.valueProposition}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Price Position</div>
                    <p className="text-sm text-white/70 capitalize">{result.aiAnalysis.positioning.pricePosition}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Brand Tone</div>
                    <p className="text-sm text-white/70 capitalize">{result.aiAnalysis.positioning.tone}</p>
                  </div>
                </div>
              </Collapsible>
            )}

            {result.aiAnalysis?.designAnalysis && (
              <Collapsible title="Design Analysis" icon={<Eye className="w-5 h-5" />}>
                <div className="space-y-4">
                  {result.aiAnalysis.designAnalysis.layout && (
                    <div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Layout</div>
                      <p className="text-sm text-white/70">{result.aiAnalysis.designAnalysis.layout}</p>
                    </div>
                  )}
                  {result.aiAnalysis.designAnalysis.strengths && result.aiAnalysis.designAnalysis.strengths.length > 0 && (
                    <div>
                      <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-2">Strengths</div>
                      <ul className="space-y-1">
                        {result.aiAnalysis.designAnalysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/50 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiAnalysis.designAnalysis.weaknesses && result.aiAnalysis.designAnalysis.weaknesses.length > 0 && (
                    <div>
                      <div className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-2">Weaknesses</div>
                      <ul className="space-y-1">
                        {result.aiAnalysis.designAnalysis.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50 flex-shrink-0 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Collapsible>
            )}

            {result.aiAnalysis?.competitiveInsights && (
              <Collapsible title="Competitive Insights" icon={<Target className="w-5 h-5" />} defaultOpen>
                <div className="space-y-4">
                  {result.aiAnalysis.competitiveInsights.vulnerabilities && result.aiAnalysis.competitiveInsights.vulnerabilities.length > 0 && (
                    <div>
                      <div className="text-[10px] text-red-400/60 uppercase tracking-wider mb-2">Vulnerabilities to Exploit</div>
                      <ul className="space-y-1">
                        {result.aiAnalysis.competitiveInsights.vulnerabilities.map((v, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                            <Target className="w-3.5 h-3.5 text-red-400/50 flex-shrink-0 mt-0.5" />
                            {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiAnalysis.competitiveInsights.opportunities && result.aiAnalysis.competitiveInsights.opportunities.length > 0 && (
                    <div>
                      <div className="text-[10px] text-brand-400/60 uppercase tracking-wider mb-2">Opportunities</div>
                      <ul className="space-y-1">
                        {result.aiAnalysis.competitiveInsights.opportunities.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                            <Lightbulb className="w-3.5 h-3.5 text-brand-400/50 flex-shrink-0 mt-0.5" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Collapsible>
            )}

            {result.aiAnalysis?.recommendations && result.aiAnalysis.recommendations.length > 0 && (
              <Collapsible title="Actionable Recommendations" icon={<Lightbulb className="w-5 h-5" />} defaultOpen>
                <ol className="space-y-3">
                  {result.aiAnalysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0 text-xs text-brand-400 font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-white/70 leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ol>
              </Collapsible>
            )}

            {/* Action CTA */}
            <div className="gradient-border rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white/80 mb-1">Ready to build something better?</h3>
                <p className="text-xs text-white/50">
                  Use these insights to generate a site that outperforms this competitor.
                </p>
              </div>
              <Link
                href={`/builder?prompt=${encodeURIComponent(`Build a website that competes with ${result.url} — better design, stronger CTAs, faster performance`)}`}
                className="btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 whitespace-nowrap"
              >
                Build a Better Site
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
