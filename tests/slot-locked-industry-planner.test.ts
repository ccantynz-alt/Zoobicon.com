/**
 * Tests for the industry-aware planner (KILLER-MOVES-BUILDER.md #B7).
 */

import { describe, it, expect } from "vitest";
import {
  pickComponentForIndustry,
  planPageForIndustry,
  listSlotLockedSchemas,
} from "../src/lib/slot-locked/industry-planner";

describe("pickComponentForIndustry — hero", () => {
  it("picks the restaurant-warm hero when industry + theme match", () => {
    const id = pickComponentForIndustry({ category: "hero", industry: "restaurant", theme: "warm" });
    expect(id).toBe("hero-restaurant-warm-slot");
  });

  it("picks the portfolio-editorial hero when industry + theme match", () => {
    const id = pickComponentForIndustry({ category: "hero", industry: "portfolio", theme: "editorial" });
    expect(id).toBe("hero-portfolio-editorial-slot");
  });

  it("falls back to the generic hero-spotlight for SaaS (no SaaS-specific yet)", () => {
    const id = pickComponentForIndustry({ category: "hero", industry: "saas", theme: "editorial" });
    expect(id).toBe("hero-spotlight-slot");
  });

  it("falls back to the generic hero when theme is wrong even for matching industry", () => {
    // Restaurant industry + DARK theme — the warm variant is wrong-themed,
    // generic spotlight wins on theme-neutrality.
    const id = pickComponentForIndustry({ category: "hero", industry: "restaurant", theme: "dark" });
    expect(id).toBe("hero-spotlight-slot");
  });

  it("returns null when category has no schemas registered", () => {
    const id = pickComponentForIndustry({ category: "carousel", industry: "saas", theme: "editorial" });
    expect(id).toBeNull();
  });
});

describe("pickComponentForIndustry — non-hero categories", () => {
  it("returns navbar-minimal for navbar (only variant)", () => {
    const id = pickComponentForIndustry({ category: "navbar", industry: "restaurant", theme: "warm" });
    expect(id).toBe("navbar-minimal-slot");
  });

  it("returns features-bento for features (only variant)", () => {
    const id = pickComponentForIndustry({ category: "features", industry: "saas", theme: "editorial" });
    expect(id).toBe("features-bento-slot");
  });

  it("returns pricing-tiers for pricing", () => {
    const id = pickComponentForIndustry({ category: "pricing", industry: "saas", theme: "editorial" });
    expect(id).toBe("pricing-tiers-slot");
  });

  it("returns footer-editorial for footer", () => {
    const id = pickComponentForIndustry({ category: "footer", industry: "saas", theme: "editorial" });
    expect(id).toBe("footer-editorial-slot");
  });
});

describe("planPageForIndustry", () => {
  it("plans a SaaS page with pricing included", () => {
    const plan = planPageForIndustry({ industry: "saas", theme: "editorial" });
    expect(plan).toEqual([
      "navbar-minimal-slot",
      "hero-spotlight-slot",
      "features-bento-slot",
      "stats-strip-slot",
      "testimonials-quotes-slot",
      "pricing-tiers-slot",
      "faq-accordion-slot",
      "cta-banner-slot",
      "footer-editorial-slot",
    ]);
  });

  it("plans a restaurant page WITHOUT pricing (uses booking flow instead)", () => {
    const plan = planPageForIndustry({ industry: "restaurant", theme: "warm" });
    expect(plan).toContain("hero-restaurant-warm-slot");
    expect(plan).not.toContain("pricing-tiers-slot");
  });

  it("plans a portfolio page WITHOUT pricing", () => {
    const plan = planPageForIndustry({ industry: "portfolio", theme: "editorial" });
    expect(plan).toContain("hero-portfolio-editorial-slot");
    expect(plan).not.toContain("pricing-tiers-slot");
  });

  it("respects explicit includePricing override", () => {
    const withPricing = planPageForIndustry({
      industry: "restaurant",
      theme: "warm",
      includePricing: true,
    });
    expect(withPricing).toContain("pricing-tiers-slot");

    const withoutPricing = planPageForIndustry({
      industry: "saas",
      theme: "editorial",
      includePricing: false,
    });
    expect(withoutPricing).not.toContain("pricing-tiers-slot");
  });

  it("plans a page even without industry/theme (falls back to generics)", () => {
    const plan = planPageForIndustry({});
    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan[0]).toBe("navbar-minimal-slot");
    expect(plan[plan.length - 1]).toBe("footer-editorial-slot");
  });
});

describe("listSlotLockedSchemas", () => {
  it("returns at least the 7 schemas registered today", () => {
    const all = listSlotLockedSchemas();
    expect(all.length).toBeGreaterThanOrEqual(7);
  });

  it("includes both generic + industry variants for hero", () => {
    const heroes = listSlotLockedSchemas().filter((s) => s.category === "hero");
    expect(heroes.length).toBeGreaterThanOrEqual(3);
    const ids = heroes.map((s) => s.id);
    expect(ids).toContain("hero-spotlight-slot");
    expect(ids).toContain("hero-restaurant-warm-slot");
    expect(ids).toContain("hero-portfolio-editorial-slot");
  });
});
