import { NextRequest, NextResponse } from "next/server";
import { nearbyCities } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const params = new URL(req.url).searchParams;
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const radius = Number(params.get("radius") ?? "500");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "lat and lng (numbers) required" }, { status: 400 });
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      return NextResponse.json({ error: "radius must be a positive number" }, { status: 400 });
    }
    const cities = nearbyCities(lat, lng, radius);
    return NextResponse.json({ count: cities.length, radiusKm: radius, cities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "nearby failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
