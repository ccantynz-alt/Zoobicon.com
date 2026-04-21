import { NextResponse } from "next/server";
import { trackEngagement } from "@/lib/lead-scoring";

export const runtime = "nodejs";

interface TrackRequestBody {
  leadId: string;
  event: string;
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 503 }
    );
  }
  let body: TrackRequestBody;
  try {
    body = (await req.json()) as TrackRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.leadId || !body.event) {
    return NextResponse.json(
      { error: "leadId and event are required" },
      { status: 400 }
    );
  }

  try {
    const result = await trackEngagement(body.leadId, body.event);
    if (!result.ok) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Track error" },
      { status: 500 }
    );
  }
}
