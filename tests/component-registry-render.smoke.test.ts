/**
 * Component-registry render smoke test — extends the "does it render?"
 * guarantee to the DEFAULT build path.
 *
 * The slot-locked render smoke test covers the 9 slot templates. But most
 * builds go through react-stream, which assembles from the 118-component
 * registry. Those components ship as complete TSX `code` strings; the
 * pipeline prepends `import React from "react"` and renders them in the
 * preview. If any registry component has a syntax error or throws at
 * render (bare hook, undefined.map, browser API touched during render),
 * the preview breaks for whatever build selected it.
 *
 * This renders EVERY registry component exactly as production does
 * (prepend React import → transpile → render to static HTML) so a broken
 * component can't reach users. Browser-only APIs that well-written
 * components only touch inside effects are polyfilled so we fail on REAL
 * render errors, not jsdom gaps.
 */

import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import * as framer from "framer-motion";
import { REGISTRY, ensureRegistryLoaded } from "../src/lib/component-registry";
// The registry's ensureRegistryLoaded() uses CommonJS require() for lazy
// loading, which doesn't run under vitest's ESM transform. Import the
// category files directly so their registerComponent() side effects
// populate REGISTRY.
import "../src/lib/component-registry/navbars";
import "../src/lib/component-registry/heroes";
import "../src/lib/component-registry/features";
import "../src/lib/component-registry/testimonials";
import "../src/lib/component-registry/footers";
import "../src/lib/component-registry/extras";
import "../src/lib/component-registry/sections";

function evalComponentTsx(code: string): React.ComponentType {
  // Mirror the pipeline: component `code` doesn't import React; the
  // assembler prepends it (see buildAppFile in component-registry/index.ts).
  const src = `import React from "react";\n\n${code}\n`;
  const js = ts.transpileModule(src, {
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
    return {};
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function("require", "module", "exports", js)(requireShim, moduleObj, moduleObj.exports);
  const Comp = moduleObj.exports.default as React.ComponentType | undefined;
  if (typeof Comp !== "function") throw new Error("no default function export");
  return Comp;
}

beforeAll(() => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  const g = globalThis as Record<string, unknown>;
  g.IntersectionObserver = g.IntersectionObserver || (Observer as unknown);
  g.ResizeObserver = g.ResizeObserver || (Observer as unknown);
  if (typeof window !== "undefined" && !window.matchMedia) {
    // @ts-expect-error jsdom lacks matchMedia
    window.matchMedia = () => ({
      matches: false, media: "", onchange: null,
      addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {}, dispatchEvent() { return false; },
    });
  }
});

// Best-effort (no-op under vitest, but harmless); the static imports above
// are what actually populate REGISTRY.
ensureRegistryLoaded();

describe("component registry render smoke", () => {
  it("has a non-trivial registry loaded", () => {
    expect(REGISTRY.length).toBeGreaterThan(50);
  });

  for (const comp of REGISTRY) {
    it(`${comp.id} (${comp.category}) renders without throwing`, () => {
      const Comp = evalComponentTsx(comp.code);
      const html = renderToStaticMarkup(React.createElement(Comp));
      expect(html.length, `${comp.id} rendered empty`).toBeGreaterThan(20);
    });
  }
});
