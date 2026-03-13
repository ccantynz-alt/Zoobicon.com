import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { injectComponentLibrary } from "@/lib/component-library";

/**
 * POST /api/generate/quick — Primary generation endpoint
 *
 * Single-call architecture: one model, one prompt, reliable output.
 * - Standard tier: Sonnet (~20-30s) — fast, impressive, hooks users
 * - Premium tier: Opus (~60-90s) — best quality, the upgrade incentive
 *
 * No multi-agent pipeline. The model is smart enough to be strategist,
 * designer, copywriter, and developer in a single call.
 */

export const maxDuration = 300;

// ── Standard System Prompt (Sonnet) ──
// Focused on speed + impressive output. Body-first, minimal CSS.
const STANDARD_SYSTEM = `You are Zoobicon, an elite AI website generator that produces agency-quality websites. Output a single, complete HTML file.

## OUTPUT STRUCTURE — FOLLOW EXACTLY
1. <!DOCTYPE html>, <html lang="en">, <head> — title, meta viewport, meta description, TWO Google Fonts via <link>
2. <style> — ONLY :root custom properties (colors, fonts, sizes) + max 50 lines of site-specific CSS. A component library is auto-injected with .btn-primary, .btn-secondary, .card, .grid-2, .grid-3, .section, .section-alt, .container, .testimonial-card, .stat-item, .faq-item, .badge, .input, .fade-in — USE those classes.
3. <body> — THIS IS 80% OF YOUR OUTPUT. Every section with full, real content.
4. <script> — mobile menu, FAQ accordion, counter animation, smooth scroll (under 40 lines)

## CSS BUDGET: 50 LINES MAX
The component library handles buttons, cards, grids, inputs, badges, sections, shadows, hover states, transitions, responsive design. You only write :root variables and site-specific overrides.

## BODY SECTIONS — WRITE ALL OF THESE
1. <nav> — sticky, logo text + navigation links + CTA button, mobile hamburger
2. Hero — full-viewport, punchy benefit-driven headline, subheading, TWO CTA buttons, social proof line
3. Social proof bar — 4-5 company/client names in a muted horizontal strip
4. Features/Services — .grid-3 > .card with inline SVG icons, benefit-focused titles, 2-line descriptions
5. About — split layout with image + compelling story + 3 stats with numbers
6. Testimonials — 3x .testimonial-card with specific quotes mentioning metrics ("increased revenue by 47%")
7. Stats — .stat-item with big numbers (use specific impressive figures)
8. FAQ — .faq-item accordion with 4-5 objection-handling questions and answers
9. CTA — compelling headline, description, button, trust line ("No credit card required")
10. Footer — 4-column grid: about blurb, quick links, services, contact (phone/email/address)

## INDUSTRY AESTHETIC — Match via :root colors + font choice
- Luxury/Legal/Medical: light backgrounds (#fafaf9), serif headings (Playfair Display), muted earth tones. NO dark themes.
- SaaS/Tech/Startup: can use dark hero, sans-serif (Inter), vibrant accent colors.
- Restaurant/Food: warm palette, serif headings, appetizing imagery.
- Creative/Portfolio: bold typography, high contrast, dramatic spacing.
- Healthcare: soft blues/greens, clean, calming, lots of whitespace.

## RULES
- Output ONLY raw HTML. No markdown, no code fences, no explanation.
- Start IMMEDIATELY with <!DOCTYPE html>.
- Images: https://picsum.photos/seed/DESCRIPTIVE-KEYWORD/WIDTH/HEIGHT with industry-relevant keywords.
- Add .fade-in class to each <section> for scroll animations.
- NEVER set opacity:0 on any element.
- Every headline is BENEFIT-FOCUSED, not feature-focused.
- Testimonials mention SPECIFIC results with real numbers.
- An empty <body> is a TOTAL FAILURE.`;

// ── Premium System Prompt (Opus) ──
// Richer, more detailed — Opus can handle the complexity for jaw-dropping results.
const PREMIUM_SYSTEM = `You are Zoobicon, a world-class AI website generator. You produce websites that look like they were built by a $30,000+ design agency. Output a single, complete HTML file.

## OUTPUT STRUCTURE — FOLLOW EXACTLY
1. <!DOCTYPE html>, <html lang="en">, <head> — SEO-optimized title, meta description, Open Graph tags, TWO complementary Google Fonts via <link>
2. <style> — :root custom properties + max 60 lines of site-specific CSS. A component library is auto-injected with .btn-primary, .btn-secondary, .btn-ghost, .card, .card-body, .grid-2, .grid-3, .grid-4, .section, .section-alt, .container, .testimonial-card, .stat-item, .stat-number, .stat-label, .faq-item, .faq-question, .faq-answer, .badge, .input, .fade-in, .fade-in-left, .fade-in-right, .scale-in, .text-center, .text-muted — USE those classes extensively.
3. <body> — THIS IS 80% OF YOUR OUTPUT. Every section richly detailed.
4. <script> — mobile menu, FAQ accordion, animated counters, smooth scroll, scroll-triggered animations (under 50 lines)

## CSS BUDGET: 60 LINES MAX
The auto-injected component library handles all base styling. You write :root variables, site-specific overrides, and premium touches (gradients, shadows, spacing refinements).

## BODY SECTIONS — WRITE ALL, MAKE EACH EXCEPTIONAL
1. <nav> — sticky with blur backdrop, logo text + nav links + CTA button, mobile hamburger with slide-in menu
2. Hero — full-viewport, magnetic headline (benefit-driven, emotionally resonant), subheading that addresses the visitor's pain point, TWO distinct CTAs (primary + ghost), social proof (e.g., "Trusted by 2,500+ companies" or star rating)
3. Social proof bar — 5-6 recognizable company names or "As featured in" logos in a muted strip
4. Problem/Pain section — Address the visitor's frustrations. "Tired of X? Struggling with Y?" Use empathy.
5. Solution/Features — .grid-3 > .card with custom inline SVG icons, benefit-focused headlines, 3-line descriptions that connect feature → benefit → outcome
6. About/Story — split layout (image + text), founder story or company mission, 3-4 impressive stats with counters
7. Process/How it works — 3-4 numbered steps with icons, showing the journey from sign-up to success
8. Testimonials — 3x .testimonial-card with DETAILED quotes mentioning specific metrics ("Increased our conversion rate by 47% in just 3 months"), real names, titles, companies, star ratings
9. Stats/Social proof — .stat-item with impressive numbers and animated counters
10. Pricing or packages — if appropriate for the business type, show 2-3 tier cards
11. FAQ — .faq-item accordion with 5-6 objection-handling questions, thorough answers
12. Final CTA — emotionally compelling headline, urgency or scarcity element, prominent button, trust signals ("30-day money-back guarantee • No credit card required • Cancel anytime")
13. Footer — 4-column: about + newsletter signup, navigation links, services, contact details (phone, email, address) + social media links

## INDUSTRY AESTHETIC — Match via :root + typography + imagery
- Luxury/Legal/Finance: warm whites (#fdfcfb), serif headings (Playfair Display, Cormorant), muted gold/navy accents, generous whitespace, elegant restraint. NEVER dark theme.
- SaaS/Tech: dark hero allowed, modern sans-serif (Inter, Plus Jakarta Sans), vibrant gradients, clean cards, data-driven copy.
- Restaurant/Hospitality: warm earth tones, serif headings, food/atmosphere imagery, inviting language.
- Healthcare/Wellness: soft blue-green palette, clean sans-serif, calming, professional, trust-building.
- Creative/Agency: bold typography, high contrast, dramatic whitespace, portfolio-style layouts.
- E-commerce/Retail: product-focused, clean grid layouts, prominent CTAs, urgency elements.

## RULES
- Output ONLY raw HTML. No markdown, no code fences, no explanation.
- Start IMMEDIATELY with <!DOCTYPE html>.
- Images: https://picsum.photos/seed/DESCRIPTIVE-KEYWORD/WIDTH/HEIGHT — use highly specific, industry-relevant keywords (e.g., seed/luxury-office/800/500, seed/fresh-coffee-beans/600/400).
- Add .fade-in, .fade-in-left, .fade-in-right, .scale-in classes to sections for scroll animations.
- NEVER set opacity:0 on any element.
- Every headline is BENEFIT-FOCUSED and emotionally engaging.
- Copy should handle objections, build trust, and drive action.
- Include specific numbers, percentages, and results throughout.
- The design must feel like a $30K agency built it — premium, polished, intentional.
- An empty <body> is a TOTAL FAILURE.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, model: requestedModel } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "A prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const isPremium = tier === "premium";

    // Model selection: Premium = Opus, Standard = Sonnet
    // User-selected model overrides (for multi-LLM support)
    const model = requestedModel || (isPremium ? "claude-opus-4-6" : "claude-sonnet-4-6");
    const systemPrompt = isPremium ? PREMIUM_SYSTEM : STANDARD_SYSTEM;
    const maxTokens = isPremium ? 32000 : 16000;
    const timeout = isPremium ? 180_000 : 90_000;

    const client = new Anthropic({ apiKey, timeout });
    const encoder = new TextEncoder();

    const userMessage = isPremium
      ? `Build me a stunning, world-class website for: ${prompt}

This must look like it was designed by an elite agency. Match the aesthetic perfectly to the industry. Include every section from the system prompt with rich, specific, benefit-driven content throughout. Use real-sounding testimonials with specific metrics. The copy should be persuasive and objection-handling. Make the visitor think "this company is the real deal."

Start IMMEDIATELY with <!DOCTYPE html>. Output raw HTML only.`
      : `Build a stunning website for: ${prompt}

Include: navigation, hero with headline and CTA, features/services grid, about section, testimonials with specific results, stats, FAQ, call-to-action, and footer with contact info. Match the design aesthetic to the industry.

Start IMMEDIATELY with <!DOCTYPE html>. Output raw HTML only.`;

    const readable = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let stream;

          // Try primary model
          try {
            stream = client.messages.stream({
              model,
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            });
          } catch (initErr) {
            // If Opus init fails, fall back to Sonnet
            if (isPremium) {
              console.warn(`[Quick] Opus init failed: ${initErr instanceof Error ? initErr.message : "unknown"}, using Sonnet`);
              sendEvent({ type: "status", message: "Using fast mode..." });
              stream = client.messages.stream({
                model: "claude-sonnet-4-6",
                max_tokens: 16000,
                system: STANDARD_SYSTEM,
                messages: [{ role: "user", content: userMessage }],
              });
            } else {
              throw initErr;
            }
          }

          let accumulated = "";

          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              accumulated += ev.delta.text;
              sendEvent({ type: "chunk", content: ev.delta.text });
            }
          }

          // Clean up
          let html = accumulated.trim();
          html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const ds = html.search(/<!doctype\s+html|<html/i);
          if (ds > 0) html = html.slice(ds);
          const he = html.lastIndexOf("</html>");
          if (he !== -1) html = html.slice(0, he + "</html>".length);

          // Validate body content
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const bodyText = bodyMatch
            ? bodyMatch[1]
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim()
            : "";

          console.log(`[Quick] ${isPremium ? "Premium/Opus" : "Standard/Sonnet"}: ${html.length} chars, body: ${bodyText.length} chars`);

          // If body is empty and this was Opus, retry with Sonnet
          if (bodyText.length < 50 && isPremium) {
            console.warn(`[Quick] Opus empty body (${bodyText.length} chars), retrying with Sonnet`);
            sendEvent({ type: "status", message: "Optimizing output..." });

            const retryClient = new Anthropic({ apiKey, timeout: 90_000 });
            const retryStream = retryClient.messages.stream({
              model: "claude-sonnet-4-6",
              max_tokens: 16000,
              system: STANDARD_SYSTEM,
              messages: [{ role: "user", content: userMessage }],
            });

            accumulated = "";
            for await (const ev of retryStream) {
              if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
                accumulated += ev.delta.text;
              }
            }

            html = accumulated.trim();
            html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
            const rds = html.search(/<!doctype\s+html|<html/i);
            if (rds > 0) html = html.slice(rds);
            const rhe = html.lastIndexOf("</html>");
            if (rhe !== -1) html = html.slice(0, rhe + "</html>".length);
          }

          // Inject component library
          html = injectComponentLibrary(html);

          // Send final version
          sendEvent({ type: "replace", content: html });
          sendEvent({ type: "done" });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation error";
          console.error(`[Quick] Error:`, message);

          // If Opus streaming failed mid-way, try Sonnet as complete fallback
          if (isPremium && !message.includes("API_KEY") && !message.includes("not configured")) {
            try {
              console.warn(`[Quick] Opus stream failed, full Sonnet fallback`);
              sendEvent({ type: "status", message: "Switching to fast mode..." });

              const fallbackClient = new Anthropic({ apiKey, timeout: 90_000 });
              const fallbackStream = fallbackClient.messages.stream({
                model: "claude-sonnet-4-6",
                max_tokens: 16000,
                system: STANDARD_SYSTEM,
                messages: [{ role: "user", content: userMessage }],
              });

              let fallbackHtml = "";
              for await (const ev of fallbackStream) {
                if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
                  fallbackHtml += ev.delta.text;
                  sendEvent({ type: "chunk", content: ev.delta.text });
                }
              }

              let cleaned = fallbackHtml.trim();
              cleaned = cleaned.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
              const fds = cleaned.search(/<!doctype\s+html|<html/i);
              if (fds > 0) cleaned = cleaned.slice(fds);
              const fhe = cleaned.lastIndexOf("</html>");
              if (fhe !== -1) cleaned = cleaned.slice(0, fhe + "</html>".length);

              cleaned = injectComponentLibrary(cleaned);
              sendEvent({ type: "replace", content: cleaned });
              sendEvent({ type: "done" });
              controller.close();
              return;
            } catch (fallbackErr) {
              console.error(`[Quick] Sonnet fallback also failed:`, fallbackErr);
            }
          }

          sendEvent({ type: "error", message });
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
    console.error("[Quick] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
