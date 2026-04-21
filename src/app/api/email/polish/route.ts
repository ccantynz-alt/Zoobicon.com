import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// POST /api/email/polish — AI-powered email grammar, tone & clarity check
// Uses Haiku for speed (~1-2s). Returns polished text + list of changes.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert email editor for a professional SaaS company (Zoobicon — an AI website builder platform). Your job is to polish outgoing emails for grammar, clarity, tone, and professionalism.

Rules:
- Fix grammar, spelling, and punctuation errors
- Improve sentence clarity and flow
- Ensure professional but warm tone (not robotic or overly formal)
- Preserve the original meaning and intent exactly
- Keep the same length — don't add fluff or unnecessary pleasantries
- If the email is already well-written, return it unchanged
- Don't add signatures, greetings, or sign-offs unless they're already present
- For support replies, maintain empathy and helpfulness
- For admin emails, maintain authority and clarity

Respond with JSON only:
{
  "polished": "the improved email text",
  "changes": ["list of specific changes made"],
  "score": 85,
  "tone": "professional" | "friendly" | "formal" | "casual",
  "issues": ["list of issues found (grammar, clarity, tone)"]
}

The "score" is 0-100 representing the original email's quality. 90+ means it was already good. The "changes" array should be empty if no changes were needed.`;

export async function POST(req: NextRequest) {
  try {
    const { text, context } = (await req.json()) as {
      text?: string;
      context?: "compose" | "reply" | "support" | "internal";
    };

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided to polish." },
        { status: 400 }
      );
    }

    if (text.trim().length < 5) {
      return NextResponse.json({
        polished: text,
        changes: [],
        score: 100,
        tone: "neutral",
        issues: [],
        skipped: true,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Set ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    const contextHint = context
      ? `\n\nContext: This is a ${context === "support" ? "customer support reply" : context === "internal" ? "internal team note" : context === "reply" ? "reply to an incoming email" : "new outgoing email"}.`
      : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Polish this email:${contextHint}\n\n---\n${text}\n---`,
        },
      ],
    });

    const textBlock = message.content.find((b: { type: string }) => b.type === "text") as { type: "text"; text: string } | undefined;
    const raw = textBlock?.text || "";

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      // If JSON parsing fails, return the raw text as the polished version
      result = {
        polished: raw,
        changes: ["AI response was not structured — using raw output"],
        score: 70,
        tone: "unknown",
        issues: [],
      };
    }

    return NextResponse.json({
      polished: result.polished || text,
      changes: result.changes || [],
      score: result.score ?? 80,
      tone: result.tone || "professional",
      issues: result.issues || [],
      original: text,
    });
  } catch (err) {
    console.error("[Email Polish] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to polish email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
