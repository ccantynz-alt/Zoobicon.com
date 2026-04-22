'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Trophy,
  TrendingUp,
  Mail,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Share2,
  Award,
  Eye,
  Sparkles,
  Palette,
  Settings,
  BarChart3,
  Clock,
  UserPlus,
  ExternalLink,
  ArrowUpRight,
  Zap,
  Hash,
  Globe,
  Star,
} from 'lucide-react';

function generateWaitlistEntries() {
  const firstNames = ['Emma', 'Liam', 'Sophia', 'Noah', 'Olivia', 'James', 'Ava', 'Mason', 'Mia', 'Ethan', 'Isabella', 'Logan', 'Charlotte', 'Lucas', 'Amelia', 'Benjamin', 'Harper', 'Elijah', 'Evelyn', 'Alexander', 'Luna', 'Daniel', 'Chloe', 'Sebastian', 'Ella', 'Jack', 'Aria', 'Owen', 'Scarlett', 'Henry', 'Grace', 'Samuel', 'Lily', 'Ryan', 'Nora', 'Leo', 'Zoey', 'Nathan', 'Riley', 'Caleb', 'Hannah', 'Isaac', 'Layla', 'Dylan', 'Penelope', 'Gabriel', 'Aurora', 'Carter', 'Stella', 'Julian', 'Maya', 'Luke', 'Violet'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'protonmail.com', 'hey.com', 'fastmail.com'];
  const sources = ['twitter', 'linkedin', 'direct', 'referral', 'producthunt', 'reddit', 'google'];

  return Array.from({ length: 53 }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[i % lastNames.length];
    const referrals = Math.max(0, Math.floor(Math.random() * 12) - 3);
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: i + 1,
      position: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`,
      referrals,
      referralCode: `ZB${String(1000 + i).slice(1)}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      joinedAt: date.toISOString().split('T')[0],
      priority: referrals >= 5 ? 'vip' : referrals >= 2 ? 'high' : 'normal',
    };
  });
}

export default function WaitlistPage() {
  const [entries] = useState(generateWaitlistEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'referrals' | 'date'>('position');
  const [activeTab, setActiveTab] = useState<'subscribers' | 'referrals' | 'analytics' | 'builder'>('subscribers');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let list = entries.filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'referrals') list = [...list].sort((a, b) => b.referrals - a.referrals);
    if (sortBy === 'date') list = [...list].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
    return list;
  }, [entries, searchQuery, sortBy]);

  const topReferrers = useMemo(() => [...entries].sort((a, b) => b.referrals - a.referrals).slice(0, 10), [entries]);

  const dailySignups = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => { counts[e.joinedAt] = (counts[e.joinedAt] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  }, [entries]);

  const totalReferrals = entries.reduce((s, e) => s + e.referrals, 0);

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sourceColors: Record<string, string> = {
    twitter: 'bg-stone-500/20 text-stone-400',
    linkedin: 'bg-stone-500/20 text-stone-400',
    direct: 'bg-stone-500/20 text-stone-400',
    referral: 'bg-stone-500/20 text-stone-400',
    producthunt: 'bg-stone-500/20 text-stone-400',
    reddit: 'bg-stone-500/20 text-stone-400',
    google: 'bg-stone-500/20 text-stone-400',
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Waitlist Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 hover:opacity-90 transition text-sm font-medium">
              <Eye className="w-4 h-4" /> Preview Page
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Signups', value: entries.length, icon: Users, color: 'text-white', delta: '+12 this week' },
            { label: 'Total Referrals', value: totalReferrals, icon: Share2, color: 'text-stone-400', delta: `${((totalReferrals / entries.length) * 100).toFixed(0)}% referral rate` },
            { label: 'VIP Entries', value: entries.filter(e => e.priority === 'vip').length, icon: Award, color: 'text-stone-400', delta: '5+ referrals each' },
            { label: 'Avg/Day', value: (entries.length / 30).toFixed(1), icon: TrendingUp, color: 'text-stone-400', delta: 'Last 30 days' },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-white/20" />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-white/30 mt-1">{stat.delta}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'subscribers' as const, label: 'Subscribers', icon: Users },
            { id: 'referrals' as const, label: 'Referral Leaderboard', icon: Trophy },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'builder' as const, label: 'Page Builder', icon: Palette },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-stone-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">Sort:</span>
                {(['position', 'referrals', 'date'] as const).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === s ? 'bg-stone-600' : 'bg-white/5 hover:bg-white/10'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Referrals</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Referral Code</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 20).map((entry) => (
                    <tr key={entry.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                      <td className="px-4 py-3 text-sm text-white/40 font-mono">{entry.position}</td>
                      <td className="px-4 py-3 text-sm font-medium">{entry.name}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{entry.email}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${sourceColors[entry.source] || 'bg-white/10 text-white/60'}`}>{entry.source}</span></td>
                      <td className="px-4 py-3 text-sm">
                        <span className={entry.referrals > 0 ? 'text-stone-400 font-medium' : 'text-white/30'}>{entry.referrals}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleCopyCode(entry.referralCode)} className="flex items-center gap-1 font-mono text-xs text-stone-400 hover:text-stone-300">
                          {entry.referralCode}
                          {copiedCode === entry.referralCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">{entry.joinedAt}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          entry.priority === 'vip' ? 'bg-stone-500/20 text-stone-400' :
                          entry.priority === 'high' ? 'bg-stone-500/20 text-stone-400' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {entry.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-white/30 mt-3 text-center">Showing 20 of {sorted.length} entries</p>
          </div>
        )}

        {/* Referral Leaderboard */}
        {activeTab === 'referrals' && (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {topReferrers.map((entry, i) => (
                <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${i < 3 ? 'bg-gradient-to-r from-stone-500/10 to-transparent border-stone-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-stone-500 text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-stone-700 text-white' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{entry.name}</p>
                    <p className="text-xs text-white/40">{entry.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-stone-400">{entry.referrals}</p>
                    <p className="text-xs text-white/30">referrals</p>
                  </div>
                  {i < 3 && <Trophy className={`w-5 h-5 ${i === 0 ? 'text-stone-400' : i === 1 ? 'text-gray-300' : 'text-stone-700'}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-4">Daily Signups (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-40">
                {dailySignups.map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-white/60 font-medium">{count}</span>
                    <div className="w-full bg-gradient-to-t from-stone-600 to-stone-600 rounded-t-lg transition-all" style={{ height: `${Math.max(20, (count / Math.max(...dailySignups.map(d => d[1] as number))) * 120)}px` }} />
                    <span className="text-xs text-white/30">{(date as string).slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-4">Traffic Sources</h3>
                <div className="space-y-3">
                  {Object.entries(entries.reduce((acc, e) => { acc[e.source] = (acc[e.source] || 0) + 1; return acc; }, {} as Record<string, number>)).sort(([, a], [, b]) => b - a).map(([source, count]) => (
                    <div key={source} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${sourceColors[source] || 'bg-white/10 text-white/60'}`}>{source}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-500 rounded-full" style={{ width: `${(count / entries.length) * 100}%` }} />
                      </div>
                      <span className="text-sm text-white/60">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-4">Referral Distribution</h3>
                <div className="space-y-3">
                  {[
                    { label: '0 referrals', count: entries.filter(e => e.referrals === 0).length },
                    { label: '1-2 referrals', count: entries.filter(e => e.referrals >= 1 && e.referrals <= 2).length },
                    { label: '3-5 referrals', count: entries.filter(e => e.referrals >= 3 && e.referrals <= 5).length },
                    { label: '5+ referrals (VIP)', count: entries.filter(e => e.referrals > 5).length },
                  ].map((bucket) => (
                    <div key={bucket.label} className="flex items-center gap-3">
                      <span className="text-sm text-white/60 w-36">{bucket.label}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-500 rounded-full" style={{ width: `${(bucket.count / entries.length) * 100}%` }} />
                      </div>
                      <span className="text-sm text-white/60 w-8 text-right">{bucket.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Builder */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-stone-400" /> Customize Page</h3>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Headline</label>
                  <input type="text" defaultValue="Something amazing is coming." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Subheadline</label>
                  <input type="text" defaultValue="Be the first to experience the future of AI website building." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">CTA Button Text</label>
                  <input type="text" defaultValue="Join the Waitlist" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Brand Color</label>
                  <div className="flex gap-2">
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map((c) => (
                      <button onClick={() => {}} key={c} className="w-8 h-8 rounded-lg border-2 border-white/10 hover:border-white/40 transition" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Enable referral system</span>
                  <div className="w-12 h-6 rounded-full bg-stone-600 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-white translate-x-6 transition" />
                  </div>
                </div>
              </div>
              <button onClick={() => {}} className="w-full py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-medium text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate Waitlist Page
              </button>
            </div>
            <div className="p-1 rounded-2xl bg-gradient-to-r from-stone-500/20 to-stone-500/20">
              <div className="bg-[#0a1628] rounded-xl p-8 min-h-[500px] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-stone-600 to-stone-600 mx-auto mb-6 flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Something amazing is coming.</h2>
                  <p className="text-white/50 mb-6">Be the first to experience the future of AI website building.</p>
                  <div className="flex gap-2 max-w-sm mx-auto">
                    <input type="email" placeholder="your@email.com" className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none" />
                    <button onClick={() => {}} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 font-medium text-sm whitespace-nowrap">Join the Waitlist</button>
                  </div>
                  <p className="text-xs text-white/30 mt-4">53 people already on the list</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}