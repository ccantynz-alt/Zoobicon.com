import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

## INDUSTRY AESTHETIC — Via :root colors
- Luxury/Legal/Medical: light bg (#fefefe), serif headings, muted accents. NO dark themes.
- SaaS/Tech: dark bg OK, sans-serif, vibrant accents.
- Restaurant/Food: warm palette, serif headings, food imagery.
- Healthcare: soft palette, clean and calming.

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with descriptive keywords. object-fit: cover.
- .fade-in on sections for scroll animation (component library handles it). NEVER set opacity:0.
- An empty <body> is a TOTAL FAILURE. Body content is the product.
- NO: gradient blobs on professional sites, dark themes for non-tech, generic copy.`;

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
3. Social proof bar — company names/badges in muted strip
4. Features — .grid-3 > .card with SVG icons, benefit titles, descriptions
5. About — split layout, compelling story + image + stats
6. Process/Timeline — numbered steps
7. Testimonials — .testimonial-card (3 cards, specific metrics like "47% increase")
8. Stats — .stat-item with animated counters (specific numbers)
9. FAQ — .faq-item accordion (4-5 objection-handling questions)
10. CTA — compelling heading, button, friction-reducer ("No credit card required")
11. Footer — 4 columns: about, services, contact (phone/email/address), social

## INDUSTRY AESTHETIC — Via :root colors
- Luxury/Legal/Medical: light bg (#fefefe), serif headings, muted accents. NO dark themes.
- SaaS/Tech: dark bg OK, sans-serif, vibrant accents.
- Restaurant/Food: warm palette, serif headings, food imagery.
- Healthcare: soft palette, clean and calming.

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with descriptive keywords. object-fit: cover.
- .fade-in on sections for scroll animation (component library handles it). NEVER set opacity:0.
- An empty <body> is a TOTAL FAILURE. Body content is the product.
- NO: gradient blobs on professional sites, dark themes for non-tech, generic copy.`;

const EDIT_SYSTEM = `You are Zoobicon, an AI website editor. You are given an existing HTML website and an edit instruction. Apply the requested changes and return the complete, updated HTML file.

## Rules
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Preserve the existing design language, color palette, and typography unless asked to change them.
- Make the requested changes precisely and thoroughly.
- Maintain all existing responsive behavior and hover states.
- If adding new sections, match the existing visual style perfectly.
- The output must be a complete, valid HTML document — not a diff or partial.`;

export const maxDuration = 120; // Allow up to 2 minutes for Opus generation

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, existingCode } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey, timeout: 240_000 });

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
    } else if (isPremium) {
      systemPrompt = PREMIUM_SYSTEM;
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry — if this is a luxury, executive, or professional brand, use elegant typography, aspirational imagery, warm whites, and sophisticated restraint. If this is a tech/startup brand, use modern clean design with tasteful accents. Always include: hero with clear value proposition, social proof, services/features, testimonials, stats, CTA, and comprehensive footer. The design must feel premium, polished, and trustworthy.`;
      model = "claude-opus-4-6";
      maxTokens = 64000;
    } else {
      // Standard tier also uses Opus — output quality must impress to convert users
      systemPrompt = STANDARD_SYSTEM;
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry — if this is a luxury, executive, or professional brand, use elegant typography, aspirational imagery, warm whites, and sophisticated restraint. If this is a tech/startup brand, use modern clean design with tasteful accents. Always include: hero with clear value proposition, social proof, services/features, testimonials, stats, CTA, and comprehensive footer. The design must feel premium, polished, and trustworthy.`;
      model = "claude-opus-4-6";
      maxTokens = 64000;
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userMessage + (!isEdit ? "\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html> — no preamble, no explanation, no code fences. Output raw HTML only." : "") },
    ];

    // Use streaming to avoid SDK "operation may take longer than 10 minutes" error with large max_tokens
    const streamCall = async (m: string): Promise<Anthropic.Message> => {
      const stream = client.messages.stream({
        model: m,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      });
      return await stream.finalMessage();
    };

    let message;
    try {
      message = await streamCall(model);
    } catch (err) {
      // If Opus fails, try Sonnet as fallback
      if (model === "claude-opus-4-6") {
        console.warn(`[Generate] Opus failed (${err instanceof Error ? err.message : "unknown"}), falling back to Sonnet`);
        message = await streamCall("claude-sonnet-4-6");
      } else {
        throw err;
      }
    }

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let html = textBlock.text.trim();

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    // Validate body content — retry up to 2 times if empty
    if (!isEdit) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyText = bodyMatch
        ? bodyMatch[1]
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim()
        : "";

      if (bodyText.length < 100) {
        console.warn(`[Generate] Empty body detected (${bodyText.length} chars, stop: ${message.stop_reason}). Retrying with body-first prompt...`);

        const BODY_FIRST_SYSTEM = `You are Zoobicon, an elite AI website generator. Output a single, complete HTML file.

## ABSOLUTE RULE: WRITE THE <body> CONTENT FIRST
Your #1 job is to fill the <body> with rich, visible content. Structure your output EXACTLY like this:

1. <!DOCTYPE html>, <html>, <head> with meta viewport + title + Google Fonts link
2. <style> — MAXIMUM 80 lines of CSS. Bare minimum styling only. Use CSS custom properties. NO animations, NO media queries, NO elaborate selectors — just basic layout and colors.
3. <body> — THIS IS THE MAIN OUTPUT. Must contain ALL sections with real text, real images, real content. This should be 80% of your output.
4. <script> before </body> for interactivity

The <body> MUST contain: navigation, hero section, features/services, about section, testimonials, stats, FAQ, call-to-action, footer. Every section must have real, specific, benefit-focused copy.

CRITICAL: Your previous attempt produced a page with CSS but ZERO visible content in the body. This time, write MINIMAL CSS and focus ALL your output on the <body> content.

Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images (specific keywords).
Import 2 Google Fonts. Use CSS custom properties for colors. Match the industry aesthetic.
Output ONLY raw HTML — no markdown, no code fences, no explanation.`;

        for (let retry = 0; retry < 2; retry++) {
          try {
            const retryStream = client.messages.stream({
              model,
              max_tokens: maxTokens,
              system: BODY_FIRST_SYSTEM,
              messages: [{ role: "user", content: userMessage }],
            });
            const retryMessage = await retryStream.finalMessage();

            const retryBlock = retryMessage.content.find((b) => b.type === "text");
            if (retryBlock && retryBlock.type === "text") {
              let retryHtml = retryBlock.text.trim();
              if (retryHtml.startsWith("```")) {
                retryHtml = retryHtml.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
              }

              // Validate the retry actually has body content
              const retryBodyMatch = retryHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
              const retryBodyText = retryBodyMatch
                ? retryBodyMatch[1]
                    .replace(/<script[\s\S]*?<\/script>/gi, "")
                    .replace(/<style[\s\S]*?<\/style>/gi, "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
                : "";

              if (retryBodyText.length >= 100) {
                console.log(`[Generate] Retry ${retry + 1} succeeded (${retryBodyText.length} body chars)`);
                html = retryHtml;
                break;
              } else {
                console.warn(`[Generate] Retry ${retry + 1} still empty (${retryBodyText.length} body chars)`);
              }
            }
          } catch (retryErr) {
            console.error(`[Generate] Retry ${retry + 1} failed:`, retryErr);
          }
        }
      }
    }

    return NextResponse.json({ html });
  } catch (err) {
    console.error("Generation error:", err);

    // Always extract a meaningful error message — never return generic "Internal server error"
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
      // Detect timeout errors
      if (err.message.includes("timed out") || err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
        errorMsg = `AI model timed out: ${err.message}. The model may be overloaded — try again in a minute.`;
        statusCode = 504;
      }
    } else if (typeof err === "string") {
      errorMsg = err;
    } else {
      errorMsg = `Generation error: ${JSON.stringify(err)}`;
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: statusCode }
    );
  }
}
