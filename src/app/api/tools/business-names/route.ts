import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/business-names
 *
 * Generates creative business names using AI.
 * Free tool — no auth required (rate limited by IP).
 *
 * Body: { description: string, industry?: string, style?: string, count?: number }
 * Returns: { names: Array<{ name: string, tagline: string }> }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, industry, style, count } = body;

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your business (at least 3 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: generate names without AI (simple word combinations)
      return NextResponse.json({ names: generateFallbackNames(description, count || 20) });
    }

    const nameCount = Math.min(count || 20, 30);
    const styleDesc = style === "classic" ? "established, professional, trustworthy"
      : style === "playful" ? "fun, energetic, approachable, witty"
      : style === "minimal" ? "short, clean, one-word or two-word, modern"
      : "modern, tech-forward, innovative, sharp";

    const industryContext = industry ? ` in the ${industry} industry` : "";

    const prompt = `Generate exactly ${nameCount} creative, brandable business names for: "${description.trim()}"${industryContext}.

Style: ${styleDesc}

Rules:
- Names should be 1-3 words maximum
- Must be easy to spell and pronounce
- Should work as a domain name (no spaces, hyphens ok sparingly)
- Include a mix: invented words, compound words, metaphors, abbreviations
- Each name gets a short tagline (5-10 words) explaining the vibe
- Do NOT suggest generic names like "TechSolutions" or "BestService"
- Be creative — think Spotify, Airbnb, Canva, Stripe, Notion level naming

Output ONLY a JSON array, no markdown, no explanation:
[{"name": "BrandName", "tagline": "Short catchy tagline here"}, ...]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("[Business Names] API error:", res.status);
      return NextResponse.json({ names: generateFallbackNames(description, nameCount) });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || "";

    // Parse JSON response
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ names: generateFallbackNames(description, nameCount) });
    }

    try {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json({
          names: parsed.slice(0, nameCount).map((n: { name?: string; tagline?: string }) => ({
            name: String(n.name || "").trim(),
            tagline: String(n.tagline || "").trim(),
          })).filter((n: { name: string }) => n.name.length > 0),
        });
      }
    } catch {
      // Parse failed
    }

    return NextResponse.json({ names: generateFallbackNames(description, nameCount) });
  } catch (err) {
    console.error("[Business Names] Error:", err);
    return NextResponse.json(
      { error: "Name generation failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Fallback name generator when API is unavailable.
 * Combines prefixes, roots from description, and suffixes.
 */
function generateFallbackNames(description: string, count: number) {
  const words = description.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(w => w.length > 3);
  const roots = words.slice(0, 5);
  const prefixes = ["Nova", "Apex", "Flux", "Velo", "Aura", "Zenn", "Peak", "Bold", "Pure", "Hive", "Vine", "Sage", "Cove", "Drift", "Ember", "Forge", "Glow", "Spark", "Bloom", "Orbit"];
  const suffixes = ["ly", "ify", "hub", "lab", "base", "flow", "mind", "craft", "works", "space", "stack", "edge", "sync", "wave", "path", "core", "link", "nest", "leap", "grid"];

  const names: Array<{ name: string; tagline: string }> = [];
  const used = new Set<string>();

  for (let i = 0; i < count && i < 30; i++) {
    let name: string;
    const method = i % 4;

    if (method === 0 && roots.length > 0) {
      const root = roots[i % roots.length];
      const suffix = suffixes[i % suffixes.length];
      name = root.charAt(0).toUpperCase() + root.slice(1) + suffix;
    } else if (method === 1) {
      name = prefixes[i % prefixes.length] + (roots.length > 0 ? roots[i % roots.length].charAt(0).toUpperCase() + roots[i % roots.length].slice(1) : suffixes[i % suffixes.length]);
    } else if (method === 2) {
      name = prefixes[(i + 7) % prefixes.length];
    } else {
      const p = prefixes[(i + 3) % prefixes.length];
      const s = suffixes[(i + 5) % suffixes.length];
      name = p + s;
    }

    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      names.push({ name, tagline: `A fresh take on ${description.slice(0, 40)}` });
    }
  }

  return names;
}
