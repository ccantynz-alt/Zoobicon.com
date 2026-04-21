import { NextRequest, NextResponse } from "next/server";
import { adjustStock } from "@/lib/inventory";

export const runtime = "nodejs";

interface AdjustBody {
  productId?: unknown;
  delta?: unknown;
  reason?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as AdjustBody;
    if (
      typeof body.productId !== "string" ||
      typeof body.delta !== "number" ||
      typeof body.reason !== "string"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const product = await adjustStock(body.productId, body.delta, body.reason);
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
