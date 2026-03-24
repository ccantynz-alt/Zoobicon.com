import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/agents/cron — Run all scheduled agents that are due
//
// Designed to be called by an external scheduler:
// - Vercel Cron (vercel.json)
// - Railway Cron
// - GitHub Actions
// - Any HTTP-based cron service
//
// Recommended: Call every 5 minutes. The framework handles per-agent
// scheduling internally (each agent has its own interval).
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro max

export async function GET() {
  const startedAt = Date.now();

  try {
    const { runScheduledAgents } = await import("@/agents");
    const result = await runScheduledAgents();

    return NextResponse.json({
      ...result,
      duration: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Cron run failed",
        duration: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
