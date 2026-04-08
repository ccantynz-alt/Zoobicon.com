import { NextRequest, NextResponse } from "next/server";
import { invoiceTax, type LineItem } from "@/lib/tax-calc";

export const runtime = "nodejs";

interface Body {
  lineItems: LineItem[];
  country: string;
  region?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<Body>;
    if (!Array.isArray(body.lineItems) || !body.country) {
      return NextResponse.json(
        { error: "lineItems (array) and country are required" },
        { status: 400 }
      );
    }
    const result = invoiceTax({
      lineItems: body.lineItems,
      country: body.country,
      region: body.region,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
