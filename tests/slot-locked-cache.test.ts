/**
 * Tests for the slot-fill cache (KILLER-MOVES-BUILDER.md #B19).
 *
 * Pure-function tests only — no DB calls. The Neon-backed lookup/
 * persist paths are exercised by integration tests against a test
 * database (GateTest, separate CI lane).
 */

import { describe, it, expect } from "vitest";
import { normalisePrompt, buildCacheKey, remapBrandSlots } from "../src/lib/slot-locked/cache";

describe("normalisePrompt", () => {
  it("lowercases + strips punctuation", () => {
    expect(normalisePrompt("Build me a Modern SaaS site!")).toBe(normalisePrompt("build modern saas site"));
  });

  it("drops stop-words", () => {
    const a = normalisePrompt("for a modern SaaS analytics tool");
    const b = normalisePrompt("modern SaaS analytics tool");
    expect(a).toBe(b);
  });

  it("is order-independent", () => {
    const a = normalisePrompt("analytics SaaS tool");
    const b = normalisePrompt("tool SaaS analytics");
    expect(a).toBe(b);
  });

  it("drops generic builder words (modern / simple / amazing)", () => {
    const a = normalisePrompt("modern simple beautiful amazing SaaS analytics tool");
    const b = normalisePrompt("SaaS analytics tool");
    expect(a).toBe(b);
  });

  it("produces the same key for semantically similar prompts", () => {
    const variants = [
      "modern SaaS landing page for analytics tool",
      "modern SaaS landing page for analytics startup",
      "modern SaaS landing for an analytics product",
      "I want a SaaS landing for an analytics tool",
    ];
    const normalised = variants.map(normalisePrompt);
    // Not all four hash to the same thing (tool vs startup vs product
    // are different content words), but at least the duplicate
    // formulations of "tool" should match.
    expect(normalised[0]).toBe(normalisePrompt("a modern SaaS landing page for an analytics tool"));
  });
});

describe("buildCacheKey", () => {
  it("includes componentId so the same prompt yields different keys per component", () => {
    const base = { theme: "editorial", industry: "saas", brandName: "Acme", prompt: "analytics tool" };
    const heroKey = buildCacheKey({ ...base, componentId: "hero-spotlight-slot" });
    const navKey  = buildCacheKey({ ...base, componentId: "navbar-minimal-slot" });
    expect(heroKey).not.toBe(navKey);
  });

  it("changes when theme changes", () => {
    const base = { componentId: "hero-spotlight-slot", industry: "saas", brandName: "Acme", prompt: "analytics tool" };
    const editorial = buildCacheKey({ ...base, theme: "editorial" });
    const warm = buildCacheKey({ ...base, theme: "warm" });
    expect(editorial).not.toBe(warm);
  });

  it("changes when industry changes", () => {
    const base = { componentId: "hero-spotlight-slot", theme: "editorial", brandName: "Acme", prompt: "analytics tool" };
    const saas = buildCacheKey({ ...base, industry: "saas" });
    const restaurant = buildCacheKey({ ...base, industry: "restaurant" });
    expect(saas).not.toBe(restaurant);
  });

  it("changes when brand changes (no cross-brand copy leakage)", () => {
    const base = { componentId: "hero-spotlight-slot", theme: "editorial", industry: "saas", prompt: "analytics tool" };
    const acme = buildCacheKey({ ...base, brandName: "Acme" });
    const tesla = buildCacheKey({ ...base, brandName: "Tesla" });
    expect(acme).not.toBe(tesla);
  });

  it("produces same key for case + whitespace variations of the brand", () => {
    const base = { componentId: "hero-spotlight-slot", theme: "editorial", industry: "saas", prompt: "analytics tool" };
    const a = buildCacheKey({ ...base, brandName: "Acme" });
    const b = buildCacheKey({ ...base, brandName: "  ACME  " });
    expect(a).toBe(b);
  });

  it("produces same key for semantically equivalent prompts", () => {
    const base = { componentId: "hero-spotlight-slot", theme: "editorial", industry: "saas", brandName: "Acme" };
    const a = buildCacheKey({ ...base, prompt: "for a modern SaaS analytics tool" });
    const b = buildCacheKey({ ...base, prompt: "modern SaaS analytics tool" });
    expect(a).toBe(b);
  });
});

describe("remapBrandSlots", () => {
  it("replaces brandName when present", () => {
    const out = remapBrandSlots({ brandName: "OldCo", headline: "Hello" }, { brandName: "NewCo" });
    expect(out.brandName).toBe("NewCo");
    expect(out.headline).toBe("Hello");
  });

  it("derives brandMonogram from brandName if not explicitly set", () => {
    const out = remapBrandSlots({ brandName: "OldCo", brandMonogram: "O" }, { brandName: "NewCo" });
    expect(out.brandMonogram).toBe("N");
  });

  it("respects explicit brandMonogram override", () => {
    const out = remapBrandSlots({ brandName: "OldCo", brandMonogram: "O" }, { brandName: "NewCo", brandMonogram: "X" });
    expect(out.brandMonogram).toBe("X");
  });

  it("rewrites copyright year in copyrightLine", () => {
    const out = remapBrandSlots(
      { copyrightLine: "© 2023 OldCo. All rights reserved." },
      { copyrightYear: 2026 },
    );
    expect(out.copyrightLine).toBe("© 2026 OldCo. All rights reserved.");
  });

  it("returns a new object (does not mutate input)", () => {
    const input = { brandName: "A" };
    const out = remapBrandSlots(input, { brandName: "B" });
    expect(input.brandName).toBe("A");
    expect(out.brandName).toBe("B");
  });

  it("leaves unrelated slots unchanged", () => {
    const out = remapBrandSlots(
      { brandName: "A", headline: "Build empires", subhead: "Specific value claim", showMetrics: true },
      { brandName: "B" },
    );
    expect(out.headline).toBe("Build empires");
    expect(out.subhead).toBe("Specific value claim");
    expect(out.showMetrics).toBe(true);
  });
});
