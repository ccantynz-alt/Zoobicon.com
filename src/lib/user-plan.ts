/**
 * User plan resolution — single source of truth for "should this generation
 * be watermarked / rate-limited / feature-gated?"
 *
 * Three concentric tiers from cheapest to most permissive:
 *   - free          → watermark on output, capped concurrency, public sites only
 *   - starter / pro → no watermark, custom domains, full feature set
 *   - agency / wl   → adds bulk operations, white-label, agency dashboard
 *
 * Plan is resolved (in order of authority):
 *   1. x-zoobicon-plan request header (set by the trusted server-side layer
 *      once we wire Stripe → DB plan lookup; today this is set by the
 *      client from localStorage.zoobicon_user.plan as a temporary signal)
 *   2. x-admin header (admins always count as agency)
 *   3. Default → "free"
 *
 * NB: This is intentionally trust-the-client for the moment. The watermark
 * is a conversion lever, not a security boundary. Once Stripe webhooks
 * write the plan into the users table, swap step 1 for a server-side
 * lookup keyed off the auth cookie.
 */

import type { NextRequest } from "next/server";

export type Plan = "free" | "starter" | "pro" | "agency" | "white-label";

const PAID_PLANS: ReadonlyArray<Plan> = ["starter", "pro", "agency", "white-label"];

const ALL_PLANS: ReadonlySet<Plan> = new Set([
  "free",
  "starter",
  "pro",
  "agency",
  "white-label",
]);

function normalizePlan(raw: string | null | undefined): Plan {
  if (!raw) return "free";
  const v = raw.toLowerCase().trim() as Plan;
  return ALL_PLANS.has(v) ? v : "free";
}

/** Resolve the plan from a server-side Next request. */
export function getPlanFromRequest(req: NextRequest): Plan {
  const explicit = req.headers.get("x-zoobicon-plan");
  if (explicit) return normalizePlan(explicit);
  // Admin header — set by the builder for admin users — short-circuits to
  // the most permissive tier so admins never see the free-tier UI.
  if (req.headers.get("x-admin") === "true") return "agency";
  return "free";
}

/** Client-side plan resolution for the builder UI. */
export function getClientPlan(): Plan {
  if (typeof window === "undefined") return "free";
  try {
    const raw = localStorage.getItem("zoobicon_user");
    if (!raw) return "free";
    const parsed = JSON.parse(raw) as { plan?: string };
    return normalizePlan(parsed.plan ?? null);
  } catch {
    return "free";
  }
}

/** Header to send from the builder so the API knows the user's plan. */
export function planHeader(plan: Plan): Record<string, string> {
  return { "x-zoobicon-plan": plan };
}

/** True if this plan is paid (no watermark, full features). */
export function isPaidPlan(plan: Plan): boolean {
  return PAID_PLANS.includes(plan);
}

/** True if this plan should see a "built with Zoobicon" badge in output. */
export function shouldWatermark(plan: Plan): boolean {
  return !isPaidPlan(plan);
}

/** Friendly label for the plan banner in the UI. */
export function planLabel(plan: Plan): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "agency":
      return "Agency";
    case "white-label":
      return "White-label";
    default:
      return "Free";
  }
}
