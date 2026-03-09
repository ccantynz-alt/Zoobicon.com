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
    const client = new Anthropic({ apiKey });

    const analysisRes = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: `You are a website analyst. Given HTML source code, extract the website's structure, content, and purpose into a JSON analysis.

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
}`,
      messages: [{
        role: "user",
        content: `Analyze this website from ${parsedUrl.hostname}:\n\n${pageContent.slice(0, 100000)}`,
      }],
    });

    const analysisText = analysisRes.content.find((b) => b.type === "text")?.text || "";

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
- Use https://picsum.photos/WIDTH/HEIGHT for images.
- The result must look incomparably better than the original.`
      : `You are Zoobicon, a professional AI website rebuilder. Rebuild the analyzed website as a clean, modern, professional site.

Rules:
- Output ONLY raw HTML. No markdown, no code fences.
- Complete document with all CSS in <style> and JS in <script>.
- Keep the real business content from the analysis.
- Professional design with good typography, spacing, and responsiveness.
- Mobile hamburger menu, hover states, smooth scrolling.
- Use https://picsum.photos/WIDTH/HEIGHT for images.`;

    const rebuildRes = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: rebuildSystem,
      messages: [{
        role: "user",
        content: `Here is the analysis of ${parsedUrl.hostname}:\n\n${analysisText}\n\nRebuild this website as a premium, modern site. Keep all the real business content but dramatically upgrade the design and user experience.`,
      }],
    });

    let html = rebuildRes.content.find((b) => b.type === "text")?.text || "";
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html,
      analysis: analysisText,
      sourceUrl: parsedUrl.toString(),
      sourceHost: parsedUrl.hostname,
    });
  } catch (err) {
    console.error("Clone error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
