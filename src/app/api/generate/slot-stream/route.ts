/**
 * POST /api/generate/slot-stream — slot-locked generation endpoint.
 *
 * KILLER-MOVES-BUILDER.md #B1. The AI never touches React code here.
 * It produces a JSON object filling the component schema; the server
 * assembles JSON + hand-written template into the final TSX
 * deterministically.
 *
 * This endpoint is feature-flagged behind:
 *   - `?slotLocked=1` query param, OR
 *   - `x-slot-locked: 1` header, OR
 *   - `SLOT_LOCKED_DEFAULT=1` env var (server-wide opt-in)
 *
 * The existing /api/generate/react-stream stays the default while we
 * convert the rest of the registry. A/B traffic split lives in the
 * builder UI, not here.
 *
 * Only the hero-spotlight component is slot-locked today. Components
 * that don't yet have a slot-locked variant fall back to react-stream
 * inside the same flow — slot mode is additive, not replacement.
 */

import { NextRequest } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateEditJson } from "@/lib/llm-output-validator";
import { TelemetryRecorder } from "@/lib/build-telemetry";
import { checkBuildQuota, recordBuildQuotaUsage, type QuotaPlan } from "@/lib/build-quota";
import { getPlanFromRequest } from "@/lib/user-plan";
import { assembleComponent, schemaToPrompt } from "@/lib/slot-locked/assembler";
import { lookupSlotCache, persistSlotCache, remapBrandSlots } from "@/lib/slot-locked/cache";
import {
  HERO_SPOTLIGHT_SCHEMA,
  HERO_SPOTLIGHT_TEMPLATE,
  HERO_SPOTLIGHT_EXAMPLE,
} from "@/lib/slot-locked/templates/hero-spotlight";
import {
  NAVBAR_MINIMAL_SCHEMA,
  NAVBAR_MINIMAL_TEMPLATE,
  NAVBAR_MINIMAL_EXAMPLE,
} from "@/lib/slot-locked/templates/navbar-minimal";
import {
  FEATURES_BENTO_SCHEMA,
  FEATURES_BENTO_TEMPLATE,
  FEATURES_BENTO_EXAMPLE,
} from "@/lib/slot-locked/templates/features-bento";
import {
  PRICING_TIERS_SCHEMA,
  PRICING_TIERS_TEMPLATE,
  PRICING_TIERS_EXAMPLE,
} from "@/lib/slot-locked/templates/pricing-tiers";
import {
  FOOTER_EDITORIAL_SCHEMA,
  FOOTER_EDITORIAL_TEMPLATE,
  FOOTER_EDITORIAL_EXAMPLE,
} from "@/lib/slot-locked/templates/footer-editorial";
import {
  HERO_RESTAURANT_WARM_SCHEMA,
  HERO_RESTAURANT_WARM_TEMPLATE,
  HERO_RESTAURANT_WARM_EXAMPLE,
} from "@/lib/slot-locked/templates/by-industry/hero-restaurant-warm";
import {
  HERO_PORTFOLIO_EDITORIAL_SCHEMA,
  HERO_PORTFOLIO_EDITORIAL_TEMPLATE,
  HERO_PORTFOLIO_EDITORIAL_EXAMPLE,
} from "@/lib/slot-locked/templates/by-industry/hero-portfolio-editorial";
import { planPageForIndustry } from "@/lib/slot-locked/industry-planner";
import { critiquePanel, axesNeedingRepair } from "@/lib/builder-critique/multi-judge";
import type { ComponentSchema, SlotValueMap } from "@/lib/slot-locked/types";

export const maxDuration = 120;

interface RequestBody {
  prompt?: string;
  brandName?: string;
  /** Detected industry (from /api/generate/predict or the legacy planner).
   *  Used for cache key + auto-component-selection via industry-planner. */
  industry?: string;
  /** Visual theme. Used for cache key + planner. */
  theme?: string;
  /** Whether to include a pricing section in auto-planned pages.
   *  Defaults depend on industry (true for SaaS/agency/etc, false for
   *  portfolio/restaurant). */
  includePricing?: boolean;
  /** Explicit component ids — overrides auto-planning. */
  componentIds?: string[];
  /** Skip the AI customiser and assemble using the example data — useful
   *  for previewing templates, smoke-testing the assembler, or warming
   *  caches. */
  useExampleFill?: boolean;
  /** Bypass the slot-fill cache. Useful for A/B testing or when the
   *  caller wants fresh AI output. Defaults to false (cache is on). */
  bypassCache?: boolean;
  /** Skip the multi-judge critique pass. Useful for smoke tests and
   *  warm-cache replays where critique adds latency without value.
   *  Defaults to false (critique runs on every real build). */
  skipCritique?: boolean;
}

// Schema registry. Seven slot-locked components shipped as of 2026-05-13.
// Migration target: all 118 registry components, ongoing.
const SLOT_REGISTRY: Record<string, { schema: ComponentSchema; template: string; example: SlotValueMap }> = {
  // Generic — used when no industry-specific variant fits.
  "hero-spotlight-slot":           { schema: HERO_SPOTLIGHT_SCHEMA,           template: HERO_SPOTLIGHT_TEMPLATE,           example: HERO_SPOTLIGHT_EXAMPLE },
  "navbar-minimal-slot":           { schema: NAVBAR_MINIMAL_SCHEMA,           template: NAVBAR_MINIMAL_TEMPLATE,           example: NAVBAR_MINIMAL_EXAMPLE },
  "features-bento-slot":           { schema: FEATURES_BENTO_SCHEMA,           template: FEATURES_BENTO_TEMPLATE,           example: FEATURES_BENTO_EXAMPLE },
  "pricing-tiers-slot":            { schema: PRICING_TIERS_SCHEMA,            template: PRICING_TIERS_TEMPLATE,            example: PRICING_TIERS_EXAMPLE },
  "footer-editorial-slot":         { schema: FOOTER_EDITORIAL_SCHEMA,         template: FOOTER_EDITORIAL_TEMPLATE,         example: FOOTER_EDITORIAL_EXAMPLE },
  // Industry variants — the planner picks these when industry + theme match.
  "hero-restaurant-warm-slot":     { schema: HERO_RESTAURANT_WARM_SCHEMA,     template: HERO_RESTAURANT_WARM_TEMPLATE,     example: HERO_RESTAURANT_WARM_EXAMPLE },
  "hero-portfolio-editorial-slot": { schema: HERO_PORTFOLIO_EDITORIAL_SCHEMA, template: HERO_PORTFOLIO_EDITORIAL_TEMPLATE, example: HERO_PORTFOLIO_EDITORIAL_EXAMPLE },
};

function isSlotLockedEnabled(req: NextRequest): boolean {
  const url = new URL(req.url);
  if (url.searchParams.get("slotLocked") === "1") return true;
  if (req.headers.get("x-slot-locked") === "1") return true;
  if (process.env.SLOT_LOCKED_DEFAULT === "1") return true;
  return false;
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!isSlotLockedEnabled(req)) {
    return new Response(
      JSON.stringify({
        error: "Slot-locked generation is opt-in. Pass ?slotLocked=1 or x-slot-locked: 1 header.",
        hint: "This endpoint is in active development. Default builds still use /api/generate/react-stream.",
      }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const prompt = (body.prompt || "").trim();
  const brandName = (body.brandName || "").trim();

  // Component selection priority:
  //   1. Explicit componentIds in the request (legacy + power-user path)
  //   2. Auto-plan from (industry, theme) via planPageForIndustry — B7 path
  //   3. Default fallback: 5-component generic landing page
  const componentIds =
    body.componentIds && body.componentIds.length > 0
      ? body.componentIds
      : (body.industry || body.theme)
        ? planPageForIndustry({
            industry: body.industry,
            theme: body.theme,
            includePricing: body.includePricing,
          })
        : [
            "navbar-minimal-slot",
            "hero-spotlight-slot",
            "features-bento-slot",
            "pricing-tiers-slot",
            "footer-editorial-slot",
          ];

  if (!body.useExampleFill && !prompt) {
    return new Response(JSON.stringify({ error: "prompt is required (or set useExampleFill: true)" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Quota + plan resolution — same gating as react-stream.
  const plan = getPlanFromRequest(req);
  const userEmail = req.headers.get("x-user-email") || null;
  const quotaPlan: QuotaPlan =
    plan === "pro" || plan === "agency" || plan === "free" || plan === "creator"
      ? (plan as QuotaPlan)
      : "free";
  const quota = await checkBuildQuota(userEmail, quotaPlan);
  if (!quota.ok) {
    return new Response(
      JSON.stringify({
        error: quota.reason || "Daily build budget reached.",
        resetsAt: quota.resetsAtIso,
      }),
      { status: 429, headers: { "content-type": "application/json", "retry-after": "3600" } },
    );
  }

  const buildId = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const telemetry = new TelemetryRecorder({
    buildId,
    endpoint: "slot-stream",
    prompt,
    userEmail,
    userPlan: plan,
    mode: "slot",
    theme: null,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        const payload = JSON.stringify({ type: event, ...data });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // Inner helper: run the AI customiser for one component and
      // return its slot-fill. Validation failures fall back to the
      // canned example (the build never returns broken code).
      const aiCustomise = async (
        componentId: string,
        entry: typeof SLOT_REGISTRY[string],
      ): Promise<SlotValueMap> => {
        const brandBrief = `Brand: ${brandName || "(none provided)"}. User prompt: ${prompt}`;
        const aiPrompt = schemaToPrompt(entry.schema, brandBrief);
        const aiStart = Date.now();
        const fb = await callLLMWithFailover(
          {
            model: "claude-haiku-4-5",
            system:
              "You are filling in the slots of a hand-written React component template. " +
              "Output ONLY a valid JSON object matching the schema. No prose, no markdown fences, no explanation.",
            userMessage: aiPrompt,
            maxTokens: 2000,
          },
          (provider, model) => {
            send("fallback", { provider, model, componentId });
          },
        );
        telemetry.model({
          step: `customise:${componentId}`,
          provider: fb.provider || "unknown",
          model: fb.model || "unknown",
          inputTokens: fb.inputTokens,
          outputTokens: fb.outputTokens,
          latencyMs: Date.now() - aiStart,
        });

        const validation = validateEditJson(fb.text);
        if (!validation.ok || !validation.data) {
          send("warning", {
            kind: "ai-validation-failed",
            componentId,
            reason: validation.reason,
            message: `AI output failed validation; using example fill for ${componentId}.`,
          });
          telemetry.fail({ id: componentId, reason: validation.reason || "validation-failed" });
          return entry.example;
        }
        // validateEditJson returns `{ files: … }`; we want the raw
        // slot object, so re-parse the model's first JSON block.
        try {
          const startIdx = fb.text.indexOf("{");
          const endIdx = fb.text.lastIndexOf("}");
          return JSON.parse(fb.text.slice(startIdx, endIdx + 1)) as SlotValueMap;
        } catch {
          return entry.example;
        }
      };

      try {
        send("phase", { phase: "starting", message: "Slot-locked generation: filling component schemas." });
        const filesOut: Record<string, string> = {};
        const summarySlots: Record<string, SlotValueMap> = {};
        let okCount = 0;
        let cacheHits = 0;

        for (const componentId of componentIds) {
          const entry = SLOT_REGISTRY[componentId];
          if (!entry) {
            send("warning", {
              kind: "unknown-component",
              componentId,
              message: `Component "${componentId}" not in slot-locked registry yet — skipping.`,
            });
            telemetry.fail({ id: componentId, reason: "not-in-slot-registry" });
            continue;
          }

          let filledSlots: SlotValueMap;

          if (body.useExampleFill) {
            // Smoke / cache-warm path — assemble from the canned example
            // without invoking any LLM. Useful for testing the template +
            // schema pipeline end-to-end.
            filledSlots = entry.example;
            send("phase", {
              phase: "example-fill",
              componentId,
              message: `Using example fill for ${componentId} (no LLM call).`,
            });
          } else {
            // Cache lookup unless explicitly bypassed. At scale ~30% of
            // prompts hit a cached slot-fill from a semantically similar
            // prior build. Hit = zero AI cost, <50ms response.
            const cacheLookup = body.bypassCache
              ? { hit: false, cacheKey: "" }
              : await lookupSlotCache({
                  componentId,
                  theme: body.theme || "editorial",
                  industry: body.industry || "other",
                  brandName: brandName || "",
                  prompt,
                });

            if (cacheLookup.hit && cacheLookup.slotFill) {
              // Patch brand-specific slots so the cached fill works for
              // THIS customer's brand instead of the one it was generated for.
              filledSlots = remapBrandSlots(cacheLookup.slotFill, {
                brandName,
                copyrightYear: new Date().getUTCFullYear(),
              });
              cacheHits++;
              send("phase", {
                phase: "cache-hit",
                componentId,
                cacheKey: cacheLookup.cacheKey,
                message: `Cache hit for ${componentId} (no AI call needed).`,
              });
            } else {
              // Cache miss (or bypass) — call the AI customiser and
              // persist the fresh fill for future cache hits.
              filledSlots = await aiCustomise(componentId, entry);
              if (cacheLookup.cacheKey) {
                await persistSlotCache({
                  cacheKey: cacheLookup.cacheKey,
                  componentId,
                  slotFill: filledSlots,
                });
              }
            }
          }

          // Deterministic assembly. If THIS fails, the AI's slot fill
          // was beyond what we can recover — log + use the example.
          const assemblyStart = Date.now();
          const result = assembleComponent({
            template: entry.template,
            schema: entry.schema,
            slots: filledSlots,
          });
          telemetry.phase(`assemble:${componentId}`, Date.now() - assemblyStart);

          if (!result.ok) {
            send("warning", {
              kind: "assembly-failed",
              componentId,
              reason: result.reason,
            });
            telemetry.fail({ id: componentId, reason: result.reason || "assembly-failed" });
            // Last-resort: assemble the example.
            const exampleResult = assembleComponent({
              template: entry.template,
              schema: entry.schema,
              slots: entry.example,
            });
            if (exampleResult.ok && exampleResult.code) {
              filesOut[`components/${componentId}.tsx`] = exampleResult.code;
            }
            continue;
          }

          filesOut[`components/${componentId}.tsx`] = result.code!;
          summarySlots[componentId] = filledSlots;
          okCount++;

          send("component-ready", {
            componentId,
            warningCount: result.warnings.length,
            filledFromDefault: result.filledFromDefault,
          });
        }

        // ── PHASE 4: critique (B9 — multi-judge panel) ──
        // Three small specialists (typography / copy / layout) score
        // the assembled site in parallel. If any axis returns blockers
        // or score <60, the verdict is surfaced via SSE warning events
        // so the UI can show "Layout critic flagged 2 mobile issues —
        // regenerating layout slots…". The actual targeted repair pass
        // ships in the next commit; today we report.
        let qualityScore: number | null = null;
        if (okCount > 0 && !body.skipCritique) {
          try {
            send("phase", { phase: "critique", message: "Multi-judge critique (typography / copy / layout)…" });
            // Build a compact site summary the critics can score against.
            // Sending raw component code is too much input; instead we
            // pass the slot-fills + component ids so the critic can
            // reason about copy/structure without the JSX boilerplate.
            const summary = JSON.stringify(
              Object.entries(summarySlots).map(([id, slots]) => ({ component: id, slots })),
              null,
              2,
            ).slice(0, 12_000);
            const critiqueStart = Date.now();
            const verdict = await critiquePanel(summary);
            telemetry.phase("critique", Date.now() - critiqueStart);
            qualityScore = verdict.overall;
            for (const v of verdict.verdicts) {
              if (v.skipped) continue;
              send("critique", {
                axis: v.axis,
                score: v.score,
                findings: v.findings,
              });
            }
            const repairAxes = axesNeedingRepair(verdict);
            if (repairAxes.length > 0) {
              send("warning", {
                kind: "needs-repair",
                axes: repairAxes,
                overall: verdict.overall,
                message: `Critique flagged: ${repairAxes.join(", ")}. Targeted repair pass coming in next commit.`,
              });
            }
          } catch (critErr) {
            // Critique is best-effort — failure doesn't block ship.
            console.warn("[slot-stream] critique panel failed:", critErr instanceof Error ? critErr.message : critErr);
          }
        }

        send("done", {
          files: filesOut,
          componentsOk: okCount,
          cacheHits,
          cacheHitRate: componentIds.length > 0 ? cacheHits / componentIds.length : 0,
          slots: summarySlots,
          qualityScore,
        });
        await telemetry.finalize({ ok: okCount > 0, qualityScore });
        await recordBuildQuotaUsage(userEmail, [
          { model: "claude-haiku-4-5", inputTokens: 0, outputTokens: 0 },
        ]);
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { message, hint: "Slot-locked generation failed unexpectedly. Reverting to react-stream is safe." });
        await telemetry.finalize({ ok: false, errorKind: "slot-stream-fatal", errorMessage: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
