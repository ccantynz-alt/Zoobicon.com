/**
 * Tests for the few-shot retrieval prefix renderer
 * (KILLER-MOVES-BUILDER.md #B26).
 *
 * DB-backed retrieval is tested in the GateTest integration lane —
 * these specs cover the pure rendering + anonymisation logic.
 */

import { describe, it, expect } from "vitest";
import { renderFewShotPrefix } from "../src/lib/flywheel/successful-builds";

describe("renderFewShotPrefix", () => {
  it("returns empty string when no examples are provided", () => {
    expect(renderFewShotPrefix([])).toBe("");
  });

  it("renders examples with their industry + theme + age + score", () => {
    const out = renderFewShotPrefix([
      {
        componentId: "hero-spotlight-slot",
        industry: "saas",
        theme: "editorial",
        promptHead: "modern SaaS analytics landing page",
        brandName: "Acme",
        slotFill: { headline: "Build empires", subhead: "Specific value claim" },
        qualityScore: 92,
        ageDays: 4,
        retrievalScore: 11.7,
      },
    ]);

    expect(out).toContain("Example 1");
    expect(out).toContain("saas / editorial");
    expect(out).toContain("92/100");
    expect(out).toContain("4d old");
    expect(out).toContain("Build empires");
  });

  it("anonymises the brand name across the slot fill", () => {
    const out = renderFewShotPrefix([
      {
        componentId: "hero-spotlight-slot",
        industry: "saas",
        theme: "editorial",
        promptHead: "Acme launches new analytics tool",
        brandName: "Acme",
        slotFill: { headline: "Welcome to Acme", subhead: "Acme is the future" },
        qualityScore: 88,
        ageDays: 1,
        retrievalScore: 9.5,
      },
    ]);

    // Brand name replaced with placeholder in the JSON block
    expect(out).toContain("[Brand 1]");
    expect(out).not.toMatch(/Welcome to Acme/);
    expect(out).not.toMatch(/Acme is the future/);
  });

  it("renders multiple examples with sequential brand placeholders", () => {
    const out = renderFewShotPrefix([
      {
        componentId: "hero-spotlight-slot",
        industry: "saas",
        theme: "editorial",
        promptHead: "First example",
        brandName: "OneBrand",
        slotFill: { headline: "OneBrand wins" },
        qualityScore: 90,
        ageDays: 1,
        retrievalScore: 9,
      },
      {
        componentId: "hero-spotlight-slot",
        industry: "saas",
        theme: "editorial",
        promptHead: "Second example",
        brandName: "TwoBrand",
        slotFill: { headline: "TwoBrand wins" },
        qualityScore: 95,
        ageDays: 2,
        retrievalScore: 8,
      },
    ]);

    expect(out).toContain("[Brand 1]");
    expect(out).toContain("[Brand 2]");
    expect(out).not.toContain("OneBrand wins");
    expect(out).not.toContain("TwoBrand wins");
  });

  it("includes the reference framing instructions to the AI", () => {
    const out = renderFewShotPrefix([
      {
        componentId: "hero-spotlight-slot",
        industry: "agency",
        theme: "editorial",
        promptHead: "x",
        brandName: "X",
        slotFill: { headline: "y" },
        qualityScore: 80,
        ageDays: 1,
        retrievalScore: 5,
      },
    ]);

    expect(out).toContain("REFERENCE");
    expect(out).toContain("Use them as STYLE + STRUCTURE reference");
    expect(out).toContain("Do not copy the literal copy");
    expect(out).toContain("END REFERENCE");
  });

  it("handles slot fills with regex-special characters in brand name safely", () => {
    // Should not throw — escapeRegExp guards the brand-replacement step.
    expect(() => {
      renderFewShotPrefix([
        {
          componentId: "hero-spotlight-slot",
          industry: "saas",
          theme: "editorial",
          promptHead: "test",
          brandName: "Foo.Bar+Baz*",
          slotFill: { headline: "Foo.Bar+Baz* makes it" },
          qualityScore: 80,
          ageDays: 1,
          retrievalScore: 5,
        },
      ]);
    }).not.toThrow();
  });
});
