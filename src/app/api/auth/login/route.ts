import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@zoobicon.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      // Admin login disabled if no password env var is set
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      email.toLowerCase() === adminEmail.toLowerCase() &&
      password === adminPassword
    ) {
      return new Response(
        JSON.stringify({
          user: {
            email: adminEmail,
            name: "Admin",
            role: "admin",
            plan: "unlimited",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Auth error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
