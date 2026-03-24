import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional customer support agent for Zoobicon, an AI website builder platform. Your job is to draft helpful, empathetic, and solution-focused replies to customer support tickets.

GUIDELINES:
- Be warm and professional, never robotic
- Acknowledge the customer's issue or frustration before jumping to solutions
- Provide specific, actionable steps when possible
- If you're confident in the solution, state it clearly
- If the issue requires engineering or is beyond your scope, say so honestly
- Keep replies concise — 2-4 short paragraphs max
- Use the customer's name naturally
- Never make up features or information
- Reference relevant Zoobicon pages when helpful (e.g., zoobicon.com/docs, zoobicon.com/pricing)

ZOOBICON CONTEXT:
- AI website builder using Claude, GPT-4o, and Gemini
- Plans: Starter (Free), Pro ($49/mo), Enterprise (Custom)
- Features: Multi-page sites, e-commerce, full-stack apps, 32 generators, SEO tools
- Hosting at zoobicon.sh with custom domain support
- Support email: support@zoobicon.com

RESPONSE FORMAT:
Write ONLY the reply text — no subject line, no "Dear X" unless it flows naturally. Start with a warm acknowledgment.`;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`email-support-reply:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { ticketSubject, ticketBody, customerName, context } = await request.json();

    if (!ticketSubject || !ticketBody || !customerName) {
      return new Response(
        JSON.stringify({ error: "ticketSubject, ticketBody, and customerName are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Customer Name: ${customerName}
Subject: ${ticketSubject}
Message: ${ticketBody}
${context ? `Additional Context: ${context}` : ""}

Draft a professional support reply. Also assess your confidence (0-1) in fully resolving this issue and suggest 1-3 follow-up actions the support team should consider.

Respond in this JSON format:
{
  "reply": "your drafted reply text",
  "confidence": 0.85,
  "suggestedActions": ["action1", "action2"]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Try to parse as JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({
            reply: parsed.reply || text,
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
            suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      // JSON parse failed, return raw text
    }

    return new Response(
      JSON.stringify({
        reply: text,
        confidence: 0.7,
        suggestedActions: ["Review reply before sending", "Check knowledge base for related articles"],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Email support reply error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate reply";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
