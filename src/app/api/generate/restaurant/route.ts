import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "online-menu",
  "reservations",
  "online-ordering",
  "gallery",
  "reviews",
  "events",
  "gift-cards",
  "loyalty-program",
  "delivery-tracking",
  "specials-board",
];

const RESTAURANT_SYSTEM = `You are Zoobicon's Restaurant Website Generator. You create premium restaurant, cafe, and food service websites that make visitors hungry and ready to book. Think Michelin-star restaurant websites or trendy cafe brands.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Restaurant-Specific Design

### Aesthetic by Type
- **Fine Dining**: Dark/moody background (#1a1a1a), elegant serif fonts (Playfair Display, Cormorant), gold/cream accents, minimal layout, large food photography, subtle animations.
- **Casual Dining**: Warm, inviting palette (cream, terracotta, olive), friendly fonts, welcoming imagery, moderate detail level.
- **Cafe/Bakery**: Light, airy (white, soft pink, mint), playful but refined, lifestyle photography, Instagram-worthy aesthetic.
- **Fast Casual**: Clean, bold, modern. Strong brand colors, energetic layout, clear ordering focus.
- **Bar/Cocktails**: Dark, moody, sophisticated. Neon accents optional, atmospheric photography, menu cocktail focus.

### Required Sections

1. **Hero**: Full-screen atmospheric photo with restaurant name, tagline ("Farm to Table Since 2012"), and reservation CTA. Overlay gradient for text readability.

2. **About/Story**: Brief restaurant story, chef intro with photo, philosophy/values. Warm, inviting tone.

3. **Menu**:
   - Categorized sections (Starters, Mains, Desserts, Drinks).
   - Each item: name (styled), description (1 line), price (right-aligned).
   - Dietary indicators (V, VG, GF icons with legend).
   - Featured/signature dishes highlighted.
   - Optional: menu tabs for Lunch/Dinner/Brunch.
   - Downloadable PDF placeholder.

4. **Gallery**:
   - Masonry or grid of food/ambiance photos (picsum.photos with food-appropriate seeds).
   - Lightbox on click.
   - Mix of food close-ups, interior shots, and chef/team.
   - Instagram feed placeholder.

5. **Reservation/Booking**:
   - Date picker, party size selector, time slot selector.
   - Special requests textarea.
   - Confirmation view.
   - Alternative: "Call to Reserve" with click-to-call.
   - OpenTable-style interface.

6. **Online Ordering** (if selected):
   - Menu with add-to-cart buttons.
   - Cart sidebar/bottom sheet.
   - Order type: delivery/pickup toggle.
   - Checkout with contact info and payment placeholder.
   - Order confirmation with estimated time.

7. **Location & Hours**:
   - Map placeholder.
   - Address with directions link.
   - Hours of operation table (with special holiday hours note).
   - Parking information.
   - Phone: click-to-call.

8. **Reviews/Testimonials**:
   - Star ratings from "Google", "Yelp", "TripAdvisor" (placeholder).
   - Featured review quotes with attribution.
   - Overall rating display.

9. **Footer**:
   - Hours, address, phone.
   - Social media links (Instagram, Facebook, Yelp).
   - Newsletter signup.
   - Private events/catering CTA.

### Menu Data Structure
- Store full menu in JS data array.
- Categories, items, prices, descriptions, dietary flags.
- Render dynamically.
- Filter by category and dietary preference.

### Design Details
- Food photography must look appetizing (warm tones, close-up seeds).
- Use warm lighting-style CSS (subtle warm overlay on images).
- Generous spacing — restaurants sell atmosphere, not efficiency.
- Typography: menu items in refined serif or handwritten style, prices in clean sans.
- Subtle parallax on hero and section backgrounds.
- Mobile: sticky reservation/order button at bottom.`;

export async function POST(req: NextRequest) {
  try {
    const { restaurantName, cuisineType, restaurantType, features, menuItems } = await req.json();

    if (!restaurantName || typeof restaurantName !== "string") {
      return NextResponse.json({ error: "restaurantName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["online-menu", "reservations", "gallery", "reviews"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const menuContext = Array.isArray(menuItems) && menuItems.length > 0
      ? `\nMenu items provided:\n${menuItems.map((m: { name: string; price?: number; category?: string; description?: string }) => `- ${m.name} ($${m.price || 0}) [${m.category || "Main"}]: ${m.description || ""}`).join("\n")}`
      : "\nGenerate a full realistic menu (15-25 items across categories).";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: RESTAURANT_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a premium restaurant website for "${restaurantName}".\n\nCuisine: ${cuisineType || "Modern American"}\nType: ${restaurantType || "fine dining"}\nFeatures: ${selectedFeatures.join(", ")}${menuContext}\n\nMake this look like a Michelin-star restaurant website. Atmospheric, appetizing, with a full interactive menu, reservation system, and gallery. Every detail matters.`,
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

    return NextResponse.json({ html, restaurantName, cuisineType: cuisineType || "Modern American", featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Restaurant site generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
