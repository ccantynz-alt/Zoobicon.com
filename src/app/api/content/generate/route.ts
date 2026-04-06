import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  "Blog Post":
    "Write a well-structured blog post with an engaging introduction, clear subheadings (use ## for H2, ### for H3), body paragraphs with supporting details, and a conclusion with a call to action. Use markdown formatting.",
  "Product Description":
    "Write a compelling product description that highlights key features, benefits, and unique selling points. Use persuasive language that drives conversions. Include a headline, feature list, and closing CTA.",
  "Email Newsletter":
    "Write an email newsletter with a catchy subject line (on the first line prefixed with 'Subject: '), a personal greeting, engaging body content, and a clear call to action. Keep paragraphs short for readability.",
  "Social Media Post":
    "Write engaging social media content optimized for maximum engagement. Include relevant hashtag suggestions at the end. Keep it punchy, scannable, and shareable. If multiple posts are requested, separate them clearly.",
  "Landing Page Copy":
    "Write high-converting landing page copy with: a powerful headline, a supporting subheadline, 3-5 benefit-focused sections with short descriptions, social proof suggestions, and a compelling CTA. Use markdown formatting for structure.",
  "About Page":
    "Write a compelling About page that tells a brand story, establishes credibility, communicates values, and connects emotionally with the reader. Include sections for mission, story, team (if relevant), and values.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Professional:
    "Use a professional, polished tone. Be clear, authoritative, and business-appropriate. Avoid slang or overly casual language.",
  Casual:
    "Use a casual, conversational tone. Write as if talking to a friend. Use contractions, simple language, and a relaxed style.",
  Playful:
    "Use a playful, fun tone. Add wit, humor, and personality. Use creative language, wordplay, and an energetic style that entertains.",
  Authoritative:
    "Use an authoritative, expert tone. Demonstrate deep knowledge and confidence. Use data-driven language, industry terminology, and decisive statements.",
  Friendly:
    "Use a warm, friendly tone. Be approachable, empathetic, and encouraging. Write in a way that builds trust and rapport.",
};

const LENGTH_TOKENS: Record<string, number> = {
  Short: 600,
  Medium: 1400,
  Long: 3000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentType = "Blog Post",
      tone = "Professional",
      length = "Medium",
      topic,
      audience,
      keywords,
    } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const contentPrompt =
      CONTENT_TYPE_PROMPTS[contentType] || CONTENT_TYPE_PROMPTS["Blog Post"];
    const toneInstruction =
      TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS["Professional"];
    const maxTokens = LENGTH_TOKENS[length] || LENGTH_TOKENS["Medium"];

    const lengthGuidance =
      length === "Short"
        ? "Keep it concise — approximately 200 words."
        : length === "Medium"
          ? "Aim for approximately 500 words with good depth."
          : "Write a comprehensive, in-depth piece of 1000+ words.";

    const systemPrompt = `You are an expert content writer for Zoobicon, an AI website builder platform. You produce high-quality, publication-ready content.

${contentPrompt}

${toneInstruction}

${lengthGuidance}

${audience ? `Target audience: ${audience}` : ""}
${keywords ? `Incorporate these keywords naturally: ${keywords}` : ""}

Rules:
- Output ONLY the content. No meta-commentary like "Here's your blog post" or "I hope this helps."
- Use markdown formatting for structure (headings, bold, lists) where appropriate.
- Make every sentence purposeful. No filler.
- Ensure the content is original, engaging, and ready to publish.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Write ${contentType.toLowerCase()} content about: ${topic.trim()}`,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    const wordCount = content
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length;

    return NextResponse.json({ content, wordCount });
  } catch (error: unknown) {
    console.error("Content generation error:", error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
