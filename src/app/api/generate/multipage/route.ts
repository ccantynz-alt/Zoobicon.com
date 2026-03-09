import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

## Design Quality — THIS IS CRITICAL
You must produce designs that look premium, sophisticated, and visually stunning. NOT generic templates. Follow these rules meticulously:

**Typography:**
- Always import 2 complementary Google Fonts (one for headings, one for body). Good combos: Inter + DM Sans, Poppins + Open Sans, Playfair Display + Source Sans 3, Space Grotesk + Inter, Sora + Inter.
- Hero headings: clamp(2.5rem, 5vw, 5rem), font-weight 800, letter-spacing -0.03em.
- Body text: 17-18px, line-height 1.7, font-weight 400. Subheadings: font-weight 600.
- Never use default browser fonts.

**Color & Visual Design:**
- Create a unique, cohesive color palette: primary, secondary, accent, plus 3+ neutrals.
- Never use pure black (#000) or pure white (#fff). Use near-black (#0a0a0f, #111827, #1a1a2e) and warm whites (#fafaf9, #f8fafc).
- Use the accent color sparingly — only for CTAs, badges, and key highlights.
- Create depth with multi-layered box-shadows: 0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08), 0 20px 50px rgba(0,0,0,0.06).
- Use rich gradients: on hero backgrounds, buttons, and decorative elements.
- Add a subtle noise/grain texture or mesh gradient background for visual richness.

**Layout & Spacing:**
- Generous whitespace — sections: 100-140px vertical padding. Never feel cramped.
- Max content width 1200px, centered. Use CSS Grid and Flexbox masterfully.
- Cards: border-radius 16-24px, subtle borders (1px solid rgba(0,0,0,0.04)), multi-layer shadows.
- Create visual rhythm with alternating section layouts (left-right, grid, full-width).

**Visual Polish (THE DIFFERENCE BETWEEN GOOD AND GREAT):**
- CSS transitions on ALL interactive elements: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1).
- Button hover: shadow lift, translateY(-2px), color shift, scale(1.02).
- Card hover: translateY(-4px), enhanced shadow, subtle border color change.
- Glass-morphism: backdrop-filter: blur(20px) with semi-transparent backgrounds where appropriate.
- Add decorative elements: gradient blobs (position: absolute, filter: blur(100px)), grid patterns, dot patterns, or subtle SVG shapes.
- Scroll-triggered animations using Intersection Observer: fade-in-up with staggered delays.
- Animated gradient backgrounds on hero sections (background-size: 400% 400%; animation: gradient 15s ease infinite).
- Add a custom cursor effect or smooth scroll behavior.

**Hero Section (MAKE IT WOW — homepage only):**
- Full viewport height or near it. Massive impact.
- Use animated gradient meshes, particle effects, or floating geometric shapes.
- Large bold heading with gradient text or animated text reveal.
- Clear value proposition + compelling CTA with glowing hover effect.
- Consider adding floating UI mockups, browser frames with screenshots, or 3D-like card perspectives.

**Images:**
- Use https://picsum.photos/WIDTH/HEIGHT for realistic placeholder photos.
- Apply object-fit: cover, border-radius 12-20px, and shadow: 0 20px 60px rgba(0,0,0,0.15).
- Wrap images in decorative frames or add subtle rotation transforms for visual interest.
- For icons, use inline SVGs with the brand colors.

**Micro-interactions:**
- Navbar: sticky with backdrop-blur, subtle shadow on scroll (use JS).
- Number counters that animate on scroll (Intersection Observer + JS).
- Smooth section-to-section scroll with scroll-behavior: smooth.
- Floating badge/pill elements with subtle bounce animation.
- Typing effect or text rotation in hero section.

**Responsive:**
- Mobile-first approach. Use clamp() for all typography.
- Navigation: hamburger menu with smooth slide animation.
- Cards: stack vertically on mobile with maintained shadows and spacing.
- Reduce section padding to 60-80px on mobile.
- Touch-friendly: buttons min 44px tap target.

## Content Quality
- Write compelling, realistic copy that sells. Match the business tone perfectly.
- Each page should have content appropriate to its purpose (e.g., About page has team bios/story, Services page has detailed service listings, Contact page has a form and map).
- Use realistic business names, taglines, phone numbers, and addresses.
- Testimonials should feel real: full names, titles, companies, and natural-sounding quotes.

## What to AVOID
- ANYTHING that looks like a free template, Bootstrap default, or student project.
- Flat, boring layouts with no depth or visual hierarchy.
- Missing hover states, transitions, or animations.
- Cramped spacing, tiny text, or walls of text.
- Single font weight throughout. Using only one color.
- Empty/wasted space without purpose. Sections that feel disconnected.
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
        { error: "ANTHROPIC_API_KEY is not configured" },
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
      model: "claude-sonnet-4-20250514",
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

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Multipage generation error:", err);

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
