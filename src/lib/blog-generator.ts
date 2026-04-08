/**
 * AI Blog Post Generator
 *
 * Long-form SEO-optimized blog generation pipeline.
 * Powers the $39/mo content marketing add-on.
 *
 * Uses Anthropic Messages API directly via fetch (no SDK dependency required).
 * Sonnet primary, Haiku fallback. Per Bible Law 9: graceful fallbacks always.
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const MODEL_PRIMARY = "claude-sonnet-4-5";
const MODEL_FALLBACK = "claude-haiku-4-5-20251001";

const BANNED_WORDS = [
  "revolutionary",
  "unleash",
  "empower",
  "synergy",
  "next-generation",
  "game-changer",
  "leverage",
  "elevate",
];

export interface BlogGenRequest {
  topic: string;
  keywords?: string[];
  tone?: "professional" | "casual" | "technical" | "playful" | "authoritative";
  length?: "short" | "medium" | "long";
  audience?: string;
  callToAction?: string;
  outline?: string[];
}

export interface BlogPost {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  wordCount: number;
  readingTime: number;
  tags: string[];
  headings: string[];
  generatedAt: number;
  cost: number;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

const LENGTH_TARGETS: Record<NonNullable<BlogGenRequest["length"]>, number> = {
  short: 500,
  medium: 1200,
  long: 2500,
};

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY missing. Set this environment variable in Vercel to enable blog generation."
    );
  }
  return key;
}

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  const apiKey = requireApiKey();
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status} (${model}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const textBlock = data.content.find(
    (b): b is AnthropicTextBlock => b.type === "text" && typeof b.text === "string"
  );
  if (!textBlock) {
    throw new Error(`Anthropic API returned no text content (${model})`);
  }
  return {
    text: textBlock.text,
    model: data.model,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

async function callWithFallback(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  try {
    return await callAnthropic(MODEL_PRIMARY, systemPrompt, userPrompt, maxTokens);
  } catch (err) {
    console.warn(
      `[blog-generator] Primary model ${MODEL_PRIMARY} failed, falling back to ${MODEL_FALLBACK}:`,
      err instanceof Error ? err.message : err
    );
    return await callAnthropic(MODEL_FALLBACK, systemPrompt, userPrompt, maxTokens);
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function extractTitle(markdown: string): string {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "Untitled";
}

function stripTitle(markdown: string): string {
  return markdown.replace(/^#\s+.+$/m, "").trim();
}

function extractHeadings(markdown: string): string[] {
  const out: string[] = [];
  const re = /^(##|###)\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    out.push(m[2].trim());
  }
  return out;
}

function extractFirstParagraph(markdown: string): string {
  const body = stripTitle(markdown);
  const paras = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));
  if (paras.length === 0) return "";
  const first = paras[0].replace(/[*_`#>]/g, "");
  return first.length > 200 ? first.slice(0, 197) + "..." : first;
}

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_`>\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Sonnet ~ $3/$15 per M tokens. Haiku ~ $0.80/$4 per M tokens.
  const isHaiku = /haiku/i.test(model);
  const inRate = isHaiku ? 0.8 / 1_000_000 : 3 / 1_000_000;
  const outRate = isHaiku ? 4 / 1_000_000 : 15 / 1_000_000;
  return inputTokens * inRate + outputTokens * outRate;
}

function buildSystemPrompt(req: BlogGenRequest): string {
  const length = req.length ?? "medium";
  const target = LENGTH_TARGETS[length];
  const tone = req.tone ?? "professional";
  const audience = req.audience ?? "informed business readers";

  return `You are an expert SEO content writer producing long-form blog posts that rank in Google's top 10.

OUTPUT FORMAT (strict):
- Pure markdown only. No preamble, no explanation, no code fences around the whole response.
- Begin with a single \`# Title\` line — compelling, specific, under 70 characters.
- Use \`## H2\` for main sections (4-7 sections depending on length).
- Use \`### H3\` for sub-sections where helpful.
- Short paragraphs (2-4 sentences). Use bullet lists and numbered lists where they aid scanning.

QUALITY RULES:
- Target word count: ${target} words (within 15%).
- Tone: ${tone}.
- Audience: ${audience}.
- Include concrete examples, specific numbers, real metrics, named tools/companies where relevant.
- Every claim must feel grounded — no vague platitudes.
- Open with a hook that states the problem or surprising stat in the first 2 sentences.
- Close with a clear takeaway and call to action.

BANNED WORDS — never use these or any variant: ${BANNED_WORDS.join(", ")}.
Also avoid: "in today's fast-paced world", "at the end of the day", "think outside the box", "low-hanging fruit", "move the needle".

SEO RULES:
- Use the primary topic naturally in the title, first paragraph, at least one H2, and the conclusion.
- Aim for semantic keyword variation, not stuffing.
- Headings should answer real search intent questions.`;
}

function buildUserPrompt(req: BlogGenRequest): string {
  const parts: string[] = [];
  parts.push(`Topic: ${req.topic}`);
  if (req.keywords && req.keywords.length > 0) {
    parts.push(`Target keywords: ${req.keywords.join(", ")}`);
  }
  if (req.audience) parts.push(`Audience: ${req.audience}`);
  if (req.callToAction) parts.push(`Call to action at end: ${req.callToAction}`);
  if (req.outline && req.outline.length > 0) {
    parts.push(`Use this H2 outline (in order):\n${req.outline.map((h) => `- ${h}`).join("\n")}`);
  }
  parts.push("");
  parts.push("Write the complete blog post now in markdown. Output the markdown only.");
  return parts.join("\n");
}

async function generateMetaDescription(title: string, excerpt: string): Promise<{ text: string; cost: number }> {
  const sys = `You write SEO meta descriptions. Output ONE plain-text sentence of 150-160 characters. No quotes, no markdown, no preamble.`;
  const user = `Title: ${title}\n\nFirst paragraph: ${excerpt}\n\nWrite the meta description now.`;
  const res = await callAnthropic(MODEL_FALLBACK, sys, user, 200);
  let text = res.text.trim().replace(/^["']|["']$/g, "");
  if (text.length > 160) text = text.slice(0, 157) + "...";
  return { text, cost: estimateCost(res.model, res.inputTokens, res.outputTokens) };
}

async function generateTags(title: string, topic: string): Promise<{ tags: string[]; cost: number }> {
  const sys = `You generate blog tags. Output 3-5 lowercase tags as a comma-separated list. No explanation, no markdown.`;
  const user = `Title: ${title}\nTopic: ${topic}\n\nOutput the tags now (comma-separated).`;
  const res = await callAnthropic(MODEL_FALLBACK, sys, user, 100);
  const tags = res.text
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"))
    .filter((t) => t.length > 0 && t.length < 40)
    .slice(0, 5);
  return { tags, cost: estimateCost(res.model, res.inputTokens, res.outputTokens) };
}

export async function generateBlogPost(req: BlogGenRequest): Promise<BlogPost> {
  if (!req.topic || req.topic.trim().length === 0) {
    throw new Error("Blog generation requires a non-empty topic.");
  }

  const length = req.length ?? "medium";
  const target = LENGTH_TARGETS[length];
  const maxTokens = Math.min(8000, Math.ceil(target * 2.5));

  const main = await callWithFallback(buildSystemPrompt(req), buildUserPrompt(req), maxTokens);
  const markdown = main.text.trim();

  const title = extractTitle(markdown);
  const slug = slugify(title);
  const excerpt = extractFirstParagraph(markdown);
  const headings = extractHeadings(markdown);
  const wordCount = countWords(markdown);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const [meta, tagsRes] = await Promise.all([
    generateMetaDescription(title, excerpt).catch((e) => {
      console.warn("[blog-generator] meta description failed:", e);
      return { text: excerpt.slice(0, 157), cost: 0 };
    }),
    generateTags(title, req.topic).catch((e) => {
      console.warn("[blog-generator] tags failed:", e);
      return { tags: [], cost: 0 };
    }),
  ]);

  const cost =
    estimateCost(main.model, main.inputTokens, main.outputTokens) + meta.cost + tagsRes.cost;

  return {
    title,
    slug,
    metaDescription: meta.text,
    excerpt,
    content: markdown,
    wordCount,
    readingTime,
    tags: tagsRes.tags,
    headings,
    generatedAt: Date.now(),
    cost,
  };
}

export async function generateBlogBatch(
  topics: string[],
  opts?: Omit<BlogGenRequest, "topic">
): Promise<BlogPost[]> {
  const concurrency = 5;
  const results: BlogPost[] = [];

  for (let i = 0; i < topics.length; i += concurrency) {
    const chunk = topics.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      chunk.map((topic) => generateBlogPost({ ...(opts ?? {}), topic }))
    );
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j];
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        console.warn(
          `[blog-generator] topic "${chunk[j]}" failed:`,
          r.reason instanceof Error ? r.reason.message : r.reason
        );
      }
    }
  }

  return results;
}
