import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkWithFallback } from "@/lib/opensrs";

// ---------------------------------------------------------------------------
// POST /api/domains/fragment
// Body: { fragment: string, description?: string, tld?: string, count?: number, comOnly?: boolean }
//
// Generates N domain candidates that CONTAIN the given fragment as a
// prefix, suffix, or embedded word, then checks availability. By default
// checks only .com (because if .com is free, the others almost always are).
//
// Example: fragment="fit" → ["getfit.com", "fitly.com", "fitro.com",
//   "gofit.com", "fithub.com", "fitpeak.com", ...]
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TLD_PRICING: Record<string, number> = {
  com: 12.99,
  io: 39.99,
  ai: 69.99,
  dev: 14.99,
  app: 14.99,
  co: 29.99,
  sh: 24.99,
};

interface FragmentCandidate {
  name: string;
  pattern: "prefix" | "suffix" | "embedded" | "compound";
  why: string;
}

async function generateCandidates(
  fragment: string,
  description: string,
  count: number,
  signal: AbortSignal,
): Promise<FragmentCandidate[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const prompt = `You are a world-class domain name strategist. The user wants domain names that CONTAIN the fragment "${fragment}".

${description ? `Context: ${description}` : ""}

Generate ${count} distinct, brandable domain name candidates. Each must:
1. Contain "${fragment}" (case-insensitive) somewhere in the name
2. Be 4-14 characters total (no digits, no hyphens)
3. Sound like a real company/product name (not gibberish)
4. Mix patterns — use all four:
   - "prefix": fragment is at the start (e.g. ${fragment}ly, ${fragment}hub, ${fragment}core)
   - "suffix": fragment is at the end (e.g. get${fragment}, go${fragment}, my${fragment})
   - "embedded": fragment is in the middle or fused (e.g. a${fragment}o, o${fragment}ix)
   - "compound": fragment combined with a complementary real word (e.g. ${fragment}peak, ${fragment}labs, ${fragment}works)
5. Memorable, pronounceable, one or two syllables beyond the fragment.
6. Avoid common English words that sound generic ("best", "top", "pro", "plus", "123").
7. No obvious trademark collisions (skip anything that sounds like Google, Apple, Nike, etc.)

Return ONLY JSON, no prose:
{ "candidates": [{ "name": "...", "pattern": "prefix|suffix|embedded|compound", "why": "one short reason" }, ...] }`;

  const resp = await client.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      temperature: 0.85,
      messages: [{ role: "user", content: prompt }],
    },
    { signal },
  );

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty response from model");
  }
  const match = textBlock.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model returned non-JSON output");

  const parsed = JSON.parse(match[0]) as { candidates?: FragmentCandidate[] };
  const candidates = parsed.candidates ?? [];

  const fragLower = fragment.toLowerCase().replace(/[^a-z0-9]/g, "");
  const seen = new Set<string>();
  return candidates
    .map((c) => ({
      ...c,
      name: c.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    }))
    .filter((c) => {
      if (!c.name || c.name.length < 4 || c.name.length > 18) return false;
      if (!c.name.includes(fragLower)) return false;
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
}

async function checkBatch(
  domains: Array<{ name: string; tld: string }>,
  concurrency: number,
  budgetMs: number,
): Promise<Map<string, boolean | null>> {
  const out = new Map<string, boolean | null>();
  let cursor = 0;
  const run = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= domains.length) return;
      const { name, tld } = domains[idx];
      const full = `${name}.${tld}`;
      try {
        const avail = await checkWithFallback(full);
        out.set(full, avail);
      } catch {
        out.set(full, null);
      }
    }
  };
  const workers = Promise.all(
    Array.from({ length: Math.min(concurrency, domains.length) }, run),
  );
  const budget = new Promise<void>((resolve) => setTimeout(resolve, budgetMs));
  await Promise.race([workers, budget]);
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.fragment !== "string") {
      return NextResponse.json(
        { error: "Body must be { fragment: string, description?: string, tld?: string, count?: number, comOnly?: boolean }" },
        { status: 400 },
      );
    }

    const fragment = body.fragment.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (fragment.length < 2 || fragment.length > 12) {
      return NextResponse.json(
        { error: "Fragment must be 2–12 alphanumeric characters." },
        { status: 400 },
      );
    }

    const description = typeof body.description === "string" ? body.description.slice(0, 300) : "";
    const count = Math.min(Math.max(Number(body.count) || 24, 6), 40);
    const comOnly = body.comOnly !== false; // default TRUE
    const tlds: string[] = comOnly
      ? ["com"]
      : Array.isArray(body.tlds) && body.tlds.length > 0
        ? (body.tlds as string[]).slice(0, 6)
        : ["com", "ai", "io"];

    const gen = new AbortController();
    const genTimer = setTimeout(() => gen.abort(), 20_000);
    let candidates: FragmentCandidate[];
    try {
      candidates = await generateCandidates(fragment, description, count, gen.signal);
    } finally {
      clearTimeout(genTimer);
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "Model produced no valid candidates. Try a shorter or more distinctive fragment." },
        { status: 502 },
      );
    }

    const checks: Array<{ name: string; tld: string }> = [];
    for (const c of candidates) {
      for (const tld of tlds) checks.push({ name: c.name, tld });
    }

    const availability = await checkBatch(checks, 8, 11_000);

    const results = candidates.map((c) => {
      const tldResults = tlds.map((tld) => {
        const full = `${c.name}.${tld}`;
        const avail = availability.get(full) ?? null;
        return {
          domain: full,
          tld,
          available: avail,
          price: TLD_PRICING[tld] ?? 14.99,
        };
      });
      const anyAvailable = tldResults.some((r) => r.available === true);
      return {
        name: c.name,
        pattern: c.pattern,
        why: c.why,
        tlds: tldResults,
        anyAvailable,
      };
    });

    // Sort: any-available first, then unknown, then all-taken
    results.sort((a, b) => {
      const aScore = a.anyAvailable
        ? 0
        : a.tlds.some((t) => t.available === null)
          ? 1
          : 2;
      const bScore = b.anyAvailable
        ? 0
        : b.tlds.some((t) => t.available === null)
          ? 1
          : 2;
      return aScore - bScore;
    });

    return NextResponse.json({
      fragment,
      tlds,
      comOnly,
      candidates: results,
      count: results.length,
      available: results.filter((r) => r.anyAvailable).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
