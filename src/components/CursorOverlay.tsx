"use client";

import type { RemoteParticipant } from "@/hooks/useCollaboration";

interface CursorOverlayProps {
  participants: RemoteParticipant[];
  containerRect?: DOMRect | null;
}

export default function CursorOverlay({ participants, containerRect }: CursorOverlayProps) {
  if (!containerRect) return null;

  const activeCursors = participants.filter(
    (p) => p.cursor_x !== null && p.cursor_y !== null
  );

  if (activeCursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {activeCursors.map((p) => {
        // Scale cursor position relative to container
        const x = (p.cursor_x || 0) * containerRect.width;
        const y = (p.cursor_y || 0) * containerRect.height;

        return (
          <div
            key={p.id}
            className="absolute transition-all duration-200 ease-out"
            style={{ left: x, top: y }}
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
        );
      })}
    </div>
  );
}
