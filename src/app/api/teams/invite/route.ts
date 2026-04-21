import { NextRequest, NextResponse } from "next/server";
import { inviteMember, type Role } from "@/lib/teams";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      teamId?: string;
      email?: string;
      role?: Role;
      invitedBy?: string;
    };
    if (!body.teamId || !body.email || !body.role || !body.invitedBy) {
      return NextResponse.json(
        { error: "teamId, email, role, invitedBy are required" },
        { status: 400 }
      );
    }
    const result = await inviteMember(body.teamId, body.email, body.role, body.invitedBy);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
