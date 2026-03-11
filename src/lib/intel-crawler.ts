/**
 * Competitive Intelligence Crawler
 *
 * Monitors competitor websites for changes in:
 * - Pricing and plans
 * - Features and capabilities
 * - Technology stack
 * - New product launches
 * - Marketing messaging
 *
 * Stores snapshots in the database for trend analysis.
 */

export interface CompetitorTarget {
  name: string;
  domain: string;
  urls: string[];
  category: "direct" | "adjacent" | "emerging";
}

export const COMPETITORS: CompetitorTarget[] = [
  {
    name: "Lovable",
    domain: "lovable.dev",
    urls: [
      "https://lovable.dev",
      "https://lovable.dev/pricing",
      "https://lovable.dev/blog",
      "https://docs.lovable.dev/introduction",
    ],
    category: "direct",
  },
  {
    name: "Emergent",
    domain: "emergent.sh",
    urls: [
      "https://emergent.sh",
      "https://emergent.sh/pricing",
      "https://emergent.sh/learn",
      "https://emergent.sh/blog",
    ],
    category: "direct",
  },
  {
    name: "Bolt",
    domain: "bolt.new",
    urls: [
      "https://bolt.new",
      "https://bolt.new/pricing",
    ],
    category: "direct",
  },
  {
    name: "v0",
    domain: "v0.dev",
    urls: [
      "https://v0.dev",
      "https://v0.dev/pricing",
    ],
    category: "direct",
  },
  {
    name: "Cursor",
    domain: "cursor.com",
    urls: [
      "https://www.cursor.com",
      "https://www.cursor.com/pricing",
    ],
    category: "adjacent",
  },
  {
    name: "Replit",
    domain: "replit.com",
    urls: [
      "https://replit.com",
      "https://replit.com/pricing",
    ],
    category: "adjacent",
  },
  {
    name: "Framer",
    domain: "framer.com",
    urls: [
      "https://www.framer.com",
      "https://www.framer.com/pricing",
    ],
    category: "adjacent",
  },
];

export interface CrawlResult {
  competitor: string;
  url: string;
  timestamp: string;
  status: "success" | "error" | "blocked";
  title?: string;
  description?: string;
  pricing?: string;
  features?: string[];
  techStack?: string[];
  keyChanges?: string[];
  rawTextLength?: number;
  errorMessage?: string;
}

export interface IntelReport {
  generatedAt: string;
  competitors: CrawlResult[];
  insights: string[];
  alerts: string[];
}

/**
 * Crawl a single URL and extract key intelligence
 */
async function crawlUrl(url: string): Promise<{
  title: string;
  description: string;
  text: string;
  status: number;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZoobiconBot/1.0; +https://zoobicon.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Strip HTML tags for text analysis
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000); // Limit for analysis

    return { title, description, text, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Analyze crawled content using Claude to extract intelligence
 */
async function analyzeWithAI(
  competitor: string,
  url: string,
  pageText: string,
  title: string,
  description: string
): Promise<Partial<CrawlResult>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: `You are a competitive intelligence analyst. Extract key information from this webpage content. Output JSON only.`,
      messages: [{
        role: "user",
        content: `Analyze this page from ${competitor} (${url}):

Title: ${title}
Description: ${description}
Content (truncated): ${pageText.slice(0, 5000)}

Extract and return JSON:
{
  "pricing": "summary of pricing if visible (plans, prices, free tier details) or null",
  "features": ["list of key features or capabilities mentioned"],
  "techStack": ["any tech/frameworks/integrations mentioned"],
  "keyChanges": ["anything that looks new, recently launched, or different from a typical AI builder"]
}

Output ONLY valid JSON.`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // AI analysis optional, continue without it
  }

  return {};
}

/**
 * Run a full crawl of all competitors
 */
export async function crawlAllCompetitors(): Promise<IntelReport> {
  const results: CrawlResult[] = [];
  const now = new Date().toISOString();

  for (const competitor of COMPETITORS) {
    for (const url of competitor.urls) {
      try {
        const { title, description, text, status } = await crawlUrl(url);

        if (status === 403 || status === 429) {
          results.push({
            competitor: competitor.name,
            url,
            timestamp: now,
            status: "blocked",
            errorMessage: `HTTP ${status}`,
          });
          continue;
        }

        // Analyze with AI
        const analysis = await analyzeWithAI(competitor.name, url, text, title, description);

        results.push({
          competitor: competitor.name,
          url,
          timestamp: now,
          status: "success",
          title,
          description,
          rawTextLength: text.length,
          ...analysis,
        });
      } catch (err) {
        results.push({
          competitor: competitor.name,
          url,
          timestamp: now,
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }

  // Generate high-level insights
  const insights: string[] = [];
  const alerts: string[] = [];

  const successful = results.filter((r) => r.status === "success");
  const pricingResults = successful.filter((r) => r.pricing);
  const featureResults = successful.filter((r) => r.features && r.features.length > 0);

  if (pricingResults.length > 0) {
    insights.push(`Pricing data captured from ${pricingResults.length} pages across ${new Set(pricingResults.map(r => r.competitor)).size} competitors`);
  }

  if (featureResults.length > 0) {
    const allFeatures = featureResults.flatMap((r) => r.features || []);
    const uniqueFeatures = [...new Set(allFeatures)];
    insights.push(`${uniqueFeatures.length} unique features tracked across competitors`);
  }

  const blocked = results.filter((r) => r.status === "blocked");
  if (blocked.length > 0) {
    alerts.push(`${blocked.length} URLs blocked (rate limited or forbidden) — consider adjusting crawl frequency`);
  }

  const newLaunches = successful.filter((r) => r.keyChanges && r.keyChanges.length > 0);
  if (newLaunches.length > 0) {
    for (const result of newLaunches) {
      for (const change of result.keyChanges || []) {
        alerts.push(`[${result.competitor}] ${change}`);
      }
    }
  }

  return {
    generatedAt: now,
    competitors: results,
    insights,
    alerts,
  };
}

/**
 * Crawl a single competitor
 */
export async function crawlCompetitor(name: string): Promise<CrawlResult[]> {
  const target = COMPETITORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (!target) throw new Error(`Unknown competitor: ${name}`);

  const results: CrawlResult[] = [];
  const now = new Date().toISOString();

  for (const url of target.urls) {
    try {
      const { title, description, text, status } = await crawlUrl(url);
      const analysis = status < 400
        ? await analyzeWithAI(target.name, url, text, title, description)
        : {};

      results.push({
        competitor: target.name,
        url,
        timestamp: now,
        status: status < 400 ? "success" : "blocked",
        title,
        description,
        rawTextLength: text.length,
        ...analysis,
      });
    } catch (err) {
      results.push({
        competitor: target.name,
        url,
        timestamp: now,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
