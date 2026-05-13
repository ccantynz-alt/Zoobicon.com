/**
 * Smoke tests for the slot-locked component registry.
 *
 * Each registered template must assemble successfully against its
 * canned EXAMPLE data and produce valid-looking React (default export,
 * non-empty, no unresolved {{tags}} left behind).
 *
 * These tests run on every CI build to catch regressions in the
 * assembler OR the templates OR the schemas.
 */

import { describe, it, expect } from "vitest";
import { assembleComponent } from "../src/lib/slot-locked/assembler";

import {
  HERO_SPOTLIGHT_SCHEMA, HERO_SPOTLIGHT_TEMPLATE, HERO_SPOTLIGHT_EXAMPLE,
} from "../src/lib/slot-locked/templates/hero-spotlight";
import {
  NAVBAR_MINIMAL_SCHEMA, NAVBAR_MINIMAL_TEMPLATE, NAVBAR_MINIMAL_EXAMPLE,
} from "../src/lib/slot-locked/templates/navbar-minimal";
import {
  FEATURES_BENTO_SCHEMA, FEATURES_BENTO_TEMPLATE, FEATURES_BENTO_EXAMPLE,
} from "../src/lib/slot-locked/templates/features-bento";
import {
  PRICING_TIERS_SCHEMA, PRICING_TIERS_TEMPLATE, PRICING_TIERS_EXAMPLE,
} from "../src/lib/slot-locked/templates/pricing-tiers";
import {
  FOOTER_EDITORIAL_SCHEMA, FOOTER_EDITORIAL_TEMPLATE, FOOTER_EDITORIAL_EXAMPLE,
} from "../src/lib/slot-locked/templates/footer-editorial";

const REGISTRY = [
  { name: "hero-spotlight",   schema: HERO_SPOTLIGHT_SCHEMA,   template: HERO_SPOTLIGHT_TEMPLATE,   example: HERO_SPOTLIGHT_EXAMPLE   },
  { name: "navbar-minimal",   schema: NAVBAR_MINIMAL_SCHEMA,   template: NAVBAR_MINIMAL_TEMPLATE,   example: NAVBAR_MINIMAL_EXAMPLE   },
  { name: "features-bento",   schema: FEATURES_BENTO_SCHEMA,   template: FEATURES_BENTO_TEMPLATE,   example: FEATURES_BENTO_EXAMPLE   },
  { name: "pricing-tiers",    schema: PRICING_TIERS_SCHEMA,    template: PRICING_TIERS_TEMPLATE,    example: PRICING_TIERS_EXAMPLE    },
  { name: "footer-editorial", schema: FOOTER_EDITORIAL_SCHEMA, template: FOOTER_EDITORIAL_TEMPLATE, example: FOOTER_EDITORIAL_EXAMPLE },
];

describe("slot-locked registry — smoke tests", () => {
  for (const entry of REGISTRY) {
    describe(entry.name, () => {
      it("assembles successfully against its example data", () => {
        const result = assembleComponent({
          template: entry.template,
          schema: entry.schema,
          slots: entry.example,
        });
        if (!result.ok) {
          // Include the reason in the failure message for debuggability.
          throw new Error(`${entry.name} assembly failed: ${result.reason}`);
        }
        expect(result.ok).toBe(true);
        expect(result.code).toBeTruthy();
      });

      it("produces a React file with a default export", () => {
        const { code } = assembleComponent({
          template: entry.template,
          schema: entry.schema,
          slots: entry.example,
        });
        expect(code).toContain("export default function");
      });

      it("leaves no unresolved {{slot.X}} tokens", () => {
        const { code } = assembleComponent({
          template: entry.template,
          schema: entry.schema,
          slots: entry.example,
        });
        expect(code).toBeTruthy();
        // {{slot.x}}, {{#each}}, {{/each}}, {{#if}}, {{/if}}, {{item.x}}
        expect(code).not.toMatch(/\{\{[#/]?(slot|item|each|if)/);
      });

      it("has unique slot names within the schema", () => {
        const names = entry.schema.slots.map((s) => s.name);
        expect(new Set(names).size).toBe(names.length);
      });
    });
  }
});
