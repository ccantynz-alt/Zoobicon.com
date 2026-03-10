import { NextRequest, NextResponse } from "next/server";

/**
 * AI Image Engine — replaces placeholder images with contextually relevant ones.
 *
 * Phase 1 (current): Uses Unsplash API for high-quality, relevant photos based on
 * semantic analysis of the page content.
 *
 * Phase 2 (future): Integrate with image generation APIs (DALL-E, Stability AI)
 * for truly custom, unique images.
 *
 * POST /api/generate/images
 * Body: { html: string, style?: "photo" | "illustration" | "minimal" }
 * Returns: { html: string, replacements: Array<{ original: string, replacement: string, query: string }> }
 */

interface ImageReplacement {
  original: string;
  replacement: string;
  query: string;
}

function extractPlaceholderImages(html: string): string[] {
  // Match both seeded URLs (picsum.photos/seed/KEYWORD/WIDTH/HEIGHT) and bare URLs (picsum.photos/WIDTH/HEIGHT)
  const pattern = /https?:\/\/picsum\.photos\/(?:seed\/[a-zA-Z0-9_-]+\/)\d+(?:\/\d+)?|https?:\/\/picsum\.photos\/\d+(?:\/\d+)?/g;
  const matches = html.match(pattern);
  return matches ? [...new Set(matches)] : [];
}

function extractPageContext(html: string): string[] {
  const keywords: string[] = [];

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) keywords.push(titleMatch[1].trim());

  // Extract h1-h3 text
  const headingPattern = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
  let match;
  while ((match = headingPattern.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 2 && text.length < 100) keywords.push(text);
  }

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (metaMatch) keywords.push(metaMatch[1].trim());

  // Extract alt text from images
  const altPattern = /alt=["']([^"']+)["']/gi;
  while ((match = altPattern.exec(html)) !== null) {
    if (match[1].trim().length > 2) keywords.push(match[1].trim());
  }

  return keywords;
}

function generateSearchQuery(context: string[], imageIndex: number): string {
  // Map common business types to relevant image queries
  const businessKeywords: Record<string, string[]> = {
    restaurant: ["restaurant interior", "gourmet food plating", "chef cooking", "dining ambiance"],
    dental: ["modern dental office", "dentist patient smile", "dental technology", "clean medical office"],
    fitness: ["gym workout", "fitness training", "yoga studio", "athletic person exercising"],
    tech: ["modern office workspace", "technology abstract", "team collaboration", "startup office"],
    real_estate: ["luxury home interior", "modern architecture", "property exterior", "living room design"],
    ecommerce: ["product photography", "online shopping", "retail store", "fashion lifestyle"],
    education: ["students learning", "modern classroom", "books library", "university campus"],
    travel: ["travel destination", "scenic landscape", "luxury hotel", "adventure outdoors"],
    medical: ["modern hospital", "healthcare professional", "medical technology", "wellness"],
    legal: ["law office", "professional handshake", "courthouse", "business meeting"],
    salon: ["hair salon interior", "beauty treatment", "spa wellness", "cosmetics"],
    automotive: ["car showroom", "automotive repair", "luxury vehicle", "mechanic workshop"],
    transport: ["shuttle bus service", "airport shuttle van", "passenger transportation", "chauffeur driving"],
    shuttle: ["airport shuttle van", "passenger shuttle bus", "travel transportation service", "professional driver"],
    taxi: ["taxi cab service", "ride service vehicle", "professional chauffeur", "airport pickup"],
    logistics: ["delivery fleet trucks", "logistics warehouse", "shipping transportation", "cargo delivery"],
  };

  const contextStr = context.join(" ").toLowerCase();

  // Find matching business type
  for (const [type, queries] of Object.entries(businessKeywords)) {
    if (contextStr.includes(type) || contextStr.includes(type.replace("_", " "))) {
      return queries[imageIndex % queries.length];
    }
  }

  // Generic professional queries as fallback
  const genericQueries = [
    "professional business",
    "modern workspace",
    "team collaboration",
    "abstract technology",
    "creative design",
    "urban architecture",
    "nature landscape",
    "professional portrait",
  ];

  // Use context keywords to build a more specific query
  if (context.length > 0) {
    const mainKeyword = context[0].split(" ").slice(0, 3).join(" ");
    return `${mainKeyword} professional`;
  }

  return genericQueries[imageIndex % genericQueries.length];
}

function parseDimensions(url: string): { width: number; height: number } {
  // Handle seeded URLs: picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
  const seededMatch = url.match(/picsum\.photos\/seed\/[^/]+\/(\d+)(?:\/(\d+))?/);
  if (seededMatch) {
    const width = parseInt(seededMatch[1], 10);
    const height = seededMatch[2] ? parseInt(seededMatch[2], 10) : width;
    return { width, height };
  }
  // Handle bare URLs: picsum.photos/WIDTH/HEIGHT
  const match = url.match(/picsum\.photos\/(\d+)(?:\/(\d+))?/);
  if (match) {
    const width = parseInt(match[1], 10);
    const height = match[2] ? parseInt(match[2], 10) : width;
    return { width, height };
  }
  return { width: 800, height: 600 };
}

export async function POST(req: NextRequest) {
  try {
    const { html, style = "photo" } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    const placeholders = extractPlaceholderImages(html);

    if (placeholders.length === 0) {
      return NextResponse.json({
        html,
        replacements: [],
        message: "No placeholder images found",
      });
    }

    const context = extractPageContext(html);
    const replacements: ImageReplacement[] = [];
    let updatedHtml = html;

    // Check if Unsplash API key is available
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    for (let i = 0; i < placeholders.length; i++) {
      const original = placeholders[i];
      const { width, height } = parseDimensions(original);
      const query = generateSearchQuery(context, i);

      let replacement: string;

      if (unsplashKey) {
        // Use Unsplash API for high-quality contextual images
        try {
          const params = new URLSearchParams({
            query,
            w: String(width),
            h: String(height),
            fit: "crop",
            auto: "format",
            q: "80",
          });

          const searchParams = new URLSearchParams({
            query,
            per_page: "1",
            orientation: width > height ? "landscape" : height > width ? "portrait" : "squarish",
          });

          const res = await fetch(
            `https://api.unsplash.com/search/photos?${searchParams.toString()}`,
            {
              headers: { Authorization: `Client-ID ${unsplashKey}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const photo = data.results[0];
              replacement = `${photo.urls.raw}&w=${width}&h=${height}&fit=crop&auto=format&q=80`;
            } else {
              replacement = `https://images.unsplash.com/photo-1497366216548-37526070297c?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
            }
          } else {
            replacement = `https://images.unsplash.com/photo-1497366216548-37526070297c?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
          }
        } catch {
          replacement = `https://images.unsplash.com/photo-1497366216548-37526070297c?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
        }
      } else {
        // Fallback: use Unsplash source (no API key needed, less control)
        const encodedQuery = encodeURIComponent(query);
        replacement = `https://images.unsplash.com/photo-1497366216548-37526070297c?w=${width}&h=${height}&fit=crop&auto=format&q=80&s=${encodedQuery}`;

        // Better fallback: use picsum with specific seed for consistency
        // but upgrade to Unsplash source URLs for better quality
        const styleMap: Record<string, string> = {
          photo: `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`,
          illustration: `https://source.unsplash.com/${width}x${height}/?${encodedQuery},illustration`,
          minimal: `https://source.unsplash.com/${width}x${height}/?${encodedQuery},minimal`,
        };
        replacement = styleMap[style] || styleMap.photo;
      }

      replacements.push({ original, replacement, query });
      // Replace all instances of this placeholder URL
      updatedHtml = updatedHtml.split(original).join(replacement);
    }

    return NextResponse.json({
      html: updatedHtml,
      replacements,
      imageCount: replacements.length,
    });
  } catch (err) {
    console.error("Image engine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
