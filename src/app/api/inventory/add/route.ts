import { NextRequest, NextResponse } from "next/server";
import { addProduct } from "@/lib/inventory";

export const runtime = "nodejs";

interface AddBody {
  userId?: unknown;
  sku?: unknown;
  name?: unknown;
  price_cents?: unknown;
  stock?: unknown;
  reorderLevel?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as AddBody;
    if (
      typeof body.userId !== "string" ||
      typeof body.sku !== "string" ||
      typeof body.name !== "string" ||
      typeof body.price_cents !== "number" ||
      typeof body.stock !== "number" ||
      typeof body.reorderLevel !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const product = await addProduct({
      userId: body.userId,
      sku: body.sku,
      name: body.name,
      price_cents: body.price_cents,
      stock: body.stock,
      reorderLevel: body.reorderLevel,
    });
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
