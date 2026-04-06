'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Maximize2,
  Clock,
  ArrowDown,
  PanelRight,
  MessageSquare,
  Eye,
  Target,
  Palette,
  BarChart3,
  Zap,
  ArrowRight,
  Settings,
  Check,
  Copy,
  X,
  MousePointer2,
  Users,
  TrendingUp,
  Percent,
  Layout,
  Type,
  Image,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

type PopupType = 'exit-intent' | 'timed' | 'scroll' | 'floating-bar' | 'slide-in';

interface PopupTemplate {
  id: string;
  name: string;
  category: string;
  type: PopupType;
  conversionRate: number;
  preview: { bg: string; headline: string; cta: string; ctaColor: string };
}

const POPUP_TYPES = [
  { id: 'exit-intent' as PopupType, label: 'Exit Intent', icon: MousePointer2, desc: 'Triggers when cursor moves toward browser close button' },
  { id: 'timed' as PopupType, label: 'Timed', icon: Clock, desc: 'Appears after a set number of seconds on page' },
  { id: 'scroll' as PopupType, label: 'Scroll', icon: ArrowDown, desc: 'Triggers at a specific scroll depth percentage' },
  { id: 'floating-bar' as PopupType, label: 'Floating Bar', icon: Layout, desc: 'Persistent top or bottom bar with CTA' },
  { id: 'slide-in' as PopupType, label: 'Slide-In', icon: PanelRight, desc: 'Slides in from corner without blocking content' },
];

const TEMPLATES: PopupTemplate[] = [
  { id: 't1', name: 'Newsletter Signup', category: 'Lead Gen', type: 'exit-intent', conversionRate: 4.2, preview: { bg: 'from-blue-600 to-indigo-700', headline: 'Get Weekly AI Insights', cta: 'Subscribe Free', ctaColor: 'bg-white text-blue-700' } },
  { id: 't2', name: '10% Discount', category: 'E-Commerce', type: 'exit-intent', conversionRate: 6.8, preview: { bg: 'from-rose-600 to-pink-700', headline: 'Wait! 10% Off Your First Order', cta: 'Claim Discount', ctaColor: 'bg-white text-rose-700' } },
  { id: 't3', name: 'Webinar Registration', category: 'Events', type: 'timed', conversionRate: 3.1, preview: { bg: 'from-purple-600 to-violet-700', headline: 'Free Webinar: AI in 2026', cta: 'Save My Spot', ctaColor: 'bg-yellow-400 text-purple-900' } },
  { id: 't4', name: 'Free Trial', category: 'SaaS', type: 'scroll', conversionRate: 5.5, preview: { bg: 'from-green-600 to-emerald-700', headline: 'Try Pro Free for 14 Days', cta: 'Start Free Trial', ctaColor: 'bg-white text-green-700' } },
  { id: 't5', name: 'Shipping Banner', category: 'E-Commerce', type: 'floating-bar', conversionRate: 2.9, preview: { bg: 'from-amber-500 to-orange-600', headline: 'Free Shipping on Orders $50+', cta: 'Shop Now', ctaColor: 'bg-black text-white' } },
  { id: 't6', name: 'Chat Prompt', category: 'Support', type: 'slide-in', conversionRate: 8.1, preview: { bg: 'from-cyan-600 to-blue-700', headline: 'Need Help? Chat with Us', cta: 'Start Chat', ctaColor: 'bg-white text-cyan-700' } },
  { id: 't7', name: 'Lead Magnet', category: 'Lead Gen', type: 'timed', conversionRate: 7.3, preview: { bg: 'from-slate-700 to-slate-900', headline: 'Free Guide: 50 AI Prompts', cta: 'Download Now', ctaColor: 'bg-blue-500 text-white' } },
  { id: 't8', name: 'Flash Sale', category: 'E-Commerce', type: 'timed', conversionRate: 9.2, preview: { bg: 'from-red-600 to-red-800', headline: '24-Hour Flash Sale: 40% Off', cta: 'Shop Sale', ctaColor: 'bg-yellow-400 text-red-900' } },
];

const AB_TESTS = [
  { id: 'ab1', name: 'Newsletter CTA Test', variantA: 'Subscribe Free', variantB: 'Get Weekly Tips', aRate: 4.2, bRate: 5.1, status: 'running', impressions: 12840, confidence: 87 },
  { id: 'ab2', name: 'Discount Amount Test', variantA: '10% Off', variantB: '15% Off', aRate: 6.8, bRate: 7.2, status: 'completed', impressions: 24500, confidence: 96 },
  { id: 'ab3', name: 'Exit Intent Timing', variantA: 'Immediate', variantB: '2s Delay', aRate: 3.9, bRate: 4.6, status: 'running', impressions: 8200, confidence: 72 },
];

const ANALYTICS = [
  { popup: 'Newsletter Signup', impressions: 45200, conversions: 1898, rate: 4.2, trend: '+0.3%' },
  { popup: '10% Discount', impressions: 32100, conversions: 2183, rate: 6.8, trend: '+1.1%' },
  { popup: 'Free Trial Banner', impressions: 28400, conversions: 1562, rate: 5.5, trend: '-0.2%' },
  { popup: 'Flash Sale', impressions: 15800, conversions: 1454, rate: 9.2, trend: '+2.4%' },
];

export default function PopupsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'targeting' | 'ab-test' | 'analytics'>('templates');
  const [selectedType, setSelectedType] = useState<PopupType | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PopupTemplate | null>(null);
  const [editorBg, setEditorBg] = useState('from-blue-600 to-indigo-700');
  const [editorHeadline, setEditorHeadline] = useState('Get Weekly AI Insights');
  const [editorCta, setEditorCta] = useState('Subscribe Free');

  const filteredTemplates = selectedType === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.type === selectedType);

  const handleSelectTemplate = (t: PopupTemplate) => {
    setSelectedTemplate(t);
    setEditorBg(t.preview.bg);
    setEditorHeadline(t.preview.headline);
    setEditorCta(t.preview.cta);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Popup Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-6">
            <Maximize2 className="w-4 h-4" /> Conversion Optimization
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Popups That <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Actually Convert</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Exit-intent, timed, scroll-triggered, floating bars, and slide-ins. A/B test everything. Average 5.4% conversion rate.
          </p>
        </div>

        {/* Popup Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {POPUP_TYPES.map(t => (
            <button key={t.id} onClick={() => { setSelectedType(t.id); setActiveTab('templates'); }}
              className={`p-3 rounded-xl border text-center transition-all ${selectedType === t.id ? 'border-rose-500/50 bg-rose-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
              <t.icon className="w-5 h-5 mx-auto mb-1 text-rose-400" />
              <div className="text-xs font-medium">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'templates' as const, label: 'Templates', icon: Layout },
            { id: 'editor' as const, label: 'Visual Editor', icon: Palette },
            { id: 'targeting' as const, label: 'Targeting Rules', icon: Target },
            { id: 'ab-test' as const, label: 'A/B Testing', icon: Percent },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-rose-500/20 text-rose-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => handleSelectTemplate(t)}
                className="text-left rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-rose-500/30 transition-all group">
                <div className={`h-32 bg-gradient-to-br ${t.preview.bg} flex flex-col items-center justify-center p-4`}>
                  <p className="text-white font-bold text-sm text-center mb-2">{t.preview.headline}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.preview.ctaColor}`}>{t.preview.cta}</span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-xs text-green-400">{t.conversionRate}% CVR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{t.category}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{POPUP_TYPES.find(p => p.id === t.type)?.label}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Visual Editor */}
        {activeTab === 'editor' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold">Customize Popup</h3>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Headline</label>
                <input value={editorHeadline} onChange={e => setEditorHeadline(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">CTA Text</label>
                <input value={editorCta} onChange={e => setEditorCta(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Background</label>
                <div className="grid grid-cols-4 gap-2">
                  {['from-blue-600 to-indigo-700', 'from-rose-600 to-pink-700', 'from-green-600 to-emerald-700', 'from-purple-600 to-violet-700', 'from-amber-500 to-orange-600', 'from-slate-700 to-slate-900', 'from-cyan-600 to-blue-700', 'from-red-600 to-red-800'].map(bg => (
                    <button key={bg} onClick={() => setEditorBg(bg)}
                      className={`h-8 rounded-lg bg-gradient-to-br ${bg} border-2 ${editorBg === bg ? 'border-white' : 'border-transparent'}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Input Fields</label>
                <div className="space-y-2">
                  {['Email address', 'First name (optional)'].map((field, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">{field}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Trigger</label>
                <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  <option>Exit Intent</option><option>After 5 seconds</option><option>At 50% scroll</option><option>On page load</option>
                </select>
              </div>
              <button onClick={() => {}} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 font-medium text-sm hover:opacity-90 transition-opacity">Save & Publish</button>
            </div>
            {/* Preview */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className={`rounded-2xl bg-gradient-to-br ${editorBg} p-8 text-center shadow-2xl`}>
                  <button onClick={() => {}} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center"><X className="w-3 h-3 text-white/70" /></button>
                  <h3 className="text-xl font-bold text-white mb-3">{editorHeadline}</h3>
                  <p className="text-sm text-white/80 mb-4">Join 12,000+ builders getting weekly AI tips and tutorials.</p>
                  <input placeholder="Enter your email" className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/50 mb-3" />
                  <button onClick={() => {}} className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-semibold text-sm">{editorCta}</button>
                  <p className="text-xs text-white/50 mt-2">No spam. Unsubscribe anytime.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Targeting Rules */}
        {activeTab === 'targeting' && (
          <div className="max-w-2xl space-y-4">
            <h3 className="font-semibold">Targeting Rules</h3>
            <p className="text-sm text-gray-400">Control exactly who sees your popup and when.</p>
            {[
              { label: 'Show to new visitors only', desc: 'First-time visitors who haven\'t seen this popup', enabled: true },
              { label: 'Show after 3 page views', desc: 'Only after visitor has browsed multiple pages', enabled: false },
              { label: 'Hide on mobile devices', desc: 'Only show on desktop and tablet', enabled: false },
              { label: 'Exclude pricing page', desc: 'Don\'t show popup on /pricing to avoid interrupting checkout', enabled: true },
              { label: 'Show only from organic search', desc: 'Target visitors from Google, Bing, etc.', enabled: false },
              { label: 'Frequency cap: once per 7 days', desc: 'Don\'t show to same visitor more than once a week', enabled: true },
              { label: 'Geo-target: US and UK only', desc: 'Only show to visitors from specific countries', enabled: false },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                <div>
                  <div className="text-sm font-medium">{rule.label}</div>
                  <div className="text-xs text-gray-500">{rule.desc}</div>
                </div>
                <div className={`w-10 h-5 rounded-full ${rule.enabled ? 'bg-rose-500' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* A/B Testing */}
        {activeTab === 'ab-test' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">A/B Tests</h3>
              <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-rose-600 text-sm font-medium hover:bg-rose-500 transition-colors flex items-center gap-1"><Sparkles className="w-4 h-4" /> AI Suggest Test</button>
            </div>
            {AB_TESTS.map(test => (
              <div key={test.id} className="p-5 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{test.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${test.status === 'running' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{test.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Variant A</div>
                    <div className="font-medium text-sm">{test.variantA}</div>
                    <div className="text-lg font-bold text-blue-400 mt-1">{test.aRate}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Variant B</div>
                    <div className="font-medium text-sm">{test.variantB}</div>
                    <div className={`text-lg font-bold mt-1 ${test.bRate > test.aRate ? 'text-green-400' : 'text-red-400'}`}>{test.bRate}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{test.impressions.toLocaleString()} impressions</span>
                  <span>Confidence: <span className={test.confidence >= 95 ? 'text-green-400' : test.confidence >= 80 ? 'text-yellow-400' : 'text-gray-400'}>{test.confidence}%</span></span>
                  {test.confidence >= 95 && <span className="text-green-400 font-medium">Statistically significant</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Conversion Analytics</h3>
            <div className="space-y-3">
              {ANALYTICS.map((a, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{a.popup}</span>
                    <span className="text-sm text-green-400">{a.trend}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div><span className="text-gray-400">Impressions:</span> <span className="font-medium">{a.impressions.toLocaleString()}</span></div>
                    <div><span className="text-gray-400">Conversions:</span> <span className="font-medium">{a.conversions.toLocaleString()}</span></div>
                    <div><span className="text-gray-400">Rate:</span> <span className="font-bold text-rose-400">{a.rate}%</span></div>
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: `${a.rate * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-rose-600/20 to-pink-600/20 border border-rose-500/20">
          <h2 className="text-3xl font-bold mb-4">Convert More Visitors Into Customers</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Smart popups with AI targeting, A/B testing, and real-time analytics. Average 5.4% conversion rate across all users.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 font-semibold hover:opacity-90 transition-opacity">
            Start Converting Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}