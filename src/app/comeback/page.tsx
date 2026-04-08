"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RunEntry {
  id: string;
  ranAt: string;
  steps: Record<string, unknown> | unknown;
  emailSent: boolean;
}

interface SiteHistory {
  siteId: string;
  runs: RunEntry[];
}

interface HistoryResponse {
  ok: boolean;
  sites?: SiteHistory[];
  totalRuns?: number;
  error?: string;
}

interface PendingDraft {
  id: string;
  siteId: string;
  title: string;
  excerpt: string;
}

interface SeoFix {
  id: string;
  siteId: string;
  description: string;
  ranAt: string;
}

function isStepsObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function ComebackDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteHistory[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [seoFixes, setSeoFixes] = useState<SeoFix[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/comeback/history", { cache: "no-store" });
        const data = (await res.json()) as HistoryResponse;
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        if (cancelled) return;
        const fetchedSites = data.sites ?? [];
        setSites(fetchedSites);

        const drafts: PendingDraft[] = [];
        const fixes: SeoFix[] = [];
        for (const site of fetchedSites) {
          for (const run of site.runs) {
            if (!isStepsObject(run.steps)) continue;
            const draftsRaw = run.steps["pendingDrafts"];
            if (Array.isArray(draftsRaw)) {
              for (const d of draftsRaw) {
                if (isStepsObject(d) && typeof d["id"] === "string") {
                  drafts.push({
                    id: d["id"],
                    siteId: site.siteId,
                    title:
                      typeof d["title"] === "string"
                        ? d["title"]
                        : "Untitled draft",
                    excerpt:
                      typeof d["excerpt"] === "string" ? d["excerpt"] : "",
                  });
                }
              }
            }
            const fixesRaw = run.steps["seoFixes"];
            if (Array.isArray(fixesRaw)) {
              for (const f of fixesRaw) {
                if (isStepsObject(f) && typeof f["id"] === "string") {
                  fixes.push({
                    id: f["id"],
                    siteId: site.siteId,
                    description:
                      typeof f["description"] === "string"
                        ? f["description"]
                        : "SEO fix applied",
                    ranAt: run.ranAt,
                  });
                }
              }
            }
          }
        }
        setPendingDrafts(drafts);
        setSeoFixes(fixes);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo<RunEntry[]>(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const out: RunEntry[] = [];
    for (const s of sites) {
      for (const r of s.runs) {
        if (new Date(r.ranAt).getTime() >= cutoff) out.push(r);
      }
    }
    return out;
  }, [sites]);

  async function handleAction(
    draftId: string,
    action: "approve" | "reject"
  ): Promise<void> {
    setActing(draftId);
    try {
      const res = await fetch("/api/comeback/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setPendingDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-semibold tracking-tight">
            Daily Comeback
          </h1>
          <p className="mt-2 text-white/60">
            Nightly digest of every site Zoobicon is babysitting for you.
          </p>
        </motion.header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            Loading nightly digest...
          </div>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="mb-4 text-xl font-semibold">Today&apos;s digest</h2>
              {today.length === 0 ? (
                <p className="text-white/50">
                  No nightly runs in the last 24 hours.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {today.map((run) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5"
                    >
                      <div className="text-xs uppercase tracking-wide text-white/40">
                        {new Date(run.ranAt).toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm">
                        Email sent:{" "}
                        <span
                          className={
                            run.emailSent
                              ? "text-emerald-400"
                              : "text-white/50"
                          }
                        >
                          {run.emailSent ? "yes" : "no"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-12">
              <h2 className="mb-4 text-xl font-semibold">
                Pending blog drafts ({pendingDrafts.length})
              </h2>
              <AnimatePresence>
                {pendingDrafts.length === 0 ? (
                  <p className="text-white/50">No drafts awaiting approval.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingDrafts.map((draft) => (
                      <motion.div
                        key={draft.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white/40">
                              {draft.siteId}
                            </div>
                            <div className="mt-1 text-lg font-semibold">
                              {draft.title}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-white/60">
                              {draft.excerpt}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              disabled={acting === draft.id}
                              onClick={() => handleAction(draft.id, "approve")}
                              className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={acting === draft.id}
                              onClick={() => handleAction(draft.id, "reject")}
                              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </section>

            <section className="mb-12">
              <h2 className="mb-4 text-xl font-semibold">SEO fixes log</h2>
              {seoFixes.length === 0 ? (
                <p className="text-white/50">No SEO fixes recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {seoFixes.map((fix) => (
                    <li
                      key={fix.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    >
                      <span className="text-white/40">{fix.siteId}</span>
                      <span className="mx-2 text-white/20">·</span>
                      <span>{fix.description}</span>
                      <span className="ml-2 text-xs text-white/40">
                        {new Date(fix.ranAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">
                Site-by-site stats ({sites.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {sites.map((site) => (
                  <motion.div
                    key={site.siteId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="font-semibold">{site.siteId}</div>
                    <div className="mt-1 text-sm text-white/60">
                      {site.runs.length} nightly runs in last 30 days
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      Last run:{" "}
                      {site.runs[0]
                        ? new Date(site.runs[0].ranAt).toLocaleString()
                        : "never"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
