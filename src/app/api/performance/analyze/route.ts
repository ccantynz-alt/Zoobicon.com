import { NextRequest, NextResponse } from "next/server";

interface PerformanceMetrics {
  cssSize: number;
  jsSize: number;
  imageCount: number;
  externalRequests: number;
  domDepth: number;
  totalSize: number;
}

interface PerformanceIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  suggestion: string;
}

interface PerformanceResult {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  optimizations: string[];
}

function extractBlocks(html: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "gi"
  );
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function calculateDomDepth(html: string): number {
  let maxDepth = 0;
  let currentDepth = 0;
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
  const voidElements = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    if (voidElements.has(tagName) || tag.endsWith("/>")) continue;
    if (tag.startsWith("</")) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }
  return maxDepth;
}

function checkLoading(html: string, issues: PerformanceIssue[]): {
  cssSize: number;
  jsSize: number;
  imageCount: number;
  externalRequests: number;
} {
  const styleBlocks = extractBlocks(html, "style");
  const cssSize = styleBlocks.reduce((sum, block) => sum + block.length, 0);

  const scriptBlocks = extractBlocks(html, "script");
  const inlineJsSize = scriptBlocks.reduce(
    (sum, block) => sum + block.length,
    0
  );

  const externalCss = (html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || []).length;
  const externalJs = (html.match(/<script[^>]+src=["'][^"']+["'][^>]*>/gi) || []).length;
  const externalRequests = externalCss + externalJs;

  const imageCount = (html.match(/<img\s/gi) || []).length;

  if (cssSize > 50000) {
    issues.push({
      severity: "critical",
      category: "Loading",
      message: `Inline CSS is ${(cssSize / 1024).toFixed(1)}KB — very large`,
      suggestion:
        "Split CSS into critical and non-critical. Inline only above-the-fold styles and lazy-load the rest.",
    });
  } else if (cssSize > 20000) {
    issues.push({
      severity: "warning",
      category: "Loading",
      message: `Inline CSS is ${(cssSize / 1024).toFixed(1)}KB`,
      suggestion:
        "Consider extracting non-critical CSS into an external stylesheet loaded asynchronously.",
    });
  }

  if (inlineJsSize > 100000) {
    issues.push({
      severity: "critical",
      category: "Loading",
      message: `Inline JavaScript is ${(inlineJsSize / 1024).toFixed(1)}KB — very large`,
      suggestion:
        "Move JavaScript to external files and use async/defer attributes. Consider code splitting.",
    });
  } else if (inlineJsSize > 30000) {
    issues.push({
      severity: "warning",
      category: "Loading",
      message: `Inline JavaScript is ${(inlineJsSize / 1024).toFixed(1)}KB`,
      suggestion:
        "Consider externalizing scripts and using defer to avoid blocking rendering.",
    });
  }

  if (externalRequests > 10) {
    issues.push({
      severity: "warning",
      category: "Loading",
      message: `${externalRequests} external resource requests detected`,
      suggestion:
        "Reduce external requests by bundling CSS/JS files, using sprites, or inlining critical resources.",
    });
  }

  if (imageCount > 15) {
    issues.push({
      severity: "warning",
      category: "Loading",
      message: `${imageCount} images found — high image count`,
      suggestion:
        "Ensure all below-the-fold images use lazy loading. Consider using CSS sprites or SVGs for icons.",
    });
  }

  return { cssSize, jsSize: inlineJsSize, imageCount, externalRequests };
}

function checkRendering(html: string, issues: PerformanceIssue[]): void {
  const scriptBlocks = extractBlocks(html, "script");
  const allJs = scriptBlocks.join("\n");

  // Layout thrashing: reading layout properties then writing styles
  const readProps = [
    "offsetTop", "offsetLeft", "offsetWidth", "offsetHeight",
    "scrollTop", "scrollLeft", "scrollWidth", "scrollHeight",
    "clientTop", "clientLeft", "clientWidth", "clientHeight",
    "getBoundingClientRect", "getComputedStyle",
  ];
  const writeProps = [
    "\\.style\\.", "\\.className", "\\.classList",
    "\\.setAttribute\\([\"']style",
    "\\.innerHTML", "\\.outerHTML",
  ];

  const readPattern = new RegExp(`(${readProps.join("|")})`, "g");
  const writePattern = new RegExp(`(${writeProps.join("|")})`, "g");
  const readMatches = allJs.match(readPattern) || [];
  const writeMatches = allJs.match(writePattern) || [];

  if (readMatches.length > 0 && writeMatches.length > 0) {
    // Check for interleaved reads/writes (potential layout thrashing)
    const lines = allJs.split("\n");
    let lastRead = -1;
    let thrashingDetected = false;
    for (let i = 0; i < lines.length; i++) {
      if (readPattern.test(lines[i])) {
        readPattern.lastIndex = 0;
        lastRead = i;
      }
      if (writePattern.test(lines[i]) && lastRead >= 0 && lastRead < i) {
        writePattern.lastIndex = 0;
        thrashingDetected = true;
        break;
      }
      writePattern.lastIndex = 0;
    }
    if (thrashingDetected) {
      issues.push({
        severity: "warning",
        category: "Rendering",
        message:
          "Potential layout thrashing detected — DOM reads followed by writes",
        suggestion:
          "Batch DOM reads together before writes. Use requestAnimationFrame to separate read and write phases.",
      });
    }
  }

  // Forced reflows from setting styles in loops
  const loopStylePattern =
    /for\s*\(|while\s*\(|\.forEach\s*\([\s\S]*?\.(style\.|className|classList)/g;
  if (loopStylePattern.test(allJs)) {
    issues.push({
      severity: "warning",
      category: "Rendering",
      message: "Style mutations detected inside loops — may cause forced reflows",
      suggestion:
        "Minimize DOM style changes inside loops. Use CSS classes, documentFragment, or batch changes with requestAnimationFrame.",
    });
  }
}

function checkCSS(html: string, issues: PerformanceIssue[]): void {
  const styleBlocks = extractBlocks(html, "style");
  const allCss = styleBlocks.join("\n");

  // !important usage
  const importantCount = (allCss.match(/!important/g) || []).length;
  if (importantCount > 10) {
    issues.push({
      severity: "warning",
      category: "CSS",
      message: `${importantCount} uses of !important found`,
      suggestion:
        "Reduce !important usage by improving selector specificity and CSS architecture. Overuse indicates specificity wars.",
    });
  } else if (importantCount > 0) {
    issues.push({
      severity: "info",
      category: "CSS",
      message: `${importantCount} use(s) of !important found`,
      suggestion:
        "Consider refactoring selectors to avoid !important where possible.",
    });
  }

  // Overly specific selectors (4+ levels of nesting)
  const selectorPattern = /([^{};]+)\{/g;
  let overlySpecific = 0;
  let selectorMatch;
  while ((selectorMatch = selectorPattern.exec(allCss)) !== null) {
    const selector = selectorMatch[1].trim();
    if (selector.startsWith("@")) continue;
    const parts = selector.split(/\s+/).filter((p) => p && !p.startsWith("@"));
    if (parts.length >= 4) {
      overlySpecific++;
    }
  }
  if (overlySpecific > 5) {
    issues.push({
      severity: "warning",
      category: "CSS",
      message: `${overlySpecific} overly specific selectors found (4+ levels deep)`,
      suggestion:
        "Flatten CSS selectors. Use BEM methodology or utility classes for more maintainable, performant styles.",
    });
  }

  // Unused selectors pattern: check for IDs not present in HTML
  const idSelectorPattern = /#([a-zA-Z][\w-]*)/g;
  let unusedIdSelectors = 0;
  let idMatch;
  while ((idMatch = idSelectorPattern.exec(allCss)) !== null) {
    const id = idMatch[1];
    const idInHtml = new RegExp(`id=["']${id}["']`, "i");
    if (!idInHtml.test(html)) {
      unusedIdSelectors++;
    }
  }
  if (unusedIdSelectors > 0) {
    issues.push({
      severity: "warning",
      category: "CSS",
      message: `${unusedIdSelectors} CSS ID selector(s) reference IDs not found in the HTML`,
      suggestion:
        "Remove unused CSS selectors to reduce file size and improve parse time.",
    });
  }
}

function checkJS(html: string, issues: PerformanceIssue[]): void {
  const scriptBlocks = extractBlocks(html, "script");
  const allJs = scriptBlocks.join("\n");

  // document.write
  if (/document\.write\s*\(/.test(allJs)) {
    issues.push({
      severity: "critical",
      category: "JavaScript",
      message: "document.write() detected — blocks parsing and can blank the page",
      suggestion:
        "Replace document.write() with DOM methods like createElement/appendChild or innerHTML.",
    });
  }

  // Synchronous XHR
  if (/new\s+XMLHttpRequest[\s\S]*?\.open\s*\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*,\s*false\s*\)/.test(allJs)) {
    issues.push({
      severity: "critical",
      category: "JavaScript",
      message: "Synchronous XMLHttpRequest detected — blocks the main thread",
      suggestion:
        "Use asynchronous XHR (third argument true) or switch to the Fetch API.",
    });
  }

  // Blocking scripts in head
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const head = headMatch[1];
    const blockingScripts = head.match(
      /<script(?![^>]*\b(async|defer)\b)[^>]*src=["'][^"']+["'][^>]*>/gi
    );
    if (blockingScripts && blockingScripts.length > 0) {
      issues.push({
        severity: "critical",
        category: "JavaScript",
        message: `${blockingScripts.length} render-blocking script(s) in <head> without async/defer`,
        suggestion:
          "Add 'async' or 'defer' attribute to scripts in <head>, or move them before </body>.",
      });
    }
  }
}

function checkImages(html: string, issues: PerformanceIssue[]): void {
  const imgTags = html.match(/<img[^>]*>/gi) || [];

  let missingLazy = 0;
  let missingDimensions = 0;
  let oversizedHints = 0;

  for (const img of imgTags) {
    // Missing lazy loading (skip if it's likely above-the-fold, i.e., first image)
    if (
      !/loading\s*=\s*["']lazy["']/i.test(img) &&
      imgTags.indexOf(img) !== 0
    ) {
      missingLazy++;
    }

    // Missing width/height
    const hasWidth = /\bwidth\s*=\s*["']?\d+/i.test(img);
    const hasHeight = /\bheight\s*=\s*["']?\d+/i.test(img);
    if (!hasWidth || !hasHeight) {
      missingDimensions++;
    }

    // Oversized dimension hints (> 2000px)
    const widthMatch = img.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const heightMatch = img.match(/\bheight\s*=\s*["']?(\d+)/i);
    if (
      (widthMatch && parseInt(widthMatch[1]) > 2000) ||
      (heightMatch && parseInt(heightMatch[1]) > 2000)
    ) {
      oversizedHints++;
    }
  }

  if (missingLazy > 0) {
    issues.push({
      severity: "warning",
      category: "Images",
      message: `${missingLazy} image(s) missing loading="lazy" attribute`,
      suggestion:
        'Add loading="lazy" to below-the-fold images to defer loading until they are near the viewport.',
    });
  }

  if (missingDimensions > 0) {
    issues.push({
      severity: "warning",
      category: "Images",
      message: `${missingDimensions} image(s) missing explicit width/height attributes`,
      suggestion:
        "Add width and height attributes to images to prevent Cumulative Layout Shift (CLS).",
    });
  }

  if (oversizedHints > 0) {
    issues.push({
      severity: "info",
      category: "Images",
      message: `${oversizedHints} image(s) with dimension hints exceeding 2000px`,
      suggestion:
        "Serve appropriately sized images. Use srcset and sizes attributes for responsive images.",
    });
  }
}

function checkBestPractices(html: string, issues: PerformanceIssue[]): void {
  const scriptBlocks = extractBlocks(html, "script");
  const allJs = scriptBlocks.join("\n");

  // HTTP resources (mixed content)
  const httpResources = html.match(
    /(?:src|href|action)\s*=\s*["']http:\/\//gi
  );
  if (httpResources && httpResources.length > 0) {
    issues.push({
      severity: "critical",
      category: "Best Practices",
      message: `${httpResources.length} insecure HTTP resource(s) detected (mixed content)`,
      suggestion:
        "Use HTTPS for all external resources to avoid mixed content warnings and security issues.",
    });
  }

  // Deprecated APIs
  const deprecatedAPIs = [
    { pattern: /document\.all\b/, name: "document.all" },
    { pattern: /document\.layers\b/, name: "document.layers" },
    { pattern: /window\.showModalDialog\b/, name: "showModalDialog" },
    {
      pattern: /navigator\.appName\b/,
      name: "navigator.appName (deprecated)",
    },
  ];
  for (const api of deprecatedAPIs) {
    if (api.pattern.test(allJs)) {
      issues.push({
        severity: "warning",
        category: "Best Practices",
        message: `Deprecated API used: ${api.name}`,
        suggestion:
          "Replace deprecated APIs with modern equivalents for better compatibility and future-proofing.",
      });
    }
  }

  // Console statements
  const consoleStatements = (
    allJs.match(/console\.(log|warn|error|info|debug|table|trace)\s*\(/g) || []
  ).length;
  if (consoleStatements > 0) {
    issues.push({
      severity: "info",
      category: "Best Practices",
      message: `${consoleStatements} console statement(s) found`,
      suggestion:
        "Remove console statements in production code to reduce noise and minor performance overhead.",
    });
  }
}

function checkResourceHints(html: string, issues: PerformanceIssue[]): void {
  const hasPreconnect = /<link[^>]+rel=["']preconnect["']/i.test(html);
  const hasPreload = /<link[^>]+rel=["']preload["']/i.test(html);
  const hasDnsPrefetch = /<link[^>]+rel=["']dns-prefetch["']/i.test(html);

  // Check if there are external resources that could benefit from hints
  const externalHosts = new Set<string>();
  const urlPattern = /(?:src|href)\s*=\s*["'](https?:\/\/[^/"']+)/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(html)) !== null) {
    externalHosts.add(urlMatch[1]);
  }

  if (externalHosts.size > 0 && !hasPreconnect) {
    issues.push({
      severity: "info",
      category: "Resource Hints",
      message:
        "No preconnect hints found despite external resource usage",
      suggestion:
        'Add <link rel="preconnect" href="https://domain.com"> for critical third-party origins to speed up connections.',
    });
  }

  if (!hasPreload) {
    issues.push({
      severity: "info",
      category: "Resource Hints",
      message: "No preload hints found",
      suggestion:
        'Use <link rel="preload"> for critical above-the-fold resources like hero images, fonts, and key CSS.',
    });
  }

  if (externalHosts.size > 2 && !hasDnsPrefetch) {
    issues.push({
      severity: "info",
      category: "Resource Hints",
      message:
        "No dns-prefetch hints found despite multiple external origins",
      suggestion:
        'Add <link rel="dns-prefetch" href="//domain.com"> for third-party origins to resolve DNS early.',
    });
  }
}

function calculateScore(issues: PerformanceIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 15;
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

function getGrade(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function generateOptimizations(issues: PerformanceIssue[]): string[] {
  const optimizations: string[] = [];
  const categories = new Set(issues.map((i) => i.category));

  if (categories.has("Loading")) {
    optimizations.push(
      "Minify and compress CSS/JS resources using gzip or Brotli"
    );
    optimizations.push(
      "Implement critical CSS inlining for above-the-fold content"
    );
  }

  if (categories.has("Images")) {
    optimizations.push(
      "Convert images to modern formats (WebP, AVIF) for smaller file sizes"
    );
    optimizations.push(
      "Implement responsive images with srcset and sizes attributes"
    );
  }

  if (categories.has("JavaScript")) {
    optimizations.push(
      "Defer non-critical JavaScript to improve Time to Interactive"
    );
    optimizations.push(
      "Consider code splitting to load only what is needed per page"
    );
  }

  if (categories.has("CSS")) {
    optimizations.push(
      "Run PurgeCSS or similar tools to remove unused CSS rules"
    );
    optimizations.push(
      "Use CSS containment (contain: layout) on independent components"
    );
  }

  if (categories.has("Rendering")) {
    optimizations.push(
      "Use will-change or transform: translateZ(0) to promote elements to GPU layers"
    );
    optimizations.push(
      "Batch DOM reads and writes using requestAnimationFrame"
    );
  }

  if (categories.has("Resource Hints")) {
    optimizations.push(
      "Add resource hints (preconnect, preload, dns-prefetch) for critical resources"
    );
  }

  if (categories.has("Best Practices")) {
    optimizations.push(
      "Enforce HTTPS for all resources to avoid mixed content issues"
    );
  }

  if (optimizations.length === 0) {
    optimizations.push(
      "Page is well-optimized. Consider running real-user monitoring for ongoing insights."
    );
  }

  return optimizations;
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

    if (html.length > 2_000_000) {
      return NextResponse.json(
        { error: "HTML content too large (max 2MB)" },
        { status: 400 }
      );
    }

    const issues: PerformanceIssue[] = [];

    // 1. Loading analysis
    const { cssSize, jsSize, imageCount, externalRequests } = checkLoading(
      html,
      issues
    );

    // 2. Rendering analysis
    checkRendering(html, issues);

    // 3. CSS analysis
    checkCSS(html, issues);

    // 4. JS analysis
    checkJS(html, issues);

    // 5. Images analysis
    checkImages(html, issues);

    // 6. Best Practices analysis
    checkBestPractices(html, issues);

    // 7. Resource Hints analysis
    checkResourceHints(html, issues);

    // Calculate metrics
    const domDepth = calculateDomDepth(html);
    const totalSize = html.length;

    const metrics: PerformanceMetrics = {
      cssSize,
      jsSize,
      imageCount,
      externalRequests,
      domDepth,
      totalSize,
    };

    // Deep DOM depth issue
    if (domDepth > 15) {
      issues.push({
        severity: "warning",
        category: "Rendering",
        message: `DOM nesting depth of ${domDepth} — deeply nested DOM trees slow rendering`,
        suggestion:
          "Flatten DOM structure where possible. Deep nesting increases layout calculation time.",
      });
    }

    const score = calculateScore(issues);
    const grade = getGrade(score);
    const optimizations = generateOptimizations(issues);

    const result: PerformanceResult = {
      score,
      grade,
      metrics,
      issues,
      optimizations,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Performance analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
