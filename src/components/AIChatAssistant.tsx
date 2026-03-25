"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const KNOWLEDGE_BASE: { patterns: string[]; answer: string }[] = [
  {
    patterns: ["how to build", "create website", "get started", "make a website", "start building", "begin", "new site"],
    answer: "Just describe your website in the prompt box and click 'Build'! Try something like 'A modern portfolio site for a photographer in London'. The AI will generate a complete website in about 60 seconds.",
  },
  {
    patterns: ["pricing", "how much", "cost", "free", "plan", "subscription", "price"],
    answer: "We have a free tier (1 build/month), Creator ($19/mo, 15 builds), Pro ($49/mo, 50 builds), and Agency ($99/mo, 200 builds). All paid plans use our most powerful AI model for the best quality output.",
  },
  {
    patterns: ["edit", "change", "modify", "update", "customize", "tweak"],
    answer: "After building your site, use the chat panel on the left to describe changes like 'Make the hero section blue' or 'Add a contact form'. You can also use the visual editor to click and edit elements directly.",
  },
  {
    patterns: ["deploy", "publish", "host", "live", "online", "launch", "go live"],
    answer: "Click 'Deploy' after building to publish your site to zoobicon.sh. You'll get a free URL like yoursite.zoobicon.sh. Paid plans support custom domains.",
  },
  {
    patterns: ["template", "example", "inspiration", "starter", "browse"],
    answer: "We have 100+ templates across 13 categories! Click 'Browse Templates' in the builder to see them. You can also check /generators for our 43 specialized website generators.",
  },
  {
    patterns: ["video", "video creator", "video maker"],
    answer: "Our AI Video Creator lets you generate marketing videos with AI! Go to /video-creator to create scripts, storyboards, scene images, voiceovers, and subtitles.",
  },
  {
    patterns: ["agency", "white label", "client", "bulk"],
    answer: "Our Agency plan ($99/mo) includes white-label branding, client portal, bulk generation, approval workflows, and quota tracking. Perfect for agencies building sites for clients. Visit /agencies to learn more.",
  },
  {
    patterns: ["api", "developer", "programmatic", "integrate", "rest api"],
    answer: "We have a full REST API! Visit /developers for documentation. You can generate and deploy sites programmatically using API keys. Rate limits: Free 10 req/min, Pro 60/min, Enterprise 600/min.",
  },
  {
    patterns: ["refund", "cancel", "money back"],
    answer: "We offer a 14-day money-back guarantee on all paid plans. Email support@zoobicon.com to request a refund. You can cancel anytime from your account settings.",
  },
  {
    patterns: ["support", "help", "contact", "problem", "error", "bug", "issue", "broken"],
    answer: "For support, email support@zoobicon.com or visit /support. For urgent issues, our AI support agent typically responds within minutes. You can also describe your issue here and I'll try to help!",
  },
  {
    patterns: ["seo", "search engine", "google", "ranking", "optimize"],
    answer: "Every site we generate includes SEO best practices: meta tags, heading hierarchy, alt text, and structured data. Our AI SEO Agent can analyze and optimize your site further. Visit /seo for the SEO dashboard.",
  },
  {
    patterns: ["ecommerce", "e-commerce", "shop", "store", "products", "cart", "checkout"],
    answer: "Yes! Our E-Commerce generator creates complete storefronts with shopping cart, checkout, product grid, search, filters, reviews, and more. Try it in the builder by selecting the E-Commerce generator.",
  },
  {
    patterns: ["domain", "custom domain", "url", "web address"],
    answer: "Free sites get a zoobicon.sh subdomain. Paid plans support custom domains — visit /domains to search and register a domain, or connect one you already own.",
  },
  {
    patterns: ["export", "download", "zip", "html", "react", "wordpress"],
    answer: "You can export your site as a standalone HTML file, a ZIP archive, a React project, or a WordPress theme. Use the Export panel in the builder sidebar after generating your site.",
  },
  {
    patterns: ["multi-page", "multiple pages", "multipage", "several pages"],
    answer: "Our Multi-Page generator creates 3-6 page sites with consistent design, shared navigation, and matching styles across all pages. Select 'Multi-Page' in the builder to try it.",
  },
  {
    patterns: ["full-stack", "fullstack", "database", "backend", "app", "application", "crud"],
    answer: "Our Full-Stack generator creates complete applications with a database schema, API routes, and a frontend with forms, tables, and modals — all from a single prompt. Select 'Full-Stack' in the builder.",
  },
  {
    patterns: ["how long", "time", "speed", "fast", "slow", "minutes", "seconds"],
    answer: "A typical single-page website generates in about 60-95 seconds. Quick builds take about 15-20 seconds. Multi-page and full-stack builds may take up to 2 minutes. We're constantly working to make it faster!",
  },
  {
    patterns: ["mobile", "responsive", "phone", "tablet", "iphone", "android"],
    answer: "Every site we generate is fully responsive — it looks great on desktop, tablet, and mobile. You can preview all viewports in the builder using the device toggle buttons.",
  },
  {
    patterns: ["login", "sign in", "account", "signup", "register"],
    answer: "Click 'Sign In' in the top navigation or visit /auth/login. You can sign up with email, Google, or GitHub. Your builds and deployed sites are saved to your account.",
  },
  {
    patterns: ["what is zoobicon", "about zoobicon", "what does zoobicon do", "who are you"],
    answer: "Zoobicon is an AI website builder platform. You describe what you want in plain English, and our 7-agent AI pipeline builds a complete, production-ready website in about 60 seconds. No coding required!",
  },
];

function findBestAnswer(input: string): string {
  const lower = input.toLowerCase().trim();

  // Score each knowledge base entry by how many patterns match
  let bestScore = 0;
  let bestAnswer = "";

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern)) {
        // Longer pattern matches are more specific, so weight them higher
        score += pattern.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }

  if (bestScore > 0) return bestAnswer;

  return "I'm not sure about that. Try asking about building websites, pricing, templates, deployment, or editing. For complex questions, email support@zoobicon.com.";
}

export default function AIChatAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm the Zoobicon assistant. Ask me anything about building websites, pricing, deployment, or features.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't render on admin pages
  if (pathname?.startsWith("/admin")) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation finish
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const answer = findBestAnswer(trimmed);

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-indigo-500/40"
        style={{
          animation: isOpen ? "none" : "chat-pulse 3s ease-in-out infinite",
        }}
        aria-label={isOpen ? "Close chat" : "Open chat assistant"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl shadow-black/50 transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          width: "min(340px, calc(100vw - 48px))",
          height: "min(480px, calc(100vh - 140px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Zoobicon Assistant</p>
            <p className="text-xs text-white/50">Ask me anything</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "thin" }}>
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-indigo-500/20"
                      : "bg-purple-500/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3 w-3 text-indigo-400" />
                  ) : (
                    <Bot className="h-3 w-3 text-purple-400" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-white/80"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-white/20">Powered by Zoobicon AI</p>
        </div>
      </div>

    </>
  );
}
