import { NextRequest, NextResponse } from "next/server";
import { getAvailability, getProviderName } from "@/lib/booking-provider";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId") || "default";
    const serviceId = req.nextUrl.searchParams.get("serviceId");
    const date = req.nextUrl.searchParams.get("date");

    if (!serviceId || !date) {
      return NextResponse.json({ error: "serviceId and date are required" }, { status: 400 });
    }

    const slots = await getAvailability(businessId, serviceId, date);

    return NextResponse.json({
      provider: getProviderName(),
      date,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length,
      slots,
    });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
