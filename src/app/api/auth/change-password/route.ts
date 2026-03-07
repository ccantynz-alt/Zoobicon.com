import { NextRequest } from "next/server";

/**
 * Admin password change handler.
 *
 * Because credentials are stored as environment variables (not a database),
 * this route validates the current password against the ADMIN_PASSWORD env var
 * and returns the exact env-var line the admin needs to paste into their
 * deployment dashboard (Vercel / Render / etc.) to activate the new password.
 *
 * The password does NOT change until the env var is updated and the service redeployed.
 */
export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Both current and new password are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const storedPassword = process.env.ADMIN_PASSWORD;

    if (!storedPassword) {
      return new Response(
        JSON.stringify({ error: "Admin password is not configured on this server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (currentPassword !== storedPassword) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 12) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 12 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (newPassword === currentPassword) {
      return new Response(
        JSON.stringify({ error: "New password must differ from the current one." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        envInstruction: `ADMIN_PASSWORD=${newPassword}`,
        message:
          "Current password verified. Update your ADMIN_PASSWORD environment variable to the value above, then redeploy (Vercel) or save the change (Render) to activate the new password.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
