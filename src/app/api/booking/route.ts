import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ *
 *  GET /api/booking?action=types | appointments | slots | stats | settings | hours
 *  POST /api/booking  { action: "createType" | "createAppointment" | "updateStatus" | "saveSettings" | "saveHours" | "saveTypes" }
 *  PUT  /api/booking  { action: "updateStatus", id, status }
 * ------------------------------------------------------------------ */

// For MVP all data lives in client localStorage.
// The API acts as a thin pass-through that validates shape.
// A future upgrade would persist to Neon via src/lib/db.ts.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "types";

  // Since data is client-side for MVP, we return empty arrays/defaults.
  // The client reads localStorage directly; the API is here for future DB use.
  switch (action) {
    case "types":
      return NextResponse.json({ bookingTypes: [], source: "client" });
    case "appointments":
      return NextResponse.json({ appointments: [], source: "client" });
    case "slots": {
      const date = searchParams.get("date");
      const typeId = searchParams.get("typeId");
      if (!date || !typeId) {
        return NextResponse.json(
          { error: "date and typeId are required" },
          { status: 400 }
        );
      }
      return NextResponse.json({ slots: [], source: "client" });
    }
    case "stats":
      return NextResponse.json({
        stats: { totalBookings: 0, upcoming: 0, revenue: 0, completionRate: 0 },
        source: "client",
      });
    case "settings":
      return NextResponse.json({ settings: null, source: "client" });
    case "hours":
      return NextResponse.json({ hours: null, source: "client" });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "createType": {
        const { name, duration, price, description, location, slug } = body;
        if (!name || !duration || !slug) {
          return NextResponse.json(
            { error: "name, duration, and slug are required" },
            { status: 400 }
          );
        }
        // In production: INSERT INTO booking_types ...
        return NextResponse.json({
          success: true,
          bookingType: {
            id: `bt-${Date.now()}`,
            name,
            duration,
            price: price || 0,
            description: description || "",
            location: location || "video",
            slug,
            color: "#3b82f6",
            bufferMinutes: 10,
            maxAdvanceDays: 30,
            enabled: true,
          },
          source: "client",
        });
      }
      case "createAppointment": {
        const { bookingTypeId, clientName, clientEmail, dateTime, endTime } = body;
        if (!bookingTypeId || !clientName || !clientEmail || !dateTime) {
          return NextResponse.json(
            { error: "bookingTypeId, clientName, clientEmail, and dateTime are required" },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          appointment: {
            id: `apt-${Date.now()}`,
            bookingTypeId,
            clientName,
            clientEmail,
            dateTime,
            endTime: endTime || dateTime,
            status: "pending",
          },
          source: "client",
        });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "updateStatus") {
      const { id, status } = body;
      if (!id || !status) {
        return NextResponse.json(
          { error: "id and status are required" },
          { status: 400 }
        );
      }
      const validStatuses = ["confirmed", "pending", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        id,
        status,
        source: "client",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
