import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { competitor_url, our_url } = await req.json();

    if (!competitor_url) return apiError(400, "missing_competitor_url", "competitor_url is required");

    // Validate URLs
    let competitorDomain: string;
    let ourDomain: string | null = null;

    try {
      competitorDomain = new URL(competitor_url).hostname;
    } catch {
      return apiError(400, "invalid_competitor_url", "competitor_url must be a valid URL including protocol (https://)");
    }

    if (our_url) {
      try {
        ourDomain = new URL(our_url).hostname;
      } catch {
        return apiError(400, "invalid_our_url", "our_url must be a valid URL including protocol (https://)");
      }
    }

    const systemPrompt = `You are a competitive intelligence and digital marketing expert.
Analyze the competitor website and provide a strategic competitive assessment.
Base your analysis on what can typically be inferred from the domain name, URL structure, and common patterns for this type of site.
Be specific, realistic, and actionable.

Return ONLY valid JSON — no markdown, no explanation:
{
  "analysis": "<2-3 paragraph competitive overview in plain English>",
  "strengths": [
    "<specific strength of the competitor>",
    "<another strength>",
    "<third strength>"
  ],
  "weaknesses": [
    "<specific weakness or gap in their offering>",
    "<another weakness>",
    "<third weakness>"
  ],
  "opportunities": [
    "<specific opportunity to differentiate or outperform>",
    "<another opportunity>",
    "<third opportunity>"
  ]
}
Provide 3-5 items in each array. Be specific to the domain/industry, not generic.`;

    const ourContext = ourDomain ? `\nOur website: ${our_url} (${ourDomain})` : "";
    const userPrompt = `Competitor website: ${competitor_url} (${competitorDomain})${ourContext}

Analyze this competitor and provide strategic insights on their strengths, weaknesses, and opportunities for us to differentiate.`;

    const response = await callAI(systemPrompt, userPrompt, 1500);

    let result: { analysis: string; strengths: string[]; weaknesses: string[]; opportunities: string[] };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      result = {
        analysis: `${competitorDomain} is a competitor in your market. A full competitive analysis requires reviewing their site directly, but based on their domain and positioning, there are several strategic considerations for your business.`,
        strengths: ["Established online presence", "Existing customer base", "Brand recognition in the market"],
        weaknesses: ["May lack personalization", "Potentially slower to adopt new technology", "Limited customization options for customers"],
        opportunities: ["Offer better customer service and response times", "Target underserved niches they ignore", "Build features they haven't shipped yet"],
      };
    }

    if (!Array.isArray(result.strengths)) result.strengths = [];
    if (!Array.isArray(result.weaknesses)) result.weaknesses = [];
    if (!Array.isArray(result.opportunities)) result.opportunities = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-competitor]", error);
    return apiError(500, "analysis_failed", "Competitor analysis failed");
  }
}
