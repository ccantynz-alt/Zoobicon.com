import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 30;

interface AnalyticsStats {
  pageviews?: number;
  visitors?: number;
  bounce_rate?: number;
  top_pages?: Array<{ url: string; views: number }>;
  referrers?: Array<{ source: string; visits: number }>;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { stats } = await req.json();

    if (!stats || typeof stats !== "object") {
      return apiError(400, "missing_stats", "stats object is required");
    }

    const analyticsStats = stats as AnalyticsStats;

    // Build a human-readable summary of the stats for the AI
    const statLines: string[] = [];
    if (analyticsStats.pageviews !== undefined) statLines.push(`Total pageviews: ${analyticsStats.pageviews.toLocaleString()}`);
    if (analyticsStats.visitors !== undefined) statLines.push(`Unique visitors: ${analyticsStats.visitors.toLocaleString()}`);
    if (analyticsStats.bounce_rate !== undefined) statLines.push(`Bounce rate: ${analyticsStats.bounce_rate}%`);
    if (analyticsStats.top_pages && analyticsStats.top_pages.length > 0) {
      statLines.push("Top pages:");
      analyticsStats.top_pages.slice(0, 5).forEach(p => {
        statLines.push(`  - ${p.url}: ${p.views.toLocaleString()} views`);
      });
    }
    if (analyticsStats.referrers && analyticsStats.referrers.length > 0) {
      statLines.push("Top referrers:");
      analyticsStats.referrers.slice(0, 5).forEach(r => {
        statLines.push(`  - ${r.source}: ${r.visits.toLocaleString()} visits`);
      });
    }

    // Include any other stats provided
    const knownKeys = ["pageviews", "visitors", "bounce_rate", "top_pages", "referrers"];
    for (const [key, value] of Object.entries(analyticsStats)) {
      if (!knownKeys.includes(key) && value !== undefined && value !== null) {
        statLines.push(`${key.replace(/_/g, " ")}: ${String(value)}`);
      }
    }

    if (statLines.length === 0) {
      return apiError(400, "empty_stats", "stats object must contain at least one metric");
    }

    const systemPrompt = `You are a friendly website analytics consultant who explains data in plain, jargon-free English.
Non-technical website owners are reading this. Avoid technical terms. If you must use one, explain it.
Return ONLY valid JSON — no markdown, no explanation:
{
  "summary": "<2-3 sentence plain English summary of what the data shows overall>",
  "insights": [
    "<specific observation about the data>",
    "<another observation>",
    "<third observation>"
  ],
  "recommendations": [
    "<specific actionable recommendation based on the data>",
    "<another recommendation>",
    "<third recommendation>"
  ]
}
Be specific to the numbers provided. If bounce rate is high, say what a good rate looks like. Reference actual numbers.`;

    const userPrompt = `Analytics data to explain:\n${statLines.join("\n")}`;

    const response = await callAI(systemPrompt, userPrompt, 800);

    let result: { summary: string; insights: string[]; recommendations: string[] };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      result = {
        summary: `Your site received ${analyticsStats.pageviews?.toLocaleString() || "some"} pageviews from ${analyticsStats.visitors?.toLocaleString() || "several"} visitors.`,
        insights: ["Your traffic data has been recorded and is being analyzed."],
        recommendations: ["Continue publishing quality content to grow your traffic."],
      };
    }

    if (!Array.isArray(result.insights)) result.insights = [];
    if (!Array.isArray(result.recommendations)) result.recommendations = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-analytics]", error);
    return apiError(500, "analytics_failed", "Analytics explanation failed");
  }
}
