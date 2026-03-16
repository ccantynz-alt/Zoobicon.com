"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  Eye,
  ArrowLeft,
  Search,
  Loader2,
  Building2,
} from "lucide-react";

interface PortalSite {
  id: string;
  name: string;
  slug: string;
  status: string;
  updated_at: string;
}

interface AgencyBrand {
  agencyName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export default function ClientPortal() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [agencyBrand, setAgencyBrand] = useState<AgencyBrand | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewSite, setPreviewSite] = useState<PortalSite | null>(null);

  // Check for stored session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_client_portal");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.email && data.sites) {
          setEmail(data.email);
          setSites(data.sites);
          setAgencyBrand(data.agencyBrand || null);
          setAuthenticated(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/agencies/portal?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No sites found for this email.");
        setIsLoading(false);
        return;
      }

      setSites(data.sites || []);
      setAgencyBrand(data.agencyBrand || null);
      setAuthenticated(true);

      // Store session
      localStorage.setItem("zoobicon_client_portal", JSON.stringify({
        email: email.trim(),
        sites: data.sites,
        agencyBrand: data.agencyBrand,
      }));
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setSites([]);
    setAgencyBrand(null);
    setEmail("");
    setPreviewSite(null);
    localStorage.removeItem("zoobicon_client_portal");
  };

  const filteredSites = sites.filter((s: PortalSite) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const brandName = agencyBrand?.agencyName || "Client Portal";
  const primaryColor = agencyBrand?.primaryColor || "#3b82f6";

  // Preview mode — full-screen iframe
  if (previewSite) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex flex-col">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#12121a]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewSite(null)}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to sites
            </button>
            <span className="text-white/20">|</span>
            <span className="text-sm text-white font-medium">{previewSite.name}</span>
          </div>
          <a
            href={`https://${previewSite.slug}.zoobicon.sh`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            <ExternalLink size={14} />
            Open Live Site
          </a>
        </header>
        <div className="flex-1">
          <iframe
            src={`/api/hosting/serve/${previewSite.slug}`}
            className="w-full h-full border-0"
            title={previewSite.name}
          />
        </div>
      </div>
    );
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {agencyBrand?.logoUrl ? (
              <img src={agencyBrand.logoUrl} alt="" className="w-12 h-12 rounded-xl mx-auto mb-4 object-cover" />
            ) : (
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${agencyBrand?.secondaryColor || primaryColor})` }}
              >
                <Building2 size={24} />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white mb-2">Client Portal</h1>
            <p className="text-white/50 text-sm">Enter your email to view your websites</p>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-6">
            <label className="block text-sm text-white/60 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="you@company.com"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
              autoFocus
            />

            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || !email.trim()}
              className="w-full mt-4 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </span>
              ) : (
                "View My Sites"
              )}
            </button>
          </div>

          <p className="text-center mt-6 text-white/30 text-xs">
            Contact your agency if you don&apos;t have access.
          </p>
        </div>
      </div>
    );
  }

  // Sites list
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#12121a]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {agencyBrand?.logoUrl ? (
            <img src={agencyBrand.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${agencyBrand?.secondaryColor || primaryColor})` }}
            >
              {brandName[0]}
            </div>
          )}
          <h1 className="text-lg font-bold text-white">{brandName}</h1>
          <span className="text-xs text-white/30 ml-2">Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Your Websites
            <span className="text-white/40 text-sm font-normal ml-2">({sites.length})</span>
          </h2>
          {sites.length > 3 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 w-56"
              />
            </div>
          )}
        </div>

        {filteredSites.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={40} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/40">
              {searchQuery ? "No sites match your search." : "No websites assigned to your account yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all group"
              >
                {/* Site thumbnail via iframe */}
                <div className="relative h-40 bg-white/[0.02] overflow-hidden">
                  <iframe
                    src={`/api/hosting/serve/${site.slug}`}
                    className="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none border-0"
                    title={site.name}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                    <button
                      onClick={() => setPreviewSite(site)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-medium text-sm truncate">{site.name}</h3>
                  <p className="text-white/40 text-xs mt-1 truncate">{site.slug}.zoobicon.sh</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      site.status === "published" ? "bg-green-500/20 text-green-400" :
                      site.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-white/10 text-white/40"
                    }`}>
                      {site.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewSite(site)}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <a
                        href={`https://${site.slug}.zoobicon.sh`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-white transition-colors"
                        title="Open live site"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
