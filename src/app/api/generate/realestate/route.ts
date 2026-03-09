import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "property-listings",
  "search-filters",
  "property-detail",
  "virtual-tour",
  "mortgage-calculator",
  "agent-profiles",
  "neighborhood-info",
  "saved-properties",
  "contact-form",
  "market-stats",
];

const REALESTATE_SYSTEM = `You are Zoobicon's Real Estate Website Generator. You create premium real estate websites for agencies, brokerages, and individual agents. Think Compass, Sotheby's, or Douglas Elliman quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Real Estate Design Standards

### Aesthetic
- Luxury, aspirational design. Light backgrounds (#faf9f7, #f5f3ef).
- Serif headings (Playfair Display, Cormorant Garamond) + clean sans body (Inter, DM Sans).
- Muted, sophisticated accent: navy (#1a2332), forest (#2d4a3e), or gold (#b8943e).
- Large, full-bleed property photography.
- Generous whitespace — luxury means space.
- Subtle shadows, thin borders, refined details.

### Property Listings
- Grid of property cards: large hero image, price (prominent), address, bed/bath/sqft icons, property type badge.
- Hover: image zoom, shadow lift.
- Quick filters: price range, beds, baths, property type, location.
- Sort: price, newest, square footage.
- Map view toggle (styled placeholder).
- Results count.

### Property Detail View
- Full-width image gallery (main image + thumbnails, lightbox).
- Price, address, status badge (For Sale, Pending, Sold).
- Key stats: beds, baths, sqft, lot size, year built, garage, MLS#.
- Description (3-4 paragraphs about the property).
- Feature list organized by category (Interior, Exterior, Community).
- Virtual tour placeholder (embedded iframe or CTA button).
- Mortgage calculator: price, down payment %, interest rate, term → monthly payment.
- Agent contact card with photo, name, phone, email, form.
- Similar properties.
- Map with property location.

### Agent Profiles
- Professional headshot, name, title, phone, email.
- Bio (2-3 paragraphs).
- Specialties and areas served.
- Current listings grid.
- Testimonials from past clients.
- Contact form.

### Search & Filters
- Hero search: location, min/max price, beds, property type.
- Advanced filters: baths, sqft range, year built, parking, pool, etc.
- Quick-search suggestions.
- Recent searches (localStorage).

### Mortgage Calculator
- Interactive inputs: purchase price, down payment, interest rate, loan term.
- Real-time monthly payment calculation.
- Breakdown: principal + interest, property tax estimate, insurance estimate.
- Amortization summary.
- Pie chart of payment breakdown.

### Market Stats
- Median home price with trend chart.
- Average days on market.
- Inventory levels.
- Price per square foot.
- Neighborhood comparison.

### Data
- Generate 12-20 realistic property listings with varied prices, sizes, locations.
- 3-4 agent profiles.
- Store in JS arrays, render dynamically.
- All search/filter/sort must work on data.
- Saved properties in localStorage (heart/save button).

### Mobile
- Property cards: full-width single column.
- Gallery: swipe-friendly.
- Filters: collapsible panel.
- Sticky "Contact Agent" button at bottom.
- Calculator: responsive input layout.`;

export async function POST(req: NextRequest) {
  try {
    const { agencyName, location, features, properties } = await req.json();

    if (!agencyName || typeof agencyName !== "string") {
      return NextResponse.json({ error: "agencyName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["property-listings", "search-filters", "property-detail", "mortgage-calculator", "agent-profiles", "contact-form"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: REALESTATE_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a premium real estate website for "${agencyName}".\n\nLocation: ${location || "Generate a luxury real estate market"}\nFeatures: ${selectedFeatures.join(", ")}\n\nGenerate 12-20 realistic property listings with varied prices and types. Include property search with filters, detail views with image galleries, mortgage calculator, agent profiles, and saved properties. Luxury aesthetic, aspirational photography. Make it look like Sotheby's or Compass.`,
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

    return NextResponse.json({ html, agencyName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Real estate site generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
