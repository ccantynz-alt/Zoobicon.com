"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Loader2,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Bot,
  Sparkles,
  BookOpen,
  MessageSquare,
  User,
  Zap,
} from "lucide-react";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  from_email: string;
  from_name: string;
  status: string;
  priority: string;
  assignee: string | null;
  tags: string[];
  ai_confidence: number | null;
  ai_auto_replied: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender: string;
  body_text: string;
  body_html: string;
  created_at: string;
}

interface Stats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  ai_handled: number;
}

type StatusFilter = "all" | "open" | "pending" | "resolved";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, pending: 0, resolved: 0, ai_handled: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/email/support?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      setStats(data.stats || { total: 0, open: 0, pending: 0, resolved: 0, ai_handled: 0 });
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/email/support/messages?ticketId=${ticketId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
    setMessagesLoading(false);
  };

  const selectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
    await fetchMessages(ticket.id);
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/email/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          reply: replyText,
          sendToCustomer: true,
        }),
      });
      setReplyText("");
      await fetchMessages(selectedTicket.id);
      await fetchTickets();
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
    setSending(false);
  };

  const generateAIDraft = async () => {
    if (!selectedTicket) return;
    setGeneratingDraft(true);
    try {
      // Get the customer's latest message
      const customerMsg = messages.filter((m) => m.sender === "customer").pop();
      const res = await fetch("/api/email/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          subject: selectedTicket.subject,
          body: customerMsg?.body_text || selectedTicket.subject,
          customerName: selectedTicket.from_name,
          autoSend: false,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setReplyText(data.reply);
      }
      // Refresh messages to show the AI draft
      await fetchMessages(selectedTicket.id);
    } catch (err) {
      console.error("Failed to generate AI draft:", err);
    }
    setGeneratingDraft(false);
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await fetch("/api/email/support", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
    await fetchTickets();
  };

  const updateTicketPriority = async (ticketId: string, priority: string) => {
    await fetch("/api/email/support", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, priority }),
    });
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, priority });
    }
    await fetchTickets();
  };

  const priorityColor: Record<string, string> = {
    urgent: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const statusIcon: Record<string, typeof AlertCircle> = {
    open: AlertCircle,
    pending: Clock,
    resolved: CheckCircle2,
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "open", label: "Open", count: stats.open },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "resolved", label: "Resolved", count: stats.resolved },
  ];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            <h1 className="text-lg font-semibold text-slate-800">Support Dashboard</h1>
            {stats.open > 0 && (
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {stats.open} open
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/support/knowledge"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Knowledge Base
            </Link>
            <Link
              href="/admin/email"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              Email Inbox
            </Link>
            <button
              onClick={fetchTickets}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex" style={{ height: "calc(100vh - 60px)" }}>
        {/* Ticket List */}
        <div className={`border-r border-slate-200 flex flex-col ${selectedTicket ? "w-96" : "flex-1 max-w-2xl"}`}>
          {/* Stats Bar */}
          <div className="p-3 border-b border-slate-200 flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>{stats.ai_handled} AI-handled</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-3 flex gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setSelectedTicket(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.key
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tickets found</p>
                <p className="text-sm mt-1">
                  Emails to support@zoobicon.com create tickets automatically
                </p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const StatusIcon = statusIcon[ticket.status] || AlertCircle;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedTicket?.id === ticket.id ? "bg-slate-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          ticket.status === "open"
                            ? "text-blue-500"
                            : ticket.status === "pending"
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      />
                      <span className="text-xs text-slate-400 font-mono">
                        {ticket.ticket_number}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border ${
                          priorityColor[ticket.priority] || priorityColor.medium
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      {ticket.ai_auto_replied && (
                        <Bot className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-slate-400 ml-auto">
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium truncate">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600 truncate">
                        {ticket.from_name || ticket.from_email}
                      </span>
                      <span className="text-xs text-slate-400">
                        &bull; {ticket.message_count} msgs
                      </span>
                      {ticket.ai_confidence !== null && (
                        <span className="text-xs text-slate-400 ml-auto">
                          AI: {Math.round(ticket.ai_confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col">
            {/* Ticket Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedTicket.ticket_number}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border ${
                      priorityColor[selectedTicket.priority] || priorityColor.medium
                    }`}
                  >
                    {selectedTicket.priority}
                  </span>
                  {selectedTicket.ai_auto_replied && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500">
                      <Bot className="w-3 h-3" /> AI replied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Status buttons */}
                  {(["open", "pending", "resolved"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTicketStatus(selectedTicket.id, s)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedTicket.status === s
                          ? s === "open"
                            ? "bg-blue-50 text-blue-700"
                            : s === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <h2 className="text-lg font-medium text-slate-800 mb-1">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-3.5 h-3.5" />
                <span>{selectedTicket.from_name}</span>
                <span className="text-slate-400">&lt;{selectedTicket.from_email}&gt;</span>
              </div>
              {/* Priority selector */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Priority:</span>
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateTicketPriority(selectedTicket.id, p)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      selectedTicket.priority === p
                        ? priorityColor[p]
                        : "text-slate-400 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-4 ${
                      msg.sender === "customer"
                        ? "bg-slate-50 border border-slate-200"
                        : msg.sender === "ai-draft"
                        ? "bg-indigo-50 border border-indigo-200 ml-8"
                        : msg.sender === "ai"
                        ? "bg-indigo-50 border border-indigo-200 ml-8"
                        : "bg-indigo-50 border border-indigo-200 ml-8"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      {msg.sender === "customer" ? (
                        <>
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-slate-600">
                            {selectedTicket.from_name}
                          </span>
                        </>
                      ) : msg.sender === "ai-draft" ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-indigo-600">AI Draft</span>
                          <span className="text-slate-400">(not sent)</span>
                        </>
                      ) : msg.sender === "ai" ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-indigo-600">
                            Zoe (AI Auto-reply)
                          </span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-indigo-600">Agent</span>
                        </>
                      )}
                      <span className="text-slate-400 ml-auto">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {msg.body_text}
                    </div>
                    {msg.sender === "ai-draft" && (
                      <button
                        onClick={() => setReplyText(msg.body_text || "")}
                        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        Use this draft &rarr;
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Reply Area */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={generateAIDraft}
                  disabled={generatingDraft}
                  className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                >
                  {generatingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate AI draft
                </button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select a ticket to view</p>
              <p className="text-sm mt-2 text-slate-400">
                Emails to support@zoobicon.com automatically create tickets
                <br />
                AI drafts responses and auto-replies when confident
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
