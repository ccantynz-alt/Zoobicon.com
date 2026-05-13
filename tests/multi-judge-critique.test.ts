/**
 * Tests for the multi-judge critique panel (KILLER-MOVES-BUILDER.md #B9).
 *
 * The actual LLM calls are integration-tested separately. These specs
 * lock down the pure logic: parsing, scoring, severity classification,
 * axesNeedingRepair selection.
 */

import { describe, it, expect } from "vitest";
import { axesNeedingRepair } from "../src/lib/builder-critique/multi-judge";
import type { PanelVerdict, AxisVerdict } from "../src/lib/builder-critique/multi-judge";

function verdict(opts: Partial<AxisVerdict> & { axis: AxisVerdict["axis"] }): AxisVerdict {
  return { score: 90, findings: [], ...opts };
}

describe("axesNeedingRepair", () => {
  it("returns empty array when all axes pass cleanly", () => {
    const panel: PanelVerdict = {
      overall: 92,
      hasBlockers: false,
      latencyMs: 1200,
      verdicts: [
        verdict({ axis: "typography", score: 95 }),
        verdict({ axis: "copy", score: 90 }),
        verdict({ axis: "layout", score: 91 }),
      ],
    };
    expect(axesNeedingRepair(panel)).toEqual([]);
  });

  it("flags axes with score < 60", () => {
    const panel: PanelVerdict = {
      overall: 75,
      hasBlockers: false,
      latencyMs: 1200,
      verdicts: [
        verdict({ axis: "typography", score: 95 }),
        verdict({ axis: "copy", score: 55 }),
        verdict({ axis: "layout", score: 91 }),
      ],
    };
    expect(axesNeedingRepair(panel)).toEqual(["copy"]);
  });

  it("flags axes with blocker findings even if score is acceptable", () => {
    const panel: PanelVerdict = {
      overall: 85,
      hasBlockers: true,
      latencyMs: 1200,
      verdicts: [
        verdict({ axis: "typography", score: 90 }),
        verdict({
          axis: "copy",
          score: 85,
          findings: [
            { severity: "blocker", issue: "hero uses 'unleash' which is banned", fix: "rewrite the hero CTA" },
          ],
        }),
        verdict({ axis: "layout", score: 95 }),
      ],
    };
    expect(axesNeedingRepair(panel)).toEqual(["copy"]);
  });

  it("can flag multiple axes at once", () => {
    const panel: PanelVerdict = {
      overall: 50,
      hasBlockers: true,
      latencyMs: 1200,
      verdicts: [
        verdict({ axis: "typography", score: 45 }),
        verdict({ axis: "copy", score: 55, findings: [{ severity: "blocker", issue: "x", fix: "y" }] }),
        verdict({ axis: "layout", score: 90 }),
      ],
    };
    expect(axesNeedingRepair(panel).sort()).toEqual(["copy", "typography"]);
  });

  it("ignores skipped axes regardless of score", () => {
    const panel: PanelVerdict = {
      overall: 90,
      hasBlockers: false,
      latencyMs: 1200,
      verdicts: [
        verdict({ axis: "typography", score: 95 }),
        verdict({ axis: "copy", score: 0, skipped: true, skipReason: "critic call failed" }),
        verdict({ axis: "layout", score: 91 }),
      ],
    };
    expect(axesNeedingRepair(panel)).toEqual([]);
  });

  it("preserves blocker-only verdicts at high scores (score 95 + blocker = still flag)", () => {
    const panel: PanelVerdict = {
      overall: 95,
      hasBlockers: true,
      latencyMs: 1200,
      verdicts: [
        verdict({
          axis: "layout",
          score: 95,
          findings: [
            { severity: "blocker", issue: "hero overflows on 375px wide", fix: "remove fixed widths" },
          ],
        }),
      ],
    };
    expect(axesNeedingRepair(panel)).toEqual(["layout"]);
  });
});
