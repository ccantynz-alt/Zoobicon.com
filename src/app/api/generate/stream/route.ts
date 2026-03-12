import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const STANDARD_SYSTEM = `You are Zoobicon, an elite AI website generator. Your output is a single, complete HTML file.

## CRITICAL: TOKEN BUDGET
- <style>: MAX 100 lines of compact CSS. NO elaborate selectors, NO redundant rules.
- <body>: THIS IS 75% OF YOUR OUTPUT. Every section with real content, images, text.
- <script>: 10% — interactivity (menu, scroll, counters, FAQ).
- If running long, STOP CSS and complete the body. An empty <body> is a TOTAL FAILURE.
- Output ONLY raw HTML. No markdown, no explanation, no code fences.

## BODY CONTENT — MANDATORY SECTIONS (write ALL of these)
Include every one of these sections with real, specific, benefit-focused copy:
1. **Navigation** — sticky, with logo + links + CTA button
2. **Hero** — 90-100vh, BIG headline, subheading, TWO CTAs (filled + ghost), social proof ("Trusted by 500+"), scroll indicator
3. **Social proof/trust bar** — company names or badges
4. **Services/Features** — 3-4 items with inline SVG icons, benefit-focused titles, 2-3 sentence descriptions
5. **About section** — with image, compelling story, stats
6. **Testimonials** — 3 cards with specific metrics ("Increased bookings by 47%"), real names/titles/companies
7. **Stats** — 3-4 animated counters with specific numbers ("2,847 projects delivered")
8. **FAQ accordion** — 4-5 objection-handling questions with answers
9. **CTA section** — compelling heading, button, friction-reducer
10. **Footer** — 4 columns: About, Services, Contact (realistic phone/email/address), Social links

## INDUSTRY AESTHETIC — Match to the business type
- **Luxury/Real Estate/Legal/Financial/Medical:** LIGHT backgrounds (warm whites #fefefe, #faf9f7), serif headings (Playfair Display, Cormorant Garamond), muted accents (navy, forest green, gold). NO dark themes, NO neon.
- **SaaS/Tech/Startup:** Dark themes OK (#0f172a). Sans fonts (Inter, Space Grotesk). Vibrant accents (indigo, violet, emerald). Tasteful glass-morphism.
- **Restaurant/Food/Hospitality:** Warm palettes (cream, terracotta, olive). Serif headings. Large food photography.
- **Transportation/Logistics:** Clean blues/navy/greens. Fleet imagery. Trust signals (safety, insurance).
- **E-commerce:** Clean, white-space heavy. Product grids, trust badges.
- **Healthcare/Wellness:** Soft palettes (sage, lavender). Clean and trustworthy.

## DESIGN REFERENCE (keep CSS compact — these are guidelines, not requirements for individual rules)
- 2 Google Fonts. Headings: clamp(2rem, 4.5vw, 4.5rem). Body: 16-18px, line-height 1.7.
- CSS custom properties for all colors. Alternate section backgrounds for rhythm.
- Multi-layer shadows: 0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06).
- Transitions: all 0.3s cubic-bezier(0.4, 0, 0.2, 1). Buttons/cards: translateY on hover.
- .fade-in class for scroll animations (component library handles it). Do NOT set opacity:0.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (specific keywords, never generic). object-fit: cover.
- Mobile: hamburger menu, clamp() typography, 44px tap targets.
- NO: free template look, dark themes for non-tech, gradient blobs on corporate, generic copy, lorem ipsum.`;

const PREMIUM_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## CRITICAL: TOKEN BUDGET
- <style>: MAX 100 lines of compact CSS. NO elaborate selectors, NO redundant rules.
- <body>: THIS IS 75% OF YOUR OUTPUT. Every section with real content, images, text.
- <script>: 10% — interactivity (menu, scroll, counters, FAQ).
- If running long, STOP CSS and complete the body. An empty <body> is a TOTAL FAILURE.
- Output ONLY raw HTML. No markdown, no explanation, no code fences.

## BODY CONTENT — MANDATORY SECTIONS (write ALL of these)
Include every one of these sections with premium, benefit-focused copy:
1. **Navigation** — sticky, logo + links + CTA button
2. **Hero** — 90-100vh, BIG punchy headline, subheading, TWO CTAs (filled + ghost), social proof ("Trusted by 500+"), scroll indicator
3. **Social proof/trust bar** — company names or badges in a muted horizontal strip
4. **Services/Features** — 3-4 items with inline SVG icons, benefit titles, 2-3 sentence descriptions
5. **About section** — with image, compelling story, stats
6. **Process/How-it-works** — numbered steps connected by lines or timeline
7. **Testimonials** — 3 cards with specific metrics ("Increased bookings by 47%"), real names/titles/companies
8. **Stats** — 3-4 animated counters ("2,847 projects delivered")
9. **FAQ accordion** — 4-5 objection-handling questions
10. **CTA section** — compelling heading, button, friction-reducer ("No credit card required")
11. **Footer** — 4 columns: About, Services, Contact (realistic phone/email/address), Social links

## INDUSTRY AESTHETIC — Match to the business type
- **Luxury/Real Estate/Legal/Financial/Medical:** LIGHT backgrounds (warm whites #fefefe, #faf9f7), serif headings (Playfair Display, Cormorant Garamond), muted accents (navy, forest green, gold). NO dark themes, NO neon.
- **SaaS/Tech/Startup:** Dark themes OK (#0f172a). Sans fonts (Inter, Space Grotesk). Vibrant accents (indigo, violet, emerald).
- **Restaurant/Food/Hospitality:** Warm palettes (cream, terracotta, olive). Serif headings. Large food photography.
- **Transportation/Logistics:** Clean blues/navy. Fleet imagery. Trust signals.
- **E-commerce:** White-space heavy. Product grids, trust badges.
- **Healthcare/Wellness:** Soft palettes (sage, lavender). Clean and trustworthy.

## DESIGN REFERENCE (keep CSS compact)
- 2 Google Fonts. Headings: clamp(2.5rem, 5vw, 4.5rem). Body: 16-18px, line-height 1.7.
- CSS custom properties for all colors. Alternate section backgrounds for rhythm.
- Multi-layer shadows. Transitions on all interactive elements.
- .fade-in class for scroll animations (component library handles it). Do NOT set opacity:0.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (specific descriptive keywords). object-fit: cover.
- Mobile: hamburger menu, clamp() typography, 44px tap targets.
- SVG wave dividers between key sections. Decorative accent lines above headings.
- NO: free template look, dark themes for non-tech, gradient blobs on corporate, generic copy, lorem ipsum.`;

const EDIT_SYSTEM = `You are Zoobicon, an AI website editor. You are given an existing HTML website and an edit instruction. Apply the requested changes and return the complete, updated HTML file.

## Rules
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Preserve the existing design language, color palette, and typography unless asked to change them.
- Make the requested changes precisely and thoroughly.
- Maintain all existing responsive behavior and hover states.
- If adding new sections, match the existing visual style perfectly.
- The output must be a complete, valid HTML document — not a diff or partial.`;

export const maxDuration = 120; // Allow up to 2 minutes

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, existingCode } = await req.json();

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

    const client = new Anthropic({ apiKey });

    const isEdit = typeof existingCode === "string" && existingCode.trim().length > 0;
    const isPremium = tier === "premium";

    let systemPrompt: string;
    let userMessage: string;
    let model: string;
    let maxTokens: number;

    if (isEdit) {
      systemPrompt = EDIT_SYSTEM;
      userMessage = `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections.\n\nApply this edit: ${prompt}`;
      model = "claude-sonnet-4-6";
      maxTokens = 64000;
    } else {
      // New builds use Opus for maximum quality — this is the stream fallback
      // when the 10-agent pipeline is unavailable. Edits stay on Sonnet for speed.
      systemPrompt = isPremium ? PREMIUM_SYSTEM : STANDARD_SYSTEM;
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry — if this is a luxury, executive, or professional brand, use elegant typography, aspirational imagery, warm whites, and sophisticated restraint. If this is a tech/startup brand, use modern clean design with tasteful accents. Always include: hero with clear value proposition, social proof, services/features, testimonials, stats, CTA, and comprehensive footer. The design must feel premium, polished, and trustworthy.`;
      model = "claude-opus-4-6";
      maxTokens = 64000;
    }

    // Assistant prefill: force the model to start writing HTML structure immediately.
    // This prevents the model from spending all tokens on CSS with an empty body.
    // For new builds, we prefill through </head><body> so the model MUST write body content.
    const PREFILL_NEW = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userMessage },
    ];

    // Only prefill for new builds (not edits) — edits need to see the full existing HTML first
    const prefill = !isEdit ? PREFILL_NEW : "";
    if (prefill) {
      messages.push({ role: "assistant", content: prefill });
    }

    // Try to create the stream — with model fallback if the primary model fails
    let stream;
    let activeModel = model;
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
      // If primary model fails (e.g. Opus unavailable), try Sonnet
      const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      console.error(`[Stream] ${model} failed: ${errMsg}. Trying Sonnet fallback...`);
      if (model !== "claude-sonnet-4-6") {
        try {
          activeModel = "claude-sonnet-4-6";
          stream = await client.messages.stream({
            model: activeModel,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
          });
        } catch (fallbackErr) {
          console.error(`[Stream] Sonnet fallback also failed:`, fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
          throw apiErr; // Throw original error
        }
      } else {
        throw apiErr;
      }
    }
    console.log(`[Stream] Using model: ${activeModel} (requested: ${model})`);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send the prefill content as the first chunk so the client has the full HTML
          let accumulated = prefill;
          if (prefill) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: prefill })}\n\n`)
            );
          }

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
            // Body is empty/near-empty — retry with model fallback: same model without prefill, then Sonnet
            console.warn(`[Stream] Empty body detected (${bodyText.length} chars, model=${activeModel}). Retrying...`);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Retrying — generating content..." })}\n\n`)
            );

            const RETRY_SYSTEM = `You are Zoobicon, an elite AI website generator. Output a single, complete HTML file.

## ABSOLUTE RULE: WRITE THE <body> CONTENT FIRST
Your #1 job is to fill the <body> with rich, visible content:
1. <!DOCTYPE html>, <html>, <head> with meta viewport + title + Google Fonts link
2. <style> — MAXIMUM 80 lines of CSS. Keep it MINIMAL.
3. <body> — THIS IS THE MAIN OUTPUT (80%+). Must contain ALL sections.
4. <script> before </body>

The <body> MUST contain: navigation, hero, features/services, about, testimonials, stats, FAQ, CTA, footer.
Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images.
Output ONLY raw HTML — no markdown, no code fences, no explanation.`;

            // Try models in order: current model (without prefill), then Sonnet as fallback
            const retryModels = [activeModel, "claude-sonnet-4-6"];
            // Deduplicate if model is already Sonnet
            const uniqueRetryModels = [...new Set(retryModels)];

            let retrySucceeded = false;
            for (const retryModel of uniqueRetryModels) {
              if (retrySucceeded) break;
              const isFallback = retryModel !== activeModel;
              if (isFallback) {
                console.log(`[Stream] Falling back to ${retryModel}...`);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Trying alternate model..." })}\n\n`)
                );
              }

              try {
                const retryResponse = await client.messages.create({
                  model: retryModel,
                  max_tokens: maxTokens,
                  system: RETRY_SYSTEM,
                  messages: [{ role: "user", content: userMessage }],
                });

                const retryBlock = retryResponse.content.find((b) => b.type === "text");
                console.log(`[Stream] Retry (${retryModel}): stop=${retryResponse.stop_reason} text_len=${retryBlock && retryBlock.type === "text" ? retryBlock.text.length : 0} blocks=${retryResponse.content.length}`);
                if (retryBlock && retryBlock.type === "text") {
                  const retryBodyMatch = retryBlock.text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                  const retryBodyText = retryBodyMatch
                    ? retryBodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
                    : "";

                  if (retryBodyText.length >= 100) {
                    console.log(`[Stream] Retry ${retryModel} succeeded (${retryBodyText.length} body chars)`);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "replace", content: retryBlock.text })}\n\n`)
                    );
                    retrySucceeded = true;
                  } else {
                    console.warn(`[Stream] Retry ${retryModel} still empty (${retryBodyText.length} body chars)`);
                  }
                }
              } catch (retryErr) {
                console.error(`[Stream] Retry ${retryModel} error:`, retryErr instanceof Error ? retryErr.message : retryErr);
              }
            }

            if (!retrySucceeded) {
              console.error("[Stream] All model retries produced empty body");
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Generation produced empty content after retries. Please try again." })}\n\n`)
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
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

    if (err instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({ error: `API error: ${err.message}` }),
        { status: err.status || 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
