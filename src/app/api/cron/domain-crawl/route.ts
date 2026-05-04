/**
 * POST/GET /api/cron/domain-crawl
 *
 * Background crawler tick. Vercel cron + QStash both call this; either
 * handler runs one CRAWL_BATCH_SIZE pass for a single TLD per invocation.
 * The TLD is round-robin'd across ticks via the `t` query param so the
 * scheduler doesn't need per-TLD entries.
 *
 * Triggered every 5 minutes (vercel.json) → over a 24h period that's ~288
 * ticks × 50 labels per tick = 14,400 labels/day per TLD per round-robin
 * slot. The 4-char .com space (1.68M labels) finishes in ~5 months. The
 * 3-char .com space (46K labels) finishes in 3-4 days.
 *
 * Auth: requires CRON_SECRET in production. Dev mode (NODE_ENV !== prod)
 * allows unauth so local testing works.
 */

import { NextRequest, NextResponse } from "next/server";
import { CRAWL_TLDS, type CrawlTld, runCrawlTick } from "@/lib/domain-crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCronAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Dev / preview without CRON_SECRET set can run the crawler without auth
  // so local smoke tests don't get blocked. Production WITHOUT a secret is
  // a misconfig — refuse so anonymous callers can't burn RDAP budget.
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;
  // Vercel cron jobs send the secret in this header
  if (req.headers.get("x-vercel-cron-secret") === secret) return true;
  // QStash signing path runs the verifier separately; skip the static check
  if (req.headers.get("upstash-signature")) return true;
  return false;
}

function pickTld(req: NextRequest): CrawlTld {
  const explicit = req.nextUrl.searchParams.get("t");
  if (explicit && (CRAWL_TLDS as readonly string[]).includes(explicit)) {
    return explicit as CrawlTld;
  }
  // Round-robin by 5-minute slot — 12 slots/hour, mod the TLD count.
  const slot = Math.floor(Date.now() / (5 * 60 * 1000));
  return CRAWL_TLDS[slot % CRAWL_TLDS.length];
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorised(req)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message:
          "Set CRON_SECRET in Vercel and pass it as Authorization: Bearer <secret>.",
      },
      { status: 401 },
    );
  }

  const tld = pickTld(req);
  try {
    const result = await runCrawlTick(tld);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, tld, error: msg },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // QStash sends POST. If signing keys are present, verify the signature
  // before delegating. Same pattern as warm-replicate.
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
      const verified = verifySignatureAppRouter((r: Request) => GET(r as NextRequest));
      return verified(req) as Promise<NextResponse>;
    } catch {
      // fall through
    }
  }
  return GET(req);
}
