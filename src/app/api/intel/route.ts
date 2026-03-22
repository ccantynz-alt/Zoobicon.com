import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "matrix";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const days = parseInt(searchParams.get("days") || "7", 10);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      alerts: [],
      trends: [],
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (type === "alerts") {
      const alerts = await sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return NextResponse.json({ alerts });
    }

    if (type === "trends") {
      const trends = await sql`
        SELECT id, source, title, url, relevance_score, summary, tags, created_at
        FROM market_trends
        WHERE created_at > NOW() - MAKE_INTERVAL(days => ${days})
        ORDER BY relevance_score DESC
      `;
      return NextResponse.json({ trends });
    }

    // type=matrix or default: return both
    const [alerts, trends] = await Promise.all([
      sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        ORDER BY created_at DESC
        LIMIT ${limit}
      `,
      sql`
        SELECT id, source, title, url, relevance_score, summary, tags, created_at
        FROM market_trends
        WHERE created_at > NOW() - MAKE_INTERVAL(days => ${days})
        ORDER BY relevance_score DESC
      `,
    ]);

    return NextResponse.json({ alerts, trends });
  } catch (error) {
    console.error("Intel API error:", error);
    return NextResponse.json({ alerts: [], trends: [] });
  }
}
