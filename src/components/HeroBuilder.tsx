"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Check } from "lucide-react";

/**
 * HeroBuilder — the homepage IS the product.
 *
 * Philosophy:
 *   A visitor lands on zoobicon.com and the first thing they see is
 *   not marketing copy. It is an input box. They type a sentence.
 *   The homepage itself morphs into their site, live, in front of
 *   them, while six agents visibly collaborate across the top of the
 *   screen. There is no "scroll down to learn more." The product IS
 *   the homepage.
 *
 * Two modes:
 *   1. Idle (landing state) — huge editorial headline + one input box,
 *      pre-focused, with a rotating placeholder. Six agent orbs sit
 *      dim at the top of the viewport. Everything else on the page
 *      is deliberately quiet — no cyberpunk glow, no floating UI
 *      fragments, no gradient text. Warm off-white accents against
 *      deep ink. Editorial, not synthwave.
 *
 *   2. Building (after submit) — the input box shrinks to the top,
 *      the six agents light up in sequence and each broadcasts one
 *      line, the canvas below morphs into the rendered site as
 *      components stream in. On completion, a floating "your site
 *      is ready — open in builder" CTA slides in.
 *
 * Why this beats every competitor:
 *   Every other AI builder shows a marketing page describing the
 *   product and pushes you to click "start building." We remove
 *   the click. The homepage IS the builder. The visitor is a user
 *   from second 1.
 */

type Stage = {
  id: string;
  agent: string;
  icon: string;
  role: string;
  line: string;
  at: number;
};

// Each of these agents exists for real in src/lib/agents.ts — the
// Strategist, Brand Designer, Architect, Copywriter, Developer (Opus)
// and SEO agent. We expose them. Nobody else shows their agents.
const AGENTS: Stage[] = [
  {
    id: "strategist",
    agent: "Strategist",
    icon: "🧭",
    role: "Positioning",
    line: "Reading the brief, mapping the audience.",
    at: 400,
  },
  {
    id: "brand",
    agent: "Brand Designer",
    icon: "🎨",
    role: "Palette + type",
    line: "Warm off-white, serif display, one accent.",
    at: 1400,
  },
  {
    id: "architect",
    agent: "Architect",
    icon: "🏗️",
    role: "Structure",
    line: "Navbar → hero → proof → features → pricing → footer.",
    at: 2400,
  },
  {
    id: "copy",
    agent: "Copywriter",
    icon: "✍️",
    role: "Voice",
    line: "Headlines drafted. Editorial tone, no marketing-speak.",
    at: 3400,
  },
  {
    id: "dev",
    agent: "Developer",
    icon: "⚡",
    role: "Opus 4.6",
    line: "Streaming components into your preview.",
    at: 4600,
  },
  {
    id: "seo",
    agent: "SEO",
    icon: "🔍",
    role: "Meta + schema",
    line: "Open Graph, JSON-LD, sitemap. Shipped.",
    at: 6200,
  },
];

const PLACEHOLDERS = [
  "A specialty coffee roaster in Brooklyn",
  "A law firm with fixed-fee contracts",
  "A wedding photographer in Melbourne",
  "An AI analytics dashboard for cohorts",
  "A dental clinic with online booking",
  "A ceramics shop with Stripe checkout",
];

function usePlaceholder() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const cur = PLACEHOLDERS[idx];
    if (!del && text === cur) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setIdx((i) => (i + 1) % PLACEHOLDERS.length);
      return;
    }
    const t = setTimeout(
      () =>
        setText(
          del ? cur.slice(0, text.length - 1) : cur.slice(0, text.length + 1)
        ),
      del ? 22 : 42
    );
    return () => clearTimeout(t);
  }, [text, del, idx]);

  return text;
}

type BuildPhase =
  | "start"
  | "frame"
  | "navbar"
  | "hero"
  | "features"
  | "pricing"
  | "footer"
  | "done";


// Map a real API phase → which agent should be lit up + which
// visual build stage the morphing canvas should be on. This is how
// the scripted theatre gets replaced with real progress: we listen
// to the SSE stream and drive both the agent bar and the preview
// canvas off the actual events the server emits.
function phaseToAgentIdx(phase: string): number {
  switch (phase) {
    case "planning":
      return 0; // Strategist
    case "selecting":
      return 2; // Architect
    case "generating":
      return 4; // Developer (brand + copy folded in visually)
    case "customizing":
      return 3; // Copywriter (mid-generation micro-phase)
    case "supabase":
      return 4; // Developer
    case "qa":
    case "critique":
      return 5; // SEO / QA
    default:
      return -1;
  }
}

function phaseToBuildStage(phase: string, componentProgress: number): BuildPhase {
  if (phase === "planning") return "frame";
  if (phase === "selecting") return "frame";
  if (phase === "generating" || phase === "customizing") {
    // Walk the canvas through navbar → hero → features → pricing
    // → footer as components come in.
    if (componentProgress >= 0.95) return "footer";
    if (componentProgress >= 0.75) return "pricing";
    if (componentProgress >= 0.5) return "features";
    if (componentProgress >= 0.25) return "hero";
    return "navbar";
  }
  if (phase === "supabase") return "pricing";
  if (phase === "qa" || phase === "critique") return "footer";
  if (phase === "done") return "done";
  return "start";
}

export default function HeroBuilder() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholder = usePlaceholder();
  const abortRef = useRef<AbortController | null>(null);

  const [prompt, setPrompt] = useState("");
  const [building, setBuilding] = useState(false);
  const [activeAgentIdx, setActiveAgentIdx] = useState(-1);
  const [phase, setPhase] = useState<BuildPhase>("start");
  const [showClaim, setShowClaim] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [componentsDone, setComponentsDone] = useState(0);
  const [componentsTotal, setComponentsTotal] = useState(0);
  const [streamError, setStreamError] = useState<string>("");

  // Pre-focus on mount so a visitor can just start typing
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  // Clean up any in-flight stream on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Reset back to idle (e.g. on error retry)
  const resetBuild = () => {
    abortRef.current?.abort();
    setBuilding(false);
    setActiveAgentIdx(-1);
    setPhase("start");
    setShowClaim(false);
    setLiveMessage("");
    setBrandName("");
    setComponentsDone(0);
    setComponentsTotal(0);
    setStreamError("");
  };

  // Fire the real SSE stream and drive the theatre from real events
  const runRealStream = async (userPrompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate/react-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, tier: "standard" }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let localTotal = 0;
      let localDone = 0;
      let latestFiles: Record<string, string> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          const type = event.type as string;

          if (type === "status") {
            const message = (event.message as string) || "";
            const phaseKey = (event.phase as string) || "";
            if (message) setLiveMessage(message);

            const idx = phaseToAgentIdx(phaseKey);
            if (idx >= 0) {
              setActiveAgentIdx((prev) => (idx > prev ? idx : prev));
            }

            const progress = localTotal > 0 ? localDone / localTotal : 0;
            if (phaseKey) {
              setPhase(phaseToBuildStage(phaseKey, progress));
            }

            // Pull brandName out of status messages like
            // "Customising N components for <Brand>…"
            const m = message.match(/for (.+?)[…\.]/);
            if (m && m[1]) setBrandName(m[1].trim());
          } else if (type === "partial") {
            const files = event.files as Record<string, string> | undefined;
            if (files) {
              latestFiles = files;
            }
            if (typeof event.fileCount === "number") {
              localDone = event.fileCount;
              setComponentsDone(event.fileCount);
            }
            if (typeof event.totalComponents === "number") {
              localTotal = event.totalComponents;
              setComponentsTotal(event.totalComponents);
            }
            // Drive the morph canvas proportionally through stages
            const progress = localTotal > 0 ? localDone / localTotal : 0;
            setPhase(phaseToBuildStage("generating", progress));
          } else if (type === "done") {
            const files = (event.files as Record<string, string>) || latestFiles;
            if (files && typeof window !== "undefined") {
              try {
                sessionStorage.setItem(
                  "zoobicon_hero_build",
                  JSON.stringify({
                    prompt: userPrompt,
                    files,
                    brandName,
                    at: Date.now(),
                  })
                );
              } catch {
                // Storage quota / private mode — safe to ignore;
                // the builder page will regenerate from the prompt.
              }
            }
            setPhase("done");
            setActiveAgentIdx(AGENTS.length - 1);
            setShowClaim(true);
            setLiveMessage("");
            return;
          } else if (type === "error") {
            throw new Error(
              (event.message as string) || "Generation failed"
            );
          }
        }
      }

      // Stream ended without an explicit done event — still show claim
      setPhase("done");
      setShowClaim(true);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg =
        err instanceof Error ? err.message : "Something went wrong";
      setStreamError(msg);
      setLiveMessage("");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = prompt.trim() || placeholder;
    if (!p) return;
    setPrompt(p);
    setBuilding(true);
    setStreamError("");
    void runRealStream(p);
  };

  const goToBuilder = () => {
    router.push(`/builder?prompt=${encodeURIComponent(prompt)}&fromHero=1`);
  };

  const phaseShown = (key: BuildPhase) => {
    const order: BuildPhase[] = [
      "start",
      "frame",
      "navbar",
      "hero",
      "features",
      "pricing",
      "footer",
      "done",
    ];
    return order.indexOf(phase) >= order.indexOf(key);
  };

  return (
    <section
      className={`relative flex flex-col items-center justify-start px-4 sm:px-6 transition-all duration-700 ${
        building ? "pt-28 pb-20" : "min-h-[92vh] pt-32 pb-16"
      }`}
    >
      {/* Editorial ambient — ONE warm glow, not cyberpunk orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8D4B0]/[0.06] blur-[140px]" />
      </div>

      {/* ── Agent bar ── */}
      <div
        className={`w-full max-w-5xl transition-all duration-500 ${
          building ? "mb-10 opacity-100" : "mb-14 opacity-60"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {AGENTS.map((a, i) => {
            const isActive = building && i === activeAgentIdx;
            const isDone = building && i < activeAgentIdx;
            return (
              <div
                key={a.id}
                className={`group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-all duration-500 ${
                  isActive
                    ? "border-[#E8D4B0]/60 bg-[#E8D4B0]/[0.08] text-white scale-[1.04]"
                    : isDone
                    ? "border-emerald-400/30 bg-emerald-400/[0.04] text-emerald-200/80"
                    : "border-white/[0.08] bg-white/[0.02] text-white/40"
                }`}
              >
                <span className="text-sm">{a.icon}</span>
                <span className="font-medium tracking-tight">{a.agent}</span>
                {isActive && (
                  <span className="relative ml-1 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8D4B0]/80" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E8D4B0]" />
                  </span>
                )}
                {isDone && <Check className="h-3 w-3 text-emerald-300" strokeWidth={3} />}
              </div>
            );
          })}
        </div>

        {/* Live broadcast line — real server message, fallback to fixture */}
        <div className="mt-4 min-h-[20px] text-center px-4">
          {building && activeAgentIdx >= 0 && (
            <p
              key={`${activeAgentIdx}-${liveMessage}`}
              className="text-[13px] text-white/60 animate-[fadeIn_0.4s_ease-out]"
            >
              <span className="text-white/40">
                {AGENTS[activeAgentIdx].agent}:
              </span>{" "}
              <span className="italic">
                {liveMessage || AGENTS[activeAgentIdx].line}
              </span>
              {componentsTotal > 0 && (
                <span className="ml-2 font-mono text-[11px] text-white/35">
                  {componentsDone}/{componentsTotal}
                </span>
              )}
            </p>
          )}
          {streamError && (
            <p className="text-[13px] text-rose-300/80 animate-[fadeIn_0.4s_ease-out]">
              <span className="text-rose-400/70">Build failed:</span>{" "}
              <span className="italic">{streamError}</span>{" "}
              <button
                onClick={resetBuild}
                className="ml-2 underline underline-offset-2 hover:text-rose-200"
              >
                Try again
              </button>
            </p>
          )}
        </div>
      </div>

      {/* ── Idle state: huge editorial headline ── */}
      {!building && (
        <div className="mb-8 max-w-4xl text-center">
          <p className="mb-6 text-[11px] uppercase tracking-[0.22em] text-white/40 font-medium">
            Six agents. One prompt. Your site, live.
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-[6.5rem] leading-[1.02] font-semibold tracking-[-0.035em] text-white">
            Describe it.{" "}
            <span className="font-serif italic font-normal text-[#E8D4B0]">
              Watch
            </span>{" "}
            it build.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/55">
            This page is the product. Type a sentence below and six AI
            agents will stream a complete, deployable website into the
            preview — live, in front of you.
          </p>
        </div>
      )}

      {/* ── Input ── */}
      <form
        onSubmit={onSubmit}
        className={`relative w-full transition-all duration-700 ${
          building ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <div
          className={`relative rounded-2xl border bg-white/[0.02] backdrop-blur-xl transition-all duration-500 ${
            building
              ? "border-[#E8D4B0]/30"
              : "border-white/10 hover:border-white/20 focus-within:border-[#E8D4B0]/40"
          }`}
        >
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
            readOnly={building}
            rows={building ? 1 : 2}
            placeholder={building ? "" : placeholder}
            className="w-full resize-none bg-transparent px-6 py-5 pr-32 text-lg leading-relaxed text-white placeholder:text-white/25 focus:outline-none sm:text-xl"
          />
          <button
            type="submit"
            disabled={building}
            className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:-translate-y-[calc(50%+2px)] hover:shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:hover:translate-y-[-50%]"
          >
            {building ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Building
              </>
            ) : (
              <>
                Build it <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {!building && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/35">
            <span className="mr-1">Try:</span>
            {[
              "Coffee roaster",
              "Law firm",
              "Photographer",
              "SaaS landing",
              "Dental clinic",
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPrompt(`A ${t.toLowerCase()} website`);
                  inputRef.current?.focus();
                }}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 transition-colors hover:border-white/20 hover:text-white/70"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* ── Morphing preview canvas (only visible while building) ── */}
      {building && (
        <div className="mt-12 w-full max-w-5xl">
          <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.015] shadow-2xl backdrop-blur-xl">
            {/* browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="ml-3 font-mono text-[10px] text-white/40">
                zoobicon.com/preview
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5">
                <span className="relative flex h-1 w-1">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[9px] font-medium text-emerald-300/80">
                  live
                </span>
              </span>
            </div>

            {/* rendered fake site — editorial, not cyberpunk */}
            <div className="relative h-[460px] overflow-hidden bg-[#0a0a0c]">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#E8D4B0]/[0.08] blur-[90px]" />

              <div className="relative flex h-full flex-col">
                {/* fake navbar */}
                <div
                  className={`flex items-center justify-between border-b border-white/[0.04] px-6 py-4 transition-all duration-500 ${
                    phaseShown("navbar")
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-[#E8D4B0]" />
                    <span className="text-[13px] font-semibold tracking-tight text-white">
                      {brandName || "Your brand"}
                    </span>
                  </div>
                  <div className="hidden items-center gap-5 text-[11px] text-white/50 sm:flex">
                    <span>Product</span>
                    <span>Pricing</span>
                    <span>About</span>
                    <span className="rounded-full bg-[#E8D4B0] px-3 py-1 text-[10px] font-semibold text-black">
                      Get started
                    </span>
                  </div>
                </div>

                {/* fake hero */}
                <div
                  className={`px-6 pt-10 pb-6 sm:px-10 transition-all duration-700 ${
                    phaseShown("hero")
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  <p className="mb-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]">
                    New this season
                  </p>
                  <h3 className="max-w-md text-[24px] sm:text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-white">
                    Built from your sentence.{" "}
                    <span className="font-serif italic font-normal text-[#E8D4B0]">
                      Shipped
                    </span>{" "}
                    from your browser.
                  </h3>
                  <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-white/50">
                    Every component in this preview was selected by six AI
                    agents in the last few seconds.
                  </p>
                </div>

                {/* fake features grid */}
                <div
                  className={`grid grid-cols-3 gap-2 px-6 pb-5 sm:px-10 transition-all duration-700 ${
                    phaseShown("features")
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  {[
                    "Real domain",
                    "Live hosting",
                    "Stripe wired",
                  ].map((f, i) => (
                    <div
                      key={f}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"
                      style={{
                        transitionDelay: phaseShown("features")
                          ? `${i * 100}ms`
                          : "0ms",
                      }}
                    >
                      <div className="mb-2 h-1 w-4 rounded-full bg-[#E8D4B0]" />
                      <div className="text-[10px] font-semibold leading-tight text-white">
                        {f}
                      </div>
                      <div className="mt-0.5 text-[9px] text-white/40">
                        Shipped by default
                      </div>
                    </div>
                  ))}
                </div>

                {/* fake pricing strip */}
                <div
                  className={`mx-6 mb-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-2.5 sm:mx-10 transition-all duration-700 ${
                    phaseShown("pricing")
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[15px] font-semibold text-white">
                      $49
                    </div>
                    <div className="text-[9px] text-white/40">
                      / mo · everything bundled
                    </div>
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-[#E8D4B0]" />
                </div>

                {/* fake footer */}
                <div
                  className={`mt-auto flex items-center justify-between border-t border-white/[0.04] px-6 py-3 text-[9px] text-white/30 sm:px-10 transition-all duration-700 ${
                    phaseShown("footer") ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span>© {brandName || "Your brand"} — built with Zoobicon</span>
                  <span className="font-mono">
                    {componentsTotal > 0
                      ? `${componentsDone}/${componentsTotal} components`
                      : "Live streaming"}
                  </span>
                </div>

                {/* done badge */}
                {phaseShown("done") && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 backdrop-blur animate-[fadeIn_0.4s_ease-out]">
                      <Check
                        className="h-2.5 w-2.5 text-emerald-300"
                        strokeWidth={3}
                      />
                      <span className="text-[9px] font-semibold text-emerald-200">
                        ready
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Claim CTA slides in after done */}
          {showClaim && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.04] px-5 py-4 backdrop-blur animate-[fadeIn_0.5s_ease-out]">
              <div>
                <div className="text-[13px] font-semibold text-white">
                  Your site is ready.
                </div>
                <div className="text-[11px] text-white/50">
                  Open it in the full builder to tweak, deploy, or buy a
                  domain.
                </div>
              </div>
              <button
                onClick={goToBuilder}
                className="inline-flex items-center gap-2 rounded-full bg-[#E8D4B0] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E8D4B0]/20"
              >
                Open in builder
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
