/**
 * AI whole-page site generation — Builder V2's quality engine.
 *
 * THE BREAKTHROUGH (2026-06-13). The previous engine stitched ~10 fixed
 * registry components together and only let the model rewrite their copy.
 * That capped every build at "the same 10 blocks in the same order, just
 * with different words" — which is exactly why Zoobicon's output looked
 * templated while Lovable / Bolt / v0 / Manus looked bespoke. Same models,
 * completely different leash.
 *
 * Here we hand the model the whole canvas: it DESIGNS and writes a complete,
 * bespoke website for the specific business — its own layout, palette, type
 * and motion. That design freedom is where the "$100K look" comes from.
 *
 * Reliability is preserved (and arguably improved) because the model returns
 * a FINISHED, self-contained HTML document (Tailwind via CDN + a little
 * vanilla JS) which the builder's iframe simply displays. Nothing is
 * transpiled, hashed, or module-loaded in the browser — the fragile V1 chain
 * that blanked previews for months is gone. A finished HTML page either
 * renders or it doesn't, and a strong model produces valid HTML extremely
 * reliably. If generation fails for ANY reason, the caller falls back to the
 * deterministic registry render, so the preview is never blank.
 *
 * Model: Opus 4.7 (Craig's call, 2026-06-13 — after the whole-page approach
 * proved Opus produces the bespoke "$100K" output his old slot-filling
 * pipeline never could). callLLMWithFailover automatically fails over to
 * Sonnet 4.6 and then other providers if Opus is unavailable, so a build can
 * never hard-fail on model availability. The quality comes from the approach
 * as much as the model.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";
import { streamClaude } from "@/lib/anthropic-cached";
import { finalizeAiHtml, normalizeAiLinks } from "@/lib/v2/post-process";

// Opus 4.8 — Craig's chosen generation model for the whole-page engine. We try
// Opus first, then automatically fall back to Sonnet 4.6 (still a real, bespoke
// AI design) — so a wrong or unavailable Opus ID can NEVER again silently drop
// a build to the old template engine. (Earlier the ID was the stale
// "claude-opus-4-7", which the live API rejected, so EVERY build fell through
// to the template path — exactly the "it still looks templated + slow" bug.)
const GENERATION_MODEL = "claude-opus-4-8";
const FALLBACK_MODEL = "claude-sonnet-4-6";
const GENERATION_MODELS = [GENERATION_MODEL, FALLBACK_MODEL];

// Big enough for a full premium landing page (the demo pages were ~18–20K
// output tokens) with headroom so the document is never truncated mid-tag.
const MAX_TOKENS = 32000;

const BUILD_SYSTEM = `You are a world-class brand and product designer who also writes flawless front-end code. You design and build complete, bespoke marketing websites that look like a top-tier design agency made them — $100K quality, in the league of Linear, Stripe, Vercel and Apple.

You will be given a description of a business. Design and build a COMPLETE single-page marketing website tailored specifically to that business.

OUTPUT FORMAT — follow exactly:
- Return ONE complete, self-contained HTML document and NOTHING else.
- Start with <!DOCTYPE html> and end with </html>.
- No markdown code fences. No explanation before or after. Output ONLY the HTML.

TECH (kept simple so it always renders in an iframe):
- Tailwind via <script src="https://cdn.tailwindcss.com"></script> in <head>.
- You MAY add an inline tailwind.config <script> to define a bespoke colour palette and font families.
- Google Fonts via <link>. Choose a confident, on-brand pairing (a strong display face + a clean body sans; use an elegant serif for warm/editorial/luxury brands).
- A little vanilla JS in a <script> at the END of <body> for: a WORKING mobile hamburger menu, any accordions/tabs, smooth-scroll on anchor links, and scroll-reveal + count-up animations via IntersectionObserver.
- Plain HTML + Tailwind utility classes + vanilla JS ONLY. No React, no JSX, no imports, no bundler, no build step.

DESIGN BAR (this is the entire point):
- BESPOKE, never templated. Invent a layout, colour palette and type system that fit THIS specific business. Never default Tailwind blue. Never generic placeholder vibes.
- Big, confident typography. Strong visual hierarchy. Generous, intentional spacing and rhythm.
- Rich, varied sections — choose what genuinely suits the business, e.g.: a sticky/translucent nav (with working mobile menu), a striking hero with a real visual, a social-proof / logo strip, feature sections (bento grids or alternating image+text with inline SVG icons — NOT boring identical 3-column lists), a how-it-works / process section, animated count-up stats, testimonials with avatars, pricing tiers (only if relevant), a working FAQ accordion, a bold final CTA band, and a rich multi-column footer.
- Tasteful motion only: scroll-reveal (fade / slide up), smooth hover transitions, smooth scrolling. Elegant and restrained — never gaudy, never "cyberpunk", never neon-on-black unless the brand truly calls for it.
- Use real imagery from https://images.unsplash.com (pick photo URLs suited to the business) and avatars from https://randomuser.me/api/portraits/. Always include alt text.
- Copy must be specific, confident and on-brand for the business — never "Acme", never lorem ipsum. Invent a fitting brand name if none is given.
- Fully responsive (mobile-first) and accessible (semantic HTML, good contrast, labelled controls).

Make it genuinely impressive. Sweat the spacing, hierarchy, colour and micro-interactions. The finished page is the only thing the owner will judge.`;

const EDIT_SYSTEM = `You are editing a complete, self-contained HTML website. You will be given the full HTML document and an instruction describing a change the owner wants.

Apply the requested change — and only that change — then return the COMPLETE updated HTML document.

OUTPUT FORMAT — follow exactly:
- Start with <!DOCTYPE html>, end with </html>. No markdown fences, no commentary. Output ONLY the HTML.

Rules:
- Make the change the user asked for. Keep everything else exactly as it is — structure, other sections, scripts, and any styling that wasn't mentioned.
- Keep it a single self-contained document: Tailwind via the CDN, Google Fonts, vanilla JS only. No React, no imports, no build step.
- Keep the result polished, responsive, accessible and on-brand.`;

export interface AiSiteResult {
  ok: true;
  html: string;
  model: string;
}
export interface AiSiteFail {
  ok: false;
  reason: string;
}

// Pull a clean HTML document out of the model's reply, tolerating stray
// markdown fences or a sentence of preamble despite the instructions.
function extractHtmlDoc(raw: string): string {
  let s = (raw || "").trim();
  s = s.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  const lower = s.toLowerCase();
  let start = lower.indexOf("<!doctype");
  if (start === -1) start = lower.indexOf("<html");
  if (start > 0) s = s.slice(start);
  const end = s.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) s = s.slice(0, end + "</html>".length);
  return s.trim();
}

// Guard against truncated / empty / non-document output. A complete page has
// both the html and body wrappers and real heft.
function looksLikeCompletePage(html: string): boolean {
  if (html.length < 1500) return false;
  const l = html.toLowerCase();
  return l.includes("<html") && l.includes("</html>") && l.includes("<body") && l.includes("</body>");
}

// Try each generation model (Opus → Sonnet) until one returns a complete HTML
// document. callLLMWithFailover handles cross-provider failover, but it RETHROWS
// non-transient errors (e.g. a rejected/stale model ID) without trying anything
// else — so this loop is what guarantees a bad Opus ID falls to Sonnet (a real
// AI design) instead of bubbling up and dropping the build to the template
// engine. `accept` is an optional extra gate (used by the review pass).
async function callForHtml(
  system: string,
  userMessage: string,
  accept?: (html: string) => boolean,
): Promise<{ html: string; model: string } | null> {
  for (const model of GENERATION_MODELS) {
    try {
      const res = await callLLMWithFailover({ model, system, userMessage, maxTokens: MAX_TOKENS });
      const html = extractHtmlDoc(res.text || "");
      if (looksLikeCompletePage(html) && (!accept || accept(html))) {
        return { html, model: res.model || model };
      }
    } catch {
      // try the next model
    }
  }
  return null;
}

/**
 * Design + build a complete bespoke website for the prompt. Never throws —
 * returns { ok:false } on any failure so the caller can fall back.
 */
export async function generateAiSite(opts: {
  prompt: string;
  brandName?: string;
}): Promise<AiSiteResult | AiSiteFail> {
  const prompt = (opts.prompt || "").trim();
  if (!prompt) return { ok: false, reason: "empty prompt" };

  const userMessage =
    `Business to build a website for:\n\n${prompt}` +
    (opts.brandName ? `\n\nBrand name: ${opts.brandName}` : "") +
    `\n\nDesign and build the complete website now. Output only the HTML document.`;

  const r = await callForHtml(BUILD_SYSTEM, userMessage);
  return r
    ? { ok: true, html: finalizeAiHtml(r.html, prompt), model: r.model }
    : { ok: false, reason: "no model returned a complete HTML document" };
}

/**
 * Apply a natural-language edit to an AI-built page and return the full
 * updated document. Never throws.
 */
export async function editAiSite(opts: {
  html: string;
  instruction: string;
}): Promise<AiSiteResult | AiSiteFail> {
  const html = (opts.html || "").trim();
  const instruction = (opts.instruction || "").trim();
  if (!html) return { ok: false, reason: "no page to edit" };
  if (!instruction) return { ok: false, reason: "no instruction" };

  const r = await callForHtml(
    EDIT_SYSTEM,
    `Instruction: ${instruction}\n\nCurrent HTML document:\n\n${html}`,
  );
  return r
    ? { ok: true, html: normalizeAiLinks(r.html), model: r.model }
    : { ok: false, reason: "edit did not return a complete document" };
}

// ───────────────────────────────────────────────────────────────────────
// STREAMING GENERATION — the same whole-page engine, but yields the page as
// the model writes it. Two speed wins at once:
//   • Perceived speed: the builder shows the site being written live instead
//     of a 60–120s spinner.
//   • Real speed + cost: streamClaude auto-applies prompt caching to any
//     system prompt over ~1024 tokens (BUILD_SYSTEM is well over), so repeat
//     builds/edits within the cache window pay a fraction of the input cost
//     and start faster.
// streamClaude talks to Anthropic directly (no cross-provider failover), so
// the SSE route falls back to the non-streaming generateAiSite() — which DOES
// fail over — and then to the registry render, keeping "never blank" intact.
// ───────────────────────────────────────────────────────────────────────

export type AiStreamEvent =
  | { type: "delta"; text: string }
  | { type: "result"; html: string; model: string }
  | { type: "error"; reason: string };

export async function* streamAiSite(opts: {
  prompt: string;
  brandName?: string;
}): AsyncGenerator<AiStreamEvent, void, unknown> {
  const prompt = (opts.prompt || "").trim();
  if (!prompt) {
    yield { type: "error", reason: "empty prompt" };
    return;
  }
  const userMessage =
    `Business to build a website for:\n\n${prompt}` +
    (opts.brandName ? `\n\nBrand name: ${opts.brandName}` : "") +
    `\n\nDesign and build the complete website now. Output only the HTML document.`;

  // Try Opus first, then Sonnet. If a stream errors after a COMPLETE document
  // already arrived (e.g. the timeout fires at the tail), we still use it; only
  // an incomplete result falls through to the next model. This guarantees a
  // real AI design even if Opus is rejected/slow — never a template drop.
  for (const model of GENERATION_MODELS) {
    let full = "";
    try {
      for await (const d of streamClaude({
        model,
        system: BUILD_SYSTEM, // > 1024 tokens ⇒ auto-cached by anthropic-cached
        messages: [{ role: "user", content: userMessage }],
        maxTokens: MAX_TOKENS,
        temperature: 0.7,
        timeoutMs: 280_000, // real runway for Opus (the SSE route's maxDuration is 300s)
      })) {
        if (d.type === "text" && d.text) {
          full += d.text;
          yield { type: "delta", text: d.text };
        }
        // A stray per-chunk parse error is non-fatal — keep accumulating.
      }
    } catch {
      // Stream errored — a complete doc may still have arrived first (checked
      // next). Otherwise fall through to the next model.
    }
    const html = extractHtmlDoc(full);
    if (looksLikeCompletePage(html)) {
      yield { type: "result", html, model };
      return;
    }
  }
  yield { type: "error", reason: "no model returned a complete HTML document" };
}

// ───────────────────────────────────────────────────────────────────────
// SELF-REVIEW & AUTO-FIX (move #2) — the "intelligence" pass.
//
// After a page is built, a senior-design-director pass critiques the model's
// OWN output against a $100K bar and returns an improved version. This is a
// reflexion loop on the code (no headless browser needed): asking a strong
// model to find and fix its own weak spots reliably lifts quality. The client
// runs this in the BACKGROUND after first paint and hot-swaps the result, so
// it costs the user no wait. A regression guard means it can only ever improve
// the page, never gut it — if anything looks off, the original is kept.
// ───────────────────────────────────────────────────────────────────────

const REVIEW_SYSTEM = `You are a brutally honest senior design director doing the final review of a finished marketing website before it ships to a paying client. You will receive the complete HTML document.

Silently judge it against this bar (do NOT output your critique):
- Distinctive, on-brand hero that fits THIS specific business — never generic
- Specific, confident copy — no placeholder / lorem / "Acme"; real value props
- Strong typographic hierarchy; generous, intentional spacing and rhythm
- Section variety (not repetitive identical blocks)
- Tasteful, intentional colour; good contrast (WCAG AA)
- Imagery that genuinely suits the business
- Truly responsive (mobile-first); a working mobile menu
- Clear CTAs; accessible, semantic markup
- The overall "$100K design agency" feeling

Then return an IMPROVED, complete HTML document that fixes the weakest points and elevates it to that bar.

Rules:
- KEEP everything already strong. Do NOT remove sections or strip content — only improve. The result must be the same page, better.
- Keep it a single self-contained document: Tailwind via the CDN, Google Fonts, vanilla JS only. No React, no imports, no build step.
- Start with <!DOCTYPE html>, end with </html>. Output ONLY the HTML — no commentary, no markdown fences.`;

// Specialist critics run in PARALLEL over the finished page, each an expert at
// one thing, producing concrete notes. A single fixer then applies them all.
// This is the "spawn more, specialized" quality lever — far sharper than one
// generalist "make it better" pass. Critics use a fast model (small analysis
// output); the fixer uses the premium chain (callForHtml: Opus → Sonnet).
const CRITIC_MODEL = "claude-sonnet-4-6";

const CRITICS: Array<{ role: string; system: string }> = [
  {
    role: "design",
    system:
      "You are a senior design director. Review this finished marketing website's HTML and list up to 5 SPECIFIC, concrete problems holding it back from $100K-agency quality — weak typographic hierarchy, timid spacing, a generic hero, bland or low-effort colour use, repetitive sections, poor imagery choices. Bullet points only, each one actionable. No prose, no praise.",
  },
  {
    role: "accessibility",
    system:
      "You are an accessibility & UX auditor. Review this website's HTML and list up to 5 SPECIFIC issues: low contrast (name the offending colours), missing alt text, tiny tap targets, unlabelled controls, poor mobile layout, missing focus states. Bullet points only, each one actionable. No prose.",
  },
  {
    role: "copy",
    system:
      "You are a sharp brand copywriter. Review this website's copy and list up to 5 SPECIFIC weaknesses: vague headlines, generic/placeholder phrases, weak CTAs, missing value propositions, jargon. Quote the offending text and give a punchier rewrite for each. Bullet points only. No prose.",
  },
];

async function runCritics(html: string): Promise<string> {
  const results = await Promise.all(
    CRITICS.map(async (c) => {
      try {
        const res = await callLLMWithFailover({
          model: CRITIC_MODEL,
          system: c.system,
          userMessage: `HTML to review:\n\n${html}`,
          maxTokens: 700,
        });
        const t = (res.text || "").trim();
        return t ? `### ${c.role} critique\n${t}` : "";
      } catch {
        return "";
      }
    }),
  );
  return results.filter(Boolean).join("\n\n");
}

const FIXER_SYSTEM = `You are a senior design director and front-end engineer. You will receive a finished marketing website (complete HTML) and a list of SPECIFIC critiques from your design, accessibility and copy reviewers. Apply every fix you reasonably can, elevating the page to $100K-agency quality.

Rules:
- KEEP everything already strong. Do NOT remove sections or strip content — only improve. Same page, materially better.
- Address the critiques concretely: fix contrast, sharpen copy, strengthen hierarchy and spacing, vary repetitive sections, improve imagery use.
- Single self-contained document: Tailwind via the CDN, Google Fonts, vanilla JS only. No React, no imports, no build step.
- Start with <!DOCTYPE html>, end with </html>. Output ONLY the HTML — no commentary, no markdown fences.`;

/**
 * Self-review & auto-fix via PARALLEL specialist critics → one fixer. Never
 * throws; the regression guard keeps the original if the result drops content.
 */
export async function reviewAndImproveAiSite(opts: {
  html: string;
  prompt: string;
  brandName?: string;
}): Promise<AiSiteResult | AiSiteFail> {
  const html = (opts.html || "").trim();
  if (!html) return { ok: false, reason: "no page to review" };

  // 1) Specialist critics, in parallel → concrete notes (best-effort).
  let notes = "";
  try {
    notes = await runCritics(html);
  } catch {
    notes = "";
  }

  // 2) Fixer applies the notes (or falls back to a generic senior review if the
  // critics produced nothing). Opus → Sonnet via callForHtml; regression-guarded.
  const brand = opts.brandName ? `\nBrand: ${opts.brandName}` : "";
  const userMessage = notes
    ? `Business: ${opts.prompt}${brand}\n\nReviewer critiques to fix:\n\n${notes}\n\nApply the fixes and output the full, improved HTML document.\n\n${html}`
    : `Business: ${opts.prompt}${brand}\n\nReview and improve this website. Output only the full, improved HTML document.\n\n${html}`;

  const r = await callForHtml(
    notes ? FIXER_SYSTEM : REVIEW_SYSTEM,
    userMessage,
    (improved) => improved.length >= html.length * 0.7,
  );
  return r
    ? { ok: true, html: finalizeAiHtml(r.html, opts.prompt), model: r.model }
    : { ok: false, reason: "no usable improvement — kept original" };
}
