import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const LANDING_SYSTEM = `You are Zoobicon's Landing Page Specialist. You create high-converting landing pages that look like they were designed by a $15,000+ conversion-focused agency. Output a single, complete HTML file.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with <!DOCTYPE html>, <html lang="en">, <head>, <body>.
- All CSS in <style> tag. All JS in <script> tag before </body>.
- No external dependencies except Google Fonts.

## Landing Page Structure (MUST include ALL)

### 1. Announcement Bar (optional but recommended)
- Thin bar at very top with urgency message or social proof ("Join 10,000+ companies" or "Limited time: 20% off")
- Subtle background color, small text, dismissible with X button.

### 2. Navigation
- Sticky navbar with logo, minimal links (Features, Pricing, Testimonials), and prominent CTA button.
- CTA button in nav should contrast with everything else — it's the #1 action.
- On scroll: add subtle shadow and slight background opacity change.
- Mobile: clean hamburger menu.

### 3. Hero Section (CRITICAL — this sells or kills the page)
- Full viewport height (min 90vh).
- ONE clear headline: benefit-focused, not feature-focused. Max 10 words.
- Sub-headline: 1-2 sentences expanding on the value. Address the pain point.
- Primary CTA button: large, high-contrast, action-oriented text ("Start Free Trial", "Get Started Free", "Book a Demo").
- Secondary CTA: text link or ghost button ("See how it works", "Watch demo").
- Social proof directly under CTAs: "Trusted by 500+ companies" with small logos or "⭐ 4.9/5 from 2,000+ reviews".
- Hero image/illustration or product screenshot on the right side (use picsum.photos).
- Subtle animated gradient or pattern background for visual interest.

### 4. Social Proof Bar
- Logo strip of 5-6 "trusted by" company names/logos.
- Grayscale logos, subtle, horizontal scroll on mobile.
- "Trusted by teams at" or "Used by leading companies" header.

### 5. Problem/Agitation Section
- Address the pain point directly: "Tired of X?" or "Stop wasting time on X"
- 3 pain points with icons, each 1-2 sentences.
- This section creates the emotional need for the solution.

### 6. Solution/Features Section
- 3-4 key features in a grid or alternating left-right layout.
- Each feature: icon, headline (benefit-focused), 2-3 sentence description.
- Include a screenshot or illustration for each (picsum.photos).
- Alternating layout: image-left/text-right, then text-left/image-right.

### 7. How It Works
- 3-step process with numbered circles or timeline.
- Step 1: Sign up / Connect → Step 2: Configure / Customize → Step 3: Launch / See results.
- Keep it dead simple. Reduce perceived complexity.

### 8. Testimonials (CRITICAL for conversion)
- 3 testimonials in cards with:
  - Quote text (specific, mentions results/numbers).
  - Person's full name and title.
  - Company name.
  - Star rating (5 stars).
  - Avatar image (picsum.photos/60/60).
- One featured/larger testimonial with bigger quote text.
- Include specific metrics: "Increased our conversion by 47%" not "Great product!"

### 9. Pricing Section (if applicable)
- 2-3 pricing tiers in columns.
- Middle tier highlighted as "Most Popular" with accent border/badge.
- Feature checklist for each tier with checkmarks.
- Monthly/Annual toggle with savings badge ("Save 20%").
- CTA button on each tier.
- "No credit card required" or "14-day free trial" under buttons.

### 10. FAQ Section
- 5-6 common questions in accordion format.
- Smooth expand/collapse animation.
- Questions should address objections: pricing, security, integration, support.
- Click to toggle, only one open at a time.

### 11. Final CTA Section
- Full-width section with strong background color or gradient.
- Compelling headline: restate the core benefit.
- Large CTA button matching the hero CTA.
- "No credit card required" or "Free 14-day trial" reassurance.
- Optional: small testimonial quote or stat for final social proof.

### 12. Footer
- Company info, product links, legal links (Privacy, Terms).
- Social media icons.
- "Made with ❤️ by [Company]" or copyright.

## Conversion Optimization Rules
- Every section must have ONE clear purpose — don't muddle messages.
- CTA buttons must be consistent in color and text throughout the page.
- Use urgency and scarcity tastefully (not fake countdown timers).
- Address objections near CTAs: "No credit card required", "Cancel anytime", "30-day money-back guarantee".
- Visual hierarchy: the eye should flow naturally from headline → sub-headline → CTA.
- White space is conversion space — don't crowd elements.
- Mobile optimization: CTAs must be full-width on mobile, easily tappable (min 48px height).

## Design Standards
- 2 complementary Google Fonts (headings + body).
- Cohesive color palette: primary (CTA/accent), secondary, neutrals. Never pure black or white.
- Smooth transitions on ALL interactive elements.
- Scroll-triggered fade-in animations using Intersection Observer.
- Sticky nav with scroll effect.
- Cards with refined shadows and hover effects.
- Generous spacing: 80-120px vertical padding per section.
- Max content width 1200px.

## Conversion-Specific JavaScript
- Smooth scroll for all anchor links.
- FAQ accordion with animation.
- Pricing toggle (monthly/annual) if pricing is included.
- Intersection Observer for scroll animations.
- Mobile hamburger menu.
- Announcement bar dismiss button.
- Sticky nav scroll effect.`;

const VALID_SECTIONS = [
  "announcement-bar",
  "hero",
  "social-proof",
  "problem",
  "features",
  "how-it-works",
  "testimonials",
  "pricing",
  "faq",
  "final-cta",
  "footer",
];

export async function POST(req: NextRequest) {
  try {
    const { prompt, sections, incluePricing, tier } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt describing the product/service is required" },
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

    const selectedSections =
      Array.isArray(sections) && sections.length > 0
        ? sections.filter((s: string) => VALID_SECTIONS.includes(s))
        : VALID_SECTIONS;

    const sectionInstruction =
      selectedSections.length < VALID_SECTIONS.length
        ? `\n\nOnly include these sections: ${selectedSections.join(", ")}. Skip all others.`
        : "";

    const pricingNote =
      incluePricing === false ? "\n\nDo NOT include a pricing section." : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: LANDING_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a high-converting landing page for: ${prompt}\n\nThis must look like it was designed by a top conversion-focused agency. Every section should push the visitor toward the primary CTA. Include specific, compelling copy with real-sounding metrics and testimonials.${sectionInstruction}${pricingNote}`,
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

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html,
      sectionsIncluded: selectedSections,
    });
  } catch (err) {
    console.error("Landing page generation error:", err);

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
