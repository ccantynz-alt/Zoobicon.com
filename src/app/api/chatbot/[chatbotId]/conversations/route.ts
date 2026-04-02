import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/chatbot/[chatbotId]/conversations — List recent conversations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conversations = await sql`
      SELECT id, visitor_email, visitor_name, message_count,
             started_at, last_message_at, satisfaction, escalated
      FROM chatbot_conversations
      WHERE chatbot_id = ${chatbotId}
      ORDER BY last_message_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM chatbot_conversations WHERE chatbot_id = ${chatbotId}
    `;

    return NextResponse.json({
      conversations,
      total: parseInt(countResult?.total as string) || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[chatbot-conversations]", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
