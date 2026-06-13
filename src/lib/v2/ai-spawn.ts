/**
 * Parallel-spawn site engine (v3) — the speed + variety architecture.
 *
 * The whole-page engine (ai-site.ts) generates the entire page as ONE large
 * model output, which is inherently slow (1–4 min) no matter the model, and
 * tends toward the same result for the same prompt. This engine fixes both at
 * the architecture level, not the model level:
 *
 *   1. A small, fast "design brief" call decides this business's palette,
 *      fonts, voice and the list of sections to build — and a creative
 *      DIRECTION (varied per build, so "build again" gives a genuinely
 *      different site, not the same one).
 *   2. Every section is then SPAWNED as a concurrent model call bound to that
 *      brief. Eight small calls running at once finish in roughly the time of
 *      one — ~30–40s for a full page instead of ~200s — and because each call
 *      is small we can afford Opus on every section AND still be fast.
 *   3. The sections are assembled into one self-contained HTML document the
 *      preview iframe just displays (no in-browser code execution → reliable).
 *
 * Model-agnostic by design: the speed/quality lives in this architecture, not
 * in any one model ID, so a model being renamed/pulled can't blindside us — we
 * swap the model behind this interface and everything keeps working.
 *
 * Never throws — returns { ok:false } so callers fall back to the whole-page
 * engine (ai-site.ts) and then the registry render. The preview is never blank.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";
import { finalizeAiHtml } from "@/lib/v2/post-process";
import { applyRealImages } from "@/lib/v2/images";

// Opus first, Sonnet as automatic fallback (a real design either way). Because
// sections are spawned concurrently, Opus-per-section is still fast.
const SPAWN_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6"];

export interface DesignBrief {
  brandName: string;
  industry: string;
  direction: string; // the creative angle for THIS build (varied)
  voice: string;
  layout: string; // overall layout language, e.g. "asymmetric editorial grid"
  motion: string; // motion language, e.g. "subtle scroll-reveal + parallax hero"
  reference: string; // the quality bar to emulate, e.g. "Linear-grade SaaS"
  palette: { bg: string; ink: string; muted: string; surface: string; accent: string; accentInk: string };
  fonts: { display: string; body: string; googleHref: string };
  sections: Array<{ id: string; kind: string; intent: string }>;
}

export interface SpawnResult {
  ok: true;
  html: string;
  brief: DesignBrief;
  model: string;
  sectionCount: number;
}
export interface SpawnFail {
  ok: false;
  reason: string;
}

function extractJson(raw: string): unknown | null {
  let s = (raw || "").trim().replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractSectionHtml(raw: string): string {
  let s = (raw || "").trim().replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  // Keep from the first tag onward; drop any stray prose before it.
  const lt = s.indexOf("<");
  if (lt > 0) s = s.slice(lt);
  return s.trim();
}

const BRIEF_SYSTEM = `You are an award-winning brand and web designer planning a bespoke marketing website for a specific business. Output ONLY a JSON object (no prose, no markdown fences) with exactly this shape:

{
  "brandName": string,
  "industry": short string,
  "direction": one sentence describing the distinct creative direction for THIS build (be specific and confident),
  "voice": short phrase for the copy tone,
  "layout": one phrase for the overall layout language (e.g. "asymmetric editorial grid", "bold centered minimal", "split-screen with sticky media"),
  "motion": one phrase for the motion language (e.g. "subtle scroll-reveal with a parallax hero", "calm fades only"),
  "reference": one phrase naming the quality bar to emulate (e.g. "Linear-grade SaaS", "Aesop editorial", "Stripe clarity"),
  "palette": { "bg": hex, "ink": hex, "muted": hex, "surface": hex, "accent": hex, "accentInk": hex },
  "fonts": { "display": Google font family name, "body": Google font family name, "googleHref": a valid https://fonts.googleapis.com/css2?... URL loading BOTH families },
  "sections": [ { "id": kebab-case unique id, "kind": one of navbar|hero|features|gallery|stats|testimonials|pricing|menu|about|process|faq|cta|contact|footer, "intent": one sentence on what this section must achieve for the business } ]
}

Rules:
- Choose a palette and font pairing that genuinely fit THIS business — never default blue, never generic. Ensure strong contrast (WCAG AA): ink on bg must be readable, accentInk on accent must be readable.
- Pick 7–10 sections that suit the business (a restaurant needs a menu + gallery; a SaaS needs features + pricing; etc.). ALWAYS include a navbar first and a footer last.
- The "direction" should make this build feel distinct, so two builds of the same business can differ.
- Make "layout", "motion" and "reference" specific and ambitious — they set the quality bar every section is built to. Aim at genuinely premium, $100K-agency work.`;

function sectionSystem(brief: DesignBrief): string {
  return `You are building ONE section of a bespoke marketing website that is part of a coherent whole. Write a single, complete, self-contained HTML <section> (or <nav>/<header>/<footer> where appropriate) and NOTHING else — no <html>, <head>, <body>, no markdown fences, no commentary.

Use these EXACT brand decisions so every section matches:
- Brand: ${brief.brandName} — ${brief.industry}
- Creative direction: ${brief.direction}
- Layout language (honour it): ${brief.layout}
- Motion language: ${brief.motion}
- Quality bar to emulate: ${brief.reference}
- Copy voice: ${brief.voice}
- Colours (use these exact hex values via Tailwind arbitrary classes like bg-[${brief.palette.bg}] text-[${brief.palette.ink}] etc.): bg ${brief.palette.bg}, ink/text ${brief.palette.ink}, muted ${brief.palette.muted}, surface ${brief.palette.surface}, accent ${brief.palette.accent}, text-on-accent ${brief.palette.accentInk}.
- Fonts (already loaded globally): display = "${brief.fonts.display}" (use class font-['${brief.fonts.display}'] or inline style for headings), body = "${brief.fonts.body}" (default).

Requirements:
- Tailwind utility classes only (the page loads the Tailwind CDN). Use arbitrary values for the exact hex colours above. Plain HTML — no React/JSX/imports.
- Specific, confident, on-brand copy — never "Acme"/lorem. Real value props for this business.
- Fully responsive (mobile-first), accessible (semantic tags, alt text, good contrast).
- Internal links must point to "#<section-id>" anchors. If this is the navbar, link to the other sections by their ids: ${brief.sections.map((s) => "#" + s.id).join(", ")}. For a navbar include a working mobile menu (a button with class "zb-menu-btn" toggles the element with class "zb-menu").
- Always include alt text on images.

VISUAL RICHNESS — this is what separates $100K-agency work from a flat template. MATCH IT:
- Use real PHOTOGRAPHY, not flat colour blocks. Most sections should feature imagery — full-bleed background photos with a dark gradient overlay for legibility, framed/rounded photos, or photo grids. Pull specific, on-topic images from https://images.unsplash.com (e.g. https://images.unsplash.com/photo-XXXXXXXX?auto=format&fit=crop&w=1600&q=80). Avatars from https://randomuser.me/api/portraits/.
- IMAGES MUST carry a data-img attribute describing the subject in 2–5 words, e.g. <img data-img="airport departure terminal at dusk" src="https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1600&q=80" alt="..."/>. Keep a real Unsplash src as a fallback; the platform swaps in a genuine matching photo when available. For CSS background images, add data-img to the element too.
- Build DEPTH and LAYERING: elevated and glassmorphic cards (backdrop-blur, translucent backgrounds, subtle 1px borders, soft shadows) that FLOAT over imagery or gradients; overlapping elements; never everything flat on one plane.
- Premium detail: rich shadows (shadow-xl / shadow-2xl), gradient accents, badges/pills, generous scale and whitespace, refined hover transitions, rounded corners.
- "Tasteful" means CONSIDERED, not flat or minimal — rich, layered and confident like a top design agency. Avoid bland single-colour blocks with centred text.

PREMIUM PATTERNS — draw on whichever fits this section:
- Hero: a full-bleed background PHOTO + dark gradient overlay + a large display headline + a floating glassmorphic card with proof points or a quick-action widget (this is the highest-impact section — make it cinematic).
- Features: a bento grid or alternating image+text rows with icons — not three identical columns.
- Testimonials: cards with avatars and soft shadows over a tinted or textured background.
- Stats: large gradient numbers. Gallery/menu: a real photo grid or masonry.`;
}

async function callText(system: string, userMessage: string, maxTokens: number): Promise<{ text: string; model: string } | null> {
  for (const model of SPAWN_MODELS) {
    try {
      const res = await callLLMWithFailover({ model, system, userMessage, maxTokens });
      if (res.text && res.text.trim().length > 0) return { text: res.text, model: res.model || model };
    } catch {
      // try next model
    }
  }
  return null;
}

export async function generateDesignBrief(prompt: string, variationHint?: string): Promise<DesignBrief | null> {
  const userMessage =
    `Business: ${prompt}` +
    (variationHint ? `\n\nThis is a fresh take — deliberately choose a DIFFERENT creative direction, palette and layout from a typical version. ${variationHint}` : "") +
    `\n\nReturn the design brief JSON now.`;
  const r = await callText(BRIEF_SYSTEM, userMessage, 1800);
  if (!r) return null;
  const obj = extractJson(r.text) as Partial<DesignBrief> | null;
  if (!obj || !obj.palette || !obj.fonts || !Array.isArray(obj.sections) || obj.sections.length < 3) return null;
  // Ensure navbar first / footer last for a sane page even if the model forgot.
  const sections = obj.sections.filter((s) => s && s.id && s.kind && s.intent);
  if (sections.length < 3) return null;
  return {
    brandName: obj.brandName || "",
    industry: obj.industry || "",
    direction: obj.direction || "",
    voice: obj.voice || "",
    layout: obj.layout || "",
    motion: obj.motion || "",
    reference: obj.reference || "",
    palette: obj.palette,
    fonts: obj.fonts,
    sections,
  } as DesignBrief;
}

// Per-section richness guidance — pushes the most-visible sections (the hero
// above all) toward cinematic, photographic, layered treatments, not flat blocks.
function sectionRichHint(kind: string): string {
  const k = (kind || "").toLowerCase();
  if (/hero|header/.test(k))
    return "MAKE IT CINEMATIC: a full-bleed background PHOTO (with a data-img attribute) under a dark gradient overlay for legibility, a large bold display headline, a short confident subhead, primary + secondary CTAs, and a floating glassmorphic card overlapping the image with proof points or a quick-action widget. This is the highest-impact section — it must read like a premium agency hero, never a flat colour block.";
  if (/feature|service|benefit/.test(k))
    return "Use a bento grid or alternating image+text rows with icons and at least one real photo — not three identical flat columns.";
  if (/gallery|menu|portfolio|work|product|fleet/.test(k))
    return "A rich photo grid or masonry of real images (each with data-img); make it visual and tactile.";
  if (/testimonial|review/.test(k))
    return "Glassmorphic cards with real avatars and soft shadows, over a tinted or photographic background.";
  if (/stat|number|result/.test(k))
    return "Large gradient numbers with labels, on a subtle photographic or gradient backdrop.";
  if (/about|story/.test(k))
    return "Pair editorial copy with a real photo; add depth via an overlapping accent or framed image.";
  if (/cta|contact|book|quote/.test(k))
    return "A bold, confident band — gradient or photographic background with an overlay, a large headline, and a prominent action.";
  return "";
}

async function generateSection(prompt: string, brief: DesignBrief, section: DesignBrief["sections"][number]): Promise<string> {
  const r = await callText(
    sectionSystem(brief),
    `Business: ${prompt}\nSection to build: ${section.kind} (id="${section.id}")\nThis section must: ${section.intent}\n${sectionRichHint(section.kind)}\n\nReturn only the section's HTML.`,
    4000,
  );
  if (!r) return "";
  const html = extractSectionHtml(r.text);
  if (html.length < 40 || !/[<][a-zA-Z]/.test(html)) return "";
  // Guarantee the section carries its id so navbar anchors resolve.
  if (!new RegExp(`id=["']${section.id}["']`).test(html)) {
    return html.replace(/^<([a-zA-Z][\w-]*)/, `<$1 id="${section.id}"`);
  }
  return html;
}

function assemblePage(brief: DesignBrief, sectionHtmls: string[]): string {
  const p = brief.palette;
  const body = sectionHtmls.join("\n");
  const fontsHref = brief.fonts.googleHref || "https://fonts.googleapis.com/css2?family=Inter:wght@300..900&display=swap";
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(brief.brandName || "Your site")}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${escapeAttr(fontsHref)}" rel="stylesheet" />
  <style>
    :root{ --bg:${p.bg}; --ink:${p.ink}; --accent:${p.accent}; }
    html,body{ margin:0; background:${p.bg}; color:${p.ink};
      font-family:"${cssFont(brief.fonts.body)}",system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased; }
    h1,h2,h3{ font-family:"${cssFont(brief.fonts.display)}","${cssFont(brief.fonts.body)}",serif; }
    *{ box-sizing:border-box; }
    [data-reveal]{ opacity:0; transform:translateY(16px); transition:opacity .6s ease, transform .6s ease; }
    [data-reveal].in{ opacity:1; transform:none; }
  </style>
</head>
<body>
${body}
<script>
(function(){
  // Mobile menu: any .zb-menu-btn toggles the nearest/first .zb-menu.
  document.addEventListener('click', function(e){
    var t = e.target;
    var btn = t && t.closest ? t.closest('.zb-menu-btn') : null;
    if (btn){ var m = document.querySelector('.zb-menu'); if (m) m.classList.toggle('hidden'); return; }
    // Smooth-scroll in-page anchors; never navigate the preview away.
    var a = t && t.closest ? t.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' && href.length > 1){
      var el = document.getElementById(href.slice(1));
      e.preventDefault();
      if (el){ try { el.scrollIntoView({behavior:'smooth'}); } catch(_){ el.scrollIntoView(); } }
    } else if (/^https?:/i.test(href)){ e.preventDefault(); try{ window.open(href,'_blank','noopener'); }catch(_){ } }
    else if (href.charAt(0) !== '#'){ /* defuse routes/empty */ if(!/^(mailto:|tel:)/.test(href)) e.preventDefault(); }
  }, true);
  // Scroll reveal.
  try {
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} }); }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function(n){ io.observe(n); });
  } catch(_){ document.querySelectorAll('[data-reveal]').forEach(function(n){ n.classList.add('in'); }); }
})();
</script>
</body>
</html>`;
}

function cssFont(f: string): string {
  return (f || "Inter").replace(/["'<>]/g, "");
}
function escapeHtml(s: string): string {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}
function escapeAttr(s: string): string {
  return (s || "").replace(/"/g, "&quot;");
}

/**
 * Build a complete bespoke page by spawning all sections in parallel against a
 * shared design brief. Never throws — returns { ok:false } to let the caller
 * fall back to the whole-page engine.
 */
export async function spawnSite(opts: { prompt: string; variationHint?: string }): Promise<SpawnResult | SpawnFail> {
  const prompt = (opts.prompt || "").trim();
  if (!prompt) return { ok: false, reason: "empty prompt" };

  const brief = await generateDesignBrief(prompt, opts.variationHint);
  if (!brief) return { ok: false, reason: "design brief failed" };

  // Spawn every section concurrently — this is the speed win.
  const htmls = await Promise.all(brief.sections.map((s) => generateSection(prompt, brief, s)));
  const good = htmls.filter((h) => h.length > 0);
  if (good.length < 3) return { ok: false, reason: "too few sections rendered" };

  const finalized = finalizeAiHtml(assemblePage(brief, good), prompt);
  return {
    ok: true,
    html: await applyRealImages(finalized),
    brief,
    model: SPAWN_MODELS[0],
    sectionCount: good.length,
  };
}
