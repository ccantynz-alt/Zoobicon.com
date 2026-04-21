// Simple in-house code formatter + validator. No external dependencies.
// If prettier becomes available later, swap implementations here.

export type Language = "ts" | "tsx" | "js" | "jsx" | "json" | "css" | "html";

export interface FormatResult {
  formatted: string;
  changed: boolean;
}

export interface ValidationError {
  line: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const INDENT = "  ";

function normalizeLineEndings(code: string): string {
  return code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function trimTrailingWhitespace(code: string): string {
  return code
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
}

function ensureTrailingNewline(code: string): string {
  if (code.length === 0) return "\n";
  return code.endsWith("\n") ? code : code + "\n";
}

function reindent(code: string): string {
  const lines = code.split("\n");
  let depth = 0;
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      out.push("");
      continue;
    }
    // De-indent for lines that start with a closer.
    const startsWithCloser = /^[)}\]]/.test(line);
    const localDepth = startsWithCloser ? Math.max(0, depth - 1) : depth;
    out.push(INDENT.repeat(localDepth) + line);

    // Adjust depth based on net openers vs closers, ignoring strings/comments roughly.
    const stripped = line
      .replace(/\/\/.*$/g, "")
      .replace(/\/\*.*?\*\//g, "")
      .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, "");
    let openers = 0;
    let closers = 0;
    for (const ch of stripped) {
      if (ch === "{" || ch === "[" || ch === "(") openers++;
      else if (ch === "}" || ch === "]" || ch === ")") closers++;
    }
    depth += openers - closers;
    if (depth < 0) depth = 0;
  }
  return out.join("\n");
}

function normalizeQuotesJs(code: string): string {
  // Convert single-quoted string literals to double-quoted, when safe.
  // Skips template literals and comments naively.
  const lines = code.split("\n");
  return lines
    .map((line) => {
      // Skip lines inside obvious comments.
      if (/^\s*\/\//.test(line)) return line;
      return line.replace(
        /'((?:\\.|[^'\\\n])*)'/g,
        (_m, inner: string) => {
          if (inner.includes('"')) return `'${inner}'`;
          return `"${inner}"`;
        }
      );
    })
    .join("\n");
}

function ensureSemicolons(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trimEnd();
      if (trimmed.length === 0) return line;
      if (/^\s*\/\//.test(trimmed)) return line;
      if (/[;{}\[\(,:]$/.test(trimmed)) return line;
      if (/^\s*[}\])]/.test(trimmed)) return line;
      if (/^\s*(if|else|for|while|switch|case|default|try|catch|finally|do)\b/.test(trimmed)) {
        return line;
      }
      if (trimmed.endsWith(">") || trimmed.endsWith("<")) return line; // jsx-ish
      if (/^\s*(import|export)\b/.test(trimmed) && !trimmed.endsWith(";")) {
        return trimmed + ";";
      }
      if (/^\s*(const|let|var|return|throw|break|continue)\b/.test(trimmed)) {
        if (!trimmed.endsWith(";")) return trimmed + ";";
      }
      return line;
    })
    .join("\n");
}

function sortImports(code: string): string {
  const lines = code.split("\n");
  const importBlocks: { start: number; end: number; lines: string[] }[] = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*import\b/.test(lines[i])) {
      const start = i;
      const block: string[] = [];
      while (i < lines.length && /^\s*import\b/.test(lines[i])) {
        block.push(lines[i]);
        i++;
      }
      importBlocks.push({ start, end: i, lines: block });
    } else {
      i++;
    }
  }
  for (let b = importBlocks.length - 1; b >= 0; b--) {
    const block = importBlocks[b];
    const sorted = [...block.lines].sort((a, z) => a.localeCompare(z));
    lines.splice(block.start, block.end - block.start, ...sorted);
  }
  return lines.join("\n");
}

function formatJsLike(code: string, withSemis: boolean): string {
  let out = normalizeLineEndings(code);
  out = normalizeQuotesJs(out);
  if (withSemis) out = ensureSemicolons(out);
  out = sortImports(out);
  out = reindent(out);
  out = trimTrailingWhitespace(out);
  out = ensureTrailingNewline(out);
  return out;
}

function formatJson(code: string): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, 2) + "\n";
  } catch {
    return ensureTrailingNewline(trimTrailingWhitespace(normalizeLineEndings(code)));
  }
}

function formatCss(code: string): string {
  let out = normalizeLineEndings(code);
  out = reindent(out);
  out = trimTrailingWhitespace(out);
  out = ensureTrailingNewline(out);
  return out;
}

function formatHtml(code: string): string {
  let out = normalizeLineEndings(code);
  out = trimTrailingWhitespace(out);
  out = ensureTrailingNewline(out);
  return out;
}

export function formatCode(code: string, language: Language): FormatResult {
  let formatted: string;
  switch (language) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      formatted = formatJsLike(code, true);
      break;
    case "json":
      formatted = formatJson(code);
      break;
    case "css":
      formatted = formatCss(code);
      break;
    case "html":
      formatted = formatHtml(code);
      break;
    default:
      formatted = ensureTrailingNewline(normalizeLineEndings(code));
  }
  return { formatted, changed: formatted !== code };
}

function checkBalancedDelimiters(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const stack: { ch: string; line: number }[] = [];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  let line = 1;
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === "\n") {
      line++;
      inLineComment = false;
      continue;
    }
    if (inLineComment) continue;
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push({ ch, line });
    } else if (ch === ")" || ch === "]" || ch === "}") {
      const top = stack.pop();
      if (!top || top.ch !== pairs[ch]) {
        errors.push({ line, message: `Unmatched '${ch}'` });
      }
    }
  }
  for (const left of stack) {
    errors.push({ line: left.line, message: `Unclosed '${left.ch}'` });
  }
  return errors;
}

function checkBalancedJsxTags(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const tagRegex = /<\/?([A-Za-z][A-Za-z0-9.\-]*)\b[^>]*?(\/)?>/g;
  const stack: { name: string; line: number }[] = [];
  const voidTags = new Set([
    "br",
    "hr",
    "img",
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
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(code)) !== null) {
    const full = match[0];
    const name = match[1];
    const selfClosing = full.endsWith("/>");
    const isClose = full.startsWith("</");
    const line = code.slice(0, match.index).split("\n").length;
    if (selfClosing) continue;
    if (voidTags.has(name.toLowerCase())) continue;
    if (isClose) {
      const top = stack.pop();
      if (!top || top.name !== name) {
        errors.push({ line, message: `Unmatched closing tag </${name}>` });
      }
    } else {
      stack.push({ name, line });
    }
  }
  for (const left of stack) {
    errors.push({ line: left.line, message: `Unclosed tag <${left.name}>` });
  }
  return errors;
}

export function validateCode(code: string, language: Language): ValidationResult {
  const errors: ValidationError[] = [];
  if (language === "json") {
    try {
      JSON.parse(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lineMatch = /line (\d+)/i.exec(msg);
      const line = lineMatch ? Number(lineMatch[1]) : 1;
      errors.push({ line, message: msg });
    }
    return { valid: errors.length === 0, errors };
  }

  errors.push(...checkBalancedDelimiters(code));

  if (language === "tsx" || language === "jsx" || language === "html") {
    errors.push(...checkBalancedJsxTags(code));
  }

  if (language === "js") {
    try {
      // eslint-disable-next-line no-new-func
      new Function(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ line: 1, message: msg });
    }
  }

  return { valid: errors.length === 0, errors };
}

function inferLanguageFromPath(path: string): Language {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts")) return "ts";
  if (lower.endsWith(".jsx")) return "jsx";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "js";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css") || lower.endsWith(".scss")) return "css";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  return "ts";
}

export async function formatProject(
  files: Record<string, string>
): Promise<Record<string, string>> {
  const entries = Object.entries(files);
  const results = await Promise.all(
    entries.map(async ([path, content]) => {
      const lang = inferLanguageFromPath(path);
      const { formatted } = formatCode(content, lang);
      return [path, formatted] as const;
    })
  );
  const out: Record<string, string> = {};
  for (const [path, content] of results) out[path] = content;
  return out;
}
