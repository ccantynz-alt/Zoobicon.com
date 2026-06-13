/**
 * Deterministic finishing pass for AI-generated pages (spawn + whole-page).
 *
 * The model writes great HTML but is unreliable about two things a polished
 * site must get right, so we fix them after the fact rather than hoping the
 * prompt holds:
 *   1. It reuses the same stock photo several times ("same picture 3×").
 *   2. Its nav/footer links point at anchors that don't match the real section
 *      ids, so they're dead.
 * Running this on the assembled HTML guarantees the fix on every build.
 */

import { industryPhotoPool } from "@/lib/stock-images";
import { detectIndustry } from "@/lib/v2/render-page";

// Keep the model's UNIQUE images (those are bespoke); only replace REPEATS with
// distinct, on-industry photos. Fixes "same picture three times".
export function diversifyImages(html: string, industry: string): string {
  const pool = industryPhotoPool(industry);
  const seen = new Set<string>();
  let p = 0;
  return html.replace(/images\.unsplash\.com\/(photo-[A-Za-z0-9_-]+)/g, (full, id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      return full;
    }
    if (!pool.length) return full;
    // pick a pool image we haven't used yet
    let pick = pool[p % pool.length];
    p += 1;
    let tries = 0;
    while (seen.has(pick) && tries < pool.length) {
      pick = pool[p % pool.length];
      p += 1;
      tries += 1;
    }
    seen.add(pick);
    return `images.unsplash.com/${pick}`;
  });
}

// Rewrite every internal link to an in-page section id that ACTUALLY EXISTS
// (exact, then fuzzy), or make it inert ("#") — so header/footer links scroll
// instead of being dead. External / mailto / tel links are left untouched.
export function normalizeAiLinks(html: string): string {
  const ids = new Set<string>();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);

  return html.replace(/href="([^"]*)"/g, (full, href: string) => {
    if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return full;
    }
    const slug = href.replace(/^#/, "").replace(/^\//, "").replace(/\/+$/, "").toLowerCase();
    if (!slug || slug === "home" || slug === "top") return 'href="#"';
    if (ids.has(slug)) return `href="#${slug}"`;
    for (const id of ids) {
      const l = id.toLowerCase();
      if (l === slug || l.includes(slug) || slug.includes(l)) return `href="#${id}"`;
    }
    return 'href="#"'; // nothing matches — inert, never a dead/error link
  });
}

/** Full finishing pass for a freshly built page. */
export function finalizeAiHtml(html: string, prompt: string): string {
  const industry = detectIndustry(prompt);
  let out = html;
  try {
    out = diversifyImages(out, industry);
  } catch {
    /* best-effort */
  }
  try {
    out = normalizeAiLinks(out);
  } catch {
    /* best-effort */
  }
  return out;
}
