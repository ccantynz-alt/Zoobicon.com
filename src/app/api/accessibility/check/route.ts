import { NextRequest, NextResponse } from "next/server";

interface CheckResult {
  rule: string;
  wcagLevel: "A" | "AA" | "AAA";
  status: "pass" | "fail" | "warning";
  message: string;
  impact: "critical" | "serious" | "moderate" | "minor";
}

interface AccessibilityReport {
  score: number;
  level: "AAA" | "AA" | "A" | "Fail";
  checks: CheckResult[];
  summary: { passed: number; failed: number; warnings: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return null;
  const num = parseInt(hex, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return null;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── WCAG Checks ──────────────────────────────────────────────────────────────

function checkImagesAltText(html: string): CheckResult {
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  if (imgs.length === 0) {
    return {
      rule: "Images have alt text",
      wcagLevel: "A",
      status: "pass",
      message: "No images found in the document.",
      impact: "critical",
    };
  }
  const missing = imgs.filter((img) => !/\balt\s*=\s*["'][^"']*["']/i.test(img));
  if (missing.length === 0) {
    return {
      rule: "Images have alt text",
      wcagLevel: "A",
      status: "pass",
      message: `All ${imgs.length} image(s) have alt attributes.`,
      impact: "critical",
    };
  }
  return {
    rule: "Images have alt text",
    wcagLevel: "A",
    status: "fail",
    message: `${missing.length} of ${imgs.length} image(s) missing alt attribute.`,
    impact: "critical",
  };
}

function checkFormLabels(html: string): CheckResult {
  const inputs = html.match(/<input\b[^>]*>/gi) || [];
  const relevantInputs = inputs.filter(
    (inp) => !/type\s*=\s*["'](hidden|submit|button|reset|image)["']/i.test(inp)
  );
  if (relevantInputs.length === 0) {
    return {
      rule: "Form inputs have labels",
      wcagLevel: "A",
      status: "pass",
      message: "No form inputs requiring labels found.",
      impact: "critical",
    };
  }

  const labels = html.match(/<label\b[^>]*>[\s\S]*?<\/label>/gi) || [];
  const labelForIds = labels
    .map((l) => {
      const m = l.match(/\bfor\s*=\s*["']([^"']+)["']/i);
      return m ? m[1] : null;
    })
    .filter(Boolean);

  let unlabelled = 0;
  for (const inp of relevantInputs) {
    const idMatch = inp.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(inp);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(inp);
    const hasTitle = /\btitle\s*=\s*["'][^"']+["']/i.test(inp);
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      if (!idMatch || !labelForIds.includes(idMatch[1])) {
        unlabelled++;
      }
    }
  }

  if (unlabelled === 0) {
    return {
      rule: "Form inputs have labels",
      wcagLevel: "A",
      status: "pass",
      message: `All ${relevantInputs.length} form input(s) have associated labels.`,
      impact: "critical",
    };
  }
  return {
    rule: "Form inputs have labels",
    wcagLevel: "A",
    status: "fail",
    message: `${unlabelled} of ${relevantInputs.length} form input(s) missing associated labels.`,
    impact: "critical",
  };
}

function checkLangAttribute(html: string): CheckResult {
  const hasLang = /<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html);
  return {
    rule: "Page has lang attribute",
    wcagLevel: "A",
    status: hasLang ? "pass" : "fail",
    message: hasLang
      ? "HTML element has a lang attribute."
      : "HTML element is missing a lang attribute.",
    impact: "critical",
  };
}

function checkEmptyLinksButtons(html: string): CheckResult {
  const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
  const elements = [...links, ...buttons];

  if (elements.length === 0) {
    return {
      rule: "No empty links or buttons",
      wcagLevel: "A",
      status: "pass",
      message: "No links or buttons found.",
      impact: "critical",
    };
  }

  let emptyCount = 0;
  for (const el of elements) {
    const inner = el.replace(/<[^>]*>/g, "").trim();
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(el);
    const hasTitle = /\btitle\s*=\s*["'][^"']+["']/i.test(el);
    const hasImg = /<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(el);
    const hasSvg = /<svg\b/i.test(el);
    if (!inner && !hasAriaLabel && !hasTitle && !hasImg && !hasSvg) {
      emptyCount++;
    }
  }

  if (emptyCount === 0) {
    return {
      rule: "No empty links or buttons",
      wcagLevel: "A",
      status: "pass",
      message: `All ${elements.length} link(s)/button(s) have discernible text.`,
      impact: "critical",
    };
  }
  return {
    rule: "No empty links or buttons",
    wcagLevel: "A",
    status: "fail",
    message: `${emptyCount} empty link(s) or button(s) found without accessible text.`,
    impact: "critical",
  };
}

function checkHeadingHierarchy(html: string): CheckResult {
  const headingMatches = html.match(/<h([1-6])\b/gi) || [];
  const levels = headingMatches.map((h) => parseInt(h.replace(/<h/i, ""), 10));

  if (levels.length === 0) {
    return {
      rule: "Heading hierarchy is logical",
      wcagLevel: "A",
      status: "warning",
      message: "No headings found in the document.",
      impact: "serious",
    };
  }

  let skipped = false;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      skipped = true;
      break;
    }
  }

  if (!skipped) {
    return {
      rule: "Heading hierarchy is logical",
      wcagLevel: "A",
      status: "pass",
      message: "Heading levels follow a logical order.",
      impact: "serious",
    };
  }
  return {
    rule: "Heading hierarchy is logical",
    wcagLevel: "A",
    status: "fail",
    message: "Heading levels skip one or more levels (e.g., h1 to h3).",
    impact: "serious",
  };
}

function checkKeyboardAccessibility(html: string): CheckResult {
  const negativeTabindex = html.match(/tabindex\s*=\s*["']-1["']/gi) || [];
  // Check if tabindex=-1 is on interactive elements
  const interactiveWithNeg =
    html.match(
      /<(?:a|button|input|select|textarea)\b[^>]*tabindex\s*=\s*["']-1["'][^>]*>/gi
    ) || [];

  if (interactiveWithNeg.length === 0) {
    return {
      rule: "Keyboard accessibility",
      wcagLevel: "A",
      status: "pass",
      message: "No interactive elements are removed from tab order.",
      impact: "critical",
    };
  }
  return {
    rule: "Keyboard accessibility",
    wcagLevel: "A",
    status: "fail",
    message: `${interactiveWithNeg.length} interactive element(s) have tabindex="-1", removing them from keyboard navigation.`,
    impact: "critical",
  };
}

function checkColorContrast(html: string): CheckResult {
  // Look for inline styles with color and background-color hex values
  const styleBlocks =
    html.match(/style\s*=\s*["'][^"']*["']/gi) || [];

  let checked = 0;
  let failures = 0;

  for (const styleAttr of styleBlocks) {
    const colorMatch = styleAttr.match(
      /(?:^|[;"\s])color\s*:\s*(#[0-9a-fA-F]{3,6})\b/i
    );
    const bgMatch = styleAttr.match(
      /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b/i
    );

    if (colorMatch && bgMatch) {
      checked++;
      const ratio = contrastRatio(colorMatch[1], bgMatch[1]);
      if (ratio !== null && ratio < 4.5) {
        failures++;
      }
    }
  }

  if (checked === 0) {
    return {
      rule: "Color contrast ratios",
      wcagLevel: "AA",
      status: "warning",
      message:
        "No inline color/background-color pairs found to check. Use a dedicated contrast tool for thorough testing.",
      impact: "serious",
    };
  }

  if (failures === 0) {
    return {
      rule: "Color contrast ratios",
      wcagLevel: "AA",
      status: "pass",
      message: `All ${checked} inline color pair(s) meet the 4.5:1 contrast ratio.`,
      impact: "serious",
    };
  }
  return {
    rule: "Color contrast ratios",
    wcagLevel: "AA",
    status: "fail",
    message: `${failures} of ${checked} inline color pair(s) fail the 4.5:1 contrast ratio requirement.`,
    impact: "serious",
  };
}

function checkTextResizable(html: string): CheckResult {
  // Extract style blocks and inline styles
  const styleContent =
    (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).join(" ") +
    " " +
    (html.match(/style\s*=\s*["'][^"']*["']/gi) || []).join(" ");

  const fontSizeDeclarations =
    styleContent.match(/font-size\s*:\s*([^;}"']+)/gi) || [];

  if (fontSizeDeclarations.length === 0) {
    return {
      rule: "Text is resizable",
      wcagLevel: "AA",
      status: "pass",
      message: "No explicit font-size declarations found; browser defaults are resizable.",
      impact: "serious",
    };
  }

  const pxOnly = fontSizeDeclarations.filter((decl) => {
    const value = decl.replace(/font-size\s*:\s*/i, "").trim();
    // Allow rem, em, %, vw, vh, clamp, calc, inherit, unset, var
    if (/\b(rem|em|%|vw|vh)\b/i.test(value)) return false;
    if (/\b(clamp|calc|var|inherit|unset|initial)\b/i.test(value)) return false;
    // Only flag if it uses px
    if (/\bpx\b/i.test(value)) return true;
    return false;
  });

  if (pxOnly.length === 0) {
    return {
      rule: "Text is resizable",
      wcagLevel: "AA",
      status: "pass",
      message: `All ${fontSizeDeclarations.length} font-size declaration(s) use relative units.`,
      impact: "serious",
    };
  }
  return {
    rule: "Text is resizable",
    wcagLevel: "AA",
    status: "fail",
    message: `${pxOnly.length} font-size declaration(s) use px instead of relative units (rem, em, clamp).`,
    impact: "serious",
  };
}

function checkFocusIndicators(html: string): CheckResult {
  const styleContent = (
    html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  ).join(" ");

  const hasFocusStyles = /:focus/i.test(styleContent);
  const hasFocusVisible = /:focus-visible/i.test(styleContent);
  const hasOutlineNone = /outline\s*:\s*none/i.test(styleContent) || /outline\s*:\s*0\b/i.test(styleContent);

  if (hasOutlineNone && !hasFocusStyles && !hasFocusVisible) {
    return {
      rule: "Focus indicators exist",
      wcagLevel: "AA",
      status: "fail",
      message:
        "Outline is removed (outline: none) without providing alternative focus styles.",
      impact: "serious",
    };
  }

  if (hasFocusStyles || hasFocusVisible) {
    return {
      rule: "Focus indicators exist",
      wcagLevel: "AA",
      status: "pass",
      message: "Focus styles are defined in the stylesheet.",
      impact: "serious",
    };
  }

  return {
    rule: "Focus indicators exist",
    wcagLevel: "AA",
    status: "warning",
    message:
      "No explicit :focus styles found. Browser defaults may suffice, but custom styles are recommended.",
    impact: "serious",
  };
}

function checkSkipNavigation(html: string): CheckResult {
  // Look for skip-to-content / skip-nav pattern
  const hasSkipLink =
    /<a\b[^>]*href\s*=\s*["']#(main|content|main-content|maincontent)[^"']*["'][^>]*>/i.test(
      html
    ) ||
    /skip\s*(to\s*)?(main|content|nav)/i.test(html);

  return {
    rule: "Skip navigation link",
    wcagLevel: "AA",
    status: hasSkipLink ? "pass" : "warning",
    message: hasSkipLink
      ? "Skip navigation link found."
      : "No skip navigation link detected. Consider adding one for keyboard users.",
    impact: "moderate",
  };
}

function checkSingleH1(html: string): CheckResult {
  const h1s = html.match(/<h1\b/gi) || [];
  if (h1s.length === 1) {
    return {
      rule: "Page has only one h1",
      wcagLevel: "AA",
      status: "pass",
      message: "Page has exactly one h1 element.",
      impact: "moderate",
    };
  }
  if (h1s.length === 0) {
    return {
      rule: "Page has only one h1",
      wcagLevel: "AA",
      status: "fail",
      message: "Page has no h1 element. Each page should have exactly one.",
      impact: "moderate",
    };
  }
  return {
    rule: "Page has only one h1",
    wcagLevel: "AA",
    status: "fail",
    message: `Page has ${h1s.length} h1 elements. There should be exactly one.`,
    impact: "moderate",
  };
}

function checkDescriptiveLinkText(html: string): CheckResult {
  const links = html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || [];
  if (links.length === 0) {
    return {
      rule: "Descriptive link text",
      wcagLevel: "AAA",
      status: "pass",
      message: "No links found.",
      impact: "minor",
    };
  }

  const vaguePhrases =
    /^(click here|here|read more|more|learn more|link|this|go|download|info|details)$/i;

  let vagueCount = 0;
  for (const link of links) {
    const text = link.replace(/<[^>]*>/g, "").trim();
    if (vaguePhrases.test(text)) {
      vagueCount++;
    }
  }

  if (vagueCount === 0) {
    return {
      rule: "Descriptive link text",
      wcagLevel: "AAA",
      status: "pass",
      message: "All link text appears descriptive.",
      impact: "minor",
    };
  }
  return {
    rule: "Descriptive link text",
    wcagLevel: "AAA",
    status: "warning",
    message: `${vagueCount} link(s) use vague text like "click here" or "read more". Use descriptive text instead.`,
    impact: "minor",
  };
}

function checkReducedMotion(html: string): CheckResult {
  const styleContent = (
    html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  ).join(" ");

  const hasAnimations =
    /animation\s*:/i.test(styleContent) || /transition\s*:/i.test(styleContent);
  const hasReducedMotion = /prefers-reduced-motion/i.test(styleContent);

  if (!hasAnimations) {
    return {
      rule: "Reduced motion support",
      wcagLevel: "AAA",
      status: "pass",
      message: "No CSS animations or transitions detected.",
      impact: "minor",
    };
  }

  if (hasReducedMotion) {
    return {
      rule: "Reduced motion support",
      wcagLevel: "AAA",
      status: "pass",
      message: "prefers-reduced-motion media query is present.",
      impact: "minor",
    };
  }

  return {
    rule: "Reduced motion support",
    wcagLevel: "AAA",
    status: "warning",
    message:
      "Animations/transitions found but no prefers-reduced-motion media query detected.",
    impact: "minor",
  };
}

function checkTextSpacing(html: string): CheckResult {
  const styleContent =
    (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).join(" ") +
    " " +
    (html.match(/style\s*=\s*["'][^"']*["']/gi) || []).join(" ");

  const lineHeightDeclarations =
    styleContent.match(/line-height\s*:\s*([^;}"']+)/gi) || [];

  if (lineHeightDeclarations.length === 0) {
    return {
      rule: "Adequate text spacing",
      wcagLevel: "AAA",
      status: "warning",
      message:
        "No explicit line-height declarations found. Browser defaults (~1.2) may be too tight.",
      impact: "minor",
    };
  }

  let inadequate = 0;
  for (const decl of lineHeightDeclarations) {
    const value = decl.replace(/line-height\s*:\s*/i, "").trim();
    // Parse unitless numbers
    const num = parseFloat(value);
    if (!isNaN(num) && !/\b(px|rem|em|%)\b/i.test(value)) {
      // unitless line-height
      if (num < 1.5) inadequate++;
    }
  }

  if (inadequate === 0) {
    return {
      rule: "Adequate text spacing",
      wcagLevel: "AAA",
      status: "pass",
      message: "Line-height values meet the >= 1.5 recommendation.",
      impact: "minor",
    };
  }
  return {
    rule: "Adequate text spacing",
    wcagLevel: "AAA",
    status: "warning",
    message: `${inadequate} line-height declaration(s) are below the recommended 1.5 value.`,
    impact: "minor",
  };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

function calculateScore(checks: CheckResult[]): number {
  const weights: Record<string, number> = {
    critical: 15,
    serious: 10,
    moderate: 5,
    minor: 3,
  };

  let totalWeight = 0;
  let earned = 0;

  for (const check of checks) {
    const w = weights[check.impact] || 5;
    totalWeight += w;
    if (check.status === "pass") {
      earned += w;
    } else if (check.status === "warning") {
      earned += w * 0.5;
    }
  }

  if (totalWeight === 0) return 100;
  return Math.round((earned / totalWeight) * 100);
}

function determineLevel(checks: CheckResult[]): "AAA" | "AA" | "A" | "Fail" {
  const levelAChecks = checks.filter((c) => c.wcagLevel === "A");
  const levelAAChecks = checks.filter((c) => c.wcagLevel === "AA");
  const levelAAAChecks = checks.filter((c) => c.wcagLevel === "AAA");

  const allAPass = levelAChecks.every((c) => c.status !== "fail");
  const allAAPass = levelAAChecks.every((c) => c.status !== "fail");
  const allAAAPass = levelAAAChecks.every((c) => c.status !== "fail");

  if (!allAPass) return "Fail";
  if (!allAAPass) return "A";
  if (!allAAAPass) return "AA";
  return "AAA";
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "An HTML string is required in the request body." },
        { status: 400 }
      );
    }

    if (html.length > 500_000) {
      return NextResponse.json(
        { error: "HTML too large (max 500,000 characters)." },
        { status: 400 }
      );
    }

    // Run all checks
    const checks: CheckResult[] = [
      // Level A
      checkImagesAltText(html),
      checkFormLabels(html),
      checkLangAttribute(html),
      checkEmptyLinksButtons(html),
      checkHeadingHierarchy(html),
      checkKeyboardAccessibility(html),
      // Level AA
      checkColorContrast(html),
      checkTextResizable(html),
      checkFocusIndicators(html),
      checkSkipNavigation(html),
      checkSingleH1(html),
      // Level AAA
      checkDescriptiveLinkText(html),
      checkReducedMotion(html),
      checkTextSpacing(html),
    ];

    const score = calculateScore(checks);
    const level = determineLevel(checks);
    const summary = {
      passed: checks.filter((c) => c.status === "pass").length,
      failed: checks.filter((c) => c.status === "fail").length,
      warnings: checks.filter((c) => c.status === "warning").length,
    };

    const report: AccessibilityReport = { score, level, checks, summary };

    return NextResponse.json(report);
  } catch (err) {
    console.error("Accessibility check error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
