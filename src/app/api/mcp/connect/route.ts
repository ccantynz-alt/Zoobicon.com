import { NextRequest, NextResponse } from "next/server";
import {
  fetchGitHubContext,
  fetchURLContext,
  fetchNotionContext,
  buildContextPrompt,
  type MCPContext as MCPContextType,
} from "@/lib/mcp-context";

// ---------------------------------------------------------------------------
// POST /api/mcp/connect
//
// Unified endpoint that accepts a URL or source identifier and returns
// structured context suitable for injecting into the AI generation prompt.
//
// Body:
//   { url: string }                         — auto-detect source from URL
//   { type: "github", url: string }         — explicit GitHub repo
//   { type: "notion", pageId: string }      — explicit Notion page
//   { type: "url", url: string }            — website crawl
//   { type: "text", content: string }       — plain text context
//   { type: "figma", fileKey: string }      — Figma design file
//
// Returns:
//   {
//     source: { type, name, config },
//     content: string,         // structured text for LLM injection
//     tokens: number,          // rough token estimate
//     prompt: string,          // ready-to-inject prompt supplement
//   }
// ---------------------------------------------------------------------------

/** Detect the source type from a URL */
function detectSourceType(url: string): "github" | "notion" | "figma" | "url" {
  if (/github\.com\/[^/]+\/[^/]+/.test(url)) return "github";
  if (/notion\.so|notion\.site/.test(url)) return "notion";
  if (/figma\.com\//.test(url)) return "figma";
  return "url";
}

/** Extract Notion page ID from a Notion URL */
function extractNotionPageId(url: string): string | null {
  // Notion URLs look like: notion.so/Page-Title-abc123def456
  // or: notion.so/workspace/abc123def456?v=...
  const match = url.match(/([a-f0-9]{32})/);
  if (match) return match[1];
  // Also try the dash-separated ID at the end
  const parts = url.split("/").pop()?.split("-");
  if (parts && parts.length > 0) {
    const lastPart = parts[parts.length - 1].split("?")[0];
    if (/^[a-f0-9]{32}$/.test(lastPart)) return lastPart;
  }
  return null;
}

/** Extract Figma file key from URL */
function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type: explicitType, url, pageId, fileKey, content: textContent } = body as {
      type?: string;
      url?: string;
      pageId?: string;
      fileKey?: string;
      content?: string;
    };

    // Determine source type
    let sourceType = explicitType || (url ? detectSourceType(url) : null);

    if (!sourceType) {
      return NextResponse.json(
        { error: "Provide a URL or specify a type (github, notion, figma, url, text)" },
        { status: 400 }
      );
    }

    let context: MCPContextType;

    switch (sourceType) {
      case "github": {
        if (!url) {
          return NextResponse.json({ error: "GitHub URL is required" }, { status: 400 });
        }
        context = await fetchGitHubContext(url, process.env.GITHUB_TOKEN);
        break;
      }

      case "notion": {
        const notionPageId = pageId || (url ? extractNotionPageId(url) : null);
        if (!notionPageId) {
          return NextResponse.json(
            { error: "Could not extract Notion page ID. Provide a valid Notion URL or pageId." },
            { status: 400 }
          );
        }
        context = await fetchNotionContext(notionPageId, process.env.NOTION_TOKEN);
        break;
      }

      case "figma": {
        const figmaKey = fileKey || (url ? extractFigmaFileKey(url) : null);
        if (!figmaKey) {
          return NextResponse.json(
            { error: "Could not extract Figma file key. Provide a valid Figma URL or fileKey." },
            { status: 400 }
          );
        }
        // Use the MCP tools for Figma since mcp-context.ts doesn't have a dedicated fetcher
        const figmaToken = process.env.FIGMA_TOKEN;
        if (!figmaToken) {
          return NextResponse.json(
            { error: "Figma integration not configured. Set FIGMA_TOKEN environment variable." },
            { status: 400 }
          );
        }
        const res = await fetch(`https://api.figma.com/v1/files/${figmaKey}`, {
          headers: { "X-Figma-Token": figmaToken },
        });
        if (!res.ok) {
          return NextResponse.json(
            { error: `Figma API error: ${res.status}` },
            { status: 502 }
          );
        }
        const figmaData = await res.json();
        const pages = (figmaData.document?.children || []).map((p: { name: string }) => p.name);
        const components = Object.values(figmaData.components || {}).map((c: unknown) => (c as { name: string }).name);
        const colors: string[] = [];
        for (const style of Object.values(figmaData.styles || {})) {
          const s = style as { styleType: string; name: string };
          if (s.styleType === "FILL") colors.push(s.name);
        }

        const figmaContent = [
          `## Figma Design: ${figmaData.name}`,
          `Pages: ${pages.join(", ")}`,
          `Components: ${components.slice(0, 30).join(", ")}`,
          colors.length > 0 ? `Color styles: ${colors.join(", ")}` : "",
        ].filter(Boolean).join("\n");

        context = {
          source: { type: "figma", name: figmaData.name, config: { fileKey: figmaKey } },
          content: figmaContent,
          tokens: Math.ceil(figmaContent.length / 4),
        };
        break;
      }

      case "url": {
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        context = await fetchURLContext(url);
        break;
      }

      case "text": {
        if (!textContent) {
          return NextResponse.json({ error: "Content is required for text type" }, { status: 400 });
        }
        const trimmed = textContent.slice(0, 10000); // Cap at 10K chars
        context = {
          source: { type: "text", name: "Manual context", config: {} },
          content: trimmed,
          tokens: Math.ceil(trimmed.length / 4),
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown source type: ${sourceType}` },
          { status: 400 }
        );
    }

    // Build a ready-to-inject prompt supplement
    const prompt = buildContextPrompt([context]);

    return NextResponse.json({
      source: context.source,
      content: context.content,
      tokens: context.tokens,
      prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch context";
    console.error("MCP connect error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
