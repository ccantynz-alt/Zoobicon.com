"use client";

/**
 * /share/[code] — read-only viewer for a shared builder snapshot
 * (Sprint 4 T9 full).
 *
 * Loads {prompt, files, brandSpec} from /api/share/[code], renders
 * the same EscapeHatchPreview the builder uses so the recipient
 * sees the exact React app the sharer generated. "Fork to builder"
 * CTA opens /builder with the prompt prefilled so the recipient can
 * start editing from the same starting point.
 */

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Loader2, AlertCircle, Eye, GitFork } from "lucide-react";

const EscapeHatchPreview = dynamic(
  () => import("@/components/EscapeHatchPreview"),
  { ssr: false }
);

interface SharedBuild {
  code: string;
  prompt: string;
  files: Record<string, string>;
  brandSpec: Record<string, unknown> | null;
  createdAt: string;
  viewCount: number;
}

export default function SharePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [build, setBuild] = useState<SharedBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/share/${code}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok: boolean; build?: SharedBuild; error?: string }>)
      .then((data) => {
        if (cancelled) return;
        if (!data.ok || !data.build) {
          setError(data.error || "Shared build not found");
        } else {
          setBuild(data.build);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Lookup failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <main className="pt-[72px] min-h-screen flex items-center justify-center" style={{ color: "var(--ink)" }}>
        <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--ink-muted)" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading shared build…
        </div>
      </main>
    );
  }

  if (error || !build) {
    return (
      <main className="pt-[72px] min-h-screen flex items-center justify-center px-6" style={{ color: "var(--ink)" }}>
        <div
          className="max-w-md rounded-2xl p-8 text-center"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
          }}
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "rgb(220, 38, 38)" }} />
          <h1 className="text-xl font-semibold mb-2">Shared build not found</h1>
          <p className="text-[13px] mb-5" style={{ color: "var(--ink-secondary)" }}>
            {error || "This link may have expired or been removed."}
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            Open the builder
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    );
  }

  const forkHref = `/builder?prompt=${encodeURIComponent(build.prompt)}&from=share-fork&sharedCode=${build.code}`;

  return (
    <div className="pt-[72px] min-h-screen flex flex-col" style={{ color: "var(--ink)" }}>
      {/* Top banner */}
      <div
        className="border-b px-6 py-3 flex items-center gap-4 flex-wrap"
        style={{
          background: "var(--paper-elevated)",
          borderColor: "var(--rule)",
        }}
      >
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold-deep)" }}>
            Shared build
          </span>
        </div>
        <span className="text-[13px] truncate flex-1 min-w-0" style={{ color: "var(--ink-secondary)" }}>
          &ldquo;{build.prompt.slice(0, 140)}{build.prompt.length > 140 ? "…" : ""}&rdquo;
        </span>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--ink-muted)" }}>
          <span>{build.viewCount} view{build.viewCount === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>{new Date(build.createdAt).toLocaleDateString()}</span>
        </div>
        <Link
          href={forkHref}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #e4ff6b 0%, #d4f24e 100%)",
            color: "#ffffff",
            border: "1px solid #a47d2c",
          }}
        >
          <GitFork className="w-3 h-3" />
          Fork to builder
        </Link>
      </div>

      {/* Preview iframe — same component the builder uses */}
      <div className="flex-1 relative" style={{ background: "var(--paper)" }}>
        <EscapeHatchPreview files={build.files} />
      </div>
    </div>
  );
}
