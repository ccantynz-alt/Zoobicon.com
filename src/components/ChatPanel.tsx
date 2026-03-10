"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  isVisible: boolean;
}

export default function ChatPanel({ currentCode, onCodeUpdate, isVisible }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const instruction = input.trim();
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: instruction, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCode, instruction }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Chat failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk") {
              fullCode += data.content;
            } else if (data.type === "error") {
              throw new Error(data.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Robust HTML cleaning — strip code fences, preamble, trailing text
      let cleanCode = fullCode.trim();
      cleanCode = cleanCode.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
      const docStart = cleanCode.search(/<!doctype\s+html|<html/i);
      if (docStart > 0) cleanCode = cleanCode.slice(docStart);
      const htmlEnd = cleanCode.lastIndexOf("</html>");
      if (htmlEnd !== -1) cleanCode = cleanCode.slice(0, htmlEnd + "</html>".length);
      cleanCode = cleanCode.trim();

      if (cleanCode) {
        onCodeUpdate(cleanCode);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "Changes applied! Check the preview.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply changes";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}`, timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full border-l border-white/[0.06] bg-dark-300/50 w-[340px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Bot className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          AI Editor
        </span>
        {!currentCode && (
          <span className="ml-auto text-[10px] text-white/20">Generate a site first</span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-xs text-white/20 mb-4">
              Tell me what to change in your website.
            </p>
            <div className="space-y-1.5">
              {[
                "Make the header background darker",
                "Add a contact form section",
                "Change the primary color to blue",
                "Make the font size larger",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  disabled={!currentCode}
                  className="block w-full text-left text-xs text-white/25 hover:text-brand-400
                             py-1.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors disabled:opacity-30"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-brand-400" />
              </div>
            )}
            <div
              className={`px-3 py-2 rounded-xl text-xs max-w-[240px] ${
                msg.role === "user"
                  ? "bg-brand-500/20 text-brand-200"
                  : msg.content.startsWith("Error:")
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-white/[0.04] text-white/60"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-white/40" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
            </div>
            <div className="px-3 py-2 rounded-xl text-xs bg-white/[0.04] text-white/40">
              Editing your website...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentCode ? "Describe a change..." : "Generate a site first"}
            disabled={!currentCode || isLoading}
            rows={2}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs
                       placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-brand-500/20
                       focus:border-brand-500/30 transition-all resize-none disabled:opacity-30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !currentCode || isLoading}
            className="p-2.5 btn-gradient rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
