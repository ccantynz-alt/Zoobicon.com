"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

/**
 * AgentOrbsRow — six-agent visualization for the builder streaming UI.
 *
 * Why this exists: the existing status pill only shows the latest log
 * line, so users see a sequence of opaque messages without any sense
 * of "where we are in the build." Lovable, Bolt and Emergent all show
 * their agents working in a visible row — that's a huge part of why
 * vibe-coding feels alive. This brings parity.
 *
 * Strategy: we derive the current active agent index by keyword-matching
 * the latest log message against the agent names. Anything before the
 * active agent is treated as "done" (gets a check); the active one
 * gets a gold pulse; later agents stay dim. No new server-side state
 * required — works off the same stream the builder already consumes.
 */

const AGENTS = [
  { id: "strategist", label: "Strategist", icon: "🧭", keywords: ["strateg", "planning", "brief"] },
  { id: "brand", label: "Brand", icon: "🎨", keywords: ["brand", "palette", "color", "design"] },
  { id: "architect", label: "Architect", icon: "🏗️", keywords: ["architect", "structure", "scaffold", "layout", "select"] },
  { id: "copy", label: "Copy", icon: "✍️", keywords: ["copy", "writer", "headline", "voice", "customiz"] },
  { id: "dev", label: "Developer", icon: "⚡", keywords: ["develop", "generat", "opus", "stream", "component"] },
  { id: "seo", label: "SEO", icon: "🔍", keywords: ["seo", "meta", "sitemap", "schema", "open graph", "critique", "quality"] },
] as const;

interface AgentOrbsRowProps {
  latestMessage: string | null;
  componentsDone?: number;
  componentsTotal?: number;
  /** Force-done state when the build has completed (acts as a global "all done") */
  done?: boolean;
}

function detectActiveIdx(msg: string): number {
  const m = msg.toLowerCase();
  // Walk in reverse so later-stage matches win over earlier-stage
  // (e.g. "SEO" beats a stray "design" mention in a wrap-up message).
  for (let i = AGENTS.length - 1; i >= 0; i--) {
    if (AGENTS[i].keywords.some((kw) => m.includes(kw))) return i;
  }
  return -1;
}

export default function AgentOrbsRow({
  latestMessage,
  componentsDone,
  componentsTotal,
  done = false,
}: AgentOrbsRowProps) {
  const activeIdx = useMemo(() => {
    if (done) return AGENTS.length - 1;
    if (!latestMessage) return -1;
    return detectActiveIdx(latestMessage);
  }, [latestMessage, done]);

  return (
    <div className="flex items-center justify-between gap-1.5 mb-2.5">
      {AGENTS.map((agent, i) => {
        const isActive = !done && i === activeIdx;
        const isDone = done || (activeIdx >= 0 && i < activeIdx);
        return (
          <div
            key={agent.id}
            className="group relative flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] transition-all duration-500"
            style={{
              borderColor: isActive
                ? "rgba(212,175,94,0.6)"
                : isDone
                ? "rgba(212,242,78,0.3)"
                : "rgba(255,255,255,0.08)",
              background: isActive
                ? "rgba(212,175,94,0.10)"
                : isDone
                ? "rgba(212,242,78,0.04)"
                : "rgba(255,255,255,0.02)",
              color: isActive
                ? "#ffffff"
                : isDone
                ? "rgba(212,242,78,0.8)"
                : "rgba(255,255,255,0.40)",
              transform: isActive ? "scale(1.04)" : "scale(1)",
            }}
            title={
              isActive
                ? `${agent.label} — working`
                : isDone
                ? `${agent.label} — done`
                : `${agent.label} — pending`
            }
          >
            <span className="text-[10px] leading-none">{agent.icon}</span>
            <span className="font-medium tracking-tight">{agent.label}</span>
            {isActive && (
              <span className="relative ml-0.5 flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/80" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-amber-400" />
              </span>
            )}
            {isDone && !isActive && (
              <Check className="h-2 w-2 text-amber-300" strokeWidth={3} />
            )}
          </div>
        );
      })}
      {typeof componentsDone === "number" && typeof componentsTotal === "number" && componentsTotal > 0 && (
        <span className="ml-1 font-mono text-[9px] text-white/35 tabular-nums whitespace-nowrap">
          {componentsDone}/{componentsTotal}
        </span>
      )}
    </div>
  );
}
