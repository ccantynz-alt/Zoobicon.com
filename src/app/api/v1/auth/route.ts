/**
 * POST /api/v1/auth
 *
 * Auth for end-users of generated sites (not Zoobicon users).
 * Each generated site has its own isolated user pool in site_users,
 * keyed by projectId. CORS is open so deployed sites at *.zoobicon.sh
 * can call this from their JavaScript.
 *
 * Body: { action: "signup" | "signin", projectId, email, password }
 * Response: { token, user: { id, email } }
 */

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function errRes(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const toB64 = (buf: ArrayBufferLike) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `${toB64(salt)}:${toB64(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64;
}

async function signToken(sub: string, email: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? process.env.DATABASE_URL?.slice(0, 32) ?? "zbk-dev-secret-000000000000";
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
  const payload = btoa(
    JSON.stringify({
      sub,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 86_400,
    })
  ).replace(/=/g, "");
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${payload}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${header}.${payload}.${sigB64}`;
}

export async function POST(req: NextRequest) {
  let body: { action?: string; projectId?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return errRes(400, "Invalid JSON");
  }

  const { action, projectId, email, password } = body;

  if (!action || !projectId || !email || !password) {
    return errRes(400, "action, projectId, email, and password are required");
  }
  if (!email.includes("@")) return errRes(400, "Invalid email address");
  if (password.length < 6) return errRes(400, "Password must be at least 6 characters");

  const lowerEmail = email.toLowerCase().trim();

  try {
    if (action === "signup") {
      const existing = await sql`
        SELECT id FROM site_users
        WHERE project_id = ${projectId} AND email = ${lowerEmail}
      `;
      if (existing.length > 0) {
        return errRes(409, "An account with this email already exists");
      }
      const passwordHash = await hashPassword(password);
      const [user] = await sql`
        INSERT INTO site_users (project_id, email, password_hash)
        VALUES (${projectId}, ${lowerEmail}, ${passwordHash})
        RETURNING id, email
      `;
      const token = await signToken(user.id, user.email);
      return Response.json({ token, user: { id: user.id, email: user.email } }, { headers: CORS_HEADERS });
    }

    if (action === "signin") {
      const [user] = await sql`
        SELECT id, email, password_hash FROM site_users
        WHERE project_id = ${projectId} AND email = ${lowerEmail}
      `;
      if (!user) return errRes(401, "No account found with this email");
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) return errRes(401, "Incorrect password");
      await sql`UPDATE site_users SET last_seen = NOW() WHERE id = ${user.id}`;
      const token = await signToken(user.id, user.email);
      return Response.json({ token, user: { id: user.id, email: user.email } }, { headers: CORS_HEADERS });
    }

    return errRes(400, "action must be 'signup' or 'signin'");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("site_users")) {
      return errRes(503, "Database not ready — visit /api/db/init to initialise");
    }
    return errRes(500, "Server error");
  }
}
