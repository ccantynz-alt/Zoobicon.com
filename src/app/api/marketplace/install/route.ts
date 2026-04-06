import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { ADDONS } from "../_addons";
import { recordPurchase } from "@/lib/addon-delivery";

/**
 * POST /api/marketplace/install
 * Body: { addonId: string, email: string }
 *
 * For free add-ons: records installation and returns success.
 * For paid add-ons: creates a Stripe Checkout session and returns the checkout URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addonId, email } = body as { addonId?: string; email?: string };

    if (!addonId || typeof addonId !== "string") {
      return Response.json({ error: "addonId is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const addon = ADDONS.find((a) => a.id === addonId);
    if (!addon) {
      return Response.json({ error: "Add-on not found" }, { status: 404 });
    }

    // --- Free add-on: instant install ---
    if (addon.price === 0) {
      // Record in database for delivery system
      try {
        await recordPurchase({ email, addonId: addon.id, addonName: addon.name });
      } catch {
        // DB may not be available — localStorage fallback still works
      }

      return Response.json({
        success: true,
        installed: true,
        addon: { id: addon.id, name: addon.name },
      });
    }

    // --- Paid add-on: create Stripe checkout ---
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Determine Stripe mode based on pricing type
    const isSubscription = addon.priceType === "monthly";

    // For real production usage each add-on would have its own Stripe Price ID.
    // Here we create a checkout session with a dynamic price so there's no
    // manual Stripe dashboard setup required for every add-on.
    const lineItem: Record<string, unknown> = isSubscription
      ? {
          price_data: {
            currency: "usd",
            product_data: {
              name: addon.name,
              description: addon.description,
            },
            unit_amount: addon.price, // already in cents
            recurring: { interval: "month" as const },
          },
          quantity: 1,
        }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: addon.name,
              description: addon.description,
            },
            unit_amount: addon.price, // already in cents
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [lineItem as any], // eslint-disable-line
      metadata: { email, addonId: addon.id, addonName: addon.name },
      success_url: `${appUrl}/marketplace?success=true&addon=${encodeURIComponent(addon.id)}`,
      cancel_url: `${appUrl}/marketplace?canceled=true`,
    });

    return Response.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Installation error";
    console.error("[marketplace/install]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
