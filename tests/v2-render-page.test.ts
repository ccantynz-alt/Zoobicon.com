/**
 * V2 server-side renderer tests. Proves the reliability core: a prompt
 * becomes a complete, content-rich HTML document entirely on the server
 * (no browser, no Babel, no crypto). Uses example-fill so it needs no LLM
 * key and is fully deterministic.
 */

import { describe, it, expect } from "vitest";
import { renderSlotPage } from "../src/lib/v2/render-page";

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
