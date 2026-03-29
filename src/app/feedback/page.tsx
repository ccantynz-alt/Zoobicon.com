'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ThumbsUp,
  ChevronRight,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  Rocket,
  Eye,
  Tag,
  MoreVertical,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  Zap,
  LayoutGrid,
  List,
  ChevronUp,
  X,
  Star,
} from 'lucide-react';

type TabType = 'board' | 'roadmap' | 'changelog';
type RequestStatus = 'under-review' | 'planned' | 'in-progress' | 'shipped';
type SortBy = 'votes' | 'newest' | 'trending';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  votes: number;
  comments: number;
  author: string;
  authorAvatar: string;
  createdAt: string;
  category: string;
  voted: boolean;
}

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'feature' | 'improvement' | 'fix';
  tags: string[];
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  'under-review': { label: 'Under Review', color: 'text-white/60', bgColor: 'bg-white/10', icon: <Eye className="w-3.5 h-3.5" /> },
  'planned': { label: 'Planned', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  'in-progress': { label: 'In Progress', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: <Zap className="w-3.5 h-3.5" /> },
  'shipped': { label: 'Shipped', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: <Rocket className="w-3.5 h-3.5" /> },
};

const DEMO_REQUESTS: FeatureRequest[] = [
  { id: 'r1', title: 'In-Browser Code Runtime (WebContainers)', description: 'Run generated code directly in the browser without deploying. Like Bolt.new and StackBlitz.', status: 'planned', votes: 347, comments: 42, author: 'Alex K.', authorAvatar: 'AK', createdAt: '2026-02-15', category: 'Builder', voted: false },
  { id: 'r2', title: 'AI Auto-Completion in Code Editor', description: 'Add GitHub Copilot-style code completion when editing generated code manually.', status: 'in-progress', votes: 289, comments: 31, author: 'Priya M.', authorAvatar: 'PM', createdAt: '2026-02-20', category: 'Editor', voted: true },
  { id: 'r3', title: 'Layers Plugin for Direct Import', description: 'Import Layers designs directly into Zoobicon with one click, maintaining layers and styles.', status: 'under-review', votes: 234, comments: 28, author: 'David L.', authorAvatar: 'DL', createdAt: '2026-03-01', category: 'Integrations', voted: false },
  { id: 'r4', title: 'Team Workspaces with Role-Based Access', description: 'Allow agencies to create team workspaces with editor, viewer, and admin roles.', status: 'planned', votes: 198, comments: 19, author: 'Sarah C.', authorAvatar: 'SC', createdAt: '2026-03-05', category: 'Agency', voted: false },
  { id: 'r5', title: 'Version Branching and Merge', description: 'Fork a site into branches and merge changes. Like Git branching for websites.', status: 'under-review', votes: 176, comments: 15, author: 'Marcus R.', authorAvatar: 'MR', createdAt: '2026-03-08', category: 'Builder', voted: false },
  { id: 'r6', title: 'React/Next.js Component Export', description: 'Export generated HTML as reusable React components with proper TypeScript types.', status: 'shipped', votes: 312, comments: 56, author: 'Luna W.', authorAvatar: 'LW', createdAt: '2026-01-20', category: 'Export', voted: true },
  { id: 'r7', title: 'Scheduled Deployments', description: 'Schedule site deployments for a future date/time. Great for product launches.', status: 'under-review', votes: 145, comments: 12, author: 'Tom H.', authorAvatar: 'TH', createdAt: '2026-03-12', category: 'Hosting', voted: false },
  { id: 'r8', title: 'AI A/B Testing with Auto-Optimization', description: 'Generate variant designs and automatically route traffic to the best performer.', status: 'in-progress', votes: 267, comments: 34, author: 'Emma J.', authorAvatar: 'EJ', createdAt: '2026-02-25', category: 'Builder', voted: true },
  { id: 'r9', title: 'Dark Mode Toggle for Generated Sites', description: 'Add an automatic dark/light mode toggle to every generated site.', status: 'shipped', votes: 201, comments: 23, author: 'Kai N.', authorAvatar: 'KN', createdAt: '2026-02-01', category: 'Generator', voted: false },
  { id: 'r10', title: 'API Webhook Notifications', description: 'Send webhooks on events like deploy complete, generation done, or error occurred.', status: 'shipped', votes: 189, comments: 17, author: 'Rin T.', authorAvatar: 'RT', createdAt: '2026-01-15', category: 'API', voted: false },
  { id: 'r11', title: 'Custom Font Upload', description: 'Upload custom fonts (.woff2) and use them in generated sites.', status: 'planned', votes: 156, comments: 14, author: 'Noah B.', authorAvatar: 'NB', createdAt: '2026-03-15', category: 'Editor', voted: false },
  { id: 'r12', title: 'Password-Protected Pages', description: 'Add password protection to individual pages or entire sites for private content.', status: 'under-review', votes: 132, comments: 9, author: 'Maya S.', authorAvatar: 'MS', createdAt: '2026-03-18', category: 'Hosting', voted: false },
];

const CHANGELOG: ChangelogEntry[] = [
  { id: 'cl1', title: 'Multi-Page Site Generation', description: 'Generate up to 6 interconnected pages with shared navigation, design system, and footer. Each page maintains consistent branding.', date: '2026-03-20', type: 'feature', tags: ['Generator', 'Multi-Page'] },
  { id: 'cl2', title: 'Visual Editor Improvements', description: 'Click-to-select now supports nested elements. Added section reordering, duplicate, and delete controls.', date: '2026-03-15', type: 'improvement', tags: ['Editor', 'UX'] },
  { id: 'cl3', title: 'React Component Export', description: 'Export your generated site as clean React components with TypeScript types and Tailwind CSS.', date: '2026-03-10', type: 'feature', tags: ['Export', 'React'] },
  { id: 'cl4', title: 'Fixed Mobile Preview Scaling', description: 'Mobile preview viewport now accurately represents device widths. Fixed CSS overflow issues.', date: '2026-03-05', type: 'fix', tags: ['Preview', 'Mobile'] },
  { id: 'cl5', title: 'API v1 with Webhook Support', description: 'Public REST API for programmatic site generation with webhook callbacks on completion.', date: '2026-02-28', type: 'feature', tags: ['API', 'Webhooks'] },
];

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('votes');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [requests, setRequests] = useState(DEMO_REQUESTS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const categories = ['all', ...new Set(DEMO_REQUESTS.map(r => r.category))];

  const handleVote = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: r.voted ? r.votes - 1 : r.votes + 1, voted: !r.voted } : r));
  };

  const filteredRequests = requests
    .filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.votes * 0.5 + b.comments) - (a.votes * 0.5 + a.comments);
    });

  const roadmapStatuses: RequestStatus[] = ['under-review', 'planned', 'in-progress', 'shipped'];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'board', label: 'Feature Board', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'changelog', label: 'Changelog', icon: <List className="w-4 h-4" /> },
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
              <MessageSquare className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Feedback & Roadmap</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: requests.length, icon: <MessageSquare className="w-5 h-5 text-violet-400" /> },
            { label: 'Total Votes', value: requests.reduce((s, r) => s + r.votes, 0).toLocaleString(), icon: <ThumbsUp className="w-5 h-5 text-blue-400" /> },
            { label: 'Shipped', value: requests.filter(r => r.status === 'shipped').length, icon: <Rocket className="w-5 h-5 text-green-400" /> },
            { label: 'In Progress', value: requests.filter(r => r.status === 'in-progress').length, icon: <Zap className="w-5 h-5 text-amber-400" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5 flex items-center gap-4">
              {stat.icon}
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-600/25">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* New Request Form */}
        {showNewForm && (
          <div className="bg-white/5 rounded-2xl border border-violet-500/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Submit Feature Request</h3>
              <button onClick={() => setShowNewForm(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Feature title" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
              <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} placeholder="Describe the feature and why it would be useful..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">Submit</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search requests..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filterCategory === cat ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>{cat}</button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="votes">Most Voted</option>
                <option value="newest">Newest</option>
                <option value="trending">Trending</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredRequests.map(request => {
                const statusCfg = STATUS_CONFIG[request.status];
                return (
                  <div key={request.id} className="bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 p-5 flex items-center gap-5 transition-all">
                    <button onClick={() => handleVote(request.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${request.voted ? 'bg-violet-600/20 border border-violet-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                      <ChevronUp className={`w-4 h-4 ${request.voted ? 'text-violet-400' : 'text-white/40'}`} />
                      <span className={`text-sm font-bold ${request.voted ? 'text-violet-400' : 'text-white/60'}`}>{request.votes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-sm">{request.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.bgColor} ${statusCfg.color} flex items-center gap-1`}>{statusCfg.icon}{statusCfg.label}</span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-1 mb-2">{request.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span className="flex items-center gap-1"><div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center text-[10px] font-bold">{request.authorAvatar}</div>{request.author}</span>
                        <span>{request.createdAt}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{request.comments}</span>
                        <span className="px-2 py-0.5 bg-white/5 rounded-full">{request.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roadmapStatuses.map(status => {
              const statusCfg = STATUS_CONFIG[status];
              const statusRequests = requests.filter(r => r.status === status).sort((a, b) => b.votes - a.votes);
              return (
                <div key={status}>
                  <div className={`flex items-center gap-2 mb-3 ${statusCfg.color}`}>
                    {statusCfg.icon}
                    <span className="text-sm font-medium">{statusCfg.label}</span>
                    <span className="text-xs opacity-50 ml-auto">{statusRequests.length}</span>
                  </div>
                  <div className="space-y-3">
                    {statusRequests.map(request => (
                      <div key={request.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                        <h4 className="text-sm font-medium mb-2">{request.title}</h4>
                        <p className="text-xs text-white/40 line-clamp-2 mb-3">{request.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/40">{request.category}</span>
                          <span className="text-xs text-white/30 flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{request.votes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {CHANGELOG.map(entry => {
              const typeConfig = { feature: { label: 'New Feature', color: 'text-green-400', bg: 'bg-green-500/20' }, improvement: { label: 'Improvement', color: 'text-blue-400', bg: 'bg-blue-500/20' }, fix: { label: 'Bug Fix', color: 'text-amber-400', bg: 'bg-amber-500/20' } };
              const cfg = typeConfig[entry.type];
              return (
                <div key={entry.id} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-white/30">{entry.date}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{entry.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3">{entry.description}</p>
                  <div className="flex gap-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/40">{tag}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Canny ($400/mo), Productboard ($20/mo), and UserVoice &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
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
