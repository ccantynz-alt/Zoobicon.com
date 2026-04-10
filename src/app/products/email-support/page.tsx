"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Mail,
  ArrowRight,
  Bot,
  Inbox,
  Clock,
  BarChart3,
  Brain,
  Globe,
  Shield,
  Users,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Check,
  BookOpen,
  Tag,
  Workflow,
  Send,
  Search,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Auto-Reply", desc: "AI reads, understands, and drafts perfect replies to every customer email. Human review optional." },
  { icon: Inbox, title: "Smart Inbox", desc: "Unified inbox for all channels — email, chat, forms. Auto-categorized by topic, urgency, and sentiment." },
  { icon: Smile, title: "Sentiment Analysis", desc: "Real-time mood detection. Route angry customers to humans, let AI handle the happy ones." },
  { icon: BookOpen, title: "Knowledge Base AI", desc: "Train the AI on your docs, FAQs, and product info. It answers like your best support agent." },
  { icon: Tag, title: "Auto-Tagging", desc: "Automatically tags, categorizes, and prioritizes every ticket. Bug report? Billing issue? Sorted instantly." },
  { icon: Workflow, title: "Escalation Workflows", desc: "Custom rules: if sentiment < 3, escalate to human. If VIP customer, priority queue. Fully configurable." },
  { icon: Clock, title: "24/7 Response", desc: "AI never sleeps. Customers get instant replies at 3am on a Sunday. Average response: under 30 seconds." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "CSAT scores, resolution times, common issues, agent performance — all tracked in real-time." },
  { icon: Globe, title: "Multi-Language", desc: "AI responds in 30+ languages. Auto-detects customer language and replies natively." },
  { icon: Shield, title: "GDPR Compliant", desc: "Data encryption, auto-deletion policies, consent management. Built for EU compliance from day one." },
  { icon: Users, title: "Team Collaboration", desc: "Internal notes, @mentions, ticket assignments, collision detection. Your team works as one." },
  { icon: Send, title: "Outbound Campaigns", desc: "Proactive support emails, onboarding sequences, and NPS surveys — all AI-powered." },
];

const STATS = [
  { value: "<30s", label: "Avg response time" },
  { value: "94%", label: "Auto-resolution rate" },
  { value: "30+", label: "Languages" },
  { value: "24/7", label: "Always on" },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For solo founders just getting started.",
    features: ["100 tickets/mo", "1 mailbox", "AI auto-reply", "Sentiment analysis", "Community support"],
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/mo",
    description: "For growing teams handling real volume.",
    features: ["2,500 tickets/mo", "5 mailboxes", "Knowledge base AI", "Auto-tagging", "Analytics dashboard", "Email support"],
    cta: "Start Growth trial",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$59",
    period: "/mo",
    description: "For teams that need full automation.",
    features: ["10,000 tickets/mo", "Unlimited mailboxes", "Escalation workflows", "Multi-language (30+)", "Outbound campaigns", "Priority support"],
    cta: "Start Business trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/mo",
    description: "Unlimited everything. White-glove service.",
    features: ["Unlimited tickets", "Dedicated infrastructure", "GDPR compliance", "Custom integrations", "SSO + audit logs", "24/7 phone support"],
    cta: "Contact sales",
    highlighted: false,
  },
];

const MOCK_TICKETS = [
  { id: "TK-2847", from: "sarah@startup.io", subject: "Can't export my website as React", sentiment: "frustrated", priority: "high", status: "ai-replied", time: "2m ago", aiDraft: "Hi Sarah! I understand the frustration. React export is available on Pro plans. I've applied a 7-day free trial of Pro to your account so you can export right away. Let me know if you need anything else!" },
  { id: "TK-2846", from: "james@agency.co", subject: "Bulk generation CSV format question", sentiment: "neutral", priority: "medium", status: "ai-replied", time: "5m ago", aiDraft: "Hi James! The CSV format requires 3 columns: name, prompt, template. I've attached a sample CSV file to get you started. Our docs also have a full guide at zoobicon.io/docs/bulk." },
  { id: "TK-2845", from: "lisa@design.com", subject: "Love the new video creator!", sentiment: "happy", priority: "low", status: "resolved", time: "12m ago", aiDraft: "Thank you so much Lisa! We're thrilled you're enjoying the Video Creator. If you share any videos you create, tag us — we'd love to feature them!" },
  { id: "TK-2844", from: "mike@enterprise.com", subject: "Enterprise SSO integration timeline", sentiment: "neutral", priority: "high", status: "escalated", time: "18m ago", aiDraft: "" },
  { id: "TK-2843", from: "anna@freelance.dev", subject: "CLI deploy fails with custom domain", sentiment: "frustrated", priority: "high", status: "ai-replied", time: "22m ago", aiDraft: "Hi Anna! This is usually a DNS propagation issue. Please verify your CNAME record points to deploy.zoobicon.sh. It can take up to 48 hours to propagate. Run `zb deploy --check-dns` to verify." },
];

const sentimentIcon = (s: string) => {
  if (s === "happy") return <Smile className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} />;
  if (s === "frustrated") return <Frown className="w-3.5 h-3.5 text-white/40" />;
  return <Meh className="w-3.5 h-3.5 text-white/40" />;
};

const statusBadge = (s: string) => {
  if (s === "ai-replied") return <span className="px-2 py-0.5 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[9px] font-semibold" style={{ color: "#E8D4B0" }}>AI Replied</span>;
  if (s === "resolved") return <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.05] text-white/65 text-[9px] font-semibold">Resolved</span>;
  if (s === "escalated") return <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.05] text-white/55 text-[9px] font-semibold">Escalated</span>;
  return <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.05] text-white/55 text-[9px] font-semibold">Open</span>;
};

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
const PRIMARY_CTA = {
  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
  color: "#0a0a0f",
  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
} as const;
const SERIF: React.CSSProperties = {
  fontFamily: "Fraunces, ui-serif, Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
  color: "#E8D4B0",
};

export default function EmailSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState(MOCK_TICKETS[0]);
  const [, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* Safari private mode / storage unavailable */ }
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, source: "email-support-waitlist" }),
      });
      setWaitlistStatus("success");
    } catch {
      setWaitlistStatus("error");
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon AI Email Support",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "99",
      "priceCurrency": "USD",
      "offerCount": "4"
    },
    "description": "AI-powered email support with auto-replies, smart inbox, sentiment analysis, ticketing, CSAT tracking, and 24/7 automated customer service.",
    "url": "https://zoobicon.com/products/email-support",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Email Support", "item": "https://zoobicon.com/products/email-support" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }} />
          <div className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            AI-powered support · 30+ languages · 24/7 always on
          </div>

          <h1 className="fs-display-xl mb-6">
            Customer support that{" "}
            <span style={SERIF}>never sleeps.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            AI reads every email, understands the issue, drafts the perfect reply, and resolves
            tickets — all in under 30 seconds. Your customers think they&apos;re talking to your best agent.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["AI Auto-Reply", "Smart Inbox", "Sentiment Analysis", "Knowledge Base AI", "Auto-Tagging", "Escalation Workflows"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/60"
              >
                <Check className="w-3 h-3" style={{ color: "#E8D4B0" }} />
                {pill}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/email-support"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              <LayoutDashboard className="w-4 h-4" />
              Try demo dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Mail className="w-4 h-4" />
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-2" style={{ color: "#E8D4B0" }}>
                  {stat.value}
                </div>
                <div className="text-[13px] text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Inbox Demo */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Live preview
            </div>
            <h2 className="fs-display-lg mb-4">
              See the AI{" "}
              <span style={SERIF}>at work.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Real tickets. Real responses. Real customers — handled in seconds.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] overflow-hidden" style={{ background: CARD_BG }}>
            {/* Inbox header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                  <Mail className="w-4 h-4" style={{ color: "#E8D4B0" }} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white/85">AI Support Inbox</div>
                  <div className="text-[11px] text-white/50">{MOCK_TICKETS.length} active tickets</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="w-3.5 h-3.5 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className="bg-white/[0.04] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-xs text-white/70 placeholder-white/35 w-56 outline-none focus:border-[#E8D4B0]/30 transition-colors" placeholder="Search tickets..." />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row h-auto md:h-[460px]">
              {/* Ticket list */}
              <div className="md:w-[42%] border-b md:border-b-0 md:border-r border-white/[0.08] overflow-y-auto">
                {MOCK_TICKETS.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left px-5 py-4 border-b border-white/[0.05] transition-colors ${
                      selectedTicket.id === ticket.id ? "bg-[#E8D4B0]/[0.04]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-white/45">{ticket.id}</span>
                      <div className="flex items-center gap-2">
                        {sentimentIcon(ticket.sentiment)}
                        {statusBadge(ticket.status)}
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold text-white/85 truncate mb-0.5">{ticket.subject}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50 truncate">{ticket.from}</span>
                      <span className="text-[11px] text-white/40">{ticket.time}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Ticket detail */}
              <div className="flex-1 flex flex-col">
                <div className="px-6 py-4 border-b border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[14px] font-semibold text-white/85">{selectedTicket.subject}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] px-2 py-0.5" style={{ color: "#E8D4B0" }}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50">From {selectedTicket.from} · {selectedTicket.time}</div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto min-h-[260px]">
                  {selectedTicket.aiDraft ? (
                    <div className="space-y-5">
                      {/* Customer message */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white/65">
                          {selectedTicket.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="border border-white/[0.08] bg-white/[0.03] rounded-2xl px-4 py-3 text-[13px] text-white/70 max-w-[85%] leading-relaxed">
                          {selectedTicket.subject}
                        </div>
                      </div>

                      {/* AI Reply */}
                      <div className="flex gap-3 justify-end">
                        <div className="border border-[#E8D4B0]/20 rounded-2xl px-4 py-3 text-[13px] text-white/75 max-w-[85%] leading-relaxed" style={{ background: "rgba(232,212,176,0.04)" }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3 h-3" style={{ color: "#E8D4B0" }} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#E8D4B0" }}>AI Draft</span>
                          </div>
                          {selectedTicket.aiDraft}
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4" style={{ color: "#E8D4B0" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px] text-white/45">
                      Escalated to human agent — awaiting response
                    </div>
                  )}
                </div>

                {/* Reply bar */}
                <div className="px-5 py-4 border-t border-white/[0.08] flex items-center gap-2">
                  <input className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2.5 text-[13px] text-white placeholder-white/35 outline-none focus:border-[#E8D4B0]/30 transition-colors" placeholder="Add a reply or note..." />
                  <button onClick={() => {}} className="inline-flex items-center justify-center h-10 w-10 rounded-full transition-all duration-500 hover:-translate-y-0.5" style={PRIMARY_CTA}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Capabilities
            </div>
            <h2 className="fs-display-lg mb-4">
              Every feature your{" "}
              <span style={SERIF}>support team needs.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From first reply to final resolution. Built for teams who want their evenings back.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.highlighted ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: tier.highlighted
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {tier.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a0a0f" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{tier.price}</span>
                  {tier.period && <span className="text-[13px] text-white/50">{tier.period}</span>}
                </div>
                <p className="text-[13px] text-white/55 mb-6">{tier.description}</p>
                <ul className="space-y-2.5 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.price === "Free" ? "/auth/signup" : "/auth/signup"}
                  className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                    tier.highlighted ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  }`}
                  style={tier.highlighted ? PRIMARY_CTA : undefined}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA + waitlist */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="fs-display-lg mb-5">
            Resolve 94% of tickets{" "}
            <span style={SERIF}>automatically.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            AI-powered email support that never sleeps. Try the demo, or join the early access list.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              href="/email-support"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              <LayoutDashboard className="w-4 h-4" />
              Try demo dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="max-w-lg mx-auto">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.05] px-6 py-4">
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                <span className="text-[13px] font-medium" style={{ color: "#E8D4B0" }}>
                  You&apos;re on the list. We&apos;ll be in touch.
                </span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 w-full bg-white/[0.04] border border-white/[0.10] rounded-full px-5 py-3.5 text-[14px] text-white placeholder:text-white/45 outline-none focus:border-[#E8D4B0]/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap"
                  style={PRIMARY_CTA}
                >
                  {waitlistStatus === "loading" ? "Joining..." : "Join waitlist"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            )}
            {waitlistStatus === "error" && (
              <p className="mt-3 text-[12px] text-white/55">
                Something went wrong — please try again or email hello@zoobicon.com directly.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Free starter tier</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
