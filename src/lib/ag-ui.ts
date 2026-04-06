/**
 * AG-UI Protocol — Agent-to-User Interface Communication
 *
 * Standardized protocol for real-time communication between AI agents
 * and frontend UIs. Replaces our custom SSE streaming with the
 * industry standard adopted by Google, Microsoft, Oracle.
 *
 * Benefits:
 *   - Interoperable with CopilotKit's component library (free)
 *   - Standardized event types for streaming, tool calls, state sync
 *   - Human-in-the-loop approvals built into the protocol
 *   - Works with any agent framework
 *
 * Event types we implement:
 *   - TEXT_CHUNK: Streaming text from agent to UI
 *   - TOOL_CALL: Agent wants to execute a tool (file write, API call)
 *   - STATE_UPDATE: Shared state between agent and UI
 *   - APPROVAL_REQUEST: Agent asks user to approve an action
 *   - ERROR: Something went wrong
 *   - DONE: Agent finished
 */

// AG-UI Event Types
export type AGUIEventType =
  | "TEXT_CHUNK"
  | "TOOL_CALL"
  | "TOOL_RESULT"
  | "STATE_UPDATE"
  | "APPROVAL_REQUEST"
  | "ERROR"
  | "DONE";

export interface AGUIEvent {
  type: AGUIEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface AGUITextChunk extends AGUIEvent {
  type: "TEXT_CHUNK";
  data: { content: string; role: "assistant" | "system" };
}

export interface AGUIToolCall extends AGUIEvent {
  type: "TOOL_CALL";
  data: {
    toolName: string;
    toolId: string;
    args: Record<string, unknown>;
  };
}

export interface AGUIStateUpdate extends AGUIEvent {
  type: "STATE_UPDATE";
  data: {
    key: string;
    value: unknown;
    merge?: boolean;
  };
}

export interface AGUIApprovalRequest extends AGUIEvent {
  type: "APPROVAL_REQUEST";
  data: {
    requestId: string;
    action: string;
    description: string;
    options: string[];
  };
}

/**
 * Create an AG-UI compatible SSE stream.
 * Wraps our existing streaming logic in the standard AG-UI format.
 */
export function createAGUIStream(): {
  stream: ReadableStream;
  send: (event: AGUIEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const send = (event: AGUIEvent) => {
    const data = JSON.stringify(event);
    controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`));
  };

  const close = () => {
    send({ type: "DONE", timestamp: Date.now(), data: {} });
    controller.close();
  };

  return { stream, send, close };
}

/**
 * Convert our existing SSE events to AG-UI format.
 * This adapter lets us gradually migrate without breaking existing clients.
 */
export function convertToAGUI(
  legacyEvent: { type: string; message?: string; files?: Record<string, string>; [key: string]: unknown }
): AGUIEvent {
  const timestamp = Date.now();

  switch (legacyEvent.type) {
    case "status":
      return {
        type: "TEXT_CHUNK",
        timestamp,
        data: { content: legacyEvent.message || "", role: "system" },
      };

    case "partial":
      return {
        type: "STATE_UPDATE",
        timestamp,
        data: {
          key: "files",
          value: legacyEvent.files || {},
          merge: true,
        },
      };

    case "done":
      if (legacyEvent.files) {
        return {
          type: "STATE_UPDATE",
          timestamp,
          data: {
            key: "files",
            value: legacyEvent.files,
            merge: false,
          },
        };
      }
      return { type: "DONE", timestamp, data: {} };

    case "error":
      return {
        type: "ERROR",
        timestamp,
        data: { message: legacyEvent.message || "Unknown error" },
      };

    default:
      return {
        type: "TEXT_CHUNK",
        timestamp,
        data: { content: JSON.stringify(legacyEvent), role: "system" },
      };
  }
}

/**
 * AG-UI response headers.
 */
export const AGUI_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Protocol": "ag-ui/1.0",
};
