import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const PITCH_DECK_SYSTEM = `You are Zoobicon's Pitch Deck Generator. You create stunning, investor-ready presentation decks as interactive HTML. Think Sequoia-quality pitch decks or top-tier agency proposals.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Deck Structure

### Presentation Engine
- Full-screen slide layout (100vw x 100vh per slide).
- Keyboard navigation: arrow keys, space bar, escape for overview.
- Slide counter: "3 / 12" in bottom-right.
- Progress bar at top.
- Smooth slide transitions (fade, slide, or push).
- Overview mode: grid of all slide thumbnails (toggle with Escape).
- Presenter notes toggle (press 'N').
- Mobile: swipe navigation.

### Slide Types

1. **Title Slide**: Company name, tagline, logo placeholder, presenter name, date.

2. **Problem Slide**: Clear problem statement. Use a compelling stat or story. Dark or bold background.

3. **Solution Slide**: Your solution in one sentence. Key value proposition. Visual/diagram.

4. **Market Size (TAM/SAM/SOM)**: Three nested circles or bars showing market sizes with dollar values.

5. **Product Slide**: Product screenshots/mockups, key features, how it works (3-step).

6. **Business Model**: Revenue streams, pricing tiers, unit economics. Simple diagram or table.

7. **Traction Slide**: Growth metrics with charts (SVG). Key milestones. Logos of notable clients.

8. **Competition Slide**: Market positioning matrix (2x2 grid) or feature comparison table. Show differentiation.

9. **Team Slide**: Founder photos, names, titles, key credentials. Advisory board names.

10. **Financials Slide**: Revenue projections chart (SVG), key metrics table, burn rate, runway.

11. **The Ask Slide**: Funding amount, use of funds breakdown (pie chart or bar), timeline.

12. **Contact/Thank You Slide**: Contact info, website, social links, "Thank You" message.

### Design Standards
- ONE font family: Inter, Outfit, or Space Grotesk for modern; Playfair + Inter for premium.
- Minimal text per slide: max 6 bullet points, max 8 words per point.
- Consistent accent color throughout.
- Large numbers and stats (72-120px) for impact.
- White or dark backgrounds (not gradient-heavy).
- Charts/diagrams in SVG (clean, minimal, data-focused).
- Ample whitespace — slides should breathe.
- Consistent slide padding (60-100px).
- Image placeholders with professional styling.

### Data Visualization (Pure SVG)
- Line charts for growth trends.
- Bar charts for comparisons.
- Pie/donut charts for breakdowns.
- 2x2 matrix for competition.
- Funnel diagram for conversion.
- Timeline for milestones.
- All animated on slide entry.

### Interactivity
- Keyboard navigation.
- Click to advance.
- Swipe on mobile.
- Slide overview grid.
- Print-friendly mode (@media print).
- Export hint (Ctrl+P for PDF).`;

export async function POST(req: NextRequest) {
  try {
    const { companyName, industry, stage, askAmount, slides } = await req.json();

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const slidesText = Array.isArray(slides) && slides.length > 0
      ? `Custom slides: ${slides.join(", ")}`
      : "Include all standard pitch deck slides (problem, solution, market, product, business model, traction, competition, team, financials, the ask).";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: PITCH_DECK_SYSTEM,
      messages: [{
        role: "user",
        content: `Create an investor pitch deck for "${companyName}".\n\nIndustry: ${industry || "technology"}\nStage: ${stage || "Series A"}\nFunding Ask: ${askAmount || "$5M"}\n\n${slidesText}\n\nMake this Sequoia-quality. Clean, data-rich, compelling narrative. Full-screen presentation with keyboard navigation, SVG charts, and print-to-PDF support. Generate realistic but impressive metrics.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html, companyName, stage: stage || "Series A" });
  } catch (err) {
    console.error("Pitch deck generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
