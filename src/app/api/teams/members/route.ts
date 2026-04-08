import { NextRequest, NextResponse } from "next/server";
import { listMembers, removeMember, updateRole, type Role } from "@/lib/teams";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const teamId = req.nextUrl.searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }
    const members = await listMembers(teamId);
    return NextResponse.json({ members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      teamId?: string;
      userId?: string;
      role?: Role;
      updatedBy?: string;
    };
    if (!body.teamId || !body.userId || !body.role || !body.updatedBy) {
      return NextResponse.json(
        { error: "teamId, userId, role, updatedBy are required" },
        { status: 400 }
      );
    }
    const member = await updateRole(body.teamId, body.userId, body.role, body.updatedBy);
    return NextResponse.json({ member });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      teamId?: string;
      userId?: string;
      removedBy?: string;
    };
    if (!body.teamId || !body.userId || !body.removedBy) {
      return NextResponse.json(
        { error: "teamId, userId, removedBy are required" },
        { status: 400 }
      );
    }
    await removeMember(body.teamId, body.userId, body.removedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
