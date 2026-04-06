import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

interface Post {
  id: number | string;
  title: string;
  url: string;
}

interface LinkSuggestion {
  anchor_text: string;
  target_url: string;
  context: string;
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { content, title, all_posts = [] } = await req.json();

    if (!content) return apiError(400, "missing_content", "content is required");

    const posts = (all_posts as Post[]).slice(0, 50); // cap at 50 to avoid token overflow

    const postList = posts.length > 0
      ? posts.map(p => `- ${p.title} → ${p.url}`).join("\n")
      : "No other posts provided.";

    const systemPrompt = `You are an SEO expert specializing in internal linking strategy.
Analyze the provided article and the list of other posts on the site.
Identify the best opportunities to add internal links that would:
1. Naturally fit the flow of the content
2. Provide value to readers by linking to genuinely related content
3. Improve the site's topical authority and crawlability

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "suggestions": [
    {
      "anchor_text": "<exact text from the article that should become a link>",
      "target_url": "<URL from the provided post list>",
      "context": "<brief explanation of why this link makes sense>"
    }
  ]
}
Provide 3-8 suggestions. Only use URLs from the provided post list. Only use anchor text that appears verbatim in the content.`;

    const userPrompt = `Current article title: ${title || "Untitled"}

Other posts available for linking:
${postList}

Article content:
${content.substring(0, 6000)}`;

    const response = await callAI(systemPrompt, userPrompt, 1000);

    let result: { suggestions: LinkSuggestion[] };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      result = { suggestions: [] };
    }

    if (!Array.isArray(result.suggestions)) result.suggestions = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-internal-links]", error);
    return apiError(500, "linking_failed", "Internal link suggestion failed");
  }
}
