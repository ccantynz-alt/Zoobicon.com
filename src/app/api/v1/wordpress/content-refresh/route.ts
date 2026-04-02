import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { content, title, published_date } = await req.json();

    if (!content) return apiError(400, "missing_content", "content is required");

    // Calculate content age for context
    let ageDescription = "unknown age";
    if (published_date) {
      const pubDate = new Date(published_date);
      if (!isNaN(pubDate.getTime())) {
        const ageMs = Date.now() - pubDate.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageMonths = Math.floor(ageDays / 30);
        const ageYears = Math.floor(ageDays / 365);
        ageDescription =
          ageYears >= 1 ? `${ageYears} year${ageYears > 1 ? "s" : ""} old` :
          ageMonths >= 1 ? `${ageMonths} month${ageMonths > 1 ? "s" : ""} old` :
          `${ageDays} days old`;
      }
    }

    const systemPrompt = `You are an expert content editor specializing in refreshing and updating existing web content.
The article below is ${ageDescription}. Your tasks:
1. Update any outdated statistics, dates, or information with current estimates (note what you changed)
2. Improve clarity, flow, and readability where needed
3. Remove or update any references that are clearly outdated
4. Strengthen the introduction and conclusion if weak
5. Fix any grammar or style issues
6. Return a JSON object with EXACTLY these keys (no markdown, no explanation):
{
  "content": "<the refreshed full content in clean HTML format using h2, p, ul, li, strong, em tags>",
  "changes_made": ["<change 1>", "<change 2>", ...],
  "freshness_score": <number 0-100 representing how current the content now is>
}`;

    const userPrompt = `Title: ${title || "Untitled"}
Published: ${published_date || "Unknown"}
Age: ${ageDescription}

Content to refresh:
${content.substring(0, 8000)}`;

    const response = await callAI(systemPrompt, userPrompt, 4000);

    let result: { content: string; changes_made: string[]; freshness_score: number };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // If JSON parse fails, return the raw response as refreshed content
      result = {
        content: response,
        changes_made: ["Content refreshed and updated for current relevance"],
        freshness_score: 80,
      };
    }

    result.freshness_score = Math.min(100, Math.max(0, result.freshness_score || 80));
    if (!Array.isArray(result.changes_made)) result.changes_made = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-content-refresh]", error);
    return apiError(500, "refresh_failed", "Content refresh failed");
  }
}
