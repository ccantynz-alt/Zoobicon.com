/**
 * Build validator — smoke check that runs server-side after a build
 * completes, BEFORE the client renders the preview.
 *
 * Catches the failure modes that have been silently producing blank
 * previews:
 *   - TypeScript/JSX syntax errors in generated code
 *   - Relative imports that don't resolve to a file in the tree
 *   - External imports outside the GENERATED_SITE_DEPS allow-list
 *     (lucide-react, framer-motion, clsx, tailwind-merge, react,
 *     react-dom — anything else fails Sandpack AND EscapeHatch)
 *   - Missing default export from App.tsx
 *   - Files larger than 60KB (LLM ran off the rails)
 *
 * Returns a structured result the client can render as a clear "your
 * build has these issues" panel instead of letting the preview try +
 * silently fail.
 *
 * What this does NOT catch (requires real Chrome — Phase 2):
 *   - Runtime exceptions in useEffect / event handlers
 *   - Missing API responses (fetch failures inside the rendered UI)
 *   - Visual issues (overlapping elements, broken layouts)
 *   - Accessibility regressions
 *
 * For Phase 2, layer this output with a Browserless.io call to render
 * the same HTML in real Chrome and capture console + paint errors.
 */

export interface BuildValidationIssue {
  severity: "error" | "warning";
  file: string;
  line?: number;
  rule:
    | "syntax"
    | "missing-import"
    | "forbidden-import"
    | "missing-entry"
    | "no-default-export"
    | "file-too-large"
    | "empty-file";
  message: string;
}

export interface BuildValidationResult {
  ok: boolean;
  fileCount: number;
  issues: BuildValidationIssue[];
  /** Top-level summary the UI can show without scrolling. */
  summary: string;
}

// Mirror of GENERATED_SITE_DEPS in react-stream/route.ts. Anything
// outside this list is a forbidden import — Sandpack can't resolve it,
// EscapeHatch's importmap doesn't include it.
const ALLOWED_IMPORTS = new Set<string>([
  "react",
  "react-dom",
  "react-dom/client",
  "lucide-react",
  "framer-motion",
  "clsx",
  "tailwind-merge",
]);

const ALLOWED_PREFIXES = ["react/", "react-dom/", "lucide-react/", "framer-motion/"];

const MAX_FILE_BYTES = 60_000;

/**
 * Strip TS/JSX comments + string literals before regex-matching imports.
 * Keeps the regex from finding imports inside JSX text or strings.
 * Conservative — preserves line numbers so callers can report them.
 */
function stripStringsAndComments(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    // Line comment
    if (ch === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    // Block comment
    if (ch === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      i += 2;
      out += "  ";
      continue;
    }
    // Template literal — preserve length for line counting
    if (ch === "`") {
      out += "`";
      i++;
      while (i < src.length) {
        const c = src[i];
        if (c === "`") {
          out += "`";
          i++;
          break;
        }
        if (c === "\\") {
          out += "  ";
          i += 2;
          continue;
        }
        out += c === "\n" ? "\n" : " ";
        i++;
      }
      continue;
    }
    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      out += quote;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") {
          out += "  ";
          i += 2;
          continue;
        }
        if (src[i] === "\n") break;
        out += " ";
        i++;
      }
      if (src[i] === quote) {
        out += quote;
        i++;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function lineOfMatch(src: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src[i] === "\n") line++;
  }
  return line;
}

/**
 * Resolve a relative import path against the file map. Returns the
 * matched key in the file map, or null if it can't be resolved.
 * Mirrors EscapeHatchPreview's resolveRel so server-validation +
 * client-render agree on what resolves.
 */
function resolveRelative(
  importPath: string,
  fromFile: string,
  files: Set<string>,
): string | null {
  const fromDir = fromFile.includes("/")
    ? fromFile.substring(0, fromFile.lastIndexOf("/") + 1)
    : "";
  let resolved = importPath;
  if (resolved.startsWith("./")) resolved = fromDir + resolved.slice(2);
  else if (resolved.startsWith("../")) {
    let dir = fromDir;
    while (resolved.startsWith("../")) {
      dir = dir.replace(/[^/]+\/$/, "");
      resolved = resolved.slice(3);
    }
    resolved = dir + resolved;
  } else {
    return null; // not relative
  }
  const candidates = [
    resolved,
    `${resolved}.tsx`,
    `${resolved}.ts`,
    `${resolved}.jsx`,
    `${resolved}.js`,
    `${resolved}/index.tsx`,
    `${resolved}/index.ts`,
  ];
  for (const c of candidates) if (files.has(c)) return c;
  return null;
}

/**
 * Very light syntax check — looks for unbalanced braces/parens/brackets
 * after stripping strings + comments. Not a real parser but catches the
 * 90% case of LLM output that's truncated mid-component or missing a
 * closing tag. Real Babel parse would catch more — Phase 2 swap.
 */
function checkSyntax(src: string): { ok: boolean; detail?: string } {
  const cleaned = stripStringsAndComments(src);
  let curly = 0;
  let paren = 0;
  let bracket = 0;
  for (const ch of cleaned) {
    if (ch === "{") curly++;
    else if (ch === "}") curly--;
    else if (ch === "(") paren++;
    else if (ch === ")") paren--;
    else if (ch === "[") bracket++;
    else if (ch === "]") bracket--;
    if (curly < 0) return { ok: false, detail: "extra } before matching {" };
    if (paren < 0) return { ok: false, detail: "extra ) before matching (" };
    if (bracket < 0) return { ok: false, detail: "extra ] before matching [" };
  }
  if (curly !== 0) return { ok: false, detail: `${curly > 0 ? curly : -curly} unbalanced { ${curly > 0 ? "(missing closing)" : "(missing opening)"}` };
  if (paren !== 0) return { ok: false, detail: `${paren > 0 ? paren : -paren} unbalanced ( ${paren > 0 ? "(missing closing)" : "(missing opening)"}` };
  if (bracket !== 0) return { ok: false, detail: `${bracket > 0 ? bracket : -bracket} unbalanced [ ${bracket > 0 ? "(missing closing)" : "(missing opening)"}` };
  return { ok: true };
}

/**
 * Validate a generated file tree. Pure function — safe to call from
 * any environment (API route, edge function, even client).
 */
export function validateBuild(rawFiles: Record<string, string>): BuildValidationResult {
  // Normalise paths — strip leading slashes so resolution is consistent.
  const files: Record<string, string> = {};
  for (const [path, content] of Object.entries(rawFiles)) {
    files[path.replace(/^\/+/, "")] = content;
  }
  const fileSet = new Set(Object.keys(files));
  const issues: BuildValidationIssue[] = [];

  // 1. Must have an entry point
  const entry =
    files["App.tsx"]
      ? "App.tsx"
      : files["App.jsx"]
        ? "App.jsx"
        : files["App.ts"]
          ? "App.ts"
          : files["index.tsx"]
            ? "index.tsx"
            : null;
  if (!entry) {
    issues.push({
      severity: "error",
      file: "(project)",
      rule: "missing-entry",
      message: "No App.tsx / App.jsx / index.tsx in the file tree. Preview cannot render.",
    });
  }

  // 2. Per-file checks
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(tsx?|jsx?)$/.test(path)) continue;

    // Empty / near-empty file
    if (!content.trim() || content.trim().length < 20) {
      issues.push({
        severity: "error",
        file: path,
        rule: "empty-file",
        message: "File is empty or trivially short — the LLM probably bailed mid-generation.",
      });
      continue;
    }

    // Size guard
    if (content.length > MAX_FILE_BYTES) {
      issues.push({
        severity: "warning",
        file: path,
        rule: "file-too-large",
        message: `File is ${(content.length / 1024).toFixed(1)}KB (limit ~60KB). LLM likely produced runaway output — verify before shipping.`,
      });
    }

    // Syntax balance check
    const syntax = checkSyntax(content);
    if (!syntax.ok) {
      issues.push({
        severity: "error",
        file: path,
        rule: "syntax",
        message: `Likely syntax error: ${syntax.detail}. Real parser may give a better message — try the preview to see the exact location.`,
      });
    }

    // Walk import statements after stripping strings + comments so we
    // don't false-positive on a string that LOOKS like an import.
    const cleaned = stripStringsAndComments(content);
    const importRe = /(?:^|\n)\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(cleaned))) {
      const imp = m[1];
      const line = lineOfMatch(content, m.index);

      if (imp.startsWith(".")) {
        const resolved = resolveRelative(imp, path, fileSet);
        if (!resolved) {
          issues.push({
            severity: "error",
            file: path,
            line,
            rule: "missing-import",
            message: `import "${imp}" doesn't resolve to any file in the project.`,
          });
        }
      } else {
        const allowed =
          ALLOWED_IMPORTS.has(imp) ||
          ALLOWED_PREFIXES.some((p) => imp.startsWith(p));
        if (!allowed) {
          issues.push({
            severity: "error",
            file: path,
            line,
            rule: "forbidden-import",
            message: `import "${imp}" is not in the allowed package list. Preview cannot resolve it. Allowed: ${[...ALLOWED_IMPORTS].join(", ")}.`,
          });
        }
      }
    }

    // 3. Entry-specific: must have default export
    if (path === entry) {
      const hasDefault = /export\s+default\s+/.test(cleaned);
      if (!hasDefault) {
        issues.push({
          severity: "error",
          file: path,
          rule: "no-default-export",
          message: `${entry} must export a default React component. The preview imports it as App.`,
        });
      }
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const summary =
    errorCount === 0 && warningCount === 0
      ? `All ${Object.keys(files).length} files passed validation.`
      : errorCount === 0
        ? `${warningCount} warning${warningCount === 1 ? "" : "s"} — preview should still render.`
        : `${errorCount} error${errorCount === 1 ? "" : "s"}${warningCount > 0 ? ` + ${warningCount} warning${warningCount === 1 ? "" : "s"}` : ""} — preview will likely fail.`;

  return {
    ok: errorCount === 0,
    fileCount: Object.keys(files).length,
    issues,
    summary,
  };
}
