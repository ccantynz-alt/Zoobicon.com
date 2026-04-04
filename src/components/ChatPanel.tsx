"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "pending" | "streaming" | "complete" | "error";
  changedFiles?: string[];
  durationMs?: number;
}

interface ChatPanelProps {
  /** Current React files in the editor (for diff-based editing via /api/generate/edit) */
  reactFiles?: Record<string, string> | null;
  /** Callback to merge changed files into Sandpack preview */
  onFilesUpdate?: (changedFiles: Record<string, string>) => void;
  /** Legacy: current HTML code (for /api/chat based editing in the /edit page) */
  currentCode?: string;
  /** Legacy: callback to update HTML code */
  onCodeUpdate?: (code: string) => void;
  /** Whether the panel is visible */
  isVisible: boolean;
  /** Whether a generation is currently running (disables input) */
  isGenerating?: boolean;
}

const SUGGESTION_PROMPTS = [
  "Make the header background darker",
  "Change the primary color to blue",
  "Add a testimonials section",
  "Make the hero section larger",
  "Add smooth scroll animations",
  "Update the footer with social links",
];

let messageIdCounter = 0;
function nextId() {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export default function ChatPanel({
  reactFiles,
  onFilesUpdate,
  currentCode,
  onCodeUpdate,
  isVisible,
  isGenerating = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Detect mode: React files (diff-based) or legacy HTML
  const isReactMode = !!(reactFiles && Object.keys(reactFiles).length > 0 && onFilesUpdate);
  const isLegacyMode = !isReactMode && !!currentCode && !!onCodeUpdate;
  const hasFiles = isReactMode || isLegacyMode;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel becomes visible
  useEffect(() => {
    if (isVisible && hasFiles && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, hasFiles]);

  const handleSend = useCallback(async (instruction?: string) => {
    const text = (instruction || input).trim();
    if (!text || isEditing || !hasFiles) return;

    setInput("");
    setShowSuggestions(false);

    // Add user message
    const userMsgId = nextId();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    // Add pending assistant message
    const assistantMsgId = nextId();
    const pendingMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      status: "pending",
    };

    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setIsEditing(true);

    const startTime = Date.now();

    // Abort any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get auth headers
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const u = localStorage.getItem("zoobicon_user");
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.email) headers["x-user-email"] = parsed.email;
          if (parsed.role === "admin" || parsed.plan === "unlimited") headers["x-admin"] = "1";
        }
      } catch { /* ignore */ }

      // Update to streaming state
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, status: "streaming", content: "Analyzing code and applying changes..." }
            : m
        )
      );

      if (isReactMode) {
        // ── REACT MODE: diff-based editing via /api/generate/edit ──
        const res = await fetch("/api/generate/edit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            instruction: text,
            files: reactFiles,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let lineBuffer = "";

        const processLine = (line: string) => {
          if (!line.startsWith("data: ")) return;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) return;

          const event = JSON.parse(jsonStr);

          if (event.type === "status") {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: event.message } : m
              )
            );
          } else if (event.type === "done" && event.files) {
            const changedFiles = Object.keys(event.files);
            const duration = Date.now() - startTime;
            onFilesUpdate!(event.files);
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      status: "complete" as const,
                      content: changedFiles.length === 1
                        ? `Updated ${changedFiles[0]}`
                        : `Updated ${changedFiles.length} files`,
                      changedFiles,
                      durationMs: duration,
                    }
                  : m
              )
            );
          } else if (event.type === "error") {
            throw new Error(event.message || "Edit failed");
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() || "";
          for (const line of lines) {
            try { processLine(line); } catch (e) {
              if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
            }
          }
        }

        // Flush remaining buffer
        if (lineBuffer.trim()) {
          for (const line of lineBuffer.split("\n")) {
            try { processLine(line); } catch (e) {
              if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
            }
          }
        }
      } else if (isLegacyMode) {
        // ── LEGACY MODE: HTML editing via /api/chat ──
        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ currentCode, instruction: text }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let fullOutput = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") fullOutput += data.content;
              else if (data.type === "error") throw new Error(data.content);
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        let clean = fullOutput.trim().replace(/^```(?:html|css|HTML|CSS)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
        const ds = clean.search(/<!doctype\s+html|<html/i);
        if (ds > 0) clean = clean.slice(ds);
        const he = clean.lastIndexOf("</html>");
        if (he !== -1) clean = clean.slice(0, he + "</html>".length);

        if (clean) {
          onCodeUpdate!(clean);
          const duration = Date.now() - startTime;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, status: "complete" as const, content: "Edit applied!", durationMs: duration }
                : m
            )
          );
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Something went wrong";

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                status: "error",
                content: errMsg,
                durationMs: Date.now() - startTime,
              }
            : m
        )
      );
    } finally {
      setIsEditing(false);
    }
  }, [input, isEditing, hasFiles, isReactMode, isLegacyMode, reactFiles, onFilesUpdate, currentCode, onCodeUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <p className="text-center text-sm text-white/70 font-medium mb-1">
              AI Editor
            </p>
            <p className="text-center text-xs text-white/40 mb-5 leading-relaxed px-2">
              {hasFiles
                ? "Describe any change and it will be applied instantly. Only affected files are updated."
                : "Generate a site first, then use the editor to make changes."}
            </p>

            {hasFiles && showSuggestions && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-white/30 px-1 mb-2">
                  Try saying
                </p>
                {SUGGESTION_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    disabled={isEditing || isGenerating}
                    className="flex items-center gap-2 w-full text-left text-xs text-white/50
                               hover:text-violet-300 py-2 px-3 rounded-lg hover:bg-violet-500/[0.06]
                               transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
                               border border-transparent hover:border-violet-500/10"
                  >
                    <Zap className="w-3 h-3 text-violet-500/50 flex-shrink-0" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {/* Assistant avatar */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      msg.status === "error"
                        ? "bg-red-500/15 border border-red-500/20"
                        : msg.status === "complete"
                        ? "bg-emerald-500/15 border border-emerald-500/20"
                        : "bg-violet-500/15 border border-violet-500/20"
                    }`}
                  >
                    {msg.status === "pending" || msg.status === "streaming" ? (
                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                    ) : msg.status === "error" ? (
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    ) : msg.status === "complete" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Bot className="w-3 h-3 text-violet-400" />
                    )}
                  </div>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[260px] ${
                  msg.role === "user"
                    ? "bg-violet-500/15 border border-violet-500/20 text-violet-200 rounded-2xl rounded-tr-md px-3.5 py-2"
                    : msg.status === "error"
                    ? "bg-red-500/8 border border-red-500/15 text-red-300/80 rounded-2xl rounded-tl-md px-3.5 py-2"
                    : msg.status === "complete"
                    ? "bg-emerald-500/8 border border-emerald-500/15 rounded-2xl rounded-tl-md px-3.5 py-2"
                    : "bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-3.5 py-2"
                }`}
              >
                <p className={`text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "text-violet-200"
                    : msg.status === "error"
                    ? "text-red-300/80"
                    : msg.status === "complete"
                    ? "text-emerald-300/90"
                    : "text-white/60"
                }`}>
                  {msg.content}
                </p>

                {/* Changed files list */}
                {msg.changedFiles && msg.changedFiles.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/10">
                    {msg.changedFiles.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 py-0.5"
                      >
                        <FileEdit className="w-2.5 h-2.5" />
                        <span className="font-mono">{file}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Duration badge */}
                {msg.durationMs != null && msg.status === "complete" && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-emerald-500/50" />
                    <span className="text-[10px] text-emerald-500/50">
                      {(msg.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>

              {/* User avatar */}
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <User className="w-3 h-3 text-white/50" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div className="h-1" />
      </div>

      {/* File count indicator */}
      {hasFiles && messages.length > 0 && (
        <div className="px-4 py-1.5 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/25">
              {Object.keys(reactFiles!).length} files in project
            </span>
            {messages.filter(m => m.status === "complete").length > 0 && (
              <span className="text-[10px] text-white/25">
                {messages.filter(m => m.status === "complete").length} edits applied
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !hasFiles
                ? "Generate a site first..."
                : isEditing
                ? "Applying changes..."
                : isGenerating
                ? "Waiting for generation..."
                : "Describe a change... (Enter to send)"
            }
            disabled={!hasFiles || isEditing || isGenerating}
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 pr-12 text-xs
                       text-white/80 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20
                       focus:border-violet-500/30 transition-all resize-none disabled:opacity-30
                       disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || !hasFiles || isEditing || isGenerating}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600
                       text-white disabled:opacity-20 disabled:cursor-not-allowed
                       hover:from-violet-500 hover:to-purple-500 transition-all
                       shadow-lg shadow-violet-500/20 disabled:shadow-none"
          >
            {isEditing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
