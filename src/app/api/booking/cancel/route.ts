import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/booking-engine";

interface CancelBody {
  bookingId?: string;
  customerEmail?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CancelBody;
  try {
    body = (await req.json()) as CancelBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookingId, customerEmail } = body;
  if (!bookingId || !customerEmail) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["bookingId", "customerEmail"],
      },
      { status: 400 }
    );
  }

  try {
    await cancelBooking(bookingId, customerEmail);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to cancel booking", detail: message },
      { status: 404 }
    );
  }
}
