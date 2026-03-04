"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Send,
  Globe,
  Search,
  Video,
  Server,
  CreditCard,
  Code2,
  HelpCircle,
  ArrowRight,
  Bot,
  User,
  Loader2,
  RotateCcw,
  Sparkles,
  Shield,
  BookOpen,
  MessageCircle,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_TOPICS = [
  { icon: Globe, label: "How do I build a website?", category: "Builder" },
  { icon: Search, label: "How does the SEO Agent work?", category: "SEO" },
  { icon: Video, label: "How do I create AI videos?", category: "Video" },
  { icon: Server, label: "Help with DNS configuration", category: "DNS" },
  { icon: CreditCard, label: "What are the pricing plans?", category: "Billing" },
  { icon: Code2, label: "How do I use the API?", category: "Developer" },
];

const HELP_CATEGORIES = [
  { icon: Globe, title: "Website Builder", desc: "Build, edit, and publish AI-generated websites", href: "/products/website-builder" },
  { icon: Search, title: "SEO Agent", desc: "Set up and manage autonomous SEO campaigns", href: "/products/seo-agent" },
  { icon: Video, title: "Video Creator", desc: "Generate videos for social media platforms", href: "/products/video-creator" },
  { icon: Server, title: "Domains & DNS", desc: "Domain registration, DNS records, transfers", href: "/domains" },
  { icon: Code2, title: "API & Developer Tools", desc: "REST API, SDKs, CLI, and integrations", href: "/developers" },
  { icon: BookOpen, title: "Marketplace", desc: "Browse and install add-ons and templates", href: "/marketplace" },
];

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Support request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.content += data.content;
                }
                return [...updated];
              });
            } else if (data.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.content = "Sorry, I ran into an issue. Please try again or email support@zoobicon.com for help.";
                }
                return [...updated];
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          last.content = "I'm having trouble connecting right now. Please try again in a moment, or reach out to support@zoobicon.com.";
        }
        return [...updated];
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] -top-[100px] left-[30%] opacity-8" />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-[30%] right-[10%] opacity-8" />
        <div className="grid-pattern fixed inset-0" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/20">/</span>
            <span className="text-sm text-white/50">Support</span>
          </div>
          <div className="flex items-center gap-3">
            {hasMessages && (
              <button
                onClick={resetChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 border border-white/[0.06] hover:border-white/10 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New chat
              </button>
            )}
            <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Start Building</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 pt-16 flex flex-col">
        {!hasMessages ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-3xl mx-auto px-6 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-brand-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                  How can we help?
                </h1>
                <p className="text-base text-white/40 max-w-lg mx-auto">
                  Ask anything about Zoobicon — our products, features, billing, DNS,
                  or how to get the most out of the platform.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Shield className="w-3.5 h-3.5 text-white/20" />
                  <span className="text-xs text-white/20">Scoped to Zoobicon support only</span>
                </div>
              </motion.div>

              {/* Quick topics */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8"
              >
                {QUICK_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(topic.label)}
                    className="group gradient-border p-4 rounded-xl text-left card-hover"
                  >
                    <topic.icon className="w-5 h-5 text-white/30 mb-2 group-hover:text-brand-400 transition-colors" />
                    <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors leading-tight">
                      {topic.label}
                    </div>
                    <div className="text-[10px] text-white/20 mt-1">{topic.category}</div>
                  </button>
                ))}
              </motion.div>

              {/* Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <div className="relative">
                  <div className="flex items-end bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-brand-500/30 transition-colors">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about Zoobicon..."
                      rows={1}
                      className="flex-1 bg-transparent px-5 py-4 text-white placeholder:text-white/25 outline-none text-base resize-none max-h-32"
                      style={{ minHeight: "56px" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className="p-3 mr-2 mb-1.5 rounded-xl text-white/30 hover:text-white disabled:opacity-20 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Help categories */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12"
              >
                <div className="text-xs text-white/20 uppercase tracking-wider font-medium mb-4 text-center">
                  Or browse help topics
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {HELP_CATEGORIES.map((cat, i) => (
                    <Link
                      key={i}
                      href={cat.href}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
                    >
                      <cat.icon className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors truncate">{cat.title}</div>
                        <div className="text-[10px] text-white/20 truncate">{cat.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-purple/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-brand-400" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-brand-500/20 border border-brand-500/20 text-white"
                            : "bg-white/[0.04] border border-white/[0.06] text-white/80"
                        }`}
                      >
                        {msg.content ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="flex items-center gap-2 text-white/30">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <div className="border-t border-white/[0.04] bg-[#050507]/80 backdrop-blur-xl">
              <div className="max-w-3xl mx-auto px-6 py-4">
                <div className="flex items-end bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-brand-500/30 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isStreaming ? "Waiting for response..." : "Ask about Zoobicon..."}
                    disabled={isStreaming}
                    rows={1}
                    className="flex-1 bg-transparent px-5 py-3.5 text-white placeholder:text-white/25 outline-none text-sm resize-none max-h-32 disabled:opacity-50"
                    style={{ minHeight: "48px" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isStreaming}
                    className="p-3 mr-1 mb-0.5 rounded-xl text-white/30 hover:text-white disabled:opacity-20 transition-all"
                  >
                    {isStreaming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/15">
                    <Shield className="w-3 h-3" />
                    Zoobicon support only — won&apos;t answer off-topic questions
                  </div>
                  <div className="text-[10px] text-white/15">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
