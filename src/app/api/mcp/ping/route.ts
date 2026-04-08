import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Simple MCP health check — intentionally does NOT import mcp-tools
 * or component-registry to avoid the circular dependency TDZ error
 * during Vercel page data collection.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Lazy count — only loaded at request time, not module init time
  let toolCount = 0;
  try {
    const { MCP_TOOLS } = await import("@/lib/mcp-tools");
    toolCount = MCP_TOOLS.length;
  } catch {
    toolCount = -1; // indicates load failure
  }

  return NextResponse.json({
    ok: true,
    service: "zoobicon-mcp",
    version: "1.0.0",
    protocolVersion: "2025-06-18",
    toolCount,
    authRequired: false,
    publicMode: true,
    timestamp: new Date().toISOString(),
  });
}
