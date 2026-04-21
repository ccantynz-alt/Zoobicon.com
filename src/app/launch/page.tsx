"use client";

/**
 * /launch — Rung 3: one-prompt business launch flow.
 *
 * Flow:
 *   1. User types one-sentence business description → POST /api/launch/plan
 *   2. Page shows plan + 12 brand names with live availability checks
 *      (parallel worker pool of 4, each calling /api/domains/search)
 *   3. User clicks a domain → POST /api/launch/assemble
 *   4. Page shows launch-kit cards with CTAs (builder, video, checkout, email)
 *
 * Design: cinematic deep-navy, dotted grid pattern, large display typography,
 * lucide icons, framer-motion reveals. Matches the rest of the navy palette
 * (bg-[#0b1530], surface / surface-elevated from globals.css).
 *
 * Law 8 — no blank screens. Every failure state renders a visible message.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield,
  Gem,
  Rocket,
  Video,
  ShoppingCart,
  Mail,
  RefreshCcw,
  Target,
  Sparkle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types matching the API contracts
// ---------------------------------------------------------------------------

type TLD = "com" | "ai" | "io" | "sh";

interface BrandNameSuggestion {
  name: string;
  tld: TLD;
  rationale: string;
}

interface StarterSection {
  id: "hero" | "features" | "pricing" | "about" | "contact";
  headline: string;
  subhead: string;
  bullets: string[];
}

interface LaunchPlan {
  concept: string;
  targetCustomer: string;
  positioning: string;
  taglines: string[];
  brandNames: BrandNameSuggestion[];
  suggestedTlds: Array<{ tld: string; reason: string }>;
  starterSections: StarterSection[];
  emailPrefixes: string[];
  meta: { model: string; elapsedMs: number };
}

interface AvailabilityState {
  status: "pending" | "checking" | "available" | "taken" | "unknown" | "error";
  price: number | null;
  message?: string;
}

interface LaunchKit {
  domain: {
    name: string;
    availability: {
      available: boolean | null;
      price: number | null;
      tld: string;
      confidence: "high" | "low" | "unknown";
      unavailableReason?: string;
    };
    trademark: {
      status: "clear" | "conflict" | "unknown" | "unavailable";
      registries_checked: string[];
      conflictCount: number;
      notes: string | null;
      unavailableReason?: string;
    };
    valuation: {
      low: number | null;
      high: number | null;
      midpoint: number | null;
      confidence: "low" | "medium" | "high" | "unknown";
      factors: string[];
      unavailableReason?: string;
    };
  };
  brand: { name: string; tagline: string; positioning: string; concept: string };
  nextSteps: Array<{
    action: "build-site" | "create-video" | "buy-domain" | "connect-email";
    href: string;
    label: string;
    description: string;
  }>;
  meta: { assembledAt: string; partialFailures: string[] };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LaunchPage() {
  const [prompt, setPrompt] = useState("");
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<LaunchPlan | null>(null);

  const [availability, setAvailability] = useState<Record<string, AvailabilityState>>({});
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const [assembling, setAssembling] = useState(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [kit, setKit] = useState<LaunchKit | null>(null);

  // Abort controllers — one active at a time per phase
  const planAbort = useRef<AbortController | null>(null);
  const availAbort = useRef<AbortController | null>(null);
  const assembleAbort = useRef<AbortController | null>(null);

  // Abort everything on unmount
  useEffect(() => {
    return () => {
      planAbort.current?.abort();
      availAbort.current?.abort();
      assembleAbort.current?.abort();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Step 1 — request a plan
  // -----------------------------------------------------------------------
  async function requestPlan(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 6) {
      setPlanError("Describe your business in at least 6 characters.");
      return;
    }
    // Reset downstream state
    setPlan(null);
    setKit(null);
    setSelectedDomain(null);
    setAvailability({});
    setAssembleError(null);

    setPlanError(null);
    setPlanning(true);

    planAbort.current?.abort();
    const ac = new AbortController();
    planAbort.current = ac;

    try {
      const res = await fetch("/api/launch/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
        signal: ac.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPlanError(
          (typeof data?.error === "string" && data.error) ||
            `Launch planner failed (HTTP ${res.status}). Please try again.`,
        );
        return;
      }
      setPlan(data as LaunchPlan);
      // Kick off availability checks after a tick so the UI paints first
      queueMicrotask(() => runAvailabilityChecks(data as LaunchPlan));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPlanError(
        err instanceof Error
          ? `Could not reach the launch planner: ${err.message}`
          : "Could not reach the launch planner. Check your connection and try again.",
      );
    } finally {
      setPlanning(false);
    }
  }

  // -----------------------------------------------------------------------
  // Step 2 — check availability in a 4-wide worker pool
  // -----------------------------------------------------------------------
  async function runAvailabilityChecks(p: LaunchPlan) {
    availAbort.current?.abort();
    const ac = new AbortController();
    availAbort.current = ac;

    const initial: Record<string, AvailabilityState> = {};
    for (const b of p.brandNames) {
      initial[fullDomain(b)] = { status: "pending", price: null };
    }
    setAvailability(initial);

    const queue = [...p.brandNames];
    const WORKERS = 4;

    async function worker() {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        const domain = fullDomain(item);
        setAvailability((prev) => ({
          ...prev,
          [domain]: { status: "checking", price: null },
        }));
        try {
          const url = `/api/domains/search?q=${encodeURIComponent(item.name)}&tlds=${item.tld}`;
          const res = await fetch(url, { signal: ac.signal });
          if (!res.ok) {
            setAvailability((prev) => ({
              ...prev,
              [domain]: {
                status: "error",
                price: null,
                message: `Search failed (HTTP ${res.status})`,
              },
            }));
            continue;
          }
          const data = await res.json();
          const match =
            (Array.isArray(data?.results) ? data.results : []).find(
              (r: { domain?: string }) =>
                typeof r.domain === "string" && r.domain.toLowerCase() === domain,
            ) || data?.results?.[0];
          if (!match) {
            setAvailability((prev) => ({
              ...prev,
              [domain]: { status: "unknown", price: null },
            }));
            continue;
          }
          const status: AvailabilityState["status"] =
            match.available === true
              ? "available"
              : match.available === false
                ? "taken"
                : "unknown";
          setAvailability((prev) => ({
            ...prev,
            [domain]: {
              status,
              price: typeof match.price === "number" ? match.price : null,
            },
          }));
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          setAvailability((prev) => ({
            ...prev,
            [domain]: {
              status: "error",
              price: null,
              message: err instanceof Error ? err.message : "Unknown error",
            },
          }));
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, worker));
  }

  // -----------------------------------------------------------------------
  // Step 3 — assemble the launch kit for the chosen domain
  // -----------------------------------------------------------------------
  async function chooseDomain(b: BrandNameSuggestion) {
    if (!plan) return;
    const domain = fullDomain(b);
    setSelectedDomain(domain);
    setAssembleError(null);
    setKit(null);
    setAssembling(true);

    assembleAbort.current?.abort();
    const ac = new AbortController();
    assembleAbort.current = ac;

    try {
      const res = await fetch("/api/launch/assemble", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          chosenDomain: domain,
          plan,
        }),
        signal: ac.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssembleError(
          (typeof data?.error === "string" && data.error) ||
            `Assembly failed (HTTP ${res.status}). Please try again.`,
        );
        return;
      }
      setKit(data as LaunchKit);
      // Scroll the kit into view after paint
      requestAnimationFrame(() => {
        document.getElementById("launch-kit")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setAssembleError(
        err instanceof Error
          ? `Could not assemble the launch kit: ${err.message}`
          : "Could not assemble the launch kit. Please try again.",
      );
    } finally {
      setAssembling(false);
    }
  }

  // -----------------------------------------------------------------------
  // Derived UI state
  // -----------------------------------------------------------------------
  const availableCount = useMemo(
    () => Object.values(availability).filter((a) => a.status === "available").length,
    [availability],
  );
  const totalChecked = useMemo(
    () =>
      Object.values(availability).filter(
        (a) => a.status === "available" || a.status === "taken" || a.status === "unknown",
      ).length,
    [availability],
  );

  return (
    <main className="relative min-h-screen bg-[#0b1530] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59,130,246,0.15), transparent 60%)",
        }}
      />
      {/* Dotted grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 50%, transparent 100%)",
        }}
      />

      <section className="relative mx-auto max-w-5xl px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/70"
        >
          <Sparkle className="h-3.5 w-3.5 text-indigo-300" />
          Rung 3 — One-prompt launch
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
          className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          Describe your business.
          <br />
          <span className="bg-gradient-to-r from-indigo-200 via-sky-200 to-white bg-clip-text text-transparent">
            We&apos;ll plan the launch.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
          className="mt-5 max-w-2xl text-lg text-white/70 md:text-xl"
        >
          One sentence in. A brand, twelve names with live availability, a positioning
          statement, starter page sections, and an execute button for every next step.
        </motion.p>

        <form onSubmit={requestPlan} className="mt-10">
          <div className="surface-elevated flex flex-col gap-3 p-3 md:flex-row md:items-stretch">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. An AI scheduling assistant for solo trades in New Zealand that books jobs from text messages."
              rows={3}
              maxLength={1200}
              className="min-h-[88px] flex-1 resize-none bg-transparent px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none md:text-lg"
              disabled={planning}
            />
            <button
              type="submit"
              disabled={planning || prompt.trim().length < 6}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#060e1f] transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/70 md:px-8"
            >
              {planning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Planning
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  Plan my launch
                </>
              )}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/50">
            <span>{prompt.length}/1200</span>
            <span>Powered by Claude Haiku with cross-provider failover</span>
          </div>
        </form>

        {planError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-red-300" />
            <div className="flex-1">
              <div className="font-medium">Couldn&apos;t generate your launch plan</div>
              <div className="mt-1 text-red-100/80">{planError}</div>
            </div>
            <button
              onClick={() => requestPlan()}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
            >
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </motion.div>
        )}
      </section>

      {/* Plan + brand names */}
      <AnimatePresence>
        {plan && (
          <motion.section
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-6xl px-6 pb-16"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <PlanCard
                icon={<Target className="h-4 w-4 text-indigo-300" />}
                label="Target customer"
                body={plan.targetCustomer}
              />
              <PlanCard
                icon={<Sparkles className="h-4 w-4 text-sky-300" />}
                label="Concept"
                body={plan.concept}
              />
              <PlanCard
                icon={<Rocket className="h-4 w-4 text-fuchsia-300" />}
                label="Positioning"
                body={plan.positioning}
              />
            </div>

            {plan.taglines.length > 0 && (
              <div className="mt-4 surface p-5">
                <div className="text-xs font-medium uppercase tracking-widest text-white/50">
                  Tagline options
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.taglines.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/85"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Pick your domain
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  {totalChecked} of {plan.brandNames.length} checked
                  {availableCount > 0 ? ` · ${availableCount} available right now` : ""}
                </p>
              </div>
              <button
                onClick={() => runAvailabilityChecks(plan)}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08]"
              >
                <RefreshCcw className="h-3 w-3" /> Re-check all
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.brandNames.map((b, i) => {
                const domain = fullDomain(b);
                const a = availability[domain] || { status: "pending", price: null };
                const selected = selectedDomain === domain;
                return (
                  <motion.button
                    key={domain}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(0.04 * i, 0.4) }}
                    type="button"
                    onClick={() => chooseDomain(b)}
                    disabled={a.status === "taken"}
                    className={[
                      "group relative w-full rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-indigo-300/60 bg-indigo-500/10 ring-2 ring-indigo-400/40"
                        : a.status === "available"
                          ? "border-emerald-400/30 bg-emerald-500/[0.06] hover:border-emerald-300/60 hover:bg-emerald-500/[0.1]"
                          : a.status === "taken"
                            ? "border-white/[0.06] bg-white/[0.02] opacity-60"
                            : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
                    ].join(" ")}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl font-semibold tracking-tight">{b.name}</span>
                        <span className="text-xl font-medium text-white/50">.{b.tld}</span>
                      </div>
                      <AvailabilityBadge state={a} />
                    </div>
                    {b.rationale && (
                      <p className="mt-2 line-clamp-2 text-xs text-white/55">{b.rationale}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        {a.price != null
                          ? `$${a.price.toFixed(2)}/yr`
                          : a.status === "checking"
                            ? "checking availability…"
                            : a.status === "error"
                              ? a.message || "check failed"
                              : ""}
                      </span>
                      {a.status === "available" && (
                        <span className="inline-flex items-center gap-1 text-emerald-300 transition group-hover:translate-x-0.5">
                          Use this <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {assembleError && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-red-300" />
                <div className="flex-1">
                  <div className="font-medium">Couldn&apos;t assemble your launch kit</div>
                  <div className="mt-1 text-red-100/80">{assembleError}</div>
                </div>
              </div>
            )}

            {assembling && (
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running trademark, valuation, and availability checks in parallel…
              </div>
            )}

            {/* Starter sections preview */}
            {plan.starterSections.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-semibold tracking-tight">Starter page sections</h3>
                <p className="mt-1 text-sm text-white/60">
                  We&apos;ll pre-load these when you open the builder.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {plan.starterSections.map((s) => (
                    <div key={s.id} className="surface p-4">
                      <div className="text-[10px] font-medium uppercase tracking-widest text-white/50">
                        {s.id}
                      </div>
                      <div className="mt-1 text-base font-semibold text-white">{s.headline}</div>
                      {s.subhead && <div className="mt-1 text-sm text-white/65">{s.subhead}</div>}
                      {s.bullets.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-white/55">
                          {s.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-1 h-1 w-1 flex-none rounded-full bg-white/40" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Launch kit */}
      <AnimatePresence>
        {kit && (
          <motion.section
            id="launch-kit"
            key="kit"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="relative mx-auto max-w-6xl px-6 pb-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Launch kit ready
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {kit.brand.name}{" "}
              <span className="text-white/40">— {kit.domain.name}</span>
            </h2>
            <p className="mt-2 max-w-3xl text-white/70">{kit.brand.tagline}</p>
            <p className="mt-1 max-w-3xl text-sm text-white/55">{kit.brand.positioning}</p>

            {kit.meta.partialFailures.length > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-300" />
                Some enrichments were unavailable: {kit.meta.partialFailures.join(", ")}. You can
                still proceed — we&apos;ll retry those checks from the dashboard.
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {/* Availability */}
              <KitCard
                icon={<Globe className="h-4 w-4 text-sky-300" />}
                title="Availability"
                body={
                  kit.domain.availability.available === true ? (
                    <span className="text-emerald-300">Available — lock it in</span>
                  ) : kit.domain.availability.available === false ? (
                    <span className="text-red-300">Taken — pick another</span>
                  ) : (
                    <span className="text-white/60">
                      Unknown{" "}
                      {kit.domain.availability.unavailableReason
                        ? `(${kit.domain.availability.unavailableReason})`
                        : ""}
                    </span>
                  )
                }
                footer={
                  kit.domain.availability.price != null
                    ? `$${kit.domain.availability.price.toFixed(2)}/year`
                    : "Pricing unavailable"
                }
              />
              {/* Trademark */}
              <KitCard
                icon={<Shield className="h-4 w-4 text-indigo-300" />}
                title="Trademark"
                body={
                  kit.domain.trademark.status === "clear" ? (
                    <span className="text-emerald-300">No conflicts found</span>
                  ) : kit.domain.trademark.status === "conflict" ? (
                    <span className="text-red-300">
                      {kit.domain.trademark.conflictCount} potential conflict
                      {kit.domain.trademark.conflictCount === 1 ? "" : "s"}
                    </span>
                  ) : kit.domain.trademark.status === "unavailable" ? (
                    <span className="text-white/60">
                      Unavailable{" "}
                      {kit.domain.trademark.unavailableReason
                        ? `(${kit.domain.trademark.unavailableReason})`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-white/60">Inconclusive — verify with counsel</span>
                  )
                }
                footer={
                  kit.domain.trademark.registries_checked.length > 0
                    ? `Checked: ${kit.domain.trademark.registries_checked.join(", ")}`
                    : "AI-sourced signal — verify before filing"
                }
              />
              {/* Valuation */}
              <KitCard
                icon={<Gem className="h-4 w-4 text-fuchsia-300" />}
                title="Valuation"
                body={
                  kit.domain.valuation.midpoint != null ? (
                    <span>
                      ~$
                      {kit.domain.valuation.midpoint.toLocaleString()}
                      {kit.domain.valuation.low != null && kit.domain.valuation.high != null && (
                        <span className="text-white/50">
                          {" "}
                          (${kit.domain.valuation.low.toLocaleString()}–$
                          {kit.domain.valuation.high.toLocaleString()})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-white/60">
                      Unavailable{" "}
                      {kit.domain.valuation.unavailableReason
                        ? `(${kit.domain.valuation.unavailableReason})`
                        : ""}
                    </span>
                  )
                }
                footer={
                  kit.domain.valuation.factors.length > 0
                    ? kit.domain.valuation.factors.slice(0, 2).join(" · ")
                    : `Confidence: ${kit.domain.valuation.confidence}`
                }
              />
            </div>

            {/* Next steps */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold tracking-tight">Execute the launch</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {kit.nextSteps.map((step) => (
                  <a
                    key={step.action}
                    href={step.href}
                    className="surface-interactive group block p-5"
                  >
                    <div className="flex items-center gap-2">
                      <NextStepIcon action={step.action} />
                      <span className="text-base font-semibold">{step.label}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/80" />
                    </div>
                    <p className="mt-2 text-sm text-white/65">{step.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function PlanCard({
  icon,
  label,
  body,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
}) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/85">{body}</p>
    </div>
  );
}

function KitCard({
  icon,
  title,
  body,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  footer: string;
}) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
        {icon}
        {title}
      </div>
      <div className="mt-3 text-lg font-semibold">{body}</div>
      <div className="mt-2 text-xs text-white/50">{footer}</div>
    </div>
  );
}

function AvailabilityBadge({ state }: { state: AvailabilityState }) {
  switch (state.status) {
    case "available":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Free
        </span>
      );
    case "taken":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-200">
          <XCircle className="h-3 w-3" /> Taken
        </span>
      );
    case "checking":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
          <AlertTriangle className="h-3 w-3" /> Error
        </span>
      );
    case "unknown":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
          <HelpCircle className="h-3 w-3" /> Unknown
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
          Queued
        </span>
      );
  }
}

function NextStepIcon({ action }: { action: LaunchKit["nextSteps"][number]["action"] }) {
  switch (action) {
    case "build-site":
      return <Rocket className="h-5 w-5 text-indigo-300" />;
    case "create-video":
      return <Video className="h-5 w-5 text-fuchsia-300" />;
    case "buy-domain":
      return <ShoppingCart className="h-5 w-5 text-emerald-300" />;
    case "connect-email":
      return <Mail className="h-5 w-5 text-sky-300" />;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function fullDomain(b: BrandNameSuggestion): string {
  return `${b.name}.${b.tld}`.toLowerCase();
}
