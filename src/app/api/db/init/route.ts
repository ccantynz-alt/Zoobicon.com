import { initSchema } from "@/lib/db";

/**
 * GET /api/db/init
 * Runs CREATE TABLE IF NOT EXISTS for all tables.
 * Safe to run multiple times — only creates tables that don't exist.
 */
export async function GET() {
  try {
    await initSchema();
    return new Response(JSON.stringify({ ok: true, message: "Schema ready — all tables created." }), {
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
