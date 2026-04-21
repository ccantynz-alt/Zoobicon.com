"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  ArrowRight,
  Shield,
  HardDrive,
  User,
  X,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Mailbox {
  id: string;
  address: string;
  domain: string;
  localPart: string;
  displayName: string;
  forwardTo: string | null;
  autoReply: string | null;
  status: "active" | "suspended" | "pending";
  storageUsedMb: number;
  storageLimitMb: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Demo data — shown when the API is unreachable
// ---------------------------------------------------------------------------
const DEMO_MAILBOXES: Mailbox[] = [
  { id: "demo-1", address: "admin@zoobicon.com", domain: "zoobicon.com", localPart: "admin", displayName: "Platform Admin", forwardTo: null, autoReply: null, status: "active", storageUsedMb: 412, storageLimitMb: 1024, userEmail: "admin@zoobicon.com", createdAt: "2025-09-01T10:00:00Z", updatedAt: "2026-03-15T08:30:00Z" },
  { id: "demo-2", address: "support@zoobicon.com", domain: "zoobicon.com", localPart: "support", displayName: "Customer Support", forwardTo: "team@internal.zoobicon.com", autoReply: "Thanks for contacting Zoobicon support! We will reply within 24 hours.", status: "active", storageUsedMb: 780, storageLimitMb: 2048, userEmail: "admin@zoobicon.com", createdAt: "2025-09-01T10:05:00Z", updatedAt: "2026-03-14T17:00:00Z" },
  { id: "demo-3", address: "team@zoobicon.com", domain: "zoobicon.com", localPart: "team", displayName: "Engineering Team", forwardTo: null, autoReply: null, status: "active", storageUsedMb: 256, storageLimitMb: 1024, userEmail: "admin@zoobicon.com", createdAt: "2025-10-12T09:00:00Z", updatedAt: "2026-03-10T11:20:00Z" },
  { id: "demo-4", address: "dev@zoobicon.ai", domain: "zoobicon.ai", localPart: "dev", displayName: "Dev Notifications", forwardTo: "dev-team@zoobicon.com", autoReply: null, status: "active", storageUsedMb: 45, storageLimitMb: 512, userEmail: "admin@zoobicon.com", createdAt: "2025-11-20T14:00:00Z", updatedAt: "2026-02-28T09:00:00Z" },
  { id: "demo-5", address: "sarah@zoobicon.com", domain: "zoobicon.com", localPart: "sarah", displayName: "Sarah Chen", forwardTo: null, autoReply: null, status: "active", storageUsedMb: 102, storageLimitMb: 1024, userEmail: "admin@zoobicon.com", createdAt: "2026-01-05T11:00:00Z", updatedAt: "2026-03-12T16:45:00Z" },
  { id: "demo-6", address: "old-marketing@zoobicon.ai", domain: "zoobicon.ai", localPart: "old-marketing", displayName: "Marketing (Legacy)", forwardTo: null, autoReply: "This mailbox is no longer monitored.", status: "suspended", storageUsedMb: 980, storageLimitMb: 1024, userEmail: "admin@zoobicon.com", createdAt: "2025-08-15T08:00:00Z", updatedAt: "2026-01-31T12:00:00Z" },
];

const DOMAINS = ["zoobicon.com", "zoobicon.ai"] as const;

const STATUS_STYLES: Record<Mailbox["status"], { bg: string; text: string; label: string }> = {
  active: { bg: "bg-stone-500/30", text: "text-stone-300", label: "Active" },
  suspended: { bg: "bg-stone-500/30", text: "text-stone-300", label: "Suspended" },
  pending: { bg: "bg-stone-500/30", text: "text-stone-300", label: "Pending" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function storagePct(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminMailboxesPage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mailbox | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mailbox | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ localPart: "", domain: DOMAINS[0] as string, displayName: "", forwardTo: "" });
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ displayName: "", forwardTo: "", autoReply: "", status: "active" as Mailbox["status"] });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  // ---- Auth ----
  useEffect(() => {
    try {
      const s = localStorage.getItem("zoobicon_user");
      if (s) setUser(JSON.parse(s));
    } catch { /* */ }
  }, []);

  // ---- Fetch ----
  const fetchMailboxes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user?.email) params.set("email", user.email);
      if (domainFilter !== "all") params.set("domain", domainFilter);
      const res = await fetch(`/api/email/mailboxes?${params}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMailboxes(data.mailboxes ?? []);
    } catch {
      // Fallback to demo data
      let demo = DEMO_MAILBOXES;
      if (domainFilter !== "all") demo = demo.filter((m) => m.domain === domainFilter);
      setMailboxes(demo);
    } finally {
      setLoading(false);
    }
  }, [user?.email, domainFilter]);

  useEffect(() => { fetchMailboxes(); }, [fetchMailboxes]);

  // ---- Derived list (search filter) ----
  const filtered = mailboxes.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.address.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q);
  });

  // ---- Create ----
  async function handleCreate() {
    if (!createForm.localPart.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/email/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localPart: createForm.localPart.trim().toLowerCase(),
          domain: createForm.domain,
          displayName: createForm.displayName.trim(),
          forwardTo: createForm.forwardTo.trim() || undefined,
          email: user?.email,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      setCreateOpen(false);
      setCreateForm({ localPart: "", domain: DOMAINS[0], displayName: "", forwardTo: "" });
      fetchMailboxes();
    } catch {
      // Optimistic: add locally
      const now = new Date().toISOString();
      const addr = `${createForm.localPart.trim().toLowerCase()}@${createForm.domain}`;
      setMailboxes((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, address: addr, domain: createForm.domain, localPart: createForm.localPart.trim().toLowerCase(), displayName: createForm.displayName.trim() || createForm.localPart.trim(), forwardTo: createForm.forwardTo.trim() || null, autoReply: null, status: "pending", storageUsedMb: 0, storageLimitMb: 1024, userEmail: user?.email ?? "", createdAt: now, updatedAt: now },
      ]);
      setCreateOpen(false);
      setCreateForm({ localPart: "", domain: DOMAINS[0], displayName: "", forwardTo: "" });
    } finally {
      setCreating(false);
    }
  }

  // ---- Edit ----
  function openEdit(m: Mailbox) {
    setEditTarget(m);
    setEditForm({ displayName: m.displayName, forwardTo: m.forwardTo ?? "", autoReply: m.autoReply ?? "", status: m.status });
  }

  async function handleEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email/mailboxes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxId: editTarget.id,
          displayName: editForm.displayName.trim(),
          forwardTo: editForm.forwardTo.trim() || null,
          autoReply: editForm.autoReply.trim() || null,
          status: editForm.status,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      setEditTarget(null);
      fetchMailboxes();
    } catch {
      // Optimistic local update
      setMailboxes((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? { ...m, displayName: editForm.displayName.trim(), forwardTo: editForm.forwardTo.trim() || null, autoReply: editForm.autoReply.trim() || null, status: editForm.status, updatedAt: new Date().toISOString() }
            : m,
        ),
      );
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  // ---- Toggle status ----
  async function toggleStatus(m: Mailbox) {
    const newStatus = m.status === "active" ? "suspended" : "active";
    try {
      await fetch("/api/email/mailboxes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: m.id, status: newStatus }),
      });
      fetchMailboxes();
    } catch {
      setMailboxes((prev) => prev.map((mb) => (mb.id === m.id ? { ...mb, status: newStatus, updatedAt: new Date().toISOString() } : mb)));
    }
  }

  // ---- Delete ----
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/email/mailboxes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: deleteTarget.id, email: user?.email }),
      });
      setDeleteTarget(null);
      fetchMailboxes();
    } catch {
      setMailboxes((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ---- Render ----
  return (
    <div className="min-h-screen bg-[#0f2148] text-white">
      <BackgroundEffects preset="admin" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f2148]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">Zoobicon</Link>
            <span className="text-white/50">/</span>
            <Link href="/admin" className="text-sm text-white/60 hover:text-white transition-colors">Admin</Link>
            <span className="text-white/50">/</span>
            <span className="text-sm text-white">Mailboxes</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-600 text-xs font-bold">
                  {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                </div>
              </>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="h-6 w-6 text-stone-400" />
              Staff Mailboxes
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Create and manage email addresses for your team
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Mailbox
          </button>
        </div>

        {/* Domain filter tabs + search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-[#111318] p-1 border border-white/10">
            {[{ label: "All", value: "all" }, ...DOMAINS.map((d) => ({ label: d, value: d }))].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDomainFilter(tab.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  domainFilter === tab.value
                    ? "bg-stone-600 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Search by address or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111318] py-2 pl-9 pr-3 text-sm text-white placeholder-white/50 outline-none focus:border-stone-500 transition-colors"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Mail className="h-10 w-10 mb-3" />
            <p className="text-sm">No mailboxes found</p>
          </div>
        )}

        {/* Mailbox grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => {
                const st = STATUS_STYLES[m.status];
                const pct = storagePct(m.storageUsedMb, m.storageLimitMb);
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-white/10 bg-[#111318] p-5 flex flex-col gap-3 hover:border-stone-500/50 transition-colors"
                  >
                    {/* Top row: address + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{m.address}</p>
                        <p className="truncate text-xs text-white/60 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />
                          {m.displayName}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Storage bar */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                        <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> Storage</span>
                        <span>{m.storageUsedMb} / {m.storageLimitMb} MB</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            pct > 90 ? "bg-stone-500" : pct > 70 ? "bg-stone-500" : "bg-stone-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1 text-[11px] text-white/60">
                      {m.forwardTo && (
                        <p className="flex items-center gap-1 truncate">
                          <ArrowRight className="h-3 w-3 text-stone-300" />
                          <span className="text-white/80">Forwards to</span> <span className="text-stone-300">{m.forwardTo}</span>
                        </p>
                      )}
                      {m.autoReply && (
                        <p className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-stone-300" />
                          <span className="text-white/80">Auto-reply enabled</span>
                        </p>
                      )}
                      <p>Created {fmtDate(m.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-1.5 border-t border-white/10 pt-3">
                      <button
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(m)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                          m.status === "active"
                            ? "text-stone-400 hover:bg-stone-500/10"
                            : "text-stone-400 hover:bg-stone-500/10"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {m.status === "active" ? "Suspend" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="ml-auto inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-stone-400 hover:bg-stone-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ================================================================== */}
      {/* CREATE MODAL                                                       */}
      {/* ================================================================== */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            key="create-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              key="create-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-white/10 bg-[#111318] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Mailbox</h2>
                <button onClick={() => setCreateOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Address */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="sarah"
                      value={createForm.localPart}
                      onChange={(e) => setCreateForm((f) => ({ ...f, localPart: e.target.value.replace(/[^a-z0-9._-]/gi, "").toLowerCase() }))}
                      className="flex-1 rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-stone-600"
                    />
                    <span className="flex items-center text-sm text-white/50">@</span>
                    <select
                      value={createForm.domain}
                      onChange={(e) => setCreateForm((f) => ({ ...f, domain: e.target.value }))}
                      className="rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white outline-none focus:border-stone-600"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Display Name</label>
                  <input
                    type="text"
                    placeholder="Sarah Chen"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-stone-600"
                  />
                </div>

                {/* Forward to */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Forward To (optional)</label>
                  <input
                    type="email"
                    placeholder="personal@gmail.com"
                    value={createForm.forwardTo}
                    onChange={(e) => setCreateForm((f) => ({ ...f, forwardTo: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-stone-600"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.localPart.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-500 disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* EDIT MODAL                                                         */}
      {/* ================================================================== */}
      <AnimatePresence>
        {editTarget && (
          <motion.div
            key="edit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditTarget(null)}
          >
            <motion.div
              key="edit-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-white/10 bg-[#111318] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Edit Mailbox</h2>
                  <p className="text-xs text-white/50 mt-0.5">{editTarget.address}</p>
                </div>
                <button onClick={() => setEditTarget(null)} className="text-white/50 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white outline-none focus:border-stone-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Forward To</label>
                  <input
                    type="email"
                    placeholder="team@company.com"
                    value={editForm.forwardTo}
                    onChange={(e) => setEditForm((f) => ({ ...f, forwardTo: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-stone-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Auto-Reply Message</label>
                  <textarea
                    rows={3}
                    placeholder="Optional auto-reply to incoming emails..."
                    value={editForm.autoReply}
                    onChange={(e) => setEditForm((f) => ({ ...f, autoReply: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-stone-600 resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/80">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Mailbox["status"] }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0e1015] px-3 py-2 text-sm text-white outline-none focus:border-stone-600"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setEditTarget(null)}
                  className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* DELETE CONFIRM MODAL                                               */}
      {/* ================================================================== */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              key="delete-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-[#111318] p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-500/20">
                  <AlertTriangle className="h-5 w-5 text-stone-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Delete Mailbox</h2>
                  <p className="text-xs text-white/50">This action cannot be undone</p>
                </div>
              </div>

              <p className="mb-6 text-sm text-white/80">
                Are you sure you want to permanently delete{" "}
                <span className="font-medium text-white">{deleteTarget.address}</span>?
                All emails and data will be lost.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-500 disabled:opacity-50 transition-colors"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
