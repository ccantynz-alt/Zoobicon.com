import { NextRequest, NextResponse } from "next/server";
import { addMessage, type SupportRole } from "@/lib/support-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      threadId: string;
      body: string;
      role: SupportRole;
    };
    if (!body.threadId || !body.body || !body.role) {
      return NextResponse.json({ error: "threadId, body, and role are required" }, { status: 400 });
    }
    const message = await addMessage(body.threadId, body.role, body.body);
    return NextResponse.json({ message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
