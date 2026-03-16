import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { checkGenerationLimit, getCurrentPeriod, getAgencyPlanLimits } from "@/lib/agency-limits";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * GET /api/agencies/[agencyId]/generations
 * Returns current month's generation count and limit
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const period = getCurrentPeriod();

    const [agency] = await sql`SELECT plan FROM agencies WHERE id = ${agencyId}`;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    const [countResult] = await sql`
      SELECT COUNT(*)::int as count FROM agency_generations
      WHERE agency_id = ${agencyId} AND period = ${period}
    `;

    const current = countResult?.count || 0;
    const limits = getAgencyPlanLimits(agency.plan);

    return Response.json({
      period,
      current,
      limit: limits.monthlyGenerations,
      remaining: Math.max(0, limits.monthlyGenerations - current),
      plan: agency.plan,
    });
  } catch (err) {
    console.error("Error fetching generation count:", err);
    return Response.json({ error: "Failed to fetch generation count" }, { status: 500 });
  }
}

/**
 * POST /api/agencies/[agencyId]/generations
 * Records a new generation and checks quota
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const { userEmail, generatorType } = await req.json();

    const [agency] = await sql`SELECT plan FROM agencies WHERE id = ${agencyId}`;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    const period = getCurrentPeriod();

    // Count current month's generations
    const [countResult] = await sql`
      SELECT COUNT(*)::int as count FROM agency_generations
      WHERE agency_id = ${agencyId} AND period = ${period}
    `;

    const current = countResult?.count || 0;
    const check = checkGenerationLimit(agency.plan, current);

    if (!check.allowed) {
      return Response.json({
        error: check.reason,
        current: check.current,
        limit: check.limit,
      }, { status: 429 });
    }

    // Record the generation
    await sql`
      INSERT INTO agency_generations (agency_id, user_email, generator_type, period)
      VALUES (${agencyId}, ${userEmail || ""}, ${generatorType || "website"}, ${period})
    `;

    return Response.json({
      recorded: true,
      current: current + 1,
      limit: check.limit,
      remaining: Math.max(0, check.limit - current - 1),
    });
  } catch (err) {
    console.error("Error recording generation:", err);
    return Response.json({ error: "Failed to record generation" }, { status: 500 });
  }
}
