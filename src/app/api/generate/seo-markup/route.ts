import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SEO_SYSTEM = `You are Zoobicon's SEO Enhancement Agent. You take existing HTML and inject comprehensive SEO markup that would score 95+ on any SEO audit tool.

## Your Task
- You receive a complete HTML file. Enhance it with SEO markup WITHOUT changing the visible content or design.
- Output ONLY valid JSON matching this structure:
{
  "html": "The complete enhanced HTML",
  "seoReport": {
    "metaTitle": "The optimized title tag",
    "metaDescription": "The optimized meta description",
    "schemaType": "The JSON-LD schema type used",
    "ogTags": ["list of OG tags added"],
    "improvements": ["list of SEO improvements made"]
  }
}

## SEO Elements to Inject

### 1. Meta Tags (in <head>)
- Optimized <title> tag: keyword-rich, 50-60 characters, brand name at end.
- <meta name="description">: compelling, 150-160 characters, includes primary keyword and CTA.
- <meta name="keywords">: 5-10 relevant keywords.
- <meta name="robots" content="index, follow">
- <meta name="author">
- <link rel="canonical" href="...">

### 2. Open Graph Tags (for Facebook/LinkedIn)
- og:title, og:description, og:type (website), og:url
- og:image (use the first hero image or a representative image from the page)
- og:image:width, og:image:height
- og:site_name, og:locale

### 3. Twitter Card Tags
- twitter:card (summary_large_image)
- twitter:title, twitter:description
- twitter:image

### 4. JSON-LD Structured Data (CRITICAL)
Based on the page content, add the most appropriate schema.org type:
- **Business website**: LocalBusiness or Organization
- **Service provider**: ProfessionalService or specific type (LegalService, MedicalBusiness, etc.)
- **Restaurant**: Restaurant with menu, hours, priceRange
- **E-commerce**: Product with offers, price, availability
- **Blog/Article**: Article or BlogPosting
- **FAQ section**: FAQPage with Question/Answer pairs
- **Event**: Event with date, location, performer
- **Person/Portfolio**: Person with jobTitle, worksFor

Include as many relevant properties as possible:
- name, description, url, image, telephone, email
- address (PostalAddress), geo (GeoCoordinates)
- openingHours, priceRange, paymentAccepted
- aggregateRating, review
- sameAs (social media links)

### 5. Heading Hierarchy Fix
- Ensure exactly ONE <h1> tag (the main page title).
- Headings follow sequential order: h1 → h2 → h3 (no skipping levels).
- If headings skip levels, fix them while keeping the visual styling the same.

### 6. Image SEO
- Add descriptive alt text to ALL images (context-aware, not generic "image").
- Add width and height attributes to prevent CLS (content layout shift).
- Add loading="lazy" to below-fold images.
- Keep loading="eager" on the first/hero image.

### 7. Accessibility-SEO Overlap
- Add aria-label to navigation elements.
- Ensure all links have descriptive text (not "click here").
- Add lang attribute to <html> if missing.
- Add role="main" to main content area.
- Add role="navigation" to nav elements.
- Add role="complementary" to sidebar/secondary content.

### 8. Performance Hints
- Add <link rel="preconnect"> for external domains (Google Fonts, picsum.photos/seed/KEYWORD/WIDTH/HEIGHT).
- Add <link rel="dns-prefetch"> for external domains.
- Add <meta name="theme-color"> matching the brand primary color.

## Rules
- Do NOT change any visible text, design, colors, or layout.
- Do NOT remove existing meta tags — enhance or replace them.
- Do NOT add visible elements to the page.
- Infer the business type, location, and details from the page content.
- Write SEO copy that is compelling and keyword-optimized, not keyword-stuffed.`;

export async function POST(req: NextRequest) {
  try {
    const { html, businessInfo } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    if (html.length > 500000) {
      return NextResponse.json(
        { error: "HTML too large (max 500KB)" },
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

    const businessContext = businessInfo
      ? `\n\nAdditional business info for SEO optimization:\n${JSON.stringify(businessInfo, null, 2)}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: SEO_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Enhance this HTML with comprehensive SEO markup:\n\n${html}${businessContext}\n\nAdd all SEO elements: meta tags, Open Graph, Twitter Cards, JSON-LD schema, heading hierarchy fixes, image alt text, accessibility labels, and performance hints. Return the result as JSON.`,
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
      return NextResponse.json({
        html: responseText,
        seoReport: {
          note: "SEO enhancements applied. JSON report unavailable.",
        },
      });
    }
  } catch (err) {
    console.error("SEO enhancement error:", err);

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
