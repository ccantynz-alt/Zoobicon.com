// ---------------------------------------------------------------------------
// Trademark risk assessment for candidate domain names.
//
// Public trademark databases (USPTO, EUIPO, IPONZ, WIPO) each have their
// own clunky API + quota + auth story, and none cover common-law marks or
// "confusingly similar" cases that actually get companies sued. A string
// match against USPTO misses that "Starbux" is a disaster but "Kovari" is
// fine — the real risk signal is intelligence, not a SQL LIKE.
//
// So: Haiku does the heavy lifting (trained on the world's brand index),
// a hardcoded blocklist catches the top-500 household names as a safety
// net, and callers get a structured verdict + reason for the UI pill.
//
// Verdicts:
//   clear   — no known conflict, safe to proceed
//   flagged — likely conflict (identical or confusingly similar to a
//             well-known mark) — user should talk to a lawyer
//   caution — descriptive term, common word, or generic — harder to
//             register but not a clear infringement
//   unknown — the check failed (model down, timeout) — do not block
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";

export type TrademarkVerdict = "clear" | "flagged" | "caution" | "unknown";

export interface TrademarkResult {
  name: string;
  verdict: TrademarkVerdict;
  reason: string;
  conflictingMark?: string;
  source: "blocklist" | "ai" | "fallback";
}

// Top household brands — if a candidate name matches one of these
// directly (case-insensitive, with common coinage suffixes stripped)
// we flag without burning an AI round-trip. This is a safety net, not
// the primary check.
const HARD_BLOCKLIST = new Set([
  "google",
  "apple",
  "amazon",
  "microsoft",
  "meta",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "youtube",
  "netflix",
  "disney",
  "spotify",
  "uber",
  "lyft",
  "airbnb",
  "stripe",
  "paypal",
  "visa",
  "mastercard",
  "nike",
  "adidas",
  "puma",
  "coca-cola",
  "cocacola",
  "pepsi",
  "starbucks",
  "mcdonalds",
  "tesla",
  "ford",
  "toyota",
  "bmw",
  "mercedes",
  "ferrari",
  "porsche",
  "sony",
  "samsung",
  "intel",
  "nvidia",
  "amd",
  "openai",
  "anthropic",
  "claude",
  "chatgpt",
  "gemini",
  "deepmind",
  "ibm",
  "oracle",
  "salesforce",
  "adobe",
  "slack",
  "discord",
  "zoom",
  "shopify",
  "wordpress",
  "squarespace",
  "wix",
  "godaddy",
  "namecheap",
  "cloudflare",
  "vercel",
  "github",
  "gitlab",
  "bitbucket",
  "atlassian",
  "jira",
  "figma",
  "canva",
  "notion",
  "airtable",
  "dropbox",
  "box",
  "snowflake",
  "databricks",
  "palantir",
  "reddit",
  "pinterest",
  "snapchat",
  "whatsapp",
  "telegram",
  "signal",
  "twitch",
  "paypal",
  "wise",
  "revolut",
  "robinhood",
  "coinbase",
  "binance",
  "huobi",
  "kraken",
  "ripple",
  "solana",
  "ethereum",
  "bitcoin",
  "heygen",
  "lovable",
  "bolt",
  "replicate",
  "runway",
  "midjourney",
  "stability",
  "elevenlabs",
  "descript",
  "captions",
  "capcut",
  "invideo",
  "filmora",
  "wondershare",
  "hedra",
  "synthesia",
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(app|ai|io|hq|lab|labs|co|inc|corp)$/i, "");
}

function checkBlocklist(name: string): TrademarkResult | null {
  const normalized = normalize(name);
  if (HARD_BLOCKLIST.has(normalized)) {
    return {
      name,
      verdict: "flagged",
      reason: `"${normalized}" is an exact match for a well-known global trademark. Registering this would invite legal action.`,
      conflictingMark: normalized,
      source: "blocklist",
    };
  }
  // Strict substring check for major brands inside the coinage
  for (const brand of HARD_BLOCKLIST) {
    if (brand.length >= 5 && normalized.includes(brand)) {
      return {
        name,
        verdict: "flagged",
        reason: `Contains "${brand}", a major trademark. Derivative use is still infringement.`,
        conflictingMark: brand,
        source: "blocklist",
      };
    }
  }
  return null;
}

interface AiTrademarkJudgment {
  verdict: TrademarkVerdict;
  reason: string;
  conflictingMark?: string;
}

async function judgeWithAi(
  names: string[],
  signal: AbortSignal,
): Promise<Map<string, AiTrademarkJudgment>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Map();

  const client = new Anthropic({ apiKey });
  const prompt = `You are a trademark conflict screener. For each candidate brand name below, decide whether using it as a company/product name and domain would risk trademark infringement or confusion with a well-known brand.

Candidates:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}

For each candidate, return:
- verdict: "clear" (no conflict), "flagged" (identical or confusingly similar to a well-known mark), or "caution" (generic/descriptive, harder to register but not infringing)
- reason: one sentence, plain English
- conflictingMark: only if flagged — the brand it conflicts with

Rules:
- You are NOT giving legal advice. You are flagging obvious risk.
- "Flagged" means the name is the same as, sounds like, or is clearly derivative of a famous brand (e.g. "Starbux" → Starbucks, "Goolge" → Google).
- "Caution" means the name is a common dictionary word or descriptive phrase that would be hard to register but isn't infringement.
- "Clear" is the default. Most invented words are clear.
- Be strict on flags — false positives are better than missing a real conflict.

Return ONLY a JSON object with this exact shape, no prose:
{ "results": [{ "name": "...", "verdict": "clear|flagged|caution", "reason": "...", "conflictingMark": "..." }, ...] }`;

  try {
    const resp = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );
    const textBlock = resp.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return new Map();
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (!match) return new Map();
    const parsed = JSON.parse(match[0]) as {
      results?: Array<{
        name: string;
        verdict: TrademarkVerdict;
        reason: string;
        conflictingMark?: string;
      }>;
    };
    const out = new Map<string, AiTrademarkJudgment>();
    for (const r of parsed.results ?? []) {
      out.set(normalize(r.name), {
        verdict: r.verdict,
        reason: r.reason,
        conflictingMark: r.conflictingMark,
      });
    }
    return out;
  } catch {
    return new Map();
  }
}

export async function assessTrademarks(
  names: string[],
  opts: { timeoutMs?: number } = {},
): Promise<TrademarkResult[]> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (unique.length === 0) return [];

  const blocklistHits = new Map<string, TrademarkResult>();
  const needAi: string[] = [];
  for (const n of unique) {
    const hit = checkBlocklist(n);
    if (hit) {
      blocklistHits.set(normalize(n), hit);
    } else {
      needAi.push(n);
    }
  }

  let aiJudgments: Map<string, AiTrademarkJudgment> = new Map();
  if (needAi.length > 0) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 12_000);
    try {
      aiJudgments = await judgeWithAi(needAi, ac.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  return unique.map((n) => {
    const norm = normalize(n);
    const hit = blocklistHits.get(norm);
    if (hit) return hit;
    const ai = aiJudgments.get(norm);
    if (ai) {
      return {
        name: n,
        verdict: ai.verdict,
        reason: ai.reason,
        conflictingMark: ai.conflictingMark,
        source: "ai" as const,
      };
    }
    return {
      name: n,
      verdict: "unknown" as const,
      reason: "Trademark screener unavailable. Do your own check before registering.",
      source: "fallback" as const,
    };
  });
}
