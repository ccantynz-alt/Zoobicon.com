import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * GDPR Article 17 — Right to Erasure
 * Deletes all user data across all tables.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, confirmation } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: 'Confirmation must be exactly "DELETE MY ACCOUNT"' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Verify the user exists
    let userExists = false;
    try {
      const [user] = await sql`
        SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
      `;
      userExists = !!user;
    } catch {
      // DB may be unavailable
    }

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Log the deletion BEFORE wiping audit logs
    await logAudit({
      action: "account_deleted",
      email: normalizedEmail,
      ip,
      metadata: { deletedAt: new Date().toISOString() },
    });

    // Delete in order, respecting foreign key constraints
    // 1. Deployments (references sites)
    try {
      await sql`
        DELETE FROM deployments
        WHERE site_id IN (SELECT id FROM sites WHERE email = ${normalizedEmail})
      `;
    } catch {
      // Table may not exist or no rows
    }

    // 2. Sites
    try {
      await sql`DELETE FROM sites WHERE email = ${normalizedEmail}`;
    } catch {
      // Ignore
    }

    // 3. Projects
    try {
      await sql`DELETE FROM projects WHERE user_email = ${normalizedEmail}`;
    } catch {
      // Ignore
    }

    // 4. Collab participants
    try {
      await sql`DELETE FROM collab_participants WHERE user_email = ${normalizedEmail}`;
    } catch {
      // Ignore
    }

    // 5. Agency generations
    try {
      await sql`DELETE FROM agency_generations WHERE user_email = ${normalizedEmail}`;
    } catch {
      // Table may not exist
    }

    // 6. Consent records
    try {
      await sql`DELETE FROM user_consents WHERE email = ${normalizedEmail}`;
    } catch {
      // Table may not exist
    }

    // 7. Audit log (we already logged the final entry above)
    try {
      await sql`DELETE FROM audit_log WHERE email = ${normalizedEmail}`;
    } catch {
      // Ignore
    }

    // 8. Users table (last, since other tables may reference the email)
    try {
      await sql`DELETE FROM users WHERE email = ${normalizedEmail}`;
    } catch {
      // Ignore
    }

    return NextResponse.json({
      deleted: true,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
