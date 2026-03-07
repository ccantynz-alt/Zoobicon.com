import { NextRequest } from "next/server";
import { initSchema } from "@/lib/db";

/**
 * GET /api/db/init
 * Runs CREATE TABLE IF NOT EXISTS for all tables.
 * Protected by ADMIN_PASSWORD — call once after deploying.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.ADMIN_PASSWORD}`;

  if (!process.env.ADMIN_PASSWORD || auth !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await initSchema();
    return new Response(JSON.stringify({ ok: true, message: "Schema ready" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
