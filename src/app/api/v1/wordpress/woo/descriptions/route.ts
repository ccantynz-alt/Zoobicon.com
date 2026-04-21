import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 90;

interface ProductInput {
  name: string;
  category?: string;
  current_description?: string;
}

interface ProductOutput {
  name: string;
  description: string;
  short_description: string;
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return apiError(400, "missing_products", "products array is required and must not be empty");
    }

    const cappedProducts = (products as ProductInput[]).slice(0, 20); // cap at 20 to stay within token limits

    const systemPrompt = `You are an expert eCommerce copywriter specializing in WooCommerce product descriptions.
For each product, write:
1. A full description (150-300 words) — benefit-focused, engaging, covers features and use cases, uses <p> and <ul> HTML tags
2. A short description (1-2 sentences, 20-40 words) — punchy summary for product listings

Return ONLY valid JSON array with this structure — no markdown, no explanation:
[
  {
    "name": "<product name>",
    "description": "<full HTML description>",
    "short_description": "<short plain text description>"
  }
]
Match the exact product names provided. Generate descriptions that convert browsers into buyers.`;

    const productList = cappedProducts.map(p =>
      `Product: ${p.name}${p.category ? ` (Category: ${p.category})` : ""}${p.current_description ? `\nCurrent description: ${p.current_description.substring(0, 200)}` : ""}`
    ).join("\n\n");

    const response = await callAI(systemPrompt, productList, Math.min(4000, cappedProducts.length * 300 + 200));

    let results: ProductOutput[];
    try {
      results = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // Fallback: generate simple descriptions for each product
      results = cappedProducts.map(p => ({
        name: p.name,
        description: `<p>${p.name} is a premium quality product${p.category ? ` in the ${p.category} category` : ""}. Designed to meet your needs with exceptional quality and value.</p>`,
        short_description: `${p.name} — premium quality${p.category ? ` ${p.category} product` : ""}.`,
      }));
    }

    if (!Array.isArray(results)) results = [];

    return apiResponse({ products: results });
  } catch (error) {
    console.error("[wp-woo-descriptions]", error);
    return apiError(500, "description_failed", "Product description generation failed");
  }
}
