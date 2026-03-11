import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "listing-creation",
  "search-filters",
  "user-profiles",
  "messaging",
  "reviews-ratings",
  "favorites",
  "categories",
  "pricing-offers",
  "order-management",
  "dispute-resolution",
];

const MARKETPLACE_SYSTEM = `You are Zoobicon's Marketplace Generator. You create two-sided marketplace platforms as single HTML files. Think Airbnb, Etsy, Fiverr, or Upwork quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Marketplace Structure

### Homepage
- Hero with value proposition and search bar.
- Category cards grid (8-12 categories with icons).
- Featured/trending listings.
- How it works (3-step process for buyers AND sellers).
- Trust signals: "10K+ listings", "50K+ transactions", "4.9 avg rating".
- Testimonials from both buyers and sellers.

### Listing Cards
- Cover image, title, price, seller info (avatar + name + rating).
- Location or delivery info.
- Quick stats (reviews count, response time).
- Category/tag badges.
- Favorite/heart button.
- Hover: shadow + slight scale.

### Listing Detail
- Image gallery (4-6 images with thumbnail navigation).
- Title, price, seller info sidebar.
- Full description with formatted sections.
- Features/specs list.
- Reviews with ratings breakdown (5-star bar chart).
- Similar listings.
- "Contact Seller" and "Buy Now" / "Make Offer" buttons.
- Share buttons.

### Search & Discovery
- Search bar with autocomplete suggestions.
- Category sidebar filters.
- Price range slider.
- Rating filter.
- Sort: relevance, price low/high, newest, most reviewed.
- Grid/list view toggle.
- Results count and pagination.

### User Profiles
- Profile header: avatar, name, member since, rating, bio.
- Active listings grid.
- Reviews received tab.
- Completion rate / response time stats.
- "Contact" button.

### Messaging (if selected)
- Inbox view with conversation list.
- Chat view with message bubbles.
- Timestamp, read receipts.
- Attach image placeholder.
- All stored in localStorage.

### Create Listing (if selected)
- Multi-step form: category → details → pricing → photos → review → publish.
- Image upload placeholders (drag-and-drop zone).
- Rich text description.
- Pricing options (fixed, hourly, custom).
- Preview before publishing.

### Design
- Clean, trustworthy, Airbnb-inspired aesthetic.
- White/light background, consistent card design.
- Accent color for CTAs and interactive elements.
- Professional imagery.
- Responsive grid that adapts from 4 columns to 1.
- Smooth transitions and filter animations.
- Mobile: bottom tab navigation.

### Data
- Generate 20-30 realistic listings across categories.
- 5-8 seller profiles.
- Varied prices, ratings, descriptions.
- All stored in JS arrays, rendered dynamically.
- Search and filters must work on real data.
- Favorites persisted in localStorage.`;

export async function POST(req: NextRequest) {
  try {
    const { marketplaceName, marketplaceType, features, categories } = await req.json();

    if (!marketplaceName || typeof marketplaceName !== "string") {
      return NextResponse.json({ error: "marketplaceName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["search-filters", "categories", "reviews-ratings", "favorites", "user-profiles"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: MARKETPLACE_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a marketplace platform called "${marketplaceName}".\n\nType: ${marketplaceType || "general services"}\nCategories: ${Array.isArray(categories) ? categories.join(", ") : "Generate appropriate categories"}\nFeatures: ${selectedFeatures.join(", ")}\n\nGenerate 20+ realistic listings, user profiles, and reviews. All search/filter/favorite functionality must work. Data-driven from JS arrays with localStorage persistence.`,
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

    return NextResponse.json({ html, marketplaceName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Marketplace generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
