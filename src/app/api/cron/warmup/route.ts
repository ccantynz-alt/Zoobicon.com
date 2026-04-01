import { warmupModels } from "@/lib/api-gateway";

export const maxDuration = 30;

/**
 * GET /api/cron/warmup
 *
 * Called every 5 minutes by Vercel Cron to keep Replicate models warm.
 * Prevents cold starts that add 30-60 seconds to video generation.
 *
 * Add to vercel.json:
 * { "crons": [{ "path": "/api/cron/warmup", "schedule": "*/5 * * * *" }] }
 */
export async function GET(req: Request) {
  // Optional: verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await warmupModels();

  return Response.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
}
