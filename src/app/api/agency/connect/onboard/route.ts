import { NextRequest, NextResponse } from "next/server";
import { createConnectedAccount } from "@/lib/stripe-connect";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe Connect unavailable — STRIPE_SECRET_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { agencyId?: string; email?: string; country?: string };
  try {
    body = (await req.json()) as { agencyId?: string; email?: string; country?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agencyId, email, country } = body;
  if (!agencyId || !email) {
    return NextResponse.json(
      { error: "agencyId and email are required" },
      { status: 400 }
    );
  }

  try {
    const result = await createConnectedAccount(agencyId, email, country || "US");
    return NextResponse.json({
      accountId: result.accountId,
      onboardingUrl: result.onboardingUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create Stripe Connect account: ${message}` },
      { status: 500 }
    );
  }
}
