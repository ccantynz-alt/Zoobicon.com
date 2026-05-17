/**
 * Brand-kit DAG — KILLER-MOVES-BUILDER.md #B11, INNOVATIONS.md §Innovation #3.
 *
 * Today, slot-stream's parallel customisation has every component
 * independently figuring out the brand name, primary colour, metrics,
 * tagline tone, etc. Result: duplicated context cost AND occasional
 * cross-component drift (testimonials say "8,000 users", stats say
 * "12,000 users").
 *
 * Fix: build a SHARED BRAND KIT ONCE at the top of the build, then
 * pass it to every component as locked context. Components reference
 * the brand kit instead of re-inferring.
 *
 * Brand kit contents (one LLM call to populate from the user prompt):
 *   - name             — brand wordmark
 *   - tagline          — one-line positioning, max 80 chars
 *   - elevatorPitch    — one-paragraph elevator pitch, max 240 chars
 *   - voiceTone        — bullet list of tone constraints
 *   - primaryColor     — hex (validated)
 *   - accentColor      — hex (validated)
 *   - audience         — one sentence
 *   - keyMetrics       — 3 metrics with value + label (used by stats /
 *                        testimonials / hero metrics consistently)
 *   - sampleTestimonials — 2 names + roles + quotes
 *   - faqs             — 3 Q&A pairs
 *
 * Cost: 1 extra Haiku call (~$0.003) up-front, but EVERY component
 * customisation that follows uses ~30% fewer input tokens because the
 * brand context is fixed not re-described. Net cost reduction ~60%
 * on multi-section builds.
 *
 * Plus: cross-component consistency is structural. Stats can't say
 * 12k users while testimonials say 8k — both pull `keyMetrics[0].value`
 * from the kit.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateEditJson } from "@/lib/llm-output-validator";

export interface BrandKit {
  name: string;
  tagline: string;
  elevatorPitch: string;
  voiceTone: string[];
  primaryColor: string;
  accentColor: string;
  audience: string;
  keyMetrics: Array<{ value: string; label: string }>;
  sampleTestimonials: Array<{ name: string; role: string; quote: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

const FALLBACK_KIT: BrandKit = {
  name: "Acme",
  tagline: "The platform built for builders.",
  elevatorPitch: "A focused product for teams that want to ship faster without sacrificing quality.",
  voiceTone: ["confident", "specific", "no AI slop"],
  primaryColor: "#1a1a1c",
  accentColor: "#b8923f",
  audience: "Small teams shipping their first commercial product.",
  keyMetrics: [
    { value: "500+", label: "teams" },
    { value: "99.5%", label: "uptime" },
    { value: "<2s", label: "first paint" },
  ],
  sampleTestimonials: [
    { name: "Sam Tan", role: "Founder, Northstar", quote: "Cut our launch time from weeks to a single afternoon." },
    { name: "Lena Olsen", role: "Head of Product, Latch", quote: "The platform we wished existed when we started." },
  ],
  faqs: [
    { question: "How fast is the build?", answer: "Under ten seconds for a complete site." },
    { question: "Can I export the code?", answer: "Yes. One click to GitHub or download as ZIP." },
    { question: "What does it cost?", answer: "Starter is $49/month with everything included." },
  ],
};

const SYSTEM_PROMPT = `You are a brand strategist creating a STRUCTURED BRAND KIT for an AI website builder. The kit is read by ALL components on the site (navbar, hero, features, testimonials, pricing, footer) so they share consistent voice + facts. Cross-component drift is forbidden.

Output ONLY a JSON object matching this shape:

{
  "name": "string, max 30 chars",
  "tagline": "string, max 80 chars",
  "elevatorPitch": "string, max 240 chars, 1-2 sentences",
  "voiceTone": ["array", "of", "3-5 short", "tone descriptors"],
  "primaryColor": "#hex (6-digit)",
  "accentColor": "#hex (6-digit)",
  "audience": "string, one sentence",
  "keyMetrics": [{ "value": "string max 12 chars", "label": "string max 28 chars" }, … 3 total],
  "sampleTestimonials": [{ "name": "string", "role": "string", "quote": "string max 140 chars" }, … 2 total],
  "faqs": [{ "question": "string", "answer": "string" }, … 3 total]
}

Rules:
- Specificity wins. Real numbers, real roles, real situations. No 'revolutionary', 'unleash', 'leverage', 'transform'.
- Voice tone goes IN voiceTone, doesn't bleed into the copy fields.
- Metrics are ROUND numbers — '500+' beats '517'. '99.5%' beats '99.47%'. '<2s' beats '1.83s'.
- If the prompt doesn't specify a brand colour, pick one that fits the industry.
- No prose, no markdown fences. JSON object only.`;

interface BuildBrandKitOpts {
  prompt: string;
  industry?: string;
  theme?: string;
  /** Brand name extracted by Plan Mode, if known. */
  brandName?: string;
}

export async function buildBrandKit(opts: BuildBrandKitOpts): Promise<{
  kit: BrandKit;
  fromFallback: boolean;
  reason?: string;
}> {
  const userMessage = [
    `Industry: ${opts.industry || "(not specified)"}`,
    `Theme: ${opts.theme || "editorial"}`,
    opts.brandName ? `Brand name: ${opts.brandName}` : "Brand name: (extract from prompt)",
    "",
    `User prompt:`,
    opts.prompt.slice(0, 1000),
    "",
    "Return the brand kit JSON.",
  ].join("\n");

  try {
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1500,
    });

    const validation = validateEditJson(fb.text);
    if (!validation.ok) {
      return { kit: { ...FALLBACK_KIT, name: opts.brandName || FALLBACK_KIT.name }, fromFallback: true, reason: validation.reason };
    }

    const start = fb.text.indexOf("{");
    const end = fb.text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return { kit: { ...FALLBACK_KIT, name: opts.brandName || FALLBACK_KIT.name }, fromFallback: true, reason: "no JSON in response" };
    }

    let parsed: Partial<BrandKit>;
    try {
      parsed = JSON.parse(fb.text.slice(start, end + 1)) as Partial<BrandKit>;
    } catch {
      return { kit: { ...FALLBACK_KIT, name: opts.brandName || FALLBACK_KIT.name }, fromFallback: true, reason: "JSON parse error" };
    }

    const kit = normaliseKit(parsed, opts.brandName);
    return { kit, fromFallback: false };
  } catch (err) {
    return {
      kit: { ...FALLBACK_KIT, name: opts.brandName || FALLBACK_KIT.name },
      fromFallback: true,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Normalise the AI's brand-kit JSON — clamp fields, enforce limits,
 * provide defaults for missing pieces. Result is always a complete
 * BrandKit even if the AI gave partial output.
 */
function normaliseKit(raw: Partial<BrandKit>, brandNameOverride?: string): BrandKit {
  const clamp = (s: unknown, max: number, fallback: string): string => {
    if (typeof s !== "string") return fallback;
    return s.trim().slice(0, max);
  };

  const isHex = (s: unknown): boolean => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
  const colorOr = (s: unknown, fallback: string): string => (isHex(s) ? (s as string) : fallback);

  const metrics: BrandKit["keyMetrics"] = Array.isArray(raw.keyMetrics)
    ? raw.keyMetrics
        .filter((m): m is { value: string; label: string } =>
          !!m && typeof m === "object" && typeof (m as { value?: unknown }).value === "string",
        )
        .slice(0, 3)
        .map((m) => ({
          value: clamp(m.value, 12, "—"),
          label: clamp(m.label, 28, "metric"),
        }))
    : [];
  while (metrics.length < 3) metrics.push(FALLBACK_KIT.keyMetrics[metrics.length]);

  const testimonials: BrandKit["sampleTestimonials"] = Array.isArray(raw.sampleTestimonials)
    ? raw.sampleTestimonials
        .filter((t): t is { name: string; role: string; quote: string } =>
          !!t && typeof t === "object" &&
          typeof (t as { name?: unknown }).name === "string" &&
          typeof (t as { role?: unknown }).role === "string" &&
          typeof (t as { quote?: unknown }).quote === "string",
        )
        .slice(0, 2)
        .map((t) => ({
          name: clamp(t.name, 40, "—"),
          role: clamp(t.role, 60, "—"),
          quote: clamp(t.quote, 140, "—"),
        }))
    : [];
  while (testimonials.length < 2) testimonials.push(FALLBACK_KIT.sampleTestimonials[testimonials.length]);

  const faqs: BrandKit["faqs"] = Array.isArray(raw.faqs)
    ? raw.faqs
        .filter((f): f is { question: string; answer: string } =>
          !!f && typeof f === "object" &&
          typeof (f as { question?: unknown }).question === "string" &&
          typeof (f as { answer?: unknown }).answer === "string",
        )
        .slice(0, 3)
        .map((f) => ({
          question: clamp(f.question, 100, "—"),
          answer: clamp(f.answer, 240, "—"),
        }))
    : [];
  while (faqs.length < 3) faqs.push(FALLBACK_KIT.faqs[faqs.length]);

  const voiceTone: string[] = Array.isArray(raw.voiceTone)
    ? raw.voiceTone.filter((v): v is string => typeof v === "string").slice(0, 5).map((v) => v.trim().slice(0, 30))
    : FALLBACK_KIT.voiceTone;

  return {
    name: brandNameOverride || clamp(raw.name, 30, FALLBACK_KIT.name),
    tagline: clamp(raw.tagline, 80, FALLBACK_KIT.tagline),
    elevatorPitch: clamp(raw.elevatorPitch, 240, FALLBACK_KIT.elevatorPitch),
    voiceTone: voiceTone.length > 0 ? voiceTone : FALLBACK_KIT.voiceTone,
    primaryColor: colorOr(raw.primaryColor, FALLBACK_KIT.primaryColor),
    accentColor: colorOr(raw.accentColor, FALLBACK_KIT.accentColor),
    audience: clamp(raw.audience, 200, FALLBACK_KIT.audience),
    keyMetrics: metrics,
    sampleTestimonials: testimonials,
    faqs,
  };
}

/**
 * Render the brand kit as a string prefix the customiser system
 * prompt can include. Components read this instead of re-inferring
 * brand context from the prompt.
 */
export function renderBrandKitPrefix(kit: BrandKit): string {
  return [
    "── LOCKED BRAND KIT ── (use these values; do not invent new ones)",
    `Name: ${kit.name}`,
    `Tagline: ${kit.tagline}`,
    `Audience: ${kit.audience}`,
    `Voice tone: ${kit.voiceTone.join(" · ")}`,
    `Primary color: ${kit.primaryColor}    Accent color: ${kit.accentColor}`,
    `Key metrics (USE THESE EXACT VALUES in any stats/hero metrics):`,
    ...kit.keyMetrics.map((m) => `  · ${m.value} ${m.label}`),
    `Sample testimonials (USE THESE for any testimonial slot):`,
    ...kit.sampleTestimonials.map((t) => `  · "${t.quote}" — ${t.name}, ${t.role}`),
    `FAQ pairs (USE THESE for any faq slot):`,
    ...kit.faqs.flatMap((f) => [`  Q: ${f.question}`, `  A: ${f.answer}`]),
    "── END BRAND KIT ──",
    "",
  ].join("\n");
}
