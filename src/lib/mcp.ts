// ---------------------------------------------------------------------------
// MCP (Model Context Protocol) Client Library
// Allows pipeline agents to pull context from external tools during generation
// ---------------------------------------------------------------------------

export interface MCPTool {
  name: string;
  description: string;
  provider: "github" | "notion" | "figma" | "google-sheets" | "custom";
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, unknown>) => Promise<MCPResult>;
}

export interface MCPResult {
  success: boolean;
  data: unknown;
  contentType: "text" | "json" | "html" | "image-url";
  summary: string;
}

export interface MCPContext {
  tools: MCPTool[];
  results: { tool: string; result: MCPResult; timestamp: string }[];
}

export interface MCPConfig {
  githubToken?: string;
  notionToken?: string;
  figmaToken?: string;
  googleSheetsApiKey?: string;
}

// ---------------------------------------------------------------------------
// Demo / fallback data when API keys are not configured
// ---------------------------------------------------------------------------

const DEMO_GITHUB_FILE = {
  name: "README.md",
  content: "# Example Project\n\nThis is a demo README returned in MCP demo mode.\n\n## Features\n- Feature A\n- Feature B\n",
  sha: "demo-sha-abc123",
};

const DEMO_GITHUB_TREE = [
  { path: "README.md", type: "blob" },
  { path: "src/index.ts", type: "blob" },
  { path: "src/utils/helpers.ts", type: "blob" },
  { path: "package.json", type: "blob" },
  { path: "tsconfig.json", type: "blob" },
];

const DEMO_NOTION_PAGE = {
  id: "demo-page-id",
  title: "Project Brief",
  content: "This website should showcase our SaaS product with a hero section, features grid, pricing table, and contact form. Brand colors: #6366f1 (primary), #0ea5e9 (accent). Tone: professional but approachable.",
};

const DEMO_NOTION_DB = {
  id: "demo-db-id",
  title: "Content Database",
  rows: [
    { Name: "Hero Headline", Value: "Build faster with AI", Status: "Approved" },
    { Name: "Subheadline", Value: "Ship production sites in seconds", Status: "Approved" },
    { Name: "CTA Text", Value: "Start Building Free", Status: "Draft" },
  ],
};

const DEMO_FIGMA_DESIGN = {
  name: "Landing Page v3",
  lastModified: "2026-03-10T12:00:00Z",
  thumbnailUrl: "https://picsum.photos/800/600",
  pages: ["Homepage", "About", "Pricing"],
  components: ["Hero", "Navbar", "Footer", "PricingCard", "FeatureGrid"],
  colors: ["#6366f1", "#0ea5e9", "#f8fafc", "#0f172a"],
};

const DEMO_SHEETS_DATA = {
  spreadsheetId: "demo-sheet-id",
  sheetName: "Products",
  headers: ["Name", "Price", "Description", "Category"],
  rows: [
    ["Pro Plan", "$29/mo", "Everything you need to build", "Plans"],
    ["Enterprise Plan", "$99/mo", "For teams and agencies", "Plans"],
    ["Starter Plan", "Free", "Get started with basics", "Plans"],
  ],
};

// ---------------------------------------------------------------------------
// Helper: safe fetch with timeout
// ---------------------------------------------------------------------------

async function safeFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Built-in tools
// ---------------------------------------------------------------------------

function createGithubReadFile(config: MCPConfig): MCPTool {
  return {
    name: "github_read_file",
    description: "Fetch a single file from a GitHub repository. Returns file content decoded from base64.",
    provider: "github",
    parameters: {
      owner: { type: "string", description: "Repository owner (user or org)", required: true },
      repo: { type: "string", description: "Repository name", required: true },
      path: { type: "string", description: "File path within the repo", required: true },
      ref: { type: "string", description: "Branch or commit SHA (default: main)" },
    },
    execute: async (params) => {
      const { owner, repo, path, ref = "main" } = params as Record<string, string>;
      if (!config.githubToken) {
        return {
          success: true,
          data: DEMO_GITHUB_FILE,
          contentType: "json",
          summary: `[Demo mode] GitHub file: ${path} — ${DEMO_GITHUB_FILE.content.slice(0, 120)}...`,
        };
      }
      try {
        const res = await safeFetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
          { headers: { Authorization: `Bearer ${config.githubToken}`, Accept: "application/vnd.github.v3+json" } }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { success: false, data: null, contentType: "text", summary: `GitHub API error ${res.status}: ${errText.slice(0, 200)}` };
        }
        const json = await res.json();
        const content = json.encoding === "base64" ? Buffer.from(json.content, "base64").toString("utf-8") : json.content;
        return {
          success: true,
          data: { name: json.name, content, sha: json.sha, size: json.size },
          contentType: "json",
          summary: `File ${owner}/${repo}/${path} (${json.size} bytes): ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `GitHub fetch failed: ${(err as Error).message}` };
      }
    },
  };
}

function createGithubReadRepoStructure(config: MCPConfig): MCPTool {
  return {
    name: "github_read_repo_structure",
    description: "List all files in a GitHub repository using the Git tree API. Returns file paths and types.",
    provider: "github",
    parameters: {
      owner: { type: "string", description: "Repository owner", required: true },
      repo: { type: "string", description: "Repository name", required: true },
      ref: { type: "string", description: "Branch or commit SHA (default: main)" },
    },
    execute: async (params) => {
      const { owner, repo, ref = "main" } = params as Record<string, string>;
      if (!config.githubToken) {
        return {
          success: true,
          data: DEMO_GITHUB_TREE,
          contentType: "json",
          summary: `[Demo mode] Repo structure for ${owner}/${repo}: ${DEMO_GITHUB_TREE.length} files — ${DEMO_GITHUB_TREE.map((f) => f.path).join(", ")}`,
        };
      }
      try {
        const res = await safeFetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
          { headers: { Authorization: `Bearer ${config.githubToken}`, Accept: "application/vnd.github.v3+json" } }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { success: false, data: null, contentType: "text", summary: `GitHub API error ${res.status}: ${errText.slice(0, 200)}` };
        }
        const json = await res.json();
        const tree = (json.tree || []).map((item: { path: string; type: string; size?: number }) => ({
          path: item.path,
          type: item.type,
          size: item.size,
        }));
        return {
          success: true,
          data: tree,
          contentType: "json",
          summary: `Repo ${owner}/${repo}: ${tree.length} items — ${tree.slice(0, 15).map((f: { path: string }) => f.path).join(", ")}${tree.length > 15 ? ` ... and ${tree.length - 15} more` : ""}`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `GitHub tree fetch failed: ${(err as Error).message}` };
      }
    },
  };
}

function createNotionReadPage(config: MCPConfig): MCPTool {
  return {
    name: "notion_read_page",
    description: "Fetch a Notion page's properties and block content. Returns the page title and text content.",
    provider: "notion",
    parameters: {
      pageId: { type: "string", description: "Notion page ID (UUID or short ID)", required: true },
    },
    execute: async (params) => {
      const { pageId } = params as Record<string, string>;
      if (!config.notionToken) {
        return {
          success: true,
          data: DEMO_NOTION_PAGE,
          contentType: "json",
          summary: `[Demo mode] Notion page "${DEMO_NOTION_PAGE.title}": ${DEMO_NOTION_PAGE.content}`,
        };
      }
      try {
        // Fetch page metadata
        const pageRes = await safeFetch(`https://api.notion.com/v1/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${config.notionToken}`, "Notion-Version": "2022-06-28" },
        });
        if (!pageRes.ok) {
          return { success: false, data: null, contentType: "text", summary: `Notion API error ${pageRes.status}: ${await pageRes.text()}` };
        }
        const pageData = await pageRes.json();

        // Extract title from properties
        let title = "Untitled";
        for (const prop of Object.values(pageData.properties || {})) {
          const p = prop as { type: string; title?: { plain_text: string }[] };
          if (p.type === "title" && p.title?.[0]) {
            title = p.title.map((t) => t.plain_text).join("");
            break;
          }
        }

        // Fetch block children for content
        const blocksRes = await safeFetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
          headers: { Authorization: `Bearer ${config.notionToken}`, "Notion-Version": "2022-06-28" },
        });
        let content = "";
        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          content = (blocksData.results || [])
            .map((block: { type: string; [key: string]: unknown }) => {
              const blockContent = block[block.type] as { rich_text?: { plain_text: string }[] } | undefined;
              if (blockContent?.rich_text) {
                return blockContent.rich_text.map((t) => t.plain_text).join("");
              }
              return "";
            })
            .filter(Boolean)
            .join("\n");
        }

        return {
          success: true,
          data: { id: pageId, title, content },
          contentType: "json",
          summary: `Notion page "${title}": ${content.slice(0, 300)}${content.length > 300 ? "..." : ""}`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `Notion fetch failed: ${(err as Error).message}` };
      }
    },
  };
}

function createNotionReadDatabase(config: MCPConfig): MCPTool {
  return {
    name: "notion_read_database",
    description: "Query a Notion database and return rows as structured data.",
    provider: "notion",
    parameters: {
      databaseId: { type: "string", description: "Notion database ID", required: true },
      maxRows: { type: "number", description: "Maximum rows to fetch (default: 50)" },
    },
    execute: async (params) => {
      const { databaseId } = params as Record<string, string>;
      const maxRows = (params.maxRows as number) || 50;
      if (!config.notionToken) {
        return {
          success: true,
          data: DEMO_NOTION_DB,
          contentType: "json",
          summary: `[Demo mode] Notion DB "${DEMO_NOTION_DB.title}": ${DEMO_NOTION_DB.rows.length} rows — ${JSON.stringify(DEMO_NOTION_DB.rows[0])}`,
        };
      }
      try {
        const res = await safeFetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.notionToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page_size: Math.min(maxRows, 100) }),
        });
        if (!res.ok) {
          return { success: false, data: null, contentType: "text", summary: `Notion DB error ${res.status}: ${await res.text()}` };
        }
        const json = await res.json();
        const rows = (json.results || []).map((page: { properties: Record<string, unknown> }) => {
          const row: Record<string, string> = {};
          for (const [key, val] of Object.entries(page.properties)) {
            const v = val as { type: string; title?: { plain_text: string }[]; rich_text?: { plain_text: string }[]; number?: number; select?: { name: string }; status?: { name: string } };
            if (v.title) row[key] = v.title.map((t) => t.plain_text).join("");
            else if (v.rich_text) row[key] = v.rich_text.map((t) => t.plain_text).join("");
            else if (v.type === "number") row[key] = String(v.number ?? "");
            else if (v.type === "select" && v.select) row[key] = v.select.name;
            else if (v.type === "status" && v.status) row[key] = v.status.name;
          }
          return row;
        });
        return {
          success: true,
          data: { id: databaseId, rows },
          contentType: "json",
          summary: `Notion database: ${rows.length} rows fetched. First row: ${JSON.stringify(rows[0] || {})}`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `Notion DB query failed: ${(err as Error).message}` };
      }
    },
  };
}

function createFigmaGetDesign(config: MCPConfig): MCPTool {
  return {
    name: "figma_get_design",
    description: "Fetch Figma file metadata including pages, components, and color styles.",
    provider: "figma",
    parameters: {
      fileKey: { type: "string", description: "Figma file key (from URL: figma.com/file/<KEY>/...)", required: true },
    },
    execute: async (params) => {
      const { fileKey } = params as Record<string, string>;
      if (!config.figmaToken) {
        return {
          success: true,
          data: DEMO_FIGMA_DESIGN,
          contentType: "json",
          summary: `[Demo mode] Figma file "${DEMO_FIGMA_DESIGN.name}": ${DEMO_FIGMA_DESIGN.pages.length} pages, ${DEMO_FIGMA_DESIGN.components.length} components, colors: ${DEMO_FIGMA_DESIGN.colors.join(", ")}`,
        };
      }
      try {
        const res = await safeFetch(`https://api.figma.com/v1/files/${fileKey}`, {
          headers: { "X-Figma-Token": config.figmaToken },
        });
        if (!res.ok) {
          return { success: false, data: null, contentType: "text", summary: `Figma API error ${res.status}: ${await res.text()}` };
        }
        const json = await res.json();
        const pages = (json.document?.children || []).map((p: { name: string }) => p.name);

        // Extract component names
        const components = Object.values(json.components || {}).map((c: unknown) => (c as { name: string }).name);

        // Extract colors from styles
        const colors: string[] = [];
        for (const style of Object.values(json.styles || {})) {
          const s = style as { styleType: string; name: string };
          if (s.styleType === "FILL") colors.push(s.name);
        }

        const result = {
          name: json.name,
          lastModified: json.lastModified,
          thumbnailUrl: json.thumbnailUrl,
          pages,
          components: components.slice(0, 30),
          colors,
        };

        return {
          success: true,
          data: result,
          contentType: "json",
          summary: `Figma file "${json.name}": ${pages.length} pages (${pages.join(", ")}), ${components.length} components, ${colors.length} color styles`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `Figma fetch failed: ${(err as Error).message}` };
      }
    },
  };
}

function createGoogleSheetsRead(config: MCPConfig): MCPTool {
  return {
    name: "google_sheets_read",
    description: "Read data from a Google Sheet. Returns headers and rows.",
    provider: "google-sheets",
    parameters: {
      spreadsheetId: { type: "string", description: "Google Sheets spreadsheet ID (from URL)", required: true },
      range: { type: "string", description: "Cell range (e.g. 'Sheet1!A1:D50'). Default: 'Sheet1'" },
    },
    execute: async (params) => {
      const { spreadsheetId } = params as Record<string, string>;
      const range = (params.range as string) || "Sheet1";
      if (!config.googleSheetsApiKey) {
        return {
          success: true,
          data: DEMO_SHEETS_DATA,
          contentType: "json",
          summary: `[Demo mode] Google Sheet "${DEMO_SHEETS_DATA.sheetName}": ${DEMO_SHEETS_DATA.rows.length} rows, columns: ${DEMO_SHEETS_DATA.headers.join(", ")}`,
        };
      }
      try {
        const encodedRange = encodeURIComponent(range);
        const res = await safeFetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${config.googleSheetsApiKey}`,
        );
        if (!res.ok) {
          return { success: false, data: null, contentType: "text", summary: `Sheets API error ${res.status}: ${await res.text()}` };
        }
        const json = await res.json();
        const values: string[][] = json.values || [];
        const headers = values[0] || [];
        const rows = values.slice(1);

        return {
          success: true,
          data: { spreadsheetId, sheetName: range, headers, rows },
          contentType: "json",
          summary: `Google Sheet (${range}): ${rows.length} rows, columns: ${headers.join(", ")}. First row: ${JSON.stringify(rows[0] || [])}`,
        };
      } catch (err) {
        return { success: false, data: null, contentType: "text", summary: `Sheets fetch failed: ${(err as Error).message}` };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Build the full list of MCP tools based on available configuration. */
function buildToolRegistry(config: MCPConfig): MCPTool[] {
  return [
    createGithubReadFile(config),
    createGithubReadRepoStructure(config),
    createNotionReadPage(config),
    createNotionReadDatabase(config),
    createFigmaGetDesign(config),
    createGoogleSheetsRead(config),
  ];
}

/** Create a fresh MCP context with tools registered for the given config. */
export function createMCPContext(config: MCPConfig): MCPContext {
  return {
    tools: buildToolRegistry(config),
    results: [],
  };
}

/** Execute a tool by name, appending the result to the context. */
export async function executeMCPTool(
  context: MCPContext,
  toolName: string,
  params: Record<string, unknown>
): Promise<MCPResult> {
  const tool = context.tools.find((t) => t.name === toolName);
  if (!tool) {
    const result: MCPResult = {
      success: false,
      data: null,
      contentType: "text",
      summary: `Tool "${toolName}" not found. Available: ${context.tools.map((t) => t.name).join(", ")}`,
    };
    context.results.push({ tool: toolName, result, timestamp: new Date().toISOString() });
    return result;
  }

  const result = await tool.execute(params);
  context.results.push({ tool: toolName, result, timestamp: new Date().toISOString() });
  return result;
}

/** Format all collected MCP results into a prompt-friendly string for LLM injection. */
export function formatMCPResultsForPrompt(results: MCPContext["results"]): string {
  if (results.length === 0) return "";

  const sections = results
    .filter((r) => r.result.success)
    .map((r, i) => {
      let dataStr: string;
      if (r.result.contentType === "json") {
        dataStr = JSON.stringify(r.result.data, null, 2);
      } else {
        dataStr = String(r.result.data);
      }
      // Truncate very large data blocks to keep prompt reasonable
      if (dataStr.length > 4000) {
        dataStr = dataStr.slice(0, 4000) + "\n... [truncated]";
      }
      return `### External Context ${i + 1}: ${r.tool}\n${r.result.summary}\n\`\`\`\n${dataStr}\n\`\`\``;
    });

  if (sections.length === 0) return "";

  return [
    "## External Context (fetched via MCP)",
    "The following data was pulled from the user's connected tools. Use this context to inform your generation.",
    "",
    ...sections,
  ].join("\n");
}

/** Check which providers have API keys configured. */
export function getConnectedProviders(config: MCPConfig): Record<string, boolean> {
  return {
    github: !!config.githubToken,
    notion: !!config.notionToken,
    figma: !!config.figmaToken,
    "google-sheets": !!config.googleSheetsApiKey,
  };
}
