"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Globe,
  UserPlus,
  Layers,
  Palette,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  ChevronDown,
  ChevronRight,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Mail,
  Shield,
  Eye,
  PaintBucket,
  ArrowLeft,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agency {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  plan: string;
  status: string;
  brand_config: Record<string, string>;
  settings: Record<string, string>;
  member_count?: number;
  client_count?: number;
  site_count?: number;
  user_role?: string;
}

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  site_count: number;
  created_at: string;
}

interface AgencySite {
  id: string;
  name: string;
  slug: string;
  status: string;
  client_id: string;
  client_name: string;
  client_company: string | null;
  assigned_at: string;
  updated_at: string;
}

interface BulkJob {
  id: string;
  status: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  results: Array<{ name: string; status: string; html?: string; error?: string }>;
  created_at: string;
  completed_at: string | null;
}

// ─── Sidebar tabs ────────────────────────────────────────────────────────────

type Tab =
  | "overview"
  | "clients"
  | "sites"
  | "team"
  | "bulk"
  | "branding"
  | "settings";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { key: "clients", label: "Clients", icon: <Users size={18} /> },
  { key: "sites", label: "Sites", icon: <Globe size={18} /> },
  { key: "team", label: "Team", icon: <UserPlus size={18} /> },
  { key: "bulk", label: "Bulk Generate", icon: <Layers size={18} /> },
  { key: "branding", label: "Branding", icon: <Palette size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Shield size={14} />,
  admin: <Shield size={14} />,
  designer: <PaintBucket size={14} />,
  viewer: <Eye size={14} />,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-stone-500/20 text-stone-400",
  admin: "bg-stone-500/20 text-stone-400",
  designer: "bg-stone-500/20 text-stone-400",
  viewer: "bg-gray-500/20 text-gray-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgencyDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Agency state
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [activeAgency, setActiveAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  // Sub-resource state
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<AgencySite[]>([]);
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [generationQuota, setGenerationQuota] = useState<{ current: number; limit: number; remaining: number } | null>(null);

  // Form state
  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", company: "", notes: "" });
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", name: "", role: "designer" });
  const [bulkInput, setBulkInput] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Branding state
  const [brandConfig, setBrandConfig] = useState({
    agencyName: "",
    logoUrl: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  });

  // ─── Auth check ──────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const user = JSON.parse(stored);
        setUserEmail(user.email);
      } else {
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // ─── Load agencies ──────────────────────────────────────────────────────

  const loadAgencies = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/agencies?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setAgencies(data.agencies || []);
      if (data.agencies?.length > 0 && !activeAgency) {
        loadAgencyDetails(data.agencies[0].id);
      }
    } catch (err) {
      console.error("Failed to load agencies:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userEmail) loadAgencies();
  }, [userEmail, loadAgencies]);

  // ─── Load agency details ────────────────────────────────────────────────

  const loadAgencyDetails = async (agencyId: string) => {
    try {
      const res = await fetch(`/api/agencies/${agencyId}`);
      const data = await res.json();
      setActiveAgency(data.agency);

      // Load branding from agency data
      if (data.agency?.brand_config) {
        setBrandConfig({
          agencyName: data.agency.brand_config.agencyName || data.agency.name || "",
          logoUrl: data.agency.brand_config.logoUrl || "",
          primaryColor: data.agency.brand_config.primaryColor || "#3b82f6",
          secondaryColor: data.agency.brand_config.secondaryColor || "#8b5cf6",
          accentColor: data.agency.brand_config.accentColor || "#06b6d4",
        });
      }

      // Load sub-resources in parallel
      const [membersRes, clientsRes, sitesRes, bulkRes] = await Promise.all([
        fetch(`/api/agencies/${agencyId}/members`),
        fetch(`/api/agencies/${agencyId}/clients`),
        fetch(`/api/agencies/${agencyId}/sites`),
        fetch(`/api/agencies/${agencyId}/bulk`),
      ]);

      const [membersData, clientsData, sitesData, bulkData] = await Promise.all([
        membersRes.json(),
        clientsRes.json(),
        sitesRes.json(),
        bulkRes.json(),
      ]);

      setMembers(membersData.members || []);
      setClients(clientsData.clients || []);
      setSites(sitesData.sites || []);
      setBulkJobs(bulkData.jobs || []);

      // Load generation quota
      fetch(`/api/agencies/${agencyId}/generations`)
        .then(r => r.json())
        .then(data => {
          if (data.current !== undefined) {
            setGenerationQuota({ current: data.current, limit: data.limit, remaining: data.remaining });
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error("Failed to load agency details:", err);
    }
  };

  // ─── Actions ────────────────────────────────────────────────────────────

  const createAgency = async () => {
    if (!newAgencyName.trim() || !userEmail) return;
    try {
      const res = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAgencyName, ownerEmail: userEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateAgency(false);
        setNewAgencyName("");
        await loadAgencies();
        loadAgencyDetails(data.agency.id);
      }
    } catch (err) {
      console.error("Failed to create agency:", err);
    }
  };

  const addClient = async () => {
    if (!newClient.name.trim() || !activeAgency) return;
    try {
      const res = await fetch(`/api/agencies/${activeAgency.id}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        setShowAddClient(false);
        setNewClient({ name: "", email: "", company: "", notes: "" });
        loadAgencyDetails(activeAgency.id);
      }
    } catch (err) {
      console.error("Failed to add client:", err);
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!activeAgency) return;
    try {
      await fetch(`/api/agencies/${activeAgency.id}/clients`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      loadAgencyDetails(activeAgency.id);
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const inviteMember = async () => {
    if (!newMember.email.trim() || !activeAgency) return;
    try {
      const res = await fetch(`/api/agencies/${activeAgency.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        setShowInviteMember(false);
        setNewMember({ email: "", name: "", role: "designer" });
        loadAgencyDetails(activeAgency.id);
      }
    } catch (err) {
      console.error("Failed to invite member:", err);
    }
  };

  const removeMember = async (email: string) => {
    if (!activeAgency) return;
    try {
      await fetch(`/api/agencies/${activeAgency.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      loadAgencyDetails(activeAgency.id);
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const startBulkGeneration = async () => {
    if (!bulkInput.trim() || !activeAgency) return;
    const lines = bulkInput
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    const businesses = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        name: parts[0] || "Untitled",
        industry: parts[1] || "General",
        description: parts[2] || "",
      };
    });

    try {
      const res = await fetch(`/api/agencies/${activeAgency.id}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businesses }),
      });
      if (res.ok) {
        setBulkInput("");
        // Reload to see the new job
        loadAgencyDetails(activeAgency.id);
      }
    } catch (err) {
      console.error("Failed to start bulk generation:", err);
    }
  };

  const updateSiteApproval = async (siteId: string, approvalStatus: string) => {
    if (!activeAgency || !userEmail) return;
    try {
      await fetch(`/api/agencies/${activeAgency.id}/sites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, approvalStatus, approvedBy: userEmail }),
      });
      loadAgencyDetails(activeAgency.id);
    } catch (err) {
      console.error("Failed to update site approval:", err);
    }
  };

  const saveBranding = async () => {
    if (!activeAgency) return;
    try {
      await fetch(`/api/agencies/${activeAgency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_config: brandConfig }),
      });
      // Store in localStorage so TopBar and Builder pick up the branding
      localStorage.setItem("zoobicon_agency_brand", JSON.stringify(brandConfig));
      loadAgencyDetails(activeAgency.id);
    } catch (err) {
      console.error("Failed to save branding:", err);
    }
  };

  const deleteAgency = async () => {
    if (!activeAgency) return;
    if (!confirm(`Are you sure you want to delete "${activeAgency.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/agencies/${activeAgency.id}`, { method: "DELETE" });
      setActiveAgency(null);
      loadAgencies();
    } catch (err) {
      console.error("Failed to delete agency:", err);
    }
  };

  // ─── Loading / no agency state ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-500" size={32} />
      </div>
    );
  }

  if (!activeAgency && agencies.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-[#0f2148] border border-white/10 rounded-xl p-8 max-w-md w-full text-center">
          <Building2 className="text-stone-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Create Your Agency</h1>
          <p className="text-white/60 mb-6">
            Set up your agency workspace to manage clients, sites, and team members.
          </p>
          <input
            type="text"
            placeholder="Agency name"
            value={newAgencyName}
            onChange={(e) => setNewAgencyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAgency()}
            className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 mb-4 focus:outline-none focus:border-stone-500"
          />
          <button
            onClick={createAgency}
            disabled={!newAgencyName.trim()}
            className="w-full bg-stone-600 hover:bg-stone-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Create Agency
          </button>
          <Link
            href="/agencies"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/60 mt-4 text-sm transition-colors"
          >
            <ArrowLeft size={14} /> Back to Agencies
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render tabs ────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Clients", value: activeAgency?.client_count ?? clients.length, color: "text-stone-400" },
          { label: "Total Sites", value: activeAgency?.site_count ?? sites.length, color: "text-stone-400" },
          { label: "Team Members", value: activeAgency?.member_count ?? members.length, color: "text-stone-400" },
          {
            label: "Active Deployments",
            value: sites.filter((s) => s.status === "active").length,
            color: "text-stone-400",
          },
          {
            label: "Generations This Month",
            value: generationQuota ? `${generationQuota.current}/${generationQuota.limit === Infinity ? "∞" : generationQuota.limit}` : "—",
            color: generationQuota && generationQuota.remaining <= 5 ? "text-stone-400" : "text-stone-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0f2148] border border-white/10 rounded-xl p-5"
          >
            <p className="text-white/50 text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => { setActiveTab("clients"); setShowAddClient(true); }}
          className="flex items-center gap-3 bg-[#0f2148] border border-white/10 hover:border-stone-500/50 rounded-xl p-4 text-white transition-colors"
        >
          <Plus size={18} className="text-stone-400" />
          <span>Add Client</span>
        </button>
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-3 bg-[#0f2148] border border-white/10 hover:border-stone-500/50 rounded-xl p-4 text-white transition-colors"
        >
          <Globe size={18} className="text-stone-400" />
          <span>Generate Site</span>
        </button>
        <button
          onClick={() => { setActiveTab("team"); setShowInviteMember(true); }}
          className="flex items-center gap-3 bg-[#0f2148] border border-white/10 hover:border-stone-500/50 rounded-xl p-4 text-white transition-colors"
        >
          <UserPlus size={18} className="text-stone-400" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Recent activity */}
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
        Recent Activity
      </h3>
      <div className="bg-[#0f2148] border border-white/10 rounded-xl divide-y divide-white/5">
        {clients.length === 0 && members.length <= 1 && sites.length === 0 ? (
          <p className="p-6 text-white/50 text-center">
            No activity yet. Add your first client or generate a site to get started.
          </p>
        ) : (
          <>
            {clients.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <Users size={16} className="text-stone-400 shrink-0" />
                <span className="text-white/80 text-sm">
                  Client <span className="text-white font-medium">{c.name}</span> added
                </span>
                <span className="ml-auto text-white/50 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {sites.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <Globe size={16} className="text-stone-400 shrink-0" />
                <span className="text-white/80 text-sm">
                  Site <span className="text-white font-medium">{s.name}</span> assigned to{" "}
                  <span className="text-white font-medium">{s.client_name}</span>
                </span>
                <span className="ml-auto text-white/50 text-xs">
                  {new Date(s.assigned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  const renderClients = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Clients</h2>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 bg-stone-600 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Add client form */}
      {showAddClient && (
        <div className="bg-[#0f2148] border border-stone-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">New Client</h3>
            <button onClick={() => setShowAddClient(false)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              placeholder="Client name *"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
            <input
              type="text"
              placeholder="Company"
              value={newClient.company}
              onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
            <input
              type="text"
              placeholder="Notes"
              value={newClient.notes}
              onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
          <button
            onClick={addClient}
            disabled={!newClient.name.trim()}
            className="bg-stone-600 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Add Client
          </button>
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="bg-[#0f2148] border border-white/10 rounded-xl p-8 text-center">
          <Users className="text-white/50 mx-auto mb-3" size={40} />
          <p className="text-white/50">No clients yet. Add your first client to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div key={client.id} className="bg-[#0f2148] border border-white/10 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
              >
                {expandedClient === client.id ? (
                  <ChevronDown size={16} className="text-white/50" />
                ) : (
                  <ChevronRight size={16} className="text-white/50" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{client.name}</p>
                  <p className="text-white/50 text-sm truncate">
                    {client.company || client.email || "No details"}
                  </p>
                </div>
                <span className="text-white/50 text-sm shrink-0">
                  {client.site_count} site{client.site_count !== 1 ? "s" : ""}
                </span>
                <span className="bg-stone-500/20 text-stone-400 text-xs px-2 py-0.5 rounded-full">
                  {client.status}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                  className="text-white/50 hover:text-stone-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {expandedClient === client.id && (
                <div className="border-t border-white/5 p-4 bg-[#12121a]">
                  {client.email && (
                    <p className="text-white/50 text-sm mb-1">
                      <Mail size={13} className="inline mr-1" /> {client.email}
                    </p>
                  )}
                  {client.notes && (
                    <p className="text-white/50 text-sm mb-2">{client.notes}</p>
                  )}
                  <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 mt-3">
                    Sites
                  </h4>
                  {sites.filter((s) => s.client_id === client.id).length === 0 ? (
                    <p className="text-white/50 text-sm">No sites assigned to this client.</p>
                  ) : (
                    <div className="space-y-1">
                      {sites
                        .filter((s) => s.client_id === client.id)
                        .map((site) => (
                          <div
                            key={site.id}
                            className="flex items-center gap-3 bg-[#0a0a12] rounded-lg p-3"
                          >
                            <Globe size={14} className="text-stone-400" />
                            <span className="text-white/80 text-sm flex-1">{site.name}</span>
                            <Link
                              href={`/edit/${site.slug}`}
                              className="text-stone-400 hover:text-stone-300 text-xs"
                            >
                              <Pencil size={14} />
                            </Link>
                            <a
                              href={`https://${site.slug}.zoobicon.sh`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-400 hover:text-stone-300 text-xs"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSites = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">All Sites</h2>
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 bg-stone-600 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Generate New Site
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="bg-[#0f2148] border border-white/10 rounded-xl p-8 text-center">
          <Globe className="text-white/50 mx-auto mb-3" size={40} />
          <p className="text-white/50">
            No sites yet. Generate sites and assign them to clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-[#0f2148] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-[#12121a] relative">
                <Image
                  src={`https://picsum.photos/seed/${site.slug}/400/225`}
                  alt={site.name}
                  className="w-full h-full object-cover opacity-60"
                  fill
                  unoptimized
                />
                <span
                  className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${
                    (site as AgencySite & { approval_status?: string }).approval_status === "published"
                      ? "bg-stone-500/20 text-stone-400"
                      : (site as AgencySite & { approval_status?: string }).approval_status === "approved"
                      ? "bg-stone-500/20 text-stone-400"
                      : (site as AgencySite & { approval_status?: string }).approval_status === "pending_review"
                      ? "bg-stone-500/20 text-stone-400"
                      : (site as AgencySite & { approval_status?: string }).approval_status === "rejected"
                      ? "bg-stone-500/20 text-stone-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {((site as AgencySite & { approval_status?: string }).approval_status || "draft").replace("_", " ")}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium truncate">{site.name}</h3>
                <p className="text-white/50 text-sm mt-1">
                  Client: {site.client_name || "Unassigned"}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Updated {new Date(site.updated_at).toLocaleDateString()}
                </p>

                {/* Approval workflow controls */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {((site as AgencySite & { approval_status?: string }).approval_status === "draft" ||
                    (site as AgencySite & { approval_status?: string }).approval_status === "rejected") && (
                    <button
                      onClick={() => updateSiteApproval(site.id, "pending_review")}
                      className="text-xs px-2.5 py-1 rounded-md bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors"
                    >
                      Submit for Review
                    </button>
                  )}
                  {(site as AgencySite & { approval_status?: string }).approval_status === "pending_review" && (
                    <>
                      <button
                        onClick={() => updateSiteApproval(site.id, "approved")}
                        className="text-xs px-2.5 py-1 rounded-md bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateSiteApproval(site.id, "rejected")}
                        className="text-xs px-2.5 py-1 rounded-md bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(site as AgencySite & { approval_status?: string }).approval_status === "approved" && (
                    <button
                      onClick={() => updateSiteApproval(site.id, "published")}
                      className="text-xs px-2.5 py-1 rounded-md bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`https://${site.slug}.zoobicon.sh`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={12} /> View
                  </a>
                  <Link
                    href={`/edit/${site.slug}`}
                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTeam = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Team Members</h2>
        <button
          onClick={() => setShowInviteMember(true)}
          className="flex items-center gap-2 bg-stone-600 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Invite form */}
      {showInviteMember && (
        <div className="bg-[#0f2148] border border-stone-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Invite Team Member</h3>
            <button onClick={() => setShowInviteMember(false)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input
              type="email"
              placeholder="Email *"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
            <input
              type="text"
              placeholder="Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
            >
              <option value="admin">Admin</option>
              <option value="designer">Designer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            onClick={inviteMember}
            disabled={!newMember.email.trim()}
            className="bg-stone-600 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Send Invite
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="bg-[#0f2148] border border-white/10 rounded-xl divide-y divide-white/5">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-4 p-4">
            <div className="w-9 h-9 rounded-full bg-stone-500/20 flex items-center justify-center text-stone-400 text-sm font-bold shrink-0">
              {(member.name || member.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {member.name || member.email}
              </p>
              <p className="text-white/50 text-sm truncate">{member.email}</p>
            </div>
            <span
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                ROLE_COLORS[member.role] || ROLE_COLORS.viewer
              }`}
            >
              {ROLE_ICONS[member.role]}
              {member.role}
            </span>
            <span className="text-white/50 text-xs shrink-0">
              {member.status === "invited" ? "Invited" : "Joined"}{" "}
              {new Date(member.joined_at || member.invited_at).toLocaleDateString()}
            </span>
            {member.role !== "owner" && (
              <button
                onClick={() => removeMember(member.email)}
                className="text-white/50 hover:text-stone-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBulk = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Bulk Generate</h2>

      <div className="bg-[#0f2148] border border-white/10 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-2">Paste Business List</h3>
        <p className="text-white/50 text-sm mb-4">
          Enter one business per line in the format:{" "}
          <code className="bg-white/5 px-1.5 py-0.5 rounded text-stone-400">
            name, industry, description
          </code>
        </p>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder={`Acme Coffee, Coffee Shop, Artisan coffee shop in downtown Portland\nBright Dental, Dentistry, Family dental practice with modern equipment\nPeak Fitness, Gym, 24/7 fitness center with personal training`}
          rows={8}
          className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 text-sm font-mono focus:outline-none focus:border-stone-500 resize-y"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-white/50 text-sm">
            {bulkInput.trim() ? bulkInput.trim().split("\n").filter((l) => l.trim()).length : 0} businesses
          </span>
          <button
            onClick={startBulkGeneration}
            disabled={!bulkInput.trim()}
            className="flex items-center gap-2 bg-stone-600 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Play size={16} /> Generate All
          </button>
        </div>
      </div>

      {/* Bulk jobs list */}
      {bulkJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
            Previous Jobs
          </h3>
          <div className="space-y-3">
            {bulkJobs.map((job) => (
              <div key={job.id} className="bg-[#0f2148] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  {job.status === "completed" ? (
                    <CheckCircle2 size={18} className="text-stone-400" />
                  ) : job.status === "failed" ? (
                    <XCircle size={18} className="text-stone-400" />
                  ) : job.status === "processing" ? (
                    <Loader2 size={18} className="text-stone-400 animate-spin" />
                  ) : (
                    <Upload size={18} className="text-white/50" />
                  )}
                  <span className="text-white font-medium capitalize">{job.status}</span>
                  <span className="text-white/50 text-sm ml-auto">
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white/50">
                    Total: <span className="text-white">{job.total_count}</span>
                  </span>
                  <span className="text-stone-400/70">
                    Completed: <span className="text-stone-400">{job.completed_count}</span>
                  </span>
                  {job.failed_count > 0 && (
                    <span className="text-stone-400/70">
                      Failed: <span className="text-stone-400">{job.failed_count}</span>
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                {job.status === "processing" && (
                  <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${job.total_count > 0 ? ((job.completed_count + job.failed_count) / job.total_count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBranding = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">White-Label Branding</h2>

      <div className="bg-[#0f2148] border border-white/10 rounded-xl p-5 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1">Agency Display Name</label>
            <input
              type="text"
              value={brandConfig.agencyName}
              onChange={(e) => setBrandConfig({ ...brandConfig, agencyName: e.target.value })}
              placeholder="Your Agency Name"
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Logo URL</label>
            <input
              type="url"
              value={brandConfig.logoUrl}
              onChange={(e) => setBrandConfig({ ...brandConfig, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandConfig.primaryColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandConfig.primaryColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, primaryColor: e.target.value })}
                  className="flex-1 bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandConfig.secondaryColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, secondaryColor: e.target.value })}
                  className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandConfig.secondaryColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, secondaryColor: e.target.value })}
                  className="flex-1 bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandConfig.accentColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, accentColor: e.target.value })}
                  className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandConfig.accentColor}
                  onChange={(e) => setBrandConfig({ ...brandConfig, accentColor: e.target.value })}
                  className="flex-1 bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={saveBranding}
          className="mt-6 bg-stone-600 hover:bg-stone-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Save Branding
        </button>
      </div>

      {/* Preview */}
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
        Preview
      </h3>
      <div className="bg-[#0f2148] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          {brandConfig.logoUrl ? (
            <Image src={brandConfig.logoUrl} alt="Logo" width={32} height={32} className="w-8 h-8 rounded object-cover" unoptimized />
          ) : (
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: brandConfig.primaryColor }}
            >
              {(brandConfig.agencyName || "A")[0]}
            </div>
          )}
          <span className="text-white font-semibold">
            {brandConfig.agencyName || activeAgency?.name || "Your Agency"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {}}
            className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: brandConfig.primaryColor }}
          >
            Primary Button
          </button>
          <button onClick={() => {}}
            className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: brandConfig.secondaryColor }}
          >
            Secondary
          </button>
          <button onClick={() => {}}
            className="text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: brandConfig.accentColor }}
          >
            Accent
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-stone-500/20 text-stone-400 text-xs px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
          <span className="text-white/50 text-sm">Custom domain builder branding</span>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Agency Settings</h2>

      <div className="bg-[#0f2148] border border-white/10 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1">Agency Name</label>
            <input
              type="text"
              value={activeAgency?.name || ""}
              readOnly
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Slug</label>
            <input
              type="text"
              value={activeAgency?.slug || ""}
              readOnly
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Plan</label>
            <span className="inline-block bg-stone-500/20 text-stone-400 text-sm px-3 py-1 rounded-full capitalize">
              {activeAgency?.plan || "starter"}
            </span>
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Owner</label>
            <p className="text-white text-sm">{activeAgency?.owner_email}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#0f2148] border border-stone-500/20 rounded-xl p-5">
        <h3 className="text-stone-400 font-semibold mb-2">Danger Zone</h3>
        <p className="text-white/50 text-sm mb-4">
          Deleting your agency will remove all client associations and team members. Sites themselves will not be deleted.
        </p>
        <button
          onClick={deleteAgency}
          className="flex items-center gap-2 bg-stone-600/20 hover:bg-stone-600/40 text-stone-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-stone-500/30"
        >
          <Trash2 size={16} /> Delete Agency
        </button>
      </div>
    </div>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    overview: renderOverview,
    clients: renderClients,
    sites: renderSites,
    team: renderTeam,
    bulk: renderBulk,
    branding: renderBranding,
    settings: renderSettings,
  };

  // ─── Main layout ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12121a] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/agencies" className="text-white/50 hover:text-white/60 text-xs flex items-center gap-1 mb-3 transition-colors">
            <ArrowLeft size={12} /> Back to Agencies
          </Link>
          {/* Agency selector */}
          {agencies.length > 1 ? (
            <select
              value={activeAgency?.id || ""}
              onChange={(e) => {
                const id = e.target.value;
                if (id) loadAgencyDetails(id);
              }}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-500"
            >
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-stone-400" />
              <span className="text-white font-semibold truncate">
                {activeAgency?.name}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-stone-600/20 text-stone-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowCreateAgency(true)}
            className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm py-2 rounded-lg border border-dashed border-white/10 hover:border-white/30 transition-colors"
          >
            <Plus size={14} /> New Agency
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {tabContent[activeTab]()}
      </main>

      {/* Create agency modal */}
      {showCreateAgency && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0f2148] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">Create New Agency</h3>
            <input
              type="text"
              placeholder="Agency name"
              value={newAgencyName}
              onChange={(e) => setNewAgencyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAgency()}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 mb-4 focus:outline-none focus:border-stone-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateAgency(false); setNewAgencyName(""); }}
                className="text-white/50 hover:text-white text-sm px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAgency}
                disabled={!newAgencyName.trim()}
                className="bg-stone-600 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
