import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

const PLATFORM_GUIDES: Record<string, string> = {
  twitter: "280 characters max. Punchy, conversational, use 1-2 relevant hashtags. Can include a call-to-action.",
  linkedin: "Professional tone. 150-300 characters for best engagement. No hashtag spam — 2-3 max. Focus on insight or value.",
  facebook: "Conversational and warm. 40-80 characters gets best reach but can go longer. Can ask a question to drive comments.",
  instagram: "Engaging caption up to 2200 chars but first 125 chars are visible without 'more'. Use a hook opening line. Include 5-10 relevant hashtags at the end.",
};

const VALID_PLATFORMS = Object.keys(PLATFORM_GUIDES);

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const {
      content,
      title,
      platforms = ["twitter", "linkedin", "facebook", "instagram"],
    } = await req.json();

    if (!content && !title) return apiError(400, "missing_content", "content or title is required");

    const requestedPlatforms = (platforms as string[]).filter(p => VALID_PLATFORMS.includes(p));
    if (requestedPlatforms.length === 0) {
      return apiError(400, "invalid_platforms", `platforms must include at least one of: ${VALID_PLATFORMS.join(", ")}`);
    }

    const platformInstructions = requestedPlatforms
      .map(p => `${p.toUpperCase()}: ${PLATFORM_GUIDES[p]}`)
      .join("\n");

    const systemPrompt = `You are an expert social media copywriter.
Generate engaging social media posts for the following platforms based on the provided content.
Platform guidelines:
${platformInstructions}

Return ONLY valid JSON with platform names as keys — no markdown, no explanation:
{
  ${requestedPlatforms.map(p => `"${p}": "<post for ${p}>"`).join(",\n  ")}
}
Each post must follow that platform's specific guidelines above.`;

    const userPrompt = `Article title: ${title || "Untitled"}
Content preview: ${(content || "").substring(0, 2000)}`;

    const response = await callAI(systemPrompt, userPrompt, 1000);

    let posts: Record<string, string>;
    try {
      posts = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // Generate a generic fallback for each platform
      const excerpt = (content || title || "").substring(0, 100);
      posts = requestedPlatforms.reduce((acc, p) => {
        acc[p] = `${title || excerpt} — Read more on our website. #${p === "twitter" ? "content" : "blog"}`;
        return acc;
      }, {} as Record<string, string>);
    }

    // Ensure all requested platforms have a value
    for (const platform of requestedPlatforms) {
      if (!posts[platform]) posts[platform] = "";
    }

    return apiResponse({ posts });
  } catch (error) {
    console.error("[wp-social]", error);
    return apiError(500, "social_failed", "Social media post generation failed");
  }
}
