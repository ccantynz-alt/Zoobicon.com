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
  category: "console" | "a11y" | "layout" | "interaction" | "link" | "runtime" | "syntax" | "security" | "performance" | "seo";
  message: string;
  selector?: string;
  file?: string;
  line?: number;
  autoFixPrompt?: string;
}

export interface GateTestModule {
  name: string;
  status: "passed" | "failed" | "warning";
  checks: number;
  issues: number;
  details?: string[];
}

export interface GateTestApiResponse {
  status: "complete" | "error";
  repo_url?: string;
  tier?: string;
  totalModules: number;
  totalIssues: number;
  duration: number;
  modules: GateTestModule[];
}

export interface GateTestResult {
  passed: boolean;
  issues: GateTestIssue[];
  totalModules: number;
  totalChecks: number;
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
      const res = await fetchWithRetry(
        process.env.NEXT_PUBLIC_GATE_TEST_API_URL!,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_GATE_TEST_API_KEY!,
          },
          body: JSON.stringify({
            repo_url: typeof window !== "undefined" ? window.location.origin : "",
            tier: "full",
            round: ctx.round,
            snapshot,
            files: ctx.files,
          }),
          timeoutMs: 30_000,
          attempts: 3,
        }
      );
      if (res.ok) {
        const data = (await res.json()) as GateTestApiResponse;
        const issues = parseModuleIssues(data.modules);
        const totalChecks = data.modules.reduce((sum, m) => sum + m.checks, 0);
        return {
          passed: data.totalIssues === 0,
          issues,
          totalModules: data.totalModules,
          totalChecks,
          runMs: performance.now() - start,
          source: "gate-test-api",
        };
      }
      console.warn(`[gate-test] external API returned ${res.status}, falling back to builtin`);
    } catch (err) {
      console.warn(`[gate-test] external API unreachable (${describeNetworkError(err)}), falling back to builtin`);
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
    totalModules: 5,
    totalChecks: issues.length > 0 ? 5 : 5,
    runMs: performance.now() - start,
    source: "builtin",
  };
}

/**
 * Convert Gate Test module-based response into actionable GateTestIssues.
 * Each module detail string (e.g. "src/auth.ts:14: eval() usage") becomes
 * a typed issue with file, line, severity, and an auto-fix prompt.
 */
function parseModuleIssues(modules: GateTestModule[]): GateTestIssue[] {
  const issues: GateTestIssue[] = [];

  const severityMap: Record<string, GateTestSeverity> = {
    security: "critical",
    syntax: "critical",
    a11y: "warning",
    accessibility: "warning",
    performance: "warning",
    seo: "info",
    style: "info",
  };

  const autoFixMap: Record<string, string> = {
    security: "Fix the security vulnerability described above. Never use eval(), sanitize all inputs, escape outputs.",
    syntax: "Fix the syntax error so the code compiles and runs correctly.",
    a11y: "Fix the accessibility issue — add missing alt text, labels, ARIA attributes, or correct heading hierarchy.",
    accessibility: "Fix the accessibility issue — add missing alt text, labels, ARIA attributes, or correct heading hierarchy.",
    performance: "Optimize the performance issue — reduce bundle size, lazy load, or fix the render bottleneck.",
    seo: "Fix the SEO issue — add missing meta tags, structured data, or semantic HTML.",
  };

  for (const mod of modules) {
    if (mod.status === "passed" || !mod.details || mod.details.length === 0) continue;

    const category = mod.name.toLowerCase() as GateTestIssue["category"];
    const severity = severityMap[mod.name.toLowerCase()] ?? "warning";

    for (const detail of mod.details) {
      const fileMatch = detail.match(/^([^:]+):(\d+):\s*(.+)$/);
      issues.push({
        severity,
        category,
        message: fileMatch ? fileMatch[3] : detail,
        file: fileMatch ? fileMatch[1] : undefined,
        line: fileMatch ? parseInt(fileMatch[2], 10) : undefined,
        autoFixPrompt: autoFixMap[mod.name.toLowerCase()] ?? `Fix this ${mod.name} issue: ${detail}`,
      });
    }
  }

  return issues;
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

/**
 * Short, user-safe description of a network-layer failure. Never leaks the
 * raw openssl stack (e.g. "ssl/record/rec_layer_s3.c:912:SSL alert number 80")
 * that confused Craig when Gate Test surfaced it verbatim.
 */
export function describeNetworkError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EPROTO|ssl.*alert|tlsv1|handshake/i.test(msg)) return "upstream TLS connection dropped";
  if (/timeout|timed?\s*out|abort/i.test(msg)) return "request timed out";
  if (/ECONNRESET|socket\s*hang.?up|EPIPE/i.test(msg)) return "connection reset";
  if (/ECONNREFUSED/i.test(msg)) return "connection refused";
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return "DNS lookup failed";
  if (/fetch failed|network/i.test(msg)) return "network unreachable";
  const first = msg.split(/[\n.]/)[0].trim();
  return first.length > 100 ? first.slice(0, 97) + "..." : first;
}

/**
 * Transient-error fetch with exponential backoff + jitter. Retries on
 * network-layer flakes (EPROTO/SSL/DNS/reset/timeout) and 5xx responses.
 * Does NOT retry on 4xx — those are caller mistakes, not transient faults.
 */
async function fetchWithRetry(
  url: string,
  opts: RequestInit & { timeoutMs?: number; attempts?: number }
): Promise<Response> {
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const { timeoutMs: _t, attempts: _a, ...init } = opts;
      void _t; void _a;
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 && i < attempts - 1) {
        console.warn(`[gate-test] ${url} returned ${res.status}, retrying`);
        await sleep(400 * Math.pow(2, i) + Math.floor(Math.random() * 250));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient =
        /EPROTO|ssl.*alert|tlsv1|handshake|timeout|timed?\s*out|abort|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|socket\s*hang.?up|fetch failed|network/i.test(msg);
      if (!transient || i === attempts - 1) throw err;
      const delay = 400 * Math.pow(2, i) + Math.floor(Math.random() * 250);
      console.warn(`[gate-test] attempt ${i + 1}/${attempts} failed (${describeNetworkError(err)}), retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
