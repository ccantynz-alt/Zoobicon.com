import { NextResponse } from "next/server";
import { isCarrier, trackShipment } from "@/lib/shipping";

export const runtime = "nodejs";

interface IncomingBody {
  carrier?: unknown;
  trackingNumber?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { carrier, trackingNumber } = body;
  if (!isCarrier(carrier)) {
    return NextResponse.json({ error: "carrier must be one of nzpost|auspost|usps|ups|fedex|dhl" }, { status: 400 });
  }
  if (typeof trackingNumber !== "string" || trackingNumber.trim().length === 0) {
    return NextResponse.json({ error: "trackingNumber must be a non-empty string" }, { status: 400 });
  }

  const result = trackShipment(carrier, trackingNumber.trim());
  return NextResponse.json({ ok: true, tracking: result });
}
