import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";

const STANDARD_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## OUTPUT ORDER — FOLLOW EXACTLY
1. <head>: title, meta, Google Fonts link
2. <style>: ONLY :root custom properties (colors, fonts) + max 40 lines site-specific CSS. A component library is auto-injected with .btn-primary, .btn-secondary, .card, .grid-3, .section, .section-alt, .testimonial-card, .stat-item, .faq-item, .badge, .input — USE those classes.
3. <body>: THIS IS 80% OF YOUR OUTPUT. Write every section with full real content.
4. <script>: mobile menu, FAQ accordion, counter animation (under 40 lines)

## CSS LIMIT: 40 LINES MAX
The component library handles buttons, cards, grids, inputs, badges, sections, shadows, transitions. You only write :root variables and site-specific overrides.

## BODY SECTIONS — WRITE ALL OF THESE
1. <nav> — sticky, logo + links + CTA button
2. Hero — 90-100vh, punchy headline, subheading, TWO CTAs, social proof
3. Social proof bar — company names/badges in muted strip
4. Features — .grid-3 > .card with SVG icons, benefit titles, descriptions
5. About — split layout, compelling story + image + stats
6. Process/Timeline — numbered steps
7. Testimonials — .testimonial-card (3 cards, specific metrics like "47% increase")
8. Stats — .stat-item with animated counters (specific numbers)
9. FAQ — .faq-item accordion (4-5 objection-handling questions)
10. CTA — compelling heading, button, friction-reducer ("No credit card required")
11. Footer — 4 columns: about, services, contact (phone/email/address), social

## INDUSTRY AESTHETIC — Via :root colors + visual treatment
- Real Estate / Luxury Real Estate: ASPIRATIONAL. Use .hero-image or .hero-carousel for full-bleed property photos. Use .property-card + .property-grid for listings. Navy+gold palette, serif headings. Full-bleed imagery, NOT sparse white pages.
- Luxury (non-real-estate): Light bg, serif headings, full-bleed .hero-image with .overlay-text.
- Legal/Medical/Financial: light bg (#fefefe), serif headings, muted accents. Conservative. NO dark themes.
- SaaS/Tech: dark bg OK, sans-serif, vibrant accents. .hero-aurora or .hero-mesh recommended.
- Restaurant/Food: warm palette, serif headings, full-bleed .hero-image of food/ambiance with .overlay-text.
- Healthcare: soft palette, clean and calming.
- Portfolio/Creative: Bold typography, full-bleed .hero-image, .image-gallery for projects. Dark OK.

## COMPONENT LIBRARY EXTRAS
Also available: .carousel, .carousel-track, .carousel-slide, .carousel-nav, .carousel-dot, .carousel-arrow, .hero-image, .hero-carousel, .overlay-text, .overlay-gradient, .property-card, .property-card-img, .property-card-details, .property-card-price, .property-card-meta, .property-grid, .image-gallery, .feature-badge, .status-badge, .status-for-sale, .status-sold, .status-open-house

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with industry-specific keywords. object-fit: cover.
  Real estate: seed/luxury-house, seed/modern-villa, seed/mansion-interior, seed/penthouse-view, seed/pool-villa
  Restaurant: seed/gourmet-food, seed/restaurant-interior, seed/chef-cooking
  Tech: seed/modern-office, seed/coding-workspace
- .fade-in on sections for scroll animation (component library handles it). NEVER set opacity:0.
- An empty <body> is a TOTAL FAILURE. Body content is the product.
- NO: gradient blobs on conservative industries (legal, accounting), generic copy.`;

const PREMIUM_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## OUTPUT ORDER — FOLLOW EXACTLY
1. <head>: title, meta, Google Fonts link
2. <style>: ONLY :root custom properties + max 40 lines site-specific CSS. A component library is auto-injected with .btn-primary, .btn-secondary, .card, .grid-3, .section, .section-alt, .testimonial-card, .stat-item, .faq-item, .badge, .input — USE those classes.
3. <body>: THIS IS 80% OF YOUR OUTPUT. Write every section with full real content.
4. <script>: mobile menu, FAQ accordion, counter animation (under 40 lines)

## CSS LIMIT: 40 LINES MAX
The component library handles buttons, cards, grids, inputs, badges, sections, shadows, transitions. You only write :root variables and site-specific overrides.

## BODY SECTIONS — WRITE ALL OF THESE (PREMIUM TIER)
1. <nav> — sticky, logo + links + CTA button
2. Hero — 90-100vh, punchy headline, subheading, TWO CTAs, social proof
   * REAL ESTATE: Use .hero-carousel or .hero-image with full-viewport property photos + .overlay-text
   * RESTAURANT: Use .hero-image with food/ambiance photo + .overlay-text
   * TECH/SAAS: Use .hero-aurora or .hero-mesh for animated gradient backgrounds
3. Social proof bar — company names/badges in muted strip
4. Features — .grid-3 > .card with SVG icons, benefit titles, descriptions
   * REAL ESTATE: Use .property-grid > .property-card instead (price, beds/baths/sqft, .status-badge)
5. About — split layout, compelling story + image + stats
6. Process/Timeline — numbered steps
7. Testimonials — .testimonial-card (3 cards, specific metrics like "47% increase")
8. Stats — .stat-item with animated counters (specific numbers)
9. FAQ — .faq-item accordion (4-5 objection-handling questions)
10. CTA — compelling heading, button, friction-reducer ("No credit card required")
11. Footer — 4 columns: about, services, contact (phone/email/address), social

## INDUSTRY AESTHETIC — Via :root colors + visual treatment
- Real Estate / Luxury Real Estate: ASPIRATIONAL. Use .hero-image or .hero-carousel for full-bleed property photos. Use .property-card + .property-grid for listings. Navy+gold palette, serif headings. Full-bleed imagery, NOT sparse white pages.
- Luxury (non-real-estate): Light bg, serif headings, full-bleed .hero-image with .overlay-text.
- Legal/Medical/Financial: light bg (#fefefe), serif headings, muted accents. Conservative. NO dark themes.
- SaaS/Tech: dark bg OK, sans-serif, vibrant accents. .hero-aurora or .hero-mesh recommended.
- Restaurant/Food: warm palette, serif headings, full-bleed .hero-image of food/ambiance with .overlay-text.
- Healthcare: soft palette, clean and calming.
- Portfolio/Creative: Bold typography, full-bleed .hero-image, .image-gallery for projects. Dark OK.

## COMPONENT LIBRARY EXTRAS
Also available: .carousel, .carousel-track, .carousel-slide, .carousel-nav, .carousel-dot, .carousel-arrow, .hero-image, .hero-carousel, .overlay-text, .overlay-gradient, .property-card, .property-card-img, .property-card-details, .property-card-price, .property-card-meta, .property-grid, .image-gallery, .feature-badge, .status-badge, .status-for-sale, .status-sold, .status-open-house

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with industry-specific keywords. object-fit: cover.
  Real estate: seed/luxury-house, seed/modern-villa, seed/mansion-interior, seed/penthouse-view, seed/pool-villa
  Restaurant: seed/gourmet-food, seed/restaurant-interior, seed/chef-cooking
  Tech: seed/modern-office, seed/coding-workspace
- .fade-in on sections for scroll animation (component library handles it). NEVER set opacity:0.
- An empty <body> is a TOTAL FAILURE. Body content is the product.
- NO: gradient blobs on conservative industries (legal, accounting), generic copy.`;

const EDIT_SYSTEM = `You are Zoobicon, an AI website editor. You are given an existing HTML website and an edit instruction. Apply the requested changes and return the complete, updated HTML file.

## Rules
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Preserve the existing design language, color palette, and typography unless asked to change them.
- Make the requested changes precisely and thoroughly.
- Maintain all existing responsive behavior and hover states.
- If adding new sections, match the existing visual style perfectly.
- The output must be a complete, valid HTML document — not a diff or partial.`;

export const maxDuration = 300; // Match pipeline-stream timeout for Opus builds

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, existingCode, model: requestedModel, generator } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "A prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long (max 5000 characters)" }),
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

    const client = new Anthropic({ apiKey, timeout: 120_000 });

    const isEdit = typeof existingCode === "string" && existingCode.trim().length > 0;
    const isPremium = tier === "premium";

    let systemPrompt: string;
    let userMessage: string;
    let model: string;
    let maxTokens: number;

    if (isEdit) {
      systemPrompt = EDIT_SYSTEM;
      userMessage = `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections.\n\nApply this edit: ${prompt}`;
      model = requestedModel || "claude-sonnet-4-6";
      maxTokens = 32000;
    } else {
      // New builds use Opus for maximum quality — this is the stream fallback
      // when the 10-agent pipeline is unavailable. Edits stay on Sonnet for speed.
      systemPrompt = isPremium ? PREMIUM_SYSTEM : STANDARD_SYSTEM;

      // Append generator-specific instructions when building from a generator page
      if (generator && typeof generator === "string") {
        const supplement = getGeneratorSystemSupplement(generator);
        if (supplement) {
          systemPrompt += "\n\n" + supplement;
        }
      }
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry — if this is a luxury, executive, or professional brand, use elegant typography, aspirational imagery, warm whites, and sophisticated restraint. If this is a tech/startup brand, use modern clean design with tasteful accents. Always include: hero with clear value proposition, social proof, services/features, testimonials, stats, CTA, and comprehensive footer. The design must feel premium, polished, and trustworthy.`;
      model = requestedModel || "claude-opus-4-6";
      maxTokens = 32000;
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userMessage + (!isEdit ? "\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html> — no preamble, no explanation, no code fences. Output raw HTML only." : "") },
    ];

    let stream;
    try {
      stream = await client.messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
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
      // If Opus fails, try Sonnet as fallback
      if (model === "claude-opus-4-6") {
        console.warn(`[Stream] Opus failed (${apiErr instanceof Error ? apiErr.message : "unknown"}), falling back to Sonnet`);
        try {
          stream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
          });
        } catch {
          throw apiErr; // If Sonnet also fails, throw the original Opus error
        }
      } else {
        throw apiErr;
      }
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let accumulated = "";

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              accumulated += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: event.delta.text })}\n\n`)
              );
            }
          }

          // Validate body content — same logic as the pipeline's hasBodyContent()
          const bodyMatch = accumulated.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const bodyText = bodyMatch
            ? bodyMatch[1]
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim()
            : "";

          if (!isEdit && bodyText.length < 100) {
            // Body is empty/near-empty — retry up to 2 times with increasingly aggressive body-first prompts
            console.warn(`[Stream] Empty body detected (${bodyText.length} chars). Retrying with body-first prompt...`);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Retrying — generating content..." })}\n\n`)
            );

            const retryPrompts = [
              `You are Zoobicon, an elite AI website generator. Output a single, complete HTML file.

## ABSOLUTE RULE: WRITE THE <body> CONTENT FIRST
Your #1 job is to fill the <body> with rich, visible content. Structure your output EXACTLY like this:

1. <!DOCTYPE html>, <html>, <head> with meta viewport + title + Google Fonts link
2. <style> — MAXIMUM 80 lines of CSS. Use CSS custom properties. Keep it MINIMAL — just colors, fonts, and basic layout. NO animations, NO elaborate selectors.
3. <body> — THIS IS THE MAIN OUTPUT (80%+ of your response). Must contain ALL sections with real text, real images, real content.
4. <script> before </body> for interactivity

CRITICAL: Your previous attempt produced CSS but ZERO visible content. This time, write MINIMAL CSS and focus ALL output on <body> content.

The <body> MUST contain: navigation, hero section, features/services, about section, testimonials, stats, FAQ, call-to-action, footer. Every section must have real, specific, benefit-focused copy.

Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images (specific keywords like seed/luxury-shuttle/800/500).
Import 2 Google Fonts. Use CSS custom properties for colors. Match the industry aesthetic.
Output ONLY raw HTML — no markdown, no code fences, no explanation.`,

              `You are Zoobicon. Output a COMPLETE HTML page. Your ONLY job is to produce visible content.

WRITE BARELY ANY CSS — use inline styles if needed. The BODY is everything.

Output: <!DOCTYPE html><html><head><title>Site</title><style>/* minimal */</style></head><body>
THEN write ALL page content: nav, hero, features, about, testimonials, stats, FAQ, CTA, footer.
Use real text, real images (https://picsum.photos/seed/KEYWORD/W/H), real content.
Output ONLY raw HTML.`
            ];

            let retrySucceeded = false;
            for (let i = 0; i < retryPrompts.length && !retrySucceeded; i++) {
              try {
                const retryResponse = await client.messages.create({
                  model,
                  max_tokens: maxTokens,
                  system: retryPrompts[i],
                  messages: [{ role: "user", content: userMessage }],
                });

                const retryBlock = retryResponse.content.find((b) => b.type === "text");
                if (retryBlock && retryBlock.type === "text") {
                  // Validate retry also has body content
                  const retryBodyMatch = retryBlock.text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                  const retryBodyText = retryBodyMatch
                    ? retryBodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
                    : "";

                  if (retryBodyText.length >= 100) {
                    console.log(`[Stream] Retry ${i + 1} succeeded (${retryBodyText.length} body chars)`);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "replace", content: retryBlock.text })}\n\n`)
                    );
                    retrySucceeded = true;
                  } else {
                    console.warn(`[Stream] Retry ${i + 1} still empty (${retryBodyText.length} body chars)`);
                  }
                }
              } catch (retryErr) {
                console.error(`[Stream] Retry ${i + 1} failed:`, retryErr);
              }
            }

            if (!retrySucceeded) {
              console.error("[Stream] All retries produced empty body");
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Generation produced empty content after retries. Please try again with a different prompt." })}\n\n`)
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          let message = err instanceof Error ? err.message : "Stream error";
          const isRateLimit = err instanceof Anthropic.RateLimitError
            || err instanceof Anthropic.InternalServerError
            || /rate.limit|too many|overloaded|529/i.test(message);

          // Cross-provider failover: try OpenAI/Gemini when Claude is rate-limited
          if (isRateLimit) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Switching AI provider..." })}\n\n`)
              );
              const failoverRes = await callLLMWithFailover(
                { model: "gpt-4o", system: systemPrompt, userMessage, maxTokens: 16000 },
                (_p, fbModel) => {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "status", message: `Using ${fbModel}...` })}\n\n`)
                  );
                }
              );
              if (failoverRes.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "replace", content: failoverRes.text })}\n\n`)
                );
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
                );
                controller.close();
                return;
              }
            } catch (crossErr) {
              console.error("[Stream] Cross-provider failover failed:", crossErr instanceof Error ? crossErr.message : crossErr);
            }
          }

          // Sanitize raw API error messages for user display
          if (err instanceof Anthropic.RateLimitError) {
            message = "AI service is busy. Please wait a moment and try again.";
          } else if (err instanceof Anthropic.AuthenticationError) {
            message = "AI service is temporarily unavailable. The site owner needs to update their API key.";
          } else if (/rate.limit|too many/i.test(message)) {
            message = "AI service is busy. Please wait a moment and try again.";
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
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
  } catch (err) {
    console.error("Generation stream error:", err);

    // Always extract a meaningful error message
    let errorMsg = "Unknown generation error";
    let statusCode = 500;

    if (err instanceof Anthropic.APIError) {
      errorMsg = `Anthropic API error (${err.status}): ${err.message}`;
      statusCode = err.status || 500;
    } else if (err instanceof Anthropic.APIConnectionError) {
      errorMsg = "Cannot reach Anthropic API — check network connectivity";
      statusCode = 503;
    } else if (err instanceof Error) {
      errorMsg = err.message;
      if (err.message.includes("timed out") || err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
        errorMsg = `AI model timed out: ${err.message}. The model may be overloaded — try again in a minute.`;
        statusCode = 504;
      }
    } else if (typeof err === "string") {
      errorMsg = err;
    } else {
      errorMsg = `Stream error: ${JSON.stringify(err)}`;
    }

    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
}
