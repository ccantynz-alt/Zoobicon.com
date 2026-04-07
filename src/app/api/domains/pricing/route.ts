import { NextRequest, NextResponse } from "next/server";
import {
  getWholesaleCost,
  getRetailPrice,
  bulkPriceOptimizer,
  getDemandTier,
} from "@/lib/domain-pricing";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const tld = req.nextUrl.searchParams.get("tld");
  if (!tld) {
    return NextResponse.json({ error: "Missing ?tld param" }, { status: 400 });
  }
  try {
    const wholesale = getWholesaleCost(tld);
    const tier = getDemandTier(tld);
    const marginPct = tier === "premium" ? 60 : tier === "budget" ? 80 : 35;
    const retail = getRetailPrice(tld, marginPct);
    return NextResponse.json({
      tld: tld.replace(/^\./, "").toLowerCase(),
      wholesale,
      retail,
      marginPct,
      demandTier: tier,
      currency: "USD",
      unit: "cents",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("tlds" in body) ||
    !Array.isArray((body as { tlds: unknown }).tlds)
  ) {
    return NextResponse.json({ error: "Body must be { tlds: string[] }" }, { status: 400 });
  }
  const tlds = (body as { tlds: unknown[] }).tlds.filter(
    (x): x is string => typeof x === "string",
  );
  const results = bulkPriceOptimizer(tlds);
  return NextResponse.json({ results, currency: "USD", unit: "cents" });
}
