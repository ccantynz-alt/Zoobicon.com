import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

interface AccessibilityIssue {
  rule: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  element: string;
  fix: string;
}

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { html, url } = await req.json();

    if (!html && !url) return apiError(400, "missing_input", "html or url is required");

    const context = url ? `Page URL: ${url}\n` : "";
    const htmlSnippet = html ? html.substring(0, 10000) : "";

    const systemPrompt = `You are a WCAG 2.1 AA accessibility expert.
Analyze the provided HTML for accessibility issues and generate both a list of issues and a corrected version of the HTML.
Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "issues": [
    {
      "rule": "<WCAG rule ID e.g. 1.1.1, 2.4.6, 4.1.2>",
      "severity": "<critical|serious|moderate|minor>",
      "element": "<the offending HTML element or selector>",
      "fix": "<specific fix instruction>"
    }
  ],
  "fixed_html": "<the corrected HTML with all fixes applied>"
}
Focus on the most impactful WCAG AA violations:
- Missing or empty alt attributes on images (1.1.1)
- Insufficient color contrast (1.4.3)
- Missing form labels (1.3.1, 2.4.6)
- Missing ARIA landmarks (1.3.1)
- Links without descriptive text (2.4.4)
- Missing document language (3.1.1)
- Missing focus indicators (2.4.7)
- Keyboard traps or non-focusable interactive elements (2.1.1)`;

    const userPrompt = `${context}${htmlSnippet ? `HTML to audit:\n${htmlSnippet}` : "Audit this URL for common accessibility issues and provide typical fixes."}`;

    const response = await callAI(systemPrompt, userPrompt, 4000);

    let result: { issues: AccessibilityIssue[]; fixed_html: string };
    try {
      result = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      // Fallback with common issues and original HTML
      result = {
        issues: [
          {
            rule: "1.1.1",
            severity: "critical",
            element: "img",
            fix: "Add descriptive alt attributes to all <img> tags. Use alt=\"\" for decorative images.",
          },
          {
            rule: "1.4.3",
            severity: "serious",
            element: "body",
            fix: "Ensure all text has a contrast ratio of at least 4.5:1 against its background color.",
          },
          {
            rule: "2.4.4",
            severity: "moderate",
            element: "a",
            fix: "Replace generic link text like 'click here' or 'read more' with descriptive text that explains the destination.",
          },
        ],
        fixed_html: html || "",
      };
    }

    if (!Array.isArray(result.issues)) result.issues = [];

    return apiResponse(result);
  } catch (error) {
    console.error("[wp-accessibility]", error);
    return apiError(500, "audit_failed", "Accessibility audit failed");
  }
}
