import { NextRequest, NextResponse } from "next/server";
import { checkWithFallback } from "@/lib/opensrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TLD_PRICES: Record<string, number> = {
  com: 12.99,
  ai: 79.99,
  io: 39.99,
  co: 29.99,
  sh: 24.99,
  dev: 14.99,
  app: 14.99,
  xyz: 2.99,
};

const TLDS = ["com", "ai", "io", "co", "sh", "dev", "app", "xyz"];

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawName: string = body?.siteName || "";
    const slug = slugify(rawName);

    if (!slug) {
      return NextResponse.json({ siteName: "", suggestions: [] });
    }

    const results = await Promise.all(
      TLDS.map(async (tld) => {
        const domain = `${slug}.${tld}`;
        let available: boolean | null = null;
        try {
          available = await checkWithFallback(domain);
        } catch {
          available = null;
        }
        return {
          domain,
          tld,
          available: available === true,
          unknown: available === null,
          price: TLD_PRICES[tld] ?? 19.99,
          recommended: false,
        };
      })
    );

    // Sort: .com first if available, then available by price asc, then unknown, then taken
    const sorted = [...results].sort((a, b) => {
      const aRank = a.available ? 0 : a.unknown ? 1 : 2;
      const bRank = b.available ? 0 : b.unknown ? 1 : 2;
      if (aRank !== bRank) return aRank - bRank;
      if (a.tld === "com" && a.available) return -1;
      if (b.tld === "com" && b.available) return 1;
      return a.price - b.price;
    });

    const firstAvailable = sorted.find((s) => s.available);
    if (firstAvailable) firstAvailable.recommended = true;

    return NextResponse.json({ siteName: slug, suggestions: sorted });
  } catch (err) {
    return NextResponse.json({ siteName: "", suggestions: [] });
  }
}
