import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * Ensure the user_consents table exists.
 */
async function ensureConsentTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_consents (
        email TEXT PRIMARY KEY,
        analytics BOOLEAN DEFAULT false,
        marketing BOOLEAN DEFAULT false,
        necessary BOOLEAN DEFAULT true,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch {
    // Table may already exist
  }
}

/**
 * GET — Retrieve current consent state for a user.
 * Query param: ?email=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    await ensureConsentTable();

    const [consent] = await sql`
      SELECT email, analytics, marketing, necessary, updated_at
      FROM user_consents WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (!consent) {
      // Return default consent state (no record yet)
      return NextResponse.json({
        email: normalizedEmail,
        consents: {
          analytics: false,
          marketing: false,
          necessary: true,
        },
        updatedAt: null,
      });
    }

    return NextResponse.json({
      email: consent.email,
      consents: {
        analytics: consent.analytics,
        marketing: consent.marketing,
        necessary: consent.necessary,
      },
      updatedAt: consent.updated_at,
    });
  } catch (err) {
    console.error("Consent fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch consent state" },
      { status: 500 }
    );
  }
}

/**
 * POST — Store/update consent preferences.
 * Body: { email, consents: { analytics: boolean, marketing: boolean, necessary: boolean } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, consents } = body;

    if (!email || !consents) {
      return NextResponse.json(
        { error: "Email and consents object are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const analytics = consents.analytics === true;
    const marketing = consents.marketing === true;
    // Necessary cookies are always true
    const necessary = true;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    await ensureConsentTable();

    await sql`
      INSERT INTO user_consents (email, analytics, marketing, necessary, updated_at)
      VALUES (${normalizedEmail}, ${analytics}, ${marketing}, ${necessary}, NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        analytics = ${analytics},
        marketing = ${marketing},
        necessary = ${necessary},
        updated_at = NOW()
    `;

    // Log consent update (fire-and-forget)
    logAudit({
      action: "consent_updated",
      email: normalizedEmail,
      ip,
      metadata: { analytics, marketing, necessary },
    }).catch(() => {});

    return NextResponse.json({
      email: normalizedEmail,
      consents: { analytics, marketing, necessary },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Consent update error:", err);
    return NextResponse.json(
      { error: "Failed to update consent preferences" },
      { status: 500 }
    );
  }
}
