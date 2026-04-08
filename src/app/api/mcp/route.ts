import { NextRequest, NextResponse } from "next/server";
import {
  handleMcpRequest,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_SERVER_DESCRIPTION,
  ZOOBICON_MCP_TOOLS,
} from "@/lib/mcp-server";

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
      transport: "http",
      endpoint: "/api/mcp",
      manifest: "/api/mcp/manifest",
    },
    { headers: CORS_HEADERS },
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "parse error: invalid JSON" },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = await handleMcpRequest(body);
  return NextResponse.json(result, { headers: CORS_HEADERS });
}
