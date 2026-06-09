/**
 * V2 conversational edit routing. routeEdit resolves an instruction to the
 * section it targets. The deterministic keyword/synonym path needs no LLM, so
 * these are fully offline and fast — they prove the common edits ("make the
 * hero darker", "update the pricing", "change the menu") land on the right
 * section without a model round-trip.
 */

import { describe, it, expect } from "vitest";
import { routeEdit, type EditSection } from "../src/lib/v2/edit-section";

const SECTIONS: EditSection[] = [
  { index: 0, category: "navbar", code: "" },
  { index: 1, category: "hero", code: "" },
  { index: 2, category: "features", code: "" },
  { index: 3, category: "pricing", code: "" },
  { index: 4, category: "footer", code: "" },
];

describe("routeEdit (deterministic, no LLM)", () => {
  it("routes an explicit category name to its section", async () => {
    expect(await routeEdit("update the pricing to three tiers", SECTIONS)).toBe(3);
    expect(await routeEdit("make the footer smaller", SECTIONS)).toBe(4);
  });

  it("routes via common synonyms", async () => {
    expect(await routeEdit("make the hero darker", SECTIONS)).toBe(1);
    expect(await routeEdit("change the menu links", SECTIONS)).toBe(0); // menu → navbar
    expect(await routeEdit("tweak the headline at the top of the page", SECTIONS)).toBe(1); // → hero
  });

  it("is case-insensitive", async () => {
    expect(await routeEdit("MAKE THE PRICING BOLD", SECTIONS)).toBe(3);
  });
});
