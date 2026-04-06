"use client";

import { useRef, useEffect } from "react";
import type { RemoteParticipant } from "@/hooks/useCollaboration";

interface CursorOverlayProps {
  participants: RemoteParticipant[];
  containerRect?: DOMRect | null;
}

export default function CursorOverlay({ participants, containerRect }: CursorOverlayProps) {
  // Track previous positions for each cursor to render trail ghosts
  const prevPositionsRef = useRef<Map<string, { x: number; y: number; ts: number }[]>>(new Map());

  // Update trail history whenever cursor positions change
  useEffect(() => {
    if (!containerRect) return;
    const now = Date.now();
    const map = prevPositionsRef.current;

    for (const p of participants) {
      if (p.cursor_x === null || p.cursor_y === null) continue;
      const x = p.cursor_x * containerRect.width;
      const y = p.cursor_y * containerRect.height;

      const trail = map.get(p.id) || [];
      // Only add if position actually changed
      const last = trail[trail.length - 1];
      if (!last || Math.abs(last.x - x) > 1 || Math.abs(last.y - y) > 1) {
        trail.push({ x, y, ts: now });
      }
      // Keep only recent trail points (last 400ms)
      const cutoff = now - 400;
      const trimmed = trail.filter((pt) => pt.ts > cutoff);
      map.set(p.id, trimmed);
    }

    // Clean up stale participants
    for (const key of map.keys()) {
      if (!participants.some((p) => p.id === key)) {
        map.delete(key);
      }
    }
  }, [participants, containerRect]);

  if (!containerRect) return null;

  const activeCursors = participants.filter(
    (p) => p.cursor_x !== null && p.cursor_y !== null
  );

  if (activeCursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {activeCursors.map((p) => {
        const x = (p.cursor_x || 0) * containerRect.width;
        const y = (p.cursor_y || 0) * containerRect.height;

        // Render trail ghosts (fading dots behind cursor)
        const trail = prevPositionsRef.current.get(p.id) || [];
        const now = Date.now();

        return (
          <div key={p.id}>
            {/* Fade trail — ghost dots along previous positions */}
            {trail.map((pt, i) => {
              const age = now - pt.ts;
              const opacity = Math.max(0, 1 - age / 400) * 0.3;
              if (opacity <= 0.02) return null;
              return (
                <div
                  key={`${p.id}-trail-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: pt.x,
                    top: pt.y,
                    width: 6,
                    height: 6,
                    backgroundColor: p.color,
                    opacity,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              );
            })}

            {/* Main cursor — smooth CSS transition for gliding movement */}
            <div
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                transition: "transform 150ms ease-out",
                willChange: "transform",
              }}
            >
              {/* Cursor arrow */}
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                className="drop-shadow-md"
              >
                <path
                  d="M0 0L16 12L8 12L4 20L0 0Z"
                  fill={p.color}
                />
                <path
                  d="M0 0L16 12L8 12L4 20L0 0Z"
                  stroke="white"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
              </svg>
              {/* Name label */}
              <div
                className="absolute left-3 top-4 px-1.5 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: p.color }}
              >
                {p.user_name || p.user_email?.split("@")[0] || "User"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
