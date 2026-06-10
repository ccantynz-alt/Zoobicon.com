"use client";

/**
 * The Builder — server-rendered architecture, ZOOBICON BOLD design.
 * Replaced the legacy in-browser-sandbox builder on Craig's order
 * (2026-06-10): "completely change the design and architecture of this
 * builder — I don't want to see it any more."
 *
 * Architecture (the V2 engine, proven on /v2 before promotion):
 * - The browser NEVER executes generated code. No Babel, no importmaps,
 *   no blob modules — the entire class of "Preview failed" crashes that
 *   plagued the sandbox builder for months is structurally impossible.
 * - POST /api/v2/build/stream renders every section on the SERVER and
 *   streams finished HTML into a plain iframe (first paint ~1-2s).
 * - AI-tailored copy hot-swaps in section-by-section in the background.
 * - /api/v2/edit powers the conversational edit loop: one section is
 *   rewritten server-side and swapped in place — no rebuild.
 * - This is how Lovable/v0 do previews. Stable on iPad WebKit.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Download } from "lucide-react";

const EXAMPLES = [
  "A warm artisan bakery in Brooklyn with online ordering",
  "A landing page for a cybersecurity startup, calm and trustworthy",
  "A minimal portfolio for a wedding photographer",
  "A SaaS analytics platform for product teams",
  "A boutique law firm with fixed-fee pricing",
];

type Status = "idle" | "streaming" | "done" | "error";

interface BuildResult {
  html: string;
  componentIds: string[];
  industry: string;
  theme: string;
  aiUsed: boolean;
}

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [shell, setShell] = useState<string | null>(null);
  const [sectionsIn, setSectionsIn] = useState(0);
  const [tailoring, setTailoring] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<Array<{ index: number; html: string; js?: string }>>([]);
  // Live source + category per section — edits stack on the real version.
  const sectionMetaRef = useRef<Map<number, { category: string; code: string }>>(new Map());

  // Conversational edit loop state.
  const [editInstruction, setEditInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const [editLog, setEditLog] = useState<Array<{ text: string; ok: boolean; note?: string }>>([]);

  // Prefill from homepage hero (?prompt=...)
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("prompt");
      if (p) setPrompt(p);
    } catch { /* ignore */ }
  }, []);

  // The srcdoc iframe announces its hot-swap listener; flush queued sections.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "zb-ready") {
        readyRef.current = true;
        const win = iframeRef.current?.contentWindow;
        if (win) {
          for (const s of queueRef.current)
            win.postMessage({ type: "zb-section", index: s.index, html: s.html, js: s.js }, "*");
        }
        queueRef.current = [];
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const pushSection = useCallback((index: number, html: string, js?: string) => {
    if (readyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "zb-section", index, html, js }, "*");
    } else {
      queueRef.current.push({ index, html, js });
    }
  }, []);

  // Non-streaming fallback — only if SSE can't be established at all.
  const buildFallback = useCallback(async (text: string) => {
    const res = await fetch("/api/v2/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const data = (await res.json()) as { ok: boolean; error?: string } & BuildResult;
    if (!data.ok) throw new Error(data.error || "Build failed");
    setShell(data.html);
    setResult(data);
    setStatus("done");
  }, []);

  const build = useCallback(
    async (p: string) => {
      const text = p.trim();
      if (!text) return;
      setStatus("streaming");
      setError("");
      setResult(null);
      setShell(null);
      setSectionsIn(0);
      setTailoring(false);
      readyRef.current = false;
      queueRef.current = [];
      sectionMetaRef.current = new Map();
      setEditLog([]);
      setElapsed(0);
      const started = Date.now();
      timerRef.current = setInterval(() => setElapsed((Date.now() - started) / 1000), 100);

      try {
        const res = await fetch("/api/v2/build/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        if (!res.ok || !res.body) throw new Error(`stream unavailable (HTTP ${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let gotAnything = false;
        let sawError = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() || "";
          for (const part of parts) {
            const line = part.replace(/^data:\s?/, "").trim();
            if (!line) continue;
            let evt: Record<string, unknown>;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            gotAnything = true;
            if (evt.type === "meta") {
              setShell(evt.shell as string);
              setTailoring(true);
            } else if (evt.type === "section") {
              const idx = evt.index as number;
              pushSection(idx, evt.html as string, evt.js as string | undefined);
              if (typeof evt.code === "string") {
                sectionMetaRef.current.set(idx, {
                  category: (evt.category as string) || "",
                  code: evt.code as string,
                });
              }
              if (evt.ai === false) setSectionsIn((n) => n + 1);
            } else if (evt.type === "done") {
              setResult({
                html: evt.html as string,
                componentIds: (evt.componentIds as string[]) || [],
                industry: (evt.industry as string) || "",
                theme: "editorial",
                aiUsed: Boolean(evt.aiUsed),
              });
              setTailoring(false);
              setStatus("done");
            } else if (evt.type === "error") {
              sawError = (evt.error as string) || "Build failed";
            }
          }
        }

        if (sawError && !gotAnything) throw new Error(sawError);
        setTailoring(false);
        setStatus((s) => (s === "streaming" ? "done" : s));
      } catch (streamErr) {
        try {
          await buildFallback(text);
        } catch (err) {
          setError(err instanceof Error ? err.message : streamErr instanceof Error ? streamErr.message : "Build failed");
          setStatus("error");
        }
      } finally {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    },
    [buildFallback, pushSection],
  );

  // Conversational edit — change one section without rebuilding the page.
  const applyEdit = useCallback(
    async (raw: string) => {
      const instruction = raw.trim();
      if (!instruction || editing) return;
      const sections = Array.from(sectionMetaRef.current.entries()).map(([index, m]) => ({
        index,
        category: m.category,
        code: m.code,
      }));
      if (sections.length === 0) return;
      setEditing(true);
      try {
        const res = await fetch("/api/v2/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction, sections }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          index?: number;
          html?: string;
          js?: string;
          code?: string;
          category?: string;
        };
        if (!data.ok) {
          setEditLog((l) => [{ text: instruction, ok: false, note: data.error }, ...l]);
          return;
        }
        if (typeof data.index === "number" && data.html) {
          pushSection(data.index, data.html, data.js);
          if (typeof data.code === "string") {
            sectionMetaRef.current.set(data.index, {
              category: data.category || sectionMetaRef.current.get(data.index)?.category || "",
              code: data.code,
            });
          }
        }
        setEditLog((l) => [{ text: instruction, ok: true, note: data.category }, ...l]);
        setEditInstruction("");
      } catch (err) {
        setEditLog((l) => [
          { text: instruction, ok: false, note: err instanceof Error ? err.message : "Edit failed" },
          ...l,
        ]);
      } finally {
        setEditing(false);
      }
    },
    [editing, pushSection],
  );

  const downloadHtml = useCallback(() => {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoobicon-site.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--zb-bg)", color: "var(--zb-ink)" }}>
      {/* ── Top bar — the dark site stratum ── */}
      <header
        className="zb-nav flex items-center justify-between px-4 sm:px-6"
        style={{
          height: 60,
          background: "rgba(11, 11, 13, 0.97)",
          borderBottom: "1px solid var(--zb-line-dark)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[9px]"
              style={{ background: "var(--zb-accent)" }}
            >
              <span className="zb-display text-[17px] leading-none text-white">Z</span>
            </div>
            <span className="zb-display hidden text-[17px] text-white sm:block">zoobicon</span>
          </Link>
          <span
            className="ml-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
          >
            Builder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold md:inline-flex"
            style={{ border: "1px solid var(--zb-line-dark)", color: "rgba(255,255,255,0.65)" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
            Server-rendered preview · stable on every device
          </span>
          {result && (
            <button
              onClick={downloadHtml}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: "1px solid var(--zb-line-dark)" }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all hover:-translate-y-0.5"
            style={{ background: "var(--zb-accent)", color: "#ffffff" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* ── Left rail ── */}
        <aside
          className="flex w-full flex-col overflow-y-auto px-6 py-8 sm:px-8 lg:max-w-[420px]"
          style={{ borderRight: "1px solid var(--zb-line)", background: "var(--zb-surface)" }}
        >
          <h1 className="zb-display text-[32px] leading-[1.05]">
            Describe it.
            <br />
            <span style={{ color: "var(--zb-accent)" }}>Watch it build.</span>
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
            One sentence becomes a complete, deployable website — built from
            hand-crafted sections, rendered on our servers, streamed in live.
          </p>

          <div className="mt-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(prompt);
              }}
              rows={4}
              placeholder="A warm artisan bakery in Brooklyn with online ordering…"
              className="zb-input-light w-full resize-none rounded-xl px-4 py-3.5 text-[15px] leading-relaxed focus:outline-none focus:ring-2"
              style={{
                background: "var(--zb-bg)",
                border: "1px solid var(--rule-strong)",
                color: "var(--zb-ink)",
              }}
            />
            <button
              onClick={() => build(prompt)}
              disabled={status === "streaming" || !prompt.trim()}
              className="zb-btn mt-3 w-full !rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "streaming" ? `Building… ${elapsed.toFixed(1)}s` : "Build my website"}
              {status !== "streaming" && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-2 text-center text-[11px]" style={{ color: "var(--zb-muted)" }}>
              ⌘/Ctrl + Enter
            </p>
          </div>

          {status === "idle" && (
            <div className="mt-7">
              <div className="zb-eyebrow mb-3" style={{ color: "var(--zb-muted)" }}>
                Try an example
              </div>
              <div className="flex flex-col gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setPrompt(ex);
                      build(ex);
                    }}
                    className="rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-all hover:-translate-y-0.5"
                    style={{
                      background: "var(--zb-bg)",
                      border: "1px solid var(--zb-line)",
                      color: "var(--zb-ink-2)",
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div
              className="mt-7 rounded-xl p-4"
              style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="zb-band flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--zb-accent)" }}
                >
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                <span className="text-[13px] font-bold" style={{ color: "var(--zb-ink)" }}>
                  Built in {elapsed.toFixed(1)}s
                </span>
              </div>
              <div className="mt-2 text-[12.5px]" style={{ color: "var(--zb-ink-2)" }}>
                {result.componentIds.length} sections · {result.industry}
                {result.aiUsed ? " · AI-tailored copy" : ""}
              </div>
            </div>
          )}

          {/* Conversational edit loop */}
          {status === "done" && (
            <div className="mt-5">
              <div className="zb-eyebrow mb-2" style={{ color: "var(--zb-muted)" }}>
                Refine it — just say what to change
              </div>
              <textarea
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) applyEdit(editInstruction);
                }}
                rows={2}
                placeholder="Make the hero darker · Change the headline to… · Add a button"
                disabled={editing}
                className="zb-input-light w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed focus:outline-none disabled:opacity-60"
                style={{
                  background: "var(--zb-bg)",
                  border: "1px solid var(--rule-strong)",
                  color: "var(--zb-ink)",
                }}
              />
              <button
                onClick={() => applyEdit(editInstruction)}
                disabled={editing || !editInstruction.trim()}
                className="zb-btn-ink mt-2 w-full !rounded-xl !py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editing ? "Applying…" : "Apply change"}
              </button>

              {editLog.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {editLog.slice(0, 5).map((e, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-2.5 py-1.5 text-[11.5px]"
                      style={{
                        background: "var(--zb-bg)",
                        border: "1px solid var(--zb-line)",
                        color: e.ok ? "var(--zb-ink-2)" : "var(--zb-accent)",
                      }}
                    >
                      <span style={{ marginRight: 6 }}>{e.ok ? "✓" : "·"}</span>
                      {e.text}
                      {e.note && (
                        <span style={{ color: "var(--zb-muted)" }}>
                          {" "}
                          — {e.ok ? `updated ${e.note}` : e.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-8 text-[11.5px] leading-relaxed" style={{ color: "var(--zb-muted)" }}>
            Your preview is rendered on our servers first — rock-solid on every
            device — then brought to life as a real interactive site. If
            anything can&rsquo;t load, the polished static version stays. It can
            only get better, never break.
          </div>
        </aside>

        {/* ── Preview ── */}
        <main className="relative min-h-[50vh] flex-1 overflow-hidden" style={{ background: "var(--zb-bg)" }}>
          {status === "idle" && (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div style={{ maxWidth: 420 }}>
                <div
                  className="zb-display zb-band mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] text-white"
                  style={{ background: "var(--zb-accent)" }}
                >
                  Z
                </div>
                <h2 className="zb-display text-[24px]">Your site appears here</h2>
                <p className="mt-2 text-[14px]" style={{ color: "var(--zb-muted)" }}>
                  Type a sentence and press build. The first sections render in
                  about two seconds.
                </p>
              </div>
            </div>
          )}

          {status === "streaming" && !shell && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full"
                  style={{ border: "3px solid var(--zb-line)", borderTopColor: "var(--zb-accent)" }}
                />
                <p className="text-[14px] font-semibold" style={{ color: "var(--zb-ink-2)" }}>
                  Selecting your sections…
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--zb-muted)" }}>
                  {elapsed.toFixed(1)}s
                </p>
              </div>
            </div>
          )}

          {(status === "streaming" || status === "done") && shell && (
            <div className="flex h-full flex-col">
              <div
                className="flex items-center gap-1.5 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--zb-line)", background: "var(--zb-surface)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
                <span className="ml-3 font-mono text-[11px]" style={{ color: "var(--zb-muted)" }}>
                  preview · {sectionsIn} section{sectionsIn === 1 ? "" : "s"}
                </span>
                {tailoring && (
                  <span
                    className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "var(--zb-accent-soft)", color: "var(--zb-accent)" }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: "var(--zb-accent)" }}
                    />
                    Tailoring copy…
                  </span>
                )}
                {status === "done" && (
                  <button
                    onClick={() => build(prompt)}
                    className="zb-band ml-auto rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white"
                    style={{ background: "var(--zb-ink)" }}
                  >
                    Rebuild
                  </button>
                )}
              </div>
              <iframe
                ref={iframeRef}
                title="Your website preview"
                srcDoc={shell}
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div style={{ maxWidth: 440 }}>
                <h2 className="zb-display text-[22px]" style={{ color: "var(--zb-accent)" }}>
                  That build hit a snag
                </h2>
                <p className="mt-2 text-[13.5px]" style={{ color: "var(--zb-ink-2)" }}>
                  {error}
                </p>
                <button onClick={() => build(prompt)} className="zb-btn-ink mt-5 !rounded-xl">
                  Try again
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
