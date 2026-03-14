import { NextRequest, NextResponse } from "next/server";
import { searchDomains, getAllTldPricing } from "@/lib/domain-reseller";

// ---------------------------------------------------------------------------
// GET /api/domains/search?q=...&tlds=com,io,ai
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const tldsParam = req.nextUrl.searchParams.get("tlds");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "q query parameter is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    // Sanitize query
    const sanitized = query
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 63);

    if (!sanitized) {
      return NextResponse.json(
        { error: "Invalid domain name. Use only letters, numbers, and hyphens." },
        { status: 400 }
      );
    }

    const tlds = tldsParam
      ? tldsParam.split(",").map((t) => t.trim().toLowerCase())
      : undefined;

    const results = await searchDomains(sanitized, tlds);

    return NextResponse.json({
      query: sanitized,
      results,
      count: results.length,
      available: results.filter((r) => r.available).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains/search — Search with more options
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, tlds, showPricing } = body as {
      query?: string;
      tlds?: string[];
      showPricing?: boolean;
    };

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "query is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const sanitized = query
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 63);

    const results = await searchDomains(sanitized, tlds);

    const response: Record<string, unknown> = {
      query: sanitized,
      results,
      count: results.length,
      available: results.filter((r) => r.available).length,
    };

    if (showPricing) {
      response.pricing = getAllTldPricing();
    }

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
