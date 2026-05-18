"use client";

/**
 * Plan Review panel — KILLER-MOVES-BUILDER.md #B12.
 *
 * Shown after the user clicks "Build" but BEFORE the heavy
 * /api/generate/slot-stream call fires. The user sees exactly what's
 * about to be built (industry, theme, components, brand, summary,
 * estimated cost + time) and can:
 *   - Click "Build now"     — proceed to slot-stream
 *   - Click "Edit prompt"   — go back to the prompt input
 *   - Click "Cancel"        — abort entirely, only the planning call
 *                             was spent (~$0.0008)
 *   - Click a clarifying question — refine intent before building
 *
 * Cost-protection: a misclick costs $0.0008 (one Haiku planning call)
 * instead of $0.05+ for a full build.
 */

import { ArrowRight, Edit2, X, Sparkles, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export interface PlanReviewPlan {
  prompt: string;
  plan: {
    industry: string;
    theme: string;
    brandName: string;
    componentIds: string[];
    componentLabels: string[];
    includePricing: boolean;
    summary: string;
  };
  estimate: {
    apiCalls: number;
    usd: number;
    seconds: number;
    cacheBenefit: boolean;
  };
  ambiguities: Array<{
    field: string;
    description: string;
    clarifyingQuestion: string;
    currentDefault: string;
  }>;
  confidence: number;
  planId: string;
}

interface PlanReviewPanelProps {
  plan: PlanReviewPlan;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onClarify: (ambiguity: PlanReviewPlan["ambiguities"][number]) => void;
}

export function PlanReviewPanel({ plan, onConfirm, onEdit, onCancel, onClarify }: PlanReviewPanelProps) {
  const confidencePercent = Math.round(plan.confidence * 100);
  const lowConfidence = confidencePercent < 60;

  return (
    <div
      className="mx-auto w-full max-w-3xl rounded-2xl border p-6 sm:p-8"
      style={{
        background: "var(--paper-elevated)",
        borderColor: "var(--rule)",
        boxShadow: "0 1px 2px rgba(10,10,11,0.04), 0 8px 24px rgba(10,10,11,0.06)",
      }}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--gold-deep)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold-deep)" }}>
              Plan ready — review before building
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            {plan.plan.summary}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="rounded-md p-1 transition-colors hover:bg-[color:var(--paper)]"
          style={{ color: "var(--ink-muted)" }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Original prompt — let the user verify what was parsed */}
      <Row label="Your prompt">
        <p className="text-sm italic" style={{ color: "var(--ink-secondary)" }}>
          &ldquo;{plan.prompt}&rdquo;
        </p>
      </Row>

      {/* Detected fields */}
      <Row label="Brand">
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {plan.plan.brandName || <em style={{ color: "var(--ink-muted)" }}>(not detected — will use a placeholder)</em>}
        </span>
      </Row>
      <Row label="Industry">
        <Pill>{plan.plan.industry}</Pill>
      </Row>
      <Row label="Visual theme">
        <Pill>{plan.plan.theme}</Pill>
      </Row>
      <Row label="Sections to build">
        <div className="flex flex-wrap gap-1.5">
          {plan.plan.componentLabels.map((label, i) => (
            <Pill key={i}>{label}</Pill>
          ))}
        </div>
      </Row>

      {/* Ambiguities — call out things the planner is uncertain about */}
      {plan.ambiguities.length > 0 && (
        <div className="mb-6 mt-6 rounded-xl p-4" style={{ background: "var(--gold-soft)", border: "1px solid var(--gold)" }}>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" style={{ color: "var(--gold-deep)" }} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--gold-deep)" }}>
              Things I&apos;m not sure about
            </span>
          </div>
          <p className="mb-3 text-xs" style={{ color: "var(--ink-secondary)" }}>
            These will use the defaults shown unless you clarify. Each clarification costs nothing — it just refines the build before the API spend starts.
          </p>
          <ul className="space-y-2">
            {plan.ambiguities.map((amb, i) => (
              <li key={i}>
                <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {amb.description}
                </div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Currently: <code>{amb.currentDefault}</code>
                </div>
                <button
                  type="button"
                  onClick={() => onClarify(amb)}
                  className="mt-1 text-xs font-medium underline transition-colors hover:no-underline"
                  style={{ color: "var(--gold-deep)" }}
                >
                  → {amb.clarifyingQuestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cost estimate strip */}
      <div className="mb-6 mt-2 grid grid-cols-3 gap-3">
        <EstimateCard label="API calls" value={plan.estimate.apiCalls.toString()} />
        <EstimateCard label="Est. cost" value={`$${plan.estimate.usd.toFixed(3)}`} />
        <EstimateCard label="Est. time" value={`~${plan.estimate.seconds}s`} />
      </div>

      {/* Confidence row */}
      <div className="mb-6 flex items-center justify-between text-xs" style={{ color: "var(--ink-muted)" }}>
        <span>
          Planner confidence: <strong style={{ color: lowConfidence ? "var(--gold-deep)" : "var(--ink)" }}>{confidencePercent}%</strong>
        </span>
        {lowConfidence && (
          <span style={{ color: "var(--gold-deep)" }}>
            Low confidence — review carefully before building.
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            color: "var(--ink)",
          }}
        >
          <Edit2 className="h-4 w-4" />
          Edit prompt
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 hover:shadow-lg"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
          }}
        >
          Build now
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-center text-[10px]" style={{ color: "var(--ink-muted)" }}>
        Mistake-protection: cancelling here costs nothing. Only the planning call ran (~$0.0008).
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 grid grid-cols-[120px_1fr] items-baseline gap-3 sm:gap-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        color: "var(--ink)",
      }}
    >
      {children}
    </span>
  );
}

function EstimateCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
    >
      <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}
