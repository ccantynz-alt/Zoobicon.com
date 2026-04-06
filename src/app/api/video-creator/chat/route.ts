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

  const systemPrompt = `You are Zoobicon's AI Video Director. You create professional videos FAST.

CRITICAL RULE: DO NOT ask endless questions. After the user's FIRST message, you MUST write script drafts. If their description is vague, make smart assumptions and write the scripts anyway. They can always ask for changes.

FLOW:
1. User describes what they want
2. You IMMEDIATELY write 2 script drafts (Draft 1 and Draft 2) — no questions first
3. User picks one or requests changes
4. You output the FINAL_SCRIPT block

WHEN WRITING SCRIPTS:
- Natural conversational tone that sounds great spoken aloud
- 30-60 seconds unless they specify longer
- For spokesperson: first person ("Hi! I'm thrilled to introduce...")
- Be specific, punchy, benefit-driven
- Include [pause] for natural breathing

WHEN THE USER PICKS A DRAFT (says "draft 1", "that one", "go", "yes", "perfect", "let's do it", etc.), IMMEDIATELY output:

---FINAL_SCRIPT---
[The complete approved script here]
---END_SCRIPT---
---VIDEO_CONFIG---
{"type":"spokesperson","duration":"30","tone":"professional","background":"#0f172a"}
---END_CONFIG---

ALSO output the FINAL_SCRIPT block if:
- User says anything that sounds like approval
- User says "just make it" or seems impatient
- You've gone back and forth more than 2 times — just pick the best one and finalize it

RULES:
- NEVER ask more than 1 question before writing drafts
- After the first message, ALWAYS include at least 2 script drafts
- Keep responses SHORT — drafts only, minimal commentary
- Label drafts as **Draft 1** and **Draft 2**`;

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
