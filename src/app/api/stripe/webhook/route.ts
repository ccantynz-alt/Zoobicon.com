import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { recordPurchase } from "@/lib/addon-delivery";
import { OVERAGE_PACKS, addOverageCredits } from "@/lib/video-usage";
import { registerDomain, type ContactInfo } from "@/lib/domain-reseller";
import { auditLog } from "@/lib/audit-middleware";

/**
 * POST /api/stripe/webhook
 * Production-grade Stripe webhook handler.
 * - Verifies signature against STRIPE_WEBHOOK_SECRET
 * - Idempotent via Upstash Redis (SET NX ex 86400) with in-memory LRU fallback
 *   for hot instances. This closes the cold-start duplicate-charge hole.
 * - Always returns 200 to Stripe on internal errors (logs them) so Stripe doesn't retry forever
 * - 503 if secret missing OR Upstash is unreachable (so Stripe retries and we
 *   don't silently skip events)
 * - 400 if signature invalid
 */

// In-memory fallback cache — only protects a single hot instance.
// Upstash Redis is the primary dedup; this is the "hot instance still works
// even if Upstash hiccups momentarily" guard.
const processedEvents: string[] = [];
const processedSet = new Set<string>();
const IDEMPOTENCY_CAP = 1000;
const DEDUP_TTL_SECONDS = 60 * 60 * 24; // 24h — matches Stripe's retry window

function markProcessedInMemory(eventId: string) {
  if (processedSet.has(eventId)) return;
  processedSet.add(eventId);
  processedEvents.push(eventId);
  if (processedEvents.length > IDEMPOTENCY_CAP) {
    const old = processedEvents.shift();
    if (old) processedSet.delete(old);
  }
}

type DedupResult =
  | { status: "new" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

/**
 * Atomically claim a Stripe event id so only one concurrent/retried delivery
 * can process it. Upstash SET NX is the source of truth; the in-memory LRU is
 * only consulted when Upstash is missing or down (so a hot instance still
 * refuses a same-second retry).
 */
async function claimEvent(eventId: string): Promise<DedupResult> {
  const key = `stripe:event:${eventId}`;
  const redis = getRedis();

  if (redis) {
    try {
      const res = await redis.set(key, "processed", {
        nx: true,
        ex: DEDUP_TTL_SECONDS,
      });
      // Upstash returns "OK" if set, null if the key already existed.
      if (res === null) {
        return { status: "duplicate" };
      }
      // Mirror into local cache for extra safety on this instance.
      markProcessedInMemory(eventId);
      return { status: "new" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[stripe-webhook] Upstash SET NX failed for ${eventId}: ${message}. ` +
          `Returning 503 so Stripe retries; falling back to in-memory dedup for this instance.`
      );
      // Still mark in-memory so a same-instance retry within this process
      // short-circuits, but the 503 will force Stripe to retry → next attempt
      // either hits a healthy Upstash or another hot instance.
      markProcessedInMemory(eventId);
      return { status: "error", message };
    }
  }

  // No Upstash configured: single-instance dedup only.
  if (processedSet.has(eventId)) {
    return { status: "duplicate" };
  }
  markProcessedInMemory(eventId);
  return { status: "new" };
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

/**
 * Handle domain registration after successful Stripe payment.
 * Separated from handleCheckoutCompleted so it doesn't depend on the
 * generic email extraction (domain registrations carry registrantEmail
 * in metadata instead).
 */
async function handleDomainRegistration(session: Stripe.Checkout.Session) {
  // Parse domain list — handle both comma-separated ("a.com,b.io") and
  // JSON array ('["a.com","b.io"]') formats for backwards compatibility.
  let domainList: string[] = [];
  const rawDomains = session.metadata?.domains || "";
  if (rawDomains.startsWith("[")) {
    try {
      const parsed = JSON.parse(rawDomains);
      if (Array.isArray(parsed)) domainList = parsed.map(String);
    } catch {
      console.error(`[stripe-webhook] Failed to parse domains JSON: ${rawDomains}`);
    }
  }
  if (domainList.length === 0 && rawDomains) {
    domainList = rawDomains.split(",").map((d: string) => d.trim()).filter(Boolean);
  }

  if (domainList.length === 0) {
    console.error(`[stripe-webhook] domain_registration event with EMPTY domain list. session=${session.id} raw="${rawDomains}". Customer was charged but no domains to register!`);
    return;
  }

  // Email: prefer registrantEmail metadata, fall back to customer_email on the session
  const registrantEmail = session.metadata?.registrantEmail || (session.customer_email as string) || "";
  const years = parseInt(session.metadata?.years || "1", 10);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + years);

  // Build registrant from individual metadata fields.
  // If registrant info is missing, we still insert the DB row (customer paid!)
  // but OpenSRS will likely reject. We log the error so it can be fixed manually.
  const registrant: ContactInfo = {
    firstName: session.metadata?.registrantFirstName || "Domain",
    lastName: session.metadata?.registrantLastName || "Owner",
    email: registrantEmail || "unknown@zoobicon.com",
    phone: session.metadata?.registrantPhone || "+1.0000000000",
    address1: session.metadata?.registrantAddress || "TBD",
    city: session.metadata?.registrantCity || "TBD",
    state: session.metadata?.registrantState || "NA",
    postalCode: session.metadata?.registrantZip || "00000",
    country: session.metadata?.registrantCountry || "US",
  };

  const hasMissingContact = registrant.firstName === "Domain" || registrant.address1 === "TBD";
  if (hasMissingContact) {
    console.warn(`[stripe-webhook] Domain registration has placeholder contact info. session=${session.id} email=${registrantEmail}. OpenSRS may reject.`);
  }

  let successCount = 0;
  let failCount = 0;

  for (const domain of domainList) {
    if (!domain.trim()) continue;
    const trimmedDomain = domain.trim();

    // Insert as pending_registration BEFORE calling OpenSRS.
    // If OpenSRS fails, we still have a record that the customer paid.
    await safeDb("insert registered_domains", () => sql`
      INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection, stripe_session_id, registrant_info)
      VALUES (${trimmedDomain}, ${registrantEmail || "unknown"}, ${"pending_registration"}, ${expiresAt.toISOString()}, true, true, ${session.id}, ${JSON.stringify(registrant)})
      ON CONFLICT (domain) DO UPDATE SET
        status = ${"pending_registration"},
        expires_at = ${expiresAt.toISOString()},
        user_email = ${registrantEmail || "unknown"},
        stripe_session_id = ${session.id},
        registrant_info = ${JSON.stringify(registrant)}
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
          UPDATE registered_domains SET status = 'active', opensrs_order_id = ${result.orderId || null}, registration_error = NULL
          WHERE domain = ${trimmedDomain}
        `);
        console.log(`[stripe-webhook] Domain registered: ${trimmedDomain} (order: ${result.orderId})`);
        successCount++;
      } else {
        await safeDb("update domain failed", () => sql`
          UPDATE registered_domains SET status = 'registration_failed', registration_error = ${result.error || "Unknown error"}
          WHERE domain = ${trimmedDomain}
        `);
        console.error(`[stripe-webhook] OpenSRS registration FAILED for ${trimmedDomain}: ${result.error}`);
        failCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[stripe-webhook] OpenSRS registration ERROR for ${trimmedDomain}:`, msg);
      await safeDb("update domain error", () => sql`
        UPDATE registered_domains SET status = 'registration_failed', registration_error = ${msg}
        WHERE domain = ${trimmedDomain}
      `);
      failCount++;
    }
  }
  console.log(`[stripe-webhook] Domain registration complete: ${successCount} succeeded, ${failCount} failed, ${domainList.length} total for ${registrantEmail}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Domain registration — check FIRST because it has its own email field
  // (registrantEmail) and must not be blocked by the generic email guard below.
  // A customer who paid for domains MUST have their registration attempted
  // even if the generic email extraction fails.
  if (session.metadata?.type === "domain_registration") {
    await handleDomainRegistration(session);
    return;
  }

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

  // Idempotency check — Upstash Redis (cross-instance) with in-memory fallback.
  const claim = await claimEvent(event.id);
  if (claim.status === "duplicate") {
    return Response.json({ received: true, duplicate: true, eventType: event.type });
  }
  if (claim.status === "error") {
    // Upstash is down. We MUST NOT process optimistically — another instance
    // might already have processed this event and we'd double-charge.
    // Return 503 so Stripe retries; by then Upstash is hopefully back.
    return Response.json(
      {
        error: "Idempotency store unavailable",
        detail: claim.message,
        eventType: event.type,
      },
      { status: 503 }
    );
  }

  let handled = false;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Single source of truth — handleCheckoutCompleted handles all four
        // paths (video overage, addon, domain registration, plain plan
        // upgrade) and runs the user-table upsert that sets `plan` and
        // `subscription_status`. Previously this case body had inline
        // copies of the overage and domain branches but skipped the plain
        // plan upsert entirely — meaning a regular subscription checkout
        // never wrote `plan = 'pro'` to the users table, so the customer
        // stayed on the free-tier watermark even after paying. Fixed by
        // delegating to the canonical handler.
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        handled = true;
        break;
      }

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
        return Response.json({ received: true, ignored: true, eventType: event.type });
    }
  } catch (err) {
    // Per Bible Law 8: log clearly. Return 200 so Stripe doesn't retry forever — we logged it.
    console.error("[stripe-webhook]", event.type, err instanceof Error ? err.message : err);
  }

  // Audit log the webhook event
  if (handled) {
    const email =
      (event.type === "checkout.session.completed"
        ? ((event.data.object as Stripe.Checkout.Session).metadata?.email ??
           (event.data.object as Stripe.Checkout.Session).customer_email)
        : "system") || "system";
    auditLog({
      action: `stripe.${event.type}`,
      actor: typeof email === "string" ? email : "system",
      resourceType: "billing",
      resourceId: event.id,
      result: "success",
    });
  }

  return Response.json({ received: true, eventType: event.type, handled });
}
