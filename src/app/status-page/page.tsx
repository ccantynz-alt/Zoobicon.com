'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity, CheckCircle, AlertTriangle, XCircle, Clock,
  ChevronRight, ArrowLeft, Plus, Bell, Globe, Server,
  Database, Shield, Zap, Wifi, Mail, Eye, Settings,
  Calendar, TrendingUp, Users, ExternalLink, ChevronDown
} from 'lucide-react';

type TabType = 'status' | 'incidents' | 'subscribers' | 'settings';
type ComponentStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface StatusComponent {
  id: string;
  name: string;
  group: string;
  status: ComponentStatus;
  uptime90: number;
  icon: React.ReactNode;
  responseTime?: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  updates: { message: string; timestamp: string; status: string }[];
  affectedComponents: string[];
}

const STATUS_CONFIG: Record<ComponentStatus, { label: string; color: string; bgColor: string; dotColor: string; icon: React.ReactNode }> = {
  operational: { label: 'Operational', color: 'text-green-400', bgColor: 'bg-green-500/20', dotColor: 'bg-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  degraded: { label: 'Degraded Performance', color: 'text-amber-400', bgColor: 'bg-amber-500/20', dotColor: 'bg-amber-400', icon: <AlertTriangle className="w-4 h-4" /> },
  outage: { label: 'Major Outage', color: 'text-red-400', bgColor: 'bg-red-500/20', dotColor: 'bg-red-400', icon: <XCircle className="w-4 h-4" /> },
  maintenance: { label: 'Under Maintenance', color: 'text-blue-400', bgColor: 'bg-blue-500/20', dotColor: 'bg-blue-400', icon: <Clock className="w-4 h-4" /> },
};

const COMPONENTS: StatusComponent[] = [
  { id: 'c1', name: 'Website Builder', group: 'Core Services', status: 'operational', uptime90: 99.98, icon: <Globe className="w-4 h-4" />, responseTime: 142 },
  { id: 'c2', name: 'AI Generation Pipeline', group: 'Core Services', status: 'operational', uptime90: 99.95, icon: <Zap className="w-4 h-4" />, responseTime: 2340 },
  { id: 'c3', name: 'Hosting (zoobicon.sh)', group: 'Core Services', status: 'operational', uptime90: 99.99, icon: <Server className="w-4 h-4" />, responseTime: 38 },
  { id: 'c4', name: 'API v1', group: 'API', status: 'operational', uptime90: 99.97, icon: <Activity className="w-4 h-4" />, responseTime: 89 },
  { id: 'c5', name: 'Authentication', group: 'API', status: 'operational', uptime90: 99.99, icon: <Shield className="w-4 h-4" />, responseTime: 67 },
  { id: 'c6', name: 'Database', group: 'Infrastructure', status: 'degraded', uptime90: 99.82, icon: <Database className="w-4 h-4" />, responseTime: 245 },
  { id: 'c7', name: 'CDN', group: 'Infrastructure', status: 'operational', uptime90: 99.99, icon: <Wifi className="w-4 h-4" />, responseTime: 12 },
  { id: 'c8', name: 'Email Notifications', group: 'Communications', status: 'operational', uptime90: 99.91, icon: <Mail className="w-4 h-4" />, responseTime: 890 },
];

const INCIDENTS: Incident[] = [
  {
    id: 'i1', title: 'Database Performance Degradation', status: 'monitoring', severity: 'minor',
    createdAt: '2026-03-23 08:14 UTC', affectedComponents: ['Database'],
    updates: [
      { message: 'We are monitoring database query performance. Some users may experience slower load times. Root cause identified as increased connection pool pressure during peak hours.', timestamp: '2026-03-23 09:30 UTC', status: 'monitoring' },
      { message: 'Identified elevated query latency on the primary database cluster. Connection pool scaled from 100 to 200.', timestamp: '2026-03-23 08:45 UTC', status: 'identified' },
      { message: 'We are investigating reports of slow page loads and API response times.', timestamp: '2026-03-23 08:14 UTC', status: 'investigating' },
    ]
  },
  {
    id: 'i2', title: 'AI Generation Pipeline Timeout Errors', status: 'resolved', severity: 'major',
    createdAt: '2026-03-20 14:22 UTC', resolvedAt: '2026-03-20 16:05 UTC', affectedComponents: ['AI Generation Pipeline'],
    updates: [
      { message: 'All systems back to normal. The upstream provider has confirmed the issue is fully resolved. No data loss occurred.', timestamp: '2026-03-20 16:05 UTC', status: 'resolved' },
      { message: 'Fix deployed. Monitoring for stability. Generation success rate returning to 99%+.', timestamp: '2026-03-20 15:30 UTC', status: 'monitoring' },
      { message: 'Root cause: upstream model provider rate limiting. Implementing failover to secondary provider.', timestamp: '2026-03-20 15:00 UTC', status: 'identified' },
      { message: 'Users reporting generation failures. Investigating pipeline timeout errors.', timestamp: '2026-03-20 14:22 UTC', status: 'investigating' },
    ]
  },
  {
    id: 'i3', title: 'Scheduled Maintenance — CDN Migration', status: 'resolved', severity: 'minor',
    createdAt: '2026-03-15 02:00 UTC', resolvedAt: '2026-03-15 04:15 UTC', affectedComponents: ['CDN'],
    updates: [
      { message: 'Maintenance complete. CDN has been migrated to the new edge network with improved global coverage.', timestamp: '2026-03-15 04:15 UTC', status: 'resolved' },
      { message: 'Scheduled maintenance in progress. Some assets may take slightly longer to load.', timestamp: '2026-03-15 02:00 UTC', status: 'investigating' },
    ]
  },
];

const SUBSCRIBERS = [
  { email: 'ops@neuralpath.io', type: 'email', subscribed: '2026-02-14' },
  { email: 'alerts@meridianretail.com', type: 'email', subscribed: '2026-01-22' },
  { email: 'devops@swiftserve.com', type: 'webhook', subscribed: '2026-03-01' },
  { email: 'status@bloomwellness.com', type: 'email', subscribed: '2026-03-10' },
  { email: 'infra@atlasfinancial.com', type: 'email', subscribed: '2026-02-28' },
];

function UptimeBar({ uptime, days = 90 }: { uptime: number; days?: number }) {
  const bars = [];
  for (let i = 0; i < days; i++) {
    const isDown = Math.random() > uptime / 100;
    const isDegraded = !isDown && Math.random() > 0.97;
    bars.push(
      <div key={i} className={`flex-1 h-8 rounded-sm ${isDown ? 'bg-red-500' : isDegraded ? 'bg-amber-500' : 'bg-green-500/70'}`} title={`Day ${days - i}: ${isDown ? 'Outage' : isDegraded ? 'Degraded' : 'Operational'}`} />
    );
  }
  return <div className="flex gap-px">{bars}</div>;
}

export default function StatusPagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [expandedIncident, setExpandedIncident] = useState<string | null>('i1');
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');

  const overallStatus = COMPONENTS.some(c => c.status === 'outage') ? 'outage'
    : COMPONENTS.some(c => c.status === 'degraded') ? 'degraded'
    : COMPONENTS.some(c => c.status === 'maintenance') ? 'maintenance' : 'operational';

  const overallConfig = STATUS_CONFIG[overallStatus];
  const groups = [...new Set(COMPONENTS.map(c => c.group))];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'status', label: 'Status', icon: <Activity className="w-4 h-4" /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'subscribers', label: 'Subscribers', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Status Page</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Overall Status Banner */}
        <div className={`${overallConfig.bgColor} border ${overallStatus === 'operational' ? 'border-green-500/30' : overallStatus === 'degraded' ? 'border-amber-500/30' : 'border-red-500/30'} rounded-2xl p-6 mb-8 flex items-center gap-4`}>
          <div className={`w-12 h-12 rounded-xl ${overallConfig.bgColor} flex items-center justify-center ${overallConfig.color}`}>
            {overallConfig.icon}
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${overallConfig.color}`}>{overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial System Degradation' : 'System Issues Detected'}</h2>
            <p className="text-sm text-white/50 mt-0.5">Last checked: {new Date().toLocaleTimeString()} UTC &middot; Updated every 60 seconds</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'status' && (
          <div className="space-y-8">
            {groups.map(group => (
              <div key={group}>
                <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">{group}</h3>
                <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                  {COMPONENTS.filter(c => c.group === group).map(component => {
                    const statusCfg = STATUS_CONFIG[component.status];
                    return (
                      <div key={component.id} className="px-6 py-4 flex items-center gap-4">
                        <span className="text-white/40">{component.icon}</span>
                        <span className="font-medium text-sm flex-1">{component.name}</span>
                        {component.responseTime && <span className="text-xs text-white/30">{component.responseTime}ms</span>}
                        <div className={`flex items-center gap-2 ${statusCfg.color}`}>
                          <div className={`w-2 h-2 rounded-full ${statusCfg.dotColor}`} />
                          <span className="text-xs font-medium">{statusCfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Uptime Bars */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">90-Day Uptime</h3>
              <div className="space-y-4">
                {COMPONENTS.map(component => (
                  <div key={component.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{component.name}</span>
                      <span className={`text-sm font-mono ${component.uptime90 >= 99.95 ? 'text-green-400' : component.uptime90 >= 99.5 ? 'text-amber-400' : 'text-red-400'}`}>{component.uptime90}%</span>
                    </div>
                    <UptimeBar uptime={component.uptime90} />
                    <div className="flex justify-between mt-2 text-xs text-white/30">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {INCIDENTS.map(incident => {
              const severityColors = { minor: 'text-amber-400 bg-amber-500/20', major: 'text-orange-400 bg-orange-500/20', critical: 'text-red-400 bg-red-500/20' };
              return (
                <div key={incident.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <button onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)} className="w-full px-6 py-5 text-left flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${incident.status === 'resolved' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-sm">{incident.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${severityColors[incident.severity]}`}>{incident.severity}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{incident.status}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">{incident.createdAt}{incident.resolvedAt ? ` — Resolved ${incident.resolvedAt}` : ''}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/30 transition-transform ${expandedIncident === incident.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedIncident === incident.id && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-white/40">Affected:</span>
                        {incident.affectedComponents.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">{c}</span>
                        ))}
                      </div>
                      <div className="relative pl-6 border-l-2 border-white/10 space-y-6">
                        {incident.updates.map((update, i) => (
                          <div key={i} className="relative">
                            <div className={`absolute -left-[25px] w-3 h-3 rounded-full border-2 ${update.status === 'resolved' ? 'bg-green-400 border-green-400' : update.status === 'monitoring' ? 'bg-blue-400 border-blue-400' : update.status === 'identified' ? 'bg-amber-400 border-amber-400' : 'bg-white/40 border-white/40'}`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium capitalize text-white/70">{update.status}</span>
                                <span className="text-xs text-white/30">{update.timestamp}</span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed">{update.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Subscribe to Updates</h3>
              <div className="flex gap-3">
                <input type="email" value={newSubscriberEmail} onChange={e => setNewSubscriberEmail(e.target.value)} placeholder="Enter email address" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                <button className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">
                  <Bell className="w-4 h-4" /> Subscribe
                </button>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-medium text-sm">Current Subscribers</h3>
                <span className="text-sm text-white/40">{SUBSCRIBERS.length} subscribers</span>
              </div>
              <div className="divide-y divide-white/5">
                {SUBSCRIBERS.map((sub, i) => (
                  <div key={i} className="px-6 py-3 flex items-center gap-4">
                    <Mail className="w-4 h-4 text-white/30" />
                    <span className="text-sm flex-1">{sub.email}</span>
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full capitalize">{sub.type}</span>
                    <span className="text-xs text-white/30">Since {sub.subscribed}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold mb-4">Page Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Status Page Title</label>
                  <input type="text" defaultValue="Zoobicon Status" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Custom Domain</label>
                  <input type="text" defaultValue="status.zoobicon.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Notification Channels</label>
                  <div className="space-y-2">
                    {['Email', 'Webhook', 'Slack', 'SMS'].map(channel => (
                      <label key={channel} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <input type="checkbox" defaultChecked={channel === 'Email' || channel === 'Webhook'} className="accent-violet-500" />
                        <span className="text-sm">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Statuspage.io ($29/mo), BetterUptime ($20/mo), and Instatus &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/builder" className="text-sm text-white/50 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
