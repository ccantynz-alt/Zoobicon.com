"use client";

import { useState } from "react";
import { Workflow, Loader2, CheckCircle2, AlertCircle, Paintbrush, PenTool, Code2, Shield } from "lucide-react";

interface PipelinePanelProps {
  onApplyCode: (html: string) => void;
}

interface AgentStatus {
  name: string;
  icon: React.ReactNode;
  status: "waiting" | "running" | "done";
  duration?: number;
}

export default function PipelinePanel({ onApplyCode }: PipelinePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"modern" | "classic" | "bold" | "minimal">("modern");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);

  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: "Designer", icon: <Paintbrush className="w-3.5 h-3.5" />, status: "waiting" },
    { name: "Copywriter", icon: <PenTool className="w-3.5 h-3.5" />, status: "waiting" },
    { name: "Developer", icon: <Code2 className="w-3.5 h-3.5" />, status: "waiting" },
    { name: "QA", icon: <Shield className="w-3.5 h-3.5" />, status: "waiting" },
  ]);

  const handleRun = async () => {
    if (!prompt.trim()) return;

    setStatus("running");
    setError("");
    setTotalDuration(0);

    // Simulate agent progress
    const agentNames = ["Designer", "Copywriter", "Developer", "QA"];
    const durations = [3000, 5000, 15000, 8000];

    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: "waiting" as const }))
    );

    // Start showing progress
    let elapsedSimulated = 0;
    for (let i = 0; i < agentNames.length; i++) {
      setAgents((prev) =>
        prev.map((a, idx) =>
          idx === i ? { ...a, status: "running" as const } : a
        )
      );

      // Wait a fraction to show progress, actual call runs below
      if (i < agentNames.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      elapsedSimulated += durations[i];
    }

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

      // Update agent durations
      setAgents((prev) =>
        prev.map((a, i) => ({
          ...a,
          status: "done" as const,
          duration: data.agents?.[i]?.duration || durations[i],
        }))
      );

      setTotalDuration(data.totalDuration || elapsedSimulated);
      setStatus("done");
      onApplyCode(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
      setStatus("error");
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: "waiting" as const }))
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Workflow className="w-4 h-4 text-brand-400" />
          Multi-Agent Pipeline
        </h3>
        <p className="text-xs text-white/30">
          4 specialized AI agents collaborate to build a premium website.
        </p>
      </div>

      {/* Agent Pipeline Visualization */}
      <div className="space-y-1.5">
        {agents.map((agent, i) => (
          <div
            key={agent.name}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
              agent.status === "running"
                ? "bg-brand-500/10 border-brand-500/30"
                : agent.status === "done"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-white/[0.02] border-white/[0.04]"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                agent.status === "running"
                  ? "bg-brand-500/20 text-brand-400"
                  : agent.status === "done"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.04] text-white/20"
              }`}
            >
              {agent.status === "running" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : agent.status === "done" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                agent.icon
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{agent.name} Agent</div>
              <div className="text-[10px] text-white/20">
                {agent.status === "running"
                  ? "Working..."
                  : agent.status === "done"
                  ? `Done in ${((agent.duration || 0) / 1000).toFixed(1)}s`
                  : i === 0 ? "Colors, fonts, layout" : i === 1 ? "Headlines, copy, CTAs" : i === 2 ? "HTML, CSS, JS" : "Review & fix issues"}
              </div>
            </div>
            {i < agents.length - 1 && (
              <div className={`text-[10px] ${agent.status === "done" ? "text-emerald-400/40" : "text-white/10"}`}>
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the website you want built by our agent team..."
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition-colors resize-none"
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
                  : "border-white/[0.04] text-white/30 hover:text-white/50"
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
            Pipeline running...
          </>
        ) : (
          <>
            <Workflow className="w-4 h-4" />
            Run Agent Pipeline
          </>
        )}
      </button>

      {/* Results */}
      {status === "done" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-emerald-400 font-medium">Pipeline complete</p>
            <p className="text-[10px] text-emerald-400/60 mt-0.5">
              Built by 4 agents in {(totalDuration / 1000).toFixed(1)}s. Check the preview.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
