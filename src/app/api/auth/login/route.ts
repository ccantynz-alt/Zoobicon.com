import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    // Check admin login first (env-based)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@zoobicon.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
      adminPassword &&
      email.toLowerCase() === adminEmail.toLowerCase() &&
      password === adminPassword
    ) {
      return Response.json({
        user: {
          email: adminEmail,
          name: "Admin",
          role: "admin",
          plan: "unlimited",
        },
      });
    }

    // Check database for regular users
    const [user] = await sql`
      SELECT id, email, name, role, plan, password_hash
      FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `;

    if (!user || !user.password_hash) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return Response.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Auth error" }, { status: 500 });
  }
}
