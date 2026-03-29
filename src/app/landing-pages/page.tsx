'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layout,
  Sparkles,
  Eye,
  Copy,
  Download,
  BarChart3,
  Zap,
  Target,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
  Check,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Mail,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Layers,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Wand2,
  SplitSquareHorizontal,
  Plus,
  Settings,
  AlertCircle,
  Trophy,
} from 'lucide-react';

const TEMPLATE_CATEGORIES = ['All', 'SaaS', 'Webinar', 'Ebook', 'Product Launch', 'App Download', 'Coming Soon', 'Event', 'Agency'];

const TEMPLATES = [
  { id: 1, name: 'SaaS Launch Pro', category: 'SaaS', conversion: '4.8%', views: '12.4K', thumb: 'from-violet-600 to-blue-600', rating: 4.9 },
  { id: 2, name: 'Webinar Signup', category: 'Webinar', conversion: '6.2%', views: '8.7K', thumb: 'from-pink-600 to-rose-600', rating: 4.8 },
  { id: 3, name: 'Ebook Download', category: 'Ebook', conversion: '7.1%', views: '15.2K', thumb: 'from-emerald-600 to-teal-600', rating: 4.7 },
  { id: 4, name: 'Product Hunt Launch', category: 'Product Launch', conversion: '5.5%', views: '9.1K', thumb: 'from-orange-600 to-amber-600', rating: 4.9 },
  { id: 5, name: 'Mobile App Promo', category: 'App Download', conversion: '3.9%', views: '6.3K', thumb: 'from-cyan-600 to-blue-600', rating: 4.6 },
  { id: 6, name: 'Coming Soon Hype', category: 'Coming Soon', conversion: '8.3%', views: '20.1K', thumb: 'from-fuchsia-600 to-violet-600', rating: 4.9 },
  { id: 7, name: 'Conference 2026', category: 'Event', conversion: '4.2%', views: '5.8K', thumb: 'from-red-600 to-pink-600', rating: 4.5 },
  { id: 8, name: 'Agency Portfolio', category: 'Agency', conversion: '3.1%', views: '7.4K', thumb: 'from-indigo-600 to-purple-600', rating: 4.7 },
  { id: 9, name: 'SaaS Pricing', category: 'SaaS', conversion: '5.7%', views: '11.3K', thumb: 'from-blue-600 to-indigo-600', rating: 4.8 },
  { id: 10, name: 'Free Trial Signup', category: 'SaaS', conversion: '6.8%', views: '14.6K', thumb: 'from-green-600 to-emerald-600', rating: 4.9 },
  { id: 11, name: 'Webinar Replay', category: 'Webinar', conversion: '5.4%', views: '4.2K', thumb: 'from-yellow-600 to-orange-600', rating: 4.4 },
  { id: 12, name: 'Lead Magnet', category: 'Ebook', conversion: '9.2%', views: '18.7K', thumb: 'from-teal-600 to-cyan-600', rating: 5.0 },
];

const AB_TESTS = [
  { id: 1, name: 'Hero CTA Test', variant_a: 'Start Free Trial', variant_b: 'Try It Free', conv_a: 4.8, conv_b: 5.7, winner: 'B', status: 'completed', visitors: 2847 },
  { id: 2, name: 'Headline Test', variant_a: 'Build Faster', variant_b: 'Ship in Minutes', conv_a: 3.2, conv_b: 4.1, winner: 'B', status: 'completed', visitors: 1923 },
  { id: 3, name: 'Social Proof Position', variant_a: 'Above fold', variant_b: 'Below hero', conv_a: 5.1, conv_b: 4.6, winner: 'A', status: 'running', visitors: 856 },
];

export default function LandingPagesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generator' | 'ab-testing' | 'analytics' | 'popups'>('templates');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [generating, setGenerating] = useState(false);

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleGenerate = () => {
    if (!campaignDesc.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Landing Page Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
              <Zap className="w-4 h-4" /> Deploy
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Pages', value: '24', icon: Layout, color: 'text-violet-400' },
            { label: 'Total Views', value: '142.8K', icon: Eye, color: 'text-blue-400' },
            { label: 'Avg Conversion', value: '5.4%', icon: Target, color: 'text-emerald-400' },
            { label: 'Leads Captured', value: '7,293', icon: Users, color: 'text-amber-400' },
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
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'templates' as const, label: 'Template Library', icon: Layout },
            { id: 'generator' as const, label: 'AI Generator', icon: Sparkles },
            { id: 'ab-testing' as const, label: 'A/B Testing', icon: SplitSquareHorizontal },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'popups' as const, label: 'Popup Builder', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedCategory === cat ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((t) => (
                <div key={t.id} className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-violet-500/30 transition">
                  <div className={`h-40 bg-gradient-to-br ${t.thumb} relative`}>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</button>
                      <button className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium flex items-center gap-2"><Copy className="w-4 h-4" /> Use</button>
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-xs backdrop-blur-sm">{t.category}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2">{t.name}</h3>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t.conversion}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {t.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{t.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Generator */}
        {activeTab === 'generator' && (
          <div className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Landing Page Generator</h2>
                  <p className="text-sm text-white/50">Describe your campaign and AI builds the perfect page</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Campaign Description</label>
                  <textarea value={campaignDesc} onChange={(e) => setCampaignDesc(e.target.value)} placeholder="e.g., SaaS product launch for a project management tool targeting remote teams. Key features: real-time collaboration, AI task assignment, time tracking. Goal: free trial signups." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/50 mb-1 block">Page Goal</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                      <option>Free Trial Signup</option>
                      <option>Email Capture</option>
                      <option>Product Purchase</option>
                      <option>Webinar Registration</option>
                      <option>App Download</option>
                      <option>Contact Form</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/50 mb-1 block">Style</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                      <option>Modern / Minimal</option>
                      <option>Bold / Colorful</option>
                      <option>Corporate / Professional</option>
                      <option>Creative / Playful</option>
                      <option>Dark / Tech</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Landing Page...</> : <><Sparkles className="w-5 h-5" /> Generate Landing Page</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* A/B Testing */}
        {activeTab === 'ab-testing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Active A/B Tests</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium hover:bg-violet-500 transition">
                <Plus className="w-4 h-4" /> New Test
              </button>
            </div>
            {AB_TESTS.map((test) => (
              <div key={test.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{test.name}</h4>
                    <p className="text-xs text-white/40">{test.visitors.toLocaleString()} visitors</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${test.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {test.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${test.winner === 'A' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Variant A</span>
                      {test.winner === 'A' && <span className="text-xs text-emerald-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Winner</span>}
                    </div>
                    <p className="text-xs text-white/50 mb-2">&ldquo;{test.variant_a}&rdquo;</p>
                    <p className="text-2xl font-bold">{test.conv_a}%</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${test.winner === 'B' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Variant B</span>
                      {test.winner === 'B' && <span className="text-xs text-emerald-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Winner</span>}
                    </div>
                    <p className="text-xs text-white/50 mb-2">&ldquo;{test.variant_b}&rdquo;</p>
                    <p className="text-2xl font-bold">{test.conv_b}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { page: 'SaaS Launch Pro', views: 12400, conversions: 595, rate: 4.8 },
                { page: 'Lead Magnet', views: 18700, conversions: 1720, rate: 9.2 },
                { page: 'Coming Soon Hype', views: 20100, conversions: 1668, rate: 8.3 },
              ].map((p) => (
                <div key={p.page} className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-medium text-sm mb-3">{p.page}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Views</span>
                      <span>{p.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Conversions</span>
                      <span className="text-emerald-400">{p.conversions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Rate</span>
                      <span className="text-violet-400 font-medium">{p.rate}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{ width: `${p.rate * 10}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popup Builder */}
        {activeTab === 'popups' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold">Popup Templates</h3>
              {[
                { name: 'Exit Intent', desc: 'Shows when user moves to close tab', trigger: 'Exit intent', color: 'from-red-500 to-pink-500' },
                { name: 'Scroll Trigger', desc: 'Appears after scrolling 50%', trigger: 'Scroll depth', color: 'from-blue-500 to-cyan-500' },
                { name: 'Time Delay', desc: 'Shows after 10 seconds', trigger: 'Timer', color: 'from-amber-500 to-orange-500' },
                { name: 'Click Trigger', desc: 'Opens on button click', trigger: 'Click event', color: 'from-emerald-500 to-teal-500' },
              ].map((popup) => (
                <div key={popup.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${popup.color} flex items-center justify-center`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{popup.name}</p>
                      <p className="text-xs text-white/40">{popup.desc}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/50">{popup.trigger}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-1 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20">
              <div className="bg-[#0f0f1a] rounded-xl p-8 min-h-[400px] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div className="relative z-10 bg-white rounded-2xl p-6 max-w-sm text-black">
                  <h3 className="text-lg font-bold mb-2">Wait! Before you go...</h3>
                  <p className="text-sm text-gray-600 mb-4">Get 20% off your first month. Enter your email to claim your discount.</p>
                  <input type="email" placeholder="your@email.com" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3" />
                  <button className="w-full bg-violet-600 text-white rounded-lg py-2.5 text-sm font-medium">Claim My Discount</button>
                  <p className="text-xs text-gray-400 text-center mt-3 cursor-pointer hover:text-gray-600">No thanks, I prefer full price</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}