import { NextRequest, NextResponse } from "next/server";
import {
  listThreads,
  createThread,
  aiTriage,
  addMessage,
  assignAI,
  type SupportChannel,
  type SupportStatus,
  type ThreadFilter,
} from "@/lib/support-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const filter: ThreadFilter = {};
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const aiHandled = searchParams.get("aiHandled");
    const limit = searchParams.get("limit");
    if (status) filter.status = status as SupportStatus;
    if (channel) filter.channel = channel as SupportChannel;
    if (aiHandled !== null) filter.aiHandled = aiHandled === "true";
    if (limit) filter.limit = Number(limit);
    const threads = await listThreads(filter);
    return NextResponse.json({ threads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      channel: SupportChannel;
      customerId?: string | null;
      customerEmail?: string | null;
      subject?: string | null;
      body: string;
      priority?: number;
    };
    if (!body.channel || !body.body) {
      return NextResponse.json({ error: "channel and body are required" }, { status: 400 });
    }
    const thread = await createThread(body);

    let triage = null;
    try {
      const result = await aiTriage(body.body);
      triage = result;
      if (result.autoHandled) {
        await addMessage(thread.id, "ai", result.suggestedReply);
        await assignAI(thread.id);
      }
    } catch (triageErr) {
      const message = triageErr instanceof Error ? triageErr.message : "Triage failed";
      return NextResponse.json({ thread, triage: null, triageError: message }, { status: 200 });
    }

    return NextResponse.json({ thread, triage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
