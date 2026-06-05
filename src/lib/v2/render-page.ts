/**
 * V2 server-side page renderer — the reliability core of Builder V2.
 *
 * The V1 builder asked the user's browser to transpile (Babel), hash
 * (crypto.subtle), and module-load (blob URLs) the generated site. On iPad
 * WebKit that chain breaks constantly ("Preview failed", "Load failed",
 * blank previews). V2 inverts it: the SERVER assembles the slot-locked
 * page, renders it to static HTML with react-dom/server, and the browser
 * just displays that HTML in an iframe. The client does zero code
 * execution of generated output — so it works identically on every device.
 *
 * Generation is deterministic (slot-locked templates can't emit broken
 * code). AI only fills text/values into the templates; if no LLM key is
 * configured, the canned example fills produce a complete, polished page —
 * so the preview is NEVER blank.
 */

import ts from "typescript";
import React from "react";
import * as lucide from "lucide-react";
import * as framer from "framer-motion";

// react-dom/server is loaded dynamically (below) rather than as a static
// import: Next.js's compiler rejects a static `react-dom/server` import in
// a module it can't prove is server-only. This module only ever runs in
// the nodejs route handler, so a lazy import is safe and silences the guard.
let _renderToStaticMarkup: ((el: React.ReactElement) => string) | null = null;
async function getRenderToStaticMarkup() {
  if (!_renderToStaticMarkup) {
    const mod = await import("react-dom/server");
    _renderToStaticMarkup = mod.renderToStaticMarkup;
  }
  return _renderToStaticMarkup;
}

import { SLOT_REGISTRY } from "@/lib/slot-locked/registry";
import { assembleComponent } from "@/lib/slot-locked/assembler";
import { planPageForIndustry } from "@/lib/slot-locked/industry-planner";
import { schemaToPrompt } from "@/lib/slot-locked/assembler";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateEditJson } from "@/lib/llm-output-validator";
import type { SlotValueMap } from "@/lib/slot-locked/types";

export interface RenderedPage {
  html: string;
  componentIds: string[];
  industry: string;
  theme: string;
  aiUsed: boolean;
}

// Transpile a TSX component string and render it to static HTML. Runs
// entirely on the server (Node runtime). Mirrors the proven approach in
// the render smoke tests.
async function renderComponentToHtml(tsx: string): Promise<string> {
  const renderToStaticMarkup = await getRenderToStaticMarkup();
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
    return {};
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function("require", "module", "exports", js)(requireShim, moduleObj, moduleObj.exports);
  const Comp = moduleObj.exports.default as React.ComponentType | undefined;
  if (typeof Comp !== "function") throw new Error("component has no default export");
  return renderToStaticMarkup(React.createElement(Comp));
}

// Lightweight industry/theme heuristics so we don't need an LLM round-trip
// just to plan the page. (The AI still customises the copy below.)
function detectIndustry(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/\b(restaurant|cafe|bakery|menu|dining|bistro|coffee)\b/.test(p)) return "restaurant";
  if (/\b(portfolio|photographer|designer|artist|creative)\b/.test(p)) return "portfolio";
  if (/\b(saas|software|platform|api|dashboard|app|startup)\b/.test(p)) return "saas";
  if (/\b(agency|studio|consultanc|marketing)\b/.test(p)) return "agency";
  if (/\b(shop|store|ecommerce|product|boutique)\b/.test(p)) return "ecommerce";
  if (/\b(law|legal|attorney|firm|accountant|finance)\b/.test(p)) return "professional";
  if (/\b(gym|fitness|trainer|yoga|wellness)\b/.test(p)) return "fitness";
  return "other";
}

function detectTheme(prompt: string): "editorial" | "warm" | "light" {
  const p = prompt.toLowerCase();
  if (/\b(restaurant|cafe|bakery|warm|cozy|rustic|artisan)\b/.test(p)) return "warm";
  return "editorial";
}

// AI-fill one component's slots. Best-effort: any failure returns the
// canned example so the page is never blank or broken.
async function fillSlots(
  entry: typeof SLOT_REGISTRY[string],
  prompt: string,
  brandName: string,
): Promise<{ slots: SlotValueMap; aiUsed: boolean }> {
  try {
    const aiPrompt = schemaToPrompt(entry.schema, `Brand: ${brandName || "(none)"}. User prompt: ${prompt}`);
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system:
        "You are filling in the slots of a hand-written React component template. " +
        "Output ONLY a valid JSON object matching the schema. No prose, no markdown fences.",
      userMessage: aiPrompt,
      maxTokens: 2000,
    });
    const validation = validateEditJson(fb.text);
    if (!validation.ok) return { slots: entry.example, aiUsed: false };
    const start = fb.text.indexOf("{");
    const end = fb.text.lastIndexOf("}");
    if (start === -1 || end === -1) return { slots: entry.example, aiUsed: false };
    return { slots: JSON.parse(fb.text.slice(start, end + 1)) as SlotValueMap, aiUsed: true };
  } catch {
    return { slots: entry.example, aiUsed: false };
  }
}

/**
 * Build + render a complete slot-locked page to static HTML on the server.
 *
 * @param opts.useExampleFill - skip the LLM and assemble from canned
 *   examples (fast, deterministic; used for previews/tests/no-key envs).
 */
export async function renderSlotPage(opts: {
  prompt: string;
  brandName?: string;
  industry?: string;
  theme?: string;
  useExampleFill?: boolean;
}): Promise<RenderedPage> {
  const industry = opts.industry || detectIndustry(opts.prompt);
  const theme = opts.theme || detectTheme(opts.prompt);
  const brandName = (opts.brandName || "").trim();

  const componentIds = planPageForIndustry({ industry, theme }).filter((id) => SLOT_REGISTRY[id]);

  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
  const doAi = !opts.useExampleFill && hasKey;

  let aiUsed = false;
  const sections: string[] = [];

  // Fill all components in parallel (independent), then assemble + render
  // each in order. Parallel fill keeps wall-clock to the slowest call.
  const fills = await Promise.all(
    componentIds.map(async (id) => {
      const entry = SLOT_REGISTRY[id];
      if (doAi) {
        const r = await fillSlots(entry, opts.prompt, brandName);
        if (r.aiUsed) aiUsed = true;
        return { id, slots: r.slots };
      }
      return { id, slots: entry.example };
    }),
  );

  for (const { id, slots } of fills) {
    const entry = SLOT_REGISTRY[id];
    const asm = assembleComponent({ template: entry.template, schema: entry.schema, slots });
    const code = asm.ok && asm.code ? asm.code : assembleComponent({ template: entry.template, schema: entry.schema, slots: entry.example }).code;
    if (!code) continue;
    try {
      sections.push(await renderComponentToHtml(code));
    } catch {
      // A single section failing to render never blanks the page.
      continue;
    }
  }

  return {
    html: pageShell(sections.join("\n"), brandName),
    componentIds,
    industry,
    theme,
    aiUsed,
  };
}

// The iframe document. Editorial-light design tokens inline; Tailwind via
// CDN (a single reliable stylesheet generator — the ONLY script in the
// iframe, and not our generated code). Playfair + Inter for the editorial,
// non-cyberpunk look.
function pageShell(body: string, brandName: string): string {
  const title = brandName ? `${escapeHtml(brandName)} — built with Zoobicon` : "Zoobicon preview";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300..900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --paper:#ffffff; --paper-elevated:#fcfaf3; --paper-bright:#fefdf7;
      --ink:#1a1a1c; --ink-secondary:#2a2a30; --ink-muted:#76767e;
      --rule:#ebe7d6; --rule-strong:#a8a392;
      --gold:#b8923f; --gold-soft:rgba(184,146,63,0.14); --gold-deep:#8c6b25;
    }
    html,body{margin:0;background:var(--paper);color:var(--ink);
      font-family:"Inter",system-ui,-apple-system,sans-serif;
      -webkit-font-smoothing:antialiased;}
    *{box-sizing:border-box;}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}
