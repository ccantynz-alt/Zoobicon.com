/**
 * Tests for the component library injection from src/lib/component-library.ts
 *
 * Ensures the CSS design system and failsafe observer script are
 * correctly injected into generated HTML without duplication.
 */

import { describe, it, expect } from "vitest";
import { injectComponentLibrary, COMPONENT_LIBRARY_CSS } from "@/lib/component-library";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Test</title>
<style>
body { font-family: sans-serif; }
</style>
</head>
<body>
<h1>Hello World</h1>
<p>Test content</p>
</body>
</html>`;

const SAMPLE_NO_STYLE = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Test</title>
</head>
<body>
<h1>Hello World</h1>
</body>
</html>`;

describe("injectComponentLibrary", () => {
  it("injects CSS into existing <style> block", () => {
    const result = injectComponentLibrary(SAMPLE_HTML);
    expect(result).toContain("ZOOBICON COMPONENT LIBRARY");
    expect(result).toContain("Custom Styles");
    // Original CSS should still be present
    expect(result).toContain("font-family: sans-serif");
  });

  it("creates <style> tag if none exists", () => {
    const result = injectComponentLibrary(SAMPLE_NO_STYLE);
    expect(result).toContain("ZOOBICON COMPONENT LIBRARY");
    expect(result).toContain("<style>");
  });

  it("injects failsafe observer script before </body>", () => {
    const result = injectComponentLibrary(SAMPLE_HTML);
    expect(result).toContain("IntersectionObserver");
    expect(result).toContain("will-animate");
    expect(result).toContain("setTimeout"); // failsafe auto-reveal
  });

  it("does NOT double-inject if already present", () => {
    const first = injectComponentLibrary(SAMPLE_HTML);
    const second = injectComponentLibrary(first);
    // Count occurrences of the library header
    const count = (second.match(/ZOOBICON COMPONENT LIBRARY/g) || []).length;
    expect(count).toBe(1);
  });

  it("preserves HTML structure", () => {
    const result = injectComponentLibrary(SAMPLE_HTML);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<html");
    expect(result).toContain("</html>");
    expect(result).toContain("<body>");
    expect(result).toContain("</body>");
    expect(result).toContain("<h1>Hello World</h1>");
  });

  it("includes key component classes", () => {
    expect(COMPONENT_LIBRARY_CSS).toContain(".btn-primary");
    expect(COMPONENT_LIBRARY_CSS).toContain(".card");
    expect(COMPONENT_LIBRARY_CSS).toContain(".section");
    expect(COMPONENT_LIBRARY_CSS).toContain(".grid-3");
    expect(COMPONENT_LIBRARY_CSS).toContain(".fade-in");
    expect(COMPONENT_LIBRARY_CSS).toContain(".testimonial-card");
    expect(COMPONENT_LIBRARY_CSS).toContain(".faq-item");
    expect(COMPONENT_LIBRARY_CSS).toContain(".stat-number");
  });

  it("includes animation failsafe (auto-reveal after timeout)", () => {
    expect(COMPONENT_LIBRARY_CSS).toContain("zbcn-auto-reveal");
    expect(COMPONENT_LIBRARY_CSS).toContain("prefers-reduced-motion");
  });
});
