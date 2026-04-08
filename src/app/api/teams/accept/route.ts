import { NextRequest, NextResponse } from "next/server";
import { acceptInvite } from "@/lib/teams";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { token?: string; userId?: string };
    if (!body.token || !body.userId) {
      return NextResponse.json({ error: "token and userId are required" }, { status: 400 });
    }
    const membership = await acceptInvite(body.token, body.userId);
    return NextResponse.json({ membership });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
