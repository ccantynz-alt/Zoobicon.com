import { NextRequest, NextResponse } from "next/server";
import { upgradeSubscription, getPlanById } from "@/lib/billing-plans";

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
      subscriptionId?: string;
      newPlanId?: string;
    };
    const { subscriptionId, newPlanId } = body;
    if (!subscriptionId || !newPlanId) {
      return NextResponse.json(
        { error: "subscriptionId and newPlanId are required" },
        { status: 400 }
      );
    }
    const plan = getPlanById(newPlanId);
    if (!plan) {
      return NextResponse.json(
        { error: `Unknown plan: ${newPlanId}` },
        { status: 400 }
      );
    }
    if (!plan.stripePriceId) {
      return NextResponse.json(
        {
          error: `Plan ${newPlanId} has no Stripe price ID. Set STRIPE_PRICE_${newPlanId.toUpperCase()} in environment.`,
        },
        { status: 503 }
      );
    }
    const updated = await upgradeSubscription(subscriptionId, plan.stripePriceId);
    return NextResponse.json({ ok: true, subscriptionId: updated.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
