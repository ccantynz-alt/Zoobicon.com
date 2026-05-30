"use client";

/**
 * /upgrade — URL clone-and-upgrade onboarding.
 *
 * Highest-intent funnel in the Zoobicon catalog: visitor pastes their
 * existing site URL, we extract brand signals, show them a "we
 * noticed X" list of improvements, and prefill the builder with a
 * rich prompt that primes the modernized regeneration.
 *
 * Rule 33 architectural pattern: Zoobicon owns the UI + analysis;
 * Crontech owns hosting + domain provisioning at deploy time via
 * its own API. The "Deploy via Crontech" CTA at the end of the
 * builder flow calls /api/crontech/projects (existing endpoint
 * shipped in RECENTLY FIXED #33) — the user never leaves zoobicon.com.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  Zap,
  Palette,
  Type,
  Layers,
  TrendingUp,
} from "lucide-react";

interface Extraction {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  primaryHeading: string | null;
  secondaryHeadings: string[];
  brandColors: string[];
  fonts: string[];
  detectedSections: string[];
  wordCount: number;
  inferredIndustry: string | null;
  logoUrl: string | null;
  ogImage: string | null;
  detectedStack: string[];
  improvementOpportunities: string[];
  isThinHtml: boolean;
  htmlBytes: number;
}

interface AnalyzeResponse {
  ok: boolean;
  extraction?: Extraction;
  prompt?: string;
  builderHref?: string;
  error?: string;
}

export default function UpgradePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const analyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/upgrade/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!data.ok || !data.extraction) {
        throw new Error(data.error || "Couldn't analyze that URL");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const buildNow = () => {
    if (!result?.builderHref) return;
    router.push(result.builderHref);
  };

  const x = result?.extraction;

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> Upgrade my site
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            Paste your URL.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              Get a 2026 version of your site.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            We analyze your existing site, pull out your brand, your sections, and your story,
            then six AI agents rebuild it as a modern React app in 60 seconds. Hosting + domain
            stay on the same custom URL via Crontech&apos;s API.
          </p>
        </header>

        {/* URL input */}
        <form onSubmit={analyze} className="mb-8">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-colors"
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
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
                boxShadow: "0 6px 18px -8px rgba(140,107,37,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "rgb(220, 38, 38)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            We only read the public HTML of the page. Nothing is stored. SPA-heavy sites with
            empty initial HTML extract poorly — try a content-rich landing page first.
          </p>
        </form>

        {/* Analysis result */}
        {x && (
          <>
            {/* Summary card */}
            <section
              className="rounded-2xl p-6 mb-8"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--gold)",
              }}
            >
              <div className="flex items-start gap-4 flex-wrap">
                {x.ogImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={x.ogImage}
                    alt=""
                    className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                    style={{ border: "1px solid var(--rule)" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-1.5"
                    style={{ color: "var(--gold-deep)" }}
                  >
                    What we found
                  </div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] mb-1" style={{ color: "var(--ink)" }}>
                    {x.title || x.finalUrl}
                  </h2>
                  {x.description && (
                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--ink-secondary)" }}>
                      {x.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {x.inferredIndustry && (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--gold-soft)",
                          color: "var(--gold-deep)",
                          border: "1px solid var(--gold)",
                        }}
                      >
                        {x.inferredIndustry}
                      </span>
                    )}
                    {x.detectedStack.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--paper)",
                          color: "var(--ink-secondary)",
                          border: "1px solid var(--rule)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    <span className="font-mono" style={{ color: "var(--ink-muted)" }}>
                      {(x.htmlBytes / 1024).toFixed(0)} KB · {x.wordCount} words
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Grid: brand colors / fonts / sections */}
            <section className="grid sm:grid-cols-3 gap-4 mb-8">
              {/* Brand colors */}
              <div className="rounded-xl p-5" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--gold-deep)" }}>
                    Brand colors
                  </span>
                </div>
                {x.brandColors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {x.brandColors.map((c) => (
                      <div key={c} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded" style={{ background: c, border: "1px solid var(--rule)" }} />
                        <span className="text-[10px] font-mono" style={{ color: "var(--ink-secondary)" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>None detected — we&apos;ll pick a palette.</p>
                )}
              </div>

              {/* Fonts */}
              <div className="rounded-xl p-5" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--gold-deep)" }}>
                    Typography
                  </span>
                </div>
                {x.fonts.length > 0 ? (
                  <ul className="space-y-1">
                    {x.fonts.map((f) => (
                      <li key={f} className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>None detected — we&apos;ll pair fonts.</p>
                )}
              </div>

              {/* Sections */}
              <div className="rounded-xl p-5" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--gold-deep)" }}>
                    Sections found
                  </span>
                </div>
                {x.detectedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {x.detectedSections.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: "var(--paper)",
                          color: "var(--ink-secondary)",
                          border: "1px solid var(--rule)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>Thin extraction — SPA likely.</p>
                )}
              </div>
            </section>

            {/* Improvements */}
            {x.improvementOpportunities.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" style={{ color: "var(--gold-deep)" }} />
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em]">
                    What we&apos;ll improve in the rebuild
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {x.improvementOpportunities.map((op) => (
                    <li
                      key={op}
                      className="flex gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: "var(--paper-elevated)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                      <span className="text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>{op}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* CTA */}
            <section
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--gold)",
              }}
            >
              <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
                Ready for the 2026 version?
              </h2>
              <p className="text-[14px] mb-2" style={{ color: "var(--ink-secondary)" }}>
                Six agents rebuild your site in 60 seconds. Same brand, modernized stack.
              </p>
              <p className="text-[12px] mb-5" style={{ color: "var(--ink-muted)" }}>
                After the build, deploy via Crontech&apos;s API — hosting + domain provisioned without leaving Zoobicon.
              </p>
              <button
                onClick={buildNow}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
                  color: "#ffffff",
                  border: "1px solid #a47d2c",
                  boxShadow: "0 6px 18px -8px rgba(140,107,37,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                Build the modernized version
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </>
        )}

        {/* Marketing block (only shown before analysis) */}
        {!result && !loading && (
          <section className="mt-16">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: "Honest analysis",
                  body: "We read your public HTML and tell you exactly what we found — brand colors, fonts, sections, even your current tech stack.",
                },
                {
                  icon: Sparkles,
                  title: "Brand-preserving rebuild",
                  body: "The modernized version keeps your colors, voice, and section structure. We change the build, not your identity.",
                },
                {
                  icon: Globe2,
                  title: "API-driven deploy",
                  body: "When you ship, Zoobicon calls Crontech&apos;s project API to provision hosting and domains. Two platforms, one user flow.",
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
                      {c.body.replace(/&apos;/g, "'")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/builder"
                className="text-[13px] underline"
                style={{ color: "var(--ink-muted)" }}
              >
                Or skip — describe a site from scratch →
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
