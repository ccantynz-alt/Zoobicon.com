"use client";

/**
 * /launch — Domain → Brand → Site → Deploy in one editorial-light flow.
 *
 * Replaces the previous dark-navy plan/assemble UI (which violated Bible
 * Rule §29 — "no dark surfaces") with a clean editorial-light page that
 * drives the new /api/launch/shortlist and /api/launch/ship endpoints.
 *
 * Flow:
 *   1. User types a one-line business description.
 *   2. POST /api/launch/shortlist → 8 cards (name + tagline + palette +
 *      monogram). Cards with .com available are highlighted.
 *   3. User clicks "Pick this one" on the brand they want.
 *   4. POST /api/launch/ship as an SSE stream. Live progress updates as
 *      Home / Features / Pricing / Contact pages generate, then deploy
 *      and (optionally) registration. Final card carries the live URL.
 *
 * Bible Rule §29: warm bone background, near-black text, deep champagne
 * accents. Hairline rules. Restrained shadows. Display in Playfair-style
 * serif (via Fraunces fallback already in globals.css), body in Inter.
 *
 * Bible Law 8: every failure path renders a visible message — no blank
 * screens, no silent errors. The SSE stream emits typed `error` events
 * which the page surfaces as red banners.
 *
 * Note: the legacy plan/assemble routes (/api/launch/plan and
 * /api/launch/assemble) remain functional — this page no longer calls
 * them, but they aren't deleted in case other clients depend on them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Globe,
  Rocket,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface BrandKit {
  palette: string[];
  logoSvg: string;
  typography: { display: string; body: string };
}

interface Candidate {
  name: string;
  tagline: string;
  comAvailable: boolean | null;
  brandKit: BrandKit | null;
}

interface ShortlistResponse {
  candidates: Candidate[];
  meta: {
    model: string;
    elapsedMs: number;
    kitsAttempted: number;
    kitsReturned: number;
    kitFailures: number;
  };
  error?: string;
}

interface ShipEventBase {
  type: string;
  message?: string;
}
interface ShipCompleteEvent extends ShipEventBase {
  type: "complete";
  siteUrl: string;
  siteSlug?: string;
  domain: string;
  domainRegistered: boolean;
  registrarOrderId?: string;
  registrarError?: string;
  attempts?: Array<{ provider: string; success: boolean; error?: string; durationMs: number }>;
}
type ShipEvent =
  | ({ type: "site-step" | "deploy-step" | "register-step" | "error" } & ShipEventBase)
  | ShipCompleteEvent;

type Stage =
  | "idle"
  | "shortlisting"
  | "choosing"
  | "shipping"
  | "complete"
  | "error";

// ─── Component ────────────────────────────────────────────────────────────

export default function LaunchPage() {
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [shipLog, setShipLog] = useState<Array<{ kind: string; text: string }>>([]);
  const [shipResult, setShipResult] = useState<ShipCompleteEvent | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const submitShortlist = useCallback(async () => {
    if (description.trim().length < 3) {
      setErrorBanner("Tell us a little more about your business — at least 3 characters.");
      return;
    }
    setErrorBanner(null);
    setCandidates([]);
    setSelectedIndex(null);
    setShipLog([]);
    setShipResult(null);
    setStage("shortlisting");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/launch/shortlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: description.trim(), count: 8 }),
        signal: controller.signal,
      });
      const data = (await res.json()) as ShortlistResponse;
      if (!res.ok) {
        setErrorBanner(
          data.error || `Shortlist endpoint returned ${res.status} ${res.statusText}.`,
        );
        setStage("error");
        return;
      }
      if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
        setErrorBanner("Claude returned no usable names. Try a more specific description.");
        setStage("error");
        return;
      }
      setCandidates(data.candidates);
      setStage("choosing");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorBanner(
        `Shortlist failed: ${err instanceof Error ? err.message : "unknown network error"}`,
      );
      setStage("error");
    }
  }, [description]);

  const submitShip = useCallback(
    async (idx: number) => {
      const candidate = candidates[idx];
      if (!candidate || !candidate.brandKit) return;
      setSelectedIndex(idx);
      setStage("shipping");
      setShipLog([{ kind: "site-step", text: "Starting build..." }]);
      setShipResult(null);
      setErrorBanner(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/launch/ship", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: candidate.name,
            tagline: candidate.tagline,
            brandKit: candidate.brandKit,
            description: description.trim(),
            // No registrant in MVP — site deploys, registration is best-effort.
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          setErrorBanner(
            `Launch endpoint returned ${res.status} ${res.statusText}. ${text.slice(0, 200)}`,
          );
          setStage("error");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\n\n/);
          buffer = events.pop() || "";
          for (const block of events) {
            const lines = block.split("\n");
            const dataLine = lines.find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            try {
              const evt = JSON.parse(dataLine.slice(5).trim()) as ShipEvent;
              handleShipEvent(evt, setShipLog, setShipResult, setErrorBanner, setStage);
            } catch {
              /* ignore malformed event */
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setErrorBanner(
          `Launch stream failed: ${err instanceof Error ? err.message : "unknown error"}`,
        );
        setStage("error");
      }
    },
    [candidates, description],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setDescription("");
    setStage("idle");
    setErrorBanner(null);
    setCandidates([]);
    setSelectedIndex(null);
    setShipLog([]);
    setShipResult(null);
  }, []);

  const buildableCount = useMemo(
    () => candidates.filter((c) => c.brandKit !== null).length,
    [candidates],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 96px",
        }}
      >
        <Header />

        {errorBanner && (
          <div
            role="alert"
            style={{
              marginTop: 32,
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid #c9322a",
              background: "#fff4f3",
              color: "#7a1c16",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{errorBanner}</div>
          </div>
        )}

        {/* ── Stage: idle / shortlisting → input ─────────────────────────── */}
        {(stage === "idle" || stage === "shortlisting" || stage === "error") && (
          <DescribeBox
            description={description}
            setDescription={setDescription}
            onSubmit={submitShortlist}
            loading={stage === "shortlisting"}
          />
        )}

        {/* ── Stage: choosing → cards ────────────────────────────────────── */}
        {stage === "choosing" && (
          <ShortlistGrid
            candidates={candidates}
            buildableCount={buildableCount}
            onPick={submitShip}
            onReshuffle={submitShortlist}
          />
        )}

        {/* ── Stage: shipping / complete → progress + result ─────────────── */}
        {(stage === "shipping" || stage === "complete") && (
          <ShipProgress
            stage={stage}
            log={shipLog}
            result={shipResult}
            chosen={selectedIndex !== null ? candidates[selectedIndex] : undefined}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{ textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid var(--rule)",
          background: "var(--paper-elevated)",
          fontSize: 12,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--ink-secondary)",
          fontWeight: 600,
        }}
      >
        <Sparkles size={14} style={{ color: "var(--gold-deep)" }} />
        Domain → Brand → Site → Deploy
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          lineHeight: 1.05,
          marginTop: 24,
          marginBottom: 16,
          letterSpacing: "-.01em",
        }}
      >
        Launch a brand in one breath.
      </h1>
      <p
        style={{
          maxWidth: 640,
          margin: "0 auto",
          color: "var(--ink-secondary)",
          fontSize: "1.1rem",
          lineHeight: 1.6,
        }}
      >
        Describe your business once. We'll propose names, check the .com,
        sketch a brand identity, build a four-page site, and put it on the
        internet. The whole launch in a single round-trip.
      </p>
    </header>
  );
}

function DescribeBox({
  description,
  setDescription,
  onSubmit,
  loading,
}: {
  description: string;
  setDescription: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <section
      style={{
        marginTop: 40,
        padding: 28,
        borderRadius: 16,
        background: "var(--paper-elevated)",
        border: "1px solid var(--rule)",
      }}
    >
      <label
        htmlFor="launch-desc"
        style={{
          display: "block",
          fontSize: 13,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Describe your business
      </label>
      <textarea
        id="launch-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. AI agent that handles dispatch and quoting for plumbers"
        rows={3}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        style={{
          width: "100%",
          padding: "16px 18px",
          borderRadius: 12,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
          color: "var(--ink)",
          fontSize: 17,
          lineHeight: 1.5,
          fontFamily: "inherit",
          resize: "vertical",
          outline: "none",
          transition: "border-color .2s ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--gold-deep)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--rule)")}
      />
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
          Press &#8984; + Enter to submit
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || description.trim().length < 3}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 10,
            border: "1px solid var(--ink)",
            background: loading ? "var(--paper-elevated)" : "var(--ink)",
            color: loading ? "var(--ink)" : "var(--paper)",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading || description.trim().length < 3 ? "not-allowed" : "pointer",
            opacity: description.trim().length < 3 && !loading ? 0.5 : 1,
            transition: "all .2s ease",
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? "Generating shortlist..." : "Generate shortlist"}
        </button>
      </div>
    </section>
  );
}

function ShortlistGrid({
  candidates,
  buildableCount,
  onPick,
  onReshuffle,
}: {
  candidates: Candidate[];
  buildableCount: number;
  onPick: (idx: number) => void;
  onReshuffle: () => void;
}) {
  return (
    <section style={{ marginTop: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            margin: 0,
          }}
        >
          Pick your brand.
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            {buildableCount} of {candidates.length} ready to ship
          </span>
          <button
            type="button"
            onClick={onReshuffle}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid var(--rule)",
              background: "var(--paper-elevated)",
              color: "var(--ink-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} />
            Reshuffle
          </button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {candidates.map((c, i) => (
          <CandidateCard key={`${c.name}-${i}`} candidate={c} onPick={() => onPick(i)} />
        ))}
      </div>
    </section>
  );
}

function CandidateCard({ candidate, onPick }: { candidate: Candidate; onPick: () => void }) {
  const buildable = candidate.brandKit !== null;
  const status = candidate.comAvailable;
  return (
    <article
      style={{
        position: "relative",
        padding: 22,
        borderRadius: 14,
        background: "var(--paper-elevated)",
        border: buildable ? "1px solid var(--gold)" : "1px solid var(--rule)",
        opacity: buildable ? 1 : 0.65,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: buildable ? "0 8px 30px -20px rgba(201,169,97,0.4)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{ flexShrink: 0, width: 56, height: 56 }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html:
              candidate.brandKit?.logoSvg ||
              fallbackInlineMonogram(candidate.name),
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
              fontWeight: 600,
              fontSize: 22,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-.005em",
            }}
          >
            {candidate.name}
          </h3>
          <p
            style={{
              color: "var(--ink-muted)",
              fontSize: 13,
              margin: "4px 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {candidate.name.toLowerCase()}.com
          </p>
        </div>
        <AvailabilityPill status={status} />
      </div>
      <p
        style={{
          color: "var(--ink-secondary)",
          fontSize: 14,
          lineHeight: 1.55,
          margin: 0,
          minHeight: 44,
        }}
      >
        {candidate.tagline}
      </p>
      {candidate.brandKit && (
        <PaletteRow palette={candidate.brandKit.palette} typography={candidate.brandKit.typography} />
      )}
      <button
        type="button"
        onClick={onPick}
        disabled={!buildable}
        style={{
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 10,
          border: buildable ? "1px solid var(--ink)" : "1px solid var(--rule)",
          background: buildable ? "var(--ink)" : "var(--paper)",
          color: buildable ? "var(--paper)" : "var(--ink-muted)",
          fontWeight: 600,
          fontSize: 14,
          cursor: buildable ? "pointer" : "not-allowed",
          width: "100%",
        }}
      >
        {buildable ? (
          <>
            Pick {candidate.name} <ArrowRight size={14} />
          </>
        ) : (
          <>.com taken — pick another</>
        )}
      </button>
    </article>
  );
}

function AvailabilityPill({ status }: { status: boolean | null }) {
  if (status === true) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          borderRadius: 999,
          border: "1px solid var(--gold)",
          background: "rgba(201,169,97,0.08)",
          color: "var(--gold-deep)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        <CheckCircle2 size={12} /> Free
      </span>
    );
  }
  if (status === false) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          borderRadius: 999,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
          color: "var(--ink-muted)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        <XCircle size={12} /> Taken
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        color: "var(--ink-muted)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      <HelpCircle size={12} /> Unknown
    </span>
  );
}

function PaletteRow({
  palette,
  typography,
}: {
  palette: string[];
  typography: { display: string; body: string };
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {palette.slice(0, 3).map((hex, i) => (
          <span
            key={`${hex}-${i}`}
            title={hex}
            style={{
              display: "inline-block",
              width: 22,
              height: 22,
              borderRadius: 6,
              background: hex,
              border: "1px solid var(--rule)",
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: "right", fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.4 }}>
        <div style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>
          {typography.display}
        </div>
        <div>{typography.body}</div>
      </div>
    </div>
  );
}

function ShipProgress({
  stage,
  log,
  result,
  chosen,
  onReset,
}: {
  stage: Stage;
  log: Array<{ kind: string; text: string }>;
  result: ShipCompleteEvent | null;
  chosen?: Candidate;
  onReset: () => void;
}) {
  const total = 6; // assemble + 4 pages + deploy/register
  const done = log.filter((l) => /done\.|Deployed|Registered|skipped/i.test(l.text)).length;
  const progress = stage === "complete" ? 100 : Math.min(95, Math.round((done / total) * 100));

  return (
    <section style={{ marginTop: 40 }}>
      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: "var(--paper-elevated)",
          border: "1px solid var(--rule)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          {chosen && (
            <div
              style={{ width: 56, height: 56, flexShrink: 0 }}
              dangerouslySetInnerHTML={{
                __html:
                  chosen.brandKit?.logoSvg || fallbackInlineMonogram(chosen.name),
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2rem)",
                margin: 0,
                letterSpacing: "-.005em",
              }}
            >
              {stage === "complete"
                ? `${chosen?.name || "Your brand"} is live.`
                : `Launching ${chosen?.name || "your brand"}...`}
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "4px 0 0" }}>
              {stage === "complete"
                ? "The site is on the internet. Your domain status is below."
                : "Site building. Streaming live progress."}
            </p>
          </div>
          {stage === "shipping" && (
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--gold-deep)" }} />
          )}
        </div>

        <div
          style={{
            height: 4,
            background: "var(--rule)",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--gold-deep)",
              transition: "width .4s ease",
            }}
          />
        </div>

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: "'JetBrains Mono', 'Menlo', monospace",
            fontSize: 13,
            color: "var(--ink-secondary)",
          }}
        >
          {log.map((entry, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "6px 0",
              }}
            >
              <StepIcon kind={entry.kind} />
              <span>{entry.text}</span>
            </li>
          ))}
          {log.length === 0 && (
            <li style={{ color: "var(--ink-muted)" }}>Waiting for first event...</li>
          )}
        </ol>

        {result && stage === "complete" && (
          <ResultPanel result={result} onReset={onReset} />
        )}
      </div>
    </section>
  );
}

function StepIcon({ kind }: { kind: string }) {
  if (kind === "error") {
    return <XCircle size={14} style={{ color: "#c9322a", flexShrink: 0, marginTop: 2 }} />;
  }
  if (kind === "deploy-step" || kind === "register-step") {
    return <Rocket size={14} style={{ color: "var(--gold-deep)", flexShrink: 0, marginTop: 2 }} />;
  }
  return <Sparkles size={14} style={{ color: "var(--gold-deep)", flexShrink: 0, marginTop: 2 }} />;
}

function ResultPanel({
  result,
  onReset,
}: {
  result: ShipCompleteEvent;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 12,
        background: "var(--paper)",
        border: "1px solid var(--gold)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Live URL
          </div>
          <a
            href={result.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--ink)",
              fontWeight: 600,
              textDecoration: "none",
              wordBreak: "break-all",
            }}
          >
            {result.siteUrl} <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
          </a>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Domain
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={14} style={{ color: "var(--ink-muted)" }} />
            <span style={{ fontWeight: 600 }}>{result.domain}</span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                background: result.domainRegistered ? "var(--gold-deep)" : "var(--rule)",
                color: result.domainRegistered ? "var(--paper)" : "var(--ink-muted)",
              }}
            >
              {result.domainRegistered ? "Registered" : "Not registered"}
            </span>
          </div>
          {!result.domainRegistered && result.registrarError && (
            <p style={{ color: "var(--ink-muted)", fontSize: 12, margin: "6px 0 0" }}>
              {result.registrarError}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={result.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--ink)",
            color: "var(--paper)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Open site <ArrowRight size={14} />
        </a>
        <button
          type="button"
          onClick={onReset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid var(--rule)",
            background: "var(--paper-elevated)",
            color: "var(--ink)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Launch another
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function handleShipEvent(
  evt: ShipEvent,
  setLog: (
    update: (prev: Array<{ kind: string; text: string }>) => Array<{ kind: string; text: string }>,
  ) => void,
  setResult: (r: ShipCompleteEvent | null) => void,
  setBanner: (s: string | null) => void,
  setStage: (s: Stage) => void,
) {
  if (evt.type === "complete") {
    setResult(evt);
    setStage("complete");
    return;
  }
  if (evt.type === "error") {
    setBanner(evt.message || "Launch failed (no message provided).");
    setStage("error");
    return;
  }
  if (evt.message) {
    setLog((prev) => [...prev, { kind: evt.type, text: evt.message! }]);
  }
}

function fallbackInlineMonogram(name: string): string {
  const letter = (name.charAt(0) || "Z").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88"><rect width="88" height="88" rx="14" fill="#0A0A0B"/><text x="44" y="58" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="#FAFAF7">${letter}</text></svg>`;
}
