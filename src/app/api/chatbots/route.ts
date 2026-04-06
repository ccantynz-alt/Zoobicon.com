import { NextRequest, NextResponse } from "next/server";
import { createChatbot, getUserChatbots } from "@/lib/chatbot-builder";
import type { ChatbotConfig } from "@/lib/chatbot-widget";

/**
 * GET /api/chatbots — List all chatbots for the authenticated user
 * POST /api/chatbots — Create a new chatbot
 */

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const chatbots = await getUserChatbots(email);
    return NextResponse.json({ chatbots });
  } catch (error) {
    console.error("[chatbots-list]", error);
    return NextResponse.json({ error: "Failed to fetch chatbots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      businessDescription,
      greeting,
      primaryColor = "#8b5cf6",
      position = "bottom-right",
      collectEmail = true,
      knowledgeBase,
      humanEscalationEmail,
    } = body;

    if (!businessName || !businessDescription) {
      return NextResponse.json(
        { error: "businessName and businessDescription are required" },
        { status: 400 }
      );
    }

    const config: ChatbotConfig = {
      businessName,
      businessDescription,
      greeting: greeting || `Hi! I'm the ${businessName} assistant. How can I help?`,
      primaryColor,
      position,
      collectEmail,
      knowledgeBase,
      humanEscalationEmail,
    };

    const chatbot = await createChatbot(email, config);
    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (error) {
    console.error("[chatbot-create]", error);
    return NextResponse.json({ error: "Failed to create chatbot" }, { status: 500 });
  }
}
