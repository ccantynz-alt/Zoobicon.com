import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Website Cloning Engine
 *
 * POST /api/clone
 * Body: { url: string, upgradeTier?: "standard" | "premium" }
 *
 * Fetches a URL, extracts the structure/content, then uses AI to rebuild it
 * as a premium, modern website. Not a pixel-copy — it's a premium upgrade.
 */

export const maxDuration = 300;

/** Check if an error warrants a model fallback */
function isRetryableError(err: unknown): boolean {
  if (err instanceof Anthropic.RateLimitError) return true;
  if (err instanceof Anthropic.InternalServerError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.limit|overloaded|529|too many/i.test(msg);
}

export async function POST(req: NextRequest) {
  try {
    const { url, upgradeTier = "premium" } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    // ── Step 1: Fetch the target website ──
    let pageContent: string;
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ZoobiconBot/1.0; website-analysis)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Could not fetch website (HTTP ${res.status})` },
          { status: 400 }
        );
      }

      pageContent = await res.text();

      // Limit content size to prevent token overflow
      if (pageContent.length > 200000) {
        pageContent = pageContent.slice(0, 200000);
      }
    } catch (fetchErr) {
      return NextResponse.json(
        { error: `Could not reach ${parsedUrl.hostname}: ${fetchErr instanceof Error ? fetchErr.message : "Network error"}` },
        { status: 400 }
      );
    }

    // ── Step 2: Analyze the website structure ──
    const client = new Anthropic({ apiKey, timeout: 120_000 });

    const analysisSystem = `You are a website analyst. Given HTML source code, extract the website's structure, content, and purpose into a JSON analysis.

Output ONLY valid JSON:
{
  "businessName": "detected business name",
  "industry": "detected industry",
  "purpose": "what the website does",
  "sections": [
    { "type": "hero|nav|features|about|services|testimonials|pricing|team|gallery|contact|footer|cta|stats|faq",
      "content": "key text content from this section",
      "notes": "what this section is trying to communicate" }
  ],
  "colorScheme": "dark|light|mixed",
  "tone": "professional|casual|luxury|corporate|creative|friendly",
  "keyContent": {
    "headlines": ["main headlines"],
    "services": ["services offered"],
    "testimonials": ["any testimonials found"],
    "contactInfo": "phone, email, address if found",
    "stats": ["any statistics or numbers"]
  },
  "strengths": ["what the current site does well"],
  "weaknesses": ["what needs improvement"],
  "redesignNotes": "specific suggestions for a premium upgrade"
}`;

    let analysisText: string;
    try {
      const analysisRes = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: analysisSystem,
        messages: [{
          role: "user",
          content: `Analyze this website from ${parsedUrl.hostname}:\n\n${pageContent.slice(0, 100000)}`,
        }],
      });
      analysisText = analysisRes.content.find((b) => b.type === "text")?.text || "";
    } catch (analysisErr) {
      // If Sonnet fails, try Haiku for analysis (it's just JSON extraction)
      if (isRetryableError(analysisErr)) {
        console.warn("[Clone] Sonnet analysis failed, falling back to Haiku");
        const analysisRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8192,
          system: analysisSystem,
          messages: [{
            role: "user",
            content: `Analyze this website from ${parsedUrl.hostname}:\n\n${pageContent.slice(0, 100000)}`,
          }],
        });
        analysisText = analysisRes.content.find((b) => b.type === "text")?.text || "";
      } else {
        throw analysisErr;
      }
    }

    // ── Step 3: Rebuild as premium ──
    const rebuildSystem = upgradeTier === "premium"
      ? `You are Zoobicon, an elite AI website rebuilder. You take an analysis of an existing website and rebuild it as a stunning, $30,000-quality website.

Rules:
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document: <!DOCTYPE html> through </html>.
- All CSS in <style>, all JS in <script>.
- Import 2 complementary Google Fonts.
- KEEP the real business content (name, services, testimonials, contact info) from the analysis.
- DRAMATICALLY upgrade the design: better typography, spacing, colors, animations, responsiveness.
- Match the industry aesthetic (luxury for real estate, warm for restaurants, modern for tech, etc.).
- Add: smooth scroll, sticky nav, scroll animations, hover effects, mobile hamburger menu.
- Sections: hero, features/services, about/trust, testimonials, stats, CTA, footer.
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images. Include the business INDUSTRY in the KEYWORD (e.g. restaurant-chef-cooking, legal-courthouse-architecture). Each image needs a unique keyword.
- The result must look incomparably better than the original.`
      : `You are Zoobicon, a professional AI website rebuilder. Rebuild the analyzed website as a clean, modern, professional site.

Rules:
- Output ONLY raw HTML. No markdown, no code fences.
- Complete document with all CSS in <style> and JS in <script>.
- Keep the real business content from the analysis.
- Professional design with good typography, spacing, and responsiveness.
- Mobile hamburger menu, hover states, smooth scrolling.
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images. Include the business INDUSTRY in the KEYWORD. Each image needs a unique keyword.`;

    let html: string;
    try {
      const rebuildRes = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 64000,
        system: rebuildSystem,
        messages: [{
          role: "user",
          content: `Here is the analysis of ${parsedUrl.hostname}:\n\n${analysisText}\n\nRebuild this website as a premium, modern site. Keep all the real business content but dramatically upgrade the design and user experience.`,
        }],
      });
      html = rebuildRes.content.find((b) => b.type === "text")?.text || "";
    } catch (rebuildErr) {
      // If primary model fails, retry with Sonnet (or Haiku as last resort)
      if (isRetryableError(rebuildErr)) {
        console.warn("[Clone] Rebuild failed, retrying with fallback model");
        const rebuildRes = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 32000,
          system: rebuildSystem,
          messages: [{
            role: "user",
            content: `Here is the analysis of ${parsedUrl.hostname}:\n\n${analysisText}\n\nRebuild this website as a premium, modern site. Keep all the real business content but dramatically upgrade the design and user experience.`,
          }],
        });
        html = rebuildRes.content.find((b) => b.type === "text")?.text || "";
      } else {
        throw rebuildErr;
      }
    }

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
    }

    return NextResponse.json({
      html,
      analysis: analysisText,
      sourceUrl: parsedUrl.toString(),
      sourceHost: parsedUrl.hostname,
    });
  } catch (err) {
    console.error("Clone error:", err);

    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. The site owner needs to update their API key." },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "AI service is busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
