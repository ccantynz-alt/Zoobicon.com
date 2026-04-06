import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI domain/business name generator.
 * POST { description, style?, count?, tlds? }
 * Returns { names: Array<{ name: string; slug: string; tagline: string }> }
 *
 * Uses Claude Haiku for speed. Falls back to a deterministic generator if
 * ANTHROPIC_API_KEY is missing so the UI still shows useful results.
 */

interface GeneratedName {
  name: string;
  slug: string;
  tagline: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

function fallbackNames(description: string, count: number): GeneratedName[] {
  const roots = description
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const prefixes = ["Bright", "Nova", "Lumen", "Pulse", "Vivid", "Echo", "Orbit", "Crest", "Summit", "Halo"];
  const suffixes = ["Labs", "Works", "Hub", "Studio", "Collective", "HQ", "Lab", "Forge", "Co", "Pro"];
  const out: GeneratedName[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const root = roots[i % Math.max(roots.length, 1)] || "venture";
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const name = i < 5 ? `${prefix}${root.charAt(0).toUpperCase() + root.slice(1)}` : `${prefix}${suffix}`;
    out.push({
      name,
      slug: slugify(name),
      tagline: `For ${description.slice(0, 60)}`,
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = (body.description || "").toString().trim();
    const style: string = (body.style || "modern").toString();
    const count: number = Math.min(Math.max(parseInt(body.count || "20", 10) || 20, 5), 30);

    if (description.length < 3) {
      return NextResponse.json(
        { error: "Please describe your business in at least 3 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[domains/generate] ANTHROPIC_API_KEY missing — using fallback");
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback" });
    }

    const client = new Anthropic({ apiKey });

    const system = `You are a brand naming expert. Generate ${count} unique, memorable business names in the "${style}" style for this business:

"${description}"

Rules:
- Each name must be 1-2 words, 4-18 characters, pronounceable, brandable
- No hyphens, numbers, or special characters
- Avoid generic words (Global, Solutions, Services, Systems)
- Each name must be DISTINCT from the others (different letters, vibe, length)
- Include a short 4-8 word tagline for each

Return ONLY a JSON array, no markdown, no explanation:
[{"name":"Lumenpath","tagline":"Illuminate your next journey"}, ...]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: `Generate ${count} names now. JSON array only.` }],
    });

    const textBlock = message.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    const text = textBlock?.text || "";

    // Extract JSON array from response
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) {
      console.warn("[domains/generate] no JSON array in response");
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback-parse" });
    }

    let parsed: Array<{ name: string; tagline?: string }> = [];
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback-parse" });
    }

    const names: GeneratedName[] = parsed
      .filter((n) => n && typeof n.name === "string" && /^[a-zA-Z]{3,20}$/.test(n.name.replace(/\s+/g, "")))
      .map((n) => ({
        name: n.name.trim(),
        slug: slugify(n.name),
        tagline: (n.tagline || "").toString().slice(0, 100) || "Build something remarkable",
      }))
      .slice(0, count);

    if (names.length === 0) {
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback-empty" });
    }

    return NextResponse.json({ names, source: "claude" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Name generation failed";
    console.error("[domains/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
