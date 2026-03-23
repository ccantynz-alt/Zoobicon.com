'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Webhook, Plus, Trash2, Edit3, Play, Check, X, Copy,
  AlertCircle, CheckCircle2, Clock, RefreshCw, ChevronDown,
  ChevronRight, ExternalLink, Send, Shield, Eye, EyeOff,
  RotateCw, Settings, Zap, Globe, Code, Filter,
  ArrowUpRight, Hash, AlertTriangle
} from 'lucide-react';

const EVENT_TYPES = [
  { id: 'site.created', desc: 'When a new site is generated', category: 'Sites' },
  { id: 'site.deployed', desc: 'When a site is deployed to zoobicon.sh', category: 'Sites' },
  { id: 'site.updated', desc: 'When site code is updated', category: 'Sites' },
  { id: 'site.deleted', desc: 'When a site is deactivated', category: 'Sites' },
  { id: 'generation.started', desc: 'When AI generation begins', category: 'Generation' },
  { id: 'generation.completed', desc: 'When AI generation finishes', category: 'Generation' },
  { id: 'generation.failed', desc: 'When AI generation fails', category: 'Generation' },
  { id: 'payment.completed', desc: 'When a payment is processed', category: 'Billing' },
  { id: 'payment.failed', desc: 'When a payment fails', category: 'Billing' },
  { id: 'subscription.created', desc: 'When a new subscription starts', category: 'Billing' },
  { id: 'subscription.cancelled', desc: 'When a subscription is cancelled', category: 'Billing' },
  { id: 'user.signup', desc: 'When a new user registers', category: 'Users' },
];

const DEMO_WEBHOOKS = [
  { id: 1, url: 'https://api.myapp.com/webhooks/zoobicon', events: ['site.created', 'site.deployed', 'site.updated'], active: true, secret: 'whsec_abc123def456', createdAt: '2026-03-10', lastDelivery: '2026-03-23 14:32:05' },
  { id: 2, url: 'https://hooks.slack.com/services/T0/B0/xyz', events: ['generation.completed', 'generation.failed'], active: true, secret: 'whsec_slack789ghi', createdAt: '2026-03-15', lastDelivery: '2026-03-23 13:18:42' },
  { id: 3, url: 'https://zapier.com/hooks/catch/12345/', events: ['payment.completed', 'subscription.created'], active: false, secret: 'whsec_zap456jkl', createdAt: '2026-03-18', lastDelivery: '2026-03-20 09:45:11' },
];

const DEMO_DELIVERIES = [
  { id: 'd1', webhook_id: 1, event: 'site.deployed', status: 200, duration: 142, timestamp: '2026-03-23 14:32:05', request_id: 'req_a1b2c3' },
  { id: 'd2', webhook_id: 1, event: 'site.created', status: 200, duration: 89, timestamp: '2026-03-23 14:31:58', request_id: 'req_d4e5f6' },
  { id: 'd3', webhook_id: 2, event: 'generation.completed', status: 200, duration: 204, timestamp: '2026-03-23 13:18:42', request_id: 'req_g7h8i9' },
  { id: 'd4', webhook_id: 1, event: 'site.updated', status: 500, duration: 3012, timestamp: '2026-03-23 12:05:33', request_id: 'req_j0k1l2' },
  { id: 'd5', webhook_id: 2, event: 'generation.failed', status: 200, duration: 167, timestamp: '2026-03-23 11:42:19', request_id: 'req_m3n4o5' },
  { id: 'd6', webhook_id: 1, event: 'site.deployed', status: 200, duration: 115, timestamp: '2026-03-23 10:28:07', request_id: 'req_p6q7r8' },
  { id: 'd7', webhook_id: 3, event: 'payment.completed', status: 408, duration: 5000, timestamp: '2026-03-20 09:45:11', request_id: 'req_s9t0u1' },
  { id: 'd8', webhook_id: 1, event: 'site.created', status: 200, duration: 97, timestamp: '2026-03-22 16:14:55', request_id: 'req_v2w3x4' },
  { id: 'd9', webhook_id: 2, event: 'generation.completed', status: 200, duration: 183, timestamp: '2026-03-22 15:33:28', request_id: 'req_y5z6a7' },
  { id: 'd10', webhook_id: 1, event: 'site.updated', status: 200, duration: 121, timestamp: '2026-03-22 14:07:41', request_id: 'req_b8c9d0' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState(DEMO_WEBHOOKS);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'events' | 'logs' | 'test'>('endpoints');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [testPayload, setTestPayload] = useState(`{
  "event": "site.deployed",
  "data": {
    "site_id": "site_abc123",
    "slug": "my-awesome-site",
    "url": "https://my-awesome-site.zoobicon.sh",
    "deployed_at": "2026-03-23T14:32:05Z"
  }
}`);
  const [testResult, setTestResult] = useState<{ status: number; duration: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [selectedWebhookFilter, setSelectedWebhookFilter] = useState<number | null>(null);

  const filteredDeliveries = selectedWebhookFilter
    ? DEMO_DELIVERIES.filter(d => d.webhook_id === selectedWebhookFilter)
    : DEMO_DELIVERIES;

  const handleToggleWebhook = (id: number) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const handleToggleSecret = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendTest = () => {
    setSending(true);
    setTimeout(() => {
      setTestResult({ status: 200, duration: Math.floor(Math.random() * 300) + 50 });
      setSending(false);
    }, 1500);
  };

  const handleAddWebhook = () => {
    if (!newUrl.trim() || newEvents.length === 0) return;
    setWebhooks(prev => [...prev, {
      id: prev.length + 1,
      url: newUrl,
      events: newEvents,
      active: true,
      secret: 'whsec_' + Math.random().toString(36).slice(2, 14),
      createdAt: new Date().toISOString().split('T')[0],
      lastDelivery: 'Never',
    }]);
    setNewUrl('');
    setNewEvents([]);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Webhooks</span>
          </div>
          <button onClick={() => { setShowAddForm(true); setActiveTab('endpoints'); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Endpoint
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Endpoints', value: webhooks.filter(w => w.active).length, icon: Webhook, color: 'text-emerald-400' },
            { label: 'Total Deliveries (24h)', value: DEMO_DELIVERIES.length, icon: Send, color: 'text-blue-400' },
            { label: 'Success Rate', value: `${Math.round(DEMO_DELIVERIES.filter(d => d.status === 200).length / DEMO_DELIVERIES.length * 100)}%`, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Avg Response', value: `${Math.round(DEMO_DELIVERIES.reduce((s, d) => s + d.duration, 0) / DEMO_DELIVERIES.length)}ms`, icon: Clock, color: 'text-violet-400' },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">{s.label}</p>
                <s.icon className="w-4 h-4 text-white/20" />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'endpoints' as const, label: 'Endpoints', icon: Globe },
            { id: 'events' as const, label: 'Event Types', icon: Zap },
            { id: 'logs' as const, label: 'Delivery Logs', icon: Code },
            { id: 'test' as const, label: 'Test Sender', icon: Play },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            {showAddForm && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">New Webhook Endpoint</h3>
                  <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5 text-white/40" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/50 mb-1 block">Endpoint URL</label>
                    <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-server.com/webhooks" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="text-sm text-white/50 mb-2 block">Events to subscribe</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setNewEvents(prev => prev.includes(ev.id) ? prev.filter(e => e !== ev.id) : [...prev, ev.id])}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition ${
                            newEvents.includes(ev.id) ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {newEvents.includes(ev.id) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {ev.id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAddWebhook} className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-sm hover:opacity-90 transition">Create Endpoint</button>
                </div>
              </div>
            )}

            {webhooks.map((wh) => (
              <div key={wh.id} className={`p-5 rounded-2xl border transition ${wh.active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${wh.active ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span className="font-mono text-sm">{wh.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleWebhook(wh.id)} className={`px-3 py-1 rounded-lg text-xs font-medium ${wh.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                      {wh.active ? 'Active' : 'Paused'}
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/10"><Edit3 className="w-4 h-4 text-white/40" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400/60" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {wh.events.map((ev) => (
                    <span key={ev} className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">{ev}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Secret:
                    <span className="font-mono">{showSecrets[wh.id] ? wh.secret : '••••••••••••'}</span>
                    <button onClick={() => handleToggleSecret(wh.id)}>{showSecrets[wh.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                  </span>
                  <span>Created: {wh.createdAt}</span>
                  <span>Last delivery: {wh.lastDelivery}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Event Types */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {['Sites', 'Generation', 'Billing', 'Users'].map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-medium text-white/40 mb-3">{cat}</h3>
                <div className="space-y-2">
                  {EVENT_TYPES.filter(e => e.category === cat).map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-violet-400" />
                        <div>
                          <p className="font-mono text-sm">{ev.id}</p>
                          <p className="text-xs text-white/40">{ev.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/30 px-2 py-0.5 rounded-full bg-white/5">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Logs */}
        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-white/40">Filter by endpoint:</span>
              <button onClick={() => setSelectedWebhookFilter(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!selectedWebhookFilter ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}>All</button>
              {webhooks.map((wh) => (
                <button key={wh.id} onClick={() => setSelectedWebhookFilter(wh.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition truncate max-w-48 ${selectedWebhookFilter === wh.id ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}>
                  {new URL(wh.url).hostname}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredDeliveries.map((d) => (
                <div key={d.id}>
                  <button
                    onClick={() => setExpandedDelivery(expandedDelivery === d.id ? null : d.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition"
                  >
                    {d.status === 200 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${d.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{d.status}</span>
                    <span className="text-sm font-mono text-violet-300">{d.event}</span>
                    <span className="text-xs text-white/30 ml-auto">{d.duration}ms</span>
                    <span className="text-xs text-white/30">{d.timestamp}</span>
                    {expandedDelivery === d.id ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                  </button>
                  {expandedDelivery === d.id && (
                    <div className="ml-8 mt-1 p-4 rounded-xl bg-black/30 border border-white/5">
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div><span className="text-white/30">Request ID:</span> <span className="font-mono">{d.request_id}</span></div>
                        <div><span className="text-white/30">Duration:</span> <span>{d.duration}ms</span></div>
                        <div><span className="text-white/30">Endpoint:</span> <span className="font-mono">{webhooks.find(w => w.id === d.webhook_id)?.url}</span></div>
                        <div><span className="text-white/30">Status:</span> <span className={d.status === 200 ? 'text-emerald-400' : 'text-red-400'}>{d.status}</span></div>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                        <RotateCw className="w-3 h-3" /> Retry delivery
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Sender */}
        {activeTab === 'test' && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold">Test Webhook Delivery</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Select Endpoint</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                    {webhooks.filter(w => w.active).map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.url}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Payload</label>
                  <textarea value={testPayload} onChange={(e) => setTestPayload(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono resize-none h-48 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                </div>
                <button onClick={handleSendTest} disabled={sending} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Test Webhook</>}
                </button>
                {testResult && (
                  <div className={`p-4 rounded-xl border ${testResult.status === 200 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.status === 200 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                      <span className="font-medium">{testResult.status === 200 ? 'Delivered successfully' : 'Delivery failed'}</span>
                      <span className="text-sm text-white/40 ml-auto">{testResult.duration}ms</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}