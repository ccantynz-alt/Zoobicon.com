"use client";

/**
 * /github-import — paste a GitHub repo URL, get a landing page
 * generated for it (Sprint 4 T4 — MCP / GitHub slice).
 *
 * Fetches README + package.json + repo info via the public GitHub
 * API (no auth required for public repos), composes a builder prompt,
 * jumps to /builder with it prefilled. The regular six-agent pipeline
 * does the rest.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";

interface RepoSummary {
  name: string;
  url: string;
  tagline: string;
  contextBytes: number;
}

interface PreviewResponse {
  ok: boolean;
  repo?: RepoSummary;
  prompt?: string;
  builderHref?: string;
  error?: string;
}

export default function GitHubImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResponse | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/github/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!data.ok) throw new Error(data.error || "Preview failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> GitHub repo → landing page
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            Paste a GitHub URL.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              Get a real landing page in 60 seconds.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            We pull your README, package.json, and file structure via the public
            GitHub API. Six agents compose a landing page tuned for project
            adoption — hero, features, install snippet, FAQ, structured data.
            Modern React + Tailwind, deployable in one click.
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
            <GitBranch className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold-deep)" }} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-repo"
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
              {loading ? "Fetching…" : "Preview"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: "rgb(220, 38, 38)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            Public repos work without auth. Private repos need an admin to set
            GITHUB_TOKEN in the Vercel env.
          </p>
        </form>

        {result?.ok && result.repo && (
          <section
            className="rounded-2xl p-6 mb-6"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color: "var(--gold-deep)" }}>
              Repo loaded
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] mb-1" style={{ color: "var(--ink)" }}>
              {result.repo.name}
            </h2>
            {result.repo.tagline && (
              <p className="text-[13px] italic" style={{ color: "var(--ink-secondary)" }}>
                &ldquo;{result.repo.tagline}&rdquo;
              </p>
            )}
            <div className="mt-3 text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>
              {(result.repo.contextBytes / 1024).toFixed(1)} KB context extracted
            </div>
          </section>
        )}

        {result?.builderHref && (
          <section
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--gold)" }}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
              Build the landing page
            </h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
              Six agents will compose a developer-focused landing page tuned to
              drive clones and stars. Same brand-spec contract, same slot
              validation, same post-generation critique as any Zoobicon build.
            </p>
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
          </section>
        )}

        <div className="mt-12 text-center">
          <Link href="/upgrade" className="text-[13px] underline" style={{ color: "var(--ink-muted)" }}>
            Not a GitHub repo? Try URL Clone-and-Upgrade →
          </Link>
        </div>
      </div>
    </main>
  );
}
