/**
 * Tests for the Slot-Locked Composition assembler (KILLER-MOVES-BUILDER.md #B1).
 *
 * Locks in:
 *   - Slot validation per type (text, url, icon, color, enum, boolean,
 *     number, list)
 *   - Coercion behaviour (truncation, default-fallback, regex enforcement)
 *   - Template rendering (escape, raw, #if, #each, nested item refs)
 *   - End-to-end assembleComponent() against the hero-spotlight schema
 */

import { describe, it, expect } from "vitest";
import {
  assembleComponent,
  renderTemplate,
  schemaToPrompt,
  validateSlot,
} from "../src/lib/slot-locked/assembler";
import {
  HERO_SPOTLIGHT_SCHEMA,
  HERO_SPOTLIGHT_TEMPLATE,
  HERO_SPOTLIGHT_EXAMPLE,
} from "../src/lib/slot-locked/templates/hero-spotlight";
import type {
  EnumSlotDef,
  IconSlotDef,
  ListSlotDef,
  NumberSlotDef,
  TextSlotDef,
  UrlSlotDef,
} from "../src/lib/slot-locked/types";

describe("validateSlot — text", () => {
  const def: TextSlotDef = { name: "headline", type: "text", prompt: "x", maxLength: 20, required: true };

  it("accepts valid short text", () => {
    expect(validateSlot(def, "Hello world").ok).toBe(true);
  });

  it("truncates over-long text with ellipsis", () => {
    const r = validateSlot(def, "x".repeat(40));
    expect(r.ok).toBe(false);
    expect(typeof r.corrected).toBe("string");
    expect((r.corrected as string).length).toBeLessThanOrEqual(20);
    expect((r.corrected as string).endsWith("…")).toBe(true);
  });

  it("rejects missing required text with no default", () => {
    expect(validateSlot(def, undefined).ok).toBe(false);
  });

  it("returns default when value missing + default exists", () => {
    const withDefault: TextSlotDef = { ...def, default: "fallback", required: false };
    const r = validateSlot(withDefault, undefined);
    expect(r.ok).toBe(true);
    expect(r.corrected).toBe("fallback");
  });

  it("rejects non-string types", () => {
    const r = validateSlot(def, 42 as unknown as string);
    expect(r.ok).toBe(false);
  });

  it("enforces regex patterns", () => {
    const patternDef: TextSlotDef = { ...def, pattern: "^[A-Z][a-z]+$", maxLength: 50 };
    expect(validateSlot(patternDef, "Hello").ok).toBe(true);
    expect(validateSlot(patternDef, "hello").ok).toBe(false);
  });
});

describe("validateSlot — url", () => {
  const def: UrlSlotDef = { name: "href", type: "url", prompt: "x", required: true };

  it("accepts http(s) URLs", () => {
    expect(validateSlot(def, "https://example.com").ok).toBe(true);
  });

  it("accepts relative paths", () => {
    expect(validateSlot(def, "/pricing").ok).toBe(true);
  });

  it("accepts anchor links", () => {
    expect(validateSlot(def, "#features").ok).toBe(true);
  });

  it("rejects javascript: URLs (treated as invalid)", () => {
    const r = validateSlot(def, "javascript:alert(1)");
    expect(r.ok).toBe(false);
    expect(r.corrected).toBe("#");
  });

  it("rejects external when internalOnly", () => {
    const internalDef: UrlSlotDef = { ...def, internalOnly: true };
    expect(validateSlot(internalDef, "https://evil.com").ok).toBe(false);
    expect(validateSlot(internalDef, "/about").ok).toBe(true);
  });
});

describe("validateSlot — icon", () => {
  const def: IconSlotDef = { name: "icon", type: "icon", prompt: "x" };

  it("accepts PascalCase names", () => {
    expect(validateSlot(def, "ArrowRight").ok).toBe(true);
    expect(validateSlot(def, "ChevronDown").ok).toBe(true);
  });

  it("rejects camelCase or kebab-case", () => {
    expect(validateSlot(def, "arrowRight").ok).toBe(false);
    expect(validateSlot(def, "arrow-right").ok).toBe(false);
  });

  it("falls back to default on invalid", () => {
    const r = validateSlot({ ...def, default: "Star" }, "bad icon");
    expect(r.corrected).toBe("Star");
  });
});

describe("validateSlot — enum", () => {
  const def: EnumSlotDef = { name: "tone", type: "enum", prompt: "x", values: ["formal", "casual", "playful"] };

  it("accepts allowed values", () => {
    expect(validateSlot(def, "casual").ok).toBe(true);
  });

  it("rejects + corrects to first allowed", () => {
    const r = validateSlot(def, "snarky");
    expect(r.ok).toBe(false);
    expect(r.corrected).toBe("formal");
  });
});

describe("validateSlot — number", () => {
  const def: NumberSlotDef = { name: "count", type: "number", prompt: "x", min: 1, max: 10, numberType: "integer" };

  it("accepts integers in range", () => {
    expect(validateSlot(def, 5).ok).toBe(true);
  });

  it("rounds non-integers", () => {
    const r = validateSlot(def, 3.7);
    expect(r.corrected).toBe(4);
  });

  it("clamps out-of-range values", () => {
    expect(validateSlot(def, 100).corrected).toBe(10);
    expect(validateSlot(def, 0).corrected).toBe(1);
  });

  it("coerces numeric strings", () => {
    const r = validateSlot(def, "5" as unknown as number);
    expect(r.ok).toBe(true);
    expect(r.corrected).toBe(5);
  });
});

describe("validateSlot — list", () => {
  const def: ListSlotDef = {
    name: "features",
    type: "list",
    prompt: "x",
    minItems: 2,
    maxItems: 4,
    itemSchema: [
      { name: "title", type: "text", prompt: "x", required: true, maxLength: 50 },
    ],
  };

  it("accepts arrays in range", () => {
    const r = validateSlot(def, [{ title: "a" }, { title: "b" }, { title: "c" }]);
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.corrected)).toBe(true);
    expect((r.corrected as unknown[]).length).toBe(3);
  });

  it("truncates over-long lists", () => {
    const items = [1, 2, 3, 4, 5, 6].map((i) => ({ title: `item${i}` }));
    const r = validateSlot(def, items);
    expect((r.corrected as unknown[]).length).toBe(4);
  });

  it("pads under-short lists by repeating the first item", () => {
    const r = validateSlot(def, [{ title: "only" }]);
    expect((r.corrected as unknown[]).length).toBe(2);
  });
});

describe("renderTemplate", () => {
  it("interpolates simple slots", () => {
    const out = renderTemplate("Hello {{slot.name}}!", { slots: { name: "Craig" }, warnings: [] });
    expect(out).toBe("Hello Craig!");
  });

  it("escapes JSX-hostile characters by default", () => {
    const out = renderTemplate("{{slot.x}}", { slots: { x: "<script>{}</script>" }, warnings: [] });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;");
    expect(out).toContain("&#123;");
  });

  it("respects the raw filter", () => {
    const out = renderTemplate("{{slot.html | raw}}", { slots: { html: "<em>hi</em>" }, warnings: [] });
    expect(out).toBe("<em>hi</em>");
  });

  it("expands #each blocks", () => {
    const tpl = "{{#each slot.items}}<li>{{item.name}}</li>{{/each}}";
    const out = renderTemplate(tpl, {
      slots: { items: [{ name: "a" }, { name: "b" }, { name: "c" }] },
      warnings: [],
    });
    expect(out).toBe("<li>a</li><li>b</li><li>c</li>");
  });

  it("expands #if blocks (truthy)", () => {
    const out = renderTemplate("{{#if slot.show}}yes{{/if}}", { slots: { show: true }, warnings: [] });
    expect(out).toBe("yes");
  });

  it("skips #if blocks (falsy)", () => {
    const out = renderTemplate("{{#if slot.show}}yes{{/if}}", { slots: { show: false }, warnings: [] });
    expect(out).toBe("");
  });

  it("logs warnings for unresolved tags", () => {
    const warnings: string[] = [];
    renderTemplate("{{slot.missing}}", { slots: {}, warnings });
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe("assembleComponent — hero-spotlight end-to-end", () => {
  it("assembles a valid React file with the example fill", () => {
    const result = assembleComponent({
      template: HERO_SPOTLIGHT_TEMPLATE,
      schema: HERO_SPOTLIGHT_SCHEMA,
      slots: HERO_SPOTLIGHT_EXAMPLE,
    });
    expect(result.ok).toBe(true);
    expect(result.code).toContain("export default function HeroSpotlight");
    expect(result.code).toContain("AI PLATFORM");
    expect(result.code).toContain("500+");
    expect(result.code).toContain("import { ArrowRight }");
  });

  it("omits metrics block when showMetrics is false", () => {
    const result = assembleComponent({
      template: HERO_SPOTLIGHT_TEMPLATE,
      schema: HERO_SPOTLIGHT_SCHEMA,
      slots: { ...HERO_SPOTLIGHT_EXAMPLE, showMetrics: false },
    });
    expect(result.ok).toBe(true);
    expect(result.code).not.toContain("tabular-nums");
  });

  it("falls back to defaults when slots are missing", () => {
    const result = assembleComponent({
      template: HERO_SPOTLIGHT_TEMPLATE,
      schema: HERO_SPOTLIGHT_SCHEMA,
      slots: {
        eyebrow: "STARTUP",
        headline: "Hello",
        subhead: "World",
        primaryCtaHref: "/signup",
        showMetrics: false,
        metrics: HERO_SPOTLIGHT_EXAMPLE.metrics,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.filledFromDefault).toContain("primaryCtaLabel");
    expect(result.filledFromDefault).toContain("secondaryCtaLabel");
  });

  it("hard-fails on missing required slot with no default", () => {
    const result = assembleComponent({
      template: HERO_SPOTLIGHT_TEMPLATE,
      schema: HERO_SPOTLIGHT_SCHEMA,
      slots: {} as Record<string, never>,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/required slot/);
  });

  it("truncates over-long headline with ellipsis and warns", () => {
    const overlong = "A".repeat(200);
    const result = assembleComponent({
      template: HERO_SPOTLIGHT_TEMPLATE,
      schema: HERO_SPOTLIGHT_SCHEMA,
      slots: { ...HERO_SPOTLIGHT_EXAMPLE, headline: overlong },
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("headline"))).toBe(true);
  });
});

describe("schemaToPrompt — hero-spotlight", () => {
  it("produces a prompt the AI can consume", () => {
    const prompt = schemaToPrompt(HERO_SPOTLIGHT_SCHEMA, "Brand: Acme. Industry: SaaS analytics for small-business owners.");
    expect(prompt).toContain("eyebrow");
    expect(prompt).toContain("headline");
    expect(prompt).toContain("metrics");
    expect(prompt).toContain("REQUIRED");
    expect(prompt).toContain("max length 90");
    expect(prompt).toContain("array, 3-3 items");
  });
});
