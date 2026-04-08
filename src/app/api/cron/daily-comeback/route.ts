import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface NightlySummary {
  processed: number;
  successes: number;
  failures: number;
  details?: unknown;
}

async function authorize(req: NextRequest): Promise<NextResponse | null> {
  if (req.headers.get("x-vercel-cron")) return null;
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 503 }
    );
  }
  const unauth = await authorize(req);
  if (unauth) return unauth;

  try {
    const mod = (await import("@/lib/daily-comeback")) as {
      runAllNightly: () => Promise<NightlySummary>;
    };
    const summary = await mod.runAllNightly();
    return NextResponse.json({
      ok: true,
      processed: summary.processed,
      successes: summary.successes,
      failures: summary.failures,
      details: summary.details ?? null,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Nightly run failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
