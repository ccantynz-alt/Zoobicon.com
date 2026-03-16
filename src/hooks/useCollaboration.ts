"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HEARTBEAT_INTERVAL_MS, PRESENCE_POLL_MS } from "@/lib/collaboration";

export interface RemoteParticipant {
  id: string;
  user_email: string;
  user_name: string;
  color: string;
  cursor_x: number | null;
  cursor_y: number | null;
  cursor_element: string | null;
  is_active: boolean;
}

export interface CollabRoom {
  id: string;
  slug: string;
  inviteCode: string;
}

interface UseCollaborationOptions {
  slug: string;
  email: string;
  name: string;
  enabled: boolean;
  onRemoteCodeUpdate?: (html: string, version: number, updatedBy: string) => void;
}

type TransportMode = "websocket" | "polling";

export function useCollaboration({
  slug,
  email,
  name,
  enabled,
  onRemoteCodeUpdate,
}: UseCollaborationOptions) {
  const [room, setRoom] = useState<CollabRoom | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [myColor, setMyColor] = useState("#3b82f6");
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<TransportMode>("polling");

  const codeVersionRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presencePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteCodeUpdateRef = useRef(onRemoteCodeUpdate);
  const reconnectAttemptsRef = useRef(0);
  onRemoteCodeUpdateRef.current = onRemoteCodeUpdate;

  // --- WebSocket connection ---
  const connectWebSocket = useCallback((roomId: string, participantIdVal: string) => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Use the dedicated WS endpoint, or a custom WS_URL env variable
      const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL ||
        `${protocol}//${window.location.host}/api/collab/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        // Send join message
        ws.send(JSON.stringify({
          type: "join",
          roomId,
          email,
          name,
          participantId: participantIdVal,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case "joined":
              setTransport("websocket");
              // Update participants from server
              if (msg.participants) {
                setParticipants(msg.participants.map((p: Record<string, unknown>) => ({
                  id: p.id,
                  user_email: p.email,
                  user_name: p.name,
                  color: p.color,
                  cursor_x: p.cursorX ?? null,
                  cursor_y: p.cursorY ?? null,
                  cursor_element: p.cursorElement ?? null,
                  is_active: true,
                })));
                // If room has existing code, sync it
                if (msg.code && msg.codeVersion > codeVersionRef.current) {
                  codeVersionRef.current = msg.codeVersion;
                  onRemoteCodeUpdateRef.current?.(msg.code, msg.codeVersion, "");
                }
              }
              break;

            case "participant_joined":
              setParticipants((prev) => {
                if (prev.some((p) => p.id === msg.participant.id)) return prev;
                return [...prev, {
                  id: msg.participant.id,
                  user_email: msg.participant.email,
                  user_name: msg.participant.name,
                  color: msg.participant.color,
                  cursor_x: null,
                  cursor_y: null,
                  cursor_element: null,
                  is_active: true,
                }];
              });
              break;

            case "participant_left":
              setParticipants((prev) => prev.filter((p) => p.id !== msg.participantId));
              break;

            case "cursor_update":
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === msg.participantId
                    ? {
                        ...p,
                        cursor_x: msg.cursorX,
                        cursor_y: msg.cursorY,
                        cursor_element: msg.cursorElement,
                      }
                    : p
                )
              );
              break;

            case "code_update":
              if (msg.updatedBy !== email) {
                codeVersionRef.current = msg.version;
                onRemoteCodeUpdateRef.current?.(msg.html, msg.version, msg.updatedBy);
              }
              break;

            case "code_ack":
              codeVersionRef.current = msg.version;
              break;

            case "code_conflict":
              // Re-fetch latest code
              break;
          }
        } catch {
          // Malformed message
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Only attempt reconnect if still connected to room
        if (room && reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
          wsReconnectRef.current = setTimeout(() => {
            connectWebSocket(roomId, participantIdVal);
          }, delay);
        } else {
          // Fall back to polling after max reconnect attempts
          setTransport("polling");
        }
      };

      ws.onerror = () => {
        // WebSocket failed (likely Vercel serverless) — fall back to polling
        ws.close();
        setTransport("polling");
      };
    } catch {
      // WebSocket not available — use polling
      setTransport("polling");
    }
  }, [email, name, room]);

  // --- Create or join a room ---
  const createRoom = useCallback(async () => {
    if (!slug || !email) return;
    try {
      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", slug, email, name }),
      });
      const data = await res.json();
      if (data.room) {
        setRoom({ id: data.room.id, slug: data.room.slug, inviteCode: data.room.inviteCode });
        setParticipantId(data.participant.id);
        setMyColor(data.participant.color);
        setIsConnected(true);

        // Try WebSocket first
        connectWebSocket(data.room.id, data.participant.id);
      }
    } catch (err) {
      console.error("Failed to create collab room:", err);
    }
  }, [slug, email, name, connectWebSocket]);

  const joinRoom = useCallback(async (inviteCode: string) => {
    if (!email) return;
    try {
      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", inviteCode, email, name }),
      });
      const data = await res.json();
      if (data.room) {
        setRoom({ id: data.room.id, slug: data.room.slug, inviteCode: data.room.inviteCode });
        setParticipantId(data.participant.id);
        setMyColor(data.participant.color);
        setIsConnected(true);

        // Try WebSocket first
        connectWebSocket(data.room.id, data.participant.id);
      }
      return data;
    } catch (err) {
      console.error("Failed to join collab room:", err);
      return null;
    }
  }, [email, name, connectWebSocket]);

  const leaveRoom = useCallback(async () => {
    if (!room || !email) return;

    // Close WebSocket if active
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close(1000, "Left room");
      } catch { /* best effort */ }
      wsRef.current = null;
    }

    try {
      await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", roomId: room.id, email }),
      });
    } catch { /* best effort */ }

    setRoom(null);
    setParticipantId(null);
    setParticipants([]);
    setIsConnected(false);
    setTransport("polling");
    reconnectAttemptsRef.current = 0;
  }, [room, email]);

  // --- Send cursor position ---
  const sendCursorPosition = useCallback(
    (cursorX: number | null, cursorY: number | null, cursorElement: string | null) => {
      if (!participantId) return;

      // Use WebSocket if available
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "cursor",
          cursorX,
          cursorY,
          cursorElement,
        }));
        return;
      }

      // Fallback to HTTP
      fetch("/api/collab/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, cursorX, cursorY, cursorElement }),
      }).catch(() => {});
    },
    [participantId]
  );

  // --- Push code update ---
  const pushCode = useCallback(
    async (html: string) => {
      if (!room) return;

      // Use WebSocket if available
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "code",
          html,
          expectedVersion: codeVersionRef.current,
        }));
        return;
      }

      // Fallback to HTTP
      try {
        const res = await fetch("/api/collab/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            html,
            email,
            expectedVersion: codeVersionRef.current,
          }),
        });
        const data = await res.json();
        if (data.version) {
          codeVersionRef.current = data.version;
        }
        if (data.conflict) {
          const syncRes = await fetch(`/api/collab/code?roomId=${room.id}&version=0`);
          const syncData = await syncRes.json();
          if (syncData.hasUpdate) {
            codeVersionRef.current = syncData.version;
            onRemoteCodeUpdateRef.current?.(syncData.html, syncData.version, syncData.updated_by);
          }
        }
      } catch { /* best effort */ }
    },
    [room, email]
  );

  // --- Polling fallback loops (only active when transport === "polling") ---
  useEffect(() => {
    if (!enabled || !room || !participantId || transport !== "polling") return;

    // Heartbeat — keep-alive with cursor position
    heartbeatRef.current = setInterval(() => {
      sendCursorPosition(null, null, null);
    }, HEARTBEAT_INTERVAL_MS);

    // Presence poll — fetch other participants' positions
    presencePollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/collab/presence?roomId=${room.id}&exclude=${participantId}`
        );
        const data = await res.json();
        if (data.participants) {
          setParticipants(data.participants);
        }
      } catch { /* ignore */ }
    }, PRESENCE_POLL_MS);

    // Code poll — check for remote code updates
    codePollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/collab/code?roomId=${room.id}&version=${codeVersionRef.current}`
        );
        const data = await res.json();
        if (data.hasUpdate && data.updated_by !== email) {
          codeVersionRef.current = data.version;
          onRemoteCodeUpdateRef.current?.(data.html, data.version, data.updated_by);
        } else if (data.version) {
          codeVersionRef.current = data.version;
        }
      } catch { /* ignore */ }
    }, PRESENCE_POLL_MS + 500);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (presencePollRef.current) clearInterval(presencePollRef.current);
      if (codePollRef.current) clearInterval(codePollRef.current);
    };
  }, [enabled, room, participantId, email, sendCursorPosition, transport]);

  // --- WebSocket heartbeat (keep connection alive) ---
  useEffect(() => {
    if (!enabled || transport !== "websocket" || !wsRef.current) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 15_000); // Every 15s for WS (less frequent than polling)

    return () => clearInterval(interval);
  }, [enabled, transport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close WebSocket
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "Component unmount");
        } catch { /* */ }
        wsRef.current = null;
      }

      // Cancel reconnect timer
      if (wsReconnectRef.current) {
        clearTimeout(wsReconnectRef.current);
      }

      // Fire-and-forget leave
      if (room && email) {
        navigator.sendBeacon?.(
          "/api/collab",
          JSON.stringify({ action: "leave", roomId: room.id, email })
        );
      }
    };
  }, [room, email]);

  return {
    room,
    participantId,
    myColor,
    participants,
    isConnected,
    transport,
    createRoom,
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    pushCode,
  };
}
