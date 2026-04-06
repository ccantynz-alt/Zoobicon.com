'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquareQuote,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  Plus,
  Copy,
  Code,
  ExternalLink,
  Filter,
  Search,
  Layout,
  Columns,
  Grid3X3,
  Image,
  Upload,
  Sparkles,
  Eye,
  Award,
  ChevronDown,
  MoreHorizontal,
  Calendar,
  Globe,
  MessageCircle,
} from 'lucide-react';

const DEMO_TESTIMONIALS = [
  { id: 1, name: 'Sarah Mitchell', role: 'Founder, LaunchPad AI', avatar: 'SM', text: 'Zoobicon built our entire landing page in under 2 minutes. We went from concept to live site during a single coffee break. Conversions jumped 47% compared to our old hand-coded page.', rating: 5, featured: true, approved: true, date: '2026-03-18', source: 'twitter' },
  { id: 2, name: 'James Rodriguez', role: 'CTO, DataStream', avatar: 'JR', text: 'The full-stack generation is unreal. Database schema, API routes, and a complete CRUD frontend — all from a single prompt. Saved our team 3 weeks of boilerplate.', rating: 5, featured: true, approved: true, date: '2026-03-15', source: 'email' },
  { id: 3, name: 'Emily Chen', role: 'Marketing Director, Bloom Health', avatar: 'EC', text: 'We replaced 4 different tools with Zoobicon. Landing pages, email templates, social assets — everything comes from one place now. Our workflow is 10x faster.', rating: 5, featured: false, approved: true, date: '2026-03-12', source: 'g2' },
  { id: 4, name: 'Marcus Wright', role: 'Agency Owner, Wright Digital', avatar: 'MW', text: 'The white-label feature is a game changer for agencies. Clients think we built everything custom. We deliver 5x more projects per month now.', rating: 5, featured: false, approved: true, date: '2026-03-10', source: 'email' },
  { id: 5, name: 'Priya Patel', role: 'Freelance Designer', avatar: 'PP', text: 'I was skeptical about AI web builders, but the output quality here is genuinely premium. My clients can not tell the difference from hand-coded sites.', rating: 4, featured: false, approved: true, date: '2026-03-08', source: 'twitter' },
  { id: 6, name: 'David Kim', role: 'VP Engineering, NexGen', avatar: 'DK', text: 'The e-commerce generator produced a fully functional store with cart, checkout, and inventory. We launched our MVP in a single afternoon.', rating: 5, featured: false, approved: true, date: '2026-03-05', source: 'email' },
  { id: 7, name: 'Lisa Thompson', role: 'CEO, BrightPath', avatar: 'LT', text: 'Zoobicon replaced our entire front-end dev hire. Not exaggerating. The multi-page site generator produces better results than most junior developers.', rating: 5, featured: true, approved: true, date: '2026-03-02', source: 'linkedin' },
  { id: 8, name: 'Carlos Mendez', role: 'Product Manager, FinTrack', avatar: 'CM', text: 'Good tool but the generation sometimes takes a while. Output quality is excellent though — definitely the best AI builder I have tried.', rating: 4, featured: false, approved: true, date: '2026-02-28', source: 'g2' },
  { id: 9, name: 'Anna Kowalski', role: 'Startup Founder', avatar: 'AK', text: 'Pending review — just submitted.', rating: 5, featured: false, approved: false, date: '2026-03-20', source: 'form' },
];

type DisplayMode = 'wall' | 'carousel' | 'quotes';
type TabType = 'all' | 'approved' | 'pending' | 'featured';

export default function TestimonialsWallPage() {
  const [testimonials, setTestimonials] = useState(DEMO_TESTIMONIALS);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('wall');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const filtered = testimonials.filter((t) => {
    if (activeTab === 'approved') return t.approved;
    if (activeTab === 'pending') return !t.approved;
    if (activeTab === 'featured') return t.featured;
    return true;
  }).filter((t) => !searchQuery || t.text.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const approvedTestimonials = testimonials.filter(t => t.approved);

  const handleApprove = (id: number) => {
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, approved: true } : t));
  };

  const handleReject = (id: number) => {
    setTestimonials(testimonials.filter(t => t.id !== id));
  };

  const handleToggleFeatured = (id: number) => {
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, featured: !t.featured } : t));
  };

  const copyEmbedCode = () => {
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'twitter': return <MessageCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'g2': return <Star className="w-3.5 h-3.5 text-orange-400" />;
      case 'linkedin': return <Globe className="w-3.5 h-3.5 text-blue-500" />;
      default: return <MessageSquareQuote className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Testimonial Wall</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCollectForm(!showCollectForm)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Plus className="w-4 h-4" /> Collect
            </button>
            <button onClick={() => setShowEmbedCode(!showEmbedCode)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
              <Code className="w-4 h-4" /> Embed Code
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Testimonials', value: testimonials.length, color: 'text-white' },
            { label: 'Approved', value: testimonials.filter(t => t.approved).length, color: 'text-emerald-400' },
            { label: 'Pending Review', value: testimonials.filter(t => !t.approved).length, color: 'text-yellow-400' },
            { label: 'Avg Rating', value: (testimonials.filter(t => t.approved).reduce((a, t) => a + t.rating, 0) / approvedTestimonials.length).toFixed(1), color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/40">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Embed Code Modal */}
        {showEmbedCode && (
          <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Embed Code</h3>
              <button onClick={() => setShowEmbedCode(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="bg-black/50 rounded-xl p-4 font-mono text-sm text-green-400 mb-3 overflow-x-auto">
              {`<script src="https://zoobicon.com/embed/testimonials.js" data-wall-id="tw_demo_12345" data-theme="dark"></script>`}
            </div>
            <button onClick={copyEmbedCode} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium hover:bg-violet-500 transition">
              {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedEmbed ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        )}

        {/* Collection Form */}
        {showCollectForm && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold">Collection Form Link</h3>
              </div>
              <button onClick={() => setShowCollectForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <p className="text-sm text-white/50 mb-3">Share this link with customers to collect testimonials</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 rounded-lg px-4 py-2.5 border border-white/10 text-sm text-white/70">
                https://zoobicon.com/collect/tw_demo_12345
              </div>
              <button onClick={() => {}} className="px-4 py-2.5 rounded-lg bg-violet-600 text-sm font-medium hover:bg-violet-500 transition"><Copy className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <button onClick={() => {}} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-center">
                <Upload className="w-5 h-5 mx-auto mb-1 text-violet-400" /> Import CSV
              </button>
              <button onClick={() => {}} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-center">
                <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-400" /> Import MessageCircle
              </button>
              <button onClick={() => {}} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-orange-400" /> Import G2
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {[
              { id: 'all' as TabType, label: 'All', count: testimonials.length },
              { id: 'approved' as TabType, label: 'Approved', count: testimonials.filter(t => t.approved).length },
              { id: 'pending' as TabType, label: 'Pending', count: testimonials.filter(t => !t.approved).length },
              { id: 'featured' as TabType, label: 'Featured', count: testimonials.filter(t => t.featured).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label} <span className="ml-1 text-xs opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {[
                { id: 'wall' as DisplayMode, icon: Grid3X3 },
                { id: 'carousel' as DisplayMode, icon: Columns },
                { id: 'quotes' as DisplayMode, icon: MessageSquareQuote },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDisplayMode(m.id)}
                  className={`px-3 py-2 transition ${displayMode === m.id ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <m.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wall Display */}
        {displayMode === 'wall' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((t) => (
              <div key={t.id} className={`break-inside-avoid p-5 rounded-2xl border transition ${t.featured ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {sourceIcon(t.source)}
                    {t.featured && <Award className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">{t.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">{t.date}</span>
                  <div className="flex items-center gap-1">
                    {!t.approved && (
                      <>
                        <button onClick={() => handleApprove(t.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 transition"><Check className="w-4 h-4 text-emerald-400" /></button>
                        <button onClick={() => handleReject(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition"><X className="w-4 h-4 text-red-400" /></button>
                      </>
                    )}
                    <button onClick={() => handleToggleFeatured(t.id)} className="p-1.5 rounded-lg hover:bg-amber-500/20 transition">
                      <Award className={`w-4 h-4 ${t.featured ? 'text-amber-400' : 'text-white/30'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carousel Display */}
        {displayMode === 'carousel' && (
          <div className="relative">
            {approvedTestimonials.length > 0 && (
              <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {approvedTestimonials[carouselIdx % approvedTestimonials.length].avatar}
                </div>
                <div className="flex gap-0.5 justify-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < approvedTestimonials[carouselIdx % approvedTestimonials.length].rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <p className="text-lg text-white/80 leading-relaxed mb-6 italic">&ldquo;{approvedTestimonials[carouselIdx % approvedTestimonials.length].text}&rdquo;</p>
                <p className="font-semibold">{approvedTestimonials[carouselIdx % approvedTestimonials.length].name}</p>
                <p className="text-sm text-white/40">{approvedTestimonials[carouselIdx % approvedTestimonials.length].role}</p>
                <div className="flex justify-center gap-2 mt-6">
                  {approvedTestimonials.map((_, i) => (
                    <button key={i} onClick={() => setCarouselIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === carouselIdx % approvedTestimonials.length ? 'bg-violet-500' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote Cards Display */}
        {displayMode === 'quotes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.filter(t => t.approved).map((t) => (
              <div key={t.id} className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden">
                <MessageSquareQuote className="absolute top-4 right-4 w-12 h-12 text-violet-500/10" />
                <p className="text-white/70 leading-relaxed mb-4 relative z-10">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}