/**
 * Multi-Agent Pipeline
 *
 * Orchestrates specialized AI agents to produce premium website output:
 * 1. Designer Agent — layout, color, typography, UX decisions
 * 2. Copywriter Agent — compelling, industry-specific content
 * 3. Developer Agent — clean, semantic HTML/CSS/JS implementation
 * 4. QA Agent — validates output quality, accessibility, responsiveness
 *
 * The pipeline produces output far superior to a single AI call.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface PipelineInput {
  prompt: string;
  industry?: string;
  style?: "modern" | "classic" | "bold" | "minimal";
  pages?: string[];
}

export interface AgentResult {
  agent: string;
  output: string;
  duration: number;
}

export interface PipelineResult {
  html: string;
  agents: AgentResult[];
  totalDuration: number;
}

// ── Agent System Prompts ──

const DESIGNER_SYSTEM = `You are an elite UI/UX designer at a top agency. Given a website brief, produce a detailed design specification.

Output a JSON object with these fields:
{
  "industry": "detected industry",
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex"
  },
  "typography": {
    "headingFont": "Google Font name",
    "bodyFont": "Google Font name",
    "heroSize": "clamp value",
    "headingWeight": "number",
    "bodySize": "px value"
  },
  "layout": {
    "maxWidth": "px value",
    "sectionPadding": "px value",
    "cardRadius": "px value",
    "style": "modern|classic|bold|minimal"
  },
  "sections": [
    { "type": "hero|features|about|testimonials|stats|cta|footer", "title": "section purpose", "notes": "specific design direction" }
  ],
  "designNotes": "overall design philosophy and key decisions",
  "avoidList": ["things to NOT do for this industry"]
}

CRITICAL: Match the industry. Real estate = elegant light themes. Tech = modern clean. Restaurant = warm. Law = authoritative.
Output ONLY valid JSON, nothing else.`;

const COPYWRITER_SYSTEM = `You are an elite copywriter who writes for premium brands. Given a website brief and design spec, produce all website copy.

Output a JSON object with copy for each section:
{
  "businessName": "realistic business name",
  "tagline": "compelling tagline",
  "sections": {
    "hero": {
      "headline": "powerful headline",
      "subheadline": "supporting text",
      "ctaPrimary": "button text",
      "ctaSecondary": "secondary button text"
    },
    "features": {
      "heading": "section heading",
      "subheading": "section description",
      "items": [
        { "title": "feature name", "description": "2-3 sentences", "icon": "suggested icon name" }
      ]
    },
    "about": {
      "heading": "section heading",
      "paragraphs": ["paragraph 1", "paragraph 2"],
      "stats": [{ "number": "100+", "label": "Clients Served" }]
    },
    "testimonials": [
      { "quote": "authentic testimonial", "name": "Full Name", "title": "Job Title", "company": "Company Name" }
    ],
    "cta": {
      "heading": "compelling CTA heading",
      "description": "supporting text",
      "buttonText": "action text"
    },
    "footer": {
      "description": "brief company description",
      "phone": "realistic phone",
      "email": "realistic email",
      "address": "realistic address",
      "links": ["link labels"]
    }
  }
}

Rules:
- Write copy that sounds human, warm, and specific to the industry
- Use power words and emotional triggers appropriate to the audience
- NO generic placeholder text, NO lorem ipsum
- Testimonials must sound authentic with specific details
- Include realistic contact info
Output ONLY valid JSON.`;

const DEVELOPER_SYSTEM = `You are an elite front-end developer. Given a design specification and copy, produce a single complete HTML file that looks like it was built by a $30,000 agency.

You receive two inputs:
1. DESIGN SPEC (JSON) — colors, fonts, layout, sections
2. COPY (JSON) — all text content

Rules:
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document: <!DOCTYPE html>, <html lang="en">, <head>, <body>.
- All CSS in <style> in <head>. Import Google Fonts specified in design spec.
- All JS in <script> before </body>.
- Follow the design spec EXACTLY — use the specified colors, fonts, spacing.
- Use the copy EXACTLY as provided — do not rewrite it.
- Use https://picsum.photos/WIDTH/HEIGHT for images with object-fit: cover.
- Fully responsive with mobile hamburger menu.
- CSS transitions on all interactive elements.
- Scroll-triggered fade-in animations via IntersectionObserver.
- Sticky navbar with background transition on scroll.
- Smooth scrolling for anchor links.
- The result must be indistinguishable from a premium agency website.

CRITICAL quality checklist:
✓ Generous whitespace (100-140px section padding desktop)
✓ Refined shadows (not heavy drop shadows)
✓ Proper font hierarchy (weight, size, letter-spacing)
✓ Hover states on all clickable elements
✓ Mobile hamburger menu with smooth animation
✓ No horizontal overflow on any screen size
✓ Alt text on all images
✓ Semantic HTML (header, nav, main, section, footer)`;

const QA_SYSTEM = `You are a senior QA engineer reviewing a website. Analyze the HTML and return a JSON report:

{
  "score": 0-100,
  "issues": [
    { "severity": "critical|warning|info", "category": "responsive|accessibility|performance|visual|seo", "description": "what's wrong", "fix": "how to fix it" }
  ],
  "fixedHtml": "the complete fixed HTML if there are critical/warning issues, or empty string if quality is acceptable"
}

Check for:
- Responsive: no horizontal overflow, mobile menu works, readable on small screens
- Accessibility: alt text, ARIA labels, focus states, color contrast, semantic HTML
- Performance: optimized CSS, no unnecessary JS, efficient animations
- Visual: consistent spacing, proper typography hierarchy, professional appearance
- SEO: meta tags, heading hierarchy, structured data hints

If score >= 85 and no critical issues, set fixedHtml to empty string.
If there are fixable issues, return the COMPLETE fixed HTML in fixedHtml.
Output ONLY valid JSON.`;

// ── Pipeline Execution ──

export async function runPipeline(
  input: PipelineInput,
  onProgress?: (agent: string, status: string) => void
): Promise<PipelineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey });
  const agents: AgentResult[] = [];
  const startTime = Date.now();

  // ── Step 1: Designer Agent ──
  onProgress?.("designer", "analyzing");
  const designStart = Date.now();

  const designRes = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: DESIGNER_SYSTEM,
    messages: [{ role: "user", content: `Design a premium website for: ${input.prompt}${input.style ? `\nPreferred style: ${input.style}` : ""}` }],
  });

  const designText = designRes.content.find((b) => b.type === "text")?.text || "";
  const designSpec = extractJSON(designText);
  agents.push({ agent: "Designer", output: designText, duration: Date.now() - designStart });

  // ── Step 2: Copywriter Agent ──
  onProgress?.("copywriter", "writing");
  const copyStart = Date.now();

  const copyRes = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: COPYWRITER_SYSTEM,
    messages: [{
      role: "user",
      content: `Brief: ${input.prompt}\n\nDesign Spec:\n${designSpec}\n\nWrite all website copy for this project. Match the tone to the industry.`,
    }],
  });

  const copyText = copyRes.content.find((b) => b.type === "text")?.text || "";
  const copySpec = extractJSON(copyText);
  agents.push({ agent: "Copywriter", output: copyText, duration: Date.now() - copyStart });

  // ── Step 3: Developer Agent ──
  onProgress?.("developer", "building");
  const devStart = Date.now();

  const devRes = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 64000,
    system: DEVELOPER_SYSTEM,
    messages: [{
      role: "user",
      content: `DESIGN SPEC:\n${designSpec}\n\nCOPY:\n${copySpec}\n\nBuild the complete HTML website. Follow the design spec exactly and use the copy as-is.`,
    }],
  });

  let html = devRes.content.find((b) => b.type === "text")?.text || "";
  // Strip markdown fences if present
  if (html.startsWith("```")) {
    html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }
  agents.push({ agent: "Developer", output: `[${html.length} chars HTML]`, duration: Date.now() - devStart });

  // ── Step 4: QA Agent ──
  onProgress?.("qa", "reviewing");
  const qaStart = Date.now();

  const qaRes = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 64000,
    system: QA_SYSTEM,
    messages: [{
      role: "user",
      content: `Review this website HTML for quality issues:\n\n${html}`,
    }],
  });

  const qaText = qaRes.content.find((b) => b.type === "text")?.text || "";
  agents.push({ agent: "QA", output: qaText, duration: Date.now() - qaStart });

  // Apply QA fixes if any
  try {
    const qaJSON = JSON.parse(extractJSON(qaText));
    if (qaJSON.fixedHtml && qaJSON.fixedHtml.trim().length > 100) {
      let fixedHtml = qaJSON.fixedHtml;
      if (fixedHtml.startsWith("```")) {
        fixedHtml = fixedHtml.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
      }
      html = fixedHtml;
    }
  } catch {
    // QA output wasn't valid JSON, keep original HTML
  }

  return {
    html,
    agents,
    totalDuration: Date.now() - startTime,
  };
}

function extractJSON(text: string): string {
  // Try to extract JSON from the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}
