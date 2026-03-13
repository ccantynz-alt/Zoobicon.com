import { NextRequest } from "next/server";
import { stripe, getPriceId } from "@/lib/stripe";
import { sql } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Body: { email: string, plan?: "creator" | "pro" | "agency" }
 * Creates a Stripe Checkout session and returns the URL.
 * Defaults to "pro" if no plan specified.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, plan = "pro" } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const validPlans = ["creator", "pro", "agency"];
    const selectedPlan = validPlans.includes(plan) ? plan : "pro";
    const priceId = getPriceId(selectedPlan);

    if (!priceId) {
      return Response.json(
        { error: `Stripe price not configured for ${selectedPlan} plan. Contact support.` },
        { status: 500 }
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
        metadata: { email, plan: selectedPlan },
      },
      metadata: { email, plan: selectedPlan },
      success_url: `${appUrl}/dashboard?subscription=success&plan=${selectedPlan}`,
      cancel_url: `${appUrl}/pricing`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
