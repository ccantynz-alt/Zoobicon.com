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

        // Domain registration purchase — MUST actually register with OpenSRS
        if (session.metadata?.type === "domain_registration" || session.metadata?.domains) {
          const rawDomains = session.metadata?.domains || "";
          let domainList: string[] = [];
          try {
            const parsed = JSON.parse(rawDomains);
            domainList = Array.isArray(parsed) ? parsed : rawDomains.split(",").filter(Boolean);
          } catch {
            domainList = rawDomains.split(",").filter(Boolean);
          }

          const registrantEmail = session.metadata?.registrantEmail || email;
          const years = parseInt(session.metadata?.years || "1", 10);
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + years);

          let registrant = {
            firstName: session.metadata?.firstName || "Domain",
            lastName: session.metadata?.lastName || "Owner",
            email: registrantEmail,
            phone: session.metadata?.phone || "+64.000000000",
            address1: session.metadata?.address1 || "Not provided",
            city: session.metadata?.city || "Auckland",
            state: session.metadata?.state || "Auckland",
            postalCode: session.metadata?.postalCode || "0000",
            country: session.metadata?.country || "NZ",
            organization: session.metadata?.organization || "",
          };
          try {
            if (session.metadata?.registrantInfo) {
              registrant = { ...registrant, ...JSON.parse(session.metadata.registrantInfo) };
            }
          } catch { /* use defaults */ }

          const { registerDomain, hasOpenSRSConfig } = await import("@/lib/domain-reseller");
          const registeredDomains: string[] = [];
          const failedDomains: string[] = [];

          for (const domain of domainList) {
            const trimmed = domain.trim();
            if (!trimmed) continue;

            try {
              if (hasOpenSRSConfig()) {
                const result = await registerDomain({
                  domain: trimmed,
                  period: years,
                  registrant,
                  nameservers: ["ns1.zoobicon.io", "ns2.zoobicon.io"],
                  autoRenew: true,
                  privacyProtection: true,
                });

                if (result.success) {
                  registeredDomains.push(trimmed);
                  console.log(`[webhook] Domain REGISTERED with OpenSRS: ${trimmed} (order: ${result.orderId})`);
                } else {
                  failedDomains.push(trimmed);
                  console.error(`[webhook] OpenSRS registration FAILED for ${trimmed}: ${result.error}`);
                }
              } else {
                console.warn(`[webhook] OpenSRS NOT CONFIGURED — domain ${trimmed} saved locally but NOT registered with registrar`);
                registeredDomains.push(trimmed);
              }
            } catch (err) {
              failedDomains.push(trimmed);
              console.error(`[webhook] Domain registration error for ${trimmed}:`, err);
            }
          }

          for (const domain of registeredDomains) {
            try {
              await sql`
                INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
                VALUES (${domain}, ${registrantEmail}, ${hasOpenSRSConfig() ? 'active' : 'pending_registration'}, ${expiresAt.toISOString()}, true, true)
                ON CONFLICT (domain) DO UPDATE SET
                  status = ${hasOpenSRSConfig() ? 'active' : 'pending_registration'},
                  expires_at = ${expiresAt.toISOString()},
                  user_email = ${registrantEmail}
              `;
            } catch (err) {
              console.error(`[webhook] Failed to save domain ${domain} to DB:`, err);
            }
          }

          if (failedDomains.length > 0) {
            console.error(`[webhook] ${failedDomains.length} domains FAILED registration: ${failedDomains.join(", ")}`);
            for (const domain of failedDomains) {
              try {
                await sql`
                  INSERT INTO registered_domains (domain, user_email, status, expires_at)
                  VALUES (${domain}, ${registrantEmail}, 'failed', ${expiresAt.toISOString()})
                  ON CONFLICT (domain) DO UPDATE SET status = 'failed', user_email = ${registrantEmail}
                `;
              } catch { /* best effort */ }
            }
          }

          console.log(`[webhook] Domain registration complete: ${registeredDomains.length} succeeded, ${failedDomains.length} failed for ${registrantEmail}`);
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
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    console.error("Webhook handler error:", message);
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ received: true });
}
