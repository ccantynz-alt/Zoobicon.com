import { NextRequest, NextResponse } from "next/server";
import { addKnowledge } from "@/lib/chatbot-builder";
import { sql } from "@/lib/db";

/**
 * GET /api/chatbot/[chatbotId]/knowledge — List knowledge base entries
 * POST /api/chatbot/[chatbotId]/knowledge — Add knowledge entry
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const entries = await sql`
      SELECT id, title, content, category, created_at
      FROM chatbot_knowledge
      WHERE chatbot_id = ${chatbotId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[chatbot-knowledge-list]", error);
    return NextResponse.json({ error: "Failed to fetch knowledge" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const body = await request.json();
    const { title, content, category = "general" } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    await addKnowledge(chatbotId, title, content, category);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[chatbot-knowledge-add]", error);
    return NextResponse.json({ error: "Failed to add knowledge" }, { status: 500 });
  }
}
