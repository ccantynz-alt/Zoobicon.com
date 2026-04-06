"use client";

import { useState, useMemo } from "react";
import {
  X,
  History,
  GitBranch,
  Plus,
  Minus,
  Eye,
  Columns2,
} from "lucide-react";

/* ─── Types ─── */
interface Snapshot {
  html: string;
  label: string;
  timestamp: number;
}

interface DiffLine {
  type: "unchanged" | "added" | "removed";
  oldLineNo: number | null;
  newLineNo: number | null;
  content: string;
}

interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

interface DiffPanelProps {
  snapshots: Snapshot[];
  currentIndex: number;
  onClose: () => void;
  onRestore: (index: number) => void;
}

/* ─── LCS-based diff algorithm ─── */
function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: "unchanged",
        oldLineNo: i,
        newLineNo: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: "added",
        oldLineNo: null,
        newLineNo: j,
        content: newLines[j - 1],
      });
      j--;
    } else {
      result.push({
        type: "removed",
        oldLineNo: i,
        newLineNo: null,
        content: oldLines[i - 1],
      });
      i--;
    }
  }

  return result.reverse();
}

function getDiffStats(lines: DiffLine[]): DiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const line of lines) {
    if (line.type === "added") added++;
    else if (line.type === "removed") removed++;
    else unchanged++;
  }
  return { added, removed, unchanged };
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

/* ─── Component ─── */
export default function DiffPanel({
  snapshots,
  currentIndex,
  onClose,
  onRestore,
}: DiffPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"unified" | "side-by-side">("unified");

  const diffResult = useMemo(() => {
    if (selectedIndex === null || selectedIndex === currentIndex) return null;
    const oldHtml = snapshots[selectedIndex].html;
    const newHtml = snapshots[currentIndex].html;
    const oldLines = oldHtml.split("\n");
    const newLines = newHtml.split("\n");

    // For very large diffs, cap to prevent UI freezes
    if (oldLines.length > 5000 || newLines.length > 5000) {
      return {
        lines: [
          {
            type: "removed" as const,
            oldLineNo: null,
            newLineNo: null,
            content: `[Diff too large: ${oldLines.length} vs ${newLines.length} lines. Select closer versions.]`,
          },
        ],
        stats: { added: 0, removed: 0, unchanged: 0 },
      };
    }

    const lines = computeDiff(oldLines, newLines);
    const stats = getDiffStats(lines);
    return { lines, stats };
  }, [selectedIndex, currentIndex, snapshots]);

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-5xl bg-[#0a0a0f] border-l border-white/[0.06] flex h-full">
        {/* Left sidebar — snapshot list */}
        <div className="w-64 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/80">
              <History size={16} />
              <span className="text-sm font-medium">Version History</span>
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {snapshots.map((snap, idx) => {
              const isCurrent = idx === currentIndex;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx === selectedIndex ? null : idx)}
                  disabled={isCurrent}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-brand-500/20 border border-brand-500/40 text-brand-300"
                      : isCurrent
                        ? "bg-white/[0.04] border border-white/[0.08] text-white/50 cursor-default"
                        : "hover:bg-white/[0.04] border border-transparent text-white/60 hover:text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch size={12} className="flex-shrink-0 text-white/50" />
                    <span className="truncate font-medium">
                      {snap.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-5">
                    <span className="text-white/50">{formatTime(snap.timestamp)}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded">
                        current
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main area — diff view */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-white/80">Diff View</h2>
              {diffResult && (
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-green-400">
                    <Plus size={12} />
                    {diffResult.stats.added} added
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <Minus size={12} />
                    {diffResult.stats.removed} removed
                  </span>
                  <span className="text-white/50">
                    {diffResult.stats.unchanged} unchanged
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("unified")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                    viewMode === "unified"
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/50 hover:text-white/50"
                  }`}
                >
                  <Eye size={12} />
                  Unified
                </button>
                <button
                  onClick={() => setViewMode("side-by-side")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                    viewMode === "side-by-side"
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/50 hover:text-white/50"
                  }`}
                >
                  <Columns2 size={12} />
                  Side by Side
                </button>
              </div>

              {/* Restore button */}
              {selectedIndex !== null && selectedIndex !== currentIndex && (
                <button
                  onClick={() => {
                    onRestore(selectedIndex);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Restore this version
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/50 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-auto">
            {selectedIndex === null ? (
              <div className="flex items-center justify-center h-full text-white/50 text-sm">
                Select a snapshot from the sidebar to compare with current version
              </div>
            ) : selectedIndex === currentIndex ? (
              <div className="flex items-center justify-center h-full text-white/50 text-sm">
                This is the current version
              </div>
            ) : diffResult ? (
              viewMode === "unified" ? (
                <UnifiedView lines={diffResult.lines} />
              ) : (
                <SideBySideView lines={diffResult.lines} />
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Unified diff view ─── */
function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs leading-5">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`flex ${
            line.type === "added"
              ? "bg-green-900/20"
              : line.type === "removed"
                ? "bg-red-900/20"
                : ""
          }`}
        >
          {/* Old line number */}
          <span className="w-12 flex-shrink-0 text-right pr-2 select-none text-white/15 border-r border-white/[0.04]">
            {line.oldLineNo ?? ""}
          </span>
          {/* New line number */}
          <span className="w-12 flex-shrink-0 text-right pr-2 select-none text-white/15 border-r border-white/[0.04]">
            {line.newLineNo ?? ""}
          </span>
          {/* Prefix */}
          <span
            className={`w-6 flex-shrink-0 text-center select-none ${
              line.type === "added"
                ? "text-green-400"
                : line.type === "removed"
                  ? "text-red-400"
                  : "text-white/10"
            }`}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>
          {/* Content */}
          <span
            className={`flex-1 px-2 whitespace-pre ${
              line.type === "added"
                ? "text-green-300"
                : line.type === "removed"
                  ? "text-red-300"
                  : "text-white/50"
            }`}
          >
            {line.content || " "}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Side-by-side diff view ─── */
function SideBySideView({ lines }: { lines: DiffLine[] }) {
  // Split into left (old) and right (new) columns
  const { leftLines, rightLines } = useMemo(() => {
    const left: { lineNo: number | null; content: string; type: "unchanged" | "removed" | "empty" }[] = [];
    const right: { lineNo: number | null; content: string; type: "unchanged" | "added" | "empty" }[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === "unchanged") {
        left.push({ lineNo: line.oldLineNo, content: line.content, type: "unchanged" });
        right.push({ lineNo: line.newLineNo, content: line.content, type: "unchanged" });
        i++;
      } else if (line.type === "removed") {
        // Check if the next line is an "added" — pair them
        if (i + 1 < lines.length && lines[i + 1].type === "added") {
          left.push({ lineNo: line.oldLineNo, content: line.content, type: "removed" });
          right.push({ lineNo: lines[i + 1].newLineNo, content: lines[i + 1].content, type: "added" });
          i += 2;
        } else {
          left.push({ lineNo: line.oldLineNo, content: line.content, type: "removed" });
          right.push({ lineNo: null, content: "", type: "empty" });
          i++;
        }
      } else {
        // added
        left.push({ lineNo: null, content: "", type: "empty" });
        right.push({ lineNo: line.newLineNo, content: line.content, type: "added" });
        i++;
      }
    }
    return { leftLines: left, rightLines: right };
  }, [lines]);

  const bgFor = (type: string) => {
    if (type === "removed") return "bg-red-900/20";
    if (type === "added") return "bg-green-900/20";
    return "";
  };

  const textFor = (type: string) => {
    if (type === "removed") return "text-red-300";
    if (type === "added") return "text-green-300";
    if (type === "empty") return "";
    return "text-white/50";
  };

  return (
    <div className="flex font-mono text-xs leading-5">
      {/* Left (old) */}
      <div className="flex-1 border-r border-white/[0.06]">
        {leftLines.map((line, idx) => (
          <div key={idx} className={`flex ${bgFor(line.type)}`}>
            <span className="w-12 flex-shrink-0 text-right pr-2 select-none text-white/15 border-r border-white/[0.04]">
              {line.lineNo ?? ""}
            </span>
            <span className={`flex-1 px-2 whitespace-pre ${textFor(line.type)}`}>
              {line.content || " "}
            </span>
          </div>
        ))}
      </div>
      {/* Right (new) */}
      <div className="flex-1">
        {rightLines.map((line, idx) => (
          <div key={idx} className={`flex ${bgFor(line.type)}`}>
            <span className="w-12 flex-shrink-0 text-right pr-2 select-none text-white/15 border-r border-white/[0.04]">
              {line.lineNo ?? ""}
            </span>
            <span className={`flex-1 px-2 whitespace-pre ${textFor(line.type)}`}>
              {line.content || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
