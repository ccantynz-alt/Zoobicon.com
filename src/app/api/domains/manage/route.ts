import { NextRequest, NextResponse } from "next/server";
import { getAllTldPricing, getTldPricing } from "@/lib/domain-reseller";

// ---------------------------------------------------------------------------
// GET /api/domains/manage — Domain management utilities
//
// ?action=pricing         — Get all TLD pricing
// ?action=pricing&tld=com — Get specific TLD pricing
// ?action=whois&domain=x  — WHOIS lookup (stub)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");

    switch (action) {
      case "pricing": {
        const tld = req.nextUrl.searchParams.get("tld");
        if (tld) {
          return NextResponse.json({ pricing: getTldPricing(tld) });
        }
        return NextResponse.json({ pricing: getAllTldPricing() });
      }

      case "whois": {
        const domain = req.nextUrl.searchParams.get("domain");
        if (!domain) {
          return NextResponse.json(
            { error: "domain is required for WHOIS lookup." },
            { status: 400 }
          );
        }
        // In production, use OpenSRS WHOIS or RDAP
        return NextResponse.json({
          domain,
          message: "WHOIS lookup — connect OpenSRS WHOIS API for live data.",
          registrar: "Tucows Domains Inc. (via Zoobicon.io)",
          nameservers: ["ns1.zoobicon.io", "ns2.zoobicon.io"],
        });
      }

      default:
        return NextResponse.json({
          availableActions: ["pricing", "whois"],
          example: "/api/domains/manage?action=pricing",
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
