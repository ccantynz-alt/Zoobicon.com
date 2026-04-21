import { warmupModels } from "@/lib/api-gateway";

export const maxDuration = 30;

/**
 * GET/POST /api/cron/warmup
 *
 * Called every 5 minutes by Vercel Cron (GET) or QStash (POST) to keep Replicate models warm.
 * Prevents cold starts that add 30-60 seconds to video generation.
 *
 * QStash provides: retry with backoff, DLQ, delivery logging.
 * Vercel cron is kept as fallback.
 */

async function verifyCronAuth(req: Request): Promise<boolean> {
  // QStash requests are verified via signature (handled by verifySignatureAppRouter wrapper)
  // Vercel Cron sends x-vercel-cron header
  if (req.headers.get("x-vercel-cron")) return true;
  // Manual trigger with CRON_SECRET
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) return true;
  if (!process.env.CRON_SECRET) return true; // Dev mode
  return false;
}

async function handler(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await warmupModels();

  return Response.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
}

export async function GET(req: Request) {
  return handler(req);
}

// QStash sends POST requests
export async function POST(req: Request) {
  // If QStash signing keys are configured, verify the signature
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
      const verified = verifySignatureAppRouter(handler);
      return verified(req);
    } catch {
      // Signature verification failed or module not available — fall through to normal auth
    }
  }
  return handler(req);
}
