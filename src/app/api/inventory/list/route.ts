import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/inventory";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const products = await listProducts(userId, search);
    return NextResponse.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
