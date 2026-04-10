"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  Sheet,
  Database,
  BookOpen,
  MessageSquare,
  CreditCard,
  GitFork,
  Layers,
  Mail,
  BarChart3,
  Zap,
  X,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  Shield,
  Bell,
  Plug,
  ChevronRight,
  Calendar,
  User,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type IntegrationStatus = "connected" | "not_connected" | "coming_soon";
type ConnectMethod = "oauth" | "api_key" | "webhook";

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;       // accent color for left border
  bgColor: string;     // light bg for icon area
  status: IntegrationStatus;
  method: ConnectMethod;
  link?: string;       // for already-connected items
  connectedAccount?: string;
  connectedAt?: string;
  fields?: { label: string; placeholder: string; key: string }[];
  webhookUrl?: string;
}

// ---------------------------------------------------------------------------
// Integration definitions
// ---------------------------------------------------------------------------
const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Import content and data from spreadsheets into site generation.",
    icon: Sheet,
    color: "#34A853",
    bgColor: "rgba(52,168,83,0.1)",
    status: "not_connected",
    method: "oauth",
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Pull structured data from Airtable bases for dynamic sites.",
    icon: Database,
    color: "#18BFFF",
    bgColor: "rgba(24,191,255,0.1)",
    status: "not_connected",
    method: "api_key",
    fields: [{ label: "API Key", placeholder: "pat...", key: "apiKey" }],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Import page content and databases as site content.",
    icon: BookOpen,
    color: "#FFFFFF",
    bgColor: "rgba(255,255,255,0.08)",
    status: "not_connected",
    method: "oauth",
  },
  {
    id: "slack",
    name: "Hash",
    description: "Receive build notifications and deploy alerts in your channels.",
    icon: MessageSquare,
    color: "#E01E5A",
    bgColor: "rgba(224,30,90,0.1)",
    status: "not_connected",
    method: "oauth",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing for subscriptions and one-time purchases.",
    icon: CreditCard,
    color: "#635BFF",
    bgColor: "rgba(99,91,255,0.1)",
    status: "connected",
    method: "oauth",
    link: "/admin/usage",
    connectedAccount: "acct_1abc...xyz",
    connectedAt: "2025-11-14",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Export projects and import repositories for AI-assisted building.",
    icon: GitFork,
    color: "#FFFFFF",
    bgColor: "rgba(255,255,255,0.08)",
    status: "connected",
    method: "oauth",
    link: "/builder",
    connectedAccount: "zoobicon-org",
    connectedAt: "2025-12-02",
  },
  {
    id: "figma",
    name: "Layers",
    description: "Import Layers designs and convert them to production HTML.",
    icon: Layers,
    color: "#A259FF",
    bgColor: "rgba(162,89,255,0.1)",
    status: "connected",
    method: "oauth",
    link: "/builder",
    connectedAccount: "Zoobicon Team",
    connectedAt: "2026-01-10",
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Transactional email service for support tickets and notifications.",
    icon: Mail,
    color: "#F06B54",
    bgColor: "rgba(240,107,84,0.1)",
    status: "connected",
    method: "api_key",
    connectedAccount: "mg.zoobicon.com",
    connectedAt: "2025-10-28",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Inject GA4 tracking snippets into every generated site.",
    icon: BarChart3,
    color: "#F9AB00",
    bgColor: "rgba(249,171,0,0.1)",
    status: "not_connected",
    method: "api_key",
    fields: [{ label: "Measurement ID", placeholder: "G-XXXXXXXXXX", key: "measurementId" }],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5,000+ apps via webhooks for automated workflows.",
    icon: Zap,
    color: "#FF4A00",
    bgColor: "rgba(255,74,0,0.1)",
    status: "not_connected",
    method: "webhook",
    webhookUrl: "https://hooks.zoobicon.com/zapier/wh_" + Math.random().toString(36).slice(2, 10),
  },
];

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: IntegrationStatus }) {
  const map = {
    connected: { label: "Connected", bg: "bg-stone-500/20", text: "text-stone-400", dot: "bg-stone-400" },
    not_connected: { label: "Not Connected", bg: "bg-white/5", text: "text-white/70", dot: "bg-white/30" },
    coming_soon: { label: "Coming Soon", bg: "bg-stone-500/20", text: "text-stone-400", dot: "bg-stone-400" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Connect Modal
// ---------------------------------------------------------------------------
function ConnectModal({
  integration,
  onClose,
  onConnect,
}: {
  integration: IntegrationDef;
  onClose: () => void;
  onConnect: (config: Record<string, string>) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const Icon = integration.icon;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#111318] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: integration.bgColor }}
            >
              <Icon className="w-5 h-5" style={{ color: integration.color }} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Connect {integration.name}</h3>
              <p className="text-white/70 text-xs">{integration.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OAuth method */}
        {integration.method === "oauth" && (
          <div className="space-y-4">
            <p className="text-white/85 text-sm">
              Click below to authorize Zoobicon to access your {integration.name} account. You will be
              redirected to {integration.name} to grant permissions.
            </p>
            <button
              onClick={() => onConnect({})}
              className="w-full py-3 rounded-xl font-medium text-white transition-all hover:brightness-110"
              style={{ backgroundColor: integration.color === "#FFFFFF" ? "#6366f1" : integration.color }}
            >
              Connect with {integration.name}
            </button>
          </div>
        )}

        {/* API Key method */}
        {integration.method === "api_key" && (
          <div className="space-y-4">
            {(integration.fields || []).map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-white/85 mb-1.5">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={fields[f.key] || ""}
                  onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#111318] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
                />
              </div>
            ))}
            <button
              onClick={() => onConnect(fields)}
              disabled={integration.fields?.some((f) => !fields[f.key])}
              className="w-full py-3 rounded-xl font-medium text-white bg-stone-600 hover:bg-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Save & Connect
            </button>
          </div>
        )}

        {/* Webhook method */}
        {integration.method === "webhook" && (
          <div className="space-y-4">
            <p className="text-white/85 text-sm">
              Copy the webhook URL below and paste it into your {integration.name} setup. Zoobicon will
              send events to this endpoint.
            </p>
            <div className="flex items-center gap-2 bg-[#111318] border border-white/10 rounded-xl p-3">
              <code className="text-sm text-stone-400 flex-1 truncate">{integration.webhookUrl}</code>
              <button
                onClick={() => handleCopy(integration.webhookUrl || "")}
                className="text-white/70 hover:text-white transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => onConnect({ webhookUrl: integration.webhookUrl || "" })}
              className="w-full py-3 rounded-xl font-medium text-white bg-stone-600 hover:bg-stone-500 transition-all"
            >
              Mark as Connected
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function IntegrationsPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationDef[]>(INTEGRATIONS);
  const [connectModal, setConnectModal] = useState<IntegrationDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // -- Auth check --
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const u = JSON.parse(raw);
        setUserName(u.name || u.email || "User");
        setUserEmail(u.email || "");
      }
    } catch {
      // ignore
    }
  }, []);

  // -- Fetch saved integrations --
  const fetchIntegrations = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/integrations?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        const saved: { service: string; config: Record<string, string>; connectedAt: string }[] =
          data.integrations || [];
        // Merge saved state into definitions
        setIntegrations((prev) =>
          prev.map((def) => {
            const match = saved.find((s) => s.service === def.id);
            if (match) {
              return {
                ...def,
                status: "connected" as IntegrationStatus,
                connectedAt: match.connectedAt?.slice(0, 10) || def.connectedAt,
                connectedAccount: match.config?.account || def.connectedAccount || "Connected",
              };
            }
            return def;
          }),
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // -- Show notification --
  const flash = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // -- Connect handler --
  const handleConnect = async (integration: IntegrationDef, config: Record<string, string>) => {
    setConnectModal(null);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: integration.id, config: { ...config, account: integration.name }, email: userEmail }),
      });
      if (res.ok) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === integration.id
              ? { ...i, status: "connected" as IntegrationStatus, connectedAt: new Date().toISOString().slice(0, 10), connectedAccount: integration.name + " Account" }
              : i,
          ),
        );
        flash(`${integration.name} connected successfully`);
      } else {
        flash(`Failed to connect ${integration.name}`, "error");
      }
    } catch {
      flash(`Failed to connect ${integration.name}`, "error");
    }
  };

  // -- Disconnect handler --
  const handleDisconnect = async (integration: IntegrationDef) => {
    try {
      const res = await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: integration.id, email: userEmail }),
      });
      if (res.ok) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === integration.id
              ? { ...i, status: "not_connected" as IntegrationStatus, connectedAt: undefined, connectedAccount: undefined }
              : i,
          ),
        );
        flash(`${integration.name} disconnected`);
      }
    } catch {
      flash(`Failed to disconnect ${integration.name}`, "error");
    }
  };

  const connected = integrations.filter((i) => i.status === "connected");
  const available = integrations.filter((i) => i.status !== "connected");

  return (
    <div className="min-h-screen bg-[#131520] text-white">
      <BackgroundEffects preset="admin" />

      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${
              notification.type === "success"
                ? "bg-stone-600/90 text-white"
                : "bg-stone-600/90 text-white"
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#131520]/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              Zoobicon
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm text-white/70">
              <Link href="/admin" className="hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#111318]">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white px-3 py-1.5">Integrations</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userName && (
              <span className="text-sm text-white/70 hidden sm:block">
                <User className="w-3.5 h-3.5 inline mr-1" />
                {userName}
              </span>
            )}
            <Link href="/admin" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#111318]">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-stone-600/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-stone-400" />
            </div>
            <h1 className="text-3xl font-bold">Integrations</h1>
          </div>
          <p className="text-white/70 max-w-2xl">
            Connect third-party services to enhance your AI website builder. Import data, receive
            notifications, track analytics, and automate workflows.
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Total Available", value: integrations.length, color: "text-white" },
            { label: "Connected", value: connected.length, color: "text-stone-400" },
            { label: "Not Connected", value: available.filter((i) => i.status === "not_connected").length, color: "text-white/70" },
            { label: "Coming Soon", value: available.filter((i) => i.status === "coming_soon").length, color: "text-stone-400" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#111318]/60 border border-white/10 rounded-xl p-4 text-center"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Connected Section */}
        {connected.length > 0 && (
          <>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-semibold mb-4 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-stone-400" />
              Connected Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
              {connected.map((integration, idx) => {
                const Icon = integration.icon;
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.04 }}
                    className="relative bg-[#111318]/60 border border-white/10 rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
                    style={{ borderLeftWidth: 3, borderLeftColor: integration.color }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: integration.bgColor }}
                          >
                            <Icon className="w-5 h-5" style={{ color: integration.color }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{integration.name}</h3>
                            <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{integration.description}</p>
                          </div>
                        </div>
                        <StatusBadge status="connected" />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
                        {integration.connectedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {integration.connectedAt}
                          </span>
                        )}
                        {integration.connectedAccount && (
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3" />
                            {integration.connectedAccount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {integration.link && (
                          <Link
                            href={integration.link}
                            className="flex-1 text-center py-2 rounded-xl text-sm font-medium bg-[#111318] hover:bg-white/15 text-white transition-all flex items-center justify-center gap-1.5"
                          >
                            Configure <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDisconnect(integration)}
                          className="flex-1 text-center py-2 rounded-xl text-sm font-medium bg-stone-600/10 text-stone-400 hover:bg-stone-600/20 transition-all"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Available Section */}
        {available.length > 0 && (
          <>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-lg font-semibold mb-4 flex items-center gap-2"
            >
              <Plug className="w-4 h-4 text-white/70" />
              Available Integrations
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
              {available.map((integration, idx) => {
                const Icon = integration.icon;
                const isSoon = integration.status === "coming_soon";
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.04 }}
                    className="relative bg-[#111318]/60 border border-white/10 rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
                    style={{ borderLeftWidth: 3, borderLeftColor: isSoon ? "#f59e0b" : integration.color }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: integration.bgColor }}
                          >
                            <Icon className="w-5 h-5" style={{ color: integration.color }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{integration.name}</h3>
                            <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{integration.description}</p>
                          </div>
                        </div>
                        <StatusBadge status={integration.status} />
                      </div>

                      <div className="mt-4">
                        {isSoon ? (
                          <button onClick={() => {}} className="w-full py-2.5 rounded-xl text-sm font-medium bg-stone-600/10 text-stone-400 hover:bg-stone-600/20 transition-all flex items-center justify-center gap-2">
                            <Bell className="w-3.5 h-3.5" />
                            Notify Me
                          </button>
                        ) : (
                          <button
                            onClick={() => setConnectModal(integration)}
                            className="w-full py-2.5 rounded-xl text-sm font-medium bg-stone-600/20 text-stone-400 hover:bg-stone-600/30 transition-all"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectModal && (
          <ConnectModal
            integration={connectModal}
            onClose={() => setConnectModal(null)}
            onConnect={(config) => handleConnect(connectModal, config)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
