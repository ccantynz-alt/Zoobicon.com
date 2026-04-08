import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcp-tools";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    service: "zoobicon-mcp",
    version: "1.0.0",
    protocolVersion: "2025-06-18",
    toolCount: MCP_TOOLS.length,
    authRequired: false,
    publicMode: true,
    timestamp: new Date().toISOString(),
  });
}
