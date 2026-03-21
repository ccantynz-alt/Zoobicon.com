import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { recordPurchase } from "@/lib/addon-delivery";
import { OVERAGE_PACKS, addOverageCredits } from "@/lib/video-usage";

/**
 * POST /api/stripe/webhook
 * Stripe sends signed events here. Handles subscription lifecycle:
 * - checkout.session.completed  → upsert user, set plan = pro
 * - customer.subscription.updated → sync status/plan
 * - customer.subscription.deleted → downgrade plan = free
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return Response.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return Response.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = (session.metadata?.email ?? session.customer_email) as string;
        if (!email) break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const plan = session.metadata?.plan || "pro";

        // Check if this is a marketplace add-on purchase
        const addonId = session.metadata?.addonId;
        const addonName = session.metadata?.addonName;

        // Video overage credit pack purchase
        if (session.metadata?.type === "video_overage") {
          const packId = session.metadata?.packId;
          const pack = OVERAGE_PACKS.find((p) => p.id === packId);
          if (pack) {
            await addOverageCredits(email, pack, session.id);
            console.log(`[webhook] Video credits fulfilled: ${pack.name} for ${email}`);
          }
          break;
        }

        if (addonId && addonName) {
          // Record the add-on purchase for delivery
          await recordPurchase({
            email,
            addonId,
            addonName,
            stripeSessionId: session.id,
            stripeSubscriptionId: subscriptionId || undefined,
          });
        } else {
          // Regular plan upgrade — use the plan from session metadata
          await sql`
            INSERT INTO users (email, stripe_customer_id, stripe_subscription_id, plan, subscription_status)
            VALUES (${email}, ${customerId}, ${subscriptionId}, ${plan}, 'active')
            ON CONFLICT (email) DO UPDATE SET
              stripe_customer_id     = EXCLUDED.stripe_customer_id,
              stripe_subscription_id = EXCLUDED.stripe_subscription_id,
              plan                   = ${plan},
              subscription_status    = 'active',
              updated_at             = NOW()
          `;
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status; // active | trialing | past_due | canceled | ...

        if (status === "active" || status === "trialing") {
          // Keep existing plan — just update status
          await sql`
            UPDATE users
            SET subscription_status = ${status}, updated_at = NOW()
            WHERE stripe_subscription_id = ${sub.id}
          `;
        } else {
          // Past due or other non-active status — downgrade to free
          await sql`
            UPDATE users
            SET plan = 'free', subscription_status = ${status}, updated_at = NOW()
            WHERE stripe_subscription_id = ${sub.id}
          `;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await sql`
          UPDATE users
          SET plan = 'free', subscription_status = 'canceled', updated_at = NOW()
          WHERE stripe_subscription_id = ${sub.id}
        `;
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    console.error("Webhook handler error:", message);
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ received: true });
}
