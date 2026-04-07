/**
 * Zoobicon MCP Server Endpoint
 *
 * Implements the Model Context Protocol (JSON-RPC 2.0) so external Claude /
 * GPT / Gemini clients can list and invoke Zoobicon platform tools.
 *
 * Spec: https://modelcontextprotocol.io
 * Protocol version: 2025-06-18
 */

import { NextRequest, NextResponse } from "next/server";
import {
  MCP_TOOLS,
  getMCPTool,
  listMCPToolDescriptors,
} from "@/lib/mcp-tools";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_NAME = "zoobicon-mcp";
const SERVER_VERSION = "1.0.0";

// ── JSON-RPC types ─────────────────────────────────────────────────────────

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: { code: number; message: string; data?: unknown };
}

const ERR_PARSE = -32700;
const ERR_INVALID_REQUEST = -32600;
const ERR_METHOD_NOT_FOUND = -32601;
const ERR_INVALID_PARAMS = -32602;
const ERR_SERVER = -32000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function rpcSuccess(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.jsonrpc === "2.0" && typeof v.method === "string";
}

function checkAuth(request: NextRequest): { ok: true; warning?: string } | { ok: false; message: string } {
  const required = process.env.MCP_BEARER_TOKEN;
  const header = request.headers.get("authorization") || "";
  if (!required) {
    return { ok: true, warning: "MCP_BEARER_TOKEN not set — running in unauthenticated dev mode" };
  }
  if (!header.toLowerCase().startsWith("bearer ")) {
    return { ok: false, message: "Missing Bearer token" };
  }
  const token = header.slice(7).trim();
  if (token !== required) {
    return { ok: false, message: "Invalid Bearer token" };
  }
  return { ok: true };
}

// ── Method handlers ────────────────────────────────────────────────────────

async function handleInitialize(authWarning?: string): Promise<unknown> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: { tools: {} },
    serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    ...(authWarning ? { warning: authWarning } : {}),
  };
}

async function handleToolsList(): Promise<unknown> {
  return { tools: listMCPToolDescriptors() };
}

async function handleToolsCall(params: unknown): Promise<unknown> {
  if (params === null || typeof params !== "object") {
    throw { code: ERR_INVALID_PARAMS, message: "params must be an object with 'name' and 'arguments'" };
  }
  const p = params as Record<string, unknown>;
  const name = p.name;
  if (typeof name !== "string") {
    throw { code: ERR_INVALID_PARAMS, message: "'name' must be a string" };
  }
  const tool = getMCPTool(name);
  if (!tool) {
    throw { code: ERR_INVALID_PARAMS, message: `Unknown tool: ${name}` };
  }
  const args = p.arguments ?? {};
  try {
    const result = await tool.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      isError: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
}

// ── HTTP handlers ──────────────────────────────────────────────────────────

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(): Promise<NextResponse> {
  return jsonResponse({
    server: { name: SERVER_NAME, version: SERVER_VERSION },
    protocolVersion: PROTOCOL_VERSION,
    transport: "http+jsonrpc",
    endpoint: "/api/mcp",
    toolCount: MCP_TOOLS.length,
    tools: MCP_TOOLS.map((t) => t.name),
    authRequired: Boolean(process.env.MCP_BEARER_TOKEN),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = checkAuth(request);
  if (!auth.ok) {
    return jsonResponse(rpcError(null, ERR_INVALID_REQUEST, auth.message), 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(rpcError(null, ERR_PARSE, "Invalid JSON body"), 400);
  }

  if (!isJsonRpcRequest(body)) {
    return jsonResponse(
      rpcError(null, ERR_INVALID_REQUEST, "Request must be a JSON-RPC 2.0 object with 'method'"),
      400,
    );
  }

  const id: JsonRpcId = body.id ?? null;
  const { method, params } = body;

  try {
    let result: unknown;
    switch (method) {
      case "initialize":
        result = await handleInitialize(auth.warning);
        break;
      case "tools/list":
        result = await handleToolsList();
        break;
      case "tools/call":
        result = await handleToolsCall(params);
        break;
      case "ping":
        result = {};
        break;
      default:
        return jsonResponse(
          rpcError(id, ERR_METHOD_NOT_FOUND, `Method not found: ${method}`),
          200,
        );
    }
    return jsonResponse(rpcSuccess(id, result));
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const e = err as { code: number; message: string };
      return jsonResponse(rpcError(id, e.code, e.message), 200);
    }
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(rpcError(id, ERR_SERVER, message), 200);
  }
}
