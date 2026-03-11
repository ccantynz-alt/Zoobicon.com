import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const DIRECTORY_SYSTEM = `You are Zoobicon's Business Directory Generator. You create professional business listing and directory websites as single HTML files. Think Yelp, TripAdvisor, or niche industry directories.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.
- No external dependencies except Google Fonts.

## Directory Features

### Search & Discovery
- Hero with large search bar: "Search businesses, services, locations..."
- Category quick-links below search (icons + labels).
- Location filter (city/area dropdown or text input).
- Advanced filters: rating, price range, open now, distance.

### Listing Cards
- Business image (picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with a unique keyword per business).
- Business name (linked).
- Star rating (1-5) with review count.
- Category badges.
- Price range indicator ($, $$, $$$, $$$$).
- Brief description (2 lines truncated).
- Address/location.
- "Open Now" or hours indicator.
- Quick action buttons: call, directions, website.
- Hover: subtle lift effect.

### Listing Detail View
- Image gallery (3-5 photos in a grid/carousel).
- Business name, rating, review count, price range.
- Full description (3-4 paragraphs).
- Hours of operation table.
- Contact info: phone (click-to-call), website, email.
- Address with map placeholder.
- Amenities/features list with icons.
- Reviews section: individual reviews with user name, date, rating, text.
- "Write a Review" form: star rating selector, text input, name.
- Related/nearby businesses.

### Category Pages
- Category header with description.
- Filtered listing grid.
- Sort options: rating, distance, price, newest.
- Results count.

### Map View (Optional)
- Styled map placeholder with business pins.
- List/Map view toggle.

### Data
- Generate 15-20 realistic business listings.
- 5-6 categories with 3-4 businesses each.
- Realistic names, addresses, phone numbers, descriptions.
- Varied ratings (3.5-5.0 stars).
- 3-5 reviews per featured listing.
- Store in JS data array, render dynamically.
- Search and filter must actually work on the data.
- LocalStorage for bookmarks/favorites.

### Design
- Clean, content-dense but not cluttered.
- White/light background, cards with subtle shadows.
- Accent color for CTAs and interactive elements.
- Star ratings in gold/amber.
- Clear typography hierarchy.
- Responsive: card grid adapts, filters collapse on mobile.
- Smooth filtering/sorting animations.`;

export async function POST(req: NextRequest) {
  try {
    const { directoryName, niche, location, categories } = await req.json();

    if (!directoryName || typeof directoryName !== "string") {
      return NextResponse.json({ error: "directoryName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const categoriesText = Array.isArray(categories) && categories.length > 0
      ? `Categories: ${categories.join(", ")}`
      : "Generate 5-6 appropriate categories for this directory.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: DIRECTORY_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a business directory website called "${directoryName}".\n\nNiche: ${niche || "local businesses"}\nLocation: ${location || "Generate a realistic city"}\n${categoriesText}\n\nGenerate 15-20 realistic listings with search, filtering, category pages, detail views with reviews, and bookmark functionality. All data-driven from JS arrays.`,
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

    return NextResponse.json({ html, directoryName, niche: niche || "local businesses" });
  } catch (err) {
    console.error("Directory generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
