/**
 * MCP (Model Context Protocol) Integration
 *
 * Lets users feed external context into the AI builder:
 *   - GitHub repos → import existing code as context for generation
 *   - Figma designs → extract design tokens, layout structure
 *   - Notion docs → import content for website copy
 *   - Database schemas → auto-generate matching frontend
 *
 * MCP is the industry standard (Anthropic, OpenAI, Linux Foundation).
 * Every major tool supports it. We must too.
 *
 * Architecture:
 *   User connects a source → MCP server fetches context →
 *   Context injected into the generation prompt →
 *   AI uses it to generate more accurate, personalized output
 */

export interface MCPSource {
  type: "github" | "figma" | "notion" | "url" | "text" | "database";
  name: string;
  config: Record<string, string>;
}

export interface MCPContext {
  source: MCPSource;
  content: string;
  tokens: number;
}

/**
 * Fetch context from a GitHub repository.
 * Reads README, package.json, and key source files to understand
 * the existing project structure and tech stack.
 */
export async function fetchGitHubContext(
  repoUrl: string,
  token?: string
): Promise<MCPContext> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repo] = match;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token || process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${token || process.env.GITHUB_TOKEN}`;
  }

  const files: string[] = [];

  // Fetch README
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (res.ok) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      files.push(`## README.md\n${content.slice(0, 3000)}`);
    }
  } catch { /* skip */ }

  // Fetch package.json (tech stack)
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers });
    if (res.ok) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      files.push(`## package.json\n${content}`);
    }
  } catch { /* skip */ }

  // Fetch repo description and topics
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (res.ok) {
      const data = await res.json();
      files.push(`## Repository Info\nName: ${data.name}\nDescription: ${data.description || "None"}\nLanguage: ${data.language || "Unknown"}\nTopics: ${(data.topics || []).join(", ")}`);
    }
  } catch { /* skip */ }

  // Fetch directory structure (top-level)
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, { headers });
    if (res.ok) {
      const data = await res.json();
      const tree = data.map((f: { name: string; type: string }) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
      files.push(`## File Structure\n${tree}`);
    }
  } catch { /* skip */ }

  const content = files.join("\n\n---\n\n");

  return {
    source: { type: "github", name: `${owner}/${repo}`, config: { url: repoUrl } },
    content,
    tokens: Math.ceil(content.length / 4), // rough token estimate
  };
}

/**
 * Fetch context from a URL — scrapes the page and extracts key information.
 * Useful for: "build a site like this" or "redesign this page"
 */
export async function fetchURLContext(url: string): Promise<MCPContext> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Zoobicon/1.0 (site-builder)" },
    });

    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const html = await res.text();

    // Extract useful content: title, meta description, headings, text
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const headings = [...html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)]
      .map(m => m[1].trim())
      .slice(0, 20);

    // Strip HTML tags for body text
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    const content = [
      `URL: ${url}`,
      titleMatch ? `Title: ${titleMatch[1]}` : "",
      descMatch ? `Description: ${descMatch[1]}` : "",
      headings.length > 0 ? `Headings:\n${headings.map(h => `- ${h}`).join("\n")}` : "",
      `Content:\n${textContent}`,
    ].filter(Boolean).join("\n\n");

    return {
      source: { type: "url", name: url, config: { url } },
      content,
      tokens: Math.ceil(content.length / 4),
    };
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Fetch context from Notion — reads a page and extracts content.
 */
export async function fetchNotionContext(
  pageId: string,
  token?: string
): Promise<MCPContext> {
  const notionToken = token || process.env.NOTION_TOKEN;
  if (!notionToken) throw new Error("Notion token not configured");

  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch Notion page");

  const data = await res.json();
  const blocks = data.results || [];

  const content = blocks
    .map((block: Record<string, unknown>) => {
      const type = block.type as string;
      const blockData = block[type] as Record<string, unknown> | undefined;
      if (!blockData) return "";

      const richText = blockData.rich_text as Array<{ plain_text: string }> | undefined;
      if (richText) {
        const text = richText.map(t => t.plain_text).join("");
        if (type === "heading_1") return `# ${text}`;
        if (type === "heading_2") return `## ${text}`;
        if (type === "heading_3") return `### ${text}`;
        if (type === "bulleted_list_item") return `- ${text}`;
        if (type === "numbered_list_item") return `1. ${text}`;
        return text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  return {
    source: { type: "notion", name: `Notion page ${pageId}`, config: { pageId } },
    content,
    tokens: Math.ceil(content.length / 4),
  };
}

/**
 * Combine multiple MCP contexts into a single generation prompt supplement.
 * Injected into the AI builder's system prompt as additional context.
 */
export function buildContextPrompt(contexts: MCPContext[]): string {
  if (contexts.length === 0) return "";

  const parts = contexts.map(ctx => {
    return `=== CONTEXT FROM ${ctx.source.type.toUpperCase()}: ${ctx.source.name} ===\n${ctx.content}\n=== END CONTEXT ===`;
  });

  return `\n\nThe user has provided the following external context. Use this to make the generated site more accurate and personalized:\n\n${parts.join("\n\n")}`;
}

/**
 * Check which MCP sources are available based on configured tokens.
 */
export function getAvailableSources(): { type: string; configured: boolean }[] {
  return [
    { type: "github", configured: !!process.env.GITHUB_TOKEN },
    { type: "notion", configured: !!process.env.NOTION_TOKEN },
    { type: "figma", configured: !!process.env.FIGMA_TOKEN },
    { type: "url", configured: true }, // Always available
    { type: "text", configured: true }, // Always available
  ];
}
