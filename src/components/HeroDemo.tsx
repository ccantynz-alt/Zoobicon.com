"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Palette,
  PenTool,
  LayoutGrid,
  Code2,
  Search,
  Sparkles,
  CheckCircle2,
  Globe,
  ChevronRight,
  Rocket,
} from "lucide-react";

/* ─── constants ─── */

const PROMPT_TEXT =
  "Build a modern SaaS landing page for an AI analytics startup";

const AGENTS = [
  { name: "Strategist", icon: Lightbulb, phase: 1 },
  { name: "Designer", icon: Palette, phase: 2 },
  { name: "Copywriter", icon: PenTool, phase: 2 },
  { name: "Architect", icon: LayoutGrid, phase: 2 },
  { name: "Developer", icon: Code2, phase: 3 },
  { name: "SEO", icon: Search, phase: 4 },
  { name: "Animator", icon: Sparkles, phase: 4 },
] as const;

/* agent activation delays (ms from start of agent phase) */
const AGENT_DELAYS = [0, 400, 500, 600, 1200, 2800, 2900];
/* when each agent finishes */
const AGENT_FINISH = [350, 550, 650, 1150, 2750, 3400, 3500];

/* phase timing (ms) */
const TYPING_DURATION = 2000;
const BUILD_DURATION = 4000;
const DEPLOY_SHOW_DELAY = 600;
const LOOP_PAUSE = 3000;

/* ─── reduced-motion hook ─── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ─── sub-components ─── */

function TypingCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[1em] bg-violet-400 ml-[1px] align-middle rounded-full"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.53, repeat: Infinity, repeatType: "reverse" }}
    />
  );
}

function AgentBadge({
  agent,
  state,
  reducedMotion,
}: {
  agent: (typeof AGENTS)[number];
  state: "idle" | "active" | "done";
  reducedMotion: boolean;
}) {
  const Icon = agent.icon;
  const isActive = state === "active";
  const isDone = state === "done";

  return (
    <motion.div
      layout
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
        tracking-wide select-none whitespace-nowrap transition-colors duration-300
        ${
          isActive
            ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
            : isDone
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-white/[0.03] text-white/20 border border-white/[0.05]"
        }
      `}
      style={
        isActive
          ? {
              boxShadow:
                "0 0 12px rgba(124,90,255,0.35), inset 0 0 8px rgba(124,90,255,0.1)",
            }
          : isDone
            ? { boxShadow: "0 0 8px rgba(16,185,129,0.15)" }
            : undefined
      }
      animate={
        isActive && !reducedMotion
          ? { scale: [1, 1.06, 1] }
          : { scale: 1 }
      }
      transition={
        isActive
          ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
    >
      {isDone ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {agent.name}
    </motion.div>
  );
}

/* ─── agent list panel (left side) ─── */

function AgentPanel({
  agentStates,
  reducedMotion,
  buildProgress,
}: {
  agentStates: ("idle" | "active" | "done")[];
  reducedMotion: boolean;
  buildProgress: number;
}) {
  const doneCount = agentStates.filter((s) => s === "done").length;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Section label */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-semibold">
          Pipeline
        </span>
        {doneCount > 0 && (
          <span className="text-[9px] text-white/20 ml-auto tabular-nums">
            {doneCount}/{AGENTS.length}
          </span>
        )}
      </div>

      {/* Agent list */}
      <div className="flex flex-col gap-1">
        {AGENTS.map((agent, i) => {
          const Icon = agent.icon;
          const state = agentStates[i];
          const isActive = state === "active";
          const isDone = state === "done";

          return (
            <motion.div
              key={agent.name}
              className={`
                flex items-center gap-1.5 px-2 py-[5px] rounded-lg text-[10px] font-medium
                transition-all duration-300 relative overflow-hidden
                ${
                  isActive
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    : isDone
                      ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                      : "bg-transparent text-white/20 border border-transparent"
                }
              `}
              animate={
                isActive && !reducedMotion
                  ? { x: [0, 1, 0] }
                  : { x: 0 }
              }
              transition={
                isActive
                  ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
            >
              {/* Progress fill for active agent */}
              {isActive && !reducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent rounded-lg"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Icon className="w-3 h-3 flex-shrink-0" />
                )}
                {agent.name}
              </span>

              {isActive && (
                <motion.span
                  className="ml-auto relative z-10"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <span className="text-[8px] text-violet-400/60">
                    working
                  </span>
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #7c5aff, #a78bfa, #34d399)",
            width: `${Math.round(buildProgress * 100)}%`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

/* ─── preview mockup: gradient blocks simulating a landing page ─── */

function PreviewMockup({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {/* Hero block */}
      <motion.div
        className="mx-auto mt-2.5 mb-2 flex flex-col items-center gap-1"
        style={{ opacity: Math.min(progress * 3, 1) }}
      >
        {/* Nav */}
        <div className="w-full flex items-center justify-between px-3 mb-1.5">
          <div className="w-8 h-1.5 rounded-full bg-gradient-to-r from-violet-500/80 to-violet-400/60" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-4 h-[3px] rounded-full bg-white/[0.08]" />
            ))}
          </div>
          <div className="w-10 h-3 rounded-md bg-violet-600/40" />
        </div>

        {/* Hero headline — uses the font-display class */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <div
            className="font-display w-[80%] h-3.5 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(124,90,255,0.7) 0%, rgba(167,139,250,0.5) 60%, transparent 100%)",
            }}
          />
          <div className="w-[55%] h-2.5 rounded-full bg-gradient-to-r from-white/15 to-transparent" />
        </div>

        {/* Sub-text */}
        <div className="w-[65%] h-1.5 rounded-full bg-white/[0.06] mt-0.5" />

        {/* CTA buttons */}
        <div className="flex gap-1.5 mt-2">
          <div className="w-14 h-4 rounded-md bg-gradient-to-r from-violet-600 to-violet-500 shadow-lg shadow-violet-500/20" />
          <div className="w-14 h-4 rounded-md border border-white/10 bg-white/[0.03]" />
        </div>

        {/* Stats row */}
        <motion.div
          className="flex gap-3 mt-2.5"
          style={{ opacity: Math.min(Math.max((progress - 0.15) * 4, 0), 1) }}
        >
          {[
            { value: "w-5", label: "w-6" },
            { value: "w-6", label: "w-5" },
            { value: "w-4", label: "w-7" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`${stat.value} h-2 rounded-full bg-violet-400/30`} />
              <div className={`${stat.label} h-1 rounded-full bg-white/[0.06]`} />
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Features grid */}
      <motion.div
        className="grid grid-cols-3 gap-1.5 px-3 mb-2"
        style={{ opacity: Math.min(Math.max((progress - 0.3) * 3, 0), 1) }}
      >
        {[
          { from: "#7c5aff", to: "#a78bfa" },
          { from: "#3b82f6", to: "#60a5fa" },
          { from: "#06b6d4", to: "#22d3ee" },
        ].map((colors, i) => (
          <div
            key={i}
            className="rounded-lg p-2 bg-white/[0.03] border border-white/[0.05]"
          >
            <div
              className="w-4 h-4 rounded-md mb-1.5"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              }}
            />
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] mb-1" />
            <div className="w-[70%] h-1 rounded-full bg-white/[0.05]" />
            <div className="w-[50%] h-1 rounded-full bg-white/[0.03] mt-0.5" />
          </div>
        ))}
      </motion.div>

      {/* Testimonials */}
      <motion.div
        className="flex gap-1.5 px-3 mb-2"
        style={{ opacity: Math.min(Math.max((progress - 0.55) * 3, 0), 1) }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-lg p-2 bg-white/[0.025] border border-white/[0.04]"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(135deg, #7c5aff, #3b82f6)"
                      : "linear-gradient(135deg, #f59e0b, #ef4444)",
                }}
              />
              <div className="flex flex-col gap-0.5">
                <div className="w-8 h-1 rounded-full bg-white/[0.1]" />
                <div className="w-5 h-[3px] rounded-full bg-white/[0.05]" />
              </div>
            </div>
            {/* Stars */}
            <div className="flex gap-[2px] mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="w-1.5 h-1.5 rounded-[1px] bg-amber-400/40" />
              ))}
            </div>
            <div className="w-full h-1 rounded-full bg-white/[0.05] mb-0.5" />
            <div className="w-[75%] h-1 rounded-full bg-white/[0.03]" />
          </div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.div
        className="px-3 pb-2"
        style={{ opacity: Math.min(Math.max((progress - 0.75) * 4, 0), 1) }}
      >
        <div className="border-t border-white/[0.05] pt-2 flex items-center justify-between">
          <div className="w-8 h-1.5 rounded-full bg-violet-500/20" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-[3px] rounded-full bg-white/[0.06]" />
            ))}
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── main component ─── */

export default function HeroDemo() {
  const reducedMotion = usePrefersReducedMotion();

  /* state machine: typing → agents → building → deployed → pause → (loop) */
  type Phase = "typing" | "agents" | "building" | "deployed" | "pause";
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedLength, setTypedLength] = useState(0);
  const [agentStates, setAgentStates] = useState<("idle" | "active" | "done")[]>(
    AGENTS.map(() => "idle")
  );
  const [buildProgress, setBuildProgress] = useState(0);
  const [showDeploy, setShowDeploy] = useState(false);

  const phaseStartRef = useRef(0);

  /* reset everything for a new loop */
  const reset = useCallback(() => {
    setTypedLength(0);
    setAgentStates(AGENTS.map(() => "idle"));
    setBuildProgress(0);
    setShowDeploy(false);
    setPhase("typing");
  }, []);

  /* ── typing phase ── */
  useEffect(() => {
    if (phase !== "typing") return;
    if (reducedMotion) {
      setTypedLength(PROMPT_TEXT.length);
      setPhase("agents");
      return;
    }

    phaseStartRef.current = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - phaseStartRef.current;
      const progress = Math.min(elapsed / TYPING_DURATION, 1);
      const chars = Math.floor(progress * PROMPT_TEXT.length);
      setTypedLength(chars);

      if (progress >= 1) {
        setPhase("agents");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reducedMotion]);

  /* ── agents phase ── */
  useEffect(() => {
    if (phase !== "agents") return;
    if (reducedMotion) {
      setAgentStates(AGENTS.map(() => "done"));
      setBuildProgress(1);
      setPhase("deployed");
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    AGENTS.forEach((_, i) => {
      /* activate */
      timeouts.push(
        setTimeout(() => {
          setAgentStates((prev) =>
            prev.map((s, idx) => (idx === i ? "active" : s))
          );
        }, AGENT_DELAYS[i])
      );

      /* finish */
      timeouts.push(
        setTimeout(() => {
          setAgentStates((prev) =>
            prev.map((s, idx) => (idx === i ? "done" : s))
          );
        }, AGENT_FINISH[i])
      );
    });

    /* transition to building phase after first agents finish */
    timeouts.push(
      setTimeout(() => {
        setPhase("building");
      }, 1400)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [phase, reducedMotion]);

  /* ── building phase (progress ramp) ── */
  useEffect(() => {
    if (phase !== "building") return;

    phaseStartRef.current = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - phaseStartRef.current;
      const p = Math.min(elapsed / BUILD_DURATION, 1);
      /* ease-out cubic for a fast-start, slow-finish feel */
      const eased = 1 - Math.pow(1 - p, 3);
      setBuildProgress(eased);

      if (p >= 1) {
        setPhase("deployed");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* ── deployed phase ── */
  useEffect(() => {
    if (phase !== "deployed") return;

    setBuildProgress(1);
    setAgentStates(AGENTS.map(() => "done"));

    const t1 = setTimeout(() => setShowDeploy(true), DEPLOY_SHOW_DELAY);
    const t2 = setTimeout(
      () => setPhase("pause"),
      DEPLOY_SHOW_DELAY + LOOP_PAUSE
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  /* ── pause → loop ── */
  useEffect(() => {
    if (phase !== "pause") return;
    const t = setTimeout(reset, 800);
    return () => clearTimeout(t);
  }, [phase, reset]);

  /* ─── render ─── */

  const typedText = PROMPT_TEXT.slice(0, typedLength);
  const isTyping = phase === "typing" && typedLength < PROMPT_TEXT.length;
  const isBuilding = phase === "building" || phase === "agents";

  return (
    <div className="w-full max-w-[620px] mx-auto relative">
      {/* Ambient glow behind the card */}
      <div
        className="absolute -inset-8 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(500px circle at 50% 40%, rgba(124,90,255,0.1), transparent 70%)",
        }}
      />

      {/* Glass container */}
      <motion.div
        className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 0 80px -20px rgba(124,90,255,0.15), 0 25px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Shimmer line across the top */}
        {!reducedMotion && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-[1px] z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(124,90,255,0.4) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2,
            }}
          />
        )}

        {/* ── Browser chrome ── */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015]">
          <div className="flex gap-1.5">
            <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/70" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]/70" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]/70" />
          </div>
          <div className="ml-3 flex-1 h-5 rounded-md bg-white/[0.04] flex items-center px-2.5 gap-1.5">
            <Globe className="w-2.5 h-2.5 text-white/15" />
            <span className="text-[10px] text-white/25 font-mono tracking-wide">
              zoobicon.com/builder
            </span>
          </div>
        </div>

        {/* ── Prompt bar ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] transition-all duration-500"
            style={
              isTyping
                ? { boxShadow: "0 0 20px rgba(124,90,255,0.08), inset 0 0 12px rgba(124,90,255,0.03)" }
                : undefined
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400/80 flex-shrink-0" />
            <span className="text-[11.5px] text-white/70 leading-snug min-h-[16px] flex items-center font-medium">
              {typedText}
              {isTyping && <TypingCursor />}
            </span>
            {!isTyping && typedLength === PROMPT_TEXT.length && (
              <motion.div
                className="ml-auto flex-shrink-0 w-5 h-5 rounded-md bg-violet-500/30 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "backOut" }}
              >
                <ChevronRight className="w-3 h-3 text-violet-300" />
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Split view: Agents (left) + Preview (right) ── */}
        <div className="px-4 pb-1">
          {/* Mobile: stacked agent badges */}
          <div className="flex flex-wrap gap-1.5 sm:hidden mb-2">
            {AGENTS.map((agent, i) => (
              <AgentBadge
                key={agent.name}
                agent={agent}
                state={agentStates[i]}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>

          {/* Desktop: split layout */}
          <div className="flex gap-3">
            {/* Left: Agent panel (hidden on mobile, shown via badges above) */}
            <div className="hidden sm:block w-[140px] flex-shrink-0">
              <AgentPanel
                agentStates={agentStates}
                reducedMotion={reducedMotion}
                buildProgress={buildProgress}
              />
            </div>

            {/* Right: Preview */}
            <div className="flex-1 min-w-0">
              <motion.div
                className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#08081a]"
                style={{ minHeight: 220 }}
                animate={{
                  opacity: phase === "typing" ? 0.25 : 1,
                  borderColor:
                    phase === "deployed"
                      ? "rgba(52,211,153,0.15)"
                      : "rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.6 }}
              >
                {/* Scan line effect while building */}
                <AnimatePresence>
                  {isBuilding && !reducedMotion && (
                    <motion.div
                      className="absolute inset-x-0 h-[1.5px] z-10 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 10%, rgba(124,90,255,0.5) 50%, transparent 90%)",
                      }}
                      initial={{ top: 0, opacity: 0 }}
                      animate={{
                        top: ["0%", "100%"],
                        opacity: [0, 0.8, 0.8, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Grid overlay while building */}
                <AnimatePresence>
                  {isBuilding && !reducedMotion && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-[5]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(124,90,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,90,255,0.03) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    scale: phase === "deployed" ? 1 : 0.97,
                    filter:
                      phase === "typing"
                        ? "blur(3px) brightness(0.5)"
                        : phase === "agents"
                          ? "blur(1px) brightness(0.7)"
                          : "blur(0px) brightness(1)",
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <PreviewMockup progress={buildProgress} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile: simple progress bar */}
        <div className="px-4 pt-1.5 pb-1 sm:hidden">
          <div className="h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #7c5aff, #a78bfa, #34d399)",
                width: `${Math.round(buildProgress * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* ── Deploy banner ── */}
        <div className="px-4 pb-3 pt-1">
          <AnimatePresence>
            {showDeploy && (
              <motion.div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20"
                initial={{ opacity: 0, y: 10, scaleY: 0.8 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  boxShadow: "0 0 30px rgba(16,185,129,0.08)",
                }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-[12px] text-emerald-300 font-semibold tracking-wide">
                    Deployed
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/70">
                  <Globe className="w-3 h-3" />
                  <span className="font-mono tracking-wide">
                    startup.zoobicon.sh
                  </span>
                  <Rocket className="w-3 h-3 text-emerald-400/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder space when deploy banner isn't visible */}
          {!showDeploy && <div className="h-[42px]" />}
        </div>
      </motion.div>
    </div>
  );
}
