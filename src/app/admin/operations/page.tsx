"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Bot, CheckCircle, ChevronRight,
  Clock, CreditCard, Globe, Heart, Loader2, Play, Pause, RefreshCw,
  Server, Shield, TrendingUp, Users, Zap, XCircle, BarChart3
} from "lucide-react";

// ── Types ──

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: "running" | "idle" | "error" | "paused";
  lastRun?: string;
  nextRun?: string;
  successRate?: number;
  lastError?: string | null;
  scheduleInterval?: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  user_name?: string;
  slug?: string;
  created_at: string;
}

interface HealthResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks?: Record<string, { status: string; message?: string }>;
  timestamp?: string;
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatInterval(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-green-400 animate-pulse",
    idle: "bg-yellow-400",
    error: "bg-red-400",
    paused: "bg-gray-500",
    healthy: "bg-green-400",
    degraded: "bg-yellow-400",
    unhealthy: "bg-red-400",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-500"}`} />;
}

// ── Main Component ──

export default function OperationsPage() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [pausedAgents, setPausedAgents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("paused_agents");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    const [healthRes, agentsRes, activityRes] = await Promise.allSettled([
      fetch("/api/health").then(r => r.json()).catch(() => null),
      fetch("/api/agents").then(r => r.json()).catch(() => ({ agents: [] })),
      fetch("/api/activity?limit=15").then(r => r.json()).catch(() => []),
    ]);

    if (healthRes.status === "fulfilled" && healthRes.value) setHealth(healthRes.value);
    if (agentsRes.status === "fulfilled") {
      const list = agentsRes.value?.agents || [];
      setAgents(list.map((a: AgentInfo) => ({
        ...a,
        status: pausedAgents.has(a.id) ? "paused" : a.status,
      })));
    }
    if (activityRes.status === "fulfilled") {
      setActivity(Array.isArray(activityRes.value) ? activityRes.value : activityRes.value?.activities || []);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, [pausedAgents]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 15_000); return () => clearInterval(i); }, [fetchData]);

  // Agent actions
  const togglePause = (agentId: string) => {
    setPausedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId); else next.add(agentId);
      localStorage.setItem("paused_agents", JSON.stringify([...next]));
      return next;
    });
  };

  const runAgent = async (agentId: string) => {
    setRunningAgent(agentId);
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", agentId }),
      });
    } catch { /* ignore */ }
    setTimeout(() => { setRunningAgent(null); fetchData(); }, 3000);
  };

  const runAllAgents = async () => {
    setRunningAgent("all");
    try {
      await fetch("/api/agents/cron");
    } catch { /* ignore */ }
    setTimeout(() => { setRunningAgent(null); fetchData(); }, 5000);
  };

  const runHealthCheck = async () => {
    setHealth(null);
    try {
      const res = await fetch("/api/health?deep=true");
      setHealth(await res.json());
    } catch { setHealth({ status: "unhealthy" }); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131520] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const healthStatus = health?.status || "unknown";
  const healthColor = healthStatus === "healthy" ? "emerald" : healthStatus === "degraded" ? "yellow" : "red";

  return (
    <div className="min-h-screen bg-[#131520] text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <Link href="/admin" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
            Admin <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Health Banner */}
      <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between ${
        healthColor === "emerald" ? "bg-emerald-500/10 border-emerald-500/20" :
        healthColor === "yellow" ? "bg-yellow-500/10 border-yellow-500/20" :
        "bg-red-500/10 border-red-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <StatusDot status={healthStatus === "healthy" ? "healthy" : healthStatus === "degraded" ? "degraded" : "unhealthy"} />
          <div>
            <span className={`font-semibold ${
              healthColor === "emerald" ? "text-emerald-400" :
              healthColor === "yellow" ? "text-yellow-400" : "text-red-400"
            }`}>
              {healthStatus === "healthy" ? "All Systems Operational" :
               healthStatus === "degraded" ? "Performance Degraded" : "Issues Detected"}
            </span>
            {health?.timestamp && (
              <span className="text-xs text-slate-500 ml-2">Checked {timeAgo(health.timestamp)}</span>
            )}
          </div>
        </div>
        <button onClick={runHealthCheck} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          Run Check
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Agents Active", value: agents.filter(a => a.status !== "paused" && a.status !== "error").length, icon: Bot, color: "indigo" },
          { label: "Agents Total", value: agents.length, icon: Server, color: "slate" },
          { label: "Errors (24h)", value: agents.filter(a => a.lastError).length, icon: AlertTriangle, color: "red" },
          { label: "Success Rate", value: agents.length > 0 ? `${Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / Math.max(agents.length, 1) * 100)}%` : "—", icon: TrendingUp, color: "emerald" },
          { label: "Activity (15m)", value: activity.length, icon: Activity, color: "cyan" },
          { label: "Health", value: healthStatus === "healthy" ? "OK" : healthStatus, icon: Heart, color: healthColor },
        ].map((m, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 text-${m.color}-400`} />
              <span className="text-xs text-slate-400">{m.label}</span>
            </div>
            <div className="text-2xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Control Panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-400" /> Agent Control</h2>
            <button
              onClick={runAllAgents}
              disabled={runningAgent === "all"}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {runningAgent === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run All
            </button>
          </div>
          <div className="space-y-2">
            {agents.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center text-slate-400">
                No agents registered. Check /api/agents endpoint.
              </div>
            ) : agents.map(agent => (
              <div key={agent.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusDot status={agent.status} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{agent.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      {agent.scheduleInterval && <span>Every {formatInterval(agent.scheduleInterval)}</span>}
                      {agent.lastRun && <span>Last: {timeAgo(agent.lastRun)}</span>}
                      {agent.successRate !== undefined && <span>{Math.round(agent.successRate * 100)}% success</span>}
                    </div>
                    {agent.lastError && (
                      <div className="text-xs text-red-400 truncate mt-0.5">{agent.lastError}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => togglePause(agent.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      pausedAgents.has(agent.id) ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                    title={pausedAgents.has(agent.id) ? "Resume" : "Pause"}
                  >
                    {pausedAgents.has(agent.id) ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => runAgent(agent.id)}
                    disabled={runningAgent === agent.id}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors disabled:opacity-50"
                    title="Run Now"
                  >
                    {runningAgent === agent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed + Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400" /> Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Health Check", action: runHealthCheck, icon: Heart },
                { label: "Run All Agents", action: runAllAgents, icon: Bot },
                { label: "Submit Sitemap", action: () => fetch("/api/seo/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: ["https://zoobicon.com/sitemap.xml"] }) }), icon: Globe },
                { label: "Check Intel", action: () => fetch("/api/intel/cron"), icon: Shield },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors text-sm"
                >
                  <btn.icon className="w-4 h-4 text-slate-400" />
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/admin/pre-launch" className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors text-sm">
                <CheckCircle className="w-4 h-4 text-slate-400" /> Pre-Launch
              </Link>
              <Link href="/email-support" className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors text-sm">
                <Bell className="w-4 h-4 text-slate-400" /> Tickets
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" /> Live Activity</h2>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {activity.length === 0 ? (
                <div className="text-sm text-slate-500 p-4 text-center">No recent activity</div>
              ) : activity.map((item, i) => (
                <div key={item.id || i} className="bg-white/[0.02] rounded-lg p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 truncate">{item.description || item.type}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {item.created_at ? timeAgo(item.created_at) : ""}
                    </span>
                  </div>
                  {item.user_name && <div className="text-xs text-slate-500 mt-0.5">{item.user_name}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">Admin Dashboard <ArrowRight className="w-3 h-3" /></Link>
        <Link href="/admin/health" className="hover:text-white transition-colors flex items-center gap-1">Health Details <ArrowRight className="w-3 h-3" /></Link>
        <Link href="/admin/intel" className="hover:text-white transition-colors flex items-center gap-1">Competitive Intel <ArrowRight className="w-3 h-3" /></Link>
        <Link href="/admin/usage" className="hover:text-white transition-colors flex items-center gap-1">Usage Analytics <ArrowRight className="w-3 h-3" /></Link>
        <Link href="/admin/email-settings" className="hover:text-white transition-colors flex items-center gap-1">Email Settings <ArrowRight className="w-3 h-3" /></Link>
      </div>
    </div>
  );
}
