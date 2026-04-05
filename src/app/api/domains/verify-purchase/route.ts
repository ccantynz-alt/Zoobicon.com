import { NextRequest, NextResponse } from "next/server";
import { registerDomain, type ContactInfo } from "@/lib/domain-reseller";

/**
 * POST /api/domains/verify-purchase
 *
 * Called by /my-domains after Stripe checkout redirect.
 * Verifies the Stripe session was paid, and if the webhook didn't
 * already save the domains, saves them now AND registers with OpenSRS.
 *
 * This is the SAFETY NET — ensures domains are ALWAYS registered after payment,
 * even if the Stripe webhook fails, is delayed, or isn't configured.
 *
 * Body: { sessionId: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    // Retrieve the Stripe session to verify payment
    const { stripe } = await import("@/lib/stripe");
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        error: "Payment not completed",
        status: session.payment_status,
      }, { status: 400 });
    }

    // Check metadata for domain info
    if (session.metadata?.type !== "domain_registration" && !session.metadata?.domains) {
      return NextResponse.json({ error: "Not a domain purchase session" }, { status: 400 });
    }

    // Parse domains from metadata
    let domainList: string[] = [];
    const rawDomains = session.metadata?.domains || "";
    try {
      const parsed = JSON.parse(rawDomains);
      domainList = Array.isArray(parsed) ? parsed : rawDomains.split(",").filter(Boolean);
    } catch {
      domainList = rawDomains.split(",").filter(Boolean);
    }

    if (domainList.length === 0) {
      return NextResponse.json({ error: "No domains found in session" }, { status: 400 });
    }

    // Use the email from session metadata, or the provided email
    const registrantEmail = session.metadata?.registrantEmail || session.customer_email || email;
    const years = parseInt(session.metadata?.years || "1", 10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + years);

    // Save to database — INSERT OR UPDATE to handle both webhook-first and verify-first cases
    const { sql } = await import("@/lib/db");
    const saved: string[] = [];
    const alreadyExists: string[] = [];

    for (const domain of domainList) {
      const trimmed = domain.trim();
      if (!trimmed) continue;

      try {
        // Check if already saved by webhook
        const existing = await sql`
          SELECT domain, status FROM registered_domains WHERE domain = ${trimmed}
        `;

        if (existing.length > 0) {
          alreadyExists.push(trimmed);
          // If status is pending/failed but payment is confirmed, retry OpenSRS registration
          if (existing[0].status === "pending_registration" || existing[0].status === "registration_failed") {
            await tryRegisterWithOpenSRS(trimmed, registrantEmail, years, session, sql);
          }
        } else {
          // Webhook hasn't saved this domain yet — save and register
          await sql`
            INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
            VALUES (${trimmed}, ${registrantEmail}, ${"pending_registration"}, ${expiresAt.toISOString()}, true, true)
          `;
          await tryRegisterWithOpenSRS(trimmed, registrantEmail, years, session, sql);
          saved.push(trimmed);
        }
      } catch (err) {
        console.error(`[verify-purchase] Failed to save domain ${trimmed}:`, err);
      }
    }

    console.log(`[verify-purchase] session=${sessionId} email=${registrantEmail} saved=${saved.length} existing=${alreadyExists.length}`);

    return NextResponse.json({
      success: true,
      domains: domainList,
      saved: saved.length,
      alreadyExists: alreadyExists.length,
      email: registrantEmail,
    });
  } catch (err) {
    console.error("[verify-purchase] Error:", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Attempt to register a domain with OpenSRS and update DB status.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryRegisterWithOpenSRS(domain: string, email: string, years: number, session: any, sql: any) {
  const registrant: ContactInfo = {
    firstName: session.metadata?.registrantFirstName || "Domain",
    lastName: session.metadata?.registrantLastName || "Owner",
    email,
    phone: session.metadata?.registrantPhone || "+1.0000000000",
    address1: session.metadata?.registrantAddress || "TBD",
    city: session.metadata?.registrantCity || "TBD",
    state: session.metadata?.registrantState || "NA",
    postalCode: session.metadata?.registrantZip || "00000",
    country: session.metadata?.registrantCountry || "US",
  };

  try {
    const result = await registerDomain({
      domain,
      period: years,
      registrant,
      autoRenew: true,
      privacyProtection: true,
    });

    if (result.success) {
      await sql`
        UPDATE registered_domains SET status = 'active', opensrs_order_id = ${result.orderId || null}
        WHERE domain = ${domain}
      `;
      console.log(`[verify-purchase] Domain registered with OpenSRS: ${domain}`);
    } else {
      await sql`
        UPDATE registered_domains SET status = 'registration_failed', registration_error = ${result.error || 'Unknown'}
        WHERE domain = ${domain}
      `;
      console.error(`[verify-purchase] OpenSRS registration failed for ${domain}: ${result.error}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[verify-purchase] OpenSRS error for ${domain}:`, msg);
    try {
      await sql`
        UPDATE registered_domains SET status = 'registration_failed', registration_error = ${msg}
        WHERE domain = ${domain}
      `;
    } catch { /* logged above */ }
  }
}
