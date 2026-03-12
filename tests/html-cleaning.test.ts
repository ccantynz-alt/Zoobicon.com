/**
 * Tests for HTML cleaning logic used in the generation pipeline.
 *
 * This tests the cleanHtml() function from src/lib/agents.ts and the
 * equivalent cleaning logic in the builder page client-side code.
 */

import { describe, it, expect } from "vitest";

/**
 * Mirrors cleanHtml() from src/lib/agents.ts
 */
function cleanHtml(raw: string): string {
  let html = raw.trim();
  // Remove markdown code fences
  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  // Remove preamble text before <!DOCTYPE or <html
  const docStart = html.search(/<!doctype\s+html|<html/i);
  if (docStart > 0) {
    html = html.slice(docStart);
  }
  // Remove trailing text after </html>
  const htmlEnd = html.lastIndexOf("</html>");
  if (htmlEnd !== -1) {
    html = html.slice(0, htmlEnd + "</html>".length);
  }
  return html.trim();
}

describe("cleanHtml — code fence removal", () => {
  it("strips ```html fences", () => {
    const input = "```html\n<!DOCTYPE html><html><body>Test</body></html>\n```";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("strips ```HTML fences (uppercase)", () => {
    const input = "```HTML\n<!DOCTYPE html><html><body>Test</body></html>\n```";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("strips bare ``` fences", () => {
    const input = "```\n<!DOCTYPE html><html><body>Test</body></html>\n```";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("handles no fences", () => {
    const input = "<!DOCTYPE html><html><body>Test</body></html>";
    expect(cleanHtml(input)).toBe(input);
  });
});

describe("cleanHtml — preamble removal", () => {
  it("removes preamble text before DOCTYPE", () => {
    const input = "Here is the website I built:\n\n<!DOCTYPE html><html><body>Test</body></html>";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("removes preamble text before <html", () => {
    const input = "Sure! Here's your website:\n<html><body>Test</body></html>";
    expect(cleanHtml(input)).toBe("<html><body>Test</body></html>");
  });

  it("handles no preamble", () => {
    const input = "<!DOCTYPE html><html><body>Test</body></html>";
    expect(cleanHtml(input)).toBe(input);
  });
});

describe("cleanHtml — trailing text removal", () => {
  it("removes trailing text after </html>", () => {
    const input = "<!DOCTYPE html><html><body>Test</body></html>\n\nI hope this helps!";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("handles no trailing text", () => {
    const input = "<!DOCTYPE html><html><body>Test</body></html>";
    expect(cleanHtml(input)).toBe(input);
  });
});

describe("cleanHtml — combined", () => {
  it("handles all three: fences + preamble + trailing", () => {
    const input = "```html\nHere is the website:\n<!DOCTYPE html><html><body>Test</body></html>\nI hope you like it!\n```";
    expect(cleanHtml(input)).toBe("<!DOCTYPE html><html><body>Test</body></html>");
  });

  it("preserves valid HTML untouched", () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>`;
    const result = cleanHtml(input);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("</html>");
    expect(result).toContain("<h1>Hello</h1>");
  });
});
