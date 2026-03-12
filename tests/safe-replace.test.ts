/**
 * Tests for safeReplaceHtml() from src/lib/agents.ts
 *
 * This function prevents enhancement agents (Animation, SEO, Forms, Integrations, QA)
 * from destroying the Developer agent's output with truncated, empty, or non-HTML responses.
 */

import { describe, it, expect } from "vitest";

/**
 * Mirrors safeReplaceHtml() and cleanHtml() from src/lib/agents.ts
 */
function cleanHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  const docStart = html.search(/<!doctype\s+html|<html/i);
  if (docStart > 0) html = html.slice(docStart);
  const htmlEnd = html.lastIndexOf("</html>");
  if (htmlEnd !== -1) html = html.slice(0, htmlEnd + "</html>".length);
  return html.trim();
}

function safeReplaceHtml(current: string, candidate: string, agentName: string): string {
  const cleaned = cleanHtml(candidate);
  const hasHtmlTag = /<html/i.test(cleaned);
  const hasBody = /<body/i.test(cleaned);
  const hasClosingHtml = /<\/html>/i.test(cleaned);
  const sizeRatio = cleaned.length / current.length;

  if (!hasHtmlTag || !hasBody || !hasClosingHtml) return current;
  if (sizeRatio < 0.5) return current;
  if (cleaned.length < 500) return current;

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (bodyContent.length < 100) return current;
  }

  return cleaned;
}

// A minimal but valid "developer output" to use as the baseline
const VALID_PAGE = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title><style>body{font-family:sans-serif}</style></head>
<body>
<nav><a href="/">Home</a></nav>
<section class="hero">
  <h1>Welcome to Our Service</h1>
  <p>We provide amazing solutions for businesses. Our dedicated team works hard to deliver exceptional results that exceed expectations every single time.</p>
</section>
<section class="features">
  <h2>Our Features</h2>
  <p>Feature one is about quality and excellence. Feature two focuses on innovation and creativity. Feature three emphasizes reliability and trust.</p>
</section>
<footer><p>© 2024 Company Name. All rights reserved. Contact us at info@company.com</p></footer>
</body>
</html>`;

describe("safeReplaceHtml — rejects bad replacements", () => {
  it("rejects candidate missing <html> tag", () => {
    const bad = `<head><title>Broken</title></head><body><h1>Test</h1></body>`;
    expect(safeReplaceHtml(VALID_PAGE, bad, "Test")).toBe(VALID_PAGE);
  });

  it("rejects candidate missing <body> tag", () => {
    const bad = `<!DOCTYPE html><html><head><title>No Body</title></head></html>`;
    expect(safeReplaceHtml(VALID_PAGE, bad, "Test")).toBe(VALID_PAGE);
  });

  it("rejects candidate missing </html>", () => {
    const bad = `<!DOCTYPE html><html><body><h1>Truncated`;
    expect(safeReplaceHtml(VALID_PAGE, bad, "Test")).toBe(VALID_PAGE);
  });

  it("rejects candidate less than 50% of original size", () => {
    const small = `<!DOCTYPE html><html><head></head><body><h1>Tiny page with enough body content to pass the 100 char check but still way too small compared to the original developer output which should be much larger</h1></body></html>`;
    expect(safeReplaceHtml(VALID_PAGE, small, "Test")).toBe(VALID_PAGE);
  });

  it("rejects candidate under 500 chars", () => {
    const tiny = `<!DOCTYPE html><html><head></head><body><p>Short but has more than 100 chars of body text content to pass that check. Enough words here.</p></body></html>`;
    expect(safeReplaceHtml(VALID_PAGE, tiny, "Test")).toBe(VALID_PAGE);
  });

  it("rejects candidate with empty body", () => {
    // Big enough in total but body has no text
    const emptyBody = `<!DOCTYPE html><html><head><style>${"body{color:red}\n".repeat(50)}</style></head><body><script>${"var x=1;\n".repeat(50)}</script></body></html>`;
    expect(safeReplaceHtml(VALID_PAGE, emptyBody, "Test")).toBe(VALID_PAGE);
  });
});

describe("safeReplaceHtml — accepts good replacements", () => {
  it("accepts a valid enhancement of the original", () => {
    // Enhanced version (bigger, with animations added)
    const enhanced = VALID_PAGE.replace(
      "</body>",
      `<script>/* Animation observer */
document.querySelectorAll('.fade-in').forEach(el => {
  new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }).observe(el);
});
</script>
</body>`
    );
    expect(safeReplaceHtml(VALID_PAGE, enhanced, "Animator")).toBe(cleanHtml(enhanced));
  });

  it("strips code fences from candidate before checking", () => {
    const fenced = "```html\n" + VALID_PAGE + "\n```";
    const result = safeReplaceHtml(VALID_PAGE, fenced, "Test");
    // After stripping fences, the cleaned candidate is valid HTML — should be accepted
    expect(result).toContain("<body>");
    expect(result).not.toContain("```");
  });
});
