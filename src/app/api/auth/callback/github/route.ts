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

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("GitHub token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/auth/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error_description);
      return NextResponse.redirect(`${origin}/auth/login?error=token_exchange_failed`);
    }

    // Get user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/auth/login?error=user_info_failed`);
    }

    const ghUser = await userRes.json();

    // Get primary email (may be private)
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified);
        email = primary?.email || emails[0]?.email;
      }
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_email`);
    }

    email = email.toLowerCase();
    const name = ghUser.name || ghUser.login || "";

    // Find or create user
    let user;
    try {
      const [existing] = await sql`
        SELECT id, email, name, role, plan FROM users WHERE email = ${email} LIMIT 1
      `;

      if (existing) {
        await sql`
          UPDATE users SET
            auth_provider = 'github',
            auth_provider_id = ${String(ghUser.id)},
            updated_at = NOW()
          WHERE email = ${email}
        `;
        user = existing;
      } else {
        const [newUser] = await sql`
          INSERT INTO users (email, name, auth_provider, auth_provider_id, email_verified, email_verified_at)
          VALUES (${email}, ${name}, 'github', ${String(ghUser.id)}, true, NOW())
          RETURNING id, email, name, role, plan
        `;
        user = newUser;
      }
    } catch (dbErr) {
      console.error("DB error during GitHub OAuth:", dbErr);
      user = { email, name, role: "user", plan: "free" };
    }

    // Promote configured admin email to admin role even when signing in via OAuth.
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdminEmail = adminEmail && email === adminEmail;
    const finalRole = isAdminEmail ? "admin" : (user.role || "user");
    const finalPlan = isAdminEmail ? "unlimited" : (user.plan || "free");

    const userData = encodeURIComponent(JSON.stringify({
      email: user.email,
      name: user.name,
      role: finalRole,
      plan: finalPlan,
      githubLogin: ghUser.login,
    }));

    // Use NextResponse.redirect so .cookies.set() actually mutates headers.
    // Previous code used Response.redirect then headers.append, which silently
    // dropped cookies because the Response from Response.redirect is frozen.
    const redirectResponse = NextResponse.redirect(
      `${origin}/auth/callback?user=${userData}&github_login=${encodeURIComponent(ghUser.login)}`,
    );

    // Clear the state cookie (CSRF nonce already consumed)
    redirectResponse.cookies.set("zoobicon_oauth_state", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 0,
    });

    // Store GitHub token in a secure HttpOnly cookie (30 day expiry)
    // The /api/github/sync routes read this cookie server-side.
    redirectResponse.cookies.set("zoobicon_github_token", tokenData.access_token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
    });

    // Also store the GitHub login in a readable cookie for the UI
    redirectResponse.cookies.set("zoobicon_github_login", ghUser.login, {
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
    });

    return redirectResponse;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
  }
}
