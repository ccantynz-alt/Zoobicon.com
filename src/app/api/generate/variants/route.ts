import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

const VARIANTS_SYSTEM = `You are Zoobicon, an AI website variant generator. When given a description, you produce multiple DISTINCT design variants of the same website. Each variant must be a complete, standalone HTML file with dramatically different visual approaches.

## Output Format
Return a JSON object:
{
  "variants": [
    {
      "id": "variant-1",
      "name": "Short name for this variant",
      "description": "One sentence describing the design approach",
      "style": "Style label, e.g. Modern Minimal, Bold & Vibrant, Corporate Clean, Dark Luxe",
      "html": "Complete HTML document as a string"
    }
  ]
}

Output ONLY valid JSON. No markdown, no explanation, no code fences.

## Variant Differentiation Rules
Each variant MUST differ significantly in these areas:

**Color Scheme:**
- Variant 1: Light, airy palette (soft whites, pastels, muted accent)
- Variant 2: Bold, vibrant palette (saturated colors, high contrast, energetic)
- Variant 3: Dark/moody palette (dark backgrounds, light text, neon or metallic accents)
- Variant 4 (if requested): Earthy/organic palette (warm neutrals, natural tones, green/brown accents)

**Layout Approach:**
- Variant 1: Classic hero with image on the right, content on the left. Traditional grid sections below.
- Variant 2: Centered hero with large background image/gradient, content centered. Alternating left-right sections.
- Variant 3: Split-screen hero (50/50). Asymmetric layouts, overlapping elements, editorial feel.
- Variant 4 (if requested): Full-width immersive hero with parallax feel. Card-based sections with masonry-like layout.

**Typography Pairing:**
- Variant 1: Inter + DM Sans — clean, modern, geometric
- Variant 2: Playfair Display + Source Sans 3 — elegant serif + readable sans
- Variant 3: Space Grotesk + Inter — techy, distinctive, modern
- Variant 4 (if requested): Sora + Inter — friendly, rounded, approachable

## Shared Across All Variants
- The same copy/content (headings, paragraphs, feature descriptions, testimonials, CTAs)
- The same sections: hero, features/services, about/how-it-works, testimonials, CTA, footer
- The same business information and tone
- Write realistic, compelling copy — never use Lorem ipsum

## HTML Quality Rules (Apply to EVERY variant)
- Complete document: <!DOCTYPE html>, <html lang="en">, <head> with meta viewport, and <body>.
- All CSS in a <style> tag in <head>. No external stylesheets except Google Fonts.
- All JS in a <script> tag before </body>.
- Fully responsive with mobile hamburger menu.
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for placeholder images (use a unique descriptive keyword per image for deterministic results).
- Add hover states, transitions, and scroll animations.
- Use CSS custom properties (--variables) for the color palette for easy theming.
- Each variant should feel like it was designed by a different designer with a different aesthetic philosophy.

## Design Quality
Each variant must look premium and professionally designed:
- Generous whitespace and clear visual hierarchy
- Multi-layered box shadows for depth
- Smooth transitions on interactive elements (0.3s cubic-bezier)
- Cards with border-radius 12-20px
- Proper button styling with hover effects
- Sticky navbar with backdrop-filter blur
- Clear typographic hierarchy with proper font weights`;

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const { prompt, count } = await req.json();

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

    const variantCount = typeof count === "number" ? Math.min(4, Math.max(2, count)) : 3;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const userMessage = `Generate exactly ${variantCount} distinct design variants for this website:\n\n${prompt}\n\nEach variant must have a completely different color scheme, layout approach, and typography pairing. All variants must share the same content/copy. Return the result as a JSON object with a "variants" array containing ${variantCount} variant objects, each with "id", "name", "description", "style", and "html" fields.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: VARIANTS_SYSTEM,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let raw = textBlock.text.trim();

    // Strip markdown code fences if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let result: {
      variants: Array<{
        id: string;
        name: string;
        description: string;
        style: string;
        html: string;
      }>;
    };

    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse generated variants" },
        { status: 500 }
      );
    }

    if (
      !result.variants ||
      !Array.isArray(result.variants) ||
      result.variants.length === 0
    ) {
      return NextResponse.json(
        { error: "No variants were generated" },
        { status: 500 }
      );
    }

    // Validate each variant has required fields
    for (const variant of result.variants) {
      if (
        !variant.id ||
        !variant.name ||
        !variant.description ||
        !variant.style ||
        !variant.html
      ) {
        return NextResponse.json(
          { error: "Incomplete variant generated — missing required fields" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ variants: result.variants });
  } catch (err) {
    console.error("Variant generation error:", err);

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
