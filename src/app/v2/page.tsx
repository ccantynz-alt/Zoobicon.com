"use client";

/**
 * Builder V2 — reliability-first, editorial design.
 *
 * The browser does NOT execute generated code. It POSTs a prompt to
 * /api/v2/build, the server renders the slot-locked page to static HTML,
 * and we show that HTML in an iframe via srcDoc. No Babel, no crypto, no
 * blob modules — so it works identically on iPad WebKit and everywhere
 * else. This is the architecture that fixes the V1 failures for good.
 */

import { useCallback, useRef, useState } from "react";

const SERIF = "'Playfair Display','Fraunces',ui-serif,Georgia,serif";

const EXAMPLES = [
  "A landing page for a cybersecurity startup, calm and trustworthy",
  "A warm artisan bakery in Brooklyn with online ordering",
  "A minimal portfolio for a wedding photographer",
  "A SaaS analytics platform for product teams",
  "A boutique law firm with fixed-fee pricing",
];

type Status = "idle" | "building" | "done" | "error";

interface BuildResult {
  html: string;
  componentIds: string[];
  industry: string;
  theme: string;
  aiUsed: boolean;
}

export default function BuilderV2() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const build = useCallback(async (p: string) => {
    const text = p.trim();
    if (!text) return;
    setStatus("building");
    setError("");
    setResult(null);
    setElapsed(0);
    const started = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - started) / 1000), 100);

    // One automatic retry — server build is deterministic, so a transient
    // network blip should never be a dead end for the user.
    const attempt = async (): Promise<Response> =>
      fetch("/api/v2/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

    try {
      let res: Response;
      try {
        res = await attempt();
      } catch {
        await new Promise((r) => setTimeout(r, 800));
        res = await attempt();
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { ok: boolean; error?: string } & BuildResult;
      if (!data.ok) throw new Error(data.error || "Build failed");
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Build failed");
      setStatus("error");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 sm:px-7"
        style={{ height: 64, borderBottom: "1px solid var(--rule)", background: "var(--paper-elevated)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: "1.5px solid var(--gold)", background: "var(--paper)" }}
          >
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 18 }}>Z</span>
          </div>
          <span style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 19 }}>Zoobicon</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: "var(--gold-soft)", color: "var(--gold-deep)", border: "1px solid var(--gold)" }}
          >
            Builder v2
          </span>
        </div>
        <span
          className="hidden items-center gap-2 rounded-full px-3 py-1 text-[11px] sm:inline-flex"
          style={{ background: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#3ba55d" }} />
          Server-rendered preview · works on any device
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: controls */}
        <aside
          className="flex w-full max-w-[440px] flex-col overflow-y-auto px-6 py-8 sm:px-8"
          style={{ borderRight: "1px solid var(--rule)" }}
        >
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Describe it.{" "}
            <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--gold-deep)" }}>Watch</span> it build.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            One sentence becomes a complete, deployable website — assembled from
            hand-crafted, agency-quality sections and rendered on our servers,
            so the preview is rock-solid on every device.
          </p>

          <div className="mt-7">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(prompt);
              }}
              rows={4}
              placeholder="A warm artisan bakery in Brooklyn with online ordering…"
              className="w-full resize-none rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed focus:outline-none"
              style={{
                background: "var(--paper-bright)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
              }}
            />
            <button
              onClick={() => build(prompt)}
              disabled={status === "building" || !prompt.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--paper)", boxShadow: "0 8px 24px rgba(10,10,11,0.18)" }}
            >
              {status === "building" ? `Building… ${elapsed.toFixed(1)}s` : "Build my website"}
              {status !== "building" && <span style={{ fontFamily: SERIF }}>→</span>}
            </button>
            <p className="mt-2 text-center text-[11px]" style={{ color: "var(--ink-muted)" }}>
              ⌘/Ctrl + Enter
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold-deep)" }}>
              Try an example
            </div>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setPrompt(ex); build(ex); }}
                  disabled={status === "building"}
                  className="rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-colors disabled:opacity-50"
                  style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)", color: "var(--ink-secondary)" }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="mt-8 rounded-2xl p-4" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--gold-deep)" }}>
                Built
              </div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                {result.componentIds.length} sections · {result.industry} · {result.aiUsed ? "AI-tailored copy" : "template copy"}
              </div>
            </div>
          )}

          <div className="mt-auto pt-8 text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Slot-locked composition: the AI fills hand-tested templates, so the
            output can&rsquo;t be structurally broken. Rendered server-side for
            reliability competitors can&rsquo;t match.
          </div>
        </aside>

        {/* Right: preview */}
        <main className="relative flex-1 overflow-hidden" style={{ background: "var(--paper-elevated)" }}>
          {status === "idle" && (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div style={{ maxWidth: 420 }}>
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "var(--gold-soft)", border: "1px solid var(--gold)" }}
                >
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: "var(--gold-deep)" }}>Z</span>
                </div>
                <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24 }}>Your site appears here</h2>
                <p className="mt-2 text-[14px]" style={{ color: "var(--ink-muted)" }}>
                  Type a sentence and press build. The finished website renders on
                  the left&rsquo;s preview in a few seconds.
                </p>
              </div>
            </div>
          )}

          {status === "building" && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full"
                  style={{ border: "3px solid var(--rule)", borderTopColor: "var(--gold)" }}
                />
                <p className="text-[14px]" style={{ color: "var(--ink-secondary)" }}>
                  Assembling + rendering your site on the server…
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--ink-muted)" }}>{elapsed.toFixed(1)}s</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div style={{ maxWidth: 440 }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: "var(--gold-deep)" }}>
                  That build hit a snag
                </h2>
                <p className="mt-2 text-[13px]" style={{ color: "var(--ink-secondary)" }}>{error}</p>
                <button
                  onClick={() => build(prompt)}
                  className="mt-5 rounded-xl px-6 py-2.5 text-[14px] font-semibold"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="flex h-full flex-col">
              <div
                className="flex items-center gap-1.5 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--rule)", background: "var(--paper)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--rule-strong)" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--rule-strong)" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--rule-strong)" }} />
                <span className="ml-3 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  preview · {result.componentIds.length} sections
                </span>
                <button
                  onClick={() => build(prompt)}
                  className="ml-auto rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  Rebuild
                </button>
              </div>
              <iframe
                title="Your website preview"
                srcDoc={result.html}
                className="w-full flex-1 border-0"
                sandbox="allow-scripts allow-popups allow-forms"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
