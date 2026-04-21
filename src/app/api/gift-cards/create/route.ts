import { NextRequest, NextResponse } from "next/server";
import { createGiftCard } from "@/lib/gift-cards";

export const runtime = "nodejs";

interface CreateBody {
  amount?: number;
  currency?: string;
  recipientEmail?: string | null;
  fromUserId?: string | null;
  message?: string | null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as CreateBody;
    if (typeof body.amount !== "number" || typeof body.currency !== "string") {
      return NextResponse.json({ error: "amount and currency required" }, { status: 400 });
    }
    const card = await createGiftCard({
      amount: body.amount,
      currency: body.currency,
      recipientEmail: body.recipientEmail ?? null,
      fromUserId: body.fromUserId ?? null,
      message: body.message ?? null,
    });
    return NextResponse.json({ success: true, card });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
