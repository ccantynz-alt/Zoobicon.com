'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  ChevronUp,
  MessageSquare,
  Tag,
  Search,
  Plus,
  ArrowRight,
  Filter,
  Check,
  Clock,
  Rocket,
  Zap,
  Users,
  AlertCircle,
  Merge,
  UserPlus,
  MoreHorizontal,
  X,
  Flag,
} from 'lucide-react';

type Status = 'new' | 'planned' | 'in-progress' | 'completed';
type Priority = 'critical' | 'high' | 'medium' | 'low';
type SortBy = 'votes' | 'newest' | 'comments';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  votes: number;
  comments: number;
  author: string;
  date: string;
  tags: string[];
  assignee?: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: typeof Lightbulb }> = {
  'new': { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Lightbulb },
  'planned': { label: 'Planned', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Zap },
  'completed': { label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Check },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  'critical': { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
  'high': { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  'medium': { label: 'BookOpen', color: 'bg-yellow-500/20 text-yellow-400' },
  'low': { label: 'Low', color: 'bg-gray-500/20 text-gray-400' },
};

const DEMO_REQUESTS: FeatureRequest[] = [
  { id: '1', title: 'WebContainer in-browser runtime for instant preview', description: 'Use WebContainers or similar technology to provide instant in-browser preview without server-side generation, similar to Bolt.new.', status: 'planned', priority: 'critical', votes: 342, comments: 47, author: 'DevMaster42', date: '2 weeks ago', tags: ['performance', 'core'], assignee: 'Engineering' },
  { id: '2', title: 'Real-time WebSocket collaboration', description: 'Replace poll-based collaboration with WebSocket connections for sub-100ms latency on cursor positions and code sync.', status: 'in-progress', priority: 'high', votes: 289, comments: 31, author: 'CollabFan', date: '3 weeks ago', tags: ['collaboration', 'infrastructure'], assignee: 'Platform Team' },
  { id: '3', title: 'React/Next.js code export (not just HTML)', description: 'Export generated sites as React components with proper JSX, hooks, and Next.js routing instead of vanilla HTML.', status: 'planned', priority: 'high', votes: 267, comments: 52, author: 'ReactDev99', date: '1 month ago', tags: ['export', 'framework'] },
  { id: '4', title: 'Version control with branching and merging', description: 'Git-like version control for sites — create branches, make changes, merge back to main. Essential for teams.', status: 'new', priority: 'medium', votes: 198, comments: 23, author: 'GitLover', date: '1 week ago', tags: ['collaboration', 'versioning'] },
  { id: '5', title: 'AI image generation directly in builder', description: 'Generate custom images inline while building sites instead of using stock photos. DALL-E or Stable Diffusion integration.', status: 'completed', priority: 'high', votes: 245, comments: 38, author: 'DesignPro', date: '2 months ago', tags: ['ai', 'images'] },
  { id: '6', title: 'Layers import — design to code in one click', description: 'Import Layers designs directly and convert to responsive HTML/CSS with AI. Preserve layers, components, and auto-layout.', status: 'in-progress', priority: 'medium', votes: 176, comments: 19, author: 'FigmaFan', date: '3 weeks ago', tags: ['import', 'design'], assignee: 'AI Team' },
  { id: '7', title: 'Custom domain SSL auto-provisioning', description: 'Automatically provision and renew SSL certificates when users connect custom domains, via Let\'s Encrypt.', status: 'planned', priority: 'high', votes: 156, comments: 14, author: 'HostingPro', date: '1 month ago', tags: ['hosting', 'security'] },
  { id: '8', title: 'Dark/light mode toggle on generated sites', description: 'Generate sites with built-in dark/light mode toggle. AI creates both color schemes, user switches with a button.', status: 'completed', priority: 'medium', votes: 203, comments: 28, author: 'DarkModeUser', date: '2 months ago', tags: ['feature', 'design'] },
  { id: '9', title: 'Mobile app builder (React Native export)', description: 'Generate React Native apps from prompts, not just websites. Export to Expo for instant mobile preview.', status: 'new', priority: 'low', votes: 134, comments: 42, author: 'MobileDev', date: '2 weeks ago', tags: ['mobile', 'export'] },
  { id: '10', title: 'Built-in analytics dashboard per site', description: 'Show traffic, page views, conversion rates, and visitor locations directly in the Zoobicon dashboard without external tools.', status: 'planned', priority: 'medium', votes: 167, comments: 15, author: 'DataDriven', date: '1 month ago', tags: ['analytics', 'dashboard'] },
  { id: '11', title: 'API rate limit increase for Pro plan', description: 'Current 60 req/min on Pro feels limiting for agency workflows. Requesting at least 120 req/min.', status: 'new', priority: 'medium', votes: 89, comments: 8, author: 'AgencyBuilder', date: '5 days ago', tags: ['api', 'pricing'] },
  { id: '12', title: 'Undo/redo keyboard shortcuts in visual editor', description: 'Ctrl+Z and Ctrl+Y for undo/redo in the visual editor. Currently only available through toolbar buttons.', status: 'completed', priority: 'low', votes: 145, comments: 7, author: 'KeyboardNinja', date: '6 weeks ago', tags: ['editor', 'ux'] },
  { id: '13', title: 'WordPress WooCommerce export', description: 'Export generated e-commerce sites as WooCommerce-compatible themes with product import.', status: 'new', priority: 'low', votes: 72, comments: 11, author: 'WPExpert', date: '3 days ago', tags: ['export', 'wordpress'] },
  { id: '14', title: 'Voice-to-website: describe your site by talking', description: 'Use speech-to-text to describe your website, AI converts to prompt and generates. Hands-free building.', status: 'new', priority: 'low', votes: 98, comments: 22, author: 'VoiceFirst', date: '10 days ago', tags: ['ai', 'accessibility'] },
  { id: '15', title: 'Scheduled deployments and rollback', description: 'Schedule a deployment for a specific time (e.g., launch at midnight). One-click rollback to any previous version.', status: 'new', priority: 'medium', votes: 112, comments: 9, author: 'DevOpsPro', date: '1 week ago', tags: ['hosting', 'deployment'] },
  { id: '16', title: 'Multi-language site generation', description: 'Generate sites in multiple languages from a single prompt. AI translates and adapts content for each locale.', status: 'in-progress', priority: 'medium', votes: 187, comments: 26, author: 'GlobalBuilder', date: '1 month ago', tags: ['i18n', 'ai'], assignee: 'AI Team' },
];

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState(DEMO_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('votes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showAdmin, setShowAdmin] = useState(false);

  const handleVote = (id: string) => {
    if (votedIds.has(id)) {
      setVotedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes - 1 } : r));
    } else {
      setVotedIds(prev => new Set(prev).add(id));
      setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
    }
  };

  const handleSubmit = () => {
    if (!newTitle.trim()) return;
    const newReq: FeatureRequest = {
      id: `new-${Date.now()}`, title: newTitle, description: newDesc, status: 'new',
      priority: 'medium', votes: 1, comments: 0, author: 'You', date: 'Just now', tags: [],
    };
    setRequests(prev => [newReq, ...prev]);
    setVotedIds(prev => new Set(prev).add(newReq.id));
    setNewTitle(''); setNewDesc(''); setShowSubmit(false);
  };

  let filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
  if (searchQuery) filtered = filtered.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase()));
  filtered = [...filtered].sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : sortBy === 'comments' ? b.comments - a.comments : 0);

  const counts = { all: requests.length, new: requests.filter(r => r.status === 'new').length, planned: requests.filter(r => r.status === 'planned').length, 'in-progress': requests.filter(r => r.status === 'in-progress').length, completed: requests.filter(r => r.status === 'completed').length };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Feature Requests</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/changelog" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Changelog</Link>
            <Link href="/roadmap" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Roadmap</Link>
            <button onClick={() => setShowSubmit(true)} className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-1">
              <Plus className="w-4 h-4" /> Submit Request
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
            <Lightbulb className="w-4 h-4" /> Community Driven
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Feature Requests</h1>
          <p className="text-lg text-gray-400">Vote on what we build next. Your voice shapes the product.</p>
        </div>

        {/* Submit Form */}
        {showSubmit && (
          <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-500/5 mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" /> Submit a Feature Request</h3>
              <button onClick={() => setShowSubmit(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Feature title" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the feature and why it's valuable..." rows={3} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none" />
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-purple-600 text-sm font-medium hover:bg-purple-500 transition-colors">Submit</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search requests..." className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            <option value="votes">Most Voted</option><option value="comments">Most Discussed</option><option value="newest">Newest</option>
          </select>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-6 overflow-x-auto">
          {(['all', 'new', 'planned', 'in-progress', 'completed'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Request List */}
        <div className="space-y-3">
          {filtered.map(req => {
            const status = STATUS_CONFIG[req.status];
            const priority = PRIORITY_CONFIG[req.priority];
            const voted = votedIds.has(req.id);
            return (
              <div key={req.id} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
                {/* Vote button */}
                <button onClick={() => handleVote(req.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${voted ? 'border-purple-500/50 bg-purple-500/20 text-purple-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30 hover:text-purple-400'}`}>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm font-bold">{req.votes}</span>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-sm">{req.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{req.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs border ${status.color}`}>{status.label}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${priority.color}`}>{priority.label}</span>
                    {req.tags.map(t => <span key={t} className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{t}</span>)}
                    <span className="text-xs text-gray-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{req.comments}</span>
                    <span className="text-xs text-gray-500">by {req.author} &middot; {req.date}</span>
                    {req.assignee && <span className="text-xs text-blue-400 flex items-center gap-1"><UserPlus className="w-3 h-3" />{req.assignee}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Tools Panel */}
        <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/5">
          <button onClick={() => setShowAdmin(!showAdmin)} className="flex items-center justify-between w-full">
            <h3 className="font-semibold flex items-center gap-2"><Flag className="w-5 h-5 text-purple-400" /> Admin Tools</h3>
            <span className="text-sm text-gray-400">{showAdmin ? 'Hide' : 'Show'}</span>
          </button>
          {showAdmin && (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {[
                { icon: Merge, label: 'Merge Duplicates', desc: 'Combine similar feature requests' },
                { icon: UserPlus, label: 'Assign to Team', desc: 'Route requests to the right team' },
                { icon: Tag, label: 'Bulk Tag', desc: 'Add tags to multiple requests' },
                { icon: AlertCircle, label: 'Flag for Review', desc: 'Mark requests needing moderation' },
              ].map((tool, i) => (
                <button onClick={() => {}} key={i} className="p-3 rounded-lg border border-white/10 bg-white/5 text-left hover:border-purple-500/30 transition-colors">
                  <tool.icon className="w-4 h-4 text-purple-400 mb-1" />
                  <div className="text-sm font-medium">{tool.label}</div>
                  <div className="text-xs text-gray-500">{tool.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: requests.length.toString(), icon: Lightbulb, color: 'text-purple-400' },
            { label: 'Total Votes', value: requests.reduce((a, r) => a + r.votes, 0).toLocaleString(), icon: ChevronUp, color: 'text-pink-400' },
            { label: 'Completed', value: requests.filter(r => r.status === 'completed').length.toString(), icon: Check, color: 'text-green-400' },
            { label: 'In Progress', value: requests.filter(r => r.status === 'in-progress').length.toString(), icon: Zap, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-6 text-center">How Feature Requests Work</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Submit', desc: 'Describe the feature you need and why it matters to your workflow.' },
              { step: '2', title: 'Vote', desc: 'Community upvotes help us prioritize what to build next.' },
              { step: '3', title: 'Build', desc: 'Top-voted requests move to our roadmap and get assigned to a team.' },
              { step: '4', title: 'Ship', desc: 'Completed features are announced in our changelog with your name credited.' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold mx-auto mb-2">{s.step}</div>
                <h4 className="font-medium text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-12 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20">
          <h2 className="text-3xl font-bold mb-4">Shape the Future of Zoobicon</h2>
          <p className="text-gray-400 mb-6">Submit your ideas, vote on what matters, and watch them come to life.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:opacity-90 transition-opacity">
              Submit a Request <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/roadmap" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/20 font-semibold hover:bg-white/5 transition-colors">View Roadmap</Link>
          </div>
        </div>
      </main>
    </div>
  );
}