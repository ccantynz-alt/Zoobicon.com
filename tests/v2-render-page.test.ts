/**
 * V2 server-side renderer tests. Proves the reliability core: a prompt
 * becomes a complete, content-rich HTML document entirely on the server
 * (no browser, no Babel, no crypto). Uses example-fill so it needs no LLM
 * key and is fully deterministic.
 */

import { describe, it, expect } from "vitest";
import {
  renderSlotPage,
  renderFromRegistry,
  pageShell,
  sectionWrap,
  usesSerifHeadings,
  compileComponentToModule,
} from "../src/lib/v2/render-page";
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

describe("v2 progressive streaming primitives", () => {
  it("streaming shell carries the hot-swap listener + root, static shell doesn't", () => {
    const streaming = pageShell("", "Acme", { industry: "saas", streaming: true });
    expect(streaming).toContain('id="zb-root"');
    expect(streaming).toContain("zb-section");
    expect(streaming).toContain("zb-ready");

    const staticShell = pageShell("<section>hi</section>", "Acme", { industry: "saas" });
    expect(staticShell).not.toContain('id="zb-root"');
    expect(staticShell).not.toContain("zb-ready");
    expect(staticShell).toContain("<section>hi</section>");
  });

  it("sectionWrap addresses sections by index for in-place hot-swap", () => {
    expect(sectionWrap(3, "<h1>x</h1>")).toBe('<section data-zb-i="3"><h1>x</h1></section>');
  });

  it("compiles a component to a browser ES module (live hydration layer)", () => {
    const tsx = `import React from "react";
import { ArrowRight } from "lucide-react";
export default function Hero() {
  const [open, setOpen] = React.useState(false);
  return <button onClick={() => setOpen(!open)}>Toggle <ArrowRight /></button>;
}`;
    const js = compileComponentToModule(tsx);
    // ESM output keeps bare imports (resolved by the iframe importmap) + the
    // default export, and the JSX is compiled away (no Babel needed in browser).
    expect(js).toContain('import React from "react"');
    expect(js).toContain('from "lucide-react"');
    expect(js).toContain("export default");
    expect(js).toContain("React.createElement");
    expect(js).not.toContain("<button");
  });

  it("streaming shell carries the hydration runtime + importmap; static shell doesn't", () => {
    const streaming = pageShell("", "Acme", { industry: "saas", streaming: true });
    expect(streaming).toContain('type="importmap"');
    expect(streaming).toContain("esm.sh/react@18.3.1");
    expect(streaming).toContain("createRoot"); // live mount
    expect(streaming).toContain("getDerivedStateFromError"); // per-section boundary

    const staticShell = pageShell("<section>hi</section>", "Acme", { industry: "saas" });
    expect(staticShell).not.toContain('type="importmap"');
    expect(staticShell).not.toContain("createRoot");
  });

  it("editorial industries get serif display headings, tech industries stay sans", () => {
    expect(usesSerifHeadings("restaurant")).toBe(true);
    expect(usesSerifHeadings("portfolio")).toBe(true);
    expect(usesSerifHeadings("saas")).toBe(false);
    expect(usesSerifHeadings("ecommerce")).toBe(false);
    // Editorial shell injects the Playfair *heading* rule; saas omits it
    // (the font link itself is always present, so assert on the h1,h2 rule).
    const headingRule = 'h1,h2{font-family:"Playfair Display"';
    expect(pageShell("", "", { industry: "restaurant" })).toContain(headingRule);
    expect(pageShell("", "", { industry: "saas" })).not.toContain(headingRule);
  });
});
