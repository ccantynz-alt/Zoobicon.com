/**
 * Admin · Domain Crawl Status
 *
 * Observability endpoint for the domain availability crawler. Surfaces the
 * per-TLD cursor positions, totals, and last-tick metadata so an operator can
 * tell at a glance whether the crawler is healthy, stuck, or about to wrap.
 *
 * The wraparound estimate matters because the alphabet is base-36 and the
 * search space grows by 36x for each extra label character. Without a clear
 * "days until we exhaust this length" signal, we'd notice exhaustion only
 * after the wraparoundCount silently incremented — by which point we've
 * already re-checked names we paid OpenSRS for last week.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCrawlerStatus, CRAWL_TLDS } from "@/lib/domain-crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Base-36 alphabet used by the crawler: a..z then 0..9. Order matters because
// nextLabel() in domain-crawler.ts increments using this exact ordering, so
// the index we compute here must be consistent with how labels advance.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ALPHA_BASE = ALPHABET.length; // 36

// One crawler tick fires every 5 minutes (288/day). When N TLDs share the
// schedule round-robin, each TLD only sees ~288/N ticks per day, so a label's
// effective consumption rate must divide by the active TLD count.
const TICKS_PER_DAY = 288;

/**
 * Interpret a label as a base-36 integer in the crawler's alphabet.
 * "a"=0, "b"=1, ..., "z"=25, "0"=26, ..., "9"=35.
 * "aa"=0, "ab"=1, "az"=25, "a0"=26, ..., "99"=1295.
 *
 * We deliberately do NOT add length-prefix offsets — the wraparound math
 * below only cares about position within the current length bucket, since
 * incrementing past the last label of length L resets to length L (or
 * advances to L+1 on real wrap, which the crawler tracks separately).
 */
function alphaIndex(label: string): number {
  let idx = 0;
  for (const ch of label) {
    const pos = ALPHABET.indexOf(ch);
    // Unknown characters shouldn't appear, but if they do we treat them as 0
    // rather than NaN — a slightly low estimate beats poisoning the response.
    if (pos < 0) return idx * ALPHA_BASE;
    idx = idx * ALPHA_BASE + pos;
  }
  return idx;
}

interface ProviderStatus {
  tld: string;
  cursor: string;
  lastTickAt: string | null;
  lastTickCount: number;
  totalChecked: number;
  totalAvailable: number;
  wraparoundCount: number;
  estimatedDaysToWraparound: number | null;
  estimatedAvailableInTld: number;
}

interface StatusResponse {
  providers: ProviderStatus[];
  totals: {
    tldsTracked: number;
    totalChecked: number;
    totalAvailable: number;
  };
  now: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const rows = await getCrawlerStatus();

  // The crawler advances ~lastTickCount labels per tick, but only when it's
  // this TLD's turn in the round-robin. Dividing TICKS_PER_DAY by the number
  // of TLDs gives the realistic per-TLD daily pace.
  const activeTlds = Math.max(rows.length, CRAWL_TLDS.length, 1);
  const ticksPerTldPerDay = TICKS_PER_DAY / activeTlds;

  const providers: ProviderStatus[] = rows.map((r) => {
    const cursorLength = r.cursor.length || 1;
    const totalLabelsAtThisLength = Math.pow(ALPHA_BASE, cursorLength);
    const labelsRemaining = Math.max(
      totalLabelsAtThisLength - alphaIndex(r.cursor),
      0,
    );

    // No ticks yet → no defensible pace estimate. Returning null is more
    // honest than projecting infinity.
    const dailyPace =
      r.lastTickCount > 0 ? r.lastTickCount * ticksPerTldPerDay : 0;

    const estimatedDaysToWraparound =
      dailyPace > 0
        ? Math.round((labelsRemaining / dailyPace) * 10) / 10
        : null;

    return {
      tld: r.tld,
      cursor: r.cursor,
      lastTickAt: r.lastTickAt,
      lastTickCount: r.lastTickCount,
      totalChecked: r.totalChecked,
      totalAvailable: r.totalAvailable,
      wraparoundCount: r.wraparoundCount,
      estimatedDaysToWraparound,
      estimatedAvailableInTld: r.totalAvailable,
    };
  });

  const totals = providers.reduce(
    (acc, p) => {
      acc.totalChecked += p.totalChecked;
      acc.totalAvailable += p.totalAvailable;
      return acc;
    },
    { tldsTracked: providers.length, totalChecked: 0, totalAvailable: 0 },
  );

  const body: StatusResponse = {
    providers,
    totals,
    now: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
