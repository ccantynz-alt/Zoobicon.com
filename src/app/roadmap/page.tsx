'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Map,
  ChevronUp,
  Calendar,
  Filter,
  Tag,
  MessageSquare,
  ArrowRight,
  Check,
  Clock,
  Rocket,
  Zap,
  Users,
  Star,
  LayoutGrid,
  GanttChart,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  Sparkles,
  Eye,
  Lock,
  Globe,
  Code,
} from 'lucide-react';

type ViewMode = 'kanban' | 'timeline';
type KanbanColumn = 'backlog' | 'planned' | 'in-progress' | 'beta' | 'shipped';
type Category = 'all' | 'core' | 'ai' | 'hosting' | 'collaboration' | 'integrations' | 'mobile';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  column: KanbanColumn;
  category: string;
  votes: number;
  quarter?: string;
  eta?: string;
  tags: string[];
}

const COLUMN_CONFIG: Record<KanbanColumn, { label: string; color: string; icon: typeof Lightbulb }> = {
  'backlog': { label: 'Backlog', color: 'border-gray-500/30 bg-gray-500/5', icon: Lightbulb },
  'planned': { label: 'Planned', color: 'border-stone-500/30 bg-stone-500/5', icon: Calendar },
  'in-progress': { label: 'In Progress', color: 'border-stone-500/30 bg-stone-500/5', icon: Zap },
  'beta': { label: 'Beta', color: 'border-stone-500/30 bg-stone-500/5', icon: Eye },
  'shipped': { label: 'Shipped', color: 'border-stone-500/30 bg-stone-500/5', icon: Check },
};

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core Builder' },
  { id: 'ai', label: 'AI & Models' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'mobile', label: 'Mobile' },
];

const ROADMAP_ITEMS: RoadmapItem[] = [
  { id: '1', title: 'WebContainer in-browser runtime', description: 'Instant preview without server-side generation using in-browser Node.js', column: 'planned', category: 'core', votes: 342, quarter: 'Q2 2026', eta: 'Jun 2026', tags: ['performance'] },
  { id: '2', title: 'WebSocket real-time collaboration', description: 'Replace polling with WebSocket for sub-100ms latency', column: 'in-progress', category: 'collaboration', votes: 289, quarter: 'Q1 2026', eta: 'Apr 2026', tags: ['infrastructure'] },
  { id: '3', title: 'React/Next.js code export', description: 'Export as proper React components with JSX and hooks', column: 'planned', category: 'core', votes: 267, quarter: 'Q2 2026', eta: 'May 2026', tags: ['export'] },
  { id: '4', title: 'AI Brand Kit persistence', description: 'Save colors, fonts, logos, voice — auto-apply to all builds', column: 'in-progress', category: 'ai', votes: 234, quarter: 'Q1 2026', tags: ['personalization'] },
  { id: '5', title: 'Custom domain SSL auto-provisioning', description: "Let's Encrypt auto-provision for connected custom domains", column: 'planned', category: 'hosting', votes: 156, quarter: 'Q2 2026', tags: ['security'] },
  { id: '6', title: 'Figma design import', description: 'Import Figma designs and convert to responsive HTML/CSS', column: 'in-progress', category: 'integrations', votes: 176, quarter: 'Q1 2026', eta: 'Apr 2026', tags: ['design'] },
  { id: '7', title: 'Multi-language generation', description: 'Generate sites in multiple languages from one prompt', column: 'in-progress', category: 'ai', votes: 187, quarter: 'Q1 2026', tags: ['i18n'] },
  { id: '8', title: 'Version branching & merging', description: 'Git-like version control for sites with branch and merge', column: 'backlog', category: 'collaboration', votes: 198, tags: ['versioning'] },
  { id: '9', title: 'Mobile app builder', description: 'React Native export via Expo for instant mobile preview', column: 'backlog', category: 'mobile', votes: 134, tags: ['mobile'] },
  { id: '10', title: 'Site analytics dashboard', description: 'Built-in traffic, conversion, and visitor analytics', column: 'planned', category: 'hosting', votes: 167, quarter: 'Q2 2026', tags: ['analytics'] },
  { id: '11', title: 'AI image generation v2', description: 'DALL-E 3 + Stable Diffusion inline image generation', column: 'shipped', category: 'ai', votes: 245, tags: ['images'] },
  { id: '12', title: 'Dark/light mode toggle', description: 'Built-in theme toggle on generated sites', column: 'shipped', category: 'core', votes: 203, tags: ['design'] },
  { id: '13', title: 'Undo/redo keyboard shortcuts', description: 'Ctrl+Z / Ctrl+Y in visual editor', column: 'shipped', category: 'core', votes: 145, tags: ['editor'] },
  { id: '14', title: 'Agency white-label platform', description: 'Full white-label with client portal and approval workflow', column: 'shipped', category: 'core', votes: 310, tags: ['agency'] },
  { id: '15', title: 'Voice-to-website', description: 'Describe your site by talking, AI converts to prompt', column: 'backlog', category: 'ai', votes: 98, tags: ['accessibility'] },
  { id: '16', title: 'Shopify integration', description: 'Export e-commerce sites directly to Shopify', column: 'backlog', category: 'integrations', votes: 89, tags: ['ecommerce'] },
  { id: '17', title: 'Instant scaffold architecture', description: '3s to first preview with template pre-matching', column: 'in-progress', category: 'core', votes: 278, quarter: 'Q1 2026', eta: 'Apr 2026', tags: ['performance'] },
  { id: '18', title: 'Creator profiles & portfolios', description: 'Public profile pages showcasing built sites', column: 'planned', category: 'collaboration', votes: 145, quarter: 'Q2 2026', tags: ['community'] },
  { id: '19', title: 'Prompt gallery & community', description: 'Share prompts, upvote, remix sites', column: 'planned', category: 'collaboration', votes: 201, quarter: 'Q2 2026', tags: ['community'] },
  { id: '20', title: 'OpenClaw agent integration', description: 'Autonomous SEO/optimizer agents via OpenClaw framework', column: 'backlog', category: 'ai', votes: 67, tags: ['autonomous'] },
  { id: '21', title: 'MCP support', description: 'Model Context Protocol for GitHub, Notion, Figma context', column: 'planned', category: 'integrations', votes: 112, quarter: 'Q2 2026', tags: ['context'] },
  { id: '22', title: 'Email marketing (native)', description: 'Built-in list builder, AI newsletters, one-click send', column: 'planned', category: 'core', votes: 189, quarter: 'Q3 2026', tags: ['marketing'] },
];

const TIMELINE_QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026'];

export default function RoadmapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [categoryFilter, setCategoryFilter] = useState<Category>('all');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState(ROADMAP_ITEMS);

  const handleVote = (id: string) => {
    if (votedIds.has(id)) {
      setVotedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      setItems(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes - 1 } : i));
    } else {
      setVotedIds(prev => new Set(prev).add(id));
      setItems(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
    }
  };

  const filteredItems = categoryFilter === 'all' ? items : items.filter(i => i.category === categoryFilter);
  const columns: KanbanColumn[] = ['backlog', 'planned', 'in-progress', 'beta', 'shipped'];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Roadmap</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/changelog" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Changelog</Link>
            <Link href="/feature-requests" className="px-4 py-2 text-sm bg-gradient-to-r from-stone-600 to-stone-600 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-1">
              <Lightbulb className="w-4 h-4" /> Request Feature
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm mb-6">
            <Map className="w-4 h-4" /> Public Roadmap
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Where We&apos;re <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Headed</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our public product roadmap. Vote on planned features to help us prioritize what matters most to you.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${viewMode === 'kanban' ? 'bg-stone-500/20 text-stone-400' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /> Kanban</button>
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${viewMode === 'timeline' ? 'bg-stone-500/20 text-stone-400' : 'text-gray-400'}`}><GanttChart className="w-4 h-4" /> Timeline</button>
          </div>
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10 overflow-x-auto">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategoryFilter(c.id as Category)}
                className={`px-3 py-1.5 rounded text-xs whitespace-nowrap ${categoryFilter === c.id ? 'bg-stone-500/20 text-stone-400' : 'text-gray-400 hover:text-white'}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
            {columns.map(col => {
              const config = COLUMN_CONFIG[col];
              const colItems = filteredItems.filter(i => i.column === col).sort((a, b) => b.votes - a.votes);
              return (
                <div key={col} className={`rounded-xl border ${config.color} p-3 min-w-[240px]`}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <config.icon className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-white/10 text-xs">{colItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colItems.map(item => {
                      const voted = votedIds.has(item.id);
                      return (
                        <div key={item.id} className="p-3 rounded-lg bg-[#0a0a12] border border-white/10 hover:border-white/20 transition-colors">
                          <h4 className="text-sm font-medium mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {item.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400">{t}</span>)}
                          </div>
                          <div className="flex items-center justify-between">
                            <button onClick={() => handleVote(item.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${voted ? 'bg-stone-500/20 text-stone-400 border border-stone-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-stone-400'}`}>
                              <ChevronUp className="w-3 h-3" /> {item.votes}
                            </button>
                            {item.eta && <span className="text-[10px] text-gray-500">{item.eta}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="space-y-8">
            {TIMELINE_QUARTERS.map(quarter => {
              const quarterItems = filteredItems.filter(i => i.quarter === quarter).sort((a, b) => b.votes - a.votes);
              if (quarterItems.length === 0) return null;
              return (
                <div key={quarter}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-stone-400" />
                    {quarter}
                    <span className="text-sm text-gray-400 font-normal">({quarterItems.length} items)</span>
                  </h3>
                  <div className="relative pl-8 border-l-2 border-stone-500/20 space-y-4">
                    {quarterItems.map(item => {
                      const colConfig = COLUMN_CONFIG[item.column];
                      const voted = votedIds.has(item.id);
                      return (
                        <div key={item.id} className="relative">
                          <div className="absolute -left-[25px] top-3 w-4 h-4 rounded-full border-2 border-stone-500 bg-[#0a0a12]" />
                          <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] border ${colConfig.color}`}>{colConfig.label}</span>
                              {item.eta && <span className="text-xs text-gray-500">ETA: {item.eta}</span>}
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleVote(item.id)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${voted ? 'bg-stone-500/20 text-stone-400' : 'bg-white/5 text-gray-400 hover:text-stone-400'}`}>
                                <ChevronUp className="w-3 h-3" /> {item.votes}
                              </button>
                              {item.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400">{t}</span>)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Backlog (no quarter) */}
            {filteredItems.filter(i => !i.quarter).length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-gray-400" />
                  Under Consideration
                  <span className="text-sm text-gray-400 font-normal">({filteredItems.filter(i => !i.quarter).length} items)</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems.filter(i => !i.quarter).sort((a, b) => b.votes - a.votes).map(item => {
                    const voted = votedIds.has(item.id);
                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                        <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                        <button onClick={() => handleVote(item.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${voted ? 'bg-stone-500/20 text-stone-400' : 'bg-white/5 text-gray-400 hover:text-stone-400'}`}>
                          <ChevronUp className="w-3 h-3" /> {item.votes}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-stone-600/20 to-stone-600/20 border border-stone-500/20">
          <h2 className="text-3xl font-bold mb-4">Help Us Build the Future</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Vote on features that matter to you. Submit ideas. Track progress from backlog to shipped.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/feature-requests" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-semibold hover:opacity-90 transition-opacity">
              Request a Feature <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/changelog" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/20 font-semibold hover:bg-white/5 transition-colors">
              View Changelog <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}