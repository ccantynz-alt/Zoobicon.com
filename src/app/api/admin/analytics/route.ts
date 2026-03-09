import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Admin Analytics API
 *
 * GET /api/admin/analytics → platform-wide statistics
 */

export async function GET() {
  try {
    // Run all queries in parallel
    const [
      userCount,
      projectCount,
      siteCount,
      deploymentCount,
      recentUsers,
      recentProjects,
      planDistribution,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM users`.catch(() => [{ count: 0 }]),
      sql`SELECT COUNT(*)::int as count FROM projects`.catch(() => [{ count: 0 }]),
      sql`SELECT COUNT(*)::int as count FROM sites`.catch(() => [{ count: 0 }]),
      sql`SELECT COUNT(*)::int as count FROM deployments`.catch(() => [{ count: 0 }]),
      sql`SELECT email, name, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10`.catch(() => []),
      sql`SELECT name, user_email, created_at FROM projects ORDER BY created_at DESC LIMIT 10`.catch(() => []),
      sql`SELECT plan, COUNT(*)::int as count FROM users GROUP BY plan ORDER BY count DESC`.catch(() => []),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: userCount[0]?.count || 0,
        totalProjects: projectCount[0]?.count || 0,
        totalSites: siteCount[0]?.count || 0,
        totalDeployments: deploymentCount[0]?.count || 0,
      },
      recentUsers,
      recentProjects,
      planDistribution,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return NextResponse.json({
      stats: { totalUsers: 0, totalProjects: 0, totalSites: 0, totalDeployments: 0 },
      recentUsers: [],
      recentProjects: [],
      planDistribution: [],
      dbError: true,
    });
  }
}
