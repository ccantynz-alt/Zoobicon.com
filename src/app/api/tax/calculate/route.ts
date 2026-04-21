import { NextRequest, NextResponse } from "next/server";
import { calculateTax, type TaxType } from "@/lib/tax-calc";

export const runtime = "nodejs";

interface Body {
  amount: number;
  country: string;
  region?: string;
  type: TaxType;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<Body>;
    if (typeof body.amount !== "number" || !body.country || !body.type) {
      return NextResponse.json(
        { error: "amount (number), country, and type are required" },
        { status: 400 }
      );
    }
    const result = calculateTax({
      amount: body.amount,
      country: body.country,
      region: body.region,
      type: body.type,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
