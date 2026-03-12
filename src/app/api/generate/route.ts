import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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
- 2 Google Fonts. Headings: clamp(2.5rem, 5vw, 4.5rem). Body: 16-18px, line-height 1.7.
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
    } else if (isPremium) {
      systemPrompt = PREMIUM_SYSTEM;
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry — if this is a luxury, executive, or professional brand, use elegant typography, aspirational imagery, warm whites, and sophisticated restraint. If this is a tech/startup brand, use modern clean design with tasteful accents. Always include: hero with clear value proposition, social proof, services/features, testimonials, stats, CTA, and comprehensive footer. The design must feel premium, polished, and trustworthy.`;
      model = "claude-opus-4-6";
      maxTokens = 64000;
    } else {
      // Standard tier also uses Opus — output quality must impress to convert users
      systemPrompt = STANDARD_SYSTEM;
      userMessage = `Build me a stunning, high-end website for: ${prompt}\n\nThis must look like it was designed by a top-tier agency. Match the aesthetic to the industry. Include: hero with clear value proposition, social proof bar, services/features with SVG icons, about section with image, testimonials with specific results, animated stats, FAQ accordion, CTA section, and comprehensive footer. Every section must have premium spacing, refined shadows, and smooth hover animations. The design must make someone say "I need to hire these people."`;
      model = "claude-opus-4-6";
      maxTokens = 64000;
    }

    // Assistant prefill: force the model to start writing HTML structure immediately.
    // This prevents the model from spending all tokens on CSS with an empty body.
    const PREFILL_NEW = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userMessage },
    ];

    // Only prefill for new builds (not edits)
    const prefill = !isEdit ? PREFILL_NEW : "";
    if (prefill) {
      messages.push({ role: "assistant", content: prefill });
    }

    // Helper: extract body text length
    function getBodyTextLength(rawHtml: string): number {
      const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (!bodyMatch) return 0;
      return bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim().length;
    }

    // Helper: try generating with a specific model
    async function tryGenerate(tryModel: string, trySystem: string, tryMessages: { role: "user" | "assistant"; content: string }[], tryPrefill: string): Promise<{ html: string; bodyChars: number } | null> {
      try {
        const res = await client.messages.create({
          model: tryModel,
          max_tokens: maxTokens,
          system: trySystem,
          messages: tryMessages,
        });
        const textBlock = res.content.find((b) => b.type === "text");
        const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
        console.log(`[Generate] model=${tryModel} stop=${res.stop_reason} text_len=${text.length} blocks=${res.content.length}`);
        let result = (tryPrefill + text).trim();
        if (result.startsWith("```")) {
          result = result.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
        }
        const bodyChars = getBodyTextLength(result);
        return { html: result, bodyChars };
      } catch (err) {
        console.error(`[Generate] ${tryModel} error: ${err instanceof Error ? err.message : err}`);
        return null;
      }
    }

    // First attempt: primary model with prefill
    let result = await tryGenerate(model, systemPrompt, messages, prefill);
    let html = result?.html || "";

    // If body is empty, retry with model fallback chain
    if (!isEdit && (!result || result.bodyChars < 100)) {
      console.warn(`[Generate] Empty body (${result?.bodyChars || 0} chars). Starting fallback chain...`);

      const BODY_FIRST_SYSTEM = `You are Zoobicon, an elite AI website generator. Output a single, complete HTML file.

## ABSOLUTE RULE: WRITE THE <body> CONTENT FIRST
1. <!DOCTYPE html>, <html>, <head> with meta viewport + title + Google Fonts link
2. <style> — MAXIMUM 80 lines. Bare minimum.
3. <body> — 80% of output. ALL sections with real content.
4. <script> before </body>

The <body> MUST contain: navigation, hero, features, about, testimonials, stats, FAQ, CTA, footer.
Output ONLY raw HTML.`;

      // Fallback chain: same model without prefill → Sonnet with prefill → Sonnet without prefill
      const fallbackAttempts = [
        { model: model, system: BODY_FIRST_SYSTEM, usePrefill: false, label: `${model} (no prefill)` },
        { model: "claude-sonnet-4-6", system: systemPrompt, usePrefill: true, label: "sonnet (with prefill)" },
        { model: "claude-sonnet-4-6", system: BODY_FIRST_SYSTEM, usePrefill: false, label: "sonnet (no prefill)" },
      ];

      for (const attempt of fallbackAttempts) {
        // Skip if model is same as primary and we already tried (deduplicate Sonnet if primary is already Sonnet)
        const attemptMessages: { role: "user" | "assistant"; content: string }[] = [
          { role: "user", content: userMessage },
        ];
        const attemptPrefill = attempt.usePrefill ? prefill : "";
        if (attemptPrefill) {
          attemptMessages.push({ role: "assistant", content: attemptPrefill });
        }

        console.log(`[Generate] Trying fallback: ${attempt.label}...`);
        const retryResult = await tryGenerate(attempt.model, attempt.system, attemptMessages, attemptPrefill);

        if (retryResult && retryResult.bodyChars >= 100) {
          console.log(`[Generate] Fallback ${attempt.label} succeeded (${retryResult.bodyChars} body chars)`);
          html = retryResult.html;
          break;
        } else {
          console.warn(`[Generate] Fallback ${attempt.label} empty (${retryResult?.bodyChars || 0} body chars)`);
        }
      }
    }

    return NextResponse.json({ html });
  } catch (err) {
    console.error("Generation error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
