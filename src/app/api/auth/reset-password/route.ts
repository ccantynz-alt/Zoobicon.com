import { NextRequest } from "next/server";
import { verifyResetToken } from "@/lib/resetToken";

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

    // For regular users — once a database is added, update the hashed password here.
    // For now, acknowledge success (regular users use localStorage auth).
    return new Response(
      JSON.stringify({ ok: true, isAdmin: false }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
