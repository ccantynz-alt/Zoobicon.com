import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";
import { injectComponentLibrary } from "@/lib/component-library";

const STANDARD_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## VISUAL IMPACT — NON-NEGOTIABLE
Every site MUST be visually striking. NEVER produce dull, washed-out, or sparse sites.

COLOR RULES:
- ALWAYS set vibrant :root custom properties. Component library defaults are neutral — YOU MUST override them.
- --color-primary MUST be a strong, saturated color appropriate to the industry
- Background should NOT be plain white (#ffffff) — use tinted whites (#fdf8f4, #fafafa) or dark (#0f172a)
- Every section must be visually distinct from neighbors (alternate bg colors, accent borders)

## OUTPUT ORDER — FOLLOW EXACTLY
1. <head>: title, meta, Google Fonts link
2. <style>: :root custom properties (VIBRANT colors, fonts) + max 40 lines site-specific CSS. A component library is auto-injected with .btn-primary, .btn-secondary, .card, .grid-3, .section, .section-alt, .testimonial-card, .stat-item, .faq-item, .badge, .input — USE those classes.
3. <body>: THIS IS 80% OF YOUR OUTPUT. Write every section with full real content.
4. <script>: mobile menu, FAQ accordion, counter animation (under 40 lines)

## CSS LIMIT: 40 LINES MAX
The component library handles buttons, cards, grids, inputs, badges, sections, shadows, transitions. You only write :root variables and site-specific overrides.

## BODY SECTIONS — WRITE ALL OF THESE
1. <nav> — sticky with colored/dark background, logo + links + CTA button
2. Hero — 90-100vh, DRAMATIC visual impact (full-bleed image, gradient, or .hero-aurora/.hero-mesh), punchy headline, TWO CTAs, social proof
3. Social proof bar — company names/badges in subtle strip
4. Features — .grid-3 > .card with SVG icons, benefit titles, descriptions. Cards need visual accents.
5. About — split layout, compelling story + image + stats
6. Process/Timeline — numbered steps with colored accents
7. Testimonials — .testimonial-card (3 cards, specific metrics)
8. Stats — .stat-item with bold colored numbers
9. FAQ — .faq-item accordion (4-5 questions)
10. CTA — bold colored/gradient background, compelling heading, button
11. Footer — DARK background, 4 columns: about, services, contact, social

## INDUSTRY AESTHETIC — Via :root colors + visual treatment
- Real Estate: Navy (#1a365d) + gold (#c9a96e), serif headings. .hero-image/.hero-carousel. Full-bleed imagery.
- SaaS/Tech: Dark bg (#0f172a), electric accents (#6366f1, #06b6d4). .hero-aurora or .hero-mesh.
- Restaurant/Food: Rich warm palette (#7c2d12, #b45309), full-bleed .hero-image with .overlay-text.
- Healthcare: Teal (#0d9488), sage (#059669) on soft mint (#f0fdf4).
- Legal/Finance: Deep navy (#1e3a5f) or forest (#0f766e). Professional but NOT dull.
- Portfolio: Dark bg (#1a1a2e) with vivid accent. Bold typography.

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT. Use at LEAST 5 images. object-fit: cover.
- .fade-in on sections for scroll animation. NEVER set opacity:0.
- An empty <body> is a TOTAL FAILURE. A DULL site is also a FAILURE.
- NO: generic copy, text-only cards, plain white backgrounds.`;

const PREMIUM_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## VISUAL IMPACT — NON-NEGOTIABLE
Every site MUST be visually striking. NEVER produce dull, washed-out, or sparse sites. Bold colors, rich imagery, visual contrast are mandatory.

## OUTPUT ORDER — FOLLOW EXACTLY
1. <head>: title, meta, Google Fonts link
2. <style>: :root custom properties (VIBRANT colors) + max 40 lines site-specific CSS. Component library auto-injected.
3. <body>: THIS IS 80% OF YOUR OUTPUT. Write every section with full real content.
4. <script>: mobile menu, FAQ accordion, counter animation (under 40 lines)

## CSS LIMIT: 40 LINES MAX

## BODY SECTIONS — WRITE ALL OF THESE (PREMIUM TIER)
1. <nav> — sticky with colored/dark background, logo + links + CTA
2. Hero — 90-100vh, DRAMATIC (full-bleed image, gradient, .hero-aurora/.hero-mesh), headline, TWO CTAs, social proof
3. Social proof bar
4. Features — .grid-3 > .card with SVG icons, visual accents
5. About — split layout + image + stats
6. Process/Timeline — colored step numbers
7. Testimonials — .testimonial-card (3 cards, specific metrics)
8. Stats — .stat-item with bold colored numbers
9. FAQ — .faq-item accordion
10. CTA — bold colored/gradient background
11. Footer — DARK background, 4 columns

## INDUSTRY AESTHETIC
- Real Estate: Navy+gold, serif, .hero-image/.hero-carousel, .property-card+.property-grid
- SaaS/Tech: Dark bg (#0f172a), electric accents, .hero-aurora/.hero-mesh
- Restaurant: Warm (#7c2d12, #b45309), .hero-image with .overlay-text
- Healthcare: Teal/sage on mint (#f0fdf4)
- Portfolio: Dark bg, vivid accent, .image-gallery

## RULES
- Output ONLY raw HTML. No markdown, no code fences.
- Use at LEAST 5 picsum.photos images. NEVER plain white backgrounds.
- A DULL site is a FAILURE. Bold colors, rich imagery, visual contrast.`;

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
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;

    const { prompt, tier, existingCode, generator, agencyBrand } = await req.json();

    const isEdit = typeof existingCode === "string" && existingCode.trim().length > 0;
    const usageType = isEdit ? "edit" as const : "generation" as const;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, usageType);
    if (quota.error) return quota.error;

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
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Free tier uses Sonnet to control costs — Opus only for paid plans
    const isFree = auth.user.plan === "free";
    const client = new Anthropic({ apiKey, timeout: 240_000 });

    const isPremium = tier === "premium";

    let systemPrompt: string;
    let userMessage: string;
    let model: string;
    let maxTokens: number;

    if (isEdit) {
      systemPrompt = EDIT_SYSTEM;
      userMessage = `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections.\n\nApply this edit: ${prompt}`;
      model = "claude-sonnet-4-6";
      maxTokens = 32000;
    } else if (isPremium) {
      systemPrompt = PREMIUM_SYSTEM;
      userMessage = `Build me a stunning, visually striking website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency with BOLD visual impact. Use vibrant, saturated colors — NOT dull or washed-out. The hero section must be dramatic (full-bleed image, dark gradient, or animated background — NEVER a plain white hero). Every section needs rich content with images, icons, and visual accents. Match the industry aesthetic but always prioritize visual impact and content density. Include: hero with dramatic visual treatment + value proposition, social proof, services/features with image-rich cards, testimonials, stats with bold numbers, CTA with colored background, and comprehensive dark footer.`;
      model = "claude-opus-4-6";
      maxTokens = 32000;
    } else {
      systemPrompt = STANDARD_SYSTEM;
      userMessage = `Build me a stunning, visually striking website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency with BOLD visual impact. Use vibrant, saturated colors — NOT dull or washed-out. The hero section must be dramatic (full-bleed image, dark gradient, or animated background — NEVER a plain white hero). Every section needs rich content with images, icons, and visual accents. Match the industry aesthetic but always prioritize visual impact and content density. Include: hero with dramatic visual treatment + value proposition, social proof, services/features with image-rich cards, testimonials, stats with bold numbers, CTA with colored background, and comprehensive dark footer.`;
      // Use Sonnet for ALL users during testing — switch back to Opus when API stable
      model = "claude-sonnet-4-6";
      maxTokens = isFree ? 16000 : 32000;
    }

    // Append generator-specific instructions when building from a generator page
    if (!isEdit && generator && typeof generator === "string") {
      const supplement = getGeneratorSystemSupplement(generator);
      if (supplement) {
        systemPrompt += "\n\n" + supplement;
      }
    }

    // Inject agency white-label branding
    if (!isEdit && agencyBrand?.agencyName) {
      systemPrompt += `\n\n## WHITE-LABEL BRANDING — MANDATORY\nThis site is built for white-label agency "${agencyBrand.agencyName}". Do NOT mention "Zoobicon" anywhere. Use "${agencyBrand.agencyName}" in footer copyright. Primary color: ${agencyBrand.primaryColor || "#3b82f6"}. Secondary: ${agencyBrand.secondaryColor || "#8b5cf6"}.`;
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

    // Inject component library CSS into new builds (edits re-inject via stream route)
    if (!isEdit && !html.includes("ZOOBICON COMPONENT LIBRARY")) {
      html = injectComponentLibrary(html);
    }

    // Track usage for authenticated users
    trackUsage(auth.user.email, usageType).catch(() => {});

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
