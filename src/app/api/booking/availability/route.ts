import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking-engine";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get("calendarId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!calendarId || !from || !to) {
      return NextResponse.json(
        {
          error: "Missing required query parameters",
          required: ["calendarId", "from", "to"],
          hint: "GET /api/booking/availability?calendarId=cal_xxx&from=2026-04-08T00:00:00Z&to=2026-04-09T00:00:00Z",
        },
        { status: 400 }
      );
    }

    const slots = await getAvailability(calendarId, from, to);
    return NextResponse.json({ ok: true, slots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch availability", detail: message },
      { status: 500 }
    );
  }
}
