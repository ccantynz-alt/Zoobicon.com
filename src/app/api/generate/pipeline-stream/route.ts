import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { callLLM } from "@/lib/llm-provider";
import { injectComponentLibrary } from "@/lib/component-library";

/**
 * Streaming Pipeline API — Real-time 7-agent pipeline with SSE
 *
 * POST /api/generate/pipeline-stream
 *
 * Streams SSE events as each agent completes:
 * - { type: "agent", agent: "Strategist", status: "done", duration: 4200 }
 * - { type: "chunk", content: "..." }      — Developer HTML streaming live
 * - { type: "replace", content: "..." }     — Enhancement agent update
 * - { type: "done", totalDuration: 95000 }
 * - { type: "error", message: "..." }
 *
 * The frontend sees the site being built in real-time instead of waiting ~95s.
 */

export const maxDuration = 300;

// Import agent system prompts from the main pipeline
// We inline the key ones here to keep this endpoint self-contained and avoid
// circular dependency issues with the streaming architecture

const STRATEGIST_SYSTEM = `You are an elite brand strategist. Given a website brief, analyze it deeply and produce a comprehensive strategy.

CRITICAL: If the user provides a detailed brief with specific instructions, incorporate ALL of those details.

Output a JSON object:
{
  "industry": "detected industry",
  "targetAudience": { "primary": "", "secondary": "", "painPoints": [], "desires": [] },
  "positioning": { "uniqueValue": "", "competitiveAdvantage": "", "pricePosition": "", "tone": "" },
  "goals": { "primary": "", "secondary": "", "keyMetric": "" },
  "visualDirection": { "heroTreatment": "", "imageStrategy": "", "whitespaceLevel": "", "animationStyle": "", "navStyle": "" },
  "colorDirection": { "palette": "", "mood": "", "avoidColors": [] },
  "typographyDirection": { "headingStyle": "", "bodyStyle": "", "feel": "" },
  "contentStructure": { "sitemap": [], "heroApproach": "", "keyDifferentiator": "" },
  "contentPriority": [],
  "trustSignals": [],
  "objections": [],
  "keywords": [],
  "userInstructions": []
}
Output ONLY valid JSON.`;

const BRAND_SYSTEM = `You are an elite brand designer. Given a strategy and brief, produce a comprehensive design specification.

Output a JSON object with: colorPalette (primary, primaryLight, primaryDark, secondary, accent, background, backgroundAlt, surface, text, textMuted, border), typography (headingFont, bodyFont, heroSize, h2Size, h3Size, bodySize, headingWeight, letterSpacing, lineHeight), layout (maxWidth, sectionPadding, mobileSectionPadding, cardRadius, buttonRadius, containerPadding), shadows (sm, md, lg, hover), sections array, darkMode object, designNotes, avoidList.

CRITICAL: Match the industry aesthetic. Luxury = serif headings, warm whites. Tech = modern sans, can be dark.
Output ONLY valid JSON.`;

const COPYWRITER_SYSTEM = `You are an elite copywriter. Given a strategy, produce all website copy.

Output a JSON object with: businessName, tagline, sections (hero with headline/subheadline/ctaPrimary/ctaSecondary/socialProof, features with heading/subheading/items array, about with heading/paragraphs/stats, testimonials array with quote/name/title/company/rating, faq array with question/answer, cta with heading/description/buttonText/reassurance, footer with description/phone/email/address/links), metaSeo (title/description/keywords).

Rules: Every headline is BENEFIT-focused. Testimonials mention specific results/numbers. Address objections in FAQ. NO lorem ipsum. Copy must match brand tone. Include 3-4 testimonials with realistic names.
Output ONLY valid JSON.`;

const ARCHITECT_SYSTEM = `You are a senior web architect. Given a strategy, decide the optimal page structure.

Output a JSON object with: structure, sectionOrder array, sectionLayouts object, interactivity array, specialComponents array, responsive object, notes.

Choose section order strategically: Hero → Social proof → Problem → Features → About → Testimonials → FAQ → CTA.
Output ONLY valid JSON.`;

const DEVELOPER_SYSTEM = `You are an elite front-end developer. Given a complete specification (strategy, design, copy, and architecture), produce a single HTML file that looks like it was built by a $30,000 agency.

## OUTPUT STRUCTURE — FOLLOW THIS ORDER EXACTLY
1. <!DOCTYPE html>, <html>, <head> — title, meta viewport, Google Fonts <link>
2. <style> — ONLY :root custom properties + max 40 lines of site-specific CSS. A component library is auto-injected.
3. </head><body> — START THE BODY IMMEDIATELY AFTER THE SHORT STYLE BLOCK
4. <body> content — THIS IS 80% OF YOUR OUTPUT. Write EVERY section with full content.
5. <script> — mobile menu toggle, FAQ accordion, counter animation, smooth scroll (under 40 lines)
6. </body></html>

## CSS BUDGET — HARD LIMIT: 40 LINES
The Zoobicon Component Library is auto-injected. It provides:
.btn, .btn-primary, .btn-secondary, .btn-ghost, .card, .card-body, .grid-2, .grid-3, .grid-4, .section, .section-alt, .container, .testimonial-card, .stat-item, .stat-number, .stat-label, .faq-item, .faq-question, .faq-answer, .badge, .input, .fade-in, .text-center, .text-muted

## BODY CONTENT — THIS IS YOUR PRIMARY JOB
Use ALL the copy from the COPY input. Every section must appear with real visible text.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with descriptive keywords. object-fit: cover.
- Use semantic HTML: header, nav, main, section, footer
- Add .fade-in class to each <section>

## KEY RULES
- Output ONLY raw HTML. No markdown, no explanation, no code fences.
- An empty <body> is a TOTAL FAILURE.
- NEVER set opacity:0 on any element
- Start IMMEDIATELY with <!DOCTYPE html>`;

const SEO_SYSTEM = `You are an SEO specialist. Take the HTML and inject comprehensive SEO markup.
Rules:
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Add/optimize: title tag, meta description, Open Graph tags, Twitter Card tags, canonical link, theme-color
- Add JSON-LD structured data (schema.org) — detect business type and use appropriate schema
- Fix heading hierarchy. Add alt text to images. Add loading="lazy" to below-fold images.
- Do NOT change any visible content or design.`;

const ANIMATION_SYSTEM = `You are an animation specialist. Take the HTML and enhance with smooth micro-interactions.
CRITICAL: NEVER set any element to opacity:0. NEVER add visibility:hidden or display:none.
Use ONLY the component library's .fade-in, .fade-in-left, .fade-in-right, .scale-in classes.
You CAN add: parallax on hero, animated counters, scroll progress bar, hover micro-interactions, prefers-reduced-motion.
Output ONLY the complete updated HTML. No markdown, no code fences.
Do NOT change any content, colors, or layout.`;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function sendEvent(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  try {
    const { prompt, style, tier, model: requestedModel } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "A prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userModel = requestedModel;
    const useMultiLLM = userModel && !userModel.startsWith("claude");
    const MODEL_PLANNER = userModel || "claude-haiku-4-5-20251001";
    const MODEL_BALANCED = userModel || "claude-sonnet-4-6";
    const MODEL_PREMIUM = userModel || "claude-opus-4-6";

    const readable = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();

        // Helper: non-streaming LLM call (for planning agents)
        const llmText = async (opts: { model: string; maxTokens: number; system: string; userMessage: string }): Promise<string> => {
          if (useMultiLLM) {
            const res = await callLLM({ model: opts.model, system: opts.system, userMessage: opts.userMessage, maxTokens: opts.maxTokens });
            return res.text;
          }
          const timeoutMs = opts.model === "claude-opus-4-6" ? 180_000 : opts.maxTokens <= 16384 ? 60_000 : 120_000;
          const client = new Anthropic({ apiKey, timeout: timeoutMs });
          const useStreaming = opts.maxTokens > 16384;
          if (useStreaming) {
            const stream = client.messages.stream({ model: opts.model, max_tokens: opts.maxTokens, system: opts.system, messages: [{ role: "user", content: opts.userMessage }] });
            const msg = await stream.finalMessage();
            return msg.content.find((b) => b.type === "text")?.text || "";
          }
          const res = await client.messages.create({ model: opts.model, max_tokens: opts.maxTokens, system: opts.system, messages: [{ role: "user", content: opts.userMessage }] });
          return res.content.find((b) => b.type === "text")?.text || "";
        };

        const extractJSON = (text: string): string => {
          const m = text.match(/\{[\s\S]*\}/);
          return m ? m[0] : text;
        };

        const cleanHtml = (raw: string): string => {
          let h = raw.trim();
          h = h.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const ds = h.search(/<!doctype\s+html|<html/i);
          if (ds > 0) h = h.slice(ds);
          const he = h.lastIndexOf("</html>");
          if (he !== -1) h = h.slice(0, he + "</html>".length);
          return h.trim();
        };

        const hasBodyContent = (h: string): { valid: boolean; bodyChars: number } => {
          const m = h.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (!m) return { valid: false, bodyChars: 0 };
          const t = m[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          return { valid: t.length >= 100, bodyChars: t.length };
        };

        try {
          // ── Phase 1: Strategist ──
          sendEvent(controller, { type: "agent", agent: "Strategist", status: "running" });
          const strategyStart = Date.now();

          const strategyText = await llmText({
            model: MODEL_PLANNER, maxTokens: 8192, system: STRATEGIST_SYSTEM,
            userMessage: `Analyze and create a comprehensive strategy for this brief. Incorporate ALL user-specified details.\n\nBRIEF:\n${prompt}${style ? `\nPreferred style: ${style}` : ""}`,
          });
          const strategySpec = extractJSON(strategyText);
          sendEvent(controller, { type: "agent", agent: "Strategist", status: "done", duration: Date.now() - strategyStart });

          // ── Phase 2: Brand + Copywriter + Architect (Parallel) ──
          sendEvent(controller, { type: "agent", agent: "Brand Designer", status: "running" });
          sendEvent(controller, { type: "agent", agent: "Copywriter", status: "running" });
          sendEvent(controller, { type: "agent", agent: "Architect", status: "running" });
          const phase2Start = Date.now();

          const [brandText, copyText, archText] = await Promise.all([
            llmText({
              model: MODEL_PLANNER, maxTokens: 8192, system: BRAND_SYSTEM,
              userMessage: `Strategy:\n${strategySpec}\n\nOriginal Brief:\n${prompt}${style ? `\nStyle: ${style}` : ""}\n\nCreate a premium design system.`,
            }),
            llmText({
              model: MODEL_PLANNER, maxTokens: 16000, system: COPYWRITER_SYSTEM,
              userMessage: `Strategy:\n${strategySpec}\n\nOriginal Brief:\n${prompt}\n\nWrite all website copy. Match tone to audience.`,
            }),
            llmText({
              model: MODEL_PLANNER, maxTokens: 8192, system: ARCHITECT_SYSTEM,
              userMessage: `Strategy:\n${strategySpec}\n\nOriginal Brief:\n${prompt}\n\nPlan the optimal page structure.`,
            }),
          ]);

          const brandSpec = extractJSON(brandText);
          const copySpec = extractJSON(copyText);
          const archSpec = extractJSON(archText);
          const phase2Duration = Date.now() - phase2Start;
          sendEvent(controller, { type: "agent", agent: "Brand Designer", status: "done", duration: phase2Duration });
          sendEvent(controller, { type: "agent", agent: "Copywriter", status: "done", duration: phase2Duration });
          sendEvent(controller, { type: "agent", agent: "Architect", status: "done", duration: phase2Duration });

          // ── Phase 3: Developer (Opus) — STREAMED LIVE ──
          sendEvent(controller, { type: "agent", agent: "Developer", status: "running" });
          const devStart = Date.now();

          const devUserMessage = `STRATEGY:\n${strategySpec}\n\nDESIGN SPEC:\n${brandSpec}\n\nCOPY:\n${copySpec}\n\nARCHITECTURE:\n${archSpec}\n\nORIGINAL BRIEF:\n${prompt}\n\nBuild the complete HTML website. Follow all specs exactly.\n\nCRITICAL: The <body> must contain ALL the copy content. Write the full page content inside <body>.\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html> — no preamble, no explanation, no code fences. Output raw HTML only.`;

          let devHtml = "";

          // Stream Developer output — this is what users see building in real-time
          const devClient = new Anthropic({ apiKey, timeout: 180_000 });
          let devStream;
          try {
            devStream = devClient.messages.stream({
              model: MODEL_PREMIUM,
              max_tokens: 32000,
              system: DEVELOPER_SYSTEM,
              messages: [{ role: "user", content: devUserMessage }],
            });
          } catch {
            // Opus failed to start, fall back to Sonnet
            console.warn("[Pipeline-Stream] Opus failed to start, falling back to Sonnet");
            devStream = devClient.messages.stream({
              model: MODEL_BALANCED,
              max_tokens: 32000,
              system: DEVELOPER_SYSTEM,
              messages: [{ role: "user", content: devUserMessage }],
            });
          }

          for await (const event of devStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              devHtml += event.delta.text;
              sendEvent(controller, { type: "chunk", content: event.delta.text });
            }
          }

          let html = cleanHtml(devHtml);
          const bodyCheck = hasBodyContent(html);
          sendEvent(controller, { type: "agent", agent: "Developer", status: "done", duration: Date.now() - devStart });

          // Retry if body is empty
          if (!bodyCheck.valid) {
            console.warn(`[Pipeline-Stream] Developer empty body (${bodyCheck.bodyChars} chars). Retrying with Sonnet...`);
            sendEvent(controller, { type: "status", message: "Retrying build..." });

            const retryResult = await llmText({
              model: MODEL_BALANCED, maxTokens: 32000, system: DEVELOPER_SYSTEM,
              userMessage: `CRITICAL: Previous attempt had an EMPTY <body>. Write MINIMAL CSS. Focus ALL output on <body> content.\n\n${devUserMessage}`,
            });

            html = cleanHtml(retryResult);
            const retryCheck = hasBodyContent(html);

            if (retryCheck.valid) {
              sendEvent(controller, { type: "replace", content: html });
            } else {
              sendEvent(controller, { type: "error", message: "Developer agent produced empty content after retry." });
              controller.close();
              return;
            }
          }

          // Validate
          if (html.length < 500 || !/<body/i.test(html)) {
            sendEvent(controller, { type: "error", message: "Developer agent failed to produce valid HTML." });
            controller.close();
            return;
          }

          // ── Phase 4: SEO + Animation (Parallel, Sonnet) ──
          const elapsed = Date.now() - startTime;
          const remaining = 280_000 - elapsed;

          if (remaining > 40_000) {
            sendEvent(controller, { type: "agent", agent: "SEO Agent", status: "running" });
            sendEvent(controller, { type: "agent", agent: "Animation Agent", status: "running" });
            const phase4Start = Date.now();

            const [seoResult, animResult] = await Promise.all([
              llmText({
                model: MODEL_BALANCED, maxTokens: 32000, system: SEO_SYSTEM,
                userMessage: `Here is the complete website HTML. Add comprehensive SEO markup. Do NOT change any visible content or design.\n\n${html}`,
              }).catch((err) => {
                console.warn(`[Pipeline-Stream] SEO failed: ${err instanceof Error ? err.message : "unknown"}`);
                return null;
              }),
              llmText({
                model: MODEL_BALANCED, maxTokens: 32000, system: ANIMATION_SYSTEM,
                userMessage: `Here is the complete website HTML. Add smooth scroll animations. NEVER set opacity:0. Do NOT change any content or colors.\n\n${html}`,
              }).catch((err) => {
                console.warn(`[Pipeline-Stream] Animation failed: ${err instanceof Error ? err.message : "unknown"}`);
                return null;
              }),
            ]);

            // Apply SEO if valid
            if (seoResult) {
              const seoHtml = cleanHtml(seoResult);
              const seoBody = hasBodyContent(seoHtml);
              if (seoHtml.length > html.length * 0.5 && seoBody.valid && /<html/i.test(seoHtml) && /<\/html>/i.test(seoHtml)) {
                html = seoHtml;
              }
            }
            sendEvent(controller, { type: "agent", agent: "SEO Agent", status: "done", duration: Date.now() - phase4Start });

            // Apply Animation if valid
            if (animResult) {
              const animHtml = cleanHtml(animResult);
              const animBody = hasBodyContent(animHtml);
              if (animHtml.length > html.length * 0.5 && animBody.valid && /<html/i.test(animHtml) && /<\/html>/i.test(animHtml)) {
                html = animHtml;
              }
            }
            sendEvent(controller, { type: "agent", agent: "Animation Agent", status: "done", duration: Date.now() - phase4Start });

            // Send the enhanced version as a replace event
            if (seoResult || animResult) {
              const enhanced = injectComponentLibrary(html);
              sendEvent(controller, { type: "replace", content: enhanced });
            }
          } else {
            sendEvent(controller, { type: "agent", agent: "SEO Agent", status: "skipped" });
            sendEvent(controller, { type: "agent", agent: "Animation Agent", status: "skipped" });
          }

          // Inject component library if not already injected by enhancement phase
          if (!html.includes("ZOOBICON COMPONENT LIBRARY")) {
            html = injectComponentLibrary(html);
            sendEvent(controller, { type: "replace", content: html });
          }

          sendEvent(controller, { type: "done", totalDuration: Date.now() - startTime });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Pipeline stream error";
          console.error("[Pipeline-Stream] Error:", message);
          sendEvent(controller, { type: "error", message });
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
  } catch (err) {
    console.error("Pipeline stream error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
