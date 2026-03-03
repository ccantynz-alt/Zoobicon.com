import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are ZOOBICON, a futuristic AI website builder from the year 2040. 
You generate complete, single-file HTML websites based on user descriptions.

RULES:
- Output ONLY valid HTML. No markdown, no explanation, no backticks.
- Include all CSS inline in a <style> tag.
- Include all JavaScript inline in a <script> tag.
- Use modern CSS (grid, flexbox, custom properties, animations).
- Make designs visually striking — bold colors, smooth animations, clean typography.
- Use Google Fonts via CDN link for beautiful typography.
- The output must be a complete, self-contained HTML document.
- Make it responsive (works on mobile and desktop).
- NEVER include any text before or after the HTML. Just the HTML.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Build me a website: ${prompt}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const code = textBlock ? textBlock.text : "";

    // Clean up any accidental markdown wrappers
    const cleanCode = code
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({ code: cleanCode });
  } catch (err: unknown) {
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
