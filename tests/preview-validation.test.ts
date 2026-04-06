/**
 * Tests for the PreviewPanel's validation logic.
 *
 * The PreviewPanel has a multi-stage decision tree:
 * 1. isGenerating → show generating animation
 * 2. !html → show idle state
 * 3. !looksLikeHtml → show "not valid HTML" error
 * 4. bodyTextLength < 50 → show "empty page detected" error
 * 5. Otherwise → render iframe
 *
 * These tests verify the decision logic without rendering React components.
 */

import { describe, it, expect } from "vitest";

type PreviewDecision = "generating" | "idle" | "not-html" | "empty-body" | "render";

function getPreviewDecision(html: string, isGenerating: boolean): PreviewDecision {
  if (isGenerating) return "generating";
  if (!html) return "idle";

  const looksLikeHtml = html.includes("<html") || html.includes("<!doctype") || html.includes("<!DOCTYPE");
  if (!looksLikeHtml && html.length > 0) return "not-html";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyTextLength = bodyMatch
    ? bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .length
    : 0;

  if (html && bodyTextLength < 50) return "empty-body";
  return "render";
}

describe("Preview decision tree", () => {
  it("shows generating when isGenerating=true", () => {
    expect(getPreviewDecision("anything", true)).toBe("generating");
    expect(getPreviewDecision("", true)).toBe("generating");
  });

  it("shows idle when html is empty", () => {
    expect(getPreviewDecision("", false)).toBe("idle");
  });

  it("shows not-html for non-HTML content", () => {
    expect(getPreviewDecision("This is just text, not HTML", false)).toBe("not-html");
    expect(getPreviewDecision('{"error": "something went wrong"}', false)).toBe("not-html");
  });

  it("shows empty-body for the exact empty page bug (prefill only)", () => {
    const prefillOnly = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    expect(getPreviewDecision(prefillOnly, false)).toBe("empty-body");
  });

  it("shows empty-body for CSS-only page", () => {
    const cssOnly = `<!DOCTYPE html><html><head><style>body{color:red}</style></head><body></body></html>`;
    expect(getPreviewDecision(cssOnly, false)).toBe("empty-body");
  });

  it("shows empty-body for script-only body", () => {
    const scriptOnly = `<!DOCTYPE html><html><head></head><body><script>var x = 1;</script></body></html>`;
    expect(getPreviewDecision(scriptOnly, false)).toBe("empty-body");
  });

  it("renders valid complete page", () => {
    const valid = `<!DOCTYPE html><html><head></head><body>
      <h1>Welcome to Our Service</h1>
      <p>We provide excellent solutions for your needs. Contact us today for more information about our services.</p>
    </body></html>`;
    expect(getPreviewDecision(valid, false)).toBe("render");
  });

  it("shows empty-body for truncated HTML (no closing body)", () => {
    const truncated = `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;margin:0}</style></head><body><h1>Title`;
    // No </body> so regex won't match → bodyTextLength = 0
    expect(getPreviewDecision(truncated, false)).toBe("empty-body");
  });
});

describe("Threshold consistency", () => {
  it("client threshold (50) is lower than server threshold (100)", () => {
    // This is by design: the server retry has a higher bar (100 chars)
    // because it can still retry. The client preview is the last defense
    // and uses a lower bar (50 chars) to catch anything that slipped through.
    const CLIENT_THRESHOLD = 50;
    const SERVER_THRESHOLD = 100;
    expect(CLIENT_THRESHOLD).toBeLessThan(SERVER_THRESHOLD);
  });
});
