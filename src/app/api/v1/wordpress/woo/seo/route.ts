import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 90;

interface ProductSeoInput {
  name: string;
  description?: string;
  url?: string;
}

interface ProductSeoOutput {
  name: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return apiError(400, "missing_products", "products array is required and must not be empty");
    }

    const cappedProducts = (products as ProductSeoInput[]).slice(0, 20);

    const systemPrompt = `You are an SEO expert specializing in WooCommerce product optimization.
For each product, generate:
1. meta_title — 50-60 characters, includes primary keyword, compelling, includes brand or product type
2. meta_description — 140-160 characters, includes call-to-action, mentions key benefits
3. keywords — 5-8 relevant search terms people use to find this product

Return ONLY valid JSON array — no markdown, no explanation:
[
  {
    "name": "<exact product name>",
    "meta_title": "<optimized title>",
    "meta_description": "<optimized description>",
    "keywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"]
  }
]
Focus on buyer-intent keywords. Avoid keyword stuffing. Each product must have unique meta tags.`;

    const productList = cappedProducts.map(p =>
      `Product: ${p.name}${p.url ? `\nURL: ${p.url}` : ""}${p.description ? `\nDescription: ${p.description.substring(0, 300)}` : ""}`
    ).join("\n\n");

    const response = await callAI(systemPrompt, productList, Math.min(3000, cappedProducts.length * 200 + 200));

    let results: ProductSeoOutput[];
    try {
      results = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // Fallback: generate basic SEO for each product
      results = cappedProducts.map(p => ({
        name: p.name,
        meta_title: p.name.substring(0, 60),
        meta_description: (p.description || p.name).substring(0, 155),
        keywords: [p.name.toLowerCase(), "buy", "online", "shop"],
      }));
    }

    if (!Array.isArray(results)) results = [];

    return apiResponse({ products: results });
  } catch (error) {
    console.error("[wp-woo-seo]", error);
    return apiError(500, "seo_failed", "Product SEO generation failed");
  }
}
