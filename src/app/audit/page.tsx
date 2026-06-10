"use client";

/**
 * /audit — AI Site Audit Agent (Sprint 3 T1).
 *
 * Companion to /upgrade. Where /upgrade is rebuild-first ("paste URL,
 * we'll rebuild it"), /audit is report-first ("paste URL, here's
 * what's wrong"). Targets the high-volume "free website audit AI"
 * search intent.
 *
 * Report layout:
 *   - Overall score (0-100) — single big number, color-coded
 *   - 4 category cards: performance, SEO, accessibility, conversion
 *     each with: score, ✓ passed checks, ✗ failed checks
 *   - "Rebuild with these fixes" CTA → /builder with prefilled prompt
 *   - "Run another audit" / "Open builder" secondary actions
 */

import { useState } from "react";
import Link from "next/link";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";
import {
  ArrowRight,
  Globe2,
  Loader2,
  AlertCircle,
  Check,
  X,
  Zap,
  Search,
  ShieldCheck,
  Target,
  Sparkles,
} from "lucide-react";

interface CategoryScore {
  category: "performance" | "seo" | "accessibility" | "conversion";
  label: string;
  score: number;
  passed: string[];
  failed: string[];
}

interface AuditReport {
  overall: number;
  categories: CategoryScore[];
  extraction: {
    finalUrl: string;
    title: string | null;
    inferredIndustry: string | null;
    detectedStack: string[];
  };
}

interface AuditResponse {
  ok: boolean;
  report?: AuditReport;
  builderHref?: string;
  error?: string;
}

const CATEGORY_ICONS = {
  performance: Zap,
  seo: Search,
  accessibility: ShieldCheck,
  conversion: Target,
};

function scoreColor(score: number): { bg: string; text: string; ring: string } {
  if (score >= 80) return { bg: "rgba(16,185,129,0.08)", text: "rgb(5,122,85)", ring: "rgba(16,185,129,0.35)" };
  if (score >= 60) return { bg: "var(--gold-soft)", text: "var(--gold-deep)", ring: "var(--gold)" };
  return { bg: "rgba(239,68,68,0.06)", text: "rgb(220,38,38)", ring: "rgba(239,68,68,0.3)" };
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as AuditResponse;
      if (!data.ok || !data.report) {
        throw new Error(data.error || "Audit failed");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const report = result?.report;
  const overallColors = report ? scoreColor(report.overall) : null;

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> Free AI site audit
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            Paste your URL.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              Get a real audit in 10 seconds.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            We score your existing site across performance, SEO, accessibility, and conversion.
            Every failing check is something we can fix when we rebuild it for you.
          </p>
        </header>

        {/* URL input */}
        <form onSubmit={run} className="mb-8">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: "var(--paper-elevated)",
              border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "var(--rule-strong)"}`,
            }}
          >
            <Globe2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold-deep)" }} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-existing-site.com"
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-[16px]"
              style={{ color: "var(--ink)" }}
            />
            {/* T5: voice input — speak the URL */}
            <VoiceToBuildButton
              size="sm"
              onTranscript={(text) => setUrl(text.trim())}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
                boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Auditing…" : "Audit"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "rgb(220, 38, 38)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            We read only public HTML. No cookies, no scraping logged-in pages.
          </p>
        </form>

        {/* Report */}
        {report && overallColors && (
          <>
            {/* Overall score card */}
            <section
              className="rounded-2xl p-8 mb-8 flex flex-col sm:flex-row sm:items-center gap-6"
              style={{
                background: overallColors.bg,
                border: `1px solid ${overallColors.ring}`,
              }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--paper)",
                    border: `3px solid ${overallColors.ring}`,
                  }}
                >
                  <span className="text-3xl font-semibold tracking-tight" style={{ color: overallColors.text }}>
                    {report.overall}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-1" style={{ color: overallColors.text }}>
                    Overall score
                  </div>
                  <div className="text-[18px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
                    {report.extraction.title || report.extraction.finalUrl}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--ink-secondary)" }}>
                    {report.extraction.inferredIndustry || "Industry not detected"}
                    {report.extraction.detectedStack.length > 0 &&
                      ` · ${report.extraction.detectedStack.join(" · ")}`}
                  </div>
                </div>
              </div>
              {result?.builderHref && (
                <Link
                  href={result.builderHref}
                  className="ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: "var(--ink)",
                    color: "var(--paper)",
                  }}
                >
                  Rebuild with these fixes
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </section>

            {/* Per-category cards */}
            <section className="grid sm:grid-cols-2 gap-4 mb-12">
              {report.categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.category];
                const colors = scoreColor(cat.score);
                return (
                  <div
                    key={cat.category}
                    className="rounded-xl p-5"
                    style={{
                      background: "var(--paper-elevated)",
                      border: "1px solid var(--rule)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
                        <span className="text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                          {cat.label}
                        </span>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-[12px] font-semibold tabular-nums"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.ring}` }}
                      >
                        {cat.score}/100
                      </span>
                    </div>

                    {cat.passed.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {cat.passed.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                            <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "rgb(5,122,85)" }} />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {cat.failed.length > 0 && (
                      <ul className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--rule)" }}>
                        {cat.failed.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--ink)" }}>
                            <X className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "rgb(220,38,38)" }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Final CTA */}
            <section
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--gold)",
              }}
            >
              <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">Every failing check is a fix on the rebuild.</h2>
              <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
                The Zoobicon builder rebuilds your site in 60 seconds with WCAG AA contrast, semantic HTML, JSON-LD schema, mobile-first responsive layout, and conversion-tuned sections — all enforced by the agent quality contract.
              </p>
              {result?.builderHref && (
                <Link
                  href={result.builderHref}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                    color: "#ffffff",
                    border: "1px solid #a47d2c",
                    boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                  }}
                >
                  Rebuild it
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </section>
          </>
        )}

        {/* Pre-audit marketing */}
        {!result && !loading && (
          <section className="mt-12 grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Zap,
                title: "Performance",
                body: "HTML weight · server-rendering check · modern stack detection · static-deploy capability.",
              },
              {
                icon: Search,
                title: "SEO",
                body: "Title · meta description · Open Graph · heading hierarchy · structured data.",
              },
              {
                icon: ShieldCheck,
                title: "Accessibility",
                body: "Language tag · semantic landmarks · heading structure · favicon · logo.",
              },
              {
                icon: Target,
                title: "Conversion",
                body: "Pricing section · testimonials · FAQ · contact form · features · CTA hero.",
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="rounded-xl p-5"
                  style={{
                    background: "var(--paper-elevated)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  <Icon className="w-5 h-5 mb-3" style={{ color: "var(--gold-deep)" }} />
                  <h3 className="text-[14px] font-semibold mb-2" style={{ color: "var(--ink)" }}>
                    {c.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                    {c.body}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        {/* Cross-link */}
        <div className="mt-12 text-center">
          <Link href="/upgrade" className="text-[13px] underline" style={{ color: "var(--ink-muted)" }}>
            Or skip the audit — go straight to URL clone-and-upgrade →
          </Link>
        </div>
      </div>
    </main>
  );
}
