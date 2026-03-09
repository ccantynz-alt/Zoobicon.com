import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      return Response.json({ error: "Password must contain an uppercase letter" }, { status: 400 });
    }

    if (!/\d/.test(password)) {
      return Response.json({ error: "Password must contain a number" }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email.toLowerCase()}, ${name || ""}, ${passwordHash})
      RETURNING id, email, name, role, plan
    `;

    return Response.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}
