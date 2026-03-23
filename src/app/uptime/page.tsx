'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Clock,
  Globe, Shield, Bell, Plus, ArrowRight, Settings, Pause,
  RefreshCw, ExternalLink, Lock, Wifi, Server, Zap
} from 'lucide-react';

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  uptime90: number;
  responseTime: number;
  responseTimes: number[];
  lastCheck: string;
  uptimeBars: ('up' | 'down' | 'degraded' | 'none')[];
  sslExpiry?: string;
  sslDays?: number;
}

const MONITORS: Monitor[] = [
  {
    id: '1', name: 'Zoobicon.com', url: 'https://zoobicon.com', status: 'up', uptime90: 99.98, responseTime: 142,
    responseTimes: [145, 138, 152, 140, 135, 148, 142, 139, 155, 141, 137, 144, 142, 138, 150, 143, 136, 147, 140, 142],
    lastCheck: '12s ago', sslExpiry: 'Aug 15, 2026', sslDays: 145,
    uptimeBars: Array(90).fill('up').map((_, i) => i === 47 ? 'degraded' : 'up'),
  },
  {
    id: '2', name: 'API Gateway', url: 'https://api.zoobicon.com', status: 'up', uptime90: 99.95, responseTime: 89,
    responseTimes: [92, 85, 95, 88, 91, 87, 89, 93, 86, 90, 88, 94, 89, 87, 91, 85, 93, 88, 90, 89],
    lastCheck: '12s ago', sslExpiry: 'Aug 15, 2026', sslDays: 145,
    uptimeBars: Array(90).fill('up').map((_, i) => i === 32 || i === 33 ? 'degraded' : i === 71 ? 'down' : 'up'),
  },
  {
    id: '3', name: 'Builder App', url: 'https://zoobicon.com/builder', status: 'up', uptime90: 99.99, responseTime: 210,
    responseTimes: [215, 208, 220, 205, 212, 218, 207, 210, 225, 209, 213, 206, 210, 219, 208, 214, 211, 207, 216, 210],
    lastCheck: '12s ago', sslExpiry: 'Aug 15, 2026', sslDays: 145,
    uptimeBars: Array(90).fill('up'),
  },
  {
    id: '4', name: 'Hosting CDN', url: 'https://cdn.zoobicon.sh', status: 'degraded', uptime90: 99.87, responseTime: 342,
    responseTimes: [180, 175, 190, 310, 420, 380, 350, 340, 380, 342, 355, 320, 290, 340, 360, 310, 342, 330, 345, 342],
    lastCheck: '12s ago', sslExpiry: 'Jul 1, 2026', sslDays: 100,
    uptimeBars: Array(90).fill('up').map((_, i) => i >= 85 ? 'degraded' : i === 44 ? 'down' : 'up'),
  },
  {
    id: '5', name: 'Database (Neon)', url: 'https://db.zoobicon.com', status: 'up', uptime90: 99.96, responseTime: 45,
    responseTimes: [48, 42, 50, 44, 46, 43, 45, 49, 41, 47, 44, 46, 45, 43, 48, 42, 50, 44, 46, 45],
    lastCheck: '12s ago', sslExpiry: 'Sep 20, 2026', sslDays: 181,
    uptimeBars: Array(90).fill('up').map((_, i) => i === 18 ? 'down' : 'up'),
  },
  {
    id: '6', name: 'Stripe Webhooks', url: 'https://zoobicon.com/api/stripe/webhook', status: 'up', uptime90: 100.0, responseTime: 78,
    responseTimes: [80, 75, 82, 77, 79, 76, 78, 81, 74, 79, 77, 80, 78, 76, 82, 75, 79, 78, 77, 78],
    lastCheck: '12s ago', sslExpiry: 'Aug 15, 2026', sslDays: 145,
    uptimeBars: Array(90).fill('up') as ('up' | 'down' | 'degraded' | 'none')[],
  },
];

const INCIDENT_LOG = [
  { date: 'Mar 18, 2026', title: 'CDN latency spike', status: 'investigating', monitors: ['Hosting CDN'], duration: 'Ongoing' },
  { date: 'Feb 24, 2026', title: 'API Gateway 502 errors', status: 'resolved', monitors: ['API Gateway'], duration: '4 min' },
  { date: 'Feb 3, 2026', title: 'Database connection pool exhaustion', status: 'resolved', monitors: ['Database (Neon)'], duration: '8 min' },
  { date: 'Jan 15, 2026', title: 'CDN cache purge delay', status: 'resolved', monitors: ['Hosting CDN'], duration: '22 min' },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function UptimeBars({ bars }: { bars: ('up' | 'down' | 'degraded' | 'none')[] }) {
  return (
    <div className="flex gap-px">
      {bars.map((b, i) => (
        <div key={i} className={`w-1 h-6 rounded-sm ${b === 'up' ? 'bg-green-500' : b === 'down' ? 'bg-red-500' : b === 'degraded' ? 'bg-yellow-500' : 'bg-white/10'}`}
          title={`Day ${90 - i}: ${b}`} />
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'up') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
  if (status === 'down') return <XCircle className="w-5 h-5 text-red-400" />;
  return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
}

export default function UptimePage() {
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitors' | 'incidents' | 'ssl'>('monitors');

  const allUp = MONITORS.every(m => m.status === 'up');
  const degraded = MONITORS.some(m => m.status === 'degraded');
  const avgUptime = (MONITORS.reduce((a, m) => a + m.uptime90, 0) / MONITORS.length).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Uptime Monitor</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAlerts(!showAlerts)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative">
              <Bell className="w-4 h-4" />
              {degraded && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-500" />}
            </button>
            <button onClick={() => setShowAddMonitor(!showAddMonitor)} className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Monitor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Status Banner */}
        <div className={`p-6 rounded-xl border mb-8 ${allUp ? 'border-green-500/30 bg-green-500/10' : degraded ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className="flex items-center gap-3">
            {allUp ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : degraded ? <AlertTriangle className="w-8 h-8 text-yellow-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
            <div>
              <h2 className="text-xl font-bold">{allUp ? 'All Systems Operational' : degraded ? 'Partial System Degradation' : 'System Outage Detected'}</h2>
              <p className="text-sm text-gray-400">Last checked 12 seconds ago &middot; {avgUptime}% average uptime over 90 days</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Monitors', value: MONITORS.length.toString(), icon: Server },
            { label: 'Avg Response', value: `${Math.round(MONITORS.reduce((a, m) => a + m.responseTime, 0) / MONITORS.length)}ms`, icon: Zap },
            { label: 'Incidents (90d)', value: INCIDENT_LOG.length.toString(), icon: AlertTriangle },
            { label: 'SSL Certs', value: `${MONITORS.filter(m => m.sslDays).length} tracked`, icon: Lock },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <s.icon className="w-5 h-5 text-green-400 mb-2" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add Monitor Form */}
        {showAddMonitor && (
          <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/5 mb-8 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Plus className="w-5 h-5 text-green-400" /> Add New Monitor</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Monitor name" className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
              <input placeholder="https://example.com" className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
              <select className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option>Check every 1 minute</option><option>Check every 5 minutes</option><option>Check every 15 minutes</option>
              </select>
              <select className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option>Alert via Email</option><option>Alert via Slack</option><option>Alert via SMS</option><option>Alert via Webhook</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-500 transition-colors">Create Monitor</button>
              <button onClick={() => setShowAddMonitor(false)} className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Alert Config */}
        {showAlerts && (
          <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 mb-8 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-400" /> Alert Configuration</h3>
            <div className="space-y-3">
              {['Email (team@zoobicon.com)', 'Slack (#ops-alerts)', 'PagerDuty (On-call rotation)', 'Webhook (POST to custom URL)'].map((ch, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-sm">{ch}</span>
                  <div className={`w-10 h-5 rounded-full ${i < 2 ? 'bg-green-500' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${i < 2 ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
          {[
            { id: 'monitors' as const, label: 'Monitors', icon: Activity },
            { id: 'incidents' as const, label: 'Incidents', icon: AlertTriangle },
            { id: 'ssl' as const, label: 'SSL Certificates', icon: Lock },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Monitors List */}
        {activeTab === 'monitors' && (
          <div className="space-y-4">
            {MONITORS.map(m => (
              <div key={m.id} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <StatusIcon status={m.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{m.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.status === 'up' ? 'bg-green-500/20 text-green-400' : m.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{m.url}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">{m.responseTime}ms</div>
                    <div className="text-xs text-gray-500">response time</div>
                  </div>
                  <Sparkline data={m.responseTimes} color={m.status === 'up' ? '#22c55e' : m.status === 'degraded' ? '#eab308' : '#ef4444'} />
                </div>
                <div className="flex items-center justify-between">
                  <UptimeBars bars={m.uptimeBars} />
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{m.uptime90}% uptime</span>
                    <span>Checked {m.lastCheck}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /> Operational</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-500" /> Degraded</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500" /> Down</span>
              <span>90 days &larr; today</span>
            </div>
          </div>
        )}

        {/* Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {INCIDENT_LOG.map((inc, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${inc.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{inc.status}</span>
                  <span className="text-xs text-gray-500">{inc.date}</span>
                  <span className="text-xs text-gray-500">Duration: {inc.duration}</span>
                </div>
                <h4 className="font-medium">{inc.title}</h4>
                <div className="flex gap-2 mt-2">{inc.monitors.map(m => <span key={m} className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{m}</span>)}</div>
              </div>
            ))}
          </div>
        )}

        {/* SSL */}
        {activeTab === 'ssl' && (
          <div className="space-y-4">
            {MONITORS.filter(m => m.sslExpiry).map(m => (
              <div key={m.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-4">
                <Lock className={`w-5 h-5 ${m.sslDays! > 60 ? 'text-green-400' : m.sslDays! > 30 ? 'text-yellow-400' : 'text-red-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.url}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{m.sslDays} days</div>
                  <div className="text-xs text-gray-500">Expires {m.sslExpiry}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${m.sslDays! > 60 ? 'bg-green-500/20 text-green-400' : m.sslDays! > 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {m.sslDays! > 60 ? 'Valid' : m.sslDays! > 30 ? 'Expiring Soon' : 'Critical'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-green-600/20 to-cyan-600/20 border border-green-500/20">
          <h2 className="text-3xl font-bold mb-4">Never Miss Downtime Again</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Monitor your sites, APIs, and SSL certificates 24/7. Get instant alerts before your customers notice.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-cyan-600 font-semibold hover:opacity-90 transition-opacity">
            Start Monitoring Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}