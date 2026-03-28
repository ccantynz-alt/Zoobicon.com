import { NextRequest, NextResponse } from "next/server";
import { getEsimPlans, getProviderName } from "@/lib/esim-provider";

/**
 * GET /api/v1/esim/plans?destination=Australia
 *
 * Returns available eSIM plans, optionally filtered by destination.
 */
export async function GET(req: NextRequest) {
  try {
    const destination = req.nextUrl.searchParams.get("destination") || undefined;
    const plans = await getEsimPlans(destination);

    return NextResponse.json({
      provider: getProviderName(),
      count: plans.length,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        destination: p.destination,
        destinationCode: p.destinationCode,
        dataGB: p.dataAmountGB,
        validityDays: p.validityDays,
        price: p.price,
        currency: p.currency,
        networkType: p.networkType,
        countries: p.countries,
      })),
    });
  } catch (err) {
    console.error("eSIM plans error:", err);
    return NextResponse.json(
      { error: "Failed to fetch eSIM plans" },
      { status: 500 }
    );
  }
}
