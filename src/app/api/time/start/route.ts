import { NextResponse } from "next/server";
import { startTimer } from "@/lib/time-tracker";

export const runtime = "nodejs";

interface StartBody {
  userId?: string;
  projectId?: string;
  description?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.userId || !body.projectId) {
    return NextResponse.json({ error: "userId and projectId required" }, { status: 400 });
  }
  try {
    const entry = await startTimer({
      userId: body.userId,
      projectId: body.projectId,
      description: body.description,
    });
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start timer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
