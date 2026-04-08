import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { hasOpenSRSConfig } from "@/lib/domain-reseller";

/**
 * POST /api/domains/checkout
 *
 * Creates a Stripe Checkout session for domain registration.
 * After payment, the webhook triggers actual OpenSRS domain registration.
 *
 * SAFETY: Refuses to create checkout if OpenSRS is not configured,
 * preventing the scenario where payment succeeds but registration fails.
 *
 * Body: {
 *   domains: Array<{ domain: string, tld: string, price: number }>,
 *   email?: string,
 *   registrant?: { firstName, lastName, phone, address1, city, state, postalCode, country }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domains, email, registrant } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return Response.json({ error: "No domains selected" }, { status: 400 });
    }

    // SAFETY CHECK: Don't take payment if we can't register domains
    if (!hasOpenSRSConfig()) {
      return Response.json({
        error: "Domain registration is not available yet. We're setting up our registrar integration. Please try again soon or register directly at porkbun.com.",
        registrarNotConfigured: true,
      }, { status: 503 });
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

    const lineItems = domains.map((d: { domain: string; tld: string; price: number }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: d.domain,
          description: `Domain registration — ${d.domain} (1 year). Includes free WHOIS privacy, SSL, and DNS management.`,
        },
        unit_amount: Math.round(d.price * 100),
      },
      quantity: 1,
    }));

    // Store registrant info in metadata so the webhook can use it for OpenSRS
    const registrantInfo = registrant ? JSON.stringify({
      firstName: registrant.firstName || "",
      lastName: registrant.lastName || "",
      phone: registrant.phone || "",
      address1: registrant.address1 || "",
      city: registrant.city || "",
      state: registrant.state || "",
      postalCode: registrant.postalCode || "",
      country: registrant.country || "NZ",
      organization: registrant.organization || "",
    }) : "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        type: "domain_registration",
        domains: JSON.stringify(domains.map((d: { domain: string }) => d.domain)),
        domainCount: String(domains.length),
        registrantEmail: email || "",
        years: "1",
        ...(registrantInfo ? { registrantInfo } : {}),
      },
      ...(email ? { customer_email: email } : {}),
      success_url: `${appUrl}/my-domains?success=true&session_id={CHECKOUT_SESSION_ID}`,
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
