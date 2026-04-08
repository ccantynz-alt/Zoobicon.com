import { NextRequest, NextResponse } from "next/server";
import { createTeam } from "@/lib/teams";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { ownerId?: string; name?: string };
    if (!body.ownerId || !body.name) {
      return NextResponse.json({ error: "ownerId and name are required" }, { status: 400 });
    }
    const team = await createTeam(body.ownerId, body.name);
    return NextResponse.json({ team });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
