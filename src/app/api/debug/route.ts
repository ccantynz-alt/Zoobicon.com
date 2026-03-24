import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MODELS = ["claude-sonnet-4-6", "claude-opus-4-6"] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];

const SYSTEM_PROMPT = `You are an expert code auditor and auto-debugger. You analyze HTML/CSS/JS code for errors and fix them.

You MUST return ONLY valid JSON with this exact structure (no markdown, no code fences, no extra text):

{
  "fixed_code": "<the complete fixed HTML/CSS/JS code as a string>",
  "issues": [
    {
      "type": "html" | "css" | "javascript" | "accessibility" | "responsive" | "performance",
      "severity": "error" | "warning" | "info",
      "message": "Description of the issue",
      "line": <optional line number>,
      "fix": "Description of what was fixed"
    }
  ],
  "score": <0-100 quality score>
}

Analysis categories:
1. HTML validation: unclosed tags, missing required attributes, invalid nesting, malformed doctype
2. CSS issues: invalid properties, missing vendor prefixes, layout bugs, specificity problems
3. JavaScript errors: syntax errors, undefined variables, missing event handlers, runtime issues
4. Accessibility: missing alt text, color contrast, ARIA labels, keyboard navigation, semantic HTML
5. Responsive design: missing viewport meta, missing breakpoints, overflow issues, fixed widths
6. Performance: large inline images, render-blocking scripts, excessive DOM depth, missing lazy loading

Rules:
- Fix ALL errors in the code while preserving the original intent and design
- Report every issue found, even minor ones
- The fixed_code must be complete and runnable
- Calculate the score based on: errors found (-10 each), warnings (-3 each), info (-1 each), starting from 100, minimum 0
- Escape all special characters properly in the JSON string values
- Do NOT wrap the response in markdown code fences`;

// Simple in-memory rate limiter: 10 requests per minute
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Remove timestamps outside the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 requests per minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, model: requestedModel } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "A 'code' string is required in the request body" },
        { status: 400 }
      );
    }

    if (code.length > 100_000) {
      return NextResponse.json(
        { error: "Code too large (max 100,000 characters)" },
        { status: 400 }
      );
    }

    // Validate model if provided
    let model: AllowedModel = "claude-sonnet-4-6";
    if (requestedModel) {
      if (!ALLOWED_MODELS.includes(requestedModel as AllowedModel)) {
        return NextResponse.json(
          {
            error: `Invalid model. Allowed values: ${ALLOWED_MODELS.join(", ")}`,
          },
          { status: 400 }
        );
      }
      model = requestedModel as AllowedModel;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model,
      max_tokens: model === "claude-opus-4-6" ? 32000 : 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze and fix the following code:\n\n${code}`,
        },
      ],
    });

    const textBlock = message.content.find((block: { type: string }) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated from analysis" },
        { status: 500 }
      );
    }

    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (
      typeof result.fixed_code !== "string" ||
      !Array.isArray(result.issues) ||
      typeof result.score !== "number"
    ) {
      return NextResponse.json(
        { error: "AI response did not match expected format" },
        { status: 500 }
      );
    }

    // Clamp score to 0-100
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    return NextResponse.json({
      fixed_code: result.fixed_code,
      issues: result.issues,
      score: result.score,
      model,
    });
  } catch (err: unknown) {
    console.error("Debug API error:", err);

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
