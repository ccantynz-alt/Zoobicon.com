"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  Settings,
  Menu,
  X,
  Sparkles,
  Zap,
  Brain,
  KeyRound,
} from "lucide-react";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: ModelKey;
  updatedAt: number;
}

type ModelKey = "opus" | "sonnet" | "haiku";

const MODEL_LABEL: Record<ModelKey, { name: string; desc: string; icon: typeof Sparkles }> = {
  opus: { name: "Opus 4.7", desc: "Deepest reasoning. Slowest + priciest.", icon: Brain },
  sonnet: { name: "Sonnet 4.6", desc: "Best all-round. Default.", icon: Sparkles },
  haiku: { name: "Haiku 4.5", desc: "Fast + cheap. Quick answers.", icon: Zap },
};

const STORAGE_CONVOS = "zoobicon_chat_conversations";
const STORAGE_ACTIVE = "zoobicon_chat_active";
const STORAGE_TOKEN = "zoobicon_chat_token";
const STORAGE_MODEL = "zoobicon_chat_model";

function genId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_CONVOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(list: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CONVOS, JSON.stringify(list));
  } catch {
    // quota exceeded — keep only 30 most recent
    try {
      localStorage.setItem(
        STORAGE_CONVOS,
        JSON.stringify(list.slice(0, 30)),
      );
    } catch {
      // give up silently
    }
  }
}

/** Render markdown to safe HTML. Minimal inline renderer — good enough for chat. */
function renderMarkdown(src: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Extract fenced code blocks first so we don't process their contents
  const codeBlocks: string[] = [];
  const codeFencePattern = /```(\w+)?\n?([\s\S]*?)```/g;
  let pre = src.replace(codeFencePattern, (_, lang: string | undefined, code: string) => {
    const language = (lang || "").trim();
    const escaped = escape(code.replace(/\n$/, ""));
    codeBlocks.push(
      `<pre class="md-code"><div class="md-code-head"><span class="md-code-lang">${escape(language || "text")}</span></div><code>${escaped}</code></pre>`,
    );
    return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
  });

  // Escape everything else
  pre = escape(pre);

  // Headings
  pre = pre.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
  pre = pre.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
  pre = pre.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  pre = pre.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  pre = pre.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  pre = pre.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Bold + italic + inline code
  pre = pre.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  pre = pre.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  pre = pre.replace(/`([^`\n]+)`/g, "<code class=\"md-inline\">$1</code>");

  // Links
  pre = pre.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
  );

  // Unordered lists
  pre = pre.replace(/(^|\n)((?:- [^\n]+\n?)+)/g, (_, pre1, block: string) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => l.replace(/^- /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `${pre1}<ul>${items}</ul>`;
  });

  // Ordered lists
  pre = pre.replace(/(^|\n)((?:\d+\. [^\n]+\n?)+)/g, (_, pre1, block: string) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => l.replace(/^\d+\. /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `${pre1}<ol>${items}</ol>`;
  });

  // Paragraphs (double newline) + single-line breaks
  pre = pre
    .split(/\n\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return "";
      if (/^<(h\d|ul|ol|pre|blockquote)/.test(trimmed)) return trimmed;
      if (trimmed.includes("\u0000CODEBLOCK")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  // Restore code blocks
  pre = pre.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (_, idx: string) => {
    return codeBlocks[Number(idx)] || "";
  });

  return pre;
}

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelKey>("sonnet");
  const [token, setToken] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load on mount ──
  useEffect(() => {
    const convos = loadConversations();
    setConversations(convos);
    const storedActive = localStorage.getItem(STORAGE_ACTIVE) || "";
    const storedToken = localStorage.getItem(STORAGE_TOKEN) || "";
    const storedModel = (localStorage.getItem(STORAGE_MODEL) as ModelKey) || "sonnet";
    setToken(storedToken);
    setModel(storedModel);

    if (storedActive && convos.some((c) => c.id === storedActive)) {
      setActiveId(storedActive);
    } else if (convos.length > 0) {
      setActiveId(convos[0].id);
    } else {
      const fresh: Conversation = {
        id: genId(),
        title: "New chat",
        messages: [],
        model: storedModel,
        updatedAt: Date.now(),
      };
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
  }, []);

  // ── Persist ──
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(STORAGE_ACTIVE, activeId);
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MODEL, model);
  }, [model]);

  // ── Auto-resize textarea ──
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [input]);

  // ── Auto-scroll during streaming ──
  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, streaming]);

  const newChat = useCallback(() => {
    const fresh: Conversation = {
      id: genId(),
      title: "New chat",
      messages: [],
      model,
      updatedAt: Date.now(),
    };
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  }, [model]);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (next.length === 0) {
          const fresh: Conversation = {
            id: genId(),
            title: "New chat",
            messages: [],
            model,
            updatedAt: Date.now(),
          };
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) {
          setActiveId(next[0].id);
        }
        return next;
      });
    },
    [activeId, model],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    setError(null);

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const assistantMsg: Message = {
      id: genId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    // Snapshot conversation state BEFORE updating so the request body
    // reflects the history including this new user message.
    const currentConvo = conversations.find((c) => c.id === activeId);
    const history: Message[] = currentConvo ? [...currentConvo.messages, userMsg] : [userMsg];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title:
                c.messages.length === 0
                  ? trimmed.slice(0, 60)
                  : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
              model,
              updatedAt: Date.now(),
            }
          : c,
      ),
    );
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          ...(token ? { "x-chat-token": token } : {}),
        },
        body: JSON.stringify({
          model,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `Request failed (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (errText) errMsg = errText;
        }
        throw new Error(errMsg);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;
          const payload = trimmedLine.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload) as {
              type: string;
              text?: string;
              error?: string;
            };
            if (evt.type === "text" && evt.text) {
              acc += evt.text;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== activeId) return c;
                  const msgs = c.messages.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: acc } : m,
                  );
                  return { ...c, messages: msgs, updatedAt: Date.now() };
                }),
              );
            } else if (evt.type === "error") {
              throw new Error(evt.error || "stream error");
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message === "stream error") {
              throw parseErr;
            }
            // silently ignore malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // user stopped — leave partial message in place
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c;
            const msgs = c.messages.map((m) =>
              m.id === assistantMsg.id && !m.content
                ? { ...m, content: `_Error: ${msg}_` }
                : m,
            );
            return { ...c, messages: msgs };
          }),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, conversations, activeId, model, token]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const activeMessages = active?.messages ?? [];
  const hasMessages = activeMessages.length > 0;

  return (
    <div className="h-screen w-screen flex bg-[#0b0d17] text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`shrink-0 border-r border-white/10 bg-[#0f2148] flex flex-col transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-zinc-900" />
            </div>
            <span className="text-sm font-semibold">Chat</span>
          </div>
          <button
            onClick={newChat}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                c.id === activeId
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate">{c.title || "New chat"}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this conversation?")) deleteChat(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-white/10 p-2">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-white/5 text-white/70 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-white/10 bg-[#0f111c]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <h1 className="text-sm font-medium text-white/80 truncate max-w-xs">
              {active?.title || "New chat"}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {(Object.keys(MODEL_LABEL) as ModelKey[]).map((key) => {
              const info = MODEL_LABEL[key];
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setModel(key)}
                  title={info.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    model === key
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {info.name}
                </button>
              );
            })}
          </div>
        </header>

        {/* Settings panel */}
        {showSettings && (
          <div className="shrink-0 border-b border-white/10 bg-[#0f2148] px-6 py-4">
            <div className="max-w-2xl mx-auto">
              <label className="flex items-center gap-2 text-xs font-medium text-white/70 mb-2">
                <KeyRound className="w-3.5 h-3.5" />
                Admin chat token (optional)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  localStorage.setItem(STORAGE_TOKEN, e.target.value);
                }}
                placeholder="Leave blank if ADMIN_CHAT_TOKEN isn't set on the server"
                className="w-full px-3 py-2 rounded-md bg-[#0b0d17] border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                If the server has ADMIN_CHAT_TOKEN set, paste the same value here to authenticate. Otherwise any caller on the network can use the endpoint.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-zinc-900" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">What can I help with?</h2>
                <p className="text-sm text-white/50 max-w-md">
                  Direct Anthropic API access. No usage caps, pay-per-token pricing. Everything you&apos;d do in Claude.ai, right here.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-8 max-w-lg w-full">
                  {[
                    "Explain a concept to me",
                    "Help me debug code",
                    "Draft an email reply",
                    "Summarise a long document",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setInput(example)}
                      className="text-left text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {error && (
              <div className="my-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-white/10 bg-[#0f111c] px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#0f2148] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-amber-500/40 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message Claude…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none resize-none py-1.5 max-h-60"
                disabled={streaming}
              />
              {streaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="shrink-0 h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-zinc-900 flex items-center justify-center transition-all disabled:cursor-not-allowed"
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-white/30">
              Claude can make mistakes. Check important info. Shift + Enter for newline.
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .md-body h1 { font-size: 1.4rem; font-weight: 700; margin: 1.2rem 0 0.6rem; }
        .md-body h2 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .md-body h3 { font-size: 1.05rem; font-weight: 600; margin: 0.9rem 0 0.4rem; }
        .md-body h4, .md-body h5, .md-body h6 { font-weight: 600; margin: 0.8rem 0 0.35rem; }
        .md-body p { line-height: 1.65; margin: 0.6rem 0; }
        .md-body ul, .md-body ol { padding-left: 1.4rem; margin: 0.5rem 0; }
        .md-body li { margin: 0.25rem 0; line-height: 1.6; }
        .md-body a { color: #fbbf24; text-decoration: underline; text-underline-offset: 2px; }
        .md-body a:hover { color: #fcd34d; }
        .md-body strong { font-weight: 600; color: #fff; }
        .md-body em { font-style: italic; }
        .md-body code.md-inline {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.85em;
        }
        .md-body pre.md-code {
          background: #0b0d17;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          margin: 0.75rem 0;
          overflow: hidden;
        }
        .md-body pre.md-code .md-code-head {
          padding: 6px 12px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .md-body pre.md-code code {
          display: block;
          padding: 14px;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px;
          line-height: 1.6;
          color: #e4e4e7;
        }
        .md-cursor::after {
          content: "▋";
          display: inline-block;
          margin-left: 2px;
          color: #fbbf24;
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          to { visibility: hidden; }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const html = useMemo(() => renderMarkdown(message.content || ""), [message.content]);
  const showCursor = !isUser && message.content.length === 0;

  return (
    <div className={`flex gap-4 my-6 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
          isUser
            ? "bg-white/10 text-white"
            : "bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900"
        }`}
      >
        {isUser ? "You" : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        <div className="text-[11px] text-white/40 mb-1">
          {isUser ? "You" : "Claude"}
        </div>
        <div
          className={`md-body inline-block text-left max-w-full ${
            isUser
              ? "bg-white/5 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-2.5 text-[14.5px]"
              : "text-[14.5px] text-white/90"
          }`}
        >
          {showCursor ? (
            <span className="md-cursor text-white/50">thinking</span>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: html + (message.role === "assistant" ? "" : "") }}
            />
          )}
        </div>
        {!isUser && message.content.length > 0 && (
          <div className="mt-1.5 flex items-center gap-3 text-white/40">
            <CodeCopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
