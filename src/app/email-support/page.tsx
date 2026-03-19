"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Mail,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldOff,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Sparkles,
  Send,
  ChevronDown,
  Tag,
  UserCircle,
  BarChart3,
  Bot,
  Zap,
  X,
  Loader2,
  LayoutDashboard,
  LogOut,
  Hammer,
  ArrowLeft,
  MoreHorizontal,
  Flag,
  Trash2,
  UserPlus,
  CircleDot,
  Lock,
  MessageSquare,
  GitMerge,
  ChevronRight,
  Timer,
  Users,
  CreditCard,
  Crown,
  Wand2,
  PenTool,
  Check,
  RotateCcw,
} from "lucide-react";

// ---------- Types ----------
interface TicketMessage {
  id: string;
  from: "customer" | "agent" | "ai" | "internal";
  body: string;
  timestamp: string;
}

interface Ticket {
  id: string;
  subject: string;
  body: string;
  from: string;
  customerName: string;
  status: "open" | "pending" | "resolved" | "spam";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  tags: string[];
  sla?: {
    responseDeadline: string;
    resolutionDeadline: string;
    breached: boolean;
  };
}

type Folder = "all" | "open" | "pending" | "resolved" | "spam";

// ---------- Demo Data ----------
const DEMO_TICKETS: Ticket[] = [
  {
    id: "TK-3001",
    subject: "Can't export my website as React project",
    body: "Hi, I've been trying to export my generated website as a React project but the button seems to do nothing. I'm on the Pro plan. Can you help?",
    from: "sarah@startup.io",
    customerName: "Sarah Chen",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-15T09:23:00Z",
    updatedAt: "2026-03-15T09:23:00Z",
    messages: [
      { id: "m1", from: "customer", body: "Hi, I've been trying to export my generated website as a React project but the button seems to do nothing. I'm on the Pro plan. Can you help?", timestamp: "2026-03-15T09:23:00Z" },
    ],
    tags: ["export", "react", "bug"],
  },
  {
    id: "TK-3002",
    subject: "Bulk generation CSV format question",
    body: "What columns does the CSV need for bulk generation? I want to create 50 client sites at once for my agency.",
    from: "james@agency.co",
    customerName: "James Rodriguez",
    status: "pending",
    priority: "medium",
    assignee: "Support Team",
    createdAt: "2026-03-15T08:45:00Z",
    updatedAt: "2026-03-15T09:10:00Z",
    messages: [
      { id: "m2", from: "customer", body: "What columns does the CSV need for bulk generation? I want to create 50 client sites at once for my agency.", timestamp: "2026-03-15T08:45:00Z" },
      { id: "m3", from: "ai", body: "Hi James! The CSV format requires 3 columns: name, prompt, and template. I've attached a sample CSV. Our docs at zoobicon.com/docs/bulk have the full specification.", timestamp: "2026-03-15T08:46:00Z" },
    ],
    tags: ["agency", "bulk", "csv"],
  },
  {
    id: "TK-3003",
    subject: "Love the new multi-page feature!",
    body: "Just wanted to say the multi-page site generation is incredible. Generated a 5-page portfolio site in under 2 minutes. Amazing work!",
    from: "lisa@design.com",
    customerName: "Lisa Park",
    status: "resolved",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-15T07:12:00Z",
    updatedAt: "2026-03-15T07:15:00Z",
    messages: [
      { id: "m4", from: "customer", body: "Just wanted to say the multi-page site generation is incredible. Generated a 5-page portfolio site in under 2 minutes. Amazing work!", timestamp: "2026-03-15T07:12:00Z" },
      { id: "m5", from: "ai", body: "Thank you so much, Lisa! We're thrilled you're enjoying the multi-page feature. If you'd like to share your portfolio, we'd love to feature it in our showcase!", timestamp: "2026-03-15T07:13:00Z" },
    ],
    tags: ["feedback", "positive"],
  },
  {
    id: "TK-3004",
    subject: "Enterprise SSO integration timeline",
    body: "We're evaluating Zoobicon for our 200-person team. When will SAML SSO be available? This is a hard requirement for us.",
    from: "mike@enterprise.com",
    customerName: "Mike Thompson",
    status: "open",
    priority: "urgent",
    assignee: "Sales Team",
    createdAt: "2026-03-15T06:30:00Z",
    updatedAt: "2026-03-15T06:30:00Z",
    messages: [
      { id: "m6", from: "customer", body: "We're evaluating Zoobicon for our 200-person team. When will SAML SSO be available? This is a hard requirement for us.", timestamp: "2026-03-15T06:30:00Z" },
    ],
    tags: ["enterprise", "sso", "sales"],
  },
  {
    id: "TK-3005",
    subject: "CLI deploy fails with custom domain",
    body: "Running `zb deploy --domain mysite.com` gives error: DNS_PROBE_FAILED. I've set up the CNAME record as documented. It's been 72 hours.",
    from: "anna@freelance.dev",
    customerName: "Anna Kowalski",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-14T22:15:00Z",
    updatedAt: "2026-03-14T22:15:00Z",
    messages: [
      { id: "m7", from: "customer", body: "Running `zb deploy --domain mysite.com` gives error: DNS_PROBE_FAILED. I've set up the CNAME record as documented. It's been 72 hours.", timestamp: "2026-03-14T22:15:00Z" },
    ],
    tags: ["cli", "deploy", "dns", "bug"],
  },
  {
    id: "TK-3006",
    subject: "Billing discrepancy on my last invoice",
    body: "I was charged $98 instead of $49 for Pro plan this month. I didn't upgrade or add anything. Please investigate.",
    from: "david@smallbiz.com",
    customerName: "David Kim",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-14T20:00:00Z",
    updatedAt: "2026-03-14T20:00:00Z",
    messages: [
      { id: "m8", from: "customer", body: "I was charged $98 instead of $49 for Pro plan this month. I didn't upgrade or add anything. Please investigate.", timestamp: "2026-03-14T20:00:00Z" },
    ],
    tags: ["billing", "urgent"],
  },
  {
    id: "TK-3007",
    subject: "How to add Google Analytics to generated sites?",
    body: "I want to add my GA4 tracking code to all my generated sites. Is there a global setting or do I need to edit each site manually?",
    from: "priya@marketing.co",
    customerName: "Priya Sharma",
    status: "pending",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-14T18:30:00Z",
    updatedAt: "2026-03-14T19:00:00Z",
    messages: [
      { id: "m9", from: "customer", body: "I want to add my GA4 tracking code to all my generated sites. Is there a global setting or do I need to edit each site manually?", timestamp: "2026-03-14T18:30:00Z" },
      { id: "m10", from: "ai", body: "Hi Priya! Currently you can add GA4 tracking by editing the HTML of each site and placing the gtag.js snippet in the <head>. We're working on a global analytics injection feature for Pro users - expected next month!", timestamp: "2026-03-14T18:31:00Z" },
    ],
    tags: ["analytics", "ga4", "feature-request"],
  },
  {
    id: "TK-3008",
    subject: "AI-generated images look low quality",
    body: "The AI images in my e-commerce site look blurry and generic. I'm using Stability AI. Are there settings to improve quality? Happy to pay more for better results.",
    from: "tom@ecommerce.shop",
    customerName: "Tom Baker",
    status: "open",
    priority: "medium",
    assignee: null,
    createdAt: "2026-03-14T16:45:00Z",
    updatedAt: "2026-03-14T16:45:00Z",
    messages: [
      { id: "m11", from: "customer", body: "The AI images in my e-commerce site look blurry and generic. I'm using Stability AI. Are there settings to improve quality? Happy to pay more for better results.", timestamp: "2026-03-14T16:45:00Z" },
    ],
    tags: ["images", "quality", "ecommerce"],
  },
  {
    id: "TK-3009",
    subject: "Feature request: Figma plugin",
    body: "Would love a Figma plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.",
    from: "emma@uxstudio.com",
    customerName: "Emma Wilson",
    status: "resolved",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-14T14:20:00Z",
    updatedAt: "2026-03-14T14:25:00Z",
    messages: [
      { id: "m12", from: "customer", body: "Would love a Figma plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.", timestamp: "2026-03-14T14:20:00Z" },
      { id: "m13", from: "ai", body: "Great suggestion, Emma! A Figma plugin is on our roadmap. I've added your vote to the feature request. In the meantime, our Figma Import panel supports direct URL import - just paste your Figma share link!", timestamp: "2026-03-14T14:21:00Z" },
    ],
    tags: ["feature-request", "figma"],
  },
  {
    id: "TK-3010",
    subject: "Sites down - getting 502 errors",
    body: "All 3 of my deployed sites are returning 502 Bad Gateway errors. This has been happening for the last 20 minutes. My clients are complaining. URGENT!",
    from: "alex@webagency.io",
    customerName: "Alex Rivera",
    status: "open",
    priority: "urgent",
    assignee: "Engineering",
    createdAt: "2026-03-14T12:05:00Z",
    updatedAt: "2026-03-14T12:05:00Z",
    messages: [
      { id: "m14", from: "customer", body: "All 3 of my deployed sites are returning 502 Bad Gateway errors. This has been happening for the last 20 minutes. My clients are complaining. URGENT!", timestamp: "2026-03-14T12:05:00Z" },
    ],
    tags: ["outage", "502", "urgent", "hosting"],
  },
];

// ---------- Helpers ----------
const STORAGE_KEY = "zoobicon_email_tickets";

function loadTickets(): Ticket[] {
  let tickets: Ticket[];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tickets = stored ? JSON.parse(stored) : DEMO_TICKETS;
  } catch { tickets = DEMO_TICKETS; }
  // Ensure all tickets have SLA data
  return tickets.map((t) => ({
    ...t,
    sla: t.sla || computeSla(t.priority, t.createdAt),
  }));
}

function saveTickets(tickets: Ticket[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch { /* noop */ }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const folderConfig: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All Tickets", icon: Inbox },
  { key: "open", label: "Open", icon: CircleDot },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "resolved", label: "Resolved", icon: CheckCircle2 },
  { key: "spam", label: "Spam", icon: ShieldOff },
];

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  spam: "bg-red-500/15 text-red-400",
};

// ---------- SLA Helpers ----------
const SLA_DEFAULTS: Record<string, { responseHours: number; resolutionHours: number }> = {
  urgent: { responseHours: 1, resolutionHours: 4 },
  high: { responseHours: 4, resolutionHours: 12 },
  medium: { responseHours: 8, resolutionHours: 24 },
  low: { responseHours: 24, resolutionHours: 72 },
};

function computeSla(priority: string, createdAt: string): Ticket["sla"] {
  const defaults = SLA_DEFAULTS[priority] || SLA_DEFAULTS.medium;
  const created = new Date(createdAt).getTime();
  const responseDeadline = new Date(created + defaults.responseHours * 3600000).toISOString();
  const resolutionDeadline = new Date(created + defaults.resolutionHours * 3600000).toISOString();
  const breached = Date.now() > new Date(responseDeadline).getTime();
  return { responseDeadline, resolutionDeadline, breached };
}

function slaTimeLeft(deadline: string): { label: string; color: string } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { label: "SLA BREACHED", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `SLA: ${mins}m left`, color: mins <= 45 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  const hrs = Math.floor(mins / 60);
  if (hrs < 4) return { label: `SLA: ${hrs}h ${mins % 60}m left`, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return { label: `SLA: ${hrs}h left`, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
}

// ---------- Canned Responses ----------
const CANNED_RESPONSES = [
  { label: "Greeting", text: "Hi there! Thank you for reaching out to Zoobicon Support. I'd be happy to help you with this. Let me look into it right away." },
  { label: "Escalation", text: "Thank you for your patience. I'm escalating this to our engineering team for a closer look. You'll receive an update within the next 2 hours." },
  { label: "Feature Request", text: "Thank you for this great suggestion! I've added your feedback to our product roadmap. Our team reviews feature requests weekly, and we'll notify you when this is planned." },
  { label: "Billing Inquiry", text: "I understand your concern about the billing. Let me pull up your account details and investigate this right away. If there's been an error, we'll issue a refund within 24 hours." },
  { label: "Bug Report", text: "Thank you for reporting this bug. I've created an internal ticket for our engineering team. We take these reports seriously and will have a fix deployed as soon as possible." },
  { label: "Closure", text: "I'm glad we could resolve this for you! If you have any other questions in the future, don't hesitate to reach out. Have a great day!" },
];

// ---------- Team Members ----------
const TEAM_MEMBERS = ["Unassigned", "Support Team", "Engineering", "Sales Team", "Billing"];

// ---------- Automation Rules ----------
function getAutomationRules(ticket: Ticket): string[] {
  const rules: string[] = [];
  if (ticket.tags.includes("bug") || ticket.tags.includes("outage")) {
    rules.push("Auto-assigned to Engineering (tag: bug/outage)");
  }
  if (ticket.tags.includes("billing")) {
    rules.push("Auto-assigned to Billing (tag: billing)");
  }
  if (ticket.tags.includes("sales") || ticket.tags.includes("enterprise")) {
    rules.push("Auto-assigned to Sales Team (tag: enterprise)");
  }
  const slaDefaults = SLA_DEFAULTS[ticket.priority];
  if (slaDefaults) {
    rules.push(`SLA set: ${slaDefaults.responseHours}h response (priority: ${ticket.priority})`);
  }
  if (ticket.messages.some((m) => m.from === "ai")) {
    rules.push("AI auto-reply sent (confidence: 92%)");
  }
  return rules;
}

// ---------- Component ----------
export default function EmailSupportDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // AI reply
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Quick actions dropdown
  const [showActions, setShowActions] = useState(false);

  // AI Polish for replies
  const [polishing, setPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<{ polished: string; changes: string[]; score: number; tone: string } | null>(null);

  // New features state
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(true);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        router.push("/auth/login");
        return;
      }
    } catch {
      router.push("/auth/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Load tickets
  useEffect(() => {
    if (!authChecked) return;
    const loaded = loadTickets();
    setTickets(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, [authChecked]);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch { /* noop */ }
    router.push("/auth/login");
  };

  // Filtering & sorting
  const filteredTickets = useCallback(() => {
    let result = [...tickets];

    // Folder filter
    if (activeFolder !== "all") {
      result = result.filter((t) => t.status === activeFolder);
    }

    // Priority filter
    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.from.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      );
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    return result;
  }, [tickets, activeFolder, filterPriority, searchQuery, sortBy]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;

  const folderCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    spam: tickets.filter((t) => t.status === "spam").length,
  };

  const stats = {
    open: folderCounts.open,
    avgResponse: "< 30s",
    resolutionRate: tickets.length > 0 ? Math.round((folderCounts.resolved / tickets.length) * 100) : 0,
    aiReplies: tickets.reduce((acc, t) => acc + t.messages.filter((m) => m.from === "ai").length, 0),
  };

  // Create ticket
  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newBody.trim() || !newFrom.trim()) return;
    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: `TK-${3000 + tickets.length + 1}`,
      subject: newSubject,
      body: newBody,
      from: newFrom,
      customerName: newFrom.split("@")[0].charAt(0).toUpperCase() + newFrom.split("@")[0].slice(1),
      status: "open",
      priority: newPriority,
      assignee: null,
      createdAt: now,
      updatedAt: now,
      messages: [
        { id: `m-${Date.now()}`, from: "customer", body: newBody, timestamp: now },
      ],
      tags: [],
      sla: computeSla(newPriority, now),
    };
    const updated = [ticket, ...tickets];
    setTickets(updated);
    saveTickets(updated);
    setSelectedId(ticket.id);
    setShowNewTicket(false);
    setNewSubject("");
    setNewBody("");
    setNewFrom("");
    setNewPriority("medium");
  };

  // Update ticket
  const updateTicket = (id: string, changes: Partial<Ticket>) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    );
    setTickets(updated);
    saveTickets(updated);
  };

  // AI Auto-Reply
  const handleAiReply = async (ticket: Ticket) => {
    setAiLoading(ticket.id);
    try {
      const res = await fetch("/api/email-support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketSubject: ticket.subject,
          ticketBody: ticket.body,
          customerName: ticket.customerName,
          context: ticket.tags.join(", "),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        const newMessage: TicketMessage = {
          id: `m-ai-${Date.now()}`,
          from: "ai",
          body: data.reply,
          timestamp: new Date().toISOString(),
        };
        const updated = tickets.map((t) =>
          t.id === ticket.id
            ? {
                ...t,
                messages: [...t.messages, newMessage],
                status: "pending" as const,
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        setTickets(updated);
        saveTickets(updated);
      }
    } catch {
      // Silently fail - user can retry
    } finally {
      setAiLoading(null);
    }
  };

  // AI Polish for replies
  const handlePolishReply = async () => {
    if (!replyText.trim()) return;
    setPolishing(true);
    setPolishResult(null);
    try {
      const res = await fetch("/api/email/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, context: isInternalNote ? "internal" : "support" }),
      });
      const data = await res.json();
      if (res.ok && data.polished) {
        setPolishResult(data);
      }
    } catch { /* silent */ }
    setPolishing(false);
  };

  const acceptReplyPolish = () => {
    if (polishResult) {
      setReplyText(polishResult.polished);
      setPolishResult(null);
    }
  };

  // Send manual reply or internal note
  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newMessage: TicketMessage = {
      id: `m-${isInternalNote ? "note" : "agent"}-${Date.now()}`,
      from: isInternalNote ? "internal" : "agent",
      body: replyText,
      timestamp: new Date().toISOString(),
    };
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            messages: [...t.messages, newMessage],
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    setTickets(updated);
    saveTickets(updated);
    setReplyText("");
    setIsInternalNote(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const visibleTickets = filteredTickets();

  return (
    <div className="relative min-h-screen bg-[#09090f] text-white flex flex-col">
      <BackgroundEffects preset="technical" />
      {/* Top Nav */}
      <nav className="h-14 border-b border-white/[0.08] bg-gray-900/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Zoobicon</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm font-medium text-white/60">Email Support</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-xs text-white/60 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/builder" className="text-xs text-white/60 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
            <Hammer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Builder</span>
          </Link>
          <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
          {user && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold ml-1">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>

      <CursorGlowTracker />

      {/* Demo Data Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0 z-40">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300 text-center">
          <strong>DEMO DATA</strong> — These are placeholder tickets, not real customers. Connect Mailgun to receive real support emails.{" "}
          <Link href="/admin/email-settings" className="underline hover:text-amber-200 transition-colors">Set up email →</Link>
        </p>
      </div>

      {/* Stats Bar */}
      <div className="h-12 border-b border-white/[0.06] bg-gray-900/50 flex items-center px-4 gap-6 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-white/60">Open</span>
          <span className="font-bold text-white/80">{stats.open}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3 h-3 text-white/30" />
          <span className="text-white/60">Avg Response</span>
          <span className="font-bold text-white/80">{stats.avgResponse}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <BarChart3 className="w-3 h-3 text-white/30" />
          <span className="text-white/60">Resolution Rate</span>
          <span className="font-bold text-emerald-400">{stats.resolutionRate}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Bot className="w-3 h-3 text-white/30" />
          <span className="text-white/60">AI Replies</span>
          <span className="font-bold text-purple-400">{stats.aiReplies}</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative flex flex-1 min-h-0">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        {/* Sidebar - Folders */}
        <div className="w-52 border-r border-white/[0.06] bg-gray-900 shrink-0 flex flex-col">
          <div className="p-3">
            <button
              onClick={() => setShowNewTicket(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Ticket
            </button>
          </div>
          <div className="flex-1 px-2 space-y-0.5">
            {folderConfig.map((f) => (
              <button
                key={f.key}
                onClick={() => { setActiveFolder(f.key); setSelectedId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  activeFolder === f.key
                    ? "bg-white/[0.08] text-white font-medium"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <f.icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeFolder === f.key ? "bg-white/10 text-white/70" : "text-white/30"
                }`}>
                  {folderCounts[f.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-white/[0.06]">
            <Link
              href="/products/email-support"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Product Page
            </Link>
          </div>
        </div>

        {/* Ticket List */}
        <div className="w-80 border-r border-white/[0.06] bg-gray-900/50 flex flex-col shrink-0">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/30 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                  showFilters ? "bg-white/[0.08] border-white/[0.12] text-white/70" : "border-white/[0.06] text-white/60 hover:text-white/60"
                }`}
              >
                <Filter className="w-3 h-3" />
                Filter
              </button>
              <button
                onClick={() => setSortBy(sortBy === "newest" ? "oldest" : sortBy === "oldest" ? "priority" : "newest")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border border-white/[0.06] text-white/60 hover:text-white/60 transition-all"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Priority"}
              </button>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["all", "urgent", "high", "medium", "low"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                          filterPriority === p
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                            : "border-white/[0.08] text-white/60 hover:text-white/60"
                        }`}
                      >
                        {p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ticket Items */}
          <div className="flex-1 overflow-y-auto">
            {visibleTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs gap-2">
                <Inbox className="w-8 h-8" />
                <span>No tickets found</span>
              </div>
            ) : (
              visibleTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.05] transition-all ${
                    selectedId === ticket.id
                      ? "bg-blue-500/[0.06] border-l-2 border-l-blue-500"
                      : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-white/30">{ticket.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-white/75 truncate mb-1">
                    {ticket.subject}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60 truncate max-w-[60%]">{ticket.customerName}</span>
                    <span className="text-[10px] text-white/25">{timeAgo(ticket.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {ticket.sla && ticket.status !== "resolved" && (() => {
                      const sla = slaTimeLeft(ticket.sla.responseDeadline);
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border ${sla.color}`}>
                          <Timer className="w-2.5 h-2.5" />
                          {sla.label}
                        </span>
                      );
                    })()}
                    {ticket.assignee && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[8px] text-white/60 font-medium">
                        <UserCircle className="w-2.5 h-2.5" />
                        {ticket.assignee}
                      </span>
                    )}
                    {ticket.messages.length > 1 && (
                      <>
                        <Bot className="w-2.5 h-2.5 text-purple-400/60" />
                        <span className="text-[9px] text-purple-400/60">
                          {ticket.messages.filter((m) => m.from === "ai").length} AI {ticket.messages.filter((m) => m.from === "ai").length === 1 ? "reply" : "replies"}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="flex-1 flex min-w-0 bg-gray-900/30">
          {selectedTicket ? (
            <>
            <div className="flex-1 flex flex-col min-w-0">
              {/* Ticket Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white/90 truncate">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-white/60">
                        <span className="text-white/60 font-medium">{selectedTicket.customerName}</span>
                        {" "}&lt;{selectedTicket.from}&gt;
                      </span>
                      <span className="text-[10px] text-white/25">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    {selectedTicket.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Tag className="w-3 h-3 text-white/20" />
                        {selectedTicket.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[9px] text-white/60 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* AI Reply Button */}
                    <button
                      onClick={() => handleAiReply(selectedTicket)}
                      disabled={aiLoading === selectedTicket.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 text-[11px] font-medium text-purple-300 hover:from-purple-600/30 hover:to-blue-600/30 transition-all disabled:opacity-50"
                    >
                      {aiLoading === selectedTicket.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      AI Reply
                    </button>
                    {/* Quick Assign */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-[11px] text-white/60 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                      <AnimatePresence>
                        {showAssignDropdown && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-gray-900 border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50"
                          >
                            {TEAM_MEMBERS.map((member) => (
                              <button
                                key={member}
                                onClick={() => {
                                  updateTicket(selectedTicket.id, { assignee: member === "Unassigned" ? null : member });
                                  setShowAssignDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all ${
                                  selectedTicket.assignee === member || (member === "Unassigned" && !selectedTicket.assignee)
                                    ? "text-blue-400 bg-blue-500/[0.08]"
                                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                {member}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Quick Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 rounded-lg border border-white/[0.08] text-white/60 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showActions && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50"
                          >
                            <button
                              onClick={() => { updateTicket(selectedTicket.id, { assignee: user?.name || user?.email || "Agent" }); setShowActions(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Assign to Me
                            </button>
                            <button
                              onClick={() => {
                                const next = selectedTicket.priority === "low" ? "medium" : selectedTicket.priority === "medium" ? "high" : selectedTicket.priority === "high" ? "urgent" : "low";
                                updateTicket(selectedTicket.id, { priority: next });
                                setShowActions(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                            >
                              <Flag className="w-3.5 h-3.5" /> Cycle Priority
                            </button>
                            <button
                              onClick={() => { updateTicket(selectedTicket.id, { status: "resolved" }); setShowActions(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-400/70 hover:bg-emerald-500/[0.06] hover:text-emerald-400 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                            </button>
                            <button
                              onClick={() => { updateTicket(selectedTicket.id, { status: "spam" }); setShowActions(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400/70 hover:bg-red-500/[0.06] hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Mark Spam
                            </button>
                            <div className="border-t border-white/[0.06]" />
                            <button
                              onClick={() => { setShowMergeModal(true); setShowActions(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                            >
                              <GitMerge className="w-3.5 h-3.5" /> Merge Ticket
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                {/* Status / Priority / Assignee row */}
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[selectedTicket.status]}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityColors[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                  {selectedTicket.assignee && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/60">
                      <UserCircle className="w-3 h-3" />
                      {selectedTicket.assignee}
                    </span>
                  )}
                  {selectedTicket.sla && selectedTicket.status !== "resolved" && (() => {
                    const sla = slaTimeLeft(selectedTicket.sla.responseDeadline);
                    return (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${sla.color}`}>
                        <Timer className="w-3 h-3" />
                        {sla.label}
                      </span>
                    );
                  })()}
                  {selectedTicket.sla && selectedTicket.status !== "resolved" && (
                    <span className="text-[9px] text-white/30">
                      Resolve by: {formatDate(selectedTicket.sla.resolutionDeadline)}
                    </span>
                  )}
                </div>
                {/* Automation Rules */}
                {getAutomationRules(selectedTicket).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {getAutomationRules(selectedTicket).map((rule, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/[0.08] border border-cyan-500/15 text-[9px] text-cyan-400/80">
                        <Zap className="w-2.5 h-2.5" />
                        {rule}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.from === "customer" ? "" : "justify-end"}`}
                  >
                    {msg.from === "customer" && (
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60 shrink-0">
                        {selectedTicket.customerName.charAt(0)}
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.from === "customer"
                          ? "bg-white/[0.12] border border-white/[0.15]"
                          : msg.from === "ai"
                          ? "bg-purple-500/[0.08] border border-purple-500/20"
                          : msg.from === "internal"
                          ? "bg-amber-500/[0.08] border border-amber-500/20 border-dashed"
                          : "bg-blue-500/[0.08] border border-blue-500/20"
                      }`}
                    >
                      {msg.from !== "customer" && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {msg.from === "ai" ? (
                            <>
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span className="text-[9px] font-bold text-purple-400">AI Draft</span>
                            </>
                          ) : msg.from === "internal" ? (
                            <>
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span className="text-[9px] font-bold text-amber-400">Internal Note</span>
                              <span className="text-[8px] text-amber-400/50 ml-1">Not visible to customer</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-blue-400" />
                              <span className="text-[9px] font-bold text-blue-400">Agent Reply</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      <div className="text-[10px] text-white/60 mt-2">{formatDate(msg.timestamp)}</div>
                    </div>
                    {msg.from !== "customer" && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.from === "ai" ? "bg-purple-500/20" : msg.from === "internal" ? "bg-amber-500/20" : "bg-blue-500/20"
                      }`}>
                        {msg.from === "ai" ? (
                          <Bot className="w-4 h-4 text-purple-400" />
                        ) : msg.from === "internal" ? (
                          <Lock className="w-4 h-4 text-amber-400" />
                        ) : (
                          <UserCircle className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                {aiLoading === selectedTicket.id && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-purple-500/[0.08] border border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <span className="text-xs text-purple-400/70">AI is drafting a reply...</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="px-6 py-3 border-t border-white/[0.06] shrink-0">
                {/* Canned Responses & Internal Note Toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowCannedResponses(!showCannedResponses)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                        showCannedResponses ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "border-white/[0.06] text-white/60 hover:text-white/60"
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      Canned Responses
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showCannedResponses ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {showCannedResponses && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 4 }}
                          className="absolute left-0 bottom-full mb-1 w-72 bg-gray-900 border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="px-3 py-2 border-b border-white/[0.06]">
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Quick Replies</span>
                          </div>
                          {CANNED_RESPONSES.map((resp, i) => (
                            <button
                              key={i}
                              onClick={() => { setReplyText(resp.text); setShowCannedResponses(false); }}
                              className="w-full text-left px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all border-b border-white/[0.04] last:border-0"
                            >
                              <span className="font-semibold text-white/70 block mb-0.5">{resp.label}</span>
                              <span className="text-[10px] text-white/60 line-clamp-1">{resp.text}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                      isInternalNote ? "bg-amber-500/15 border-amber-500/25 text-amber-400" : "border-white/[0.06] text-white/60 hover:text-white/60"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Internal Note
                  </button>
                </div>
                {/* AI Polish Result */}
                <AnimatePresence>
                  {polishResult && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] font-semibold text-purple-300">AI Polish</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${polishResult.score >= 90 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {polishResult.score}/100
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={acceptReplyPolish} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-600/20 text-green-400 text-[10px] hover:bg-green-600/30 transition-colors"><Check className="w-2.5 h-2.5" /> Accept</button>
                            <button onClick={() => setPolishResult(null)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-700/50 text-zinc-400 text-[10px] hover:bg-zinc-700 transition-colors"><X className="w-2.5 h-2.5" /> Dismiss</button>
                          </div>
                        </div>
                        {polishResult.changes.length > 0 && (
                          <div className="space-y-0.5 mb-1.5">
                            {polishResult.changes.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-400"><Wand2 className="w-2.5 h-2.5 text-purple-400 mt-0.5 shrink-0" />{c}</div>
                            ))}
                          </div>
                        )}
                        <div className="bg-black/20 rounded-lg p-2 text-[11px] text-zinc-300 max-h-20 overflow-y-auto">{polishResult.polished}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder={isInternalNote ? "Add an internal note (not visible to customer)..." : "Type a reply..."}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/25 outline-none transition-colors ${
                      isInternalNote
                        ? "bg-amber-500/[0.06] border border-amber-500/20 focus:border-amber-500/40"
                        : "bg-white/[0.05] border border-white/[0.08] focus:border-blue-500/30"
                    }`}
                  />
                  {/* AI Polish Button */}
                  <button
                    onClick={handlePolishReply}
                    disabled={polishing || !replyText.trim()}
                    className="p-2.5 rounded-xl text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all disabled:opacity-30"
                    title="AI Polish — fix grammar & tone"
                  >
                    {polishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={`p-2.5 rounded-xl text-white transition-all disabled:opacity-30 ${
                      isInternalNote
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                    }`}
                  >
                    {isInternalNote ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            {/* Customer Profile Sidebar */}
            {showCustomerSidebar && (
              <div className="w-56 border-l border-white/[0.06] bg-gray-900/50 shrink-0 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Customer</span>
                    <button onClick={() => setShowCustomerSidebar(false)} className="p-0.5 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Avatar & Name */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold mb-2">
                      {selectedTicket.customerName.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-white/80">{selectedTicket.customerName}</span>
                    <span className="text-[10px] text-white/60">{selectedTicket.from}</span>
                  </div>
                  {/* Stats */}
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Total Tickets</span>
                      <span className="text-[10px] font-bold text-white/70">{tickets.filter((t) => t.from === selectedTicket.from).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Member Since</span>
                      <span className="text-[10px] font-bold text-white/70">
                        {new Date(
                          Math.min(...tickets.filter((t) => t.from === selectedTicket.from).map((t) => new Date(t.createdAt).getTime()))
                        ).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 flex items-center gap-1.5"><Crown className="w-3 h-3" /> Plan</span>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Pro</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> MRR</span>
                      <span className="text-[10px] font-bold text-emerald-400">$49/mo</span>
                    </div>
                  </div>
                  {/* Previous Tickets */}
                  {tickets.filter((t) => t.from === selectedTicket.from && t.id !== selectedTicket.id).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-2">Previous Tickets</span>
                      <div className="space-y-1.5">
                        {tickets
                          .filter((t) => t.from === selectedTicket.from && t.id !== selectedTicket.id)
                          .slice(0, 5)
                          .map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedId(t.id)}
                              className="w-full text-left p-2 rounded-lg hover:bg-white/[0.04] transition-all group"
                            >
                              <div className="text-[10px] font-mono text-white/25 group-hover:text-white/60">{t.id}</div>
                              <div className="text-[10px] text-white/60 truncate group-hover:text-white/70">{t.subject}</div>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${statusColors[t.status]}`}>{t.status}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!showCustomerSidebar && (
              <button
                onClick={() => setShowCustomerSidebar(true)}
                className="w-8 border-l border-white/[0.06] bg-gray-900/50 shrink-0 flex items-center justify-center hover:bg-white/[0.04] transition-all"
                title="Show customer profile"
              >
                <UserCircle className="w-4 h-4 text-white/30" />
              </button>
            )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/60 gap-3">
              <Mail className="w-12 h-12" />
              <span className="text-sm font-medium">Select a ticket to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewTicket(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold">Create New Ticket</h3>
                <button onClick={() => setShowNewTicket(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white/60 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">From (Email)</label>
                  <input
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">Subject</label>
                  <input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">Message</label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/30 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                          newPriority === p
                            ? priorityColors[p]
                            : "border-white/[0.08] text-white/60 hover:text-white/60"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white/70 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!newSubject.trim() || !newBody.trim() || !newFrom.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-semibold text-white transition-all disabled:opacity-30 hover:from-blue-500 hover:to-purple-500"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merge Ticket Modal */}
      <AnimatePresence>
        {showMergeModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowMergeModal(false); setMergeTargetId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold">Merge Ticket</h3>
                </div>
                <button onClick={() => { setShowMergeModal(false); setMergeTargetId(null); }} className="p-1 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white/60 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-white/60 mb-3">
                  Merge <span className="text-white/80 font-semibold">{selectedTicket.id}</span> into another ticket. All messages will be combined.
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {tickets
                    .filter((t) => t.id !== selectedTicket.id)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setMergeTargetId(t.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          mergeTargetId === t.id
                            ? "bg-blue-500/[0.08] border-blue-500/25 ring-1 ring-blue-500/20"
                            : "border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-mono text-white/30">{t.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${statusColors[t.status]}`}>{t.status}</span>
                        </div>
                        <div className="text-xs text-white/60 truncate">{t.subject}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{t.customerName} - {timeAgo(t.createdAt)}</div>
                      </button>
                    ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
                <button
                  onClick={() => { setShowMergeModal(false); setMergeTargetId(null); }}
                  className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white/70 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!mergeTargetId) return;
                    // Stub: show success by adding an internal note
                    const mergeNote: TicketMessage = {
                      id: `m-merge-${Date.now()}`,
                      from: "internal",
                      body: `Ticket ${selectedTicket.id} merged into ${mergeTargetId}. All messages have been combined.`,
                      timestamp: new Date().toISOString(),
                    };
                    const updated = tickets.map((t) =>
                      t.id === mergeTargetId
                        ? { ...t, messages: [...t.messages, ...selectedTicket.messages, mergeNote], updatedAt: new Date().toISOString() }
                        : t.id === selectedTicket.id
                        ? { ...t, status: "resolved" as const, updatedAt: new Date().toISOString() }
                        : t
                    );
                    setTickets(updated);
                    saveTickets(updated);
                    setSelectedId(mergeTargetId);
                    setShowMergeModal(false);
                    setMergeTargetId(null);
                  }}
                  disabled={!mergeTargetId}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-semibold text-white transition-all disabled:opacity-30 hover:from-blue-500 hover:to-purple-500"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Merge Tickets
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
