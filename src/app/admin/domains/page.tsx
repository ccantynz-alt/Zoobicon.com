"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe, RefreshCw, Shield, Clock, Check, AlertCircle,
  ExternalLink, Search, Plus, Copy, Zap, ChevronDown,
} from "lucide-react";

interface Domain {
  id: string;
  domain: string;
  user_email: string;
  status: string;
  registered_at: string;
  expires_at: string;
  auto_renew: boolean;
  privacy_protection: boolean;
  nameservers: string[];
  cloudflare_zone_id?: string;
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAllDomains();
  }, []);

  const fetchAllDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/domains");
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load domains");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  };

  const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  const filtered = filter
    ? domains.filter(d =>
        d.domain.toLowerCase().includes(filter.toLowerCase()) ||
        d.user_email.toLowerCase().includes(filter.toLowerCase())
      )
    : domains;

  const active = filtered.filter(d => d.status === "active").length;
  const pending = filtered.filter(d => d.status === "pending_registration").length;
  const failed = filtered.filter(d => d.status === "failed").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Globe className="w-6 h-6 text-stone-500" />
            Domain Management
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            All registered domains across all customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllDomains}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link
            href="/domains"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-500 hover:bg-stone-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Register New
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-800">{domains.length}</div>
          <div className="text-xs text-slate-700">Total Domains</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="text-2xl font-bold text-stone-600">{active}</div>
          <div className="text-xs text-slate-700">Active</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="text-2xl font-bold text-stone-600">{pending}</div>
          <div className="text-xs text-slate-700">Pending</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="text-2xl font-bold text-stone-600">{failed}</div>
          <div className="text-xs text-slate-700">Failed</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by domain name or customer email..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stone-500/30 focus:border-stone-500 transition-shadow"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 mb-6 text-sm text-stone-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Domain list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-5 h-5 text-stone-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-600 mb-2">
            {domains.length === 0 ? "No domains registered yet" : "No domains match your search"}
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {domains.length === 0 ? "Domains purchased through the platform will appear here." : "Try a different search term."}
          </p>
          {domains.length === 0 && (
            <Link href="/domains" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-500 hover:bg-stone-600 text-white font-semibold text-sm transition-colors">
              <Search className="w-4 h-4" /> Search Domains
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const days = daysUntilExpiry(d.expires_at);
            const isExpiring = days > 0 && days <= 30;
            const isExpired = days <= 0;
            const statusColor = d.status === "active"
              ? isExpired ? "text-red-700" : isExpiring ? "text-amber-700" : "text-emerald-700"
              : d.status === "failed" ? "text-red-700" : "text-slate-600";
            const statusBg = d.status === "active"
              ? isExpired ? "bg-red-50" : isExpiring ? "bg-amber-50" : "bg-emerald-50"
              : d.status === "failed" ? "bg-red-50" : "bg-slate-100";

            return (
              <div key={d.id || d.domain} className="rounded-xl bg-white border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${d.status === "active" ? (isExpired ? "bg-red-500" : isExpiring ? "bg-amber-500" : "bg-emerald-500") : d.status === "failed" ? "bg-red-500" : "bg-slate-400"}`} />
                    <h3 className="text-base font-semibold text-slate-800">{d.domain}</h3>
                    <button onClick={() => copyText(d.domain)} className="text-slate-300 hover:text-slate-500">
                      {copied === d.domain ? <Check className="w-3.5 h-3.5 text-stone-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBg} ${statusColor}`}>
                      {d.status === "active" ? (isExpired ? "Expired" : isExpiring ? `Expires ${days}d` : "Active") : d.status === "failed" ? "Failed" : "Pending"}
                    </span>
                  </div>
                  <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-slate-600 flex items-center gap-1">
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-slate-600">Customer</span>
                    <div className="font-medium text-slate-700 truncate">{d.user_email}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Registered</span>
                    <div className="text-slate-600">{d.registered_at ? new Date(d.registered_at).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Expires</span>
                    <div className="text-slate-600">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Privacy</span>
                    <div className="flex items-center gap-1">
                      {d.privacy_protection ? <><Shield className="w-3 h-3 text-stone-500" /> <span className="text-stone-600">On</span></> : <span className="text-slate-700">Off</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600">Auto-renew</span>
                    <div className="flex items-center gap-1">
                      {d.auto_renew ? <><Clock className="w-3 h-3 text-stone-500" /> <span className="text-stone-600">On</span></> : <span className="text-slate-700">Off</span>}
                    </div>
                  </div>
                </div>

                {d.cloudflare_zone_id && (
                  <div className="mt-2 text-xs text-slate-600">
                    Cloudflare Zone: {d.cloudflare_zone_id}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/builder?prompt=${encodeURIComponent(`Build a website for ${d.domain}`)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 text-stone-700 text-xs font-medium hover:bg-stone-100 border border-stone-200 transition-colors">
                    <Zap className="w-3 h-3" /> Build Website
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
