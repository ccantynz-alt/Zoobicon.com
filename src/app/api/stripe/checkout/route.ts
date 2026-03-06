import { NextRequest } from "next/server";
import { stripe, PRO_PRICE_ID } from "@/lib/stripe";
import { sql } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Body: { email: string }
 * Creates a Stripe Checkout session for the Pro plan and returns the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
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
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { email },
      },
      metadata: { email },
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/pricing`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
