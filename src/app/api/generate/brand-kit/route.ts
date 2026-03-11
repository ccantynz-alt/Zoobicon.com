import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const BRAND_KIT_SYSTEM = `You are Zoobicon's Brand Kit Generator. You create comprehensive design systems and brand identity kits as a complete, interactive HTML style guide page.

## Output Format
- Output ONLY valid JSON matching this structure:
{
  "brandKit": {
    "name": "Brand Name",
    "tagline": "Brand tagline",
    "colors": {
      "primary": "#hex",
      "primaryLight": "#hex",
      "primaryDark": "#hex",
      "secondary": "#hex",
      "secondaryLight": "#hex",
      "secondaryDark": "#hex",
      "accent": "#hex",
      "success": "#hex",
      "warning": "#hex",
      "error": "#hex",
      "info": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "surfaceHover": "#hex",
      "border": "#hex",
      "text": "#hex",
      "textMuted": "#hex",
      "textLight": "#hex"
    },
    "typography": {
      "headingFont": "Font Name",
      "bodyFont": "Font Name",
      "monoFont": "Font Name",
      "scale": {
        "h1": "clamp(2.5rem, 5vw, 4rem)",
        "h2": "clamp(2rem, 4vw, 3rem)",
        "h3": "clamp(1.5rem, 3vw, 2rem)",
        "h4": "clamp(1.25rem, 2vw, 1.5rem)",
        "h5": "1.125rem",
        "h6": "1rem",
        "body": "1rem",
        "small": "0.875rem",
        "xs": "0.75rem"
      },
      "lineHeight": { "tight": "1.2", "normal": "1.6", "relaxed": "1.8" },
      "letterSpacing": { "tight": "-0.02em", "normal": "0", "wide": "0.05em" }
    },
    "spacing": {
      "xs": "4px",
      "sm": "8px",
      "md": "16px",
      "lg": "24px",
      "xl": "32px",
      "2xl": "48px",
      "3xl": "64px",
      "4xl": "96px",
      "section": "120px"
    },
    "borderRadius": {
      "sm": "4px",
      "md": "8px",
      "lg": "12px",
      "xl": "16px",
      "2xl": "24px",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      "lg": "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
      "xl": "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
    },
    "components": {
      "buttonPrimary": "CSS properties string",
      "buttonSecondary": "CSS properties string",
      "buttonGhost": "CSS properties string",
      "card": "CSS properties string",
      "input": "CSS properties string",
      "badge": "CSS properties string",
      "navLink": "CSS properties string"
    },
    "voice": {
      "tone": "Description of brand voice tone",
      "personality": ["trait1", "trait2", "trait3"],
      "doSay": ["example1", "example2"],
      "dontSay": ["example1", "example2"]
    }
  },
  "styleGuideHtml": "Complete HTML style guide page showing all brand elements"
}

## Brand Kit Quality Standards

### Colors
- Primary color must match the industry and brand personality.
- Generate a mathematically harmonious palette (complementary, analogous, or triadic).
- Never use pure #000000 or #FFFFFF — use near-equivalents.
- Ensure WCAG AA contrast ratios between text and background colors (min 4.5:1).
- Include hover/active variants for interactive colors.
- Light and dark shades of primary and secondary for flexibility.

### Typography
- Choose fonts that match the brand personality:
  - Luxury/Legal/Finance: Serif headings (Playfair Display, Cormorant, DM Serif Display).
  - Tech/Startup/Modern: Sans headings (Inter, Space Grotesk, Plus Jakarta Sans).
  - Creative/Agency: Bold/Display fonts (Sora, Outfit, Clash Display via regular Google Fonts).
  - Healthcare/Wellness: Friendly sans (Nunito, Poppins, DM Sans).
- Body font must always be highly legible sans-serif.
- Include a monospace font for code/data.
- Responsive type scale using clamp().

### Style Guide HTML Page
The styleGuideHtml must be a complete, beautiful, interactive HTML page that showcases:
1. **Brand Overview**: Name, tagline, brand personality description.
2. **Color Palette**: Large color swatches with hex values, named colors, contrast ratios displayed.
3. **Typography Showcase**: All heading levels, body text, links, quotes, lists.
4. **Spacing Scale**: Visual boxes showing each spacing value.
5. **Component Library**: Buttons (all variants), cards, form inputs, badges, navigation.
6. **Icon Style**: Show what icon style is recommended (outlined, filled, etc.).
7. **Do's and Don'ts**: Visual examples of correct vs incorrect brand usage.
8. **Voice & Tone**: Writing examples that match the brand.

This page must be beautifully designed using the brand's own design system — it should be a showcase of the brand itself.`;

export async function POST(req: NextRequest) {
  try {
    const { brandName, industry, personality, targetAudience } =
      await req.json();

    if (!brandName || typeof brandName !== "string") {
      return NextResponse.json(
        { error: "brandName is required" },
        { status: 400 }
      );
    }

    if (!industry || typeof industry !== "string") {
      return NextResponse.json(
        { error: "industry is required" },
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

    const personalityText = personality
      ? `Brand personality: ${personality}`
      : "Infer the brand personality from the industry and name.";

    const audienceText = targetAudience
      ? `Target audience: ${targetAudience}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: BRAND_KIT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a complete brand kit and design system for:\n\nBrand: "${brandName}"\nIndustry: ${industry}\n${personalityText}\n${audienceText}\n\nGenerate a cohesive, professional design system with colors, typography, spacing, components, and brand voice. Include an interactive style guide HTML page that showcases all elements beautifully. The design system should be ready to feed into website/app generation for consistent output.`,
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

    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch {
      // If JSON parsing fails, return the raw text as a style guide HTML
      return NextResponse.json({
        brandKit: {
          name: brandName,
          industry,
          note: "Brand kit returned as HTML style guide due to JSON parsing. The HTML contains all brand specifications.",
        },
        styleGuideHtml: responseText,
      });
    }
  } catch (err) {
    console.error("Brand kit generation error:", err);

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
