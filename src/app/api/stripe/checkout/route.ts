import { NextRequest } from "next/server";
import { stripe, getPriceId, PLANS, PLAN_NAMES, type PlanSlug, type BillingInterval } from "@/lib/stripe";
import { sql } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Body: { email: string, plan?: PlanSlug, interval?: "monthly" | "annual" }
 * Creates a Stripe Checkout session and returns the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, interval } = body as {
      email?: string;
      plan?: string;
      interval?: string;
    };

    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const validPlans = Object.keys(PLANS);
    const planSlug: PlanSlug = (plan && validPlans.includes(plan))
      ? (plan as PlanSlug)
      : "pro";

    const billingInterval: BillingInterval =
      interval === "annual" ? "annual" : "monthly";

    const priceId = getPriceId(planSlug, billingInterval);

    // SAFETY: Don't take payment if webhook can't process it
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return Response.json(
        { error: "Payment processing is being configured. Please try again shortly." },
        { status: 503 }
      );
    }

    if (!priceId) {
      const envVar = billingInterval === "annual"
        ? `STRIPE_PRICE_${planSlug.toUpperCase()}_ANNUAL`
        : `STRIPE_PRICE_${planSlug.toUpperCase()}`;
      return Response.json(
        {
          error: `No Stripe price ID configured for the ${PLAN_NAMES[planSlug] || planSlug} plan (${billingInterval}). Set ${envVar} in your environment variables.`,
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Re-use existing Stripe customer if one exists for this email
    let customerId: string | undefined;
    try {
      const [existing] = await sql`
        SELECT stripe_customer_id FROM users WHERE email = ${email} LIMIT 1
      `;
      if (existing?.stripe_customer_id) {
        customerId = existing.stripe_customer_id;
      }
    } catch {
      // DB unavailable — proceed without customer lookup
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { email, plan: planSlug, interval: billingInterval },
      },
      metadata: { email, plan: planSlug, interval: billingInterval },
      success_url: `${appUrl}/dashboard/billing?subscription=success&plan=${planSlug}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
