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

    // Use the email from session metadata, or the provided email.
    // SECURITY: reject requests where the caller's email doesn't match the
    // session's registrant — prevents attackers from claiming arbitrary domains.
    const sessionEmail = (session.metadata?.registrantEmail || session.customer_email || "").toLowerCase();
    const callerEmail = String(email).toLowerCase();
    if (sessionEmail && sessionEmail !== callerEmail) {
      return NextResponse.json(
        { error: "Email does not match purchase" },
        { status: 403 }
      );
    }
    const registrantEmail = (sessionEmail || callerEmail).toLowerCase();
    const years = parseInt(session.metadata?.years || "1", 10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + years);

    // Save to database — INSERT OR UPDATE to handle both webhook-first and verify-first cases
    const { sql } = await import("@/lib/db");

    // Auto-create table if it doesn't exist (no more dependency on /api/db/init)
    await sql`
      CREATE TABLE IF NOT EXISTS registered_domains (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain              TEXT UNIQUE NOT NULL,
        user_email          TEXT NOT NULL,
        status              VARCHAR(30) NOT NULL DEFAULT 'active',
        registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
        auto_renew          BOOLEAN NOT NULL DEFAULT true,
        privacy_protection  BOOLEAN NOT NULL DEFAULT true,
        nameservers         JSONB DEFAULT '["ns1.zoobicon.io", "ns2.zoobicon.io"]',
        cloudflare_zone_id  TEXT,
        stripe_session_id   TEXT,
        opensrs_order_id    TEXT,
        registration_error  TEXT,
        registrant_info     JSONB DEFAULT '{}'
      )
    `.catch((e: unknown) => console.warn("[verify-purchase] table ensure:", e instanceof Error ? e.message : e));
    await sql`CREATE INDEX IF NOT EXISTS registered_domains_user_email_idx ON registered_domains (user_email)`.catch(() => {});

    const saved: string[] = [];
    const alreadyExists: string[] = [];

    for (const domain of domainList) {
      const trimmed = domain.trim();
      if (!trimmed) continue;

      try {
        // Check if already saved by webhook
        const existing = await sql`
          SELECT domain, status, created_at FROM registered_domains WHERE domain = ${trimmed}
        `;

        if (existing.length > 0) {
          alreadyExists.push(trimmed);
          const row = existing[0] as { status: string; created_at: string };
          // Already registered — nothing to do
          if (row.status === "active") continue;
          // Webhook may be mid-flight. If row is very fresh, give webhook
          // a chance to finish before we double-register with OpenSRS.
          const ageMs = Date.now() - new Date(row.created_at).getTime();
          if (row.status === "pending_registration" && ageMs < 30_000) {
            console.log(`[verify-purchase] ${trimmed} pending for ${ageMs}ms — letting webhook finish`);
            continue;
          }
          // Pending >30s or failed: safe to retry
          if (row.status === "pending_registration" || row.status === "registration_failed") {
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
