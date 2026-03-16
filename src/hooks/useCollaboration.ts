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

  const codeVersionRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const presencePollRef = useRef<NodeJS.Timeout | null>(null);
  const codePollRef = useRef<NodeJS.Timeout | null>(null);
  const onRemoteCodeUpdateRef = useRef(onRemoteCodeUpdate);
  onRemoteCodeUpdateRef.current = onRemoteCodeUpdate;

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
      }
    } catch (err) {
      console.error("Failed to create collab room:", err);
    }
  }, [slug, email, name]);

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
      }
      return data;
    } catch (err) {
      console.error("Failed to join collab room:", err);
      return null;
    }
  }, [email, name]);

  const leaveRoom = useCallback(async () => {
    if (!room || !email) return;
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
  }, [room, email]);

  // --- Heartbeat (sends cursor position) ---
  const sendCursorPosition = useCallback(
    (cursorX: number | null, cursorY: number | null, cursorElement: string | null) => {
      if (!participantId) return;
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
          // Conflict — fetch latest and let onRemoteCodeUpdate handle it
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

  // --- Polling loops ---
  useEffect(() => {
    if (!enabled || !room || !participantId) return;

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
    }, PRESENCE_POLL_MS + 500); // Slightly offset from presence poll

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (presencePollRef.current) clearInterval(presencePollRef.current);
      if (codePollRef.current) clearInterval(codePollRef.current);
    };
  }, [enabled, room, participantId, email, sendCursorPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room && email) {
        // Fire-and-forget leave on unmount
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
    createRoom,
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    pushCode,
  };
}
