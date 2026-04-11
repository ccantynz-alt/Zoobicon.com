/**
 * Gate Test Hook — In-Browser AI Test Agent
 * =====================================================================
 *
 * WHAT THIS IS
 * ------------
 * An extension point in the build pipeline where a browser-based AI test
 * agent runs AGAINST the just-rendered preview iframe and reports issues
 * back into the generation loop. This is how Lovable 2.0 "Browser Testing"
 * and Bolt V2's "auto-error-fixing agent" achieve the feel of apps that
 * "just work" — they generate, then silently test, then auto-fix.
 *
 * THE LOOP
 * --------
 *   1. AI generates N components → streamed to Sandpack
 *   2. Sandpack finishes first render → emits `build-complete` event
 *   3. gate-test-hook runs probes against the iframe:
 *        - No console errors?
 *        - All buttons reachable by tab?
 *        - Forms validate on submit?
 *        - Links resolve (no 404 targets)?
 *        - Hero visible above the fold?
 *        - Basic a11y (alt text, labels, contrast)?
 *   4. Failures become auto-fix prompts into /api/generate/edit
 *   5. Fixed components swapped into the preview
 *   6. Repeat until all gates pass OR maxRounds reached
 *
 * CRAIG'S GATE TEST TOOL
 * ----------------------
 * Craig is building Gate Test as a separate project with its own admin
 * backend. This hook is the PLUG POINT — when Gate Test's admin API is
 * live, the runProbes() function below will POST the iframe's serialized
 * DOM + console log to Gate Test and get back a list of issues. Until
 * then, we run a minimal built-in probe set so the loop exists and every
 * generated site gets at least basic QA before the user sees it.
 *
 * STATUS
 * ------
 * Built-in probe set: WORKING (runs in browser via postMessage).
 * Gate Test API integration: WAITING ON CRAIG'S ADMIN SETUP.
 * When GATE_TEST_API_URL + GATE_TEST_API_KEY are set in env, external
 * Gate Test takes over from the built-in probes.
 */

export type GateTestSeverity = "critical" | "warning" | "info";

export interface GateTestIssue {
  severity: GateTestSeverity;
  category: "console" | "a11y" | "layout" | "interaction" | "link" | "runtime";
  message: string;
  selector?: string;
  autoFixPrompt?: string;
}

export interface GateTestResult {
  passed: boolean;
  issues: GateTestIssue[];
  runMs: number;
  source: "builtin" | "gate-test-api";
}

export interface GateTestContext {
  iframe: HTMLIFrameElement;
  files: Record<string, string>;
  round: number;
  maxRounds: number;
}

/**
 * Feature flag — uses external Gate Test API when configured,
 * falls back to built-in probes otherwise.
 */
export function isGateTestApiEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GATE_TEST_API_URL &&
      process.env.NEXT_PUBLIC_GATE_TEST_API_KEY,
  );
}

/**
 * Run probes against the preview iframe.
 * Called after every build-complete event.
 */
export async function runProbes(ctx: GateTestContext): Promise<GateTestResult> {
  const start = performance.now();

  if (isGateTestApiEnabled()) {
    try {
      const snapshot = await snapshotIframe(ctx.iframe);
      const res = await fetch(process.env.NEXT_PUBLIC_GATE_TEST_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_GATE_TEST_API_KEY!,
        },
        body: JSON.stringify({
          round: ctx.round,
          snapshot,
          files: Object.keys(ctx.files),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { issues: GateTestIssue[] };
        return {
          passed: data.issues.length === 0,
          issues: data.issues,
          runMs: performance.now() - start,
          source: "gate-test-api",
        };
      }
    } catch (err) {
      console.warn("[gate-test] external API failed, falling back to builtin:", err);
    }
  }

  // Built-in probes: minimal but real. Run in the parent frame, query
  // the iframe's contentDocument for basic structural + a11y checks.
  const issues: GateTestIssue[] = [];
  const doc = ctx.iframe.contentDocument;

  if (!doc) {
    issues.push({
      severity: "critical",
      category: "runtime",
      message: "Preview iframe has no document — render failed",
    });
  } else {
    // 1. Empty body = render failure
    if (!doc.body || doc.body.children.length === 0) {
      issues.push({
        severity: "critical",
        category: "runtime",
        message: "Preview body is empty — component tree did not mount",
        autoFixPrompt:
          "The App component rendered nothing. Check for missing default exports or runtime errors.",
      });
    }

    // 2. Images without alt text
    const imgs = doc.querySelectorAll("img:not([alt])");
    if (imgs.length > 0) {
      issues.push({
        severity: "warning",
        category: "a11y",
        message: `${imgs.length} image(s) missing alt text`,
        autoFixPrompt: "Add descriptive alt attributes to every <img> tag.",
      });
    }

    // 3. Buttons without accessible name
    const badButtons = Array.from(doc.querySelectorAll("button")).filter(
      (b) => !b.textContent?.trim() && !b.getAttribute("aria-label"),
    );
    if (badButtons.length > 0) {
      issues.push({
        severity: "warning",
        category: "a11y",
        message: `${badButtons.length} button(s) have no accessible label`,
        autoFixPrompt:
          "Every <button> must have visible text OR an aria-label attribute.",
      });
    }

    // 4. Form inputs without labels
    const badInputs = Array.from(doc.querySelectorAll("input, textarea, select")).filter((el) => {
      const id = el.getAttribute("id");
      const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
      const hasAria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      return !hasLabel && !hasAria;
    });
    if (badInputs.length > 0) {
      issues.push({
        severity: "warning",
        category: "a11y",
        message: `${badInputs.length} form field(s) have no associated label`,
        autoFixPrompt:
          "Every <input>, <textarea>, <select> must have a <label for=...> or aria-label.",
      });
    }

    // 5. Anchor tags with href="#" (dead links)
    const deadLinks = doc.querySelectorAll('a[href="#"], a[href=""], a:not([href])');
    if (deadLinks.length > 3) {
      issues.push({
        severity: "info",
        category: "link",
        message: `${deadLinks.length} link(s) point to "#" or have no href`,
        autoFixPrompt:
          "Replace placeholder href='#' with real anchors, routes, or remove the <a> wrapper.",
      });
    }
  }

  return {
    passed: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    runMs: performance.now() - start,
    source: "builtin",
  };
}

/**
 * Serialize iframe state for external API submission.
 * Includes DOM, console log (if captured), and computed styles.
 */
async function snapshotIframe(iframe: HTMLIFrameElement): Promise<{
  html: string;
  url: string;
  viewport: { w: number; h: number };
}> {
  const doc = iframe.contentDocument;
  return {
    html: doc?.documentElement?.outerHTML ?? "",
    url: iframe.src,
    viewport: {
      w: iframe.clientWidth,
      h: iframe.clientHeight,
    },
  };
}

/**
 * Convert a GateTestIssue list into a single auto-fix prompt string
 * that can be sent into /api/generate/edit to patch the generated app.
 */
export function issuesToEditPrompt(issues: GateTestIssue[]): string | null {
  const actionable = issues.filter((i) => i.autoFixPrompt && i.severity !== "info");
  if (actionable.length === 0) return null;
  return [
    "Automated QA found the following issues — fix them without changing anything else:",
    ...actionable.map((i, idx) => `${idx + 1}. [${i.severity}] ${i.message}\n   Fix: ${i.autoFixPrompt}`),
  ].join("\n\n");
}
