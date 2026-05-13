/**
 * Multi-judge panel critique — KILLER-MOVES-BUILDER.md #B9,
 * INNOVATIONS.md §Innovation #5.
 *
 * Today's critique pass: ONE Sonnet call scoring the whole site on
 * ~11 axes. If overall score is <90, regenerate everything. Blunt
 * and expensive.
 *
 * Multi-judge: THREE small specialised Haiku critics run in parallel.
 * Each one is an expert in ONE axis and produces a focused score +
 * specific fix list. Targeted repair on flagged axes only.
 *
 *   Typography critic — hierarchy, font pairing, line-length, casing,
 *                       letter-spacing, italic-accent presence
 *   Copy critic       — AI-slop words, tone consistency, specificity,
 *                       CTA strength, evidence vs aspiration
 *   Layout critic     — spacing rhythm, white-space, visual weight,
 *                       responsive breakpoints, alignment
 *
 * Why this is faster + cheaper + better:
 *   - 3 × Haiku ≈ $0.003 total, vs $0.36 for Sonnet critique pass
 *   - Parallel → wall-clock matches the slowest critic (~1.5s) vs
 *     Sonnet's ~6-8s
 *   - Specialisation catches more issues per axis than a generalist
 *   - Targeted repair on ONE axis = regenerate one slot list,
 *     not the whole site
 *
 * Critics return JSON in a strict format. The validator catches
 * refusals + malformed responses. Failed critics get skipped (build
 * still ships, just without that axis's verdict).
 */

import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateGeneratedText, detectRefusal } from "@/lib/llm-output-validator";

export type CritiqueAxis = "typography" | "copy" | "layout";

export interface CritiqueFinding {
  /** Severity: blocker | high | medium | low. */
  severity: "blocker" | "high" | "medium" | "low";
  /** Specific issue — names the element/slot/component. */
  issue: string;
  /** Suggested fix — concrete, actionable. */
  fix: string;
}

export interface AxisVerdict {
  axis: CritiqueAxis;
  /** 0-100. <60 = regenerate this axis. 60-89 = ship with warnings. 90+ = ship clean. */
  score: number;
  /** Up to 5 specific findings, blocker-first. */
  findings: CritiqueFinding[];
  /** Set when the critic call failed; build proceeds without this verdict. */
  skipped?: boolean;
  /** Reason for skip (when skipped=true). */
  skipReason?: string;
}

export interface PanelVerdict {
  overall: number; // weighted average across axes that didn't skip
  verdicts: AxisVerdict[];
  /** When true, at least one axis returned a blocker — caller should
   *  trigger a targeted repair on those axes before shipping. */
  hasBlockers: boolean;
  /** Total wall-clock latency of the parallel critique. */
  latencyMs: number;
}

// ───────────────────────────────────────────────────────────────────────
// System prompts — each one is an opinionated specialist
// ───────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CritiqueAxis, string> = {
  typography: `You are a senior editorial typographer reviewing the typography of a generated website. Score ONLY typography — not copy quality, not layout spacing, not feature choice.

Check (in order):
  1. Heading hierarchy — is there ONE h1? Are h2/h3 sized correctly relative to h1?
  2. Font pairing — does the brand pair display + body fonts coherently? (Playfair + Inter is fine. Comic Sans is not.)
  3. Line-length — are body paragraphs constrained to ~65 characters? (max-w-prose, max-w-2xl, etc)
  4. Letter-spacing — display headings should have NEGATIVE tracking (-0.025em or tighter); ALL-CAPS kickers should have POSITIVE wide tracking (0.18em+).
  5. Casing — sentence case for body, ALL CAPS only for short kickers/eyebrows. No SCREAMING titles.
  6. Italic accent — editorial heroes should wrap ONE word in <em>…</em> for the Playfair italic accent. Flag if absent or applied to too many words.
  7. Numerals — tabular-nums on stat counters and prices? Yes = pass.

Severity rubric:
  - blocker: typography breaks readability (3+ h1s, body < 14px, line-length > 100ch)
  - high: typography reads as amateur or inconsistent
  - medium: typography is functional but unrefined
  - low: nitpicks

Output ONLY JSON: { "score": number, "findings": [{ "severity": ..., "issue": ..., "fix": ... }] }
Max 5 findings, blocker-first. No prose around the JSON.`,

  copy: `You are a senior brand copywriter reviewing the copy on a generated website. Score ONLY copy — not typography, not layout.

Check (in order):
  1. AI-slop words — flag any of: "revolutionary", "unleash", "transform", "empower", "seamlessly", "leverage", "synergy", "amazing", "incredible", "best-in-class", "next-level", "game-changing".
  2. Specificity — does copy include real numbers, real names, real situations? Or is it vague aspirations?
  3. CTA strength — verb-led, short, audience-specific? "Start free" beats "Get started"; "Book a table" beats "Reserve".
  4. Tone consistency — does the brand sound coherent across hero + features + pricing + footer? A SaaS that's serious in hero and goofy in features fails.
  5. Evidence vs aspiration — claims backed by metric, case study, or named customer? Or empty promises?
  6. Audience signal — does the kicker / hero make clear WHO this is for? "For founders" beats "For everyone".

Severity rubric:
  - blocker: copy is incomprehensible, contradictory, or contains slop-words in the hero
  - high: copy is vague aspiration with no evidence
  - medium: tone wobbles between sections
  - low: nitpicks

Output ONLY JSON: { "score": number, "findings": [{ "severity": ..., "issue": ..., "fix": ... }] }
Max 5 findings, blocker-first. No prose around the JSON.`,

  layout: `You are a senior interaction designer reviewing the layout + spacing of a generated website. Score ONLY layout — not copy, not typography.

Check (in order):
  1. Spacing rhythm — does the site use a consistent vertical scale (py-12 / py-16 / py-20 / py-24 / py-32)? Or arbitrary values?
  2. White-space — does the hero have enough breathing room? (min py-20 on mobile, py-32 on desktop is the floor)
  3. Visual weight balance — does the hero CTA dominate, or compete with secondary actions?
  4. Responsive breakpoints — does the bento grid collapse cleanly on mobile? Do nav links collapse to a hamburger?
  5. Alignment — does the page have a clear grid spine? Or do sections drift?
  6. Card uniformity — do card-like elements (features, pricing, testimonials) share padding, radius, border style?

Severity rubric:
  - blocker: layout breaks on mobile (overflow, overlap, text cut off)
  - high: spacing is cramped or inconsistent across sections
  - medium: visual weight is unbalanced
  - low: nitpicks

Output ONLY JSON: { "score": number, "findings": [{ "severity": ..., "issue": ..., "fix": ... }] }
Max 5 findings, blocker-first. No prose around the JSON.`,
};

// ───────────────────────────────────────────────────────────────────────
// One axis call
// ───────────────────────────────────────────────────────────────────────

async function critiqueAxis(axis: CritiqueAxis, siteSummary: string): Promise<AxisVerdict> {
  const baseline: AxisVerdict = {
    axis,
    score: 75,
    findings: [],
    skipped: true,
    skipReason: "critic call failed",
  };
  try {
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system: SYSTEM_PROMPTS[axis],
      userMessage: `Site summary:\n\n${siteSummary}\n\nReturn the critique JSON.`,
      maxTokens: 700,
    });
    const validation = validateGeneratedText(fb.text, 20);
    if (!validation.ok || detectRefusal(fb.text).refused) {
      return { ...baseline, skipReason: validation.reason || "refusal" };
    }
    const startIdx = fb.text.indexOf("{");
    const endIdx = fb.text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      return { ...baseline, skipReason: "no JSON in response" };
    }
    const parsed = JSON.parse(fb.text.slice(startIdx, endIdx + 1)) as {
      score?: number;
      findings?: CritiqueFinding[];
    };
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const findings: CritiqueFinding[] = Array.isArray(parsed.findings)
      ? parsed.findings
          .filter((f): f is CritiqueFinding =>
            !!f && typeof f === "object" &&
            typeof (f as CritiqueFinding).issue === "string" &&
            typeof (f as CritiqueFinding).fix === "string" &&
            ["blocker", "high", "medium", "low"].includes((f as CritiqueFinding).severity),
          )
          .slice(0, 5)
      : [];
    return { axis, score, findings };
  } catch (err) {
    return { ...baseline, skipReason: err instanceof Error ? err.message : "unknown" };
  }
}

// ───────────────────────────────────────────────────────────────────────
// Panel — all three axes in parallel
// ───────────────────────────────────────────────────────────────────────

export async function critiquePanel(siteSummary: string): Promise<PanelVerdict> {
  const started = Date.now();
  const [typography, copy, layout] = await Promise.all([
    critiqueAxis("typography", siteSummary),
    critiqueAxis("copy", siteSummary),
    critiqueAxis("layout", siteSummary),
  ]);
  const verdicts = [typography, copy, layout];
  const scored = verdicts.filter((v) => !v.skipped);
  const overall = scored.length > 0
    ? Math.round(scored.reduce((s, v) => s + v.score, 0) / scored.length)
    : 75;
  const hasBlockers = verdicts.some((v) => v.findings.some((f) => f.severity === "blocker"));
  return { overall, verdicts, hasBlockers, latencyMs: Date.now() - started };
}

/**
 * Reduce a panel verdict to the set of axes that need a repair pass.
 * Used by the slot-stream endpoint after generation: if any axis
 * scored <60 OR has blockers, regenerate the slots that critic flagged.
 */
export function axesNeedingRepair(verdict: PanelVerdict): CritiqueAxis[] {
  return verdict.verdicts
    .filter((v) => !v.skipped && (v.score < 60 || v.findings.some((f) => f.severity === "blocker")))
    .map((v) => v.axis);
}
