import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { content, title, url } = await req.json();

    if (!content && !title) return apiError(400, "missing_content", "Content or title is required");

    const systemPrompt = `You are an SEO expert. Generate optimized meta tags for the given content.
Return a JSON object with these exact keys:
- meta_title: string (50-60 characters, compelling, includes primary keyword)
- meta_description: string (140-160 characters, includes call-to-action)
- keywords: string[] (5-10 relevant keywords)
- og_title: string (same as meta_title or slightly different for social)
- og_description: string (same as meta_description or slightly different for social)
Return ONLY valid JSON, no markdown or explanation.`;

    const userPrompt = `Title: ${title || "Untitled"}
${url ? `URL: ${url}` : ""}
Content (first 2000 chars): ${(content || "").substring(0, 2000)}`;

    const response = await callAI(systemPrompt, userPrompt, 500);

    try {
      const seo = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      return apiResponse(seo);
    } catch {
      return apiResponse({
        meta_title: title || "Untitled",
        meta_description: (content || "").substring(0, 155),
        keywords: [],
      });
    }
  } catch (error) {
    console.error("[wp-seo]", error);
    return apiError(500, "seo_failed", "SEO optimization failed");
  }
}
