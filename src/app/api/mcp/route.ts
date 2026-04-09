import { NextRequest, NextResponse } from "next/server";
import {
  handleMcpRequest,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_SERVER_DESCRIPTION,
  ZOOBICON_MCP_TOOLS,
} from "@/lib/mcp-server";
import { verifyMcpRequest } from "@/lib/mcp-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, mcp-protocol-version, mcp-session-id",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/mcp -- Server info and capability discovery.
 * MCP clients can call this to see what the server supports before
 * sending JSON-RPC requests.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      protocolVersion: MCP_PROTOCOL_VERSION,
      serverInfo: {
        name: MCP_SERVER_NAME,
        version: MCP_SERVER_VERSION,
        description: MCP_SERVER_DESCRIPTION,
      },
      capabilities: {
        tools: { listChanged: false },
        resources: { listChanged: false },
        prompts: { listChanged: false },
      },
      toolCount: ZOOBICON_MCP_TOOLS.length,
      tools: ZOOBICON_MCP_TOOLS.map((t) => t.name),
      transport: "http",
      endpoint: "/api/mcp",
      manifest: "/api/mcp/manifest",
      install: "/api/mcp/install",
      ping: "/api/mcp/ping",
    },
    { headers: CORS_HEADERS },
  );
}

/**
 * POST /api/mcp -- JSON-RPC 2.0 handler.
 *
 * Accepts:
 *   { jsonrpc: "2.0", method: "initialize", id: 1 }
 *   { jsonrpc: "2.0", method: "tools/list", id: 2 }
 *   { jsonrpc: "2.0", method: "tools/call", params: { name: "generate_website", arguments: { prompt: "..." } }, id: 3 }
 *   Batches: [{ ... }, { ... }]
 *
 * Auth: Optional Bearer token in Authorization header.
 *   - Without token: public tools only (search_domains, get_pricing, list_components, suggest_business_names)
 *   - With valid zbk_live_* token: all tools
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify auth (optional -- public mode allowed)
  const auth = await verifyMcpRequest(req);
  if (!auth.ok && auth.error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: `Auth failed: ${auth.error}` },
      },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON" },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Dispatch to JSON-RPC handler
  const result = await handleMcpRequest(body);
  return NextResponse.json(result, { headers: CORS_HEADERS });
}
