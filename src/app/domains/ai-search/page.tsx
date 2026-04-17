"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Brain,
  Wand2,
  Shield,
  Globe,
  Trophy,
  Check,
  X,
  Loader2,
  ArrowRight,
  Zap,
  Target,
  Languages,
  ChevronRight,
} from "lucide-react";

// ─── Types mirroring the SSE event payloads from /api/domains/ai-search ────

interface PhasePattern {
  id: string;
  label: string;
  tonality: string;
  rationale: string;
}

interface RawCandidate {
  name: string;
  pattern: string;
  rationale: string;
  phonetic: string;
}

interface ScoredCandidate {
  name: string;
  slug: string;
  pattern: string;
  rationale: string;
  linguistic: "clean" | "warn";
  linguisticReason?: string;
  availability: Record<string, boolean | null>;
  availableTlds: string[];
  score: number;
  scoreBreakdown: Record<string, number>;
}

interface AvailabilityUpdate {
  name: string;
  availability: Record<string, boolean | null>;
  available_tlds: string[];
  score: number;
  index: number;
  total: number;
}

type PhaseId = "patterns" | "candidates" | "trademark" | "linguistic" | "availability" | "shortlist";

interface PhaseStatus {
  id: PhaseId;
  label: string;
  description: string;
  status: "pending" | "active" | "done" | "failed";
  icon: typeof Sparkles;
}

const INITIAL_PHASES: PhaseStatus[] = [
  { id: "patterns", label: "Naming Strategy", description: "AI picks the best naming styles for your mission", status: "pending", icon: Brain },
  { id: "candidates", label: "Name Generation", description: "20-30 candidates across chosen patterns", status: "pending", icon: Wand2 },
  { id: "trademark", label: "Trademark Screen", description: "150+ brand collision check", status: "pending", icon: Shield },
  { id: "linguistic", label: "Linguistic Safety", description: "18 languages — English → Japanese", status: "pending", icon: Languages },
  { id: "availability", label: "TLD Availability", description: "Live registry check on every survivor", status: "pending", icon: Globe },
  { id: "shortlist", label: "Ranked Shortlist", description: "Top-N cleared candidates", status: "pending", icon: Trophy },
];

// ─── SSE parser (no external deps) ──────────────────────────────────────────

interface ParsedEvent {
  event: string;
  data: unknown;
}

function parseSseBlock(block: string): ParsedEvent | null {
  const lines = block.split("\n");
  let event = "message";
  let dataLine = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
  }
  if (!dataLine) return null;
  try {
    return { event, data: JSON.parse(dataLine) };
  } catch {
    return null;
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AiSearchPage() {
  const [mission, setMission] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseStatus[]>(INITIAL_PHASES);

  const [inferredPatterns, setInferredPatterns] = useState<PhasePattern[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [phoneticTarget, setPhoneticTarget] = useState<string>("");

  const [rawCandidates, setRawCandidates] = useState<RawCandidate[]>([]);
  const [tmKept, setTmKept] = useState(0);
  const [tmDropped, setTmDropped] = useState(0);
  const [lingKept, setLingKept] = useState(0);
  const [lingDropped, setLingDropped] = useState(0);
  const [liveAvailability, setLiveAvailability] = useState<AvailabilityUpdate[]>([]);
  const [shortlist, setShortlist] = useState<ScoredCandidate[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const updatePhase = useCallback((id: PhaseId, status: PhaseStatus["status"]) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const reset = useCallback(() => {
    setPhases(INITIAL_PHASES);
    setInferredPatterns([]);
    setThemes([]);
    setPhoneticTarget("");
    setRawCandidates([]);
    setTmKept(0);
    setTmDropped(0);
    setLingKept(0);
    setLingDropped(0);
    setLiveAvailability([]);
    setShortlist([]);
    setError(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (mission.trim().length < 10) {
      setError("Describe the mission — at least 10 characters. What is the platform for?");
      return;
    }
    reset();
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/domains/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: mission.trim() }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}): ${text.slice(0, 300) || "no body"}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep = buffer.indexOf("\n\n");
        while (sep !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const ev = parseSseBlock(block);
          if (ev) handleEvent(ev);
          sep = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("AbortError")) {
        setError("Cancelled.");
      } else {
        setError(msg);
      }
      setPhases((prev) => prev.map((p) => (p.status === "active" ? { ...p, status: "failed" } : p)));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }

    function handleEvent(ev: ParsedEvent) {
      const data = ev.data as Record<string, unknown>;

      if (ev.event === "start") {
        updatePhase("patterns", "active");
        return;
      }

      if (ev.event === "phase:patterns") {
        updatePhase("patterns", "done");
        updatePhase("candidates", "active");
        setInferredPatterns((data.patterns as PhasePattern[]) || []);
        setThemes((data.themes as string[]) || []);
        setPhoneticTarget((data.phonetic_target as string) || "");
        return;
      }

      if (ev.event === "phase:candidates") {
        updatePhase("candidates", "done");
        updatePhase("trademark", "active");
        setRawCandidates((data.candidates as RawCandidate[]) || []);
        return;
      }

      if (ev.event === "phase:trademark") {
        updatePhase("trademark", "done");
        updatePhase("linguistic", "active");
        setTmKept(Number(data.kept) || 0);
        setTmDropped(Number(data.dropped) || 0);
        return;
      }

      if (ev.event === "phase:linguistic") {
        updatePhase("linguistic", "done");
        updatePhase("availability", "active");
        setLingKept(Number(data.kept) || 0);
        setLingDropped(Number(data.dropped) || 0);
        return;
      }

      if (ev.event === "phase:availability") {
        setLiveAvailability((prev) => [...prev, data as unknown as AvailabilityUpdate]);
        return;
      }

      if (ev.event === "phase:shortlist") {
        updatePhase("availability", "done");
        updatePhase("shortlist", "done");
        setShortlist((data.shortlist as ScoredCandidate[]) || []);
        return;
      }

      if (ev.event === "error") {
        const msg = String((data as { message?: string }).message || "Unknown error");
        setError(msg);
        setPhases((prev) => prev.map((p) => (p.status === "active" ? { ...p, status: "failed" } : p)));
        return;
      }
    }
  }, [mission, reset, updatePhase]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white selection:bg-emerald-400/30">
      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute top-0 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl" />
          <div className="absolute top-40 right-0 h-[400px] w-[500px] rounded-full bg-gradient-to-bl from-violet-500/15 to-transparent blur-3xl" />
        </div>
        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex justify-center mb-6">
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white/80 hover:border-white/25 hover:text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              World-First Advanced AI Brand Search
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <h1 className="text-center font-serif text-5xl leading-[1.02] tracking-[-0.02em] sm:text-7xl lg:text-[96px]">
            <span className="block">Brand names,</span>
            <span className="block bg-gradient-to-r from-emerald-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent italic">
              invented for you.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-white/70 sm:text-xl">
            The most advanced domain search on the internet. Describe your business —
            the AI invents original brand names, screens for trademark conflicts,
            checks 18 languages for bad meanings, and verifies live availability with
            the registry. All streamed live as it works.
          </p>

          {/* ── Prompt ── */}
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="group relative rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-2 transition focus-within:border-emerald-400/50 focus-within:bg-white/8">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-violet-400/20 opacity-0 blur-xl transition group-focus-within:opacity-100" />
              <div className="relative rounded-[22px] bg-[#0a0a0f]/80 p-6">
                <label className="block text-xs font-medium uppercase tracking-widest text-white/50 mb-3">
                  Describe the mission
                </label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="A unified compute edge platform for AI teams — fast, autonomous, everywhere."
                  rows={3}
                  className="w-full resize-none bg-transparent text-lg text-white placeholder-white/30 outline-none"
                  disabled={running}
                />
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-white/40">
                    Tip: be specific about tonality (velocity, edge, autonomous, luxurious, editorial).
                  </div>
                  {running ? (
                    <button
                      onClick={cancel}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running — cancel
                    </button>
                  ) : (
                    <button
                      onClick={handleRun}
                      className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)] hover:shadow-[0_0_60px_-5px_rgba(16,185,129,1)] transition-all hover:scale-[1.02]"
                    >
                      <Zap className="h-4 w-4" />
                      Coin names
                      <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                <strong className="font-semibold">Engine error:</strong> {error}
              </div>
            )}
          </div>

          {/* ── Capability strip ── */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "10", l: "Naming strategies" },
              { k: "150+", l: "Brand blocklist" },
              { k: "18", l: "Languages screened" },
              { k: "6", l: "Live pipeline phases" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 text-center"
              >
                <div className="font-serif text-3xl bg-gradient-to-br from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  {s.k}
                </div>
                <div className="mt-1 text-xs text-white/50">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pipeline ───── */}
      <section className="relative border-t border-white/5 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-300">
              <Target className="h-3.5 w-3.5" />
              Live pipeline
            </div>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl tracking-tight">
              Watch the engine think.
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-white/60">
              Six phases. Each phase streams its verdict the moment it's ready — no spinners, no waiting, no mystery.
            </p>
          </div>

          {/* Phase grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {phases.map((phase) => {
              const Icon = phase.icon;
              const active = phase.status === "active";
              const done = phase.status === "done";
              const failed = phase.status === "failed";
              return (
                <div
                  key={phase.id}
                  className={`group relative overflow-hidden rounded-2xl border p-6 transition-all ${
                    active
                      ? "border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
                      : done
                        ? "border-white/20 bg-white/[0.04]"
                        : failed
                          ? "border-red-400/40 bg-red-500/5"
                          : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {active && (
                    <div className="pointer-events-none absolute inset-0 opacity-30">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent animate-pulse" />
                    </div>
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active
                            ? "bg-emerald-400/20 text-emerald-300"
                            : done
                              ? "bg-white/10 text-white"
                              : failed
                                ? "bg-red-500/20 text-red-300"
                                : "bg-white/5 text-white/40"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        {active && <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />}
                        {done && <Check className="h-4 w-4 text-emerald-300" />}
                        {failed && <X className="h-4 w-4 text-red-300" />}
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{phase.label}</h3>
                    <p className="mt-1 text-sm text-white/50">{phase.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Phase 1 — Patterns ── */}
          {inferredPatterns.length > 0 && (
            <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="mb-6 flex items-center gap-3">
                <Brain className="h-5 w-5 text-emerald-300" />
                <h3 className="text-xl font-semibold">Chosen naming strategies</h3>
                {phoneticTarget && (
                  <span className="ml-auto rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs font-medium text-cyan-200">
                    {phoneticTarget}
                  </span>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {inferredPatterns.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-xs font-mono uppercase tracking-widest text-emerald-300/80">
                      {p.id}
                    </div>
                    <div className="mt-2 font-semibold text-white">{p.label}</div>
                    <div className="mt-3 text-sm text-white/60 leading-relaxed">{p.rationale}</div>
                  </div>
                ))}
              </div>
              {themes.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {themes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Phase 2 — Candidates ── */}
          {rawCandidates.length > 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="mb-4 flex items-center gap-3">
                <Wand2 className="h-5 w-5 text-cyan-300" />
                <h3 className="text-xl font-semibold">{rawCandidates.length} candidates generated</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {rawCandidates.map((c) => (
                  <span
                    key={c.name}
                    title={`${c.pattern} — ${c.rationale}`}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-mono text-white/80"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Phase 3+4 — Filters summary ── */}
          {(tmKept > 0 || lingKept > 0) && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {tmKept > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-white/70" />
                    <h3 className="font-semibold">Trademark screen</h3>
                  </div>
                  <div className="mt-4 flex items-baseline gap-6">
                    <div>
                      <div className="text-3xl font-serif text-emerald-300">{tmKept}</div>
                      <div className="text-xs uppercase tracking-widest text-white/40">kept</div>
                    </div>
                    <div>
                      <div className="text-3xl font-serif text-red-300">{tmDropped}</div>
                      <div className="text-xs uppercase tracking-widest text-white/40">dropped</div>
                    </div>
                  </div>
                </div>
              )}
              {lingKept > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5 text-white/70" />
                    <h3 className="font-semibold">Linguistic safety (18 langs)</h3>
                  </div>
                  <div className="mt-4 flex items-baseline gap-6">
                    <div>
                      <div className="text-3xl font-serif text-emerald-300">{lingKept}</div>
                      <div className="text-xs uppercase tracking-widest text-white/40">cleared</div>
                    </div>
                    <div>
                      <div className="text-3xl font-serif text-red-300">{lingDropped}</div>
                      <div className="text-xs uppercase tracking-widest text-white/40">blocked</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Phase 5 — Live availability stream ── */}
          {liveAvailability.length > 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-5 w-5 text-violet-300" />
                <h3 className="text-xl font-semibold">Live registry check</h3>
                <span className="ml-auto text-xs text-white/40">
                  {liveAvailability.length} / {liveAvailability[0]?.total || "?"}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {liveAvailability.map((a) => (
                  <div
                    key={a.name}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="font-mono text-sm text-white/90 w-28">{a.name}</div>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {Object.entries(a.availability).map(([tld, ok]) => (
                        <span
                          key={tld}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono ${
                            ok === true
                              ? "bg-emerald-400/15 text-emerald-200"
                              : ok === false
                                ? "bg-red-400/10 text-red-300/70 line-through"
                                : "bg-white/5 text-white/40"
                          }`}
                        >
                          .{tld}
                          {ok === true && <Check className="h-3 w-3" />}
                          {ok === false && <X className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                    <div className="font-mono text-xs text-white/50">{a.score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ───── Shortlist ───── */}
      {shortlist.length > 0 && (
        <section className="relative border-t border-white/5 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-violet-400/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Ranked shortlist
              </div>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl tracking-tight">
                The {shortlist.length} cleared names.
              </h2>
              <p className="mt-4 mx-auto max-w-xl text-white/60">
                Every name below passed trademark, linguistic, and availability checks. Ranked by a transparent score.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shortlist.map((c, i) => (
                <div
                  key={c.name}
                  className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 transition-all hover:border-emerald-400/40 hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.4)]"
                >
                  <div className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-xs font-mono text-white/60">
                    #{i + 1}
                  </div>
                  <div className="font-serif text-5xl tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                    {c.name}
                  </div>
                  <div className="mt-2 text-xs font-mono uppercase tracking-widest text-emerald-300/70">
                    {c.pattern}
                  </div>
                  <p className="mt-4 text-sm text-white/60 leading-relaxed">{c.rationale}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {Object.entries(c.availability).map(([tld, ok]) => (
                      <Link
                        key={tld}
                        href={`/domains?q=${c.slug}`}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
                          ok === true
                            ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
                            : ok === false
                              ? "bg-red-400/10 text-red-300/60 line-through"
                              : "bg-white/5 text-white/40"
                        }`}
                      >
                        .{tld}
                        {ok === true && <Check className="h-3 w-3" />}
                        {ok === false && <X className="h-3 w-3" />}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-widest text-white/40">Score</div>
                      <div className="font-mono text-2xl text-emerald-300">{c.score}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(c.scoreBreakdown).map(([k, v]) => (
                        <span
                          key={k}
                          className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                            v >= 0 ? "bg-white/5 text-white/60" : "bg-red-500/10 text-red-300/70"
                          }`}
                        >
                          {k}:{v >= 0 ? `+${v}` : v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/domains?q=${c.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_-8px_rgba(16,185,129,0.8)] hover:shadow-[0_0_50px_-5px_rgba(16,185,129,1)] transition-all"
                  >
                    Register {c.name.toLowerCase()}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── Footer CTA ───── */}
      <section className="relative border-t border-white/5 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-serif text-2xl text-white/80 italic">
            &ldquo;Names aren&apos;t generated. They&apos;re invented for you.&rdquo;
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Classic domain search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
