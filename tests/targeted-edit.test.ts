/**
 * Tests for targeted section editing logic.
 *
 * The chat endpoint classifies edits into 3 modes:
 * 1. css-only — global style changes (color, font, background)
 * 2. targeted — surgical section edits (hero, footer, nav, etc.)
 * 3. full — complex edits requiring full document regeneration
 *
 * This avoids regenerating the entire HTML for simple changes,
 * making edits 3-5x faster and preventing accidental breakage.
 */

import { describe, it, expect } from "vitest";

// ─── Mirrors server-side section detection from /api/chat/route.ts ───

const SECTION_KEYWORDS: Record<string, RegExp[]> = {
  hero: [/<section[^>]*(?:hero|banner|jumbotron)[^>]*>[\s\S]*?<\/section>/gi],
  header: [/<header[^>]*>[\s\S]*?<\/header>/gi, /<nav[^>]*>[\s\S]*?<\/nav>/gi],
  nav: [/<nav[^>]*>[\s\S]*?<\/nav>/gi],
  footer: [/<footer[^>]*>[\s\S]*?<\/footer>/gi],
  pricing: [/<section[^>]*(?:pricing|plans)[^>]*>[\s\S]*?<\/section>/gi],
  features: [/<section[^>]*(?:features|benefits|services)[^>]*>[\s\S]*?<\/section>/gi],
  contact: [/<section[^>]*(?:contact|form|cta)[^>]*>[\s\S]*?<\/section>/gi],
  faq: [/<section[^>]*(?:faq|question|accordion)[^>]*>[\s\S]*?<\/section>/gi],
};

function detectTargetSection(instruction: string, html: string): { sectionName: string; sectionHtml: string } | null {
  const lower = instruction.toLowerCase();
  for (const [keyword, patterns] of Object.entries(SECTION_KEYWORDS)) {
    if (!lower.includes(keyword)) continue;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(html);
      if (match) return { sectionName: keyword, sectionHtml: match[0] };
    }
  }
  return null;
}

function isCssOnlyEdit(instruction: string): boolean {
  return /^(change|make|set|update|switch)\s+(the\s+)?(color|colour|font|text-color|background|bg|primary|accent|gradient|shadow|border-color|opacity)\b/i.test(instruction)
    || /\b(color|background|bg|font-family|font-size|border-radius|shadow|opacity)\s+(to|from|into)\b/i.test(instruction)
    || /^(make|change)\s+(everything|all|the site|the page|it)\s+(darker|lighter|more colorful|monochrome|warmer|cooler)/i.test(instruction);
}

type EditMode = "targeted" | "css-only" | "full";

function classifyEdit(instruction: string, html: string): EditMode {
  if (isCssOnlyEdit(instruction)) return "css-only";
  if (detectTargetSection(instruction, html)) return "targeted";
  return "full";
}

// ─── Test HTML ───

const TEST_HTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title>
<style>
:root { --primary: #3b82f6; --bg: #0a0a0a; }
body { font-family: Inter, sans-serif; color: white; background: var(--bg); }
.hero { padding: 6rem 2rem; }
.btn { background: var(--primary); padding: 12px 24px; border-radius: 8px; }
</style>
</head>
<body>
<header><nav><a href="/">Logo</a><a href="/about">About</a></nav></header>
<section class="hero">
  <h1>Welcome to Our Product</h1>
  <p>The best solution for your business needs.</p>
  <a class="btn" href="/signup">Get Started</a>
</section>
<section class="features" id="features">
  <h2>Features</h2>
  <div class="grid-3">
    <div class="card"><h3>Fast</h3><p>Blazing speed</p></div>
    <div class="card"><h3>Secure</h3><p>Enterprise grade</p></div>
    <div class="card"><h3>Simple</h3><p>Easy to use</p></div>
  </div>
</section>
<section class="faq">
  <h2>FAQ</h2>
  <div class="faq-item"><h3>How does it work?</h3><p>It just works.</p></div>
</section>
<footer><p>© 2024 Company. All rights reserved.</p></footer>
</body>
</html>`;

// ─── Tests ───

describe("Edit classification", () => {
  it("classifies color changes as css-only", () => {
    expect(classifyEdit("Change the primary color to red", TEST_HTML)).toBe("css-only");
    expect(classifyEdit("Make the background darker", TEST_HTML)).toBe("css-only");
    expect(classifyEdit("Change the font to Arial", TEST_HTML)).toBe("css-only");
    expect(classifyEdit("Update the accent color to purple", TEST_HTML)).toBe("css-only");
  });

  it("classifies global style changes as css-only", () => {
    expect(classifyEdit("Make everything darker", TEST_HTML)).toBe("css-only");
    expect(classifyEdit("Make the site more colorful", TEST_HTML)).toBe("css-only");
    expect(classifyEdit("Change the page background to navy", TEST_HTML)).toBe("css-only");
  });

  it("classifies hero edits as targeted", () => {
    expect(classifyEdit("Make the hero text bigger", TEST_HTML)).toBe("targeted");
    expect(classifyEdit("Change the hero button to green", TEST_HTML)).toBe("targeted");
  });

  it("classifies header/nav edits as targeted", () => {
    expect(classifyEdit("Add a new link to the header", TEST_HTML)).toBe("targeted");
    expect(classifyEdit("Change the nav background", TEST_HTML)).toBe("targeted");
  });

  it("classifies footer edits as targeted", () => {
    expect(classifyEdit("Update the footer copyright year", TEST_HTML)).toBe("targeted");
    expect(classifyEdit("Add social links to the footer", TEST_HTML)).toBe("targeted");
  });

  it("classifies features edits as targeted", () => {
    expect(classifyEdit("Add a fourth features card", TEST_HTML)).toBe("targeted");
  });

  it("classifies faq edits as targeted", () => {
    expect(classifyEdit("Add a new faq question", TEST_HTML)).toBe("targeted");
  });

  it("classifies complex edits as full", () => {
    expect(classifyEdit("Completely redesign the site with a modern look", TEST_HTML)).toBe("full");
    expect(classifyEdit("Add a blog section with 3 posts", TEST_HTML)).toBe("full");
    expect(classifyEdit("Rearrange all sections and add animations", TEST_HTML)).toBe("full");
  });
});

describe("Section detection", () => {
  it("finds hero section", () => {
    const result = detectTargetSection("change the hero heading", TEST_HTML);
    expect(result).not.toBeNull();
    expect(result!.sectionName).toBe("hero");
    expect(result!.sectionHtml).toContain("Welcome to Our Product");
  });

  it("finds header/nav", () => {
    const result = detectTargetSection("update the header", TEST_HTML);
    expect(result).not.toBeNull();
    expect(result!.sectionName).toBe("header");
    expect(result!.sectionHtml).toContain("Logo");
  });

  it("finds footer", () => {
    const result = detectTargetSection("change the footer", TEST_HTML);
    expect(result).not.toBeNull();
    expect(result!.sectionName).toBe("footer");
    expect(result!.sectionHtml).toContain("All rights reserved");
  });

  it("finds features section", () => {
    const result = detectTargetSection("add to features", TEST_HTML);
    expect(result).not.toBeNull();
    expect(result!.sectionName).toBe("features");
    expect(result!.sectionHtml).toContain("Fast");
  });

  it("finds faq section", () => {
    const result = detectTargetSection("update faq answers", TEST_HTML);
    expect(result).not.toBeNull();
    expect(result!.sectionName).toBe("faq");
    expect(result!.sectionHtml).toContain("How does it work");
  });

  it("returns null for unmatched sections", () => {
    const result = detectTargetSection("add a blog page", TEST_HTML);
    expect(result).toBeNull();
  });
});

describe("Section splicing", () => {
  function spliceSection(fullHtml: string, originalSection: string, editedSection: string): string {
    const idx = fullHtml.indexOf(originalSection);
    if (idx === -1) return fullHtml;
    return fullHtml.slice(0, idx) + editedSection + fullHtml.slice(idx + originalSection.length);
  }

  it("replaces a section without affecting the rest", () => {
    const original = detectTargetSection("hero", TEST_HTML)!;
    const edited = original.sectionHtml.replace("Welcome to Our Product", "New Headline");
    const result = spliceSection(TEST_HTML, original.sectionHtml, edited);

    expect(result).toContain("New Headline");
    expect(result).not.toContain("Welcome to Our Product");
    // Rest untouched
    expect(result).toContain("Features");
    expect(result).toContain("FAQ");
    expect(result).toContain("All rights reserved");
    expect(result).toContain(":root { --primary: #3b82f6");
  });

  it("replaces footer without affecting hero", () => {
    const original = detectTargetSection("footer", TEST_HTML)!;
    const edited = original.sectionHtml.replace("2024", "2025");
    const result = spliceSection(TEST_HTML, original.sectionHtml, edited);

    expect(result).toContain("© 2025");
    expect(result).toContain("Welcome to Our Product"); // hero untouched
  });

  it("returns original HTML if section not found", () => {
    const result = spliceSection(TEST_HTML, "<section class='nonexistent'></section>", "<div>new</div>");
    expect(result).toBe(TEST_HTML);
  });
});

describe("CSS splicing", () => {
  function spliceCss(fullHtml: string, editedCss: string): string {
    return fullHtml.replace(
      /(<style[^>]*>)([\s\S]*?)(<\/style>)/i,
      `$1${editedCss}$3`
    );
  }

  it("replaces CSS without affecting HTML", () => {
    const newCss = "\n:root { --primary: #ef4444; }\nbody { color: white; }\n";
    const result = spliceCss(TEST_HTML, newCss);

    expect(result).toContain("--primary: #ef4444");
    expect(result).not.toContain("--primary: #3b82f6");
    // HTML untouched
    expect(result).toContain("Welcome to Our Product");
    expect(result).toContain("Features");
  });
});
