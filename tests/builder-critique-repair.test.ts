/**
 * Tests for the critique→repair loop guidance builder (B9).
 *
 * buildRepairGuidance turns a multi-judge panel verdict into the prompt
 * block that drives a targeted regeneration. These tests pin its
 * contract: skip nitpicks, skip skipped axes, surface actionable fixes.
 */

import { describe, it, expect } from "vitest";
import { buildRepairGuidance } from "../src/lib/builder-critique/multi-judge";
import type { PanelVerdict, AxisVerdict } from "../src/lib/builder-critique/multi-judge";

function panel(verdicts: AxisVerdict[]): PanelVerdict {
  const scored = verdicts.filter((v) => !v.skipped);
  return {
    overall: scored.length ? Math.round(scored.reduce((s, v) => s + v.score, 0) / scored.length) : 75,
    verdicts,
    hasBlockers: verdicts.some((v) => v.findings.some((f) => f.severity === "blocker")),
    latencyMs: 10,
  };
}

describe("buildRepairGuidance", () => {
  it("returns empty string when there are no findings", () => {
    const v = panel([
      { axis: "typography", score: 95, findings: [] },
      { axis: "copy", score: 92, findings: [] },
      { axis: "layout", score: 90, findings: [] },
    ]);
    expect(buildRepairGuidance(v)).toBe("");
  });

  it("ignores low-severity nitpicks (not worth a regeneration)", () => {
    const v = panel([
      { axis: "copy", score: 88, findings: [{ severity: "low", issue: "minor", fix: "tweak" }] },
    ]);
    expect(buildRepairGuidance(v)).toBe("");
  });

  it("includes blocker/high/medium findings with axis, issue and fix", () => {
    const v = panel([
      {
        axis: "copy",
        score: 45,
        findings: [
          { severity: "blocker", issue: "Hero uses 'revolutionary'", fix: "Replace with a concrete claim" },
          { severity: "low", issue: "nitpick", fix: "ignore me" },
        ],
      },
      {
        axis: "typography",
        score: 58,
        findings: [{ severity: "high", issue: "No italic accent in hero", fix: "Wrap one word in <em>" }],
      },
    ]);
    const out = buildRepairGuidance(v);
    expect(out).toContain("REVISION NOTES");
    expect(out).toContain("Hero uses 'revolutionary'");
    expect(out).toContain("Replace with a concrete claim");
    expect(out).toContain("[copy/blocker]");
    expect(out).toContain("[typography/high]");
    // low-severity nitpick must NOT appear
    expect(out).not.toContain("nitpick");
  });

  it("skips axes whose critic call was skipped", () => {
    const v = panel([
      { axis: "copy", score: 75, findings: [], skipped: true, skipReason: "refusal" },
      { axis: "layout", score: 50, findings: [{ severity: "high", issue: "Cramped hero", fix: "Add py-32" }] },
    ]);
    const out = buildRepairGuidance(v);
    expect(out).toContain("Cramped hero");
    expect(out).not.toContain("refusal");
  });
});
