import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { recordPurchase } from "@/lib/addon-delivery";
import { OVERAGE_PACKS, addOverageCredits } from "@/lib/video-usage";
import { registerDomain, type ContactInfo } from "@/lib/domain-reseller";

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
        if (!session.metadata?.plan) {
          console.warn(`[webhook] checkout.session.completed: missing plan metadata for session ${session.id}, defaulting to 'pro'`);
        }

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

        // Domain registration purchase — register with OpenSRS + save to DB
        if (session.metadata?.type === "domain_registration") {
          const domainList = session.metadata?.domains?.split(",") || [];
          const registrantEmail = session.metadata?.registrantEmail || email;
          const years = parseInt(session.metadata?.years || "1", 10);
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + years);

          // Parse registrant contact info from metadata
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

            // Step 1: Save to database as "pending_registration"
            try {
              await sql`
                INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
                VALUES (${trimmedDomain}, ${registrantEmail}, ${"pending_registration"}, ${expiresAt.toISOString()}, true, true)
                ON CONFLICT (domain) DO UPDATE SET
                  status = ${"pending_registration"},
                  expires_at = ${expiresAt.toISOString()},
                  user_email = ${registrantEmail}
              `;
            } catch (err) {
              console.error(`[webhook] Failed to save domain ${trimmedDomain} to DB:`, err);
            }

            // Step 2: Register with OpenSRS
            try {
              const result = await registerDomain({
                domain: trimmedDomain,
                period: years,
                registrant,
                autoRenew: true,
                privacyProtection: true,
              });

              if (result.success) {
                // Update status to active
                await sql`
                  UPDATE registered_domains SET status = 'active', opensrs_order_id = ${result.orderId || null}
                  WHERE domain = ${trimmedDomain}
                `;
                console.log(`[webhook] Domain registered with OpenSRS: ${trimmedDomain} (order: ${result.orderId})`);
              } else {
                // Registration failed — mark for manual review
                await sql`
                  UPDATE registered_domains SET status = 'registration_failed', registration_error = ${result.error || 'Unknown error'}
                  WHERE domain = ${trimmedDomain}
                `;
                console.error(`[webhook] OpenSRS registration failed for ${trimmedDomain}: ${result.error}`);
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              console.error(`[webhook] OpenSRS registration error for ${trimmedDomain}:`, msg);
              try {
                await sql`
                  UPDATE registered_domains SET status = 'registration_failed', registration_error = ${msg}
                  WHERE domain = ${trimmedDomain}
                `;
              } catch { /* DB update failed too — logged above */ }
            }
          }
          console.log(`[webhook] Domain registration: ${domainList.length} domains for ${registrantEmail}`);
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
        } else if (status === "past_due" || status === "unpaid") {
          // Payment pending — keep existing plan but update status so UI can show warning
          await sql`
            UPDATE users
            SET subscription_status = ${status}, updated_at = NOW()
            WHERE stripe_subscription_id = ${sub.id}
          `;
        } else {
          // Canceled, incomplete_expired, or other terminal status — downgrade to free
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
        if (subscriptionId && typeof subscriptionId === "string") {
          await sql`
            UPDATE users
            SET subscription_status = 'active', updated_at = NOW()
            WHERE stripe_subscription_id = ${subscriptionId}
          `;
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
        const customerEmail = invoice.customer_email;
        if (subscriptionId && typeof subscriptionId === "string") {
          await sql`
            UPDATE users
            SET subscription_status = 'past_due', updated_at = NOW()
            WHERE stripe_subscription_id = ${subscriptionId}
          `;
        }
        console.warn(`[webhook] Payment failed for ${customerEmail} — subscription ${subscriptionId}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[webhook] Refund processed for charge ${charge.id}: ${charge.amount_refunded / 100} ${charge.currency}`);
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
