import { NextRequest, NextResponse } from "next/server";
import {
  createMCPContext,
  executeMCPTool,
  getConnectedProviders,
  type MCPConfig,
} from "@/lib/mcp";

// ---------------------------------------------------------------------------
// Helper: load user integration configs from the integrations API / DB
// ---------------------------------------------------------------------------

async function loadUserConfig(userEmail: string): Promise<MCPConfig> {
  const config: MCPConfig = {};

  // Try loading from integrations storage
  try {
    // Use internal fetch to the integrations endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/integrations?email=${encodeURIComponent(userEmail)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      for (const integration of data.integrations || []) {
        const svc = integration.service as string;
        const cfg = integration.config as Record<string, string>;
        if (svc === "github" && cfg.token) config.githubToken = cfg.token;
        if (svc === "notion" && cfg.token) config.notionToken = cfg.token;
        if (svc === "figma" && cfg.token) config.figmaToken = cfg.token;
        if (svc === "google-sheets" && cfg.apiKey) config.googleSheetsApiKey = cfg.apiKey;
      }
    }
  } catch {
    // Integrations endpoint unavailable — fall through to env vars
  }

  // Fallback: use environment variables if no user-specific tokens
  if (!config.githubToken && process.env.GITHUB_TOKEN) config.githubToken = process.env.GITHUB_TOKEN;
  if (!config.notionToken && process.env.NOTION_TOKEN) config.notionToken = process.env.NOTION_TOKEN;
  if (!config.figmaToken && process.env.FIGMA_TOKEN) config.figmaToken = process.env.FIGMA_TOKEN;
  if (!config.googleSheetsApiKey && process.env.GOOGLE_SHEETS_API_KEY) config.googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY;

  return config;
}

// ---------------------------------------------------------------------------
// GET /api/mcp — List available MCP tools and connection status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get("email") || "";
  const config = await loadUserConfig(userEmail);
  const ctx = createMCPContext(config);
  const connected = getConnectedProviders(config);

  const tools = ctx.tools.map((t) => ({
    name: t.name,
    description: t.description,
    provider: t.provider,
    parameters: t.parameters,
    connected: connected[t.provider] ?? false,
  }));

  return NextResponse.json({ tools });
}

// ---------------------------------------------------------------------------
// POST /api/mcp — Execute an MCP tool call
// Body: { tool: string, params: Record<string, unknown>, userEmail: string }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, params, userEmail } = body;

    if (!tool || typeof tool !== "string") {
      return NextResponse.json({ error: "tool name is required" }, { status: 400 });
    }
    if (!params || typeof params !== "object") {
      return NextResponse.json({ error: "params object is required" }, { status: 400 });
    }

    const config = await loadUserConfig(userEmail || "");
    const ctx = createMCPContext(config);
    const result = await executeMCPTool(ctx, tool, params);

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
