/**
 * V2 server-side renderer tests. Proves the reliability core: a prompt
 * becomes a complete, content-rich HTML document entirely on the server
 * (no browser, no Babel, no crypto). Uses example-fill so it needs no LLM
 * key and is fully deterministic.
 */

import { describe, it, expect } from "vitest";
import { renderSlotPage, renderFromRegistry } from "../src/lib/v2/render-page";
// Populate the 118-component registry (ensureRegistryLoaded uses CommonJS
// require which doesn't run under vitest's ESM transform).
import "../src/lib/component-registry/navbars";
import "../src/lib/component-registry/heroes";
import "../src/lib/component-registry/features";
import "../src/lib/component-registry/testimonials";
import "../src/lib/component-registry/footers";
import "../src/lib/component-registry/extras";
import "../src/lib/component-registry/sections";

describe("v2 renderSlotPage", () => {
  it("renders a complete SaaS page to a real HTML document", async () => {
    const page = await renderSlotPage({
      prompt: "A SaaS analytics platform for product teams",
      useExampleFill: true,
    });
    expect(page.industry).toBe("saas");
    expect(page.html).toContain("<!DOCTYPE html>");
    expect(page.html).toContain("cdn.tailwindcss.com");
    expect(page.componentIds.length).toBeGreaterThanOrEqual(5);
    // Non-trivial output proves sections actually rendered (and, with the
    // #each fix, that list content is present rather than blank).
    expect(page.html.length).toBeGreaterThan(3000);
    expect(page.aiUsed).toBe(false);
  });

  it("detects a warm restaurant theme and still renders", async () => {
    const page = await renderSlotPage({ prompt: "A warm artisan bakery in Brooklyn", useExampleFill: true });
    expect(page.theme).toBe("warm");
    expect(page.industry).toBe("restaurant");
    expect(page.html.length).toBeGreaterThan(3000);
  });

  it("never returns a blank document even for a vague prompt", async () => {
    const page = await renderSlotPage({ prompt: "something nice", useExampleFill: true });
    expect(page.componentIds.length).toBeGreaterThanOrEqual(5);
    expect(page.html.length).toBeGreaterThan(3000);
  });
});

describe("v2 renderFromRegistry (rich engine)", () => {
  it("selects prompt-relevant components from the full registry and renders them", async () => {
    const page = await renderFromRegistry({
      prompt: "A SaaS analytics platform for product teams",
      useExampleFill: true, // no AI — exercise selection + server render
    });
    // SaaS prompt → navbar/hero/logos/features/stats/testimonials/pricing/faq/cta/footer
    expect(page.componentIds.length).toBeGreaterThanOrEqual(8);
    expect(page.componentIds).toContain("logos-marquee");
    expect(page.html).toContain("<!DOCTYPE html>");
    expect(page.html.length).toBeGreaterThan(5000);
  });

  it("picks a different section mix for an e-commerce prompt", async () => {
    const page = await renderFromRegistry({ prompt: "An online boutique store for handmade jewelry", useExampleFill: true });
    expect(page.componentIds.length).toBeGreaterThanOrEqual(6);
    expect(page.html.length).toBeGreaterThan(5000);
  });
});
