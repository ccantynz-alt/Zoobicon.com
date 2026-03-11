import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const STYLE_GUIDE_SYSTEM = `You are Zoobicon's Style Guide Generator. You take an existing HTML website and generate a comprehensive living style guide page that documents every design element used in the site.

## Your Task
- Analyze the existing HTML to extract: colors, fonts, spacing, components, and patterns.
- Generate a complete, beautiful style guide HTML page documenting everything.
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.

## Style Guide Sections

### 1. Overview
- Site name and brief description.
- Design philosophy summary.
- Quick reference for key values (primary color, heading font, base spacing).

### 2. Color Palette
- Extract every unique color from the CSS.
- Display as large swatches with: hex value, RGB, CSS variable name (if used).
- Group by: primary, secondary, accent, neutrals, semantic (success/warning/error).
- Show contrast ratios against white and dark backgrounds.

### 3. Typography
- Extract all fonts used.
- Show each heading level (h1-h6) with: font family, size, weight, line-height, letter-spacing.
- Body text, small text, caption text examples.
- Link styles (default, hover, visited, active).
- Font loading: Google Fonts URL used.

### 4. Spacing Scale
- Extract spacing values used (padding, margin, gap).
- Visual boxes showing each spacing value.
- Recommended use cases for each size.

### 5. Components
- Extract and showcase every UI component found:
  - Buttons (all variants found: primary, secondary, outlined, etc.).
  - Cards (as used in the site).
  - Form inputs (text, select, textarea — all states).
  - Navigation elements.
  - Badges/tags.
  - Icons (any SVG icons used).
- Show each component in: default, hover, focus, disabled states.
- Include the CSS class names/selectors used.

### 6. Layout Patterns
- Grid/flex patterns used.
- Max-width and container widths.
- Section padding patterns.
- Responsive breakpoints.

### 7. Animations & Transitions
- Document all transition properties used.
- Show hover effects in action.
- Easing functions used.
- Any keyframe animations.

### 8. Icons
- Display all inline SVG icons found, with labels.
- Icon sizing and color rules.

## Design of the Style Guide Itself
- Clean, organized layout with sticky sidebar navigation.
- Search/filter for finding specific elements.
- Code snippets showing CSS for each element.
- Copy-to-clipboard for color values and code.
- Dark/light mode toggle to preview components in both.
- The style guide should use the site's own design language where appropriate.`;

export async function POST(req: NextRequest) {
  try {
    const { html, siteName } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: STYLE_GUIDE_SYSTEM,
      messages: [{
        role: "user",
        content: `Generate a comprehensive style guide for this website${siteName ? ` (${siteName})` : ""}:\n\n${html}\n\nExtract every color, font, spacing value, and component. Create a beautiful, interactive style guide page with: color swatches, typography showcase, spacing scale, component library, and code snippets. Include dark/light toggle and copy-to-clipboard for values.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let styleGuideHtml = textBlock.text.trim();
    if (styleGuideHtml.startsWith("```")) {
      styleGuideHtml = styleGuideHtml.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html: styleGuideHtml, siteName: siteName || "Website" });
  } catch (err) {
    console.error("Style guide generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
