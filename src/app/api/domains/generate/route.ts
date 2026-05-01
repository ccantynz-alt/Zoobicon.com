import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Up to 100 names with diversity prompts adds latency. Keep maxDuration well
// above the 45s Anthropic budget so a slow upstream can never hang the UI.
export const maxDuration = 60;

/**
 * AI domain/business name generator.
 *
 * POST {
 *   description,            // required, business description
 *   count?,                 // 5..100, default 25
 *   wordCount?,             // 1 | 2 | "either" — force one-word or two-word names
 *   length?,                // "short" (≤6 chars) | "any"
 *   wordType?,              // "real" | "invented" | "either"
 *   style?,                 // free-form style descriptor (legacy)
 * }
 *
 * Returns { names: Array<{ name, slug, tagline }>, source }
 *
 * Uses Claude Sonnet for quality. Falls back to a deterministic generator if
 * ANTHROPIC_API_KEY is missing or upstream times out so the UI still renders.
 */

interface GeneratedName {
  name: string;
  slug: string;
  tagline: string;
}

type WordCount = 1 | 2 | "either";
type LengthMode = "short" | "any";
type WordType = "real" | "invented" | "either";

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

function buildConstraints(
  wordCount: WordCount,
  length: LengthMode,
  wordType: WordType,
): { systemBullets: string[]; nameRegex: RegExp } {
  const bullets: string[] = [];

  if (wordCount === 1) {
    bullets.push("EVERY name MUST be a SINGLE WORD — no spaces, no compound words written as two");
  } else if (wordCount === 2) {
    bullets.push("Each name should be TWO words combined into one (a portmanteau or compound)");
  } else {
    bullets.push("Names should be 1-2 words, joined with no spaces, pronounceable as a single brand");
  }

  if (length === "short") {
    bullets.push("STRICT length: 4-6 characters total. Short, punchy, memorable. Like Notion, Stripe, Loom, Figma, Linear, Mercury, Quill, Sage");
  } else {
    bullets.push("Length: 4-18 characters total");
  }

  if (wordType === "real") {
    bullets.push("Use REAL English (or Latin/Greek-rooted) dictionary words ONLY — evocative concepts, objects, or metaphors. Examples: Quill, Mercury, Atlas, Ember, Forge, Helix, Sage, Pulse, Mint, Anchor");
  } else if (wordType === "invented") {
    bullets.push("Use INVENTED words ONLY — coined portmanteaus, modified roots, or fully made-up brandable strings. Examples: Lumenly, Quartix, Verbio, Nexora, Pelica, Krelo, Vexora");
  } else {
    bullets.push("Mix of real evocative words AND invented portmanteaus is welcome");
  }

  bullets.push("No hyphens, numbers, or special characters — letters only");
  bullets.push("Avoid tired generics: Global, Solutions, Services, Systems, Tech, Digital, AI, Smart, Pro, Plus, Hub, Hubly");
  bullets.push("Every name must feel DISTINCT from the others — different starting letters, different syllable counts, different energy");
  bullets.push("Aim for names that feel premium and memorable — the kind a $10M startup would actually register");

  // Regex for server-side validation matching the prompt constraints.
  const minLen = length === "short" ? 4 : 3;
  const maxLen = length === "short" ? 6 : 20;
  const nameRegex = new RegExp(`^[a-zA-Z]{${minLen},${maxLen}}$`);

  return { systemBullets: bullets, nameRegex };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = (body.description || "").toString().trim();
    const style: string = (body.style || "modern").toString();
    const count: number = Math.min(Math.max(parseInt(body.count || "25", 10) || 25, 5), 100);

    const wordCountRaw = body.wordCount;
    const wordCount: WordCount =
      wordCountRaw === 1 || wordCountRaw === "1" ? 1
      : wordCountRaw === 2 || wordCountRaw === "2" ? 2
      : "either";

    const length: LengthMode = body.length === "short" ? "short" : "any";

    const wordType: WordType =
      body.wordType === "real" ? "real"
      : body.wordType === "invented" ? "invented"
      : "either";

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

    const { systemBullets, nameRegex } = buildConstraints(wordCount, length, wordType);

    const system = `You are a world-class brand strategist and naming expert. Generate ${count} extraordinary, highly original business names in the "${style}" style for this business:

"${description}"

Naming rules (strictly enforced):
${systemBullets.map((b) => `- ${b}`).join("\n")}
- Include a punchy 5-8 word tagline for each name

Return ONLY a JSON array — no markdown, no preamble, no explanation:
[{"name":"Quill","tagline":"Write the future of email"}, ...]`;

    // For higher counts request more output tokens. Each row is roughly 60-90
    // tokens so 100 names ≈ 9000 tokens of output. Cap at 12000 for safety.
    const maxTokens = Math.min(12000, Math.max(3000, count * 100));

    let message;
    try {
      message = await client.messages.create(
        {
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          system,
          messages: [
            {
              role: "user",
              content: `Generate ${count} extraordinary names NOW. JSON array only. Each name must be unique. Make sure every name strictly satisfies the rules.`,
            },
          ],
        },
        { signal: AbortSignal.timeout(45000) },
      );
    } catch (err) {
      console.warn(
        "[domains/generate] Anthropic call failed:",
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback-anthropic-error" });
    }

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

    // Dedupe by slug — Sonnet occasionally emits duplicates at high counts.
    const seen = new Set<string>();
    const names: GeneratedName[] = [];
    for (const n of parsed) {
      if (!n || typeof n.name !== "string") continue;
      const cleaned = n.name.trim().replace(/\s+/g, "");
      if (!nameRegex.test(cleaned)) continue;
      const slug = slugify(cleaned);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      names.push({
        name: cleaned,
        slug,
        tagline: (n.tagline || "").toString().slice(0, 100) || "Build something remarkable",
      });
      if (names.length >= count) break;
    }

    if (names.length === 0) {
      return NextResponse.json({ names: fallbackNames(description, count), source: "fallback-empty" });
    }

    return NextResponse.json({ names, source: "claude", returned: names.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Name generation failed";
    console.error("[domains/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
