import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";
import { sql } from "@/lib/db";
import { checkGenerationLimit, getCurrentPeriod, getAgencyPlanLimits } from "@/lib/agency-limits";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";
import { injectComponentLibrary } from "@/lib/component-library";
import { getImagePromptBlock, replacePicsumUrls } from "@/lib/stock-images";

const STANDARD_SYSTEM = `You are Zoobicon, an elite AI website generator producing $20K+ agency-quality sites. Output a single, complete HTML file.

## VISUAL IMPACT — NON-NEGOTIABLE
Every site MUST look visually striking, content-rich, and professionally finished. A premium component library (buttons, cards, grids, inputs, badges, animations) is AUTO-INJECTED after your output — you do NOT need to define .btn-primary, .card, .grid-3, .section, .badge, .testimonial-card, .stat-item, .faq-item, .fade-in etc. Just USE those classes.

COLOR RULES:
- ALWAYS define :root custom properties for theming. The component library reads these:
  --color-primary, --color-primary-dark, --color-bg, --color-bg-alt, --color-surface, --color-text, --color-text-muted, --color-border, --color-accent, --font-heading, --font-body, --btn-radius, --card-radius
- --color-primary MUST be a strong, saturated color appropriate to the industry
- Background should create CONTRAST — dark bg (#0f172a, #1a1a2e) with light text, OR tinted light bg (#fdf8f4, #f0fdf4, #fef3c7) — NOT plain white
- Every section must visually differ from adjacent ones (alternate bg colors, accent borders)

IMAGES — PRIORITY ORDER FOR EACH SECTION:
The user message may include an "IMAGE GUIDANCE" or "CURATED IMAGES" section with real stock photo URLs. If it does, USE THOSE EXACT URLs — they are high-quality, industry-relevant photos.

If NO curated image URLs are provided, use these fallbacks:
- Hero: For TECH/SAAS/CYBER: use .hero-aurora or .hero-mesh CSS class (component library) for an animated gradient background. For other industries: use a CSS gradient with brand colors.
- Features: Use inline SVG icons (24-48px) per card — draw simple icons with <svg viewBox="0 0 24 24" stroke="currentColor">. Examples: shield, chart, lock, users, zap, globe.
- About section: CSS gradient background with a large centered SVG icon.
- Testimonials: Use https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg (N=1-99, unique per person). Real face photos, border-radius:50%, 60x60px.
- Gallery/portfolio: Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT. ONLY picsum-acceptable section.
- NEVER use picsum.photos for hero, feature cards, or testimonial avatars.
- All images use: object-fit:cover; border-radius:var(--card-radius)

## OUTPUT ORDER — FOLLOW EXACTLY (CRITICAL: BODY IS 90% OF OUTPUT)
1. <head>: title, meta viewport, Google Fonts link (2 fonts: display + body)
2. <style>: MAXIMUM 20 LINES. Only :root custom properties + a few layout rules. The component library provides ALL component styles (buttons, cards, grids, badges, animations, hero effects). Writing more than 20 lines of CSS is a FAILURE — you are wasting tokens that should go to body content. CLOSE THE </style> TAG QUICKLY.
3. <body>: THIS IS 90% OF YOUR OUTPUT. Write every section with full real content, real images, rich copy. If you spend more tokens on <style> than on <body>, the output is BROKEN.
4. <script>: mobile menu toggle, FAQ accordion, counter animation (under 30 lines)

## BODY SECTIONS — WRITE ALL 11 OF THESE
1. <nav> — sticky, backdrop-filter:blur, logo left + links + .btn-primary.btn-sm CTA right. Background: color-mix(in srgb, var(--color-bg) 85%, transparent)
2. Hero — split layout: text left (badge pill, h1, p, two buttons, trust checkmarks) + visual right side. If CURATED IMAGES provides a hero URL, use it as a large image. Otherwise: DARK themes → .hero-aurora or .hero-mesh with centered SVG icon. LIGHT themes → bold CSS gradient with brand colors (linear-gradient). NOTE: .hero-aurora/.hero-mesh are nearly invisible on light backgrounds — only use them with dark --color-bg. NEVER use picsum for hero. NEVER plain white/empty.
3. Social proof / Logo strip — company names or trust metrics in a horizontal strip
4. Features — section heading + .grid-3 with 6 cards. Each card gets an inline SVG icon (40-48px, viewBox="0 0 24 24", stroke="var(--color-primary)", stroke-width="2", fill="none") + title + description. Use .card class. Do NOT use Pexels or picsum for feature cards.
5. About — two-column: image left (with floating stat overlay), text right with heading + paragraph + 4 checkmark benefits
6. Process/How it works — 3-4 numbered steps with icons and connecting lines/arrows
7. Testimonials — 3x .testimonial-card with star ratings (★★★★★), quote text, avatar image, name, role
8. Stats — dark background section (style="background:#1e293b;color:#fff;padding:80px 24px"). 4x .stat-item. CRITICAL: .stat-number defaults to primary color which is INVISIBLE on dark bg — add style="color:#fff" to every .stat-number. .stat-label gets style="color:rgba(255,255,255,0.7)".
9. FAQ — 4-5 .faq-item accordion questions with answers. Use .faq-question and .faq-answer classes.
10. CTA — Use style="background:var(--color-primary);color:#fff;padding:80px 24px;text-align:center". Headlines: style="color:#fff". Body: style="color:rgba(255,255,255,0.8)". Button: INVERTED (style="background:#fff;color:var(--color-primary)") — do NOT use .btn-primary on a primary-bg section (invisible).
11. Footer — style="background:#111827;color:rgba(255,255,255,0.85);padding:60px 24px". 4 columns: about blurb, services links, contact info, social links. ALL text white/light. Headings: style="color:#fff". Links: style="color:rgba(255,255,255,0.6)".

## CONTRAST RULES — ZERO TOLERANCE FOR INVISIBLE TEXT
- .btn-primary text is white via CSS. NEVER add inline style="color:..." to .btn-primary buttons.
- .btn-primary on a primary-colored background is INVISIBLE. Use inverted button: style="background:#fff;color:var(--color-primary)".
- .stat-number on dark backgrounds: MUST have style="color:#fff" (default is primary color = invisible on dark).
- Dark sections (stats, CTA, footer): ALL text needs explicit style="color:#fff" or style="color:rgba(255,255,255,0.8)". NEVER rely on CSS variable inheritance — it won't apply to dark-bg sections.

## INDUSTRY AESTHETIC
- Real Estate: Navy+gold (#1a365d + #c9a96e), serif headings, full-bleed property photos, .property-grid
- SaaS/Tech: Dark bg (#0f172a), electric accents (#6366f1, #06b6d4), .hero-aurora or .hero-mesh
- Restaurant: Warm palette (#7c2d12, #b45309), serif headings, food imagery with .overlay-text
- Healthcare: Teal (#0d9488), soft green, warm white bg (#f0fdf4)
- Legal/Financial: Deep blue (#1e3a5f), serif headings, clean bg (#fafafa)
- Portfolio/Creative: Bold typography, vivid accent, dark themes, .image-gallery

## USER STYLE PREFERENCES — OBEY ABSOLUTELY
If the user's prompt includes "MANDATORY COLORS" with specific hex values, you MUST use those EXACT hex values for your :root CSS custom properties. Do NOT substitute your own color choices. The user selected these colors from a dropdown — ignoring them is a CRITICAL FAILURE. If no mandatory colors are specified, choose industry-appropriate colors.

## RULES
- Output ONLY raw HTML. No markdown, no code fences, no explanation.
- Start IMMEDIATELY with <!DOCTYPE html>
- Use inline SVG icons for features, randomuser.me for avatars, CSS gradients for hero backgrounds. Only use picsum.photos for gallery/portfolio sections.
- .fade-in on sections for scroll animation. NEVER set opacity:0 yourself.
- An empty or sparse <body> is a TOTAL FAILURE.
- A DULL, WASHED-OUT site is a FAILURE. Bold colors, rich imagery, visual contrast.`;

const PREMIUM_SYSTEM = `You are Zoobicon, an elite AI website generator producing $50K+ agency-quality sites. Output a single, complete HTML file. This is PREMIUM TIER — the output must be jaw-droppingly beautiful.

## VISUAL IMPACT — NON-NEGOTIABLE
A premium component library (buttons, cards, grids, inputs, badges, animations) is AUTO-INJECTED — do NOT define .btn-primary, .card, .grid-3 etc. Just USE those classes. Focus ALL your tokens on content and layout.

COLOR RULES:
- Define :root custom properties: --color-primary, --color-primary-dark, --color-bg, --color-bg-alt, --color-surface, --color-text, --color-text-muted, --color-border, --color-accent, --font-heading, --font-body
- Strong, saturated primary color. High contrast everywhere.
- Alternating section backgrounds (--color-bg / --color-bg-alt / --color-surface)

IMAGES — PRIORITY ORDER:
The user message may include "CURATED IMAGES" with real stock photo URLs. If present, USE THOSE EXACT URLs — they are high-quality, industry-matched photos from Pexels.

If NO curated URLs are provided, use these fallbacks:
- Hero: TECH/SAAS/CYBER → .hero-aurora or .hero-mesh animated gradient. Other → CSS gradient.
- Features: Inline SVG icons (32-48px, stroke="currentColor").
- About: CSS gradient + large SVG icon.
- Testimonials: https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg (N=1-99).
- Portfolio/Gallery: picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (ONLY acceptable here).
- NEVER use picsum for hero, features, or testimonials.

## OUTPUT: 90% BODY CONTENT (CRITICAL — DO NOT WASTE TOKENS ON CSS)
1. <head>: title, meta, 2 Google Fonts
2. <style>: MAXIMUM 20 LINES. :root vars + minimal layout. Component library handles ALL component styles — buttons, cards, grids, badges, animations, hero effects. Close </style> QUICKLY. More than 20 lines of CSS = FAILURE.
3. <body>: 90% of output. Rich, image-heavy, professionally written. If <body> is empty or short, the ENTIRE output is BROKEN.
4. <script>: mobile menu, FAQ, counters (under 30 lines)

## BODY SECTIONS — WRITE ALL 13 (PREMIUM TIER)
1. <nav> — sticky, backdrop-blur, logo + links + .btn-primary.btn-sm CTA
2. Hero — 90-100vh, DRAMATIC visual impact, split layout (text left + visual right). Trust badge pill, punchy headline, subheading, TWO CTAs (.btn-primary.btn-lg + .btn-ghost), trust checkmarks. Right side: if CURATED IMAGES provides a hero URL, use it. Otherwise: TECH/SAAS/CYBER → .hero-aurora or .hero-mesh. Other → CSS gradient. Floating social proof card overlaying the visual.
3. Logo strip / social proof — trusted-by company names or "10,000+ businesses" metrics in subtle strip
4. Features — .grid-3 with 6 cards. Each: inline SVG icon (40-48px, viewBox="0 0 24 24", stroke="var(--color-primary)", stroke-width="2", fill="none") + title + description. Use .card class. Do NOT use Pexels or picsum for feature cards.
   * REAL ESTATE: Use .property-grid > .property-card with property photos from CURATED IMAGES if provided
5. About — two-column: image left (with floating highlight stat), text right with heading + paragraph + 4 checkmark benefits
6. Process — 3-4 numbered steps with icons, connecting lines/arrows
7. Portfolio/Gallery — .image-gallery with 4-6 project images + captions
8. Testimonials — 3x .testimonial-card with ★★★★★, detailed quote, avatar, name, role
9. Stats — dark section (style="background:#1e293b;color:#fff;padding:80px 24px"). 4x .stat-item. CRITICAL: .stat-number MUST have style="color:#fff" (default is primary color = invisible on dark). .stat-label: style="color:rgba(255,255,255,0.7)"
10. Pricing — 3 pricing tiers with highlighted "Popular" middle tier
11. FAQ — 5x .faq-item accordion
12. CTA — style="background:var(--color-primary);color:#fff;padding:100px 24px;text-align:center". Headlines: style="color:#fff". Button: INVERTED style="background:#fff;color:var(--color-primary)" — do NOT use .btn-primary (invisible on primary bg).
13. Footer — style="background:#111827;color:rgba(255,255,255,0.85)". 4 columns. ALL text white/light. Headings: style="color:#fff". Links: style="color:rgba(255,255,255,0.6)".

## BUTTON TEXT — CRITICAL
.btn-primary gets color:#fff from the component library. NEVER override button color with inline styles. If you use custom button styles, always set color:#fff on colored backgrounds.

## INDUSTRY AESTHETIC
- Real Estate: Navy+gold (#1a365d + #c9a96e), serif headings, full-bleed property photos
- SaaS/Tech: Dark bg (#0f172a), electric accents (#6366f1, #06b6d4), gradient hero
- Restaurant: Warm palette (#7c2d12, #b45309), serif headings, food imagery
- Healthcare: Teal (#0d9488), warm white bg (#f0fdf4)
- Legal/Financial: Deep blue (#1e3a5f), serif headings, clean bg
- Portfolio: Bold typography, vivid accent, dark themes, .image-gallery

## USER STYLE PREFERENCES — OBEY ABSOLUTELY
If the user's prompt includes "MANDATORY COLORS" with specific hex values, you MUST use those EXACT hex values for your :root CSS custom properties. Do NOT substitute your own color choices. The user selected these colors from a dropdown — ignoring them is a CRITICAL FAILURE. If no mandatory colors are specified, choose industry-appropriate colors.

## RULES
- Output ONLY raw HTML. Start with <!DOCTYPE html>. No markdown, no code fences.
- Use inline SVG icons for features, randomuser.me for testimonial avatars, CSS gradient backgrounds for tech/cyber heroes. Only use picsum.photos for gallery/portfolio sections. NEVER use picsum for hero, features, or testimonials.
- .fade-in on sections for scroll animation. NEVER set opacity:0.
- An empty or sparse <body> is a TOTAL FAILURE. Content is the product.
- DULL or WASHED-OUT output is a FAILURE. Bold colors, rich imagery, visual depth.`;

const EDIT_SYSTEM = `You are Zoobicon, an AI website editor. You are given an existing HTML website and an edit instruction. Apply the requested changes and return the complete, updated HTML file.

## Rules
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Start your response IMMEDIATELY with <!DOCTYPE html> — no preamble.
- Preserve the existing design language, color palette, and typography unless asked to change them.
- Make the requested changes precisely and thoroughly.
- Maintain all existing responsive behavior and hover states.
- If adding new sections, match the existing visual style perfectly.
- The output must be a complete, valid HTML document — not a diff or partial.
- A component library CSS is automatically injected (marked by a comment). Do NOT reproduce it — just keep any site-specific CSS.
- For image changes: use randomuser.me for avatars, inline SVG icons for feature cards, CSS gradients for hero backgrounds. Only use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for gallery/portfolio images.
- Keep your CSS minimal — the component library provides .btn-primary, .card, .grid-3, .section, etc.`;

export const maxDuration = 300; // Match pipeline-stream timeout for Opus builds

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, existingCode, model: requestedModel, generator, agencyBrand, agencyId, externalContext } = await req.json();

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

    // Auth + usage enforcement (runs early to fail fast before DB queries)
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;

    // Agency generation quota check
    if (agencyId && typeof agencyId === "string") {
      try {
        const [agency] = await sql`SELECT plan FROM agencies WHERE id = ${agencyId}`;
        if (agency) {
          const period = getCurrentPeriod();
          const [countResult] = await sql`
            SELECT COUNT(*)::int as count FROM agency_generations
            WHERE agency_id = ${agencyId} AND period = ${period}
          `;
          const current = countResult?.count || 0;
          const check = checkGenerationLimit(agency.plan, current);
          if (!check.allowed) {
            return new Response(
              JSON.stringify({ error: check.reason, current: check.current, limit: check.limit }),
              { status: 429, headers: { "Content-Type": "application/json" } }
            );
          }
          // Record the generation (fire-and-forget)
          sql`INSERT INTO agency_generations (agency_id, user_email, generator_type, period)
              VALUES (${agencyId}, '', ${generator || "website"}, ${period})`.catch(() => {});
        }
      } catch { /* DB not available, allow generation */ }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable. Please try again later." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey, timeout: 120_000 });

    const isEdit = typeof existingCode === "string" && existingCode.trim().length > 0;
    const isPremium = tier === "premium";

    // Check usage quota
    const usageType = isEdit ? "edit" as const : "generation" as const;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, usageType);
    if (quota.error) return quota.error;

    let systemPrompt: string;
    let userMessage: string;
    let model: string;
    let maxTokens: number;

    if (isEdit) {
      systemPrompt = EDIT_SYSTEM;

      // Strip the injected component library CSS from existingCode before sending to the AI.
      // This saves ~10K tokens of input AND means the AI doesn't have to reproduce it in output.
      // We'll re-inject it after the edit completes.
      let cleanedCode = existingCode;
      const libStartMarker = '/* ══════════════════════════════════════════════════════════';
      const libEndMarker = '/* ── Custom Styles ── */';
      const libStart = cleanedCode.indexOf(libStartMarker);
      const libEnd = cleanedCode.indexOf(libEndMarker);
      if (libStart !== -1 && libEnd !== -1) {
        cleanedCode = cleanedCode.slice(0, libStart) + '/* [component library auto-injected] */\n' + cleanedCode.slice(libEnd + libEndMarker.length);
      }

      userMessage = `Here is the current website HTML:\n\n${cleanedCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections. The comment /* [component library auto-injected] */ marks where a CSS library is automatically injected — do NOT reproduce it, just keep the comment in place.\n\nApply this edit: ${prompt}`;
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

      // Inject agency white-label branding into generated output
      if (agencyBrand && agencyBrand.agencyName) {
        systemPrompt += `\n\n## WHITE-LABEL BRANDING — MANDATORY
This site is being built for a white-label agency. Apply these branding rules:
- The builder/platform brand is "${agencyBrand.agencyName}" — do NOT mention "Zoobicon" anywhere in the output.
- Use "${agencyBrand.agencyName}" as the company/brand name in the footer copyright and any "Powered by" text.
- Primary brand color: ${agencyBrand.primaryColor || "#3b82f6"} — use this for --color-primary in :root.
- Secondary brand color: ${agencyBrand.secondaryColor || "#8b5cf6"} — use this for gradients and accents.
- The site content itself should still be about whatever the user requested — the white-label branding only affects platform attribution.`;
      }
      // Detect industry and inject curated images when available (Pexels API or fallback)
      const imageBlock = await getImagePromptBlock(prompt);

      userMessage = `Build a premium, agency-quality website for: ${prompt}

Requirements:
- Split hero with text left + visual element right. For TECH/SAAS/CYBER: use .hero-aurora or .hero-mesh with a large SVG icon. For other industries: use image from IMAGE GUIDANCE below if provided.
- 6 feature cards each with an inline SVG icon (NOT external image URLs)
- About section with side-by-side layout, floating stat overlay
- 3 testimonials with avatar photos from https://randomuser.me/api/portraits/ and star ratings
- Stats section with 4 bold numbers
- FAQ accordion with 4-5 real questions
- CTA section with colored background and 2 buttons
- Dark footer with 4 columns
- Use industry-appropriate colors and typography. Match the aesthetic to the business type.
- NEVER use picsum.photos for hero, feature cards, or testimonial avatars. Only use picsum for gallery/portfolio sections.
${imageBlock}`;
      // Free tier uses Sonnet (90% cheaper) — paid users get Opus for premium quality
      const isFree = auth.user.plan === "free";
      model = requestedModel || (isFree ? "claude-sonnet-4-6" : "claude-opus-4-6");
      maxTokens = isFree ? 16000 : 32000;
    }

    // Inject MCP external context (GitHub repos, Notion pages, Figma designs) when provided
    if (externalContext && typeof externalContext === "string" && externalContext.trim().length > 0) {
      userMessage += `\n\n## EXTERNAL CONTEXT (from connected tools — GitHub, Notion, Figma, etc.)\nUse this context to inform the design, content, and structure of the site:\n${externalContext.slice(0, 8000)}`;
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userMessage + (!isEdit ? "\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html> — no preamble, no explanation, no code fences. Output raw HTML only. Keep <style> under 30 lines — the component library handles all component styles. Spend 90% of your tokens on <body> content." : "") },
    ];

    // NOTE: Assistant prefill is NO LONGER SUPPORTED in Claude 4.6 (ANY model).
    // Anthropic removed prefill in all 4.6 models — both Opus and Sonnet return 400.
    // Output format is controlled via system prompt instructions instead.

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

          // If the model produced HTML without a <body> tag at all (just <head>/<style>),
          // the response got cut off. Check and flag for retry.
          const hasBodyTag = /<body[\s>]/i.test(accumulated);
          if (!hasBodyTag && !isEdit) {
            console.warn(`[Stream] No <body> tag found in ${accumulated.length} chars of output. Model likely ran out of tokens on CSS.`);
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

          // Validate body FIRST — if empty, retry before injecting component library
          // This prevents sending a broken empty-but-styled page to the client
          if (isEdit && (bodyText.length < 50 || !hasBodyTag)) {
            // Edit response lost the body — the AI spent all tokens on CSS/head and truncated
            // Instead of replacing with broken HTML, send error so client preserves original code
            console.error(`[Stream] Edit produced empty body (${bodyText.length} chars, ${accumulated.length} total HTML). Original code preserved.`);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "edit_failed", message: "Edit response was incomplete (no visible content). Your original site has been preserved. Try a simpler edit or try again." })}\n\n`)
            );
          } else if (!isEdit && (bodyText.length < 100 || !hasBodyTag)) {
            // Body is empty/near-empty or missing entirely — retry with body-first prompts using Sonnet
            console.warn(`[Stream] Empty/missing body detected (${bodyText.length} chars, hasBody=${hasBodyTag}). Retrying with body-first prompt...`);
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

Use inline SVG icons for features. Use https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg for testimonial avatars. For hero background, use .hero-aurora or .hero-mesh CSS class (component library provides these). Do NOT use picsum.photos for hero or feature images.
Import 2 Google Fonts. Use CSS custom properties for colors. Match the industry aesthetic.
Output ONLY raw HTML — no markdown, no code fences, no explanation.`,

              `You are Zoobicon. Output a COMPLETE HTML page. Your ONLY job is to produce visible content.

WRITE BARELY ANY CSS — use inline styles if needed. The BODY is everything.

Output: <!DOCTYPE html><html><head><title>Site</title><style>/* minimal */</style></head><body>
THEN write ALL page content: nav, hero, features, about, testimonials, stats, FAQ, CTA, footer.
Use real text, inline SVG icons for features, randomuser.me for avatars. Do NOT use picsum.photos for hero images.
Output ONLY raw HTML.`
            ];

            let retrySucceeded = false;
            // Use Sonnet for retries — if Opus produced empty body, it may be a model access issue
            const retryModel = "claude-sonnet-4-6";
            for (let i = 0; i < retryPrompts.length && !retrySucceeded; i++) {
              try {
                console.log(`[Stream] Retry ${i + 1} using ${retryModel}...`);
                const retryResponse = await client.messages.create({
                  model: retryModel,
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
                    const injectedRetry = injectComponentLibrary(retryBlock.text);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "replace", content: injectedRetry })}\n\n`)
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

          // Inject component library CSS into the final HTML (both new builds and edits)
          // For edits: we stripped the library before sending to the AI, now re-inject it
          // For new builds: the AI was told "component library is auto-injected"
          // Replace any picsum.photos URLs with industry-relevant Unsplash photos
          accumulated = replacePicsumUrls(accumulated, prompt);

          if (!accumulated.includes("ZOOBICON COMPONENT LIBRARY")) {
            accumulated = accumulated.replace(/\/\* \[component library auto-injected\] \*\/\n?/g, '');
            accumulated = injectComponentLibrary(accumulated);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "replace", content: accumulated })}\n\n`)
            );
          }

          // Track successful usage
          trackUsage(auth.user.email, usageType).catch((err) => console.error("[Usage] Failed to track:", err));

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
                // Inject component library into failover output — GPT/Gemini don't know about our classes
                const injectedFailover = injectComponentLibrary(replacePicsumUrls(failoverRes.text, prompt));
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "replace", content: injectedFailover })}\n\n`)
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
