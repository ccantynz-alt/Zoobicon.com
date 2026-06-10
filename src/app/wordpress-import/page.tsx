"use client";

/**
 * /wordpress-import — paste a WordPress site URL, see the structured
 * import preview, click "Modernize" to fire the builder with a
 * WordPress-aware prompt.
 *
 * Companion to /upgrade. Where /upgrade works on any URL via HTML
 * parsing, this page extracts richer structured data from sites that
 * have wp-json enabled (which is the WordPress default unless a
 * security plugin disabled it).
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Loader2,
  Sparkles,
  AlertCircle,
  FileText,
  Folder,
  Tag,
} from "lucide-react";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";

interface WordPressPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: string | null;
  categories: string[];
}

interface WordPressImport {
  ok: boolean;
  wpJsonAvailable: boolean;
  siteUrl: string;
  finalUrl: string;
  siteName: string | null;
  siteDescription: string | null;
  posts: WordPressPost[];
  pages: WordPressPost[];
  categories: string[];
  tags: string[];
  postCount: number;
  pageCount: number;
  reason?: string;
}

interface ImportResponse {
  ok: boolean;
  import?: WordPressImport;
  prompt?: string;
  builderHref?: string;
  reason?: string;
  fallback?: string;
  error?: string;
}

export default function WordPressImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/wordpress/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as ImportResponse;
      setResult(data);
      if (!data.ok && data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const imp = result?.import;
  const wpAvailable = imp?.wpJsonAvailable;

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> WordPress import
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            From WordPress.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              To 2026 React.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Paste your WordPress site URL. We pull your posts, pages, categories,
            and brand voice via wp-json, then rebuild it as a React app — modern
            stack, mobile-first, sub-second LCP. Hosting + custom domain provisioned
            via Vapron.
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
              placeholder="https://your-wordpress-site.com"
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-[16px]"
              style={{ color: "var(--ink)" }}
            />
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
              {loading ? "Importing…" : "Import"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "rgb(220, 38, 38)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            Reads only public wp-json data. No login required. Skipped if wp-json
            is disabled — we&apos;ll point you at the URL Clone-and-Upgrade flow.
          </p>
        </form>

        {/* wp-json unavailable fallback */}
        {result && !wpAvailable && (
          <section
            className="rounded-2xl p-6 mb-8 flex items-start gap-4"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule-strong)" }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
            <div>
              <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--ink)" }}>
                wp-json not available on this site
              </div>
              <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                {result.reason || "The site doesn't expose the WordPress REST API."}
              </p>
              <Link
                href={`/upgrade?url=${encodeURIComponent(url)}`}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                Try URL Clone-and-Upgrade
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Import preview */}
        {imp && wpAvailable && (
          <>
            <section
              className="rounded-2xl p-6 mb-6"
              style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
            >
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color: "var(--gold-deep)" }}>
                wp-json detected
              </div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] mb-1" style={{ color: "var(--ink)" }}>
                {imp.siteName || imp.finalUrl}
              </h2>
              {imp.siteDescription && (
                <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--ink-secondary)" }}>
                  {imp.siteDescription}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Posts", value: imp.postCount, icon: FileText },
                  { label: "Pages", value: imp.pageCount, icon: Folder },
                  { label: "Categories", value: imp.categories.length, icon: Folder },
                  { label: "Tags", value: imp.tags.length, icon: Tag },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="w-3 h-3" style={{ color: "var(--ink-muted)" }} />
                      <span className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: "var(--ink-muted)" }}>
                        {label}
                      </span>
                    </div>
                    <div className="text-[20px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent posts preview */}
            {imp.posts.length > 0 && (
              <section className="mb-6">
                <h3 className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-3" style={{ color: "var(--gold-deep)" }}>
                  Recent posts (preserved in the rebuild)
                </h3>
                <div className="space-y-2">
                  {imp.posts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl p-4"
                      style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}
                    >
                      <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--ink)" }}>
                        {p.title}
                      </div>
                      {p.excerpt && (
                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                          {p.excerpt}
                        </p>
                      )}
                      {p.categories.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.categories.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-full text-[10px]"
                              style={{
                                background: "var(--paper)",
                                color: "var(--ink-secondary)",
                                border: "1px solid var(--rule)",
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <section
              className="rounded-2xl p-8 text-center"
              style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
            >
              <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
                Modernize this WordPress site
              </h2>
              <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
                Six agents rebuild your site in React + Tailwind. Posts and pages
                preserved as a blog/content section. Modern stack, mobile-first,
                sub-second LCP. Hosting + custom domain via Vapron at deploy.
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
                  Rebuild it in React
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </section>
          </>
        )}

        {/* Cross-link */}
        <div className="mt-12 text-center">
          <Link href="/upgrade" className="text-[13px] underline" style={{ color: "var(--ink-muted)" }}>
            Site isn&apos;t on WordPress? Try URL Clone-and-Upgrade →
          </Link>
        </div>
      </div>
    </main>
  );
}
