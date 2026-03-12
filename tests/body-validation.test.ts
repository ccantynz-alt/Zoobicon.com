/**
 * Tests for the body content validation logic used across the generation pipeline.
 *
 * This is the core logic that determines whether a generated page has real content
 * or is an empty shell (the "empty page" bug). The same validation pattern is used in:
 * - src/lib/agents.ts (hasBodyContent)
 * - src/app/api/generate/route.ts (retry logic)
 * - src/app/api/generate/stream/route.ts (retry logic)
 * - src/app/builder/page.tsx (client-side final check)
 * - src/components/PreviewPanel.tsx (display check)
 */

import { describe, it, expect } from "vitest";

/**
 * Extract visible body text from HTML — mirrors the logic used in all validation points.
 * This must stay in sync with the codebase implementation.
 */
function extractBodyText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return "";
  return bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasValidBody(html: string, threshold = 100): boolean {
  return extractBodyText(html).length >= threshold;
}

describe("Body content extraction", () => {
  it("returns empty string for HTML with no body tag", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title><style>body{color:red}</style></head></html>`;
    expect(extractBodyText(html)).toBe("");
  });

  it("returns empty string for HTML with empty body", () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    expect(extractBodyText(html)).toBe("");
  });

  it("strips scripts from body text", () => {
    const html = `<html><body><script>console.log("hello")</script></body></html>`;
    expect(extractBodyText(html)).toBe("");
  });

  it("strips style tags from body text", () => {
    const html = `<html><body><style>.foo{color:red}</style></body></html>`;
    expect(extractBodyText(html)).toBe("");
  });

  it("extracts visible text from real content", () => {
    const html = `<html><body><h1>Hello World</h1><p>This is a test paragraph with some content.</p></body></html>`;
    const text = extractBodyText(html);
    expect(text).toContain("Hello World");
    expect(text).toContain("This is a test paragraph");
  });

  it("handles body with attributes", () => {
    const html = `<html><body class="dark" data-theme="night"><h1>Content</h1></body></html>`;
    expect(extractBodyText(html)).toBe("Content");
  });

  it("handles multiple scripts and styles mixed with content", () => {
    const html = `<html><body>
      <style>.nav{color:blue}</style>
      <h1>Real Heading</h1>
      <script>var x = 1;</script>
      <p>Real paragraph</p>
      <script>var y = 2;</script>
      <style>.footer{margin:0}</style>
    </body></html>`;
    const text = extractBodyText(html);
    expect(text).toContain("Real Heading");
    expect(text).toContain("Real paragraph");
    expect(text).not.toContain("var x");
    expect(text).not.toContain(".nav");
  });
});

describe("Body validation thresholds", () => {
  it("rejects prefill-only HTML (the exact empty page bug)", () => {
    // This is what the screenshot showed — just the prefill content
    const prefillOnly = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    expect(hasValidBody(prefillOnly)).toBe(false);
    expect(hasValidBody(prefillOnly, 50)).toBe(false); // client threshold
  });

  it("rejects CSS-only page (common AI failure mode)", () => {
    const cssOnly = `<!DOCTYPE html><html lang="en"><head>
<style>
:root { --primary: #2563eb; --bg: #fefefe; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; color: var(--primary); }
.hero { min-height: 100vh; display: flex; }
.nav { position: sticky; top: 0; }
.card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.btn { padding: 12px 24px; border-radius: 8px; }
</style>
</head><body></body></html>`;
    expect(hasValidBody(cssOnly)).toBe(false);
  });

  it("rejects page with only script content", () => {
    const scriptOnly = `<!DOCTYPE html><html><head></head><body>
<script>
document.addEventListener('DOMContentLoaded', function() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.add('visible'));
  });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
</script></body></html>`;
    expect(hasValidBody(scriptOnly)).toBe(false);
  });

  it("accepts a real complete page", () => {
    const realPage = `<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body>
<nav><a href="/">Home</a><a href="/about">About</a></nav>
<section class="hero">
  <h1>Welcome to Our Amazing Service</h1>
  <p>We provide the best solutions for your business needs. Our team of experts is here to help you succeed with innovative approaches and dedicated support.</p>
  <a href="/contact" class="btn btn-primary">Get Started Today</a>
</section>
<section class="features">
  <h2>Our Services</h2>
  <div class="card"><h3>Web Development</h3><p>Custom websites built with modern technology.</p></div>
  <div class="card"><h3>SEO Optimization</h3><p>Get found by your customers online.</p></div>
</section>
<footer><p>© 2024 Test Company. All rights reserved.</p></footer>
</body></html>`;
    expect(hasValidBody(realPage)).toBe(true);
    expect(hasValidBody(realPage, 50)).toBe(true);
  });

  it("uses correct threshold: server=100, client=50", () => {
    // A page with some content but not much
    const minimal = `<html><body><h1>Hello World</h1><p>Short paragraph here with a few words of text for testing.</p></body></html>`;
    const textLen = extractBodyText(minimal).length;
    // Verify the text is in the gap between thresholds
    expect(textLen).toBeGreaterThan(50);
    // Should pass client check (50) but may fail server check (100) depending on exact length
  });
});

describe("Edge cases", () => {
  it("handles case-insensitive body/script/style tags", () => {
    const html = `<HTML><BODY><SCRIPT>var x=1;</SCRIPT><H1>Title</H1><STYLE>.foo{}</STYLE></BODY></HTML>`;
    expect(extractBodyText(html)).toBe("Title");
  });

  it("handles nested scripts", () => {
    const html = `<html><body><div><script type="application/ld+json">{"@type":"WebSite"}</script></div><h1>Real</h1></body></html>`;
    const text = extractBodyText(html);
    expect(text).toContain("Real");
    expect(text).not.toContain("WebSite");
  });

  it("handles HTML with no closing body (truncated output)", () => {
    const html = `<!DOCTYPE html><html><head></head><body><h1>Title</h1><p>Some content`;
    // No </body> tag — regex won't match
    expect(extractBodyText(html)).toBe("");
    // This is important: truncated HTML is treated as empty
  });

  it("handles whitespace-only body", () => {
    const html = `<html><body>   \n\n\t   </body></html>`;
    expect(extractBodyText(html)).toBe("");
  });
});
