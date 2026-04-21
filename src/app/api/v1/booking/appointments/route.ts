import { NextRequest, NextResponse } from "next/server";
import { createAppointment, getAppointments, cancelAppointment, getProviderName } from "@/lib/booking-provider";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId") || "default";
    const from = req.nextUrl.searchParams.get("from") || undefined;
    const to = req.nextUrl.searchParams.get("to") || undefined;
    const appointments = await getAppointments(businessId, from, to);
    return NextResponse.json({ provider: getProviderName(), count: appointments.length, appointments });
  } catch (err) {
    console.error("Get appointments error:", err);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.serviceId || !body.customerName || !body.customerEmail || !body.start || !body.end) {
      return NextResponse.json({ error: "serviceId, customerName, customerEmail, start, and end are required" }, { status: 400 });
    }
    const appointment = await createAppointment({
      businessId: body.businessId || "default",
      serviceId: body.serviceId,
      serviceName: body.serviceName || "",
      staffId: body.staffId || "",
      staffName: body.staffName || "",
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      start: body.start,
      end: body.end,
      status: "confirmed",
      notes: body.notes,
      price: body.price || 0,
      currency: body.currency || "USD",
      source: body.source || "api",
    });
    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    console.error("Create appointment error:", err);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const reason = req.nextUrl.searchParams.get("reason") || undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const success = await cancelAppointment(id, reason);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
