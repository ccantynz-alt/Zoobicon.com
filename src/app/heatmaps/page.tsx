'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Flame, MousePointer2, ArrowDown, Video, AlertTriangle,
  Code, Eye, Layers, Monitor, Smartphone, Clock, Copy,
  ArrowRight, Zap, BarChart3, Target, RefreshCw, Check
} from 'lucide-react';

const DEMO_CLICKS = [
  { x: 52, y: 15, intensity: 95, label: 'CTA Button' },
  { x: 30, y: 12, intensity: 80, label: 'Logo' },
  { x: 75, y: 14, intensity: 70, label: 'Pricing Link' },
  { x: 50, y: 35, intensity: 85, label: 'Feature Card' },
  { x: 25, y: 38, intensity: 60, label: 'Learn More' },
  { x: 72, y: 36, intensity: 55, label: 'Testimonial' },
  { x: 50, y: 55, intensity: 75, label: 'Demo Video' },
  { x: 35, y: 60, intensity: 40, label: 'FAQ Toggle' },
  { x: 68, y: 58, intensity: 45, label: 'Contact Form' },
  { x: 50, y: 78, intensity: 90, label: 'Sign Up CTA' },
  { x: 20, y: 85, intensity: 30, label: 'Footer Link' },
  { x: 80, y: 84, intensity: 25, label: 'Social Icon' },
  { x: 45, y: 22, intensity: 50, label: 'Nav Dropdown' },
  { x: 60, y: 45, intensity: 65, label: 'Pricing Toggle' },
];

const SCROLL_DEPTH_DATA = [
  { depth: '0%', visitors: 100, color: 'bg-green-500' },
  { depth: '25%', visitors: 82, color: 'bg-green-400' },
  { depth: '50%', visitors: 61, color: 'bg-yellow-400' },
  { depth: '75%', visitors: 38, color: 'bg-orange-400' },
  { depth: '100%', visitors: 21, color: 'bg-red-400' },
];

const RAGE_CLICKS = [
  { element: '.pricing-toggle', clicks: 47, page: '/pricing', issue: 'Toggle appears clickable but has dead zone', severity: 'high' },
  { element: '.hero-image', clicks: 32, page: '/', issue: 'Users expect image to be clickable/expandable', severity: 'medium' },
  { element: '.nav-dropdown', clicks: 28, page: '/*', issue: 'Dropdown closes too fast on hover exit', severity: 'high' },
  { element: '.testimonial-card', clicks: 19, page: '/', issue: 'Card looks interactive but is static', severity: 'low' },
  { element: '.feature-icon', clicks: 15, page: '/products', issue: 'Icons suggest tooltip but none appears', severity: 'low' },
];

const SESSION_RECORDINGS = [
  { id: 'sess_a1b2', user: 'Visitor #4,291', duration: '3m 42s', pages: 4, device: 'Desktop', country: 'US', date: '2 min ago', hasRageClick: true },
  { id: 'sess_c3d4', user: 'Visitor #4,290', duration: '1m 18s', pages: 2, device: 'Mobile', country: 'UK', date: '8 min ago', hasRageClick: false },
  { id: 'sess_e5f6', user: 'Visitor #4,289', duration: '5m 55s', pages: 7, device: 'Desktop', country: 'DE', date: '15 min ago', hasRageClick: false },
  { id: 'sess_g7h8', user: 'Visitor #4,288', duration: '0m 34s', pages: 1, device: 'Mobile', country: 'IN', date: '22 min ago', hasRageClick: true },
  { id: 'sess_i9j0', user: 'Visitor #4,287', duration: '2m 11s', pages: 3, device: 'Tablet', country: 'CA', date: '31 min ago', hasRageClick: false },
  { id: 'sess_k1l2', user: 'Visitor #4,286', duration: '4m 08s', pages: 5, device: 'Desktop', country: 'AU', date: '45 min ago', hasRageClick: false },
];

const TRACKING_SCRIPT = `<script src="https://cdn.zoobicon.com/heatmap.js"
  data-site-id="YOUR_SITE_ID"
  data-track-clicks="true"
  data-track-scroll="true"
  data-record-sessions="true"
  async></script>`;

function intensityToColor(intensity: number) {
  if (intensity > 80) return 'bg-red-500';
  if (intensity > 60) return 'bg-orange-500';
  if (intensity > 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function HeatmapsPage() {
  const [activeTab, setActiveTab] = useState<'clicks' | 'scroll' | 'recordings' | 'rage' | 'setup'>('clicks');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TRACKING_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'clicks' as const, label: 'Click Heatmap', icon: MousePointer2 },
    { id: 'scroll' as const, label: 'Scroll Depth', icon: ArrowDown },
    { id: 'recordings' as const, label: 'Recordings', icon: Video },
    { id: 'rage' as const, label: 'Rage Clicks', icon: AlertTriangle },
    { id: 'setup' as const, label: 'Setup', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Heatmaps & Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
            <Flame className="w-4 h-4" /> Visual Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            See Where Users <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Actually Click</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Heatmaps, scroll depth, session recordings, and rage click detection. Understand exactly how visitors interact with your site.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Sessions Recorded', value: '4,291', icon: Video },
            { label: 'Click Events', value: '127K', icon: MousePointer2 },
            { label: 'Avg Scroll Depth', value: '61%', icon: ArrowDown },
            { label: 'Rage Clicks Found', value: '141', icon: AlertTriangle },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <s.icon className="w-5 h-5 text-orange-400 mb-2" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Click Heatmap */}
        {activeTab === 'clicks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Click Heatmap — Homepage</h2>
              <div className="flex gap-1 p-1 bg-white/10 rounded-lg">
                <button onClick={() => setDevice('desktop')} className={`px-3 py-1 rounded text-xs ${device === 'desktop' ? 'bg-white/20 text-white' : 'text-gray-400'}`}><Monitor className="w-3 h-3 inline mr-1" />Desktop</button>
                <button onClick={() => setDevice('mobile')} className={`px-3 py-1 rounded text-xs ${device === 'mobile' ? 'bg-white/20 text-white' : 'text-gray-400'}`}><Smartphone className="w-3 h-3 inline mr-1" />Mobile</button>
              </div>
            </div>
            <div className={`relative rounded-xl border border-white/10 bg-white/5 overflow-hidden mx-auto ${device === 'mobile' ? 'max-w-sm' : 'max-w-4xl'}`}>
              {/* Simulated page */}
              <div className="relative" style={{ paddingBottom: '120%' }}>
                {/* Page sections */}
                <div className="absolute inset-0">
                  <div className="h-[8%] border-b border-white/10 bg-white/5 flex items-center px-4">
                    <div className="w-16 h-3 bg-white/20 rounded" /><div className="flex gap-3 ml-auto">{[1,2,3,4].map(i => <div key={i} className="w-10 h-2 bg-white/10 rounded" />)}</div>
                  </div>
                  <div className="h-[22%] flex items-center px-8"><div className="flex-1"><div className="w-48 h-4 bg-white/15 rounded mb-2" /><div className="w-64 h-3 bg-white/10 rounded mb-4" /><div className="w-24 h-6 bg-blue-500/30 rounded" /></div><div className="w-32 h-24 bg-white/10 rounded-lg" /></div>
                  <div className="h-[20%] bg-white/[0.03] px-8 py-4"><div className="grid grid-cols-3 gap-4 h-full">{[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-lg border border-white/10 p-3"><div className="w-8 h-8 bg-white/10 rounded mb-2" /><div className="w-20 h-2 bg-white/10 rounded" /></div>)}</div></div>
                  <div className="h-[18%] px-8 py-4 flex gap-6"><div className="w-1/2 bg-white/5 rounded-lg" /><div className="flex-1 space-y-2 py-4">{[1,2,3].map(i => <div key={i} className="w-full h-2 bg-white/10 rounded" />)}</div></div>
                  <div className="h-[15%] bg-white/[0.03] px-8 py-4"><div className="text-center"><div className="w-40 h-3 bg-white/10 rounded mx-auto mb-3" /><div className="w-60 h-2 bg-white/5 rounded mx-auto mb-4" /><div className="w-28 h-6 bg-purple-500/30 rounded mx-auto" /></div></div>
                  <div className="h-[17%] bg-white/[0.02] px-8 py-4 border-t border-white/10"><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i}><div className="w-16 h-2 bg-white/10 rounded mb-2" />{[1,2,3].map(j => <div key={j} className="w-12 h-1.5 bg-white/5 rounded mb-1" />)}</div>)}</div></div>
                </div>
                {/* Heatmap dots */}
                {DEMO_CLICKS.map((click, i) => (
                  <div key={i} className="absolute group" style={{ left: `${click.x}%`, top: `${click.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className={`w-8 h-8 rounded-full ${intensityToColor(click.intensity)} opacity-40 blur-sm`} />
                    <div className={`absolute inset-1 rounded-full ${intensityToColor(click.intensity)} opacity-60`} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {click.label} — {click.intensity}% of clicks
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> Low</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Medium</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> High</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Hot</div>
            </div>
          </div>
        )}

        {/* Scroll Depth */}
        {activeTab === 'scroll' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Scroll Depth — Homepage</h2>
            <div className="p-6 rounded-xl border border-white/10 bg-white/5">
              {SCROLL_DEPTH_DATA.map((d, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{d.depth} of page</span>
                    <span className="text-sm font-medium">{d.visitors}% of visitors</span>
                  </div>
                  <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full transition-all duration-1000`} style={{ width: `${d.visitors}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-300 flex items-center gap-2"><Target className="w-4 h-4" /> <strong>Insight:</strong> 39% of visitors drop off between 50-75% scroll depth. Consider moving your CTA higher on the page.</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Recordings */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Session Recordings</h2>
              <span className="text-sm text-gray-400">4,291 total sessions</span>
            </div>
            <div className="space-y-2">
              {SESSION_RECORDINGS.map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors flex items-center gap-4 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Video className="w-4 h-4 text-orange-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{s.user}</span>
                      {s.hasRageClick && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">Rage Click</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}</span>
                      <span>{s.pages} pages</span>
                      <span>{s.device}</span>
                      <span>{s.country}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{s.date}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors">Watch</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rage Clicks */}
        {activeTab === 'rage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Rage Click Detection</h2>
              <span className="text-sm text-gray-400">5 issues found</span>
            </div>
            <p className="text-sm text-gray-400">Rage clicks indicate user frustration — rapid repeated clicks on the same element.</p>
            <div className="space-y-3">
              {RAGE_CLICKS.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{r.element}</code>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.severity === 'high' ? 'bg-red-500/20 text-red-400' : r.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{r.severity}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{r.issue}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{r.clicks} rage clicks</span>
                    <span>Page: {r.page}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup */}
        {activeTab === 'setup' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold">Setup Instructions</h2>
            <p className="text-gray-400">Add this script to your website to start collecting heatmap data, session recordings, and rage click events.</p>
            <div className="relative">
              <pre className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-green-400 overflow-x-auto">{TRACKING_SCRIPT}</pre>
              <button onClick={handleCopy} className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <div className="space-y-3">
              {['Paste the script before the closing </head> tag', 'Replace YOUR_SITE_ID with your site ID from the dashboard', 'Data collection starts automatically within 60 seconds', 'First heatmap available after ~100 visits'].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <span className="text-sm text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/20">
          <h2 className="text-3xl font-bold mb-4">Stop Guessing, Start Seeing</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Heatmaps and session recordings reveal exactly what your visitors do. Find and fix UX issues before they cost you conversions.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold hover:opacity-90 transition-opacity">
            Start Tracking Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}