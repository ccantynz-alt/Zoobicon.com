"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wifi, RefreshCw, Globe, Signal, Smartphone, Search,
  TrendingUp, Package, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Loader2, DollarSign,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  dataGB: number;
  validityDays: number;
  price: number;
  currency: string;
  networkType: string;
  countries: string[];
}

interface PlansResponse {
  provider: string;
  count: number;
  plans: Plan[];
}

export default function AdminEsimPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [testPurchase, setTestPurchase] = useState<{
    status: "idle" | "loading" | "success" | "error";
    result?: Record<string, unknown>;
    error?: string;
  }>({ status: "idle" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (!raw) { window.location.href = "/auth/login"; return; }
      const user = JSON.parse(raw);
      if (user.role !== "admin") { window.location.href = "/dashboard"; return; }
      setIsAdmin(true);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/esim/plans");
      const data: PlansResponse = await res.json();
      setPlans(data.plans || []);
      setProvider(data.provider || "unknown");
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchPlans();
  }, [isAdmin, fetchPlans]);

  const handleTestPurchase = async (planId: string) => {
    setTestPurchase({ status: "loading" });
    try {
      const res = await fetch("/api/v1/esim/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email: "test@zoobicon.com" }),
      });
      const data = await res.json();
      if (data.success) {
        setTestPurchase({ status: "success", result: data.esim });
      } else {
        setTestPurchase({ status: "error", error: data.error });
      }
    } catch (err) {
      setTestPurchase({ status: "error", error: String(err) });
    }
  };

  if (!isAdmin) return null;

  // Group plans by destination
  const grouped = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    const key = plan.destination;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  const filteredRegions = Object.entries(grouped).filter(([region]) =>
    !searchFilter || region.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalPlans = plans.length;
  const totalRegions = Object.keys(grouped).length;
  const avgPrice = plans.length > 0
    ? (plans.reduce((sum, p) => sum + p.price, 0) / plans.length).toFixed(2)
    : "0.00";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wifi className="w-6 h-6 text-cyan-400" />
            eSIM Management
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Provider: <span className={`font-mono ${provider === "mock" ? "text-amber-400" : "text-emerald-400"}`}>{provider}</span>
            {provider === "mock" && (
              <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                Mock Mode — add CELITECH_API_KEY to go live
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchPlans}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Plans Available" value={totalPlans} color="cyan" />
        <StatCard icon={Globe} label="Destinations" value={totalRegions} color="purple" />
        <StatCard icon={DollarSign} label="Avg Price" value={`$${avgPrice}`} color="emerald" />
        <StatCard icon={Signal} label="Provider" value={provider} color="amber" />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search destinations..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm
                     placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all"
        />
      </div>

      {/* Plans by Region */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      ) : filteredRegions.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Globe className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No plans found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegions.map(([region, regionPlans]) => (
            <div key={region} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">{region}</span>
                  <span className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
                    {regionPlans.length} plan{regionPlans.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {expandedRegion === region
                  ? <ChevronDown className="w-4 h-4 text-white/30" />
                  : <ChevronRight className="w-4 h-4 text-white/30" />
                }
              </button>

              {expandedRegion === region && (
                <div className="border-t border-white/[0.06]">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[11px] text-white/30 uppercase tracking-wider">
                        <th className="text-left px-5 py-2">Plan</th>
                        <th className="text-left px-3 py-2">Data</th>
                        <th className="text-left px-3 py-2">Validity</th>
                        <th className="text-left px-3 py-2">Network</th>
                        <th className="text-right px-3 py-2">Price</th>
                        <th className="text-right px-5 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {regionPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium">{plan.name}</p>
                            <p className="text-[10px] text-white/25 font-mono">{plan.id}</p>
                          </td>
                          <td className="px-3 py-3 text-sm">{plan.dataGB} GB</td>
                          <td className="px-3 py-3 text-sm text-white/60">{plan.validityDays}d</td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              plan.networkType.includes("5G")
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "bg-white/[0.05] text-white/40"
                            }`}>{plan.networkType}</span>
                          </td>
                          <td className="px-3 py-3 text-sm text-right font-mono text-emerald-400">
                            ${plan.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleTestPurchase(plan.id)}
                              disabled={testPurchase.status === "loading"}
                              className="text-[10px] px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            >
                              Test Purchase
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test Purchase Result */}
      {testPurchase.status !== "idle" && (
        <div className={`mt-6 rounded-2xl border p-5 ${
          testPurchase.status === "success"
            ? "bg-emerald-500/5 border-emerald-500/20"
            : testPurchase.status === "error"
            ? "bg-red-500/5 border-red-500/20"
            : "bg-white/[0.02] border-white/[0.08]"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {testPurchase.status === "loading" && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            {testPurchase.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {testPurchase.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
            <span className="text-sm font-semibold">
              {testPurchase.status === "loading" ? "Processing..." :
               testPurchase.status === "success" ? "Test Purchase Successful" :
               "Purchase Failed"}
            </span>
          </div>
          {testPurchase.result && (
            <pre className="text-xs text-white/50 bg-black/30 rounded-xl p-4 overflow-x-auto">
              {JSON.stringify(testPurchase.result, null, 2)}
            </pre>
          )}
          {testPurchase.error && (
            <p className="text-xs text-red-400">{testPurchase.error}</p>
          )}
          <button
            onClick={() => setTestPurchase({ status: "idle" })}
            className="mt-3 text-xs text-white/30 hover:text-white/50"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/15",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/15",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/15",
  };
  const iconMap: Record<string, string> = {
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-4`}>
      <Icon className={`w-5 h-5 ${iconMap[color]} mb-2`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
