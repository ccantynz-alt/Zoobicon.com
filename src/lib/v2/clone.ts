/**
 * Faithful website clone engine.
 *
 * "Copy this site" must produce a COPY — not a reinterpretation. The builder's
 * normal path treats the prompt as a creative brief and invents a site, so it
 * can never copy a page it never read. This engine fixes that at the root: it
 * FETCHES the real page, cleans the HTML, and has the model recreate it
 * faithfully — same brand, copy, sections, order, colours, and the real images.
 *
 * Honest limit: we read public HTML, so it's a close, faithful copy of the
 * content + brand + structure, not a byte-perfect mirror of every animation —
 * and JavaScript-rendered (SPA) pages with no server HTML can't be read.
 * Never throws; the caller falls back to a fresh build if a clone can't be made.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";
import { normalizeAiLinks } from "@/lib/v2/post-process";

// Cloning is reproduction, not creative design — Sonnet is plenty and ~2× faster
// than Opus at emitting a full page, so it leads. Opus is only a fallback.
const CLONE_MODELS = ["claude-sonnet-4-6", "claude-opus-4-8"];

// Hard ceiling per model call so a clone can never hang the builder.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

/** Pull the first real URL/domain out of a prompt, or null. */
export function findUrlInPrompt(prompt: string): string | null {
  const m = (prompt || "").match(
    /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+(?:\/[^\s'"]*)?)/i,
  );
  if (!m) return null;
  let u = m[1].replace(/[.,)]+$/, "");
  // Ignore bare file-ish or single-word matches without a real TLD.
  if (!/\.[a-z]{2,}/i.test(u)) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

async function fetchSiteHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZoobiconCloneBot/1.0; +https://zoobicon.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") || "").includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// HEADLESS-BROWSER READ via Cloudflare Browser Rendering: runs the page's
// JavaScript in a real browser and returns the FULLY rendered HTML — so we can
// read React/SPA sites (like bookaride) that a raw fetch only sees as an empty
// shell. Graceful: no Cloudflare creds (or any failure) ⇒ null, and the caller
// falls back to the raw fetch. This is the capability that makes JS sites
// cloneable (and the same browser unlocks screenshot/vision next).
async function renderViaBrowser(url: string): Promise<string | null> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering/content`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; result?: string };
    if (data.success && typeof data.result === "string" && data.result.length > 500) {
      return data.result;
    }
    return null;
  } catch {
    return null;
  }
}

// Resolve root-relative URLs to absolute so the clone's images/assets load.
function absolutize(html: string, base: string): string {
  let origin = "";
  try {
    origin = new URL(base).origin;
  } catch {
    return html;
  }
  return html
    .replace(/(\s(?:src|href)=")\/(?!\/)/gi, `$1${origin}/`)
    .replace(/url\(\s*\/(?!\/)/gi, `url(${origin}/`);
}

// Strip noise (scripts, styles, svg, comments), keep structure + text + images,
// absolutize asset URLs, and cap size so it fits the model context.
function cleanHtmlForClone(html: string, base: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "");
  s = absolutize(s, base);
  s = s.replace(/[\t ]{2,}/g, " ").replace(/>\s+</g, ">\n<").trim();
  // Cap for speed — the top of the page (hero + main sections) is what makes a
  // clone recognisable; less input also means faster output.
  if (s.length > 30000) s = s.slice(0, 30000);
  return s;
}

const CLONE_SYSTEM = `You are recreating a SPECIFIC existing website faithfully. You will receive the cleaned HTML of the user's real site. Rebuild it as ONE complete, self-contained, modern HTML document that mirrors the original as closely as possible. This is a COPY, not a redesign.

FAITHFULLY PRESERVE (do not invent or paraphrase into generic text):
- The brand name and logo wording.
- The exact headlines, taglines and body copy — use the real wording from the source.
- The navigation items and their labels, in order.
- The sections and their ORDER.
- The colour scheme and overall look (match the brand colours used in the source).
- The IMAGES — reuse the exact image URLs that appear in the source (keep them absolute).
- Any banners/notices, CTAs, prices, ratings and key facts.

Improve ONLY the code quality: clean Tailwind utility classes, responsive, accessible, a working mobile menu and smooth-scroll anchors. Do not change the content, wording, or design intent.

Tech: Tailwind via <script src="https://cdn.tailwindcss.com"></script>, Google Fonts, vanilla JS only. No React/imports/build step. Start with <!DOCTYPE html>, end with </html>. Output ONLY the HTML — no commentary, no markdown fences.`;

export interface CloneResult {
  ok: true;
  html: string;
  sourceUrl: string;
  model: string;
}
export interface CloneFail {
  ok: false;
  reason: string;
}

function extractDoc(raw: string): string {
  let s = (raw || "").trim().replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  const i = s.toLowerCase().indexOf("<!doctype");
  if (i > 0) s = s.slice(i);
  const end = s.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) s = s.slice(0, end + 7);
  return s.trim();
}

/** Fetch a real site and faithfully recreate it. Never throws. */
export async function cloneSite(url: string): Promise<CloneResult | CloneFail> {
  // Headless render first (reads JS/SPA sites); fall back to a raw fetch.
  const raw = (await renderViaBrowser(url)) || (await fetchSiteHtml(url));
  if (!raw) return { ok: false, reason: "Couldn't fetch that URL — it may block bots, be down, or need https." };
  const cleaned = cleanHtmlForClone(raw, url);
  if (cleaned.length < 600) {
    return { ok: false, reason: "That page had almost no readable HTML — it's likely JavaScript-rendered, which we can't read yet." };
  }

  const userMessage = `Source URL: ${url}\n\nThe user's REAL website (cleaned HTML). Recreate it faithfully — same brand, copy, sections, order, colours, and reuse the image URLs:\n\n${cleaned}`;
  for (const model of CLONE_MODELS) {
    try {
      const res = await withTimeout(
        callLLMWithFailover({ model, system: CLONE_SYSTEM, userMessage, maxTokens: 32000 }),
        85000,
        `clone:${model}`,
      );
      const out = extractDoc(res.text || "");
      if (out.length > 1500 && /<\/html>/i.test(out) && /<body/i.test(out)) {
        return { ok: true, html: normalizeAiLinks(out), sourceUrl: url, model: res.model || model };
      }
    } catch {
      // timed out or errored — try the next model, else fall back to a fresh build
    }
  }
  return { ok: false, reason: "Couldn't rebuild the page from the source." };
}
