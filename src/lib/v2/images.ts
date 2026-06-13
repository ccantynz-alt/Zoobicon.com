/**
 * Real imagery for generated sites.
 *
 * The model marks every image with data-img="<subject>" and a fallback
 * Unsplash src. When PEXELS_API_KEY is set, we fetch a genuine, relevant,
 * distinct photo for each subject and swap it in — the difference between
 * "guessed stock that's sometimes wrong/repeated" and real art direction.
 *
 * Fully graceful: with no key (or any failure) the page is returned unchanged,
 * so this is dormant and zero-risk until the key is added, and a bad fetch can
 * never break a build.
 */

const PEXELS_SEARCH = "https://api.pexels.com/v1/search";

// Per-process memo so repeated subjects (and repeat builds) don't re-hit the API.
const memo = new Map<string, string | null>();

/** Fetch one real photo URL for a subject, or null (no key / no match / error). */
export async function fetchPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  const q = (query || "").trim().toLowerCase();
  if (!key || !q) return null;
  if (memo.has(q)) return memo.get(q) ?? null;
  try {
    const res = await fetch(`${PEXELS_SEARCH}?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      memo.set(q, null);
      return null;
    }
    const data = (await res.json()) as {
      photos?: Array<{ src?: { landscape?: string; large2x?: string; large?: string } }>;
    };
    const s = data.photos?.[0]?.src;
    const url = s?.landscape || s?.large2x || s?.large || null;
    memo.set(q, url);
    return url;
  } catch {
    memo.set(q, null);
    return null;
  }
}

/**
 * Swap real photos into a finished page. For every element carrying
 * data-img="subject", fetch a real photo and replace its <img src> and/or any
 * CSS background-image url(). No key ⇒ returns the html untouched. Never throws.
 */
export async function applyRealImages(html: string): Promise<string> {
  if (!process.env.PEXELS_API_KEY) return html;
  try {
    const subjects = new Set<string>();
    for (const m of html.matchAll(/data-img="([^"]+)"/g)) subjects.add(m[1]);
    if (!subjects.size) return html;

    const urls = new Map<string, string>();
    await Promise.all(
      [...subjects].map(async (s) => {
        const u = await fetchPexels(s);
        if (u) urls.set(s, u);
      }),
    );
    if (!urls.size) return html;

    // Rewrite each opening tag that carries data-img: set src (img) and any
    // inline background-image url() to the real photo.
    return html.replace(/<([a-zA-Z][\w-]*)\b([^>]*\bdata-img="([^"]+)"[^>]*)>/g, (full, tag: string, attrs: string, subj: string) => {
      const url = urls.get(subj);
      if (!url) return full;
      let a = attrs;
      if (/\bsrc="/.test(a)) a = a.replace(/\bsrc="[^"]*"/, `src="${url}"`);
      else if (tag.toLowerCase() === "img") a = `${a} src="${url}"`;
      if (/background-image\s*:\s*url\([^)]*\)/.test(a)) {
        a = a.replace(/background-image\s*:\s*url\([^)]*\)/, `background-image: url('${url}')`);
      }
      return `<${tag}${a}>`;
    });
  } catch {
    return html; // never break a build over imagery
  }
}
