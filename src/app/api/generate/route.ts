import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Zoobicon, an elite AI website generator. When given a description, you produce a single, complete, production-quality HTML file.

Rules:
- Output ONLY the HTML. No markdown, no explanation, no code fences.
- The HTML must be a complete document with <!DOCTYPE html>, <html>, <head>, and <body>.
- Include all CSS inline in a <style> tag in the <head>. Do NOT use external stylesheets.
- Include any JavaScript inline in a <script> tag before </body>.
- Use modern CSS (flexbox, grid, custom properties, gradients, animations).
- Make the design visually stunning, polished, and professional.
- The page must be fully responsive and work on mobile.
- Use Google Fonts via @import if typography is needed.
- Add subtle animations and micro-interactions where appropriate.
- If images are needed, use placeholder services like https://picsum.photos or solid color blocks.
- The page should feel complete and production-ready, not a wireframe.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Build me a website: ${prompt}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let html = textBlock.text.trim();

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html });
  } catch (err) {
    console.error("Generation error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
