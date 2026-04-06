import { NextRequest } from "next/server";
import { authenticateWordPressRequest, apiResponse, apiError } from "@/lib/wordpress-api";

export async function GET(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  // Usage tracking — in production this would query the database
  // For now return plan-based limits
  const planLimits: Record<string, number> = {
    free: 50,
    pro: 999999,
    enterprise: 999999,
  };

  const limit = planLimits[auth.plan] || 50;

  return apiResponse({
    plan: auth.plan,
    used: 0, // TODO: Track per-key monthly usage in database
    limit,
    period: "monthly",
    resets_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  });
}
