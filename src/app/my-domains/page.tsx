"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe, RefreshCw, Shield, Clock, Check, AlertCircle,
  ExternalLink, Search, Zap, LayoutDashboard, LogOut,
  Plus, Settings, Copy,
} from "lucide-react";

interface Domain {
  id: string;
  domain: string;
  status: string;
  registered_at: string;
  expires_at: string;
  auto_renew: boolean;
  privacy_protection: boolean;
  nameservers: string[];
}

export default function MyDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [copied, setCopied] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<"" | "verifying" | "success" | "error">("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (!raw) { window.location.href = "/auth/login"; return; }
      const parsed = JSON.parse(raw);
      setUser(parsed);

      // If arriving from Stripe checkout, verify the purchase first
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (sessionId) {
        setPurchaseStatus("verifying");
        fetch("/api/domains/verify-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, email: parsed.email }),
        })
          .then(res => res.json())
          .then(data => {
            setPurchaseStatus(data.success ? "success" : "error");
            fetchDomains(parsed);
          })
          .catch(() => {
            setPurchaseStatus("error");
            fetchDomains(parsed);
          });
      } else {
        fetchDomains(parsed);
      }
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const fetchDomains = async (userData: { email: string; role?: string }) => {
    setLoading(true);
    setFetchError("");
    try {
      // Admin sees ALL domains, regular users see only their own
      const url = userData.role === "admin"
        ? "/api/admin/domains"
        : `/api/domains/register?email=${encodeURIComponent(userData.email)}`;
      const res = await fetch(url);
      const data = await res.json();
      setDomains(data.domains || []);
      if (data.error) {
        setFetchError(data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load domains";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  };

  const daysUntilExpiry = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button
              onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} window.location.href = "/auth/login"; }}
              className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Globe className="w-6 h-6 text-stone-400" /> My Domains
            </h1>
            <p className="text-sm text-white/40 mt-1">Manage your registered domains</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => user && fetchDomains(user)} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              href="/domains"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-600 hover:bg-stone-500 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Register New
            </Link>
          </div>
        </div>

        {/* Purchase verification status */}
        {purchaseStatus === "verifying" && (
          <div className="rounded-xl bg-stone-500/10 border border-stone-500/20 p-4 mb-6 flex items-center gap-3 text-sm text-stone-300">
            <RefreshCw className="w-4 h-4 animate-spin" /> Verifying your purchase...
          </div>
        )}
        {purchaseStatus === "success" && (
          <div className="rounded-xl bg-stone-500/10 border border-stone-500/20 p-4 mb-6 flex items-center gap-3 text-sm text-stone-300">
            <Check className="w-4 h-4" /> Purchase verified! Your domains are ready.
          </div>
        )}
        {purchaseStatus === "error" && (
          <div className="rounded-xl bg-stone-500/10 border border-stone-500/20 p-4 mb-6 flex items-center gap-3 text-sm text-stone-300">
            <AlertCircle className="w-4 h-4" /> We&apos;re processing your purchase. Domains may take a moment to appear — try refreshing.
          </div>
        )}

        {/* Database / fetch error */}
        {fetchError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6 flex items-center gap-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fetchError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-5 h-5 text-stone-400 animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No domains yet</h2>
            <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
              Search for your perfect domain and register it in seconds. Your domains will appear here.
            </p>
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 font-semibold text-sm transition-colors"
            >
              <Search className="w-4 h-4" /> Search Domains
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map(d => {
              const days = daysUntilExpiry(d.expires_at);
              const isExpiring = days > 0 && days <= 30;
              const isExpired = days <= 0;

              return (
                <div key={d.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        d.status === "registration_failed" || d.status === "failed" ? "bg-red-500" :
                        d.status === "pending_registration" ? "bg-yellow-500" :
                        isExpired ? "bg-stone-500" : isExpiring ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <h3 className="text-lg font-semibold">{d.domain}</h3>
                      <button onClick={() => copyText(d.domain)} className="text-white/20 hover:text-white/40">
                        {copied === d.domain ? <Check className="w-3.5 h-3.5 text-stone-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${d.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] text-white/30 mb-0.5">Status</div>
                      <div className={`text-xs font-medium flex items-center gap-1 ${
                        d.status === "registration_failed" || d.status === "failed" ? "text-red-400" :
                        d.status === "pending_registration" ? "text-yellow-400" :
                        isExpired ? "text-stone-400" : isExpiring ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {d.status === "registration_failed" || d.status === "failed" ? (
                          <><AlertCircle className="w-3 h-3" /> Registration Failed</>
                        ) : d.status === "pending_registration" ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> Registering...</>
                        ) : isExpired ? (
                          <><AlertCircle className="w-3 h-3" /> Expired</>
                        ) : isExpiring ? (
                          <><Clock className="w-3 h-3" /> Expires in {days}d</>
                        ) : (
                          <><Check className="w-3 h-3" /> Active</>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] text-white/30 mb-0.5">Registered</div>
                      <div className="text-xs text-white/60">{new Date(d.registered_at).toLocaleDateString()}</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] text-white/30 mb-0.5">Expires</div>
                      <div className="text-xs text-white/60">{new Date(d.expires_at).toLocaleDateString()}</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] text-white/30 mb-0.5">Protection</div>
                      <div className="text-xs text-white/60 flex items-center gap-1">
                        {d.privacy_protection ? <><Shield className="w-3 h-3 text-stone-400" /> WHOIS Private</> : "Public"}
                      </div>
                    </div>
                  </div>

                  {/* Auto-renew + Nameservers */}
                  <div className="mt-3 flex items-center justify-between text-xs text-white/30">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Auto-renew: {d.auto_renew ? "On" : "Off"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      NS: {(d.nameservers || []).join(", ") || "Default"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/builder?prompt=${encodeURIComponent(`Build a website for ${d.domain}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-600/20 text-stone-400 text-xs font-medium hover:bg-stone-600/30 transition-colors"
                    >
                      <Zap className="w-3 h-3" /> Build Website
                    </Link>
                    <Link
                      href={`/products/hosting`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-xs font-medium hover:bg-white/[0.08] transition-colors"
                    >
                      <Globe className="w-3 h-3" /> Set Up Hosting
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
