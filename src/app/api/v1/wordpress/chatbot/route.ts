import { NextRequest } from "next/server";
import { authenticateWordPressRequest, apiResponse, apiError } from "@/lib/wordpress-api";
import { createChatbot } from "@/lib/chatbot-builder";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const {
      business_name,
      business_description,
      greeting,
      color = "#6366f1",
      site_url,
    } = await req.json();

    if (!business_name) return apiError(400, "missing_business_name", "business_name is required");
    if (!business_description) return apiError(400, "missing_description", "business_description is required");

    const config = {
      businessName: business_name,
      businessDescription: business_description,
      greeting: greeting || `Hi! I'm the ${business_name} assistant. How can I help you today?`,
      primaryColor: color,
      siteUrl: site_url || auth.siteUrl || "",
      knowledgeBase: business_description,
    };

    const chatbot = await createChatbot(auth.sub, config);

    return apiResponse({
      chatbot_id: chatbot.id,
      embed_code: chatbot.embedCode,
    });
  } catch (error) {
    console.error("[wp-chatbot]", error);
    return apiError(500, "chatbot_failed", "Chatbot creation failed");
  }
}
