"use client";

/**
 * /notion-import — paste a Notion page URL, get a React landing page
 * built from the page's properties + top-level blocks
 * (Sprint 4 T4 — Notion UI).
 *
 * Requires NOTION_TOKEN env var AND each target page must be SHARED
 * with the integration via Notion's Share menu. The error path
 * surfaces both requirements clearly because getting the per-page
 * share wrong is the #1 Notion integration bug.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";

interface NotionBlock {
  id: string;
  type: string;
  text: string;
}

interface NotionImport {
  ok: boolean;
  pageId: string;
  title: string | null;
  lastEdited: string | null;
  blocks: NotionBlock[];
  reason?: string;
}

interface NotionResponse {
  ok: boolean;
  import?: NotionImport;
  prompt?: string;
  builderHref?: string;
  reason?: string;
  error?: string;
}

export default function NotionImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NotionResponse | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/notion/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as NotionResponse;
      setResult(data);
      if (!data.ok && data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const imp = result?.import;

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> Notion → React
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            From a Notion page.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              To a public site in 60 seconds.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Paste your Notion page URL. We read your headings and body copy via
            the Notion API; the six-agent pipeline turns them into a React site
            with proper section structure. Hosting + custom domain via Crontech
            at deploy.
          </p>
        </header>

        <form onSubmit={run} className="mb-8">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: "var(--paper-elevated)",
              border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "var(--rule-strong)"}`,
            }}
          >
            <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold-deep)" }} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.notion.so/Your-Page-Title-<id>"
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
              {loading ? "Reading…" : "Import"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "rgb(220, 38, 38)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            Requires NOTION_TOKEN env var set in Vercel <strong>and</strong> the
            page must be shared with your integration via Notion&apos;s Share
            menu (Notion access is per-page, not per-token).
          </p>
        </form>

        {result && !imp?.ok && imp?.reason && (
          <section
            className="rounded-2xl p-6 mb-8 flex items-start gap-4"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule-strong)" }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
            <div>
              <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--ink)" }}>
                Couldn&apos;t read this Notion page
              </div>
              <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                {imp.reason}
              </p>
            </div>
          </section>
        )}

        {imp?.ok && (
          <>
            <section
              className="rounded-2xl p-6 mb-6"
              style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
            >
              <div
                className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2"
                style={{ color: "var(--gold-deep)" }}
              >
                Notion page loaded
              </div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] mb-2" style={{ color: "var(--ink)" }}>
                {imp.title || "Untitled page"}
              </h2>
              <div className="flex flex-wrap gap-3 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                <span>{imp.blocks.length} block{imp.blocks.length === 1 ? "" : "s"} extracted</span>
                {imp.lastEdited && (
                  <>
                    <span>·</span>
                    <span>Last edited {new Date(imp.lastEdited).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </section>

            {imp.blocks.length > 0 && (
              <section className="mb-6">
                <h3 className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-3" style={{ color: "var(--gold-deep)" }}>
                  Content extracted (preserved in the build)
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {imp.blocks.slice(0, 12).map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl p-3"
                      style={{
                        background: "var(--paper-elevated)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-0.5" style={{ color: "var(--ink-muted)" }}>
                        {b.type}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--ink)" }}>
                        {b.text}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section
              className="rounded-2xl p-8 text-center"
              style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
            >
              <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
                Build the React version
              </h2>
              <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
                Headings become section anchors; paragraphs become section descriptions.
                Same brand-spec contract + slot validation as every Zoobicon build.
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
                  Open the builder
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </section>
          </>
        )}

        <div className="mt-12 text-center">
          <Link href="/upgrade" className="text-[13px] underline" style={{ color: "var(--ink-muted)" }}>
            Not a Notion page? Try URL Clone-and-Upgrade →
          </Link>
        </div>
      </div>
    </main>
  );
}
