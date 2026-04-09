import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Simple MCP health check -- intentionally does NOT import mcp-tools
 * or component-registry at the top level to avoid TDZ build errors.
 * Uses dynamic imports only.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Lazy count from the authoritative mcp-server tool list
  let toolCount = 0;
  try {
    const { ZOOBICON_MCP_TOOLS } = await import("@/lib/mcp-server");
    toolCount = ZOOBICON_MCP_TOOLS.length;
  } catch {
    // Fallback to mcp-tools if mcp-server fails
    try {
      const { MCP_TOOLS } = await import("@/lib/mcp-tools");
      toolCount = MCP_TOOLS.length;
    } catch {
      toolCount = -1;
    }
  }

  return NextResponse.json({
    ok: true,
    service: "zoobicon-mcp",
    version: "1.1.0",
    protocolVersion: "2025-06-18",
    toolCount,
    transport: "http",
    endpoint: "/api/mcp",
    methods: ["initialize", "tools/list", "tools/call", "resources/list", "prompts/list", "ping"],
    authRequired: false,
    publicMode: true,
    timestamp: new Date().toISOString(),
  });
}
