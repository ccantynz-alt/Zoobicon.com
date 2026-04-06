import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { injectComponentLibrary } from "@/lib/component-library";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

interface Product {
  name: string;
  price: number;
  description?: string;
}

interface EcommerceRequest {
  businessType: string;
  products: Product[];
  features: string[];
  theme?: string;
}

const VALID_FEATURES = [
  "shopping-cart",
  "checkout",
  "product-search",
  "product-filters",
  "wishlist",
  "reviews",
  "inventory-tracking",
  "discount-codes",
  "shipping-calculator",
  "order-tracking",
];

function buildSystemPrompt(theme?: string): string {
  const themeGuide = theme
    ? `\nDesign Theme: "${theme}". Apply this aesthetic consistently across all elements.`
    : "";

  return `You are Zoobicon, an elite AI e-commerce storefront generator. You produce a single, complete, production-quality HTML file for an online store.

Rules:
- Output ONLY the HTML. No markdown, no explanation, no code fences.
- The HTML must be a complete document with <!DOCTYPE html>, <html>, <head>, and <body>.
- Include all CSS inline in a <style> tag in the <head>. Do NOT use external stylesheets (except Google Fonts).
- Include all JavaScript inline in a <script> tag before </body>.
- Use modern CSS (flexbox, grid, custom properties, gradients, animations, transitions).
- Make the design visually stunning, polished, and professional.
- The page must be fully responsive and work on mobile, tablet, and desktop.
- Use Google Fonts via @import for polished typography.
- Add subtle animations and micro-interactions (hover effects, transitions, loading states).
- If product images are needed, use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with a unique descriptive keyword per product.
- The storefront must feel complete and production-ready.
- Shopping cart must use localStorage for persistence.
- All interactive features must be fully functional with vanilla JavaScript.
- Include proper form validation for checkout forms.
- Product listing must support both grid and list view toggles.
- Product details should open in a modal overlay.${themeGuide}`;
}

function buildUserPrompt(data: EcommerceRequest): string {
  const productList = data.products
    .map(
      (p, i) =>
        `${i + 1}. "${p.name}" - $${p.price.toFixed(2)}${p.description ? ` - ${p.description}` : ""}`
    )
    .join("\n");

  const featureDescriptions: Record<string, string> = {
    "shopping-cart":
      "Fully functional shopping cart with add/remove items, quantity adjustment, and cart total. Persist cart in localStorage.",
    checkout:
      "Complete checkout form with fields for name, email, address, city, state, zip, and card details. Include real-time form validation with error messages.",
    "product-search":
      "Live search bar that filters products by name and description as the user types.",
    "product-filters":
      "Sidebar or top-bar filters for price range (min/max slider), and category filtering.",
    wishlist:
      "Wishlist/favorites functionality with heart icon toggle on each product. Persist in localStorage.",
    reviews:
      "Product review section with star ratings display, review count, and sample reviews for each product.",
    "inventory-tracking":
      "Show stock status badges (In Stock, Low Stock, Out of Stock) on each product.",
    "discount-codes":
      'Discount code input in the cart/checkout that applies percentage discounts. Include a sample working code "SAVE10" for 10% off.',
    "shipping-calculator":
      "Shipping cost calculator based on order subtotal (free over $50, flat rate $5.99 otherwise).",
    "order-tracking":
      "After checkout, show an order confirmation page with a mock order number and tracking timeline.",
  };

  const featuresText = data.features
    .map((f) => `- ${f}: ${featureDescriptions[f] || f}`)
    .join("\n");

  return `Build a complete e-commerce storefront for a "${data.businessType}" business.

Products to include:
${productList}

Required features:
${featuresText}

The storefront must include:
1. A header with store name, navigation, search (if enabled), and cart icon with item count badge.
2. A product listing page with both grid and list view toggle options.
3. Product cards showing image, name, price, and quick-add-to-cart button.
4. Product detail modals that open when clicking a product, showing full description, larger image, and add-to-cart with quantity selector.
5. All selected features must be fully implemented and functional.
6. A footer with store info and links.
7. Smooth transitions and animations throughout.

Make it production-quality with attention to spacing, typography, color harmony, and user experience.`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const body = await req.json();
    const { businessType, products, features, theme } = body as EcommerceRequest;

    if (!businessType || typeof businessType !== "string") {
      return NextResponse.json(
        { error: "businessType is required and must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    for (const product of products) {
      if (!product.name || typeof product.name !== "string") {
        return NextResponse.json(
          { error: "Each product must have a name" },
          { status: 400 }
        );
      }
      if (typeof product.price !== "number" || product.price < 0) {
        return NextResponse.json(
          { error: `Invalid price for product "${product.name}"` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: "At least one feature is required" },
        { status: 400 }
      );
    }

    const invalidFeatures = features.filter((f) => !VALID_FEATURES.includes(f));
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        { error: `Invalid features: ${invalidFeatures.join(", ")}` },
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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 32000,
      system: buildSystemPrompt(theme),
      messages: [
        {
          role: "user",
          content: buildUserPrompt({ businessType, products, features, theme }),
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

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    // Inject component library CSS for consistent styling
    if (!html.includes("ZOOBICON COMPONENT LIBRARY")) {
      html = injectComponentLibrary(html);
    }

    return NextResponse.json({
      html,
      productCount: products.length,
      featuresIncluded: features,
    });
  } catch (err) {
    console.error("E-commerce generation error:", err);

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
