import { NextRequest, NextResponse } from "next/server";
import { vatRate } from "@/lib/tax-calc";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const country = req.nextUrl.searchParams.get("country");
  if (!country) {
    return NextResponse.json({ error: "country query param required" }, { status: 400 });
  }
  const rate = vatRate(country);
  return NextResponse.json({ country: country.toUpperCase(), rate });
}
