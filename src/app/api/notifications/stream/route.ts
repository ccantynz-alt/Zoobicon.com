import { NextRequest } from "next/server";
import {
  subscribeToEmailNotifications,
  getRecentEmailNotifications,
} from "@/lib/email-notifications";

// ---------------------------------------------------------------------------
// GET /api/notifications/stream — Server-Sent Events for real-time email alerts
//
// Admin/support pages connect to this endpoint. When a Mailgun webhook fires,
// the event is pushed through the SSE connection instantly.
//
// Supports ?since=<timestamp> to replay missed events on reconnection.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? parseInt(sinceParam, 10) : undefined;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send any missed events first
      if (since) {
        const missed = getRecentEmailNotifications(since);
        for (const event of missed) {
          const data = `event: email\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      }

      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Subscribe to new events
      unsubscribe = subscribeToEmailNotifications((event) => {
        try {
          const data = `event: email\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed
          cleanup();
        }
      });

      // Heartbeat every 30s to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 30_000);

      function cleanup() {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
      }
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
