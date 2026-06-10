/**
 * /api/intel/hn/email — send the latest digest as an email via the
 * Vapron email service. Useful for "resend without re-running the
 * pipeline" from the admin dashboard, or for a separate morning cron
 * that just delivers (after a separate cron has built the digest).
 *
 * GET ?secret=$CRON_SECRET&to=<override>
 *
 * Returns { ok, sent, reason? }. Idempotent — Vapron dedupes on the
 * `hn-digest-<date>-<to>` messageId within 24h.
 */

import { NextResponse } from "next/server";
import { sendDigestEmail } from "@/lib/hn-flywheel";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = searchParams.get("to") || undefined;

  try {
    const result = await sendDigestEmail({ to });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, sent: false, reason: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
