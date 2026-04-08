import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, getPlanById } from "@/lib/billing-plans";

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
      customerId?: string | null;
      customerEmail?: string;
      planId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };
    const { customerId, customerEmail, planId, successUrl, cancelUrl } = body;
    if (!planId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "planId, successUrl, and cancelUrl are required" },
        { status: 400 }
      );
    }
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: `Unknown plan: ${planId}` },
        { status: 400 }
      );
    }
    if (!plan.stripePriceId) {
      return NextResponse.json(
        {
          error: `Plan ${planId} has no Stripe price ID. Set STRIPE_PRICE_${planId.toUpperCase()} in environment.`,
        },
        { status: 503 }
      );
    }
    const url = await createCheckoutSession(
      customerId,
      plan.stripePriceId,
      successUrl,
      cancelUrl,
      customerEmail
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
