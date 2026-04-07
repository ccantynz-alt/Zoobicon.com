import { NextResponse } from "next/server";
import {
  computeRfm,
  type Customer,
  type SegmentName,
  type RfmScore,
} from "@/lib/customer-segmentation";

export const runtime = "nodejs";

interface ComputeBody {
  ownerId: string;
  customers: Customer[];
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: ComputeBody;
  try {
    body = (await req.json()) as ComputeBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body.ownerId || !Array.isArray(body.customers)) {
    return NextResponse.json(
      { error: "ownerId and customers[] required" },
      { status: 400 }
    );
  }

  const scores = computeRfm(body.customers);
  const summary: Record<SegmentName, number> = {
    Champions: 0,
    Loyal: 0,
    "Potential Loyalists": 0,
    "New Customers": 0,
    "At Risk": 0,
    "Cant Lose Them": 0,
    Hibernating: 0,
    Lost: 0,
  };
  const out: Record<string, RfmScore> = {};
  scores.forEach((v, k) => {
    out[k] = v;
    summary[v.segment] += 1;
  });

  return NextResponse.json({ scores: out, summary });
}
