import { NextRequest, NextResponse } from "next/server";
import { distance } from "@/lib/geo";

export const runtime = "nodejs";

interface DistanceBody {
  lat1?: number;
  lng1?: number;
  lat2?: number;
  lng2?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as DistanceBody;
    const { lat1, lng1, lat2, lng2 } = body;
    if (
      typeof lat1 !== "number" ||
      typeof lng1 !== "number" ||
      typeof lat2 !== "number" ||
      typeof lng2 !== "number"
    ) {
      return NextResponse.json(
        { error: "lat1, lng1, lat2, lng2 (numbers) required" },
        { status: 400 },
      );
    }
    const km = distance(lat1, lng1, lat2, lng2);
    return NextResponse.json({
      km: Math.round(km * 1000) / 1000,
      miles: Math.round(km * 0.621371 * 1000) / 1000,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
