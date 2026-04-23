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
  Shield,
  Star,
  Eye,
  AlertCircle,
  TrendingUp,
  Activity,
  ThumbsUp,
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

interface CSATRating {
  ticketId: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

interface TicketLock {
  ticketId: string;
  agentName: string;
  agentEmail: string;
  lockedAt: number;
  action: "viewing" | "replying";
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
    subject: "Feature request: Layers plugin",
    body: "Would love a Layers plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.",
    from: "emma@uxstudio.com",
    customerName: "Emma Wilson",
    status: "resolved",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-14T14:20:00Z",
    updatedAt: "2026-03-14T14:25:00Z",
    messages: [
      { id: "m12", from: "customer", body: "Would love a Layers plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.", timestamp: "2026-03-14T14:20:00Z" },
      { id: "m13", from: "ai", body: "Great suggestion, Emma! A Layers plugin is on our roadmap. I've added your vote to the feature request. In the meantime, our Layers Import panel supports direct URL import - just paste your Layers share link!", timestamp: "2026-03-14T14:21:00Z" },
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
  urgent: "bg-stone-500/15 text-stone-400 border-stone-500/20",
  high: "bg-stone-500/15 text-stone-400 border-stone-500/20",
  medium: "bg-stone-500/15 text-stone-400 border-stone-500/20",
  low: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-stone-500/15 text-stone-400",
  pending: "bg-stone-500/15 text-stone-400",
  resolved: "bg-stone-500/15 text-stone-400",
  spam: "bg-stone-500/15 text-stone-400",
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
  if (diff <= 0) return { label: "SLA BREACHED", color: "bg-stone-500/20 text-stone-400 border-stone-500/30" };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `SLA: ${mins}m left`, color: mins <= 45 ? "bg-stone-500/20 text-stone-400 border-stone-500/30" : "bg-stone-500/20 text-stone-400 border-stone-500/30" };
  const hrs = Math.floor(mins / 60);
  if (hrs < 4) return { label: `SLA: ${hrs}h ${mins % 60}m left`, color: "bg-stone-500/20 text-stone-400 border-stone-500/30" };
  return { label: `SLA: ${hrs}h left`, color: "bg-stone-500/20 text-stone-400 border-stone-500/30" };
}

// ---------- Canned Responses (15+ organized by category) ----------
const CANNED_RESPONSE_CATEGORIES: { category: string; icon: React.ElementType; responses: { label: string; text: string }[] }[] = [
  {
    category: "General",
    icon: MessageSquare,
    responses: [
      { label: "Greeting", text: "Hi there! Thank you for reaching out to Zoobicon Support. I'd be happy to help you with this. Let me look into it right away." },
      { label: "Closure - Resolved", text: "I'm glad we could resolve this for you! If you have any other questions in the future, don't hesitate to reach out. Have a great day!" },
      { label: "Follow-Up", text: "Hi! Just checking in to see if the solution I provided resolved your issue. Please let me know if you need any further assistance." },
      { label: "Need More Info", text: "Thank you for reaching out. To help resolve this faster, could you provide a few more details? Specifically, I'd need: 1) Your account email, 2) Steps to reproduce the issue, 3) Any error messages you're seeing." },
    ],
  },
  {
    category: "Billing",
    icon: CreditCard,
    responses: [
      { label: "Billing Inquiry", text: "I understand your concern about the billing. Let me pull up your account details and investigate this right away. If there's been an error, we'll issue a refund within 24 hours." },
      { label: "Refund Processed", text: "Great news! I've processed a full refund to your original payment method. Please allow 5-10 business days for it to appear on your statement. Your account has been adjusted accordingly." },
      { label: "Plan Upgrade", text: "I'd be happy to help you upgrade your plan! You can upgrade directly from your dashboard at zoobicon.com/dashboard, or I can process the change right here. The new features will be available immediately after upgrading." },
    ],
  },
  {
    category: "Technical",
    icon: Hammer,
    responses: [
      { label: "Bug Report Ack", text: "Thank you for reporting this bug. I've created an internal ticket for our engineering team (priority: high). We take these reports seriously and will have a fix deployed as soon as possible. I'll follow up with a timeline within 24 hours." },
      { label: "Known Issue", text: "This is a known issue that our engineering team is actively working on. We expect a fix to be deployed within the next 48 hours. I'll notify you as soon as the fix is live. Apologies for the inconvenience." },
      { label: "Workaround", text: "While our team works on a permanent fix, here's a workaround that should help: [describe workaround]. Let me know if this resolves your issue in the meantime." },
      { label: "DNS / Hosting", text: "For DNS changes, please ensure your CNAME record points to `sites.zoobicon.sh`. DNS propagation can take up to 48 hours, though it's usually much faster. You can check propagation status at whatsmydns.net. Let me know if you need help with the setup." },
    ],
  },
  {
    category: "Feature Request",
    icon: Sparkles,
    responses: [
      { label: "Feature Logged", text: "Thank you for this great suggestion! I've added your feedback to our product roadmap. Our team reviews feature requests weekly, and we'll notify you when this is planned." },
      { label: "Already Planned", text: "Great news! This feature is already on our roadmap and is currently in development. We expect to ship it within the next 2-4 weeks. I'll make sure you're notified as soon as it's available." },
    ],
  },
  {
    category: "Onboarding",
    icon: Users,
    responses: [
      { label: "Welcome", text: "Welcome to Zoobicon! I'm excited to help you get started. The quickest way to build your first site is to head to zoobicon.com/builder, describe what you want, and our AI will generate a professional site in under 2 minutes. Here are some tips to get the best results..." },
      { label: "Getting Started Guide", text: "Here's a quick start guide: 1) Go to /builder and describe your ideal website, 2) Choose a style and tier, 3) Click Generate, 4) Use the visual editor to fine-tune, 5) Deploy to a free .sh domain. For detailed docs, visit zoobicon.com/docs." },
    ],
  },
  {
    category: "Escalation",
    icon: AlertCircle,
    responses: [
      { label: "Escalate to Engineering", text: "Thank you for your patience. I'm escalating this to our engineering team for a closer look. You'll receive an update within the next 2 hours." },
      { label: "Escalate to Manager", text: "I understand your frustration and I want to make sure this is handled properly. I'm escalating this to our support manager who will personally follow up with you within the next hour." },
    ],
  },
];

// Flatten for backward compatibility
const CANNED_RESPONSES = CANNED_RESPONSE_CATEGORIES.flatMap((cat) => cat.responses);

// ---------- Team Members ----------
const TEAM_MEMBERS = ["Unassigned", "Support Team", "Engineering", "Sales Team", "Finance Team", "Product", "Agency Success", "Infrastructure"];

// ---------- Auto-Assignment Rules ----------
const AUTO_ASSIGN_RULES: { tags: string[]; team: string; label: string }[] = [
  { tags: ["billing", "payment", "invoice", "refund"], team: "Finance Team", label: "billing/payment" },
  { tags: ["bug", "outage", "502", "error", "crash"], team: "Engineering", label: "bug/outage" },
  { tags: ["feature-request", "suggestion", "enhancement"], team: "Product", label: "feature-request" },
  { tags: ["enterprise", "sales", "sso", "demo"], team: "Sales Team", label: "enterprise/sales" },
  { tags: ["agency", "bulk", "white-label"], team: "Agency Success", label: "agency" },
  { tags: ["dns", "hosting", "deploy", "domain", "ssl"], team: "Infrastructure", label: "hosting/dns" },
];

function autoAssignTeam(ticket: Ticket): string | null {
  for (const rule of AUTO_ASSIGN_RULES) {
    if (rule.tags.some((tag) => ticket.tags.includes(tag))) {
      return rule.team;
    }
  }
  return null;
}

function getAutomationRules(ticket: Ticket): string[] {
  const rules: string[] = [];
  for (const rule of AUTO_ASSIGN_RULES) {
    if (rule.tags.some((tag) => ticket.tags.includes(tag))) {
      rules.push(`Auto-assigned to ${rule.team} (tag: ${rule.label})`);
      break;
    }
  }
  const slaDefaults = SLA_DEFAULTS[ticket.priority];
  if (slaDefaults) {
    rules.push(`SLA set: ${slaDefaults.responseHours}h response (priority: ${ticket.priority})`);
  }
  if (ticket.messages.some((m) => m.from === "ai")) {
    rules.push("AI auto-reply sent (confidence: 92%)");
  }
  if (ticket.priority === "urgent") {
    rules.push("Priority escalation: Urgent tickets notify on-call");
  }
  return rules;
}

// ---------- Collision Detection Helpers ----------
const LOCK_EXPIRY_MS = 120000; // 2 minutes

function getTicketLocks(): TicketLock[] {
  try {
    const raw = localStorage.getItem("zoobicon_ticket_locks");
    if (!raw) return [];
    const locks: TicketLock[] = JSON.parse(raw);
    // Purge expired locks
    const now = Date.now();
    return locks.filter((l) => now - l.lockedAt < LOCK_EXPIRY_MS);
  } catch { return []; }
}

function setTicketLock(lock: TicketLock): void {
  try {
    const existing = getTicketLocks().filter((l) => !(l.ticketId === lock.ticketId && l.agentEmail === lock.agentEmail));
    localStorage.setItem("zoobicon_ticket_locks", JSON.stringify([...existing, lock]));
  } catch { /* noop */ }
}

function removeTicketLock(ticketId: string, agentEmail: string): void {
  try {
    const existing = getTicketLocks().filter((l) => !(l.ticketId === ticketId && l.agentEmail === agentEmail));
    localStorage.setItem("zoobicon_ticket_locks", JSON.stringify(existing));
  } catch { /* noop */ }
}

function getOtherAgentLock(ticketId: string, myEmail: string): TicketLock | null {
  const locks = getTicketLocks();
  return locks.find((l) => l.ticketId === ticketId && l.agentEmail !== myEmail) || null;
}

// ---------- CSAT Helpers ----------
function getCSATRatings(): CSATRating[] {
  try {
    const raw = localStorage.getItem("zoobicon_csat_ratings");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCSATRating(rating: CSATRating): void {
  try {
    const existing = getCSATRatings().filter((r) => r.ticketId !== rating.ticketId);
    localStorage.setItem("zoobicon_csat_ratings", JSON.stringify([...existing, rating]));
  } catch { /* noop */ }
}

function getCSATForTicket(ticketId: string): CSATRating | null {
  return getCSATRatings().find((r) => r.ticketId === ticketId) || null;
}

// ---------- Metrics Helpers ----------
function computeTicketMetrics(tickets: Ticket[]) {
  const resolved = tickets.filter((t) => t.status === "resolved");
  const total = tickets.length;

  // Avg response time (time between creation and first non-customer message)
  let totalResponseMs = 0;
  let responseCount = 0;
  tickets.forEach((t) => {
    const firstReply = t.messages.find((m) => m.from !== "customer");
    if (firstReply) {
      totalResponseMs += new Date(firstReply.timestamp).getTime() - new Date(t.createdAt).getTime();
      responseCount++;
    }
  });
  const avgResponseMs = responseCount > 0 ? totalResponseMs / responseCount : 0;
  const avgResponseLabel = avgResponseMs > 0
    ? avgResponseMs < 60000 ? `${Math.round(avgResponseMs / 1000)}s` : avgResponseMs < 3600000 ? `${Math.round(avgResponseMs / 60000)}m` : `${(avgResponseMs / 3600000).toFixed(1)}h`
    : "N/A";

  // Avg resolution time
  let totalResolutionMs = 0;
  resolved.forEach((t) => {
    totalResolutionMs += new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
  });
  const avgResolutionMs = resolved.length > 0 ? totalResolutionMs / resolved.length : 0;
  const avgResolutionLabel = avgResolutionMs > 0
    ? avgResolutionMs < 3600000 ? `${Math.round(avgResolutionMs / 60000)}m` : `${(avgResolutionMs / 3600000).toFixed(1)}h`
    : "N/A";

  // CSAT
  const csatRatings = getCSATRatings();
  const csatAvg = csatRatings.length > 0 ? csatRatings.reduce((acc, r) => acc + r.rating, 0) / csatRatings.length : 0;

  // First contact resolution (resolved with <= 2 agent/AI messages)
  const fcrCount = resolved.filter((t) => {
    const agentMsgs = t.messages.filter((m) => m.from === "agent" || m.from === "ai");
    return agentMsgs.length <= 2;
  }).length;
  const fcrRate = resolved.length > 0 ? Math.round((fcrCount / resolved.length) * 100) : 0;

  // Tickets per day (based on date range of all tickets)
  const dates = tickets.map((t) => new Date(t.createdAt).toDateString());
  const uniqueDays = new Set(dates).size;
  const ticketsPerDay = uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : "0";

  return { avgResponseLabel, avgResolutionLabel, csatAvg, fcrRate, ticketsPerDay, csatCount: csatRatings.length };
}

// ---------- Component ----------
export default function EmailSupportDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dataSource, setDataSource] = useState<"database" | "demo" | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);
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

  // Grammar check gate
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [grammarChecking, setGrammarChecking] = useState(false);

  // New features state
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(true);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  // Agent collision detection
  const [collisionWarning, setCollisionWarning] = useState<TicketLock | null>(null);

  // CSAT Survey
  const [showCSAT, setShowCSAT] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatHover, setCsatHover] = useState(0);
  const [csatComment, setCsatComment] = useState("");
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  // Canned response category filter
  const [cannedCategory, setCannedCategory] = useState<string>("all");

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

  // Load tickets from API (DB-first, demo fallback)
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/email-support/tickets");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const loaded = (data.tickets || []).map((t: Ticket) => ({
        ...t,
        sla: t.sla || computeSla(t.priority, t.createdAt),
      }));
      setTickets(loaded);
      setDataSource(data.source || "demo");
      if (loaded.length > 0 && !selectedId) setSelectedId(loaded[0].id);
    } catch {
      setDataSource("demo");
      setTickets(DEMO_TICKETS.map((t) => ({ ...t, sla: computeSla(t.priority, t.createdAt) })));
    }
    setTicketsLoading(false);
  }, [selectedId]);

  useEffect(() => {
    if (!authChecked) return;
    fetchTickets();
  }, [authChecked, fetchTickets]);

  // Agent collision detection — lock ticket when viewing/replying
  useEffect(() => {
    if (!selectedId || !user) return;
    const agentEmail = user.email || "unknown";
    const agentName = user.name || user.email || "Agent";

    // Set lock for current ticket
    setTicketLock({
      ticketId: selectedId,
      agentName,
      agentEmail,
      lockedAt: Date.now(),
      action: "viewing",
    });

    // Check for other agents
    const otherLock = getOtherAgentLock(selectedId, agentEmail);
    setCollisionWarning(otherLock);

    // Refresh lock and check collisions every 10 seconds
    const interval = setInterval(() => {
      setTicketLock({
        ticketId: selectedId,
        agentName,
        agentEmail,
        lockedAt: Date.now(),
        action: replyText.trim() ? "replying" : "viewing",
      });
      const lock = getOtherAgentLock(selectedId, agentEmail);
      setCollisionWarning(lock);
    }, 10000);

    return () => {
      clearInterval(interval);
      removeTicketLock(selectedId, agentEmail);
    };
  }, [selectedId, user, replyText]);

  // CSAT — check if already rated when selecting resolved ticket
  useEffect(() => {
    if (selectedId) {
      const ticket = tickets.find((t) => t.id === selectedId);
      if (ticket?.status === "resolved") {
        const existing = getCSATForTicket(selectedId);
        if (existing) {
          setCsatSubmitted(true);
          setCsatRating(existing.rating);
        } else {
          setCsatSubmitted(false);
          setCsatRating(0);
          setCsatComment("");
        }
      }
    }
  }, [selectedId, tickets]);

  // Auto-assign on ticket creation
  const applyAutoAssignment = useCallback((ticket: Ticket): Ticket => {
    if (ticket.assignee) return ticket;
    const team = autoAssignTeam(ticket);
    if (team) return { ...ticket, assignee: team };
    return ticket;
  }, []);

  // Save tickets helper (for merge and other local-only operations)
  const saveTickets = useCallback((updated: Ticket[]) => {
    setTickets(updated);
  }, []);

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

  // Create ticket via API (persisted to DB)
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newBody.trim() || !newFrom.trim()) return;
    try {
      const res = await fetch("/api/email-support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, body: newBody, from: newFrom, priority: newPriority }),
      });
      const data = await res.json();
      if (data.ticket) {
        const ticket = applyAutoAssignment({ ...data.ticket, sla: computeSla(data.ticket.priority, data.ticket.createdAt) });
        setTickets((prev) => [ticket, ...prev]);
        setSelectedId(ticket.id);
      }
    } catch { /* will show in UI */ }
    setShowNewTicket(false);
    setNewSubject("");
    setNewBody("");
    setNewFrom("");
    setNewPriority("medium");
  };

  // Update ticket via API
  const updateTicket = async (id: string, changes: Partial<Ticket>) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    );
    setTickets(updated);
    try {
      await fetch("/api/email-support/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });
    } catch { /* local state already updated */ }
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

  // Send manual reply or internal note — persists via API
  // Grammar check gate for support replies
  const runReplyGrammarCheck = async () => {
    if (!replyText.trim()) return;
    setGrammarChecking(true);
    try {
      const res = await fetch("/api/email/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, context: "grammar-check" }),
      });
      const data = await res.json();
      if (res.ok && data.polished) {
        if ((data.changes || []).length > 0 && data.score < 90) {
          setReplyText(data.polished);
        }
        setGrammarChecked(true);
      } else {
        setGrammarChecked(true);
      }
    } catch {
      setGrammarChecked(true);
    }
    setGrammarChecking(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    // Block send until grammar check passes (skip for internal notes)
    if (!isInternalNote && !grammarChecked) {
      await runReplyGrammarCheck();
      return;
    }
    const newMessage: TicketMessage = {
      id: `m-${isInternalNote ? "note" : "agent"}-${Date.now()}`,
      from: isInternalNote ? "internal" : "agent",
      body: replyText,
      timestamp: new Date().toISOString(),
    };
    // Optimistic UI update
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
    setReplyText("");
    setIsInternalNote(false);
    setGrammarChecked(false);
    // Persist to DB via real support API (sends email to customer if not internal note)
    if (!isInternalNote) {
      try {
        await fetch("/api/email/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: selectedTicket.id,
            reply: newMessage.body,
            sendToCustomer: true,
          }),
        });
      } catch { /* optimistic update already applied */ }
    }
  };

  // CSAT Submit
  const handleCSATSubmit = async () => {
    if (!selectedTicket || csatRating === 0) return;
    const rating: CSATRating = {
      ticketId: selectedTicket.id,
      rating: csatRating,
      comment: csatComment,
      submittedAt: new Date().toISOString(),
    };
    saveCSATRating(rating);
    setCsatSubmitted(true);
    // Also send to API
    try {
      await fetch("/api/email-support/csat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rating),
      });
    } catch { /* localStorage already saved */ }
  };

  // Compute metrics
  const metrics = computeTicketMetrics(tickets);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-500 animate-spin" />
      </div>
    );
  }

  const visibleTickets = filteredTickets();

  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <BackgroundEffects preset="technical" />
      {/* Top Nav */}
      <nav className="h-14 border-b border-white/[0.08] bg-gray-900/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Zoobicon</span>
          </Link>
          <span className="text-white/50">/</span>
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center text-[10px] font-bold ml-1">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>

      <CursorGlowTracker />

      {/* Data Source Banner */}
      {dataSource === "demo" && (
        <div className="bg-stone-500/10 border-b border-stone-500/20 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0 z-40">
          <AlertTriangle className="w-4 h-4 text-stone-400 shrink-0" />
          <p className="text-xs text-stone-300 text-center">
            <strong>DEMO DATA</strong> — Database not connected. Connect Mailgun + Neon to receive real support emails.{" "}
            <Link href="/admin/email-settings" className="underline hover:text-stone-200 transition-colors">Set up email →</Link>
          </p>
        </div>
      )}
      {dataSource === "database" && (
        <div className="bg-stone-500/10 border-b border-stone-500/20 px-4 py-1.5 flex items-center justify-center gap-2 shrink-0 z-40">
          <Check className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <p className="text-xs text-stone-300 text-center">
            <strong>LIVE</strong> — Connected to database. Tickets are persisted and emails routed via Mailgun.
          </p>
        </div>
      )}

      {/* Ticket Metrics Dashboard */}
      <div className="border-b border-white/[0.06] bg-gray-900/50 shrink-0 overflow-x-auto">
        <div className="flex items-center px-4 py-2.5 gap-1">
          {/* Open Tickets */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-500/[0.06] border border-stone-500/10">
            <div className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
            <span className="text-[10px] text-white/60">Open</span>
            <span className="text-xs font-bold text-stone-400">{stats.open}</span>
          </div>
          {/* Avg Response Time */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Clock className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">Avg Response</span>
            <span className="text-xs font-bold text-stone-400">{metrics.avgResponseLabel}</span>
          </div>
          {/* Avg Resolution Time */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Timer className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">Avg Resolution</span>
            <span className="text-xs font-bold text-stone-400">{metrics.avgResolutionLabel}</span>
          </div>
          {/* CSAT Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Star className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">CSAT</span>
            <span className="text-xs font-bold text-stone-400">
              {metrics.csatAvg > 0 ? `${metrics.csatAvg.toFixed(1)}/5` : "N/A"}
            </span>
            {metrics.csatCount > 0 && (
              <span className="text-[9px] text-white/40">({metrics.csatCount})</span>
            )}
          </div>
          {/* First Contact Resolution */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <ThumbsUp className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">FCR</span>
            <span className="text-xs font-bold text-stone-400">{metrics.fcrRate}%</span>
          </div>
          {/* Tickets per Day */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Activity className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">Tickets/Day</span>
            <span className="text-xs font-bold text-stone-400">{metrics.ticketsPerDay}</span>
          </div>
          {/* Resolution Rate */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <TrendingUp className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">Resolved</span>
            <span className="text-xs font-bold text-stone-400">{stats.resolutionRate}%</span>
          </div>
          {/* AI Replies */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-500/[0.06] border border-stone-500/10">
            <Bot className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] text-white/60">AI Replies</span>
            <span className="text-xs font-bold text-stone-400">{stats.aiReplies}</span>
          </div>
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-xs font-semibold transition-all"
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
                  activeFolder === f.key ? "bg-white/10 text-white/70" : "text-white/50"
                }`}>
                  {folderCounts[f.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-white/[0.06]">
            <Link
              href="/products/email-support"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/50 hover:text-white/60 hover:bg-white/[0.04] transition-all"
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
              <Search className="w-3.5 h-3.5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/50 outline-none focus:border-stone-500/30 transition-colors"
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
                            ? "bg-stone-500/15 border-stone-500/30 text-stone-400"
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
              <div className="flex flex-col items-center justify-center h-full text-white/50 text-xs gap-2">
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
                      ? "bg-stone-500/[0.06] border-l-2 border-l-blue-500"
                      : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-white/50">{ticket.id}</span>
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
                    <span className="text-[10px] text-white/50">{timeAgo(ticket.createdAt)}</span>
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
                        <Bot className="w-2.5 h-2.5 text-stone-400/60" />
                        <span className="text-[9px] text-stone-400/60">
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
                      <span className="text-[10px] text-white/50">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    {selectedTicket.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Tag className="w-3 h-3 text-white/50" />
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-stone-600/20 to-stone-600/20 border border-stone-500/20 text-[11px] font-medium text-stone-300 hover:from-stone-600/30 hover:to-stone-600/30 transition-all disabled:opacity-50"
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
                                    ? "text-stone-400 bg-stone-500/[0.08]"
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
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-400/70 hover:bg-stone-500/[0.06] hover:text-stone-400 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                            </button>
                            <button
                              onClick={() => { updateTicket(selectedTicket.id, { status: "spam" }); setShowActions(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-400/70 hover:bg-stone-500/[0.06] hover:text-stone-400 transition-all"
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
                    <span className="text-[9px] text-white/50">
                      Resolve by: {formatDate(selectedTicket.sla.resolutionDeadline)}
                    </span>
                  )}
                </div>
                {/* Automation Rules */}
                {getAutomationRules(selectedTicket).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {getAutomationRules(selectedTicket).map((rule, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-500/[0.08] border border-stone-500/15 text-[9px] text-stone-400/80">
                        <Zap className="w-2.5 h-2.5" />
                        {rule}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent Collision Warning */}
              {collisionWarning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 py-0 shrink-0"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-500/10 border border-stone-500/20 mt-3">
                    <Eye className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-stone-300 font-medium">
                        <span className="font-bold">{collisionWarning.agentName}</span>
                        {" "}is currently {collisionWarning.action === "replying" ? "drafting a reply to" : "viewing"} this ticket
                      </span>
                      <span className="text-[10px] text-stone-400/60 ml-2">
                        ({Math.round((Date.now() - collisionWarning.lockedAt) / 1000)}s ago)
                      </span>
                    </div>
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400/60 shrink-0" />
                  </div>
                </motion.div>
              )}

              {/* CSAT Survey for Resolved Tickets */}
              {selectedTicket.status === "resolved" && (
                <div className="px-6 pt-3 shrink-0">
                  <div className={`rounded-xl border p-4 ${csatSubmitted ? "bg-stone-500/[0.06] border-stone-500/15" : "bg-stone-500/[0.06] border-stone-500/15"}`}>
                    {csatSubmitted ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= csatRating ? "text-stone-400 fill-stone-400" : "text-white/20"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-stone-400 font-medium">CSAT rating submitted - Thank you!</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-xs font-semibold text-white/80">Customer Satisfaction Survey</span>
                        </div>
                        <p className="text-[10px] text-white/60 mb-3">Rate the resolution quality for this ticket:</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onMouseEnter={() => setCsatHover(star)}
                                onMouseLeave={() => setCsatHover(0)}
                                onClick={() => setCsatRating(star)}
                                className="p-0.5 transition-transform hover:scale-125"
                              >
                                <Star
                                  className={`w-5 h-5 transition-colors ${
                                    star <= (csatHover || csatRating)
                                      ? "text-stone-400 fill-stone-400"
                                      : "text-white/20"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <input
                            value={csatComment}
                            onChange={(e) => setCsatComment(e.target.value)}
                            placeholder="Optional comment..."
                            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[10px] text-white placeholder:text-white/40 outline-none focus:border-stone-500/30 transition-colors"
                          />
                          <button
                            onClick={handleCSATSubmit}
                            disabled={csatRating === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 text-[10px] font-semibold text-white transition-all disabled:opacity-30 hover:from-stone-500 hover:to-stone-500"
                          >
                            <Send className="w-3 h-3" />
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                          ? "bg-white text-gray-800 border border-gray-200"
                          : msg.from === "ai"
                          ? "bg-stone-500/[0.08] border border-stone-500/20"
                          : msg.from === "internal"
                          ? "bg-stone-500/[0.08] border border-stone-500/20 border-dashed"
                          : "bg-stone-500/[0.08] border border-stone-500/20"
                      }`}
                    >
                      {msg.from !== "customer" && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {msg.from === "ai" ? (
                            <>
                              <Sparkles className="w-3 h-3 text-stone-400" />
                              <span className="text-[9px] font-bold text-stone-400">AI Draft</span>
                            </>
                          ) : msg.from === "internal" ? (
                            <>
                              <Lock className="w-3 h-3 text-stone-400" />
                              <span className="text-[9px] font-bold text-stone-400">Internal Note</span>
                              <span className="text-[8px] text-stone-400/50 ml-1">Not visible to customer</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-stone-400" />
                              <span className="text-[9px] font-bold text-stone-400">Agent Reply</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.from === "customer" ? "text-gray-800" : "text-white/90"}`}>{msg.body}</p>
                      <div className={`text-[10px] mt-2 ${msg.from === "customer" ? "text-gray-400" : "text-white/60"}`}>{formatDate(msg.timestamp)}</div>
                    </div>
                    {msg.from !== "customer" && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.from === "ai" ? "bg-stone-500/20" : msg.from === "internal" ? "bg-stone-500/20" : "bg-stone-500/20"
                      }`}>
                        {msg.from === "ai" ? (
                          <Bot className="w-4 h-4 text-stone-400" />
                        ) : msg.from === "internal" ? (
                          <Lock className="w-4 h-4 text-stone-400" />
                        ) : (
                          <UserCircle className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                {aiLoading === selectedTicket.id && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-stone-500/[0.08] border border-stone-500/20">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" />
                        <span className="text-xs text-stone-400/70">AI is drafting a reply...</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-stone-400" />
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
                        showCannedResponses ? "bg-stone-500/10 border-stone-500/20 text-stone-400" : "border-white/[0.06] text-white/60 hover:text-white/60"
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
                          className="absolute left-0 bottom-full mb-1 w-96 bg-gray-900 border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Canned Responses</span>
                            <span className="text-[9px] text-white/40">{CANNED_RESPONSES.length} templates</span>
                          </div>
                          {/* Category Tabs */}
                          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.04] overflow-x-auto">
                            <button
                              onClick={() => setCannedCategory("all")}
                              className={`px-2 py-1 rounded text-[9px] font-medium whitespace-nowrap transition-all ${
                                cannedCategory === "all" ? "bg-stone-500/15 text-stone-400" : "text-white/50 hover:text-white/60"
                              }`}
                            >
                              All
                            </button>
                            {CANNED_RESPONSE_CATEGORIES.map((cat) => (
                              <button
                                key={cat.category}
                                onClick={() => setCannedCategory(cat.category)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium whitespace-nowrap transition-all ${
                                  cannedCategory === cat.category ? "bg-stone-500/15 text-stone-400" : "text-white/50 hover:text-white/60"
                                }`}
                              >
                                <cat.icon className="w-2.5 h-2.5" />
                                {cat.category}
                              </button>
                            ))}
                          </div>
                          {/* Response List */}
                          <div className="max-h-64 overflow-y-auto">
                            {CANNED_RESPONSE_CATEGORIES
                              .filter((cat) => cannedCategory === "all" || cat.category === cannedCategory)
                              .map((cat) => (
                                <div key={cat.category}>
                                  {cannedCategory === "all" && (
                                    <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                                        <cat.icon className="w-2.5 h-2.5" />
                                        {cat.category}
                                      </span>
                                    </div>
                                  )}
                                  {cat.responses.map((resp, i) => (
                                    <button
                                      key={`${cat.category}-${i}`}
                                      onClick={() => { setReplyText(resp.text); setShowCannedResponses(false); setGrammarChecked(false); }}
                                      className="w-full text-left px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all border-b border-white/[0.04] last:border-0"
                                    >
                                      <span className="font-semibold text-white/70 block mb-0.5">{resp.label}</span>
                                      <span className="text-[10px] text-white/50 line-clamp-2">{resp.text}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                      isInternalNote ? "bg-stone-500/15 border-stone-500/25 text-stone-400" : "border-white/[0.06] text-white/60 hover:text-white/60"
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
                      <div className="bg-stone-500/5 border border-stone-500/10 rounded-xl p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-stone-400" />
                            <span className="text-[10px] font-semibold text-stone-300">AI Polish</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${polishResult.score >= 90 ? "bg-stone-500/20 text-stone-400" : "bg-stone-500/20 text-stone-400"}`}>
                              {polishResult.score}/100
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={acceptReplyPolish} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-600/20 text-stone-400 text-[10px] hover:bg-stone-600/30 transition-colors"><Check className="w-2.5 h-2.5" /> Accept</button>
                            <button onClick={() => setPolishResult(null)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-700/50 text-zinc-400 text-[10px] hover:bg-zinc-700 transition-colors"><X className="w-2.5 h-2.5" /> Dismiss</button>
                          </div>
                        </div>
                        {polishResult.changes.length > 0 && (
                          <div className="space-y-0.5 mb-1.5">
                            {polishResult.changes.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-400"><Wand2 className="w-2.5 h-2.5 text-stone-400 mt-0.5 shrink-0" />{c}</div>
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
                    onChange={(e) => { setReplyText(e.target.value); setGrammarChecked(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder={isInternalNote ? "Add an internal note (not visible to customer)..." : "Type a reply..."}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none transition-colors ${
                      isInternalNote
                        ? "bg-stone-500/[0.06] border border-stone-500/20 focus:border-stone-500/40"
                        : "bg-white/[0.05] border border-white/[0.08] focus:border-stone-500/30"
                    }`}
                  />
                  {/* AI Polish Button */}
                  <button
                    onClick={handlePolishReply}
                    disabled={polishing || !replyText.trim()}
                    className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-500/10 border border-transparent hover:border-stone-500/20 transition-all disabled:opacity-30"
                    title="AI Polish — fix grammar & tone"
                  >
                    {polishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={grammarChecking || !replyText.trim()}
                    className={`p-2.5 rounded-xl text-white transition-all disabled:opacity-30 ${
                      isInternalNote
                        ? "bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500"
                        : !grammarChecked && !isInternalNote
                        ? "bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500"
                        : "bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500"
                    }`}
                    title={!grammarChecked && !isInternalNote ? "Click to grammar-check before sending" : "Send reply"}
                  >
                    {grammarChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : isInternalNote ? <Lock className="w-4 h-4" /> : !grammarChecked ? <Shield className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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
                    <button onClick={() => setShowCustomerSidebar(false)} className="p-0.5 rounded hover:bg-white/[0.06] text-white/50 hover:text-white/60 transition-all">
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Avatar & Name */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center text-lg font-bold mb-2">
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
                      <span className="text-[10px] font-bold text-stone-400 bg-stone-500/10 px-1.5 py-0.5 rounded">Pro</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> MRR</span>
                      <span className="text-[10px] font-bold text-stone-400">$49/mo</span>
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
                              <div className="text-[10px] font-mono text-white/50 group-hover:text-white/60">{t.id}</div>
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
                <UserCircle className="w-4 h-4 text-white/50" />
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
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-stone-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">Subject</label>
                  <input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-stone-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block">Message</label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-stone-500/30 transition-colors resize-none"
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
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 text-xs font-semibold text-white transition-all disabled:opacity-30 hover:from-stone-500 hover:to-stone-500"
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
                  <GitMerge className="w-4 h-4 text-stone-400" />
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
                            ? "bg-stone-500/[0.08] border-stone-500/25 ring-1 ring-stone-500/20"
                            : "border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-mono text-white/50">{t.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${statusColors[t.status]}`}>{t.status}</span>
                        </div>
                        <div className="text-xs text-white/60 truncate">{t.subject}</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{t.customerName} - {timeAgo(t.createdAt)}</div>
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
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 text-xs font-semibold text-white transition-all disabled:opacity-30 hover:from-stone-500 hover:to-stone-500"
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
