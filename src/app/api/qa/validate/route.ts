import { NextRequest, NextResponse } from "next/server";

interface Issue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
}

interface ValidationResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  issues: Issue[];
  passed: string[];
}

function findLineNumber(html: string, index: number): number {
  return html.substring(0, index).split("\n").length;
}

function checkHTMLStructure(html: string, issues: Issue[], passed: string[]) {
  const checks = [
    { pattern: /<!DOCTYPE\s+html>/i, name: "DOCTYPE declaration" },
    { pattern: /<html[\s>]/i, name: "<html> tag" },
    { pattern: /<head[\s>]/i, name: "<head> tag" },
    { pattern: /<body[\s>]/i, name: "<body> tag" },
    {
      pattern: /<meta\s[^>]*name=["']viewport["'][^>]*>/i,
      name: "meta viewport",
    },
  ];

  for (const check of checks) {
    if (check.pattern.test(html)) {
      passed.push(`HTML Structure: ${check.name} present`);
    } else {
      issues.push({
        severity: check.name === "meta viewport" ? "warning" : "error",
        category: "HTML Structure",
        message: `Missing ${check.name}`,
      });
    }
  }

  if (/<html\s[^>]*lang=["'][a-z]{2,}["']/i.test(html)) {
    passed.push("HTML Structure: lang attribute on <html>");
  } else {
    issues.push({
      severity: "warning",
      category: "HTML Structure",
      message: "Missing lang attribute on <html> tag",
    });
  }
}

function checkBrokenResources(html: string, issues: Issue[], passed: string[]) {
  const imgTagRegex = /<img\s[^>]*>/gi;
  let match;
  let imgCount = 0;
  let missingAlt = 0;
  let missingSrc = 0;

  while ((match = imgTagRegex.exec(html)) !== null) {
    imgCount++;
    const tag = match[0];
    const line = findLineNumber(html, match.index);

    if (!/\balt\s*=/i.test(tag)) {
      missingAlt++;
      issues.push({
        severity: "error",
        category: "Broken Resources",
        message: "Image missing alt attribute",
        line,
      });
    }

    if (!/\bsrc\s*=/i.test(tag)) {
      missingSrc++;
      issues.push({
        severity: "error",
        category: "Broken Resources",
        message: "Image missing src attribute",
        line,
      });
    }

    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
    if (srcMatch && srcMatch[1].trim() === "") {
      issues.push({
        severity: "error",
        category: "Broken Resources",
        message: "Image has empty src attribute",
        line,
      });
    }
  }

  if (imgCount > 0 && missingAlt === 0) {
    passed.push("Broken Resources: All images have alt attributes");
  }
  if (imgCount > 0 && missingSrc === 0) {
    passed.push("Broken Resources: All images have src attributes");
  }
  if (imgCount === 0) {
    passed.push("Broken Resources: No images to validate");
  }
}

function checkAccessibility(html: string, issues: Issue[], passed: string[]) {
  // Check for missing ARIA labels on interactive elements
  const interactiveRegex =
    /<(button|a|input|select|textarea)\s[^>]*>/gi;
  let match;
  let interactiveCount = 0;
  let missingLabel = 0;

  while ((match = interactiveRegex.exec(html)) !== null) {
    interactiveCount++;
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    const line = findLineNumber(html, match.index);

    const hasAccessibleName =
      /\baria-label\s*=/i.test(tag) ||
      /\baria-labelledby\s*=/i.test(tag) ||
      /\btitle\s*=/i.test(tag);

    // For inputs, check for associated label or aria-label
    if (tagName === "input" || tagName === "select" || tagName === "textarea") {
      const idMatch = tag.match(/\bid\s*=\s*["']([^"']*)["']/i);
      const hasForLabel =
        idMatch &&
        new RegExp(
          `<label\\s[^>]*for\\s*=\\s*["']${idMatch[1]}["']`,
          "i"
        ).test(html);

      if (!hasAccessibleName && !hasForLabel) {
        // Skip hidden inputs
        if (!/\btype\s*=\s*["']hidden["']/i.test(tag)) {
          missingLabel++;
          issues.push({
            severity: "warning",
            category: "Accessibility",
            message: `<${tagName}> element missing accessible label (aria-label, aria-labelledby, or associated <label>)`,
            line,
          });
        }
      }
    }
  }

  if (interactiveCount > 0 && missingLabel === 0) {
    passed.push("Accessibility: All form elements have accessible labels");
  }

  // Check heading hierarchy
  const headingRegex = /<h([1-6])[\s>]/gi;
  const headings: number[] = [];
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(match[1]));
  }

  if (headings.length > 0) {
    if (headings[0] !== 1) {
      issues.push({
        severity: "warning",
        category: "Accessibility",
        message: `First heading is <h${headings[0]}>, should be <h1>`,
      });
    } else {
      passed.push("Accessibility: Page starts with <h1>");
    }

    let hierarchyOk = true;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i - 1] + 1) {
        hierarchyOk = false;
        issues.push({
          severity: "warning",
          category: "Accessibility",
          message: `Heading hierarchy skips from <h${headings[i - 1]}> to <h${headings[i]}>`,
        });
        break;
      }
    }
    if (hierarchyOk && headings.length > 1) {
      passed.push("Accessibility: Heading hierarchy is correct");
    }
  }

  // Basic color contrast check: look for very light text colors
  const colorRegex = /color\s*:\s*#([0-9a-f]{3,8})\b/gi;
  while ((match = colorRegex.exec(html)) !== null) {
    let hex = match[1].toLowerCase();
    // Expand shorthand
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Relative luminance approximation
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // Very light colors that may be invisible on white backgrounds
      if (luminance > 0.93) {
        issues.push({
          severity: "warning",
          category: "Accessibility",
          message: `Very light text color #${hex} may have poor contrast`,
          line: findLineNumber(html, match.index),
        });
      }
    }
  }
}

function checkSEO(html: string, issues: Issue[], passed: string[]) {
  if (/<title>[^<]+<\/title>/i.test(html)) {
    passed.push("SEO: Title tag present");
  } else {
    issues.push({
      severity: "error",
      category: "SEO",
      message: "Missing <title> tag",
    });
  }

  if (/<meta\s[^>]*name=["']description["'][^>]*>/i.test(html)) {
    passed.push("SEO: Meta description present");
  } else {
    issues.push({
      severity: "warning",
      category: "SEO",
      message: "Missing meta description",
    });
  }

  const ogTags = ["og:title", "og:description", "og:image"];
  let ogCount = 0;
  for (const tag of ogTags) {
    if (
      new RegExp(
        `<meta\\s[^>]*property=["']${tag}["'][^>]*>`,
        "i"
      ).test(html)
    ) {
      ogCount++;
    } else {
      issues.push({
        severity: "info",
        category: "SEO",
        message: `Missing Open Graph tag: ${tag}`,
      });
    }
  }
  if (ogCount === ogTags.length) {
    passed.push("SEO: All Open Graph tags present");
  }
}

function checkPerformance(html: string, issues: Issue[], passed: string[]) {
  // Check for inline styles that could be consolidated
  const inlineStyleRegex = /\bstyle\s*=\s*["'][^"']+["']/gi;
  let inlineCount = 0;
  let match;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    inlineCount++;
  }
  if (inlineCount > 10) {
    issues.push({
      severity: "warning",
      category: "Performance",
      message: `Found ${inlineCount} inline styles — consider consolidating into a <style> block`,
    });
  } else {
    passed.push("Performance: Inline styles within acceptable range");
  }

  // Check for images without width/height
  const imgRegex = /<img\s[^>]*>/gi;
  let imgsMissingDimensions = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    const hasWidth = /\bwidth\s*=/i.test(tag);
    const hasHeight = /\bheight\s*=/i.test(tag);
    if (!hasWidth || !hasHeight) {
      imgsMissingDimensions++;
      issues.push({
        severity: "info",
        category: "Performance",
        message:
          "Image missing explicit width/height attributes (causes layout shift)",
        line: findLineNumber(html, match.index),
      });
    }
  }
  if (imgsMissingDimensions === 0) {
    passed.push("Performance: All images have width/height attributes");
  }

  // Check DOM nesting depth
  const lines = html.split("\n");
  let maxDepth = 0;
  let currentDepth = 0;
  const selfClosingTags = new Set([
    "img",
    "br",
    "hr",
    "input",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "source",
    "track",
    "wbr",
  ]);

  for (const line of lines) {
    const openTags = line.match(/<([a-z][a-z0-9]*)\b[^>]*(?<!\/)>/gi) || [];
    const closeTags = line.match(/<\/[a-z][a-z0-9]*>/gi) || [];

    for (const tag of openTags) {
      const tagName = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase();
      if (tagName && !selfClosingTags.has(tagName)) {
        currentDepth++;
        if (currentDepth > maxDepth) maxDepth = currentDepth;
      }
    }
    for (const _tag of closeTags) {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  if (maxDepth > 32) {
    issues.push({
      severity: "warning",
      category: "Performance",
      message: `Excessive DOM nesting depth: ${maxDepth} levels (recommended max: 32)`,
    });
  } else {
    passed.push(`Performance: DOM nesting depth OK (${maxDepth} levels)`);
  }
}

function checkSecurity(html: string, issues: Issue[], passed: string[]) {
  // Check for inline event handlers
  const eventHandlerRegex =
    /\b(onclick|onmouseover|onmouseout|onload|onerror|onsubmit|onfocus|onblur|onchange|onkeydown|onkeyup|onkeypress)\s*=/gi;
  let match;
  let handlerCount = 0;

  while ((match = eventHandlerRegex.exec(html)) !== null) {
    handlerCount++;
    issues.push({
      severity: "warning",
      category: "Security",
      message: `Inline event handler "${match[1]}" found — prefer addEventListener`,
      line: findLineNumber(html, match.index),
    });
  }
  if (handlerCount === 0) {
    passed.push("Security: No inline event handlers");
  }

  // Check for external scripts from unknown CDNs
  const scriptSrcRegex = /<script\s[^>]*src\s*=\s*["']([^"']+)["']/gi;
  const trustedDomains = [
    "cdn.jsdelivr.net",
    "cdnjs.cloudflare.com",
    "unpkg.com",
    "fonts.googleapis.com",
    "ajax.googleapis.com",
    "code.jquery.com",
    "stackpath.bootstrapcdn.com",
    "cdn.tailwindcss.com",
    "ga.jspm.io",
  ];

  let untrustedScripts = 0;
  while ((match = scriptSrcRegex.exec(html)) !== null) {
    const url = match[1];
    // Skip relative URLs
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//")) {
      continue;
    }
    const isTrusted = trustedDomains.some((domain) => url.includes(domain));
    if (!isTrusted) {
      untrustedScripts++;
      issues.push({
        severity: "warning",
        category: "Security",
        message: `External script from untrusted source: ${url}`,
        line: findLineNumber(html, match.index),
      });
    }
  }
  if (untrustedScripts === 0) {
    passed.push("Security: No untrusted external scripts");
  }
}

function checkMobile(html: string, issues: Issue[], passed: string[]) {
  // Viewport meta check (already covered in structure, but check content value)
  const viewportMatch = html.match(
    /<meta\s[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i
  );
  if (viewportMatch) {
    const content = viewportMatch[1];
    if (/width\s*=\s*device-width/i.test(content)) {
      passed.push("Mobile: Viewport width set to device-width");
    } else {
      issues.push({
        severity: "warning",
        category: "Mobile",
        message: "Viewport meta should include width=device-width",
      });
    }
  }

  // Check for fixed widths that break mobile
  const fixedWidthRegex = /width\s*:\s*(\d{4,})px/gi;
  let match;
  let fixedWidthCount = 0;
  while ((match = fixedWidthRegex.exec(html)) !== null) {
    const width = parseInt(match[1]);
    if (width > 500) {
      fixedWidthCount++;
      issues.push({
        severity: "warning",
        category: "Mobile",
        message: `Fixed width of ${width}px may break on mobile devices`,
        line: findLineNumber(html, match.index),
      });
    }
  }

  // Also check min-width with large values
  const minWidthRegex = /min-width\s*:\s*(\d{4,})px/gi;
  while ((match = minWidthRegex.exec(html)) !== null) {
    const width = parseInt(match[1]);
    // Ignore media query min-widths
    const before = html.substring(Math.max(0, match.index - 50), match.index);
    if (width > 500 && !before.includes("@media")) {
      fixedWidthCount++;
      issues.push({
        severity: "warning",
        category: "Mobile",
        message: `min-width of ${width}px may break on mobile devices`,
        line: findLineNumber(html, match.index),
      });
    }
  }

  if (fixedWidthCount === 0) {
    passed.push("Mobile: No problematic fixed widths detected");
  }
}

function checkJavaScript(html: string, issues: Issue[], passed: string[]) {
  // Extract script content
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let consoleLogCount = 0;
  let varCount = 0;

  while ((match = scriptRegex.exec(html)) !== null) {
    // Skip external scripts
    if (/\bsrc\s*=/i.test(match[0].substring(0, match[0].indexOf(">")))) {
      continue;
    }

    const scriptContent = match[1];
    const scriptStart =
      match.index + match[0].indexOf(">") + 1;

    // Check for console.log
    const consoleRegex = /\bconsole\.(log|debug|info)\s*\(/g;
    let consoleMatch;
    while ((consoleMatch = consoleRegex.exec(scriptContent)) !== null) {
      consoleLogCount++;
      issues.push({
        severity: "info",
        category: "JavaScript",
        message: `console.${consoleMatch[1]}() call found — remove for production`,
        line: findLineNumber(html, scriptStart + consoleMatch.index),
      });
    }

    // Check for var usage (but not inside strings or comments)
    // Simple approach: look for var at word boundary
    const varRegex = /\bvar\s+/g;
    let varMatch;
    while ((varMatch = varRegex.exec(scriptContent)) !== null) {
      // Basic check: skip if inside a single-line comment or string
      const lineStart = scriptContent.lastIndexOf("\n", varMatch.index) + 1;
      const lineContent = scriptContent.substring(lineStart, varMatch.index);
      if (lineContent.includes("//")) continue;

      varCount++;
      issues.push({
        severity: "info",
        category: "JavaScript",
        message: "Use 'let' or 'const' instead of 'var'",
        line: findLineNumber(html, scriptStart + varMatch.index),
      });
    }
  }

  if (consoleLogCount === 0) {
    passed.push("JavaScript: No console.log statements");
  }
  if (varCount === 0) {
    passed.push("JavaScript: No 'var' usage (uses let/const)");
  }
}

function calculateScore(issues: Issue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 10;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function getGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const issues: Issue[] = [];
    const passed: string[] = [];

    checkHTMLStructure(html, issues, passed);
    checkBrokenResources(html, issues, passed);
    checkAccessibility(html, issues, passed);
    checkSEO(html, issues, passed);
    checkPerformance(html, issues, passed);
    checkSecurity(html, issues, passed);
    checkMobile(html, issues, passed);
    checkJavaScript(html, issues, passed);

    const score = calculateScore(issues);
    const grade = getGrade(score);

    const result: ValidationResult = {
      score,
      grade,
      issues,
      passed,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("QA validation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
