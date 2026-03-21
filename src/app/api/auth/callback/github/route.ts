import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const origin = req.nextUrl.origin;

  // Validate OAuth state parameter to prevent CSRF
  const storedState = req.cookies.get("zoobicon_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return Response.redirect(`${origin}/auth/login?error=invalid_state`);
  }

  if (!code) {
    return Response.redirect(`${origin}/auth/login?error=no_code`);
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.redirect(`${origin}/auth/login?error=oauth_not_configured`);
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
      return Response.redirect(`${origin}/auth/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error_description);
      return Response.redirect(`${origin}/auth/login?error=token_exchange_failed`);
    }

    // Get user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userRes.ok) {
      return Response.redirect(`${origin}/auth/login?error=user_info_failed`);
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
      return Response.redirect(`${origin}/auth/login?error=no_email`);
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
          INSERT INTO users (email, name, auth_provider, auth_provider_id)
          VALUES (${email}, ${name}, 'github', ${String(ghUser.id)})
          RETURNING id, email, name, role, plan
        `;
        user = newUser;
      }
    } catch (dbErr) {
      console.error("DB error during GitHub OAuth:", dbErr);
      user = { email, name, role: "user", plan: "free" };
    }

    const userData = encodeURIComponent(JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role || "user",
      plan: user.plan || "free",
    }));

    const redirectResponse = Response.redirect(`${origin}/auth/callback?user=${userData}`);
    // Clear the state cookie
    redirectResponse.headers.append(
      "Set-Cookie",
      "zoobicon_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
    );
    return redirectResponse;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return Response.redirect(`${origin}/auth/login?error=oauth_failed`);
  }
}
