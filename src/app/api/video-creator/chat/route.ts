import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

/**
 * POST /api/video-creator/chat
 *
 * Conversational AI video assistant. User describes what they want,
 * AI figures out the video type, writes scripts, suggests revisions.
 *
 * Body: { messages: Array<{ role: "user" | "assistant", content: string }> }
 * Returns: SSE stream of assistant response
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const body = await req.json();
  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages required" }, { status: 400 });
  }

  const systemPrompt = `You are Zoobicon's AI Video Director. You help users create professional videos through conversation.

YOUR JOB: Understand what video the user wants, write the script, and prepare it for production.

CONVERSATION FLOW:
1. User describes what they want (could be vague like "a promo for my app" or specific)
2. You ask 1-2 clarifying questions if needed (tone, audience, length, key messages)
3. You write 2-3 script drafts for them to choose from
4. They pick one or ask for changes
5. You finalize the script and present production options

WHEN WRITING SCRIPTS:
- Write natural, conversational scripts that sound good spoken aloud
- Include [pause] markers for natural breathing points
- Keep scripts 30-90 seconds unless they ask for longer
- For spokesperson videos: write in first person ("Hi, I'm here to tell you about...")
- For promo videos: write punchy, benefit-driven copy
- For explainers: clear, step-by-step structure
- For testimonials: authentic, specific language with metrics

WHEN YOU HAVE A FINAL APPROVED SCRIPT, output it in this exact format:

---FINAL_SCRIPT---
[The complete script text here]
---END_SCRIPT---
---VIDEO_CONFIG---
{
  "type": "spokesperson",
  "duration": "estimated seconds",
  "tone": "professional/casual/energetic/warm",
  "background": "suggested background color hex"
}
---END_CONFIG---

Only output the FINAL_SCRIPT block when the user has explicitly approved a script (said something like "that's good", "let's go with that", "option 2", "perfect", etc.). Do NOT output it on your first response.

RULES:
- Be friendly, professional, and efficient
- Don't overwhelm with options — 2-3 choices max
- Format scripts clearly with Draft 1, Draft 2, etc.
- Keep your responses concise — don't write essays explaining what you're going to do
- If the user says "just make it" or seems impatient, pick the best option and present it as the final
- Always label drafts clearly so users can say "I like Draft 2" or "mix Draft 1 and 3"`;

  const client = new Anthropic({ apiKey, timeout: 60000 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        apiStream.on("text", (text) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`));
        });

        await apiStream.finalMessage();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
