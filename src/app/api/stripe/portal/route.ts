import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";

/**
 * POST /api/stripe/portal
 * Body: { email: string }
 * Opens the Stripe Customer Portal so users can manage/cancel their subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const [user] = await sql`
      SELECT stripe_customer_id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (!user?.stripe_customer_id) {
      return Response.json({ error: "No active subscription found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return Response.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
