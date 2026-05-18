/**
 * POST /api/generate/plan — Plan Mode pre-flight.
 *
 * KILLER-MOVES-BUILDER.md #B12. Craig (May 14): "If somebody makes a
 * mistake and it gets submitted and calls all the API answers to that
 * question and then that's just a whole lot of usage that's a waste."
 *
 * Solution: a CHEAP pre-flight (one Haiku call, ~$0.0008) that returns
 * a structured plan the user can audit + edit BEFORE the heavy
 * generation pipeline fires.
 *
 * Plan includes:
 *   - Detected industry + theme + brand name
 *   - Component lineup the slot-stream will build
 *   - Estimated cost in USD + estimated wall-clock seconds
 *   - Ambiguities the planner is uncertain about — each with a
 *     suggested clarifying question
 *
 * The builder UI shows the plan, asks the user to confirm OR edit OR
 * cancel. Only on confirm does /api/generate/slot-stream fire.
 *
 * Result: a misclick or typo costs ~$0.0008 (one Haiku planning call)
 * instead of $0.05-0.20 (a full multi-component build).
 */

import { NextRequest } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateGeneratedText, detectRefusal } from "@/lib/llm-output-validator";
import { planPageForIndustryAdaptive } from "@/lib/slot-locked/industry-planner";
import { estimateCallCostUsd } from "@/lib/build-quota";

export const runtime = "edge";
export const maxDuration = 30;

type Theme = "editorial" | "light" | "warm" | "dark";

interface PlanResponseAmbiguity {
  /** What the planner is uncertain about. */
  field: string;
  /** Plain-English description of the uncertainty. */
  description: string;
  /** Suggested clarifying question the UI can offer as a button. */
  clarifyingQuestion: string;
  /** Default the planner is currently using — shown so user knows
   *  what will happen if they don't clarify. */
  currentDefault: string;
}

interface PlanResponse {
  /** Original prompt — echoed back so the UI can keep it in state. */
  prompt: string;
  /** Plan summary the user reviews. */
  plan: {
    industry: string;
    theme: Theme;
    brandName: string;
    /** Component ids the slot-stream will build, in render order. */
    componentIds: string[];
    /** Section labels for each component — what the user sees on the
     *  review screen ("Navigation", "Hero section", etc). */
    componentLabels: string[];
    /** Whether a pricing section is included. */
    includePricing: boolean;
    /** Plain-English summary of what will be built. */
    summary: string;
  };
  /** Cost estimate so the user sees what this build will burn. */
  estimate: {
    /** Number of LLM calls slot-stream will make. */
    apiCalls: number;
    /** USD estimate for the full build. */
    usd: number;
    /** Wall-clock seconds estimate. */
    seconds: number;
    /** Whether the cache is expected to absorb >=50% of the calls. */
    cacheBenefit: boolean;
  };
  /** Ambiguities the user should review before building. */
  ambiguities: PlanResponseAmbiguity[];
  /** How confident the planner is in the overall classification (0-1). */
  confidence: number;
  /** Echo a buildId so cancellation requests can target this plan. */
  planId: string;
}

const SYSTEM_PROMPT = `You are a Plan Mode classifier for an AI website builder. Given a user's prompt, you return a STRUCTURED PLAN they can review before the expensive build fires.

Your job is to:
1. Detect industry (one of: saas, agency, startup, portfolio, ecommerce, restaurant, fitness, wedding, legal, medical, education, real-estate, hospitality, personal-brand, non-profit, other)
2. Detect theme (one of: editorial, light, warm, dark — default editorial unless prompt clearly signals otherwise)
3. Extract a plausible brand name from the prompt (empty string if unclear)
4. Decide which components the page needs (subset of: navbar, hero, features, pricing, footer)
5. Identify AMBIGUITIES — things the prompt is unclear about that, if wrong, would waste a build. Examples:
   - Brand name unclear ("Bellini" could be a restaurant, a record label, a wine bar)
   - Pricing inclusion unclear (no signal about whether they want a pricing section)
   - Theme unclear (consumer-facing could be light or warm)
   - Industry could be multiple

For each ambiguity, write a clear clarifying question the user could answer in one click.

Return ONLY JSON in this shape:
{
  "industry": "...",
  "theme": "...",
  "brandName": "...",
  "includePricing": true | false,
  "summary": "One-sentence plain-English description of what will be built.",
  "confidence": 0.0-1.0,
  "ambiguities": [
    { "field": "industry", "description": "...", "clarifyingQuestion": "...", "currentDefault": "..." }
  ]
}

No prose, no markdown fences. JSON object only.`;

const FALLBACK_PLAN: PlanResponse["plan"] = {
  industry: "other",
  theme: "editorial",
  brandName: "",
  componentIds: ["navbar-minimal-slot", "hero-spotlight-slot", "features-bento-slot", "pricing-tiers-slot", "footer-editorial-slot"],
  componentLabels: ["Navigation", "Hero section", "Features", "Pricing", "Footer"],
  includePricing: true,
  summary: "A 5-section landing page using the generic editorial-light defaults.",
};

interface RequestBody {
  prompt?: string;
  brandName?: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (prompt.length < 5) {
    return Response.json({ error: "prompt is required (5+ chars)" }, { status: 400 });
  }

  const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // ── Single Haiku call to classify intent ──
  let aiPlan: Partial<PlanResponse["plan"]> & { confidence?: number; ambiguities?: PlanResponseAmbiguity[] } = {};
  try {
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system: SYSTEM_PROMPT,
      userMessage: `User prompt: "${prompt}"\n\nReturn the plan JSON.`,
      maxTokens: 600,
    });

    const validation = validateGeneratedText(fb.text, 20);
    if (validation.ok && !detectRefusal(fb.text).refused) {
      const start = fb.text.indexOf("{");
      const end = fb.text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          aiPlan = JSON.parse(fb.text.slice(start, end + 1));
        } catch {
          // Fall through to defaults
        }
      }
    }
  } catch (err) {
    console.warn("[plan] LLM call failed:", err instanceof Error ? err.message : err);
  }

  // ── Normalise + sanity-check fields ──
  const ALLOWED_INDUSTRIES = ["saas", "agency", "startup", "portfolio", "ecommerce", "restaurant", "fitness", "wedding", "legal", "medical", "education", "real-estate", "hospitality", "personal-brand", "non-profit", "other"];
  const ALLOWED_THEMES: Theme[] = ["editorial", "light", "warm", "dark"];

  const industry = ALLOWED_INDUSTRIES.includes(aiPlan.industry as string) ? (aiPlan.industry as string) : "other";
  const theme = ALLOWED_THEMES.includes(aiPlan.theme as Theme) ? (aiPlan.theme as Theme) : "editorial";
  const brandName = typeof aiPlan.brandName === "string" ? aiPlan.brandName.slice(0, 50) : "";
  const includePricing = typeof aiPlan.includePricing === "boolean" ? aiPlan.includePricing : true;
  const confidence = typeof aiPlan.confidence === "number" ? Math.max(0, Math.min(1, aiPlan.confidence)) : 0.5;
  const summary = typeof aiPlan.summary === "string" ? aiPlan.summary.slice(0, 300) : FALLBACK_PLAN.summary;

  const ambiguities: PlanResponseAmbiguity[] = Array.isArray(aiPlan.ambiguities)
    ? aiPlan.ambiguities
        .filter((a): a is PlanResponseAmbiguity =>
          !!a && typeof a === "object" &&
          typeof (a as PlanResponseAmbiguity).field === "string" &&
          typeof (a as PlanResponseAmbiguity).description === "string" &&
          typeof (a as PlanResponseAmbiguity).clarifyingQuestion === "string",
        )
        .slice(0, 4)
    : [];

  // ── Component selection — use the adaptive planner (respects
  //    flywheel preferences + self-healing quarantines) ──
  const componentIds = await planPageForIndustryAdaptive({ industry, theme, includePricing });
  const componentLabels = componentIds.map(componentLabel);

  // ── Cost estimate based on component count + cache hit assumption ──
  // Conservative: each component = 1 Haiku call at ~1500 input + ~800 output tokens.
  // Plus the planner call (already spent) + critique pass (3 Haiku calls).
  const apiCalls = componentIds.length + 3; // components + 3 critics
  const perComponentCost = estimateCallCostUsd("claude-haiku-4-5", 1500, 800);
  const critiqueCost = 3 * estimateCallCostUsd("claude-haiku-4-5", 800, 400);
  const usd = apiCalls === 0 ? 0 : (componentIds.length * perComponentCost) + critiqueCost;
  const seconds = Math.max(6, componentIds.length * 1.5 + 2);

  const response: PlanResponse = {
    prompt,
    plan: {
      industry,
      theme,
      brandName,
      componentIds,
      componentLabels,
      includePricing,
      summary,
    },
    estimate: {
      apiCalls,
      usd: Math.round(usd * 10000) / 10000,
      seconds: Math.round(seconds),
      cacheBenefit: false, // flywheel matures into this — first build never has cache
    },
    ambiguities,
    confidence,
    planId,
  };

  return Response.json(response);
}

function componentLabel(componentId: string): string {
  if (componentId.includes("navbar")) return "Navigation bar";
  if (componentId.includes("hero")) return "Hero section";
  if (componentId.includes("features")) return "Features grid";
  if (componentId.includes("pricing")) return "Pricing tiers";
  if (componentId.includes("testimonials")) return "Testimonials";
  if (componentId.includes("stats")) return "Stats strip";
  if (componentId.includes("cta")) return "Call-to-action";
  if (componentId.includes("faq")) return "FAQ";
  if (componentId.includes("footer")) return "Footer";
  return componentId;
}

export async function GET(): Promise<Response> {
  return Response.json({
    name: "Plan Mode pre-flight",
    purpose: "Cheap classifier that returns a structured plan the user can audit before the heavy build fires.",
    method: "POST",
    body: { prompt: "string (5+ chars)", brandName: "string (optional)" },
    cost: "~$0.0008 per call (1 Haiku invocation)",
  });
}
