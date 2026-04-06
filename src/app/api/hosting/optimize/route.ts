import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const MAX_HTML_SIZE = 200 * 1024; // 200KB
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

const AVAILABLE_CHECKS = ["performance", "seo", "accessibility", "security", "mobile"] as const;
type CheckCategory = (typeof AVAILABLE_CHECKS)[number];

const CHECK_PROMPTS: Record<CheckCategory, string> = {
  performance: `Analyze this HTML for performance issues. Check for:
- Unoptimized images (missing width/height, no lazy loading, oversized)
- Render-blocking resources (inline vs external CSS/JS, script placement)
- Excessive DOM depth or node count
- Missing resource hints (preconnect, prefetch, preload)
- Unused CSS or JS
- Large inline styles or scripts that should be deferred
- Missing compression hints
- Font loading strategy (font-display, preload)

Return a JSON object with:
{
  "score": <0-100>,
  "issues": [{"severity": "error"|"warning"|"info", "message": "<description>", "fix": "<how to fix or null>"}],
  "suggestions": ["<actionable suggestion>"]
}
Only return valid JSON, no markdown or explanation.`,

  seo: `Analyze this HTML for SEO issues. Check for:
- Missing or duplicate title tag
- Missing or poor meta description (length, keywords)
- Missing Open Graph and Twitter Card meta tags
- Heading hierarchy (h1 count, proper nesting h1>h2>h3)
- Missing alt text on images
- Missing canonical URL
- Missing structured data (JSON-LD)
- Missing lang attribute on html tag
- Internal link quality
- Missing sitemap/robots references
- URL-unfriendly characters in links

Return a JSON object with:
{
  "score": <0-100>,
  "issues": [{"severity": "error"|"warning"|"info", "message": "<description>", "fix": "<how to fix or null>"}],
  "suggestions": ["<actionable suggestion>"]
}
Only return valid JSON, no markdown or explanation.`,

  accessibility: `Analyze this HTML for accessibility (WCAG 2.1) issues. Check for:
- Missing alt text on images
- Missing ARIA labels on interactive elements
- Color contrast concerns (based on CSS values)
- Missing form labels
- Missing skip navigation link
- Keyboard navigation issues (tabindex, focus styles)
- Missing role attributes where needed
- Missing aria-live regions for dynamic content
- Missing language attribute
- Heading hierarchy correctness
- Link text quality (no "click here")

Return a JSON object with:
{
  "score": <0-100>,
  "issues": [{"severity": "error"|"warning"|"info", "message": "<description>", "fix": "<how to fix or null>"}],
  "suggestions": ["<actionable suggestion>"]
}
Only return valid JSON, no markdown or explanation.`,

  security: `Analyze this HTML for security issues. Check for:
- Missing Content Security Policy meta tag
- Inline event handlers (onclick, onload, etc.)
- External scripts from untrusted CDNs
- Missing rel="noopener noreferrer" on external links
- Form action pointing to http:// (not https://)
- Missing autocomplete attributes on sensitive form fields
- Exposed API keys or secrets in inline scripts
- Missing X-Frame-Options equivalent meta
- Unsafe innerHTML or eval patterns in scripts
- Mixed content warnings (http resources on https page)

Return a JSON object with:
{
  "score": <0-100>,
  "issues": [{"severity": "error"|"warning"|"info", "message": "<description>", "fix": "<how to fix or null>"}],
  "suggestions": ["<actionable suggestion>"]
}
Only return valid JSON, no markdown or explanation.`,

  mobile: `Analyze this HTML for mobile responsiveness issues. Check for:
- Missing or incorrect viewport meta tag
- Fixed-width elements that would overflow on mobile
- Missing responsive breakpoints in CSS
- Touch target sizes too small (< 44px)
- Horizontal scrolling issues (elements wider than viewport)
- Font sizes too small for mobile (< 14px base)
- Missing media queries for key breakpoints
- Unresponsive images (missing max-width: 100%)
- Table layout issues on mobile
- Navigation usability on mobile (hamburger menu, etc.)

Return a JSON object with:
{
  "score": <0-100>,
  "issues": [{"severity": "error"|"warning"|"info", "message": "<description>", "fix": "<how to fix or null>"}],
  "suggestions": ["<actionable suggestion>"]
}
Only return valid JSON, no markdown or explanation.`,
};

const AUTO_FIX_PROMPT = `You are given HTML along with a list of issues found during optimization analysis. Apply ALL the fixes listed below to the HTML. Return ONLY the complete fixed HTML — no explanation, no markdown fences, just the HTML.

Rules:
- Preserve ALL existing content and structure
- Only add/modify what is needed to fix the listed issues
- Do not remove any existing functionality
- If a fix conflicts with existing code, prefer the safer option
- Keep all inline styles and scripts intact unless the fix specifically targets them`;

interface OptimizationIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

interface CheckResult {
  category: string;
  score: number;
  issues: OptimizationIssue[];
  suggestions: string[];
}

interface OptimizeRequest {
  siteId: string;
  html: string;
  checks?: CheckCategory[];
  autoFix?: boolean;
}

async function runCheck(
  client: Anthropic,
  category: CheckCategory,
  html: string
): Promise<CheckResult> {
  try {
    // Truncate HTML if very large to stay within token limits
    const truncatedHtml = html.length > 150000 ? html.slice(0, 150000) + "\n<!-- truncated -->" : html;

    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${CHECK_PROMPTS[category]}\n\nHTML to analyze:\n${truncatedHtml}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      category,
      score: Math.max(0, Math.min(100, parsed.score || 0)),
      issues: (parsed.issues || []).map((issue: OptimizationIssue) => ({
        severity: issue.severity || "info",
        message: issue.message || "",
        fix: issue.fix || undefined,
      })),
      suggestions: parsed.suggestions || [],
    };
  } catch (err) {
    console.error(`Optimizer check failed for ${category}:`, err);
    return {
      category,
      score: 0,
      issues: [
        {
          severity: "error",
          message: `Analysis failed for ${category}: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ],
      suggestions: [],
    };
  }
}

async function applyAutoFix(
  client: Anthropic,
  html: string,
  allIssues: OptimizationIssue[]
): Promise<string> {
  const fixableIssues = allIssues.filter((i) => i.fix);
  if (fixableIssues.length === 0) return html;

  const issueList = fixableIssues
    .map((i, idx) => `${idx + 1}. [${i.severity}] ${i.message}\n   Fix: ${i.fix}`)
    .join("\n");

  // Truncate HTML for fix prompt
  const truncatedHtml = html.length > 120000 ? html.slice(0, 120000) + "\n<!-- truncated -->" : html;

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `${AUTO_FIX_PROMPT}\n\nIssues to fix:\n${issueList}\n\nOriginal HTML:\n${truncatedHtml}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```html?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  // Validate it looks like HTML
  if (cleaned.includes("<") && cleaned.includes(">")) {
    return cleaned;
  }
  return html; // Return original if output doesn't look like HTML
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 5 requests per minute." },
      { status: 429 }
    );
  }

  try {
    const body: OptimizeRequest = await request.json();
    const { siteId, html, checks, autoFix } = body;

    // Validation
    if (!siteId || typeof siteId !== "string") {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "html is required" },
        { status: 400 }
      );
    }

    if (html.length > MAX_HTML_SIZE) {
      return NextResponse.json(
        {
          error: `HTML exceeds maximum size of ${MAX_HTML_SIZE / 1024}KB (received ${Math.round(html.length / 1024)}KB)`,
        },
        { status: 413 }
      );
    }

    // Determine which checks to run
    const checksToRun: CheckCategory[] = checks
      ? checks.filter((c): c is CheckCategory =>
          AVAILABLE_CHECKS.includes(c as CheckCategory)
        )
      : [...AVAILABLE_CHECKS];

    if (checksToRun.length === 0) {
      return NextResponse.json(
        {
          error: `No valid checks specified. Available: ${AVAILABLE_CHECKS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Run all checks in parallel
    const results = await Promise.all(
      checksToRun.map((category) => runCheck(client, category, html))
    );

    // Calculate overall score (weighted average)
    const weights: Record<CheckCategory, number> = {
      performance: 0.25,
      seo: 0.25,
      accessibility: 0.2,
      security: 0.15,
      mobile: 0.15,
    };

    let totalWeight = 0;
    let weightedSum = 0;
    for (const result of results) {
      const w = weights[result.category as CheckCategory] || 0.2;
      weightedSum += result.score * w;
      totalWeight += w;
    }
    const overallScore = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);

    // Apply auto-fix if requested
    let optimizedHtml: string | undefined;
    if (autoFix) {
      const allIssues = results.flatMap((r) => r.issues);
      try {
        optimizedHtml = await applyAutoFix(client, html, allIssues);
      } catch (err) {
        console.error("Auto-fix failed:", err);
        // Don't fail the whole request if auto-fix fails
      }
    }

    return NextResponse.json({
      score: overallScore,
      checks: results,
      optimized_html: optimizedHtml,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Optimizer error:", err);
    return NextResponse.json(
      {
        error: `Optimization failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
