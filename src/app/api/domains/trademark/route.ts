import { NextRequest, NextResponse } from "next/server";
import { assessTrademarks } from "@/lib/trademark-check";

// ---------------------------------------------------------------------------
// POST /api/domains/trademark
// Body: { names: string[] }
// Returns: { results: TrademarkResult[] }
//
// Screens a batch of candidate brand names for trademark risk. Uses a
// hardcoded blocklist of top-500 global trademarks for instant hits,
// then a Haiku pass for "confusingly similar" judgment on the rest.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.names)) {
      return NextResponse.json(
        { error: "Body must be { names: string[] }" },
        { status: 400 },
      );
    }
    const names: string[] = body.names
      .filter((n: unknown): n is string => typeof n === "string")
      .map((n: string) => n.trim())
      .filter(Boolean)
      .slice(0, 40);

    if (names.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await assessTrademarks(names, { timeoutMs: 14_000 });
    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
