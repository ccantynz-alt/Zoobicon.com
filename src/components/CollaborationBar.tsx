"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Users,
  Link2,
  Copy,
  Check,
  LogOut,
  UserPlus,
  Radio,
  X,
} from "lucide-react";
import type { RemoteParticipant, CollabRoom, SyncStatus } from "@/hooks/useCollaboration";

interface CollaborationBarProps {
  room: CollabRoom | null;
  participants: RemoteParticipant[];
  myColor: string;
  isConnected: boolean;
  transport?: "websocket" | "sse" | "polling";
  syncStatus?: SyncStatus;
  lastSyncedAt?: number | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => Promise<unknown>;
  onLeaveRoom: () => void;
  userEmail: string;
}

function formatTimeAgo(ts: number | null | undefined): string {
  if (!ts) return "";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return "a while ago";
}

export default function CollaborationBar({
  room,
  participants,
  myColor,
  isConnected,
  transport = "polling",
  syncStatus = "synced",
  lastSyncedAt,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  userEmail,
}: CollaborationBarProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState("");
  // Re-render periodically to update "Xs ago" text
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isConnected || !lastSyncedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [isConnected, lastSyncedAt]);

  const copyInviteLink = useCallback(() => {
    if (!room) return;
    const url = `${window.location.origin}/builder?collab=${room.inviteCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [room]);

  const handleJoin = useCallback(async () => {
    setJoinError("");
    const result = await onJoinRoom(joinCode.trim());
    if (!result || (result as { error?: string }).error) {
      setJoinError("Invalid invite code");
    } else {
      setJoinCode("");
      setShowPanel(false);
    }
  }, [joinCode, onJoinRoom]);

  // Not connected — show connect button
  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/70 text-xs transition-all"
        >
          <Users size={13} />
          <span>Collaborate</span>
        </button>

        {showPanel && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Real-Time Collaboration
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <button
                onClick={() => { onCreateRoom(); setShowPanel(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-stone-500/10 border border-stone-500/20 hover:bg-stone-500/20 text-stone-400 text-sm transition-colors"
              >
                <UserPlus size={14} />
                <span>Start Collaboration Session</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-white/50">or join</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Invite code..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/50 outline-none focus:border-stone-500/50"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim()}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Join
                </button>
              </div>
              {joinError && (
                <p className="text-[10px] text-stone-400">{joinError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Connected — show presence
  const otherCount = participants.length;
  const allParticipants = [
    { user_name: "You", user_email: userEmail, color: myColor, isMe: true },
    ...participants.map((p) => ({ ...p, isMe: false })),
  ];

  return (
    <div className="relative flex items-center gap-2">
      {/* Live indicator */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-stone-500/10 border border-stone-500/20">
        <Radio size={10} className="text-stone-400 animate-pulse" />
        <span className="text-[10px] text-stone-400 font-medium">LIVE</span>
        {transport === "websocket" && (
          <span className="text-[8px] text-stone-400/50 ml-0.5">WS</span>
        )}
        {transport === "sse" && (
          <span className="text-[8px] text-stone-400/50 ml-0.5">SSE</span>
        )}
      </div>

      {/* Sync status indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.03] border border-white/5" title={
        syncStatus === "synced" ? "All changes synced" :
        syncStatus === "syncing" ? "Syncing changes..." :
        "Sync error — retrying"
      }>
        <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
          syncStatus === "synced" ? "bg-stone-400" :
          syncStatus === "syncing" ? "bg-stone-400 animate-pulse" :
          "bg-stone-400"
        }`} />
        <span className={`text-[10px] transition-colors duration-300 ${
          syncStatus === "synced" ? "text-white/40" :
          syncStatus === "syncing" ? "text-stone-400/70" :
          "text-stone-400/70"
        }`}>
          {syncStatus === "synced" && lastSyncedAt
            ? `Synced ${formatTimeAgo(lastSyncedAt)}`
            : syncStatus === "synced"
            ? "Synced"
            : syncStatus === "syncing"
            ? "Syncing..."
            : "Sync error"}
        </span>
      </div>

      {/* Avatar stack */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center -space-x-1.5"
      >
        {allParticipants.slice(0, 5).map((p, i) => (
          <div
            key={p.user_email}
            className="w-6 h-6 rounded-full border-2 border-[#111a2e] flex items-center justify-center text-[9px] font-bold text-white uppercase"
            style={{ backgroundColor: p.color, zIndex: 5 - i }}
            title={p.isMe ? "You" : p.user_name || p.user_email}
          >
            {(p.user_name || p.user_email || "?")[0]}
          </div>
        ))}
        {allParticipants.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-[#111a2e] bg-white/10 flex items-center justify-center text-[9px] text-white/60">
            +{allParticipants.length - 5}
          </div>
        )}
      </button>

      {otherCount > 0 && (
        <span className="text-[10px] text-white/50">
          {otherCount} collaborator{otherCount > 1 ? "s" : ""}
        </span>
      )}

      {/* Expanded panel */}
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-stone-400 animate-pulse" />
              <h3 className="text-xs font-semibold text-white/70">
                Live Session
              </h3>
            </div>
            <button onClick={() => setShowPanel(false)} className="text-white/50 hover:text-white/60">
              <X size={14} />
            </button>
          </div>

          {/* Invite section */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[10px] text-white/50 mb-2">Invite code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/80 font-mono tracking-wider">
                {room?.inviteCode}
              </code>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-stone-500/10 border border-stone-500/20 text-stone-400 text-[10px] hover:bg-stone-500/20 transition-colors"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Link"}
              </button>
            </div>
          </div>

          {/* Participants list */}
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-2">
              Participants ({allParticipants.length})
            </p>
            {allParticipants.map((p) => (
              <div
                key={p.user_email}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03]"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase"
                  style={{ backgroundColor: p.color }}
                >
                  {(p.user_name || p.user_email || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70 truncate">
                    {p.isMe ? "You" : p.user_name || p.user_email}
                  </p>
                </div>
                {!p.isMe && (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400" title="Online" />
                )}
              </div>
            ))}
          </div>

          {/* Leave button */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={() => { onLeaveRoom(); setShowPanel(false); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-500/20 text-stone-400/70 hover:bg-stone-500/10 text-xs transition-colors"
            >
              <LogOut size={12} />
              <span>Leave Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
