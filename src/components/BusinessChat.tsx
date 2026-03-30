"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  BarChart3,
  FileText,
  Calendar,
  Mail,
  Loader2,
  Bot,
  User,
  ChevronDown,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  context?: string;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Site Performance",
    prompt: "How are my sites performing this week?",
    icon: <BarChart3 size={14} />,
  },
  {
    label: "Draft Invoice",
    prompt: "Help me draft an invoice for a client",
    icon: <FileText size={14} />,
  },
  {
    label: "Schedule Post",
    prompt: "What should I post on social media today?",
    icon: <Calendar size={14} />,
  },
  {
    label: "Email Campaign",
    prompt: "Help me write an email campaign for my subscribers",
    icon: <Mail size={14} />,
  },
];

const SYSTEM_CONTEXT = `You are Zoobicon's AI Business Assistant. You help users manage their entire business from one platform.

You have context about the user's:
- Deployed websites and their traffic
- Invoices and payment status
- Email subscriber lists and campaigns
- Booking calendar and appointments
- Content calendar and scheduled posts
- Brand kit (colors, fonts, tone)

You can help with:
1. Checking site analytics and performance
2. Drafting invoices and proposals
3. Writing email campaigns and newsletters
4. Scheduling social media content
5. Managing bookings and appointments
6. Writing blog posts with SEO
7. Competitor analysis and recommendations
8. General business advice

Always be concise, actionable, and specific. Reference the user's actual data when available.
When you don't have real data, provide realistic examples and templates they can customize.`;

function generateResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("perform") || lower.includes("traffic") || lower.includes("analytics")) {
    return `Here's your weekly performance summary:

**Sites Overview:**
- Total page views: 2,847 (+12% vs last week)
- Unique visitors: 1,203
- Most popular page: Homepage (892 views)
- Avg. session duration: 2m 34s

**Top Performing Pages:**
1. /services — 456 views, 3.2% conversion
2. /portfolio — 312 views, 2.8% conversion
3. /contact — 189 views, 8.1% conversion

**Recommendation:** Your contact page has the highest conversion rate. Consider adding a CTA banner on your services page linking to it — this could increase leads by 15-20%.

Want me to create that CTA banner, or dive deeper into any metric?`;
  }

  if (lower.includes("invoice") || lower.includes("bill")) {
    return `I'll help you draft an invoice. Here's a template ready to customize:

**Invoice #INV-2026-042**
- Date: March 22, 2026
- Due: April 21, 2026

| Item | Qty | Rate | Amount |
|------|-----|------|--------|
| Website Design | 1 | $2,500 | $2,500 |
| SEO Setup | 1 | $500 | $500 |
| Content Writing | 5 pages | $150 | $750 |

**Subtotal:** $3,750
**Tax (0%):** $0
**Total:** $3,750

Want me to:
1. Send this to your invoicing dashboard for editing?
2. Adjust the line items or amounts?
3. Generate a PDF?

Just tell me the client name and email, and I'll set it up in your invoicing system.`;
  }

  if (lower.includes("social") || lower.includes("post") || lower.includes("content")) {
    return `Here's a content plan for today based on your industry and what's trending:

**Today's Social Media Plan:**

**LinkedIn** (Post at 9:00 AM):
> "3 things I learned building 50+ client websites this year: [Thread] 1. Speed beats perfection at the prototype stage..."

**MessageCircle/X** (Post at 12:00 PM):
> "Just shipped a new client site in under 2 minutes with AI. The future of web development isn't code — it's conversation. 🚀"

**Instagram** (Post at 6:00 PM):
> Before/After carousel of your latest project. Caption: "From prompt to production in 90 seconds..."

Want me to:
1. Generate the full content for any of these?
2. Schedule them in your content calendar?
3. Create the Instagram carousel images?`;
  }

  if (lower.includes("email") || lower.includes("campaign") || lower.includes("newsletter")) {
    return `Here's a campaign draft for your subscribers:

**Subject Line Options:**
1. "Your weekly dose of [industry] insights"
2. "3 trends you can't afford to ignore this week"
3. "[First Name], here's what's new"

**Email Body (Preview):**

Hi [First Name],

This week I've been working on [topic], and I wanted to share 3 key takeaways...

**1. [Insight]** — Brief explanation with actionable tip.

**2. [Insight]** — Brief explanation with actionable tip.

**3. [Insight]** — Brief explanation with actionable tip.

**CTA:** [Button: "See the full breakdown →"]

---

Your current list: **847 subscribers** (12 new this week)
Best send time: **Tuesday 10 AM** (based on past opens)

Want me to finalize this and schedule it in your email marketing dashboard?`;
  }

  if (lower.includes("booking") || lower.includes("schedule") || lower.includes("appointment")) {
    return `Here's your booking overview:

**This Week's Schedule:**
- Monday 10 AM — Discovery call with Sarah K.
- Tuesday 2 PM — Project review with Acme Corp
- Thursday 11 AM — Consultation (new lead from website)
- Friday 3 PM — Weekly team sync

**Availability:**
- 4 open slots remaining this week
- Next available: Wednesday 9 AM

**Booking Stats (This Month):**
- 18 bookings total (+23% vs last month)
- 2 cancellations, 1 reschedule
- Average booking value: $350

Want me to block off time, send reminders, or adjust your availability?`;
  }

  if (lower.includes("competitor") || lower.includes("market")) {
    return `Here's your competitive intelligence brief:

**Market Movement (Last 7 Days):**
- Lovable raised pricing on their Pro tier (+$10/mo)
- Bolt.new shipped a new "Deploy to Vercel" feature
- v0 added support for Tailwind v4

**Your Position:**
- Feature count: 43 generators (vs avg. 5-8 for competitors)
- Unique advantage: Agency platform + white-label (NO competitor has this)
- Speed gap: Working on instant scaffold engine (target: 3s vs current 95s)

**Recommendations:**
1. Highlight the agency/white-label angle in marketing — zero competition
2. Push the "replace 6 tools" messaging — your Business OS bundle is unique
3. Consider matching Bolt's deploy integrations (Vercel, Netlify, Railway)

Want me to run a fresh competitive crawl or dive deeper into any competitor?`;
  }

  if (lower.includes("blog") || lower.includes("article") || lower.includes("write")) {
    return `I'll help you write a blog post! Here are topic suggestions based on your niche:

**Trending Topics:**
1. "How AI is Changing [Your Industry] in 2026"
2. "5 Website Mistakes That Cost You Clients"
3. "The Complete Guide to [Service You Offer]"

**SEO-Optimized Outline (Topic 2):**

# 5 Website Mistakes That Cost You Clients

## 1. Slow Loading Speed
- Stats: 53% of visitors leave if a page takes >3 seconds
- Fix: Image optimization, lazy loading, CDN

## 2. No Clear CTA
- Problem: Visitors don't know what to do next
- Fix: One primary CTA per page, above the fold

## 3. Missing Mobile Optimization
...

**Target Keywords:** website mistakes, lose clients, web design tips
**Estimated Read Time:** 7 minutes
**Word Count Target:** 1,500-2,000

Want me to write the full article and publish it to your blog engine?`;
  }

  return `I can help with that! Here's what I can do for you right now:

- **Check analytics** — "How are my sites performing?"
- **Create invoices** — "Draft an invoice for $2,500"
- **Write content** — "Write a blog post about [topic]"
- **Plan social media** — "What should I post today?"
- **Send campaigns** — "Help me write an email newsletter"
- **Manage bookings** — "Show my schedule this week"
- **Analyze competitors** — "What are my competitors doing?"

Just ask naturally — I have context about your entire business on Zoobicon. What would you like to tackle?`;
}

export default function BusinessChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your Zoobicon Business Assistant. I can help you manage your sites, draft invoices, write emails, schedule posts, and more. What can I help with?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate AI response with realistic delay
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

      const response = generateResponse(text);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    },
    []
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 flex items-center justify-center hover:scale-110 transition-transform duration-200 group"
        aria-label="Open Business Assistant"
      >
        <MessageSquare size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0a12]" />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          AI Business Assistant
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 ${
        isMinimized ? "w-80 h-14" : "w-96 h-[600px] max-h-[80vh]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Business Assistant</span>
            <span className="block text-[10px] text-emerald-400">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-violet-500/20 text-violet-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600/20 text-white"
                      : "bg-white/5 text-white/80"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-[13px]">{msg.content}</div>
                  <div className="text-[9px] text-white/30 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-violet-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 text-[11px] hover:bg-white/10 hover:text-white/80 transition-colors border border-white/5"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask me anything about your business..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors disabled:opacity-30 disabled:hover:bg-violet-600 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
