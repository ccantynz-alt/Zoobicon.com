/**
 * Render smoke tests — "does it actually render?" (B-quality guardrail).
 *
 * The existing slot-locked-templates smoke test proves a template
 * ASSEMBLES (slots fill, no leftover {{tags}}). It does NOT prove the
 * assembled component actually RENDERS, or that list content survived —
 * which is exactly how the {{item.x}}-renders-empty bug slipped through
 * for so long (empty != leftover-tag).
 *
 * This test closes that gap: every slot template is assembled with its
 * example fill, transpiled with the TypeScript compiler, evaluated, and
 * rendered to static HTML with react-dom/server. We assert:
 *   1. it renders without throwing (catches runtime render crashes —
 *      undefined.map, bad hook usage, etc — that no typecheck catches);
 *   2. the output is non-trivial (catches a component that renders to
 *      nothing);
 *   3. every text value from a LIST slot appears in the output (the
 *      direct regression guard for the empty-list bug — if {{item.x}}
 *      ever stops interpolating again, these assertions fail loudly).
 */

import { describe, it, expect } from "vitest";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import * as framer from "framer-motion";

import { assembleComponent } from "../src/lib/slot-locked/assembler";
import type { ComponentSchema, SlotValueMap, ListSlotDef } from "../src/lib/slot-locked/types";

import { HERO_SPOTLIGHT_SCHEMA, HERO_SPOTLIGHT_TEMPLATE, HERO_SPOTLIGHT_EXAMPLE } from "../src/lib/slot-locked/templates/hero-spotlight";
import { NAVBAR_MINIMAL_SCHEMA, NAVBAR_MINIMAL_TEMPLATE, NAVBAR_MINIMAL_EXAMPLE } from "../src/lib/slot-locked/templates/navbar-minimal";
import { FEATURES_BENTO_SCHEMA, FEATURES_BENTO_TEMPLATE, FEATURES_BENTO_EXAMPLE } from "../src/lib/slot-locked/templates/features-bento";
import { PRICING_TIERS_SCHEMA, PRICING_TIERS_TEMPLATE, PRICING_TIERS_EXAMPLE } from "../src/lib/slot-locked/templates/pricing-tiers";
import { FOOTER_EDITORIAL_SCHEMA, FOOTER_EDITORIAL_TEMPLATE, FOOTER_EDITORIAL_EXAMPLE } from "../src/lib/slot-locked/templates/footer-editorial";
import { STATS_STRIP_SCHEMA, STATS_STRIP_TEMPLATE, STATS_STRIP_EXAMPLE } from "../src/lib/slot-locked/templates/stats-strip";
import { TESTIMONIALS_QUOTES_SCHEMA, TESTIMONIALS_QUOTES_TEMPLATE, TESTIMONIALS_QUOTES_EXAMPLE } from "../src/lib/slot-locked/templates/testimonials-quotes";
import { CTA_BANNER_SCHEMA, CTA_BANNER_TEMPLATE, CTA_BANNER_EXAMPLE } from "../src/lib/slot-locked/templates/cta-banner";
import { FAQ_ACCORDION_SCHEMA, FAQ_ACCORDION_TEMPLATE, FAQ_ACCORDION_EXAMPLE } from "../src/lib/slot-locked/templates/faq-accordion";

// Transpile a TSX component string and evaluate it into a React component.
// Uses the TypeScript compiler (jsx: classic → React.createElement) and a
// require shim that resolves the packages the preview importmap provides.
function evalComponent(tsx: string): React.ComponentType {
  const js = ts.transpileModule(tsx, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    reportDiagnostics: false,
  }).outputText;

  const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
  const requireShim = (id: string): unknown => {
    if (id === "react") return React;
    if (id === "react/jsx-runtime" || id === "react/jsx-dev-runtime") return require("react/jsx-runtime");
    if (id === "lucide-react") return lucide;
    if (id === "framer-motion") return framer;
    // Sibling components / styles / unknown packages aren't needed to
    // render a single component in isolation — stub them.
    return {};
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("require", "module", "exports", js);
  fn(requireShim, moduleObj, moduleObj.exports);
  const Comp = moduleObj.exports.default as React.ComponentType | undefined;
  if (typeof Comp !== "function") {
    throw new Error("component has no default function export");
  }
  return Comp;
}

// Collect the visible text values from a schema's LIST slots in an example
// fill. Skips icon + url fields (those become SVGs / attributes, not text).
// A "safe slice" (longest run of plain chars) is used so HTML-escaping of
// quotes/apostrophes doesn't cause false negatives.
function listTextSnippets(schema: ComponentSchema, example: SlotValueMap): string[] {
  const out: string[] = [];
  for (const def of schema.slots) {
    if (def.type !== "list") continue;
    const items = example[def.name];
    if (!Array.isArray(items)) continue;
    for (const item of items as SlotValueMap[]) {
      for (const itemDef of (def as ListSlotDef).itemSchema) {
        if (itemDef.type === "icon" || itemDef.type === "url") continue;
        const v = item[itemDef.name];
        if (typeof v !== "string") continue;
        const safe = (v.match(/[A-Za-z0-9][A-Za-z0-9 ]{7,}/) || [])[0];
        if (safe) out.push(safe.trim().slice(0, 16));
      }
    }
  }
  return out;
}

const REGISTRY = [
  { name: "hero-spotlight", schema: HERO_SPOTLIGHT_SCHEMA, template: HERO_SPOTLIGHT_TEMPLATE, example: HERO_SPOTLIGHT_EXAMPLE },
  { name: "navbar-minimal", schema: NAVBAR_MINIMAL_SCHEMA, template: NAVBAR_MINIMAL_TEMPLATE, example: NAVBAR_MINIMAL_EXAMPLE },
  { name: "features-bento", schema: FEATURES_BENTO_SCHEMA, template: FEATURES_BENTO_TEMPLATE, example: FEATURES_BENTO_EXAMPLE },
  { name: "pricing-tiers", schema: PRICING_TIERS_SCHEMA, template: PRICING_TIERS_TEMPLATE, example: PRICING_TIERS_EXAMPLE },
  { name: "footer-editorial", schema: FOOTER_EDITORIAL_SCHEMA, template: FOOTER_EDITORIAL_TEMPLATE, example: FOOTER_EDITORIAL_EXAMPLE },
  { name: "stats-strip", schema: STATS_STRIP_SCHEMA, template: STATS_STRIP_TEMPLATE, example: STATS_STRIP_EXAMPLE },
  { name: "testimonials-quotes", schema: TESTIMONIALS_QUOTES_SCHEMA, template: TESTIMONIALS_QUOTES_TEMPLATE, example: TESTIMONIALS_QUOTES_EXAMPLE },
  { name: "cta-banner", schema: CTA_BANNER_SCHEMA, template: CTA_BANNER_TEMPLATE, example: CTA_BANNER_EXAMPLE },
  { name: "faq-accordion", schema: FAQ_ACCORDION_SCHEMA, template: FAQ_ACCORDION_TEMPLATE, example: FAQ_ACCORDION_EXAMPLE },
];

describe("slot-locked render smoke tests", () => {
  for (const entry of REGISTRY) {
    describe(entry.name, () => {
      const assembled = assembleComponent({
        template: entry.template,
        schema: entry.schema,
        slots: entry.example,
      });

      it("assembles + renders to non-trivial HTML without throwing", () => {
        expect(assembled.ok).toBe(true);
        expect(assembled.code).toBeTruthy();
        const html = renderToStaticMarkup(React.createElement(evalComponent(assembled.code!)));
        expect(html.length).toBeGreaterThan(150);
      });

      it("renders all list content (guards the empty-list regression)", () => {
        const snippets = listTextSnippets(entry.schema, entry.example);
        if (snippets.length === 0) return; // no list slots — nothing to guard
        const html = renderToStaticMarkup(React.createElement(evalComponent(assembled.code!)));
        for (const snippet of snippets) {
          expect(html, `list text "${snippet}" should appear in rendered output`).toContain(snippet);
        }
      });
    });
  }
});
