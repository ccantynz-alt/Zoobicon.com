import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { recordPurchase } from "@/lib/addon-delivery";
import { OVERAGE_PACKS, addOverageCredits } from "@/lib/video-usage";
import { registerDomain, type ContactInfo } from "@/lib/domain-reseller";

/**
 * POST /api/stripe/webhook
 * Production-grade Stripe webhook handler.
 * - Verifies signature against STRIPE_WEBHOOK_SECRET
 * - Idempotent (in-memory LRU of last 1000 event ids)
 * - Always returns 200 to Stripe on internal errors (logs them) so Stripe doesn't retry forever
 * - 503 if secret missing, 400 if signature invalid
 */

// Idempotency cache — capped at 1000 most recent event ids
const processedEvents: string[] = [];
const processedSet = new Set<string>();
const IDEMPOTENCY_CAP = 1000;

function markProcessed(eventId: string) {
  if (processedSet.has(eventId)) return;
  processedSet.add(eventId);
  processedEvents.push(eventId);
  if (processedEvents.length > IDEMPOTENCY_CAP) {
    const old = processedEvents.shift();
    if (old) processedSet.delete(old);
  }
}

async function safeDb<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[stripe-webhook] db op failed (${label}):`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Handlers ──────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email = (session.metadata?.email ?? session.customer_email) as string | undefined;
  if (!email) {
    console.warn(`[stripe-webhook] checkout.session.completed missing email for session ${session.id}`);
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const plan = session.metadata?.plan || "pro";
  if (!session.metadata?.plan) {
    console.warn(`[stripe-webhook] checkout.session.completed: missing plan metadata for ${session.id}, defaulting to 'pro'`);
  }

  const addonId = session.metadata?.addonId;
  const addonName = session.metadata?.addonName;

  // Video overage credit pack purchase
  if (session.metadata?.type === "video_overage") {
    const packId = session.metadata?.packId;
    const pack = OVERAGE_PACKS.find((p) => p.id === packId);
    if (pack) {
      await safeDb("addOverageCredits", () => addOverageCredits(email, pack, session.id));
      console.log(`[stripe-webhook] Video credits fulfilled: ${pack.name} for ${email}`);
    }
    return;
  }

  // Domain registration purchase
  if (session.metadata?.type === "domain_registration") {
    const domainList = session.metadata?.domains?.split(",") || [];
    const registrantEmail = session.metadata?.registrantEmail || email;
    const years = parseInt(session.metadata?.years || "1", 10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + years);

    const registrant: ContactInfo = {
      firstName: session.metadata?.registrantFirstName || "Domain",
      lastName: session.metadata?.registrantLastName || "Owner",
      email: registrantEmail,
      phone: session.metadata?.registrantPhone || "+1.0000000000",
      address1: session.metadata?.registrantAddress || "TBD",
      city: session.metadata?.registrantCity || "TBD",
      state: session.metadata?.registrantState || "NA",
      postalCode: session.metadata?.registrantZip || "00000",
      country: session.metadata?.registrantCountry || "US",
    };

    for (const domain of domainList) {
      if (!domain.trim()) continue;
      const trimmedDomain = domain.trim();

      await safeDb("insert registered_domains", () => sql`
        INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
        VALUES (${trimmedDomain}, ${registrantEmail}, ${"pending_registration"}, ${expiresAt.toISOString()}, true, true)
        ON CONFLICT (domain) DO UPDATE SET
          status = ${"pending_registration"},
          expires_at = ${expiresAt.toISOString()},
          user_email = ${registrantEmail}
      `);

      try {
        const result = await registerDomain({
          domain: trimmedDomain,
          period: years,
          registrant,
          autoRenew: true,
          privacyProtection: true,
        });

        if (result.success) {
          await safeDb("update domain active", () => sql`
            UPDATE registered_domains SET status = 'active', opensrs_order_id = ${result.orderId || null}
            WHERE domain = ${trimmedDomain}
          `);
          console.log(`[stripe-webhook] Domain registered: ${trimmedDomain} (order: ${result.orderId})`);
        } else {
          await safeDb("update domain failed", () => sql`
            UPDATE registered_domains SET status = 'registration_failed', registration_error = ${result.error || 'Unknown error'}
            WHERE domain = ${trimmedDomain}
          `);
          console.error(`[stripe-webhook] OpenSRS registration failed for ${trimmedDomain}: ${result.error}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[stripe-webhook] OpenSRS registration error for ${trimmedDomain}:`, msg);
        await safeDb("update domain error", () => sql`
          UPDATE registered_domains SET status = 'registration_failed', registration_error = ${msg}
          WHERE domain = ${trimmedDomain}
        `);
      }
    }
    console.log(`[stripe-webhook] Domain registration: ${domainList.length} domains for ${registrantEmail}`);
    return;
  }

  if (addonId && addonName) {
    await safeDb("recordPurchase", () => recordPurchase({
      email,
      addonId,
      addonName,
      stripeSessionId: session.id,
      stripeSubscriptionId: subscriptionId || undefined,
    }));
    return;
  }

  // Regular plan upgrade
  await safeDb("upsert user plan", () => sql`
    INSERT INTO users (email, stripe_customer_id, stripe_subscription_id, plan, subscription_status)
    VALUES (${email}, ${customerId}, ${subscriptionId}, ${plan}, 'active')
    ON CONFLICT (email) DO UPDATE SET
      stripe_customer_id     = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      plan                   = ${plan},
      subscription_status    = 'active',
      updated_at             = NOW()
  `);
}

async function handleSubscriptionUpserted(sub: Stripe.Subscription) {
  const status = sub.status;
  if (status === "active" || status === "trialing" || status === "past_due" || status === "unpaid") {
    await safeDb("update sub status", () => sql`
      UPDATE users SET subscription_status = ${status}, updated_at = NOW()
      WHERE stripe_subscription_id = ${sub.id}
    `);
  } else {
    await safeDb("downgrade sub", () => sql`
      UPDATE users SET plan = 'free', subscription_status = ${status}, updated_at = NOW()
      WHERE stripe_subscription_id = ${sub.id}
    `);
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await safeDb("cancel sub", () => sql`
    UPDATE users SET plan = 'free', subscription_status = 'canceled', updated_at = NOW()
    WHERE stripe_subscription_id = ${sub.id}
  `);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
  if (subscriptionId && typeof subscriptionId === "string") {
    await safeDb("invoice paid → active", () => sql`
      UPDATE users SET subscription_status = 'active', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `);
  }
  console.log(`[stripe-webhook] invoice paid: ${invoice.id} amount=${invoice.amount_paid}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
  if (subscriptionId && typeof subscriptionId === "string") {
    await safeDb("invoice failed → past_due", () => sql`
      UPDATE users SET subscription_status = 'past_due', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `);
  }
  console.warn(`[stripe-webhook] payment failed for ${invoice.customer_email} sub=${subscriptionId}`);
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const domain = pi.metadata?.domain;
  if (domain) {
    await safeDb("mark domain paid", () => sql`
      UPDATE registered_domains SET status = COALESCE(NULLIF(status, 'pending_registration'), 'paid')
      WHERE domain = ${domain}
    `);
    console.log(`[stripe-webhook] payment_intent.succeeded marked domain paid: ${domain}`);
  }
}

// ─── Route ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return Response.json({ error: "Webhook secret not configured" }, { status: 503 });
  }
  if (!sig) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  if (processedSet.has(event.id)) {
    return Response.json({ received: true, duplicate: true, eventType: event.type });
  }

  let handled = false;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        handled = true;
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpserted(event.data.object as Stripe.Subscription);
        handled = true;
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        handled = true;
        break;

      case "invoice.paid":
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        handled = true;
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        handled = true;
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        handled = true;
        break;

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[stripe-webhook] refund: charge ${charge.id} ${charge.amount_refunded / 100} ${charge.currency}`);
        handled = true;
        break;
      }

      default:
        markProcessed(event.id);
        return Response.json({ received: true, ignored: true, eventType: event.type });
    }
  } catch (err) {
    // Per Bible Law 8: log clearly. Return 200 so Stripe doesn't retry forever — we logged it.
    console.error("[stripe-webhook]", event.type, err instanceof Error ? err.message : err);
  }

  markProcessed(event.id);
  return Response.json({ received: true, eventType: event.type, handled });
}
