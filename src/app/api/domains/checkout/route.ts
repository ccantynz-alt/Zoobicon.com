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
 *   years?: number,
 *   email?: string,
 *   registrant?: { firstName, lastName, email, phone, address1, city, state, postalCode, country }
 * }
 *
 * METADATA FORMAT (must match what the Stripe webhook reads):
 *   type: "domain_registration"
 *   domains: comma-separated domain list (e.g. "example.com,example.io")
 *   years: "1"
 *   registrantEmail, registrantFirstName, registrantLastName, registrantPhone,
 *   registrantAddress, registrantCity, registrantState, registrantZip, registrantCountry
 *
 * The webhook at /api/stripe/webhook reads these individual metadata fields
 * to build the ContactInfo for OpenSRS registration. Do NOT change the field
 * names without updating the webhook handler simultaneously.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domains, email, registrant, years: rawYears } = body;
    const years = Math.max(1, Math.min(10, Number(rawYears) || 1));

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return Response.json({ error: "No domains selected" }, { status: 400 });
    }

    if (domains.length > 20) {
      return Response.json({ error: "Maximum 20 domains per order." }, { status: 400 });
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
        return Response.json({ error: `Invalid domain data: each entry needs domain, tld, and price. Got: ${JSON.stringify(d)}` }, { status: 400 });
      }
      if (typeof d.price !== "number" || d.price < 1 || d.price > 500) {
        return Response.json({ error: `Invalid price for ${d.domain}: ${d.price}` }, { status: 400 });
      }
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

    const lineItems = domains.map((d: { domain: string; tld: string; price: number }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: d.domain,
          description: `Domain registration — ${d.domain} (${years} year${years > 1 ? "s" : ""}). Includes free WHOIS privacy, SSL, and DNS management.`,
        },
        unit_amount: Math.round(d.price * years * 100),
      },
      quantity: 1,
    }));

    // Registrant email: prefer the registrant object's email, fall back to top-level email
    const registrantEmail = registrant?.email || email || "";

    // Stripe metadata values must be strings and max 500 chars each.
    // Use comma-separated domain list (matches what the webhook parses with .split(",")).
    const domainList = domains.map((d: { domain: string }) => d.domain).join(",");
    if (domainList.length > 500) {
      return Response.json({ error: "Too many domains for a single checkout. Please split into smaller batches." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        type: "domain_registration",
        domains: domainList,
        years: String(years),
        registrantEmail,
        registrantFirstName: registrant?.firstName || "",
        registrantLastName: registrant?.lastName || "",
        registrantPhone: registrant?.phone || "",
        registrantAddress: registrant?.address1 || registrant?.address || "",
        registrantCity: registrant?.city || "",
        registrantState: registrant?.state || "",
        registrantZip: registrant?.postalCode || registrant?.zip || "",
        registrantCountry: registrant?.country || "US",
      },
      ...(registrantEmail ? { customer_email: registrantEmail } : {}),
      success_url: `${appUrl}/my-domains?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/domains?cancelled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      console.error("[domains/checkout] Stripe returned session without URL:", session.id);
      return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    console.log(`[domains/checkout] Session created: ${session.id} for ${domains.length} domain(s): ${domainList}`);
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
