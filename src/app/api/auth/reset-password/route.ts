import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { verifyResetToken } from "@/lib/resetToken";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Check the DB row's reset_token_hash / reset_token_expires_at. Returns
 * null if valid (OK to proceed), or a short error reason otherwise.
 *
 * - If the columns don't exist yet OR the users table is empty (i.e. the
 *   admin-only/no-db flow), we return null so the legacy HMAC-only path
 *   continues to work.
 * - If the row DOES have reset fields, they must match the presented token
 *   hash AND reset_token_expires_at must be in the future.
 */
async function checkDbTokenState(
  email: string,
  token: string
): Promise<string | null> {
  try {
    // Idempotent guard — columns may not have been provisioned yet.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash       TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`;

    const rows = (await sql`
      SELECT reset_token_hash, reset_token_expires_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as Array<{
      reset_token_hash: string | null;
      reset_token_expires_at: Date | string | null;
    }>;

    // No row = admin/no-db flow. Fall through to HMAC-only validation.
    if (rows.length === 0) return null;

    const row = rows[0];

    // No stamp on the row = token was already consumed or never issued via
    // the DB path. Reject so we enforce single-use.
    if (!row.reset_token_hash || !row.reset_token_expires_at) {
      return "token already used or not issued";
    }

    const expiresAt =
      row.reset_token_expires_at instanceof Date
        ? row.reset_token_expires_at.getTime()
        : new Date(row.reset_token_expires_at).getTime();

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      // Expired — clear the stamp so the token can't be retried.
      await sql`
        UPDATE users
        SET reset_token_hash = NULL,
            reset_token_expires_at = NULL,
            updated_at = NOW()
        WHERE email = ${email}
      `.catch(() => {});
      return "expired";
    }

    if (row.reset_token_hash !== hashToken(token)) {
      return "token mismatch";
    }

    return null;
  } catch (err) {
    console.warn(
      "[reset-password] DB token check failed, falling back to HMAC-only:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Reset token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 12) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 12 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await verifyResetToken(token);

    if (!result.valid) {
      const msg =
        result.reason === "expired"
          ? "This reset link has expired. Please request a new one."
          : "Invalid or tampered reset link. Please request a new one.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // DB-side TTL + single-use guard (defence in depth on top of the HMAC
    // expiry). Returns early with "expired" if the stamp is gone, mismatched,
    // or aged out.
    const dbReason = await checkDbTokenState(result.email!, token);
    if (dbReason) {
      const userMsg =
        dbReason === "expired"
          ? "This reset link has expired. Please request a new one."
          : "This reset link is no longer valid. Please request a new one.";
      return new Response(JSON.stringify({ error: userMsg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For the admin account — return the env var instruction
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    if (result.email === adminEmail) {
      return new Response(
        JSON.stringify({
          ok: true,
          isAdmin: true,
          envInstruction: `ADMIN_PASSWORD=${newPassword}`,
          message:
            "Admin password reset. Update ADMIN_PASSWORD in your Vercel environment variables and redeploy.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update regular user password AND clear the reset token stamp so it
    // can't be reused (single-use enforcement).
    const passwordHash = await hashPassword(newPassword);
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          reset_token_hash = NULL,
          reset_token_expires_at = NULL,
          updated_at = NOW()
      WHERE email = ${result.email}
    `;

    return Response.json({ ok: true, isAdmin: false });
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
