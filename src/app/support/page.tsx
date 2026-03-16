"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
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
  Clock,
  Crown,
  AlertTriangle,
  Timer,
  X,
} from "lucide-react";
import SupportAvatar from "@/components/SupportAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UsageData {
  plan: string;
  hasLiveAgent: boolean;
  minutesUsed: number;
  minutesRemaining: number;
  monthlyLimit: number;
  sessionsCount: number;
  sessionMaxMinutes: number;
  messageCooldownSecs: number;
  canStartSession: boolean;
  sessionBlockReason: string | null;
  activeSession: {
    sessionId: string;
    elapsedMinutes: number;
    messagesCount: number;
    remainingMinutes: number;
  } | null;
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLiveAgent, setIsLiveAgent] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserEmail(parsed.email);
        setUserPlan(parsed.plan || "free");
      }
    } catch {}
  }, []);

  // Fetch usage when user is loaded
  const fetchUsage = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/support/usage?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
        if (data.activeSession) {
          setSessionId(data.activeSession.sessionId);
          setIsLiveAgent(true);
          setSessionElapsed(data.activeSession.elapsedMinutes);
        }
      }
    } catch {}
  }, [userEmail]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Session timer — tick every second when live agent is active
  useEffect(() => {
    if (isLiveAgent && sessionId && usage) {
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed((prev) => {
          const next = prev + 1 / 60;
          const remaining = usage.sessionMaxMinutes - next;
          // Warning at 2 minutes remaining
          if (remaining <= 2 && remaining > 0) {
            setSessionWarning(
              `${Math.ceil(remaining)} minute${Math.ceil(remaining) !== 1 ? "s" : ""} remaining in this session`
            );
          }
          // Auto-end at 0
          if (remaining <= 0) {
            endLiveSession();
            return next;
          }
          return next;
        });
      }, 1000);

      return () => {
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      };
    }
  }, [isLiveAgent, sessionId, usage]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining((c) => Math.max(0, c - 1));
      }, 1000);
      return () => {
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      };
    }
  }, [cooldownRemaining]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startLiveSession = async () => {
    if (!userEmail) {
      // Not logged in
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const res = await fetch("/api/support/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, action: "start" }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setSessionWarning(data.error);
        setShowUpgradePrompt(true);
        return;
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setIsLiveAgent(true);
      setSessionElapsed(data.resumed ? (data.elapsedMinutes || 0) : 0);
      setSessionWarning(null);
      await fetchUsage();
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const endLiveSession = async () => {
    if (sessionId && userEmail) {
      try {
        await fetch("/api/support/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, action: "end", sessionId }),
        });
      } catch {}
    }
    setSessionId(null);
    setIsLiveAgent(false);
    setSessionElapsed(0);
    setSessionWarning(null);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    await fetchUsage();
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming || cooldownRemaining > 0) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    // Start cooldown for live agent
    if (isLiveAgent && usage) {
      setCooldownRemaining(usage.messageCooldownSecs);
    }

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          sessionId: isLiveAgent ? sessionId : undefined,
          userEmail: isLiveAgent ? userEmail : undefined,
          tier: isLiveAgent ? "live" : "free",
        }),
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
            } else if (data.type === "usage") {
              // Update usage from server
              if (data.sessionExpired) {
                setSessionWarning("Session time limit reached. You can start a new session.");
                setIsLiveAgent(false);
                setSessionId(null);
              }
              if (data.minutesRemaining !== undefined) {
                setUsage((prev) =>
                  prev ? { ...prev, minutesRemaining: data.minutesRemaining } : prev
                );
              }
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
    setSessionWarning(null);
    inputRef.current?.focus();
  };

  const hasMessages = messages.length > 0;
  const sessionRemainingMin = usage ? usage.sessionMaxMinutes - sessionElapsed : 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/40">/</span>
            <span className="text-sm text-white/65">Support</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Agent Toggle */}
            {userEmail && usage?.hasLiveAgent && (
              <div className="flex items-center gap-2">
                {isLiveAgent ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs text-emerald-300 font-medium">Live Agent</span>
                      <span className="text-[10px] text-emerald-400/60 ml-1">
                        {Math.max(0, Math.ceil(sessionRemainingMin))}m left
                      </span>
                    </div>
                    <button
                      onClick={endLiveSession}
                      className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
                    >
                      End session
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startLiveSession}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    Start Live Agent
                    {usage.minutesRemaining > 0 && (
                      <span className="text-[10px] text-emerald-400/60">
                        ({Math.round(usage.minutesRemaining)}m left)
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {hasMessages && (
              <button
                onClick={resetChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/60 border border-white/[0.10] hover:border-white/10 transition-all"
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
      <CursorGlowTracker />

      {/* Session Warning Banner */}
      <AnimatePresence>
        {sessionWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 bg-amber-500/10 border-b border-amber-500/20"
          >
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {sessionWarning}
              </div>
              <button
                onClick={() => setSessionWarning(null)}
                className="text-amber-400/60 hover:text-amber-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Prompt Modal */}
      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradePrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Live Agent Support</h3>
                  <p className="text-xs text-white/50">Powered by Claude AI</p>
                </div>
              </div>

              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Get real answers from a Claude Sonnet agent — not canned responses. Included with Pro, or available as a standalone add-on on any plan.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Timer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/70">
                    <strong className="text-white">Pro ($49/mo):</strong> 30 min/mo included (10 min sessions)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span className="text-white/70">
                    <strong className="text-white">Premium Support ($19/mo):</strong> 60 min/mo, 20 min sessions — any plan
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className="flex-1 btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white text-center"
                >
                  View Plans
                </Link>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="px-4 py-3 rounded-xl text-sm text-white/60 border border-white/10 hover:border-white/20 transition-all"
                >
                  Stay with Zoe
                </button>
              </div>

              <p className="text-[10px] text-white/30 text-center mt-4">
                Zoe (free tier) still answers questions — just with faster, shorter responses
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className="flex flex-col items-center mb-10"
              >
                {/* Zoe avatar */}
                <div className="mb-6">
                  <SupportAvatar isSpeaking={false} size="lg" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-center">
                  Hi, I&apos;m Zoe!
                </h1>
                <p className="text-base text-white/60 max-w-lg mx-auto text-center">
                  Your Zoobicon AI support assistant. Ask me anything about our products,
                  features, billing, DNS, or how to get the most out of the platform.
                </p>

                {/* Tier indicator */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs text-white/40">Scoped to Zoobicon support only</span>
                  </div>
                  {isLiveAgent ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-emerald-300 font-medium">Live Agent (Sonnet)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      <Bot className="w-3 h-3 text-white/40" />
                      <span className="text-[10px] text-white/40">Quick AI (Haiku)</span>
                    </div>
                  )}
                </div>

                {/* Live Agent CTA for non-live users */}
                {!isLiveAgent && userEmail && usage?.hasLiveAgent && (
                  <button
                    onClick={startLiveSession}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Switch to Live Agent for deeper support
                    <span className="text-emerald-400/60">
                      ({Math.round(usage.minutesRemaining)}m remaining)
                    </span>
                  </button>
                )}

                {!isLiveAgent && (!userEmail || !usage?.hasLiveAgent) && (
                  <button
                    onClick={() => setShowUpgradePrompt(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-white/50 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade for Live Agent support
                  </button>
                )}
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
                    <topic.icon className="w-5 h-5 text-white/50 mb-2 group-hover:text-brand-400 transition-colors" />
                    <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors leading-tight">
                      {topic.label}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{topic.category}</div>
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
                  <div className="flex items-end bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-hidden focus-within:border-brand-500/30 transition-colors">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isLiveAgent ? "Ask the live agent..." : "Ask Zoe about Zoobicon..."}
                      rows={1}
                      className="flex-1 bg-transparent px-5 py-4 text-white placeholder:text-white/45 outline-none text-base resize-none max-h-32"
                      style={{ minHeight: "56px" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || cooldownRemaining > 0}
                      className="p-3 mr-2 mb-1.5 rounded-xl text-white/50 hover:text-white disabled:opacity-20 transition-all"
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
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-4 text-center">
                  Or browse help topics
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {HELP_CATEGORIES.map((cat, i) => (
                    <Link
                      key={i}
                      href={cat.href}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
                    >
                      <cat.icon className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white/65 group-hover:text-white/70 transition-colors truncate">{cat.title}</div>
                        <div className="text-[10px] text-white/40 truncate">{cat.desc}</div>
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
                        <div className="flex-shrink-0 mt-0.5">
                          <SupportAvatar
                            isSpeaking={isStreaming && i === messages.length - 1}
                            size="sm"
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-brand-500/20 border border-brand-500/20 text-white"
                            : isLiveAgent
                            ? "bg-emerald-500/[0.07] border border-emerald-500/[0.15] text-white/80"
                            : "bg-white/[0.07] border border-white/[0.10] text-white/80"
                        }`}
                      >
                        {msg.content ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="flex items-center gap-2 text-white/50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">
                              {isLiveAgent ? "Agent is thinking..." : "Zoe is typing..."}
                            </span>
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.09] border border-white/[0.12] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-white/60" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <div className="border-t border-white/[0.08] bg-[#050508]/80 backdrop-blur-xl">
              <div className="max-w-3xl mx-auto px-6 py-4">
                <div className={`flex items-end rounded-2xl overflow-hidden transition-colors ${
                  isLiveAgent
                    ? "bg-emerald-500/[0.05] border border-emerald-500/[0.15] focus-within:border-emerald-500/30"
                    : "bg-white/[0.07] border border-white/[0.12] focus-within:border-brand-500/30"
                }`}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      cooldownRemaining > 0
                        ? `Wait ${cooldownRemaining}s...`
                        : isStreaming
                        ? "Waiting for response..."
                        : isLiveAgent
                        ? "Ask the live agent..."
                        : "Ask Zoe about Zoobicon..."
                    }
                    disabled={isStreaming || cooldownRemaining > 0}
                    rows={1}
                    className="flex-1 bg-transparent px-5 py-3.5 text-white placeholder:text-white/45 outline-none text-sm resize-none max-h-32 disabled:opacity-50"
                    style={{ minHeight: "48px" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isStreaming || cooldownRemaining > 0}
                    className="p-3 mr-1 mb-0.5 rounded-xl text-white/50 hover:text-white disabled:opacity-20 transition-all"
                  >
                    {isStreaming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : cooldownRemaining > 0 ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                      <Shield className="w-3 h-3" />
                      Zoobicon support only
                    </div>
                    {isLiveAgent && usage && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/50">
                        <Timer className="w-3 h-3" />
                        Session: {Math.max(0, Math.ceil(sessionRemainingMin))}m remaining
                        &bull; Month: {Math.round(usage.minutesRemaining)}m left
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-white/35">
                    {isLiveAgent ? (
                      <span className="text-emerald-400/40">Live Agent &bull; Claude Sonnet</span>
                    ) : (
                      "Quick AI &bull; Claude Haiku"
                    )}
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
