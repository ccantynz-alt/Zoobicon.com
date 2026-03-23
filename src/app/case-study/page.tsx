'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Download, Sparkles, Wand2, TrendingUp, Target,
  Users, BarChart3, ArrowUpRight, ArrowDownRight, Eye, Edit3,
  ChevronRight, Plus, Copy, Check, Star, Clock, Zap,
  Building2, Globe, Award, Briefcase, MessageSquare,
  Layout, Layers, Share2, ExternalLink, Filter, Search
} from 'lucide-react';

const TEMPLATE_FORMATS = [
  { id: 'saas', name: 'SaaS', desc: 'Software product case study with metrics, onboarding, and ROI', icon: Zap, color: 'from-violet-500 to-blue-500' },
  { id: 'agency', name: 'Agency', desc: 'Client success story with timeline, deliverables, and outcomes', icon: Briefcase, color: 'from-pink-500 to-rose-500' },
  { id: 'ecommerce', name: 'E-commerce', desc: 'Revenue growth story with conversion and AOV improvements', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
  { id: 'enterprise', name: 'Enterprise', desc: 'Large-scale transformation with process and efficiency gains', icon: Building2, color: 'from-amber-500 to-orange-500' },
];

const DEMO_CASE_STUDIES = [
  {
    id: 1,
    title: 'How DataStream Reduced Development Time by 85% with AI',
    client: 'DataStream Inc.',
    industry: 'SaaS / Analytics',
    template: 'saas',
    featured: true,
    publishedAt: '2026-03-15',
    metrics: [
      { label: 'Dev Time Reduction', before: '3 weeks', after: '2 days', change: -85, direction: 'down' },
      { label: 'Cost Savings', before: '$45,000', after: '$2,400', change: -94, direction: 'down' },
      { label: 'Sites Launched', before: '4/quarter', after: '28/quarter', change: 600, direction: 'up' },
      { label: 'Conversion Rate', before: '2.1%', after: '5.8%', change: 176, direction: 'up' },
    ],
    views: 2847,
    shares: 142,
  },
  {
    id: 2,
    title: 'Wright Digital: Scaling to 50+ Clients with White-Label AI',
    client: 'Wright Digital Agency',
    industry: 'Digital Agency',
    template: 'agency',
    featured: true,
    publishedAt: '2026-03-08',
    metrics: [
      { label: 'Client Capacity', before: '12 clients', after: '52 clients', change: 333, direction: 'up' },
      { label: 'Delivery Time', before: '2-3 weeks', after: '24 hours', change: -93, direction: 'down' },
      { label: 'Monthly Revenue', before: '$28K', after: '$124K', change: 343, direction: 'up' },
      { label: 'Client Satisfaction', before: '7.2/10', after: '9.4/10', change: 31, direction: 'up' },
    ],
    views: 1923,
    shares: 89,
  },
  {
    id: 3,
    title: 'Bloom Health: From Zero to $2.4M ARR in 6 Months',
    client: 'Bloom Health',
    industry: 'Healthcare / E-commerce',
    template: 'ecommerce',
    featured: false,
    publishedAt: '2026-02-22',
    metrics: [
      { label: 'Monthly Revenue', before: '$0', after: '$200K/mo', change: 999, direction: 'up' },
      { label: 'Product Pages', before: '0', after: '340', change: 999, direction: 'up' },
      { label: 'Organic Traffic', before: '0', after: '45K/mo', change: 999, direction: 'up' },
      { label: 'Cart Conversion', before: 'N/A', after: '4.2%', change: 0, direction: 'up' },
    ],
    views: 3401,
    shares: 216,
  },
  {
    id: 4,
    title: 'NexGen Corp: Enterprise Digital Transformation at Scale',
    client: 'NexGen Corporation',
    industry: 'Enterprise / Manufacturing',
    template: 'enterprise',
    featured: false,
    publishedAt: '2026-02-10',
    metrics: [
      { label: 'Internal Sites', before: '4 portals', after: '28 portals', change: 600, direction: 'up' },
      { label: 'IT Ticket Reduction', before: '1,200/mo', after: '340/mo', change: -72, direction: 'down' },
      { label: 'Employee Adoption', before: '23%', after: '91%', change: 296, direction: 'up' },
      { label: 'Annual IT Savings', before: '$0', after: '$1.2M', change: 999, direction: 'up' },
    ],
    views: 1567,
    shares: 67,
  },
];

export default function CaseStudyPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'gallery' | 'templates' | 'export'>('generator');
  const [clientName, setClientName] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [results, setResults] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('saas');
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const handleGenerate = () => {
    if (!clientName.trim() || !problem.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setActiveTab('gallery');
    }, 3000);
  };

  const filteredCaseStudies = DEMO_CASE_STUDIES.filter((cs) => {
    const matchSearch = !searchQuery || cs.title.toLowerCase().includes(searchQuery.toLowerCase()) || cs.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTemplate = !filterTemplate || cs.template === filterTemplate;
    return matchSearch && matchTemplate;
  });

  const handleCopyLink = (id: number) => {
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Case Study Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Published Studies', value: DEMO_CASE_STUDIES.length, icon: FileText, color: 'text-violet-400' },
            { label: 'Total Views', value: DEMO_CASE_STUDIES.reduce((s, cs) => s + cs.views, 0).toLocaleString(), icon: Eye, color: 'text-blue-400' },
            { label: 'Total Shares', value: DEMO_CASE_STUDIES.reduce((s, cs) => s + cs.shares, 0), icon: Share2, color: 'text-emerald-400' },
            { label: 'Avg. Engagement', value: '4.2 min', icon: Clock, color: 'text-amber-400' },
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
        <div className="flex gap-2 mb-8">
          {[
            { id: 'generator' as const, label: 'AI Generator', icon: Wand2 },
            { id: 'gallery' as const, label: 'Published Studies', icon: Layout },
            { id: 'templates' as const, label: 'Templates', icon: Layers },
            { id: 'export' as const, label: 'Export Options', icon: Download },
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

        {/* AI Generator */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Case Study Generator</h2>
                  <p className="text-sm text-white/50">Describe the client, problem, solution, and results</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Client / Company Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Acme Technologies"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">The Problem</label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="What challenges was the client facing? What pain points led them to seek a solution?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">The Solution</label>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="How did your product/service solve the problem? What was the implementation process?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">The Results</label>
                  <textarea
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    placeholder="What measurable outcomes were achieved? Include specific numbers: revenue growth, time saved, cost reduction, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_FORMATS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                          selectedTemplate === t.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <t.icon className="w-4 h-4 text-violet-400" />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Case Study...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate Case Study</>
                  )}
                </button>
              </div>
            </div>

            {/* Metrics Showcase Preview */}
            <div className="space-y-6">
              <h3 className="font-semibold text-white/60">Before / After Metrics Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Revenue Growth', before: '$28K/mo', after: '$124K/mo', change: 343, direction: 'up' },
                  { label: 'Time to Market', before: '3 weeks', after: '2 days', change: -85, direction: 'down' },
                  { label: 'Customer Base', before: '12 clients', after: '52 clients', change: 333, direction: 'up' },
                  { label: 'Operating Cost', before: '$45K/mo', after: '$12K/mo', change: -73, direction: 'down' },
                ].map((metric) => (
                  <div key={metric.label} className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 mb-3">{metric.label}</p>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-xs text-white/30 line-through">{metric.before}</p>
                        <p className="text-xl font-bold">{metric.after}</p>
                      </div>
                      <div className={`flex items-center gap-0.5 text-sm font-bold ${metric.direction === 'up' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                        {metric.direction === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(metric.change)}%
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(metric.change) / 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-semibold mb-3">Testimonial Quote</h4>
                <div className="relative pl-4 border-l-2 border-violet-500">
                  <p className="text-sm text-white/60 italic leading-relaxed">
                    &ldquo;Zoobicon transformed how we deliver for clients. What used to take weeks now takes hours. Our team focuses on strategy while AI handles the execution. Revenue tripled in 6 months.&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold">MW</div>
                    <div>
                      <p className="text-sm font-medium">Marcus Wright</p>
                      <p className="text-xs text-white/40">CEO, Wright Digital Agency</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery */}
        {activeTab === 'gallery' && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search case studies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFilterTemplate(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterTemplate ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}>All</button>
                {TEMPLATE_FORMATS.map((t) => (
                  <button key={t.id} onClick={() => setFilterTemplate(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterTemplate === t.id ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}>{t.name}</button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {filteredCaseStudies.map((cs) => (
                <div key={cs.id} className={`p-6 rounded-2xl border transition ${cs.featured ? 'bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border-violet-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {cs.featured && <Award className="w-4 h-4 text-amber-400" />}
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/50">{cs.industry}</span>
                      </div>
                      <h3 className="text-lg font-bold">{cs.title}</h3>
                      <p className="text-sm text-white/40">{cs.client} | Published {cs.publishedAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopyLink(cs.id)} className="p-2 rounded-lg hover:bg-white/10 transition">
                        {copiedLink === cs.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 transition"><ExternalLink className="w-4 h-4 text-white/40" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {cs.metrics.map((m) => (
                      <div key={m.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-white/30 mb-1">{m.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold">{m.after}</span>
                          {m.change !== 0 && (
                            <span className={`text-xs font-medium flex items-center gap-0.5 ${m.direction === 'up' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                              {m.direction === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(m.change)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/20 mt-0.5">was {m.before}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/30">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {cs.views.toLocaleString()} views</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {cs.shares} shares</span>
                    </div>
                    <button className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium">
                      Read Full Study <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEMPLATE_FORMATS.map((t) => (
              <div key={t.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition cursor-pointer">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${t.color} flex items-center justify-center mb-4`}>
                  <t.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-1">{t.name} Case Study</h3>
                <p className="text-sm text-white/40 mb-4">{t.desc}</p>
                <div className="space-y-2 mb-4">
                  <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Includes:</h4>
                  {[
                    'Executive Summary',
                    'Client Background',
                    'The Challenge',
                    'The Solution',
                    'Implementation Timeline',
                    'Results & Metrics',
                    'Client Testimonial',
                    'Key Takeaways',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setSelectedTemplate(t.id); setActiveTab('generator'); }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  Use Template <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Export Options */}
        {activeTab === 'export' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="font-semibold mb-4">Export Formats</h3>
            {[
              { label: 'PDF Document', desc: 'Print-ready PDF with brand styling, charts, and metrics visualizations', icon: FileText, format: '.pdf', color: 'from-red-500 to-pink-500' },
              { label: 'Web Page (HTML)', desc: 'Standalone responsive HTML page with embedded styles and animations', icon: Globe, format: '.html', color: 'from-blue-500 to-cyan-500' },
              { label: 'Presentation Deck', desc: 'Slide deck format with key metrics, quotes, and visuals (coming soon)', icon: Layout, format: '.pptx', color: 'from-amber-500 to-orange-500' },
              { label: 'Markdown', desc: 'Clean markdown format for CMS, GitHub, or documentation sites', icon: FileText, format: '.md', color: 'from-emerald-500 to-teal-500' },
              { label: 'Social Media Kit', desc: 'Pre-sized images for LinkedIn, Twitter, and Instagram with key stats', icon: Share2, format: '.zip', color: 'from-violet-500 to-fuchsia-500' },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${opt.color} flex items-center justify-center shrink-0`}>
                  <opt.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{opt.label}</h4>
                  <p className="text-sm text-white/40">{opt.desc}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white/30 font-mono">{opt.format}</span>
                  <button className="block mt-1 px-4 py-1.5 rounded-lg bg-violet-600 text-xs font-medium hover:bg-violet-500 transition">
                    <Download className="w-3 h-3 inline mr-1" /> Export
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-3">Bulk Export</h3>
              <p className="text-sm text-white/40 mb-4">Export all published case studies in a single download</p>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">All as PDF (.zip)</button>
                <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">All as HTML (.zip)</button>
                <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">All as Markdown (.zip)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}