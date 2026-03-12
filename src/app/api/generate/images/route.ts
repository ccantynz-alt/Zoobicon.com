import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/image-gen";

/**
 * AI Image Engine — replaces placeholder images with contextually relevant ones.
 *
 * Uses a multi-provider cascade:
 * 1. DALL-E 3 (if OPENAI_API_KEY set) — AI-generated custom images
 * 2. Stability AI SDXL (if STABILITY_API_KEY set) — alternative AI generation
 * 3. Unsplash API (if UNSPLASH_ACCESS_KEY set) — high-quality stock photos
 * 4. Curated Unsplash photos (no key needed) — hand-picked fallbacks
 *
 * POST /api/generate/images
 * Body: { html: string, style?: "photo" | "illustration" | "minimal", useAI?: boolean }
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
    const { html, style = "photo", useAI = false } = await req.json();

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

      // Try AI image generation if requested and API keys are available
      if (useAI && (process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY)) {
        try {
          const aiImage = await generateImage({
            prompt: `${query}, high quality professional ${style} for website`,
            width,
            height,
            style: style as "photo" | "illustration" | "3d" | "artistic",
            quality: "standard",
          });
          if (aiImage && aiImage.provider !== "placeholder") {
            replacement = aiImage.url;
            replacements.push({ original, replacement, query: `[AI:${aiImage.provider}] ${query}` });
            updatedHtml = updatedHtml.split(original).join(replacement);
            continue;
          }
        } catch {
          // Fall through to Unsplash
        }
      }

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
        // No Unsplash API key — use curated Unsplash photo IDs per category
        // These are hand-picked high-quality photos that match common business types
        const curatedPhotos: Record<string, string[]> = {
          "shuttle": [
            "photo-1544620347-c4fd4a3d5957", // white van on road
            "photo-1570125909232-eb263c188f7e", // bus on road
            "photo-1544620347-c4fd4a3d5957", // transport van
            "photo-1506521781263-d8422e82f27a", // airport terminal
          ],
          "airport": [
            "photo-1506521781263-d8422e82f27a", // airport terminal
            "photo-1436491865332-7a61a109db05", // airplane
            "photo-1529074766086-4aae35b4d7ad", // airport interior
            "photo-1488085061387-422e29b40080", // travel/plane
          ],
          "transport": [
            "photo-1544620347-c4fd4a3d5957", // van driving
            "photo-1570125909232-eb263c188f7e", // bus
            "photo-1549317661-bd32c8ce0832", // road trip
            "photo-1473042904451-00571b0401ea", // driver
          ],
          "restaurant": [
            "photo-1517248135467-4c7edcad34c4", // restaurant interior
            "photo-1414235077428-338989a2e8c0", // food plating
            "photo-1555396273-367ea4eb4db5", // restaurant dining
            "photo-1504674900247-0877df9cc836", // food close up
          ],
          "real_estate": [
            "photo-1600596542815-ffad4c1539a9", // luxury home
            "photo-1600585154340-be6161a56a0c", // modern interior
            "photo-1512917774080-9991f1c4c750", // house exterior
            "photo-1560448204-e02f11c3d0e2", // living room
          ],
          "dental": [
            "photo-1629909613654-28e377c37b09", // dental office
            "photo-1606811841689-23dfddce3e95", // smile
            "photo-1588776814546-1ffcf47267a5", // dental care
            "photo-1598256989800-fe5f95da9787", // dentist
          ],
          "legal": [
            "photo-1589829545856-d10d557cf95f", // law books
            "photo-1450101499163-c8848e968f93", // courthouse
            "photo-1507679799987-c73779587ccf", // business suit
            "photo-1521791055366-0d553872125f", // handshake
          ],
          "fitness": [
            "photo-1534438327276-14e5300c3a48", // gym
            "photo-1571019613454-1cb2f99b2d8b", // workout
            "photo-1518611012118-696072aa579a", // yoga
            "photo-1576678927484-cc907957088c", // fitness
          ],
          "tech": [
            "photo-1531297484001-80022131f5a1", // laptop workspace
            "photo-1518770660439-4636190af475", // circuit board
            "photo-1504384308090-c894fdcc538d", // tech abstract
            "photo-1522071820081-009f0129c71c", // team meeting
          ],
          "salon": [
            "photo-1560066984-138dadb4c035", // salon interior
            "photo-1522337360788-8b13dee7a37e", // beauty
            "photo-1487412720507-e7ab37603c6f", // hair styling
            "photo-1519699047748-de8e457a634e", // spa
          ],
        };

        // Find matching category from query
        const queryLower = query.toLowerCase();
        let photoIds: string[] | undefined;
        for (const [category, ids] of Object.entries(curatedPhotos)) {
          if (queryLower.includes(category)) {
            photoIds = ids;
            break;
          }
        }

        // Also check context for category matching
        if (!photoIds) {
          const contextLower = context.join(" ").toLowerCase();
          for (const [category, ids] of Object.entries(curatedPhotos)) {
            if (contextLower.includes(category)) {
              photoIds = ids;
              break;
            }
          }
        }

        if (photoIds) {
          const photoId = photoIds[i % photoIds.length];
          replacement = `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
        } else {
          // Generic professional fallback photos
          const genericPhotos = [
            "photo-1497366216548-37526070297c", // modern office
            "photo-1522071820081-009f0129c71c", // team collaboration
            "photo-1460925895917-afdab827c52f", // workspace
            "photo-1531973576160-7125cd663d86", // business meeting
            "photo-1454165804606-c3d57bc86b40", // analytics
            "photo-1552664730-d307ca884978", // teamwork
          ];
          const photoId = genericPhotos[i % genericPhotos.length];
          replacement = `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
        }
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
