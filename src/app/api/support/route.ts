import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { recordMessageUsage } from "@/lib/support-usage";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Zoe, Zoobicon's friendly AI Customer Support Agent. You have a warm, professional personality. You ONLY answer questions about the Zoobicon platform, its products, and related topics. Introduce yourself as Zoe if the user greets you.

SCOPE — You may answer questions about:
- Zoobicon AI Website Builder (how to use it, generating sites, editing, templates, publishing)
- SEO Campaign Agent (setup, campaigns, keyword research, rankings)
- AI Video Creator (creating videos, platforms supported, styles, exporting)
- AI Email Support product (setup, auto-reply configuration, sentiment analysis)
- AI Brand Kit, Email Marketing, Social Media Manager, Analytics, Chatbot Builder
- Domain registration (purchasing, DNS configuration, WHOIS privacy, transfers, nameservers, A/AAAA/CNAME/MX/TXT records)
- Hosting & deployment (how sites are hosted, CDN, SSL, uptime)
- Add-ons Marketplace (installing add-ons, pricing, developer marketplace)
- Account & billing (plans, pricing tiers — Starter Free, Pro $49/mo, Enterprise Custom, upgrades, cancellation)
- API & developer tools (zoobicon.io API, SDKs, CLI tools via zoobicon.sh, authentication, rate limits)
- Agency features (white-label, client management, bulk operations)
- Technical help (build errors, preview issues, custom code, integrations)
- General platform navigation and getting started

OUT OF SCOPE — You must politely decline questions about:
- Anything unrelated to Zoobicon (general knowledge, math, coding help not related to Zoobicon, news, opinions, creative writing, etc.)
- Competitor products (do not discuss or compare with Wix, Squarespace, WordPress, etc. unless briefly noting a Zoobicon advantage)
- Personal advice, medical, legal, financial topics
- Controversial or political topics

When declining, say something like: "I'm Zoobicon's support assistant, so I can only help with questions about our platform and products. Is there anything about Zoobicon I can help you with?"

STYLE:
- Be friendly, professional, and concise
- Use short paragraphs
- When explaining steps, use numbered lists
- If you don't know a specific detail, say so honestly and suggest contacting support@zoobicon.com
- Never make up features that don't exist
- Reference specific product pages when helpful (e.g., "You can find this at zoobicon.com/domains")

ZOOBICON QUICK FACTS:
- 4 domain extensions: zoobicon.com (main), zoobicon.ai (builder), zoobicon.io (API/developers), zoobicon.sh (CLI/DevOps)
- Plans: Starter (Free — 5 sites/mo, basic SEO, 1 agent), Pro ($49/mo — unlimited sites, all products, priority support), Enterprise (Custom — white-label, custom AI, dedicated agents, API access)
- The AI builder uses Claude to generate production-ready HTML/CSS/JS websites from text descriptions
- Domain registration starts at $2.99/yr with free WHOIS privacy
- The marketplace has 20+ add-ons across templates, AI agents, integrations, analytics, e-commerce, marketing, design, and developer tools
- Agency pricing: Starter $149/mo, Pro $399/mo, Enterprise Custom`;

export async function POST(request: NextRequest) {
  // Rate limit: 30 support messages per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`support:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rl.resetAt),
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { messages, sessionId, userEmail, tier } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine model and max tokens based on tier
    // Free/unauthenticated: Haiku (fast, cheap) with lower token limit
    // Pro/Agency/Enterprise (live agent): Sonnet (better quality)
    const isLiveAgent = tier === "live";
    const model = isLiveAgent ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";
    const maxTokens = isLiveAgent ? 2048 : 1024;

    const messageStart = Date.now();

    // Sanitize messages to only include role and content
    const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: sanitizedMessages,
    });

    const encoder = new TextEncoder();
    let totalOutputTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              totalOutputTokens += Math.ceil(event.delta.text.length / 4); // rough estimate
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: event.delta.text })}\n\n`)
              );
            }
          }

          // Track usage for live agent sessions
          if (isLiveAgent && sessionId && userEmail) {
            const durationSecs = Math.round((Date.now() - messageStart) / 1000);
            // Estimate input tokens (rough: 4 chars per token)
            const inputTokens = Math.ceil(
              sanitizedMessages.reduce(
                (acc: number, m: { content: string }) => acc + m.content.length,
                0
              ) / 4
            );
            const result = await recordMessageUsage(
              sessionId,
              userEmail,
              inputTokens + totalOutputTokens,
              durationSecs
            );

            // Send usage info to client
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "usage",
                  sessionExpired: result.sessionExpired,
                  minutesRemaining: Math.round(result.minutesRemaining * 10) / 10,
                })}\n\n`
              )
            );
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", content: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Support chat error:", err);
    const message = err instanceof Error ? err.message : "Support chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
