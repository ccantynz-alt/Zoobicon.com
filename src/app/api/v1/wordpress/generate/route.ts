import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { type = "blog_post", prompt, tone = "professional", length = "medium", site_name } = await req.json();

    if (!prompt) return apiError(400, "missing_prompt", "A prompt is required");

    const lengthGuide = { short: "300-500 words", medium: "800-1200 words", long: "1500-2500 words" }[length] || "800-1200 words";

    const systemPrompt = `You are an expert content writer. Generate high-quality ${type.replace(/_/g, " ")} content.
Write in a ${tone} tone. Target length: ${lengthGuide}.
${site_name ? `This is for the website: ${site_name}` : ""}
Output ONLY the content in clean HTML format (use <h2>, <p>, <ul>, <li>, <strong>, <em> tags).
Do not include <html>, <head>, <body> tags — just the content markup.`;

    const content = await callAI(systemPrompt, prompt, length === "long" ? 4000 : 2000);

    return apiResponse({ content, type, tone, length });
  } catch (error) {
    console.error("[wp-generate]", error);
    return apiError(500, "generation_failed", "Content generation failed");
  }
}
