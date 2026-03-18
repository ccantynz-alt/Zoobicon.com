import { NextRequest } from "next/server";
import { stripe, PLAN_PRICE_IDS, PLAN_NAMES, PRO_PRICE_ID, type PlanSlug } from "@/lib/stripe";
import { sql } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Body: { email: string, plan?: "creator" | "pro" | "agency" }
 * Creates a Stripe Checkout session for the specified plan (defaults to Pro)
 * and returns the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    // Resolve plan → price ID (backwards-compatible: defaults to Pro)
    const planSlug: PlanSlug = (plan && plan in PLAN_PRICE_IDS) ? plan : "pro";
    const priceId = PLAN_PRICE_IDS[planSlug] || PRO_PRICE_ID;

    if (!priceId) {
      return Response.json(
        { error: `No Stripe price ID configured for the ${PLAN_NAMES[planSlug]} plan. Set STRIPE_${planSlug.toUpperCase()}_PRICE_ID in your environment variables.` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Re-use existing Stripe customer if one exists for this email
    let customerId: string | undefined;
    const [existing] = await sql`
      SELECT stripe_customer_id FROM users WHERE email = ${email} LIMIT 1
    `;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { email, plan: planSlug },
      },
      metadata: { email, plan: planSlug },
      success_url: `${appUrl}/dashboard?subscription=success&plan=${planSlug}`,
      cancel_url: `${appUrl}/pricing`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
