import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const address = new URL(req.url).searchParams.get("address") ?? "";
    if (!address.trim()) {
      return NextResponse.json({ error: "address query param required" }, { status: 400 });
    }
    const result = await geocodeAddress(address);
    if (!result) {
      return NextResponse.json({ error: "no results" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "geocode failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
