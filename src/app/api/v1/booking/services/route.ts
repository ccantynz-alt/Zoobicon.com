import { NextRequest, NextResponse } from "next/server";
import { getServices, createService, getBookingPlans, getProviderName } from "@/lib/booking-provider";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId") || "default";
    const [services, plans] = await Promise.all([getServices(businessId), getBookingPlans()]);
    return NextResponse.json({ provider: getProviderName(), services, plans });
  } catch (err) {
    console.error("Booking services error:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.durationMinutes) {
      return NextResponse.json({ error: "name and durationMinutes are required" }, { status: 400 });
    }
    const service = await createService({
      businessId: body.businessId || "default",
      name: body.name,
      description: body.description || "",
      durationMinutes: body.durationMinutes,
      price: body.price || 0,
      currency: body.currency || "USD",
      category: body.category || "general",
      staffIds: body.staffIds || [],
      bufferBeforeMinutes: body.bufferBeforeMinutes || 0,
      bufferAfterMinutes: body.bufferAfterMinutes || 0,
      maxAdvanceDays: body.maxAdvanceDays || 30,
      requiresDeposit: body.requiresDeposit || false,
      depositAmount: body.depositAmount || 0,
      active: true,
    });
    return NextResponse.json({ success: true, service });
  } catch (err) {
    console.error("Create service error:", err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
