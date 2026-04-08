import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { content, style = "improve" } = await req.json();
    if (!content) return apiError(400, "missing_content", "Content to rewrite is required");

    const styleGuides: Record<string, string> = {
      improve: "Improve the writing quality, fix grammar, enhance clarity, and make it more engaging. Keep the same meaning and length.",
      simplify: "Simplify the text to be easily understood by a 12-year-old. Use shorter sentences and common words.",
      formal: "Rewrite in a formal, professional tone suitable for business communication.",
      casual: "Rewrite in a casual, conversational tone as if talking to a friend.",
      expand: "Expand the content with more detail, examples, and supporting points. Double the length.",
      shorten: "Condense to half the length while keeping all key points. Remove filler and redundancy.",
    };

    const systemPrompt = `You are an expert editor. ${styleGuides[style] || styleGuides.improve}
Output ONLY the rewritten content in clean HTML format (use <h2>, <p>, <ul>, <li>, <strong>, <em> tags).
Do not include any preamble, explanation, or commentary.`;

    const result = await callAI(systemPrompt, content.substring(0, 10000), 4000);
    return apiResponse({ content: result, style });
  } catch (error) {
    console.error("[wp-rewrite]", error);
    return apiError(500, "rewrite_failed", "Content rewriting failed");
  }
}
