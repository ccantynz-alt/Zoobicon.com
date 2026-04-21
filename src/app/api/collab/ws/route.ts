import { NextRequest } from "next/server";
import { handleWSConnection } from "@/lib/ws-collab";

/**
 * GET /api/collab/ws — WebSocket upgrade endpoint for real-time collaboration
 *
 * This route handles WebSocket upgrade requests. It works on persistent
 * servers (Railway, Fly.io, AWS ECS, custom Node) but NOT on Vercel
 * serverless. The client hook automatically falls back to polling when
 * the WebSocket connection fails.
 *
 * On Vercel, this returns a 426 (Upgrade Required) to signal that the
 * client should use the polling fallback.
 */
export async function GET(req: NextRequest) {
  // Check for WebSocket upgrade header
  const upgradeHeader = req.headers.get("upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return Response.json(
      {
        error: "WebSocket upgrade required",
        fallback: "polling",
        message: "This endpoint requires a WebSocket connection. Use the polling endpoints as fallback.",
      },
      { status: 426 }
    );
  }

  // Attempt WebSocket upgrade — works on persistent servers
  // On Vercel serverless, this will fail and the client falls back to polling
  try {
    // WebSocket upgrade is not in the standard Next.js types
    // but is available on persistent server runtimes
    const { socket, response } = (req as unknown as { socket: WebSocket }).socket
      ? { socket: (req as unknown as { socket: WebSocket }).socket, response: null }
      : await upgradeWebSocket(req);

    if (socket) {
      handleWSConnection(socket);
    }

    // If the runtime supports upgrade, return the upgrade response
    if (response) return response;

    // Fallback for environments that handle upgrade differently
    return new Response(null, { status: 101 });
  } catch {
    // WebSocket upgrade not supported (e.g., Vercel serverless)
    return Response.json(
      {
        error: "WebSocket not supported in this environment",
        fallback: "polling",
        message: "Deploy to a persistent server (Railway, Fly.io) for WebSocket support. Polling fallback is active.",
      },
      { status: 426 }
    );
  }
}

/**
 * Attempt WebSocket upgrade using the Deno/Bun/Node adapter pattern.
 * Different runtimes have different upgrade mechanisms.
 */
async function upgradeWebSocket(req: NextRequest): Promise<{ socket: WebSocket | null; response: Response | null }> {
  // Try the global WebSocket upgrade (available in some runtimes)
  if (typeof (globalThis as Record<string, unknown>).Deno !== "undefined") {
    // Deno-style upgrade
    const { Deno: DenoNS } = globalThis as unknown as {
      Deno: { upgradeWebSocket: (req: Request) => { socket: WebSocket; response: Response } }
    };
    const { socket, response } = DenoNS.upgradeWebSocket(req);
    return { socket, response };
  }

  // For Node.js-based servers (Railway, Fly.io with custom server)
  // The upgrade is typically handled at the HTTP server level, not in the route handler.
  // This route serves as a signaling endpoint — the actual WebSocket server
  // should be configured at the infrastructure level.

  // Signal to the client that upgrade should happen at a different URL
  // (e.g., wss://collab.zoobicon.com for a dedicated WS server)
  throw new Error("WebSocket upgrade not available in this runtime");
}
