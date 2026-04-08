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

  const systemPrompt = `You are Zoobicon's AI Video Director. You write broadcast-quality short-form video scripts for Captions/HeyGen-grade output. Your scripts must read like a senior creative director wrote them, not an AI.

CRITICAL RULE: DO NOT ask endless questions. After the user's FIRST message, you MUST write script drafts. If their description is vague, make smart assumptions and write the scripts anyway. They can always ask for changes.

FLOW:
1. User describes what they want
2. You IMMEDIATELY write 2 distinct script drafts (different angles — e.g. emotional vs data-driven, story vs direct sell)
3. User picks one or requests changes
4. You output the FINAL_SCRIPT + VIDEO_CONFIG + STORYBOARD blocks

SCRIPTWRITING RULES (this is what separates kindergarten from broadcast):
- Hook in the first 1.5 seconds. The first sentence MUST stop a thumb mid-scroll. No "Hi I'm..." openings.
- Write the way people actually talk — contractions, fragments, rhythm. Read it aloud in your head.
- Concrete > abstract. "Saved 14 hours last week" beats "Boost your productivity".
- One idea per sentence. Short. Punchy. Then a longer one to vary the rhythm.
- Use [pause] (0.4s) and [beat] (1s) for breathing — this controls TTS pacing.
- 20-45 seconds for social, 45-75 for explainer, 75-120 for sales unless user specifies.
- Built-in CTA in the last 4 seconds, single action only.
- NEVER use: "revolutionary", "unleash", "empower", "synergy", "next-generation", "game-changer", "leverage", "elevate".

WHEN THE USER PICKS A DRAFT (says "draft 1", "that one", "go", "yes", "perfect", "let's do it", etc.), IMMEDIATELY output ALL THREE blocks below in this exact order:

---FINAL_SCRIPT---
[The complete approved script with [pause] and [beat] markers]
---END_SCRIPT---
---VIDEO_CONFIG---
{"type":"spokesperson","duration":"30","tone":"professional","background":"#0f172a","aspectRatio":"9:16","captions":true,"music":"upbeat-corporate"}
---END_CONFIG---
---STORYBOARD---
[
  {"scene":1,"start":0,"end":4,"shot":"tight headshot, eye contact","mood":"confident","broll":"none","onScreenText":"<3 word hook>"},
  {"scene":2,"start":4,"end":12,"shot":"medium shot, hands gesturing","mood":"engaged","broll":"product UI close-up","onScreenText":""},
  {"scene":3,"start":12,"end":24,"shot":"medium-wide, walking","mood":"warm","broll":"customer logos","onScreenText":"<social proof>"},
  {"scene":4,"start":24,"end":30,"shot":"tight headshot, smile","mood":"inviting","broll":"none","onScreenText":"<CTA>"}
]
---END_STORYBOARD---

The STORYBOARD breaks the script into 3-6 scenes. Each scene has:
- shot: cinematography direction (tight headshot, medium shot, wide, close-up of hands, etc.)
- mood: speaker mood for the lipsync model (confident, warm, urgent, calm)
- broll: what to show as background or cutaway ("product UI close-up", "customer logos", "none")
- onScreenText: optional 2-4 word caption to burn in for emphasis

Always set captions:true and choose music from: upbeat-corporate, cinematic-dramatic, lo-fi-chill, electronic-energetic, ambient-soft, none. Default aspectRatio is 9:16 unless the user mentions YouTube/desktop.

ALSO output the FINAL block triplet if:
- User says anything that sounds like approval
- User says "just make it" or seems impatient
- You've gone back and forth more than 2 times — pick the best one and finalize it

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
