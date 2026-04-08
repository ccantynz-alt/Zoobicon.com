import { NextRequest, NextResponse } from "next/server";
import { computeMonthlyPayout, createTransfer } from "@/lib/stripe-connect";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe Connect unavailable — STRIPE_SECRET_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { agencyId?: string; accountId?: string };
  try {
    body = (await req.json()) as { agencyId?: string; accountId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agencyId, accountId } = body;
  if (!agencyId || !accountId) {
    return NextResponse.json(
      { error: "agencyId and accountId are required" },
      { status: 400 }
    );
  }

  try {
    const payout = await computeMonthlyPayout(agencyId);
    if (payout.netCents <= 0) {
      return NextResponse.json(
        { error: "No payable balance for this agency this month", payout },
        { status: 400 }
      );
    }

    const transfer = await createTransfer(
      accountId,
      payout.netCents,
      payout.currency,
      `Zoobicon agency monthly payout — ${agencyId}`
    );

    return NextResponse.json({
      transferId: transfer.id,
      amount: payout.netCents,
      currency: payout.currency,
      grossCents: payout.grossCents,
      platformFeeCents: payout.platformFeeCents,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Payout failed: ${message}` },
      { status: 500 }
    );
  }
}
