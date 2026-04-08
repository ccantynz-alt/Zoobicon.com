import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@/lib/billing-plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. STRIPE_SECRET_KEY is missing." },
      { status: 503 }
    );
  }
  try {
    const body = (await req.json()) as {
      customerId?: string;
      returnUrl?: string;
    };
    const { customerId, returnUrl } = body;
    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { error: "customerId and returnUrl are required" },
        { status: 400 }
      );
    }
    const url = await createPortalSession(customerId, returnUrl);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
