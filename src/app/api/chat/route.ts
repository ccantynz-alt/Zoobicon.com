import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, checkRateLimitAdmin, getClientIp } from "@/lib/rateLimit";
import { validateApiKey } from "@/lib/apiKey";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// ─── Full-document edit prompt (fallback for complex edits) ───
const SYSTEM_PROMPT = `You are ZOOBICON's elite AI editing assistant. The user has a generated HTML website and wants to make changes.

CRITICAL RULES:
- Output ONLY the complete updated HTML document. No markdown, no explanation, no backticks, no code fences.
- Start with <!DOCTYPE html> and end with </html>. The output MUST be a complete, valid HTML document.
- NEVER truncate, abbreviate, or skip sections. Every section, every style rule, every script block from the original MUST be preserved unless the user explicitly asks to remove it.
- Make ONLY the changes the user requests. Do not remove, reorganize, or "clean up" anything else.
- Preserve ALL existing: CSS custom properties, media queries, animations, keyframes, JavaScript, IntersectionObserver code, form validation, meta tags, JSON-LD, and responsive behavior.
- Preserve ALL existing sections in their original order.
- If the edit is cosmetic (colors, fonts, spacing, text), change ONLY those specific values.
- If adding a new section, match the existing design language exactly.
- Maintain all hover states, transitions, and micro-interactions.
- NEVER output partial HTML. The document must be complete from <!DOCTYPE html> to </html>.`;

// ─── Targeted section edit prompt (fast path for surgical edits) ───
const TARGETED_SYSTEM = `You are ZOOBICON's precision HTML editor. You receive a SINGLE HTML section extracted from a larger page, plus an edit instruction.

RULES:
- Output ONLY the updated HTML section. No markdown, no explanation, no code fences.
- Apply the requested change precisely. Do not add, remove, or reorganize anything else.
- Preserve all classes, IDs, data attributes, inline styles, and aria attributes.
- Preserve the exact tag structure — same opening and closing tags.
- If the edit involves CSS (colors, sizes, spacing), modify only the relevant inline style or class.
- Output the section exactly as it should appear when spliced back into the full document.`;

// ─── CSS-only edit prompt ───
const CSS_EDIT_SYSTEM = `You are ZOOBICON's CSS editor. You receive the full <style> block from an HTML page and an edit instruction about visual styling.

RULES:
- Output ONLY the updated <style> block contents (the CSS rules). No <style> tags, no markdown, no explanation.
- Apply the requested visual change precisely. Only modify the rules that need to change.
- Preserve all existing rules, media queries, keyframes, and custom properties unless the user asks to remove them.
- Do not reorganize, reformat, or "clean up" existing CSS.`;

export const maxDuration = 120;

// ─── Section extraction for targeted edits ───

interface ExtractedSection {
  sectionHtml: string;
  startIndex: number;
  endIndex: number;
  sectionName: string;
}

/** Map keywords in user instructions to HTML section patterns */
const SECTION_KEYWORDS: Record<string, RegExp[]> = {
  hero: [/<section[^>]*(?:hero|banner|jumbotron)[^>]*>[\s\S]*?<\/section>/gi, /<!--\s*hero\s*-->[\s\S]*?<!--\s*\/hero\s*-->/gi],
  header: [/<header[^>]*>[\s\S]*?<\/header>/gi, /<nav[^>]*>[\s\S]*?<\/nav>/gi],
  nav: [/<nav[^>]*>[\s\S]*?<\/nav>/gi, /<header[^>]*>[\s\S]*?<\/header>/gi],
  footer: [/<footer[^>]*>[\s\S]*?<\/footer>/gi],
  pricing: [/<section[^>]*(?:pricing|plans)[^>]*>[\s\S]*?<\/section>/gi],
  features: [/<section[^>]*(?:features|benefits|services)[^>]*>[\s\S]*?<\/section>/gi],
  about: [/<section[^>]*(?:about|story|mission)[^>]*>[\s\S]*?<\/section>/gi],
  testimonials: [/<section[^>]*(?:testimonial|review|quote)[^>]*>[\s\S]*?<\/section>/gi],
  contact: [/<section[^>]*(?:contact|form|cta)[^>]*>[\s\S]*?<\/section>/gi, /<form[^>]*>[\s\S]*?<\/form>/gi],
  faq: [/<section[^>]*(?:faq|question|accordion)[^>]*>[\s\S]*?<\/section>/gi],
  cta: [/<section[^>]*(?:cta|call-to-action)[^>]*>[\s\S]*?<\/section>/gi],
};

/** Detect which section the user wants to edit based on their instruction */
function detectTargetSection(instruction: string, html: string): ExtractedSection | null {
  const lower = instruction.toLowerCase();

  // Check each keyword
  for (const [keyword, patterns] of Object.entries(SECTION_KEYWORDS)) {
    if (!lower.includes(keyword)) continue;

    for (const pattern of patterns) {
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      const match = pattern.exec(html);
      if (match) {
        return {
          sectionHtml: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          sectionName: keyword,
        };
      }
    }
  }

  // Try to find section by heading text mentioned in the instruction
  const quotedText = instruction.match(/["']([^"']+)["']/);
  if (quotedText) {
    const searchText = quotedText[1];
    // Find the section containing this text
    const sectionRegex = /<section[^>]*>[\s\S]*?<\/section>/gi;
    let match;
    while ((match = sectionRegex.exec(html)) !== null) {
      if (match[0].includes(searchText)) {
        return {
          sectionHtml: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          sectionName: "matched-section",
        };
      }
    }
  }

  return null;
}

/** Detect if the edit is CSS-only (colors, fonts, spacing, backgrounds) */
function isCssOnlyEdit(instruction: string): boolean {
  return /^(change|make|set|update|switch)\s+(the\s+)?(color|colour|font|text-color|background|bg|primary|accent|gradient|shadow|border-color|opacity)\b/i.test(instruction)
    || /\b(color|background|bg|font-family|font-size|border-radius|shadow|opacity)\s+(to|from|into)\b/i.test(instruction)
    || /^(make|change)\s+(everything|all|the site|the page|it)\s+(darker|lighter|more colorful|monochrome|warmer|cooler)/i.test(instruction);
}

/** Extract the contents of the first <style> block */
function extractStyleBlock(html: string): { css: string; startIndex: number; endIndex: number } | null {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!match) return null;
  const fullMatchStart = html.indexOf(match[0]);
  const cssStart = fullMatchStart + match[0].indexOf(match[1]);
  return {
    css: match[1],
    startIndex: cssStart,
    endIndex: cssStart + match[1].length,
  };
}

type EditMode = "targeted" | "css-only" | "full";

function classifyEdit(instruction: string, html: string): { mode: EditMode; section?: ExtractedSection; styleBlock?: ReturnType<typeof extractStyleBlock> } {
  // CSS-only edits (global color/font changes)
  if (isCssOnlyEdit(instruction)) {
    const styleBlock = extractStyleBlock(html);
    if (styleBlock) {
      return { mode: "css-only", styleBlock };
    }
  }

  // Targeted section edits
  const section = detectTargetSection(instruction, html);
  if (section) {
    return { mode: "targeted", section };
  }

  // Fallback: full document edit
  return { mode: "full" };
}

export async function POST(request: NextRequest) {
  // API key auth — valid zbk_live_ key gets higher rate limit
  const bearerKey = request.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
  const apiKeyResult = bearerKey ? await validateApiKey(bearerKey) : null;
  const isApiKeyRequest = apiKeyResult?.valid === true;

  // Admin bypass: no rate limits
  const isAdminRequest = request.headers.get("x-admin") === "1";

  // Rate limit: unlimited for admin, 120/min for API keys, 20/min for browsers
  const ip = getClientIp(request);
  const rateLimitId = isApiKeyRequest ? `chat:key:${bearerKey.slice(-8)}` : `chat:${ip}`;
  const rateLimit = isApiKeyRequest ? { limit: 120, windowMs: 60_000 } : { limit: 20, windowMs: 60_000 };
  const rl = isAdminRequest ? checkRateLimitAdmin() : await checkRateLimit(rateLimitId, rateLimit);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rl.resetAt),
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { currentCode, instruction } = await request.json();

    if (!instruction || typeof instruction !== "string") {
      return new Response(JSON.stringify({ error: "An instruction is required" }), {
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

    // ─── Classify the edit to pick the optimal strategy ───
    const editClass = currentCode ? classifyEdit(instruction, currentCode) : { mode: "full" as EditMode };

    let systemPrompt: string;
    let userMessage: string;
    let maxTokens: number;

    if (editClass.mode === "css-only" && editClass.styleBlock) {
      // CSS-only: send just the style block
      systemPrompt = CSS_EDIT_SYSTEM;
      userMessage = `Here is the current CSS:\n\n${editClass.styleBlock.css}\n\n---\n\nEdit instruction: ${instruction}\n\nOutput ONLY the updated CSS rules. No <style> tags, no explanation.`;
      maxTokens = 16000;
    } else if (editClass.mode === "targeted" && editClass.section) {
      // Targeted: send just the section
      systemPrompt = TARGETED_SYSTEM;
      userMessage = `Here is the HTML section to edit (${editClass.section.sectionName}):\n\n${editClass.section.sectionHtml}\n\n---\n\nEdit instruction: ${instruction}\n\nOutput ONLY the updated section HTML. No explanation, no code fences.`;
      maxTokens = 16000;
    } else {
      // Full document edit (complex changes, new sections, etc.)
      systemPrompt = SYSTEM_PROMPT;
      userMessage = currentCode
        ? `Here is the current website HTML:\n\n${currentCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections.\n\nEdit instruction: ${instruction}`
        : `Create a website with this requirement: ${instruction}`;

      const isSimpleEdit = instruction.split(/\s+/).length <= 8;
      maxTokens = isSimpleEdit ? 32000 : 64000;
    }

    const model = "claude-sonnet-4-6";

    // --- Flywheel: inject platform memory into system prompt ---
    try {
      const { getMemories } = await import("@/lib/flywheel");
      const mems = await getMemories("brand");
      const memStr = mems.slice(0, 8).map((m) => m.content).join("; ");
      if (memStr) {
        systemPrompt += `\n\nPlatform memory: ${memStr.slice(0, 500)}`;
      }
    } catch {
      // Flywheel unavailable — proceed without memory
    }

    let stream;
    try {
      stream = await getClient().messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (apiErr: unknown) {
      const isAuthError =
        apiErr instanceof Anthropic.AuthenticationError ||
        (apiErr instanceof Error && apiErr.message.includes("authentication"));
      if (isAuthError) {
        return new Response(
          JSON.stringify({ error: "AI service is temporarily unavailable. The site owner needs to update their API key." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
      throw apiErr;
    }

    const encoder = new TextEncoder();

    // Send the edit mode as the first SSE event so the client knows how to reassemble
    const modeEvent = JSON.stringify({
      type: "meta",
      editMode: editClass.mode,
      sectionName: editClass.mode === "targeted" ? editClass.section?.sectionName : undefined,
    });

    let accumulatedResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send meta event first
          controller.enqueue(encoder.encode(`data: ${modeEvent}\n\n`));

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              accumulatedResponse += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );

          // --- Flywheel: persist conversation after successful edit ---
          try {
            const { saveConversation } = await import("@/lib/flywheel");
            const now = Date.now();
            const convoId = `${now}-${Math.random().toString(36).slice(2, 11)}`;
            await saveConversation({
              id: convoId,
              title: (instruction || "Site edit").slice(0, 50),
              messages: [
                { role: "user" as const, content: instruction, timestamp: now - 1000 },
                { role: "assistant" as const, content: accumulatedResponse.slice(0, 2000), timestamp: now },
              ],
              model,
              createdAt: now,
              updatedAt: now,
            });
          } catch {
            // Flywheel save failed — non-fatal
          }

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
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
