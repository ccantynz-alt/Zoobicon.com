import { NextRequest, NextResponse } from "next/server";
import { incomeTaxBracket } from "@/lib/tax-calc";

export const runtime = "nodejs";

interface Body {
  income: number;
  country: string;
  year?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<Body>;
    if (typeof body.income !== "number" || !body.country) {
      return NextResponse.json(
        { error: "income (number) and country are required" },
        { status: 400 }
      );
    }
    const result = incomeTaxBracket({
      income: body.income,
      country: body.country,
      year: body.year,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
