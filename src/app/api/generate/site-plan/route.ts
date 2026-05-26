/**
 * POST /api/generate/site-plan
 *
 * Multi-page site planner. The user types one prompt describing the full
 * site they want; we return a structured plan (brand + sitemap + per-page
 * sections + backend needs + cost/time estimates) for them to review and
 * approve BEFORE we spend the expensive build budget.
 *
 * Phase 1 (this route): return the plan. UI presents it for review.
 * Phase 2 (next session): consume the plan + run N parallel react-stream
 * builds, one per page, sharing brand kit + shared navbar/footer.
 *
 * Body:    { prompt: string }
 * Returns: { plan: SitePlan, source: "llm" | "fallback", modelUsed?: string }
 *
 * Cost: ~$0.001 per plan when the LLM is healthy.
 * Auth: open (no quota gate yet — this is cheap). The expensive build
 * step will check quota in Phase 2.
 */

import { NextRequest, NextResponse } from "next/server";
import { planSite } from "@/lib/site-planner";
import { authenticateRequest } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RequestBody {
  prompt?: string;
}

export async function POST(req: NextRequest) {
  // Light auth check — we want the user's email for telemetry / dedup,
  // but anonymous users can still plan. Auth guard returns a sane
  // default user object when no token is present.
  await authenticateRequest(req);

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON. Expected { prompt: string }" },
      { status: 400 },
    );
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 },
    );
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "prompt is too long (max 4000 chars)" },
      { status: 400 },
    );
  }

  try {
    const result = await planSite(prompt);
    return NextResponse.json(result);
  } catch (err) {
    // planSite already swallows LLM failures into the heuristic fallback,
    // so reaching this catch means a hard programmer error. Surface it
    // honestly rather than silently returning a placeholder.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[site-plan] unexpected failure:", message);
    return NextResponse.json(
      { error: "Planner failed unexpectedly. Please try again.", detail: message.slice(0, 200) },
      { status: 500 },
    );
  }
}
