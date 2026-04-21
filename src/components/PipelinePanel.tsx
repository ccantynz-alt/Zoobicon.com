"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Palette,
  PenTool,
  LayoutGrid,
  Code2,
  Search,
  Sparkles,
} from "lucide-react";

interface PipelinePanelProps {
  onApplyCode: (html: string) => void;
}

interface AgentStatus {
  name: string;
  role: string;
  icon: React.ReactNode;
  phase: number;
  phaseName: string;
  model: string;
  status: "waiting" | "running" | "done";
  duration?: number;
}

const PHASE_COLORS: Record<number, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: "bg-stone-500/10", border: "border-stone-500/30", text: "text-stone-400", glow: "shadow-stone-500/20" },
  2: { bg: "bg-stone-500/10", border: "border-stone-500/30", text: "text-stone-400", glow: "shadow-stone-500/20" },
  3: { bg: "bg-stone-500/10", border: "border-stone-500/30", text: "text-stone-400", glow: "shadow-stone-500/20" },
  4: { bg: "bg-stone-500/10", border: "border-stone-500/30", text: "text-stone-400", glow: "shadow-stone-500/20" },
};

function createInitialAgents(): AgentStatus[] {
  return [
    { name: "Strategist", role: "Brief → strategy", icon: <Lightbulb className="w-3.5 h-3.5" />, phase: 1, phaseName: "Strategy", model: "Haiku", status: "waiting" },
    { name: "Designer", role: "Colors, fonts, layout", icon: <Palette className="w-3.5 h-3.5" />, phase: 2, phaseName: "Planning", model: "Haiku", status: "waiting" },
    { name: "Copywriter", role: "Headlines, copy, CTAs", icon: <PenTool className="w-3.5 h-3.5" />, phase: 2, phaseName: "Planning", model: "Haiku", status: "waiting" },
    { name: "Architect", role: "Sections, breakpoints", icon: <LayoutGrid className="w-3.5 h-3.5" />, phase: 2, phaseName: "Planning", model: "Haiku", status: "waiting" },
    { name: "Developer", role: "Full HTML/CSS/JS", icon: <Code2 className="w-3.5 h-3.5" />, phase: 3, phaseName: "Build", model: "Opus", status: "waiting" },
    { name: "SEO", role: "Meta, schema, headings", icon: <Search className="w-3.5 h-3.5" />, phase: 4, phaseName: "Enhance", model: "Sonnet", status: "waiting" },
    { name: "Animator", role: "Scroll, hover effects", icon: <Sparkles className="w-3.5 h-3.5" />, phase: 4, phaseName: "Enhance", model: "Sonnet", status: "waiting" },
  ];
}

export default function PipelinePanel({ onApplyCode }: PipelinePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"modern" | "classic" | "bold" | "minimal">("modern");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [agents, setAgents] = useState<AgentStatus[]>(createInitialAgents());

  const handleRun = async () => {
    if (!prompt.trim()) return;

    setStatus("running");
    setError("");
    setTotalDuration(0);
    setCurrentPhase(1);
    setAgents(createInitialAgents());

    // Simulated durations matching real pipeline timing
    const phaseTiming = [
      { phase: 1, agents: [0], delay: 0, duration: 4000 },          // Strategist ~4s
      { phase: 2, agents: [1, 2, 3], delay: 4200, duration: 6000 }, // Planners ~6s parallel
      { phase: 3, agents: [4], delay: 10500, duration: 70000 },     // Developer ~70s
      { phase: 4, agents: [5, 6], delay: 81000, duration: 15000 },  // Enhancers ~15s parallel
    ];

    // Show progress animation phase by phase
    for (const phase of phaseTiming) {
      await new Promise(r => setTimeout(r, Math.min(phase.delay, 1500)));
      setCurrentPhase(phase.phase);

      // Mark phase agents as running
      setAgents(prev => prev.map((a, i) =>
        phase.agents.includes(i) ? { ...a, status: "running" as const } : a
      ));

      // After a visual delay, mark as done (unless it's a long phase)
      await new Promise(r => setTimeout(r, Math.min(phase.duration, 2000)));
      setAgents(prev => prev.map((a, i) =>
        phase.agents.includes(i) ? { ...a, status: "done" as const, duration: phase.duration / phase.agents.length } : a
      ));
    }

    // Meanwhile the actual API call
    try {
      const res = await fetch("/api/generate/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Pipeline failed");
      }

      const data = await res.json();

      // Update with real durations if available
      if (data.agents) {
        setAgents(prev => prev.map((a, i) => ({
          ...a,
          status: "done" as const,
          duration: data.agents[i]?.duration || a.duration,
        })));
      }

      setTotalDuration(data.totalDuration || 95000);
      setStatus("done");
      onApplyCode(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
      setStatus("error");
      setAgents(createInitialAgents());
      setCurrentPhase(0);
    }
  };

  const doneCount = agents.filter(a => a.status === "done").length;
  const progress = doneCount / agents.length;

  // Group agents by phase
  const phases = [
    { num: 1, name: "Strategy", desc: "Sequential" },
    { num: 2, name: "Planning", desc: "Parallel" },
    { num: 3, name: "Build", desc: "Sequential" },
    { num: 4, name: "Enhance", desc: "Parallel" },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Workflow className="w-4 h-4 text-brand-400" />
          7-Agent Pipeline
        </h3>
        <p className="text-xs text-white/50">
          Multi-phase AI pipeline: Strategy → Planning → Build → Enhancement.
        </p>
      </div>

      {/* Phase progress bar */}
      {status === "running" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-white/50 uppercase tracking-wider font-semibold">Phase {currentPhase}/4</span>
            <span className="text-white/50 tabular-nums">{doneCount}/{agents.length} agents</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-stone-500 via-stone-500 to-stone-400"
              animate={{ width: `${Math.max(progress * 100, 5)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Agent Pipeline — grouped by phase */}
      <div className="space-y-3">
        {phases.map(phase => {
          const phaseAgents = agents.filter(a => a.phase === phase.num);
          const phaseColors = PHASE_COLORS[phase.num];
          const phaseActive = currentPhase >= phase.num && status === "running";
          const phaseDone = phaseAgents.every(a => a.status === "done");

          return (
            <div key={phase.num} className="space-y-1">
              {/* Phase label */}
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase tracking-wider font-bold ${
                  phaseDone ? "text-stone-400/70" : phaseActive ? phaseColors.text : "text-white/50"
                }`}>
                  Phase {phase.num}: {phase.name}
                </span>
                <span className="text-[8px] text-white/15">({phase.desc})</span>
                {phaseDone && <CheckCircle2 className="w-2.5 h-2.5 text-stone-400/60" />}
              </div>

              {/* Phase agents */}
              <div className={`space-y-1 ${phase.desc === "Parallel" ? "pl-0" : ""}`}>
                {phaseAgents.map(agent => {
                  const isRunning = agent.status === "running";
                  const isDone = agent.status === "done";

                  return (
                    <motion.div
                      key={agent.name}
                      initial={false}
                      animate={{
                        scale: isRunning ? 1.01 : 1,
                        borderColor: isRunning ? "rgba(124,90,255,0.35)" : isDone ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.04)",
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all duration-300 ${
                        isRunning
                          ? `${phaseColors.bg} ${phaseColors.border} shadow-lg ${phaseColors.glow}`
                          : isDone
                            ? "bg-stone-500/[0.04] border-stone-500/15"
                            : "bg-white/[0.015] border-white/[0.04]"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${
                        isRunning
                          ? `${phaseColors.bg} ${phaseColors.text}`
                          : isDone
                            ? "bg-stone-500/15 text-stone-400"
                            : "bg-white/[0.03] text-white/15"
                      }`}>
                        <AnimatePresence mode="wait">
                          {isRunning ? (
                            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Loader2 className="w-3 h-3 animate-spin" />
                            </motion.div>
                          ) : isDone ? (
                            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                              <CheckCircle2 className="w-3 h-3" />
                            </motion.div>
                          ) : (
                            <motion.div key="icon">{agent.icon}</motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium">{agent.name}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                            agent.model === "Opus"
                              ? "bg-stone-500/15 text-stone-400/80"
                              : agent.model === "Sonnet"
                                ? "bg-stone-500/15 text-stone-400/80"
                                : "bg-white/[0.06] text-white/50"
                          }`}>
                            {agent.model}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/50">
                          {isRunning ? (
                            <span className={phaseColors.text}>Working...</span>
                          ) : isDone ? (
                            <span className="text-stone-400/60">
                              Done in {((agent.duration || 0) / 1000).toFixed(1)}s
                            </span>
                          ) : (
                            agent.role
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the website you want built by our 7-agent team..."
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-brand-500/40 transition-colors resize-none"
        />

        {/* Style selection */}
        <div className="grid grid-cols-4 gap-1.5">
          {(["modern", "classic", "bold", "minimal"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`text-[10px] py-1.5 rounded-lg border capitalize transition-colors ${
                style === s
                  ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                  : "border-white/[0.04] text-white/50 hover:text-white/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!prompt.trim() || status === "running"}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 via-accent-purple to-accent-cyan text-white text-sm font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {status === "running" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Pipeline running — Phase {currentPhase}/4
          </>
        ) : (
          <>
            <Workflow className="w-4 h-4" />
            Run 7-Agent Pipeline
          </>
        )}
      </button>

      {/* Results */}
      {status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20"
        >
          <CheckCircle2 className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-stone-400 font-medium">Pipeline complete</p>
            <p className="text-[10px] text-stone-400/60 mt-0.5">
              Built by 7 agents in {(totalDuration / 1000).toFixed(1)}s — Strategy → Planning → Build → Enhancement.
            </p>
          </div>
        </motion.div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
          <AlertCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-stone-400">{error}</p>
        </div>
      )}
    </div>
  );
}
