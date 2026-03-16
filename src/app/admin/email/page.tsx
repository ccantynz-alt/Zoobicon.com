"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mail, Inbox, Send, Trash2, Archive, Search, RefreshCw,
  ChevronLeft, Eye, EyeOff, ArrowLeft, X, Loader2,
  Star, Paperclip,
} from "lucide-react";

interface Email {
  id: string;
  mailbox_address: string;
  from_address: string;
  to_address: string;
  subject: string;
  text_body: string;
  html_body: string;
  received_at: string;
  read: boolean;
  folder: string;
}

type Folder = "inbox" | "sent" | "archive" | "trash";

export default function AdminEmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Array<{
    id: string;
    from_address: string;
    to_address: string;
    subject: string;
    body_text: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [composing, setComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", text: "" });
  const [sending, setSending] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/email/inbox?folder=${folder}&search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setEmails(data.emails || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    }
    setLoading(false);
  }, [folder, search]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const markRead = async (email: Email) => {
    if (email.read) return;
    await fetch("/api/email/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: email.id, read: true }),
    });
    setEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const moveToFolder = async (emailId: string, target: string) => {
    await fetch("/api/email/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emailId, folder: target }),
    });
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
    if (selectedEmail?.id === emailId) setSelectedEmail(null);
  };

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject || !composeData.text) return;
    setSending(true);
    try {
      const res = await fetch("/api/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeData),
      });
      if (res.ok) {
        setComposing(false);
        setComposeData({ to: "", subject: "", text: "" });
      }
    } catch (err) {
      console.error("Failed to send:", err);
    }
    setSending(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const folders: { key: Folder; label: string; icon: typeof Inbox }[] = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "sent", label: "Sent", icon: Send },
    { key: "archive", label: "Archive", icon: Archive },
    { key: "trash", label: "Trash", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <Mail className="w-6 h-6 text-indigo-400" />
            <h1 className="text-lg font-semibold">Email</h1>
            {unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setComposing(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Compose
            </button>
            <button
              onClick={fetchEmails}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex" style={{ height: "calc(100vh - 60px)" }}>
        {/* Sidebar */}
        <div className="w-56 border-r border-gray-800 p-3 flex flex-col gap-1">
          {folders.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setFolder(key);
                setSelectedEmail(null);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                folder === key
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {key === "inbox" && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}

          <div className="mt-6 pt-4 border-t border-gray-800">
            <Link
              href="/admin/support"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Star className="w-4 h-4" />
              <span>Support Tickets</span>
            </Link>
          </div>
        </div>

        {/* Email List */}
        <div
          className={`border-r border-gray-800 flex flex-col ${
            selectedEmail ? "w-80" : "flex-1"
          }`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchEmails()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No emails in {folder}</p>
                <p className="text-sm mt-1">
                  Emails to admin@zoobicon.com will appear here
                </p>
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    markRead(email);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                    selectedEmail?.id === email.id ? "bg-gray-800/70" : ""
                  } ${!email.read ? "bg-gray-900/50" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!email.read && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${
                        email.read ? "text-gray-400" : "text-white font-medium"
                      }`}
                    >
                      {email.from_address}
                    </span>
                    <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
                      {formatDate(email.received_at)}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      email.read ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {email.subject || "(No Subject)"}
                  </p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {email.text_body?.substring(0, 100)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Email Detail / Compose */}
        {composing ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-medium">New Message</h2>
              <button
                onClick={() => setComposing(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
              <input
                type="email"
                placeholder="To"
                value={composeData.to}
                onChange={(e) =>
                  setComposeData((d) => ({ ...d, to: e.target.value }))
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Subject"
                value={composeData.subject}
                onChange={(e) =>
                  setComposeData((d) => ({ ...d, subject: e.target.value }))
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Write your message..."
                value={composeData.text}
                onChange={(e) =>
                  setComposeData((d) => ({ ...d, text: e.target.value }))
                }
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={sending || !composeData.to || !composeData.subject}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : selectedEmail ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-1 hover:bg-gray-800 rounded lg:hidden"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      moveToFolder(selectedEmail.id, "archive")
                    }
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() =>
                      moveToFolder(selectedEmail.id, "trash")
                    }
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={async () => {
                      const newRead = !selectedEmail.read;
                      await fetch("/api/email/inbox", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: selectedEmail.id,
                          read: newRead,
                        }),
                      });
                      setSelectedEmail({ ...selectedEmail, read: newRead });
                      setEmails((prev) =>
                        prev.map((e) =>
                          e.id === selectedEmail.id
                            ? { ...e, read: newRead }
                            : e
                        )
                      );
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title={selectedEmail.read ? "Mark unread" : "Mark read"}
                  >
                    {selectedEmail.read ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <h2 className="text-lg font-medium mb-2">
                {selectedEmail.subject || "(No Subject)"}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-medium text-gray-300">
                  {selectedEmail.from_address}
                </span>
                <span>&rarr;</span>
                <span>{selectedEmail.to_address}</span>
                <span className="ml-auto text-xs">
                  {new Date(selectedEmail.received_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedEmail.html_body ? (
                <div
                  className="prose prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html: selectedEmail.html_body,
                  }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                  {selectedEmail.text_body}
                </pre>
              )}
            </div>
            {/* Quick Reply */}
            <div className="border-t border-gray-800 p-4">
              <button
                onClick={() => {
                  setComposing(true);
                  setComposeData({
                    to: selectedEmail.from_address,
                    subject: `Re: ${selectedEmail.subject}`,
                    text: "",
                  });
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Reply to {selectedEmail.from_address}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
