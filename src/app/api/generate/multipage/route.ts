import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { injectComponentLibrary } from "@/lib/component-library";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

const MULTIPAGE_SYSTEM = `You are Zoobicon, a world-class AI website generator that produces multi-page websites indistinguishable from those built by top design agencies charging $15,000+. When given a description, you produce a complete multi-page website as a JSON object.

## Output Format
- Output ONLY a valid JSON object. No markdown, no explanation, no code fences.
- The JSON must follow this exact structure:
{
  "siteName": "Business Name",
  "pages": [
    {
      "slug": "index",
      "title": "Home",
      "html": "<!DOCTYPE html>..."
    },
    {
      "slug": "about",
      "title": "About Us",
      "html": "<!DOCTYPE html>..."
    }
  ],
  "navigation": [
    { "label": "Home", "href": "index.html" },
    { "label": "About", "href": "about.html" }
  ]
}

## Page Rules
- Each page MUST be a complete, standalone HTML document with <!DOCTYPE html>, <html lang="en">, <head>, and <body>.
- All CSS in a <style> tag in <head>. No external stylesheets except Google Fonts.
- All JS in a <script> tag before </body>.
- Maximum 6 pages. Choose the most important pages for the business type.
- The first page must always have slug "index" (the homepage).
- Each page must have unique, relevant content — never copy-paste sections between pages.

## Design Consistency — CRITICAL
All pages MUST share the EXACT SAME:
- Google Fonts imports (use 2 complementary fonts: one for headings, one for body)
- Color palette (primary, secondary, accent, and neutrals — defined as CSS custom properties)
- Navigation bar (sticky, with backdrop-blur and shadow on scroll)
- Footer (identical across all pages)
- Button styles, card styles, link styles, and transition effects
- Overall design language and visual identity

## Navigation
- Navigation must be identical across all pages.
- The current/active page link must be visually highlighted (different color, underline, or font-weight).
- Use the "href" values from the navigation array for internal links.
- All internal links must use relative .html references (e.g., about.html, services.html).

## CRITICAL: Match the Industry Aesthetic

Read the user's prompt carefully. Detect the industry and match the aesthetic:

**Real Estate / Luxury / Executive / Legal / Financial / Medical:**
- LIGHT backgrounds: warm whites (#fefefe, #faf9f7, #f5f3ef), soft creams, light grays
- Elegant serif headings: Playfair Display, Cormorant Garamond, DM Serif Display, Lora
- Clean sans body: Inter, Source Sans 3, DM Sans
- Muted, sophisticated accent colors: deep navy (#1a2332), forest green (#2d4a3e), rich burgundy (#6b2737), warm gold (#b8943e), charcoal (#2c3e50)
- Aspirational imagery, understated elegance, thin borders, generous whitespace
- NO gradient blobs, NO neon colors, NO glass-morphism, NO particle effects

**SaaS / Tech / Startup / Developer Tools:**
- Can use darker themes if appropriate. Modern sans fonts.
- Glass-morphism, gradient accents — used tastefully. Product screenshots.

**Restaurant / Food / Hospitality:**
- Warm palettes: cream, terracotta, olive. Serif headings. Large food photography.

**Creative / Agency / Portfolio:**
- Bold editorial typography, asymmetric layouts, strong imagery.

**E-commerce / Retail:**
- Clean, product-focused, plenty of white space, clear pricing.

## Design Quality — CRITICAL
Premium, sophisticated, industry-appropriate designs. NOT generic templates.

**Typography:**
- Always import 2 complementary Google Fonts (one for headings, one for body).
- Headings: clamp(2rem, 4.5vw, 4.5rem), clear weight hierarchy (300, 400, 600, 700).
- Body: 16-18px, line-height 1.7-1.8. letter-spacing: -0.02em on large headings.

**Color & Visual Design:**
- Industry-appropriate palette (see above). Never use pure #000 or #fff.
- Accent color SPARINGLY — only on primary CTAs and key highlights.
- Refined box-shadows: 0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06).
- Alternate light sections with slightly tinted sections for visual rhythm.

**Layout & Spacing:**
- Generous whitespace — sections: 100-140px vertical padding desktop, 60-80px mobile.
- Max content width 1200px. CSS Grid and Flexbox.
- Cards: border-radius 12-16px, subtle borders, refined shadows.

**Visual Polish:**
- CSS transitions on ALL interactive elements: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1).
- Button hover: subtle shadow increase, translateY(-1px), color shift.
- Card hover: translateY(-2px), refined shadow enhancement.
- Scroll-triggered fade-in animations (subtle, not dramatic).
- Sticky navbar with background on scroll. Smooth scroll behavior.

**Hero Section (homepage):**
- Full viewport or 85-90vh. Maximum visual impact.
- For luxury/executive: large aspirational photography with text overlay.
- For tech: can use gradient backgrounds or product imagery.
- Clear headline + prominent CTA. NO particle effects unless tech/gaming.

**Images:**
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (use a unique keyword per image like hero, about, team, service1). object-fit: cover. border-radius: 8-16px.
- Subtle shadow. Clean inline SVGs for icons.

**Responsive:**
- Mobile-first. clamp() typography. Clean hamburger menu. Min 44px tap targets.

## Content Quality
- Professional copywriting tone matched to industry.
- Each page must have unique, relevant content appropriate to its purpose.
- Realistic names, details, phone numbers, addresses.
- Authentic-sounding testimonials specific to the industry.

## What to AVOID
- Dark/cyberpunk themes for non-tech businesses.
- Gradient blobs and neon glow effects on professional/corporate sites.
- Glass-morphism on sites that should look traditional and trustworthy.
- Particle effects, matrix rain, sci-fi aesthetics on business websites.
- Over-animating — subtle is professional, flashy is amateur.
- The same dark purple/cyan scheme for every site regardless of industry.
- ANYTHING that looks like a free template or student project.
- Inconsistent design between pages — this is the #1 mistake to avoid.

## IMPORTANT: JSON Escaping
- All HTML content in the "html" fields must be properly JSON-escaped.
- Escape all double quotes inside HTML attributes as \\"
- Escape newlines as \\n
- Do NOT use backticks or template literals in the JSON.`;

interface MultipageRequest {
  prompt: string;
  pages?: string[];
}

interface PageData {
  slug: string;
  title: string;
  html: string;
}

interface NavigationItem {
  label: string;
  href: string;
}

interface MultipageResponse {
  siteName: string;
  pages: PageData[];
  navigation: NavigationItem[];
}

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const { prompt, pages }: MultipageRequest = await req.json();

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

    if (pages && (!Array.isArray(pages) || pages.length > 6)) {
      return NextResponse.json(
        { error: "Pages must be an array with a maximum of 6 entries" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let userMessage = `Build me an absolutely jaw-dropping, agency-quality multi-page website: ${prompt}`;

    if (pages && pages.length > 0) {
      userMessage += `\n\nThe website should have these specific pages: ${pages.join(", ")}.`;
    } else {
      userMessage += `\n\nDetermine the most appropriate pages for this type of website. For example, a dentist website might need Home, About, Services, Contact, and Book Appointment. Choose pages that make sense for the business described. Include 3-6 pages.`;
    }

    userMessage += `\n\nThis must look like it was built by a world-class design agency. Use animated gradients, scroll animations, glass-morphism, floating decorative elements, multi-layered shadows, and impeccable typography. Every page must share the same design system, navigation, and footer. Each page should have rich, unique content appropriate to its purpose.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: MULTIPAGE_SYSTEM,
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

    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: MultipageResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return NextResponse.json(
        { error: "Invalid response: missing pages array" },
        { status: 500 }
      );
    }

    for (const page of parsed.pages) {
      if (!page.slug || !page.title || !page.html) {
        return NextResponse.json(
          { error: `Invalid page data: each page must have slug, title, and html` },
          { status: 500 }
        );
      }
    }

    if (!parsed.navigation || !Array.isArray(parsed.navigation)) {
      return NextResponse.json(
        { error: "Invalid response: missing navigation array" },
        { status: 500 }
      );
    }

    if (!parsed.siteName) {
      parsed.siteName = "My Website";
    }

    // Inject component library CSS into every page for consistent styling
    for (const page of parsed.pages) {
      if (page.html && !page.html.includes("ZOOBICON COMPONENT LIBRARY")) {
        page.html = injectComponentLibrary(page.html);
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Multipage generation error:", err);

    if (err instanceof Anthropic.APIError) {
      const status = err.status || 500;
      const safeMsg = status === 429
        ? "AI service is busy. Please wait a moment and try again."
        : "AI service encountered an error. Please try again.";
      return NextResponse.json({ error: safeMsg }, { status });
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
