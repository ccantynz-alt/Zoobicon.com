"use client";

/**
 * PromptQueuePanel — Sprint 4 T2 Prompt Queue.
 *
 * Lovable-parity batch-edit feature. User adds multiple change
 * prompts to a queue, hits Run, the queue processes each sequentially
 * via the builder's existing handleEdit pipeline. Each item shows
 * its run status (pending / running / done / error) so users can see
 * progress on long batches.
 *
 * Mounted in the builder when hasCode is true. State lives here (the
 * builder doesn't need to know about the queue); only the
 * onRunPrompt callback is passed in so this panel can fire the same
 * edit pipeline the manual single-prompt flow uses.
 */

import { useState } from "react";
import {
  ArrowRight,
  ListPlus,
  Play,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type QueueItemStatus = "pending" | "running" | "done" | "error";

interface QueueItem {
  id: string;
  text: string;
  status: QueueItemStatus;
  error?: string;
}

interface PromptQueuePanelProps {
  onRunPrompt: (prompt: string) => Promise<void>;
  /** When the builder is busy generating, the queue can't fire — disable controls */
  isBusy: boolean;
}

export default function PromptQueuePanel({ onRunPrompt, isBusy }: PromptQueuePanelProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [running, setRunning] = useState(false);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    // Allow newline-separated batch paste — one line = one queue item.
    const items = text.split(/\n+/).map((t) => t.trim()).filter(Boolean);
    if (items.length === 0) return;
    setQueue((prev) => [
      ...prev,
      ...items.map((t) => ({
        id: crypto.randomUUID(),
        text: t,
        status: "pending" as const,
      })),
    ]);
    setInput("");
  };

  const remove = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const clearDone = () => {
    setQueue((prev) => prev.filter((q) => q.status !== "done"));
  };

  const runAll = async () => {
    if (running || isBusy) return;
    setRunning(true);
    try {
      // Process in order; status updates per-item.
      for (const item of queue.filter((q) => q.status === "pending")) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "running" } : q))
        );
        try {
          await onRunPrompt(item.text);
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q))
          );
        } catch (err) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "error",
                    error: err instanceof Error ? err.message : String(err),
                  }
                : q
            )
          );
          // Stop on error — user can fix + re-run
          break;
        }
      }
    } finally {
      setRunning(false);
    }
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const errorCount = queue.filter((q) => q.status === "error").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  // Empty state — show only the "add" affordance
  if (queue.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
        style={{
          borderColor: "rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.6)",
        }}
        title="Open the prompt queue — batch multiple edits"
      >
        <ListPlus className="w-3 h-3" />
        Queue
      </button>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-white/60 hover:text-white"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <ListPlus className="w-3 h-3 text-white/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Prompt queue
          </span>
          {queue.length > 0 && (
            <span className="text-[10px] text-white/40 font-mono tabular-nums">
              {doneCount}/{queue.length}
              {errorCount > 0 && ` · ${errorCount} err`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {doneCount > 0 && (
            <button
              onClick={clearDone}
              className="text-[10px] text-white/40 hover:text-white/70 px-2 py-1 rounded"
            >
              Clear done
            </button>
          )}
          {pendingCount > 0 && (
            <button
              onClick={runAll}
              disabled={running || isBusy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
              }}
            >
              {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {running ? "Running…" : `Run ${pendingCount}`}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* Add input */}
          <div className="flex items-center gap-2 p-2" style={{ borderBottom: queue.length > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="One change per line. ⌘+Enter to add."
              rows={1}
              className="flex-1 bg-transparent text-[12px] text-white/85 placeholder:text-white/30 outline-none resize-none"
            />
            <button
              onClick={add}
              disabled={!input.trim()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/80 hover:text-white disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <ArrowRight className="w-3 h-3" />
              Add
            </button>
          </div>

          {/* Items */}
          {queue.length > 0 && (
            <ul className="max-h-56 overflow-y-auto">
              {queue.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 px-3 py-2 text-[12px]"
                  style={{
                    borderBottom: i < queue.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <span className="flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center">
                    {item.status === "pending" && (
                      <span className="text-[10px] text-white/40 font-mono">{i + 1}</span>
                    )}
                    {item.status === "running" && (
                      <Loader2 className="w-3 h-3 text-amber-300 animate-spin" />
                    )}
                    {item.status === "done" && (
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                    )}
                    {item.status === "error" && (
                      <X className="w-3 h-3 text-red-400" strokeWidth={3} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-white/80">{item.text}</div>
                    {item.error && (
                      <div className="text-[10px] text-red-300/80 mt-0.5">{item.error}</div>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <button
                      onClick={() => remove(item.id)}
                      className="text-white/30 hover:text-white/70 flex-shrink-0"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
