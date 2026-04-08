import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/booking-engine";

interface CreateBookingBody {
  calendarId?: string;
  customer?: { name?: string; email?: string };
  startsAt?: string;
  endsAt?: string;
  notes?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CreateBookingBody;
  try {
    body = (await req.json()) as CreateBookingBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { calendarId, customer, startsAt, endsAt, notes } = body;
  if (!calendarId || !customer?.name || !customer?.email || !startsAt || !endsAt) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["calendarId", "customer.name", "customer.email", "startsAt", "endsAt"],
      },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking(
      calendarId,
      { name: customer.name, email: customer.email },
      startsAt,
      endsAt,
      notes
    );
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("conflict")) {
      return NextResponse.json(
        { error: "Time slot conflict", detail: message, hint: "Pick a different time slot" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create booking", detail: message },
      { status: 500 }
    );
  }
}
