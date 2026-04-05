import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 90;

const STYLE_GUIDES: Record<string, string> = {
  modern: "Clean, minimal, white space, bold typography, subtle shadows, gradient accents.",
  bold: "High contrast, strong colors, large headlines, energetic and impactful design.",
  corporate: "Professional, trustworthy, conservative color palette, formal tone.",
  startup: "Fresh, innovative, vibrant colors, conversational tone, social proof focused.",
  elegant: "Luxury feel, serif fonts, muted tones, refined and sophisticated.",
  conversion: "CTA-focused, urgency elements, trust badges, benefit-oriented copy, minimal distractions.",
};

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const {
      prompt,
      style = "modern",
      sections = ["hero", "features", "cta"],
    } = await req.json();

    if (!prompt) return apiError(400, "missing_prompt", "prompt is required");

    const styleGuide = STYLE_GUIDES[style] || STYLE_GUIDES.modern;
    const sectionList = (sections as string[]).join(", ");

    const systemPrompt = `You are an expert landing page designer and copywriter.
Generate a complete, beautiful landing page in HTML that includes these sections: ${sectionList}.
Style direction: ${styleGuide}
Requirements:
- Use inline CSS (no external stylesheets)
- Use modern CSS (flexbox, grid, CSS variables)
- Mobile-responsive with a <meta name="viewport"> tag
- Include semantic HTML5 elements (header, main, section, footer)
- All links use href="#" as placeholders
- Color scheme should match the style direction
- Include a compelling headline, subheadline, and clear CTAs
- Output ONLY the full HTML document — no markdown, no explanation`;

    const html = await callAI(systemPrompt, `Business/Product: ${prompt}`, 4000);

    // Count actual sections rendered
    const sectionMatches = html.match(/<section/gi) || [];

    // Extract title from generated HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : prompt.substring(0, 60);

    return apiResponse({
      html,
      title,
      sections_count: sectionMatches.length || sections.length,
    });
  } catch (error) {
    console.error("[wp-landing-page]", error);
    return apiError(500, "generation_failed", "Landing page generation failed");
  }
}
