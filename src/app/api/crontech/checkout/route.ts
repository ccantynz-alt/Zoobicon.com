/**
 * /api/crontech/checkout — start a Stripe checkout session for a
 * Vapron add-on.
 *
 * Architecture (Rule 34):
 *   Customer clicks "Add to my plan" in /marketplace
 *   → POST /api/crontech/checkout { addOnId, projectId?, email? }
 *   → Zoobicon looks up the add-on price from the catalog
 *   → Stripe checkout session created with metadata identifying
 *     the add-on + (if available) the connected Vapron project
 *   → On payment success, Stripe webhook fires
 *     → Zoobicon's webhook handler calls Vapron's provisioning API
 *       with the add-on id + the customer's project + the proof of
 *       payment.
 *
 * The customer never sees Vapron. They see Zoobicon → Stripe →
 * back to Zoobicon. The add-on appears in their dashboard.
 *
 * IMPORTANT: prices in the stub catalog are PROVISIONAL placeholders.
 * Once Vapron ships final pricing, the catalog endpoint returns
 * real numbers and this checkout uses them transparently — no code
 * change needed.
 */

import { NextResponse } from "next/server";
import { getVapronCatalog, getAddOn, formatPrice } from "@/lib/crontech-catalog";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  addOnId?: string;
  /** The connected Vapron project this add-on attaches to */
  projectId?: string;
  /** Customer email for the Stripe session */
  email?: string;
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { addOnId, projectId?, email? }" },
      { status: 400 }
    );
  }

  if (!body.addOnId) {
    return NextResponse.json({ error: "addOnId required" }, { status: 400 });
  }

  // Look up the add-on
  const catalog = await getVapronCatalog();
  const addOn = getAddOn(catalog, body.addOnId);
  if (!addOn) {
    return NextResponse.json(
      { error: `Unknown add-on: ${body.addOnId}` },
      { status: 404 }
    );
  }

  // Stripe must be wired
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Once STRIPE_SECRET_KEY is set in Vercel, the marketplace checkout goes live.",
      },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

  try {
    // We use price_data here (not a pre-created Stripe Price object)
    // because the add-on catalog is dynamic — Vapron can ship a new
    // add-on at any time and the marketplace needs to charge for it
    // without us pre-creating a Stripe Price for every possibility.
    const session = await stripe.checkout.sessions.create({
      mode: addOn.billing === "one_time" ? "payment" : "subscription",
      payment_method_types: ["card"],
      customer_email: body.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: `${addOn.name} (via Vapron)`,
              description: addOn.tagline,
              metadata: {
                addOnId: addOn.id,
                category: addOn.category,
                crontechProvisioned: "true",
              },
            },
            unit_amount: addOn.priceCents,
            ...(addOn.billing !== "one_time" && {
              recurring: {
                interval: addOn.billing === "monthly" ? "month" : "year",
              },
            }),
          },
        },
      ],
      // Metadata on the session itself — the Stripe webhook reads
      // these to know which Vapron add-on to provision on payment
      // success.
      metadata: {
        kind: "crontech_addon",
        addOnId: addOn.id,
        category: addOn.category,
        billing: addOn.billing,
        projectId: body.projectId || "",
        priceProvisional: catalog.pricingProvisional ? "true" : "false",
      },
      success_url: `${appUrl}/marketplace?purchased=${addOn.id}`,
      cancel_url: `${appUrl}/marketplace`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      addOn: { id: addOn.id, name: addOn.name, price: formatPrice(addOn) },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
