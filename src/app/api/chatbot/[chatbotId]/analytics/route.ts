import { NextRequest, NextResponse } from "next/server";
import { getChatbotAnalytics } from "@/lib/chatbot-builder";

/**
 * GET /api/chatbot/[chatbotId]/analytics
 * Returns conversation stats for a chatbot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const analytics = await getChatbotAnalytics(chatbotId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[chatbot-analytics]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
