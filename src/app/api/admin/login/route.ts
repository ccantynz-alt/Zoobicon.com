import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Admin login — POST { email, password }.
 *
 * Validates against ADMIN_EMAIL + ADMIN_PASSWORD env vars using
 * a constant-time compare. Returns 200 with the admin profile on
 * success, 401 on bad credentials, 503 when the env vars are not
 * configured (so the AdminShell can show the user a useful error
 * instead of a silent failure).
 *
 * Rule 31: public-facing auth is delegated to Vapron SSO, but
 * Craig still needs a single-user admin sign-in for /admin while
 * Vapron SSO is being wired. This route is exactly that — no
 * Postgres, no Vapron round-trip, no JWT.
 */
export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      {
        error:
          "Admin sign-in is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in Vercel environment variables.",
      },
      { status: 503 },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const emailOk = safeEqual(email.toLowerCase(), adminEmail.toLowerCase());
  const passwordOk = safeEqual(password, adminPassword);

  if (!emailOk || !passwordOk) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user: {
      email: adminEmail,
      name: "Admin",
      role: "admin",
    },
  });
}
