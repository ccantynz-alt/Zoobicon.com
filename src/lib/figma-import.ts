/**
 * Figma file importer (Sprint 4 T4 — Figma slice).
 *
 * Given a Figma file key + a personal access token, fetches the
 * file's top-level frames + their names so we can compose a builder
 * prompt that recreates the design as a React app.
 *
 * Auth: Figma's REST API takes a personal access token in the
 * X-Figma-Token header. The token lives in the FIGMA_TOKEN env var
 * (set in Vercel by an admin). Per-user OAuth is the production
 * path but adds substantial OAuth-app setup; this MVP uses the
 * service-account PAT pattern that's good enough for a first ship.
 *
 * URL parsing — supports both:
 *   https://www.figma.com/file/<KEY>/<name>
 *   https://www.figma.com/design/<KEY>/<name>     (new Figma URL format)
 *   <KEY>                                          (raw key)
 *
 * Reference: https://www.figma.com/developers/api#files-endpoints
 */

const FIGMA_FETCH_TIMEOUT = 15000;

export interface FigmaFrame {
  id: string;
  name: string;
  type: string;
}

export interface FigmaImport {
  ok: boolean;
  fileKey: string;
  fileName: string | null;
  lastModified: string | null;
  topLevelFrames: FigmaFrame[];
  pageCount: number;
  reason?: string;
}

interface FigmaApiNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaApiNode[];
}

interface FigmaApiResponse {
  name?: string;
  lastModified?: string;
  document?: { children?: FigmaApiNode[] };
}

export function parseFigmaUrl(input: string): string | null {
  const trimmed = input.trim();
  // Raw key (alphanumeric, ~22 chars)
  if (/^[a-zA-Z0-9]{6,40}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return null;
}

export async function importFigmaFile(input: string): Promise<FigmaImport> {
  const fileKey = parseFigmaUrl(input);
  const empty: FigmaImport = {
    ok: false,
    fileKey: fileKey || input,
    fileName: null,
    lastModified: null,
    topLevelFrames: [],
    pageCount: 0,
  };

  if (!fileKey) {
    return { ...empty, reason: "Invalid Figma URL — expected a figma.com/file/... or figma.com/design/... link." };
  }

  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    return {
      ...empty,
      reason:
        "FIGMA_TOKEN env not set in Vercel. Admin: generate a personal access token at https://www.figma.com/developers/api#access-tokens and set as FIGMA_TOKEN.",
    };
  }

  try {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
      headers: {
        "X-Figma-Token": token,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(FIGMA_FETCH_TIMEOUT),
    });
    if (!res.ok) {
      return {
        ...empty,
        reason: `Figma API returned HTTP ${res.status}. Check the file is accessible to the FIGMA_TOKEN owner.`,
      };
    }
    const data = (await res.json()) as FigmaApiResponse;

    // Top-level pages (CANVAS nodes); frames are their direct children.
    const pages = data.document?.children || [];
    const frames: FigmaFrame[] = [];
    for (const page of pages) {
      if (page.type === "CANVAS" && page.children) {
        for (const child of page.children) {
          if (child.type === "FRAME") {
            frames.push({ id: child.id, name: child.name, type: child.type });
          }
        }
      }
    }

    return {
      ok: true,
      fileKey,
      fileName: data.name || null,
      lastModified: data.lastModified || null,
      topLevelFrames: frames.slice(0, 25), // cap for sane prompts
      pageCount: pages.length,
    };
  } catch (err) {
    return {
      ...empty,
      reason: err instanceof Error ? err.message : "Figma fetch failed",
    };
  }
}

export function composeFigmaBuilderPrompt(imp: FigmaImport): string {
  const parts: string[] = [];
  parts.push(
    `Build a modern 2026 React landing page based on the Figma design "${imp.fileName || imp.fileKey}".`
  );
  if (imp.topLevelFrames.length > 0) {
    const frameNames = imp.topLevelFrames.map((f) => f.name).slice(0, 12);
    parts.push(
      `The design has ${imp.topLevelFrames.length} top-level frames including: ${frameNames.join(", ")}. Map each to a corresponding React section.`
    );
  }
  parts.push(
    "Use the frame names to guide section ordering and naming. Modern stack (React + Tailwind), mobile-first responsive, semantic HTML, JSON-LD structured data, sub-second LCP."
  );
  return parts.join(" ");
}
