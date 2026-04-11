import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const origin = req.nextUrl.origin;

  // Validate OAuth state parameter to prevent CSRF
  const storedState = req.cookies.get("zoobicon_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_not_configured`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/auth/login?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/auth/login?error=user_info_failed`);
    }

    const googleUser = await userRes.json();
    const email = googleUser.email?.toLowerCase();
    const name = googleUser.name || "";

    if (!email) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_email`);
    }

    // Find or create user
    let user;
    try {
      const [existing] = await sql`
        SELECT id, email, name, role, plan FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing) {
        // Update provider info
        await sql`
          UPDATE users SET
            auth_provider = 'google',
            auth_provider_id = ${googleUser.id || ""},
            updated_at = NOW()
          WHERE email = ${email}
        `;
        user = existing;
      } else {
        // Create new user
        const [newUser] = await sql`
          INSERT INTO users (email, name, auth_provider, auth_provider_id, email_verified, email_verified_at)
          VALUES (${email}, ${name}, 'google', ${googleUser.id || ""}, true, NOW())
          RETURNING id, email, name, role, plan
        `;
        user = newUser;
      }
    } catch (dbErr) {
      console.error("DB error during Google OAuth:", dbErr);
      // Fall through with basic user info even if DB fails
      user = { email, name, role: "user", plan: "free" };
    }

    // Promote configured admin email to admin role even when signing in via OAuth.
    // Without this, OAuth logins land in /dashboard instead of /admin.
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdminEmail = adminEmail && email === adminEmail;
    const finalRole = isAdminEmail ? "admin" : (user.role || "user");
    const finalPlan = isAdminEmail ? "unlimited" : (user.plan || "free");

    // Redirect to callback page with user data
    const userData = encodeURIComponent(JSON.stringify({
      email: user.email,
      name: user.name,
      role: finalRole,
      plan: finalPlan,
    }));

    const redirectResponse = NextResponse.redirect(`${origin}/auth/callback?user=${userData}`);
    // Clear the state cookie (CSRF nonce already consumed)
    redirectResponse.cookies.set("zoobicon_oauth_state", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 0,
    });
    return redirectResponse;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
  }
}
