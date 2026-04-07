import { NextResponse } from "next/server";
import { estimateDeliveryDays, isCarrier, zoneCalculator } from "@/lib/shipping";

export const runtime = "nodejs";

interface IncomingBody {
  from?: unknown;
  to?: unknown;
  carrier?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { from, to, carrier } = body;
  if (typeof from !== "string" || typeof to !== "string") {
    return NextResponse.json({ error: "from and to must be strings" }, { status: 400 });
  }
  if (!isCarrier(carrier)) {
    return NextResponse.json({ error: "carrier must be one of nzpost|auspost|usps|ups|fedex|dhl" }, { status: 400 });
  }

  const days = estimateDeliveryDays(from, to, carrier);
  const zone = zoneCalculator(from, to);
  return NextResponse.json({ ok: true, estimate: { carrier, from, to, zone, estimatedDays: days } });
}
