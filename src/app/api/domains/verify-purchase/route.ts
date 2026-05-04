import { NextRequest, NextResponse } from "next/server";
import { registerWithFallback, type ContactInfo } from "@/lib/registrar";

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
    const registrantEmail = sessionEmail || callerEmail;
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
            await tryRegisterWithChain(trimmed, registrantEmail, years, session, sql);
          }
        } else {
          // Webhook hasn't saved this domain yet — save and register
          await sql`
            INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
            VALUES (${trimmed}, ${registrantEmail}, ${"pending_registration"}, ${expiresAt.toISOString()}, true, true)
          `;
          await tryRegisterWithChain(trimmed, registrantEmail, years, session, sql);
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
 * Attempt to register a domain via the registrar chain (OpenSRS → CentralNic).
 *
 * Two important safety rails:
 *  - Refuses to register if any ICANN-required registrant field is missing
 *    or obviously placeholder. Previously we filled gaps with "TBD" /
 *    "+1.0000000000" / "unknown@..." and OpenSRS rejected the registration —
 *    the customer was charged but the domain was never registered.
 *  - Persists the chain's per-provider attempts list to registration_error
 *    so the admin can see exactly which providers were tried and why each
 *    failed.
 */
async function tryRegisterWithChain(
  domain: string,
  email: string,
  years: number,
  session: { metadata?: Record<string, string | null | undefined> | null },
  sql: typeof import("@/lib/db").sql,
) {
  const m = session.metadata || {};

  // ICANN requires non-placeholder data. Same validation gate the Stripe
  // webhook uses — keep them consistent so a row that passes one path
  // doesn't get rejected by the other.
  const required: Array<[string, string | null | undefined]> = [
    ["registrantFirstName", m.registrantFirstName],
    ["registrantLastName", m.registrantLastName],
    ["email", email],
    ["registrantPhone", m.registrantPhone],
    ["registrantAddress", m.registrantAddress],
    ["registrantCity", m.registrantCity],
    ["registrantCountry", m.registrantCountry],
  ];
  const missing = required.filter(([, v]) => !v || !String(v).trim()).map(([k]) => k);
  const looksValidEmail = email && /@/.test(email) && !email.startsWith("unknown@");
  if (missing.length > 0 || !looksValidEmail) {
    const detail = `Missing ICANN-required fields: ${missing.join(", ") || "(invalid email)"}`;
    console.error(`[verify-purchase] BLOCKED — ${detail} for ${domain}. Customer paid but registration cannot proceed.`);
    await sql`
      UPDATE registered_domains
      SET status = 'missing_registrant_info', registration_error = ${detail}
      WHERE domain = ${domain}
    `;
    return;
  }

  const registrant: ContactInfo = {
    firstName: m.registrantFirstName!,
    lastName: m.registrantLastName!,
    email,
    phone: m.registrantPhone!,
    address1: m.registrantAddress!,
    city: m.registrantCity!,
    state: m.registrantState || "",
    postalCode: m.registrantZip || "",
    country: m.registrantCountry!,
  };

  const result = await registerWithFallback({
    domain,
    period: years,
    registrant,
    autoRenew: true,
    privacyProtection: true,
  });

  if (result.success) {
    await sql`
      UPDATE registered_domains
      SET status = 'active',
          opensrs_order_id = ${result.orderId || null},
          registration_error = NULL
      WHERE domain = ${domain}
    `;
    console.log(`[verify-purchase] ${domain} registered via ${result.source} order=${result.orderId || "?"}`);
  } else {
    const summary = result.attempts
      .map((a) => `${a.provider}=${a.error || "unknown"}`)
      .join(" · ");
    const errorText = `${result.error || "Unknown"} [attempts: ${summary || "none"}]`;
    await sql`
      UPDATE registered_domains
      SET status = 'registration_failed', registration_error = ${errorText}
      WHERE domain = ${domain}
    `;
    console.error(`[verify-purchase] ${domain} chain failed: ${errorText}`);
  }
}
