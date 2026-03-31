import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/domains/checkout
 *
 * Creates a Stripe Checkout session for domain registration.
 * After payment, the webhook triggers actual OpenSRS domain registration.
 *
 * Body: {
 *   domains: Array<{ domain: string, tld: string, price: number }>,
 *   email?: string
 * }
 *
 * Returns: { url: string } — Stripe checkout redirect URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domains, email } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return Response.json({ error: "No domains selected" }, { status: 400 });
    }

    // Validate domains
    for (const d of domains) {
      if (!d.domain || !d.tld || !d.price) {
        return Response.json({ error: "Invalid domain data" }, { status: 400 });
      }
      if (d.price < 1 || d.price > 500) {
        return Response.json({ error: "Invalid price" }, { status: 400 });
      }
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

    // Create line items for each domain
    const lineItems = domains.map((d: { domain: string; tld: string; price: number }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: d.domain,
          description: `Domain registration — ${d.domain} (1 year). Includes free WHOIS privacy, SSL, and DNS management.`,
          metadata: {
            type: "domain_registration",
            domain: d.domain,
            tld: d.tld,
          },
        },
        unit_amount: Math.round(d.price * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        type: "domain_registration",
        domains: JSON.stringify(domains.map((d: { domain: string }) => d.domain)),
        domainCount: String(domains.length),
      },
      ...(email ? { customer_email: email } : {}),
      success_url: `${appUrl}/domains?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/domains?cancelled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[domains/checkout] Error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";

    if (message.includes("STRIPE_SECRET_KEY")) {
      return Response.json(
        { error: "Payment processing is being set up. Please try again shortly." },
        { status: 503 }
      );
    }

    return Response.json({ error: "Failed to start checkout. Please try again." }, { status: 500 });
  }
}
