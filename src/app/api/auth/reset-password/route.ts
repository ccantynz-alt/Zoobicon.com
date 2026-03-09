import { NextRequest } from "next/server";
import { verifyResetToken } from "@/lib/resetToken";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

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

    // Update regular user password in the database
    const passwordHash = await hashPassword(newPassword);
    await sql`
      UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
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
