import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/domain-pricing";

export const runtime = "nodejs";

const TOP_15: readonly string[] = [
  "com", "net", "org", "ai", "io", "sh", "dev", "app",
  "co", "xyz", "me", "info", "tv", "cloud", "shop",
];

export async function GET(): Promise<NextResponse> {
  const snapshot = getMarketSnapshot(TOP_15);
  const totalOurPrice = snapshot.reduce((s, e) => s + e.ourPrice, 0);
  const totalGodaddy = snapshot.reduce((s, e) => s + e.godaddy, 0);
  const totalNamecheap = snapshot.reduce((s, e) => s + e.namecheap, 0);
  return NextResponse.json({
    snapshot,
    summary: {
      tldsTracked: snapshot.length,
      totalOurPriceCents: totalOurPrice,
      totalGodaddyCents: totalGodaddy,
      totalNamecheapCents: totalNamecheap,
      avgSavingsVsGodaddyPct:
        snapshot.length > 0
          ? Math.round(
              (snapshot.reduce((s, e) => s + e.ourSavingsVsGodaddyPct, 0) / snapshot.length) * 10,
            ) / 10
          : 0,
      avgSavingsVsNamecheapPct:
        snapshot.length > 0
          ? Math.round(
              (snapshot.reduce((s, e) => s + e.ourSavingsVsNamecheapPct, 0) / snapshot.length) * 10,
            ) / 10
          : 0,
    },
    source: "OpenSRS/Tucows wholesale + GoDaddy/Namecheap publicly listed pricing as of 2026-04",
    currency: "USD",
    unit: "cents",
  });
}
