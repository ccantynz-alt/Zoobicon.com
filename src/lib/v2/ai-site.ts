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
 * Model: Sonnet 4.6 (the sanctioned generation model per Rule 35 — fast,
 * excellent at self-contained UI, cross-provider failover built in). The
 * design quality comes from the approach, not from a specific model.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";

// Sonnet 4.6 — fast, strong at self-contained UI, and Rule-35-sanctioned for
// generation. callLLMWithFailover transparently fails over to other providers
// if Anthropic is unavailable.
const GENERATION_MODEL = "claude-sonnet-4-6";

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

  try {
    const res = await callLLMWithFailover({
      model: GENERATION_MODEL,
      system: BUILD_SYSTEM,
      userMessage,
      maxTokens: MAX_TOKENS,
    });
    const html = extractHtmlDoc(res.text || "");
    if (!looksLikeCompletePage(html)) {
      return { ok: false, reason: "model did not return a complete HTML document" };
    }
    return { ok: true, html, model: res.model || GENERATION_MODEL };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "generation failed" };
  }
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

  try {
    const res = await callLLMWithFailover({
      model: GENERATION_MODEL,
      system: EDIT_SYSTEM,
      userMessage: `Instruction: ${instruction}\n\nCurrent HTML document:\n\n${html}`,
      maxTokens: MAX_TOKENS,
    });
    const out = extractHtmlDoc(res.text || "");
    if (!looksLikeCompletePage(out)) {
      return { ok: false, reason: "edit did not return a complete document" };
    }
    return { ok: true, html: out, model: res.model || GENERATION_MODEL };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "edit failed" };
  }
}
