import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert SEO engineer. You will receive an HTML document and a list of SEO issues to fix.

Your job is to return the COMPLETE improved HTML document with ALL of these fixes applied:

1. **Meta Tags**: Add or fix <title>, <meta name="description">, <meta name="viewport">, <link rel="canonical">. Title should be 50-60 chars, description 150-160 chars.
2. **JSON-LD Structured Data**: Add a <script type="application/ld+json"> block with appropriate Schema.org markup (WebPage, Organization, or most relevant type).
3. **Heading Hierarchy**: Ensure exactly one <h1>, and headings follow sequential order (h1 > h2 > h3, no skipping levels).
4. **Image Alt Text**: Add descriptive, keyword-relevant alt attributes to all <img> tags missing them.
5. **Open Graph Tags**: Add og:title, og:description, og:image, og:type meta tags.
6. **Twitter Card Tags**: Add twitter:card, twitter:title, twitter:description, twitter:image meta tags.
7. **Semantic HTML**: Replace generic <div> wrappers with <header>, <nav>, <main>, <section>, <article>, <aside>, <footer> where appropriate.
8. **HTML lang attribute**: Ensure <html> has lang="en" (or appropriate language).
9. **Lazy Loading**: Add loading="lazy" to images that are below the fold.
10. **Favicon**: Add a favicon link if missing.

Rules:
- Return ONLY the complete HTML document, nothing else. No markdown code fences, no explanations before or after.
- Preserve the original design, layout, styles, and functionality exactly.
- Do not remove any existing content or features.
- If a target keyword is provided, naturally incorporate it into the title, h1, meta description, and first paragraph where it makes sense.
- Make minimal, surgical changes — fix what's broken, don't rewrite what works.`;

interface FixRequest {
  html: string;
  suggestions: string[];
  keyword?: string;
}

function detectChanges(originalHtml: string, fixedHtml: string): string[] {
  const changes: string[] = [];

  const hasTitle = (h: string) => /<title[^>]*>[\s\S]*?<\/title>/i.test(h);
  const hasMeta = (h: string, name: string) =>
    new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*>`, "i").test(h);
  const hasJsonLd = (h: string) => /application\/ld\+json/i.test(h);
  const hasLang = (h: string) => /<html[^>]*\slang=/i.test(h);
  const hasCanonical = (h: string) => /<link[^>]*rel=["']canonical["']/i.test(h);
  const hasFavicon = (h: string) =>
    /<link[^>]*rel=["'](?:shortcut )?icon["']/i.test(h) ||
    /<link[^>]*rel=["']apple-touch-icon["']/i.test(h);

  if (!hasTitle(originalHtml) && hasTitle(fixedHtml)) {
    changes.push("Added <title> tag");
  } else if (hasTitle(originalHtml) && hasTitle(fixedHtml)) {
    const origTitle = originalHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    const fixedTitle = fixedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    if (origTitle.trim() !== fixedTitle.trim()) {
      changes.push("Optimized <title> tag");
    }
  }

  if (!hasMeta(originalHtml, "description") && hasMeta(fixedHtml, "description")) {
    changes.push("Added meta description");
  } else if (hasMeta(originalHtml, "description") && hasMeta(fixedHtml, "description")) {
    changes.push("Optimized meta description");
  }

  if (!hasJsonLd(originalHtml) && hasJsonLd(fixedHtml)) {
    changes.push("Added JSON-LD structured data");
  }

  if (!hasLang(originalHtml) && hasLang(fixedHtml)) {
    changes.push("Added lang attribute to <html> tag");
  }

  if (!hasCanonical(originalHtml) && hasCanonical(fixedHtml)) {
    changes.push("Added canonical URL");
  }

  if (!hasFavicon(originalHtml) && hasFavicon(fixedHtml)) {
    changes.push("Added favicon link");
  }

  const ogTags = ["og:title", "og:description", "og:image", "og:type"];
  const addedOg = ogTags.filter(
    (tag) => !hasMeta(originalHtml, tag) && hasMeta(fixedHtml, tag)
  );
  if (addedOg.length > 0) {
    changes.push(`Added Open Graph tags: ${addedOg.join(", ")}`);
  }

  const twTags = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"];
  const addedTw = twTags.filter(
    (tag) => !hasMeta(originalHtml, tag) && hasMeta(fixedHtml, tag)
  );
  if (addedTw.length > 0) {
    changes.push(`Added Twitter Card tags: ${addedTw.join(", ")}`);
  }

  const countMissingAlt = (h: string) => {
    const imgs = h.match(/<img[^>]*>/gi) || [];
    return imgs.filter((img) => !/alt=/i.test(img) || /alt=["']\s*["']/i.test(img)).length;
  };
  const origMissing = countMissingAlt(originalHtml);
  const fixedMissing = countMissingAlt(fixedHtml);
  if (origMissing > fixedMissing) {
    changes.push(`Added alt text to ${origMissing - fixedMissing} image(s)`);
  }

  const semanticTags = ["<header", "<nav", "<main", "<section", "<article", "<aside", "<footer"];
  const addedSemantic = semanticTags.filter(
    (tag) => !originalHtml.toLowerCase().includes(tag) && fixedHtml.toLowerCase().includes(tag)
  );
  if (addedSemantic.length > 0) {
    changes.push(`Added semantic HTML elements: ${addedSemantic.map((t) => t.replace("<", "")).join(", ")}`);
  }

  const origH1 = (originalHtml.match(/<h1[^>]*>/gi) || []).length;
  const fixedH1 = (fixedHtml.match(/<h1[^>]*>/gi) || []).length;
  if (origH1 !== 1 && fixedH1 === 1) {
    changes.push("Fixed heading hierarchy (ensured single H1)");
  }

  if (changes.length === 0) {
    changes.push("Applied minor SEO optimizations throughout the document");
  }

  return changes;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, suggestions, keyword } = body as FixRequest;

    if (!html || typeof html !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'html' field. Provide the HTML to fix." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty 'suggestions' array. Provide the SEO issues to fix." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Here is the HTML document to improve:

\`\`\`html
${html}
\`\`\`

${keyword ? `Target keyword: "${keyword}"` : "No specific target keyword."}

SEO issues to fix:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Apply all the fixes listed above and return the complete improved HTML document.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Response(
        JSON.stringify({ error: "No text response from AI model." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let fixedHtml = textBlock.text.trim();

    // Strip markdown code fences if the model wrapped it
    if (fixedHtml.startsWith("```html")) {
      fixedHtml = fixedHtml.slice(7);
    } else if (fixedHtml.startsWith("```")) {
      fixedHtml = fixedHtml.slice(3);
    }
    if (fixedHtml.endsWith("```")) {
      fixedHtml = fixedHtml.slice(0, -3);
    }
    fixedHtml = fixedHtml.trim();

    const changes = detectChanges(html, fixedHtml);

    return new Response(
      JSON.stringify({ html: fixedHtml, changes }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("SEO fix error:", error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Configure ANTHROPIC_API_KEY in environment." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Failed to apply SEO fixes. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
