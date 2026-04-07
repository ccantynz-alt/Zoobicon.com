import { NextResponse } from "next/server";
import { calculateRate, isCarrier, type Dimensions, type RateRequest } from "@/lib/shipping";

export const runtime = "nodejs";

interface IncomingBody {
  fromZip?: unknown;
  toZip?: unknown;
  weightKg?: unknown;
  dimensions?: unknown;
  carrier?: unknown;
}

function parseDimensions(value: unknown): Dimensions | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const l = v.lengthCm;
  const w = v.widthCm;
  const h = v.heightCm;
  if (typeof l !== "number" || typeof w !== "number" || typeof h !== "number") return null;
  if (l <= 0 || w <= 0 || h <= 0) return null;
  return { lengthCm: l, widthCm: w, heightCm: h };
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fromZip, toZip, weightKg, dimensions, carrier } = body;
  if (typeof fromZip !== "string" || typeof toZip !== "string") {
    return NextResponse.json({ error: "fromZip and toZip must be strings" }, { status: 400 });
  }
  if (typeof weightKg !== "number" || weightKg <= 0) {
    return NextResponse.json({ error: "weightKg must be a positive number" }, { status: 400 });
  }
  const dims = parseDimensions(dimensions);
  if (!dims) {
    return NextResponse.json({ error: "dimensions must include positive lengthCm/widthCm/heightCm" }, { status: 400 });
  }
  if (!isCarrier(carrier)) {
    return NextResponse.json({ error: "carrier must be one of nzpost|auspost|usps|ups|fedex|dhl" }, { status: 400 });
  }

  const rateReq: RateRequest = { fromZip, toZip, weightKg, dimensions: dims, carrier };
  const result = calculateRate(rateReq);
  return NextResponse.json({ ok: true, rate: result });
}
