/**
 * Tests for quality-aware routing (KILLER-MOVES-BUILDER.md #B21b).
 *
 * Tests pure logic (inferQualityClass + routing config + sideline
 * state). The qualityAwareCall integration with real LLM round-trips
 * is covered by GateTest in a separate CI lane.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { inferQualityClass, resetQualityRouter } from "../src/lib/api-bank-quality";

beforeEach(() => {
  resetQualityRouter();
});

describe("inferQualityClass", () => {
  it("tags brand-defining copy as premium", () => {
    expect(inferQualityClass("headline", "text")).toBe("premium");
    expect(inferQualityClass("subhead", "richText")).toBe("premium");
    expect(inferQualityClass("tagline", "text")).toBe("premium");
    expect(inferQualityClass("positioning", "richText")).toBe("premium");
    expect(inferQualityClass("displayName", "text")).toBe("premium");
    expect(inferQualityClass("restaurantName", "text")).toBe("premium");
    expect(inferQualityClass("brandTagline", "text")).toBe("premium");
  });

  it("tags structural booleans + URLs + icons as mechanical", () => {
    expect(inferQualityClass("href", "url")).toBe("mechanical");
    expect(inferQualityClass("showCta", "boolean")).toBe("mechanical");
    expect(inferQualityClass("showMetrics", "boolean")).toBe("mechanical");
    expect(inferQualityClass("brandMonogram", "text")).toBe("mechanical");
    expect(inferQualityClass("heroPhotoUrl", "url")).toBe("mechanical");
  });

  it("infers mechanical from type for url/icon/boolean/enum/number/color", () => {
    expect(inferQualityClass("randomFlag", "boolean")).toBe("mechanical");
    expect(inferQualityClass("ctaIcon", "icon")).toBe("mechanical");
    expect(inferQualityClass("ctaHref", "url")).toBe("mechanical");
    expect(inferQualityClass("layout", "enum")).toBe("mechanical");
    expect(inferQualityClass("count", "number")).toBe("mechanical");
    expect(inferQualityClass("accent", "color")).toBe("mechanical");
  });

  it("infers premium for hero/brand/cta/primary/featured prefixes", () => {
    expect(inferQualityClass("heroTitle", "text")).toBe("premium");
    expect(inferQualityClass("brandStory", "richText")).toBe("premium");
    expect(inferQualityClass("ctaText", "text")).toBe("premium");
    expect(inferQualityClass("primaryMessage", "text")).toBe("premium");
    expect(inferQualityClass("featuredCopy", "richText")).toBe("premium");
  });

  it("defaults to acceptable for plain text slots without premium signals", () => {
    expect(inferQualityClass("authorName", "text")).toBe("acceptable");
    expect(inferQualityClass("sectionTitle", "text")).toBe("acceptable");
    expect(inferQualityClass("listItem", "text")).toBe("acceptable");
    expect(inferQualityClass("metricLabel", "text")).toBe("acceptable");
  });

  it("explicit premium names beat type-based inference", () => {
    // Even though 'tagline' is just plain text, the name puts it in premium.
    expect(inferQualityClass("tagline", "text")).toBe("premium");
  });
});

describe("quality class semantics", () => {
  it("classifies the hero-spotlight slot fill correctly", () => {
    // From src/lib/slot-locked/templates/hero-spotlight.ts
    const fixtures: Array<[string, string, "premium" | "acceptable" | "mechanical"]> = [
      ["eyebrow", "text", "acceptable"],
      ["headline", "text", "premium"],
      ["subhead", "richText", "premium"],
      ["primaryCtaLabel", "text", "premium"], // starts with "primary"
      ["primaryCtaHref", "url", "mechanical"],
      ["secondaryCtaLabel", "text", "acceptable"],
      ["secondaryCtaHref", "url", "mechanical"],
      ["showMetrics", "boolean", "mechanical"],
    ];

    for (const [name, type, expected] of fixtures) {
      expect(inferQualityClass(name, type), `${name}/${type} should be ${expected}`).toBe(expected);
    }
  });

  it("classifies the navbar-minimal slot fill correctly", () => {
    // From src/lib/slot-locked/templates/navbar-minimal.ts
    const fixtures: Array<[string, string, "premium" | "acceptable" | "mechanical"]> = [
      ["brandName", "text", "premium"], // /^brand/ → premium (brand copy is high-value)
      ["brandMonogram", "text", "mechanical"], // ALWAYS_MECHANICAL_NAMES
      ["ctaLabel", "text", "premium"], // starts with "cta"
      ["ctaHref", "url", "mechanical"],
      ["showCta", "boolean", "mechanical"],
    ];

    for (const [name, type, expected] of fixtures) {
      expect(inferQualityClass(name, type), `${name}/${type} should be ${expected}`).toBe(expected);
    }
  });
});
