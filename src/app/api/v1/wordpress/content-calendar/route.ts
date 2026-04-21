import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 90;

interface CalendarPost {
  title: string;
  topic: string;
  keywords: string[];
  outline: string[];
}

interface CalendarWeek {
  week: number;
  posts: CalendarPost[];
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const {
      niche,
      topics = [],
      posts_per_week = 3,
      weeks = 4,
    } = await req.json();

    if (!niche) return apiError(400, "missing_niche", "niche is required");

    const cappedWeeks = Math.min(12, Math.max(1, parseInt(String(weeks)) || 4));
    const cappedPPW = Math.min(7, Math.max(1, parseInt(String(posts_per_week)) || 3));
    const totalPosts = cappedWeeks * cappedPPW;

    const topicContext = (topics as string[]).length > 0
      ? `Focus areas to cover: ${(topics as string[]).join(", ")}.`
      : "";

    const systemPrompt = `You are a content strategy expert who creates detailed, actionable content calendars.
Generate a ${cappedWeeks}-week content calendar for a ${niche} blog/website.
${topicContext}
Each post needs:
- A compelling, SEO-friendly title
- The main topic/category
- 3-5 target keywords
- A 4-6 point content outline

Ensure variety across weeks — mix educational, how-to, listicle, case study, and opinion post types.
Avoid repeating similar titles.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "calendar": [
    {
      "week": 1,
      "posts": [
        {
          "title": "<post title>",
          "topic": "<topic category>",
          "keywords": ["<kw1>", "<kw2>", "<kw3>"],
          "outline": ["<point 1>", "<point 2>", "<point 3>", "<point 4>"]
        }
      ]
    }
  ]
}
Generate exactly ${cappedWeeks} weeks with exactly ${cappedPPW} posts each (${totalPosts} total).`;

    const userPrompt = `Niche: ${niche}
Weeks: ${cappedWeeks}
Posts per week: ${cappedPPW}
${topicContext}`;

    const response = await callAI(systemPrompt, userPrompt, Math.min(4000, totalPosts * 200 + 500));

    let result: { calendar: CalendarWeek[] };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // Minimal fallback
      result = {
        calendar: Array.from({ length: cappedWeeks }, (_, wi) => ({
          week: wi + 1,
          posts: Array.from({ length: cappedPPW }, (_, pi) => ({
            title: `${niche} Guide Part ${wi * cappedPPW + pi + 1}`,
            topic: niche,
            keywords: [niche.toLowerCase(), "guide", "tips"],
            outline: ["Introduction", "Main points", "Examples", "Conclusion"],
          })),
        })),
      };
    }

    if (!Array.isArray(result.calendar)) result.calendar = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-content-calendar]", error);
    return apiError(500, "calendar_failed", "Content calendar generation failed");
  }
}
