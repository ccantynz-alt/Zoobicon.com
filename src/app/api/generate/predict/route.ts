/**
 * POST /api/generate/predict — predictive pre-generation
 * KILLER-MOVES-BUILDER.md #B3, INNOVATIONS.md §Innovation #2.
 *
 * Called by the builder UI while the user is STILL TYPING (debounced
 * ~500ms after each keystroke). Returns a hypothesised:
 *   - industry classification
 *   - visual theme (editorial / light / warm / dark)
 *   - shortlist of slot-locked component ids to assemble
 *
 * The client uses these hints to:
 *   - pre-load the relevant template files into Sandpack's bundler
 *     cache
 *   - pre-customise the navbar (almost always identical regardless of
 *     prompt nuance) so it's ready the moment Submit is clicked
 *   - warm the LLM connection with a no-op ping
 *
 * Cost: one Haiku call per debounced keystroke. Typical user types
 * for 5-20 seconds → 1-3 predict calls per build → 1-3 cents per
 * abandoned build. Once the user submits, the actual generation
 * (slot-stream or react-stream) reuses the prediction so it doesn't
 * pay for industry detection again.
 *
 * NOT a stream — returns a single JSON payload (the prediction is
 * small + fast). Edge runtime so latency stays under 300ms.
 */

import { NextRequest } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateGeneratedText, detectRefusal } from "@/lib/llm-output-validator";

// Edge runtime — predict is short, hot-path, latency-sensitive.
export const runtime = "edge";
export const maxDuration = 15;

type Theme = "editorial" | "light" | "warm" | "dark";
type Industry =
  | "saas" | "agency" | "startup" | "portfolio" | "ecommerce"
  | "restaurant" | "fitness" | "wedding" | "legal" | "medical"
  | "education" | "real-estate" | "hospitality" | "personal-brand"
  | "non-profit" | "other";

interface PredictResponse {
  industry: Industry;
  theme: Theme;
  /** Slot-locked component ids the planner thinks this prompt needs.
   *  Order matters — top to bottom on the page. */
  components: string[];
  /** Tentative brand name extracted from the prompt. May be empty. */
  brandName: string;
  /** Confidence the AI has in this prediction (0-1). Low confidence
   *  → client should not pre-customise (would be wasted on a wrong
   *  guess) but should still warm the bundler. */
  confidence: number;
  /** How fresh this prediction is (ms since the prompt was last
   *  meaningfully different). Helps the client decide whether to
   *  invalidate a cached prediction. */
  promptHash: string;
}

const FALLBACK_PREDICTION: PredictResponse = {
  industry: "other",
  theme: "editorial",
  components: [
    "navbar-minimal-slot",
    "hero-spotlight-slot",
    "features-bento-slot",
    "pricing-tiers-slot",
    "footer-editorial-slot",
  ],
  brandName: "",
  confidence: 0.4,
  promptHash: "",
};

function hashPrompt(p: string): string {
  // Tiny non-cryptographic hash for cache-busting purposes only.
  // The client compares this against the last seen hash; if same,
  // skip the API call entirely.
  let h = 5381;
  for (let i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const PREDICT_SYSTEM = `You are a fast intent classifier for an AI website builder. Given a partial or full user prompt, you predict three things:

1. INDUSTRY — pick exactly one: saas, agency, startup, portfolio, ecommerce, restaurant, fitness, wedding, legal, medical, education, real-estate, hospitality, personal-brand, non-profit, other.
2. THEME — pick exactly one visual theme:
   - editorial (default — restrained, gold accent, premium / professional)
   - light (airy, friendly, consumer-facing)
   - warm (cream + amber, restaurant / hospitality / artisan)
   - dark (cyber / crypto / gaming / devtool — pick ONLY if the prompt explicitly signals this)
3. COMPONENTS — the components needed for this site, top to bottom. Available slot-locked ids:
   navbar-minimal-slot, hero-spotlight-slot, features-bento-slot, pricing-tiers-slot, footer-editorial-slot.
   Almost every site needs navbar + hero + features + footer. Pricing depends on whether the prompt mentions selling, plans, tiers, or subscriptions.
4. BRAND_NAME — extract a plausible brand name from the prompt if one is clearly stated. Empty string if unclear.
5. CONFIDENCE — your confidence in the prediction, 0-1. Below 0.6 means "don't trust this for pre-customisation, just pre-warm the bundler."

Return ONLY a JSON object. No prose, no markdown, no explanation. Fields: industry, theme, components, brandName, confidence.`;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string };
  try {
    body = (await req.json()) as { prompt?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  // Too short to meaningfully predict — return fallback without
  // burning a Haiku call.
  if (prompt.length < 10) {
    return Response.json({ ...FALLBACK_PREDICTION, promptHash: hashPrompt(prompt) });
  }

  const promptHash = hashPrompt(prompt);

  try {
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system: PREDICT_SYSTEM,
      userMessage: `User prompt (may be partial — they're still typing):\n\n${prompt}\n\nReturn the prediction JSON.`,
      maxTokens: 400,
    });

    const validation = validateGeneratedText(fb.text, 20);
    if (!validation.ok) {
      return Response.json({ ...FALLBACK_PREDICTION, promptHash });
    }

    const refusal = detectRefusal(fb.text);
    if (refusal.refused) {
      return Response.json({ ...FALLBACK_PREDICTION, promptHash });
    }

    // Extract the JSON object — model occasionally wraps in fences.
    let cleaned = fb.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return Response.json({ ...FALLBACK_PREDICTION, promptHash });
    }
    cleaned = cleaned.slice(start, end + 1);

    let parsed: Partial<PredictResponse>;
    try {
      parsed = JSON.parse(cleaned) as Partial<PredictResponse>;
    } catch {
      return Response.json({ ...FALLBACK_PREDICTION, promptHash });
    }

    // Normalise + clamp every field. Defence-in-depth — even if the AI
    // ignores instructions, the response shape is fixed.
    const allowedIndustries: Industry[] = [
      "saas", "agency", "startup", "portfolio", "ecommerce",
      "restaurant", "fitness", "wedding", "legal", "medical",
      "education", "real-estate", "hospitality", "personal-brand",
      "non-profit", "other",
    ];
    const allowedThemes: Theme[] = ["editorial", "light", "warm", "dark"];
    const allowedComponents = [
      "navbar-minimal-slot",
      "hero-spotlight-slot",
      "features-bento-slot",
      "pricing-tiers-slot",
      "footer-editorial-slot",
    ];

    const industry = (allowedIndustries as string[]).includes(parsed.industry as string)
      ? (parsed.industry as Industry)
      : "other";
    const theme = (allowedThemes as string[]).includes(parsed.theme as string)
      ? (parsed.theme as Theme)
      : "editorial";
    const components = Array.isArray(parsed.components)
      ? parsed.components.filter((id) => allowedComponents.includes(id as string)) as string[]
      : FALLBACK_PREDICTION.components;
    const brandName = typeof parsed.brandName === "string" ? parsed.brandName.slice(0, 50) : "";
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    const response: PredictResponse = {
      industry,
      theme,
      components: components.length > 0 ? components : FALLBACK_PREDICTION.components,
      brandName,
      confidence,
      promptHash,
    };

    return Response.json(response);
  } catch (err) {
    // Predict failures are non-fatal — return the fallback so the
    // client can still pre-warm based on best-guess defaults.
    console.warn("[predict] failed (returning fallback):", err instanceof Error ? err.message : err);
    return Response.json({ ...FALLBACK_PREDICTION, promptHash });
  }
}

export async function GET(): Promise<Response> {
  return Response.json({
    name: "Predictive pre-generation endpoint",
    purpose: "Called by the builder UI as the user types. Returns hypothesised industry/theme/components for client-side pre-warming.",
    method: "POST",
    body: { prompt: "string (any length; <10 chars returns fallback without LLM call)" },
    response: "PredictResponse JSON",
  });
}
