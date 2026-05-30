/**
 * Notion page importer (Sprint 4 T4 — Notion slice).
 *
 * Given a Notion page ID + an integration token, fetches the page's
 * properties + block tree (top-level only) and composes a builder
 * prompt that turns Notion content into a published site.
 *
 * Auth: Notion API uses Bearer tokens. The token lives in
 * NOTION_TOKEN env var. The integration must be EXPLICITLY shared
 * with each page (Notion's permission model — there's no "all pages
 * for this token" mode).
 *
 * URL parsing supports:
 *   https://www.notion.so/<page-id>
 *   https://www.notion.so/Workspace/Title-<page-id>
 *   <page-id> (32-char hex, with or without dashes)
 *
 * Reference: https://developers.notion.com/reference/get-page
 */

const NOTION_FETCH_TIMEOUT = 15000;
const NOTION_VERSION = "2022-06-28";

export interface NotionBlock {
  id: string;
  type: string;
  text: string;
}

export interface NotionImport {
  ok: boolean;
  pageId: string;
  title: string | null;
  lastEdited: string | null;
  blocks: NotionBlock[];
  reason?: string;
}

interface NotionPageResponse {
  properties?: Record<string, { title?: Array<{ plain_text?: string }>; type?: string }>;
  last_edited_time?: string;
}

interface NotionBlocksResponse {
  results?: Array<{
    id: string;
    type: string;
    [key: string]: unknown;
  }>;
}

export function parseNotionId(input: string): string | null {
  const trimmed = input.trim();
  // 32-char hex (with or without dashes)
  const dashedHex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const undashedHex = /^[0-9a-f]{32}$/i;
  if (dashedHex.test(trimmed)) return trimmed;
  if (undashedHex.test(trimmed)) return formatPageId(trimmed);
  // Extract from URL — Notion page IDs are the last 32 hex chars
  const m = trimmed.match(/([0-9a-f]{32})/i);
  if (m) return formatPageId(m[1]);
  return null;
}

function formatPageId(undashed: string): string {
  // 8-4-4-4-12
  return `${undashed.slice(0, 8)}-${undashed.slice(8, 12)}-${undashed.slice(12, 16)}-${undashed.slice(16, 20)}-${undashed.slice(20)}`;
}

function extractBlockText(block: { type: string; [key: string]: unknown }): string {
  const payload = (block as unknown as Record<string, { rich_text?: Array<{ plain_text?: string }> }>)[block.type];
  const richText = payload?.rich_text;
  if (!Array.isArray(richText)) return "";
  return richText
    .map((rt) => rt.plain_text || "")
    .join("")
    .trim();
}

export async function importNotionPage(input: string): Promise<NotionImport> {
  const pageId = parseNotionId(input);
  const empty: NotionImport = {
    ok: false,
    pageId: pageId || input,
    title: null,
    lastEdited: null,
    blocks: [],
  };

  if (!pageId) {
    return {
      ...empty,
      reason: "Invalid Notion page ID — expected a 32-char hex ID or a notion.so URL.",
    };
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return {
      ...empty,
      reason:
        "NOTION_TOKEN env not set in Vercel. Admin: create an integration at https://www.notion.so/my-integrations, then SHARE each page with that integration via Notion's Share menu before importing.",
    };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    Accept: "application/json",
  } as const;

  try {
    const [pageRes, blocksRes] = await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers,
        signal: AbortSignal.timeout(NOTION_FETCH_TIMEOUT),
      }),
      fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`, {
        headers,
        signal: AbortSignal.timeout(NOTION_FETCH_TIMEOUT),
      }),
    ]);

    if (!pageRes.ok) {
      return {
        ...empty,
        reason: `Notion API returned HTTP ${pageRes.status} for page metadata. Has this page been SHARED with your integration?`,
      };
    }

    const pageData = (await pageRes.json()) as NotionPageResponse;

    // Title extraction — page title lives in a property whose type is "title"
    let title: string | null = null;
    for (const value of Object.values(pageData.properties || {})) {
      if (value.type === "title" && Array.isArray(value.title)) {
        title = value.title.map((t) => t.plain_text || "").join("");
        break;
      }
    }

    let blocks: NotionBlock[] = [];
    if (blocksRes.ok) {
      const blocksData = (await blocksRes.json()) as NotionBlocksResponse;
      blocks = (blocksData.results || [])
        .slice(0, 40)
        .map((b) => ({
          id: b.id,
          type: b.type,
          text: extractBlockText(b),
        }))
        .filter((b) => b.text.length > 0);
    }

    return {
      ok: true,
      pageId,
      title,
      lastEdited: pageData.last_edited_time || null,
      blocks,
    };
  } catch (err) {
    return {
      ...empty,
      reason: err instanceof Error ? err.message : "Notion fetch failed",
    };
  }
}

export function composeNotionBuilderPrompt(imp: NotionImport): string {
  const parts: string[] = [];
  parts.push(
    `Build a modern 2026 React landing page using content from a Notion page titled "${imp.title || "Untitled"}".`
  );

  // Group blocks by type for the planner.
  const headings = imp.blocks
    .filter((b) => b.type.startsWith("heading_") || b.type === "child_page")
    .map((b) => b.text);
  const paragraphs = imp.blocks
    .filter((b) => b.type === "paragraph")
    .slice(0, 8)
    .map((b) => b.text);

  if (headings.length > 0) {
    parts.push(`Section headings to preserve: ${headings.slice(0, 8).join("; ")}.`);
  }
  if (paragraphs.length > 0) {
    parts.push(
      `Body copy lines to use as section descriptions: ${paragraphs.slice(0, 4).join(" || ")}`
    );
  }

  parts.push(
    "Modernize: React + Tailwind, mobile-first responsive, semantic HTML, JSON-LD structured data, sub-second LCP."
  );

  return parts.join(" ");
}
