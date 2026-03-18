"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Inbox, Send, Trash2, Search, Star, RefreshCw,
  ChevronLeft, MoreHorizontal, Paperclip, Reply, Forward,
  AlertTriangle, X, Loader2, Plus, CheckSquare, Square,
  Sparkles, Clock, FileText, PenTool, Check, ChevronDown,
  Wand2, RotateCcw, Zap,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

interface Email {
  id: string; mailbox_address: string; from_address: string; to_address: string;
  subject: string; text_body: string; html_body: string; received_at: string;
  read: boolean; folder: string;
}
type Folder = "inbox" | "sent" | "spam" | "trash";

const DEMO_EMAILS: Email[] = [
  { id: "demo-1", mailbox_address: "admin@zoobicon.com", from_address: "sarah@acmecorp.com", to_address: "admin@zoobicon.com", subject: "Partnership Inquiry - Enterprise Plan", text_body: "Hi Zoobicon team,\n\nWe're interested in your enterprise plan for our agency of 50+ clients. Could we schedule a call this week to discuss volume pricing and white-label options?\n\nBest regards,\nSarah Chen\nVP of Digital, Acme Corp", html_body: "", received_at: new Date(Date.now() - 2 * 3600000).toISOString(), read: false, folder: "inbox" },
  { id: "demo-2", mailbox_address: "admin@zoobicon.com", from_address: "noreply@stripe.com", to_address: "admin@zoobicon.com", subject: "Your March payout has been sent", text_body: "Your payout of $4,280.00 has been initiated and should arrive in your bank account within 2 business days.\n\nPayout ID: po_3Ox8kL2eZvKYl2C\nAmount: $4,280.00\nArrival date: March 18, 2026", html_body: "", received_at: new Date(Date.now() - 5 * 3600000).toISOString(), read: false, folder: "inbox" },
  { id: "demo-3", mailbox_address: "admin@zoobicon.com", from_address: "mike@developer.io", to_address: "admin@zoobicon.com", subject: "Bug Report: Multi-page generation timeout", text_body: "Hey,\n\nI'm hitting a timeout error when generating sites with more than 4 pages. The pipeline stalls at the Developer agent phase. Using GPT-4o.\n\nBrowser: Chrome 124, Plan: Pro\n\nMike", html_body: "", received_at: new Date(Date.now() - 86400000).toISOString(), read: true, folder: "inbox" },
  { id: "demo-4", mailbox_address: "admin@zoobicon.com", from_address: "spam@quickloans.biz", to_address: "admin@zoobicon.com", subject: "URGENT: You've been pre-approved!!!", text_body: "Click here to claim your $50,000 loan TODAY! No credit check required!", html_body: "", received_at: new Date(Date.now() - 172800000).toISOString(), read: true, folder: "spam" },
];

const FOLDERS: { key: Folder; label: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "spam", label: "Spam", icon: AlertTriangle },
  { key: "trash", label: "Trash", icon: Trash2 },
];

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy === 1) return "Yesterday";
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(d: string): string {
  return new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminEmailPage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", text: "" });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // AI Polish & Advanced Features
  const [polishing, setPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<{ polished: string; changes: string[]; score: number; tone: string; original: string } | null>(null);
  const [showPolishDiff, setShowPolishDiff] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [signature, setSignature] = useState("");
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [generatingSubject, setGeneratingSubject] = useState(false);

  // Email templates
  const EMAIL_TEMPLATES = [
    { name: "Welcome Reply", subject: "Welcome to Zoobicon!", body: "Hi there,\n\nThank you for reaching out! We're thrilled to have you on board.\n\nIf you have any questions about getting started, don't hesitate to ask. Our team is here to help you build something amazing.\n\nBest regards" },
    { name: "Partnership Response", subject: "Re: Partnership Inquiry", body: "Hi,\n\nThank you for your interest in partnering with Zoobicon. We'd love to explore this opportunity.\n\nCould we schedule a 30-minute call this week to discuss your needs in detail? I'm available Tuesday and Thursday between 10am-4pm EST.\n\nLooking forward to connecting." },
    { name: "Bug Acknowledged", subject: "Re: Bug Report", body: "Hi,\n\nThank you for reporting this issue. Our engineering team has been notified and is looking into it.\n\nWe'll keep you updated on the fix. In the meantime, if you experience any other issues, please don't hesitate to reach out.\n\nAppreciate your patience." },
    { name: "Feature Request", subject: "Re: Feature Request", body: "Hi,\n\nGreat suggestion! We've added this to our product backlog for consideration.\n\nWe prioritize features based on demand and strategic fit. I'll follow up when we have an update on the timeline.\n\nThank you for helping us improve Zoobicon." },
    { name: "Invoice/Billing", subject: "Re: Billing Inquiry", body: "Hi,\n\nThank you for reaching out about your billing question.\n\nI've looked into your account and here's what I found:\n\n[details]\n\nPlease let me know if you need any further clarification." },
  ];

  // Load signature from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoobicon_email_signature");
      if (saved) setSignature(saved);
      else setSignature("Best regards,\nThe Zoobicon Team\nzoobicon.com");
    } catch { /* */ }
  }, []);

  useEffect(() => {
    try { const s = localStorage.getItem("zoobicon_user"); if (s) setUser(JSON.parse(s)); } catch { /* */ }
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    setUsingDemoData(false);
    if (folder === "sent") { setEmails([]); setTotal(0); setLoading(false); return; }
    try {
      const p = new URLSearchParams({ folder, limit: "50", page: "1" });
      if (search) p.set("search", search);
      const res = await fetch(`/api/email/inbox?${p}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API returned ${res.status}`);
      }
      const data = await res.json();
      setEmails(data.emails || []); setTotal(data.total || 0); setUnreadCount(data.unread || 0);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to fetch emails");
      setUsingDemoData(true);
      const filtered = DEMO_EMAILS.filter((e) => {
        if (e.folder !== folder) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return e.subject.toLowerCase().includes(q) || e.from_address.toLowerCase().includes(q) || e.text_body.toLowerCase().includes(q);
      });
      setEmails(filtered); setTotal(filtered.length); setUnreadCount(filtered.filter((e) => !e.read).length);
    }
    setLoading(false);
  }, [folder, search]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const markRead = async (email: Email, read: boolean) => {
    try { await fetch("/api/email/inbox", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: email.id, read }) }); } catch { /* local update */ }
    setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read } : e)));
    if (selectedEmail?.id === email.id) setSelectedEmail({ ...email, read });
    setUnreadCount((c) => Math.max(0, read ? c - 1 : c + 1));
  };

  const moveToFolder = async (emailId: string, target: string) => {
    try { await fetch("/api/email/inbox", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: emailId, folder: target }) }); } catch { /* local */ }
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
    if (selectedEmail?.id === emailId) setSelectedEmail(null);
    setSelected((prev) => { const n = new Set(prev); n.delete(emailId); return n; });
  };

  const handleBulkAction = async (action: "read" | "unread" | "trash" | "spam") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    for (const id of ids) {
      const e = emails.find((x) => x.id === id);
      if (!e) continue;
      if (action === "read") await markRead(e, true);
      else if (action === "unread") await markRead(e, false);
      else await moveToFolder(id, action);
    }
    setSelected(new Set());
  };

  // AI Polish
  const handlePolish = async () => {
    if (!composeData.text.trim()) return;
    setPolishing(true);
    setPolishResult(null);
    try {
      const res = await fetch("/api/email/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: composeData.text, context: "compose" }),
      });
      const data = await res.json();
      if (res.ok && data.polished) {
        setPolishResult(data);
        setShowPolishDiff(true);
      }
    } catch { /* silent */ }
    setPolishing(false);
  };

  const acceptPolish = () => {
    if (polishResult) {
      setComposeData((d) => ({ ...d, text: polishResult.polished }));
      setShowPolishDiff(false);
      setPolishResult(null);
    }
  };

  const rejectPolish = () => {
    setShowPolishDiff(false);
    setPolishResult(null);
  };

  // AI Subject Line Generator
  const generateSubject = async () => {
    if (!composeData.text.trim()) return;
    setGeneratingSubject(true);
    try {
      const res = await fetch("/api/email/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Generate a professional email subject line for this email body. Return JSON with just {"polished": "the subject line", "changes": [], "score": 100, "tone": "professional", "issues": []}:\n\n${composeData.text}`, context: "compose" }),
      });
      const data = await res.json();
      if (res.ok && data.polished) {
        setComposeData((d) => ({ ...d, subject: data.polished }));
      }
    } catch { /* silent */ }
    setGeneratingSubject(false);
  };

  // Save signature
  const saveSignature = () => {
    localStorage.setItem("zoobicon_email_signature", signature);
    setShowSignatureEditor(false);
  };

  // Append signature to email
  const appendSignature = () => {
    if (signature && !composeData.text.endsWith(signature)) {
      setComposeData((d) => ({ ...d, text: d.text + (d.text ? "\n\n" : "") + signature }));
    }
  };

  // Apply template
  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setComposeData((d) => ({
      ...d,
      subject: d.subject || template.subject,
      text: template.body + (signature ? `\n\n${signature}` : ""),
    }));
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject || !composeData.text) return;
    setSending(true);
    try {
      const res = await fetch("/api/email/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: composeData.to, subject: composeData.subject, text: composeData.text, html: `<p>${composeData.text.replace(/\n/g, "<br/>")}</p>` }) });
      if (res.ok) { setSendSuccess(true); setTimeout(() => { setComposing(false); setComposeData({ to: "", subject: "", text: "" }); setSendSuccess(false); }, 1200); }
    } catch { /* silent */ }
    setSending(false);
  };

  const openReply = (e: Email) => {
    setComposing(true);
    setComposeData({ to: e.from_address, subject: e.subject.startsWith("Re:") ? e.subject : `Re: ${e.subject}`, text: "" });
  };
  const openForward = (e: Email) => {
    setComposing(true);
    setComposeData({ to: "", subject: e.subject.startsWith("Fwd:") ? e.subject : `Fwd: ${e.subject}`, text: `\n\n---------- Forwarded message ----------\nFrom: ${e.from_address}\nDate: ${fullDate(e.received_at)}\nSubject: ${e.subject}\n\n${e.text_body}` });
  };

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === emails.length ? new Set() : new Set(emails.map((e) => e.id)));

  return (
    <div className="min-h-screen bg-[#09090f] text-white relative">
      <BackgroundEffects />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 bg-zinc-800/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">Zoobicon</Link>
            <span className="text-zinc-500 hidden sm:inline">/</span>
            <Link href="/admin" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">Admin</Link>
            <span className="text-zinc-500 hidden sm:inline">/</span>
            <span className="text-sm text-zinc-100 hidden sm:inline">Email</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
                <button onClick={() => { localStorage.removeItem("zoobicon_user"); setUser(null); }} className="text-sm text-zinc-500 hover:text-white transition-colors">Sign out</button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{(user.name || user.email || "A").charAt(0).toUpperCase()}</div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</Link>
                <Link href="/builder" className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors">Start Building</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Demo Data Banner — only show when using demo data */}
      {usingDemoData && (
        <div className="relative z-20 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 text-center">
            <strong>DEMO DATA</strong> — {apiError || "Could not connect to email API."}{" "}
            <Link href="/admin/email-settings" className="underline hover:text-amber-200 transition-colors">Set up email →</Link>
          </p>
        </div>
      )}

      {/* Main layout */}
      <div className="relative z-10 max-w-[1440px] mx-auto flex" style={{ height: "calc(100vh - 96px)" }}>
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 top-14 left-0 bottom-0 w-56 bg-zinc-900/95 md:bg-transparent border-r border-white/10 flex flex-col p-3 gap-1 transition-transform duration-200`}>
          <button onClick={() => { setComposing(true); setSidebarOpen(false); }} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-3">
            <Plus className="w-4 h-4" /> Compose
          </button>
          {FOLDERS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setFolder(key); setSelectedEmail(null); setSelected(new Set()); setSidebarOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${folder === key ? "bg-blue-600/15 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"}`}>
              <Icon className="w-4 h-4" /><span className="flex-1 text-left">{label}</span>
              {key === "inbox" && unreadCount > 0 && <span className="text-xs bg-blue-600/25 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">{unreadCount}</span>}
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-white/10">
            <Link href="/admin/support" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors">
              <Star className="w-4 h-4" /> Support Tickets
            </Link>
            <div className="px-3 py-2 text-xs text-zinc-600">admin@zoobicon.com</div>
          </div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Email List */}
        <div className={`flex flex-col border-r border-white/10 ${selectedEmail ? "hidden md:flex md:w-96" : "flex-1"}`}>
          <div className="border-b border-white/10 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5 md:hidden"><Mail className="w-5 h-5 text-zinc-400" /></button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="Search emails..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchEmails()} className="w-full bg-zinc-800/80 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <button onClick={fetchEmails} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-white/5 transition-colors">
                {selected.size > 0 && selected.size === emails.length ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-zinc-500" />}
              </button>
              {selected.size > 0 ? (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                  <span className="text-zinc-400 mr-1">{selected.size} selected</span>
                  <button onClick={() => handleBulkAction("read")} className="px-2 py-1 rounded bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors">Mark read</button>
                  <button onClick={() => handleBulkAction("unread")} className="px-2 py-1 rounded bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors">Mark unread</button>
                  {folder !== "trash" && <button onClick={() => handleBulkAction("trash")} className="px-2 py-1 rounded bg-white/5 text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3 h-3" /></button>}
                  {folder !== "spam" && <button onClick={() => handleBulkAction("spam")} className="px-2 py-1 rounded bg-white/5 text-yellow-400 hover:bg-yellow-500/10 transition-colors"><AlertTriangle className="w-3 h-3" /></button>}
                </motion.div>
              ) : (
                <span className="text-zinc-600">{total > 0 ? `${total} email${total !== 1 ? "s" : ""}` : ""}</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
            ) : folder === "sent" ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500 px-6">
                <Send className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">No sent emails yet</p>
                <p className="text-sm mt-1 text-zinc-600 text-center">Emails you send will appear here in a future update.</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500 px-6">
                <Mail className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">{search ? "No results found" : `No emails in ${folder}`}</p>
                <p className="text-sm mt-1 text-zinc-600 text-center">{search ? "Try a different search term" : "Emails to admin@zoobicon.com will appear here"}</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {emails.map((email) => (
                  <motion.div key={email.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                    <div className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${selectedEmail?.id === email.id ? "bg-blue-600/10" : "hover:bg-white/[0.03]"} ${!email.read ? "bg-white/[0.02]" : ""}`} onClick={() => { setSelectedEmail(email); if (!email.read) markRead(email, true); }}>
                      <button onClick={(ev) => { ev.stopPropagation(); toggleSelect(email.id); }} className="mt-0.5 p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0">
                        {selected.has(email.id) ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-zinc-600" />}
                      </button>
                      <div className="w-2 mt-2 flex-shrink-0">{!email.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm truncate ${email.read ? "text-zinc-400" : "text-white font-semibold"}`}>{email.from_address}</span>
                          <span className="text-xs text-zinc-600 ml-auto flex-shrink-0">{relativeTime(email.received_at)}</span>
                        </div>
                        <p className={`text-sm truncate ${email.read ? "text-zinc-500" : "text-zinc-200 font-medium"}`}>{email.subject || "(No Subject)"}</p>
                        <p className="text-xs text-zinc-600 truncate mt-0.5">{email.text_body?.substring(0, 120)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Email Detail */}
        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div key={selectedEmail.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setSelectedEmail(null)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors md:hidden"><ChevronLeft className="w-5 h-5 text-zinc-400" /></button>
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => openReply(selectedEmail)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Reply"><Reply className="w-4 h-4 text-zinc-400" /></button>
                    <button onClick={() => openForward(selectedEmail)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Forward"><Forward className="w-4 h-4 text-zinc-400" /></button>
                    <button onClick={() => markRead(selectedEmail, !selectedEmail.read)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title={selectedEmail.read ? "Mark unread" : "Mark read"}><Mail className="w-4 h-4 text-zinc-400" /></button>
                    {folder !== "trash" && <button onClick={() => moveToFolder(selectedEmail.id, "trash")} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Trash"><Trash2 className="w-4 h-4 text-zinc-400" /></button>}
                    {folder !== "spam" && <button onClick={() => moveToFolder(selectedEmail.id, "spam")} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Spam"><AlertTriangle className="w-4 h-4 text-zinc-400" /></button>}
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors"><MoreHorizontal className="w-4 h-4 text-zinc-400" /></button>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-zinc-100 mb-3">{selectedEmail.subject || "(No Subject)"}</h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-300 flex-shrink-0">{selectedEmail.from_address.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-200">{selectedEmail.from_address}</span>
                      <span className="text-xs text-zinc-600">{fullDate(selectedEmail.received_at)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">To: {selectedEmail.to_address}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {selectedEmail.html_body ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-300 prose-a:text-blue-400" dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans leading-relaxed">{selectedEmail.text_body}</pre>
                )}
              </div>
              <div className="border-t border-white/10 p-4 flex items-center gap-3">
                <button onClick={() => openReply(selectedEmail)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:bg-white/5 transition-colors"><Reply className="w-4 h-4" /> Reply</button>
                <button onClick={() => openForward(selectedEmail)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:bg-white/5 transition-colors"><Forward className="w-4 h-4" /> Forward</button>
              </div>
            </motion.div>
          ) : (
            !loading && folder !== "sent" && emails.length > 0 && (
              <div className="flex-1 hidden md:flex items-center justify-center">
                <div className="text-center text-zinc-600"><Mail className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="text-sm">Select an email to read</p></div>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {composing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setComposing(false); }}>
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }} className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-zinc-100">New Message</h3>
                <button onClick={() => { setComposing(false); setComposeData({ to: "", subject: "", text: "" }); setSendSuccess(false); }} className="p-1 rounded hover:bg-white/5 transition-colors"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="flex flex-col gap-0 flex-1 overflow-hidden">
                <div className="flex items-center border-b border-white/5 px-4">
                  <label className="text-xs text-zinc-500 w-12">To</label>
                  <input type="email" value={composeData.to} onChange={(e) => setComposeData((d) => ({ ...d, to: e.target.value }))} className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none" placeholder="recipient@example.com" />
                </div>
                <div className="flex items-center border-b border-white/5 px-4">
                  <label className="text-xs text-zinc-500 w-12">Subject</label>
                  <input type="text" value={composeData.subject} onChange={(e) => setComposeData((d) => ({ ...d, subject: e.target.value }))} className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none" placeholder="Subject" />
                </div>
                <textarea value={composeData.text} onChange={(e) => setComposeData((d) => ({ ...d, text: e.target.value }))} placeholder="Write your message..." className="flex-1 min-h-[200px] bg-transparent px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none" />
              </div>
              {/* AI Polish Diff View */}
              <AnimatePresence>
                {showPolishDiff && polishResult && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">AI Polish Suggestions</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${polishResult.score >= 90 ? "bg-green-500/20 text-green-400" : polishResult.score >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                            Score: {polishResult.score}/100
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400">{polishResult.tone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={acceptPolish} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium transition-colors">
                            <Check className="w-3 h-3" /> Accept
                          </button>
                          <button onClick={rejectPolish} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors">
                            <X className="w-3 h-3" /> Dismiss
                          </button>
                        </div>
                      </div>
                      {polishResult.changes.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {polishResult.changes.map((change, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px]">
                              <Wand2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                              <span className="text-zinc-400">{change}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="bg-black/20 rounded-lg p-3 text-xs text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{polishResult.polished}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Attach file"><Paperclip className="w-4 h-4 text-zinc-500" /></button>

                  {/* AI Polish Button */}
                  <button onClick={handlePolish} disabled={polishing || !composeData.text.trim()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all disabled:opacity-30 group" title="AI Polish — fix grammar, tone & clarity">
                    {polishing ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />}
                    <span className="text-xs text-zinc-500 group-hover:text-purple-400 hidden sm:inline">Polish</span>
                  </button>

                  {/* Templates */}
                  <div className="relative">
                    <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors group" title="Email Templates">
                      <FileText className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
                      <span className="text-xs text-zinc-500 group-hover:text-cyan-400 hidden sm:inline">Templates</span>
                    </button>
                    <AnimatePresence>
                      {showTemplates && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                          <div className="px-3 py-2 border-b border-white/10 text-xs font-semibold text-zinc-400">Quick Templates</div>
                          {EMAIL_TEMPLATES.map((t, i) => (
                            <button key={i} onClick={() => applyTemplate(t)} className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                              <span className="text-xs font-medium text-zinc-200">{t.name}</span>
                              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{t.body.substring(0, 60)}...</p>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Signature */}
                  <button onClick={() => setShowSignatureEditor(!showSignatureEditor)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors group" title="Email Signature">
                    <PenTool className="w-4 h-4 text-zinc-500 group-hover:text-green-400" />
                    <span className="text-xs text-zinc-500 group-hover:text-green-400 hidden sm:inline">Signature</span>
                  </button>

                  {/* AI Subject Line */}
                  <button onClick={generateSubject} disabled={generatingSubject || !composeData.text.trim()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors group disabled:opacity-30" title="AI generate subject line">
                    {generatingSubject ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> : <Zap className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />}
                    <span className="text-xs text-zinc-500 group-hover:text-amber-400 hidden sm:inline">Subject</span>
                  </button>

                  {/* Schedule */}
                  <button onClick={() => setScheduling(!scheduling)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors group" title="Schedule send">
                    <Clock className="w-4 h-4 text-zinc-500 group-hover:text-orange-400" />
                    <span className="text-xs text-zinc-500 group-hover:text-orange-400 hidden sm:inline">Schedule</span>
                  </button>
                </div>

                <button onClick={handleSend} disabled={sending || sendSuccess || !composeData.to || !composeData.subject || !composeData.text} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {sendSuccess ? (<><CheckSquare className="w-4 h-4" /> Sent!</>) : sending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>) : (<><Send className="w-4 h-4" /> Send</>)}
                </button>
              </div>

              {/* Signature Editor */}
              <AnimatePresence>
                {showSignatureEditor && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 overflow-hidden">
                    <div className="px-4 py-3 bg-green-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-green-300 flex items-center gap-1.5"><PenTool className="w-3 h-3" /> Email Signature</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={appendSignature} className="text-[10px] px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors">Insert into email</button>
                          <button onClick={saveSignature} className="text-[10px] px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">Save</button>
                        </div>
                      </div>
                      <textarea value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full bg-black/20 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none resize-none h-20" placeholder="Your email signature..." />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Schedule Picker */}
              <AnimatePresence>
                {scheduling && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 overflow-hidden">
                    <div className="px-4 py-3 bg-orange-500/5 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-orange-300 font-medium">Send Later:</span>
                      <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/40" />
                      <span className="text-[10px] text-zinc-500">Email will be queued and sent at the scheduled time</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
