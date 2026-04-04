import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/domains/verify-purchase
 *
 * Called by /my-domains after Stripe checkout redirect.
 * Verifies the Stripe session was paid, and if the webhook didn't
 * already save the domains, saves them now.
 *
 * This is the SAFETY NET — ensures domains are ALWAYS saved after payment,
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
          // If status is still pending/failed but payment is confirmed, update to active
          if (existing[0].status !== "active") {
            await sql`
              UPDATE registered_domains
              SET status = 'active', user_email = ${registrantEmail}, expires_at = ${expiresAt.toISOString()}
              WHERE domain = ${trimmed}
            `;
          }
        } else {
          // Webhook hasn't saved this domain yet — save it now
          await sql`
            INSERT INTO registered_domains (domain, user_email, status, expires_at, auto_renew, privacy_protection)
            VALUES (${trimmed}, ${registrantEmail}, 'active', ${expiresAt.toISOString()}, true, true)
          `;
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
