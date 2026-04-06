import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-middleware";
import { sql } from "@/lib/db";

/**
 * GET /api/v1/status — API health check and account status
 *
 * Headers:
 *   Authorization: Bearer zbk_live_...
 *
 * Response:
 *   {
 *     data: {
 *       status: "operational",
 *       plan: string,
 *       rate_limit: { limit, remaining, window_ms },
 *       usage: { sites_count, deployments_count, generations_count },
 *       endpoints: [...],
 *       version: "1.0.0"
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    // Gather usage stats
    const [sitesCount] = await sql`
      SELECT COUNT(*)::int as count FROM sites WHERE email = 'api@zoobicon.com'
    `;
    const [deploymentsCount] = await sql`
      SELECT COUNT(*)::int as count FROM deployments d
      JOIN sites s ON d.site_id = s.id
      WHERE s.email = 'api@zoobicon.com'
    `;
    const [generationsCount] = await sql`
      SELECT COUNT(*)::int as count FROM projects WHERE user_email = 'api@zoobicon.com'
    `;

    const rateLimits: Record<string, { limit: number; window_ms: number }> = {
      free: { limit: 10, window_ms: 60_000 },
      pro: { limit: 60, window_ms: 60_000 },
      enterprise: { limit: 600, window_ms: 60_000 },
    };

    const planLimit = rateLimits[auth.plan] || rateLimits.free;

    return apiResponse({
      status: "operational",
      plan: auth.plan,
      rate_limit: {
        limit: planLimit.limit,
        window_ms: planLimit.window_ms,
      },
      usage: {
        sites_count: sitesCount?.count || 0,
        deployments_count: deploymentsCount?.count || 0,
        generations_count: generationsCount?.count || 0,
      },
      endpoints: [
        { method: "POST", path: "/api/v1/generate", description: "Generate a website from a prompt" },
        { method: "GET", path: "/api/v1/sites", description: "List your deployed sites" },
        { method: "PUT", path: "/api/v1/sites", description: "Update site HTML" },
        { method: "DELETE", path: "/api/v1/sites", description: "Deactivate a site" },
        { method: "POST", path: "/api/v1/deploy", description: "Deploy HTML to zoobicon.sh" },
        { method: "GET", path: "/api/v1/deploy", description: "Get deployment history" },
        { method: "GET", path: "/api/v1/status", description: "API status and account info" },
      ],
      version: "1.0.0",
    });
  } catch (err) {
    console.error("v1/status error:", err);
    return apiError(500, "status_failed", "Failed to fetch status");
  }
}
